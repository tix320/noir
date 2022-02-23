import { Identity, Marker } from "@tix320/noir-core";
import Position from "@tix320/noir-core/src/util/Position";
import { Suspect } from "../Suspect";
import { GameHelper } from "./GameHelper";
import Player from "./Player";
import Suit from "./Suit";

export default class Killer<I extends Identity> extends Player<I> {

    isMafioso(): boolean {
        return true;
    }

    canDoFastShift(): boolean {
        return true;
    }

    ownMarker(): Marker | undefined {
        return undefined;
    }

    protected onTurnStart() {
        // no-op
    }

    kill(targetPosition: Position) {
        this.startTurn();

        const arena = this.context.arena;

        const neighborns = targetPosition.getAdjacents(arena.size);

        const isValidTarget = neighborns.some(position => arena.atPosition(position).role === this);
        if (!isValidTarget) {
            throw new Error(`Invalid target=${arena.atPosition(targetPosition)}. You can kill only your neighbors`);
        }

        const suspect: Suspect = this.context.arena.atPosition(targetPosition);
        const killed = GameHelper.tryKillSuspect(targetPosition, this.context);

        if (killed) {
            this.endTurn({ checkScores: true });
        } else {
            this.endTurn({ nextPlayer: GameHelper.findPlayer(Suit, this.context) });
        }
    }

    disguise() {
        this.startTurn();

        GameHelper.tryPeekNewIdentityFor(this, this.context);

        this.endTurn({});
    }
}