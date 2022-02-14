import { GameMode } from "./GameMode";

export enum Role {
    UNDERCOVER = 'UNDERCOVER',
    DETECTIVE = 'DETECTIVE',
    SUIT = 'SUIT',
    PROFILER = 'PROFILER',

    KILLER = 'KILLER',
    PSYCHO = 'PSYCHO',
    BOMBER = 'BOMBER',
    SNIPER = 'SNIPER',

    INSPECTOR = 'INSPECTOR'
}



export namespace Role {

    export const ALL: Role[] = Object.values(Role).filter(x => typeof x === 'string') as Role[]

    export function getOfMode(mode: GameMode) {
        switch (mode) {
            case GameMode.KILLER_VS_INSPECTOR:
                return [Role.KILLER, Role.INSPECTOR];
            case GameMode.MAFIA_VS_FBI:
                return [Role.KILLER, Role.BOMBER, Role.PSYCHO, Role.SNIPER, Role.UNDERCOVER, Role.DETECTIVE, Role.SUIT, Role.PROFILER];
        }
    }

    export function capitalize(role: Role): string {
        if (!role) {
            return "";
        }

        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    }
}