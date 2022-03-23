import EventEmitter from 'events';
import { Direction, Marker, shuffle, swap } from '../..';
import Identifiable from '../util/Identifiable';
import Matrix from '../util/Matrix';
import Position from '../util/Position';
import Game, {
    Agent as IAgent, Bomber as IBomber, CompletedState as ICompletedState, Detective as IDetective, GameState, Killer as IKiller, Mafioso as IMafioso, Player as IPlayer, PlayingState as IPlayingState, PreliminaryPlayer, PreparingState as IPreparingState, Profiler as IProfiler, Psycho as IPsycho, Sniper as ISniper, Suit as ISuit, Undercover as IUndercover
} from './Game';
import GameFullState from './GameFullState';
import { RoleType } from './RoleType';
import Shift from './Shift';
import { Suspect } from './Suspect';

type Constructor<T> = new (...args: any[]) => T;

export default class StandardGame<I extends Identifiable> implements Game<I> {

    static ROLE_SETS = [
        new Set([RoleType.KILLER, RoleType.BOMBER, RoleType.PSYCHO, RoleType.UNDERCOVER, RoleType.SUIT, RoleType.DETECTIVE]),
        new Set([RoleType.KILLER, RoleType.BOMBER, RoleType.PSYCHO, RoleType.SNIPER, RoleType.UNDERCOVER, RoleType.SUIT, RoleType.DETECTIVE, RoleType.PROFILER])
    ];

    stateObj: State<I> = new PreparingState(this);

    get state(): GameState {
        if (this.stateObj instanceof PreparingState) {
            return 'PREPARING';
        }
        else if (this.stateObj instanceof PlayingState) {
            return 'PLAYING';
        } else {
            return 'COMPLETED';
        }
    }

    public getPlayersCount(): number {
        return this.stateObj.getPlayersCount();
    }

    public getPreparingState(): IPreparingState<I> {
        return this.tryGetState<PreparingState<I>>(PreparingState);
    }

    public getPlayingState(): IPlayingState<I> {
        return this.tryGetState<PlayingState<I>>(PlayingState);
    }

    public getCompletedState(): ICompletedState<I> {
        return this.tryGetState<CompletedState<I>>(CompletedState);
    }

    private tryGetState<T extends State<I>>(state: Constructor<T>): T {
        if (!(this.stateObj instanceof state)) {
            throw new Error(`Not in state ${state.name}. Current: ${this.state.constructor.name}`);
        }

        return this.stateObj;
    }
}

abstract class State<I extends Identifiable> {

    constructor(protected game: StandardGame<I>) { }

    abstract getPlayersCount(): number;
}

class PreparingState<I extends Identifiable> extends State<I> implements IPreparingState<I> {

    readonly participants: PreliminaryPlayer<I>[] = [];

    getPlayersCount(): number {
        return this.participants.length;
    }

    public join(participant: PreliminaryPlayer<I>) {
        if (participant.ready && !participant.role) {
            throw new Error('Cannot be ready without role');
        }

        const currentParticipant = this.participants.removeFirstBy(p => participant.identity === p.identity);

        if (currentParticipant && currentParticipant.role !== participant.role) {
            this.resetReadiness();
        }

        if (participant.role) {
            if (this.participants.find(p => p.role === participant.role)) {
                throw new Error(`Role ${participant.role} already selected`);
            }
        }

        const minPlayersCount = StandardGame.ROLE_SETS.at(0)!.size;
        const maxPlayersCount = StandardGame.ROLE_SETS.at(-1)!.size;

        if (this.participants.length === maxPlayersCount) {
            throw new Error("Fully");
        }

        this.participants.push(participant);

        const roles = new Set(this.participants.map(p => p.role)) as Set<RoleType>;

        if (this.readyCount === minPlayersCount && this.matchRoleSet(roles)) {
            this.prepareGame();
        }
    }

    public leave(identity: I) {
        const pariticpant = this.participants.removeFirstBy(p => p.identity !== identity);

        if (pariticpant) {
            // reset ready states
            this.resetReadiness();
        }
    }

    private resetReadiness() {
        this.participants.forEach(p => p.ready = false);
    }

    private get readyCount() {
        let readyCount = 0;
        this.participants.forEach(p => {
            if (p.ready) {
                readyCount++;
            }
        });

        return readyCount;
    }

