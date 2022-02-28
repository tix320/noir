import { Direction } from "../..";

export default interface Shift {
    direction: Direction;
    index: number;
    fast: boolean;
}