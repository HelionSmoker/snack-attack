class Apple {
    constructor(row, column) {
        this.row = row;
        this.column = column;
    }
    getPosition() {
        return { row: this.row, column: this.column };
    }
    moveToRandomPosition(snake, board) {
        const limit = board.width * board.height * 10; // So it doesn't go on forever
        let i = 0;
        // Prevent the apple from appearing within the snake
        do {
            this.row = randBetween(0, board.width - 1);
            this.column = randBetween(0, board.height - 1);
            i++;
            if (i > limit) {
                throw new DOMException("Could not find a suitable place for the apple");
            }
        } while (getIndexOfSubarray([this.row, this.column], snake) >= 0);
    }
}
class Board {
    constructor(width, height, id) {
        this.width = width;
        this.height = height;
        this.content = Array(height).fill(Array(width).fill("⬛"));
        this.containerNode = document.getElementById(id);
    }
    render(snake, apple) {
        let result = Array.from({ length: this.height }, () => Array(this.width).fill("⬛"));
        // Render apple first so it doesn't override the snake when eaten
        result[apple.row][apple.column] = "🍎";
        snake.forEach((coord) => (result[coord[0]][coord[1]] = "🟩"));
        if (this.containerNode !== null) {
            this.containerNode.textContent = result.map((row) => row.join("")).join("\n");
        }
    }
}
function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function arraysEqual(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((val, index) => val === arr2[index]);
}
function getIndexOfSubarray(subArray, array) {
    return array.findIndex((arr) => arraysEqual(arr, subArray));
}
function calcNewHead(snake, board, direction) {
    let result = [...snake[snake.length - 1]]; // Create deep copy
    switch (direction) {
        case "ArrowUp":
            result[0] = (result[0] - 1 + board.height) % board.height;
            break;
        case "ArrowDown":
            result[0] = (result[0] + 1) % board.height;
            break;
        case "ArrowLeft":
            result[1] = (result[1] - 1 + board.width) % board.width;
            break;
        case "ArrowRight":
            result[1] = (result[1] + 1) % board.width;
            break;
        default:
            return;
    }
    return result;
}
function updateSnake(snake, direction, isAppleEaten, board) {
    const newHead = calcNewHead(snake, board, direction);
    snake.push(newHead);
    if (!isAppleEaten)
        snake.shift();
}
function checkCollidedWithItself(snake) {
    const matchIndex = getIndexOfSubarray(snake[snake.length - 1], snake);
    return matchIndex < snake.length - 1;
}
function checkCollidedWithBorder(snake, direction, board) {
    const result = snake[snake.length - 1];
    switch (direction) {
        case "ArrowUp":
            return result[0] === 0;
        case "ArrowDown":
            return result[0] === board.height - 1;
        case "ArrowLeft":
            return result[1] === 0;
        case "ArrowRight":
            return result[1] === board.width - 1;
    }
    return false;
}
function checkCollision(snake, allowWarping, direction, board) {
    return (checkCollidedWithItself(snake) ||
        (!allowWarping && checkCollidedWithBorder(snake, direction, board)));
}
function newGame() {
    let board = new Board(21, 21, "board");
    let snake = [[Math.floor(board.width / 2), Math.floor(board.height / 2)]];
    let apple = new Apple(-1, -1);
    apple.moveToRandomPosition(snake, board);
    return {
        board: board,
        snake: snake,
        apple: apple,
        direction: "",
        isGameOver: false,
        isPaused: true,
        score: 0,
    };
}
let gameState = newGame();
let previousDirection = "";
function updateFrame(gameState) {
    if (gameState.isGameOver || gameState.isPaused) {
        clearInterval(gameLoop);
        return;
    }
    const isAppleEaten = arraysEqual(gameState.snake[gameState.snake.length - 1], [
        gameState.apple.row,
        gameState.apple.column,
    ]);
    if (isAppleEaten) {
        gameState.apple.moveToRandomPosition(gameState.snake, gameState.board) === 1;
        gameState.score++;
        const scoreNode = document.getElementById("score");
        scoreNode.textContent = gameState.score;
    }
    if (checkCollision(gameState.snake, false, gameState.direction, gameState.board)) {
        gameState.isGameOver = true;
        return;
    }
    if (gameState.snake.length > 1 &&
        ((previousDirection === "ArrowUp" && gameState.direction === "ArrowDown") ||
            (previousDirection === "ArrowDown" && gameState.direction === "ArrowUp") ||
            (previousDirection === "ArrowLeft" && gameState.direction === "ArrowRight") ||
            (previousDirection === "ArrowRight" && gameState.direction === "ArrowLeft"))) {
        gameState.direction = previousDirection;
    }
    updateSnake(gameState.snake, gameState.direction, isAppleEaten, gameState.board);
    gameState.board.render(gameState.snake, gameState.apple);
}
const frameInterval = 120; // milliseconds
let gameLoop;
gameState.board.render(gameState.snake, gameState.apple);
function startGameLoop() {
    gameLoop = setInterval(() => updateFrame(gameState), frameInterval);
}
document.addEventListener("keydown", function (event) {
    switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
            previousDirection = gameState.direction;
            gameState.direction = event.key;
            if (gameState.isPaused) {
                startGameLoop();
                gameState.isPaused = false;
            }
            break;
        case "Escape":
            gameState.isPaused = true;
            break;
        case "Enter":
            gameState = newGame();
            gameState.board.render(gameState.snake, gameState.apple);
            break;
    }
});
