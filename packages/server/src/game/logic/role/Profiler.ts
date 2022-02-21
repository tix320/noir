import { User } from "../../../user";
import GameLogic from "../GameLogic";
import Player from "../Player";

export default class Profiler extends Player {

    constructor(user: User, gameLogic: GameLogic) {
        super(user, gameLogic);
    }

    isMafioso(): boolean {
        return false;
    }

    canDoFastShift(): boolean {
        return false;
    }

    protected onTurnStart() {
        // no-op
    }
}