import { Player, Team } from "./Game";

export enum RoleType {
    KILLER = 'KILLER',
    PSYCHO = 'PSYCHO',
    BOMBER = 'BOMBER',
    SNIPER = 'SNIPER',

    UNDERCOVER = 'UNDERCOVER',
    DETECTIVE = 'DETECTIVE',
    SUIT = 'SUIT',
    PROFILER = 'PROFILER',
}

export namespace RoleType {

    export const MAFIA_TEAM: RoleType[] = [RoleType.KILLER, RoleType.PSYCHO, RoleType.BOMBER, RoleType.SNIPER];
    export const FBI_TEAM: RoleType[] = [RoleType.UNDERCOVER, RoleType.DETECTIVE, RoleType.SUIT, RoleType.PROFILER];

    export function for6() {
        return [RoleType.KILLER, RoleType.PSYCHO, RoleType.BOMBER, RoleType.UNDERCOVER, RoleType.DETECTIVE, RoleType.SUIT];
    }

    export function for8() {
        return [RoleType.KILLER, RoleType.PSYCHO, RoleType.BOMBER, RoleType.SNIPER, RoleType.UNDERCOVER, RoleType.DETECTIVE, RoleType.SUIT, RoleType.PROFILER];
    }

    export function capitalize(role: RoleType): string {
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    }
}