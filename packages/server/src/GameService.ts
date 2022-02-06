import { v4 as uuid } from 'uuid';
import Game from './game';

class GameService {
    games: { [key: string]: Game; } = {}

    getGames() {
        return Object.values(this.games).map(game => {
            return ({
                ...game,
                mode: game.mode.getType()
            })
        });
    }

    createGame(creator, gameDetails) {
        const id = uuid();
        const game = new Game(id, gameDetails.mode);

        this.games[game.id] = game;

        return ({
            ...game,
            mode: game.mode.getType()
        })
    }
}

export default new GameService();