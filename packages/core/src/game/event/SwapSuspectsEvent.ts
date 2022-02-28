import Position from "../../util/Position";
import GameEvent from "./GameEvent";

export default interface SwapSuspectsEvent extends GameEvent {
    readonly type: 'SwapSuspects';

    readonly position1: Position;
    readonly position2: Position;
}