import { World } from "./world.js";

document.addEventListener("DOMContentLoaded", () => {
  // Generate World (Reminder: create new assets)
  let world = new World();
  world.init(
    "viewport",
    "https://assets.codepen.io/6201207/codepen-iso-tilesheet.png"
  );

  // Variables
  const roundDisplay = document.querySelector("#round");
  const scoreDisplay = document.querySelector("#score");
  const timerDisplay = document.querySelector("#timer");
  const lifeDisplay = document.querySelector("#life");
  const cellDisplay = document.querySelector("#coordinates");
  const startButton = document.querySelector("#start");
  const playerInput = document.querySelector("#player");
  const leaderboardList = document.querySelector("#leaderboard-list");
  let score = 0;
  let round = 1;
  let player;

  // Initial Leaderboard Generation
  generateLeaderboard();

  // Startgame Event Listener
  startButton.addEventListener("click", () => {
    player = playerInput.value
      ? playerInput.value
      : `Guest${Math.floor(Math.random() * 999999)}`;

    playerInput.disabled = true;
    playerInput.classList.add("hidden");

    // Start Round
    startRound();
  });

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
        timerDisplay.textContent = `Time Remaining: ${String(time).padStart(
          2,
          "0"
        )}`;
      } else {
        console.log("Times up!");

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

    // UI Display
    cellDisplay.textContent = `
        Treasures : [${treasures}] 
        deathBomb : [${deathBomb}] 
        extraLife : [${extraLife}]
      `;
    roundDisplay.textContent = `Round: ${round}`;
    scoreDisplay.textContent = `Score: ${score}`;
    lifeDisplay.textContent = `Life: ${lives}`;

    // Main event listener
    world.canvas.ondblclick = (e) => {
      // Check if you player still has remaining lives
      if (lives <= 0) {
        console.log("You Lost!");
        return;
      }

      let [row, col] = world.onMouseMove(e);
      let coordinates = [row, col];

      // Check if a cell is already mined
      if (minedCells.some((cell) => arraysEqual(cell, coordinates))) {
        console.log("You already chose this cell");
        return;
      }

      // Check what item in the cell the player clicked
      if (treasures.some((item) => arraysEqual(item, coordinates))) {
        // Treasure
        world.tileMap[row][col] = 4;
        minedCells.push(coordinates);
        score++;
        checkMinedTreasures();
      } else if (arraysEqual(deathBomb, coordinates)) {
        // DeathBomb (1 hit delete)
        world.tileMap[row][col] = 5;
        world.shakeCanvasContext(20, 500);
        lives = 0;
        clearInterval(timerInterval);
        console.log("You Chose the Death Bomb! BOOOOM!");
        saveToLocalStorage();
      } else if (arraysEqual(extraLife, coordinates)) {
        // Extra Life
        world.tileMap[row][col] = 2;
        lives++;
        minedCells.push(coordinates);
      } else {
        // Default bomb
        world.tileMap[row][col] = 3;
        world.shakeCanvasContext(3);
        lives--;
        minedCells.push(coordinates);
        if (lives == 0) {
          checkMinedTreasures();
        }
      }

      roundDisplay.textContent = `Round: ${round}`;
      scoreDisplay.textContent = `Score: ${score}`;
      lifeDisplay.textContent = `Life: ${lives}`;
    };

    function checkMinedTreasures() {
      // Check if both treasure items are in the mineCells, then proceed to the next round
      if (
        treasures.every((t) => minedCells.some((cell) => arraysEqual(cell, t)))
      ) {
        advanceRound();
      } else {
        saveToLocalStorage();
      }
    }

    function advanceRound() {
      // Next round
      setTimeout(() => {
        round++;
        clearInterval(timerInterval);
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

// Utility Functions
function generateCoordinates() {
  let takenPositions = [];

  let treasure1 = generateUniqueCell(takenPositions);
  let treasure2 = generateUniqueCell(takenPositions);
  let deathBomb = generateUniqueCell(takenPositions);
  let extraLife = generateUniqueCell(takenPositions);

  return [[treasure1, treasure2], deathBomb, extraLife];
}

function generateRandomCell() {
  return [Math.floor(Math.random(0) * 3), Math.floor(Math.random(0) * 3)];
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
