import { assert } from "../util/Assertions";
import { Direction } from "../util/Direction";
import Identifiable, { equals } from "../util/Identifiable";
import Position from "../util/Position";
import { Arena, Marker, Player, ShiftAction, Suspect } from "./Game";
import { GameActions } from "./GameActions";
import { Role } from "./Role";

export namespace GameHelper {

    export function isReverseShifts(shift1: ShiftAction, shift2: ShiftAction) {
        return shift1.index === shift2.index && shift1.direction === Direction.getReverse(shift2.direction);
    }

    export function groupPlayersByTeam<I extends Identifiable>(players: Player<I>[]): [Player<I>[], Player<I>[]] {
        const mafiosi = players.filter(player => Role.MAFIA_TEAM.includes(player.role))
        const fbi = players.filter(player => Role.FBI_TEAM.includes(player.role))

        return [mafiosi, fbi];
    }

    export function findPlayerByRole<I extends Identifiable>(players: Player<I>[], role: Role): Player<I> | undefined {
        return players.find(player => player.role === role);
    }

    export function findPlayerByIdentity<I extends Identifiable>(players: Player<I>[], identity: I | undefined): Player<I> | undefined {
        return identity && players.find(player => equals(player.identity, identity));
    }

    export function findPlayerByIdentityOrThrow<I extends Identifiable>(players: Player<I>[], identity: I | undefined): Player<I> {
        assert(identity, 'Undefined identity');
        const player = findPlayerByIdentity(players, identity);
        assert(player, `Player with identity ${identity} not found in game`);

        return player;
    }

    export function locatePlayer<I extends Identifiable>(arena: Arena<I>, player: Player<I>): Position {
        const res = arena.findFirst(suspect => typeof suspect.role === 'string' ? false : equals(suspect.role.identity, player.identity));
        assert(res, 'Player not found in this arena');
        return res[1];
    }

    export function canDoFastShift<A extends GameActions.Any>(player: Player<any, A>) {
        return Role.CAN_DO_FAST_SHIFT.includes(player.role);
    }

    export function getAccusePositions(arena: Arena, source: Position): Position[] {
        return [source, ...arena.getAdjacentPositions(source).filter(pos => arena.atPosition(pos).isAlive())];
    }

    export function getFarAccusePositions(arena: Arena, source: Position): Position[] {
        return arena.getOrthogonalPositions(source, 3).filter(pos => arena.atPosition(pos).isAlive());
    }

    export function getDisarmPositions(arena: Arena, source: Position): Position[] {
        return arena.getAdjacentPositions(source).filter(pos => {
            const suspect = arena.atPosition(pos);
            return suspect.hasMarker(Marker.BOMB) || suspect.hasMarker(Marker.THREAT);
        });
    }

    export function getKnifeKillPositions(arena: Arena, source: Position): Position[] {
        return arena.getAdjacentPositions(source).filter(pos => arena.atPosition(pos).isAlive());
    }

    export function getThreatKillPositions(arena: Arena, source: Position): Position[] {
        return arena.getAdjacentPositions(source).filter(pos => arena.atPosition(pos).hasMarker(Marker.THREAT));
    }

    export function geSnipeKillPositions(arena: Arena, source: Position): Position[] {
        return arena.getDiagonalPositions(source, 3).filter(pos => arena.atPosition(pos).isAlive());
    }

    export function getThreatPlacePositions(arena: Arena, source: Position): Position[] {
        return arena.getOrthogonalPositions(source, 3).filter(pos => {
            const suspect = arena.atPosition(pos);

            return suspect.isAlive() && !suspect.hasMarker(Marker.THREAT);
        });
    }

    export function getBombPlacePositions(arena: Arena, source: Position): Position[] {
        return arena.filter((suspect, pos) => {
            return pos.isAdjacentTo(source) && !suspect.hasMarker(Marker.BOMB);
        })
    }

    export function getProtectionPlacePositions(arena: Arena): Position[] {
        return arena.filter((suspect) => {
            return suspect.isAlive() && !suspect.hasMarker(Marker.PROTECTION);
        });
    }

    export function getProtectionRemovePositions(arena: Arena): Position[] {
        return arena.filter((suspect) => {
            return suspect.hasMarker(Marker.PROTECTION);
        });
    }

    export function getBombPositions(arena: Arena): Position[] {
        return arena.filter((suspect) => {
            return suspect.hasMarker(Marker.BOMB);
        });
    }

    export function getBombChainPositions(arena: Arena, source: Position): Position[] {
        return arena.getAdjacentPositions(source).filter(pos => {
            const target = arena.atPosition(pos);
            return target.hasMarker(Marker.BOMB) || target.isAlive();
        });
    }

    export function canMoveMarkerTo(marker: Marker, suspect: Suspect) {
        return !suspect.hasMarker(marker) && (marker !== Marker.BOMB || suspect.isAlive());
    }

    export function getMovableMarkerPositions(arena: Arena): [Position, Marker[]][] {
        const res: [Position, Marker[]][] = [];
        arena.foreach((suspect, pos) => {
            const markers = suspect.markersSnapshot();

            if (markers.length === 0) {
                return;
            }

            const adjacentPositions = arena.getAdjacentPositions(pos);
            const movableMarkers = markers.filter(marker => adjacentPositions.some(pos => canMoveMarkerTo(marker, arena.atPosition(pos))));

            res.push([pos, movableMarkers]);
        });

        return res;
    }

    export function getMarkerMoveDestPositions(arena: Arena, source: Position, marker: Marker): Position[] {
        return arena.getAdjacentPositions(source).filter(pos => {
            const suspect = arena.atPosition(pos);

            return canMoveMarkerTo(marker, suspect);
        })
    }

    export function getAutoSpyPositions(arena: Arena, source: Position): Position[] {
        return arena.getAdjacentPositions(source).filter(pos => arena.atPosition(pos).role === 'killed');
    }

    export function canProtect(suitPosition: Position, targetPosition: Position) {
        return suitPosition.x === targetPosition.x || suitPosition.y === targetPosition.y;
    }
}

