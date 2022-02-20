import { Direction, Marker } from "@tix320/noir-core";
import Position from "@tix320/noir-core/src/util/Position";
import { GamePlayer } from "../Game";
import { Suspect } from "./Suspect";
import GameLogic, { Context } from "./GameLogic";
import Player from "./Player";

export class Killer extends Player {

    constructor(gameLogic: GameLogic, context: Context) {
        super(gameLogic, context);
    }

    shift(direction: Direction, index: number, count: number) {
        this.checkStateAndTurn();

        if (count !== 1 && count !== 2) {
            throw new Error('Invalid shift count');
        }

        const arena = this.context.arena;

        arena.shift(direction, index, count);

        this.context.switchTurnToNext();
    }

    collapse(direction: Direction, index: number) {
        this.checkStateAndTurn();

        // TODO:

        this.context.switchTurnToNext();
    }

    kill(targetPosition: Position) {
        this.checkStateAndTurn();

        const arena = this.context.arena;

        const neighborns = targetPosition.getNeighbors(arena.size);

        const isValidTarget = neighborns.some(position => arena.at(position).player === this);
        if (!isValidTarget) {
            throw new Error(`Invalid target=${arena.at(targetPosition)}. You can kill only your neighbors`);
        }

        const suspect: Suspect = this.context.arena.at(targetPosition);
        const killed = tryKillSuspect(suspect, this.context);

        if (killed) {
            const winner = this.game.checkWin(this.context.scores);
            if (winner) {
                this.game.completed = true;
            } else {
                this.context.switchTurnToNext();
            }
        } else {
            this.context.switchTurnToNext();
        }

    }

    disguise() {
        this.checkStateAndTurn();

        tryPeekNewIdentityFor(this, this.context);

        this.context.switchTurnToNext();
    }
}

function tryKillSuspect(suspect: Suspect, context: Context): boolean {
    const suspectPlayer = suspect.player;
    if (suspectPlayer === 'arested' || suspectPlayer === 'killed') {
        throw new Error(`Target ${suspect} cannot be killed.`);
    }

    if (suspect.markers.has(Marker.PROTECTION)) {
        // TODO: ask protector 
        return false; // or true
    } else {
        killSuspect(suspect, context);
        return true;
    }
}

function killSuspect(suspect: Suspect, context: Context) {
    const suspectPlayer = suspect.player;
    suspect.player = 'killed';

    if (suspectPlayer instanceof Player) {
        context.scores[0] += 2;

        peekNewIdentityFor(suspectPlayer, context);
    } else {
        context.scores[0] += 1;
    }
}

function peekNewIdentityFor(player: Player, context: Context) {
    while (true) {
        tryPeekNewIdentityFor(player, context);
    }
}

function tryPeekNewIdentityFor(player: Player, context: Context) {
    const newIdentity = context.evidenceDeck.pop();
    if (!newIdentity) {
        throw new Error("hmmm"); // TODO: wtf state
    }

    if (newIdentity.player !== 'killed') {
        newIdentity.player = player;
    }
}