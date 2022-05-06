import { convertActionToDto } from '@tix320/noir-core/src/api/GameActionConverter';
import { GameActionDtoConverter, visitAction } from '@tix320/noir-core/src/api/GameActionDtoConverter';
import { Character } from '@tix320/noir-core/src/game/Character';
import { Game, PlayerInfo, RoleSelection } from '@tix320/noir-core/src/game/Game';
import { GameActions } from '@tix320/noir-core/src/game/GameActions';
import { GameEvents } from '@tix320/noir-core/src/game/GameEvents';
import { Role } from '@tix320/noir-core/src/game/Role';
import { StandardGame } from '@tix320/noir-core/src/game/StandardGame';
import { assert } from '@tix320/noir-core/src/util/Assertions';
import Matrix from '@tix320/noir-core/src/util/Matrix';
import { first, Observable, skip, Subject, zip } from 'rxjs';
import { IGame } from '../db/GameSchema';
import { CurrentGameContext, User } from '../user/User';
import { UserService } from '../user/UserService';
import { GameDao } from './GameDao';
import { GameData, GameInfo, GamePlayData, GamePlayInfo, GamePreparationData, GamePreparationInfo } from './GameInfo';

export namespace GameService {

    const _games: Map<string, GameData> = new Map()

    const _gameChanges = new Subject<GameData>();

    importGames();

    async function importGames() {
        const gamesData = adaptDBGames();

        (await gamesData).forEach(gameData => {
            _games.set(gameData.id, gameData);
            gameData.game.players.forEach(player => {
                assert(!player.identity.currentGameContext, `Invalid state, User ${player.identity} already in game`);
                player.identity.currentGameContext = {
                    id: gameData.id
                }
            })
        });
    }

    export function getGames() {
        return _games;
    }

    // As first item will be supplied current game list
    export function gameChanges(): Observable<GameData> {
        return _gameChanges.asObservableWithInitialValue(_games);
    }

    function _getGame(gameId?: string): GameData {
        const game = _games.get(gameId!);
        if (!game) {
            throw new Error(`Game with id ${gameId} not found`);
        }

        return game;
    }

    function _getGamePreparation(gameId?: string): GamePreparationData {
        const game = _getGame(gameId);
        if (game.state !== 'PREPARING') {
            throw new Error('Not in preparing state');
        }

        return game;
    }

    function _getGamePlay(gameId?: string): GamePlayData {
        const game = _getGame(gameId);
        if (game.state !== 'PLAYING') {
            throw new Error('Not in playing state');
        }

        return game;
    }

    export function getGame(gameId?: string): GameInfo {
        return _getGame(gameId);
    }

    export function getGamePreparation(gameId?: string): GamePreparationData {
        return _getGamePreparation(gameId);
    }

    export function getGamePlay(gameId?: string): GamePlayInfo {
        return _getGamePlay(gameId);
    }

    export async function createGame(creator: User, info: { name: string }): Promise<GamePreparationInfo> {
        if (creator.currentGameContext) {
            throw new Error("In game right now");
        }

        const gameModel = await GameDao.createEmptyGame(info.name);
        const id = gameModel.id as string;

        const game = new StandardGame.Preparation<User>();
        const gameData: GamePreparationData = { id: id, name: info.name, state: 'PREPARING', game: game };
        _games.set(id, gameData);

        game.join(creator);
        creator.currentGameContext = new CurrentGameContext(id);

        _gameChanges.next(gameData);

        return gameData;
    }

    export function joinGame(user: User, gameId: GameInfo['id']): GamePreparationInfo {
        const gameData = _getGamePreparation(gameId);

        if (user.currentGameContext && user.currentGameContext.id !== gameId) {
            throw new Error("Already in another game");
        }

        gameData.game.join(user);
        user.currentGameContext = new CurrentGameContext(gameId);

        _gameChanges.next(gameData);

        return gameData;
    }

