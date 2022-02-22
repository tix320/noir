import { Marker } from "@tix320/noir-core";
import { User } from "../../../user";
import GameLogic from "../GameLogic";
import Player from "../Player";

export default class Suit extends Player {

    constructor(user: User, gameLogic: GameLogic) {
        super(user, gameLogic);
    }

    isMafioso(): boolean {
        return false;
    }

    canDoFastShift(): boolean {
        return true;
    }

    ownMarker(): Marker | undefined {
        return Marker.PROTECTION;
    }

    protected onTurnStart() {
        // TODO: Protect reaction, remeber delete marker on end
    }
}