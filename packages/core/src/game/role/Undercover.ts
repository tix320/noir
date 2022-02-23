import { Identity, Marker } from "@tix320/noir-core";
import Position from "../../util/Position";
import { Suspect } from "../Suspect";
import Agent from "./Agent";
import { GameHelper } from "./GameHelper";
import Mafioso from "./Mafioso";
import Player from "./Player";

export default class Undercover<I extends Identity> extends Agent<I> {

    canDoFastShift(): boolean {
        return false;
    }

    ownMarker(): Marker | undefined {
        return undefined;
    }

    accuse(target: Position, mafioso: Mafioso<I>): void {
        this.startTurn();

        const arena = this.context.arena;

        if (!GameHelper.isAdjacentTo(this, target, this.context)) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can accuse only your adjacanets`);
        }

        const arested = GameHelper.accuse(target, mafioso, this.context);

        if (arested) {
            this.endTurn({ checkScores: true });
        } else {
            this.endTurn({});
        }
    }

    disguise() {
        this.startTurn();

        GameHelper.tryPeekNewIdentityFor(this, this.context);

        this.endTurn({});
    }

    autoSpy(target: Position): Mafioso<I>[] {
        this.startTurn();

        const suspect = this.context.arena.atPosition(target);

        if (suspect.role !== 'killed') {
            throw new Error("Target must be deceased");
        }

        const mafiosi = GameHelper.getAdjacentMafiosi(target, this.context);

        this.endTurn({});

        return mafiosi;
    }
}