import { Server } from "socket.io";
import { USERS_BY_TOKEN } from "./UserTokens";
import USER_SERVICE from "./UserService";
import GAME_SERVICE from "./GameService";
import Game from "./game/Game";
import { User } from "./user";
import JoinGameRequest from "@tix320/noir-core/src/dto/JoinGameRequest";

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



function gameResponse(game: Game) {
    return ({
        ...game,
        currentPlayersCount: game.getPlayersCount(),
        mode: game.mode,
        state: game.getState().getType()
    })
}

function gamesResponse(games: Map<string, Game>) {
    return Array.from(games.values()).map(game => gameResponse(game));
}

function userResponse(user: User) {
    return {
        ...user,
        currentGame: user.currentGame && gameResponse(user.currentGame)
    }
}

function publishGames() {
    console.log(GAME_SERVICE.getGames());
    io.to("gamesStream").emit("gamesStream", gamesResponse(GAME_SERVICE.getGames()));
}

io.on("connection", (socket) => {
    const token = socket.handshake.auth.token;

    const user = USERS_BY_TOKEN[token];

    socket.on('myUser', (cb) => {
        const response = userResponse(user);
        cb(response);
    });

    socket.on('createGame', (gameDetails, cb) => {
        const game = GAME_SERVICE.createGame(user, gameDetails);

        const response = gameResponse(game);
        cb(response);

        publishGames();
    });

    socket.on('joinGame', (request: JoinGameRequest, cb) => {
        const game = GAME_SERVICE.joinGame(user, request.gameId, request.role, request.ready);
        cb();

        publishGames();
    });

    socket.on('leaveGame', (gameId, ready, cb) => {
        GAME_SERVICE.leaveGame(user, gameId, ready);
        cb();

        publishGames();
    });

    socket.on('gamesStream', () => {
        socket.join("gamesStream");
        socket.emit("gamesStream", gamesResponse(GAME_SERVICE.getGames()))
    })
});


io.listen(5000);