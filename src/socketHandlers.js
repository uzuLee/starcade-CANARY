const { createAdapter } = require('@socket.io/redis-adapter');
const { client } = require('./redisClient');

const disconnectTimers = new Map();

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
            user.connectionStatus = 'connected'; // Explicitly ensure status is correct

            const displayStatus = await socketRepository.getDisplayStatus(userId, user.onlineStatus);
            console.log(`[Socket] User ${userId} display status is now: ${displayStatus}`);
            
            io.to(userId).emit('statusUpdated', { 
                status: displayStatus, 
                connectionStatus: 'connected',
                user: user
            });
            broadcastStatus(userId);
        });

        socket.on('disconnect', async () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
            const userId = await socketRepository.removeSocketId(socket.id);
            if (userId) {
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