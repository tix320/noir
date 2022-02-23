import { JoinedUserInfo, RoleType } from "@tix320/noir-core";
import GamePreparationState from "@tix320/noir-core/src/dto/GamePreparationState";
import GameDto from "@tix320/noir-core/src/dto/Game";
import UserDto from "@tix320/noir-core/src/dto/User";
import GameRoleRequest from "@tix320/noir-core/src/dto/GameRoleRequest";
import Game, { PlayingState, PreparingState } from "@tix320/noir-core/src/game/Game";
import { Server } from "socket.io";
import GameInfo from "./game/GameInfo";
import { default as GameService, default as GAME_SERVICE } from "./game/GameService";
import { User } from "./user";
import USER_SERVICE from "./UserService";
import { USERS_BY_TOKEN } from "./UserTokens";

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


const GAMES_STREAM_EVENT = "gamesStream";
const MY_CURRENT_GAME_STREAM_EVENT = (userId: string) => `myCurrentGameStream_${userId}`;
const GAMES_PREPARATION_STREAM_EVENT = (gameId: string) => `gamePreparationStream_${gameId}`;

function gameResponse(gameInfo: GameInfo, game: Game<User>): GameDto {
    return ({
        ...gameInfo,
        currentPlayersCount: game.getPlayersCount(),
        maxPlayersCount: Game.ROLE_SETS.at(-1)!.size,
        state: game.getState().type === PreparingState ? 'PREPARING' : game.getState().type === PlayingState ? "PLAYING" : "COMPLETED"
    })
}

function gamesResponse(games: Map<string, [GameInfo, Game<User>]>): Array<GameDto> {
    return Array.from(games.values()).map(([gameInfo, game]) => gameResponse(gameInfo, game));
}

function userResponse(user: User): UserDto {
    return {
        id: user.id,
        name: user.name,
    };
}

function gamePreparationResponse(game: Game<User>): GamePreparationState {
    const participants = game.getPreparingState().participants;

    let availableRoles = new Set(RoleType.for8());

    const selectedRoles: JoinedUserInfo[] = [];

    participants.forEach((participant => {
        selectedRoles.push({
            user: participant.identity,
            role: participant.role,
            ready: participant.ready
        });

        if (participant.role) {
            availableRoles.delete(participant.role);
        }
    }));

    return {
        availableRoles: Array.from(availableRoles),
        selectedRoles: selectedRoles
    };
}

io.on("connection", (socket) => {
    const token = socket.handshake.auth.token || socket.handshake.auth.password;

    const user: User = USERS_BY_TOKEN.get(token)!;

    socket.on('myUser', (cb) => {
        const response = userResponse(user);
        cb(response);
    });

    socket.on('createGame', (gameInfo, cb) => {
        const [gameId, game] = GAME_SERVICE.createGame(user, gameInfo);

        const response = gameResponse(gameId, game);
        cb(response);

        socket.broadcast.to(GAMES_STREAM_EVENT).emit(GAMES_STREAM_EVENT, gamesResponse(GameService.getGames()));

        const name = MY_CURRENT_GAME_STREAM_EVENT(user.id);
        io.to(name).emit(name, response);
    });

    socket.on('joinGame', (gameId: string, cb) => {
        const [gameInfo, game] = GAME_SERVICE.joinGame(user, gameId);
        cb(true);

        socket.broadcast.to(GAMES_STREAM_EVENT).emit(GAMES_STREAM_EVENT, gamesResponse(GameService.getGames()));

        const name = MY_CURRENT_GAME_STREAM_EVENT(user.id);
        io.to(name).emit(name, gameResponse(gameInfo, game));

        const roomName = GAMES_PREPARATION_STREAM_EVENT(gameId);
        socket.broadcast.to(roomName).emit(roomName, gamePreparationResponse(game));
    });

    socket.on('changeGameRole', (request: GameRoleRequest, cb) => {
        const [gameInfo, game] = GAME_SERVICE.changeGameRole(user, request.role, request.ready);
        cb(true);

        if (game.getState().type === PreparingState) {
            const roomName = GAMES_PREPARATION_STREAM_EVENT(gameInfo.id);
            io.to(roomName).emit(roomName, gamePreparationResponse(game));
        } else {
            const gameResp = gameResponse(gameInfo, game);
            game.getPlayingState().players.forEach(player => {
                const userId = player.identity.id;

                const name = MY_CURRENT_GAME_STREAM_EVENT(userId);
                io.to(name).emit(name, gameResp);
            });
        }
    });

    socket.on('leaveGame', (cb) => {
        const [gameInfo, game] = GAME_SERVICE.leaveGame(user);
        cb();

        socket.broadcast.to(GAMES_STREAM_EVENT).emit(GAMES_STREAM_EVENT, gamesResponse(GameService.getGames()));

        const name = MY_CURRENT_GAME_STREAM_EVENT(user.id);
        io.to(name).emit(name, null);

        const roomName = GAMES_PREPARATION_STREAM_EVENT(gameInfo.id);
        socket.leave(roomName);
        socket.broadcast.to(roomName).emit(roomName, gamePreparationResponse(game));
    });

    socket.on(GAMES_STREAM_EVENT, () => {
        socket.join(GAMES_STREAM_EVENT);

        socket.emit(GAMES_STREAM_EVENT, gamesResponse(GameService.getGames()));
    })

    socket.on('myCurrentGameStream', () => {
        const name = MY_CURRENT_GAME_STREAM_EVENT(user.id);

        socket.join(name);

        const gameId = user.currentGameId;
        if (gameId) {
            const [gameInfo, game] = GameService.getGame(gameId);
            io.to(name).emit(name, gameResponse(gameInfo, game));
        }
    });

    socket.on('gamePreparationStream', () => {
        const gameId = user.currentGameId;

        const [gameInfo, game] = GameService.getGame(gameId);

        const name = GAMES_PREPARATION_STREAM_EVENT(gameId!);

        socket.join(name);
        socket.emit(name, gamePreparationResponse(game));
    });
});


io.listen(5000);