import Identifiable from "../../util/Identifiable";
import Position from "../../util/Position";
import { Marker } from "../Marker";
import { Suspect } from "../Suspect";
import Agent from "./Agent";
import { GameHelper } from "./GameHelper";
import Mafioso from "./Mafioso";

export default class Profiler<I extends Identifiable> extends Agent<I> {

    override canDoFastShift(): boolean {
        return false;
    }

    override ownMarker(): Marker | undefined {
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

    profile(index: number): void {
        this.startTurn();

        let hand = this.context.profiler.evidenceHand;
        const suspect = hand[index];

        if (!suspect) {
            throw new Error(`Suspect with index ${index} not found`);
        }

        GameHelper.canvasMafioso(suspect, this.context);

        
        hand = hand.filter(suspect => suspect.role !== 'killed');
        hand.removeFirst(suspect);
        
        const newHandCount = 4 - this.context.profiler.evidenceHand.length;
        const newSuspects = this.context.evidenceDeck.splice(-1, newHandCount);
        hand.push(...newSuspects);

        this.context.profiler.evidenceHand = hand;

        this.endTurn({});
    }
}

export class ProfilerContext {
    evidenceHand: Suspect[]

    constructor(evidenceHand: Suspect[]) {
        this.evidenceHand = evidenceHand;
    }
}