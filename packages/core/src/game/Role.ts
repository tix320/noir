import { AssertionError } from "../util/Assertions";
import { Team } from "./Game";
import { GameActions } from "./GameActions";

export abstract class Role<A extends GameActions.Any = GameActions.Any> {
    public abstract readonly team: Team;
    public abstract readonly actions: readonly GameActions.Key<A>[];

    protected constructor(public readonly name: string) {
    }
}

class _KILLER extends Role<GameActions.OfKiller>{
    static INSTANCE = new _KILLER('KILLER');

    public team = 'MAFIA' as const;
    public actions = ["shift", "collapse", "disguise", "knifeKill"] as const;

    private constructor(name: string) {
        super(name);
    }
}

class _PSYCHO extends Role<GameActions.OfPsycho>{
    static INSTANCE = new _PSYCHO('PSYCHO');

    public team = 'MAFIA' as const;
    public actions = ['shift', 'collapse', 'swapSuspects', 'placeThreat'] as const;

    private constructor(name: string) {
        super(name);
    }
}

class _BOMBER extends Role<GameActions.OfBomber>{
    static INSTANCE = new _BOMBER('BOMBER');

    public team = 'MAFIA' as const;
    public actions = ['shift', 'collapse', 'placeBomb', 'detonateBomb', 'selfDestruct'] as const;

    private constructor(name: string) {
        super(name);
    }
}

class _SNIPER extends Role<GameActions.OfSniper>{
    static INSTANCE = new _SNIPER('SNIPER');

    public team = 'MAFIA' as const;
    public actions = ['shift', 'collapse', 'setup', 'snipeKill'] as const;

    private constructor(name: string) {
        super(name);
    }
}

class _UNDERCOVER extends Role<GameActions.OfUndercover>{
    static INSTANCE = new _UNDERCOVER('UNDERCOVER');

    public team = 'FBI' as const;
    public actions = ['shift', 'collapse', 'disguise', 'disarm', 'autospy', 'accuse'] as const;

    private constructor(name: string) {
        super(name);
    }
}

class _DETECTIVE extends Role<GameActions.OfDetective>{
    static INSTANCE = new _DETECTIVE('DETECTIVE');

    public team = 'FBI' as const;
    public actions = ['shift', 'collapse', 'disarm', 'pickInnocentsForCanvas', 'canvas', 'farAccuse'] as const;

    private constructor(name: string) {
        super(name);
    }
}

class _SUIT extends Role<GameActions.OfSuit>{
    static INSTANCE = new _SUIT('SUIT');

    public team = 'FBI' as const;
    public actions = ['shift', 'collapse', 'placeProtection', 'removeProtection', 'decideProtect', 'disarm', 'accuse'] as const;

    private constructor(name: string) {
        super(name);
    }
}

class _PROFILER extends Role<GameActions.OfProfiler>{
    static INSTANCE = new _PROFILER('PROFILER');

    public team = 'FBI' as const;
    public actions = ['shift', 'collapse', 'profile', 'disarm', 'accuse'] as const;

    private constructor(name: string) {
        super(name);
    }
}

export namespace Role {

    export const KILLER = _KILLER.INSTANCE;
    export const PSYCHO = _PSYCHO.INSTANCE;
    export const BOMBER = _BOMBER.INSTANCE;
    export const SNIPER = _SNIPER.INSTANCE;
    export const UNDERCOVER = _UNDERCOVER.INSTANCE;
    export const DETECTIVE = _DETECTIVE.INSTANCE;
    export const SUIT = _SUIT.INSTANCE;
    export const PROFILER = _PROFILER.INSTANCE;

    export const MAFIA_TEAM: Role[] = [KILLER, PSYCHO, BOMBER, SNIPER];
    export const FBI_TEAM: Role[] = [UNDERCOVER, DETECTIVE, SUIT, PROFILER];

    export const FOR_6_GAME: Role[] = [KILLER, PSYCHO, BOMBER, UNDERCOVER, DETECTIVE, SUIT];
    export const FOR_8_GAME: Role[] = [KILLER, PSYCHO, BOMBER, SNIPER, UNDERCOVER, DETECTIVE, SUIT, PROFILER];

    export const CAN_DO_FAST_SHIFT: Role[] = [Role.KILLER, Role.SNIPER, Role.DETECTIVE, Role.SUIT];

    export function getByName(name: string): Role {
        switch (name) {
            case 'KILLER':
                return KILLER;
            case 'PSYCHO':
                return PSYCHO;
            case 'BOMBER':
                return BOMBER;
            case 'SNIPER':
                return SNIPER;
            case 'UNDERCOVER':
                return UNDERCOVER;
            case 'DETECTIVE':
                return DETECTIVE;
            case 'SUIT':
                return SUIT;
            case 'PROFILER':
                return PROFILER;
            default:
                throw new AssertionError(`Illegal role name ${name}`);
        }
    }
}