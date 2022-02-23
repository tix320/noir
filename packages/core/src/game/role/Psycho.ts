import { Direction, Identity, Marker } from "@tix320/noir-core";
import Shift from "@tix320/noir-core/src/game/Shift";
import Position from "@tix320/noir-core/src/util/Position";
import { GameHelper } from "./GameHelper";
import Player from "./Player";

export default class Psycho<I extends Identity> extends Player<I> {

    isMafioso(): boolean {
        return true;
    }

    canDoFastShift(): boolean {
        return false;
    }

    ownMarker(): Marker | undefined {
        return Marker.THREAT;
    }

    protected onTurnStart(): void {
        const position = GameHelper.findPlayerInArena(this, this.context);

        const arena = this.context.arena;

        const neighborns = position.getAdjacents(arena.size);

        neighborns.forEach(position => {
            const suspect = arena.atPosition(position);

            let killed = false;
            if (suspect.markers.delete(Marker.THREAT)) {
                killed = GameHelper.tryKillSuspect(position, this.context);
            }

            if (killed) {
                this.checkWin();
            }
        });
    }

    shift(shift: Shift): void { // TODO: Duplicate code with super
        this.startTurn();

        if (shift.fast && !this.canDoFastShift()) {
            throw new Error("You cannot do fast shift");
        }

        GameHelper.shift(shift, this.context);

        this.endTurn({ shift: shift, nextPlayer: this });
    }

    collapse(direction: Direction): void { // TODO: Duplicate code with super
        this.startTurn();

        // TODO:

        this.endTurn({ nextPlayer: this });
    }

    swap(position1: Position, position2: Position) {
        this.startTurn();

        const arena = this.context.arena;

        const neighborns = position1.getAdjacents(arena.size);

        const isUniquePositions = position1 === position2 || arena.atPosition(position1).role === this || arena.atPosition(position2).role === this;
        const isAdjacents = neighborns.some(position => arena.atPosition(position).role === this) && neighborns.some(position => position.equals(position2));

        if (!isUniquePositions || !isAdjacents) {
            throw new Error(`Invalid targets=${arena.atPosition(position1)},${arena.atPosition(position2)} . You can only swap two adjacent suspects`);
        }

        arena.swap(position1, position2);

        this.endTurn({});
    }

    mark(positions: Position[]) {
        this.startTurn();

        if (positions.length > 3) {
            throw new Error("You can mark up to 3 suspects");
        }

        const arena = this.context.arena;

        const psychoPosition = GameHelper.findPlayerInArena(this, this.context);
        positions.forEach(position => {
            const rowDiff = Math.abs(psychoPosition.x - position.x);
            const colDiff = Math.abs(psychoPosition.x - position.x);
            if (rowDiff + colDiff > 3) {
                throw new Error("You can mark within 3 orthogonal spaces");
            }
        });

        positions.forEach(position => {
            arena.atPosition(position).markers.add(Marker.THREAT);
        });

        this.endTurn({ shift: this.context.lastShift });
    }
}