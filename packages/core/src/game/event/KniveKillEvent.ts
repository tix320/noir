import AbstractKillEvent from "./AbstractKillEvent";

export default interface KniveKillEvent extends AbstractKillEvent {
    readonly type: 'KniveKill';
}