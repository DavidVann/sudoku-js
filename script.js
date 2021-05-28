const container = document.getElementById("game-container");
const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];


// const countOccurences = (array, value) => {
//     /**
//      * Returns number of occurrences of a value in array
//      */
//     return array.reduce((acc, currentVal) => acc + (currentVal == value), 0);
// }

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
    // arr = array // in-place modification
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
    }

    displaySetup() {
        /**
         * Associate HTML elements with cell if used for displaying
         */
        this.element = document.createElement('div');
        this.element.textContent = String(this.value);
        this.element.classList.add('grid-cell');
    }

    activate() {
        if (this.element != undefined) {
            this.element.classList.toggle('active');
        }
    }

    update(value) {
        /**
         * Updates internal value of Cell and updates DOM display (if element is defined).
         */
        this.value = value;
        if (this.element != undefined) {
            this.element.textContent = String(this.value)
        }
    }

    validate(candidate) {
        /**
         * Checks that this Cell is the only one of its value in its row, column, and house.
         * @param {number} [candidate] - Candidate value to validate, if not the cell's current value.
         */
        let comparison, expected, isValid;
        if (candidate) {
            comparison = candidate;
            expected = 0;
        } else {
            comparison = this.value;
            expected = 1;
        }

        if (comparison === 0) {
            isValid = false;
        } else {
            let rowValid = this.row.filter(cell => cell.value === comparison).length === expected;
            let colValid = this.col.filter(cell => cell.value === comparison).length === expected;
            let houseValid = this.house.filter(cell => cell.value === comparison).length === expected;
    
            isValid = rowValid && colValid && houseValid;
        }

        if (this.element != undefined) {
            if (!isValid) {
                this.element.classList.add('invalid')
            } else {
                this.element.classList.remove('invalid')
            }    
        }
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
        this.solutions = 0;
        this.fillAssociateCells();
    }

    fillAssociateCells() {
        /**
         * Fills grid and associates every cell in the grid with its row, column, and house for easy referencing.
         */
        // Fill grid with Cells and populate DOM
        for (let i = 0; i < this.rows; i++) {
            let row = [];
            this.cells.push(row);
            for (let j = 0; j < this.cols; j++) {
                let cell = new Cell(0)
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
            this.display();

            let branch = this.copy();

            let solutions = 0;
            branch.solve();
            solutions += branch.solutions;
            if (solutions != 1) {
                this.cells[row][col].value = backup;
                attempts -= 1;
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
         * 
         */
        let coloredHouses = [1, 3, 5, 7];
        for (let row of this.cells) {
            let rowDisplay = document.createElement('div');
            rowDisplay.classList.add('grid-row');
            container.append(rowDisplay);
            for (let cell of row) {
                cell.displaySetup();
                if (coloredHouses.includes(cell.houseIdx)) {
                    cell.element.classList.add('house-alt')
                }
                rowDisplay.append(cell.element)
            }
        }
    }

    setup() {
        this.solve(true);
        // this.removeHints(5);
        // this.validateSolution();
    }

    display() {
        for (let row of this.cells) {
            for (let cell of row) {
                cell.update(cell.value);
            }
        }
    }


    // solve() {
    //     let row, col, cell;
    //     for (let i = 0; i < this.size; i++) {
    //         row = Math.floor(i / 9);
    //         col = i % 9;
    //         cell = this.cells[row][col];

    //         if (cell.value === 0) {
    //             for (let num of range(1, 10)) {
    //                 if (cell.validate(num)) {
                        
    //                 }
    //             }
    //         }

    //     }
    // }

}

class Manager {
    constructor() {
        this.g = new Grid();

        this.active = null;
        this.prevActive = null;
        this.setup();
    }

    setup() {
        this.g.setup();
        this.g.displaySetup();


    }


    
}

// (runApplication = () => {
//     gm = new GameManager();
// })();

let g = new Grid();
// g.fillAssociateCells();
g.displaySetup();
g.solve(true);
g.display();
g.removeHints(1);
g.display();
g.validateSolution();

let copyG = g.copy();

// Testing
for(let c of g.cells[0][0].house) {
    // c.activate();
}



// g.generateGrid();
// g.validateSolution();
// g.pprint();

// Create 9x9 grid of 0s
// let grid = [...Array(9)].map(() => Array(9).fill(0));