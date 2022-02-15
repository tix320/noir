import { Role } from "../..";
import User from "../entity/User";

export default interface GamePreparationState {
    availableRoles: Role[],
    selectedRoles: JoinedUserInfo[]
}

export interface JoinedUserInfo {
    user: User,
    role?: Role,
    ready: boolean
}