import { Marker } from "@tix320/noir-core";
import Position from "@tix320/noir-core/src/util/Position";
import { User } from "../../../user";
import GameLogic from "../GameLogic";
import Player from "../Player";
import { GameHelper } from "./GameHelper";
import Suit from "./Suit";

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

    ownMarker(): Marker | undefined {
        return Marker.BOMB;
    }

    protected onTurnStart() {
        // TODO: self destruct reaction
    }

    protected startTurn(): void {
        super.startTurn();
        if (this.context.bomber.lastDetonatedBomb) {
            throw new Error("You must continue bomb detonation");
        }
    }

    placeBomb(targetPosition: Position) {
        this.startTurn();

        const arena = this.context.arena;

        const neighborns = targetPosition.getAdjacents(arena.size);

        const targetSuspect = arena.atPosition(targetPosition);

        const isValidTarget = targetSuspect.player === this || neighborns.some(position => arena.atPosition(position).player === this);
        if (!isValidTarget) {
            throw new Error(`Invalid target=${arena.atPosition(targetPosition)}. You can place bomb only on yourself or adjacent suspects`);
        }

        if (targetSuspect.markers.has(Marker.BOMB)) {
            throw new Error('Target already has bomb');
        }

        targetSuspect.markers.add(Marker.BOMB);

        this.endTurn({});
    }

    detonateBomb(target: Position) {
        super.startTurn();

        const arena = this.context.arena;

        const suspect = arena.atPosition(target);

        const hasBombMarker = suspect.markers.delete(Marker.BOMB);

        if (this.context.bomber.lastDetonatedBomb) {
            const adjacents = this.context.bomber.lastDetonatedBomb.getAdjacents(arena.size);
            if (!adjacents.find(pos => pos.equals(target))) {
                throw new Error("Non adjacent targets");
            }
        } else {
            if (!hasBombMarker) {
                throw new Error(`Suspect ${suspect} does not have bomb marker`);
            }
        }

        const killed = GameHelper.tryKillSuspect(target, this.context);

        if (killed) {
            if (hasBombMarker) {
                this.context.bomber.lastDetonatedBomb = target;
                this.endTurn({ checkScores: true, nextPlayer: this });
            } else {
                this.endTurn({ checkScores: true });
            }
        } else {
            this.endTurn({ nextPlayer: GameHelper.findPlayer(Suit, this.context) });
        }
    }

    stopDetonation() {
        super.startTurn();

        if (!this.context.bomber.lastDetonatedBomb) {
            throw new Error("There are no detonation");
        }

        this.context.bomber.lastDetonatedBomb = undefined;

        this.endTurn({});
    }
}