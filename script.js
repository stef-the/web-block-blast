window.addEventListener("load", () => {
  const canvas = createCanvasElement();
  const canvasContainer = document.getElementById("canvas-container");
  canvasContainer.appendChild(canvas);

  // format the shape container and draw grid
  handleOnResize();
  loadShapes();
  setRandomShapes();

  // set event listeners for the shapes
  const shapes = document.getElementsByClassName("shape");
  for (let i = 0; i < shapes.length; i++) {
    setShapeEventListeners(shapes[i]);
  }

  canvas.addEventListener("dragover", canvasDragOver);
  document
    .getElementById("color-palette")
    .addEventListener("click", updateColorPalette);
});

window.addEventListener("resize", handleOnResize);
window.addEventListener("mousemove", handleOnMouseMove);
window.addEventListener("click", handleOnMouseClick);

// ------------------------------------
// Global Variables
// ------------------------------------

// fetch url parameters
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const globalGridSize = urlParams.get("gridSize") ?? 8;

// cell data
let cells = [];
let cellColors = [];

// drag and drop variables
let dragging = false;
let globalOffsetX = 0;
let globalOffsetY = 0;
let globalShapeIndex = 0;
let globalRotations = 0;
let globalColor = "#000";

// game variables
let score = 0;
let streak = 0;
let streakLives = 0;
let highScore = getCookie("highScore") ?? 0;

// ------------------------------------
// Shape Colors
// ------------------------------------

const bbPalette = [
  "#bb0000",
  "#00bb00",
  "#0000bb",
  "#bbbb00",
  "#bb00bb",
  "#00bbbb",
];

const redsPalette = ["#09122C", "#872341", "#BE3144", "#E17564"];

const beachPalette = ["#16C47F", "#FFD65A", "#FF9D23", "#F93827"];

const sweetAndSour = [
  "#979596",
  "#a5bcbd",
  "#e7e3c7",
  "#f5b97b",
  "#ed8978",
  "#a45259",
  "#643159",
  "#816b24",
  "#96af2e",
  "#469852",
  "#b967ad",
  "#6950d1",
  "#7e94db",
  "#9bcea6",
  "#5bada6",
  "#127687",
  "#0a4684",
  "#181c38",
  "#5a4342",
  "#686a69",
];

const nordPalette = [
  "#8fbcbb",
  "#88c0d0",
  "#81a1c1",
  "#5e81ac",
  "#bf616a",
  "#d08770",
  "#ebcb8b",
  "#a3be8c",
  "#b48ead",
];

const SLSO8Palette = [
  "#0d2b45",
  "#203c56",
  "#544e68",
  "#8d697a",
  "#d08159",
  "#ffaa5e",
  "#ffd4a3",
  "#ffecd6",
];

const colorPalettes = {
  Default: bbPalette,
  Reds: redsPalette,
  Beach: beachPalette,
  "Sweet and Sour": sweetAndSour,
  Nord: nordPalette,
  SLSO8: SLSO8Palette,
};

// set the shape colors
let currentPalette =
  getCookie("colorPalette") === "" ? "Default" : getCookie("colorPalette");
let shapeColors = colorPalettes[currentPalette];

// ------------------------------------
// score and streak text
// ------------------------------------

updateSpanText("score", `${score}`);
updateSpanText("streak", `Streak: ${streak}`);
//updateSpanText("streak-lives", `Streak Lives: ${streakLives}`);
//updateSpanText("high-score", `High Score: ${highScore}`);
updateSpanText("color-palette", `Colour Palette: ${currentPalette}`);

// ------------------------------------
// Helper Functions
// ------------------------------------

// get all indexes of a value in an array
function getAllIndexes(arr, val) {
  var indexes = [],
    i;
  for (i = 0; i < arr.length; i++) if (arr[i] === val) indexes.push(i);
  return indexes;
}

// includes() for nested arrays
function includesArray(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].length !== target.length) {
      continue;
    }
    if (arr[i].every((v, j) => v === target[j])) {
      return true;
    }
  }
  return false;
}

// update text content of a span by id
function updateSpanText(id, text) {
  document.getElementById(id).textContent = text;
}

