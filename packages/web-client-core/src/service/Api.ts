import { ApiEvents } from "@tix320/noir-core/src/api/ApiEvents";
import { Dto } from "@tix320/noir-core/src/api/Dto";
import { assert } from "@tix320/noir-core/src/util/Assertions";
import { Observable } from "rxjs";
import { io, Socket } from "socket.io-client";
import store from "../../../react-client/src/service/Store";

export type ConnectionState = 'CONNECTED' | 'DISCONNECTED'

class Api {

    #socket?: Socket

    connectionState(): Observable<ConnectionState> {
        return new Observable((observer) => {
            const socket = this.#socket;
            assert(socket, 'Socket not initialized');

            const connectListener = () => {
                observer.next('CONNECTED');
            };

            const disconnectedListener = () => {
                observer.next('DISCONNECTED');
            }

            socket.on('connect', connectListener);

            socket.on('disconnect', disconnectedListener);

            if (socket.connected) {
                observer.next('CONNECTED');
            } else {
                observer.next('DISCONNECTED');
            }

            return () => {
                socket.off('connect', connectListener);
                socket.off('connect', disconnectedListener);
            };

        });
    }

    connect(address: string, username : string, password: string, register: boolean): Promise<Dto.User> {
        return new Promise((resolve, reject) => {
            console.info('Connecting to server...');
            
            const socket = io(address, {
                auth: {
                    username: username,
                    password: password,
                    register: register
                }
            });

            this.#socket = socket;

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

    getOnlineCount(): Promise<number> {
        return new Promise<number>(resolve => {
            const socket = this.socket();

            socket.emit(ApiEvents.GET_ONLINE_COUNT, (count: number) => {
                resolve(count);
            });
        }); 
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

    changeGameRole(roleSelection: Omit<Dto.GameRoleSelection, 'identity'>): Promise<void> {
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

    doGameAction(action: Dto.Actions.Any): Promise<void> {
        return new Promise<void>(resolve => {
            const socket = this.socket();

            socket.emit(ApiEvents.DO_GAME_ACTION, action, () => {
                resolve();
            });
        });
    }

    allPreparingGamesStream(): Observable<Dto.GamePreparation> {
        return this.pingAndSubscribeToStream(ApiEvents.SUBSCRIBE_ALL_PREPARING_GAMES, ApiEvents.STREAM_ALL_PREPARING_GAMES);
    }

    myCurrentGameStream(): Observable<Dto.UserCurrentGame> {
        const user = store.getState().user;
        if (!user) {
            throw new Error('User does not exists in state');
        }
        return this.pingAndSubscribeToStream(ApiEvents.SUBSCRIBE_MY_CURRENT_GAME, ApiEvents.STREAM_MY_CURRENT_GAME(user.id));
    }

    preparingGameStream(gameId: string): Observable<Dto.GamePreparation> {
        return this.pingAndSubscribeToStream(ApiEvents.SUBSCRIBE_PREPARING_GAME, ApiEvents.STREAM_PREPARING_GAME(gameId), gameId);
    }

    playingGameEventsStream(gameId: string): Observable<Dto.Events.Any> {
        return this.pingAndSubscribeToStream(ApiEvents.SUBSCRIBE_PLAYING_GAME, ApiEvents.STREAM_PLAYING_GAME(gameId), gameId);
    }

    private pingAndSubscribeToStream<T>(requestName: string, subscriptionName: string, ...args: any[]): Observable<T> {
        return new Observable(
            observer => {
                const socket = this.socket();

                const listener = (result: T) => {
                    observer.next(result)
                };

                socket.on(subscriptionName, listener);

                socket.emit(requestName, ...args);

                return () => {
                    socket.off(subscriptionName, listener);
                    socket.emit(ApiEvents.UNSUBSCRIBE(subscriptionName));
                };
            }
        );
    }

    private subscribeToStream<T>(subscriptionName: string): Observable<T> {
        return new Observable(
            observer => {
                const socket = this.socket();

                const listener = (result: T) => {
                    observer.next(result)
                };

                socket.on(subscriptionName, listener);

                return () => {
                    socket.off(subscriptionName, listener);
                    socket.emit(ApiEvents.UNSUBSCRIBE(subscriptionName));
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

export const API = new Api();