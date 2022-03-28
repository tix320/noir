import { Direction } from "../util/Direction";
import Identifiable from "../util/Identifiable";
import Position from "../util/Position";
import { Player, RoleSelection } from "./Game";
import { Marker } from "./Marker";
import { RoleType } from "./RoleType";
import Shift from "./Shift";
import { Suspect } from "./Suspect";

export namespace GameEvents {

    export interface Event {
        readonly type: string;
    }

    export interface ActionEvent extends Event {

        readonly actor: RoleType;
        readonly currentTurnPlayer: Player<any>;
    }

    export interface AbstractKillEvent extends ActionEvent {

        readonly target: Position;
        readonly newIdentity?: Position;
    }

    export interface AccuseEvent extends ActionEvent {
        readonly type: 'Accuse';

        readonly target: Position;
        readonly mafioso: RoleType;
    }

    export interface ArestEvent extends ActionEvent {
        readonly type: 'Arest';

        readonly target: Position;
        readonly newIdentity: Position;
    }

    export interface BombDetonationEvent extends AbstractKillEvent {
        readonly type: 'BombDetonation';
    }

    export interface CanvasEvent extends ActionEvent {
        readonly type: 'Canvas';

        readonly target: Position;
        readonly players: RoleType[];
    }

    export interface CollapseEvent extends ActionEvent {
        readonly type: 'Collapse';

        readonly direction: Direction;
    }

    export interface CompleteEvent extends ActionEvent {

        readonly winner: 'mafia' | 'fbi';
    }

    export interface DisarmEvent extends ActionEvent {
        readonly type: 'Disarm';

        readonly target: Position;
        readonly marker: Marker;
    }

    export interface DisguiseEvent extends ActionEvent {
        readonly type: 'Disguise';

        readonly oldIdentity: Position;
        readonly newIdentity: Position;
    }

    export interface FarAccuseEvent extends ActionEvent {
        readonly type: 'FarAccuse';

        readonly target: Position;
        readonly mafioso: RoleType;
    }

    export interface KniveKillEvent extends AbstractKillEvent {
        readonly type: 'KniveKill';
    }

    export interface MoveMarkerEvent extends ActionEvent {
        readonly type: 'MoveMarker';

        readonly from: Position;
        readonly to: Position;
        readonly marker: Marker;
    }

    export interface PeekSuspectsForCanvasEvent extends ActionEvent {
        readonly type: 'PeekSuspectsForCanvas';

        readonly suspects: [Suspect, Suspect];
    }

    export interface PlaceBombEvent extends ActionEvent {
        readonly type: 'PlaceBomb';

        readonly target: Position;
    }

    export interface PlaceProtectionEvent extends ActionEvent {
        readonly type: 'PlaceProtection';

        readonly target: Position;
    }

    export interface PlaceThreatEvent extends ActionEvent {
        readonly type: 'PlaceThreat';

        readonly target: Position;
    }

    export interface ProfileEvent extends ActionEvent {
        readonly type: 'Profile';

        readonly target: Position;
        readonly newHand: Suspect[];
    }

    export interface ProtectDecisionEvent extends ActionEvent {
        readonly type: 'DecideProtect';

        readonly target: Position;
        readonly protect: boolean;
    }

    export interface RemoveProtectionEvent extends ActionEvent {
        readonly type: 'RemoveProtection';

        readonly target: Position;
    }

    export interface ShiftEvent extends ActionEvent {
        readonly type: 'Shift';

        readonly shift: Shift;
    }

    export interface SniperKillEvent extends AbstractKillEvent {
        readonly type: 'SniperKill';
    }

    export interface StopDetonationEvent extends ActionEvent {
        readonly type: 'StopDetonation';
    }

    export interface SwapSuspectsEvent extends ActionEvent {
        readonly type: 'SwapSuspects';

        readonly position1: Position;
        readonly position2: Position;
    }

    export interface ThreatKillEvent extends AbstractKillEvent {
        readonly type: 'ThreatKill';
    }
}