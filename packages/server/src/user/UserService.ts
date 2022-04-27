import { assert } from "@tix320/noir-core/src/util/Assertions";
import { UserModel } from "../db/UserSchema";
import { User } from "./User";

export namespace UserService {
    const connectedUsers: Map<string, User> = new Map()

    export async function login(token: string) {
        const userModel = await UserModel.findOne({ token: token });
        assert(userModel, `User not found by token ${token}`);

        let user = connectedUsers.get(userModel.id);
        if (!user) {
            user = new User(userModel.id, userModel.name);
        }

        return user;
    }

    export async function addConnectedUser(user: User) {
        connectedUsers.set(user.id, user);
    }

    export async function removeConnectedUser(user: User) {
        return connectedUsers.delete(user.id);
    }
}