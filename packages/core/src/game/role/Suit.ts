import { Identity, Marker } from "@tix320/noir-core";
import Player from "./Player";

export default class Suit<I extends Identity> extends Player<I> {

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