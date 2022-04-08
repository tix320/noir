import { Dto } from '@tix320/noir-core/src/api/Dto';
import { Game, Player as IPlayer, RoleSelection, Team } from '@tix320/noir-core/src/game/Game';
import { GameEvents } from '@tix320/noir-core/src/game/GameEvents';
import GameFullState from '@tix320/noir-core/src/game/GameFullState';
import { RoleType } from '@tix320/noir-core/src/game/RoleType';
import Position from '@tix320/noir-core/src/util/Position';
import { BehaviorSubject, map, Observable } from 'rxjs';
import User from "../entity/User";
import Api from '../service/Api';

export namespace RemoteGame {

    export class Preparation implements Game.Preparation<User>{
        private readonly gameChanges: BehaviorSubject<Dto.GamePreparation>;

        constructor(public readonly id: string) {
            this.gameChanges = new BehaviorSubject({
                id: id,
                maxPlayersCount: 0,
                name: 'Unknown',
                roles: [],
            });

            Api.preparingGameStream(id).subscribe((game) => {
                this.gameChanges.next(game);
            });
        }

        get participants(): RoleSelection<User>[] {
            return this.gameChanges.value.roles;
        }

        join(identity: User): void {
            Api.joinGame(this.id);
        }

        changeRole(selection: RoleSelection<User>): void {
            Api.changeGameRole(selection);
        }

        leave(identity: User): void {
            Api.leaveGame();
        }

        participantChanges(): Observable<RoleSelection<User>[]> {
            return this.gameChanges.asObservable().pipe(map(game => game.roles));
        }

        start(): Game.Play<User> | undefined {
            throw new Error('Unsupported operation: Game is automatically starting in server');
        }
    }

    export class Play implements Game.Play<User> {

        constructor(public readonly id: string) {
        }

        get players(): IPlayer<User>[] {
            throw new Error('Method not implemented.');
        }
        getPlayersOfTeam(team: Team): IPlayer<User>[] {
            throw new Error('Method not implemented.');
        }
        getPlayerOfRole(role: RoleType): IPlayer<User> {
            throw new Error('Method not implemented.');
        }
        getState(): [GameFullState, Observable<GameEvents.Base>] {
            throw new Error('Method not implemented.');
        }

    }
}

class Player implements IPlayer<User> {

    constructor(public identity: User, public role: RoleType) {

    }

    locate(): Position {
        throw new Error('Method not implemented.');
    }
    get isCompleted(): boolean {
        throw new Error('Method not implemented.');
    }
    getState(): [GameFullState, Observable<GameEvents.Base>] {
        throw new Error('Method not implemented.');
    }
}