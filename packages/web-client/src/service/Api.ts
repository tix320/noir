import { Observable } from "rxjs";
import { io, Socket } from "socket.io-client";
import { Game } from "../entity/Game";
import { User } from "../entity/User";

class API {

    socket: Socket

    connect(token): Promise<User> {
        this.socket = io("http://localhost:5000", {
            auth: {
                token: token
            }
        });

        return new Promise((resolve, reject) => {
            this.socket.once('connect', () => {
                this.socket.emit("user", token, (user) => {
                    resolve(user);
                })
            });

            this.socket.once('connect_error', err => {
                reject(err)
            })
        })
    }

    getCurrentGame(): Promise<Game> {
        return new Promise(resolve => {
            this.socket.emit("currentGame", (game) => {
                resolve(game);
            });
        });
    }

    createGame(gameDetails): Promise<Game> {
        return new Promise<Game>(resolve => {
            this.socket.emit("createGame", gameDetails, (game) => {
                resolve(game);
            });
        });
    }

    gamesStream(): Observable<Game> {
        return new Observable(
            observer => {
                this.socket.emit("gamesStream");

                const listener = (games) => {
                    observer.next(games)
                };

                this.socket.on("gamesStream", listener);

                return () => {
                    this.socket.off("gamesStream", listener);
                };
            }
        );
    }
}


export default new API();