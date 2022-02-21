export enum Role {
    KILLER = 'KILLER',
    PSYCHO = 'PSYCHO',
    BOMBER = 'BOMBER',
    SNIPER = 'SNIPER',

    UNDERCOVER = 'UNDERCOVER',
    DETECTIVE = 'DETECTIVE',
    SUIT = 'SUIT',
    PROFILER = 'PROFILER',
}

export namespace Role {

    export function for6() {
        return [Role.KILLER, Role.PSYCHO, Role.BOMBER, Role.UNDERCOVER, Role.DETECTIVE, Role.SUIT];
    }

    export function for8() {
        return [Role.KILLER, Role.PSYCHO, Role.BOMBER, Role.SNIPER, Role.UNDERCOVER, Role.DETECTIVE, Role.SUIT, Role.PROFILER];
    }

    export function capitalize(role: Role): string {
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    }
}