const socket = io();
const boardElement = document.getElementById('board');
let playerRole;
let gameState = {};

// Escuchar el rol del jugador
socket.on('role', ({ role }) => {
    playerRole = role;
    console.log('Eres:', playerRole);
});

// Escuchar actualizaciones del estado del juego
socket.on('update', (state) => {
    gameState = state;
    renderBoard();
});

function renderBoard() {
    boardElement.innerHTML = ''; // Limpiar el tablero

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            // Ajustar la perspectiva del jugador
            let adjustedRow = row;
            let adjustedCol = col;

            if (playerRole === 'player2') {
                // Espejar la posición para el jugador 2 (azul)
                adjustedRow = 8 - row; // Invertir filas
                adjustedCol = 8 - col; // Invertir columnas
            }

            // Agregar peones con distinción de colores
            if (gameState.positions.player1.row === adjustedRow && gameState.positions.player1.col === adjustedCol) {
                cell.classList.add('red'); // Peón rojo
            } else if (gameState.positions.player2.row === adjustedRow && gameState.positions.player2.col === adjustedCol) {
                cell.classList.add('blue'); // Peón azul
            }

            // Manejar clicks para mover el peón
            cell.addEventListener('click', () => handleMoveClick(adjustedRow, adjustedCol));

            boardElement.appendChild(cell);
        }
    }
}

function handleMoveClick(clickedRow, clickedCol) {
    const currentPlayer = gameState.currentPlayer;
    const playerPos = gameState.positions[playerRole];

    // Verificar si es el turno del jugador y si el clic es a una casilla adyacente
    if (currentPlayer === playerRole && isAdjacent(playerPos.row, playerPos.col, clickedRow, clickedCol)) {
        socket.emit('move', { direction: getMoveDirection(playerPos.row, playerPos.col, clickedRow, clickedCol) });
    }
}

// Función para verificar si la casilla clickeada es adyacente
function isAdjacent(row, col, clickedRow, clickedCol) {
    const rowDiff = Math.abs(row - clickedRow);
    const colDiff = Math.abs(col - clickedCol);
    return (rowDiff + colDiff === 1); // Adyacente es si la suma de diferencias es 1 (sin diagonales)
}

// Función para obtener la dirección del movimiento basado en la celda clickeada
function getMoveDirection(currentRow, currentCol, clickedRow, clickedCol) {
    if (clickedRow < currentRow) return 'up';
    if (clickedRow > currentRow) return 'down';
    if (clickedCol < currentCol) return 'left';
    if (clickedCol > currentCol) return 'right';
    return '';
}
