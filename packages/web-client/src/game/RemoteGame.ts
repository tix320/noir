import Game, { CompletedState as ICompletedState, GameState, Player as IPlayer, PlayingState as IPlayingState, PreparingState as IPreparingState, RoleSelection, Team } from '@tix320/noir-core/src/game/Game';
import GameFullState from '@tix320/noir-core/src/game/GameFullState';
import { RoleType } from '@tix320/noir-core/src/game/RoleType';
import Shift from '@tix320/noir-core/src/game/Shift';
import { Direction } from '@tix320/noir-core/src/util/Direction';
import Position from '@tix320/noir-core/src/util/Position';
import { Constructor } from '@tix320/noir-core/src/util/Types';
import { Observable } from 'rxjs';
import User from "../entity/User";
import Api from '../service/Api';

export default class RemoteGame implements Game<User> {

    stateObj: State = new PlayingState(this);

    constructor(public id: string) {

    }

    get state(): GameState {
        if (this.stateObj instanceof PreparingState) {
            return 'PREPARING';
        }
        else if (this.stateObj instanceof PlayingState) {
            return 'PLAYING';
        } else {
            return 'COMPLETED';
        }
    }

    getPlayersCount(): number {
        return 6;
    }

    getPreparingState(): IPreparingState<User> {
        return this.tryGetState<PreparingState>(PreparingState);
    }

    getPlayingState(): IPlayingState<User> {
        return this.tryGetState<PlayingState>(PlayingState);
    }

    getCompletedState(): ICompletedState<User> {
        throw new Error("Method not implemented.");
    }

    private tryGetState<T extends State>(state: Constructor<T>): T {
        if (!(this.stateObj instanceof state)) {
            throw new Error(`Not in state ${state.name}. Current: ${this.state}`);
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

class PlayingState extends State implements IPlayingState<User>{
    getPlayersCount(): number {
        throw new Error('Method not implemented.');
    }

    get players(): IPlayer<User>[] {
        throw new Error('Method not implemented.');
    }
    getPlayers(team: Team): IPlayer<User>[] {
        return team === 'MAFIA' ? [new Player(new User('K', 'K'), RoleType.KILLER), new Player(new User('B', 'B'), RoleType.BOMBER), new Player(new User('P', 'P'), RoleType.PSYCHO)]
         : [new Player(new User('S', 'S'), RoleType.SUIT), new Player(new User('D', 'D'), RoleType.DETECTIVE), new Player(new User('U', 'U'), RoleType.UNDERCOVER)];
    }
    getPlayer(role: RoleType): IPlayer<User> {
        throw new Error('Method not implemented.');
    }
    get isCompleted(): boolean {
        throw new Error('Method not implemented.');
    }

}

class Player implements IPlayer<User> {

    constructor(public identity: User, public role: RoleType) {

    }

    getCurrentState(): GameFullState {
        throw new Error('Method not implemented.');
    }
    onGameEvent(listener: (event: any) => void): void {
        throw new Error('Method not implemented.');
    }
    locate(): Position {
        throw new Error('Method not implemented.');
    }
    shift(shift: Shift): void {
        throw new Error('Method not implemented.');
    }
    collapse(direction: Direction): void {
        throw new Error('Method not implemented.');
    }

}