class CodingGame {
  constructor() {
    this.timers = [];
    this.timerInterval = null;
    this.difficulty = 'easy';
    this.container = null;
    this.elapsedTime = 0;
    
    this.currentRound = 1;
    this.maxRounds = 3;
    this.phase = 1; // 1: Coding, 2: AI Training
    
    // Coding Phase State
    this.gridSize = 5;
    this.robotPos = { r: 0, c: 0 };
    this.robotDir = 0; // 0: Right, 1: Down, 2: Left, 3: Up
    this.batteryPos = { r: 4, c: 4 };
    this.obstacles = [];
    this.codeQueue = [];
    this.isExecuting = false;
    
    // AI Phase State
    this.aiTargetsNeeded = 5;
    this.aiTargetsFound = 0;
    this.aiCategories = {
      'Kendaraan': { targets: ['🚗','🚕','🚙','🚌','🚓','🚑','🚒','🚜'], distractors: ['🍎','🐶','⚽','🌲'] },
      'Hewan': { targets: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼'], distractors: ['🚗','🍎','⚽','🎸'] },
      'Buah': { targets: ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓'], distractors: ['🐶','🚗','⚽','🌲'] }
    };
    this.currentAiCategory = '';
    this.aiInterval = null;
  }

  init(container, difficulty) {
    this.container = container;
    this.difficulty = difficulty;
    this.currentRound = 1;
    this.score = 0;
    this.elapsedTime = 0;
    
    if (this.difficulty === 'easy') this.gridSize = 4;
    else if (this.difficulty === 'medium') this.gridSize = 5;
    else this.gridSize = 6;
    
    this.renderBaseUI();
    this.startRound();
    this.startTimer();
  }

  destroy() {
    this.clearTimers();
  }

  clearTimers() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.aiInterval) clearInterval(this.aiInterval);
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
      <div class="progress-bar">
        <div class="progress-fill" id="codingProgress" style="width: 0%"></div>
      </div>
      <div class="phase-indicator" id="phaseIndicator">Memuat...</div>
      
      <div class="coding-container" id="codingWorkspace">
        <!-- Renders Coding or AI Phase -->
      </div>
    `;
  }

  startRound() {
    if (this.currentRound > this.maxRounds) {
      this.endGame();
      return;
    }
    
    const progressFill = document.getElementById('codingProgress');
    if (progressFill) {
      progressFill.style.width = `${((this.currentRound - 1) / this.maxRounds) * 100}%`;
    }
    
    GameApp.updateScore(`Ronde ${this.currentRound}/${this.maxRounds}`);
    this.startCodingPhase();
  }

  // ==========================================
  // PHASE 1: CODING
  // ==========================================
  startCodingPhase() {
    this.phase = 1;
    document.getElementById('phaseIndicator').textContent = 'Fase 1: Koding Robot 🤖';
    
    this.robotPos = { r: 0, c: 0 };
    this.robotDir = 0;
    this.batteryPos = { r: this.gridSize - 1, c: this.gridSize - 1 };
    this.codeQueue = [];
    this.isExecuting = false;
    
    // Add obstacles based on difficulty
    this.obstacles = [];
    let numObs = this.difficulty === 'easy' ? 0 : this.difficulty === 'medium' ? 2 : 4;
    for (let i = 0; i < numObs; i++) {
      let or, oc;
      do {
        or = Math.floor(Math.random() * this.gridSize);
        oc = Math.floor(Math.random() * this.gridSize);
      } while ((or === 0 && oc === 0) || (or === this.batteryPos.r && oc === this.batteryPos.c));
      this.obstacles.push({r: or, c: oc});
    }
    
    this.renderCodingUI();
  }

  renderCodingUI() {
    const ws = document.getElementById('codingWorkspace');
    ws.innerHTML = `
      <div class="coding-board">
        <div class="maze-grid" id="codingGrid" style="grid-template-columns: repeat(${this.gridSize}, 1fr);">
          <!-- Grid cells generated via JS -->
        </div>
        
        <div class="code-queue" id="codeQueue"></div>
        
        <div class="code-controls">
          <button class="code-btn" id="btnAtas">⬆️ Atas</button>
          <button class="code-btn" id="btnBawah">⬇️ Bawah</button>
          <button class="code-btn" id="btnKiri">⬅️ Kiri</button>
          <button class="code-btn" id="btnKanan">➡️ Kanan</button>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button class="code-clear-btn" id="btnClear">🗑️ Hapus</button>
          <button class="code-action-btn" id="btnRun">▶️ Jalankan Program</button>
        </div>
      </div>
    `;
    
    this.renderCodingGrid();
    
    document.getElementById('btnAtas').onclick = () => this.addCode('Atas', '⬆️');
    document.getElementById('btnBawah').onclick = () => this.addCode('Bawah', '⬇️');
    document.getElementById('btnKiri').onclick = () => this.addCode('Kiri', '⬅️');
    document.getElementById('btnKanan').onclick = () => this.addCode('Kanan', '➡️');
    document.getElementById('btnClear').onclick = () => this.clearCode();
    document.getElementById('btnRun').onclick = () => this.executeCode();
  }

  renderCodingGrid() {
    const grid = document.getElementById('codingGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = document.createElement('div');
        cell.className = 'maze-cell maze-path';
        
        if (r === this.robotPos.r && c === this.robotPos.c) {
          const rotation = this.robotDir * 90;
          cell.innerHTML = `<div class="maze-player" style="font-size: 1.5rem;"><div style="transform: rotate(${rotation}deg); transition: transform 0.3s;">🤖</div></div>`;
        } else if (r === this.batteryPos.r && c === this.batteryPos.c) {
          cell.innerHTML = `<div class="maze-goal" style="font-size: 1.5rem;">🔋</div>`;
        } else if (this.obstacles.some(o => o.r === r && o.c === c)) {
          cell.className = 'maze-cell maze-wall';
          cell.innerHTML = '🧱';
        }
        
        grid.appendChild(cell);
      }
    }
  }

  addCode(action, emoji) {
    if (this.isExecuting || this.codeQueue.length >= 15) return;
    GameApp.playSound('click');
    this.codeQueue.push({action, emoji});
    this.renderCodeQueue();
  }

  clearCode() {
    if (this.isExecuting) return;
    GameApp.playSound('click');
    this.codeQueue = [];
    this.renderCodeQueue();
  }

  renderCodeQueue() {
    const q = document.getElementById('codeQueue');
    if (!q) return;
    q.innerHTML = '';
    this.codeQueue.forEach(cmd => {
      const block = document.createElement('div');
      block.className = 'code-block';
      block.textContent = cmd.emoji;
      q.appendChild(block);
    });
  }

  executeCode() {
    if (this.isExecuting || this.codeQueue.length === 0) return;
    this.isExecuting = true;
    document.getElementById('btnRun').disabled = true;
    
    // Reset robot to start
    this.robotPos = { r: 0, c: 0 };
    this.robotDir = 0;
    this.renderCodingGrid();
    
    let step = 0;
    
    const executeStep = () => {
      if (step >= this.codeQueue.length) {
        this.checkCodingResult();
        return;
      }
      
      const cmd = this.codeQueue[step];
      let nr = this.robotPos.r;
      let nc = this.robotPos.c;
      
      if (cmd.action === 'Atas') {
        nr--;
        this.robotDir = 3;
      } else if (cmd.action === 'Bawah') {
        nr++;
        this.robotDir = 1;
      } else if (cmd.action === 'Kiri') {
        nc--;
        this.robotDir = 2;
      } else if (cmd.action === 'Kanan') {
        nc++;
        this.robotDir = 0;
      }
      
      // Check bounds and walls
      if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize && !this.obstacles.some(o => o.r === nr && o.c === nc)) {
        this.robotPos = { r: nr, c: nc };
        GameApp.playSound('click');
      } else {
        GameApp.playSound('wrong'); // Hit wall
      }
      
      this.renderCodingGrid();
      
      // Highlight current code block
      const blocks = document.querySelectorAll('.code-block');
      blocks.forEach(b => b.style.boxShadow = 'none');
      if (blocks[step]) {
        blocks[step].style.boxShadow = '0 0 10px #ffd700';
      }
      
      step++;
      this.timers.push(setTimeout(executeStep, 500));
    };
    
    executeStep();
  }

  checkCodingResult() {
    if (this.robotPos.r === this.batteryPos.r && this.robotPos.c === this.batteryPos.c) {
      GameApp.playSound('correct');
      const rect = document.getElementById('codingGrid').getBoundingClientRect();
      GameApp.createConfetti(rect.left + rect.width/2, rect.top + rect.height/2);
      
      this.timers.push(setTimeout(() => {
        this.startAIPhase();
      }, 2000));
    } else {
      GameApp.playSound('wrong');
      const q = document.getElementById('codeQueue');
      q.style.animation = 'shake 0.4s ease';
      setTimeout(() => q.style.animation = '', 400);
      
      this.isExecuting = false;
      document.getElementById('btnRun').disabled = false;
      
      // Reset robot visually
      this.timers.push(setTimeout(() => {
        this.robotPos = { r: 0, c: 0 };
        this.robotDir = 0;
        this.renderCodingGrid();
      }, 1000));
    }
  }

  // ==========================================
  // PHASE 2: AI TRAINING
  // ==========================================
  startAIPhase() {
    this.phase = 2;
    document.getElementById('phaseIndicator').textContent = 'Fase 2: Latih AI 🧠';
    
    const keys = Object.keys(this.aiCategories);
    this.currentAiCategory = keys[Math.floor(Math.random() * keys.length)];
    this.aiTargetsNeeded = this.difficulty === 'easy' ? 3 : this.difficulty === 'medium' ? 5 : 7;
    this.aiTargetsFound = 0;
    
    this.renderAIUI();
    this.spawnAIItems();
  }

  renderAIUI() {
    const ws = document.getElementById('codingWorkspace');
    ws.innerHTML = `
      <div class="ai-training-board" id="aiBoard">
        <div class="ai-instruction">Pilih semua: ${this.currentAiCategory}</div>
        <div class="ai-progress-bar">
          <div class="ai-progress-fill" id="aiProgress"></div>
        </div>
      </div>
    `;
  }

  spawnAIItems() {
    const board = document.getElementById('aiBoard');
    if (!board) return;
    if (this.aiInterval) clearInterval(this.aiInterval);
    
    const catData = this.aiCategories[this.currentAiCategory];
    
    this.aiInterval = setInterval(() => {
      if (this.aiTargetsFound >= this.aiTargetsNeeded) {
        clearInterval(this.aiInterval);
        return;
      }
      
      // 40% chance for target, 60% for distractor
      const isTarget = Math.random() < 0.4;
      const arr = isTarget ? catData.targets : catData.distractors;
      const emoji = arr[Math.floor(Math.random() * arr.length)];
      
      const item = document.createElement('div');
      item.className = 'ai-item';
      item.textContent = emoji;
      
      // Random position
      const x = Math.random() * (board.clientWidth - 50);
      const y = Math.random() * (board.clientHeight - 80) + 50;
      
      item.style.left = `${x}px`;
      item.style.top = `${y}px`;
      
      item.onclick = () => this.handleAIItemClick(item, isTarget);
      
      board.appendChild(item);
      
      // Remove after 3 seconds
      setTimeout(() => {
        if(item.parentNode) item.remove();
      }, 3000);
      
    }, 800 - (this.difficulty === 'hard' ? 300 : 0));
  }

  handleAIItemClick(item, isTarget) {
    if (this.aiTargetsFound >= this.aiTargetsNeeded) return;
    
    item.remove();
    
    if (isTarget) {
      GameApp.playSound('click');
      this.aiTargetsFound++;
      const pct = (this.aiTargetsFound / this.aiTargetsNeeded) * 100;
      document.getElementById('aiProgress').style.width = `${pct}%`;
      
      const rect = document.getElementById('aiBoard').getBoundingClientRect();
      GameApp.createConfetti(rect.left + Math.random() * rect.width, rect.top + Math.random() * rect.height);
      
      if (this.aiTargetsFound >= this.aiTargetsNeeded) {
        GameApp.playSound('correct');
        this.timers.push(setTimeout(() => {
          this.currentRound++;
          this.startRound();
        }, 1500));
      }
    } else {
      GameApp.playSound('wrong');
      const board = document.getElementById('aiBoard');
      board.style.animation = 'shake 0.4s ease';
      setTimeout(() => board.style.animation = '', 400);
    }
  }

  endGame() {
    this.clearTimers();
    // Scoring logic (max 10)
    let score = 10;
    if (this.elapsedTime > 60) score = 8;
    if (this.elapsedTime > 120) score = 6;
    
    const progressFill = document.getElementById('codingProgress');
    if (progressFill) progressFill.style.width = `100%`;
    
    GameApp.endGame(score, 10);
  }
}
window.CodingGame = CodingGame;
