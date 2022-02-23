import { Identity, Marker } from "@tix320/noir-core";
import Position from "@tix320/noir-core/src/util/Position";
import { GameHelper } from "./GameHelper";
import Mafioso from "./Mafioso";
import Player from "./Player";
import Suit from "./Suit";

export default class Bomber<I extends Identity> extends Mafioso<I> {

    canDoFastShift(): boolean {
        return false;
    }

    ownMarker(): Marker | undefined {
        return Marker.BOMB;
    }

    protected startTurn(): void {
        super.startTurn();
        if (this.context.bomber.lastDetonatedBomb) {
            throw new Error("You must continue bomb detonation");
        }
    }

    placeBomb(target: Position) {
        this.startTurn();

        const arena = this.context.arena;

        const targetSuspect = arena.atPosition(target);

        const isValidTarget = targetSuspect.role === this || GameHelper.isAdjacentTo(this, target, this.context);
        if (!isValidTarget) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can place bomb only on yourself or adjacent suspects`);
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

export class BomberContext {
    lastDetonatedBomb?: Position;
}