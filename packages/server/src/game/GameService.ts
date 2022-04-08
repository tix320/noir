import { Game, RoleSelection } from '@tix320/noir-core/src/game/Game';
import { StandardGame } from '@tix320/noir-core/src/game/StandardGame';
import { assert } from '@tix320/noir-core/src/util/Assertions';
import { v4 as uuid } from 'uuid';
import { User } from '../user/User';
import GameInfo from './GameInfo';

type GamePreparationInfo = [GameInfo, Game.Preparation<User>];
type GamePlayInfo = [GameInfo, Game.Play<User>];

type GameData = GamePreparationInfo | GamePlayInfo;

class GameService {

    #games: Map<string, GameData> = new Map()

    getGames() {
        return this.#games;
    }

    getGame(gameId?: string): GameData {
        const game = this.#games.get(gameId!);
        if (!game) {
            throw new Error(`Game with id ${gameId} not found`);
        }

        return game;
    }

    getGamePreparation(gameId?: string): GamePreparationInfo {
        const game = this.getGame(gameId);
        assert(game[0].state === 'PREPARING', 'Not in preparing state');

        return game as GamePreparationInfo;
    }

    getGamePlay(gameId?: string): GamePlayInfo {
        const game = this.getGame(gameId);
        assert(game[0].state === 'PLAYING', 'Not in preparing state');

        return game as GamePlayInfo;
    }

    createGame(creator: User, info: { name: string }): GamePreparationInfo {
        if (creator.currentGameId) {
            throw new Error("In game right now");
        }

        const id = uuid();
        const gameInfo: GameInfo = { id: id, name: info.name, state: 'PREPARING' };

        const game = new StandardGame.Preparation<User>();
        this.#games.set(id, [gameInfo, game]);

        game.join(creator);
        creator.currentGameId = id;

        return [gameInfo, game];
    }

    joinGame(user: User, gameId: GameInfo['id']): GamePreparationInfo {
        const [gameInfo, game] = this.getGamePreparation(gameId);

        if (user.currentGameId && user.currentGameId !== gameId) {
            throw new Error("Already in another game");
        }

        game.join(user);
        user.currentGameId = gameId;

        return [gameInfo, game];
    }

    changeGameRole(user: User, selection: RoleSelection<never>): GamePreparationInfo {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const [gameInfo, game] = this.getGamePreparation(gameId);

        game.changeRole({ ...selection, identity: user });
        user.currentGameId = gameId;

        return [gameInfo, game];
    }

    leaveGame(user: User): GamePreparationInfo {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const [gameInfo, game] = this.getGamePreparation(gameId);
        game.leave(user);

        user.currentGameId = undefined;

        return [gameInfo, game];
    }

    startGame(gameId: string): Game.Play<User> | undefined {
        const [gameInfo, game] = this.getGamePreparation(gameId);

        return game.start();
    }
}

export default new GameService();