    export function changeGameRole(user: User, selection: Omit<RoleSelection<never>, 'identity'>): GamePreparationInfo {
        const gameId = user.currentGameContext?.id;

        if (!gameId) {
            throw new Error('Currently not in game');
        }

        const gameData = _getGamePreparation(gameId);

        gameData.game.changeRole({
            identity: user,
            ready: selection.ready,
            role: selection.role!
        });

        _gameChanges.next(gameData);

        return gameData;
    }

    export function leaveGame(user: User): GameData {
        if (!user.currentGameContext) {
            throw new Error('Currently not in game');
        }

        const gameId = user.currentGameContext.id;

        const gameData = _getGame(gameId);
        if (gameData.state === 'PREPARING') {
            gameData.game.leave(user);
            if (gameData.game.getParticipants().length === 0) {
                _games.remove(gameId); //TODO: emit deleted game
            } else {
                _gameChanges.next(gameData);
            }
        } else if (gameData.state === 'PLAYING') {
            if (!gameData.game.isCompleted) {
                gameData.game.forceComplete();
            }
        }

        user.currentGameContext = undefined;

        return gameData;
    }

    export function startGame(gameId: string): Game.Play<User> | undefined {
        const gameData = _getGamePreparation(gameId);

        const gamePlay = gameData.game.start();
        if (gamePlay) {
            const players = gamePlay.players;
            _games.set(gameData.id, { ...gameData, state: 'PLAYING', game: gamePlay });
            players.forEach(player => {
                player.identity.currentGameContext = player.identity.currentGameContext!; // for re-emit as start of game
            });

            GameDao.fillInitialState(gameId, gamePlay.initialState);

            gamePlay.onComplete().subscribe(() => {
                const allPlayersLeaveGame = players.map(player => player.identity.currentGameChange().pipe(skip(1), first()));

                GameDao.completeGame(gameData.id);

                zip(allPlayersLeaveGame).subscribe(() => {
                    _games.delete(gameId);
                })
            });
        }

        return gamePlay;
    }

    export function doGameAction(actor: User, action: GameActions.Any) {
        const currentGame = actor.currentGameContext;
        assert(currentGame, 'Currently not in game');

        const gameData = _getGamePlay(currentGame.id);

        const player = gameData.game.players.find(player => player.identity === actor)!;

        player.doAction(action);


        GameDao.addAction(currentGame.id, actor, convertActionToDto(action));
    }

    export function gameEvents(gameId: string, user: User): Observable<GameEvents.Any> {
        const gameData = _getGamePlay(gameId);
        const currentGame = user.currentGameContext;
        assert(currentGame, 'Not in game');
        assert(gameData.id === currentGame.id, `Access Denied to game ${gameId} for ${user}`);

        return gameData.game.events();
    }
}

async function adaptDBGames() {
    const gamesModels = await GameDao.getPlayingGames();

    return await Promise.all(gamesModels.map(async gameModel => {
        const game = await convertGameModelToStandardGame(gameModel);

        const gameData: GamePlayData = {
            id: gameModel.id.toString(),
            name: gameModel.name,
            state: 'PLAYING',
            game: game
        }

        return gameData;
    }));
}

async function convertGameModelToStandardGame(gameModel: IGame) {
    const players: PlayerInfo<User>[] = await Promise.all(gameModel?.players.map(async player => {
        const userId = player.identity.toString();
        const user = (await UserService.getUser(userId));
        assert(user, `User with id ${userId} not found`);
        return {
            identity: user,
            role: Role.getByName(player.role)
        }
    }));

    const game = new StandardGame.Play({
        arena: new Matrix(gameModel.arena!).map(name => Character.getByName(name)),
        evidenceDeck: gameModel?.evidenceDeck.map(name => Character.getByName(name)),
        players: players
    });

    const visitor = new GameActionDtoConverter();

    gameModel.actions.forEach((actionModel) => {
        const actor = game.players.find(player => player.identity.id === actionModel.actor.toString())!;

        const action = visitAction(actionModel.properties as any, visitor);

        assert(action, `Invalid action ${JSON.stringify(actionModel.properties)}`);

        actor.doAction(action);
    });

    return game;
}