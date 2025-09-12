const generalMessages = require('./general').generalMessages;
const generalJokes = require('./general_jokes').generalJokes;
const blackjack = require('./game_hints/blackjack').gameHints;
const g2048 = require('./game_hints/g2048').gameHints;
const highlow = require('./game_hints/highlow').gameHints;
const memory = require('./game_hints/memory').gameHints;
const slider = require('./game_hints/slider').gameHints;
const slot = require('./game_hints/slot').gameHints;
const sudoku = require('./game_hints/sudoku').gameHints;
const wordle = require('./game_hints/wordle').gameHints;

module.exports = {
    general: generalMessages,
    jokes: generalJokes,
    game_hints: {
        blackjack,
        g2048,
        highlow,
        memory,
        slider,
        slot,
        sudoku,
        wordle,
    }
};
