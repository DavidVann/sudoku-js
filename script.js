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
    }
    static validVals = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    valid() {
        return Cell.validVals.has(this.value);
    }
}



class GridBuilder {
    constructor() {
        this.rows = 9;
        this.cols = 9;
        this.grid = [];
        for(let i=0; i < this.rows; i++) {
            let row = [];
            for(let j=0; j < this.cols; j++) {
                let cell = new Cell()
                row.push(cell);
            }
            this.grid.push(row);
        }
    }

    buildGrid() {

    }

    solveGrid() {
        
    }

}

aGrid = new Grid()