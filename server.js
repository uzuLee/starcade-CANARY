const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { createAdapter } = require('@socket.io/redis-adapter');

// Import config
const config = require('./src/config');

// Import redisManager
const { initRedis, pubClient, subClient } = require('./src/redisClient');
const { redisManager } = require('./src/redisManager');
const userRepository = require('./src/repositories/userRepository');
const scoreRepository = require('./src/repositories/scoreRepository');
const socketRepository = require('./src/repositories/socketRepository');

const { loadEmailTemplatesConfig } = require('./src/emailTemplateSelector');

// Import route and socket handlers
const authRoutes = require('./src/authRoutes');
const userRoutes = require('./src/userRoutes');
const friendRoutes = require('./src/friendRoutes');
const scoreRoutes = require('./src/scoreRoutes');
const accountRoutes = require('./src/accountRoutes');
const gameRoutes = require('./src/gameRoutes');
const messageRoutes = require('./src/messageRoutes');
const achievementRoutes = require('./src/achievementRoutes');
const cosmeticsRoutes = require('./src/cosmeticsRoutes');
const socketHandlers = require('./src/socketHandlers');

const app = express();
app.use(cors({
    origin: config.frontendUrl,
    credentials: true
}));
app.use(cookieParser());
app.use((req, res, next) => {
    console.log('Server.js: req.cookies =', req.cookies);
    next();
});
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: config.frontendUrl,
        methods: ["GET", "POST"],
        credentials: true
    }
});

async function startServer() {
    try {
        // Connect to Redis first
        await initRedis();
        console.log('Redis connected successfully.');
        console.log('JWT Secret:', config.jwtSecret);

        // Load initial data from db.json into Redis
        await redisManager.loadInitialDataFromDb();

        // Register route handlers
        authRoutes(app, { userRepository, redisManager }, config.jwtSecret, config);
        userRoutes(app, io, { userRepository, socketRepository, redisManager }, config.jwtSecret);
        friendRoutes(app, io, { userRepository, socketRepository, redisManager }, config.jwtSecret);
        scoreRoutes(app, { userRepository, scoreRepository, redisManager }, config.jwtSecret);
        achievementRoutes(app);
        cosmeticsRoutes(app, redisManager, config.jwtSecret);
        accountRoutes(app, { userRepository, redisManager }, config.jwtSecret);
        gameRoutes(app);
        messageRoutes(app); // Register message routes

        // Register socket handlers
        socketHandlers(io, { pubClient, subClient }, { userRepository, socketRepository });

        const PORT = config.port;
        server.listen(PORT, () => {
            console.log(`Backend server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();