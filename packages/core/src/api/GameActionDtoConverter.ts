import { Character } from "../game/Character";
import { GameActions } from "../game/GameActions";
import { Role } from "../game/Role";
import Position from "../util/Position";
import { Dto } from "./Dto";

type Type = {
    [ACTION in Dto.Actions.Any as ACTION['type']]:
    (event: Dto.Actions.Specific<ACTION['type']>) =>
        GameActions.Any extends (infer D)
        ? D extends GameActions.Any
        ? ACTION['type'] extends D['type']
        ? D : never : never : never
}

export class GameActionDtoConverter implements Type {

    shift(action: Dto.Actions.Specific<'shift'>): GameActions.Common.Shift {
        return action;
    }

    collapse(action: Dto.Actions.Specific<'collapse'>): GameActions.Common.Collapse {
        return action;
    }

    disguise(action: Dto.Actions.Specific<'disguise'>): GameActions.Common.Disguise {
        return action;
    }

    disarm(action: Dto.Actions.Specific<'disarm'>): GameActions.Common.Disarm {
        return {
            type: 'disarm',
            target: convertPosition(action.target),
            marker: action.marker
        }
    }

    accuse(action: Dto.Actions.Specific<'accuse'>): GameActions.Common.Accuse {
        return {
            type: 'accuse',
            target: convertPosition(action.target),
            mafioso: Role.getByName(action.mafioso)
        }
    }

    knifeKill(action: Dto.Actions.Specific<'knifeKill'>): GameActions.Killer.Kill {
        return {
            type: 'knifeKill',
            target: convertPosition(action.target),
        }
    }

    swapSuspects(action: Dto.Actions.Specific<'swapSuspects'>): GameActions.Psycho.SwapSuspects {
        return {
            type: 'swapSuspects',
            position1: convertPosition(action.position1),
            position2: convertPosition(action.position2),
        }
    }

    placeThreat(action: Dto.Actions.Specific<'placeThreat'>): GameActions.Psycho.PlaceThreat {
        return {
            type: 'placeThreat',
            targets: action.targets.map(pos => convertPosition(pos)),
        }
    }

    placeBomb(action: Dto.Actions.Specific<'placeBomb'>): GameActions.Bomber.PlaceBomb {
        return {
            type: 'placeBomb',
            target: convertPosition(action.target),
        }
    }

    detonateBomb(action: Dto.Actions.Specific<'detonateBomb'>): GameActions.Bomber.DetonateBomb {
        return {
            type: 'detonateBomb',
            chain: action.chain.map(pos => convertPosition(pos)),
        }
    }

    selfDestruct(action: Dto.Actions.Specific<'selfDestruct'>): GameActions.Bomber.SelfDestruct {
        return {
            type: 'selfDestruct',
            chain: action.chain.map(pos => convertPosition(pos)),
        }
    }

    snipeKill(action: Dto.Actions.Specific<'snipeKill'>): GameActions.Sniper.Kill {
        return {
            type: 'snipeKill',
            target: convertPosition(action.target),
        }
    }

    setup(action: Dto.Actions.Specific<'setup'>): GameActions.Sniper.Setup {
        return {
            type: 'setup',
            from: convertPosition(action.from),
            to: convertPosition(action.to),
            marker: action.marker
        }
    }

    autopsy(action: Dto.Actions.Specific<'autopsy'>): GameActions.Undercover.Autopsy {
        return {
            type: 'autopsy',
            target: convertPosition(action.target)
        }
    }

    farAccuse(action: Dto.Actions.Specific<'farAccuse'>): GameActions.Detective.FarAccuse {
        return {
            type: 'farAccuse',
            target: convertPosition(action.target),
            mafioso: Role.getByName(action.mafioso)
        }
    }

    pickInnocentsForCanvas(action: Dto.Actions.Specific<'pickInnocentsForCanvas'>): GameActions.Detective.PickInnocentsForCanvas {
        return action;
    }

    canvas(action: Dto.Actions.Specific<'canvas'>): GameActions.Detective.Canvas {
        return {
            type: 'canvas',
            character: Character.getByName(action.character)
        }
    }

    placeProtection(action: Dto.Actions.Specific<'placeProtection'>): GameActions.Suit.PlaceProtection {
        return {
            type: 'placeProtection',
            target: convertPosition(action.target)
        }
    }

    removeProtection(action: Dto.Actions.Specific<'removeProtection'>): GameActions.Suit.RemoveProtection {
        return {
            type: 'removeProtection',
            target: convertPosition(action.target)
        }
    }

    decideProtect(action: Dto.Actions.Specific<'decideProtect'>): GameActions.Suit.DecideProtect {
        return action;
    }


    profile(action: Dto.Actions.Specific<'profile'>): GameActions.Profiler.Profile {
        return {
            type: 'profile',
            character: Character.getByName(action.character)
        }
    }
}

export function convertPosition(positionDto?: Dto.Position): Position {
    return positionDto ? new Position(positionDto.x, positionDto.y) : undefined as any;
}


export function visitAction(action: Dto.Actions.Any, actionVisitor: GameActionDtoConverter): GameActions.Any | undefined {
    const functionName = action.type;
    const func = (actionVisitor as any)[functionName];

    if (typeof func === 'function') {
        return func(action);
    }
}