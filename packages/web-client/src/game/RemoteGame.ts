import { Dto } from '@tix320/noir-core/src/api/Dto';
import { Arena, Game, Player as IPlayer, RoleSelection, Suspect } from '@tix320/noir-core/src/game/Game';
import { GameActions } from '@tix320/noir-core/src/game/GameActions';
import { GameEvents } from '@tix320/noir-core/src/game/GameEvents';
import { Role } from '@tix320/noir-core/src/game/Role';
import { StandardSuspect } from '@tix320/noir-core/src/game/StandardSuspect';
import Matrix from '@tix320/noir-core/src/util/Matrix';
import Position from '@tix320/noir-core/src/util/Position';
import { GameEventDtoVisitor, visitEvent } from '@tix320/noir-core/src/api/GameEventDtoVisitor';
import { map, Observable } from 'rxjs';
import User from "../entity/User";
import Api from '../service/Api';
import { equals } from '@tix320/noir-core/src/util/Identifiable';

export namespace RemoteGame {

    export class Preparation implements Game.Preparation<User>{
        constructor(public readonly id: string) {
        }

        getParticipants(): RoleSelection<User>[] {
            throw new Error("Not implemented");
        }

        join(identity: User): void {
            Api.joinGame(this.id);
        }

        changeRole(selection: RoleSelection<User>): void {
            Api.changeGameRole({
                ready: selection.ready,
                role: selection.role?.name
            });
        }

        leave(identity: User): void {
            Api.leaveGame();
        }

        participantChanges(): Observable<RoleSelection<User>[]> {
            return Api.preparingGameStream(this.id)
                .pipe(map(dto => dto.roles),
                    map(selections =>
                        selections.map(selection => ({
                            identity: new User(selection.identity.id, selection.identity.name),
                            role: selection.role ? Role.getByName(selection.role) : undefined!,
                            ready: selection.ready
                        }))));
        }

        start(): Game.Play<User> | undefined {
            throw new Error('Unsupported operation: Game is automatically starting in server');
        }

        isStarted(): boolean {
            throw new Error('Method not implemented.');
        }
    }

    export class Play implements Game.Play<User> {

        constructor(public readonly id: string) {

        }

        events(): Observable<GameEvents.Any<User>> {
            const visitor = new EventVisitor();
            return Api.playingGameEventsStream(this.id).pipe(map(event => visitEvent(event, visitor)));
        }
    }
}

class Player implements IPlayer<User, GameActions.Any> {

    constructor(public identity: User, public role: Role) {
    }

    doAction(action: GameActions.Any): Promise<void> {
        let dtoAction: Dto.Actions.Any;
        if (action.type === 'accuse' || action.type === 'farAccuse') {
            dtoAction = {
                type: action.type,
                target: action.target,
                mafioso: action.mafioso.name
            }
        } else {
            dtoAction = action;
        }

        return Api.doGameAction(dtoAction);
    }

    gameEvents(): Observable<GameEvents.Any<User>> {
        throw new Error('Method not implemented.');
    }
}

function convertUser(user: Dto.User): User {
    return new User(user.id, user.name);
}

function convertPlayer(player: Dto.Player): Player {
    return new Player(convertUser(player.identity), Role.getByName(player.role));
}

function convertSuspect(suspect: Dto.Suspect): Suspect {
    const role = typeof suspect.role === 'string'
        ? suspect.role
        : convertPlayer(suspect.role);

    return new StandardSuspect(suspect.character, role, suspect.markers);
}

function convertArena(arena: Dto.Arena, players: Player[]): Arena {
    return new Matrix(arena).map(suspect => new StandardSuspect(
        suspect.character,
        typeof suspect.role === 'string'
            ? suspect.role
            : players.find(player => equals(player.identity, (suspect.role as Dto.Player).identity)),
        suspect.markers));
}


export function convertPosition(positionDto?: Position): any {
    return positionDto ? new Position(positionDto.x, positionDto.y) : undefined;
}

class EventVisitor extends GameEventDtoVisitor<User> {

    GameStarted(event: Dto.Events.Started): GameEvents.Started<User> {
        const players = event.players.map(player => convertPlayer(player));
        return {
            type: 'GameStarted',
            players: players,
            arena: convertArena(event.arena, players),
            evidenceDeck: event.evidenceDeck,
            profilerHand: event.profilerHand
        }
    }

    TurnChanged(event: Dto.Events.TurnChanged): GameEvents.TurnChanged<User> {
        return {
            type: 'TurnChanged',
            player: convertUser(event.player),
            score: event.score,
            lastShift: event.lastShift
        }
    }

    AvailableActionsChanged(event: Dto.Events.AvailableActionsChanged): GameEvents.AvailableActionsChanged {
        return {
            type: 'AvailableActionsChanged',
            actions: new Set(event.actions)
        }
    }

    KillTry(event: GameEvents.KillTry): GameEvents.KillTry {
        return {
            type: 'KillTry',
            target: convertPosition(event.target)
        }
    }

    KilledByKnife(event: GameEvents.KilledByKnife): GameEvents.KilledByKnife {
        return {
            type: 'KilledByKnife',
            killed: convertPosition(event.killed),
            newFbiIdentity: convertPosition(event.newFbiIdentity)
        }
    }

