class PatternGame {
  constructor() {
    this.timers = [];
    this.currentQuestion = 0;
    this.score = 0;
    this.maxQuestions = 8;
    this.difficulty = 'easy';
    this.container = null;
    this.answerSelected = false;
    
    this.emojiSets = [
      ['🔴', '🔵', '🟡', '🟢'],
      ['🐶', '🐱', '🐭', '🐹'],
      ['⭐', '🌙', '☀️', '☁️'],
      ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'],
      ['🍎', '🍌', '🍇', '🍉']
    ];
  }

  init(container, difficulty) {
    this.container = container;
    this.difficulty = difficulty;
    this.currentQuestion = 0;
    this.score = 0;
    
    this.renderBaseUI();
    this.nextQuestion();
  }

  destroy() {
    this.clearTimers();
  }

  clearTimers() {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }

  renderBaseUI() {
    this.container.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" id="patternProgress" style="width: 0%"></div>
      </div>
      <div class="pattern-sequence" id="patternSequence"></div>
      <div class="options-grid" id="patternOptions"></div>
    `;
  }

  generatePattern() {
    let patternType;
    if (this.difficulty === 'easy') {
      patternType = ['AB', 'ABC'][Math.floor(Math.random() * 2)];
    } else if (this.difficulty === 'medium') {
      patternType = ['AABB', 'ABBC', 'ABCD'][Math.floor(Math.random() * 3)];
    } else {
      patternType = ['AABBC', 'ABCABC', 'ABAC'][Math.floor(Math.random() * 3)];
    }

    const emSet = this.emojiSets[Math.floor(Math.random() * this.emojiSets.length)];
    let shuffledSet = [...emSet].sort(() => Math.random() - 0.5);
    
    let baseSequence = [];
    if (patternType === 'AB') baseSequence = [0, 1];
    else if (patternType === 'ABC') baseSequence = [0, 1, 2];
    else if (patternType === 'AABB') baseSequence = [0, 0, 1, 1];
    else if (patternType === 'ABBC') baseSequence = [0, 1, 1, 2];
    else if (patternType === 'ABCD') baseSequence = [0, 1, 2, 3];
    else if (patternType === 'AABBC') baseSequence = [0, 0, 1, 1, 2];
    else if (patternType === 'ABCABC') baseSequence = [0, 1, 2, 0, 1, 2];
    else if (patternType === 'ABAC') baseSequence = [0, 1, 0, 2];

    let fullSequence = [];
    let targetLength = this.difficulty === 'easy' ? 4 : this.difficulty === 'medium' ? 5 : 6;
    
    // Repeat base sequence to reach target length
    for (let i = 0; i < targetLength; i++) {
        fullSequence.push(shuffledSet[baseSequence[i % baseSequence.length]]);
    }
    
    // The next item is the answer
    let answer = shuffledSet[baseSequence[targetLength % baseSequence.length]];
    
    // Options
    let options = [answer];
    while(options.length < 4) {
      let opt = emSet[Math.floor(Math.random() * emSet.length)];
      if (!options.includes(opt)) {
        options.push(opt);
      }
    }
    // If not enough options in the set, pull from other sets
    if(options.length < 4) {
      const allEmojis = this.emojiSets.flat();
      while(options.length < 4) {
        let opt = allEmojis[Math.floor(Math.random() * allEmojis.length)];
        if (!options.includes(opt)) {
          options.push(opt);
        }
      }
    }
    
    options.sort(() => Math.random() - 0.5);
    
    return { sequence: fullSequence, answer, options };
  }

  nextQuestion() {
    if (this.currentQuestion >= this.maxQuestions) {
      GameApp.endGame(this.score, this.maxQuestions);
      return;
    }

    this.currentQuestion++;
    this.answerSelected = false;
    
    // Update progress
    const progressFill = document.getElementById('patternProgress');
    if (progressFill) progressFill.style.width = `${(this.currentQuestion / this.maxQuestions) * 100}%`;
    GameApp.updateScore(`${this.score}/${this.maxQuestions}`);
    
    const patternData = this.generatePattern();
    this.renderPattern(patternData);
  }

  renderPattern(data) {
    const seqContainer = document.getElementById('patternSequence');
    if (!seqContainer) return;
    
    seqContainer.innerHTML = '';
    data.sequence.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'pattern-item';
      div.textContent = item;
      div.style.animationDelay = `${i * 0.1}s`;
      seqContainer.appendChild(div);
    });
    
    // Mystery item
    const mystery = document.createElement('div');
    mystery.className = 'pattern-item mystery';
    mystery.textContent = '❓';
    seqContainer.appendChild(mystery);
    
    // Render options
    const optContainer = document.getElementById('patternOptions');
    if (!optContainer) return;
    
    optContainer.innerHTML = '';
    data.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.onclick = () => this.handleAnswer(btn, opt === data.answer, data.answer);
      optContainer.appendChild(btn);
    });
  }

  handleAnswer(btn, isCorrect, correctAnswer) {
    if (this.answerSelected) return;
    this.answerSelected = true;
    
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);
    
    const mystery = document.querySelector('.mystery');
    
    if (isCorrect) {
      btn.classList.add('correct');
      if (mystery) {
        mystery.textContent = correctAnswer;
        mystery.classList.remove('mystery');
        mystery.classList.add('correct-letter');
      }
      
      GameApp.playSound('correct');
      this.score++;
      GameApp.updateScore(`${this.score}/${this.maxQuestions}`);
      
      const rect = mystery ? mystery.getBoundingClientRect() : btn.getBoundingClientRect();
      GameApp.createConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else {
      btn.classList.add('wrong');
      GameApp.playSound('wrong');
    }
    
    this.timers.push(setTimeout(() => this.nextQuestion(), 1500));
  }
}
window.PatternGame = PatternGame;
