import { Identity } from "@tix320/noir-core";

export class User {
    readonly id: string
    readonly name: string
    currentGameId?: string

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    equals(other: User) {
        return this.id === other.id;
    }
}