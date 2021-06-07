const container = document.getElementById("game-container");
const controls = document.getElementById("game-controls");
const extraControls = document.getElementById("extra-controls");

const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const shuffle = (array) => {
    /**
     * Returns shuffled copy of array using Fisher-Yates algorithm
     */
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
    /**
     * Internal representation of Cell state.
     */
    constructor(copying=false) {
        this.value = 0;
        this.notes = [];
        this.row = [];
        this.col = [];
        this.house = [];
        this.rowIdx = 0;
        this.colIdx = 0;
        this.houseIdx = 0;
        this.selected = false;
        if (!copying) {
            this.m = new CellManager(this);
            this.noteM = new NoteManager(this);
        }
    }

    updateCandidates() {
        /**
         * Updates internal values of possible candidates for this Cell.
         */
        // Collect currently used values in areas that overlap with Cell.
        let unavailable = new Set([0]);
        for (let group of [this.row, this.col, this.house]) {
            for (let cell of group) {
                unavailable.add(cell.value);
            }
        }
        // Cell candidates are numbers in 1-9 that aren't in set of unavailable numbers
        this.notes = nums.filter(x => !unavailable.has(x));
    }

    validate(candidate) {
        /**
         * Checks that this Cell is the only one of its value in its row, column, and house.
         * @param {number} [candidate] - Candidate value to validate, if not the cell's current value.
         */
        let comparison, expected;
        if (candidate) {
            // If a candidate value is given, check validity of that value.
            comparison = candidate;
            expected = 0; // If it's a new value, expect 0 to already exist
        } else {
            // Else, check cell's current value
            comparison = this.value;
            expected = 1; // Expect this cell to be the only one with its value.
        }

        let isValid;
        if (comparison === 0) {
            // 0 is placeholder value for empty cells; they're automatically invalid
            isValid = false;
        } else {
            let rowValid = this.row.filter(cell => cell.value === comparison).length === expected;
            let colValid = this.col.filter(cell => cell.value === comparison).length === expected;
            let houseValid = this.house.filter(cell => cell.value === comparison).length === expected;
    
            isValid = rowValid && colValid && houseValid;
        }

        return isValid;
    }
}

class CellManager {
    /**
     * Manages HTML state of Cell elements.
     */
    constructor(cell) {
        this.c = cell;
    }

    initialize() {
        this.element = document.createElement('div');
        this.update(this.c.value);
        // this.element.textContent = String(this.c.value);
        this.element.classList.add('cell');
    }

    update(value) {
        /**
         * Updates internal value of Cell and updates DOM value
         */
        this.c.value = value;
        if (this.c.value === 0) {
            this.element.textContent = '';
        } else {
            this.element.textContent = String(this.c.value);
        }
    }

    insertNoteDivs() {
        let noteDivs = this.element.querySelectorAll('.note');
        if (noteDivs.length != 9) {
            this.element.textContent = '';
            for (let num of nums) {
                let noteDiv = document.createElement('div');
                noteDiv.classList.add('note');
                this.element.append(noteDiv);
            }
        }
        this.element.classList.add('note-cell');
    }

}

class Grid {
    /**
     * Internal representation of Sudoku grid state.
     */
    constructor(copying=false) {
        this.rows = 9;
        this.cols = 9;
        this.houses = 9;
        this.size = this.rows * this.cols;
        this.cells = [];
        this.solutions = 0;
        this.fillAssociateCells();
        if (!copying) {
            this.m = new GridManager(this);
        }
        this.copying = copying;
        this.emptyCells = 0;
        this.hints = 81;
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
                let cell = new Cell(this.copying);
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
                        if (this._checkGenerated()) {
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

    removeHints(hintTarget) {
        /**
         * Starting from a solved grid, iteratively remove cells to create a playable board, checking that it's still solveable.
         * @param {attempts} number - integer number of times to restart removal process after a solution branch fails
         * 
         */
        let attempts = 20;
        while (attempts > 0 && this.hints > hintTarget) {
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
            this.emptyCells++;
            this.hints--;

            let branch = this.copy();

            let solutions = 0;
            branch.solve();
            solutions += branch.solutions;
            if (solutions != 1) {
                this.cells[row][col].value = backup;
                this.emptyCells--;
                this.hints++;
                attempts -= 1;
            }
        }
    }

    updateCandidates() {
        for (let row of this.cells) {
            for (let cell of row) {
                    cell.updateCandidates();
            }
        }
    }

    copy() {
        /**
         * Returns a copy of the current grid.
         */
        let g = new Grid(true);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                let cell = this.cells[i][j];
                g.cells[i][j].value = cell.value;
            }
        }

        return g;
    }

