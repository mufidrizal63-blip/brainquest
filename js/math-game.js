class MathGame {
  constructor() {
    this.timers = [];
    this.currentQuestion = 0;
    this.score = 0;
    this.maxQuestions = 10;
    this.timeLeft = 15;
    this.timerInterval = null;
    this.difficulty = 'easy';
    this.container = null;
    this.answerSelected = false;
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
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }

  renderBaseUI() {
    this.container.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" id="mathProgress" style="width: 0%"></div>
      </div>
      <div class="timer-bar">
        <div class="timer-fill" id="mathTimerBar" style="width: 100%"></div>
      </div>
      <div class="question-container">
        <div class="question-text" id="mathQuestionText">Menyiapkan...</div>
      </div>
      <div class="options-grid" id="mathOptionsGrid"></div>
    `;
  }

  nextQuestion() {
    if (this.currentQuestion >= this.maxQuestions) {
      GameApp.endGame(this.score, this.maxQuestions);
      return;
    }

    this.currentQuestion++;
    this.answerSelected = false;
    
    // Update progress
    const progressFill = this.container.querySelector('#mathProgress');
    if (progressFill) progressFill.style.width = `${(this.currentQuestion / this.maxQuestions) * 100}%`;
    GameApp.updateScore(`${this.score}/${this.maxQuestions}`);
    
    this.generateQuestion();
    this.startTimer();
  }

  generateQuestion() {
    let num1, num2, op, answer;
    const ops = this.difficulty === 'easy' ? ['+', '-'] : 
                this.difficulty === 'medium' ? ['+', '-', '×'] : 
                ['+', '-', '×', '÷'];
    op = ops[Math.floor(Math.random() * ops.length)];

    let maxNum = this.difficulty === 'easy' ? 10 : 
                 this.difficulty === 'medium' ? 50 : 100;

    if (op === '+') {
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * maxNum) + 1;
      answer = num1 + num2;
    } else if (op === '-') {
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * num1) + 1; // Ensure positive result
      answer = num1 - num2;
    } else if (op === '×') {
      let mMax = this.difficulty === 'medium' ? 10 : 15;
      num1 = Math.floor(Math.random() * mMax) + 1;
      num2 = Math.floor(Math.random() * mMax) + 1;
      answer = num1 * num2;
    } else if (op === '÷') {
      let dMax = 12;
      num2 = Math.floor(Math.random() * dMax) + 1;
      answer = Math.floor(Math.random() * dMax) + 1;
      num1 = num2 * answer;
    }

    const questionText = document.getElementById('mathQuestionText');
    if (questionText) questionText.textContent = `${num1} ${op} ${num2} = ?`;

    // Generate wrong answers
    let answers = [answer];
    let variance = this.difficulty === 'easy' ? 5 : this.difficulty === 'medium' ? 10 : 20;
    while (answers.length < 4) {
      let wrong = answer + (Math.floor(Math.random() * variance * 2) - variance);
      if (wrong !== answer && !answers.includes(wrong) && wrong >= 0) {
        answers.push(wrong);
      }
    }
    
    // Shuffle
    answers.sort(() => Math.random() - 0.5);

    const grid = document.getElementById('mathOptionsGrid');
    if (grid) {
      grid.innerHTML = '';
      answers.forEach(ans => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = ans;
        btn.onclick = () => this.handleAnswer(btn, ans === answer);
        grid.appendChild(btn);
      });
    }
  }

  startTimer() {
    this.clearTimers();
    this.timeLeft = 15;
    GameApp.updateTimer(this.timeLeft + 's');
    const timerBar = document.getElementById('mathTimerBar');
    if (timerBar) {
      timerBar.style.width = '100%';
      timerBar.className = 'timer-fill';
    }

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      GameApp.updateTimer(this.timeLeft + 's');
      
      if (timerBar) {
        const pct = (this.timeLeft / 15) * 100;
        timerBar.style.width = `${pct}%`;
        if (pct <= 30) timerBar.className = 'timer-fill danger';
        else if (pct <= 60) timerBar.className = 'timer-fill warning';
      }

      if (this.timeLeft <= 0) {
        this.clearTimers();
        this.handleTimeout();
      }
    }, 1000);
  }

  handleAnswer(btn, isCorrect) {
    if (this.answerSelected) return;
    this.answerSelected = true;
    this.clearTimers();

    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
      btn.classList.add('correct');
      GameApp.playSound('correct');
      this.score++;
      GameApp.updateScore(`${this.score}/${this.maxQuestions}`);
      const rect = btn.getBoundingClientRect();
      GameApp.createConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else {
      btn.classList.add('wrong');
      GameApp.playSound('wrong');
    }

    this.timers.push(setTimeout(() => this.nextQuestion(), 1000));
  }

  handleTimeout() {
    if (this.answerSelected) return;
    this.answerSelected = true;
    GameApp.playSound('wrong');
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);
    this.timers.push(setTimeout(() => this.nextQuestion(), 1000));
  }
}
window.MathGame = MathGame;
