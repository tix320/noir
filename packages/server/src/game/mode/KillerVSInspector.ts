import { GameMode, getRandomInt, indexTo2DPosition } from "@tix320/noir-core";
import { Player } from "../Player";
import Action, { ActionResult, GameEnded } from "./Action";
import Suspect, { generateSuspectSet } from "../role/Suspect";
import Role from "../role/Role";
import Position from "@tix320/noir-core/src/util/Position";
import GameStrategy from "./GameStrategy";

export default class KillerVSInspector extends GameStrategy {

    static readonly KILLER_WIN_SCORE = 14; // TODO add evidenceDeck and evidenceHand for inspector

    readonly suspects: Suspect[][];

    readonly killer: Player;
    readonly inspector: Player;

    private currentPlayer: Player;

    killerScore: number = 0;

    constructor(players: Player[]) {
        super();
        const randomSuspects = generateSuspectSet(25);

        this.suspects = [
            randomSuspects.slice(0, 5),
            randomSuspects.slice(5, 10),
            randomSuspects.slice(10, 15),
            randomSuspects.slice(15, 20),
            randomSuspects.slice(20, 25)
        ];

        if (players[0].role instanceof Killer) {
            this.killer = players[0];
            this.inspector = players[1];
        } else {
            this.killer = players[1];
            this.inspector = players[0];
        }

        const killerIdentityIndex = getRandomInt(0, 24);
        const killerPosition = indexTo2DPosition(5, killerIdentityIndex);

        this.killer.identityPosition = killerPosition;

        this.currentPlayer = this.killer;
    }

    override getType() {
        return GameMode.KILLER_VS_INSPECTOR
    }

    override doAction(action: Action) {
        if (!this.currentPlayer.role.actions.includes(action.constructor)) {
            throw new Error(`Player ${this.currentPlayer} cannot perform action ${action} `);
        }

        if (!this.inspector) { // first turn
            if (this.currentPlayer === this.killer) {
                if (!(action instanceof Kill)) {
                    throw new Error(`Killer's first turn must be kill`);
                }
            }else{

            }
        }

        action.do(this.currentPlayer, this);

        this.currentPlayer = this.currentPlayer == this.killer ? this.inspector : this.killer;
    }
}



class Killer extends Role {

    readonly actions: any[] = [Kill];
}

class Inspector extends Role {

    readonly actions: any[] = [Kill];
}

class Kill extends Action {

    readonly position: Position

    constructor(position: Position) {
        super();
        this.position = position;
    }

    do(player: Player, gameStrategy: KillerVSInspector): ActionResult {
        const position = player.identityPosition;
        if (!position.getNeighbors(gameStrategy.arenaSize).find((neighborn) => position.equals(neighborn))) {
            throw new Error(`Player ${player} cannot kill not neigborns`);
        }

        const suspect = gameStrategy.suspects[position.x][position.y];
        suspect.state = 'killed';

        const inspectorIdentity = gameStrategy.suspects[gameStrategy.inspector.identityPosition.x][gameStrategy.inspector.identityPosition.y];

        if (suspect === inspectorIdentity) {
            return new GameEnded('Inspector killed');
        }

        gameStrategy.killerScore++;

        if (gameStrategy.killerScore === KillerVSInspector.KILLER_WIN_SCORE) {
            return new GameEnded('Killer killed sufficient people');
        }

        return null;
    }
}