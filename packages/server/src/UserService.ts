import { User } from "./user";

class UserService {
    connectedUsers: Map<string, User> = new Map()

    addConnectedUser(user: User) {
        this.connectedUsers.set(user.id, user);
    }

    removeConnectedUser(user: User): boolean {
        return this.connectedUsers.delete(user.id);
    }
}

export default new UserService();