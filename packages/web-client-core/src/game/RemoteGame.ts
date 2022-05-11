import { Dto } from '@tix320/noir-core/src/api/Dto';
import { Arena, Game, GameInitialState, Player as IPlayer, RoleSelection, Suspect } from '@tix320/noir-core/src/game/Game';
import { GameActions } from '@tix320/noir-core/src/game/GameActions';
import { GameEvents } from '@tix320/noir-core/src/game/GameEvents';
import { convertActionToDto } from '@tix320/noir-core/src/api/GameActionConverter';
import { Role } from '@tix320/noir-core/src/game/Role';
import { StandardSuspect } from '@tix320/noir-core/src/game/StandardSuspect';
import Matrix from '@tix320/noir-core/src/util/Matrix';
import Position from '@tix320/noir-core/src/util/Position';
import { map, Observable } from 'rxjs';
import { User } from "../entity/User";
import { equals } from '@tix320/noir-core/src/util/Identifiable';
import { API } from '../service/Api';
import { Character } from '@tix320/noir-core/src/game/Character';

export namespace RemoteGame {

    export class Preparation implements Game.Preparation<User>{
        constructor(public readonly id: string) {
        }

        getParticipants(): RoleSelection<User>[] {
            throw new Error("Not implemented");
        }

        join(identity: User): void {
            API.joinGame(this.id);
        }

        changeRole(selection: RoleSelection<User>): void {
            API.changeGameRole({
                ready: selection.ready,
                role: selection.role?.name
            });
        }

        leave(identity: User): void {
            API.leaveGame();
        }

        participantChanges(): Observable<RoleSelection<User>[]> {
            return API.preparingGameStream(this.id)
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

        public get initialState(): GameInitialState<User> {
            throw new Error('Unsupported. Instead get players from `GameStarted` event');
        }

        public get players(): Player[] {
            throw new Error('Unsupported. Instead get players from `GameStarted` event');
        }

        public events(): Observable<GameEvents.Any<User>> {
            const visitor = new GameEventDtoConverter();
            return API.playingGameEventsStream(this.id).pipe(map(event => visitEvent(event, visitor)));
        }

        public forceComplete(): void {
            throw new Error('Method not implemented.');
        }

        public get isCompleted(): boolean {
            throw new Error('Property not implemented.');
        }

        public onComplete(): Observable<void> {
            throw new Error('Method not implemented.');
        }
    }
}

class Player implements IPlayer<User, GameActions.Any> {

    constructor(public identity: User, public role: Role) {
    }

    doAction(action: GameActions.Any): Promise<void> {
        let dtoAction: Dto.Actions.Any = convertActionToDto(action);

        return API.doGameAction(dtoAction);
    }

    gameEvents(): Observable<GameEvents.Any<User>> {
        throw new Error('Method not implemented.');
    }
}

export class GameEventDtoConverter {

    Hello(event: Dto.Events.Any & { type: 'Hello' }): GameEvents.Hello {
        return event;
    }

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

    GameCompleted(event: Dto.Events.Any & { type: 'GameCompleted' }): GameEvents.Completed {
        return event;
    }

    GameAborted(event: Dto.Events.Any & { type: 'GameAborted' }): GameEvents.Aborted {
        return event;
    }