    private matchRoleSet(roles: Set<RoleType>): boolean {
        return StandardGame.ROLE_SETS.some(set => set.equals(roles));
    }

    private createPlayerForRole(identity: I, role: RoleType, context: GameContext): Player<I> {
        switch (role) {
            case RoleType.KILLER:
                return new Killer(identity, context);
            case RoleType.PSYCHO:
                return new Psycho(identity, context);
            case RoleType.BOMBER:
                return new Bomber(identity, context);
            case RoleType.SNIPER:
                return new Sniper(identity, context);
            case RoleType.UNDERCOVER:
                return new Undercover(identity, context);
            case RoleType.DETECTIVE:
                return new Detective(identity, context);
            case RoleType.SUIT:
                return new Suit(identity, context);
            case RoleType.PROFILER:
                return new Profiler(identity, context);
        }
    }

    private prepareGame() {
        if (this.participants.length !== 6 && this.participants.length !== 8) {
            throw new Error(`Invalid players count ${this.participants.length}`);
        }

        const for6: boolean = this.participants.length === 6;

        const winningScores: [number, number] = for6 ? [18, 5] : [25, 6];

        const arenaSize = for6 ? 6 : 7;

        const suspects = Suspect.generateSet(arenaSize * arenaSize);

        let matrix: Suspect[][]

        if (for6) {
            matrix = [
                suspects.slice(0, 6),
                suspects.slice(6, 12),
                suspects.slice(12, 18),
                suspects.slice(18, 24),
                suspects.slice(24, 30),
                suspects.slice(30, 36),
            ]
        } else {
            matrix = [
                suspects.slice(0, 7),
                suspects.slice(7, 14),
                suspects.slice(14, 21),
                suspects.slice(21, 28),
                suspects.slice(28, 35),
                suspects.slice(35, 42),
                suspects.slice(42, 49),
            ]
        }

        const arena = new Matrix(matrix);

        shuffle(suspects);

        const profilerEvidenceHand = for6 ? [] : suspects.splice(-1, 4);

        const context = new GameContext(arena, suspects, profilerEvidenceHand);

        const players: Player<I>[] = this.participants.map(participant => this.createPlayerForRole(participant.identity, participant.role!, context));

        this.reolvePlayersOrder(players);

        players.forEach(player => suspects.pop()!.role = player);

        context.players = players;
        context.currentTurnPlayer = players[0];

        this.game['stateObj'] = new PlayingState(this.game, context, winningScores);
    }

    private reolvePlayersOrder(players: Player<any>[]): void {
        const mafia: Player<I>[] = players.filter(p => p instanceof Mafioso);
        const fbi: Player<I>[] = players.filter(p => p instanceof Agent);

        shuffle(mafia);
        shuffle(fbi);

        const killerIndex = mafia.findIndex(player => player instanceof Killer);
        swap(mafia, 0, killerIndex);

        let maf = true;
        const mafiaIter = mafia[Symbol.iterator]();
        const fbiIter = fbi[Symbol.iterator]();
        for (let i = 0; i < players.length; i++) {
            players[i] = maf ? mafiaIter.next().value : fbiIter.next().value;
            maf = !maf;
        }
    }
}

class PlayingState<I extends Identifiable> extends State<I> implements IPlayingState<I> {

    eventEmmiter: EventEmitter;

    constructor(game: StandardGame<I>, private context: GameContext, private winningScores: [number, number]) {
        super(game);
        this.eventEmmiter = new EventEmitter();
        context.game = this;
    }

    getPlayersCount(): number {
        return this.context.players.length;
    }

    get players(): IPlayer<I>[] {
        return this.context.players;
    }

    checkWin(scores: number[]): number | undefined {
        for (let i = 0; i < this.winningScores.length; i++) {
            if (scores[i] >= this.winningScores[i]) {
                return i;
            }
        }

        return undefined;
    }

    complete() {
        this.game['stateObj'] = new CompletedState(this.game);
    }

    get isCompleted() {
        return this.game['stateObj'] instanceof CompletedState;
    }
}

class CompletedState<I extends Identifiable> extends State<I> implements ICompletedState<I> {

    getPlayersCount(): number {
        throw new Error("TODO");
    }
}

abstract class Player<I extends Identifiable> implements IPlayer<I> {

    abstract readonly roleType: RoleType;

