/* =========================================
   BrainQuest — Core Application Engine
   ========================================= */

const GameApp = (() => {
  // ---------- State ----------
  let currentScreen = 'menu';
  let currentGame = null;
  let currentGameInstance = null;
  let currentDifficulty = 'easy';
  let totalStars = 0;
  let gameStars = {};  // { math: 2, word: 3, ... }
  let audioCtx = null;

  // Game registry
  const games = {
    math:    { name: 'Hitung Cepat',  emoji: '🧮', class: 'MathGame' },
    word:    { name: 'Tebak Kata',    emoji: '🔤', class: 'WordGame' },
    memory:  { name: 'Memory Match',  emoji: '🧠', class: 'MemoryGame' },
    pattern: { name: 'Tebak Pola',   emoji: '🎨', class: 'PatternGame' },
    puzzle:  { name: 'Puzzle Geser',  emoji: '🧩', class: 'PuzzleGame' },
  };

  // ---------- Initialization ----------
  function init() {
    loadProgress();
    createStarfield();
    bindEvents();
    updateMenuStars();
    console.log('🚀 BrainQuest initialized!');
  }

  // ---------- Starfield Generator ----------
  function createStarfield() {
    const container = document.getElementById('starsContainer');
    const starCount = 120;

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      const size = Math.random() * 3 + 1;
      star.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        --duration: ${Math.random() * 3 + 2}s;
        animation-delay: ${Math.random() * 5}s;
      `;
      container.appendChild(star);
    }

    // Add a couple shooting stars
    for (let i = 0; i < 2; i++) {
      const shooting = document.createElement('div');
      shooting.className = 'shooting-star';
      shooting.style.cssText = `
        top: ${Math.random() * 40}%;
        left: ${Math.random() * 40}%;
        animation-delay: ${Math.random() * 8 + i * 5}s;
        animation-duration: ${Math.random() * 2 + 2}s;
      `;
      container.appendChild(shooting);
    }
  }

  // ---------- Event Bindings ----------
  function bindEvents() {
    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.diff;
        playSound('click');
      });
    });

    // Game cards
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.dataset.game;
        startGame(gameId);
        playSound('click');
      });
    });

    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
      exitGame();
      playSound('click');
    });

    // Result buttons
    document.getElementById('retryBtn').addEventListener('click', () => {
      playSound('click');
      startGame(currentGame);
    });

    document.getElementById('menuBtn').addEventListener('click', () => {
      playSound('click');
      showScreen('menu');
    });
  }

  // ---------- Screen Navigation ----------
  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId + 'Screen');
    if (target) {
      target.classList.add('active');
      currentScreen = screenId;
    }
  }

  // ---------- Game Lifecycle ----------
  function startGame(gameId) {
    const gameInfo = games[gameId];
    if (!gameInfo) return;

    currentGame = gameId;

    // Update header
    document.getElementById('gameEmoji').textContent = gameInfo.emoji;
    document.getElementById('gameTitle').textContent = gameInfo.name;
    document.getElementById('gameScore').textContent = '0';
    document.getElementById('gameTimer').textContent = '--';

    // Clear previous game
    const container = document.getElementById('gameContent');
    container.innerHTML = '';

    // Show game screen
    showScreen('game');

    // Instantiate game
    const GameClass = window[gameInfo.class];
    if (GameClass) {
      currentGameInstance = new GameClass();
      currentGameInstance.init(container, currentDifficulty);
    } else {
      container.innerHTML = `
        <div class="question-container">
          <p class="question-text">⚠️ Game belum tersedia</p>
        </div>
      `;
    }
  }

  function exitGame() {
    if (currentGameInstance && currentGameInstance.destroy) {
      currentGameInstance.destroy();
    }
    currentGameInstance = null;
    showScreen('menu');
  }

  function endGame(score, maxScore) {
    if (currentGameInstance && currentGameInstance.destroy) {
      currentGameInstance.destroy();
    }
    currentGameInstance = null;

    // Calculate stars
    const ratio = score / maxScore;
    let stars = 0;
    if (ratio >= 0.9) stars = 3;
    else if (ratio >= 0.6) stars = 2;
    else if (ratio >= 0.3) stars = 1;

    // Save best
    const prevStars = gameStars[currentGame] || 0;
    if (stars > prevStars) {
      gameStars[currentGame] = stars;
      recalcTotalStars();
      saveProgress();
      updateMenuStars();
    }

    // Show result screen
    showResult(score, maxScore, stars);
  }

  function showResult(score, maxScore, stars) {
    // Emoji & title based on performance
    const resultEmoji = document.getElementById('resultEmoji');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');

    if (stars === 3) {
      resultEmoji.textContent = '🏆';
      resultTitle.textContent = 'Luar Biasa!';
      resultMessage.textContent = 'Kamu jenius! Sempurna sekali! 🌟';
    } else if (stars === 2) {
      resultEmoji.textContent = '🎉';
      resultTitle.textContent = 'Hebat!';
      resultMessage.textContent = 'Bagus sekali! Sedikit lagi sempurna!';
    } else if (stars === 1) {
      resultEmoji.textContent = '👍';
      resultTitle.textContent = 'Bagus!';
      resultMessage.textContent = 'Terus berlatih, kamu pasti bisa lebih baik!';
    } else {
      resultEmoji.textContent = '💪';
      resultTitle.textContent = 'Ayo Coba Lagi!';
      resultMessage.textContent = 'Jangan menyerah, latihan membuat sempurna!';
    }

    // Score display
    document.getElementById('resultScore').textContent = `${score}/${maxScore}`;

    // Stars animation
    const starEls = document.querySelectorAll('.result-star');
    starEls.forEach((el, i) => {
      el.classList.remove('earned');
      el.textContent = '☆';
      if (i < stars) {
        setTimeout(() => {
          el.textContent = '⭐';
          el.classList.add('earned');
          playSound('star');
        }, 300 + i * 300);
      }
    });

    showScreen('result');

    // Confetti for 2+ stars
    if (stars >= 2) {
      setTimeout(() => {
        for (let i = 0; i < 30; i++) {
          setTimeout(() => {
            createConfetti(
              Math.random() * window.innerWidth,
              Math.random() * window.innerHeight * 0.3
            );
          }, i * 50);
        }
        playSound('complete');
      }, 800);
    }
  }

  // ---------- Score Management ----------
  function recalcTotalStars() {
    totalStars = Object.values(gameStars).reduce((sum, s) => sum + s, 0);
    document.getElementById('totalStars').textContent = totalStars;
  }

  function updateMenuStars() {
    Object.keys(games).forEach(gameId => {
      const starContainer = document.getElementById(gameId + 'Stars');
      if (!starContainer) return;
      const earned = gameStars[gameId] || 0;
      let html = '';
      for (let i = 0; i < 3; i++) {
        if (i < earned) {
          html += '<span class="star-filled">⭐</span>';
        } else {
          html += '<span class="star-empty">☆</span>';
        }
      }
      starContainer.innerHTML = html;
    });
    document.getElementById('totalStars').textContent = totalStars;
  }

  // ---------- Persistence ----------
  function saveProgress() {
    try {
      localStorage.setItem('brainquest_stars', JSON.stringify(gameStars));
    } catch (e) { /* ignore */ }
  }

  function loadProgress() {
    try {
      const saved = localStorage.getItem('brainquest_stars');
      if (saved) {
        gameStars = JSON.parse(saved);
        recalcTotalStars();
      }
    } catch (e) { /* ignore */ }
  }

  // ---------- Sound Manager (Web Audio API) ----------
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playSound(type) {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.15, now);

      switch (type) {
        case 'click':
          osc.frequency.setValueAtTime(800, now);
          osc.type = 'sine';
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;

        case 'correct':
          osc.frequency.setValueAtTime(523, now);
          osc.frequency.setValueAtTime(659, now + 0.1);
          osc.frequency.setValueAtTime(784, now + 0.2);
          osc.type = 'sine';
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
          break;

        case 'wrong':
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.setValueAtTime(200, now + 0.15);
          osc.type = 'sawtooth';
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
          break;

        case 'complete':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523, now);
          osc.frequency.setValueAtTime(659, now + 0.1);
          osc.frequency.setValueAtTime(784, now + 0.2);
          osc.frequency.setValueAtTime(1047, now + 0.3);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
          break;

        case 'star':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
          break;

        default:
          osc.frequency.setValueAtTime(600, now);
          osc.type = 'sine';
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
      }
    } catch (e) {
      // Audio not supported
    }
  }

  // ---------- Confetti / Particles ----------
  function createConfetti(x, y) {
    const container = document.getElementById('particlesContainer');
    const emojis = ['🌟', '✨', '⭐', '🎉', '🎊', '💫', '🔥', '🌈'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = emoji;

    const tx = (Math.random() - 0.5) * 200;
    const ty = Math.random() * 300 + 100;
    const rot = (Math.random() - 0.5) * 720;
    const duration = Math.random() * 1 + 1;
    const size = Math.random() * 12 + 14;

    particle.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      --tx: ${tx}px;
      --ty: ${ty}px;
      --rot: ${rot}deg;
      --fall-duration: ${duration}s;
      --size: ${size}px;
    `;

    container.appendChild(particle);
    setTimeout(() => particle.remove(), duration * 1000);
  }

  // ---------- Helpers for Games ----------
  function updateScore(score) {
    document.getElementById('gameScore').textContent = score;
  }

  function updateTimer(timeStr) {
    document.getElementById('gameTimer').textContent = timeStr;
  }

  // ---------- Public API ----------
  return {
    init,
    endGame,
    playSound,
    createConfetti,
    updateScore,
    updateTimer,
    showScreen,
    get currentDifficulty() { return currentDifficulty; },
  };
})();

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', () => {
  GameApp.init();
});
