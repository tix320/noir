import { RoleType } from "../../..";
import Position from "../../util/Position";
import GameEvent from "./GameEvent";

export default interface CanvasEvent extends GameEvent {
    readonly type: 'Canvas';

    readonly target: Position;
    readonly players: RoleType[];
}