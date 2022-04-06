import { Direction } from "../util/Direction";
import Position from "../util/Position";
import { Mafioso } from "./Game";
import { Marker } from "./Marker";
import { RoleType } from "./RoleType";

export namespace GameActions {
    export type Shift = {
        type: 'shift';
        direction: Direction;
        index: number;
        fast: boolean;
    }

    export type Collapse = {
        type: 'collapse';

        direction: Direction;
    };

    export type Accuse = {
        type: 'accuse';

        target: Position;
        mafioso: RoleType;
    };

    export type Disguise = {
        type: 'disguise';
    };

    export type Disarm = {
        type: 'disarm';

        target: Position;
        marker: Marker;
    };

    export type KnifeKill = {
        type: 'knifeKill';

        target: Position;
    };

    export type ThreatKill = {
        type: 'threatKill';

        target: Position;
    };

    export type SwapSuspects = {
        type: 'swapSuspects';

        position1: Position;
        position2: Position;
    };

    export type PlaceThreat = {
        type: 'placeThreat';

        targets: Position[];
    };

    export type PlaceBomb = {
        type: 'placeBomb';

        target: Position;
    };

    export type DetonateBomb = {
        type: 'detonateBomb';

        target: Position;
    };

    export type StopDetonation = {
        type: 'stopDetonation';
    };

    export type SelfDestruct = {
        type: 'selfDestruct';
    };

    export type SnipeKill = {
        type: 'snipeKill';

        target: Position;
    };

    export type Setup = {
        type: 'setup';

        from: Position;
        to: Position;
        marker: Marker;
    };

    export type AutoSpy = {
        type: 'autoSpy';

        target: Position;
    };

    export type PeekSuspects = {
        type: 'peekSuspects';
    };

    export type Canvas = {
        type: 'canvas';

        index: 0 | 1;
    };

    export type PlaceProtection = {
        type: 'placeProtection';

        target: Position;
    };

    export type RemoveProtection = {
        type: 'removeProtection';

        target: Position;
    };

    export type DecideProtect = {
        type: 'decideProtect';

        protect: boolean;
    };

    export type Profile = {
        type: 'profile';

        index: 0 | 1 | 2 | 3;
    };

    type ShiftOrCollapse = Shift | Collapse;

    type OfMafioso = ShiftOrCollapse;

    type OfAgent = ShiftOrCollapse | Disarm | Accuse;

    export type OfKiller = OfMafioso | Disguise | KnifeKill;

    export type OfPsycho = OfMafioso | ThreatKill | SwapSuspects | PlaceThreat;

    export type OfBomber = OfMafioso | PlaceBomb | DetonateBomb | StopDetonation | SelfDestruct;

    export type OfSniper = OfMafioso | SnipeKill | Setup;

    export type OfUndercover = OfAgent | Disguise | AutoSpy;

    export type OfDetective = OfAgent | PeekSuspects | Canvas;

    export type OfSuit = OfAgent | PlaceProtection | RemoveProtection | DecideProtect;

    export type OfProfiler = OfAgent | Profile;

    type ExtractActionParameters<A, T> = A extends { type: T }
        ? Omit<A, 'type'>
        : never;

    type All = OfKiller | OfPsycho | OfBomber | OfSniper | OfUndercover | OfDetective | OfSuit | OfProfiler;

    export type Key<T extends All> = T['type']

    export type Params<K extends Key<any>> = ExtractActionParameters<All, K>

    export function isReverseShifts(shift1: Shift, shift2: Shift) {
        return shift1.index === shift2.index && shift1.direction === Direction.getReverse(shift2.direction);
    }
}