import { Direction } from "../util/Direction";
import Position from "../util/Position";
import { Player, Team, Winner } from "./Game";
import { GameActions } from "./GameActions";
import { Marker } from "./Marker";
import { RoleType } from "./RoleType";
import { Suspect } from "./Suspect";

export namespace GameEvents {

    export interface Base {
        readonly type: string;
    }

    export interface Complete extends Base {
        readonly type: 'Complete';

        readonly winner: Winner;
    }

    export interface TurnChanged extends Base {
        readonly type: 'TurnChanged';

        readonly player: RoleType;
    }

    export interface Action extends Base {
    }

    export interface TryKill extends Action {
        readonly type: 'TryKill';

        readonly target: Position;
    }

    export interface AbstractKill extends Action {

        readonly killed: Position;
        readonly newIdentity?: Position;
    }

    export interface Accuse extends Action {
        readonly type: 'Accuse';

        readonly target: Position;
        readonly mafioso: RoleType;
    }

    export interface UnsuccessfulAccuse extends Action {
        readonly type: 'UnsuccessfulAccuse';

        readonly target: Position;
    }

    export interface Arrest extends Action {
        readonly type: 'Arrest';

        readonly arrested: Position;
        readonly newIdentity: Position;
    }

    export interface AutoSpy extends Action {
        readonly type: 'AutoSpy';

        readonly target: Position;
        readonly mafiosi: RoleType[];        
    }

    export interface BombDetonation extends AbstractKill {
        readonly type: 'BombDetonation';
    }

    export interface Canvas extends Action {
        readonly type: 'Canvas';

        readonly target: Position;
        readonly players: RoleType[];
    }

    export interface Collapse extends Action {
        readonly type: 'Collapse';

        readonly direction: Direction;
    }

    export interface Disarm extends Action {
        readonly type: 'Disarm';

        readonly target: Position;
        readonly marker: Marker;
    }

    export interface Disguise extends Action {
        readonly type: 'Disguise';

        readonly oldIdentity: Position;
        readonly newIdentity?: Position;
    }

    export interface FarAccuse extends Action {
        readonly type: 'FarAccuse';

        readonly target: Position;
        readonly mafioso: RoleType;
    }

    export interface KnifeKill extends AbstractKill {
        readonly type: 'KnifeKill';
    }

    export interface MoveMarker extends Action {
        readonly type: 'MoveMarker';

        readonly from: Position;
        readonly to: Position;
        readonly marker: Marker;
    }

    export interface PeekSuspectsForCanvas extends Action {
        readonly type: 'PeekSuspectsForCanvas';

        readonly suspects: [Position, Position];
    }

    export interface SelfDestructionActivated extends Action {
        readonly type: 'SelfDestructionActivated';

        readonly target: Position;
    }

    export interface PlaceBomb extends Action {
        readonly type: 'PlaceBomb';

        readonly target: Position;
    }

    export interface PlaceProtection extends Action {
        readonly type: 'PlaceProtection';

        readonly target: Position;
    }

    export interface PlaceThreat extends Action {
        readonly type: 'PlaceThreat';

        readonly targets: Position[];
    }

    export interface Profile extends Action {
        readonly type: 'Profile';

        readonly target: Position;
        readonly mafiosi: RoleType[];  
        readonly newHand: Suspect[];
    }

    export interface ProtectionActivated extends Action {
        readonly type: 'ProtectionActivated';

        readonly target: Position;
    }

    export interface ProtectDecision extends Action {
        readonly type: 'ProtectDecision';

        readonly target: Position;
        readonly protect: boolean;
    }

    export interface RemoveProtection extends Action {
        readonly type: 'RemoveProtection';

        readonly target: Position;
    }

    export interface Shift extends Action {
        readonly type: 'Shift';

        readonly shift: GameActions.Shift;
    }

    export interface SniperKill extends AbstractKill {
        readonly type: 'SniperKill';
    }

    export interface StopDetonation extends Action {
        readonly type: 'StopDetonation';
    }

    export interface SwapSuspects extends Action {
        readonly type: 'SwapSuspects';

        readonly position1: Position;
        readonly position2: Position;
    }

    export interface ThreatKill extends AbstractKill {
        readonly type: 'ThreatKill';
    }

    export type Kills = KnifeKill | ThreatKill | BombDetonation | SniperKill;
}