    constructor(public readonly identity: I, protected context: GameContext) {
    }

    abstract canDoFastShift(): boolean;

    abstract ownMarker(): Marker | undefined;

    protected startTurn() {
        this.checkStateAndTurn();
    }

    protected readonly endTurn = (meta: EndTurnMetadata) => {
        if (meta.checkScores) {
            if (this.checkWin()) {
                return;
            }
        }

        this.context.lastShift = meta.shift;

        const nextPlayer = meta.nextPlayer ? this.switchTurn(meta.nextPlayer) : this.switchTurnToNext();
    }

    protected readonly checkWin = () => {
        const winner = this.context.game.checkWin(this.context.scores);
        if (winner) {
            this.context.game.complete();
            return true;
        }

        return false;
    }

    getCurrentState(): GameFullState {
        throw new Error('Not implemented');
        // TODO:
    }

    onGameEvent(listener: (event: any) => void) {
        // TODO: 
    }

    locate(): Position {
        return GameHelper.findPlayerInArena(this, this.context);
    }

    shift(shift: Shift) {
        this.startTurn();

        if (shift.fast && !this.canDoFastShift()) {
            throw new Error("You cannot do fast shift");
        }

        GameHelper.shift(shift, this.context);

        this.endTurn({ shift: shift });
    }

    collapse(direction: Direction) {
        this.startTurn();

        // TODO:

        this.endTurn({});
    }

    private checkStateAndTurn() {
        if (this.context.game.isCompleted) {
            throw new Error("Game completed");
        }
        if (this.context.currentTurnPlayer !== this) {
            throw new Error('Not your turn');
        };
    }

    private switchTurnToNext(): Player<any> {
        const currentTurnPlayer = this.context.currentTurnPlayer;

        const nextPlayer: Player<any> = GameHelper.findNextPlayerOf(currentTurnPlayer, this.context);
        this.switchTurn(nextPlayer);

        return nextPlayer;
    }

    private switchTurn(player: Player<any>): Player<any> {
        this.context.currentTurnPlayer = player;
        return player;
    }
}

interface EndTurnMetadata {
    nextPlayer?: Player<any>,
    shift?: Shift,
    checkScores?: boolean
}

abstract class Mafioso<I extends Identifiable> extends Player<I> implements IMafioso<I>  {

}

abstract class Agent<I extends Identifiable> extends Player<I> implements IAgent<I> {

