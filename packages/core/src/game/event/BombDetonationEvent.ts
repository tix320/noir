import AbstractKillEvent from "./AbstractKillEvent";

export default interface BombDetonationEvent extends AbstractKillEvent {
    readonly type: 'BombDetonation';
}