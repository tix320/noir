import GameEvent from "./GameEvent";

export default interface CompleteEvent extends GameEvent {

    readonly winner: 'mafia' | 'fbi';
}