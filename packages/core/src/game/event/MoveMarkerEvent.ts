import Position from "../../util/Position";
import { Marker } from "../Marker";
import GameEvent from "./GameEvent";

export default interface MoveMarkerEvent extends GameEvent {
    readonly type: 'MoveMarker';

    readonly from: Position;
    readonly to: Position;
    readonly marker: Marker;
}