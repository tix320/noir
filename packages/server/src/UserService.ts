class UserService {
    connectedUsers = {}

    addConnectedUser(user) {
        this.connectedUsers[user.id] = user
    }

    removeConnectedUser(user) {
        delete this.connectedUsers[user.id]
    }
}

export default new UserService();