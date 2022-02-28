import { Suspect } from "../Suspect";
import GameEvent from "./GameEvent";

export default interface PeekSuspectsForCanvasEvent extends GameEvent {
    readonly type: 'PeekSuspectsForCanvas';

    readonly suspects: [Suspect, Suspect];
}