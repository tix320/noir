import GamePreparationState from "@tix320/noir-core/src/dto/GamePreparationState";
import GameRoleRequest from "@tix320/noir-core/src/dto/GameRoleRequest";
import User from "@tix320/noir-core/src/dto/User";
import Game from "@tix320/noir-core/src/dto/Game";
import { Observable } from "rxjs";
import { io, Socket } from "socket.io-client";
import store from "./Store";

class API {

    #socket?: Socket

    connect(token: string): Promise<User> {
        this.#socket = io("http://100.120.152.127:5000", {
            auth: {
                token: token
            }
        });

        return new Promise((resolve, reject) => {
            const socket = this.socket();

            socket.once('connect', () => {
                socket.emit("myUser", (user: User) => {
                    resolve(user);
                })
            });

            socket.once('connect_error', err => {
                reject(err)
            })
        })
    }

    createGame(gameDetails: any): Promise<Game> {
        return new Promise<Game>(resolve => {
            const socket = this.socket();

            socket.emit("createGame", gameDetails, (game: Game) => {
                resolve(game);
            });
        });
    }

    joinGame(gameId: string): Promise<void> {
        return new Promise<void>(resolve => {
            const socket = this.socket();

            socket.emit("joinGame", gameId, () => {
                resolve();
            });
        });
    }

    changeGameRole(gameRoleRequest: GameRoleRequest): Promise<void> {
        return new Promise<void>(resolve => {
            const socket = this.socket();

            socket.emit("changeGameRole", gameRoleRequest, () => {
                resolve();
            });
        });
    }

    leaveGame(): Promise<void> {
        return new Promise<void>(resolve => {
            const socket = this.socket();

            socket.emit("leaveGame", () => {
                resolve();
            });
        });
    }

    gamesStream(): Observable<Game> {
        return this.pingAndSubscribeToStream('gamesStream', 'gamesStream');
    }

    myCurrentGameStream(): Observable<Game> {
        const user = store.getState().user;
        return this.pingAndSubscribeToStream('myCurrentGameStream', `myCurrentGameStream_${user!.id}`);
    }

    gamePreparationStream(gameId: string): Observable<GamePreparationState> {
        return this.pingAndSubscribeToStream('gamePreparationStream', `gamePreparationStream_${gameId}`);
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