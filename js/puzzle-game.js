class PuzzleGame {
  constructor() {
    this.timers = [];
    this.timerInterval = null;
    this.difficulty = 'easy';
    this.container = null;
    this.elapsedTime = 0;
    this.moves = 0;
    
    this.size = 3;
    this.grid = [];
    this.emptyPos = { r: 2, c: 2 };
    this.solvedGrid = [];
    
    this.emojiSets = {
      easy: ['🚀', '🌟', '⭐', '🌙', '🪐', '💫', '✨', '🌍'],
      medium: ['🚀', '🌟', '⭐', '🌙', '🪐', '💫', '✨', '🌍', '🌞', '🛸', '🌈', '☄️', '🔭', '🛰️', '🌌'],
      hard: ['🚀', '🌟', '⭐', '🌙', '🪐', '💫', '✨', '🌍', '🌞', '🛸', '🌈', '☄️', '🔭', '🛰️', '🌌']
    };
    
    this.isLocked = false;
  }

  init(container, difficulty) {
    this.container = container;
    this.difficulty = difficulty;
    this.size = this.difficulty === 'easy' ? 3 : 4;
    this.elapsedTime = 0;
    this.moves = 0;
    
    this.renderBaseUI();
    this.initGrid();
    this.shuffle();
    this.renderGrid();
    this.startTimer();
  }

  destroy() {
    this.clearTimers();
  }

  clearTimers() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.elapsedTime++;
      const mins = Math.floor(this.elapsedTime / 60);
      const secs = this.elapsedTime % 60;
      GameApp.updateTimer(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
  }

  renderBaseUI() {
    this.container.innerHTML = `
      <div class="game-counter">
        <div class="counter-item">
          <span>Langkah:</span>
          <span class="counter-value" id="puzzleMoves">0</span>
        </div>
      </div>
      <div class="puzzle-grid" id="puzzleGrid"></div>
      <button class="hint-btn" id="puzzleShuffle" style="margin-top: 30px;">🔀 Acak Ulang</button>
    `;
    
    document.getElementById('puzzleShuffle').addEventListener('click', () => {
      GameApp.playSound('click');
      this.moves = 0;
      document.getElementById('puzzleMoves').textContent = this.moves;
      this.shuffle();
      this.renderGrid();
    });
  }

  initGrid() {
    const emojis = this.emojiSets[this.difficulty];
    let k = 0;
    this.grid = [];
    this.solvedGrid = [];
    
    for (let r = 0; r < this.size; r++) {
      let row = [];
      let solvedRow = [];
      for (let c = 0; c < this.size; c++) {
        if (r === this.size - 1 && c === this.size - 1) {
          row.push(null);
          solvedRow.push(null);
        } else {
          row.push(emojis[k]);
          solvedRow.push(emojis[k]);
          k++;
        }
      }
      this.grid.push(row);
      this.solvedGrid.push(solvedRow);
    }
    this.emptyPos = { r: this.size - 1, c: this.size - 1 };
  }

  shuffle() {
    // Start from solved state to ensure solvability
    this.initGrid();
    
    let lastMove = null;
    const iterations = this.size === 3 ? 100 : 150;
    
    for (let i = 0; i < iterations; i++) {
      const neighbors = this.getNeighbors(this.emptyPos.r, this.emptyPos.c);
      // Filter out the reverse of the last move to prevent trivial back-and-forth
      const validMoves = neighbors.filter(n => {
        if (!lastMove) return true;
        return !(n.r === lastMove.r && n.c === lastMove.c);
      });
      
      const move = validMoves.length > 0 ? 
                   validMoves[Math.floor(Math.random() * validMoves.length)] : 
                   neighbors[Math.floor(Math.random() * neighbors.length)];
                   
      // Swap
      this.grid[this.emptyPos.r][this.emptyPos.c] = this.grid[move.r][move.c];
      this.grid[move.r][move.c] = null;
      
      lastMove = { ...this.emptyPos };
      this.emptyPos = move;
    }
    
    // Optional: Make sure empty is at bottom right for better UX initially
    while (this.emptyPos.r < this.size - 1) {
      this.grid[this.emptyPos.r][this.emptyPos.c] = this.grid[this.emptyPos.r + 1][this.emptyPos.c];
      this.grid[this.emptyPos.r + 1][this.emptyPos.c] = null;
      this.emptyPos.r++;
    }
    while (this.emptyPos.c < this.size - 1) {
      this.grid[this.emptyPos.r][this.emptyPos.c] = this.grid[this.emptyPos.r][this.emptyPos.c + 1];
      this.grid[this.emptyPos.r][this.emptyPos.c + 1] = null;
      this.emptyPos.c++;
    }
  }

  getNeighbors(r, c) {
    const neighbors = [];
    if (r > 0) neighbors.push({r: r - 1, c});
    if (r < this.size - 1) neighbors.push({r: r + 1, c});
    if (c > 0) neighbors.push({r, c: c - 1});
    if (c < this.size - 1) neighbors.push({r, c: c + 1});
    return neighbors;
  }

  renderGrid() {
    const container = document.getElementById('puzzleGrid');
    if (!container) return;
    
    container.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
    container.innerHTML = '';
    
    const neighbors = this.getNeighbors(this.emptyPos.r, this.emptyPos.c);
    
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const tile = document.createElement('div');
        const val = this.grid[r][c];
        
        if (val === null) {
          tile.className = 'puzzle-tile empty';
        } else {
          tile.className = 'puzzle-tile';
          
          // Find target number (1 to N-1)
          let targetNum = 0;
          let counter = 1;
          for (let sr = 0; sr < this.size; sr++) {
            for (let sc = 0; sc < this.size; sc++) {
              if (this.solvedGrid[sr][sc] === val) {
                targetNum = counter;
              }
              counter++;
            }
          }
          
          tile.innerHTML = `<span class="puzzle-num">${targetNum}</span>${val}`;
          
          // Check if movable
          const isMovable = neighbors.some(n => n.r === r && n.c === c);
          if (isMovable) {
            tile.classList.add('movable');
            tile.onclick = () => this.moveTile(r, c);
          }
        }
        
        container.appendChild(tile);
      }
    }
  }

  moveTile(r, c) {
    if (this.isLocked) return;
    
    GameApp.playSound('click');
    
    // Swap
    this.grid[this.emptyPos.r][this.emptyPos.c] = this.grid[r][c];
    this.grid[r][c] = null;
    this.emptyPos = {r, c};
    
    this.moves++;
    document.getElementById('puzzleMoves').textContent = this.moves;
    
    this.renderGrid();
    
    if (this.checkWin()) {
      this.handleWin();
    }
  }

  checkWin() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] !== this.solvedGrid[r][c]) {
          return false;
        }
      }
    }
    return true;
  }

  handleWin() {
    this.isLocked = true;
    this.clearTimers();
    
    GameApp.playSound('complete');
    
    const tiles = document.querySelectorAll('.puzzle-tile:not(.empty)');
    tiles.forEach((t, i) => {
      t.style.animation = `correctPulse 0.5s ease ${i * 0.05}s`;
      t.classList.remove('movable');
    });
    
    const gridEl = document.getElementById('puzzleGrid');
    const rect = gridEl.getBoundingClientRect();
    
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        GameApp.createConfetti(
          rect.left + Math.random() * rect.width,
          rect.top + Math.random() * rect.height
        );
      }, i * 100);
    }
    
    this.timers.push(setTimeout(() => this.finishGame(), 2000));
  }

  finishGame() {
    let score = 10; // maxScore
    if (this.size === 3) {
      if (this.moves > 25 && this.moves <= 40) score = 6;
      else if (this.moves > 40) score = 3;
    } else {
      if (this.moves > 50 && this.moves <= 80) score = 6;
      else if (this.moves > 80) score = 3;
    }
    
    GameApp.endGame(score, 10);
  }
}
window.PuzzleGame = PuzzleGame;
