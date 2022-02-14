import { GameMode, GameState, getRandomInt, randomIndexes } from '@tix320/noir-core';
import { Player } from './Player';
import { User } from '../user';
import Action from './mode/Action';
import Role from './role/Role';
import GameStrategy from './mode/GameStrategy';

export default class Game {
    readonly id: string;
    readonly mode: GameMode;

    #state: State = new PreparingState(this, (players: Player[]) => this.#state = new PlayingState(this, players, () => this.#state = new CompletedState(this)))

    constructor(id: string, mode: GameMode) {
        this.id = id;
        this.mode = mode;
    }

    public get allowedPlayersCount(): number[] {
        return this.allowedPlayersCountByMode(this.mode);
    }

    public getPlayersCount() {
        if (this.#state instanceof PreparingState) {
            return this.#state.players.size;
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
    protected readonly game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    abstract getType(): GameState;
}

class PreparingState extends State {

    readonly #onReady: (players: Player[]) => void

    readonly players: Map<User, Role> = new Map();

    constructor(game: Game, onReady: (players: Player[]) => void) {
        super(game);
        this.#onReady = onReady;
    }

    getType(): GameState {
        return GameState.PREPARING;
    }

    public join(user: User, role: Role) {
        const minPlayersCount = this.game.allowedPlayersCount.at(0);
        const maxPlayersCount = this.game.allowedPlayersCount.at(-1);

        if (!this.players.has(user) && this.players.size === maxPlayersCount) {
            throw new Error("Fully");
        }

        this.players.set(user, role);

        if (role && this.readyCount == minPlayersCount) {
            const players = Array.from(this.players.entries()).map(entry => new Player(entry[0], entry[1]));
            this.#onReady(players);
        }
    }

    public leave(user: User) {
        const role = this.players.delete(user);

        if (role !== undefined) {
            // reset ready states
            this.players.forEach((_, player) => {
                this.players.set(player, null);
            });
        }
    }

    private get readyCount() {
        let readyCount = 0;
        this.players.forEach((role) => {
            if (role) {
                readyCount++;
            }
        }
        );

        return readyCount;
    }
}

class PlayingState extends State {

    readonly #onEnd: () => void;

    readonly players: Player[];

    readonly gameStrategy: GameStrategy;

    constructor(game: Game, players: Player[], onEnd: () => void) {
        super(game);
        this.players = players;
        this.gameStrategy = GameStrategy.createStrategyByMode(game.mode, players);
        this.#onEnd = onEnd;
    }

    getType(): GameState {
        return GameState.PLAYING;
    }

    turn(action: Action) {
        this.gameStrategy.doAction(action);
    }
}

class CompletedState extends State {

    getType(): GameState {
        return GameState.COMPLETED;
    }
}