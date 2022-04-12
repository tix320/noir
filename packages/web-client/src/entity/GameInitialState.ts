import { Arena, Player } from "@tix320/noir-core/src/game/Game";
import User from "./User";

export interface GameInitialState {
    players: Player<User>[];
    arena: Arena;
}