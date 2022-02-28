import Position from "../../util/Position";
import { RoleType } from "../RoleType";
import GameEvent from "./GameEvent";

export default interface AccuseEvent extends GameEvent {
    readonly type: 'Accuse';

    readonly target: Position;
    readonly mafioso: RoleType;
}