    disarm(target: Position, marker: Marker): void {
        this.startTurn();

        const arena = this.context.arena;

        if (!GameHelper.isAdjacentTo(this, target, this.context)) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can place remove marker on adjcaent suspects`);
        }

        const suspect = arena.atPosition(target);

        if (!suspect.markers.has(marker)) {
            throw new Error(`Target does not have marker ${marker}`);
        }

        suspect.markers.delete(marker);

        this.endTurn({});
    }
}

class Killer<I extends Identifiable> extends Mafioso<I> implements IKiller<I> {

    readonly roleType = RoleType.KILLER;

    override canDoFastShift(): boolean {
        return true;
    }

    override ownMarker(): Marker | undefined {
        return undefined;
    }

    kill(targetPosition: Position): void {
        this.startTurn();

        const arena = this.context.arena;

        const neighborns = arena.getAdjacents(targetPosition);

        const isValidTarget = neighborns.some(position => arena.atPosition(position).role === this);
        if (!isValidTarget) {
            throw new Error(`Invalid target=${arena.atPosition(targetPosition)}. You can kill only your neighbors`);
        }

        const suit = GameHelper.findPlayer(Suit, this.context);
        const killed = GameHelper.tryKillSuspect(targetPosition, suit, this.context);

        if (killed) {
            this.endTurn({ checkScores: true });
        } else {
            this.endTurn({ nextPlayer: GameHelper.findPlayer(Suit, this.context) });
        }
    }

    disguise() {
        this.startTurn();

        GameHelper.tryPeekNewIdentityFor(this, this.context);

        this.endTurn({});
    }
}

class Psycho<I extends Identifiable> extends Mafioso<I> implements IPsycho<I> {

    readonly roleType = RoleType.PSYCHO;

    override canDoFastShift(): boolean {
        return false;
    }

    override ownMarker(): Marker | undefined {
        return Marker.THREAT;
    }

    kill(targetPosition: Position): void { // TODO: Reimplement with single kills
        const position = GameHelper.findPlayerInArena(this, this.context);

        const arena = this.context.arena;

        const neighborns = arena.getAdjacents(position);

        neighborns.forEach(position => {
            const suspect = arena.atPosition(position);

            let killed = false;
            if (suspect.markers.delete(Marker.THREAT)) {
                const suit = GameHelper.findPlayer(Suit, this.context);
                killed = GameHelper.tryKillSuspect(position, suit, this.context);
            }

            if (killed) {
                this.checkWin();
            }
        });
    }

    shift(shift: Shift): void { // TODO: Duplicate code with super
        this.startTurn();

        if (shift.fast && !this.canDoFastShift()) {
            throw new Error("You cannot do fast shift");
        }

        GameHelper.shift(shift, this.context);

        this.endTurn({ shift: shift, nextPlayer: this });
    }

    collapse(direction: Direction): void { // TODO: Duplicate code with super
        this.startTurn();

        // TODO:

        this.endTurn({ nextPlayer: this });
    }

    swap(position1: Position, position2: Position) {
        this.startTurn();

        const arena = this.context.arena;

        const neighborns = arena.getAdjacents(position1);

        const isUniquePositions = position1 === position2 || arena.atPosition(position1).role === this || arena.atPosition(position2).role === this;
        const isAdjacents = neighborns.some(position => arena.atPosition(position).role === this) && neighborns.some(position => position.equals(position2));

        if (!isUniquePositions || !isAdjacents) {
            throw new Error(`Invalid targets=${arena.atPosition(position1)},${arena.atPosition(position2)} . You can only swap two adjacent suspects`);
        }

        arena.swap(position1, position2);

        this.endTurn({});
    }

    placeThreat(positions: Position[]) {
        this.startTurn();

        if (positions.length > 3) {
            throw new Error("You can mark up to 3 suspects");
        }

        const arena = this.context.arena;

        const psychoPosition = GameHelper.findPlayerInArena(this, this.context);
        positions.forEach(position => {
            const rowDiff = Math.abs(psychoPosition.x - position.x);
            const colDiff = Math.abs(psychoPosition.x - position.x);
            if (rowDiff + colDiff > 3) {
                throw new Error("You can mark within 3 orthogonal spaces");
            }
        });

        positions.forEach(position => {
            arena.atPosition(position).markers.add(Marker.THREAT);
        });

        this.endTurn({ shift: this.context.lastShift });
    }
}

class Bomber<I extends Identifiable> extends Mafioso<I> implements IBomber<I> {

    readonly roleType = RoleType.BOMBER;

    override canDoFastShift(): boolean {
        return false;
    }

    override ownMarker(): Marker | undefined {
        return Marker.BOMB;
    }

    protected startTurn(): void {
        super.startTurn();
        if (this.context.bomber.lastDetonatedBomb) {
            throw new Error("You must continue bomb detonation");
        }
    }

    placeBomb(target: Position) {
        this.startTurn();

        const arena = this.context.arena;

        const targetSuspect = arena.atPosition(target);

        const isValidTarget = targetSuspect.role === this || GameHelper.isAdjacentTo(this, target, this.context);
        if (!isValidTarget) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can place bomb only on yourself or adjacent suspects`);
        }

        if (targetSuspect.markers.has(Marker.BOMB)) {
            throw new Error('Target already has bomb');
        }

        targetSuspect.markers.add(Marker.BOMB);

        this.endTurn({});
    }

    detonateBomb(target: Position) {
        super.startTurn();

        const arena = this.context.arena;

        const suspect = arena.atPosition(target);

        const hasBombMarker = suspect.markers.delete(Marker.BOMB);

        if (this.context.bomber.lastDetonatedBomb) {
            const adjacents = arena.getAdjacents(this.context.bomber.lastDetonatedBomb);
            if (!adjacents.find(pos => pos.equals(target))) {
                throw new Error("Non adjacent targets");
            }
        } else {
            if (!hasBombMarker) {
                throw new Error(`Suspect ${suspect} does not have bomb marker`);
            }
        }

        this.context.bomber.lastDetonatedBomb = undefined;

        const suit = GameHelper.findPlayer(Suit, this.context);
        const killed = GameHelper.tryKillSuspect(target, suit, this.context);

        if (killed) {
            if (hasBombMarker) {
                this.context.bomber.lastDetonatedBomb = target;
                this.endTurn({ checkScores: true, nextPlayer: this });
            } else {
                this.endTurn({ checkScores: true });
            }
        } else {
            this.endTurn({ nextPlayer: GameHelper.findPlayer(Suit, this.context) });
        }
    }

    stopDetonation() {
        super.startTurn();

        if (!this.context.bomber.lastDetonatedBomb) {
            throw new Error("There are no detonation");
        }

        this.context.bomber.lastDetonatedBomb = undefined;

        this.endTurn({});
    }
}

