import { GameActions } from "../game/GameActions";
import { GameEvents } from "../game/GameEvents";
import { Role } from "../game/Role";
import Identifiable from "../util/Identifiable";
import Position from "../util/Position";
import { Dto } from "./Dto";

export class GameActionDtoVisitor<I extends Identifiable> {

    shift(action: GameActions.Common.Shift): GameActions.Common.Shift {
        return action;
    }

    collapse(action: GameActions.Common.Collapse): GameActions.Common.Collapse {
        return action;
    }

    disguise(action: GameActions.Common.Disguise): GameActions.Common.Disguise {
        return action;
    }

    disarm(action: GameActions.Common.Disarm): GameActions.Common.Disarm {
        return {
            type: 'disarm',
            target: convertPosition(action.target),
            marker: action.marker
        }
    }

    accuse(action: Dto.Actions.Accuse): GameActions.Common.Accuse {
        return {
            type: 'accuse',
            target: convertPosition(action.target),
            mafioso: Role.getByName(action.mafioso)
        }
    }

    knifeKill(action: GameActions.Killer.Kill): GameActions.Killer.Kill {
        return {
            type: 'knifeKill',
            target: convertPosition(action.target),
        }
    }

    swapSuspects(action: GameActions.Psycho.SwapSuspects): GameActions.Psycho.SwapSuspects {
        return {
            type: 'swapSuspects',
            position1: convertPosition(action.position1),
            position2: convertPosition(action.position2),
        }
    }

    placeThreat(action: GameActions.Psycho.PlaceThreat): GameActions.Psycho.PlaceThreat {
        return {
            type: 'placeThreat',
            targets: action.targets.map(pos => convertPosition(pos)),
        }
    }

    placeBomb(action: GameActions.Bomber.PlaceBomb): GameActions.Bomber.PlaceBomb {
        return {
            type: 'placeBomb',
            target: convertPosition(action.target),
        }
    }

    detonateBomb(action: GameActions.Bomber.DetonateBomb): GameActions.Bomber.DetonateBomb {
        return {
            type: 'detonateBomb',
            chain: action.chain.map(pos => convertPosition(pos)),
        }
    }

    selfDestruct(action: GameActions.Bomber.SelfDestruct): GameActions.Bomber.SelfDestruct {
        return {
            type: 'selfDestruct',
            chain: action.chain.map(pos => convertPosition(pos)),
        }
    }

    snipeKill(action: GameActions.Sniper.Kill): GameActions.Sniper.Kill {
        return {
            type: 'snipeKill',
            target: convertPosition(action.target),
        }
    }

    setup(action: GameActions.Sniper.Setup): GameActions.Sniper.Setup {
        return {
            type: 'setup',
            from: convertPosition(action.from),
            to: convertPosition(action.to),
            marker: action.marker
        }
    }

    autospy(action: GameActions.Undercover.AutoSpy): GameActions.Undercover.AutoSpy {
        return {
            type: 'autospy',
            target: convertPosition(action.target)
        }
    }

    farAccuse(action: Dto.Actions.FarAccuse): GameActions.Detective.FarAccuse {
        return {
            type: 'farAccuse',
            target: convertPosition(action.target),
            mafioso: Role.getByName(action.mafioso)
        }
    }

    pickInnocentsForCanvas(action: GameActions.Detective.PickInnocentsForCanvas): GameActions.Detective.PickInnocentsForCanvas {
        return action;
    }

    canvas(action: GameActions.Detective.Canvas): GameActions.Detective.Canvas {
        return {
            type: 'canvas',
            position: convertPosition(action.position)
        }
    }

    placeProtection(action: GameActions.Suit.PlaceProtection): GameActions.Suit.PlaceProtection {
        return {
            type: 'placeProtection',
            target: convertPosition(action.target)
        }
    }

    removeProtection(action: GameActions.Suit.RemoveProtection): GameActions.Suit.RemoveProtection {
        return {
            type: 'removeProtection',
            target: convertPosition(action.target)
        }
    }

    decideProtect(action: GameActions.Suit.DecideProtect): GameActions.Suit.DecideProtect {
        return action;
    }


    profile(action: GameActions.Profiler.Profile): GameActions.Profiler.Profile {
        return {
            type: 'profile',
            position: convertPosition(action.position)
        }
    }
}

export function convertPosition(positionDto?: Position): any {
    return positionDto ? new Position(positionDto.x, positionDto.y) : undefined;
}


export function visitAction<I extends Identifiable>(action: Dto.Actions.Any, actionVisitor: GameActionDtoVisitor<I>) {
    const functionName = action.type;
    const func = (actionVisitor as any)[functionName];

    if (typeof func === 'function') {
        return func(action);
    }
}