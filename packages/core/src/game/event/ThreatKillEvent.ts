import AbstractKillEvent from "./AbstractKillEvent";

export default interface ThreatKillEvent extends AbstractKillEvent {
    readonly type: 'ThreatKill';
}