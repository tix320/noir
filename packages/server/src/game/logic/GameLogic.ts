import Matrix from "@tix320/noir-core/src/util/Matrix";
import { GamePlayer } from "../Game";
import { Suspect } from "./Suspect";
import Player from "./Player";

export default class GameLogic {

    protected readonly arena: Matrix<Suspect>;
    protected readonly players: Player[];
    protected readonly winningScores: number[];
    completed: boolean;

    constructor(players: GamePlayer[]) {
        this.winningScores = players.length === 6 ? [18, 5] : [25, 6];
        this.completed = false;

        const arenaSize = players.length === 6 ? 6 : 7;

        const randomSuspects = Suspect.generateSet(arenaSize * arenaSize);

        this.arena = new Matrix([
            randomSuspects.slice(0, 5),
            randomSuspects.slice(5, 10),
            randomSuspects.slice(10, 15),
            randomSuspects.slice(15, 20),
            randomSuspects.slice(20, 25)
        ]);
    }

    checkWin(scores: number[]): number | undefined {
        for (let i = 0; i < this.winningScores.length; i++) {
            if (scores[i] >= this.winningScores[i]) {
                return i;
            }
        }

        return undefined;
    }
}

export class Context {
    arena: Matrix<Suspect>;
    players: Player[];
    currentTurnPlayer: Player;
    evidenceDeck: Suspect[];
    scores: number[];

    switchTurnToNext() {
        const currentPlayerIndex = this.players.findIndex(player => player === this.currentTurnPlayer);
        if (currentPlayerIndex === this.players.length - 1) {
            this.switchTurn(this.players[0]);
        } else {
            this.switchTurn(this.players[currentPlayerIndex + 1]);
        }
    }

    switchTurn(player: Player) {
        this.currentTurnPlayer = player;
    }
} 