import { User } from "../../../user";
import GameLogic from "../GameLogic";
import Player from "../Player";

export default class Detective extends Player {

    constructor(user: User, gameLogic: GameLogic) {
        super(user, gameLogic);
    }

    isMafioso(): boolean {
        return false;
    }

    canDoFastShift(): boolean {
        return true;
    }

    protected onTurnStart() {
        // no-op
    }
}