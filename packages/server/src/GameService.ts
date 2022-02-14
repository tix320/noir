import { v4 as uuid } from 'uuid';
import Game from './game/Game';
import Role from './game/role/Role';
import { User } from './user';

class GameService {
    #games: Map<string, Game> = new Map()

    getGames() {
        return this.#games;
    }

    createGame(creator: User, gameDetails) {
        if (creator.currentGame) {
            throw new Error("In game right now");
        }

        const id = uuid();
        const game = new Game(id, gameDetails.mode);
        this.#games[game.id] = game;

        game.getPreparingState().join(creator, null);
        creator.currentGame = game; // TODO clear after game complete

        return game;
    }

    joinGame(user: User, gameId: string, role: Role): Game {
        const game: Game = this.#games[gameId]
        if (!game) {
            throw new Error(`Game with id ${gameId} not found`);
        }

        if (user.currentGame && user.currentGame !== game) {
            throw new Error("Already in another game");
        }

        game.getPreparingState().join(user, role);
        user.currentGame = game; // TODO clear after game complete

        return game;
    }

    leaveGame(user: User, gameId: string, ready: boolean) {
        const game = this.#games[gameId]
        if (!game) {
            throw new Error(`Game with id ${gameId} not found`);
        }

        game.getPreparingState().leave(user);
        user.currentGame = null;
    }
}

export default new GameService();