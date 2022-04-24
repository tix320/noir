import "@tix320/noir-core";
import { ApiEvents } from "@tix320/noir-core/src/api/ApiEvents";
import { Dto } from "@tix320/noir-core/src/api/Dto";
import { GameActions } from "@tix320/noir-core/src/game/GameActions";
import { Role } from "@tix320/noir-core/src/game/Role";
import { StandardGame } from "@tix320/noir-core/src/game/StandardGame";
import { GameEventVisitor, visitEvent } from "@tix320/noir-core/src/game/GameEventVisitor";
import { GameActionDtoVisitor, visitAction } from "@tix320/noir-core/src/api/GameActionDtoVisitor";
import { filter, map, takeWhile } from 'rxjs/operators';
import { Server } from "socket.io";
import { default as GameService, default as GAME_SERVICE, GameData, GamePreparationInfo } from "./game/GameService";
import { User } from "./user/User";
import USER_SERVICE from "./user/UserService";
import { USERS_BY_TOKEN } from "./user/UserTokens";
import { GameEvents } from "@tix320/noir-core/src/game/GameEvents";
import { Game, Player, Suspect } from "@tix320/noir-core/src/game/Game";

process.on('uncaughtException', function (err) {
    console.error(err);
});

const io = new Server({
    cors: {
        origin: '*',
    },

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

    const participants = game.getParticipants();

    return {
        id: gameInfo.id,
        name: gameInfo.name,
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

function playerResponse(player: Player<User>): Dto.Player {
    return {
        identity: userResponse(player.identity),
        role: player.role.name
    }
}

function suspectResponse(suspect: Suspect<User>): Dto.Suspect {
    return {
        character: suspect.character,
        role: typeof suspect.role === 'string' ? suspect.role : playerResponse(suspect.role),
        markers: suspect.markersSnapshot()
    }
}

class GameEventConverter implements GameEventVisitor<User> {

    GameStarted(event: GameEvents.Started<User>) {
        const eventDto: Dto.Events.Started = {
            type: 'GameStarted',
            players: event.players.map(player => playerResponse(player)),
            arena: event.arena.map(suspect => suspectResponse(suspect)).raw(),
            evidenceDeck: event.evidenceDeck,
            profilerHand: event.profilerHand
        }

        return eventDto;
    }

    GameCompleted(event: GameEvents.Completed) {
        return event;
    }

    TurnChanged(event: GameEvents.TurnChanged<User>) {
        const eventDto: Dto.Events.TurnChanged = {
            type: 'TurnChanged',
            player: userResponse(event.player),
            score: event.score,
            lastShift: event.lastShift
        }

        return eventDto;
    }

    AvailableActionsChanged(event: GameEvents.AvailableActionsChanged) {
        const eventDto: Dto.Events.AvailableActionsChanged = {
            type: 'AvailableActionsChanged',
            actions: [...event.actions]
        }

        return eventDto;
    }

    Shifted(event: GameEvents.Shifted) {
        return event;
    }

    Collapsed(event: GameEvents.Collapsed) {
        return event;
    }

    KillTry(event: GameEvents.KillTry) {
        return event;
    }

    KilledByKnife(event: GameEvents.KilledByKnife) {
        return event;
    }

    KilledByThreat(event: GameEvents.KilledByThreat) {
        return event;
    }

    KilledByBomb(event: GameEvents.KilledByBomb) {
        return event;
    }

    KilledBySniper(event: GameEvents.KilledBySniper) {
        return event;
    }

    Accused(event: GameEvents.Accused) {
        const eventDto: Dto.Events.Accused = {
            type: 'Accused',
            target: event.target,
            mafioso: event.mafioso.name
        }

        return eventDto;
    }

    UnsuccessfulAccused(event: GameEvents.UnsuccessfulAccused) {
        return event;
    }

    Arrested(event: GameEvents.Arrested) {
        return event;
    }

    Disarmed(event: GameEvents.Disarmed) {
        return event;
    }

    AutoSpyCanvased(event: GameEvents.AutoSpyCanvased<User>) {
        const eventDto: Dto.Events.AutoSpyCanvased = {
            type: 'AutoSpyCanvased',
            target: event.target,
            mafiosi: event.mafiosi.map(mafioso => userResponse(mafioso)),
        }

        return eventDto;
    }

    AllCanvased(event: GameEvents.AllCanvased<User>) {
        const eventDto: Dto.Events.AllCanvased = {
            type: 'AllCanvased',
            target: event.target,
            players: event.players.map(player => userResponse(player)),
        }

        return eventDto;
    }

    Profiled(event: GameEvents.Profiled<User>) {
        const eventDto: Dto.Events.Profiled = {
            type: 'Profiled',
            target: event.target,
            mafiosi: event.mafiosi.map(mafioso => userResponse(mafioso)),
            newHand: event.newHand
        }

        return eventDto;
    }

    Disguised(event: GameEvents.Disguised) {
        return event;
    }

    MarkerMoved(event: GameEvents.MarkerMoved) {
        return event;
    }

    InnocentsForCanvasPicked(event: GameEvents.InnocentsForCanvasPicked) {
        return event;
    }

    ThreatPlaced(event: GameEvents.ThreatPlaced) {
        return event;
    }

    BombPlaced(event: GameEvents.BombPlaced) {
        return event;
    }

    ProtectionPlaced(event: GameEvents.ProtectionPlaced) {
        return event;
    }

    ProtectionRemoved(event: GameEvents.ProtectionRemoved) {
        return event;
    }

    SuspectsSwapped(event: GameEvents.SuspectsSwapped) {
        return event;
    }

    SelfDestructionActivated(event: GameEvents.SelfDestructionActivated) {
        return event;
    }

    ProtectionActivated(event: GameEvents.ProtectionActivated) {
        return event;
    }

    ProtectDecided(event: GameEvents.ProtectDecided) {
        return event;
    }
}

const GAME_ACTION_DTO_CONVERTER = new GameActionDtoVisitor();
const GAME_EVENT_CONVERTER = new GameEventConverter();

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

    socket.on(ApiEvents.CHANGE_ROLE_IN_GAME, (roleSelection: Dto.GameRoleSelection, cb) => { 
        const [gameInfo, game] = GAME_SERVICE.changeGameRole(user, {
            ready: roleSelection.ready,
            role: roleSelection.role ? Role.getByName(roleSelection.role) : undefined
        });

        GameService.startGame(gameInfo.id); 
    }); 

    socket.on(ApiEvents.LEAVE_GAME, (cb) => {
        GAME_SERVICE.leaveGame(user);
    });

    socket.on(ApiEvents.DO_GAME_ACTION, (dtoAction: Dto.Actions.Any, cb) => {
        let action: GameActions.Any = visitAction(dtoAction, GAME_ACTION_DTO_CONVERTER);

        GAME_SERVICE.doGameAction(user, action);
    });

    socket.on(ApiEvents.SUBSCRIBE_ALL_PREPARING_GAMES, (cb) => {
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

    socket.on(ApiEvents.SUBSCRIBE_MY_CURRENT_GAME, (cb) => {
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

    socket.on(ApiEvents.SUBSCRIBE_PREPARING_GAME, (gameId: string, cb) => {
        const info = GameService.getGamePreparation(gameId);
        const [gameInfo, game] = info;

        game.participantChanges()
            .pipe(
                takeWhile(() => socket.connected)
            ).subscribe(() => socket.emit(ApiEvents.ROOM_PREPARING_GAME(gameId), gamePreparationResponse(info)));
    });

    socket.on(ApiEvents.SUBSCRIBE_PLAYING_GAME, (gameId: string, cb) => {
        GAME_SERVICE.gameEvents(gameId, user).pipe(
            map(event => visitEvent(event, GAME_EVENT_CONVERTER)),
            takeWhile(() => socket.connected)
        ).subscribe((event) => socket.emit(ApiEvents.ROOM_PLAYING_GAME(gameId), event)); 
    });
});


io.listen(5000);