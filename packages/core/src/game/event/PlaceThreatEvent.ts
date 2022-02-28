import Position from "../../util/Position";
import GameEvent from "./GameEvent";

export default interface PlaceThreatEvent extends GameEvent {
    readonly type: 'PlaceThreat';

    readonly target: Position;
}