class BomberContext {
    lastDetonatedBomb?: Position;
}

class Sniper<I extends Identifiable> extends Mafioso<I> implements ISniper<I> {

    readonly roleType = RoleType.SNIPER;

    override canDoFastShift(): boolean {
        return true;
    }

    override ownMarker(): Marker | undefined {
        return undefined;
    }

    snipe(target: Position) {
        this.startTurn();

        const arena = this.context.arena;
        const diagonals = arena.getDiagonals(target, 3);

        if (!diagonals.some(pos => arena.atPosition(pos).role === this)) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can kill only suspects 3 spaces away from you in diagonal line`);
        }

        const suit = GameHelper.findPlayer(Suit, this.context);
        const killed = GameHelper.tryKillSuspect(target, suit, this.context);

        if (killed) {
            this.endTurn({ checkScores: true });
        } else {
            this.endTurn({ nextPlayer: GameHelper.findPlayer(Suit, this.context) });
        }
    }

    setup(from: Position, to: Position, marker: Marker) {
        this.startTurn();

        if (!from.isAdjacentTo(to)) {
            throw new Error('Not adjacents suspects');
        }

        const arena = this.context.arena;

        const fromSuspect = arena.atPosition(from);
        const toSuspect = arena.atPosition(to);

        if (!fromSuspect.markers.has(marker)) {
            throw new Error(`Suspect does not have marker ${marker}`);
        }

        if (toSuspect.markers.has(marker)) {
            throw new Error(`Suspect already have marker ${marker}`);
        }

        fromSuspect.markers.delete(marker);
        toSuspect.markers.add(marker);

        this.endTurn({});
    }
}

class Undercover<I extends Identifiable> extends Agent<I> implements IUndercover<I> {

    readonly roleType = RoleType.UNDERCOVER;

    override canDoFastShift(): boolean {
        return false;
    }

    override ownMarker(): Marker | undefined {
        return undefined;
    }

    accuse(target: Position, mafioso: Mafioso<I>): void {
        this.startTurn();

        const arena = this.context.arena;

        if (!GameHelper.isAdjacentTo(this, target, this.context)) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can accuse only your adjacanets`);
        }

        const arested = GameHelper.accuse(target, mafioso, this.context);

        if (arested) {
            this.endTurn({ checkScores: true });
        } else {
            this.endTurn({});
        }
    }

    disguise() {
        this.startTurn();

        GameHelper.tryPeekNewIdentityFor(this, this.context);

        this.endTurn({});
    }

    autoSpy(target: Position): Mafioso<I>[] {
        this.startTurn();

        const suspect = this.context.arena.atPosition(target);

        if (suspect.role !== 'killed') {
            throw new Error("Target must be deceased");
        }

        const mafiosi = GameHelper.getAdjacentMafiosi(target, this.context);

        this.endTurn({});

        return mafiosi;
    }
}

class Detective<I extends Identifiable> extends Agent<I> implements IDetective<I> {

    readonly roleType = RoleType.DETECTIVE;

    override canDoFastShift(): boolean {
        return true;
    }

    override ownMarker(): Marker | undefined {
        return undefined;
    }

