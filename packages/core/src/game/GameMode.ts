import { Role } from "./Role";

export enum GameMode {
    KILLER_VS_INSPECTOR = "KILLER_VS_INSPECTOR",
    MAFIA_VS_FBI = "MAFIA_VS_FBI"
}

export namespace GameMode {

    export function rolesOf(mode: GameMode) {
        switch (mode) {
            case GameMode.KILLER_VS_INSPECTOR:
                return [Role.KILLER, Role.INSPECTOR];

            case GameMode.MAFIA_VS_FBI:
                return [Role.UNDERCOVER, Role.DETECTIVE, Role.SUIT, Role.PROFILER, Role.KILLER, Role.BOMBER, Role.PSYCHO, Role.SNIPER];
        }
    }

    export function checkRole(mode: GameMode, role: Role) {
        return rolesOf(mode).includes(role);
    }
}
