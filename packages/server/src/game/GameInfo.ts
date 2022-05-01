import { Game, GameState } from "@tix320/noir-core/src/game/Game";
import { User } from "../user/User";

export interface BaseGameData {
    readonly id: string;
    readonly name: string;
    readonly state: GameState;
}

export interface GamePreparationData extends BaseGameData {
    readonly state: 'PREPARING';
    readonly game: Game.Preparation<User>;
}

export class GamePlayData implements BaseGameData {
    readonly state = 'PLAYING';

    constructor(public readonly id: string, public readonly name: string, public readonly game: Game.Play<User>) {

    }
}

export interface GameCompletedData extends BaseGameData {
    readonly state: 'COMPLETED';
}

export type GameData = GamePreparationData | GamePlayData | GameCompletedData;

export type GamePreparationInfo = Omit<GamePreparationData, 'game'>;
export type GamePlayInfo = Omit<GamePlayData, 'game'>;
export type GameCompletedInfo = Omit<GameCompletedData, 'game'>;

export type GameInfo = GamePreparationInfo | GamePlayInfo | GameCompletedInfo;