import Game from "./game/Game";

export class User {
    readonly id: string
    readonly name: string
    currentGameId?: string

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}