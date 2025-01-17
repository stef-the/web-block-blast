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

// game variables
let score = 0;
let streak = 0;
let streakLives = 0;
let highScore = getCookie("highScore") ?? 0;

// ------------------------------------
// score and streak text
// ------------------------------------

updateSpanText("score", `Score: ${score}`);
updateSpanText("streak", `Streak: ${streak}`);
updateSpanText("streak-lives", `Streak Lives: ${streakLives}`);
updateSpanText("high-score", `High Score: ${highScore}`);

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

// set a cookie with a name, value, and expiration in days
function setCookie(cname, cvalue, exdays=365) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

// get a cookie by name
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
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
  const canvasWidth = canvasSize;
  const canvasHeight = canvasSize;

  // calculate cell size
  const cellSize = canvasSize / globalGridSize;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // canvas size setup and centering
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  canvas.style.top = `calc(20vh + ${
    document.getElementById("shape-container").clientHeight
  }px)`;
  canvas.style.left = `${(window.innerWidth - canvasWidth) / 2}px`;

  drawFullGrid(globalGridSize);

  // format the shape container
  const shapeContainer = document.getElementById("shape-container");
  shapeContainer.style.width = `${canvasWidth - 2}px`;
  shapeContainer.style.height = `${cellSize * 2 - 2}px`;
  shapeContainer.style.left = `${(window.innerWidth - canvasWidth) / 2}px`;

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
      fillCell(cellIndex, "#c0c0c0", gridSize);
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
  canvas.style.top = `calc(20vh + ${shapeContainer.clientHeight}px)`;
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
function fillCell(cellIndex, color, gridSize = 8) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const canvasSize = canvas.width; // fetch canvas width to prevent resizing
  const cellSize = canvasSize / gridSize;

  const cellX = cellIndex[0];
  const cellY = cellIndex[1];

  ctx.fillStyle = color;
  ctx.fillRect(cellX * cellSize, cellY * cellSize, cellSize, cellSize);
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
        ctx.fillStyle = color;
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
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
  event.dataTransfer.setData(
    "shapeIndex",
    shapeCanvas.getAttribute("data-shape-index")
  );

  // set the number of rotations as data
  event.dataTransfer.setData(
    "rotations",
    shapeCanvas.getAttribute("data-rotations")
  );

  // set the shape color as data
  event.dataTransfer.setData("color", shapeCanvas.getAttribute("data-color"));

  // get difference between mouse position and top left corner of the shape
  const rect = shapeCanvas.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  // set the offset as data
  event.dataTransfer.setData("offsetX", offsetX);
  event.dataTransfer.setData("offsetY", offsetY);

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
  const shapeIndex = event.dataTransfer.getData("shapeIndex");
  const shapeRotations = event.dataTransfer.getData("rotations");
  const shapeColor = event.dataTransfer.getData("color");

  let shape = shapeBlueprints[shapeIndex];

  // rotate the shape based on the number of rotations
  for (let i = 0; i < shapeRotations; i++) {
    shape = rotateShape(shape);
  }

  // get the offset from the data
  const offsetX = parseInt(event.dataTransfer.getData("offsetX"));
  const offsetY = parseInt(event.dataTransfer.getData("offsetY"));

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
      score += linesCleared * 10 * (streak + 1);
      // set streak lives to 3
      streakLives = 3;
    } else {
      // decrement streak lives if no lines were cleared
      if (streak > 0) {
        streakLives--;
      }
      if (streakLives === 0) {
        streak = 0;
      }
    }

    // update the score and streak text
    updateSpanText("score", `Score: ${score}`);
    updateSpanText("streak", `Streak: ${streak > 0 ? streak : 0}`);
    updateSpanText("streak-lives", `Streak Lives: ${streakLives}`);

    if (score > highScore) {
      highScore = score;
      setCookie("highScore", highScore);
      updateSpanText("high-score", `High Score: ${highScore}`);
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
];

const shapeColors = [
  "#bb0000",
  "#00bb00",
  "#0000bb",
  "#bbbb00",
  "#bb00bb",
  "#00bbbb",
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
  const shapeIndex = event.dataTransfer.getData("shapeIndex");
  const shapeRotations = event.dataTransfer.getData("rotations");
  let shape = shapeBlueprints[shapeIndex];

  // rotate the shape based on the number of rotations
  for (let i = 0; i < shapeRotations; i++) {
    shape = rotateShape(shape);
  }

  // get the offset from the data
  const offsetX = parseInt(event.dataTransfer.getData("offsetX"));
  const offsetY = parseInt(event.dataTransfer.getData("offsetY"));

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

  console.log("rows", rows);
  console.log("cols", cols);

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

  console.log(fullRows, fullCols);

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
