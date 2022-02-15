import { GameMode, GameState, getRandomInt, randomIndexes, Role } from '@tix320/noir-core';
import { Player } from './Player';
import { User } from '../user';
import Action from './mode/Action';
import GameStrategy from './mode/GameStrategy';

export default class Game {
    readonly mode: GameMode;

    #state: State = new PreparingState(this, (players: Player[]) => this.#state = new PlayingState(this, players, () => this.#state = new CompletedState(this)))

    constructor(mode: GameMode) {
        this.mode = mode;
    }

    public get allowedPlayersCount(): number[] {
        return this.allowedPlayersCountByMode(this.mode);
    }

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
            throw new Error(`Not in state ${state}. Current: ${this.#state}`);
        }

        return this.#state;
    }

    private allowedPlayersCountByMode(mode: GameMode): number[] {
        switch (mode) {
            case GameMode.KILLER_VS_INSPECTOR:
                return [2];
            case GameMode.MAFIA_VS_FBI:
                return [6, 8];
            default:
                throw new Error(`Invalid mode ${mode}`);
        }
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

    readonly #onReady: (players: Player[]) => void

    readonly participants: GameParticipant[] = [];

    constructor(game: Game, onReady: (players: Player[]) => void) {
        super(game);
        this.#onReady = onReady;
    }

    public join(participant: GameParticipant) {
        if (participant.ready && !participant.role) {
            throw new Error('Cannot be ready without role');
        }

        if (participant.role) {
            if (!GameMode.checkRole(this.game.mode, participant.role)) {
                throw new Error(`There is no role ${participant.role} in game mode ${this.game.mode}`);
            }

            if (this.participants.find(p => p.role === participant.role)) {
                throw new Error(`Role ${participant.role} already selected`);
            }
        }

        const minPlayersCount = this.game.allowedPlayersCount.at(0);
        const maxPlayersCount = this.game.allowedPlayersCount.at(-1);

        if (!this.participants.find(p => participant.user === p.user) && this.participants.length === maxPlayersCount) {
            throw new Error("Fully");
        }

        const userIndex = this.participants.findIndex(p => participant.user === p.user);

        if (userIndex == -1) {
            this.participants.push(participant);
        } else {
            this.participants[userIndex] = participant;
        }

        if (this.readyCount == minPlayersCount) { // TODO start only if roles is acceptable for this game, exmaple: sniper allowed only in 4vs4 game
            const players = this.participants.map(participant => new Player(participant.user, participant.role));
            this.#onReady(players);
        }
    }

    public leave(user: User) {
        const pariticpant = this.participants.removeFirst(p => p.user !== user);

        if (pariticpant) {
            // reset ready states
            this.participants.forEach(p => p.ready = false);
        }
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
}

class PlayingState extends State {

    readonly type: GameState = GameState.PLAYING

    readonly #onEnd: () => void;

    readonly players: Player[];

    readonly gameStrategy: GameStrategy;

    constructor(game: Game, players: Player[], onEnd: () => void) {
        super(game);
        this.players = players;
        // this.gameStrategy = GameStrategy.createStrategyByMode(game.mode, players);
        this.#onEnd = onEnd;
    }

    turn(action: Action) {
        this.gameStrategy.doAction(action);
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