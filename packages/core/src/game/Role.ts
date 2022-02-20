export enum Role {
    UNDERCOVER = 'UNDERCOVER',
    DETECTIVE = 'DETECTIVE',
    SUIT = 'SUIT',
    PROFILER = 'PROFILER',

    KILLER = 'KILLER',
    PSYCHO = 'PSYCHO',
    BOMBER = 'BOMBER',
    SNIPER = 'SNIPER',
}



export namespace Role {

    export const ALL: Set<Role> = new Set(Object.values(Role).filter(x => typeof x === 'string')) as Set<Role>

    export function capitalize(role: Role): string {
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    }
}