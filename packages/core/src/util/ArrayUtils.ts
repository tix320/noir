import Position from "./Position";

export function indexTo2DPosition(rowLength: number, index: number): Position {
    return new Position(index / rowLength, index % rowLength);
}

export function swap(arr: any[], index1: number, index2: number) {
    const tmp = arr[index1];
    arr[index1] = arr[index2];
    arr[index2] = tmp;
}