import { assert } from "@tix320/noir-core/src/util/Assertions";
import { PromiseProvider, QueryWithHelpers } from "mongoose";
import { UserModel } from "../db/UserSchema";
import { User } from "./User";

export namespace UserService {//TODO:
    const connectedUsers: Map<string, User | Promise<User>> = new Map()

    export async function login(token: string) {
        const userModel = await UserModel.findOne({ token: token });
        assert(userModel, `User not found by token ${token}`);

        return getUser(userModel.id);
    }

    export async function getUser(id: string): Promise<User | undefined> {
        let user = connectedUsers.get(id);

        if (user) {
            if (user instanceof User) {
                return user;
            } else {
                return await user;
            }
        } else {
            const userModelFuture = UserModel.findOne({ _id: id });

            const promise = new Promise<User>(async (resolve, reject) => {
                try {
                    const userModel = await userModelFuture;
                    assert(userModel, `User not found with id ${id}`);

                    const newUser = new User(id, userModel.name);
                    connectedUsers.set(id, newUser);

                    resolve(newUser);
                } catch (e) {
                    reject(e);
                }
            });

            connectedUsers.set(id, promise);

            return await promise;
        }
    }
}