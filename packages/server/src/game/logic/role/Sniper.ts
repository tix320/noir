import { Direction } from "@tix320/noir-core";
import Position from "@tix320/noir-core/src/util/Position";
import { User } from "../../../user";
import GameLogic, { Context } from "../GameLogic";
import Player from "../Player";
import { Suspect } from "../Suspect";

export default class Sniper extends Player {

    constructor(user: User, gameLogic: GameLogic) {
        super(user, gameLogic);
    }

    isMafioso(): boolean {
        return true;
    }

    canDoFastShift(): boolean {
        return true;
    }

    protected onTurnStart() {
        // no-op
    }
}