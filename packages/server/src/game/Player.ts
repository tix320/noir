import { Role } from "@tix320/noir-core";
import Position from "@tix320/noir-core/src/util/Position";
import { User } from "../user";

export class Player {
    readonly user: User;
    readonly role: Role;
    identityPosition: Position;

    constructor(user: User, role: Role) {
        this.user = user;
        this.role = role;
    }
}