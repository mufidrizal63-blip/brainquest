class CyberNodeGame {
  constructor() {
    this.timers = [];
    this.timerInterval = null;
    this.difficulty = 'easy';
    this.container = null;
    this.elapsedTime = 0;
    
    this.currentRound = 1;
    this.maxRounds = 3;
    this.phase = 1; // 1: Routing, 2: AI Defense
    
    // Phase 1 State
    this.gridSize = 5;
    this.packetPos = { r: 0, c: 0 };
    this.serverPos = { r: 4, c: 4 };
    this.walls = [];
    this.codeQueue = [];
    this.isExecuting = false;
    
    // Phase 2 State
    this.aiTargetsNeeded = 5;
    this.aiTargetsFound = 0;
    this.aiInterval = null;
    this.nodesCount = 0;
  }

  init(container, difficulty) {
    this.container = container;
    this.difficulty = difficulty;
    this.currentRound = 1;
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
      <div class="phase-indicator" id="phaseIndicator" style="border-color: #00f3ff; color: #00f3ff; text-shadow: 0 0 5px #00f3ff;">Memuat Sistem...</div>
      <div id="cyberWorkspace" style="width: 100%;"></div>
    `;
  }

  startRound() {
    if (this.currentRound > this.maxRounds) {
      this.endGame();
      return;
    }
    GameApp.updateScore(`Ronde ${this.currentRound}/${this.maxRounds}`);
    this.startRoutingPhase();
  }

  // ==========================================
  // PHASE 1: CYBER ROUTING
  // ==========================================
  startRoutingPhase() {
    this.phase = 1;
    document.getElementById('phaseIndicator').innerHTML = 'Fase 1: <span style="color:#fff">Routing Data</span> 🌐';
    
    this.packetPos = { r: 0, c: 0 };
    this.serverPos = { r: this.gridSize - 1, c: this.gridSize - 1 };
    this.codeQueue = [];
    this.isExecuting = false;
    
    // Add firewall obstacles
    this.walls = [];
    let numObs = this.difficulty === 'easy' ? 1 : this.difficulty === 'medium' ? 3 : 5;
    for (let i = 0; i < numObs; i++) {
      let or, oc;
      let attempts = 0;
      do {
        or = Math.floor(Math.random() * this.gridSize);
        oc = Math.floor(Math.random() * this.gridSize);
        attempts++;
      } while (((or === 0 && oc === 0) || (or === this.serverPos.r && oc === this.serverPos.c)) && attempts < 50);
      this.walls.push({r: or, c: oc});
    }
    
    this.renderRoutingUI();
  }

  renderRoutingUI() {
    const ws = document.getElementById('cyberWorkspace');
    ws.innerHTML = `
      <div class="cyber-board">
        <div class="cyber-grid" id="cyberGrid" style="grid-template-columns: repeat(${this.gridSize}, 1fr);">
          <!-- Cells -->
        </div>
        
        <div class="cyber-queue" id="cyberQueue"></div>
        
        <div class="code-controls">
          <button class="cyber-btn" id="btnCyberUp">[^] Atas</button>
          <button class="cyber-btn" id="btnCyberDown">[v] Bawah</button>
          <button class="cyber-btn" id="btnCyberLeft">[<] Kiri</button>
          <button class="cyber-btn" id="btnCyberRight">[>] Kanan</button>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 10px; width: 100%; justify-content: center;">
          <button class="cyber-btn cyber-clear-btn" id="btnCyberClear">/rm queue</button>
          <button class="cyber-btn cyber-run-btn" id="btnCyberRun">./execute_routing.sh</button>
        </div>
      </div>
    `;
    
    this.renderCyberGrid();
    
    document.getElementById('btnCyberUp').onclick = () => this.addCode('Up', 'connect_up()');
    document.getElementById('btnCyberDown').onclick = () => this.addCode('Down', 'connect_down()');
    document.getElementById('btnCyberLeft').onclick = () => this.addCode('Left', 'connect_left()');
    document.getElementById('btnCyberRight').onclick = () => this.addCode('Right', 'connect_right()');
    document.getElementById('btnCyberClear').onclick = () => this.clearCode();
    document.getElementById('btnCyberRun').onclick = () => this.executeRouting();
  }

  renderCyberGrid() {
    const grid = document.getElementById('cyberGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = document.createElement('div');
        cell.className = 'cyber-cell cyber-path';
        
        if (r === this.packetPos.r && c === this.packetPos.c) {
          cell.innerHTML = '<div class="cyber-packet">💠</div>';
          cell.style.background = 'rgba(0,243,255,0.3)';
          cell.style.boxShadow = 'inset 0 0 10px #00f3ff';
        } else if (r === this.serverPos.r && c === this.serverPos.c) {
          cell.innerHTML = '<div class="cyber-server">🖧</div>';
        } else if (this.walls.some(o => o.r === r && o.c === c)) {
          cell.className = 'cyber-cell cyber-wall';
          cell.innerHTML = '<span style="font-size:0.8rem">FIREWALL</span>';
          cell.style.color = '#ff003c';
        }
        
        grid.appendChild(cell);
      }
    }
  }

  addCode(action, text) {
    if (this.isExecuting || this.codeQueue.length >= 20) return;
    GameApp.playSound('click');
    this.codeQueue.push({action, text});
    this.renderCodeQueue();
  }

  clearCode() {
    if (this.isExecuting) return;
    GameApp.playSound('click');
    this.codeQueue = [];
    this.renderCodeQueue();
  }

  renderCodeQueue() {
    const q = document.getElementById('cyberQueue');
    if (!q) return;
    q.innerHTML = '';
    this.codeQueue.forEach(cmd => {
      const block = document.createElement('div');
      block.className = 'cyber-block';
      block.textContent = cmd.text;
      q.appendChild(block);
    });
    q.scrollLeft = q.scrollWidth;
  }

  executeRouting() {
    if (this.isExecuting || this.codeQueue.length === 0) return;
    this.isExecuting = true;
    document.getElementById('btnCyberRun').disabled = true;
    
    this.packetPos = { r: 0, c: 0 };
    this.renderCyberGrid();
    
    let step = 0;
    
    const executeStep = () => {
      if (step >= this.codeQueue.length) {
        this.checkRoutingResult();
        return;
      }
      
      const cmd = this.codeQueue[step];
      let nr = this.packetPos.r;
      let nc = this.packetPos.c;
      
      if (cmd.action === 'Up') nr--;
      else if (cmd.action === 'Down') nr++;
      else if (cmd.action === 'Left') nc--;
      else if (cmd.action === 'Right') nc++;
      
      if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize && !this.walls.some(w => w.r === nr && w.c === nc)) {
        this.packetPos = { r: nr, c: nc };
        GameApp.playSound('click');
      } else {
        GameApp.playSound('wrong'); // Access Denied
      }
      
      this.renderCyberGrid();
      
      const blocks = document.querySelectorAll('.cyber-block');
      blocks.forEach(b => {
        b.style.background = 'rgba(0, 243, 255, 0.1)';
        b.style.color = '#00f3ff';
      });
      if (blocks[step]) {
        blocks[step].style.background = '#00f3ff';
        blocks[step].style.color = '#000';
      }
      
      step++;
      this.timers.push(setTimeout(executeStep, 400));
    };
    
    executeStep();
  }

  checkRoutingResult() {
    if (this.packetPos.r === this.serverPos.r && this.packetPos.c === this.serverPos.c) {
      GameApp.playSound('complete');
      const rect = document.getElementById('cyberGrid').getBoundingClientRect();
      GameApp.createConfetti(rect.left + rect.width/2, rect.top + rect.height/2);
      
      this.timers.push(setTimeout(() => {
        this.startAIDefensePhase();
      }, 2000));
    } else {
      GameApp.playSound('wrong');
      const q = document.getElementById('cyberGrid');
      q.style.animation = 'shake 0.4s ease';
      setTimeout(() => q.style.animation = '', 400);
      
      this.isExecuting = false;
      document.getElementById('btnCyberRun').disabled = false;
      
      this.timers.push(setTimeout(() => {
        this.packetPos = { r: 0, c: 0 };
        this.renderCyberGrid();
      }, 1000));
    }
  }

  // ==========================================
  // PHASE 2: AI DEFENSE TRAINING
  // ==========================================
  startAIDefensePhase() {
    this.phase = 2;
    document.getElementById('phaseIndicator').innerHTML = 'Fase 2: <span style="color:#00ff66">AI Firewall</span> 🛡️';
    
    this.aiTargetsNeeded = this.difficulty === 'easy' ? 4 : this.difficulty === 'medium' ? 6 : 8;
    this.aiTargetsFound = 0;
    this.nodesCount = 0;
    
    this.renderAIUI();
    this.spawnAINodes();
  }

  renderAIUI() {
    const ws = document.getElementById('cyberWorkspace');
    ws.innerHTML = `
      <div class="cyber-ai-board" id="aiBoard">
        <div class="cyber-ai-instruction">TANGKAP NODE BERSIH 💠 HINDARI MALWARE 🛑</div>
        <div class="cyber-ai-progress">
          <div class="cyber-ai-fill" id="aiProgress"></div>
        </div>
      </div>
    `;
  }

  spawnAINodes() {
    const board = document.getElementById('aiBoard');
    if (!board) return;
    if (this.aiInterval) clearInterval(this.aiInterval);
    
    this.aiInterval = setInterval(() => {
      if (this.aiTargetsFound >= this.aiTargetsNeeded) {
        clearInterval(this.aiInterval);
        return;
      }
      
      // Keep max nodes on screen
      if (this.nodesCount > 10) return;
      
      // 50% chance pure, 50% malware
      const isPure = Math.random() > 0.5;
      
      const item = document.createElement('div');
      item.className = 'cyber-node ' + (isPure ? 'cyber-node-pure' : 'cyber-node-malware');
      item.textContent = isPure ? '💠' : '🛑';
      
      const x = Math.random() * (board.clientWidth - 50);
      const y = Math.random() * (board.clientHeight - 80) + 30;
      
      item.style.left = `${x}px`;
      item.style.top = `${y}px`;
      
      this.nodesCount++;
      
      item.onclick = () => {
        this.nodesCount--;
        item.remove();
        if (isPure) {
          GameApp.playSound('star');
          this.aiTargetsFound++;
          const pct = (this.aiTargetsFound / this.aiTargetsNeeded) * 100;
          document.getElementById('aiProgress').style.width = `${pct}%`;
          
          if (this.aiTargetsFound >= this.aiTargetsNeeded) {
            clearInterval(this.aiInterval);
            GameApp.playSound('correct');
            this.timers.push(setTimeout(() => {
              this.currentRound++;
              this.startRound();
            }, 1500));
          }
        } else {
          GameApp.playSound('wrong');
          const aiBoard = document.getElementById('aiBoard');
          aiBoard.style.animation = 'shake 0.4s ease';
          setTimeout(() => aiBoard.style.animation = '', 400);
        }
      };
      
      board.appendChild(item);
      
      // Auto remove after 2.5s
      setTimeout(() => {
        if(item.parentNode) {
          item.remove();
          this.nodesCount--;
        }
      }, 2500);
      
    }, 700 - (this.difficulty === 'hard' ? 200 : 0));
  }

  endGame() {
    this.clearTimers();
    let score = 10;
    if (this.elapsedTime > 60) score = 8;
    if (this.elapsedTime > 120) score = 6;
    GameApp.endGame(score, 10);
  }
}

window.CyberNodeGame = CyberNodeGame;