// update text content of a span by id with a number
// animate the number change (increasing or decreasing)
// over a specified time in milliseconds
function updateSpanTextNumber(id, number, time) {
  const span = document.getElementById(id);
  const start = parseInt(span.textContent);
  const increment = number - start;
  const step = increment / (time / 10);
  let current = start;

  const interval = setInterval(() => {
    current += step;
    span.textContent = Math.round(current);
    if (current >= number) {
      clearInterval(interval);
    }
  }, 10);
}

// set a cookie with a name, value, and expiration in days
function setCookie(cname, cvalue, exdays = 365) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

// get a cookie by name
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

// ------------------------------------
// Color Palette Functions
// ------------------------------------

// convert hex color to rgb
hexToRgb = (hex) => {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  return [r, g, b];
};

// format rgb color string
rgbToRgb = (rgb) => {
  return rgb.split("(")[1].split(")")[0].split(",");
};

// convert hex color to hsl
hexToHsl = (hex) => {
  let rgb = hexToRgb(hex);
  return rgbToHsl(rgb);
};

// convert rgb color to hsl hue
function rgbToHue(rgb) {
  let r = rgb[0] / 255;
  let g = rgb[1] / 255;
  let b = rgb[2] / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  const c = max - min;
  let hue;
  if (c == 0) {
    hue = 0;
  } else {
    switch (max) {
      case r:
        var segment = (g - b) / c;
        var shift = 0 / 60; // R° / (360° / hex sides)
        if (segment < 0) {
          // hue > 180, full rotation
          shift = 360 / 60; // R° / (360° / hex sides)
        }
        hue = segment + shift;
        break;
      case g:
        var segment = (b - r) / c;
        var shift = 120 / 60; // G° / (360° / hex sides)
        hue = segment + shift;
        break;
      case b:
        var segment = (r - g) / c;
        var shift = 240 / 60; // B° / (360° / hex sides)
        hue = segment + shift;
        break;
    }
  }
  return hue * 60; // hue is in [0,6], scale it up
}

// convert rgb to hsl
rgbToHsl = (rgb) => {
  let r = rgb[0] / 255;
  let g = rgb[1] / 255;
  let b = rgb[2] / 255;

  const hue = rgbToHue(rgb);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  const l = (max + min) / 2;

  let s = 0;

  if (max != min) {
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  }

  return [hue, s * 100, l * 100];
};

// get luma value of a hex color
function getLuma(rgb) {
  // per ITU-R BT.709
  const lumaValue = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return lumaValue;
}

// ------------------------------------
// Global Event Handlers
// ------------------------------------

// handles the window resize event
// centers the canvas element on the screen
function handleOnResize() {
  const canvas = document.getElementById("canvas");

  // make sure canvas size is as large as possible without overflowing the screen
  // canvas is always square and centered, size is determined by the smaller dimension of the window
  // canvas size is 80% of the smaller dimension of the window
  // if using window.innerHeight, subtract the height and padding of the shape container
  let minHeight =
    window.innerHeight * 0.8 -
    document.getElementById("shape-container").clientHeight;
  const canvasSize = Math.min(window.innerWidth, minHeight) * 0.8;

  // calculate cell size
  const cellSize = canvasSize / globalGridSize;

  canvas.width = canvasSize;
  canvas.height = canvasSize;

  // canvas size setup and centering
  canvas.style.width = `${canvasSize}px`;
  canvas.style.height = `${canvasSize}px`;
  canvas.style.left = `${(window.innerWidth - canvasSize) / 2}px`;

  drawFullGrid(globalGridSize);

  // format the shape container
  const shapeContainer = document.getElementById("shape-container");
  shapeContainer.style.width = `${canvasSize - 2}px`;
  shapeContainer.style.height = `${cellSize * 4 - 2}px`;
  shapeContainer.style.left = `${(window.innerWidth - canvasSize) / 2}px`;

  updateShapes(); // update shapes
}

// handles the global mouse move event
// displays the cell index in the console
function handleOnMouseMove(event) {
  const gridSize = globalGridSize;
  const canvas = document.getElementById("canvas");

  // get the mouse position relative to the canvas
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // find the cell index based on the mouse position
  const cellIndex = findCellIndex(mouseX, mouseY, gridSize);

  // hightlight hovered cell only if it isn't already colored
  // unhighlight the cell if mouse is outside the canvas or cell is already colored
  // don't highlight if a block is being dragged
  if (cellIndex && !dragging) {
    if (!includesArray(cells, cellIndex)) {
      drawFullGrid(gridSize);
      fillCell(cellIndex, "#c0c0c0", gridSize, false);
    }
  } else {
    drawFullGrid(gridSize);
  }
}