    _checkGenerated() {
        /**
         * Validate generated Sudoku puzzle by checking for remaining 0s (empty cells).
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

    isComplete() {
        console.log(this.emptyCells);
        return this.emptyCells === 0;
    }
}

class GridManager {
    /**
     * Manages HTML state of Grid.
     */
    constructor(grid) {
        this.g = grid;
        this.selectedCell = null;
        this.prevSelectedCell = null;
    }

    initialize() {
        /**
         * Display grid, add click interactivity, color alternating houses.
         */
        let coloredHouses = [1, 3, 5, 7];
        for (let row of this.g.cells) {
            let rowDisplay = document.createElement('div');
            rowDisplay.classList.add('grid-row');
            container.append(rowDisplay);

            for (let cell of row) {
                cell.m.initialize();
                rowDisplay.append(cell.m.element);

                // Add click interactivity
                cell.m.element.addEventListener('click', () => {
                    this.activateCells(cell.value);
                    this.select(cell);
                })

                // Color alternating houses differently
                if (coloredHouses.includes(cell.houseIdx)) {
                    cell.m.element.classList.add('house-accent');
                }
            }
        }
        this._declareHints();
    }

    update() {
        /**
         * Updates grid display with internal cell values.
         */
        for (let row of this.g.cells) {
            for (let cell of row) {
                cell.m.update(cell.value);
            }
        }
    }

    select(cell) {
        /**
         * Function for user selection of cell
         */
        // Clear previous selection(s)
        let selected = document.querySelectorAll('.selected');
        for (let element of selected) {
            element.classList.remove('selected');
        }
        // Select desired cell
        cell.m.element.classList.add('selected');
        this.prevSelectedCell = this.selectedCell;
        if (this.prevSelectedCell) {
            this.prevSelectedCell.selected = false;
        }
        cell.selected = true;
        this.selectedCell = cell;
    }

    selectCoords(row, col) {
        let cell = this.g.cells[row][col];
        this.select(cell);
    }

    activateCells(value) {
        // Deactive current active cells
        let currentActive = document.querySelectorAll('.active');
        for (let element of currentActive) {
            element.classList.toggle('active');
        }
        // Activate cells with value
        for (let row of this.g.cells) {
            for (let cell of row) {
                if (cell.value === value && cell.value != 0) {
                    cell.m.element.classList.toggle('active');
                }
            }
        }
    }

    automaticNotes() {
        for (let row of this.g.cells) {
            for (let cell of row) {
                let cList = cell.m.element.classList;
                if (!(cList.contains('hint') || cList.contains('user-input'))) {
                    let noteDivs = cell.m.element.querySelectorAll('.note');
                    if (noteDivs.length != 9) {
                        // Insert divs and re-query note divs if they don't exist
                        cell.m.insertNoteDivs();
                        noteDivs = cell.m.element.querySelectorAll('.note');
                    }
                    for (let i = 0; i < nums.length; i++) {
                        let noteDiv = noteDivs[i];
                        let num = i + 1;
                        let note = cell.notes.find(x => x === num); // Look for 1-9 in Cell's notes

                        // If we find number in Cell notes, then it's a valid candidate
                        // However, a user may strike a note if it's logically inconsistent for other reasons 
                        // (e.g., naked pair or other technique may eliminate candidates)
                        if (note != undefined) {
                            // If a noteDiv contains a 'strike' class, then it's already been filled in and crossed out by the user,
                            // so we don't want to overwrite their notes.
                            if (!noteDiv.classList.contains('strike')) {
                                noteDiv.textContent = String(note);
                            }

                        } else {
                            // If number not in notes, leave it's position blank
                            noteDiv.textContent = '';
                        }

                        // Check that we're not overwriting user-stricken (crossed-out) notes
                        if (!noteDiv.classList.contains('strike')) {
                            if (note != undefined) {
                                noteDiv.textContent = String(note);
                            }
                        }
                    }
                }
            }
        }
    }

    _declareHints() {
        /**
         * Used only to declare filled Cells as hints after generating/drawing a puzzle.
         */
        for (let row of this.g.cells) {
            for (let cell of row) {
                // If cell value isn't 0, it's a hint
                if (cell.value != 0) {
                    cell.m.element.classList.add('hint');
                }
            }
        }
    }

}

class NoteManager {
    constructor(cell) {
        this.c = cell;
    }

