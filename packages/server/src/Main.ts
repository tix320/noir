import {Server} from "socket.io";
import { USERS_BY_TOKEN } from "./UserTokens";
import USER_SERVICE from "./UserService";
import GAME_SERVICE from "./GameService";

const io = new Server({
    cors: {
        origin: '*',
    }
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;

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



io.on("connection", (socket) => {
    const token = socket.handshake.auth.token;

    const user = USERS_BY_TOKEN[token];

    socket.on('user', (token, cb) => {
        cb(user)
    });

    socket.on('currentGame', (cb) => {
        cb(USER_SERVICE.getCurrentGame(user));
    });

    socket.on('createGame', (gameDetails, cb) => {
        cb(GAME_SERVICE.createGame(user, gameDetails));
        io.to("gamesStream").emit("gamesStream", GAME_SERVICE.getGames());
    });

    socket.on('gamesStream', () => {
        socket.join("gamesStream");
        console.log(GAME_SERVICE.getGames());
        socket.emit("gamesStream", GAME_SERVICE.getGames())
    })
});


io.listen(5000);