import "@tix320/noir-core";
import { ApiEvents } from "@tix320/noir-core/src/api/ApiEvents";
import { Dto } from "@tix320/noir-core/src/api/Dto";
import { InitialState, Player, RoleSelection } from "@tix320/noir-core/src/game/Game";
import { StandardGame } from "@tix320/noir-core/src/game/StandardGame";
import { filter, takeWhile } from 'rxjs/operators';
import { Server } from "socket.io";
import { default as GameService, default as GAME_SERVICE, GameData, GamePreparationInfo } from "./game/GameService";
import { User } from "./user/User";
import USER_SERVICE from "./user/UserService";
import { USERS_BY_TOKEN } from "./user/UserTokens";

const io = new Server({
    cors: {
        origin: '*',
    }
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.auth.password;

    const user = USERS_BY_TOKEN.get(token);
    if (user) {
        USER_SERVICE.addConnectedUser(user)
        console.info(`Connected ${user.name}`)

        socket.on('disconnect', reason => {
            console.error(`Disconnected ${user.name} Reason: ${reason}`);
            USER_SERVICE.removeConnectedUser(user);
        });

        next()
    } else {
        console.info(`Invalid token ${token}`)
        next(new Error("Invalid token"))
    }
});


function gamePreparationResponse(data: GamePreparationInfo): Dto.GamePreparation {
    const [gameInfo, game] = data;

    const participants = game.participants;

    return {
        id: gameInfo.id,
        name: gameInfo.name,
        maxPlayersCount: StandardGame.ROLE_SETS.at(-1)!.size,
        roles: participants.map(participant => {
            return {
                ...participant,
                identity: userResponse(participant.identity)
            }
        }),
        started: game.isStarted()
    };
}

function userResponse(user: User): Dto.User {
    return {
        id: user.id,
        name: user.name,
    };
}

function playerResponse(player: Player<User>): Dto.Player {
    return {
        identity: userResponse(player.identity),
        role: player.role
    }
}

function gameInitialStateResponse(initialState: InitialState<User>): Dto.GameInitialState {
    const arena: Dto.Arena = initialState.arena.map(item => {
        const role: Dto.SuspectRole = typeof item.role === 'string'
            ? item.role
            : playerResponse(item.role.identity);

        return {
            character: item.character,
            role: role,
            markers: item.markers
        };
    }).raw();

    const result = {
        players: initialState.players.map(player => playerResponse(player)),
        arena: arena
    };

    return result;
}

io.on("connection", (socket) => {
    const token = socket.handshake.auth.token || socket.handshake.auth.password;

    const user: User = USERS_BY_TOKEN.get(token)!;

    socket.on(ApiEvents.GET_MY_USER, (cb) => {
        const response = userResponse(user);
        cb(response);
    });

    socket.on(ApiEvents.CREATE_GAME, (info, cb) => {
        GAME_SERVICE.createGame(user, info);
    });

    socket.on(ApiEvents.JOIN_GAME, (gameId: string, cb) => {
        GAME_SERVICE.joinGame(user, gameId);
    });

    socket.on(ApiEvents.CHANGE_ROLE_IN_GAME, (roleSelection: RoleSelection<never>, cb) => {
        const [gameInfo, game] = GAME_SERVICE.changeGameRole(user, roleSelection);

        const gamePlay = GameService.startGame(gameInfo.id);

        if (gamePlay) {
            gamePlay.initialState.players.forEach(player => player.identity.currentGameId = gameInfo.id);
        }
    });

    socket.on(ApiEvents.LEAVE_GAME, (cb) => {
        GAME_SERVICE.leaveGame(user);
    });

    socket.on(ApiEvents.GET_GAME_INITIAL_STATE, (gameId, cb) => {
        const [_, game] = GAME_SERVICE.getGamePlay(gameId);

        const response = gameInitialStateResponse(game.initialState);
        cb(response);
    });

    socket.on(ApiEvents.SUBSCRIBE_ALL_PREPARING_GAMES, () => {
        GameService.gameChanges()
            .onFirst((currentGames: Map<string, GameData>) => {
                const response = [...currentGames.values()]
                    .filter(info => info[0].state === 'PREPARING')
                    .map(info => gamePreparationResponse(info as GamePreparationInfo));
                socket.emit(ApiEvents.ROOM_ALL_PREPARING_GAMES, response);
            })
            .pipe(
                filter(([gameInfo, _]) => gameInfo.state === 'PREPARING'),
                takeWhile(() => socket.connected)
            )
            .subscribe((info) => socket.emit(ApiEvents.ROOM_ALL_PREPARING_GAMES, gamePreparationResponse(info as GamePreparationInfo)));
    })

    socket.on(ApiEvents.SUBSCRIBE_MY_CURRENT_GAME, () => {
        user.currentGameIdChange().subscribe(currentGameId => {

            const gameInfo = currentGameId ? GameService.getGame(currentGameId)[0] : undefined;

            const dto: Dto.UserCurrentGame | undefined = gameInfo && {
                id: gameInfo.id,
                state: gameInfo.state
            }

            const name = ApiEvents.ROOM_MY_CURRENT_GAME(user.id);
            socket.emit(name, dto);
        });
    });

    socket.on(ApiEvents.SUBSCRIBE_PREPARING_GAME, (gameId: string) => {
        const info = GameService.getGamePreparation(gameId);
        const [gameInfo, game] = info;

        game.participantChanges()
            .pipe(
                takeWhile(() => socket.connected)
            )
            .subscribe(() => socket.emit(ApiEvents.ROOM_PREPARING_GAME(gameId), gamePreparationResponse(info)));
    });

    socket.on(ApiEvents.SUBSCRIBE_PLAYING_GAME, (gameId: string) => {
        const [gameInfo, game] = GameService.getGamePlay(gameId);

        const player = game.initialState.players.find(player => player.identity === user);

        if (!player) {
            throw new Error('You are not in this game');
        }

        game.events()
            .pipe(
                takeWhile(() => socket.connected)
            )
            .subscribe((event) => socket.emit(ApiEvents.ROOM_PLAYING_GAME(gameId), event));
    });
});


io.listen(5000);