import Matrix from "../util/Matrix";
import Position from "../util/Position";
import { Player } from "./Game";
import { GameActions } from "./GameActions";
import { Suspect } from "./Suspect";

export default interface GameFullState {
    arena: Matrix<Suspect>;

    players: Player<any>[];
    currentTurnPlayer: Player<any>;

    lastShift?: GameActions.Shift;

    bomber: BomberState;
    detective: DetectiveState;
    suit: SuitState;
    profiler: ProfilerState;

    scores: [number, number];
}

export interface BomberState {
    lastDetonatedBomb?: Position;
}

export interface DetectiveState {
    canvas?: [Suspect, Suspect];
}

export class SuitState {
    protection?: ProtectionState
}

export interface ProtectionState {
    target: Position;
}

export interface ProfilerState {
    evidenceHand: Suspect[];
}