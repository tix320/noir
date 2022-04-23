import { Game, RoleSelection } from '@tix320/noir-core/src/game/Game';
import { GameActions } from '@tix320/noir-core/src/game/GameActions';
import { GameEvents } from '@tix320/noir-core/src/game/GameEvents';
import { StandardGame } from '@tix320/noir-core/src/game/StandardGame';
import { assert } from '@tix320/noir-core/src/util/Assertions';
import { first, Observable, Subject, switchMap } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { User } from '../user/User';
import GameInfo from './GameInfo';

export type GamePreparationInfo = [GameInfo, Game.Preparation<User>];
export type GamePlayInfo = [GameInfo, Game.Play<User>];

export type GameData = GamePreparationInfo | GamePlayInfo;

class GameService {

    #games: Map<string, GameData> = new Map()

    #gameChanges = new Subject<GameData>();

    getGames() {
        return this.#games;
    }

    // As first item will be supplied current game list
    gameChanges(): Observable<GameData> {
        return this.#gameChanges.asObservableWithInitialValue(this.#games);
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

        const gameData: GameData = [gameInfo, game];
        this.#gameChanges.next(gameData);

        return gameData;
    }

    joinGame(user: User, gameId: GameInfo['id']): GamePreparationInfo {
        const [gameInfo, game] = this.getGamePreparation(gameId);

        if (user.currentGameId && user.currentGameId !== gameId) {
            throw new Error("Already in another game");
        }

        game.join(user);
        user.currentGameId = gameId;

        const gameData: GameData = [gameInfo, game];
        this.#gameChanges.next(gameData);

        return gameData;
    }

    changeGameRole(user: User, selection: Omit<RoleSelection<never>, 'identity'>): GamePreparationInfo {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const [gameInfo, game] = this.getGamePreparation(gameId);

        game.changeRole({
            identity: user,
            ready: selection.ready,
            role: selection.role!
        });

        const gameData: GameData = [gameInfo, game];
        this.#gameChanges.next(gameData);

        return gameData;
    }

    leaveGame(user: User): GamePreparationInfo {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const [gameInfo, game] = this.getGamePreparation(gameId);
        game.leave(user);

        user.currentGameId = undefined;

        const gameData: GameData = [gameInfo, game];
        this.#gameChanges.next(gameData);

        return gameData;
    }

    doGameAction(user: User, action: GameActions.Any) {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const [gameInfo, game] = this.getGamePlay(gameId);

        game.events().pipe(first()).subscribe((startedEvent: GameEvents.Started<User>) => {
            const player = startedEvent.players.find(player => player.identity === user);

            assert(player);

            player.doAction(action);
        });
    }

    startGame(gameId: string): Game.Play<User> | undefined {
        const [gameInfo, game] = this.getGamePreparation(gameId);

        const gamePlay = game.start();
        if (gamePlay) {
            this.#games.set(gameInfo.id, [{ ...gameInfo, state: 'PLAYING' }, gamePlay]);
            game.getParticipants().forEach(player => player.identity.currentGameId = gameInfo.id);
        }

        return gamePlay;
    }

    gameEvents(gameId: string, user: User): Observable<GameEvents.Any> {
        const [gameInfo, game] = this.getGamePlay(gameId);

        return game.events().pipe(first(), switchMap(
            (startedEvent: GameEvents.Started<User>) => {
                const player = startedEvent.players.find(player => player.identity === user);

                if (!player) {
                    throw new Error('You are not in this game');
                }

                return player.gameEvents();
            }
        ));
    }
}

export default new GameService();