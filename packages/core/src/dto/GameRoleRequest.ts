import { RoleType } from "../..";

export default interface GameRoleRequest {
    role?: RoleType,
    ready: boolean
}