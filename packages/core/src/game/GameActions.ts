import { Direction } from "../util/Direction";
import Position from "../util/Position";
import { Marker, Player } from "./Game";
import { Role } from "./Role";

export namespace GameActions {

    export namespace Common {
        export type Shift = {
            readonly type: 'shift';
            readonly direction: Direction;
            readonly index: number;
            readonly fast: boolean;
        }

        export type Collapse = {
            readonly type: 'collapse';
            readonly direction: Direction;
        };

        export type Disguise = {
            readonly type: 'disguise';
        };

        export type Disarm = {
            readonly type: 'disarm';
            readonly target: Position;
            readonly marker: Marker;
        };

        export type Accuse = {
            readonly type: 'accuse';
            readonly target: Position;
            readonly mafioso: Role;
        };
    }

    export namespace Killer {
        export type Kill = {
            readonly type: 'knifeKill';
            readonly target: Position;
        };
    }

    export namespace Psycho {
        export type SwapSuspects = {
            readonly type: 'swapSuspects';
            readonly position1: Position;
            readonly position2: Position;
        };

        export type PlaceThreat = {
            readonly type: 'placeThreat';
            readonly targets: Position[];
        };
    }

    export namespace Bomber {
        export type PlaceBomb = {
            readonly type: 'placeBomb';
            readonly target: Position;
        };

        export type DetonateBomb = {
            readonly type: 'detonateBomb';
            readonly chain: Position[];
        };

        export type SelfDestruct = {
            readonly type: 'selfDestruct';
            readonly chain: Position[];
        };
    }


    export namespace Sniper {
        export type Kill = {
            readonly type: 'snipeKill';
            readonly target: Position;
        };

        export type Setup = {
            readonly type: 'setup';
            readonly from: Position;
            readonly to: Position;
            readonly marker: Marker;
        };
    }

    export namespace Undercover {
        export type Autopsy = {
            readonly type: 'autopsy';
            readonly target: Position;
        };
    }

    export namespace Detective {
        export type FarAccuse = {
            readonly type: 'farAccuse';
            readonly target: Position;
            readonly mafioso: Role;
        };

        export type PickInnocentsForCanvas = {
            readonly type: 'pickInnocentsForCanvas';
        };

        export type Canvas = {
            readonly type: 'canvas';
            readonly position: Position;
        };
    }

    export namespace Suit {
        export type PlaceProtection = {
            readonly type: 'placeProtection';
            readonly target: Position;
        };

        export type RemoveProtection = {
            readonly type: 'removeProtection';
            readonly target: Position;
        };

        export type DecideProtect = {
            readonly type: 'decideProtect';
            readonly protect: boolean;
        };
    }

    export namespace Profiler {
        export type Profile = {
            readonly type: 'profile';
            readonly position: Position;
        };

    }

    type ShiftOrCollapse = Common.Shift | Common.Collapse

    export type OfKiller = ShiftOrCollapse | Killer.Kill | Common.Disguise;

    export type OfPsycho = ShiftOrCollapse | Psycho.SwapSuspects | Psycho.PlaceThreat;

    export type OfBomber = ShiftOrCollapse | Bomber.PlaceBomb | Bomber.DetonateBomb | Bomber.SelfDestruct;

    export type OfSniper = ShiftOrCollapse | Sniper.Kill | Sniper.Setup;

    export type OfUndercover = ShiftOrCollapse | Common.Disarm | Common.Accuse | Common.Disguise | Undercover.Autopsy;

    export type OfDetective = ShiftOrCollapse | Common.Disarm | Detective.FarAccuse | Detective.PickInnocentsForCanvas | Detective.Canvas;

    export type OfSuit = ShiftOrCollapse | Common.Disarm | Suit.PlaceProtection | Suit.RemoveProtection | Common.Accuse | Suit.DecideProtect;

    export type OfProfiler = ShiftOrCollapse | Common.Disarm | Common.Accuse | Profiler.Profile;

    export type Any = OfKiller | OfPsycho | OfBomber | OfSniper | OfUndercover | OfDetective | OfSuit | OfProfiler;

    export type Key<T extends Any = Any> = T['type']
}