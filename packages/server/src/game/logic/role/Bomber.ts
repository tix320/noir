import { User } from "../../../user";
import GameLogic from "../GameLogic";
import Player from "../Player";

export default class Bomber extends Player {

    constructor(user: User, gameLogic: GameLogic) {
        super(user, gameLogic);
    }

    isMafioso(): boolean {
        return true;
    }

    canDoFastShift(): boolean {
        return false;
    }

    protected onTurnStart() {
        // TODO: self destruct reaction
    }
}