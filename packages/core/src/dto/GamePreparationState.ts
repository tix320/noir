import { RoleType } from "../..";
import User from "./User";

export default interface GamePreparationState {
    availableRoles: RoleType[],
    selectedRoles: JoinedUserInfo[]
}

export interface JoinedUserInfo {
    user: User,
    role?: RoleType,
    ready: boolean
}