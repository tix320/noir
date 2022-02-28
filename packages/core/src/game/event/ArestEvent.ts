import Position from "../../util/Position";
import GameEvent from "./GameEvent";

export default interface ArestEvent extends GameEvent {
    readonly type: 'Arest';

    readonly target: Position;
    readonly newIdentity: Position;
}