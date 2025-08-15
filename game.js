class Minesweeper {
    constructor() {
        this.board = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.timerInterval = null;
        this.startTime = null;
        this.flaggedCount = 0;
        this.hintsRemaining = 3;
        this.hintMode = false;
        
        this.difficulties = {
            baby: { rows: 2, cols: 2, mines: 1 },
            tiny: { rows: 3, cols: 3, mines: 2 },
            small: { rows: 4, cols: 4, mines: 4 },
            easy: { rows: 5, cols: 5, mines: 6 },
            medium: { rows: 6, cols: 6, mines: 9 },
            challenging: { rows: 7, cols: 7, mines: 13 },
            hard: { rows: 8, cols: 8, mines: 18 },
            expert: { rows: 9, cols: 9, mines: 23 },
            master: { rows: 10, cols: 10, mines: 30 }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.newGame();
    }

    bindEvents() {
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('reset').addEventListener('click', () => this.reset());
        document.getElementById('difficulty').addEventListener('change', () => this.newGame());
        document.getElementById('hint-button').addEventListener('click', () => this.useHint());
        document.getElementById('play-again').addEventListener('click', () => this.newGame());
    }

    useHint() {
        if (this.hintsRemaining <= 0 || this.gameOver || this.flagCount >= this.mines || this.firstClick) {
            return;
        }

        const safeMove = this.findSafeMove();
        if (safeMove) {
            const [row, col] = safeMove;
            const cellEl = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            
            // Visual hint: highlight for 2 seconds
            cellEl.classList.add('hint-highlight');
            setTimeout(() => {
                cellEl.classList.remove('hint-highlight');
            }, 2000);
            
            this.hintsRemaining--;
            this.updateHintDisplay();
        }
    }

    findSafeMove() {
        // Find a safe cell that's not revealed or flagged
        const safeOptions = [];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.board[row][col];
                
                if (!cell.isRevealed && !cell.isFlagged && !cell.isMine) {
                    // Check if we can deduce this is safe based on revealed numbers
                    let isSafe = this.isDeductivelySafe(row, col);
                    if (isSafe) {
                        safeOptions.push([row, col]);
                    }
                }
            }
        }

        // If no deductive safe spots, pick random unrevealed safe cell
        if (safeOptions.length === 0) {
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    const cell = this.board[row][col];
                    if (!cell.isRevealed && !cell.isFlagged && !cell.isMine) {
                        safeOptions.push([row, col]);
                    }
                }
            }
        }

        return safeOptions.length > 0 ? safeOptions[Math.floor(Math.random() * safeOptions.length)] : null;
    }

    isDeductivelySafe(row, col) {
        // Check adjacent revealed cells to see if this cell can be logically proven safe
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const adjRow = row + dr;
                const adjCol = col + dc;
                
                if (adjRow >= 0 && adjRow < this.rows && adjCol >= 0 && adjCol < this.cols) {
                    const adjCell = this.board[adjRow][adjCol];
                    
                    if (adjCell.isRevealed && !adjCell.isMine && adjCell.adjacentMines > 0) {
                        const flagsAround = this.countFlagsAround(adjRow, adjCol);
                        if (flagsAround === adjCell.adjacentMines) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    countFlagsAround(row, col) {
        let flags = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                    if (this.board[newRow][newCol].isFlagged) {
                        flags++;
                    }
                }
            }
        }
        return flags;
    }

    updateHintDisplay() {
        document.getElementById('hint-count').textContent = this.hintsRemaining;
        const hintBtn = document.getElementById('hint-button');
        if (this.hintsRemaining <= 0) {
            hintBtn.style.opacity = '0.5';
            hintBtn.style.cursor = 'not-allowed';
        } else {
            hintBtn.style.opacity = '1';
            hintBtn.style.cursor = 'pointer';
        }
    }

    newGame() {
        // Hide modal if it's open
        document.getElementById('game-over-modal').classList.add('hidden');
        
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.flaggedCount = 0;
        this.hintsRemaining = 3; // Reset hints on new game
        this.stopTimer();
        
        const difficulty = document.getElementById('difficulty').value;
        const config = this.difficulties[difficulty];
        
        this.rows = config.rows;
        this.cols = config.cols;
        this.mines = config.mines;
        
        this.createBoard();
        this.renderBoard();
        this.updateStats();
        this.updateHintDisplay(); // Update hint button state
    }

    reset() {
        // Reset hints when resetting current board
        this.hintsRemaining = 3;
        this.updateHintDisplay();
        this.newGame();
    }

    createBoard() {
        this.board = Array(this.rows).fill(null).map(() => 
            Array(this.cols).fill(null).map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0
            }))
        );
    }

    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            if (!this.board[row][col].isMine && !(row === excludeRow && col === excludeCol)) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
        
        this.calculateAdjacentMines();
    }

    calculateAdjacentMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const newRow = row + dr;
                            const newCol = col + dc;
                            
                            if (newRow >= 0 && newRow < this.rows && 
                                newCol >= 0 && newCol < this.cols &&
                                this.board[newRow][newCol].isMine) {
                                count++;
                            }
                        }
                    }
                    this.board[row][col].adjacentMines = count;
                }
            }
        }
    }

    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, var(--cell-size))`;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', (e) => this.handleLeftClick(e));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e));
                
                gameBoard.appendChild(cell);
            }
        }
    }

    handleLeftClick(e) {
        if (this.gameOver) return;
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const cell = this.board[row][col];
        
        if (cell.isFlagged || cell.isRevealed) return;
        
        if (this.firstClick) {
            this.placeMines(row, col);
            this.firstClick = false;
            this.startTimer();
        }
        
        this.revealCell(row, col);
        this.updateDisplay();
        
        if (this.checkWin()) {
            this.endGame(true);
        }
    }

    handleRightClick(e) {
        e.preventDefault();
        if (this.gameOver) return;
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const cell = this.board[row][col];
        
        if (cell.isRevealed) return;
        
        cell.isFlagged = !cell.isFlagged;
        this.flaggedCount += cell.isFlagged ? 1 : -1;
        this.updateDisplay();
        this.updateStats();
    }

    revealCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
        
        const cell = this.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;
        
        cell.isRevealed = true;
        
        if (cell.isMine) {
            this.endGame(false);
            return;
        }
        
        if (cell.adjacentMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    this.revealCell(row + dr, col + dc);
                }
            }
        }
    }

    updateDisplay() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach(cellEl => {
            const row = parseInt(cellEl.dataset.row);
            const col = parseInt(cellEl.dataset.col);
            const cell = this.board[row][col];
            
            cellEl.className = 'cell';
            cellEl.textContent = '';
            
            if (cell.isFlagged) {
                cellEl.classList.add('flagged');
                cellEl.textContent = '🚩';
            } else if (cell.isRevealed) {
                cellEl.classList.add('revealed');
                
                if (cell.isMine) {
                    cellEl.classList.add('mine');
                    cellEl.textContent = '💣';
                } else if (cell.adjacentMines > 0) {
                    cellEl.textContent = cell.adjacentMines;
                    cellEl.dataset.adjacent = cell.adjacentMines;
                }
            }
        });
        
        const highlightedCells = document.querySelectorAll('.hint-highlight');
        highlightedCells.forEach(cell => cell.classList.remove('hint-highlight'));
    }

    checkWin() {
        // Classic mode win condition
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.board[row][col];
                if (!cell.isMine && !cell.isRevealed) {
                    return false;
                }
            }
        }
        return true;
    }

    endGame(won) {
        this.gameOver = true;
        this.gameWon = won;
        this.stopTimer();
        
        // Restore hints after game ends
        this.hintsRemaining = 3;
        this.updateHintDisplay();
        
        // Reveal all mines
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col].isMine) {
                    this.board[row][col].isRevealed = true;
                }
            }
        }
        
        this.updateDisplay();
        
        const modal = document.getElementById('game-over-modal');
        const result = document.getElementById('game-result');
        const message = document.getElementById('game-message');
        
        result.textContent = won ? 'Victory!' : 'Game Over';
        message.textContent = won ? 'Congratulations! You cleared all mines!' : 'You hit a mine!';
        modal.classList.remove('hidden');
    }

    updateStats() {
        document.getElementById('mine-count').textContent = this.mines;
        document.getElementById('flag-count').textContent = this.flaggedCount;
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('timer').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}

// Initialize game
new Minesweeper();