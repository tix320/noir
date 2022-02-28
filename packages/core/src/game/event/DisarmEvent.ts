import Position from "../../util/Position";
import { Marker } from "../Marker";
import GameEvent from "./GameEvent";

export default interface DisarmEvent extends GameEvent {
    readonly type: 'Disarm';

    readonly target: Position;
    readonly marker: Marker;
}