import Position from "@tix320/noir-core/src/util/Position";
import Identifiable from "../../util/Identifiable";
import { Marker } from "../Marker";
import { Suspect } from "../Suspect";
import { GameHelper } from "./GameHelper";
import Mafioso from "./Mafioso";
import Suit from "./Suit";

export default class Killer<I extends Identifiable> extends Mafioso<I> {

    override canDoFastShift(): boolean {
        return true;
    }

    override ownMarker(): Marker | undefined {
        return undefined;
    }

    kill(targetPosition: Position) {
        this.startTurn();

        const arena = this.context.arena;

        const neighborns = arena.getAdjacents(targetPosition);

        const isValidTarget = neighborns.some(position => arena.atPosition(position).role === this);
        if (!isValidTarget) {
            throw new Error(`Invalid target=${arena.atPosition(targetPosition)}. You can kill only your neighbors`);
        }

        const suit = GameHelper.findPlayer(Suit, this.context);
        const killed = GameHelper.tryKillSuspect(targetPosition, suit, this.context);

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