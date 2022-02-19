import { GameState, Role } from '@tix320/noir-core';
import { v4 as uuid } from 'uuid';
import Game from './game/Game';
import { User } from './user';

class GameService {
    #games: Map<string, Game> = new Map()

    getGames() {
        return this.#games;
    }

    getGame(gameId?: string) {
        const game = this.#games.get(gameId!);
        if (!game) {
            throw new Error(`Game with id ${gameId} not found`);
        }

        return game;
    }

    createGame(creator: User, gameDetails): [string, Game] {
        if (creator.currentGameId) {
            throw new Error("In game right now");
        }

        const id = uuid();
        const game = new Game(gameDetails.mode);
        this.#games.set(id, game);

        game.getPreparingState().join({user : creator, ready : false});
        creator.currentGameId = id;

        return [id, game];
    }

    joinGame(user: User, gameId: string): Game {
        const game: Game = this.getGame(gameId);

        if (user.currentGameId && user.currentGameId !== gameId) {
            throw new Error("Already in another game");
        }

        game.getPreparingState().join({user, ready: false});
        user.currentGameId = gameId;

        return game;
    }

    changeGameRole(user: User, role: Role | undefined, ready: boolean): [string, Game] {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const game: Game = this.getGame(gameId);

        game.getPreparingState().join({user, role, ready});
        user.currentGameId = gameId;

        return [gameId, game];
    }

    leaveGame(user: User): [string, Game] {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const game: Game = this.getGame(gameId);

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

        return [gameId, game];
    }
}

export default new GameService();