// handles the global mouse click event
// fills the cell with a color
function handleOnMouseClick(event) {
  const gridSize = globalGridSize;
  const canvas = document.getElementById("canvas");

  // get the mouse position relative to the canvas
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // find the cell index based on the mouse position
  const cellIndex = findCellIndex(mouseX, mouseY, gridSize);

  // if the cell index is valid, fill the cell with a color
  console.log("click:", cellIndex);
}

// ------------------------------------
// Canvas Functions
// ------------------------------------

// creates a canvas element and appends it to the body
// returns the canvas element
function createCanvasElement() {
  const canvas = document.createElement("canvas");
  const shapeContainer = document.getElementById("shape-container");
  canvas.id = "canvas";

  // canvas is always square
  // size is determined by the smaller dimension of the window
  let minHeight =
    window.innerHeight * 0.8 -
    document.getElementById("shape-container").clientHeight;
  const canvasSize = Math.min(window.innerWidth, minHeight) * 0.8;
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  // canvas size setup and centering
  canvas.style.width = `${canvasSize}px`;
  canvas.style.height = `${canvasSize}px`;
  canvas.style.left = `${(window.innerWidth - canvasSize) / 2}px`;

  // add a border
  canvas.style.border = "1px solid #aaa";

  return canvas;
}

// draws the full grid with all cells
function drawFullGrid(gridSize = 8) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // begin by clearing the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw all the cells
  for (let i = 0; i < cells.length; i++) {
    fillCell(cells[i], cellColors[i], gridSize);
  }

  // draw the grid lines
  drawCanvasGrid(gridSize);
}

// draw canvas elements (square grid)
function drawCanvasGrid(gridSize = 8) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const canvasSize = canvas.width; // fetch canvas width to prevent resizing

  // calculate cell size
  const cellSize = canvasSize / gridSize;

  // draw grid lines
  ctx.beginPath();
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 2;

  // vertical lines
  for (let i = 0; i <= gridSize; i++) {
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvasSize);
  }

  // horizontal lines
  for (let i = 0; i <= gridSize; i++) {
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvasSize, i * cellSize);
  }

  ctx.stroke();
}

// ------------------------------------
// Cell Functions
// ------------------------------------

// find the cell index based on the mouse position
function findCellIndex(mouseX, mouseY, gridSize) {
  let minHeight =
    window.innerHeight * 0.8 -
    document.getElementById("shape-container").clientHeight;
  const canvasSize = Math.min(window.innerWidth, minHeight) * 0.8;
  const cellSize = canvasSize / gridSize;

  const cellX = Math.floor(mouseX / cellSize);
  const cellY = Math.floor(mouseY / cellSize);

  if (cellX < 0 || cellX >= gridSize || cellY < 0 || cellY >= gridSize) {
    return null;
  }
  return [cellX, cellY];
}

// fills in a cell with a color
function fillCell(cellIndex, color, gridSize = 8, outline = true) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  let cellBorder = 10;

  const canvasSize = canvas.width; // fetch canvas width to prevent resizing
  const cellSize = canvasSize / gridSize;

  // convert color to hsl
  const hslColor = hexToHsl(color);

  // get the cell index
  const cellX = cellIndex[0];
  const cellY = cellIndex[1];

  if (outline) {
    // draw outer border (two triangles)

    // top left triangle
    ctx.beginPath();
    ctx.moveTo(cellX * cellSize, cellY * cellSize);
    ctx.lineTo(cellX * cellSize, (cellY + 1) * cellSize);
    ctx.lineTo((cellX + 1) * cellSize, cellY * cellSize);
    ctx.closePath();

    // fill the triangle
    ctx.fillStyle = `hsl(${hslColor[0]}, ${hslColor[1]}%, ${hslColor[2] + 5}%)`;
    ctx.fill();

    // bottom right triangle
    ctx.beginPath();
    ctx.moveTo((cellX + 1) * cellSize, (cellY + 1) * cellSize);
    ctx.lineTo(cellX * cellSize, (cellY + 1) * cellSize);
    ctx.lineTo((cellX + 1) * cellSize, cellY * cellSize);
    ctx.closePath();

    // fill the triangle
    ctx.fillStyle = `hsl(${hslColor[0]}, ${hslColor[1]}%, ${hslColor[2] - 5}%)`;
    ctx.fill();
  } else cellBorder = 0;

  // draw inner rectangle
  ctx.fillStyle = `hsl(${hslColor[0]}, ${hslColor[1]}%, ${hslColor[2]}%)`;
  ctx.fillRect(
    cellX * cellSize + cellBorder,
    cellY * cellSize + cellBorder,
    cellSize - cellBorder * 2,
    cellSize - cellBorder * 2
  );
}

