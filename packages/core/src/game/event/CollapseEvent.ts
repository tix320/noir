import { Direction } from "../../..";
import GameEvent from "./GameEvent";

export default interface CollapseEvent extends GameEvent {
    readonly type: 'Collapse';

    readonly direction: Direction;
}