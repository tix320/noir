import Position from "../../util/Position";
import GameEvent from "./GameEvent";

export default interface AbstractKillEvent extends GameEvent {

    readonly target: Position;
    readonly newIdentity?: Position;
}