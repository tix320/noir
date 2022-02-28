import Matrix from "../../util/Matrix";
import { PlayingState } from "../Game";
import Shift from "../Shift";
import { Suspect } from "../Suspect";
import { BomberContext } from "./Bomber";
import { DetectiveContext } from "./Detective";
import Player from "./Player";
import { ProfilerContext } from "./Profiler";
import { SuitContext } from "./Suit";

export class GameContext {
    arena: Matrix<Suspect>;

    players: Player<any>[];
    currentTurnPlayer: Player<any>;

    evidenceDeck: Suspect[];

    lastShift?: Shift;

    bomber: BomberContext;
    detective: DetectiveContext;
    suit: SuitContext;
    profiler: ProfilerContext;

    scores: [number, number];

    game: PlayingState<any>;

    constructor(arena: Matrix<Suspect>, evidenceDeck: Suspect[], profilerEvidenceHand: Suspect[]) {
        this.arena = arena;
        this.players = undefined as any;
        this.currentTurnPlayer = undefined as any;
        this.evidenceDeck = evidenceDeck;
        this.bomber = {};
        this.detective = {};
        this.suit = {};
        this.profiler = new ProfilerContext(profilerEvidenceHand);
        this.scores = [0, 0];
        this.game = undefined as any;
    }
}