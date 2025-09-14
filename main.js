import { World } from "./world.js";

document.addEventListener("DOMContentLoaded", () => {
  // Generate World (Reminder: create new assets)
  let world = new World();
  world.init(
    "viewport",
    "https://assets.codepen.io/6201207/codepen-iso-tilesheet.png"
  );

  const roundDisplay = document.querySelector("#round");
  const scoreDisplay = document.querySelector("#score");
  const timerDisplay = document.querySelector("#timer");
  const lifeDisplay = document.querySelector("#life");
  const cellDisplay = document.querySelector("#coordinates");
  const startButton = document.querySelector("#start");
  let score = 0;
  let round = 1;

  function startRound() {
    // start a new world
    world.buildMap();

    let treasures = [];
    let deathBomb = [];
    let extraLife = [];
    let lives = 2;
    let minedCells = [];
    let time = 10; // 10 seconds
    let timerInterval;

    [treasures, deathBomb, extraLife] = generateCoordinates();

    // Start a timer
    timerInterval = setInterval(() => {
      if (!time <= 0) {
        time--;
        timerDisplay.textContent = `Time Remaining: ${String(time).padStart(
          2,
          "0"
        )}`;
      } else {
        console.log("Times up!");

        treasures.forEach((treasure) => {
          if (minedCells.some((cell) => arraysEqual(cell, treasure))) {
            console.log("yey");
            advanceRound(1);
          }
        });

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
        checkMinedTreasures(0.5);
      } else if (arraysEqual(deathBomb, coordinates)) {
        // DeathBomb (1 hit delete)
        world.tileMap[row][col] = 5;
        world.shakeCanvasContext(20, 500);
        lives = 0;
        clearInterval(timerInterval);
        console.log("You Chose the Death Bomb! BOOOOM!");
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
          checkMinedTreasures(1);
        }
      }

      roundDisplay.textContent = `Round: ${round}`;
      scoreDisplay.textContent = `Score: ${score}`;
      lifeDisplay.textContent = `Life: ${lives}`;
    };

    function checkMinedTreasures(increment = 1) {
      // Check if both treasure items are in the mineCells, then proceed to the next round
      treasures.forEach((treasure) => {
        if (
          minedCells.length > 1 &&
          minedCells.some((cell) => arraysEqual(cell, treasure))
        )
          advanceRound(increment);
      });
    }

    function advanceRound(increment = 1) {
      // Next round
      setTimeout(() => {
        round += increment;
        clearInterval(timerInterval);
        startRound();
      }, 500);
    }
  }

  startButton.addEventListener("click", startRound);
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
