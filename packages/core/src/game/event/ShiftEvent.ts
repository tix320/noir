import Shift from "../Shift";
import GameEvent from "./GameEvent";

export default interface ShiftEvent extends GameEvent {
    readonly type: 'Shift';

    readonly shift: Shift;
}