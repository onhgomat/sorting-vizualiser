const container = document.getElementById("bar-container");
const sizeSlider = document.getElementById("size-slider");
const speedSlider = document.getElementById("speed-slider");
const sizeDisplay = document.getElementById("size-display");
const speedDisplay = document.getElementById("speed-display");

const playBtn = document.getElementById("play-btn");
const pauseBtn = document.getElementById("pause-btn");
const stepBtn = document.getElementById("step-btn");
const resetBtn = document.getElementById("reset-btn");

const algoSelect = document.getElementById("algorithm-select");

const comparisonCountElem = document.getElementById("comparison-count");
const swapCountElem = document.getElementById("swap-count");
const timeElapsedElem = document.getElementById("time-elapsed");

let array = [], actions = [];
let paused = false, currentAction = 0;
let delay = 50, comparisonCount = 0, swapCount = 0;
let startTime = 0;

sizeSlider.oninput = () => {
  sizeDisplay.textContent = sizeSlider.value;
  generateBars();
  updateCharts();
};

speedSlider.oninput = () => {
  delay = parseInt(speedSlider.value);
  speedDisplay.textContent = `${delay}ms`;
};

function generateBars() {
  container.innerHTML = "";
  array = Array.from({ length: sizeSlider.value }, () => Math.floor(Math.random() * 400) + 10);
  for (let value of array) {
    const bar = document.createElement("div");
    bar.classList.add("bar");
    bar.style.height = `${value}px`;
    bar.style.width = `${Math.floor(900 / array.length)}px`;
    container.appendChild(bar);
  }
  actions = [];
  currentAction = 0;
  resetStats();
}

function resetStats() {
  comparisonCount = 0;
  swapCount = 0;
  comparisonCountElem.textContent = "0";
  swapCountElem.textContent = "0";
  timeElapsedElem.textContent = "0";
}

function recordSwap(i, j) {
  actions.push({ type: "swap", i, j });
  swapCount++;
}

function recordSet(index, value) {
  actions.push({ type: "set", index, value });
  comparisonCount++;
}

function applyAction(action) {
  const bars = document.getElementsByClassName("bar");
  if (action.type === "swap") {
    [array[action.i], array[action.j]] = [array[action.j], array[action.i]];
    bars[action.i].style.height = `${array[action.i]}px`;
    bars[action.j].style.height = `${array[action.j]}px`;
  } else if (action.type === "set") {
    array[action.index] = action.value;
    bars[action.index].style.height = `${action.value}px`;
  }
  comparisonCountElem.textContent = comparisonCount;
  swapCountElem.textContent = swapCount;
}

function stepThrough() {
  if (currentAction < actions.length) {
    applyAction(actions[currentAction++]);
  }
}

async function playAll() {
  paused = false;
  startTime = performance.now();
  while (currentAction < actions.length && !paused) {
    stepThrough();
    await new Promise(res => setTimeout(res, delay));
  }
  if (currentAction >= actions.length) {
    timeElapsedElem.textContent = (performance.now() - startTime).toFixed(0);
  }
}

// Sorting Step Generators
async function bubbleSortSteps() {
  for (let i = 0; i < array.length; i++)
    for (let j = 0; j < array.length - i - 1; j++)
      if (array[j] > array[j + 1]) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        recordSwap(j, j + 1);
      }
}

async function insertionSortSteps() {
  for (let i = 1; i < array.length; i++) {
    let key = array[i], j = i - 1;
    while (j >= 0 && array[j] > key) {
      array[j + 1] = array[j];
      recordSet(j + 1, array[j]);
      j--;
    }
    array[j + 1] = key;
    recordSet(j + 1, key);
  }
}

async function mergeSortSteps(start = 0, end = array.length - 1) {
  if (start >= end) return;
  const mid = Math.floor((start + end) / 2);
  await mergeSortSteps(start, mid);
  await mergeSortSteps(mid + 1, end);
  const left = array.slice(start, mid + 1);
  const right = array.slice(mid + 1, end + 1);
  let i = 0, j = 0, k = start;
  while (i < left.length && j < right.length) {
    array[k] = (left[i] < right[j]) ? left[i++] : right[j++];
    recordSet(k++, array[k - 1]);
  }
  while (i < left.length) array[k] = left[i++], recordSet(k++, array[k - 1]);
  while (j < right.length) array[k] = right[j++], recordSet(k++, array[k - 1]);
}

async function quickSortSteps(low = 0, high = array.length - 1) {
  if (low < high) {
    const pivotIndex = await partition(low, high);
    await quickSortSteps(low, pivotIndex - 1);
    await quickSortSteps(pivotIndex + 1, high);
  }
}

async function partition(low, high) {
  let pivot = array[high], i = low - 1;
  for (let j = low; j < high; j++)
    if (array[j] < pivot) {
      i++; [array[i], array[j]] = [array[j], array[i]];
      recordSwap(i, j);
    }
  [array[i + 1], array[high]] = [array[high], array[i + 1]];
  recordSwap(i + 1, high);
  return i + 1;
}

async function selectionSortSteps() {
  for (let i = 0; i < array.length; i++) {
    let min = i;
    for (let j = i + 1; j < array.length; j++)
      if (array[j] < array[min]) min = j;
    if (min !== i) {
      [array[i], array[min]] = [array[min], array[i]];
      recordSwap(i, min);
    }
  }
}

playBtn.onclick = async () => {
  if (actions.length === 0) {
    const algo = algoSelect.value;
    if (algo === "bubble") await bubbleSortSteps();
    else if (algo === "insertion") await insertionSortSteps();
    else if (algo === "merge") await mergeSortSteps();
    else if (algo === "quick") await quickSortSteps();
    else if (algo === "selection") await selectionSortSteps();
  }
  playAll();
};
pauseBtn.onclick = () => paused = true;
stepBtn.onclick = () => { paused = true; stepThrough(); };
resetBtn.onclick = () => { paused = true; generateBars(); updateCharts(); };

window.onload = () => {
  generateBars();
  createCharts();
};

// Chart.js logic
let complexityChart, spaceChart;

function createCharts() {
  const ctx1 = document.getElementById("complexityChart").getContext("2d");
  const ctx2 = document.getElementById("spaceChart").getContext("2d");
  complexityChart = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: ['Bubble', 'Insertion', 'Merge', 'Quick', 'Selection'],
      datasets: [
        { label: 'Best', backgroundColor: '#00e676aa', data: [] },
        { label: 'Avg', backgroundColor: '#00bcd4aa', data: [] },
        { label: 'Worst', backgroundColor: '#ff5252aa', data: [] },
      ]
    },
    options: {
      responsive: true, plugins: { legend: { labels: { color: 'white' } } },
      scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' } } }
    }
  });

  spaceChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: ['Bubble', 'Insertion', 'Merge', 'Quick', 'Selection'],
      datasets: [{
        label: 'Space Complexity (O)',
        data: [1, 1, 'n', 'log n', 1],
        backgroundColor: '#ffa726aa'
      }]
    },
    options: {
      responsive: true, plugins: { legend: { labels: { color: 'white' } } },
      scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' } } }
    }
  });

  updateCharts();
}

function updateCharts() {
  const n = parseInt(sizeSlider.value);
  complexityChart.data.datasets[0].data = [n, n, n * Math.log2(n), n * Math.log2(n), n * n];
  complexityChart.data.datasets[1].data = [n * n, n * n, n * Math.log2(n), n * Math.log2(n), n * n];
  complexityChart.data.datasets[2].data = [n * n, n * n, n * Math.log2(n), n * n, n * n];
  complexityChart.update();
}
