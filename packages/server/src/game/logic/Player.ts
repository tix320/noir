import { Direction, Marker } from "@tix320/noir-core";
import Shift from "@tix320/noir-core/src/game/Shift";
import { User } from "../../user";
import GameLogic, { Context } from "./GameLogic";
import { GameHelper } from "./role/GameHelper";

export default abstract class Player {
    user: User;
    protected readonly game: GameLogic;
    protected context: Context;

    constructor(user: User, gameLogic: GameLogic) {
        this.user = user;
        this.game = gameLogic;
    }

    setContext(context: Context) {
        this.context = context;
    }

    abstract isMafioso(): boolean;

    abstract canDoFastShift(): boolean;

    abstract ownMarker(): Marker | undefined;

    protected abstract onTurnStart(): void;

    protected startTurn() {
        this.checkStateAndTurn();
    }

    protected readonly endTurn = (meta: EndTurnMetadata) => {
        if (meta.checkScores) {
            if (this.checkWin()) {
                return;
            }
        }

        this.context.lastShift = meta.shift;

        const nextPlayer = meta.nextPlayer ? this.switchTurn(meta.nextPlayer) : this.switchTurnToNext();

        nextPlayer.onTurnStart();
    }

    protected readonly checkWin = () => {
        const winner = this.game.checkWin(this.context.scores);
        if (winner) {
            this.game.completed = true;
            return true;
        }

        return false;
    }

    shift(shift: Shift) {
        this.startTurn();

        if (shift.fast && !this.canDoFastShift()) {
            throw new Error("You cannot do fast shift");
        }

        GameHelper.shift(shift, this.context);

        this.endTurn({ shift: shift });
    }

    collapse(direction: Direction) {
        this.startTurn();

        // TODO:

        this.endTurn({});
    }

    private checkStateAndTurn() {
        if (this.game.completed) {
            throw new Error("Game completed");
        }
        if (this.context.currentTurnPlayer !== this) {
            throw new Error('Not your turn');
        };
    }

    private switchTurnToNext(): Player {
        const players = this.context.players;
        const currentTurnPlayer = this.context.currentTurnPlayer;

        const currentPlayerIndex = players.findIndex(player => player === currentTurnPlayer);

        const nextPlayer: Player = currentPlayerIndex === players.length - 1 ? players[0] : players[currentPlayerIndex + 1];
        this.switchTurn(nextPlayer);

        return nextPlayer;
    }

    private switchTurn(player: Player): Player {
        this.context.currentTurnPlayer = player;
        return player;
    }
}

interface EndTurnMetadata {
    nextPlayer?: Player,
    shift?: Shift,
    checkScores?: boolean
}