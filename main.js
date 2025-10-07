import { World } from "./world.js";
import soundManager from "./soundManager.js";

document.addEventListener("DOMContentLoaded", () => {
  // Variables
  const menu = document.querySelector("#menu");
  const roundDisplay = document.querySelector("#round");
  const scoreDisplay = document.querySelector("#score");
  const timerDisplay = document.querySelector("#timer");
  const lifeDisplay = document.querySelector("#life");
  const startButton = document.querySelector("#start");
  const playerInput = document.querySelector("#player");
  const leaderboardList = document.querySelector("#leaderboard-list");
  // Modal elements
  const gameModal = document.querySelector("#game-modal");
  const modalTitle = document.querySelector("#modal-title");
  const modalMessage = document.querySelector("#modal-message");
  const modalRestart = document.querySelector("#modal-restart");
  const scoreImg = document.querySelector("#score-img");
  const roundImg = document.querySelector("#round-img");
  const lifeImg = document.querySelector("#life-img");
  const timeImg = document.querySelector("#time-img");
  let score = 0;
  let round = 1;
  let player;

  playerInput.value = localStorage.getItem("player");

  // Modal helpers
  function showModal(title, message) {
    if (!gameModal) return;
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    gameModal.classList.remove("hidden");
  }

  function restartGame() {
    // Simple full reload will reset game state and start fresh
    location.reload();
  }

  // Restart button
  modalRestart?.addEventListener("click", restartGame);

  // Initial Leaderboard Generation
  generateLeaderboard();

  soundManager.loop("bg");

  // Startgame Event Listener
  startButton.addEventListener("click", () => {
    player = playerInput.value
      ? playerInput.value
      : `Guest${Math.floor(Math.random() * 999999)}`;

    localStorage.setItem("player", player);

    playerInput.disabled = true;
    playerInput.classList.add("hidden");
    menu.classList.add("hidden");

    // Start Round
    // Play start sound and background music
    soundManager.play("start");
    soundManager.loop("bg");

    startRound();
  });

  // Radial transition elements
  const radialContainer = document.querySelector("#radial-transition");

  function showRadialTransition(duration = 2000) {
    return new Promise((resolve) => {
      if (!radialContainer) return resolve();

      // Clear previous content
      radialContainer.innerHTML = "";
      radialContainer.classList.remove("radial-hidden");
      radialContainer.classList.add("radial-visible");

      const circle = document.createElement("div");
      circle.className = "radial-circle";
      radialContainer.appendChild(circle);

      // Start animation via inline style using keyframes
      circle.style.animation = `radialExpand ${duration}ms ease-in-out forwards`;

      // Resolve after animation
      setTimeout(() => {
        radialContainer.classList.remove("radial-visible");
        radialContainer.classList.add("radial-hidden");
        radialContainer.innerHTML = "";
        resolve();
      }, duration + 50);
    });
  }

  function startRound() {
    // Remove the cursor when in game
    document.body.style.cursor = "none";
    // Generate World
    let world = new World();
    let worldMultiplier = 4 + round;
    world.init("viewport", "./assets/videos/spritesheet.webm", worldMultiplier);
    // Generate Leaderboard
    generateLeaderboard();

    let treasures = [];
    let deathBomb = [];
    let extraLife = [];
    let lives = 4 + round;
    let minedCells = [];
    let time = 11; // 10 seconds
    let timerInterval;

    [treasures, deathBomb, extraLife] = generateCoordinates();

    // Start a timer
    timerInterval = setInterval(() => {
      timeImg.classList.add("animate-pulse");
      if (time > 0) {
        time--;
        timerDisplay.textContent = `${String(time).padStart(2, "0")}`;
      } else {
        // Check if atleast 1 treasure is mined
        if (
          treasures.some((t) => minedCells.some((cell) => arraysEqual(cell, t)))
        ) {
          advanceRound(1);
        } else {
          saveToLocalStorage();
          showModal("Timer Expired", "The timer expired, Game Over!");
          soundManager.play("lose");
          document.body.style.cursor = "auto";
        }

        clearInterval(timerInterval);
      }
    }, 1000);

    console.log(`
        Coordinates:
        Treasures: ${treasures}
        DeathBomb: ${deathBomb}
        ExtraLife: ${extraLife}
      `);

    roundDisplay.textContent = `${round}`;
    scoreDisplay.textContent = `${score}`;
    lifeDisplay.textContent = `${lives}`;

    // Main event listener
    world.canvas.onclick = (e) => {
      // Check if player still has lives
      if (lives <= 0) {
        return;
      }

      // Play click sound
      soundManager.play("click");

      let [row, col] = world.onMouseMove(e);
      let coordinates = [row, col];

      // Check if a cell is already mined
      if (minedCells.some((cell) => arraysEqual(cell, coordinates))) {
        // Already chosen: silently ignore and log (no modal required)
        console.log("Cell already chosen");
        return;
      }

      // Check what item in the cell the player clicked
      if (treasures.some((item) => arraysEqual(item, coordinates))) {
        // Treasure
        world.tileMap[row][col] = 27;
        minedCells.push(coordinates);
        score++;
        scoreImg.classList.add("animate-ping");
        setTimeout(() => {
          scoreImg.classList.remove("animate-ping");
        }, 500);
        soundManager.play("treasure");
        checkMinedTreasures();
      } else if (arraysEqual(deathBomb, coordinates)) {
        // DeathBomb (1 hit delete)
        world.tileMap[row][col] = 28;
        world.shakeCanvasContext(20, 500);
        lives = 0;
        clearInterval(timerInterval);
        soundManager.play("nuclear");

        setTimeout(() => {
          document.body.style.cursor = "auto";
          showModal("Death Bomb!", "You chose the Death Bomb. Game over.");
          soundManager.stop("bg");
          soundManager.play("lose");
        }, 1500);

        saveToLocalStorage();
      } else if (arraysEqual(extraLife, coordinates)) {
        // Extra Life
        world.tileMap[row][col] = 26;
        lives++;
        minedCells.push(coordinates);
        soundManager.play("life");
      } else {
        // Default bomb
        world.tileMap[row][col] = 25;
        world.shakeCanvasContext(3);
        lives--;
        lifeImg.classList.add("animate-ping");
        setTimeout(() => {
          lifeImg.classList.remove("animate-ping");
        }, 500);
        minedCells.push(coordinates);
        soundManager.play("bomb");
        if (lives <= 0) {
          // Clear the timer immediately when lives reach 0
          clearInterval(timerInterval);

          // Check if any treasures were mined before losing all lives
          const minedTreasures = treasures.filter((t) =>
            minedCells.some((cell) => arraysEqual(cell, t))
          );

          if (minedTreasures.length === 0) {
            // Lost all lives without mining any treasures - game over
            showModal(
              "Game Over!",
              "You lost all your lives without finding any treasures!"
            );
            soundManager.stop("bg");
            soundManager.play("lose");
            saveToLocalStorage();
            document.body.style.cursor = "auto";
            return;
          } else {
            advanceRound();
          }
        }
      }

      roundDisplay.textContent = `${round}`;
      scoreDisplay.textContent = `${score}`;
      lifeDisplay.textContent = `${lives}`;
    };

    function checkMinedTreasures() {
      // Check if both treasure items are in the mineCells, then proceed to the next round
      if (
        treasures.every((t) => minedCells.some((cell) => arraysEqual(cell, t)))
      ) {
        // stop background briefly and play start for next round transition
        soundManager.play("start");
        advanceRound();
      } else {
        saveToLocalStorage();
      }
    }

    function advanceRound() {
      // Next round with radial transition
      setTimeout(async () => {
        clearInterval(timerInterval);
        await showRadialTransition();
        roundImg.classList.add("animate-ping");
        setTimeout(() => {
          roundImg.classList.remove("animate-ping");
        }, 500);
        round++;
        startRound();
      }, 500);
    }

    function saveToLocalStorage() {
      let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

      let existing = leaderboard.find((entry) => entry.name === player);

      if (existing) {
        existing.score = score;
        existing.round = round;
      } else {
        leaderboard.push({ name: player, score, round });
      }

      leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);

      localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
    }
  }

  function generateLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

    leaderboardList.innerHTML = "";

    leaderboard.forEach((entry, index) => {
      let leaderboardEntry = document.createElement("li");
      leaderboardEntry.textContent = `${index + 1}. ${entry.name} reached ${entry.round
        } round/s and got a score of ${entry.score}`;
      leaderboardList.appendChild(leaderboardEntry);
    });
  }

  function generateCoordinates() {
    let takenPositions = [];
    let treasures = [];
    let treasureCount = 10 + round * 2;

    for (let i = 0; i < treasureCount; i++) {
      treasures.push(generateUniqueCell(takenPositions));
    }

    let deathBomb = generateUniqueCell(takenPositions);
    let extraLife = generateUniqueCell(takenPositions);

    return [treasures, deathBomb, extraLife];
  }

  function generateRandomCell() {
    return [
      Math.floor(Math.random(0) * (round + 4)),
      Math.floor(Math.random(0) * (round + 4)),
    ];
  }

  function generateUniqueCell(takenPositions) {
    let cell;
    do {
      cell = generateRandomCell();
    } while (takenPositions.some((item) => arraysEqual(item, cell)));
    takenPositions.push(cell);
    return cell;
  }

  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => val === b[i]);
  }
});
