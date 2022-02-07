import Game from "./Game";

export class User {
    readonly id: string
    readonly name: string
    currentGame: Game

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}