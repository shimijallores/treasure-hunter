import { World } from "./world.js";
import soundManager from "./soundManager.js";

document.addEventListener("DOMContentLoaded", () => {
  // Generate World
  let world = new World();
  world.init("viewport", "./assets/videos/spritesheet.webm");

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
  let score = 0;
  let round = 1;
  let player;

  // Modal helpers
  function showModal(title, message) {
    if (!gameModal) return;
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    gameModal.classList.remove("hidden");
  }

  function closeModal() {
    if (!gameModal) return;
    gameModal.classList.add("hidden");
  }

  function restartGame() {
    // Simple full reload will reset game state and start fresh
    location.reload();
  }

  // Restart button
  modalRestart?.addEventListener("click", restartGame);
  // Keep ability to close by clicking backdrop
  gameModal?.addEventListener("click", (e) => {
    if (
      e.target === gameModal ||
      e.target.classList.contains("modal-backdrop")
    ) {
      closeModal();
    }
  });

  // Initial Leaderboard Generation
  generateLeaderboard();

  soundManager.loop("bg");

  // Startgame Event Listener
  startButton.addEventListener("click", () => {
    player = playerInput.value
      ? playerInput.value
      : `Guest${Math.floor(Math.random() * 999999)}`;

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

  function showRadialTransition(duration = 800) {
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
    // start a new world
    world.buildMap();
    // Generate Leaderboard
    generateLeaderboard();

    let treasures = [];
    let deathBomb = [];
    let extraLife = [];
    let lives = 2;
    let minedCells = [];
    let time = 11; // 10 seconds
    let timerInterval;

    [treasures, deathBomb, extraLife] = generateCoordinates();

    // Start a timer
    timerInterval = setInterval(() => {
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
    world.canvas.ondblclick = (e) => {
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
        soundManager.play("treasure");
        checkMinedTreasures();
      } else if (arraysEqual(deathBomb, coordinates)) {
        // DeathBomb (1 hit delete)
        world.tileMap[row][col] = 28;
        world.shakeCanvasContext(20, 500);
        lives = 0;
        clearInterval(timerInterval);
        showModal("Death Bomb!", "You chose the Death Bomb. Game over.");
        soundManager.play("nuclear");
        soundManager.stop("bg");
        soundManager.play("lose");
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
      leaderboardEntry.textContent = `${index + 1}. ${entry.name} reached ${
        entry.round
      } round/s and got a score of ${entry.score}`;
      leaderboardList.appendChild(leaderboardEntry);
    });
  }
});

function generateCoordinates() {
  let takenPositions = [];
  let treasures = [];
  let treasureCount = 10;

  for (let i = 0; i < treasureCount; i++) {
    treasures.push(generateUniqueCell(takenPositions));
  }

  let deathBomb = generateUniqueCell(takenPositions);
  let extraLife = generateUniqueCell(takenPositions);

  return [treasures, deathBomb, extraLife];
}

function generateRandomCell() {
  return [Math.floor(Math.random(0) * 5), Math.floor(Math.random(0) * 5)];
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
