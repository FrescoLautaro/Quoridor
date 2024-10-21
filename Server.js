const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let gameState = {
    currentPlayer: 'player1', // Comienza el jugador 1
    positions: {
        player1: { row: 8, col: 4 }, // Peón rojo abajo
        player2: { row: 0, col: 4 }, // Peón azul arriba
    },
};

let playerCount = 0;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
    playerCount++;
    console.log('Un jugador se ha conectado');

    // Asignar rol al jugador según el orden de conexión
    let playerRole = playerCount === 1 ? 'player1' : 'player2';

    if (playerCount > 2) {
        // Evitar más de 2 jugadores
        socket.emit('message', 'El juego ya está completo.');
        socket.disconnect();
        return;
    }

    // Enviar el rol del jugador y el estado del juego actual
    socket.emit('role', { role: playerRole });
    socket.emit('update', gameState);

    // Manejar movimiento del peón
    socket.on('move', ({ direction }) => {
        // Solo permitir el movimiento si es el turno del jugador actual
        if (gameState.currentPlayer !== playerRole) {
            return; // No es el turno de este jugador
        }

        const playerPos = gameState.positions[playerRole];
        let newRow = playerPos.row;
        let newCol = playerPos.col;

        // Calcular la nueva posición en función de la dirección
        switch (direction) {
            case 'up':
                newRow -= 1;
                break;
            case 'down':
                newRow += 1;
                break;
            case 'left':
                newCol -= 1;
                break;
            case 'right':
                newCol += 1;
                break;
        }

        // Validar que el movimiento esté dentro de los límites del tablero
        if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
            gameState.positions[playerRole] = { row: newRow, col: newCol };

            // Cambiar el turno al otro jugador
            gameState.currentPlayer = playerRole === 'player1' ? 'player2' : 'player1';

            // Actualizar a ambos jugadores
            io.emit('update', gameState);
        }
    });

    socket.on('disconnect', () => {
        console.log('Un jugador se ha desconectado');
        playerCount--;
    });
});

server.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});
