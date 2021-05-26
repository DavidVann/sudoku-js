const container = document.getElementById("game-container");


function countOccurences(array, value) {
    /**
     * Returns number of occurrences of a value in array
     */
    return array.reduce((acc, currentVal) => acc + (currentVal == value), 0);
}

class Cell {
    constructor(value=0, notes=[]) {
        this.value = value;
        this.notes = notes;
        this.house = null;
        this.row = null;
        this.col = null;
    }
}


class Grid {
    constructor() {
        this.rows = 9;
        this.cols = 9;
        this.grid = [];
        for(let i=0; i < this.rows; i++) {
            let row = [];
            this.grid.push(row);
            for(let j=0; j < this.cols; j++) {
                let cell = new Cell();
                cell.row = row;
                if(i == 0 && j == 8) {
                    cell.value = 9;
                }
                row.push(cell);
            }
        }
        
    }

    getHouse() {

    }

    checkGrid() {
        for(let i=0; i < this.rows; i++) {

        }
    }

    buildGrid() {

    }

    solveGrid() {

    }

}

range = (end) => {
    return [...Array(end).keys()]
}

shuffle = (array) => {
    // arr = [...array] // copy array
    arr = array // in-place modification
    n = arr.length
    for(let i=n-1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

g = new Grid()

// Create 9x9 grid of 0s
let grid = [...Array(9)].map(() => Array(9).fill(0));
let testGrid = [...Array(9)].map(() => Array(9).fill(new Cell(0)))

const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
for(let i=0; i < 81; i++) {
    row = Math.floor(i / 9);
    col = i % 9;
    if (grid[row][col] === 0) {
        shuffle(nums);
        for (num of nums) {
            let gridRow = grid[row];
            let gridCol = [];
            for (let colRow=0; colRow < 9; colRow++) {
                gridCol.push(grid[colRow][col]);
            }
            let house = [];
            if (row < 3) {
                if (col < 3){
                    house = 1;
                }
            }
            if (!gridRow.includes(num) && !gridCol.includes(num)){

            }
        }
    }

}
