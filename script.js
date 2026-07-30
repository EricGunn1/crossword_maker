const gridContainer = document.getElementById('grid-container');
const gridSizeSelect = document.getElementById('grid-size-select');
const newPuzzleBtn = document.getElementById('new-puzzle-btn');
const toggleBlankBtn = document.getElementById('toggle-blank-btn');
const publishBtn = document.getElementById('publish-btn');
const acrossCluesEl = document.getElementById('across-clues');
const downCluesEl = document.getElementById('down-clues');
const publishedPanel = document.getElementById('published-panel');
const publishedGrid = document.getElementById('published-grid');
const publishedAcross = document.getElementById('published-across');
const publishedDown = document.getElementById('published-down');
const returnEditBtn = document.getElementById('return-edit-btn');

const MIN_SIZE = 5;
const MAX_SIZE = 20;

let state = {
  size: 10,
  direction: 'across',
  selected: { row: 0, col: 0 },
  cells: [],
  acrossClues: [],
  downClues: [],
  cluesText: { across: {}, down: {} },
};

function createGridData(size) {
  const cells = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ letter: '', blank: false }))
  );
  return cells;
}

function computeClueNumbers(cells, size) {
  const numbers = Array.from({ length: size }, () => Array(size).fill(null));
  const across = [];
  const down = [];
  let next = 1;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (cells[row][col].blank) continue;
      const leftBlocked = col === 0 || cells[row][col - 1].blank;
      const rightOpen = col + 1 < size && !cells[row][col + 1].blank;
      const startsAcross = leftBlocked && rightOpen;
      const topBlocked = row === 0 || cells[row - 1][col].blank;
      const bottomOpen = row + 1 < size && !cells[row + 1][col].blank;
      const startsDown = topBlocked && bottomOpen;
      if (!startsAcross && !startsDown) continue;
      numbers[row][col] = next;
      if (startsAcross) {
        let length = 0;
        for (let c = col; c < size && !cells[row][c].blank; c += 1) length += 1;
        across.push({ number: next, row, col, length });
      }
      if (startsDown) {
        let length = 0;
        for (let r = row; r < size && !cells[r][col].blank; r += 1) length += 1;
        down.push({ number: next, row, col, length });
      }
      next += 1;
    }
  }
  return { numbers, across, down };
}

function recomputeClues() {
  const { numbers, across, down } = computeClueNumbers(state.cells, state.size);
  state.numbers = numbers;
  state.acrossClues = across;
  state.downClues = down;
}

function resetState(size = 10) {
  state.size = size;
  state.direction = 'across';
  state.selected = { row: 0, col: 0 };
  state.cells = createGridData(size);
  state.cluesText = { across: {}, down: {} };
  recomputeClues();
}

function renderGrid() {
  gridContainer.innerHTML = '';
  gridContainer.style.gridTemplateColumns = `repeat(${state.size}, minmax(0, 1fr))`;
  for (let row = 0; row < state.size; row += 1) {
    for (let col = 0; col < state.size; col += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (state.cells[row][col].blank) {
        cell.classList.add('blank');
      }
      const number = state.numbers[row][col];
      if (number) {
        const numberEl = document.createElement('span');
        numberEl.className = 'cell-number';
        numberEl.textContent = number;
        cell.appendChild(numberEl);
      }
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.value = state.cells[row][col].letter;
      input.disabled = state.cells[row][col].blank;
      input.addEventListener('focus', () => selectCell(row, col));
      input.addEventListener('input', (event) => handleCellInput(event, row, col));
      input.addEventListener('keydown', (event) => handleGridKeydown(event, row, col));
      cell.appendChild(input);
      cell.addEventListener('dblclick', () => toggleDirection());
      cell.addEventListener('click', () => {
        selectCell(row, col);
      });
      gridContainer.appendChild(cell);
    }
  }
  updateSelection();
}

function renderClues() {
  acrossCluesEl.innerHTML = '';
  downCluesEl.innerHTML = '';

  state.acrossClues.forEach((entry) => {
    const key = `${entry.row},${entry.col}`;
    const container = document.createElement('div');
    container.className = 'clue-item';
    const label = document.createElement('label');
    label.textContent = `${entry.number}.`;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = state.cluesText.across[key] || '';
    input.placeholder = `Across clue ${entry.number}`;
    input.addEventListener('input', (event) => {
      state.cluesText.across[key] = event.target.value;
    });
    container.appendChild(label);
    container.appendChild(input);
    acrossCluesEl.appendChild(container);
  });

  state.downClues.forEach((entry) => {
    const key = `${entry.row},${entry.col}`;
    const container = document.createElement('div');
    container.className = 'clue-item';
    const label = document.createElement('label');
    label.textContent = `${entry.number}.`;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = state.cluesText.down[key] || '';
    input.placeholder = `Down clue ${entry.number}`;
    input.addEventListener('input', (event) => {
      state.cluesText.down[key] = event.target.value;
    });
    container.appendChild(label);
    container.appendChild(input);
    downCluesEl.appendChild(container);
  });
}

function updateSelection() {
  const cells = gridContainer.querySelectorAll('.cell');
  cells.forEach((cell, index) => {
    cell.classList.remove('selected', 'direction-across', 'direction-down', 'highlight');
    const row = Math.floor(index / state.size);
    const col = index % state.size;
    if (row === state.selected.row && col === state.selected.col) {
      cell.classList.add('selected');
      cell.classList.add(`direction-${state.direction}`);
    }
  });
  highlightDirectionPath();
}

