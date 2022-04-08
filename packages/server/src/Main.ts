import { Dto } from "@tix320/noir-core/src/api/Dto";
import { ApiEvents } from "@tix320/noir-core/src/api/ApiEvents";
import { Game, RoleSelection } from "@tix320/noir-core/src/game/Game";
import { GameEvents } from "@tix320/noir-core/src/game/GameEvents";
import { StandardGame } from "@tix320/noir-core/src/game/StandardGame";
import { Server } from "socket.io";
import GameInfo from "./game/GameInfo";
import { default as GameService, default as GAME_SERVICE } from "./game/GameService";
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
        console.log(`Connected ${user.name}`)

        socket.on('disconnect', reason => {
            console.error(`Disconnected ${user.name} Reason: ${reason}`);
            USER_SERVICE.removeConnectedUser(user);
        });

        next()
    } else {
        console.log(`Invalid token ${token}`)
        next(new Error("Invalid token"))
    }
});


function gamePreparationResponse(gameInfo: GameInfo, game: Game.Preparation<User>): Dto.GamePreparation {
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
        })
    };
}

function userResponse(user: User): Dto.User {
    return {
        id: user.id,
        name: user.name,
    };
}

function joinPreparingGameChange(socket: any, gameId: string) {
    const name = ApiEvents.ROOM_PREPARING_GAME(gameId);
    socket.join(name);
}

function emitPreparingGameChange(target: any, game: Dto.GamePreparation) {
    target.to(ApiEvents.ROOM_GAMES).emit(ApiEvents.ROOM_GAMES, game);

    const roomName = ApiEvents.ROOM_PREPARING_GAME(game.id);
    target.to(roomName).emit(roomName, game);
}

function joinPlayingGameChange(socket: any, gameId: string) {
    const name = ApiEvents.ROOM_PLAYING_GAME(gameId);
    socket.join(name);
}

function emitPlayingGameChange(target: any, gameId: string, event: GameEvents.Base) {
    const roomName = ApiEvents.ROOM_PLAYING_GAME(gameId);
    target.to(roomName).emit(roomName, event);
}

function joinMyCurrentGameChange(socket: any, user: User) {
    const name = ApiEvents.ROOM_MY_CURRENT_GAME(user.id);
    socket.join(name);
}

function emitUserCurrentGame(user: User, gameInfo: GameInfo) {
    const dto: Dto.UserCurrentGame = {
        id: gameInfo.id,
        state: gameInfo.state
    }

    const name = ApiEvents.ROOM_MY_CURRENT_GAME(user.id);
    io.to(name).emit(name, dto);
}

io.on("connection", (socket) => {
    const token = socket.handshake.auth.token || socket.handshake.auth.password;

    const user: User = USERS_BY_TOKEN.get(token)!;

    socket.on(ApiEvents.GET_MY_USER, (cb) => {
        const response = userResponse(user);
        cb(response);
    });

    socket.on(ApiEvents.CREATE_GAME, (info, cb) => {
        const [gameInfo, game] = GAME_SERVICE.createGame(user, info);

        const response = gamePreparationResponse(gameInfo, game);

        emitPreparingGameChange(socket.broadcast, response);
        emitUserCurrentGame(user, gameInfo);
    });

    socket.on(ApiEvents.JOIN_GAME, (gameId: string, cb) => {
        const [gameInfo, game] = GAME_SERVICE.joinGame(user, gameId);

        const response = gamePreparationResponse(gameInfo, game);

        emitPreparingGameChange(socket.broadcast, response);
        emitUserCurrentGame(user, gameInfo);
    });

    socket.on(ApiEvents.CHANGE_ROLE_IN_GAME, (roleSelection: RoleSelection<never>, cb) => {
        const [gameInfo, game] = GAME_SERVICE.changeGameRole(user, roleSelection);

        const response = gamePreparationResponse(gameInfo, game);

        emitPreparingGameChange(io, response);

        const gamePlay = GameService.startGame(gameInfo.id);
        if (gamePlay) {
            gamePlay.players.forEach(player => emitUserCurrentGame(player.identity, gameInfo));
        }
    });

    socket.on(ApiEvents.LEAVE_GAME, (cb) => {
        const [gameInfo, game] = GAME_SERVICE.leaveGame(user);

        const response = gamePreparationResponse(gameInfo, game);

        emitPreparingGameChange(io, response);
    });

    socket.on(ApiEvents.SUBSCRIBE_GAMES, () => {
        socket.join(ApiEvents.ROOM_GAMES);

        GameService.getGames().forEach(([gameInfo, game]) => {
            if (gameInfo.state === 'PREPARING') {
                emitPreparingGameChange(io, gamePreparationResponse(gameInfo, game as Game.Preparation<User>));
            }
        }
        );
    })

    socket.on(ApiEvents.SUBSCRIBE_MY_CURRENT_GAME, () => {
        joinMyCurrentGameChange(socket, user);

        const gameId = user.currentGameId;
        if (gameId) {
            const [gameInfo, game] = GameService.getGame(gameId);
            emitUserCurrentGame(user, gameInfo);
        }
    });

    socket.on(ApiEvents.SUBSCRIBE_PREPARING_GAME, (gameId: string) => {
        const [gameInfo, game] = GameService.getGamePreparation(gameId);

        joinPreparingGameChange(socket, gameId);
        emitPreparingGameChange(socket, gamePreparationResponse(gameInfo, game));
    });

    socket.on(ApiEvents.SUBSCRIBE_PLAYING_GAME, (gameId: string, cb) => {
        const [gameInfo, game] = GameService.getGamePlay(gameId);

        const player = game.players.find(player => player.identity === user);

        if (!player) {
            throw new Error('Yoe are not in this game');
        }

        const [currentState, events] = player.getState();
        cb(currentState);

        joinPlayingGameChange(socket, gameId);

        events.subscribe(event => emitPlayingGameChange(socket, gameId, event));
    });
});


io.listen(5000);