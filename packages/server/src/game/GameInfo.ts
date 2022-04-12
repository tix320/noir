import { GameState } from "@tix320/noir-core/src/game/Game";

export default interface GameInfo {
    readonly id: string;
    readonly name: string;
    readonly state: GameState;
}