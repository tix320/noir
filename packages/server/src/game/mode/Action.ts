import Game from "../Game";
import { Player } from "../Player";
import GameStrategy from "./GameStrategy";

export default abstract class Action {

    abstract do(player: Player, gameStrategy: GameStrategy): ActionResult;
}

export abstract class ActionResult {

}

export class GameEnded {
    reason: string

    constructor(reason: string) {
        this.reason = reason;
    }
}