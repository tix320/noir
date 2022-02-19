import GameLogic, { Context } from "./GameLogic";

export default class Player {
    protected readonly game: GameLogic;
    protected readonly context: Context;

    constructor(gameLogic: GameLogic, context: Context) {
        this.game = gameLogic;
        this.context = context;
    }

    protected checkStateAndTurn() {
        if (this.game.completed) {
            throw new Error("Game completed");
        }
        if (this.context.currentTurnPlayer !== this) {
            throw new Error('Not your turn');
        };
    }
}