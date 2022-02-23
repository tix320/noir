import Position from "../../util/Position";
import { Identity } from "../Game";
import { Marker } from "../Marker";
import { GameHelper } from "./GameHelper";
import Player from "./Player";

export default abstract class Agent<I extends Identity> extends Player<I>{

    disarm(target: Position, marker: Marker): void {
        this.startTurn();

        const arena = this.context.arena;

        if (!GameHelper.isAdjacentTo(this, target, this.context)) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can place remove marker on adjcaent suspects`);
        }

        const suspect = arena.atPosition(target);

        if (!suspect.markers.has(marker)) {
            throw new Error(`Target does not have marker ${marker}`);
        }

        suspect.markers.delete(marker);

        this.endTurn({});
    }
}