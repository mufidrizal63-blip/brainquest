class MemoryGame {
  constructor() {
    this.timers = [];
    this.timerInterval = null;
    this.difficulty = 'easy';
    this.container = null;
    this.elapsedTime = 0;
    this.attempts = 0;
    this.matchedPairs = 0;
    this.totalPairs = 0;
    
    this.cards = [];
    this.flippedCards = [];
    this.isLocked = false;
    
    this.emojiSets = {
      easy: ['🐶', '🐱', '🐸', '🦁', '🐵', '🐼'],
      medium: ['🐶', '🐱', '🐸', '🦁', '🐵', '🐼', '🦊', '🐰'],
      hard: ['🐶', '🐱', '🐸', '🦁', '🐵', '🐼', '🦊', '🐰', '🐨', '🦋']
    };
  }

  init(container, difficulty) {
    this.container = container;
    this.difficulty = difficulty;
    this.elapsedTime = 0;
    this.attempts = 0;
    this.matchedPairs = 0;
    
    this.totalPairs = this.emojiSets[this.difficulty].length;
    
    this.renderBaseUI();
    this.setupCards();
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
          <span>Percobaan:</span>
          <span class="counter-value" id="memoryAttempts">0</span>
        </div>
      </div>
      <div class="memory-grid" id="memoryGrid"></div>
    `;
  }

  setupCards() {
    const emojis = this.emojiSets[this.difficulty];
    let cardSet = [...emojis, ...emojis];
    
    // Fisher-Yates shuffle
    for (let i = cardSet.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardSet[i], cardSet[j]] = [cardSet[j], cardSet[i]];
    }
    
    const grid = document.getElementById('memoryGrid');
    
    // Setup grid columns
    let cols = 4;
    if (this.difficulty === 'easy') cols = 3;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    this.cards = [];
    
    cardSet.forEach((emoji, index) => {
      const cell = document.createElement('div');
      cell.className = 'memory-cell';
      cell.dataset.index = index;
      cell.dataset.emoji = emoji;
      
      cell.innerHTML = `
        <div class="memory-card-inner">
          <div class="memory-card-front"></div>
          <div class="memory-card-back">${emoji}</div>
        </div>
      `;
      
      cell.addEventListener('click', () => this.handleCardClick(cell));
      grid.appendChild(cell);
      this.cards.push({ cell, emoji, isMatched: false, isFlipped: false });
    });
    
    GameApp.updateScore(`${this.matchedPairs}/${this.totalPairs}`);
  }

  handleCardClick(cell) {
    if (this.isLocked) return;
    const index = parseInt(cell.dataset.index);
    const card = this.cards[index];
    
    if (card.isMatched || card.isFlipped) return;
    
    GameApp.playSound('click');
    cell.classList.add('flipped');
    card.isFlipped = true;
    this.flippedCards.push(card);
    
    if (this.flippedCards.length === 2) {
      this.attempts++;
      document.getElementById('memoryAttempts').textContent = this.attempts;
      this.checkMatch();
    }
  }

  checkMatch() {
    this.isLocked = true;
    const [card1, card2] = this.flippedCards;
    
    if (card1.emoji === card2.emoji) {
      card1.isMatched = true;
      card2.isMatched = true;
      this.matchedPairs++;
      
      GameApp.playSound('correct');
      GameApp.updateScore(`${this.matchedPairs}/${this.totalPairs}`);
      
      card1.cell.classList.add('matched');
      card2.cell.classList.add('matched');
      
      const rect = card2.cell.getBoundingClientRect();
      GameApp.createConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
      
      this.flippedCards = [];
      this.isLocked = false;
      
      if (this.matchedPairs === this.totalPairs) {
        this.timers.push(setTimeout(() => this.finishGame(), 1000));
      }
    } else {
      GameApp.playSound('wrong');
      this.timers.push(setTimeout(() => {
        card1.cell.classList.remove('flipped');
        card2.cell.classList.remove('flipped');
        card1.isFlipped = false;
        card2.isFlipped = false;
        this.flippedCards = [];
        this.isLocked = false;
      }, 1000));
    }
  }

  finishGame() {
    this.clearTimers();
    // Calculate score based on efficiency
    let score = Math.max(0, this.totalPairs - Math.floor((this.attempts - this.totalPairs) / 3));
    if (score > this.totalPairs) score = this.totalPairs;
    
    GameApp.endGame(score, this.totalPairs);
  }
}
window.MemoryGame = MemoryGame;