    change(value) {
        let valueIdx = value - 1; // Location in 3x3 note grid to change note.
        let noteDivs = this.c.m.element.querySelectorAll('.note');
        if (noteDivs.length === 0) {
            // Insert note divs if the cell doesn't have any
            this.c.m.insertNoteDivs();
            noteDivs = this.c.m.element.querySelectorAll('.note');
        }
        let targetNote = noteDivs[valueIdx];
        if (targetNote.textContent == value) {
            // if note for value exists, remove it
            targetNote.textContent = '';
        } else {
            // else, add it
            targetNote.textContent = String(value);
        }
        // Remove 'strike' class from note if it was there
        targetNote.classList.remove('strike');

        this.c.m.element.classList.remove('user-input');
        this.c.m.element.classList.add('note-cell');
    }

    strike(value) {
        let valueIdx = value - 1;
        let noteDivs = this.c.m.element.querySelectorAll('.note');
        let targetNote = noteDivs[valueIdx];
        targetNote.classList.add('strike');
    }
}

class Controller {
    constructor(grid, autoNote=false) {
        this.g = grid;
        this.inputSequence = [];
        this.input = null;
        this.noteAdd = false;
        this.noteStrike = false;
        this.autoNote = autoNote;
        this.listen();
    }

    initialize() {
        // Numpad controls
        for (let i = 1; i <= nums.length; i++) {
            let control = document.createElement('button');
            control.classList.add('numpad-control');
            control.id = `control-${i}`;
            control.textContent = `${i}`;
            control.addEventListener('click', () => {
                this.input = i;
                this.storeSelectedState();
                this.updateState(this.input);
                this.g.m.activateCells(this.input);

                // Deselect previous control button
                let activeCtrl = controls.querySelector('.control-active');
                if (activeCtrl) {
                    activeCtrl.classList.toggle('control-active');
                }
                // Select new control button.
                control.classList.toggle('control-active');
            })
            controls.append(control);
        }
        // Extra controls
        // Undo button
        let undoBtn = document.createElement('button');
        undoBtn.classList.add('extra-control');
        undoBtn.textContent = 'Undo';
        undoBtn.addEventListener('click', () => {
            this.undo();
        })
        // Note add/remove buton 
        let noteChangeBtn = document.createElement('button');
        noteChangeBtn.classList.add('extra-control');
        noteChangeBtn.id = 'note-change';
        noteChangeBtn.textContent = 'Note +/-';
        noteChangeBtn.addEventListener('click', () => {
            noteChangeBtn.classList.toggle('control-active');
            noteStrikeBtn.classList.remove('control-active');
            this.noteAdd = !this.noteAdd;
            this.noteStrike = false;
        })

        // Note cross-out button
        let noteStrikeBtn = document.createElement('button');
        noteStrikeBtn.classList.add('extra-control');
        noteStrikeBtn.id = 'note-strike';
        noteStrikeBtn.textContent = 'Note Strike';
        noteStrikeBtn.addEventListener('click', () => {
            noteStrikeBtn.classList.toggle('control-active');
            noteChangeBtn.classList.remove('control-active');
            this.noteStrike = !this.noteStrike;
            this.noteAdd = false;
        })
        extraControls.append(undoBtn);
        extraControls.append(noteChangeBtn);
        extraControls.append(noteStrikeBtn);
    }

