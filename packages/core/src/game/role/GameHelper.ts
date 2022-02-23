import { Direction, Marker } from "@tix320/noir-core";
import Shift from "@tix320/noir-core/src/game/Shift";
import Matrix from "@tix320/noir-core/src/util/Matrix";
import Position from "@tix320/noir-core/src/util/Position";
import { GameContext } from "../Game";
import { Suspect } from "../Suspect";
import Mafioso from "./Mafioso";
import Player from "./Player";
import Suit from "./Suit";

export namespace GameHelper {

    export function findNextPlayerOf(player: Player<any>, context: GameContext): Player<any> {
        const players = context.players;

        const currentPlayerIndex = context.players.findIndex(p => p === player);
        if (currentPlayerIndex === -1) {
            throw new Error("Player not found");
        }

        if (currentPlayerIndex === players.length - 1) {
            return players[0];
        } else {
            return players[currentPlayerIndex + 1];
        }
    }

    export function isAdjacentTo(player: Player<any>, position: Position, context: GameContext): boolean {
        const arena = context.arena;

        const adjacents = position.getAdjacents(arena.size);

        return adjacents.some(pos => arena.atPosition(pos).role === player);
    }

    export function getAdjacentPlayers(position: Position, context: GameContext, predicate?: (suspect: Suspect) => boolean): Player<any>[] {
        predicate = predicate || ((suspect: Suspect) => suspect.role instanceof Player);

        const arena = context.arena;

        const adjacents = position.getAdjacents(arena.size);

        return adjacents.map(pos => arena.atPosition(pos)).filter(suspect => predicate!(suspect)).map(sus => sus.role) as Player<any>[];
    }

    export function getAdjacentMafiosi(position: Position, context: GameContext): Mafioso<any>[] {
        const arena = context.arena;

        const adjacents = position.getAdjacents(arena.size);

        return adjacents.map(pos => arena.atPosition(pos).role).filter(role => role instanceof Mafioso) as Mafioso<any>[];
    }

    export function shift(shift: Shift, context: GameContext) {
        if (context.lastShift && context.lastShift.direction === Direction.getReverse(shift.direction) && context.lastShift.index === shift.index) {
            throw new Error("Cannot undo last shift");
        }

        const arena = context.arena;

        arena.shift(shift.direction, shift.index, shift.fast ? 2 : 1);
    }

    /**
     * Try kill suspect. Return false if suspect can be protected by suit.
     */
    export function tryKillSuspect(position: Position, context: GameContext): boolean {
        const suspect = context.arena.atPosition(position);

        const suspectRole = suspect.role;
        if (suspectRole === 'arested' || suspectRole === 'killed') {
            throw new Error(`Target ${suspect} cannot be killed.`);
        }

        const suit = findPlayer(Suit, context);
        if (suspect.markers.has(Marker.PROTECTION) && suspect.role !== suit
            && (isPlayerInRow(suit, context.arena, position.x) || isPlayerInColumn(suit, context.arena, position.y))) {
            return false;
        } else {
            killSuspect(suspect, context);
            return true;
        }
    }

    export function killSuspect(suspect: Suspect, context: GameContext) {
        const suspectRole = suspect.role;

        if (suspectRole instanceof Mafioso) {
            arestMafioso(suspect, context);
            return false;
        } else {
            suspect.role = 'killed';

            if (suspectRole instanceof Player) {
                context.scores[0] += 2;

                const ownMarker = suspectRole.ownMarker();
                if (ownMarker) {
                    this.removeMarkersFromArena(ownMarker);
                }

                peekNewIdentityFor(suspectRole, context);
            } else {
                context.scores[0] += 1;
            }

            suspect.markers.clear();

            return true;
        }
    }

    export function accuse(target: Position, mafioso: Mafioso<any>, context: GameContext): boolean {
        const arena = context.arena;

        const suspect = arena.atPosition(target);

        if (suspect.role === mafioso) {
            arestMafioso(suspect, context);
            return true;
        } else {
            return false;
        }
    }

    function arestMafioso(suspect: Suspect, context: GameContext) { // TODO: bomber self estrcut
        if (!(suspect.role instanceof Mafioso)) {
            throw new Error("Only mafioso can be arested");
        }

        const suspectRole = suspect.role;

        suspect.role = 'arested';

        context.scores[1] += 1;

        const ownMarker = suspectRole.ownMarker();
        if (ownMarker) {
            this.removeMarkersFromArena(ownMarker);
        }

        peekNewIdentityFor(suspectRole, context);

        suspect.markers.clear();
    }

    export function canvasAll(suspect: Suspect, context: GameContext): Player<any>[] {
        return canvas(suspect, context);
    }


    export function canvasMafioso(suspect: Suspect, context: GameContext): Player<any>[] {
        return canvas(suspect, context, (suspect: Suspect) => suspect.role instanceof Mafioso);
    }

    function canvas(suspect: Suspect, context: GameContext, predicate?: (suspect: Suspect) => boolean): Player<any>[] {
        if (suspect.role !== 'suspect') {
            throw new Error("Illegal state");
        }

        suspect.role = 'innocent';

        const position = GameHelper.findSuspectInArena(suspect, context);

        const adjacentPlayers = GameHelper.getAdjacentPlayers(position, context, predicate);

        return adjacentPlayers;
    }

    export function peekNewIdentityFor(player: Player<any>, context: GameContext) {
        while (tryPeekNewIdentityFor(player, context)) {
        }
    }

    export function tryPeekNewIdentityFor(player: Player<any>, context: GameContext): boolean {
        const newIdentity = context.evidenceDeck.pop();
        if (!newIdentity) {
            throw new Error("hmmm"); // TODO: wtf state
        }

        if (newIdentity.role === 'killed') {
            return false;
        } else {
            newIdentity.role = player;
            return true;
        }
    }

    export function findPlayer(type: typeof Player, context: GameContext): Player<any> {
        return context.players.find(player => player instanceof type)!;
    }


    export function findPlayerInArena(player: Player<any>, context: GameContext): Position {
        return findFirstInArena(suspect => suspect.role === player, context);
    }

    export function findSuspectInArena(suspect: Suspect, context: GameContext): Position {
        return findFirstInArena(s => s === suspect, context);
    }

    export function findFirstInArena(predicate: (suspect: Suspect) => boolean, context: GameContext): Position {
        const arena = context.arena;

        for (let i = 0; i < arena.size; i++) {
            for (let j = 0; j < arena.size; j++) {
                const suspect = arena.at(i, j);
                if (predicate(suspect)) {
                    return new Position(i, j);
                }
            }
        }

        throw new Error('Invalid state');
    }

    export function isPlayerInRow(player: Player<any>, arena: Matrix<Suspect>, row: number): boolean {
        for (let i = 0; i < arena.size; i++) {
            const suspect = arena.at(row, i);
            if (suspect.role === player) {
                return true;
            }
        }

        return false;
    }

    export function isPlayerInColumn(player: Player<any>, arena: Matrix<Suspect>, column: number): boolean {
        for (let i = 0; i < arena.size; i++) {
            const suspect = arena.at(i, column);
            if (suspect.role === player) {
                return true;
            }
        }

        return false;
    }

    export function removeMarkersFromArena(marker: Marker, context: GameContext): void {
        const arena = context.arena;

        for (let i = 0; i < arena.size; i++) {
            for (let j = 0; j < arena.size; j++) {
                const suspect = arena.at(i, j);
                suspect.markers.delete(marker);
            }
        }
    }
}

