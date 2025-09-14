import { World } from "./world.js";

document.addEventListener("DOMContentLoaded", () => {
  // Generate World
  // Reminder: Create new Assets
  let world = new World();
  world.init(
    "viewport",
    "https://assets.codepen.io/6201207/codepen-iso-tilesheet.png"
  );

  let treasures = [];
  let landMine;
  let extraLife;

  generateCoordinates();

  console.log(`
        Coordinates

        Treasures : ${treasures} 
        landMine : ${landMine} 
        extraLife : ${extraLife} 
      `);

  function generateCoordinates() {
    let takenPositions = [];

    let treasure1 = generateUniqueCell(takenPositions);
    let treasure2 = generateUniqueCell(takenPositions);
    landMine = generateUniqueCell(takenPositions);
    extraLife = generateUniqueCell(takenPositions);

    treasures.push(treasure1, treasure2);
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

  // Click event
  world.canvas.ondblclick = (e) => {
    let [row, col] = world.onMouseMove(e);
    let coordinates = [row, col];

    // Check what item in the cell you clicked
    if (treasures.some((item) => arraysEqual(item, coordinates))) {
      world.tileMap[row][col] = 4;
    } else if (arraysEqual(landMine, coordinates)) {
      world.tileMap[row][col] = 5;
    } else if (arraysEqual(extraLife, coordinates)) {
      world.tileMap[row][col] = 2;
    } else {
      world.tileMap[row][col] = 3;
      world.shakeCanvasContext();
    }

    console.log(row, col);
  };
});
