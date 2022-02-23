import { Identity, Marker } from "@tix320/noir-core";
import Player from "./Player";

export default class Profiler<I extends Identity> extends Player<I> {

    isMafioso(): boolean {
        return false;
    }

    canDoFastShift(): boolean {
        return false;
    }

    ownMarker(): Marker | undefined {
        return undefined;
    }

    protected onTurnStart() {
        // no-op
    }
}