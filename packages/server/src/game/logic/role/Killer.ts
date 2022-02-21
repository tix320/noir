import { Direction } from "@tix320/noir-core";
import Shift from "@tix320/noir-core/src/game/Shift";
import Position from "@tix320/noir-core/src/util/Position";
import { User } from "../../../user";
import GameLogic from "../GameLogic";
import Player from "../Player";
import { Suspect } from "../Suspect";
import { RoleHelper } from "./RoleHelper";
import Suit from "./Suit";

export default class Killer extends Player {

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

    kill(targetPosition: Position) {
        this.startTurn();

        const arena = this.context.arena;

        const neighborns = targetPosition.getAdjacents(arena.size);

        const isValidTarget = neighborns.some(position => arena.atPosition(position).player === this);
        if (!isValidTarget) {
            throw new Error(`Invalid target=${arena.atPosition(targetPosition)}. You can kill only your neighbors`);
        }

        const suspect: Suspect = this.context.arena.atPosition(targetPosition);
        const killed = RoleHelper.tryKillSuspect(targetPosition, suspect, this.context);

        if (killed) {
            this.endTurn({ checkScores: true });
        } else {
            this.endTurn({ nextPlayer: this.context.players.find(player => player instanceof Suit) });
        }
    }

    disguise() {
        this.startTurn();

        RoleHelper.tryPeekNewIdentityFor(this, this.context);

        this.endTurn({});
    }
}