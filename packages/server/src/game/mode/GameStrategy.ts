import { GameMode } from "@tix320/noir-core";
import { Player } from "../Player";
import Suspect from "../role/Suspect";
import Action from "./Action";
import KillerVSInspector from "./KillerVSInspector";

export default abstract class GameStrategy {

    abstract readonly suspects: Suspect[][];

    abstract getType(): GameMode;

    abstract doAction(action: Action);

    get arenaSize() {
        return this.suspects.length;
    }

    // public static createStrategyByMode(mode: GameMode, players: Player[]): GameStrategy {
    //     switch (mode) {
    //         case GameMode.KILLER_VS_INSPECTOR:
    //             return new KillerVSInspector(players);
    //         case GameMode.MAFIA_VS_FBI:
    //             return new MafiaVSFBI(players);
    //         default:
    //             throw new Error(`Invalid mode ${mode}`);
    //     }
    // }
}