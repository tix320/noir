import Player from "../role/Player";
import { RoleType } from "../RoleType";

export default interface GameEvent {

    readonly type: string;

    readonly actor: RoleType;
    readonly currentTurnPlayer: Player<any>;
}