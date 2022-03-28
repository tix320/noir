import Game, { CompletedState as ICompletedState, GameState, PlayingState as IPlayingState, RoleSelection, PreparingState as IPreparingState } from '@tix320/noir-core/src/game/Game';
import { Constructor } from '@tix320/noir-core/src/util/Types';
import { Observable } from 'rxjs';
import User from "../entity/User";
import Api from '../service/Api';

export default class RemoteGame implements Game<User> {

    stateObj: State = new PreparingState(this);

    constructor(public id: string) {

    }

    get state(): GameState {
        throw new Error("Method not implemented.");
    }

    getPlayersCount(): number {
        throw new Error("Method not implemented.");
    }

    getPreparingState(): IPreparingState<User> {
        return this.tryGetState<PreparingState>(PreparingState);
    }

    getPlayingState(): IPlayingState<User> {
        throw new Error("Method not implemented.");
    }

    getCompletedState(): ICompletedState<User> {
        throw new Error("Method not implemented.");
    }

    private tryGetState<T extends State>(state: Constructor<T>): T {
        if (!(this.stateObj instanceof state)) {
            throw new Error(`Not in state ${state.name}. Current: ${this.state.constructor.name}`);
        }

        return this.stateObj;
    }
}

abstract class State {

    constructor(protected game: RemoteGame) { }

    abstract getPlayersCount(): number;
}

class PreparingState extends State implements IPreparingState<User> {

    getPlayersCount(): number {
        throw new Error('Method not implemented.');
    }

    get participants(): RoleSelection<User>[] {
        throw new Error('Method not implemented.');
    }

    join(identity: User): void {
        Api.joinGame(this.game.id);
    }

    changeRole(selection: RoleSelection<User>): void {
        Api.changeGameRole(selection);
    }

    leave(identity: User): void {
        Api.leaveGame();
    }

    participantChanges(): Observable<RoleSelection<User>[]> {
        return Api.gamePreparationStream(this.game.id);
    }
}