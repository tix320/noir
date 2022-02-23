export default class Position {
    private static offsets = [
        [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    ]

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

    getAdjacents(bound: number): Position[] {
        const neighbors: Position[] = [];

        Position.offsets.forEach(offset => {
            const newX = this.x + offset[0];
            const newY = this.y + offset[0];

            if (newX >= 0 && newX < bound && newY >= 0 && newY < bound) {
                neighbors.push(new Position(newX, newY));
            }
        });

        return neighbors;
    }

    equals(other: Position): boolean {
        return this.x === other.x && this.y === other.y;
    }
}