import { Direction } from "../util/Direction";
import Identifiable from "../util/Identifiable";
import Position from "../util/Position";
import { Character } from "./Character";
import { Arena, Marker, Player, Score, ShiftAction, Winner } from "./Game";
import { GameActions } from "./GameActions";
import { Role } from "./Role";

export namespace GameEvents {

    export interface Hello {
        readonly type: 'Hello';
        readonly readyEventsCount: number;
    }

    export interface Started<I extends Identifiable> {
        readonly type: 'GameStarted';
        readonly players: Player<I>[];
        readonly arena: Arena<I>;
        readonly evidenceDeck: Character[];
        readonly profilerHand: Character[];
    }

    export interface Completed {
        readonly type: 'GameCompleted';
        readonly winner: Winner;
        readonly score: Score;
    }

    export interface Aborted {
        readonly type: 'GameAborted';
    }

    export interface TurnChanged<I extends Identifiable = Identifiable> {
        readonly type: 'TurnChanged';
        readonly player: I;
        readonly score: Score;
        readonly lastShift?: ShiftAction;
    }

    export interface AvailableActionsChanged {
        readonly type: 'AvailableActionsChanged';
        readonly actions: Set<GameActions.Key>;
    }

    export interface Shifted {
        readonly type: 'Shifted';
        readonly direction: Direction;
        readonly index: number;
        readonly fast: boolean;
    }

    export interface Collapsed {
        readonly type: 'Collapsed';
        readonly direction: Direction;
    }

    export interface AbstractKill {
        readonly killed: Position;
        readonly newFbiIdentity?: Position;
    }

    export interface KilledByKnife extends AbstractKill {
        readonly type: 'KilledByKnife';
    }

    export interface KilledByThreat extends AbstractKill {
        readonly type: 'KilledByThreat';
    }

    export interface KilledByBomb extends AbstractKill {
        readonly type: 'KilledByBomb';
    }

    export interface KilledBySniper extends AbstractKill {
        readonly type: 'KilledBySniper';
    }

    export interface BombDetonated {
        readonly type: 'BombDetonated';
        readonly target: Position;
    }

    export interface Accused {
        readonly type: 'Accused';
        readonly target: Position;
        readonly mafioso: Role;
    }

    export interface UnsuccessfulAccused {
        readonly type: 'UnsuccessfulAccused';
        readonly target: Position;
        readonly mafioso: Role;
    }

    export interface Arrested {
        readonly type: 'Arrested';
        readonly arrested: Position;
        readonly newMafiosoIdentity: Position;
    }

    export interface Disarmed {
        readonly type: 'Disarmed';
        readonly target: Position;
        readonly marker: Marker;
    }

    export interface AutopsyCanvased<I extends Identifiable = Identifiable> {
        readonly type: 'AutopsyCanvased';
        readonly target: Position;
        readonly mafiosi: I[];
    }

    export interface AllCanvased<I extends Identifiable = Identifiable> {
        readonly type: 'AllCanvased';
        readonly target: Position;
        readonly players: I[];
    }

    export interface Profiled<I extends Identifiable = Identifiable> {
        readonly type: 'Profiled';
        readonly target: Position;
        readonly mafiosi: I[];
        readonly newHand: Character[];
    }

    export interface Disguised {
        readonly type: 'Disguised';
        readonly oldIdentity: Position;
        readonly newIdentity?: Position;
    }

    export interface MarkerMoved {
        readonly type: 'MarkerMoved';
        readonly from: Position;
        readonly to: Position;
        readonly marker: Marker;
    }

    export interface InnocentsForCanvasPicked {
        readonly type: 'InnocentsForCanvasPicked';
        readonly suspects: Character[];
    }

    export interface ThreatPlaced {
        readonly type: 'ThreatPlaced';
        readonly targets: Position[];
    }

    export interface BombPlaced {
        readonly type: 'BombPlaced';
        readonly target: Position;
    }

    export interface ProtectionPlaced {
        readonly type: 'ProtectionPlaced';
        readonly target: Position;
    }

    export interface ProtectionRemoved {
        readonly type: 'ProtectionRemoved';
        readonly target: Position;
    }

    export interface SuspectsSwapped {
        readonly type: 'SuspectsSwapped';
        readonly position1: Position;
        readonly position2: Position;
    }

    export interface SelfDestructionActivated {
        readonly type: 'SelfDestructionActivated';
        readonly target: Position;
    }

    export interface ProtectionActivated {
        readonly type: 'ProtectionActivated';
        readonly target: Position;
        readonly trigger: Role;
    }

    export interface ProtectDecided {
        readonly type: 'ProtectDecided';
        readonly target: Position;
        readonly trigger: Role;
        readonly protect: boolean;
    }

    export type Kills = KilledByKnife | KilledByThreat | KilledByBomb | KilledBySniper;

    export type Any<I extends Identifiable = Identifiable> = Hello
        | Started<I> | Completed | Aborted | TurnChanged<I> | AvailableActionsChanged
        | Accused | UnsuccessfulAccused | Arrested | AutopsyCanvased
        | BombDetonated | KilledByBomb | AllCanvased | Collapsed | Disarmed
        | Disguised | KilledByKnife | MarkerMoved | InnocentsForCanvasPicked
        | SelfDestructionActivated | BombPlaced | ProtectionPlaced | ThreatPlaced
        | Profiled | ProtectionActivated | ProtectDecided | ProtectionRemoved
        | Shifted | KilledBySniper | SuspectsSwapped | KilledByThreat;

    export type Key<T extends Any = Any> = T['type'];

    export type ByKey<EventKey extends Key> = Any & { type: EventKey };
}