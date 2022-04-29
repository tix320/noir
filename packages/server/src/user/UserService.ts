import { assert } from "@tix320/noir-core/src/util/Assertions";
import { UserModel } from "../db/UserSchema";
import { User } from "./User";

export namespace UserService {//TODO:
    const connectedUsers: Map<string, User> = new Map()

    export async function login(token: string) {
        const userModel = await UserModel.findOne({ token: token });
        assert(userModel, `User not found by token ${token}`);

        let user = connectedUsers.get(userModel.id);
        if (!user) {
            user = new User(userModel.id, userModel.name); 
            connectedUsers.set(user.id, user);
        }

        return user;
    }
}