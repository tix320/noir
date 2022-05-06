import { GameActions } from "../game/GameActions";
import { Dto } from "./Dto";

export function convertActionToDto(action: GameActions.Any): Dto.Action {
    if (action.type === 'accuse' || action.type === 'farAccuse') {
        return {
            type: action.type,
            target: action.target,
            mafioso: action.mafioso.name
        }
    } else if (action.type === 'canvas' || action.type === 'profile') {
        return {
            type: action.type,
            character: action.character.name
        }
    }
    else {
        return action;
    }
}