    farAccuse(target: Position, mafioso: Mafioso<I>) {
        this.startTurn();

        const arena = this.context.arena;

        const isValidTarget = arena.getCross(target, 3).some(ps => arena.atPosition(ps).role === this);

        if (!isValidTarget) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can accuse within 3 spaces vertically or 
            horizontally of your card, but not diagonally.`);
        }

        const arested = GameHelper.accuse(target, mafioso, this.context);

        if (arested) {
            this.endTurn({ checkScores: true });
        } else {
            this.endTurn({});
        }
    }

    peekSuspects(): [Suspect, Suspect] {
        this.startTurn();

        const first = this.context.evidenceDeck.pop()!;
        const second = this.context.evidenceDeck.pop()!;

        this.endTurn({ nextPlayer: this });

        const canvas: [Suspect, Suspect] = [first, second];

        this.context.detective.canvas = canvas;

        return canvas;
    }

    canvas(index: number): Player<I>[] {
        this.startTurn();

        const canvas = this.context.detective.canvas;

        if (!canvas) {
            throw new Error("You are not picked cards");
        }

        const suspect = canvas[index];

        if (!suspect) {
            throw new Error("Illegal state");
        }

        const adjacentPlayers = GameHelper.canvasAll(suspect, this.context);

        const nextPlayer = GameHelper.findNextPlayerOf(this, this.context);
        this.endTurn({ nextPlayer: nextPlayer });

        return adjacentPlayers;
    }
}

class DetectiveContext {
    canvas?: [Suspect, Suspect];
}

class Suit<I extends Identifiable> extends Agent<I> implements ISuit<I> {

    readonly roleType = RoleType.SUIT;

    override canDoFastShift(): boolean {
        return true;
    }

    override ownMarker(): Marker | undefined {
        return Marker.PROTECTION;
    }

    placeProtection(target: Position) {
        this.startTurn();

        const arena = this.context.arena;

        const protectionsCount = arena.count(suspect => suspect.markers.has(Marker.PROTECTION));
        if (protectionsCount === 6) {
            throw new Error("You may not have more than 6 protections in play at a time.");
        };


        const suspect = arena.atPosition(target);

        if (suspect.markers.has(Marker.PROTECTION)) {
            throw new Error("Suspect already have protection marker");
        }

        suspect.markers.add(Marker.PROTECTION);

        this.endTurn({ nextPlayer: this });
    }

    removeProtection(target: Position) {
        this.startTurn();

        const arena = this.context.arena;

        const suspect = arena.atPosition(target);

        if (!suspect.markers.delete(Marker.PROTECTION)) {
            throw new Error("Suspect does not have protection marker");
        }

        this.endTurn({ nextPlayer: this });
    }

    accuse(target: Position, mafioso: Mafioso<I>): void {
        this.startTurn();

        const arena = this.context.arena;

        if (!GameHelper.isAdjacentTo(this, target, this.context)) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can accuse only your adjacanets`);
        }

        const arested = GameHelper.accuse(target, mafioso, this.context);

        if (arested) {
            this.endTurn({ checkScores: true });
        } else {
            this.endTurn({});
        }
    }

    decideProtect(protect: boolean): void {
        this.startTurn();

        const protectionContext = this.context.suit.protection;
        if (!protectionContext) {
            throw new Error("There are nor protection target");
        }

        const arena = this.context.arena;

        if (protect) {
            const crosses = arena.getCross(protectionContext.target, arena.size);

            if (!crosses.some(pos => arena.atPosition(pos).role === this)) {
                throw new Error("You cannot protect from your position");
            }

            this.endTurn({ nextPlayer: protectionContext.switchToPlayerAfterDescision });
        } else {
            const suspect = arena.atPosition(protectionContext.target);

            GameHelper.killSuspect(suspect, this.context);
            this.endTurn({ nextPlayer: protectionContext.switchToPlayerAfterDescision, checkScores: true });
        }

        this.context.suit.protection = undefined;
    }
}

class SuitContext {
    protection?: ProtectionContext
}

interface ProtectionContext {
    target: Position;
    switchToPlayerAfterDescision: Player<any>;
}

class Profiler<I extends Identifiable> extends Agent<I> implements IProfiler<I> {

    readonly roleType = RoleType.PROFILER;

    override canDoFastShift(): boolean {
        return false;
    }

    override ownMarker(): Marker | undefined {
        return undefined;
    }

