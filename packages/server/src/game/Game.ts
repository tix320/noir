import { GameState, Role } from '@tix320/noir-core';
import EventEmitter from 'events';
import { User } from '../user';
import GameLogic from './logic/GameLogic';

export default class Game {

    static ROLE_SETS = [
        new Set([Role.KILLER, Role.BOMBER, Role.PSYCHO, Role.UNDERCOVER, Role.SUIT, Role.DETECTIVE]),
        new Set([Role.KILLER, Role.BOMBER, Role.PSYCHO, Role.SNIPER, Role.UNDERCOVER, Role.SUIT, Role.DETECTIVE, Role.PROFILER])
    ];

    #state: State = new PreparingState(this, (players: GamePlayer[]) => {
        this.#state = new PlayingState(this, players, () => {
            this.#state = new CompletedState(this);
            this.eventEmmiter.emit('state', GameState.COMPLETED);
        });
        this.eventEmmiter.emit('state', GameState.PLAYING);
    });

    eventEmmiter = new EventEmitter();

    public getPlayersCount() {
        if (this.#state instanceof PreparingState) {
            return this.#state.participants.length;
        }
        else if (this.#state instanceof PlayingState) {
            return this.#state.players.length;
        } else {
            throw new Error("Completed");
        }
    }

    public getState(): State {
        return this.#state;
    }

    public getPreparingState(): PreparingState {
        return this.tryGetState(PreparingState);
    }

    public getPlayingState(): PlayingState {
        return this.tryGetState(PlayingState);
    }

    public getCompletedState(): CompletedState {
        return this.tryGetState(CompletedState);
    }

    private tryGetState<T extends State>(state: new (..._: any) => T): T {
        if (!(this.#state instanceof state)) {
            throw new Error(`Not in state ${state.name}. Current: ${this.#state.type}`);
        }

        return this.#state;
    }
}

abstract class State {
    readonly abstract type: GameState

    protected readonly game: Game;

    constructor(game: Game) {
        this.game = game;
    }
}

class PreparingState extends State {

    readonly type: GameState = GameState.PREPARING

    readonly #onReady: (players: GamePlayer[]) => void

    readonly participants: GameParticipant[] = [];

    constructor(game: Game, onReady: (players: GamePlayer[]) => void) {
        super(game);
        this.#onReady = onReady;
    }

    public join(participant: GameParticipant) {
        if (participant.ready && !participant.role) {
            throw new Error('Cannot be ready without role');
        }

        const currentParticipant = this.participants.removeFirst(p => participant.user === p.user);

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

        const roles = new Set(this.participants.map(p => p.role)) as Set<Role>;

        if (this.readyCount === minPlayersCount && this.matchRoleSet(roles)) {
            const players: GamePlayer[] = this.participants.map(participant => ({ user: participant.user, role: participant.role! }));
            this.#onReady(players);
        }
    }

    public leave(user: User) {
        const pariticpant = this.participants.removeFirst(p => p.user !== user);

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

    private matchRoleSet(roles: Set<Role>): boolean {
        return Game.ROLE_SETS.some(set => set.equals(roles));
    }
}

class PlayingState extends State {

    readonly type: GameState = GameState.PLAYING

    readonly #onEnd: () => void;

    readonly players: GamePlayer[];

    readonly #gameLogic: GameLogic;

    constructor(game: Game, players: GamePlayer[], onEnd: () => void) {
        super(game);
        this.players = players;
        this.#gameLogic = new GameLogic(players);
        this.#onEnd = onEnd;
    }
}

class CompletedState extends State {

    readonly type: GameState = GameState.COMPLETED
}

interface GameParticipant {
    user: User,
    role?: Role,
    ready: boolean
}

export interface GamePlayer {
    user: User,
    role: Role,
}