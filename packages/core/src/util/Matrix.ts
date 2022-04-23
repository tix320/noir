import { assert } from "./Assertions";
import { Direction } from "./Direction";
import Position from "./Position";

export default class Matrix<T> {
    private static ADJACENCY_OFFSETS = [
        [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    ]

    private readonly matrix: T[][];

    constructor(matrix: T[][]) {
        this.matrix = matrix;
    }

    get size() {
        return this.matrix.length;
    }

    at(x: number, y: number): T {
        this.assertCoords(x, y);

        const d = this.matrix[x][y];

        return this.matrix[x][y];
    }

    atPosition(position: Position): T {
        this.assertPosition(position);

        return this.at(position.x, position.y);
    }

    set(x: number, y: number, value: T) {
        this.assertCoords(x, y);

        this.matrix[x][y] = value;
    }

    setToPosition(position: Position, value: T) {
        this.assertPosition(position);

        this.set(position.x, position.y, value);
    }

    swap(position1: Position, position2: Position) {
        this.assertPosition(position1);
        this.assertPosition(position2);

        const temp = this.atPosition(position1);
        this.setToPosition(position1, this.atPosition(position2));
        this.setToPosition(position2, temp);
    }

    getAdjacentPositions(position: Position): Position[] {
        this.assertPosition(position);

        const neighbors: Position[] = [];

        Matrix.ADJACENCY_OFFSETS.forEach(offset => {
            const newX = position.x + offset[0];
            const newY = position.y + offset[1];

            if (this.checkCoords(newX, newY)) {
                neighbors.push(new Position(newX, newY));
            }
        });

        return neighbors;
    }

    getOrthogonalPositions(position: Position, maxDistance: number): Position[] {
        this.assertPosition(position);

        if (maxDistance < 0) {
            throw new Error(`Invalid distance ${maxDistance}`);
        }

        const crossPositions: Position[] = [];

        let distance = 0;
        for (let i = position.x - 1; i >= 0 && distance < maxDistance; i--, distance++) {
            crossPositions.push(new Position(i, position.y));
        }

        distance = 0;
        for (let j = position.y + 1; j < this.size && distance < maxDistance; j++, distance++) {
            crossPositions.push(new Position(position.x, j));
        }

        distance = 0;
        for (let i = position.x + 1; i < this.size && distance < maxDistance; i++, distance++) {
            crossPositions.push(new Position(i, position.y));
        }

        distance = 0;
        for (let j = position.y - 1; j >= 0 && distance < maxDistance; j--, distance++) {
            crossPositions.push(new Position(position.x, j));
        }


        return crossPositions;
    }

    getDiagonalPositions(position: Position, maxDistance: number): Position[] {
        this.assertPosition(position);

        if (maxDistance < 0) {
            throw new Error(`Invalid distance ${maxDistance}`);
        }

        const diagonals: Position[] = [];

        let distance = 0;
        for (let i = position.x - 1, j = position.y - 1; i >= 0 && j >= 0 && distance < maxDistance; i--, j--, distance++) {
            diagonals.push(new Position(i, j));
        }

        distance = 0
        for (let i = position.x - 1, j = position.y + 1; i >= 0 && j < this.size && distance < maxDistance; i--, j++, distance++) {
            diagonals.push(new Position(i, j));
        }

        distance = 0
        for (let i = position.x + 1, j = position.y - 1; i < this.size && j >= 0 && distance < maxDistance; i++, j--, distance++) {
            diagonals.push(new Position(i, j));
        }

        distance = 0
        for (let i = position.x + 1, j = position.y + 1; i < this.size && j < this.size && distance < maxDistance; i++, j++, distance++) {
            diagonals.push(new Position(i, j));
        }


        return diagonals;
    }

    shift(direction: Direction, index: number, count: number) {
        if (count === 0 || count == this.size) {
            return;
        }

        if (count > this.size) {
            throw new Error("Shift count cannot be greater than matrix size");
        }

        const temp: T[] = [];
        switch (direction) {
            case Direction.UP:
                for (let i = 0; i < this.size; i++) {
                    const target = i + count < this.size ? i + count : i - (this.size - count);
                    temp[i] = this.matrix[target][index];
                }
                for (let i = 0; i < this.size; i++) {
                    this.matrix[i][index] = temp[i];
                }
                break;
            case Direction.DOWN:
                for (let i = 0; i < this.size; i++) {
                    const target = i - count >= 0 ? i - count : i + (this.size - count);
                    temp[i] = this.matrix[target][index];
                }
                for (let i = 0; i < this.size; i++) {
                    this.matrix[i][index] = temp[i];
                }
                break;
            case Direction.LEFT:
                for (let i = 0; i < this.size; i++) {
                    const target = i + count < this.size ? i + count : i - (this.size - count);
                    temp[i] = this.matrix[index][target];
                }
                for (let i = 0; i < this.size; i++) {
                    this.matrix[index][i] = temp[i];
                }
                break;
            case Direction.RIGHT:
                for (let i = 0; i < this.size; i++) {
                    const target = i - count >= 0 ? i - count : i + (this.size - count);
                    temp[i] = this.matrix[index][target];
                }
                for (let i = 0; i < this.size; i++) {
                    this.matrix[index][i] = temp[i];
                }
                break;
        }
    }

    findFirst(predicate: (item: T) => boolean): [T, Position] | undefined {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const item = this.at(i, j);
                if (predicate(item)) {
                    return [item, new Position(i, j)];
                }
            }
        }

        return undefined;
    }

    foreach(handler: (element: T, position: Position) => void): void {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const item = this.at(i, j);
                const position = new Position(i, j);
                handler(item, position);
            }
        }
    }

    filter(predicate: (element: T, position: Position) => boolean): Position[] {
        const result = [];

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const item = this.at(i, j);
                const position = new Position(i, j);
                if (predicate(item, position)) {
                    result.push(position);
                }
            }
        }

        return result;
    }

    map<N>(mapper: (item: T) => N): Matrix<N> {
        const newMatrix = [...Array(this.size)].map(a => Array(this.size));

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const item = this.matrix[i][j];
                newMatrix[i][j] = mapper(item);
            }
        }

        return new Matrix(newMatrix);
    }

    count(predicate: (element: T) => boolean): number {
        let count = 0;

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const item = this.at(i, j);
                if (predicate(item)) {
                    count++;
                }
            }
        }

        return count;
    }

    clone(itemsCloning: (item: T) => T): Matrix<T> {
        return this.map(itemsCloning);
    }

    raw(): T[][] {
        return this.matrix;
    }

    private assertPosition(position: Position) {
        this.assertCoords(position.x, position.y);
    }

    private assertCoords(x: number, y: number) {
        assert(this.checkCoords(x, y), `Out of bounds position ${x}:${y}`);
    }

    private checkCoords(x: number, y: number) {
        return x >= 0 && x < this.size && y >= 0 && y < this.size;
    }
}