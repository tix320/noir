class UserService {
    connectedUsers = {}

    addConnectedUser(user) {
        this.connectedUsers[user.id] = user
    }

    removeConnectedUser(user) {
        delete this.connectedUsers[user.id]
    }

    getCurrentGame(user) {
        return user.currentGame
    }
}

export default new UserService();