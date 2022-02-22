import { Direction, Role, shuffle, swap } from "@tix320/noir-core";
import Shift from "@tix320/noir-core/src/game/Shift";
import Matrix from "@tix320/noir-core/src/util/Matrix";
import Position from "@tix320/noir-core/src/util/Position";
import { User } from "../../user";
import { GamePlayer } from "../Game";
import Player from "./Player";
import Bomber from "./role/Bomber";
import Detective from "./role/Detective";
import Killer from "./role/Killer";
import Profiler from "./role/Profiler";
import Psycho from "./role/Psycho";
import Sniper from "./role/Sniper";
import Suit from "./role/Suit";
import Undercover from "./role/Undercover";
import { Suspect } from "./Suspect";

export default class GameLogic {

    protected readonly arena: Matrix<Suspect>;
    protected readonly players: Player[];
    protected readonly winningScores: [number, number];
    completed: boolean;

    constructor(gamePlayers: GamePlayer[]) {
        if (gamePlayers.length !== 6 && gamePlayers.length !== 8) {
            throw new Error(`Invalid players count ${gamePlayers.length}`);
        }

        const for6: boolean = gamePlayers.length === 6;

        this.winningScores = for6 ? [18, 5] : [25, 6];
        this.completed = false;

        const arenaSize = for6 ? 6 : 7;

        const suspects = Suspect.generateSet(arenaSize * arenaSize);

        this.arena = new Matrix([
            suspects.slice(0, 5),
            suspects.slice(5, 10),
            suspects.slice(10, 15),
            suspects.slice(15, 20),
            suspects.slice(20, 25)
        ]);

        shuffle(gamePlayers);

        const killerIndex = gamePlayers.findIndex(player => player.role === Role.KILLER);
        swap(gamePlayers, 0, killerIndex);

        const players = gamePlayers.map(gamePlayer => this.createPlayerForRole(gamePlayer.role, gamePlayer.user));

        shuffle(suspects);

        players.forEach(player => suspects.pop()!.player = player);

        const context = new Context(this.arena, players, suspects);

        players.forEach(player => player.setContext(context));
    }

    checkWin(scores: number[]): number | undefined {
        for (let i = 0; i < this.winningScores.length; i++) {
            if (scores[i] >= this.winningScores[i]) {
                return i;
            }
        }

        return undefined;
    }

    private createPlayerForRole(role: Role, user: User) {
        switch (role) {
            case Role.KILLER:
                return new Killer(user, this);
            case Role.PSYCHO:
                return new Psycho(user, this);
            case Role.BOMBER:
                return new Bomber(user, this);
            case Role.SNIPER:
                return new Sniper(user, this);
            case Role.UNDERCOVER:
                return new Undercover(user, this);
            case Role.DETECTIVE:
                return new Detective(user, this);
            case Role.SUIT:
                return new Suit(user, this);
            case Role.PROFILER:
                return new Profiler(user, this);
        }
    }
}

export class Context {
    arena: Matrix<Suspect>;

    players: Player[];
    currentTurnPlayer: Player;

    evidenceDeck: Suspect[];

    lastShift?: Shift;

    bomber: BomberContext;

    scores: [number, number];

    constructor(arena: Matrix<Suspect>, players: Player[], evidenceDeck: Suspect[]) {
        this.arena = arena;
        this.players = players;
        this.currentTurnPlayer = this.players[0];
        this.evidenceDeck = evidenceDeck;
        this.bomber = {};
        this.scores = [0, 0];
    }
}

export class BomberContext {
    lastDetonatedBomb?: Position;
}