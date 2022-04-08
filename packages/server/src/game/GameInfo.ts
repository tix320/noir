import { GameState } from "@tix320/noir-core/src/game/Game";

export default interface GameInfo {
    id: string;
    name: string;
    state: GameState;
}