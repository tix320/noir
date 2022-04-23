import { Direction } from "../util/Direction";
import Identifiable from "../util/Identifiable";
import Position from "../util/Position";
import { Character } from "./Character";
import { Arena, Marker, Player, Score, ShiftAction, Winner } from "./Game";
import { GameActions } from "./GameActions";
import { Role } from "./Role";

export namespace GameEvents {

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

    export interface KillTry {
        readonly type: 'KillTry';
        readonly target: Position;
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

    export interface Accused {
        readonly type: 'Accused';
        readonly target: Position;
        readonly mafioso: Role;
    }

    export interface UnsuccessfulAccused {
        readonly type: 'UnsuccessfulAccused';
        readonly target: Position;
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

    export interface AutoSpyCanvased<I extends Identifiable = Identifiable> {
        readonly type: 'AutoSpyCanvased';
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
        readonly suspects: Position[];
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
    }

    export interface ProtectDecided {
        readonly type: 'ProtectDecided';
        readonly target: Position;
        readonly protect: boolean;
        readonly triggerMarker: Marker | null; 
    }

    export type Kills = KilledByKnife | KilledByThreat | KilledByBomb | KilledBySniper;

    export type Any<I extends Identifiable = Identifiable> =
        Started<I> | Completed | TurnChanged<I> | AvailableActionsChanged
        | KillTry | Accused | UnsuccessfulAccused | Arrested | AutoSpyCanvased
        | KilledByBomb | AllCanvased | Collapsed | Disarmed
        | Disguised | KilledByKnife | MarkerMoved | InnocentsForCanvasPicked
        | SelfDestructionActivated | BombPlaced | ProtectionPlaced | ThreatPlaced
        | Profiled | ProtectionActivated | ProtectDecided | ProtectionRemoved
        | Shifted | KilledBySniper | SuspectsSwapped | KilledByThreat;

    export type Key<T extends Any = Any> = T['type']
}