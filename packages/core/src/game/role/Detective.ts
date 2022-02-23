import { Identity, Marker } from "@tix320/noir-core";
import Position from "../../util/Position";
import { Suspect } from "../Suspect";
import Agent from "./Agent";
import { GameHelper } from "./GameHelper";
import Mafioso from "./Mafioso";
import Player from "./Player";

export default class Detective<I extends Identity> extends Agent<I> {

    canDoFastShift(): boolean {
        return true;
    }

    ownMarker(): Marker | undefined {
        return undefined;
    }

    farAccuse(target: Position, mafioso: Mafioso<I>) {
        this.startTurn();

        const arena = this.context.arena;

        const isValidTarget = arena.getCross(target, 3).some(ps => arena.atPosition(ps).role === this);

        if (!isValidTarget) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can accuse within 3 spaces vertically or 
            horizontally of your card, but not diagonally.`);
        }

        const arested = GameHelper.accuse(target, mafioso, this.context);

        if (arested) {
            this.endTurn({ checkScores: true });
        } else {
            this.endTurn({});
        }
    }

    peekSuspects(): [Suspect, Suspect] {
        this.startTurn();

        const first = this.context.evidenceDeck.pop()!;
        const second = this.context.evidenceDeck.pop()!;

        this.endTurn({ nextPlayer: this });

        const canvas: [Suspect, Suspect] = [first, second];

        this.context.detective.canvas = canvas;

        return canvas;
    }

    canvas(index: number): Player<I>[] {
        this.startTurn();

        const canvas = this.context.detective.canvas;

        if (!canvas) {
            throw new Error("You are not picked cards");
        }

        const suspect = canvas[index];

        if (!suspect) {
            throw new Error("Illegal state");
        }

        const adjacentPlayers = GameHelper.canvasAll(suspect,  this.context);

        const nextPlayer = GameHelper.findNextPlayerOf(this, this.context);
        this.endTurn({ nextPlayer: nextPlayer });

        return adjacentPlayers;
    }
}

export class DetectiveContext {
    canvas?: [Suspect, Suspect];
}