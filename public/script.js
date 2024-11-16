const socket = io();
const boardElement = document.getElementById('board');
const wallSelection = document.getElementById('wall-selection');
const messageElement = document.createElement('div');
let rematchButton;

let playerRole;
let gameState = {};
let gameOver = false;
let wallMode = false;
let wallOrientation = 'horizontal';
const turnIndicator = document.getElementById('turn-indicator');


messageElement.classList.add('message');
document.body.appendChild(messageElement);

// Asignar el rol al jugador
socket.on('role', ({ role }) => {
    playerRole = role;
    console.log('Eres:', playerRole);
    renderBoard();
});

// Actualizar el estado del juego
socket.on('update', (state) => {
    gameState = state;
    wallMode = false; // Desactiva el modo de muro al recibir una actualización
    checkVictory();
    renderBoard();
    renderWalls();
});


// Manejar la aceptación de revancha
socket.on('rematchAccepted', (state) => {
    gameState = state;
    gameOver = false;
    messageElement.classList.remove('visible');
    renderBoard();
    renderWalls();
});

// Función para renderizar el tablero
function renderBoard() {
    if (gameOver) return;

    // Actualizar el texto y color del indicador de turno
    if (gameState.currentPlayer === playerRole) {
        turnIndicator.innerText = 'Tu turno';
        turnIndicator.style.color = '#00ff00'; // Verde
    } else {
        turnIndicator.innerText = 'Turno del oponente';
        turnIndicator.style.color = '#ff0000'; // Rojo
    }

    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = 'repeat(11, 60px)';
    boardElement.style.gridTemplateRows = 'repeat(11, 60px)';

    for (let row = 0; row < 11; row++) {
        for (let col = 0; col < 11; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            let adjustedRow = row;
            let adjustedCol = col;

            // Invertir el tablero para el segundo jugador
            if (playerRole === 'player2') {
                adjustedRow = 10 - row;
                adjustedCol = 10 - col;
            }

            // Dibujar al jugador
            if (gameState.positions.player1.row === adjustedRow && gameState.positions.player1.col === adjustedCol) {
                cell.classList.add('red');
            } else if (gameState.positions.player2.row === adjustedRow && gameState.positions.player2.col === adjustedCol) {
                cell.classList.add('blue');
            }

            // Dibujar el muro si existe
            const isWall = gameState.walls.some(wall =>
                wall.row === adjustedRow && wall.col === adjustedCol
            );
            if (isWall) {
                cell.classList.add('wall');
            }

            // Manejar clics en celdas
            cell.addEventListener('click', () => {
                if (wallMode) {
                    placeWall(adjustedRow, adjustedCol);
                } else {
                    handleMoveClick(adjustedRow, adjustedCol);
                }
            });

            boardElement.appendChild(cell);
        }
    }
}


// Función para renderizar botones de muros
function renderWalls() {
    wallSelection.innerHTML = '';
    const remainingWalls = gameState.remainingWalls[playerRole];

    const horizontalBtn = document.createElement('button');
    horizontalBtn.classList.add('wall-btn');
    horizontalBtn.innerText = 'H';
    horizontalBtn.addEventListener('click', () => {
        wallMode = true;
        wallOrientation = 'horizontal';
    });
    wallSelection.appendChild(horizontalBtn);

    const verticalBtn = document.createElement('button');
    verticalBtn.classList.add('wall-btn');
    verticalBtn.innerText = 'V';
    verticalBtn.addEventListener('click', () => {
        wallMode = true;
        wallOrientation = 'vertical';
    });
    wallSelection.appendChild(verticalBtn);
}

// Colocar muro
function placeWall(row, col) {
    if (gameState.currentPlayer !== playerRole || gameState.remainingWalls[playerRole] <= 0) return;

    socket.emit('placeWall', { row, col, orientation: wallOrientation });
    wallMode = false;
}

// Manejar clic de movimiento
function handleMoveClick(clickedRow, clickedCol) {
    if (gameOver) return;

    const currentPlayer = gameState.currentPlayer;
    const playerPos = gameState.positions[playerRole];

    if (currentPlayer === playerRole && isAdjacent(playerPos.row, playerPos.col, clickedRow, clickedCol)) {
        socket.emit('move', { direction: getMoveDirection(playerPos.row, playerPos.col, clickedRow, clickedCol) });
    }
}

// Verificar si la celda es adyacente
function isAdjacent(row, col, clickedRow, clickedCol) {
    const rowDiff = Math.abs(row - clickedRow);
    const colDiff = Math.abs(col - clickedCol);
    return (rowDiff + colDiff === 1);
}

// Obtener la dirección del movimiento
function getMoveDirection(currentRow, currentCol, clickedRow, clickedCol) {
    if (clickedRow < currentRow) return 'up';
    if (clickedRow > currentRow) return 'down';
    if (clickedCol < currentCol) return 'left';
    if (clickedCol > currentCol) return 'right';
    return '';
}

// Comprobar si hay un ganador
function checkVictory() {
    const player1Win = gameState.positions.player1.row === 0;
    const player2Win = gameState.positions.player2.row === 10;

    if (player1Win || player2Win) {
        gameOver = true;
        const winner = player1Win ? 'player1' : 'player2';
        const isWinner = (playerRole === winner);
        showEndMessage(isWinner ? '¡Has ganado!' : 'Has perdido');
    }
}

// Mostrar mensaje de fin de juego
function showEndMessage(message) {
    messageElement.innerHTML = `${message}<br>`;
    rematchButton = document.createElement('button');
    rematchButton.innerText = 'Revancha';
    rematchButton.classList.add('rematch-btn');
    rematchButton.onclick = () => socket.emit('requestRematch');
    messageElement.appendChild(rematchButton);

    messageElement.classList.add('visible');
}
