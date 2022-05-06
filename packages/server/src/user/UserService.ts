import { assert } from "@tix320/noir-core/src/util/Assertions";
import { sha512 } from 'sha512-crypt-ts';
import { UserModel } from "../db/UserSchema";
import { User } from "./User";

export namespace UserService {
    const connectedUsers: Map<string, User | Promise<User>> = new Map()

    export async function login(username: string, password: string) {
        const userModel = await UserModel.findOne({ username: username });
        assert(userModel, `User ${username} not found`);

        const hash = sha512.crypt(password, 'saltsalt');
        if (userModel.password) {
            if (userModel.password === hash) {
                return getUser(userModel.id);
            } else {
                throw new Error(`Invalid password for user ${username}`);
            }
        } else {
            userModel.password = hash;
            userModel.save();
            return getUser(userModel.id);
        }
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

                    const newUser = new User(id, userModel.username);
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