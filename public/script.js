const socket = io();
const boardElement = document.getElementById('board');
const wallSelection = document.getElementById('wall-selection');
const messageElement = document.createElement('div');
let rematchButton;

let playerRole;
let gameState = {};
let gameOver = false;
let wallMode = false;

messageElement.classList.add('message');
document.body.appendChild(messageElement);

socket.on('role', ({ role }) => {
    playerRole = role;
    console.log('Eres:', playerRole);
});

socket.on('update', (state) => {
    gameState = state;
    checkVictory();
    renderBoard();
    renderWalls();
});

socket.on('rematchAccepted', (state) => {
    gameState = state;
    gameOver = false;
    messageElement.classList.remove('visible');
    renderBoard();
    renderWalls();
});

function renderBoard() {
    if (gameOver) return;

    boardElement.innerHTML = '';

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            let adjustedRow = row;
            let adjustedCol = col;

            if (playerRole === 'player2') {
                adjustedRow = 8 - row;
                adjustedCol = 8 - col;
            }

            if (gameState.positions.player1.row === adjustedRow && gameState.positions.player1.col === adjustedCol) {
                cell.classList.add('red');
            } else if (gameState.positions.player2.row === adjustedRow && gameState.positions.player2.col === adjustedCol) {
                cell.classList.add('blue');
            }

            const isWall = gameState.walls.some(wall =>
                (wall.row === adjustedRow && wall.col === adjustedCol) ||
                (wall.row === adjustedRow && wall.col + 1 === adjustedCol)
            );

            if (isWall) {
                cell.classList.add('wall');
            }

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

function renderWalls() {
    wallSelection.innerHTML = '';
    const remainingWalls = gameState.remainingWalls[playerRole];

    for (let i = 0; i < remainingWalls; i++) {
        const wallBtn = document.createElement('button');
        wallBtn.classList.add('wall-btn');
        wallBtn.innerText = 'P';
        wallBtn.addEventListener('click', () => {
            if (gameState.currentPlayer === playerRole) {
                wallMode = true;
            } else {
                alert('Es el turno del otro jugador.');
            }
        });
        wallSelection.appendChild(wallBtn);
    }
}

function placeWall(row, col) {
    if (gameState.currentPlayer !== playerRole) return;
    if (gameState.remainingWalls[playerRole] > 0) {
        socket.emit('placeWall', { row, col });
        wallMode = false;
    } else {
        alert('Ya no tienes paredes disponibles.');
    }
}

function handleMoveClick(clickedRow, clickedCol) {
    if (gameOver) return;

    const currentPlayer = gameState.currentPlayer;
    const playerPos = gameState.positions[playerRole];

    if (currentPlayer === playerRole && isAdjacent(playerPos.row, playerPos.col, clickedRow, clickedCol)) {
        socket.emit('move', { direction: getMoveDirection(playerPos.row, playerPos.col, clickedRow, clickedCol) });
    }
}

function isAdjacent(row, col, clickedRow, clickedCol) {
    const rowDiff = Math.abs(row - clickedRow);
    const colDiff = Math.abs(col - clickedCol);
    return (rowDiff + colDiff === 1);
}

function getMoveDirection(currentRow, currentCol, clickedRow, clickedCol) {
    if (clickedRow < currentRow) return 'up';
    if (clickedRow > currentRow) return 'down';
    if (clickedCol < currentCol) return 'left';
    if (clickedCol > currentCol) return 'right';
    return '';
}

function checkVictory() {
    const player1Win = gameState.positions.player1.row === 0;
    const player2Win = gameState.positions.player2.row === 8;

    if (player1Win || player2Win) {
        gameOver = true;
        const winner = player1Win ? 'player1' : 'player2';
        const isWinner = (playerRole === winner);
        showEndMessage(isWinner ? '¡Has ganado!' : 'Has perdido');
    }
}

function showEndMessage(message) {
    messageElement.innerHTML = message;
    rematchButton = document.createElement('button');
    rematchButton.innerText = 'Revancha';
    rematchButton.classList.add('rematch-btn');
    rematchButton.onclick = () => socket.emit('requestRematch');
    messageElement.appendChild(rematchButton);

    messageElement.style.opacity = 1;
    messageElement.classList.add('visible');
}
