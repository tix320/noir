import Position from "../../util/Position";
import GameEvent from "./GameEvent";

export default interface DisguiseEvent extends GameEvent {
    readonly type: 'Disguise';

    readonly oldIdentity: Position;
    readonly newIdentity: Position;
}