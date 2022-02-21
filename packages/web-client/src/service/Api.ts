import GamePreparationState from "@tix320/noir-core/src/dto/GamePreparationState";
import GameRoleRequest from "@tix320/noir-core/src/dto/GameRoleRequest";
import User from "@tix320/noir-core/src/entity/User";
import { Observable } from "rxjs";
import { io, Socket } from "socket.io-client";
import { Game } from "../entity/Game";
import store from "./Store";

class API {

    socket: Socket

    connect(token: string): Promise<User> {
        this.socket = io("http://100.120.152.127:5000", {
            auth: {
                token: token
            }
        });

        return new Promise((resolve, reject) => {
            this.socket.once('connect', () => {
                this.socket.emit("myUser", (user: User) => {
                    resolve(user);
                })
            });

            this.socket.once('connect_error', err => {
                reject(err)
            })
        })
    }

    createGame(gameDetails): Promise<Game> {
        return new Promise<Game>(resolve => {
            this.socket.emit("createGame", gameDetails, (game) => {
                resolve(game);
            });
        });
    }

    joinGame(gameId: string): Promise<void> {
        return new Promise<void>(resolve => {
            this.socket.emit("joinGame", gameId, () => {
                resolve();
            });
        });
    }

    changeGameRole(gameRoleRequest: GameRoleRequest): Promise<void> {
        return new Promise<void>(resolve => {
            this.socket.emit("changeGameRole", gameRoleRequest, () => {
                resolve();
            });
        });
    }

    leaveGame(): Promise<void> {
        return new Promise<void>(resolve => {
            this.socket.emit("leaveGame", () => {
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
                const listener = (games) => {
                    observer.next(games)
                };

                this.socket.on(subscribeName, listener);

                return () => {
                    this.socket.off(subscribeName, listener);
                };
            }
        );
    }

    private pingAndSubscribeToStream<T>(requestName: string, subscribeName: string, ...args: any[]): Observable<T> {
        return new Observable(
            observer => {
                const listener = (games) => {
                    observer.next(games)
                };

                this.socket.on(subscribeName, listener);

                this.socket.emit(requestName, ...args);

                return () => {
                    this.socket.off(subscribeName, listener);
                };
            }
        );
    }
}

export default new API();