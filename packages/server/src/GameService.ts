import { GameState, Role } from '@tix320/noir-core';
import { v4 as uuid } from 'uuid';
import Game from './game/Game';
import GameInfo from './game/GameInfo';
import { User } from './user';

class GameService {
    #games: Map<string, [GameInfo, Game]> = new Map()

    getGames() {
        return this.#games;
    }

    getGame(gameId?: string): [GameInfo, Game] {
        const game = this.#games.get(gameId!);
        if (!game) {
            throw new Error(`Game with id ${gameId} not found`);
        }

        return game;
    }

    createGame(creator: User, gameInfo: GameInfo): [GameInfo, Game] {
        if (creator.currentGameId) {
            throw new Error("In game right now");
        }

        const id = uuid();
        gameInfo = {...gameInfo, id};

        const game = new Game();
        this.#games.set(id, [gameInfo, game]);

        game.getPreparingState().join({ user: creator, ready: false });
        creator.currentGameId = id;

        return [gameInfo, game];
    }

    joinGame(user: User, gameId: string): [GameInfo, Game] {
        const [gameInfo, game] = this.getGame(gameId);

        if (user.currentGameId && user.currentGameId !== gameId) {
            throw new Error("Already in another game");
        }

        game.getPreparingState().join({ user, ready: false });
        user.currentGameId = gameId;

        return [gameInfo, game];
    }

    changeGameRole(user: User, role: Role | undefined, ready: boolean): [GameInfo, Game] {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const [gameInfo, game] = this.getGame(gameId);

        game.getPreparingState().join({ user, role, ready });
        user.currentGameId = gameId;

        return [gameInfo, game];
    }

    leaveGame(user: User): [GameInfo, Game] {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const [gameInfo, game] = this.getGame(gameId);

        const state = game.getState().type;

        switch (state) {
            case GameState.PREPARING:
                game.getPreparingState().leave(user);
                break;
            case GameState.PLAYING:
                // TODO: Complete game immidielty     
                break;
            case GameState.COMPLETED:
                // Only clear currentGame status 
                break;
        }

        user.currentGameId = undefined;

        return [gameInfo, game];
    }
}

export default new GameService();