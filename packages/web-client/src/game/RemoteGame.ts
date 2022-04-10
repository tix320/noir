import { Dto } from '@tix320/noir-core/src/api/Dto';
import { Arena, EvidenceDeck, Game, InitialState, Player as IPlayer, RoleSelection, Team } from '@tix320/noir-core/src/game/Game';
import { GameEvents } from '@tix320/noir-core/src/game/GameEvents';
import { RoleType } from '@tix320/noir-core/src/game/RoleType';
import Matrix from '@tix320/noir-core/src/util/Matrix';
import Position from '@tix320/noir-core/src/util/Position';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';
import User from "../entity/User";
import Api from '../service/Api';

export namespace RemoteGame {

    export class Preparation implements Game.Preparation<User>{
        constructor(public readonly id: string) {
        }

        get participants(): RoleSelection<User>[] {
            throw new Error("Not implemented");
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
            return Api.preparingGameStream(this.id).pipe(map(dto=> dto.roles));
        }

        start(): Game.Play<User> | undefined {
            throw new Error('Unsupported operation: Game is automatically starting in server');
        }
    }

    export class Play implements Game.Play<User> {

        #initialState: InitialState<User> =
            new Proxy({} as any, {
                get(target, name) {
                    throw new Error('Not ready yet');
                }
            });

        constructor(public readonly id: string) {
            Api.getInitialState(id).then((initialState: Dto.GameInitialState) => {
                this.#initialState = {
                    players: initialState.players.map(player => new Player(player.identity, player.role)),
                    arena: initialState.arena,
                    get evidenceDeck(): EvidenceDeck {
                        throw new Error('Evidence deck not available in remote game');
                    }
                };
            });
        }

        get initialState(): InitialState<User> {
            return this.#initialState;
        }

        events(): Observable<GameEvents.Base> {
            return Api.playingGameStream(this.id);
        }
    }
}

class Player implements IPlayer<User> {

    constructor(public identity: User, public role: RoleType) {
    }

    locate(): Position {
        throw new Error('Method not implemented.');
    }

    gameEvents(): Observable<GameEvents.Base> {
        throw new Error('Method not implemented.');
    }
}