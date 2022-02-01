import {io} from "socket.io-client";

let socket

export function connect(token) {
    socket = io("http://localhost:5000", {
        auth: {
            token: token
        }
    });

    return new Promise((resolve, reject) => {
        socket.once('connect', () => {
            socket.emit("getUser", token, (user) => {
                resolve(user);
            })
        });

        socket.once('connect_error', err => {
            reject(err)
        })
    })
}