// remove colored cells
function removeColoredCells(color) {
  for (let i = 0; i < cells.length; i++) {
    if (cellColors[i] === color) {
      cells.splice(i, 1);
      cellColors.splice(i, 1);
    }
  }
}

// ------------------------------------
// Shape Functions
// ------------------------------------

// load 3 shapes into shape container
function loadShapes() {
  const shapeContainer = document.getElementById("shape-container");
  const shapes = ["shape1", "shape2", "shape3"];

  for (let i = 0; i < shapes.length; i++) {
    const shape = document.createElement("div");
    shape.id = shapes[i];
    shape.className = "shape";
    shapeContainer.appendChild(shape);
  }

  updateShapes();
}

// draw a shape into a div element using canvas
function drawShape(shape, divId, color) {
  const div = document.getElementById(divId);
  const canvas = document.createElement("canvas");

  // set canvas class
  canvas.classList.add("shapeCanvas");

  div.appendChild(canvas);

  // get canvas context
  const ctx = canvas.getContext("2d");

  // fetch cellsize from the big canvas grid
  const canvasSize = document.getElementById("canvas").width;
  const gridSize = globalGridSize;
  const cellSize = (canvasSize / gridSize) * 0.8;

  // set canvas size
  canvas.width = cellSize * shape[0].length;
  canvas.height = cellSize * shape.length;

  // draw the shape
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j] === 1) {
        // random shape color by default, set in arguments
        // fetch hsl color
        let hslColor = hexToHsl(color);

        // draw outline (two triangles)
        border = 8;

        // top left triangle
        ctx.beginPath();
        ctx.moveTo(j * cellSize, i * cellSize);
        ctx.lineTo(j * cellSize, (i + 1) * cellSize);
        ctx.lineTo((j + 1) * cellSize, i * cellSize);
        ctx.closePath();

        // fill the top left triangle
        ctx.fillStyle = `hsl(${hslColor[0]}, ${hslColor[1]}%, ${
          hslColor[2] + 5
        }%)`;
        ctx.fill();

        // bottom right triangle
        ctx.beginPath();
        ctx.moveTo((j + 1) * cellSize, (i + 1) * cellSize);
        ctx.lineTo(j * cellSize, (i + 1) * cellSize);
        ctx.lineTo((j + 1) * cellSize, i * cellSize);
        ctx.closePath();

        // fill the bottom right triangle
        ctx.fillStyle = `hsl(${hslColor[0]}, ${hslColor[1]}%, ${
          hslColor[2] - 5
        }%)`;
        ctx.fill();

        // draw inner rectangle
        ctx.fillStyle = `hsl(${hslColor[0]}, ${hslColor[1]}%, ${hslColor[2]}%)`;
        ctx.fillRect(
          j * cellSize + border,
          i * cellSize + border,
          cellSize - border * 2,
          cellSize - border * 2
        );
      }
    }
  }
}

// rotate a shape list by 90 degrees
function rotateShape(shape) {
  const newShape = [];

  for (let i = 0; i < shape[0].length; i++) {
    const newRow = [];
    for (let j = shape.length - 1; j >= 0; j--) {
      newRow.push(shape[j][i]);
    }
    newShape.push(newRow);
  }

  return newShape;
}

