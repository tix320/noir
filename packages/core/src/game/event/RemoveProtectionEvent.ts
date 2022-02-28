import Position from "../../util/Position";
import GameEvent from "./GameEvent";

export default interface RemoveProtectionEvent extends GameEvent {
    readonly type: 'RemoveProtection';

    readonly target: Position;
}