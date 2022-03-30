import { Observable } from "rxjs";
import { Direction } from "../util/Direction";
import Identifiable from "../util/Identifiable";
import Position from "../util/Position";
import GameFullState from "./GameFullState";
import { Marker } from "./Marker";
import { RoleType } from "./RoleType";
import Shift from "./Shift";

export type GameState = 'PREPARING' | 'PLAYING' | 'COMPLETED'

export type Team = 'FBI' | 'MAFIA'

export default interface Game<I extends Identifiable> {

    get state(): GameState;

    getPlayersCount(): number;

    getPreparingState(): PreparingState<I>;

    getPlayingState(): PlayingState<I>;

    getCompletedState(): CompletedState<I>;
}

export interface PreparingState<I extends Identifiable> {

    get participants(): RoleSelection<I>[];

    join(identity: I): void;

    changeRole(selection: RoleSelection<I>): void;

    leave(identity: I): void;

    participantChanges(): Observable<RoleSelection<I>[]>;
}

export interface PlayingState<I extends Identifiable> {

    get players(): Player<I>[];

    getPlayers(team: Team): Player<I>[];

    getPlayer(role: RoleType): Player<I>;

    get isCompleted(): boolean;
}

export interface CompletedState<I extends Identifiable> {

}

export type RoleSelection<I extends Identifiable> = PlayerRoleUnreadySelection<I> | PlayerRoleReadySelection<I>

export interface PlayerRoleUnreadySelection<I> {
    readonly identity: I,
    readonly role?: RoleType,
    ready: false
}

export interface PlayerRoleReadySelection<I> {
    readonly identity: I,
    readonly role: RoleType,
    ready: true
}

export interface Player<I extends Identifiable> {
    readonly identity: I;
    readonly role: RoleType;

    getCurrentState(): GameFullState;

    onGameEvent(listener: (event: any) => void): void;

    locate(): Position;

    shift(shift: Shift): void;

    collapse(direction: Direction): void;
}

export interface Mafioso<I extends Identifiable> extends Player<I> {

}

export interface Agent<I extends Identifiable> extends Player<I> {

    disarm(target: Position, marker: Marker): void;
}

export interface Killer<I extends Identifiable> extends Mafioso<I> {

    readonly role: RoleType.KILLER;

    kill(targetPosition: Position): void;

    disguise(): void;
}

export interface Psycho<I extends Identifiable> extends Mafioso<I> {

    readonly role: RoleType.PSYCHO;

    kill(targetPosition: Position): void;

    swap(position1: Position, position2: Position): void;

    placeThreat(positions: Position[]): void;
}

export interface Bomber<I extends Identifiable> extends Mafioso<I> {

    readonly role: RoleType.BOMBER;

    placeBomb(target: Position): void;

    detonateBomb(target: Position): void;

    stopDetonation(): void;
}

export interface Sniper<I extends Identifiable> extends Mafioso<I> {

    readonly role: RoleType.SNIPER;

    snipe(target: Position): void;

    setup(from: Position, to: Position, marker: Marker): void;
}

export interface Undercover<I extends Identifiable> extends Agent<I> {

    readonly role: RoleType.UNDERCOVER;

    accuse(target: Position, mafioso: Mafioso<I>): void;

    disguise(): void;

    autoSpy(target: Position): void;
}

export interface Detective<I extends Identifiable> extends Agent<I> {

    readonly role: RoleType.DETECTIVE;

    farAccuse(target: Position, mafioso: Mafioso<I>): void;

    peekSuspects(): void;

    canvas(index: number): void;
}

export interface Suit<I extends Identifiable> extends Agent<I> {

    readonly role: RoleType.SUIT;

    placeProtection(target: Position): void;

    removeProtection(target: Position): void;

    accuse(target: Position, mafioso: Mafioso<I>): void;

    decideProtect(protect: boolean): void;
}

export interface Profiler<I extends Identifiable> extends Agent<I> {

    readonly role: RoleType.PROFILER;

    accuse(target: Position, mafioso: Mafioso<I>): void;

    profile(index: number): void;
}