// update shapes on resize and other
function updateShapes() {
  const shapeContainer = document.getElementById("shape-container");
  const shapes = document.getElementsByClassName("shape");

  for (let i = 0; i < shapes.length; i++) {
    // update shape div dimensions
    shapes[i].style.width = `${shapeContainer.clientHeight * 0.8}px`;
    shapes[i].style.height = `${shapeContainer.clientHeight * 0.8}px`;
    shapes[i].style.marginTop = `${shapeContainer.clientHeight * 0.1}px`;

    // center the canvas within the div if it exists
    if (shapes[i].getElementsByTagName("canvas").length > 0) {
      let canvas = shapes[i].getElementsByTagName("canvas")[0];
      canvas.style.top = `${(shapes[i].clientHeight - canvas.height) / 2}px`;
      canvas.style.left = `${(shapes[i].clientWidth - canvas.width) / 2}px`;
    }
  }
}

// make all shapes draggable
function setShapeEventListeners(shape) {
  const shapeCanvas = shape.firstChild;

  // make the shape draggable
  shapeCanvas.setAttribute("draggable", "true");

  shapeCanvas.shape = shape;

  shapeCanvas.addEventListener("dragstart", shapeDragStart);
  shapeCanvas.addEventListener("dragend", shapeDragEnd);
  shapeCanvas.addEventListener("ondrop", shapeOnDrop);
}

// set random shapes in the shape container
function setRandomShapes() {
  const shapes = document.getElementsByClassName("shape");
  for (let i = 0; i < shapes.length; i++) {
    const shapeIndex = Math.floor(Math.random() * shapeBlueprints.length);
    let shape = shapeBlueprints[shapeIndex];

    // rotate the shape randomly from 0 to 3 times
    const rotations = Math.floor(Math.random() * 4);
    for (let j = 0; j < rotations; j++) {
      shape = rotateShape(shape);
    }

    const shapeColor =
      shapeColors[Math.floor(Math.random() * shapeColors.length)];

    // draw the shape in the canvas
    drawShape(shape, shapes[i].id, shapeColor);

    // set the shape index, rotations, and color as data
    shapes[i].firstChild.setAttribute("data-shape-index", shapeIndex);
    shapes[i].firstChild.setAttribute("data-rotations", rotations);
    shapes[i].firstChild.setAttribute("data-color", shapeColor);
  }
}

function shapeDragStart(event) {
  dragging = true;
  const shape = event.currentTarget.shape;
  const shapeCanvas = shape.firstChild;

  // set the shape index as data
  globalShapeIndex = shapeCanvas.getAttribute("data-shape-index");

  // set the number of rotations as data
  globalRotations = shapeCanvas.getAttribute("data-rotations");

  // set the shape color as data
  globalColor = shapeCanvas.getAttribute("data-color");

  // get difference between mouse position and top left corner of the shape
  const rect = shapeCanvas.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  // set the offset data
  globalOffsetX = offsetX;
  globalOffsetY = offsetY;

  // hide the shape in the shape container but not the dragged shape
  // to do this we add visibility hidden to the shape container 1ms after the drag start
  window.requestAnimationFrame(() => {
    shape.style.visibility = "hidden";
  }, 1);
}

