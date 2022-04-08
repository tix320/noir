import { Dto } from "@tix320/noir-core/src/api/Dto";
import { ApiEvents } from "@tix320/noir-core/src/api/ApiEvents";
import { RoleSelection } from "@tix320/noir-core/src/game/Game";
import { GameEvents } from "@tix320/noir-core/src/game/GameEvents";
import { Observable } from "rxjs";
import { io, Socket } from "socket.io-client";
import store from "./Store";

class API {

    #socket?: Socket

    connect(token: string): Promise<Dto.User> {
        this.#socket = io("http://10.10.10.11:5000", {
            auth: {
                token: token
            }
        });

        return new Promise((resolve, reject) => {
            const socket = this.socket();

            socket.once('connect', () => {
                socket.emit(ApiEvents.GET_MY_USER, (user: Dto.User) => {
                    resolve(user);
                })
            });

            socket.once('connect_error', err => {
                reject(err)
            })
        })
    }

    createGame(gameDetails: any): Promise<Dto.GamePreparation> {
        return new Promise<Dto.GamePreparation>(resolve => {
            const socket = this.socket();

            socket.emit(ApiEvents.CREATE_GAME, gameDetails, (game: Dto.GamePreparation) => {
                resolve(game);
            });
        });
    }

    joinGame(gameId: string): Promise<void> {
        return new Promise<void>(resolve => {
            const socket = this.socket();

            socket.emit(ApiEvents.JOIN_GAME, gameId, () => {
                resolve();
            });
        });
    }

    changeGameRole(roleSelection: Omit<RoleSelection<never>, 'identity'>): Promise<void> {
        return new Promise<void>(resolve => {
            const socket = this.socket();

            socket.emit(ApiEvents.CHANGE_ROLE_IN_GAME, roleSelection, () => {
                resolve();
            });
        });
    }

    leaveGame(): Promise<void> {
        return new Promise<void>(resolve => {
            const socket = this.socket();

            socket.emit(ApiEvents.LEAVE_GAME, () => {
                resolve();
            });
        });
    }

    gamesStream(): Observable<Dto.GamePreparation> {
        return this.pingAndSubscribeToStream(ApiEvents.SUBSCRIBE_GAMES, ApiEvents.ROOM_GAMES);
    }

    myCurrentGameStream(): Observable<Dto.UserCurrentGame> {
        const user = store.getState().user;
        if (!user) {
            throw new Error('User does not exists in state');
        }
        return this.pingAndSubscribeToStream(ApiEvents.SUBSCRIBE_MY_CURRENT_GAME, ApiEvents.ROOM_MY_CURRENT_GAME(user.id));
    }

    preparingGameStream(gameId: string): Observable<Dto.GamePreparation> {
        return this.pingAndSubscribeToStream(ApiEvents.SUBSCRIBE_PREPARING_GAME, ApiEvents.ROOM_PREPARING_GAME(gameId), gameId);
    }

    playingGameStream(gameId: string): Observable<GameEvents.Base> {
        return this.pingAndSubscribeToStream(ApiEvents.SUBSCRIBE_PLAYING_GAME, ApiEvents.ROOM_PLAYING_GAME(gameId), gameId);
    }

    private subscribeToStream<T>(subscribeName: string): Observable<T> {
        return new Observable(
            observer => {
                const socket = this.socket();

                const listener = (result: T) => {
                    observer.next(result)
                };

                socket.on(subscribeName, listener);

                return () => {
                    socket.off(subscribeName, listener);
                };
            }
        );
    }

    private pingAndSubscribeToStream<T>(requestName: string, subscribeName: string, ...args: any[]): Observable<T> {
        return new Observable(
            observer => {
                const socket = this.socket();

                const listener = (result: T) => {
                    observer.next(result)
                };

                socket.on(subscribeName, listener);

                socket.emit(requestName, ...args);

                return () => {
                    socket.off(subscribeName, listener);
                };
            }
        );
    }

    private socket() {
        if (this.#socket) {
            return this.#socket;
        }
        else {
            throw new Error("Socket not initialized");
        }
    }
}

export default new API();