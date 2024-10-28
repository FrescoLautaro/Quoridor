const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let gameState = {
    currentPlayer: 'player1',
    positions: {
        player1: { row: 8, col: 4 },
        player2: { row: 0, col: 4 },
    },
    walls: [],
    remainingWalls: {
        player1: 10,
        player2: 10
    }
};

let playerCount = 0;
let rematchRequests = 0;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
    playerCount++;
    console.log('Un jugador se ha conectado');

    let playerRole = playerCount === 1 ? 'player1' : 'player2';

    if (playerCount > 2) {
        socket.emit('message', 'El juego ya está completo.');
        socket.disconnect();
        return;
    }

    socket.emit('role', { role: playerRole });
    socket.emit('update', gameState);

    socket.on('move', ({ direction }) => {
        if (gameState.currentPlayer !== playerRole) return;

        const playerPos = gameState.positions[playerRole];
        let newRow = playerPos.row;
        let newCol = playerPos.col;

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

        if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
            if (!gameState.walls.some(wall => (wall.row === newRow && wall.col === newCol) || (wall.row === newRow && wall.col + 1 === newCol))) {
                gameState.positions[playerRole] = { row: newRow, col: newCol };
                gameState.currentPlayer = playerRole === 'player1' ? 'player2' : 'player1';
                io.emit('update', gameState);
            }
        }
    });

    socket.on('placeWall', ({ row, col }) => {
        if (gameState.remainingWalls[playerRole] > 0) {
            gameState.walls.push({ row, col });
            gameState.remainingWalls[playerRole]--;
            gameState.currentPlayer = playerRole === 'player1' ? 'player2' : 'player1';
            io.emit('update', gameState);
        }
    });

    socket.on('requestRematch', () => {
        rematchRequests++;
        if (rematchRequests >= 2) {
            rematchRequests = 0;
            resetGame();
            io.emit('rematchAccepted', gameState);
        }
    });

    socket.on('disconnect', () => {
        console.log('Un jugador se ha desconectado');
        playerCount--;
    });
});

function resetGame() {
    gameState = {
        currentPlayer: 'player1',
        positions: {
            player1: { row: 8, col: 4 },
            player2: { row: 0, col: 4 },
        },
        walls: [],
        remainingWalls: {
            player1: 10,
            player2: 10
        }
    };
}

server.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});
