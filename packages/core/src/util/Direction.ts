export enum Direction {
    UP = 'UP',
    DOWN = 'DOWN',
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
}

export namespace Direction {
    export const ALL: readonly Direction[] = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT] as const;

    export function getReverse(direction: Direction): Direction {
        switch (direction) {
            case Direction.UP:
                return Direction.DOWN;
            case Direction.DOWN:
                return Direction.UP;
            case Direction.LEFT:
                return Direction.RIGHT;
            case Direction.RIGHT:
                return Direction.LEFT;
        }
    }
}