class Board {
    constructor(size) {
        this.size = size;
        const oldBoardNode = document.getElementById("board");
        oldBoardNode.parentElement.removeChild(oldBoardNode);
        this.boardNode = document.createElement("div");
        this.boardNode.id = "board";
        const boardContainer = document.getElementById("board-container");
        boardContainer.appendChild(this.boardNode);
        this.snakeHeadNode = new ImageCell("snake-head.png", ["rotate-east"]).getNode();
        this.collectibleNode = new ImageCell("apple.png").getNode();
        this.populateWithCells(Math.pow(size, 2) - 2); // subtract snake head and collectible
        this.boardNode.appendChild(this.snakeHeadNode);
        this.boardNode.appendChild(this.collectibleNode);
    }
    populateWithCells(cellCount) {
        this.boardNode.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < cellCount; i++) {
            fragment.appendChild(new PatternCell().getNode());
        }
        this.boardNode.appendChild(fragment);
    }
    render(snake, apple) {
        console.log('yo');
        // Render apple first so it doesn't override the snake when eaten
        // result[apple.row][apple.column] = "🍎";
        // snake.body.forEach((coord) => (result[coord[0]][coord[1]] = "🟩"));
    }
}
class Cell {
    constructor() {
        this.node = document.createElement("div");
        this.node.classList.add("cell-container");
    }
    getNode() {
        return this.node;
    }
}
class PatternCell extends Cell {
    constructor() {
        super();
        for (let i = 0; i < 9; i++) {
            const subPattern = document.createElement("div");
            this.node.appendChild(subPattern);
        }
    }
    getPattern(direction) {
        switch (direction) {
            case "ns":
                return [0, 1, 0, 0, 1, 0, 0, 1, 0];
            case "we":
                return [0, 0, 0, 1, 1, 1, 0, 0, 0];
            case "ne":
                return [0, 1, 0, 0, 1, 1, 0, 0, 0];
            case "nw":
                return [0, 1, 0, 1, 1, 0, 0, 0, 0];
            case "se":
                return [0, 0, 0, 0, 1, 1, 0, 1, 0];
            case "sw":
                return [0, 0, 0, 1, 1, 0, 0, 1, 0];
            default:
                throw new Error(`Unknown direction: ${direction}`);
        }
    }
    updatePattern(direction) {
        const children = this.node.children;
        this.getPattern(direction).forEach((subPattern, i) => {
            if (subPattern === 0) {
                children[i].classList.remove("active-pattern");
            }
            else {
                children[i].classList.add("active-pattern");
            }
        });
    }
}
class ImageCell extends Cell {
    constructor(src, classes = []) {
        super();
        const image = document.createElement("img");
        image.src = src;
        if (classes.length > 0) {
            image.classList.add(...classes);
        }
        this.node.appendChild(image);
    }
}
class Collectible {
    constructor(snake, board) {
        const limit = Math.pow(board.size, 2) * 10; // Avoid infinite loops
        let i = 0;
        // Prevent the collectible from appearing within the snake
        do {
            this.position = randBetween(0, Math.pow(board.size, 2) - 1);
            i++;
            if (i > limit) {
                throw new DOMException("Could not find a suitable place for the collectible");
            }
        } while (snake.body.indexOf(this.position) !== -1);
        this.type = "apple";
    }
}
class Snake {
    constructor(board) {
        this.body = [Math.floor(Math.pow(board.size, 2) / 2)];
        this.head = this.body[this.body.length - 1];
    }
    calcNewHead(board, direction) {
        // TODO: update values
        switch (direction) {
            case "ArrowUp":
                return this.head - board.size < 0
                    ? Math.pow(board.size, 2) - board.size + this.head
                    : this.head - board.size;
            case "ArrowDown":
                return this.head + board.size;
            case "ArrowLeft":
                return this.head - 1;
            case "ArrowRight":
                return this.head + 1;
        }
        return;
    }
    updateSnake(direction, isAppleEaten, board) {
        const newHead = this.calcNewHead(board, direction);
        this.body.push(newHead);
        if (!isAppleEaten)
            this.body.shift();
    }
    checkCollidedWithItself() {
        return this.body.indexOf(this.head) < this.body.length - 1;
    }
    checkCollidedWithBorder(direction, board) {
        const result = this.body[this.body.length - 1];
        switch (direction) {
            case "ArrowUp":
                return result[0] === 0;
            case "ArrowDown":
                return result[0] === board.size - 1;
            case "ArrowLeft":
                return this.head === 0;
            case "ArrowRight":
                return this.head === board.size - 1;
        }
        return false;
    }
    checkCollision(allowWarping, direction, board) {
        return (this.checkCollidedWithItself() ||
            (!allowWarping && this.checkCollidedWithBorder(direction, board)));
    }
}
class GameState {
    constructor() {
        this.board = new Board(21);
        this.snake = new Snake(this.board);
        this.collectible = new Collectible(this.snake, this.board);
        this.direction = "";
        this.isGameOver = false;
        this.isPaused = true;
        this.score = 0;
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
let gameState = new GameState();
let previousDirection = "";
function updateFrame(gameState) {
    if (gameState.isGameOver || gameState.isPaused) {
        clearInterval(gameLoop);
        return;
    }
    const isAppleEaten = gameState.snake.head === gameState.collectible.position;
    if (isAppleEaten) {
        gameState.collectible = new Collectible(gameState.snake, gameState.board);
        // gameState.updateScore("apple");
        const scoreNode = document.getElementById("score");
        scoreNode.textContent = gameState.score.toString();
    }
    // if (gameState.snake.checkCollision(false, gameState.direction, gameState.board)) {
    // 	gameState.isGameOver = true;
    // 	return;
    // }
    // if (
    // 	gameState.snake.body.length > 1 &&
    // 	((previousDirection === "ArrowUp" && gameState.direction === "ArrowDown") ||
    // 		(previousDirection === "ArrowDown" && gameState.direction === "ArrowUp") ||
    // 		(previousDirection === "ArrowLeft" && gameState.direction === "ArrowRight") ||
    // 		(previousDirection === "ArrowRight" && gameState.direction === "ArrowLeft"))
    // ) {
    // 	gameState.direction = previousDirection;
    // }
    gameState.snake.updateSnake(gameState.direction, isAppleEaten, gameState.board);
    gameState.board.render(gameState.snake, gameState.collectible);
}
const frameInterval = 120; // milliseconds
let gameLoop;
function startGameLoop() {
    gameLoop = setInterval(() => updateFrame(gameState), frameInterval);
}
document.addEventListener("keydown", function (event) {
    switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
            console.log(event.key);
            // previousDirection = gameState.direction;
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
            gameState = new GameState();
            gameState.board.render(gameState.snake, gameState.collectible);
            break;
    }
});
