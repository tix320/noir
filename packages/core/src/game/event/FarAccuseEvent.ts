import Position from "../../util/Position";
import { RoleType } from "../RoleType";
import GameEvent from "./GameEvent";

export default interface FarAccuseEvent extends GameEvent {
    readonly type: 'FarAccuse';

    readonly target: Position;
    readonly mafioso: RoleType;
}