    handleEvent(e) {
        /**
         * Handles keydown events. Necessary to prevent arrow navigation breaking for new puzzles.
         * 
         * Puzzle generation creates a new Controller each time, and each Controller adds a keydown EventListener to the Document.
         * These EventListeners need to be removed and readded after every new puzzle.
         */
        switch(e.type) {
            case 'keydown':
                let numKeys = {};
                for (let i = 1; i <= nums.length; i++) {
                    numKeys[`Numpad${i}`] = i;
                    numKeys[`Digit${i}`] = i;
                }
                let arrowKeys = {
                    'ArrowUp': 'up',
                    'ArrowLeft': 'left',
                    'ArrowRight': 'right',
                    'ArrowDown': 'down',
                };
                if (numKeys[e.code]) {
                    this.processNumKey(numKeys[e.code]);
                } else if (arrowKeys[e.code]) {
                    this.processArrowKey(arrowKeys[e.code])
                } else if (e.ctrlKey && e.code === 'KeyZ') {
                    this.undo();
                } else if (e.code === 'KeyX') {
                    let noteStrikeBtn = document.querySelector('#note-strike');
                    noteStrikeBtn.click();
                } else if (e.code === 'KeyA') {
                    let noteChangeBtn = document.querySelector('#note-change');
                    noteChangeBtn.click();
                }
        }
    }

    listen() {
        document.addEventListener('keydown', this);
    }

    stopListen() {
        document.removeEventListener('keydown', this);
    }

    storeSelectedState() {
        /**
         * Stores state of selected cell for use in undo action.
         */
        if (this.g.m.selectedCell) {
            let targetCell = this.g.m.selectedCell;
            let state = {
                'row': targetCell.rowIdx,
                'col': targetCell.colIdx,
                'value': targetCell.value,
            };
            this.inputSequence.push(state);
        }
    }

    updateState(value, undoToEmpty=false) {
        let cell = this.g.m.selectedCell;
        if (this.noteAdd) {
            // Add/remove a note for a particular cell
            cell.noteM.change(value);
        } else if (this.noteStrike) {
            // Cross out a note
            cell.noteM.strike(value);
        } else if (cell) {
            // Update cell's value
            if (value != undefined && cell && !cell.m.element.classList.contains('hint')) {
                if (!undoToEmpty) {
                    // If we're putting in a new value or undoing to another user-input value
                    cell.m.element.textContent = '';
                    cell.m.element.classList.remove('note-cell');
                    cell.m.element.classList.add('user-input');

                    // If cell was empty, decrement Grid's empty cell counter
                    if (cell.value === 0) {
                        this.g.emptyCells--;
                    }
                } 
                else {
                    // If we're undoing to an empty cell
                    this.g.emptyCells++; // Increment Grid's empty cell counter
                    cell.m.element.classList.remove('user-input');
                }

                cell.m.update(value);

            }
            cell.m.element.classList.add('selected');
            this.g.updateCandidates();
            if (this.autoNote) {
                this.g.m.automaticNotes();
            }
        }
    }

    undo() {
        /**
         * Undos a user number input action to previous state.
         */
        if (this.inputSequence.length > 0) {
            let undoState = this.inputSequence.pop();
            this.g.m.selectCoords(undoState.row, undoState.col);
            let cell = this.g.m.selectedCell;
            if (undoState.value === 0) {
                // If previous state had value of 0, then it was an empty cell
                this.updateState(undoState.value, true);
            } else {
                this.updateState(undoState.value);
            }
        }
    }

