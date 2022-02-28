import Position from "../../util/Position";
import GameEvent from "./GameEvent";

export default interface ProtectDecisionEvent extends GameEvent {
    readonly type: 'DecideProtect';

    readonly target: Position;
    readonly protect: boolean;
}