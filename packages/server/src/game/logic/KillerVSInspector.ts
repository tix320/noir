import { Player } from "../Player";
import GameLogic from "./GameLogic";

export default class KillerVSInspector extends GameLogic {

    constructor(players: Player[]) {
        super(players, 5, [14, 1]);
    }
}