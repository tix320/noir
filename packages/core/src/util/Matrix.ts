import { Direction } from "./Direction";
import Position from "./Position";

export default class Matrix<T> {
    private readonly matrix: T[][];

    constructor(matrix: T[][]) {
        this.matrix = matrix;
    }

    get size() {
        return this.matrix.length;
    }

    at(x: number, y: number): T {
        return this.matrix[x][y];
    }

    atPosition(position: Position): T {
        return this.at(position.x, position.y);
    }

    set(x: number, y: number, value: T) {
        this.matrix[x][y] = value;
    }

    setToPosition(position: Position, value: T) {
        this.set(position.x, position.y, value);
    }

    swap(position1: Position, position2: Position) {
        const temp = this.atPosition(position1);
        this.setToPosition(position1, this.atPosition(position2));
        this.setToPosition(position2, temp);
    }

    shift(direction: Direction, index: number, count: number) {
        if (count === 0 || count == this.size) {
            return;
        }

        if (count > this.size) {
            throw new Error("Shift count cannot be greathr than matrix size");
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
                    const target = i - count < this.size ? i - count : i + (this.size - count);
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
                    const target = i - count < this.size ? i - count : i + (this.size - count);
                    temp[i] = this.matrix[index][target];
                }
                for (let i = 0; i < this.size; i++) {
                    this.matrix[index][i] = temp[i];
                }
                break;
        }
    }
}