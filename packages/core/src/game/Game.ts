import EventEmitter from 'events';
import { shuffle, swap } from '../..';
import Identifiable from '../util/Identifiable';
import Matrix from '../util/Matrix';
import Player from './role/Player';
import Agent from './role/Agent';
import Mafioso from './role/Mafioso';
import Killer from './role/Killer';
import Bomber, { BomberContext } from './role/Bomber';
import Detective, { DetectiveContext } from './role/Detective';
import Profiler, { ProfilerContext } from './role/Profiler';
import Psycho from './role/Psycho';
import Sniper from './role/Sniper';
import Suit, { SuitContext } from './role/Suit';
import Undercover from './role/Undercover';
import { RoleType } from './RoleType';
import Shift from './Shift';
import { Suspect } from './Suspect';
import { GameContext } from './role/GameContext';

export default class Game<I extends Identifiable> {

    static ROLE_SETS = [
        new Set([RoleType.KILLER, RoleType.BOMBER, RoleType.PSYCHO, RoleType.UNDERCOVER, RoleType.SUIT, RoleType.DETECTIVE]),
        new Set([RoleType.KILLER, RoleType.BOMBER, RoleType.PSYCHO, RoleType.SNIPER, RoleType.UNDERCOVER, RoleType.SUIT, RoleType.DETECTIVE, RoleType.PROFILER])
    ];

    private state: State<I> = new PreparingState(this);

    public getPlayersCount() {
        if (this.state instanceof PreparingState) {
            return this.state.participants.length;
        }
        else if (this.state instanceof PlayingState) {
            return this.state['context'].players.length;
        } else {
            throw new Error("Completed");
        }
    }

    public getState(): State<I> {
        return this.state;
    }

    public getPreparingState(): PreparingState<I> {
        return this.tryGetState(PreparingState);
    }

    public getPlayingState(): PlayingState<I> {
        return this.tryGetState(PlayingState);
    }

    public getCompletedState(): CompletedState<I> {
        return this.tryGetState(CompletedState);
    }

    private tryGetState<T extends State<I>>(state: Function): T {
        if (!(this.state instanceof state)) {
            throw new Error(`Not in state ${state.name}. Current: ${this.state.constructor.name}`);
        }

        return this.state as any;
    }
}

abstract class State<I extends Identifiable> {
    constructor(protected game: Game<I>) { }


    get type(): typeof PreparingState | typeof PlayingState | typeof CompletedState {
        return this.constructor as any;
    }
}

export class PreparingState<I extends Identifiable> extends State<I> {

    readonly participants: PreliminaryPlayer<I>[] = [];

    public join(participant: PreliminaryPlayer<I>) {
        if (participant.ready && !participant.role) {
            throw new Error('Cannot be ready without role');
        }

        const currentParticipant = this.participants.removeFirstBy(p => participant.identity === p.identity);

        if (currentParticipant && currentParticipant.role !== participant.role) {
            this.resetReadiness();
        }

        if (participant.role) {
            if (this.participants.find(p => p.role === participant.role)) {
                throw new Error(`Role ${participant.role} already selected`);
            }
        }

        const minPlayersCount = Game.ROLE_SETS.at(0)!.size;
        const maxPlayersCount = Game.ROLE_SETS.at(-1)!.size;

        if (this.participants.length === maxPlayersCount) {
            throw new Error("Fully");
        }

        this.participants.push(participant);

        const roles = new Set(this.participants.map(p => p.role)) as Set<RoleType>;

        if (this.readyCount === minPlayersCount && this.matchRoleSet(roles)) {
            this.prepareGame();
        }
    }

    public leave(identity: I) {
        const pariticpant = this.participants.removeFirstBy(p => p.identity !== identity);

        if (pariticpant) {
            // reset ready states
            this.resetReadiness();
        }
    }

    private resetReadiness() {
        this.participants.forEach(p => p.ready = false);
    }

    private get readyCount() {
        let readyCount = 0;
        this.participants.forEach(p => {
            if (p.ready) {
                readyCount++;
            }
        });

        return readyCount;
    }

