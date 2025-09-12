const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

const arena2048Logic = {
  // Initialize the game state for the first player (host)
  initialize(hostPlayer, options) {
    const boardSize = options.boardSize || 4;
    const gameState = {
      players: {},
      options,
      log: [`${hostPlayer.name}이(가) 방을 생성했습니다.`],
    };

    const board = Array(boardSize * boardSize).fill(null);
    this.spawnTile(board, boardSize);
    this.spawnTile(board, boardSize);

    gameState.players[hostPlayer.id] = {
      id: hostPlayer.id,
      name: hostPlayer.name,
      avatar: hostPlayer.avatar,
      board,
      score: 0,
      gauge: 0,
      maxGauge: options.maxGauge || 3,
      isGameOver: false,
    };

    return gameState;
  },

  // Add a new player to an existing game state
  addPlayer(gameState, newPlayer) {
    if (gameState.players[newPlayer.id]) return gameState; // Already in game

    const boardSize = gameState.options.boardSize || 4;
    const board = Array(boardSize * boardSize).fill(null);
    this.spawnTile(board, boardSize);
    this.spawnTile(board, boardSize);

    gameState.players[newPlayer.id] = {
      id: newPlayer.id,
      name: newPlayer.name,
      avatar: newPlayer.avatar,
      board,
      score: 0,
      gauge: 0,
      maxGauge: gameState.options.maxGauge || 3,
      isGameOver: false,
    };
    gameState.log.push(`${newPlayer.name}이(가) 게임에 참가했습니다.`);
    return gameState;
  },

  // Spawn a new tile on a specific player's board
  spawnTile(board, boardSize) {
    const emptyCells = [];
    board.forEach((tile, index) => {
      if (tile === null) emptyCells.push(index);
    });

    if (emptyCells.length === 0) return false;

    const value = Math.random() < 0.9 ? 2 : 4;
    const index = sample(emptyCells);
    board[index] = {
      id: `tile-${Date.now()}-${Math.random()}`, // Simple unique ID
      value,
      isNew: true,
    };
    return true;
  },

  // Core move logic for a single board
  handleMove(gameState, playerId, direction) {
    const playerState = gameState.players[playerId];
    if (!playerState || playerState.isGameOver) return gameState;

    // Decrement lock timers before moving
    playerState.board.forEach(tile => {
        if (tile && tile.lockedTurns > 0) {
            tile.lockedTurns--;
            if (tile.lockedTurns === 0) {
                // Decide what to do when unlocked. For now, remove it.
                // A better approach might be to turn it into a normal, low-value block.
                playerState.board[playerState.board.indexOf(tile)] = null;
            }
        }
    });

    const boardSize = gameState.options.boardSize || 4;
    let board = playerState.board.map(t => t ? { ...t, isNew: false, isMerged: false } : null);
    const originalBoard = JSON.stringify(board);
    let scoreGained = 0;
    let combo = 0;

    const lines = [];
    // Extract lines based on direction
    for (let i = 0; i < boardSize; i++) {
      const line = [];
      for (let j = 0; j < boardSize; j++) {
        if (direction === 'left') line.push(board[i * boardSize + j]);
        if (direction === 'right') line.push(board[i * boardSize + (boardSize - 1 - j)]);
        if (direction === 'up') line.push(board[j * boardSize + i]);
        if (direction === 'down') line.push(board[(boardSize - 1 - j) * boardSize + i]);
      }
      lines.push(line);
    }

    // Process each line (slide, merge)
    lines.forEach(line => {
      // Filter out locked tiles before processing
      const filtered = line.filter(tile => tile !== null && tile.lockedTurns <= 0);
      const newLine = [];
      for (let i = 0; i < filtered.length; i++) {
        if (i + 1 < filtered.length && filtered[i].value === filtered[i+1].value) {
          const newValue = filtered[i].value * 2;
          newLine.push({ ...filtered[i+1], value: newValue, isMerged: true });
          scoreGained += newValue;
          combo++;
          i++; // Skip next tile
        } else {
          newLine.push(filtered[i]);
        }
      }
      // Re-add locked tiles to their original positions in the line (this is complex, simplifying for now)
      // For this simplified version, we just pad with nulls.
      // A proper implementation would need to track original indices.
      while (newLine.length < boardSize) {
        newLine.push(null);
      }
      line.splice(0, boardSize, ...newLine);
    });

    // Reconstruct the board (this part needs to be smarter about locked tiles)
    // Simplified version: just update the board. A better way is needed.
    const newBoard = Array(boardSize * boardSize).fill(null);
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const tile = lines[i][j];
        if (direction === 'left') newBoard[i * boardSize + j] = tile;
        if (direction === 'right') newBoard[i * boardSize + (boardSize - 1 - j)] = tile;
        if (direction === 'up') newBoard[j * boardSize + i] = tile;
        if (direction === 'down') newBoard[(boardSize - 1 - j) * boardSize + i] = tile;
      }
    }
    
    // Re-insert locked tiles into the new board at their original positions
    board.forEach((originalTile, index) => {
        if (originalTile && originalTile.lockedTurns > 0) {
            if (newBoard[index] === null) {
                newBoard[index] = originalTile;
            } else {
                // If the space is occupied, find a nearby empty spot. This is a fallback.
                const emptySpot = newBoard.indexOf(null);
                if (emptySpot !== -1) newBoard[emptySpot] = originalTile;
            }
        }
    });

    board = newBoard;
    const moved = JSON.stringify(board) !== originalBoard;

    if (moved) {
      this.spawnTile(board, boardSize);
      playerState.board = board;
      playerState.score += scoreGained;
      // Gauge logic: base increase + combo bonus
      const gaugeIncrease = (scoreGained / 20) + (combo > 1 ? combo * 5 : 0);
      playerState.gauge = Math.min(playerState.maxGauge, playerState.gauge + gaugeIncrease);
    }

    // Check for game over
    if (!this.canMove(board, boardSize)) {
        playerState.isGameOver = true;
        gameState.log.push(`${playerState.name} is game over!`);
    }
    
    return gameState;
  },

  canMove(board, boardSize) {
    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) return true; // Empty cell exists
        const r = Math.floor(i / boardSize);
        const c = i % boardSize;
        // Check right
        if (c < boardSize - 1 && board[i].value === board[i + 1]?.value) return true;
        // Check down
        if (r < boardSize - 1 && board[i].value === board[i + boardSize]?.value) return true;
    }
    return false;
  },

  handleAttack(gameState, attackerId, targetId, attackType) {
    const attacker = gameState.players[attackerId];
    if (!attacker) return gameState;

    let actualTargetId = targetId;
    if (targetId === 'random') {
        let opponents = [];
        if (gameState.options.isTeamMode) {
            const attackerTeam = gameState.players[attackerId].team;
            opponents = Object.values(gameState.players).filter(p => p.team !== attackerTeam && !p.isGameOver);
        } else {
            opponents = Object.values(gameState.players).filter(p => p.id !== attackerId && !p.isGameOver);
        }

        if (opponents.length === 0) {
            gameState.log.push(`${attacker.name}이(가) 공격했지만, 공격할 상대가 없습니다.`);
            return gameState; // No one to attack
        }
        actualTargetId = sample(opponents).id;
    }

    const target = gameState.players[actualTargetId];
    if (!target) return gameState;

    // Determine attack type based on gauge if not specified
    let actualAttackType = attackType;
    if (attackType === 'auto') {
        actualAttackType = attacker.gauge >= attacker.maxGauge ? 'special' : 'normal';
    }

    const boardSize = gameState.options.boardSize || 4;
    const emptyCells = [];
    target.board.forEach((tile, index) => {
      if (tile === null) emptyCells.push(index);
    });

    if (emptyCells.length === 0) {
        gameState.log.push(`${attacker.name}이(가) 공격했지만, ${target.name}의 보드가 꽉 차있습니다!`);
        return gameState; // No space to attack
    }

    const attackIndex = sample(emptyCells);

    if (actualAttackType === 'special' && attacker.gauge >= attacker.maxGauge) {
        attacker.gauge = 0;
        target.board[attackIndex] = {
            id: `tile-${Date.now()}-${Math.random()}`,
            value: 'LOCK',
            isAttack: true,
            lockedTurns: 2, // Lock for 2 of the target's turns
        };
        gameState.log.push(`${attacker.name}이(가) ${target.name}에게 특수 공격을 사용했습니다!`);
    } else if (actualAttackType === 'normal' && attacker.gauge >= 1) {
        attacker.gauge -= 1;
        // Find a value that cannot be merged easily
        const existingValues = new Set(target.board.filter(t => t).map(t => t.value));
        let attackValue = 3; // Prime number, hard to create
        while(existingValues.has(attackValue)) {
            attackValue += 2; // next odd number
        }

        target.board[attackIndex] = {
            id: `tile-${Date.now()}-${Math.random()}`,
            value: attackValue,
            isAttack: true,
        };
        gameState.log.push(`${attacker.name}이(가) ${target.name}에게 일반 공격을 사용했습니다.`);
    }

    return gameState;
  },
};

module.exports = arena2048Logic;