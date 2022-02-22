import { Direction, Marker } from "@tix320/noir-core";
import Shift from "@tix320/noir-core/src/game/Shift";
import Matrix from "@tix320/noir-core/src/util/Matrix";
import Position from "@tix320/noir-core/src/util/Position";
import { Context } from "../GameLogic";
import Player from "../Player";
import { Suspect } from "../Suspect";
import Suit from "./Suit";

export namespace GameHelper {

    export function shift(shift: Shift, context: Context) {
        if (context.lastShift && context.lastShift.direction === Direction.getReverse(shift.direction) && context.lastShift.index === shift.index) {
            throw new Error("Cannot undo last shift");
        }

        const arena = context.arena;

        arena.shift(shift.direction, shift.index, shift.fast ? 2 : 1);
    }

    /**
     * Try kill suspect. Return false if suspect can be protected by suit.
     */
    export function tryKillSuspect(position: Position, context: Context): boolean {
        const suspect = context.arena.atPosition(position);

        const suspectPlayer = suspect.player;
        if (suspectPlayer === 'arested' || suspectPlayer === 'killed') {
            throw new Error(`Target ${suspect} cannot be killed.`);
        }

        const suit = findPlayer(Suit, context);
        if (suspect.markers.has(Marker.PROTECTION) && suspect.player !== suit
            && (isPlayerInRow(suit, context.arena, position.x) || isPlayerInColumn(suit, context.arena, position.y))) {
            return false;
        } else {
            killSuspect(suspect, context);
            return true;
        }
    }

    export function killSuspect(suspect: Suspect, context: Context) {
        const suspectPlayer = suspect.player;

        if (suspectPlayer instanceof Player) {
            if (suspectPlayer.isMafioso()) {
                suspect.player = 'arested';
                context.scores[1] += 1;
            } else {
                suspect.player = 'killed';
                context.scores[0] += 2;
            }

            const ownMarker = suspectPlayer.ownMarker();
            if (ownMarker) {
                this.removeMarkersFromArena(ownMarker);
            }

            peekNewIdentityFor(suspectPlayer, context);
        } else {
            suspect.player = 'killed';
            context.scores[0] += 1;
        }

        suspect.markers.clear();
    }

    export function arestMafioso() { // TODO: bomber self estrcut

    }

    export function peekNewIdentityFor(player: Player, context: Context) {
        while (tryPeekNewIdentityFor(player, context)) {
        }
    }

    export function tryPeekNewIdentityFor(player: Player, context: Context): boolean {
        const newIdentity = context.evidenceDeck.pop();
        if (!newIdentity) {
            throw new Error("hmmm"); // TODO: wtf state
        }

        if (newIdentity.player === 'killed') {
            return false;
        } else {
            newIdentity.player = player;
            return true;
        }
    }

    export function findPlayer(type: typeof Player, context: Context): Player {
        return context.players.find(player => player instanceof type)!;
    }

    export function findPlayerInArena(player: Player, context: Context): Position {
        const arena = context.arena;

        for (let i = 0; i < arena.size; i++) {
            for (let j = 0; j < arena.size; j++) {
                const suspect = arena.at(i, j);
                if (suspect.player === player) {
                    return new Position(i, j);
                }
            }
        }

        throw new Error('Invalid state');
    }

    export function isPlayerInRow(player: Player, arena: Matrix<Suspect>, row: number): boolean {
        for (let i = 0; i < arena.size; i++) {
            const suspect = arena.at(row, i);
            if (suspect.player === player) {
                return true;
            }
        }

        return false;
    }

    export function isPlayerInColumn(player: Player, arena: Matrix<Suspect>, column: number): boolean {
        for (let i = 0; i < arena.size; i++) {
            const suspect = arena.at(i, column);
            if (suspect.player === player) {
                return true;
            }
        }

        return false;
    }

    export function removeMarkersFromArena(marker: Marker, context: Context): void {
        const arena = context.arena;

        for (let i = 0; i < arena.size; i++) {
            for (let j = 0; j < arena.size; j++) {
                const suspect = arena.at(i, j);
                suspect.markers.delete(marker);
            }
        }
    }
}