    private matchRoleSet(roles: Set<RoleType>): boolean {
        return Game.ROLE_SETS.some(set => set.equals(roles));
    }

    private createPlayerForRole(identity: I, role: RoleType, context: GameContext): Player<I> {
        switch (role) {
            case RoleType.KILLER:
                return new Killer(identity, context);
            case RoleType.PSYCHO:
                return new Psycho(identity, context);
            case RoleType.BOMBER:
                return new Bomber(identity, context);
            case RoleType.SNIPER:
                return new Sniper(identity, context);
            case RoleType.UNDERCOVER:
                return new Undercover(identity, context);
            case RoleType.DETECTIVE:
                return new Detective(identity, context);
            case RoleType.SUIT:
                return new Suit(identity, context);
            case RoleType.PROFILER:
                return new Profiler(identity, context);
        }
    }

    private prepareGame() {
        if (this.participants.length !== 6 && this.participants.length !== 8) {
            throw new Error(`Invalid players count ${this.participants.length}`);
        }

        const for6: boolean = this.participants.length === 6;

        const winningScores: [number, number] = for6 ? [18, 5] : [25, 6];

        const arenaSize = for6 ? 6 : 7;

        const suspects = Suspect.generateSet(arenaSize * arenaSize);

        let matrix: Suspect[][]

        if (for6) {
            matrix = [
                suspects.slice(0, 6),
                suspects.slice(6, 12),
                suspects.slice(12, 18),
                suspects.slice(18, 24),
                suspects.slice(24, 30),
                suspects.slice(30, 36),
            ]
        } else {
            matrix = [
                suspects.slice(0, 7),
                suspects.slice(7, 14),
                suspects.slice(14, 21),
                suspects.slice(21, 28),
                suspects.slice(28, 35),
                suspects.slice(35, 42),
                suspects.slice(42, 49),
            ]
        }

        const arena = new Matrix(matrix);

        shuffle(suspects);

        const profilerEvidenceHand = for6 ? [] : suspects.splice(-1, 4);

        const context = new GameContext(arena, suspects, profilerEvidenceHand);

        const players: Player<I>[] = this.participants.map(participant => this.createPlayerForRole(participant.identity, participant.role!, context));

        this.reolvePlayersOrder(players);

        players.forEach(player => suspects.pop()!.role = player);

        context.players = players;
        context.currentTurnPlayer = players[0];

        this.game['state'] = new PlayingState(this.game, context, winningScores);
    }

    private reolvePlayersOrder(players: Player<any>[]): void {
        const mafia: Player<I>[] = players.filter(p => p instanceof Mafioso);
        const fbi: Player<I>[] = players.filter(p => p instanceof Agent);

        shuffle(mafia);
        shuffle(fbi);

        const killerIndex = mafia.findIndex(player => player instanceof Killer);
        swap(mafia, 0, killerIndex);

        let maf = true;
        const mafiaIter = mafia[Symbol.iterator]();
        const fbiIter = fbi[Symbol.iterator]();
        for (let i = 0; i < players.length; i++) {
            players[i] = maf ? mafiaIter.next().value : fbiIter.next().value;
            maf = !maf;
        }
    }
}

export class PlayingState<I extends Identifiable> extends State<I> {

    eventEmmiter: EventEmitter;

    constructor(game: Game<I>, private context: GameContext, private winningScores: [number, number]) {
        super(game);
        this.eventEmmiter = new EventEmitter();
        context.game = this;
    }

    get players(): Player<I>[] {
        return this.context.players;
    }

    checkWin(scores: number[]): number | undefined {
        for (let i = 0; i < this.winningScores.length; i++) {
            if (scores[i] >= this.winningScores[i]) {
                return i;
            }
        }

        return undefined;
    }

    complete() {
        this.game['state'] = new CompletedState(this.game);
    }

    get isCompleted() {
        return this.game['state'] instanceof CompletedState;
    }
}

export class CompletedState<I extends Identifiable> extends State<I> {
}



export interface PreliminaryPlayer<I extends Identifiable> {
    identity: I,
    role?: RoleType,
    ready: boolean
}