    KilledByThreat(event: GameEvents.KilledByThreat): GameEvents.KilledByThreat {
        return {
            type: 'KilledByThreat',
            killed: convertPosition(event.killed),
            newFbiIdentity: convertPosition(event.newFbiIdentity)
        }
    }

    KilledByBomb(event: GameEvents.KilledByBomb): GameEvents.KilledByBomb {
        return {
            type: 'KilledByBomb',
            killed: convertPosition(event.killed),
            newFbiIdentity: convertPosition(event.newFbiIdentity)
        }
    }

    KilledBySniper(event: GameEvents.KilledBySniper): GameEvents.KilledBySniper {
        return {
            type: 'KilledBySniper',
            killed: convertPosition(event.killed),
            newFbiIdentity: convertPosition(event.newFbiIdentity)
        }
    }

    Accused(event: Dto.Events.Accused): GameEvents.Accused {
        return {
            type: 'Accused',
            target: convertPosition(event.target),
            mafioso: Role.getByName(event.mafioso)
        }
    }

    UnsuccessfulAccused(event: GameEvents.UnsuccessfulAccused): GameEvents.UnsuccessfulAccused {
        return {
            type: 'UnsuccessfulAccused',
            target: convertPosition(event.target)
        }
    }

    Arrested(event: GameEvents.Arrested): GameEvents.Arrested {
        return {
            type: 'Arrested',
            arrested: convertPosition(event.arrested),
            newMafiosoIdentity: convertPosition(event.newMafiosoIdentity)
        }
    }

    Disarmed(event: GameEvents.Disarmed): GameEvents.Disarmed {
        return {
            type: 'Disarmed',
            target: convertPosition(event.target),
            marker: event.marker
        }
    }

    AutoSpyCanvased(event: Dto.Events.AutoSpyCanvased): GameEvents.AutoSpyCanvased<User> {
        return {
            type: 'AutoSpyCanvased',
            target: convertPosition(event.target),
            mafiosi: event.mafiosi.map(mafioso => convertUser(mafioso))
        }
    }

    AllCanvased(event: Dto.Events.AllCanvased): GameEvents.AllCanvased<User> {
        return {
            type: 'AllCanvased',
            target: convertPosition(event.target),
            players: event.players.map(player => convertUser(player))
        }
    }

    Profiled(event: Dto.Events.Profiled): GameEvents.Profiled<User> {
        return {
            type: 'Profiled',
            target: convertPosition(event.target),
            mafiosi: event.mafiosi.map(mafioso => convertUser(mafioso)),
            newHand: event.newHand
        }
    }


    Disguised(event: GameEvents.Disguised): GameEvents.Disguised {
        return {
            type: 'Disguised',
            oldIdentity: convertPosition(event.oldIdentity),
            newIdentity: convertPosition(event.newIdentity)
        }
    }

    MarkerMoved(event: GameEvents.MarkerMoved): GameEvents.MarkerMoved {
        return {
            type: 'MarkerMoved',
            from: convertPosition(event.from),
            to: convertPosition(event.to),
            marker: event.marker
        }
    }

    InnocentsForCanvasPicked(event: GameEvents.InnocentsForCanvasPicked): GameEvents.InnocentsForCanvasPicked {
        return {
            type: 'InnocentsForCanvasPicked',
            suspects: event.suspects.map(pos => convertPosition(pos))
        }
    }

    ThreatPlaced(event: GameEvents.ThreatPlaced): GameEvents.ThreatPlaced {
        return {
            type: 'ThreatPlaced',
            targets: event.targets.map(pos => convertPosition(pos))
        }
    }

    BombPlaced(event: GameEvents.BombPlaced): GameEvents.BombPlaced {
        return {
            type: 'BombPlaced',
            target: convertPosition(event.target)
        }
    }

    ProtectionPlaced(event: GameEvents.ProtectionPlaced): GameEvents.ProtectionPlaced {
        return {
            type: 'ProtectionPlaced',
            target: convertPosition(event.target)
        }
    }

    ProtectionRemoved(event: GameEvents.ProtectionRemoved): GameEvents.ProtectionRemoved {
        return {
            type: 'ProtectionRemoved',
            target: convertPosition(event.target)
        }
    }

    SuspectsSwapped(event: GameEvents.SuspectsSwapped): GameEvents.SuspectsSwapped {
        return {
            type: 'SuspectsSwapped',
            position1: convertPosition(event.position1),
            position2: convertPosition(event.position2)
        }
    }

    SelfDestructionActivated(event: GameEvents.SelfDestructionActivated): GameEvents.SelfDestructionActivated {
        return {
            type: 'SelfDestructionActivated',
            target: convertPosition(event.target)
        }
    }

    ProtectionActivated(event: GameEvents.ProtectionActivated): GameEvents.ProtectionActivated {
        return {
            type: 'ProtectionActivated',
            target: convertPosition(event.target)
        }
    }

    ProtectDecided(event: GameEvents.ProtectDecided): GameEvents.ProtectDecided {
        return {
            type: 'ProtectDecided',
            target: convertPosition(event.target),
            protect: event.protect
        }
    }
}