function highlightDirectionPath() {
  const cells = gridContainer.querySelectorAll('.cell');
  const { row, col } = state.selected;
  const direction = state.direction;
  cells.forEach((cell, index) => {
    const r = Math.floor(index / state.size);
    const c = index % state.size;
    cell.classList.remove('highlight');
    if (r === row && c === col) return;
    if (direction === 'across' && r === row) {
      cell.classList.add('highlight');
    }
    if (direction === 'down' && c === col) {
      cell.classList.add('highlight');
    }
  });
}

function selectCell(row, col) {
  if (state.cells[row][col].blank) return;
  state.selected = { row, col };
  updateSelection();
  const index = row * state.size + col;
  const cell = gridContainer.children[index];
  const input = cell.querySelector('input');
  input.focus();
}

function moveSelection(row, col) {
  const bounded = {
    row: Math.max(0, Math.min(state.size - 1, row)),
    col: Math.max(0, Math.min(state.size - 1, col)),
  };
  if (!state.cells[bounded.row][bounded.col].blank) {
    selectCell(bounded.row, bounded.col);
  }
}

function handleCellInput(event, row, col) {
  const value = event.target.value.toUpperCase().replace(/[^A-Z]/g, '');
  event.target.value = value;
  state.cells[row][col].letter = value;
  if (value && state.direction === 'across') {
    moveSelection(row, col + 1);
  }
  if (value && state.direction === 'down') {
    moveSelection(row + 1, col);
  }
}

function handleGridKeydown(event, row, col) {
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    moveSelection(row - 1, col);
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveSelection(row + 1, col);
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    moveSelection(row, col - 1);
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    moveSelection(row, col + 1);
  }
  if (event.key === 'Delete') {
    event.preventDefault();
    clearCell(row, col);
  }
  if (event.key === 'Backspace') {
    event.preventDefault();
    clearCell(row, col);
    if (state.direction === 'across') {
      moveSelection(row, col - 1);
    } else {
      moveSelection(row - 1, col);
    }
  }
}

function clearCell(row, col) {
  state.cells[row][col].letter = '';
  const index = row * state.size + col;
  const input = gridContainer.children[index].querySelector('input');
  input.value = '';
}

function toggleDirection() {
  state.direction = state.direction === 'across' ? 'down' : 'across';
  updateSelection();
}

function updateGridSizeSelector() {
  for (let size = MIN_SIZE; size <= MAX_SIZE; size += 1) {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = `${size}x${size}`;
    if (size === state.size) {
      option.selected = true;
    }
    gridSizeSelect.appendChild(option);
  }
}

function anyClueTextExists() {
  return (
    Object.values(state.cluesText.across).some(Boolean) ||
    Object.values(state.cluesText.down).some(Boolean)
  );
}

function handleToggleBlank() {
  const { row, col } = state.selected;
  const cell = state.cells[row][col];
  if (!cell) return;
  const makingBlank = !cell.blank;
  if (makingBlank && anyClueTextExists()) {
    const proceed = window.confirm(
      'Inserting a blank here may impact existing clues already written. Proceed?'
    );
    if (!proceed) return;
  }
  cell.blank = makingBlank;
  if (makingBlank) {
    cell.letter = '';
  }
  recomputeClues();
  renderGrid();
  renderClues();
}

function publishPuzzle() {
  publishedPanel.classList.remove('hidden');
  publishedGrid.innerHTML = '';
  publishedGrid.style.gridTemplateColumns = `repeat(${state.size}, minmax(0, 1fr))`;
  for (let row = 0; row < state.size; row += 1) {
    for (let col = 0; col < state.size; col += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (state.cells[row][col].blank) cell.classList.add('blank');
      const number = state.numbers[row][col];
      if (number) {
        const numberEl = document.createElement('span');
        numberEl.className = 'cell-number';
        numberEl.textContent = number;
        cell.appendChild(numberEl);
      }
      publishedGrid.appendChild(cell);
    }
  }
  publishedAcross.innerHTML = '';
  publishedDown.innerHTML = '';
  state.acrossClues.forEach((entry) => {
    const key = `${entry.row},${entry.col}`;
    const item = document.createElement('li');
    item.textContent = `${entry.number}. ${state.cluesText.across[key] || '...'}`;
    publishedAcross.appendChild(item);
  });
  state.downClues.forEach((entry) => {
    const key = `${entry.row},${entry.col}`;
    const item = document.createElement('li');
    item.textContent = `${entry.number}. ${state.cluesText.down[key] || '...'}`;
    publishedDown.appendChild(item);
  });
}

function init() {
  updateGridSizeSelector();
  resetState(state.size);
  renderGrid();
  renderClues();

  gridSizeSelect.addEventListener('change', (event) => {
    const size = Number(event.target.value);
    resetState(size);
    renderGrid();
    renderClues();
  });

  newPuzzleBtn.addEventListener('click', () => {
    resetState(state.size);
    renderGrid();
    renderClues();
  });

  toggleBlankBtn.addEventListener('click', handleToggleBlank);
  publishBtn.addEventListener('click', publishPuzzle);
  returnEditBtn.addEventListener('click', () => {
    publishedPanel.classList.add('hidden');
  });
}

init();
