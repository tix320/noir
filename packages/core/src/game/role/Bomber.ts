import Position from "@tix320/noir-core/src/util/Position";
import Identifiable from "../../util/Identifiable";
import { Marker } from "../Marker";
import { GameHelper } from "./GameHelper";
import Mafioso from "./Mafioso";
import Suit from "./Suit";

export default class Bomber<I extends Identifiable> extends Mafioso<I> {

    override canDoFastShift(): boolean {
        return false;
    }

    override ownMarker(): Marker | undefined {
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
            const adjacents = arena.getAdjacents(this.context.bomber.lastDetonatedBomb);
            if (!adjacents.find(pos => pos.equals(target))) {
                throw new Error("Non adjacent targets");
            }
        } else {
            if (!hasBombMarker) {
                throw new Error(`Suspect ${suspect} does not have bomb marker`);
            }
        }

        this.context.bomber.lastDetonatedBomb = undefined;

        const suit = GameHelper.findPlayer(Suit, this.context);
        const killed = GameHelper.tryKillSuspect(target, suit, this.context);

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