    TurnChanged(event: Dto.Events.Any & { type: 'TurnChanged' }): GameEvents.TurnChanged<User> {
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

    Shifted(event: Dto.Events.Any & { type: 'Shifted' }): GameEvents.Shifted {
        return event;
    }

    Collapsed(event: Dto.Events.Any & { type: 'Collapsed' }): GameEvents.Collapsed {
        return event;
    }

    KilledByKnife(event: Dto.Events.Any & { type: 'KilledByKnife' }): GameEvents.KilledByKnife {
        return {
            type: 'KilledByKnife',
            killed: convertPosition(event.killed),
            newFbiIdentity: convertPosition(event.newFbiIdentity)
        }
    }

    KilledByThreat(event: Dto.Events.Any & { type: 'KilledByThreat' }): GameEvents.KilledByThreat {
        return {
            type: 'KilledByThreat',
            killed: convertPosition(event.killed),
            newFbiIdentity: convertPosition(event.newFbiIdentity)
        }
    }

    KilledByBomb(event: Dto.Events.Any & { type: 'KilledByBomb' }): GameEvents.KilledByBomb {
        return {
            type: 'KilledByBomb',
            killed: convertPosition(event.killed),
            newFbiIdentity: convertPosition(event.newFbiIdentity)
        }
    }

    KilledBySniper(event: Dto.Events.Any & { type: 'KilledBySniper' }): GameEvents.KilledBySniper {
        return {
            type: 'KilledBySniper',
            killed: convertPosition(event.killed),
            newFbiIdentity: convertPosition(event.newFbiIdentity)
        }
    }

    BombDetonated(event: Dto.Events.Any & { type: 'BombDetonated' }): GameEvents.BombDetonated {
        return {
            type: 'BombDetonated',
            target: convertPosition(event.target),
        }
    }

    Accused(event: Dto.Events.Any & { type: 'Accused' }): GameEvents.Accused {
        return {
            type: 'Accused',
            target: convertPosition(event.target),
            mafioso: Role.getByName(event.mafioso)
        }
    }

    UnsuccessfulAccused(event: Dto.Events.Any & { type: 'UnsuccessfulAccused' }): GameEvents.UnsuccessfulAccused {
        return {
            type: 'UnsuccessfulAccused',
            target: convertPosition(event.target),
            mafioso: Role.getByName(event.mafioso)
        }
    }

    Arrested(event: Dto.Events.Any & { type: 'Arrested' }): GameEvents.Arrested {
        return {
            type: 'Arrested',
            arrested: convertPosition(event.arrested),
            newMafiosoIdentity: convertPosition(event.newMafiosoIdentity)
        }
    }

    Disarmed(event: Dto.Events.Any & { type: 'Disarmed' }): GameEvents.Disarmed {
        return {
            type: 'Disarmed',
            target: convertPosition(event.target),
            marker: event.marker
        }
    }

    AutopsyCanvased(event: Dto.Events.Any & { type: 'AutopsyCanvased' }): GameEvents.AutopsyCanvased<User> {
        return {
            type: 'AutopsyCanvased',
            target: convertPosition(event.target),
            mafiosi: event.mafiosi.map(mafioso => convertUser(mafioso))
        }
    }

    AllCanvased(event: Dto.Events.Any & { type: 'AllCanvased' }): GameEvents.AllCanvased<User> {
        return {
            type: 'AllCanvased',
            target: convertPosition(event.target),
            players: event.players.map(player => convertUser(player))
        }
    }

    Profiled(event: Dto.Events.Any & { type: 'Profiled' }): GameEvents.Profiled<User> {
        return {
            type: 'Profiled',
            target: convertPosition(event.target),
            mafiosi: event.mafiosi.map(mafioso => convertUser(mafioso)),
            newHand: event.newHand.map(characterName => Character.getByName(characterName))
        }
    }

    Disguised(event: Dto.Events.Any & { type: 'Disguised' }): GameEvents.Disguised {
        return {
            type: 'Disguised',
            oldIdentity: convertPosition(event.oldIdentity),
            newIdentity: convertPosition(event.newIdentity)
        }
    }

    MarkerMoved(event: Dto.Events.Any & { type: 'MarkerMoved' }): GameEvents.MarkerMoved {
        return {
            type: 'MarkerMoved',
            from: convertPosition(event.from),
            to: convertPosition(event.to),
            marker: event.marker
        }
    }

    InnocentsForCanvasPicked(event: Dto.Events.Any & { type: 'InnocentsForCanvasPicked' }): GameEvents.InnocentsForCanvasPicked {
        return {
            type: 'InnocentsForCanvasPicked',
            suspects: event.suspects.map(characterName => Character.getByName(characterName))
        }
    }

    ThreatPlaced(event: Dto.Events.Any & { type: 'ThreatPlaced' }): GameEvents.ThreatPlaced {
        return {
            type: 'ThreatPlaced',
            targets: event.targets.map(pos => convertPosition(pos))
        }
    }

    BombPlaced(event: Dto.Events.Any & { type: 'BombPlaced' }): GameEvents.BombPlaced {
        return {
            type: 'BombPlaced',
            target: convertPosition(event.target)
        }
    }

    ProtectionPlaced(event: Dto.Events.Any & { type: 'ProtectionPlaced' }): GameEvents.ProtectionPlaced {
        return {
            type: 'ProtectionPlaced',
            target: convertPosition(event.target),
        }
    }

    ProtectionRemoved(event: Dto.Events.Any & { type: 'ProtectionRemoved' }): GameEvents.ProtectionRemoved {
        return {
            type: 'ProtectionRemoved',
            target: convertPosition(event.target)
        }
    }

    SuspectsSwapped(event: Dto.Events.Any & { type: 'SuspectsSwapped' }): GameEvents.SuspectsSwapped {
        return {
            type: 'SuspectsSwapped',
            position1: convertPosition(event.position1),
            position2: convertPosition(event.position2)
        }
    }

    SelfDestructionActivated(event: Dto.Events.Any & { type: 'SelfDestructionActivated' }): GameEvents.SelfDestructionActivated {
        return {
            type: 'SelfDestructionActivated',
            target: convertPosition(event.target)
        }
    }

    ProtectionActivated(event: Dto.Events.Any & { type: 'ProtectionActivated' }): GameEvents.ProtectionActivated {
        return {
            type: 'ProtectionActivated',
            target: convertPosition(event.target),
            trigger: Role.getByName(event.trigger)
        }
    }

    ProtectDecided(event: Dto.Events.Any & { type: 'ProtectDecided' }): GameEvents.ProtectDecided {
        return {
            type: 'ProtectDecided',
            target: convertPosition(event.target),
            protect: event.protect,
            trigger: Role.getByName(event.trigger)
        }
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

function convertPosition(positionDto?: Dto.Position): any {
    return positionDto ? new Position(positionDto.x, positionDto.y) : undefined;
}

function visitEvent(event: Dto.Events.Any, eventVisitor: GameEventDtoConverter) {
    const functionName = event.type;
    const func = (eventVisitor as any)[functionName];

    if (typeof func === 'function') {
        return func(event);
    }
}
