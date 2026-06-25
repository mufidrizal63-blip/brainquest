class MazeGame {
  constructor() {
    this.timers = [];
    this.timerInterval = null;
    this.difficulty = 'easy';
    this.container = null;
    this.elapsedTime = 0;
    this.score = 0; // number of keys collected
    
    this.playerPos = { r: 1, c: 1 };
    this.keysNeeded = 1;
    this.keysCollected = 0;
    this.isLocked = false;
    
    // 0: Path, 1: Wall, 2: Door, 3: Key, 4: Goal, 5: Player start
    this.maps = {
      easy: [
        [1,1,1,1,1,1,1],
        [1,5,0,0,1,4,1],
        [1,1,1,0,1,2,1],
        [1,3,0,0,1,0,1],
        [1,0,1,1,1,0,1],
        [1,0,0,0,0,0,1],
        [1,1,1,1,1,1,1]
      ],
      medium: [
        [1,1,1,1,1,1,1,1,1],
        [1,5,0,1,3,1,4,0,1],
        [1,1,0,1,0,1,2,1,1],
        [1,0,0,0,0,1,0,0,1],
        [1,0,1,1,1,1,1,0,1],
        [1,0,1,3,0,0,2,0,1],
        [1,0,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1]
      ],
      hard: [
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,5,0,0,1,0,0,0,1,4,1],
        [1,1,1,0,1,0,1,0,1,2,1],
        [1,3,0,0,1,3,1,0,1,0,1],
        [1,0,1,1,1,0,1,1,1,0,1],
        [1,0,0,0,2,0,0,0,2,0,1],
        [1,1,1,0,1,1,1,1,1,1,1],
        [1,3,1,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1]
      ]
    };
    
    this.map = [];
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  init(container, difficulty) {
    this.container = container;
    this.difficulty = difficulty;
    this.elapsedTime = 0;
    this.keysCollected = 0;
    
    // Clone map
    this.map = JSON.parse(JSON.stringify(this.maps[this.difficulty]));
    
    // Count keys
    this.keysNeeded = 0;
    for(let r=0; r<this.map.length; r++) {
      for(let c=0; c<this.map[r].length; c++) {
        if(this.map[r][c] === 3) this.keysNeeded++;
        if(this.map[r][c] === 5) {
          this.playerPos = {r, c};
          this.map[r][c] = 0; // clear start pos
        }
      }
    }
    
    this.renderBaseUI();
    this.renderGrid();
    this.startTimer();
    
    window.addEventListener('keydown', this.handleKeyDown);
  }

  destroy() {
    this.clearTimers();
    window.removeEventListener('keydown', this.handleKeyDown);
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
          <span>Kunci:</span>
          <span class="counter-value" id="mazeKeys">0/${this.keysNeeded}</span>
        </div>
      </div>
      
      <div class="maze-container">
        <div class="maze-grid" id="mazeGrid"></div>
        
        <div class="d-pad">
          <button class="d-btn d-up" id="btnUp">🔼</button>
          <button class="d-btn d-left" id="btnLeft">◀️</button>
          <button class="d-btn d-right" id="btnRight">▶️</button>
          <button class="d-btn d-down" id="btnDown">🔽</button>
        </div>
      </div>
      
      <div class="maze-question-modal" id="mazeModal">
        <h3 style="margin-bottom: 15px; color: var(--accent-gold);">Tebak Kunci!</h3>
        <p id="mazeQuestionText" style="font-size: 1.5rem; margin-bottom: 20px;"></p>
        <div class="options-grid" id="mazeOptionsGrid" style="grid-template-columns: 1fr 1fr;"></div>
      </div>
    `;
    
    document.getElementById('btnUp').onclick = () => this.movePlayer(-1, 0);
    document.getElementById('btnDown').onclick = () => this.movePlayer(1, 0);
    document.getElementById('btnLeft').onclick = () => this.movePlayer(0, -1);
    document.getElementById('btnRight').onclick = () => this.movePlayer(0, 1);
  }

  renderGrid() {
    const gridEl = document.getElementById('mazeGrid');
    if(!gridEl) return;
    
    const rows = this.map.length;
    const cols = this.map[0].length;
    
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridEl.innerHTML = '';
    
    for(let r=0; r<rows; r++) {
      for(let c=0; c<cols; c++) {
        const cell = document.createElement('div');
        const val = this.map[r][c];
        
        let isPlayer = (r === this.playerPos.r && c === this.playerPos.c);
        
        if (isPlayer) {
          cell.className = 'maze-cell maze-path';
          cell.innerHTML = '<div class="maze-player">👨‍🚀</div>';
        } else if (val === 1) {
          cell.className = 'maze-cell maze-wall';
        } else if (val === 0) {
          cell.className = 'maze-cell maze-path';
        } else if (val === 2) {
          cell.className = 'maze-cell maze-door';
          cell.textContent = '🚪';
        } else if (val === 3) {
          cell.className = 'maze-cell maze-path';
          cell.innerHTML = '<div class="maze-key">🔑</div>';
        } else if (val === 4) {
          cell.className = 'maze-cell maze-path';
          cell.innerHTML = '<div class="maze-goal">🚀</div>';
        }
        
        gridEl.appendChild(cell);
      }
    }
  }

  handleKeyDown(e) {
    if (this.isLocked) return;
    switch(e.key) {
      case 'ArrowUp': this.movePlayer(-1, 0); break;
      case 'ArrowDown': this.movePlayer(1, 0); break;
      case 'ArrowLeft': this.movePlayer(0, -1); break;
      case 'ArrowRight': this.movePlayer(0, 1); break;
    }
  }

  movePlayer(dr, dc) {
    if (this.isLocked) return;
    
    const nr = this.playerPos.r + dr;
    const nc = this.playerPos.c + dc;
    
    // Bounds check
    if(nr < 0 || nr >= this.map.length || nc < 0 || nc >= this.map[0].length) return;
    
    const targetCell = this.map[nr][nc];
    
    if (targetCell === 1) {
      // Wall
      GameApp.playSound('wrong');
      return;
    } else if (targetCell === 2) {
      // Door (locked)
      GameApp.playSound('wrong');
      return;
    }
    
    // Move
    this.playerPos.r = nr;
    this.playerPos.c = nc;
    GameApp.playSound('click');
    
    if (targetCell === 3) {
      // Hit Key
      this.triggerQuestion(nr, nc);
    } else if (targetCell === 4) {
      // Goal
      this.handleWin();
    } else {
      this.renderGrid();
    }
  }

  triggerQuestion(r, c) {
    this.isLocked = true;
    this.renderGrid(); // show player on key
    
    const modal = document.getElementById('mazeModal');
    const qText = document.getElementById('mazeQuestionText');
    const optionsGrid = document.getElementById('mazeOptionsGrid');
    
    // Generate simple math question
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;
    
    qText.textContent = `${num1} + ${num2} = ?`;
    
    let options = [answer, answer+1, answer-1, answer+2];
    options.sort(() => Math.random() - 0.5);
    
    optionsGrid.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.style.minHeight = '40px';
      btn.textContent = opt;
      btn.onclick = () => this.handleAnswer(btn, opt === answer, r, c);
      optionsGrid.appendChild(btn);
    });
    
    modal.classList.add('show');
  }

  handleAnswer(btn, isCorrect, r, c) {
    const modal = document.getElementById('mazeModal');
    
    if (isCorrect) {
      btn.classList.add('correct');
      GameApp.playSound('correct');
      
      this.timers.push(setTimeout(() => {
        modal.classList.remove('show');
        
        // Remove key
        this.map[r][c] = 0;
        this.keysCollected++;
        document.getElementById('mazeKeys').textContent = `${this.keysCollected}/${this.keysNeeded}`;
        
        // Open one door (find first door and remove it)
        for(let ir=0; ir<this.map.length; ir++){
          for(let ic=0; ic<this.map[ir].length; ic++){
            if(this.map[ir][ic] === 2) {
              this.map[ir][ic] = 0;
              // Just open one door per key
              ir = this.map.length; 
              break;
            }
          }
        }
        
        GameApp.updateScore(`${this.keysCollected}/${this.keysNeeded}`);
        this.isLocked = false;
        this.renderGrid();
      }, 1000));
      
    } else {
      btn.classList.add('wrong');
      GameApp.playSound('wrong');
      
      // Move player back to start if wrong? Or just let them try again?
      // Let's just hide modal and move player back one step (simple penalty)
      this.timers.push(setTimeout(() => {
        modal.classList.remove('show');
        this.isLocked = false;
      }, 1000));
    }
  }

  handleWin() {
    this.isLocked = true;
    this.clearTimers();
    this.renderGrid();
    
    GameApp.playSound('complete');
    
    const rect = document.getElementById('mazeGrid').getBoundingClientRect();
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        GameApp.createConfetti(
          rect.left + Math.random() * rect.width,
          rect.top + Math.random() * rect.height
        );
      }, i * 100);
    }
    
    // Score based on time (max 10)
    let score = 10;
    if (this.elapsedTime > 30) score = 8;
    if (this.elapsedTime > 60) score = 5;
    
    this.timers.push(setTimeout(() => {
      GameApp.endGame(score, 10);
    }, 2000));
  }
}
window.MazeGame = MazeGame;
