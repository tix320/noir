import Position from "./Position";

export function indexTo2DPosition(rowLength: number, index: number): Position {
    return new Position(index / rowLength, index % rowLength);
}