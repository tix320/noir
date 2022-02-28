import Position from "../../util/Position";
import { Suspect } from "../Suspect";
import GameEvent from "./GameEvent";

export default interface ProfileEvent extends GameEvent {
    readonly type: 'Profile';

    readonly target: Position;
    readonly newHand: Suspect[];
}