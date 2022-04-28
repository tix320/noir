import { Game, RoleSelection } from '@tix320/noir-core/src/game/Game';
import { GameActions } from '@tix320/noir-core/src/game/GameActions';
import { GameEvents } from '@tix320/noir-core/src/game/GameEvents';
import { StandardGame } from '@tix320/noir-core/src/game/StandardGame';
import { assert } from '@tix320/noir-core/src/util/Assertions';
import { first, Observable, Subject, switchMap } from 'rxjs';
import { User } from '../user/User';
import { GameDao } from './GameDao';
import GameInfo from './GameInfo';

export type GamePreparationInfo = [GameInfo, Game.Preparation<User>];
export type GamePlayInfo = [GameInfo, Game.Play<User>];

export type GameData = GamePreparationInfo | GamePlayInfo;

export namespace GameService {

    const _games: Map<string, GameData> = new Map()

    const _gameChanges = new Subject<GameData>();

    export function getGames() {
        return _games;
    }

    // As first item will be supplied current game list
    export function gameChanges(): Observable<GameData> {
        return _gameChanges.asObservableWithInitialValue(_games);
    }

    export function getGame(gameId?: string): GameData {
        const game = _games.get(gameId!);
        if (!game) {
            throw new Error(`Game with id ${gameId} not found`);
        }

        return game;
    }

    export function getGamePreparation(gameId?: string): GamePreparationInfo {
        const game = getGame(gameId);
        assert(game[0].state === 'PREPARING', 'Not in preparing state');

        return game as GamePreparationInfo;
    }

    export function getGamePlay(gameId?: string): GamePlayInfo {
        const game = getGame(gameId);
        assert(game[0].state === 'PLAYING', 'Not in preparing state');

        return game as GamePlayInfo;
    }

    export async function createGame(creator: User, info: { name: string }): Promise<GamePreparationInfo> {
        if (creator.currentGameId) {
            throw new Error("In game right now");
        }

        const gameModel = await GameDao.createEmptyGame(info.name);
        const id = gameModel.id;
        const gameInfo: GameInfo = { id: id, name: info.name, state: 'PREPARING' };

        const game = new StandardGame.Preparation<User>();
        _games.set(id, [gameInfo, game]); 

        game.join(creator);
        creator.currentGameId = id;

        const gameData: GameData = [gameInfo, game];
        _gameChanges.next(gameData);

        return gameData;
    }

    export function joinGame(user: User, gameId: GameInfo['id']): GamePreparationInfo {
        const [gameInfo, game] = getGamePreparation(gameId);

        if (user.currentGameId && user.currentGameId !== gameId) {
            throw new Error("Already in another game");
        }

        game.join(user);
        user.currentGameId = gameId;

        const gameData: GameData = [gameInfo, game];
        _gameChanges.next(gameData);

        return gameData;
    }

    export function changeGameRole(user: User, selection: Omit<RoleSelection<never>, 'identity'>): GamePreparationInfo {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const [gameInfo, game] = getGamePreparation(gameId);

        game.changeRole({
            identity: user,
            ready: selection.ready,
            role: selection.role!
        });

        const gameData: GameData = [gameInfo, game];
        _gameChanges.next(gameData);

        return gameData;
    }

    export function leaveGame(user: User): GamePreparationInfo {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const [gameInfo, game] = getGamePreparation(gameId);
        game.leave(user);

        user.currentGameId = undefined;

        const gameData: GameData = [gameInfo, game];
        _gameChanges.next(gameData);

        return gameData;
    }

    export function doGameAction(user: User, action: GameActions.Any) {
        const gameId = user.currentGameId;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const [gameInfo, game] = getGamePlay(gameId);

        const player = game.players.find(player => player.identity === user);
        assert(player);

        player.doAction(action);
    
        GameDao.addAction(gameId, user, action);
    }

    export function startGame(gameId: string): Game.Play<User> | undefined {
        const [gameInfo, game] = getGamePreparation(gameId);

        const gamePlay = game.start();
        if (gamePlay) {
            _games.set(gameInfo.id, [{ ...gameInfo, state: 'PLAYING' }, gamePlay]);
            game.getParticipants().forEach(player => player.identity.currentGameId = gameInfo.id);

            GameDao.fillInitialState(gameId, gamePlay.initialState);
        }

        return gamePlay;
    }

    export function gameEvents(gameId: string, user: User): Observable<GameEvents.Any> {
        const [gameInfo, game] = getGamePlay(gameId);

        const player = game.players.find(player => player.identity === user);

        if (!player) {
            throw new Error(`You are not in game ${gameInfo.name}`);
        }

        return player.gameEvents();
    }
}