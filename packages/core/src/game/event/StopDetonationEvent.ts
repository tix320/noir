import GameEvent from "./GameEvent";

export default interface PlaceBombEvent extends GameEvent {
    readonly type: 'StopDetonation';
}