const { v4: uuidv4 } = require('uuid');

// 간단한 인메모리 저장소
const rooms = {};

const gameRoomManager = {
  createRoom(gameId, options, hostPlayer) {
    const roomId = uuidv4();
    rooms[roomId] = {
      id: roomId,
      gameId,
      hostId: hostPlayer.id,
      players: [hostPlayer],
      gameState: {},
      status: 'waiting', // waiting, in-progress, finished
      options,
      createdAt: new Date(),
    };
    if (options.isTeamMode) {
        rooms[roomId].teams = { team1: [hostPlayer.id], team2: [] };
        hostPlayer.team = 'team1';
    }
    console.log(`[GameRoom] Room created: ${roomId} for game ${gameId}`);
    return rooms[roomId];
  },

  joinRoom(roomId, player) {
    const room = rooms[roomId];
    if (!room) {
      return { error: 'Room not found' };
    }
    if (room.status !== 'waiting') {
        return { error: 'Game has already started' };
    }
    if (room.players.find(p => p.id === player.id)) {
      return { room };
    }
    room.players.push(player);

    if (room.options.isTeamMode) {
        if (room.teams.team1.length <= room.teams.team2.length) {
            room.teams.team1.push(player.id);
            player.team = 'team1';
        } else {
            room.teams.team2.push(player.id);
            player.team = 'team2';
        }
    }

    console.log(`[GameRoom] Player ${player.name} joined room ${roomId}`);
    return { room };
  },

  leaveRoom(roomId, playerId) {
    const room = rooms[roomId];
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);
    console.log(`[GameRoom] Player ${playerId} left room ${roomId}`);

    if (room.players.length === 0) {
      delete rooms[roomId];
      console.log(`[GameRoom] Room ${roomId} deleted as it is empty.`);
    } else {
      // If the host leaves, assign a new host
      if (room.hostId === playerId) {
        room.hostId = room.players[0].id;
        console.log(`[GameRoom] New host for room ${roomId} is ${room.hostId}`);
      }
    }
    return room; // Return updated room state
  },

  getRoom(roomId) {
    return rooms[roomId];
  },

  updateGameState(roomId, newGameState) {
    const room = rooms[roomId];
    if (room) {
      room.gameState = newGameState;
    }
  },

  getAllRooms() {
    return Object.values(rooms);
  },
};

module.exports = gameRoomManager;
