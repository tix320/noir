import Position from "../../util/Position";
import GameEvent from "./GameEvent";

export default interface PlaceBombEvent extends GameEvent {
    readonly type: 'PlaceBomb';

    readonly target: Position;
}