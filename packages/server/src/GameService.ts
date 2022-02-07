import { v4 as uuid } from 'uuid';
import Game from './game';
import { User } from './user';

class GameService {
    #games: Map<string, Game> = new Map()

    getGames() {
        return this.#games;
    }

    createGame(creator, gameDetails) {
        const id = uuid();
        const game = new Game(id, gameDetails.mode);
        game.getPreparingState().join(creator, false);

        this.#games[game.id] = game;

        return game;
    }

    joinGame(user: User, gameId: string, ready: boolean): Game {
        const game = this.#games[gameId]
        if (!game) {
            throw new Error(`Game with id ${gameId} not found`);
        }

        game.getPreparingState().join(user, ready);

        return game;
    }

    leaveGame(user: User, gameId: string, ready: boolean) {
        const game = this.#games[gameId]
        if (!game) {
            throw new Error(`Game with id ${gameId} not found`);
        }

        game.getPreparingState().leave(user);
    }
}

export default new GameService();