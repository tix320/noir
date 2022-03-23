import {  RoleType } from '@tix320/noir-core';
import { v4 as uuid } from 'uuid';
import GameInfo from './GameInfo';
import { User } from '../user/User';
import Game, { CompletedState, PlayingState, PreparingState } from '@tix320/noir-core/src/game/Game';
import StandardGame from '@tix320/noir-core/src/game/StandardGame';

class GameService {
    #games: Map<string, [GameInfo, Game<User>]> = new Map()

    getGames() {
        return this.#games;
    }

    getGame(gameId?: string): [GameInfo, Game<User>] {
        const game = this.#games.get(gameId!);
        if (!game) {
            throw new Error(`Game with id ${gameId} not found`);
        }

        return game;
    }

    createGame(creator: User, gameInfo: GameInfo): [GameInfo, Game<User>] {
        if (creator.currentGameId) {
            throw new Error("In game right now");
        }

        const id = uuid();
        gameInfo = {...gameInfo, id};

        const game = new StandardGame<User>();
        this.#games.set(id, [gameInfo, game]);

        game.getPreparingState().join({ identity: creator, ready: false });
        creator.currentGameId = id;

        return [gameInfo, game];
    }

    joinGame(user: User, gameId: string): [GameInfo, Game<User>] {
        const [gameInfo, game] = this.getGame(gameId);

        if (user.currentGameId && user.currentGameId !== gameId) {
            throw new Error("Already in another game");
        }

        game.getPreparingState().join({ identity: user, ready: false });
        user.currentGameId = gameId;

        return [gameInfo, game];
    }

    changeGameRole(user: User, role: RoleType | undefined, ready: boolean): [GameInfo, Game<User>] {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const [gameInfo, game] = this.getGame(gameId);

        game.getPreparingState().join({ identity: user, role, ready });
        user.currentGameId = gameId;

        return [gameInfo, game];
    }

    leaveGame(user: User): [GameInfo, Game<User>] {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const [gameInfo, game] = this.getGame(gameId);

        switch (game.state) {
            case 'PREPARING':
                game.getPreparingState().leave(user);
                break;
            case 'PLAYING':
                // TODO: Complete game immidielty     
                break;
            case 'COMPLETED':
                // Only clear currentGame status 
                break;
        }

        user.currentGameId = undefined;

        return [gameInfo, game];
    }
}

export default new GameService();