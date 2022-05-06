import { Character } from "../game/Character";
import { GameActions } from "../game/GameActions";
import { Role } from "../game/Role";
import Position from "../util/Position";
import { Dto } from "./Dto";

export class GameActionDtoConverter {

    shift(action: Dto.Action & { type: 'shift' }): GameActions.Common.Shift {
        return action;
    }

    collapse(action: Dto.Action & { type: 'collapse' }): GameActions.Common.Collapse {
        return action;
    }

    disguise(action: Dto.Action & { type: 'disguise' }): GameActions.Common.Disguise {
        return action;
    }

    disarm(action: Dto.Action & { type: 'disarm' }): GameActions.Common.Disarm {
        return {
            type: 'disarm',
            target: convertPosition(action.target),
            marker: action.marker
        }
    }

    accuse(action: Dto.Action & { type: 'accuse' }): GameActions.Common.Accuse {
        return {
            type: 'accuse',
            target: convertPosition(action.target),
            mafioso: Role.getByName(action.mafioso)
        }
    }

    knifeKill(action: Dto.Action & { type: 'knifeKill' }): GameActions.Killer.Kill {
        return {
            type: 'knifeKill',
            target: convertPosition(action.target),
        }
    }

    swapSuspects(action: Dto.Action & { type: 'swapSuspects' }): GameActions.Psycho.SwapSuspects {
        return {
            type: 'swapSuspects',
            position1: convertPosition(action.position1),
            position2: convertPosition(action.position2),
        }
    }

    placeThreat(action: Dto.Action & { type: 'placeThreat' }): GameActions.Psycho.PlaceThreat {
        return {
            type: 'placeThreat',
            targets: action.targets.map(pos => convertPosition(pos)),
        }
    }

    placeBomb(action: Dto.Action & { type: 'placeBomb' }): GameActions.Bomber.PlaceBomb {
        return {
            type: 'placeBomb',
            target: convertPosition(action.target),
        }
    }

    detonateBomb(action: Dto.Action & { type: 'detonateBomb' }): GameActions.Bomber.DetonateBomb {
        return {
            type: 'detonateBomb',
            chain: action.chain.map(pos => convertPosition(pos)),
        }
    }

    selfDestruct(action: Dto.Action & { type: 'selfDestruct' }): GameActions.Bomber.SelfDestruct {
        return {
            type: 'selfDestruct',
            chain: action.chain.map(pos => convertPosition(pos)),
        }
    }

    snipeKill(action: Dto.Action & { type: 'snipeKill' }): GameActions.Sniper.Kill {
        return {
            type: 'snipeKill',
            target: convertPosition(action.target),
        }
    }

    setup(action: Dto.Action & { type: 'setup' }): GameActions.Sniper.Setup {
        return {
            type: 'setup',
            from: convertPosition(action.from),
            to: convertPosition(action.to),
            marker: action.marker
        }
    }

    autopsy(action: Dto.Action & { type: 'autopsy' }): GameActions.Undercover.Autopsy {
        return {
            type: 'autopsy',
            target: convertPosition(action.target)
        }
    }

    farAccuse(action: Dto.Action & { type: 'farAccuse' }): GameActions.Detective.FarAccuse {
        return {
            type: 'farAccuse',
            target: convertPosition(action.target),
            mafioso: Role.getByName(action.mafioso)
        }
    }

    pickInnocentsForCanvas(action: Dto.Action & { type: 'pickInnocentsForCanvas' }): GameActions.Detective.PickInnocentsForCanvas {
        return action;
    }

    canvas(action: Dto.Action & { type: 'canvas' }): GameActions.Detective.Canvas {
        return {
            type: 'canvas',
            character: Character.getByName(action.character)
        }
    }

    placeProtection(action: Dto.Action & { type: 'placeProtection' }): GameActions.Suit.PlaceProtection {
        return {
            type: 'placeProtection',
            target: convertPosition(action.target)
        }
    }

    removeProtection(action: Dto.Action & { type: 'removeProtection' }): GameActions.Suit.RemoveProtection {
        return {
            type: 'removeProtection',
            target: convertPosition(action.target)
        }
    }

    decideProtect(action: Dto.Action & { type: 'decideProtect' }): GameActions.Suit.DecideProtect {
        return action;
    }


    profile(action: Dto.Action & { type: 'profile' }): GameActions.Profiler.Profile {
        return {
            type: 'profile',
            character: Character.getByName(action.character)
        }
    }
}

export function convertPosition(positionDto?: Dto.Position): Position {
    return positionDto ? new Position(positionDto.x, positionDto.y) : undefined as any;
}


export function visitAction(action: Dto.Action, actionVisitor: GameActionDtoConverter): GameActions.Any | undefined {
    const functionName = action.type;
    const func = (actionVisitor as any)[functionName];

    if (typeof func === 'function') {
        return func(action);
    }
}