function shapeDragEnd(event) {
  // set dragging to false and show the shape in the shape container
  dragging = false;
  const shapeElement = event.currentTarget.shape;
  shapeElement.style.visibility = "";

  // get the shape index, rotations, and color from the dataTransfer
  const shapeIndex = globalShapeIndex;
  const shapeRotations = globalRotations;
  const shapeColor = globalColor;

  let shape = shapeBlueprints[shapeIndex];

  // get the original score before updating to compare
  const originalScore = score;

  // rotate the shape based on the number of rotations
  for (let i = 0; i < shapeRotations; i++) {
    shape = rotateShape(shape);
  }

  // get the offset from the data
  const offsetX = globalOffsetX;
  const offsetY = globalOffsetY;

  // get the number of cells before the shape was placed
  let cellDiff = cells.length;

  // draw the shape in the canvas using top left corner of the shape
  const success = canvasDrawShape(
    shape,
    findRelativeCellIndex(event.clientX - offsetX, event.clientY - offsetY),
    (color = shapeColor)
  );

  // remove the shape from the shape container if it was placed successfully
  // clear lines if any were formed and update the score
  // regenerate all shapes if all shapes have been placed
  if (success) {
    // remove the shape from the shape container
    const shapeCanvas = shapeElement.firstChild;
    shapeCanvas.remove();

    // check for full lines and clear them
    const linesCleared = clearLines();

    // redraw the grid
    drawFullGrid(globalGridSize);

    // update score by 1 point per placed cell
    score += cells.length - cellDiff;

    // update the score and streak
    if (linesCleared > 0) {
      // increment streak if lines were cleared
      // if the streak was 0, set it to -1 to start the streak
      // if the streak was -1, set it to the number of lines cleared
      // otherwise, increment the streak by the number of lines cleared
      if (streak === 0) {
        streak = -1;
      } else if (streak === -1) {
        streak = linesCleared;
      } else {
        streak += linesCleared;
      }
      // add to the score based on the number of lines cleared and the streak
      score += linesCleared * 10 * (streak + 3);
      console.log(
        streak >= 0 ? linesCleared * 10 * (streak + 1) : linesCleared * 10
      );
      // set streak lives to 3
      streakLives = 3;
    } else {
      // decrement streak lives if no lines were cleared
      if (streak > 0) streakLives--;
      // reset the streak if no lines were cleared and the streak lives are 0
      if (streakLives === 0) streak = 0;
    }

    // update the score and streak text
    updateSpanTextNumber("score", `${score}`, 500);
    updateSpanText("streak", `Streak: ${streak > 0 ? streak : 0}`);
    //updateSpanText("streak-lives", `Streak Lives: ${streakLives}`);

    if (score > highScore) {
      highScore = score;
      setCookie("highScore", highScore);
      //updateSpanText("high-score", `High Score: ${highScore}`);
    }

    // check if all three shapes have been placed
    let shapes = document.getElementsByClassName("shapeCanvas");
    if (shapes.length === 0) {
      // set random shapes in the shape container
      setRandomShapes();

      // add event listeners to the new shapes
      setShapeEventListeners(document.getElementById("shape1"));
      setShapeEventListeners(document.getElementById("shape2"));
      setShapeEventListeners(document.getElementById("shape3"));
    }
  }
  // animate the points alert
  if (score > originalScore) {
    // get mouse x and y
    let offsetX = event.clientX - 10;
    let offsetY = event.clientY - 30;
    animateAlert(
      `+${score - originalScore}`,
      (destination = null),
      (offsetX = offsetX),
      (offsetY = offsetY),
      (id = "points-alert"),
      (random = true),
      (customColor = shapeColor)
    );
  }
}

function shapeOnDrop(event) {
  const shape = event.currentTarget.shape;
  event.preventDefault();
  const shapeIndex = shape.firstChild.getAttribute("data-shape-index");
  const shapeRotations = shape.firstChild.getAttribute("data-rotations");
  const shapeBlueprint = shapeBlueprints[shapeIndex];

  // rotate the shape based on the number of rotations
  for (let i = 0; i < shapeRotations; i++) {
    shapeBlueprint = rotateShape(shapeBlueprint);
  }

  // draw the shape in the canvas using top left corner of the shape
  canvasDrawShape(
    shapeBlueprint,
    findRelativeCellIndex(event.clientX, event.clientY)
  );
  shape.classList.remove("hidden");
}

