import { Role } from "../..";

export default interface GameRoleRequest {
    role?: Role,
    ready: boolean
}