    processNumKey(value) {
        /**
         * If user inputs a number key on keyboard, simulates a button press on HTML numpad.
         */
        this.input = value;
        let controlBtn = document.querySelector(`#control-${this.input}`);
        controlBtn.click();
    }

    processArrowKey(direction) {
        let selected = document.querySelector('.selected');
        if (!selected) {
            // If user hasn't selected a cell yet, start at upper right corner.
            this.g.m.selectCoords(0, 0);
        } else {
            let [row, col] = [this.g.m.selectedCell.rowIdx, this.g.m.selectedCell.colIdx];
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
            if (row > this.g.rows - 1) row = this.g.rows - 1;
            if (col < 0) col = 0;
            if (col > this.g.cols - 1) col = this.g.cols - 1;

            this.g.m.selectCoords(row, col);
        }
    }


}


class GameManager {
    constructor() {
        this.g = null;
        this.gridMonitor = null;
        this.controller = null;
    }

    createPuzzle(difficulty) {
        if (this.controller) {
            this.controller.stopListen();
        }
        container.textContent = '';
        controls.textContent = '';
        extraControls.textContent = '';
        this.g = new Grid();
        this.g.solve(true);
        this.solution = this.g.copy();
        let hintTarget;
        switch (difficulty) {
            case 'easy':
                hintTarget = 35;
                break;
            case 'medium':
                hintTarget = 30;
                break;
            case 'hard':
                hintTarget = 25;
                break;
        }
        this.g.removeHints(hintTarget);
        this.g.updateCandidates();
        this.g.m.initialize();

        this.controller = new Controller(this.g);
        this.controller.initialize();
    }

    checkSolution() {
        let hideOverlayAfterDelay;
        let overlay = document.createElement('div');
        overlay.id = 'overlay';
        if (this.g.emptyCells === 0){
            let correct = true;
            let numIncorrect = 0;
            for (let i = 0; i < this.g.rows; i++) {
                for (let j = 0; j < this.g.cols; j++) {
                    let solnCell = this.solution.cells[i][j];
                    let actualCell = this.g.cells[i][j];
    
                    // Check against solution and that the cell isn't empty
                    if (actualCell.value != solnCell.value) {
                        correct = false;
                        numIncorrect++;
                        if (actualCell.value != 0) {
                            actualCell.m.element.classList.add('invalid');
                        }
                    } else {
                        actualCell.m.element.classList.remove('invalid');
                    }
                }
            }
            if (correct) {
                overlay.textContent = 'Puzzle Complete!';
                hideOverlayAfterDelay = false;
            } else {
                overlay.textContent = `Incorrect Cells: ${numIncorrect}`
                hideOverlayAfterDelay = true;
            }
        } else {
            overlay.textContent = 'Please finish the puzzle before checking :~)'
            hideOverlayAfterDelay = true;
        }
        container.append(overlay);

        if (hideOverlayAfterDelay) {
            setTimeout(() => {
                overlay.remove();
            }, 2000)
        }
    }

}

// Prevent arrow keys from scrolling (https://stackoverflow.com/questions/8916620/disable-arrow-key-scrolling-in-users-browser/8916697)
window.addEventListener("keydown", function(e) {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

(runApplication = () => {
    let gameM = new GameManager();
    gameM.createPuzzle('medium');

    document.getElementById('new-easy').addEventListener('click', () => gameM.createPuzzle('easy'));
    document.getElementById('new-medium').addEventListener('click', () => gameM.createPuzzle('medium'));
    document.getElementById('new-hard').addEventListener('click', () => gameM.createPuzzle('hard'));

    document.getElementById('auto-notes').addEventListener('click', () => {
        gameM.controller.autoNote = true;
        if (gameM.controller.autoNote) {
            gameM.g.m.automaticNotes();
        }
    });

    document.getElementById('check').addEventListener('click', () => gameM.checkSolution());

})();