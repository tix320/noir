import { Direction } from "../util/Direction";

export default interface Shift {
    direction: Direction;
    index: number;
    fast: boolean;
}