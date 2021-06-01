const container = document.getElementById("game-container");
const controls = document.getElementById("game-controls");
const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// const range = (start, stop) => {
//     /**
//      * Creates array of numbers: [start, stop)
//      */
//     if (stop === undefined) {
//         stop = start;
//         start = 0;
//     }
    
//     return [...Array(stop-start).keys()].map(e => e + start)
// }

const shuffle = (array) => {
    arr = [...array]; // copy array
    n = arr.length;
    for(let i = n-1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const randInt = (max) => {
    /**
     * Generates a random number in range [0, max)
     */
    return Math.floor(Math.random() * (max))
}

class Cell {
    constructor(value=0, notes=[]) {
        this.value = value;
        this.notes = notes;
        this.house = [];
        this.houseIdx = null;
        this.row = [];
        this.col = [];
        this.selected = false;
        this.rowIdx = 0;
        this.colIdx = 0;
    }

    displaySetup() {
        /**
         * Associate HTML elements with cell if used for displaying
         */
        this.element = document.createElement('div');
        this.element.textContent = String(this.value);
        this.element.classList.add('cell');
    }

    update(value) {
        /**
         * Updates internal value of Cell and updates DOM display (if element is defined).
         */
        this.value = value;
        if (this.element != undefined) {
            if (this.value === 0) {
                this.element.textContent = '';
            } else {
                this.element.textContent = String(this.value)
            }
        }
    }

    updateCandidates() {
        /**
         * Updates internal values of possible candidates for this Cell.
         */
        let unavailable = new Set([0]); // stores values already used in row, col, house
        for (let group of [this.row, this.col, this.house]) {
            for (let cell of group) {
                unavailable.add(cell.value);
            }
        }
        this.notes = nums.filter(x => !unavailable.has(x));
    }

    validate(candidate) {
        /**
         * Checks that this Cell is the only one of its value in its row, column, and house.
         * @param {number} [candidate] - Candidate value to validate, if not the cell's current value.
         */
        let comparison, expected, isValid;
        if (candidate) {
            // If a candidate value is given, check validity of that value.
            comparison = candidate;
            expected = 0; // If it's a new value, expect 0 to already exist
        } else {
            // Else, check cell's current value
            comparison = this.value;
            expected = 1; // Expect this cell to be the only one with its value.
        }

        if (comparison === 0) {
            // 0 is placeholder value for empty cells; they're automatically invalid
            isValid = false;
        } else {
            let rowValid = this.row.filter(cell => cell.value === comparison).length === expected;
            let colValid = this.col.filter(cell => cell.value === comparison).length === expected;
            let houseValid = this.house.filter(cell => cell.value === comparison).length === expected;
    
            isValid = rowValid && colValid && houseValid;
        }

        // if (this.element != undefined && !this.element.classList.contains('note-cell')) {
        //     if (!isValid) {
        //         this.element.classList.add('invalid')
        //     } else {
        //         this.element.classList.remove('invalid')
        //     }    
        // }
        return isValid;
    }
}


class Grid {
    constructor() {
        this.rows = 9;
        this.cols = 9;
        this.houses = 9;
        this.size = this.rows * this.cols;
        this.cells = [];
        this.divs = [];
        this.solutions = 0;
        this.fillAssociateCells();
        this.selectedCell = null;
        this.prevSelectedCell = null;
    }

    fillAssociateCells() {
        /**
         * Fills grid and associates every cell in the grid with its row, column, and house for easy referencing.
         */
        // Fill grid with Cells
        for (let i = 0; i < this.rows; i++) {
            let row = [];
            this.cells.push(row);
            for (let j = 0; j < this.cols; j++) {
                let cell = new Cell(0);
                [cell.rowIdx, cell.colIdx] = [i, j];
                row.push(cell)
            }
        }

        // Associate each Cell with its row
        for (let i = 0; i < this.rows; i++) {
            let row = [];
            for (let j = 0; j < this.cols ; j++) {
                let cell = this.cells[i][j];
                row.push(cell)
                cell.row = row;
            }
        }

        // Associate each Cell with its column
        for (let j = 0; j < this.cols; j++) {
            let col = [];
            for (let i = 0; i < this.rows; i++) {
                let cell = this.cells[i][j];
                col.push(cell);
                cell.col = col;
            }
        }

        // Associate each Cell with its house (3x3 square)
        // Also, add a class to Cell's element for house coloring
        let rowStart = 0;
        let colStart = 0;
        for (let k = 0; k < this.houses; k++) {
            let house = [];
            if (k % 3 === 0 && k > 0) {
                rowStart += 3;
                colStart = 0;
            }
            for (let i = rowStart; i < rowStart + 3; i++) {
                for (let j = colStart; j < colStart + 3; j++) {
                    let cell = this.cells[i][j];
                    cell.house = house;
                    cell.houseIdx = k;
                    house.push(cell);
                }
                if (i === rowStart + 2) {
                    colStart += 3;
                }
            }
        }
    }

    validateSolution() {
        for (let row of this.cells) {
            for (let cell of row) {
                cell.validate();
            }
        }
    }

    checkGenerated() {
        /**
         * Validate generated Sudoku puzzle by checking for remaining 0s.
         */
        for(let row of this.cells) {
            for(let cell of row) {
                if (cell.value === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    solve(generating=false) {
        /**
         * Solves a sudoku puzzle using backtracking. Can also be used for puzzle generation.
         */
        let row, col, cell, candidates;
        for (let i = 0; i < this.size; i++) {
            row = Math.floor(i / 9);
            col = i % 9;
            cell = this.cells[row][col];

            // A cell with a value of 0 indicates that it has not yet been solved, so try to find a valid number for it.
            if (cell.value === 0) {
                if (generating) {
                    candidates = shuffle(nums); // shuffle valid numbers for randomness in puzzle generation
                } else {
                    candidates = nums;
                }
                for(let num of candidates) {
                    if (cell.validate(num)) {
                        cell.value = num;
                        if (this.checkGenerated()) {
                            if (!generating) {
                                // If we're solving (removing hints), break if we find a solution
                                this.solutions++;
                                break
                            } else {
                                return true;
                            }
                        }
                        else if(this.solve(generating)) {
                            // Recursively check all solutions branching from this one.
                            // A successful solution chain will result in an exit here.
                            return true;
                        }
                        // If we're here, we've had to backtrack, but we may still have some additional valid numbers to try
                    }
                }
                // If we're here, there's no valid number for the current cell.
                // So, break from the cell loop and start/continue backtracking
                break;
            }
        }
        // When we backtrack, the function we return to will be focused one cell prior to the failed cell.
        // By updating the current cell to 0 before returning, the function we return to will know to re-evaluate it when it increments its cell reference.
        cell.value = 0;
    }

    removeHints(attempts) {
        /**
         * Starting from a solved grid, iteratively remove cells to create a playable board, checking that it's still solveable.
         * @param {attempts} number - integer number of times to restart search after a solution branch fails
         * 
         */

        if (attempts === undefined) {
            attempts = 1;
        }
        while (attempts > 0) {
            // Pick a random non-empty cell
            let row = randInt(9);
            let col = randInt(9);
            while (this.cells[row][col].value === 0) {
                // Pick another cell if selected one is empty
                row = randInt(9);
                col = randInt(9);
            }

            let backup = this.cells[row][col].value
            this.cells[row][col].value = 0;

            let branch = this.copy();

            let solutions = 0;
            branch.solve();
            solutions += branch.solutions;
            if (solutions != 1) {
                this.cells[row][col].value = backup;
                attempts -= 1;
            }
        }
        // Add class for highlighting hints
        for (let row of this.cells) {
            for (let cell of row) {
                // If cell value isn't 0, it's a hint
                if (cell.value != 0) {
                    cell.element.classList.add('hint');
                }
            }
        }
    }

    copy() {
        /**
         * Returns a copy of the current grid.
         */
        let g = new Grid();
        // g.fillAssociateCells(); // fill grid with Cells, associate Cells with row, col, house
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                let cell = this.cells[i][j];
                g.cells[i][j].value = cell.value;
            }
        }

        return g;
    }

    displaySetup() {
        /**
         * Creates visual elements for grid.
         */
        let coloredHouses = [1, 3, 5, 7];
        for (let row of this.cells) {
            let rowDisplay = document.createElement('div');
            rowDisplay.classList.add('grid-row');
            container.append(rowDisplay);

            for (let cell of row) {
                cell.displaySetup();

                // Add Cell interactivity on click
                cell.element.addEventListener('click', () =>{
                    // Deactivate active elements
                    this.clearHighlights();

                    // Activate selected element and cells with the same value
                    this.highlightCells(cell.value);
                    this.select(cell);
                })

                // Color alternating houses
                if (coloredHouses.includes(cell.houseIdx)) {
                    cell.element.classList.add('house-alt');
                }
                rowDisplay.append(cell.element);
            }
        }
    }

    select(cell) {
        // Clear previous selection(s)
        let selected = document.querySelectorAll('.selected');
        for (let element of selected) {
            element.classList.remove('selected');
        }
        // Select desired cell
        cell.element.classList.add('selected');
        this.prevSelectedCell = this.selectedCell;
        if (this.prevSelectedCell) {
            this.prevSelectedCell.selected = false;
        }
        cell.selected = true;
        this.selectedCell = cell;
    }

    selectCoords(row, col) {
        let cell = this.cells[row][col];
        this.select(cell);
    }

    clearHighlights() {
        let active = document.querySelectorAll('.active');
        for (let element of active) {
            element.classList.toggle('active');
        }
    }

    highlightCells(value) {
        for (let row of this.cells) {
            for (let c of row) {
                if (c.value === value && c.value != 0) {
                    c.element.classList.add('active');
                }
            }
        }
    }

    updateNotes() {
        for (let row of this.cells) {
            for (let cell of row) {
                let cList = cell.element.classList;
                if (!(cList.contains('hint') || cList.contains('user-input'))) {
                    cell.updateCandidates();
                }
            }
        }
    }

    setup(difficulty) {
        this.displaySetup();
        this.solve(true); // generate complete puzzle
        
        // Remove hints based on approximate difficulty
        let attempts;
        switch (difficulty) {
            case 'easy':
                attempts = 2;
                break;
            case 'medium':
                attempts = 4;
                break;
            case 'hard':
                attempts = 6;
                break;
            default:
                attempts = 2;
                break;
        }
        this.removeHints(attempts);
        this.updateNotes();
    }

    display() {
        for (let row of this.cells) {
            for (let cell of row) {
                cell.update(cell.value);
            }
        }
    }

    displayNotes() {
        for (let row of this.cells) {
            for (let cell of row) {
                let cList = cell.element.classList;
                if (!(cList.contains('hint') || cList.contains('user-input'))) {
                    cell.element.textContent = '';
                    cell.element.classList.add('note-cell');
                    for (let i = 0; i < nums.length; i++) {
                        let note = cell.notes.find(x => x === i + 1);
                        let noteDiv = document.createElement('div');
                        noteDiv.classList.add('note');
                        if (note != undefined) {
                            noteDiv.textContent = String(note);
                        }
                        cell.element.append(noteDiv);
                    }
                }
            }
        }
    }

}

class Controller {
    constructor(grid) {
        this.g = grid;
        this.events = {};
        this.input = null;
        this.listen();
    }

    setup() {
        for (let i = 1; i <= 9; i++) {
            let control = document.createElement('button');
            control.classList.add('control');
            control.id = `control-${i}`;
            control.textContent = `${i}`;
            control.addEventListener('click', () => {
                this.input = i;
                this.updateState(this.input);
                // if (this.input && this.g.selectedCell) {
                //     this.g.selectedCell.update(this.input);
                // }
                this.g.clearHighlights(false);
                this.g.highlightCells(this.input);
                let activeCtrl = document.querySelector('.control-active');
                if (activeCtrl) {
                    activeCtrl.classList.toggle('control-active');
                }
                control.classList.toggle('control-active');
            })
            controls.append(control);
        }
    }

    updateState(value) {
        let cell = this.g.selectedCell;
        if (value && cell && !cell.element.classList.contains('hint')) {
            cell.element.textContent ='';
            cell.element.classList.remove('note-cell');
            cell.element.classList.add('user-input');
            cell.update(value);
        }
        cell.element.classList.add('selected');
        this.g.updateNotes();
        this.g.displayNotes();
    }

    listen() {
        let numKeys = {};
        for (let i = 1; i <= 9; i++) {
            numKeys[`Numpad${i}`] = i;
            numKeys[`Digit${i}`] = i;
        }
        let arrowKeys = {
            'ArrowUp': 'up',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'ArrowDown': 'down',
        };
        document.addEventListener('keydown', e => {
            if (numKeys[e.code]) {
                this.input = numKeys[e.code];
                let controlBtn = document.querySelector(`#control-${this.input}`);
                controlBtn.click();
            } else if (arrowKeys[e.code]) {
                let direction = arrowKeys[e.code];
                let selected = document.querySelector('.selected');
                if (!selected) {
                    // If user hasn't selected a cell yet, start at upper right corner.
                    g.selectCoords(0, 0);
                } else {
                    let [row, col] = [g.selectedCell.rowIdx, g.selectedCell.colIdx];
                    switch(direction) {
                        case 'up':
                            row -= 1;
                            break;
                        case 'left':
                            col -= 1;
                            break;
                        case 'right':
                            col += 1;
                            break;
                        case 'down':
                            row += 1;
                            break;
                    }
                    // Truncate movement if beyond grid bounds
                    if (row < 0) row = 0;
                    if (row > g.rows - 1) row = g.rows - 1;
                    if (col < 0) col = 0;
                    if (col > g.cols - 1) col = g.cols - 1;

                    g.selectCoords(row, col);
                }
            }
        })
    }
}

class Manager {
    constructor() {
        this.createNewPuzzle('hard');
        this.selected = document.getElementsByClassName('selected');
        this.prevSelected = null;
    }

    createNewPuzzle(difficulty) {
        container.textContent = '';
        this.g = new Grid();
        this.g.setup(difficulty);
        this.g.display();
    }
    
}

// (runApplication = () => {
//     m = new Manager();

//     easyBtn = document.getElementById('new-easy');
//     easyBtn.addEventListener('click', () => {m.createNewPuzzle('easy')})

//     medBtn = document.getElementById('new-medium');
//     medBtn.addEventListener('click', () => {m.createNewPuzzle('medium')})

//     hardBtn = document.getElementById('new-hard');
//     hardBtn.addEventListener('click', () => {m.createNewPuzzle('hard')})

//     noteBtn = document.getElementById('gen-notes');
//     noteBtn.addEventListener('click', () => {m.g.displayNotes()})
// })()

let g = new Grid();
// g.fillAssociateCells();
g.displaySetup();
g.solve(true);
g.removeHints(1);
g.display();
g.validateSolution();
g.updateNotes();
g.displayNotes();

c = new Controller(g);
c.setup();


// Create 9x9 grid of 0s
// let grid = [...Array(9)].map(() => Array(9).fill(0));