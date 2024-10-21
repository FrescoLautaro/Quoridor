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

            boardElement.appendChild(cell);
        }
    }
}

// Manejar los movimientos del peón
document.addEventListener('keydown', (event) => {
    const currentPlayer = gameState.currentPlayer;
    if (currentPlayer === playerRole) {
        let direction = '';
        switch (event.key) {
            case 'ArrowUp':
                direction = playerRole === 'player1' ? 'up' : 'down'; // Jugador 1 mueve hacia arriba, Jugador 2 hacia abajo
                break;
            case 'ArrowDown':
                direction = playerRole === 'player1' ? 'down' : 'up'; // Inverso para el jugador 2
                break;
            case 'ArrowLeft':
                direction = playerRole === 'player1' ? 'left' : 'right'; // Espejado para el jugador 2
                break;
            case 'ArrowRight':
                direction = playerRole === 'player1' ? 'right' : 'left'; // Espejado para el jugador 2
                break;
        }

        if (direction) {
            socket.emit('move', { direction });
        }
    }
});
