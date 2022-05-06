const PORT = process.env.SERVER_PORT
const WEB_CLIENT_BUNDLE = process.env.WEB_CLIENT_BUNDLE

console.info(`WORKING_DIRECTORY=${process.cwd()}`)
console.info(`SERVER_PORT=${PORT}`)
console.info(`WEB_CLIENT_BUNDLE=${WEB_CLIENT_BUNDLE}`)

import "@tix320/noir-core"
import { ApiEvents } from "@tix320/noir-core/src/api/ApiEvents"
import { Dto } from "@tix320/noir-core/src/api/Dto"
import { GameActionDtoConverter, visitAction } from "@tix320/noir-core/src/api/GameActionDtoConverter"
import { GameActions } from "@tix320/noir-core/src/game/GameActions"
import { visitEvent } from "@tix320/noir-core/src/game/GameEventVisitor"
import { Role } from "@tix320/noir-core/src/game/Role"
import { StandardGame } from "@tix320/noir-core/src/game/StandardGame"
import { assert } from "@tix320/noir-core/src/util/Assertions"
import express from "express"
import { createServer } from "http"
import { filter, map, takeWhile } from 'rxjs/operators'
import { Server } from "socket.io"
import './db/Datastore'
import { GameEventConverter } from "./game/GameEventConverter"
import { GameData, GamePreparationData } from "./game/GameInfo"
import { GameService } from "./game/GameService"
import { User } from "./user/User"
import { UserService } from "./user/UserService"

process.on('uncaughtException', function (err) {
    console.error(err);
});

const app = express();
const httpServer = createServer(app);

if (WEB_CLIENT_BUNDLE) {
    app.use(express.static(WEB_CLIENT_BUNDLE));
}

const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },

});

function gamePreparationResponse(gameData: GamePreparationData): Dto.GamePreparation {
    const game = gameData.game;

    const participants = game.getParticipants();

    return {
        id: gameData.id,
        name: gameData.name,
        maxPlayersCount: StandardGame.ROLE_SETS.at(-1)!.size,
        roles: participants.map(participant => {
            return {
                identity: userResponse(participant.identity),
                ready: participant.ready,
                role: participant.role?.name,
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

const GAME_ACTION_DTO_CONVERTER = new GameActionDtoConverter();
const GAME_EVENT_CONVERTER = new GameEventConverter();

io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.auth.password;

    const user = await UserService.login(token);
    if (user) {
        console.info(`Connected ${user.name}`)

        socket.on('disconnect', reason => {
            console.error(`Disconnected ${user.name} Reason: ${reason}`);
        });

        socket.data = user;

        next()
    } else {
        console.info(`Invalid token ${token}`)
        next(new Error("Invalid token"))
    }
});

io.on("connection", (socket) => {
    const user: User = socket.data as User;

    socket.on(ApiEvents.GET_MY_USER, (cb) => {
        const response = userResponse(user);
        cb(response);
    });

    socket.on(ApiEvents.CREATE_GAME, (info, cb) => {
        GameService.createGame(user, info);
    });

    socket.on(ApiEvents.JOIN_GAME, (gameId: string, cb) => {
        GameService.joinGame(user, gameId);
    });

    socket.on(ApiEvents.CHANGE_ROLE_IN_GAME, (roleSelection: Dto.GameRoleSelection, cb) => {
        const gameInfo = GameService.changeGameRole(user, {
            ready: roleSelection.ready,
            role: roleSelection.role ? Role.getByName(roleSelection.role) : undefined
        });

        GameService.startGame(gameInfo.id);
    });

    socket.on(ApiEvents.LEAVE_GAME, (cb) => {
        GameService.leaveGame(user);
    });

    socket.on(ApiEvents.DO_GAME_ACTION, (dtoAction: Dto.Action, cb) => {
        let action: GameActions.Any | undefined = visitAction(dtoAction, GAME_ACTION_DTO_CONVERTER);

        assert(action, `Illegal action ${JSON.stringify(dtoAction)}`);

        GameService.doGameAction(user, action);
    });

    socket.on(ApiEvents.SUBSCRIBE_ALL_PREPARING_GAMES, (cb) => {
        const subscriptionName = ApiEvents.STREAM_ALL_PREPARING_GAMES;

        const subscription = GameService.gameChanges()
            .onFirst((currentGames: Map<string, GameData>) => {

                const response = [...currentGames.values()]
                    .filter(gameData => gameData.state === 'PREPARING')
                    .map(gameData => gamePreparationResponse(gameData as GamePreparationData));
                socket.emit(subscriptionName, response);
            })
            .pipe(
                filter(gameData => gameData.state === 'PREPARING'),
                takeWhile(() => socket.connected)
            )
            .subscribe((gameData) => {
                socket.emit(subscriptionName, gamePreparationResponse(gameData as GamePreparationData))
            });

        socket.once(ApiEvents.UNSUBSCRIBE(subscriptionName), () => {
            subscription.unsubscribe();
        });
    })

    socket.on(ApiEvents.SUBSCRIBE_MY_CURRENT_GAME, (cb) => {
        const subscriptionName = ApiEvents.STREAM_MY_CURRENT_GAME(user.id);

        const subscription = user.currentGameChange().subscribe(currentGame => {

            const gameInfo = currentGame ? GameService.getGame(currentGame.id) : undefined;

            const dto: Dto.UserCurrentGame | undefined = gameInfo && {
                id: gameInfo.id,
                state: gameInfo.state
            }

            socket.emit(subscriptionName, dto);
        });

        socket.once(ApiEvents.UNSUBSCRIBE(subscriptionName), () => {
            subscription.unsubscribe();
        });
    });

    socket.on(ApiEvents.SUBSCRIBE_PREPARING_GAME, (gameId: string, cb) => {
        const subscriptionName = ApiEvents.STREAM_PREPARING_GAME(gameId);

        const gameData = GameService.getGamePreparation(gameId);

        const subscription = gameData.game.participantChanges()
            .pipe(
                takeWhile(() => socket.connected)
            ).subscribe(() => socket.emit(subscriptionName, gamePreparationResponse(gameData)));

        socket.once(ApiEvents.UNSUBSCRIBE(subscriptionName), () => {
            subscription.unsubscribe();
        });
    });

    socket.on(ApiEvents.SUBSCRIBE_PLAYING_GAME, (gameId: string, cb) => {
        const subscriptionName = ApiEvents.STREAM_PLAYING_GAME(gameId);

        const subscription = GameService.gameEvents(gameId, user).pipe(
            map(event => visitEvent(event, GAME_EVENT_CONVERTER as any)),
            takeWhile(() => socket.connected)
        ).subscribe((event) => socket.emit(subscriptionName, event));

        socket.once(ApiEvents.UNSUBSCRIBE(subscriptionName), () => {
            subscription.unsubscribe();
        });
    });
});


httpServer.listen(PORT ?? 5000);