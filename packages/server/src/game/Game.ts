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
    readonly abstract type: GameState

    protected readonly game: Game;

    constructor(game: Game) {
        this.game = game;
    }
}

class PreparingState extends State {

    readonly type: GameState = GameState.PREPARING

    readonly #onReady: (players: Player[]) => void

    readonly players: Map<User, [Role, boolean]> = new Map();

    constructor(game: Game, onReady: (players: Player[]) => void) {
        super(game);
        this.#onReady = onReady;
    }

    public join(user: User, role: Role, ready: boolean) {
        if (ready && !role) {
            throw new Error('Cannot be ready without role');
        }

        if (role && !GameMode.checkRole(this.game.mode, role)) {
            throw new Error(`There is no role ${role} in game mode ${this.game.mode}`);
        }

        const minPlayersCount = this.game.allowedPlayersCount.at(0);
        const maxPlayersCount = this.game.allowedPlayersCount.at(-1);

        if (!this.players.has(user) && this.players.size === maxPlayersCount) {
            throw new Error("Fully");
        }

        this.players.set(user, [role, ready]);

        if (role && this.readyCount == minPlayersCount) {
            const players = Array.from(this.players.entries()).map(entry => new Player(entry[0], entry[1][0]));
            this.#onReady(players);
        }
    }

    public leave(user: User) {
        const entry = this.players.delete(user);

        if (entry !== undefined) {
            // reset ready states
            this.players.forEach((_, player) => {
                this.players.set(player, null);
            });
        }
    }

    private get readyCount() {
        let readyCount = 0;
        this.players.forEach(([_, ready]) => {
            if (ready) {
                readyCount++;
            }
        }
        );

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
        this.gameStrategy = GameStrategy.createStrategyByMode(game.mode, players);
        this.#onEnd = onEnd;
    }

    turn(action: Action) {
        this.gameStrategy.doAction(action);
    }
}

class CompletedState extends State {

    readonly type: GameState = GameState.COMPLETED
}