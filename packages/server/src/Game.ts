import { GameMode, GameState } from '@tix320/noir-core';
import { Player } from './Player';
import { User } from './user';

export default class Game {
    readonly id: string;
    readonly mode: GameMode;
    readonly minPlayersCount: number;
    readonly maxPlayersCount: number;

    #state: State = new PreparingState(this, () => this.#state = new PlayingState(this, () => this.#state = new CompletedState(this)))

    constructor(id: string, mode: GameMode) { 
        this.id = id;
        switch (mode) {
            case GameMode.KILLER_VS_INSPECTOR:
                this.maxPlayersCount = 2;
                break;
            case GameMode.MAFIA_VS_FBI:
                this.maxPlayersCount = 8;
                break;
            default:
                throw new Error(`Invalid mode ${mode}`);
        }
    }

    public getPlayersCount() {
        if (this.#state instanceof PreparingState) {
            return this.#state.players.size;
        }
        else if (this.#state instanceof PlayingState) {
            return this.#state.players.size;
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
}

abstract class State {
    protected readonly game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    abstract getType(): GameState;
}

class PreparingState extends State {

    readonly #onReady: () => void

    readonly players: Map<User, boolean> = new Map();

    constructor(game: Game, onReady: () => void) {
        super(game);
        this.#onReady = onReady;
    }

    getType(): GameState {
        return GameState.PREPARING;
    }

    public join(user: User, ready: boolean) {
        if (!this.players.has(user) && this.players.size === this.game.maxPlayersCount) {
            throw new Error("Fully");
        }

        if (user.currentGame && user.currentGame !== this.game) {
            throw new Error("Already in another game");
        }

        user.currentGame = this.game;

        this.players.set(user, ready);

        if (ready && this.readyCount == this.game.minPlayersCount) {
            this.#onReady();
        }
    }

    public leave(user: User) {
        const ready = this.players.delete(user);

        if (ready !== undefined) {
            // reset ready states
            this.players.forEach((_, player) => {
                this.players.set(player, false);
            });
        }
    }

    private get readyCount() {
        let readyCount = 0;
        this.players.forEach((ready) => {
            if (ready) {
                readyCount++;
            }
        }
        );

        return readyCount;
    }
}

class PlayingState extends State {

    readonly #onEnd: () => void;

    readonly players: Map<User, boolean> = new Map();

    constructor(game: Game, onEnd: () => void) {
        super(game);
        this.#onEnd = onEnd;
    }

    getType(): GameState {
        return GameState.PLAYING;
    }
}

class CompletedState extends State {

    getType(): GameState {
        return GameState.COMPLETED;
    }
}



class KillerVSInspector {

    getType() {
        return GameMode.KILLER_VS_INSPECTOR
    }
}

class MafiaVSFBI {

    getType() {
        return GameMode.MAFIA_VS_FBI
    }
}