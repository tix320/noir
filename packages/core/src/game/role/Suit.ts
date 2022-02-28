import Identifiable from "../../util/Identifiable";
import Position from "../../util/Position";
import { Marker } from "../Marker";
import Agent from "./Agent";
import { GameHelper } from "./GameHelper";
import Mafioso from "./Mafioso";
import Player from "./Player";

export default class Suit<I extends Identifiable> extends Agent<I> {

    override canDoFastShift(): boolean {
        return true;
    }

    override ownMarker(): Marker | undefined {
        return Marker.PROTECTION;
    }

    placeProtection(target: Position) {
        this.startTurn();

        const arena = this.context.arena;

        const protectionsCount = arena.count(suspect => suspect.markers.has(Marker.PROTECTION));
        if (protectionsCount === 6) {
            throw new Error("You may not have more than 6 protections in play at a time.");
        };


        const suspect = arena.atPosition(target);

        if (suspect.markers.has(Marker.PROTECTION)) {
            throw new Error("Suspect already have protection marker");
        }

        suspect.markers.add(Marker.PROTECTION);

        this.endTurn({ nextPlayer: this });
    }

    removeProtection(target: Position) {
        this.startTurn();

        const arena = this.context.arena;

        const suspect = arena.atPosition(target);

        if (!suspect.markers.delete(Marker.PROTECTION)) {
            throw new Error("Suspect does not have protection marker");
        }

        this.endTurn({ nextPlayer: this });
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

    decideProtect(protect: boolean): void {
        this.startTurn();

        const protectionContext = this.context.suit.protection;
        if (!protectionContext) {
            throw new Error("There are nor protection target");
        }

        const arena = this.context.arena;

        if (protect) {
            const crosses = arena.getCross(protectionContext.target, arena.size);

            if (!crosses.some(pos => arena.atPosition(pos).role === this)) {
                throw new Error("You cannot protect from your position");
            }

            this.endTurn({ nextPlayer: protectionContext.switchToPlayerAfterDescision });
        } else {
            const suspect = arena.atPosition(protectionContext.target);

            GameHelper.killSuspect(suspect, this.context);
            this.endTurn({ nextPlayer: protectionContext.switchToPlayerAfterDescision, checkScores: true });
        }

        this.context.suit.protection = undefined;
    }
}

export class SuitContext {
    protection?: ProtectionContext
}

export interface ProtectionContext {
    target: Position;
    switchToPlayerAfterDescision: Player<any>;
}