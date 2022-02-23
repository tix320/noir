import { Identity, Marker } from "@tix320/noir-core";
import Position from "@tix320/noir-core/src/util/Position";
import { GameHelper as GameHelper } from "./GameHelper";
import Mafioso from "./Mafioso";
import Player from "./Player";
import Suit from "./Suit";

export default class Sniper<I extends Identity> extends Mafioso<I> {

    canDoFastShift(): boolean {
        return true;
    }

    ownMarker(): Marker | undefined {
        return undefined;
    }

    snipe(target: Position) {
        this.startTurn();

        const arena = this.context.arena;
        const diagonals = arena.getDiagonals(target, 3);

        if (!diagonals.some(pos => arena.atPosition(pos).role === this)) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can kill only suspects 3 spaces away from you in diagonal line`);
        }

        const killed = GameHelper.tryKillSuspect(target, this.context);

        if (killed) {
            this.endTurn({ checkScores: true });
        } else {
            this.endTurn({ nextPlayer: GameHelper.findPlayer(Suit, this.context) });
        }
    }

    setup(from: Position, to: Position, marker: Marker) {
        this.startTurn();

        if (!from.isAdjacentTo(to)) {
            throw new Error('Not adjacents suspects');
        }

        const arena = this.context.arena;

        const fromSuspect = arena.atPosition(from);
        const toSuspect = arena.atPosition(to);

        if (!fromSuspect.markers.has(marker)) {
            throw new Error(`Suspect does not have marker ${marker}`);
        }

        if (toSuspect.markers.has(marker)) {
            throw new Error(`Suspect already have marker ${marker}`);
        }

        fromSuspect.markers.delete(marker);
        toSuspect.markers.add(marker);

        this.endTurn({});
    }
}