const shapeBlueprints = [
  // shape 1: L right
  [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  // shape 2: L left
  [
    [0, 1],
    [0, 1],
    [1, 1],
  ],
  // shape 3: square
  [
    [1, 1],
    [1, 1],
  ],
  // shape 4: T
  [
    [1, 1, 1],
    [0, 1, 0],
  ],
  // shape 5: I (4)
  [[1], [1], [1], [1]],
  // shape 6: Z right
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  // shape 7: Z left
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  // shape 8: I (5)
  [[1], [1], [1], [1], [1]],
  // shape 9: I (3)
  [[1], [1], [1]],
  // shape 10: I (2)
  [[1], [1]],
  // shape 11: mini angle
  [
    [1, 1],
    [1, 0],
  ],
  // shape 12: 3x3 square
  [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ],
  // shape 13: 2x3 rectangle
  [
    [1, 1],
    [1, 1],
    [1, 1],
  ],
  // shape 14: diagonal 2
  [
    [1, 0],
    [0, 1],
  ],
  // shape 15: diagonal 3
  [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  // shape 16: 1x1 square
  [[1]],
  // shape 17: Big L right
  [
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
  // shape 18: Big L left
  [
    [0, 0, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
];

// ------------------------------------
// Canvas Drag and Drop Functions
// ------------------------------------

// handle the drag over event for the canvas
// draw a preview of the shape in the canvas if the shape is within the canvas
// and there are no other shapes in the way
function canvasDragOver(event) {
  event.preventDefault();
  // draw the shape in the canvas using top left corner of the shape
  // get the shape index and rotations from the data
  const shapeIndex = globalShapeIndex;
  const shapeRotations = globalRotations;
  let shape = shapeBlueprints[shapeIndex];

  // rotate the shape based on the number of rotations
  for (let i = 0; i < shapeRotations; i++) {
    shape = rotateShape(shape);
  }

  // get the offset from the data
  const offsetX = globalOffsetX;
  const offsetY = globalOffsetY;

  canvasDrawShape(
    shape,
    findRelativeCellIndex(event.clientX - offsetX, event.clientY - offsetY),
    (color = "#aaa"),
    (temp = true)
  );
}

// draw a shape in the canvas
function canvasDrawShape(
  shapeBlueprint,
  cellIndex,
  color = "#000",
  temp = false
) {
  const gridSize = globalGridSize;
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // if the cell index is invalid, return
  if (!cellIndex) {
    return;
  }

  // double check that the shape is within the canvas
  if (
    cellIndex[0] + shapeBlueprint[0].length > gridSize ||
    cellIndex[1] + shapeBlueprint.length > gridSize
  ) {
    // if the shape is outside the canvas, return
    return;
  }

  // get the cell index
  const cellX = cellIndex[0];
  const cellY = cellIndex[1];

  // remove previous temporary shape by redrawing grid
  if (temp) {
    drawFullGrid(gridSize);
  }

  for (let i = 0; i < shapeBlueprint.length; i++) {
    for (let j = 0; j < shapeBlueprint[i].length; j++) {
      if (shapeBlueprint[i][j] === 1) {
        if (
          includesArray(cells, [cellX + j, cellY + i]) &&
          cellColors[cells.indexOf([cellX + j, cellY + i])] !== "#aaa"
        ) {
          return false;
        }
      }
    }
  }

  // draw the shape in the canvas
  for (let i = 0; i < shapeBlueprint.length; i++) {
    for (let j = 0; j < shapeBlueprint[i].length; j++) {
      if (shapeBlueprint[i][j] === 1) {
        if (temp) {
          ctx.fillStyle = color;
          ctx.fillRect(
            (cellX + j) * (canvas.width / gridSize),
            (cellY + i) * (canvas.height / gridSize),
            canvas.width / gridSize,
            canvas.height / gridSize
          );
        } else {
          cells.push([cellX + j, cellY + i]);
          cellColors.push(color);
        }
      }
    }
  }

  if (!temp) {
    drawFullGrid(gridSize);
  }

  return true;
}

//
function canvasAddShapeCells(shapeBlueprint, cellIndex, color = null) {
  const cellX = cellIndex[0];
  const cellY = cellIndex[1];

  // draw the shape in the canvas
  for (let i = 0; i < shapeBlueprint.length; i++) {
    for (let j = 0; j < shapeBlueprint[i].length; j++) {
      if (shapeBlueprint[i][j] === 1) {
        cells.push([cellX + j, cellY + i]);
        cellColors.push(
          color ?? shapeColors[Math.floor(Math.random() * shapeColors.length)]
        );
      }
    }
  }
}

function findRelativeCellIndex(shapeX, shapeY) {
  const gridSize = globalGridSize;
  const canvas = document.getElementById("canvas");

  // get the shape index based on the mouse position
  const rect = canvas.getBoundingClientRect();
  const canvasShapeX = shapeX - rect.left;
  const canvasShapeY = shapeY - rect.top;

  return findCellIndex(canvasShapeX, canvasShapeY, gridSize);
}

// check rows and columns for full lines
// return an array of full rows and columns
// reads from the cells array, looking one cell at a time
// to try and find full lines
function checkLines() {
  let fullRows = [];
  let fullCols = [];

  let rows = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
  };
  let cols = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
  };

  // count the number of cells in each row and column
  for (let i = 0; i < cells.length; i++) {
    rows[cells[i][1]]++;
    cols[cells[i][0]]++;
  }

  // check for full rows
  for (let i = 0; i < globalGridSize; i++) {
    if (rows[i] == globalGridSize) {
      fullRows.push(i);
    }
  }

  // check for full columns
  for (let i = 0; i < globalGridSize; i++) {
    if (cols[i] == globalGridSize) {
      fullCols.push(i);
    }
  }

  return [fullRows, fullCols];
}

// remove full lines
function clearLines() {
  const [fullRows, fullCols] = checkLines();

  // remove full rows
  for (let i = 0; i < fullRows.length; i++) {
    for (let j = 0; j < cells.length; j++) {
      if (cells[j][1] == fullRows[i]) {
        cells.splice(j, 1);
        cellColors.splice(j, 1);
        j--;
      }
    }
  }

  // remove full columns
  for (let i = 0; i < fullCols.length; i++) {
    for (let j = 0; j < cells.length; j++) {
      if (cells[j][0] == fullCols[i]) {
        cells.splice(j, 1);
        cellColors.splice(j, 1);
        j--;
      }
    }
  }

  // return the number of lines cleared
  return fullRows.length + fullCols.length;
}

// ------------------------------------
// Animation Functions
// ------------------------------------

// points alert animation
function animateAlert(
  text,
  destination = document.body,
  offsetX = 0,
  offsetY = 0,
  id = null,
  random = false,
  customColor = null
) {
  const alert = document.createElement("div");
  alert.classList.add("points-alert");
  alert.textContent = `${text}`;

  if (id) alert.id = id;

  // set destination position to 0 if not provided
  let destinationX = 0;
  let destinationY = 0;

  // get relative position of the destination
  if (destination) {
    const rect = destination.getBoundingClientRect();
    destinationX = rect.left;
    destinationY = rect.top;
  }

  // set the alert position
  alert.style.top = `${offsetY + destinationY}px`;
  alert.style.left = `${offsetX + destinationX}px`;

  // set the alert color
  if (random) {
    alert.style.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    alert.style.transform = `rotate(${Math.random() * 60 - 30}deg)`;
  }

  if (customColor) alert.style.color = customColor;

  // if alert color is dark, set the outline to white equivalent
  if (getLuma(rgbToRgb(alert.style.color)) < 90) {
    alert.style.textShadow =
      "-1px -1px 0 #eee, 1px -1px 0 #eee, -1px 1px 0 #eee, 1px 1px 0 #eee";
  }

  document.body.appendChild(alert);

  setTimeout(() => {
    alert.style.opacity = 0;
    alert.style.transform = "translateY(0)";
    document.body.removeChild(alert);
  }, 1000);
}

// points alert animation with random location within coordinates
function animateAlertInCoordinates(
  text,
  x0,
  y0,
  x1,
  y1,
  id = null,
  random = false
) {
  // get random position within the coordinates
  const offsetX = Math.random() * (x1 - x0) + x0;
  const offsetY = Math.random() * (y1 - y0) + y0;

  animateAlert(
    text,
    document.body,
    offsetX,
    offsetY,
    (id = id),
    (random = random)
  );

  // return the offset values
  return [offsetX, offsetY];
}

// points alert animation with random location within the canvas
function animateAlertInCanvas(text, id = null, random = false) {
  const canvas = document.getElementById("canvas");

  // get canvas x0, y0, x1, y1
  const rect = canvas.getBoundingClientRect();
  const x0 = rect.left;
  const y0 = rect.top;
  const x1 = rect.right;
  const y1 = rect.bottom;

  animateAlertInCoordinates(text, x0, y0, x1, y1, (id = id), (random = random));
}

// update the color palette to the next one
function updateColorPalette() {
  // get the current color palette
  const palettes = Object.keys(colorPalettes);
  let currentIndex = palettes.indexOf(currentPalette);

  // get the next color palette
  currentIndex = (currentIndex + 1) % palettes.length;
  currentPalette = palettes[currentIndex];
  shapeColors = colorPalettes[currentPalette];

  // update the color palette text
  updateSpanText("color-palette", `Colour Palette: ${currentPalette}`);

  // update cookies to store the current color palette
  setCookie("colorPalette", currentPalette);

  // refresh page to apply the new color palette
  location.reload();
}
