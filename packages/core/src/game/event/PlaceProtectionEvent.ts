import Position from "../../util/Position";
import GameEvent from "./GameEvent";

export default interface PlaceProtectionEvent extends GameEvent {
    readonly type: 'PlaceProtection';

    readonly target: Position;
}