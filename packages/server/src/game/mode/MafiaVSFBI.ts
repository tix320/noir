import { GameMode } from "@tix320/noir-core";
import { Player } from "../Player";
import Suspect from "../role/Suspect";
import Action from "./Action";
import GameStrategy from "./GameStrategy";

export default class MafiaVSFBI extends GameStrategy {
    suspects: Suspect[][];

    constructor(players: Player[]) {
        super();

    }

    getType() {
        return GameMode.MAFIA_VS_FBI
    }

    doAction(action: Action) {
        throw new Error('Method not implemented.');
    }
}