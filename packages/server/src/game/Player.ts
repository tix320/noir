import Position from "@tix320/noir-core/src/util/Position";
import { User } from "../user";
import Role from "./role/Role";
import Suspect from "./role/Suspect";

export class Player {
    readonly user: User;
    readonly role: Role;
    identityPosition: Position;

    constructor(user: User, role: Role) {
        this.user = user;
        this.role = role;
    }
}