import { BroadcastOperator, Server } from "socket.io";
import { USERS_BY_TOKEN } from "./UserTokens";
import USER_SERVICE from "./UserService";
import GAME_SERVICE from "./GameService";
import Game from "./game/Game";
import { User } from "./user";
import GameRoleRequest from "@tix320/noir-core/src/dto/GameRoleRequest";
import GameService from "./GameService";
import { GameMode, JoinedUserInfo } from "@tix320/noir-core";
import GamePreparationState from "@tix320/noir-core/src/dto/GamePreparationState";

const io = new Server({
    cors: {
        origin: '*',
    }
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.auth.password;

    const user = USERS_BY_TOKEN[token];
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

function gameResponse(gameId: string, game: Game) {
    return ({
        id: gameId,
        ...game,
        currentPlayersCount: game.getPlayersCount(),
        mode: game.mode,
        state: game.getState().type
    })
}

function gamesResponse(games: Map<string, Game>) {
    return Array.from(games.entries()).map(([gameId, game]) => gameResponse(gameId, game));
}

function userResponse(user: User) {
    return {
        id: user.id,
        name: user.name,
    };
}

function gamePreparationResponse(game: Game): GamePreparationState  { // TODO fix this govnocode
    const players = game.getPreparingState().players;

    let availableRoles = GameMode.rolesOf(game.mode); 

    const selectedRoles: JoinedUserInfo[] = [];

    players.forEach(([role, ready], user) => {
        selectedRoles.push({
            user: user,
            role: role,
            ready: ready
        })

        availableRoles = availableRoles.filter(r => r !== role);
    })

    return {
        availableRoles,
        selectedRoles
    };
}

io.on("connection", (socket) => {
    const token = socket.handshake.auth.token;

    const user: User = USERS_BY_TOKEN[token];

    socket.on('myUser', (cb) => {
        const response = userResponse(user);
        cb(response);
    });

    socket.on('createGame', (gameDetails, cb) => {
        const [gameId, game] = GAME_SERVICE.createGame(user, gameDetails);

        const response = gameResponse(gameId, game);
        cb(response);

        socket.broadcast.to(GAMES_STREAM_EVENT).emit(GAMES_STREAM_EVENT, gamesResponse(GameService.getGames()));

        const name = MY_CURRENT_GAME_STREAM_EVENT(user.id);
        io.to(name).emit(name, response);
    });

    socket.on('joinGame', (gameId: string, cb) => {
        const game = GAME_SERVICE.joinGame(user, gameId);
        cb(true);

        socket.broadcast.to(GAMES_STREAM_EVENT).emit(GAMES_STREAM_EVENT, gamesResponse(GameService.getGames()));

        const name = MY_CURRENT_GAME_STREAM_EVENT(user.id);
        io.to(name).emit(name, gameResponse(gameId, game));

        const roomName = GAMES_PREPARATION_STREAM_EVENT(gameId);
        socket.broadcast.to(roomName).emit(roomName, gamePreparationResponse(game));
    });

    socket.on('changeGameRole', (request: GameRoleRequest, cb) => {
        const [gameId, game] = GAME_SERVICE.changeGameRole(user, request.role, request.ready);
        cb(true);

        const roomName = GAMES_PREPARATION_STREAM_EVENT(gameId);
        io.to(roomName).emit(roomName, gamePreparationResponse(game));
    });

    socket.on('leaveGame', (cb) => {
        const [gameId, game] = GAME_SERVICE.leaveGame(user);
        cb();

        socket.broadcast.to(GAMES_STREAM_EVENT).emit(GAMES_STREAM_EVENT, gamesResponse(GameService.getGames()));

        const name = MY_CURRENT_GAME_STREAM_EVENT(user.id);
        io.to(name).emit(name, null);

        const roomName = GAMES_PREPARATION_STREAM_EVENT(gameId);
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
            const game = GameService.getGame(gameId);
            io.to(name).emit(name, gameResponse(gameId, game));
        }
    });

    socket.on('gamePreparationStream', () => {
        const gameId = user.currentGameId;

        const game = GameService.getGame(gameId);

        const name = GAMES_PREPARATION_STREAM_EVENT(gameId);

        socket.join(name);
        socket.emit(name, gamePreparationResponse(game));
    });
});


io.listen(5000);