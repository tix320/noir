import Shift from "@tix320/noir-core/src/game/Shift";
import { Direction } from "../../..";
import { GameContext, Identity } from "../Game";
import { Marker } from "../Marker";
import { GameHelper } from "./GameHelper";

export default abstract class Player<I extends Identity> {

    constructor(public readonly identity: I, protected context: GameContext) {
    }

    abstract canDoFastShift(): boolean;

    abstract ownMarker(): Marker | undefined;

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
    }

    protected readonly checkWin = () => {
        const winner = this.context.game.checkWin(this.context.scores);
        if (winner) {
            this.context.game.complete();
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
        if (this.context.game.isCompleted) {
            throw new Error("Game completed");
        }
        if (this.context.currentTurnPlayer !== this) {
            throw new Error('Not your turn');
        };
    }

    private switchTurnToNext(): Player<any> {
        const currentTurnPlayer = this.context.currentTurnPlayer;

        const nextPlayer: Player<any> = GameHelper.findNextPlayerOf(currentTurnPlayer, this.context);
        this.switchTurn(nextPlayer);

        return nextPlayer;
    }

    private switchTurn(player: Player<any>): Player<any> {
        this.context.currentTurnPlayer = player;
        return player;
    }
}

interface EndTurnMetadata {
    nextPlayer?: Player<any>,
    shift?: Shift,
    checkScores?: boolean
}