const { createAdapter } = require('@socket.io/redis-adapter');
const { client } = require('./redisClient');
const gameRoomManager = require('./gameRoomManager');
const arena2048Logic = require('./games/logic/arena2048');

const disconnectTimers = new Map();

// Map game IDs to their corresponding logic modules
const gameLogics = {
  arena2048: arena2048Logic,
};

module.exports = (io, { pubClient, subClient }, { userRepository, socketRepository }) => {

    io.adapter(createAdapter(pubClient, subClient));

    io.on('connection', (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);

        const broadcastStatus = async (userId) => {
            const user = await userRepository.getUser(userId);
            if (user && user.friends) {
                const payload = {
                    userId,
                    onlineStatus: user.onlineStatus,
                    connectionStatus: await socketRepository.getConnectionStatus(userId),
                };
                console.log(`[Socket] Broadcasting status for ${userId}:`, payload);
                for (const friend of user.friends) {
                    io.to(friend.id).emit('friendStatusChange', payload);
                }
            }
        };

        socket.on('setUserId', async (userId) => {
            console.log(`[Socket] setUserId received for user: ${userId}, socket: ${socket.id}`);
            
            if (disconnectTimers.has(userId)) {
                clearTimeout(disconnectTimers.get(userId));
                disconnectTimers.delete(userId);
                console.log(`[Socket] Cleared disconnect timer for user ${userId}.`);
            }

            socket.userId = userId;
            socket.join(userId);
            await socketRepository.addSocketIdForUser(userId, socket.id);
            
            await userRepository.setConnectionStatus(userId, 'connected');
            
            const user = await userRepository.getUser(userId);
            if (user) {
                const displayStatus = await socketRepository.getDisplayStatus(userId, user.onlineStatus);
                console.log(`[Socket] User ${userId} display status is now: ${displayStatus}`);
                
                io.to(userId).emit('statusUpdated', { 
                    status: displayStatus, 
                    connectionStatus: user.connectionStatus,
                    user: user
                });
                broadcastStatus(userId);
            }
        });

        // Multiplayer Game Room Logic
        socket.on('getRooms', () => {
            io.emit('roomsList', gameRoomManager.getAllRooms());
        });

        socket.on('startGame', (roomId) => {
            const room = gameRoomManager.getRoom(roomId);
            if (room && room.hostId === socket.userId && room.status === 'waiting') {
                room.status = 'in-progress';
                const gameLogic = gameLogics[room.gameId];
                if (gameLogic) {
                    room.gameState = gameLogic.initialize(room.players, room.options);
                    io.to(roomId).emit('gameStart', room.gameState);
                    io.emit('roomsList', gameRoomManager.getAllRooms());
                }
            }
        });

        socket.on('gameAction', ({ roomId, action }) => {
            const user = await userRepository.getUser(socket.userId);
            if (!user) return;

            const gameLogic = gameLogics[gameId];
            if (!gameLogic) return;

            const room = gameRoomManager.createRoom(gameId, options, user);
            // Initialize game state with the host player
            room.gameState = gameLogic.initialize(user, options);
            
            socket.join(room.id);
            io.emit('roomsList', gameRoomManager.getAllRooms()); // Notify everyone of the new room
            socket.emit('roomJoined', room); // Send room details to creator
        });

        socket.on('joinRoom', async (roomId) => {
            const user = await userRepository.getUser(socket.userId);
            if (!user) return;

            const { room, error } = gameRoomManager.joinRoom(roomId, user);
            if (error) {
                socket.emit('roomError', { message: error });
                return;
            }

            const gameLogic = gameLogics[room.gameId];
            if (gameLogic && !room.gameState.players[user.id]) {
                room.gameState = gameLogic.addPlayer(room.gameState, user);
            }

            socket.join(roomId);
            // Send the latest state to the new player
            socket.emit('roomJoined', room);
            // Notify existing players of the new arrival
            socket.to(roomId).emit('playerJoined', user);
            // Broadcast the updated game state to all
            io.to(roomId).emit('gameUpdate', room.gameState);
            
            io.emit('roomsList', gameRoomManager.getAllRooms());
        });

        socket.on('leaveRoom', (roomId) => {
            const room = gameRoomManager.getRoom(roomId);
            if (room) {
                gameRoomManager.leaveRoom(roomId, socket.userId);
                socket.leave(roomId);
                io.to(roomId).emit('playerLeft', socket.userId);
                io.emit('roomsList', gameRoomManager.getAllRooms());
            }
        });

        socket.on('gameAction', ({ roomId, action }) => {
            const room = gameRoomManager.getRoom(roomId);
            if (!room) return;

            const gameLogic = gameLogics[room.gameId];
            if (!gameLogic) return;

            let newGameState;
            if (action.type === 'move') {
                newGameState = gameLogic.handleMove(room.gameState, socket.userId, action.payload);
            } else if (action.type === 'attack') {
                newGameState = gameLogic.handleAttack(room.gameState, socket.userId, action.payload.targetId, action.payload.attackType);
            }

            if (newGameState) {
                gameRoomManager.updateGameState(roomId, newGameState);
                io.to(roomId).emit('gameUpdate', newGameState);

                // Check for victory condition
                const room = gameRoomManager.getRoom(roomId);
                if (room.options.isTeamMode) {
                    const activeTeams = new Set();
                    Object.values(newGameState.players).forEach(p => {
                        if (!p.isGameOver) {
                            activeTeams.add(p.team);
                        }
                    });
                    if (activeTeams.size <= 1 && Object.values(newGameState.players).length > 1) {
                        const winningTeam = activeTeams.size === 1 ? activeTeams.values().next().value : null;
                        io.to(roomId).emit('gameEnd', { winner: winningTeam, finalState: newGameState, isTeamWin: true });
                    }
                } else {
                    const activePlayers = Object.values(newGameState.players).filter(p => !p.isGameOver);
                    if (activePlayers.length <= 1 && Object.values(newGameState.players).length > 1) {
                        const winner = activePlayers.length === 1 ? activePlayers[0] : null;
                        io.to(roomId).emit('gameEnd', { winner, finalState: newGameState, isTeamWin: false });
                    }
                }
            }
        });

        socket.on('disconnect', async () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
            const userId = await socketRepository.removeSocketId(socket.id);
            if (userId) {
                // Handle room departure on disconnect
                const rooms = gameRoomManager.getAllRooms();
                for (const room of rooms) {
                    if (room.players.some(p => p.id === userId)) {
                        gameRoomManager.leaveRoom(room.id, userId);
                        io.to(room.id).emit('playerLeft', userId);
                        io.emit('roomsList', gameRoomManager.getAllRooms());
                    }
                }

                const timer = setTimeout(async () => {
                    const socketCount = await client.sCard(`user:sockets:${userId}`);
                    console.log(`[Socket] User ${userId} has ${socketCount} sockets remaining after delay.`);
                    if (socketCount === 0) {
                        console.log(`[Socket] User ${userId} has no more sockets. Setting connectionStatus to disconnected.`);
                        await userRepository.setConnectionStatus(userId, 'disconnected');
                        broadcastStatus(userId);
                    }
                    disconnectTimers.delete(userId);
                }, 3000); // 3-second delay
                disconnectTimers.set(userId, timer);
            }
        });

        socket.on('updateOnlineStatus', async ({ userId, status }) => {
            if (userId) {
                console.log(`[Socket] updateOnlineStatus for ${userId} to ${status}`);
                await userRepository.setOnlineStatus(userId, status);
                const user = await userRepository.getUser(userId);
                const displayStatus = await socketRepository.getDisplayStatus(userId, user.onlineStatus);
                
                io.to(userId).emit('statusUpdated', { status: displayStatus, connectionStatus: 'connected' });
                broadcastStatus(userId);
            }
        });
    });
};