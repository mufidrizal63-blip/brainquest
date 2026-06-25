class WordGame {
  constructor() {
    this.timers = [];
    this.currentQuestion = 0;
    this.score = 0;
    this.maxQuestions = 8;
    this.elapsedTime = 0;
    this.timerInterval = null;
    this.difficulty = 'easy';
    this.container = null;
    this.currentWord = '';
    this.currentCategory = '';
    this.selectedLetters = [];
    this.scrambledLetters = [];
    this.hintsUsed = 0;

    this.wordBank = {
      Hewan: ['kucing', 'anjing', 'gajah', 'harimau', 'kelinci', 'kerbau', 'burung', 'ikan', 'kuda', 'domba', 'singa', 'zebra'],
      Buah: ['apel', 'jeruk', 'mangga', 'pisang', 'semangka', 'anggur', 'durian', 'nanas', 'pepaya', 'rambutan', 'melon', 'jambu'],
      Warna: ['merah', 'biru', 'hijau', 'kuning', 'ungu', 'putih', 'hitam', 'coklat', 'jingga', 'perak', 'emas'],
      Profesi: ['guru', 'dokter', 'polisi', 'pilot', 'petani', 'nelayan', 'koki', 'tentara', 'perawat', 'seniman']
    };
  }

  init(container, difficulty) {
    this.container = container;
    this.difficulty = difficulty;
    this.currentQuestion = 0;
    this.score = 0;
    this.elapsedTime = 0;
    
    this.renderBaseUI();
    this.startTimer();
    this.nextWord();
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
      <div class="progress-bar">
        <div class="progress-fill" id="wordProgress" style="width: 0%"></div>
      </div>
      <div class="category-badge" id="wordCategory"></div>
      <div class="word-display" id="wordSlots"></div>
      <div class="scrambled-letters" id="wordScrambled"></div>
      <div style="display: flex; gap: 10px; margin-top: 20px; width: 100%; max-width: 300px;">
        <button class="hint-btn flex-1" id="wordHintBtn" style="flex: 1;">💡 Bantuan</button>
      </div>
    `;
    
    document.getElementById('wordHintBtn').addEventListener('click', () => this.useHint());
  }

  filterWordBank() {
    const filtered = [];
    for (const [category, words] of Object.entries(this.wordBank)) {
      for (const word of words) {
        if (this.difficulty === 'easy' && word.length >= 4 && word.length <= 5) {
          filtered.push({ word, category });
        } else if (this.difficulty === 'medium' && word.length >= 5 && word.length <= 6) {
          filtered.push({ word, category });
        } else if (this.difficulty === 'hard' && word.length >= 6) {
          filtered.push({ word, category });
        }
      }
    }
    // If not enough words match criteria, just return all words
    if (filtered.length < this.maxQuestions) {
      for (const [category, words] of Object.entries(this.wordBank)) {
        for (const word of words) {
            filtered.push({ word, category });
        }
      }
    }
    return filtered;
  }

  nextWord() {
    if (this.currentQuestion >= this.maxQuestions) {
      GameApp.endGame(this.score, this.maxQuestions);
      return;
    }

    const availableWords = this.filterWordBank();
    const wordObj = availableWords[Math.floor(Math.random() * availableWords.length)];
    
    this.currentWord = wordObj.word.toUpperCase();
    this.currentCategory = wordObj.category;
    this.selectedLetters = new Array(this.currentWord.length).fill(null);
    this.hintsUsed = 0;

    // Scramble letters
    let letters = this.currentWord.split('');
    do {
      letters.sort(() => Math.random() - 0.5);
    } while (letters.join('') === this.currentWord && letters.length > 1);
    
    this.scrambledLetters = letters.map((char, index) => ({ id: index, char, used: false }));

    this.currentQuestion++;
    
    // Update progress
    const progressFill = document.getElementById('wordProgress');
    if (progressFill) progressFill.style.width = `${(this.currentQuestion / this.maxQuestions) * 100}%`;
    GameApp.updateScore(`${this.score}/${this.maxQuestions}`);
    
    document.getElementById('wordCategory').textContent = `🏷️ Kategori: ${this.currentCategory}`;
    document.getElementById('wordHintBtn').disabled = false;
    
    this.renderSlots();
    this.renderScrambled();
  }

  renderSlots() {
    const container = document.getElementById('wordSlots');
    if (!container) return;
    
    container.innerHTML = '';
    this.selectedLetters.forEach((item, i) => {
      const slot = document.createElement('div');
      slot.className = `letter-slot ${item ? 'filled' : ''}`;
      if (item) slot.textContent = item.char;
      
      slot.onclick = () => {
        if (item) this.removeLetter(i);
      };
      
      container.appendChild(slot);
    });
  }

  renderScrambled() {
    const container = document.getElementById('wordScrambled');
    if (!container) return;
    
    container.innerHTML = '';
    this.scrambledLetters.forEach(item => {
      const btn = document.createElement('button');
      btn.className = `letter-btn ${item.used ? 'used' : ''}`;
      btn.textContent = item.char;
      
      btn.onclick = () => {
        if (!item.used) this.addLetter(item);
      };
      
      container.appendChild(btn);
    });
  }

  addLetter(item) {
    const emptyIndex = this.selectedLetters.findIndex(l => l === null);
    if (emptyIndex !== -1) {
      GameApp.playSound('click');
      this.selectedLetters[emptyIndex] = item;
      item.used = true;
      this.renderSlots();
      this.renderScrambled();
      this.checkWord();
    }
  }

  removeLetter(index) {
    const item = this.selectedLetters[index];
    if (item) {
      GameApp.playSound('click');
      item.used = false;
      this.selectedLetters[index] = null;
      this.renderSlots();
      this.renderScrambled();
    }
  }

  useHint() {
    if (this.hintsUsed >= 2) return;
    
    // Find first empty slot or incorrect letter
    const targetWord = this.currentWord.split('');
    let hintIndex = -1;
    
    for (let i = 0; i < targetWord.length; i++) {
      if (!this.selectedLetters[i] || this.selectedLetters[i].char !== targetWord[i]) {
        hintIndex = i;
        break;
      }
    }
    
    if (hintIndex !== -1) {
      // If there's a wrong letter here, remove it
      if (this.selectedLetters[hintIndex]) {
        this.selectedLetters[hintIndex].used = false;
        this.selectedLetters[hintIndex] = null;
      }
      
      // Find the correct letter in scrambled
      const targetChar = targetWord[hintIndex];
      const scrambledItem = this.scrambledLetters.find(l => !l.used && l.char === targetChar) || 
                            this.scrambledLetters.find(l => l.char === targetChar);
      
      if (scrambledItem) {
        // If the correct letter is currently used somewhere else (wrongly), free it up
        if (scrambledItem.used) {
            const usingIndex = this.selectedLetters.findIndex(l => l && l.id === scrambledItem.id);
            if (usingIndex !== -1) {
                this.selectedLetters[usingIndex] = null;
            }
        }

        this.selectedLetters[hintIndex] = scrambledItem;
        scrambledItem.used = true;
        this.hintsUsed++;
        
        if (this.hintsUsed >= 2) {
          document.getElementById('wordHintBtn').disabled = true;
        }
        
        this.renderSlots();
        this.renderScrambled();
        this.checkWord();
      }
    }
  }

  checkWord() {
    if (this.selectedLetters.includes(null)) return;
    
    const formedWord = this.selectedLetters.map(l => l.char).join('');
    const slots = document.querySelectorAll('.letter-slot');
    const scrambledBtns = document.querySelectorAll('.letter-btn');
    
    if (formedWord === this.currentWord) {
      slots.forEach(s => s.classList.add('correct-letter'));
      GameApp.playSound('correct');
      this.score++;
      
      const slotsContainer = document.getElementById('wordSlots');
      const rect = slotsContainer.getBoundingClientRect();
      GameApp.createConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
      
      this.timers.push(setTimeout(() => this.nextWord(), 1500));
    } else {
      slots.forEach(s => s.classList.add('wrong-letter'));
      GameApp.playSound('wrong');
      
      this.timers.push(setTimeout(() => {
        slots.forEach(s => s.classList.remove('wrong-letter'));
        this.selectedLetters.forEach(l => {
          if (l) l.used = false;
        });
        this.selectedLetters.fill(null);
        this.renderSlots();
        this.renderScrambled();
      }, 800));
    }
  }
}
window.WordGame = WordGame;
