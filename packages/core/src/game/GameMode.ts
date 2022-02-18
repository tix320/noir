import { Role } from "./Role";

export enum GameMode {
    KILLER_VS_INSPECTOR = "KILLER_VS_INSPECTOR",
    MAFIA_VS_FBI = "MAFIA_VS_FBI"
}

export namespace GameMode {

    export function permittedRolesOf(mode: GameMode): Set<Role> {
        switch (mode) {
            case GameMode.KILLER_VS_INSPECTOR:
                return new Set([Role.KILLER, Role.INSPECTOR]);

            case GameMode.MAFIA_VS_FBI:
                return new Set([Role.KILLER, Role.BOMBER, Role.PSYCHO, Role.SNIPER, Role.UNDERCOVER, Role.SUIT, Role.DETECTIVE, Role.PROFILER])
        }
    }

    export function roleSetsOf(mode: GameMode): Set<Role>[] {
        switch (mode) {
            case GameMode.KILLER_VS_INSPECTOR:
                return [new Set([Role.KILLER, Role.INSPECTOR])];

            case GameMode.MAFIA_VS_FBI:
                return [
                    new Set([Role.KILLER, Role.BOMBER, Role.PSYCHO, Role.UNDERCOVER, Role.SUIT, Role.DETECTIVE]),
                    new Set([Role.KILLER, Role.BOMBER, Role.PSYCHO, Role.SNIPER, Role.UNDERCOVER, Role.SUIT, Role.DETECTIVE, Role.PROFILER])
                ];
        }
    }

    export function checkRole(mode: GameMode, role: Role): boolean {
        return roleSetsOf(mode).some(set => set.has(role));
    }

    export function matchRoleSet(mode: GameMode, roles: Set<Role>): boolean {
        return roleSetsOf(mode).some(set => set.equals(roles));
    }
}