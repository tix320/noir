export default class Position {

    constructor(public readonly x: number, public readonly y: number) {
        this.x = x;
        this.y = y;
    }

    isAdjacentTo(pos: Position) {
        if (this.equals(pos)) {
            return false;
        }

        if (Math.abs(this.x - pos.x) > 1) {
            return false;
        }

        if (Math.abs(this.y - pos.y) > 1) {
            return false;
        }

        return true;
    }

    equals(other: Position): boolean {
        return this.x === other.x && this.y === other.y;
    }

    toString(): string {
        return `[${this.x}:${this.y}]`;
    }
}