    accuse(target: Position, mafioso: Mafioso<I>): void {
        this.startTurn();

        const arena = this.context.arena;

        if (!GameHelper.isAdjacentTo(this, target, this.context)) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can accuse only your adjacanets`);
        }

        const arested = GameHelper.accuse(target, mafioso, this.context);

        if (arested) {
            this.endTurn({ checkScores: true });
        } else {
            this.endTurn({});
        }
    }

    profile(index: number): void {
        this.startTurn();

        let hand = this.context.profiler.evidenceHand;
        const suspect = hand[index];

        if (!suspect) {
            throw new Error(`Suspect with index ${index} not found`);
        }

        GameHelper.canvasMafioso(suspect, this.context);


        hand = hand.filter(suspect => suspect.role !== 'killed');
        hand.removeFirst(suspect);

        const newHandCount = 4 - this.context.profiler.evidenceHand.length;
        const newSuspects = this.context.evidenceDeck.splice(-1, newHandCount);
        hand.push(...newSuspects);

        this.context.profiler.evidenceHand = hand;

        this.endTurn({});
    }
}

class ProfilerContext {
    evidenceHand: Suspect[]

    constructor(evidenceHand: Suspect[]) {
        this.evidenceHand = evidenceHand;
    }
}

class GameContext {
    arena: Matrix<Suspect>;

    players: Player<any>[];
    currentTurnPlayer: Player<any>;

    evidenceDeck: Suspect[];

    lastShift?: Shift;

    bomber: BomberContext;
    detective: DetectiveContext;
    suit: SuitContext;
    profiler: ProfilerContext;

    scores: [number, number];

    game: PlayingState<any>;

    constructor(arena: Matrix<Suspect>, evidenceDeck: Suspect[], profilerEvidenceHand: Suspect[]) {
        this.arena = arena;
        this.players = undefined as any;
        this.currentTurnPlayer = undefined as any;
        this.evidenceDeck = evidenceDeck;
        this.bomber = {};
        this.detective = {};
        this.suit = {};
        this.profiler = new ProfilerContext(profilerEvidenceHand);
        this.scores = [0, 0];
        this.game = undefined as any;
    }
}

namespace GameHelper {

    export function findNextPlayerOf(player: Player<any>, context: GameContext): Player<any> {
        const players = context.players;

        const currentPlayerIndex = context.players.findIndex(p => p === player);
        if (currentPlayerIndex === -1) {
            throw new Error("Player not found");
        }

        if (currentPlayerIndex === players.length - 1) {
            return players[0];
        } else {
            return players[currentPlayerIndex + 1];
        }
    }

    export function isAdjacentTo(player: Player<any>, position: Position, context: GameContext): boolean {
        const arena = context.arena;

        const adjacents = arena.getAdjacents(position);

        return adjacents.some(pos => arena.atPosition(pos).role === player);
    }

    export function getAdjacentPlayers(position: Position, context: GameContext, predicate?: (suspect: Suspect) => boolean): Player<any>[] {
        predicate = predicate || ((suspect: Suspect) => suspect.role instanceof Player);

        const arena = context.arena;

        const adjacents = arena.getAdjacents(position);

        return adjacents.map(pos => arena.atPosition(pos)).filter(suspect => predicate!(suspect)).map(sus => sus.role) as Player<any>[];
    }

    export function getAdjacentMafiosi(position: Position, context: GameContext): Mafioso<any>[] {
        const arena = context.arena;

        const adjacents = arena.getAdjacents(position);

        return adjacents.map(pos => arena.atPosition(pos).role).filter(role => role instanceof Mafioso) as Mafioso<any>[];
    }

    export function shift(shift: Shift, context: GameContext) {
        if (context.lastShift && context.lastShift.direction === Direction.getReverse(shift.direction) && context.lastShift.index === shift.index) {
            throw new Error("Cannot undo last shift");
        }

        const arena = context.arena;

        arena.shift(shift.direction, shift.index, shift.fast ? 2 : 1);
    }

    /**
     * Try kill suspect. Return false if suspect can be protected by suit.
     */
    export function tryKillSuspect(position: Position, suit: Player<any>, context: GameContext): boolean {
        const suspect = context.arena.atPosition(position);

        const suspectRole = suspect.role;
        if (suspectRole === 'arested' || suspectRole === 'killed') {
            throw new Error(`Target ${suspect} cannot be killed.`);
        }

        if (suspect.markers.has(Marker.PROTECTION) && suspect.role !== suit
            && (isPlayerInRow(suit, context.arena, position.x) || isPlayerInColumn(suit, context.arena, position.y))) {
            return false;
        } else {
            killSuspect(suspect, context);
            return true;
        }
    }

    export function killSuspect(suspect: Suspect, context: GameContext) {
        const suspectRole = suspect.role;

        if (suspectRole instanceof Mafioso) {
            arestMafioso(suspect, context);
            return false;
        } else {
            suspect.role = 'killed';

            if (suspectRole instanceof Player) {
                context.scores[0] += 2;

                const ownMarker = suspectRole.ownMarker();
                if (ownMarker) {
                    removeMarkersFromArena(ownMarker, context);
                }

                peekNewIdentityFor(suspectRole, context);
            } else {
                context.scores[0] += 1;
            }

            suspect.markers.clear();

            return true;
        }
    }

    export function accuse(target: Position, mafioso: Mafioso<any>, context: GameContext): boolean {
        const arena = context.arena;

        const suspect = arena.atPosition(target);

        if (suspect.role === mafioso) {
            arestMafioso(suspect, context);
            return true;
        } else {
            return false;
        }
    }

    function arestMafioso(suspect: Suspect, context: GameContext) { // TODO: bomber self estrcut
        if (!(suspect.role instanceof Mafioso)) {
            throw new Error("Only mafioso can be arested");
        }

        const suspectRole = suspect.role;

        suspect.role = 'arested';

        context.scores[1] += 1;

        const ownMarker = suspectRole.ownMarker();
        if (ownMarker) {
            removeMarkersFromArena(ownMarker, context);
        }

        peekNewIdentityFor(suspectRole, context);

        suspect.markers.clear();
    }

    export function canvasAll(suspect: Suspect, context: GameContext): Player<any>[] {
        return canvas(suspect, context);
    }


    export function canvasMafioso(suspect: Suspect, context: GameContext): Player<any>[] {
        return canvas(suspect, context, (suspect: Suspect) => suspect.role instanceof Mafioso);
    }

    function canvas(suspect: Suspect, context: GameContext, predicate?: (suspect: Suspect) => boolean): Player<any>[] {
        if (suspect.role !== 'suspect') {
            throw new Error("Illegal state");
        }

        suspect.role = 'innocent';

        const position = GameHelper.findSuspectInArena(suspect, context);

        const adjacentPlayers = GameHelper.getAdjacentPlayers(position, context, predicate);

        return adjacentPlayers;
    }

    export function peekNewIdentityFor(player: Player<any>, context: GameContext) {
        while (!tryPeekNewIdentityFor(player, context)) {
        }
    }

    export function tryPeekNewIdentityFor(player: Player<any>, context: GameContext): boolean {
        const newIdentity = context.evidenceDeck.pop();
        if (!newIdentity) {
            throw new Error("hmmm"); // TODO: wtf state
        }

        if (newIdentity.role === 'killed') {
            return false;
        } else {
            newIdentity.role = player;
            return true;
        }
    }

    export function findPlayer(type: typeof Player, context: GameContext): Player<any> {
        return context.players.find(player => player instanceof type)!;
    }


    export function findPlayerInArena(player: Player<any>, context: GameContext): Position {
        return findFirstInArena(suspect => suspect.role === player, context);
    }

    export function findSuspectInArena(suspect: Suspect, context: GameContext): Position {
        return findFirstInArena(s => s === suspect, context);
    }

    export function findFirstInArena(predicate: (suspect: Suspect) => boolean, context: GameContext): Position {
        const arena = context.arena;

        for (let i = 0; i < arena.size; i++) {
            for (let j = 0; j < arena.size; j++) {
                const suspect = arena.at(i, j);
                if (predicate(suspect)) {
                    return new Position(i, j);
                }
            }
        }

        throw new Error('Invalid state');
    }

    export function isPlayerInRow(player: Player<any>, arena: Matrix<Suspect>, row: number): boolean {
        for (let i = 0; i < arena.size; i++) {
            const suspect = arena.at(row, i);
            if (suspect.role === player) {
                return true;
            }
        }

        return false;
    }

    export function isPlayerInColumn(player: Player<any>, arena: Matrix<Suspect>, column: number): boolean {
        for (let i = 0; i < arena.size; i++) {
            const suspect = arena.at(i, column);
            if (suspect.role === player) {
                return true;
            }
        }

        return false;
    }

    export function removeMarkersFromArena(marker: Marker, context: GameContext): void {
        const arena = context.arena;

        for (let i = 0; i < arena.size; i++) {
            for (let j = 0; j < arena.size; j++) {
                const suspect = arena.at(i, j);
                suspect.markers.delete(marker);
            }
        }
    }
}

