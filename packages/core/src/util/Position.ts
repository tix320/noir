export default class Position {
    private static offsets = [
        [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    ]

    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
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