import { Dto } from '@tix320/noir-core/src/api/Dto';
import { EvidenceDeck, Game, InitialState, Player as IPlayer, RoleSelection } from '@tix320/noir-core/src/game/Game';
import { GameEvents } from '@tix320/noir-core/src/game/GameEvents';
import { RoleType } from '@tix320/noir-core/src/game/RoleType';
import { Suspect } from '@tix320/noir-core/src/game/Suspect';
import Matrix from '@tix320/noir-core/src/util/Matrix';
import Position from '@tix320/noir-core/src/util/Position';
import { map, Observable } from 'rxjs';
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
            return Api.preparingGameStream(this.id).pipe(map(dto => dto.roles));
        }

        start(): Game.Play<User> | undefined {
            throw new Error('Unsupported operation: Game is automatically starting in server');
        }

        isStarted(): boolean {
            throw new Error('Method not implemented.');
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

        }

        get initialState(): InitialState<User> {
            return this.#initialState;
        }

        events(): Observable<GameEvents.Base> {
            return Api.playingGameEventsStream(this.id);
        }

        fetchInitialState(): Promise<void> {
            return new Promise(resolve => {
                Api.getGameInitialState(this.id).then((initialState: Dto.GameInitialState) => {
                    const arena = new Matrix(initialState.arena)
                        .map((item => new Suspect(item.character, typeof item.role === 'string'
                            ? item.role
                            : new Player(item.role.identity, item.role.role), item.markers)));

                    this.#initialState = {
                        players: initialState.players.map(player => new Player(player.identity, player.role)),
                        arena: arena,
                        get evidenceDeck(): EvidenceDeck {
                            throw new Error('Evidence deck not available in remote game');
                        }
                    };

                    resolve();
                });
            });
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