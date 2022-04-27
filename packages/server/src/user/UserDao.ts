import { UserModel } from "../db/UserSchema";

export namespace UserDao {
    export function getUserById(id: string){
        return UserModel.findById(id);
    }
}