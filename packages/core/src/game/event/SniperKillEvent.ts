import AbstractKillEvent from "./AbstractKillEvent";

export default interface SniperKillEvent extends AbstractKillEvent {
    readonly type: 'SniperKill';
}