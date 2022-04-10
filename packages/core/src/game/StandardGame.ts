import { Observable, Subject } from 'rxjs';
import { swap } from '../util/ArrayUtils';
import { assert } from '../util/Assertions';
import { Direction } from '../util/Direction';
import Identifiable from '../util/Identifiable';
import Matrix from '../util/Matrix';
import Position from '../util/Position';
import { shuffle } from '../util/RandUtils';
import './../extension/ArrayExtension';
import './../extension/SetExtension';
import {
    Agent as IAgent, Arena, Bomber as IBomber, Detective as IDetective, EvidenceDeck, findPlayerByRole, Game, InitialState, Killer as IKiller, Mafioso as IMafioso, Player as IPlayer, Profiler as IProfiler, Psycho as IPsycho, RoleSelection, Sniper as ISniper, Suit as ISuit, Team, Undercover as IUndercover, Winner
} from './Game';
import { GameActions } from './GameActions';
import { GameEvents } from './GameEvents';
import { Marker } from './Marker';
import { RoleType } from './RoleType';
import { Suspect } from './Suspect';

export namespace StandardGame {

    export const ROLE_SETS = [
        new Set([RoleType.KILLER, RoleType.BOMBER, RoleType.PSYCHO, RoleType.UNDERCOVER, RoleType.SUIT, RoleType.DETECTIVE]),
        new Set([RoleType.KILLER, RoleType.BOMBER, RoleType.PSYCHO, RoleType.SNIPER, RoleType.UNDERCOVER, RoleType.SUIT, RoleType.DETECTIVE, RoleType.PROFILER])
    ];

    export class Preparation<I extends Identifiable> implements Game.Preparation<I> {

        readonly participants: RoleSelection<I>[] = [];
        private participantsSubject = new Subject<RoleSelection<I>[]>();

        getPlayersCount(): number {
            return this.participants.length;
        }

        public join(identity: I) {
            if (this.participants.find(p => p.identity === identity)) {
                throw new Error('Already in game');
            }

            const maxPlayersCount = ROLE_SETS.at(-1)!.size;

            if (this.participants.length === maxPlayersCount) {
                throw new Error("Fully");
            }

            this.participants.push({ identity: identity, ready: false });
        }

        public changeRole(participant: RoleSelection<I>) {
            const currentParticipant = this.participants.removeFirstBy(p => participant.identity === p.identity);

            if (!currentParticipant) {
                throw new Error(`Player ${participant.identity} not joined this game`);
            }

            if (currentParticipant.role !== participant.role) {
                this.resetReadiness();
                this.emitParticipants();
            }

            if (participant.role) {
                if (this.participants.find(p => p.role === participant.role)) {
                    throw new Error(`Role ${participant.role} already selected`);
                }
            }

            this.participants.push(participant);
            this.emitParticipants();
        }

        public leave(identity: I) {
            const participant = this.participants.removeFirstBy(p => p.identity !== identity);

            if (participant) {
                // reset ready states
                this.resetReadiness();

                this.emitParticipants();
            }
        }

        public start(): Game.Play<I> | undefined {
            if (this.readyForGame()) {
                return this.createGame();
            } else {
                return undefined;
            }
        }

        public participantChanges(): Observable<RoleSelection<I>[]> {
            return this.participantsSubject.asObservable();
        }

        private emitParticipants() {
            this.participantsSubject.next(this.participants);
        }

        private resetReadiness() {
            this.participants.forEach(p => p.ready = false);
        }

        private readyForGame(): boolean {
            const minPlayersCount = ROLE_SETS.at(0)!.size;
            const roles = new Set(this.participants.map(p => p.role)) as Set<RoleType>;

            return this.readyCount === minPlayersCount && this.matchRoleSet(roles);
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
            return ROLE_SETS.some(set => set.equals(roles));
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

        private createGame(): StandardGame.Play<I> {
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

            this.resolvePlayersOrder(players);

            players.forEach(player => suspects.pop()!.role = player);

            context.players = players;
            context.currentTurnPlayer = players[0];

            return new StandardGame.Play(context, winningScores);
        }

        private resolvePlayersOrder(players: Player<any>[]): void {
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

    export class Play<I extends Identifiable> implements Game.Play<I>{

        completed = false;

        #initialState: InitialState<I>;

        #events = new Subject<GameEvents.Base>();

        constructor(private context: GameContext, private winningScores: [number, number]) {
            context.game = this;
            this.#initialState = {
                players: [...this.context.players],
                arena: this.context.arena.clone(suspect => suspect.clone()),
                evidenceDeck: this.context.evidenceDeck.map(suspect => suspect.clone())
            }
        }

        public get initialState(): InitialState<I> {
            return this.#initialState;
        }

        public events(): Observable<GameEvents.Base> {
            assert(!this.completed, 'Game is already completed');

            return this.#events.asObservable();
        }

        checkWin(scores: [number, number]): Winner | undefined {
            if (scores[0] >= this.winningScores[0] && scores[1] >= this.winningScores[1]) {
                return 'DRAW';
            }

            if (scores[0] >= this.winningScores[0]) {
                return 'MAFIA';
            } else if (scores[1] >= this.winningScores[1]) {
                return 'FBI';
            } else {
                return undefined;
            }
        }

        fireEvent(event: GameEvents.Base) {
            this.#events.next(event);
        }

    }
}

abstract class Player<I extends Identifiable> implements IPlayer<I> {

    abstract readonly role: RoleType;

    protected abstract readonly phases: readonly string[];

    protected readonly phaseHistory: number[] = [];

    private currentPhaseIndex: number = -1;

    constructor(public readonly identity: I, protected context: GameContext) {
    }

    public gameEvents(): Observable<GameEvents.Base> {
        return this.context.game.events();
    }

    public locate(): Position {
        return GameHelper.findPlayerInArena(this, this.context);
    }

    public doAction<T extends GameActions.Key<any>>(key: T, data: GameActions.Params<T>): void {
        const thisAny = this as any;
        const actionFunc = thisAny[key];

        this.checkStateAndTurn();
        actionFunc(data);
    }

    abstract canDoFastShift(): boolean;

    abstract ownMarker(): Marker | undefined;

    protected abstract initTurn(): void;

    protected shift(shift: GameActions.Shift): void {
        this.assertPhase('ACTION');

        GameHelper.shift(shift, this, this.context);

        this.changePhase('END');

    }

    protected collapse(collapse: GameActions.Collapse): void {
        this.assertPhase('ACTION');

        GameHelper.collapse(collapse.direction, this.context);

        this.changePhase('END');
    }

    protected assertPhase(mustBe: string) {
        assert(this.phases[this.currentPhaseIndex] === mustBe, `Not in phase ${mustBe}`);
    }

    protected getCurrentPhase(): string {
        return this.phases[this.currentPhaseIndex];
    }

    protected changePhase(phase: string | number) {
        if (phase === 'END') {
            if (this.checkWin()) {
                return;
            }

            this.switchTurn(this.getNextPlayer());
            return;
        }

        let index;
        if (typeof phase === 'number') {
            assert(phase > 0 && phase < this.phases.length, `Invalid phase ${phase}`);
            index = phase;
        } else {
            index = this.phases.findIndex(p => typeof p === phase);
            assert(index !== -1, `Invalid phase ${phase}`);
        }

        this.phaseHistory.push(this.currentPhaseIndex);
        this.currentPhaseIndex = index;
    }

    private checkWin(): boolean {
        const winner = this.context.game.checkWin(this.context.scores);
        if (winner) {
            this.context.game.completed = true;
            const event: GameEvents.Complete = { type: 'Complete', winner: winner };
            this.context.game.fireEvent(event);

            return true;
        }

        return false;
    }

    private checkStateAndTurn() {
        if (this.context.game.completed) {
            throw new Error("Game completed");
        }

        const reactions = this.context.reactions;
        if (reactions.length === 0) {
            if (this !== this.context.currentTurnPlayer) {
                throw new Error('Not your turn');
            };
        } else {
            const lastReactionOwner = reactions.at(-1)!;
            if (this !== lastReactionOwner) {
                throw new Error('Not your turn (reaction)');
            }
        }
    }

    private getNextPlayer(): Player<any> {
        const currentTurnPlayer = this.context.currentTurnPlayer;

        const nextPlayer: Player<any> = GameHelper.findNextPlayerOf(currentTurnPlayer, this.context);

        return nextPlayer;
    }

    private switchTurn(player: Player<any>): Player<any> {
        this.context.currentTurnPlayer = player;
        player.initTurn();
        return player;
    }
}

abstract class Mafioso<I extends Identifiable> extends Player<I> implements IMafioso<I>  {

}

abstract class Agent<I extends Identifiable> extends Player<I> implements IAgent<I> {

    protected disarm(action: GameActions.Disarm): void {
        const { target, marker } = action;

        assert(marker === Marker.BOMB || marker === Marker.THREAT, "You can remove bomb or threat markers");

        const arena = this.context.arena;

        assert(GameHelper.isAdjacentTo(this, target, this.context), `Invalid target=${arena.atPosition(target)}. You can remove marker on adjacent suspects`);

        const suspect = arena.atPosition(target);

        const deleted = suspect.removeMarker(marker);

        assert(deleted, `Target does not have marker ${marker}`);

        const event: GameEvents.Disarm = { type: 'Disarm', target: target, marker: marker };
        this.context.game.fireEvent(event);

        this.changePhase('END');
    }
}

class Killer<I extends Identifiable> extends Mafioso<I> implements IKiller<I> {

    readonly role = RoleType.KILLER;

    readonly phases: readonly string[] = [];

    override canDoFastShift(): boolean {
        return true;
    }

    override ownMarker(): Marker | undefined {
        return undefined;
    }

    protected initTurn(): void {
        // No-op
    }

    protected knifeKill(action: GameActions.KnifeKill): void {
        const { target } = action;

        assert(GameHelper.isAdjacentTo(this, target, this.context), `You can kill only your adjacent suspects`);

        GameHelper.tryKillSuspect(target, this.context, 'KnifeKill');

        this.changePhase('END');
    }

    protected disguise(): void {
        GameHelper.disguise(this, this.context);

        this.changePhase('END');
    }
}

class Psycho<I extends Identifiable> extends Mafioso<I> implements IPsycho<I> {

    readonly role = RoleType.PSYCHO;

    readonly phases: readonly string[] = ['KILL', 'ACTION', 'PLACE'];

    override canDoFastShift(): boolean {
        return false;
    }

    override ownMarker(): Marker | undefined {
        return Marker.THREAT;
    }

    protected initTurn(): void {
        this.changePhase('KILL');

        const arena = this.context.arena;

        const adjacentPositions = arena.getAdjacentPositions(this.locate());
        this.context.psycho.threatPositions = adjacentPositions.filter(pos => arena.atPosition(pos).hasMarker(Marker.THREAT));
    }

    protected threatKill(action: GameActions.ThreatKill): void {
        const { target } = action;

        this.assertPhase('KILL');

        const threatPositions = this.context.psycho.threatPositions!;

        const deleted = threatPositions.removeFirst(target);
        assert(deleted, `Invalid target ${target}`);

        GameHelper.tryKillSuspect(target, this.context, 'ThreatKill');

        if (threatPositions.length === 0) {
            this.context.psycho.threatPositions = undefined;
            this.changePhase('ACTION');
        }
    }

    protected override shift(shift: GameActions.Shift): void {
        this.assertPhase('ACTION');

        GameHelper.shift(shift, this, this.context);

        this.changePhase('PLACE');

    }

    protected override collapse(collapse: GameActions.Collapse): void {
        this.assertPhase('ACTION');

        GameHelper.collapse(collapse.direction, this.context);

        this.changePhase('PLACE');
    }

    protected swapSuspects(action: GameActions.SwapSuspects) {
        const { position1, position2 } = action;
        this.assertPhase('ACTION');

        assert(!position1.equals(position2), "Same position");

        const arena = this.context.arena;

        const psychoPosition = this.locate();

        assert(position1.isAdjacentTo(psychoPosition) && position2.isAdjacentTo(psychoPosition), "Not adjacent swap target");

        arena.swap(position1, position2);

        const event: GameEvents.SwapSuspects = {
            type: 'SwapSuspects',
            position1: position1,
            position2: position2
        };
        this.context.game.fireEvent(event);

        this.changePhase('PLACE');
    }

    protected placeThreat(action: GameActions.PlaceThreat) {
        const { targets } = action;

        this.assertPhase('PLACE');

        if (targets.length > 3) {
            throw new Error("You can mark up to 3 suspects");
        }

        const arena = this.context.arena;

        const psychoPosition = GameHelper.findPlayerInArena(this, this.context);
        targets.forEach(position => {
            const rowDiff = Math.abs(psychoPosition.x - position.x);
            const colDiff = Math.abs(psychoPosition.x - position.x);
            if (rowDiff === 0 || colDiff === 0 || rowDiff + colDiff > 3) {
                throw new Error("You can mark within 3 orthogonal spaces");
            }
        });

        targets.forEach(position => {
            arena.atPosition(position).addMarker(Marker.THREAT);
        });

        const event: GameEvents.PlaceThreat = {
            type: 'PlaceThreat',
            targets: targets
        };
        this.context.game.fireEvent(event);

        this.changePhase('END');
    }
}

interface PsychoContext {
    threatPositions?: Position[];
}

class Bomber<I extends Identifiable> extends Mafioso<I> implements IBomber<I> {

    readonly role = RoleType.BOMBER;

    readonly phases: Readonly<string[]> = ['ACTION', 'SELF_DESTRUCT'];

    override canDoFastShift(): boolean {
        return false;
    }

    override ownMarker(): Marker | undefined {
        return Marker.BOMB;
    }

    protected initTurn(): void {
        this.changePhase('ACTION');
    }

    enableReaction(context: SelfDestructContext) {
        this.context.bomber.selfDestruct = context;
        this.context.reactions.push(this);
        this.changePhase('SELF_DESTRUCT');
    }

    protected placeBomb(action: GameActions.PlaceBomb) {
        const { target } = action;

        this.assertPhase('ACTION');

        const arena = this.context.arena;

        const targetSuspect = arena.atPosition(target);

        const isValidTarget = targetSuspect.role === this || GameHelper.isAdjacentTo(this, target, this.context);
        assert(isValidTarget, `Invalid target=${arena.atPosition(target)}. You can place bomb only on yourself or adjacent suspects`);

        if (targetSuspect.hasMarker(Marker.BOMB)) {
            throw new Error('Target already has bomb');
        }

        targetSuspect.addMarker(Marker.BOMB);

        const event: GameEvents.PlaceBomb = {
            type: 'PlaceBomb',
            target: target
        };
        this.context.game.fireEvent(event);

        this.changePhase('END');

    }

    protected detonateBomb(action: GameActions.DetonateBomb) {
        const { target } = action;

        this.assertPhase('ACTION');

        this._detonate(target);
    }

    protected stopDetonation() {
        this._stopDetonation();

        const event: GameEvents.StopDetonation = {
            type: 'StopDetonation'
        };
        this.context.game.fireEvent(event);
    }

    protected selfDestruct() {
        this.assertPhase('SELF_DESTRUCT');

        return this._detonate(this.context.bomber.selfDestruct!.target);
    }

    private _detonate(target: Position): void {
        const suspect = this.context.arena.atPosition(target);
        const hasBombMarker = suspect.removeMarker(Marker.BOMB);

        if (this.context.bomber.contDetonation) {
            assert(this.context.bomber.contDetonation.some(p => p.equals(target)), 'Non adjacent position');
        } else {
            assert(hasBombMarker, `Suspect ${suspect} does not have bomb marker`);
        }

        const arena = this.context.arena;

        GameHelper.tryKillSuspect(target, this.context, 'BombDetonation', (isProtected) => {
            let adjacentCells;
            if (!isProtected && hasBombMarker && (adjacentCells = arena.getAdjacentPositions(target)).length !== 0) {
                this.context.bomber.contDetonation = adjacentCells;
            } else {
                this._stopDetonation();
            }
        });
    }

    private _stopDetonation() {
        const currentPhase = this.getCurrentPhase();

        this.context.bomber.contDetonation = undefined;
        if (currentPhase === 'SELF_DESTRUCT') {
            this.endReaction();
        } else {
            this.changePhase('END');
        }
    }

    private endReaction() {
        this.context.bomber.selfDestruct!.onReactionEnd();

        const phaseBeforeReaction = this.phaseHistory.at(-2)!;
        this.changePhase(phaseBeforeReaction);
        this.context.bomber.selfDestruct = undefined;
        this.context.reactions.pop();
    }
}

interface BomberContext {
    selfDestruct?: SelfDestructContext;
    contDetonation?: Position[];
}

type SelfDestructEndHandler = () => void;

interface SelfDestructContext {
    target: Position;
    onReactionEnd: SelfDestructEndHandler;
}

class Sniper<I extends Identifiable> extends Mafioso<I> implements ISniper<I> {
    readonly role = RoleType.SNIPER;

    readonly phases: Readonly<string[]> = [];

    override canDoFastShift(): boolean {
        return true;
    }

    override ownMarker(): Marker | undefined {
        return undefined;
    }

    protected initTurn(): void {
        // No-op
    }

    protected snipeKill(action: GameActions.SnipeKill) {
        const { target } = action;

        const arena = this.context.arena;
        const diagonals = arena.getDiagonals(target, 3);

        if (!diagonals.some(pos => arena.atPosition(pos).role === this)) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can kill only suspects 3 spaces away from you in diagonal line`);
        }

        GameHelper.tryKillSuspect(target, this.context, 'SniperKill');

        this.changePhase('END');
    }

    protected setup(action: GameActions.Setup) {
        const { from, to, marker } = action;

        assert(from.isAdjacentTo(to), 'Non adjacent suspects');

        const arena = this.context.arena;

        const fromSuspect = arena.atPosition(from);
        const toSuspect = arena.atPosition(to);

        assert(fromSuspect.hasMarker(marker), `Suspect does not have marker ${marker}`);
        assert(toSuspect.hasMarker(marker), `Suspect already have marker ${marker}`);

        fromSuspect.removeMarker(marker);
        toSuspect.removeMarker(marker);

        const event: GameEvents.MoveMarker = {
            type: 'MoveMarker',
            from: from,
            to: to,
            marker: marker
        }
        this.context.game.fireEvent(event);

        this.changePhase('END');
    }
}

class Undercover<I extends Identifiable> extends Agent<I> implements IUndercover<I> {
    readonly role = RoleType.UNDERCOVER;

    readonly phases: Readonly<string[]> = [];

    override canDoFastShift(): boolean {
        return false;
    }

    override ownMarker(): Marker | undefined {
        return undefined;
    }

    protected initTurn(): void {
        // No-op
    }

    protected accuse(action: GameActions.Accuse): void {
        const { target, mafioso } = action;

        const arena = this.context.arena;

        if (!GameHelper.isAdjacentTo(this, target, this.context)) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can accuse only your adjacent suspects`);
        }

        GameHelper.accuse(target, mafioso, this.context);

        this.changePhase('END');
    }

    protected disguise() {
        GameHelper.disguise(this, this.context);

        this.changePhase('END');
    }

    protected autoSpy(action: GameActions.AutoSpy) {
        const { target } = action;

        const suspect = this.context.arena.atPosition(target);

        if (suspect.role !== 'killed') {
            throw new Error("Target must be deceased");
        }

        const mafiosi = GameHelper.getAdjacentMafiosi(target, this.context);

        const event: GameEvents.AutoSpy = {
            type: 'AutoSpy',
            target: target,
            mafiosi: mafiosi.map(m => m.role)
        }
        this.context.game.fireEvent(event);

        this.changePhase('END');
    }
}

class Detective<I extends Identifiable> extends Agent<I> implements IDetective<I> {
    readonly role = RoleType.DETECTIVE;

    readonly phases: Readonly<string[]> = ['ACTION', 'CANVAS'];

    override canDoFastShift(): boolean {
        return true;
    }

    override ownMarker(): Marker | undefined {
        return undefined;
    }

    protected initTurn(): void {
        this.changePhase('ACTION');
    }

    protected accuse(action: GameActions.Accuse) {
        const { target, mafioso } = action;

        this.assertPhase('ACTION');

        const arena = this.context.arena;

        const isValidTarget = arena.getCross(target, 3).some(ps => arena.atPosition(ps).role === this);

        assert(isValidTarget, `Invalid target=${arena.atPosition(target)}. You can accuse within 3 spaces vertically or 
        horizontally of your card, but not diagonally.`);

        GameHelper.accuse(target, mafioso, this.context);

        this.changePhase('END');
    }

    protected peekSuspects() {
        this.assertPhase('ACTION');

        const first = this.context.evidenceDeck.pop()!;
        const second = this.context.evidenceDeck.pop()!;

        const suspects: [Position, Position] = [
            GameHelper.findSuspectInArena(first, this.context),
            GameHelper.findSuspectInArena(second, this.context)
        ];

        this.context.detective.canvas = suspects;

        const event: GameEvents.PeekSuspectsForCanvas = {
            type: 'PeekSuspectsForCanvas',
            suspects: suspects
        }
        this.context.game.fireEvent(event);

        this.changePhase('CANVAS');
    }

    protected canvas(action: GameActions.Canvas) {
        const { index } = action;

        this.assertPhase('CANVAS');

        const canvas = this.context.detective.canvas!;

        const suspectPos = canvas[index];

        if (!suspectPos) {
            throw new Error("Illegal state");
        }

        const adjacentPlayers = GameHelper.canvasAll(suspectPos, this.context);

        const event: GameEvents.Canvas = {
            type: 'Canvas',
            target: suspectPos,
            players: adjacentPlayers.map(p => p.role)
        }
        this.context.game.fireEvent(event);

        this.changePhase('END');
    }
}

class DetectiveContext {
    canvas?: [Position, Position];
}

class Suit<I extends Identifiable> extends Agent<I> implements ISuit<I> {

    readonly role = RoleType.SUIT;

    readonly phases: readonly string[] = ['MARKER', 'ACTION', 'PROTECTION'];

    override canDoFastShift(): boolean {
        return true;
    }

    override ownMarker(): Marker | undefined {
        return Marker.PROTECTION;
    }

    protected initTurn(): void {
        this.changePhase('MARKER');
    }

    enableReaction(context: ProtectionContext) {
        this.context.suit.protection = context;
        this.context.reactions.push(this);
        this.changePhase('PROTECTION');
    }

    protected placeProtection(action: GameActions.PlaceProtection) {
        const { target } = action;

        this.assertPhase('MARKER');
        const arena = this.context.arena;

        const protectionsCount = arena.count(suspect => suspect.hasMarker(Marker.PROTECTION));
        if (protectionsCount === 6) {
            throw new Error("You may not have more than 6 protections in play at a time.");
        };


        const suspect = arena.atPosition(target);

        if (suspect.hasMarker(Marker.PROTECTION)) {
            throw new Error("Suspect already have protection marker");
        }

        suspect.addMarker(Marker.PROTECTION);

        const event: GameEvents.PlaceProtection = { type: 'PlaceProtection', target: target };
        this.context.game.fireEvent(event);

        this.changePhase('ACTION');
    }

    protected removeProtection(action: GameActions.RemoveProtection) {
        const { target } = action;

        this.assertPhase('MARKER');

        const arena = this.context.arena;

        const suspect = arena.atPosition(target);

        if (!suspect.removeMarker(Marker.PROTECTION)) {
            throw new Error("Suspect does not have protection marker");
        }

        const event: GameEvents.RemoveProtection = { type: 'RemoveProtection', target: target };
        this.context.game.fireEvent(event);

        this.changePhase('ACTION');
    }

    protected accuse(action: GameActions.Accuse): void {
        const { target, mafioso } = action;

        this.assertPhase('ACTION');

        const arena = this.context.arena;

        if (!GameHelper.isAdjacentTo(this, target, this.context)) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can accuse only your adjacent suspects`);
        }

        GameHelper.accuse(target, mafioso, this.context);

        this.changePhase('END');
    }

    protected decideProtect(action: GameActions.DecideProtect): void {
        const { protect } = action;

        this.assertPhase('PROTECTION');

        const protectionContext = this.context.suit.protection;
        if (!protectionContext) {
            throw new Error("There are nor protection context");
        }

        if (protect) {
            const arena = this.context.arena;

            const crosses = arena.getCross(protectionContext.target, arena.size);

            if (!crosses.some(pos => arena.atPosition(pos).role === this)) {
                throw new Error("You cannot protect from your position");
            }
        }

        const event: GameEvents.ProtectDecision = { type: 'ProtectDecision', target: protectionContext.target, protect: protect };
        this.context.game.fireEvent(event);

        protectionContext.onReactionEnd(protect);

        const phaseBeforeReaction = this.phaseHistory.at(-2)!;
        this.changePhase(phaseBeforeReaction);
        this.context.suit.protection = undefined;
        this.context.reactions.pop();
    }
}

interface SuitContext {
    protection?: ProtectionContext;
}

type ProtectionEndHandler = (isProtected: boolean) => void;

interface ProtectionContext {
    target: Position;
    onReactionEnd: ProtectionEndHandler;
}

class Profiler<I extends Identifiable> extends Agent<I> implements IProfiler<I> {
    readonly role = RoleType.PROFILER;

    readonly phases: Readonly<string[]> = [];

    override canDoFastShift(): boolean {
        return false;
    }

    override ownMarker(): Marker | undefined {
        return undefined;
    }

    protected initTurn(): void {
        // No-op
    }

    protected accuse(action: GameActions.Accuse): void {
        const { target, mafioso } = action;

        const arena = this.context.arena;

        if (!GameHelper.isAdjacentTo(this, target, this.context)) {
            throw new Error(`Invalid target=${arena.atPosition(target)}. You can accuse only your adjacent suspects`);
        }

        GameHelper.accuse(target, mafioso, this.context);

        this.changePhase('END');
    }

    protected profile(action: GameActions.Profile): void {
        const { index } = action;

        let hand = this.context.profiler.evidenceHand;
        const suspect = hand[index];

        if (!suspect) {
            throw new Error(`Suspect with index ${index} not found`);
        }

        const position = GameHelper.findSuspectInArena(suspect, this.context);

        const mafiosi = GameHelper.canvasMafioso(position, this.context);

        hand = hand.filter(suspect => suspect.role !== 'killed');
        hand.removeFirst(suspect);

        const newHandCount = 4 - this.context.profiler.evidenceHand.length;
        const newSuspects = this.context.evidenceDeck.splice(-1, newHandCount);
        hand.push(...newSuspects);

        this.context.profiler.evidenceHand = hand;

        const event: GameEvents.Profile = { type: 'Profile', target: position, mafiosi: mafiosi.map(m => m.role), newHand: [...hand] };
        this.context.game.fireEvent(event);

        this.changePhase('END');
    }
}

interface ProfilerContext {
    evidenceHand: Suspect[];
}

class GameContext {
    arena: Arena;

    players: Player<any>[];
    currentTurnPlayer: Player<any>;

    reactions: Player<any>[];

    evidenceDeck: EvidenceDeck;

    lastShift?: GameActions.Shift;

    psycho: PsychoContext;
    bomber: BomberContext;
    detective: DetectiveContext;
    suit: SuitContext;
    profiler: ProfilerContext;

    scores: [number, number];

    game: StandardGame.Play<any>;

    constructor(arena: Matrix<Suspect>, evidenceDeck: Suspect[], profilerEvidenceHand: Suspect[]) {
        this.arena = arena;
        this.players = undefined as any;
        this.currentTurnPlayer = undefined as any;
        this.reactions = [];
        this.evidenceDeck = evidenceDeck;
        this.psycho = {};
        this.bomber = {};
        this.detective = {};
        this.suit = {};
        this.profiler = { evidenceHand: profilerEvidenceHand };
        this.scores = [0, 0];
        this.game = undefined as any;
    }
}

namespace GameHelper {

    export function findNextPlayerOf(player: Player<any>, context: GameContext): Player<any> {
        const players = context.players;

        const currentPlayerIndex = players.findIndex(p => p === player);
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

        const adjacentPositions = arena.getAdjacentPositions(position);

        return adjacentPositions.some(pos => arena.atPosition(pos).role === player);
    }

    export function getAdjacentPlayers(position: Position, context: GameContext, predicate?: (suspect: Suspect) => boolean): Player<any>[] {
        predicate = predicate || ((suspect: Suspect) => suspect.role instanceof Player);

        const arena = context.arena;

        const adjacentPositions = arena.getAdjacentPositions(position);

        return adjacentPositions.map(pos => arena.atPosition(pos)).filter(suspect => predicate!(suspect)).map(sus => sus.role) as Player<any>[];
    }

    export function getAdjacentMafiosi(position: Position, context: GameContext): Mafioso<any>[] {
        const arena = context.arena;

        const adjacentPositions = arena.getAdjacentPositions(position);

        return adjacentPositions.map(pos => arena.atPosition(pos).role).filter(role => role instanceof Mafioso) as Mafioso<any>[];
    }

    export function shift(shift: GameActions.Shift, actor: Player<any>, context: GameContext) {
        assert(!shift.fast || actor.canDoFastShift(), "You cannot do fast shift");

        assert(!context.lastShift || !GameActions.isReverseShifts(shift, context.lastShift), "Cannot undo last shift");

        const arena = context.arena;

        arena.shift(shift.direction, shift.index, shift.fast ? 2 : 1);

        this.context.lastShift = shift;

        const event: GameEvents.Shift = { type: 'Shift', shift: shift };
        context.game.fireEvent(event);
    }

    export function collapse(direction: Direction, context: GameContext) {
        throw new Error("Not implemented"); // TODO

        // const event: ActionEvent<GameEvents.Collapse> = { type: 'Collapse', direction: direction };
    }


    export function tryKillSuspect(target: Position, context: GameContext, killEventType: GameEvents.Kills['type'], onProtectionEnd?: ProtectionEndHandler): void {
        const tryKillEvent: GameEvents.TryKill = {
            type: 'TryKill',
            target: target,
        };
        this.fireEvent(tryKillEvent);

        const suspect = context.arena.atPosition(target);

        const handler = (isProtected: boolean) => {
            if (!isProtected) {
                killSuspect(target, context, killEventType);
            }

            onProtectionEnd?.(isProtected);
        }

        if (suspect.hasMarker(Marker.PROTECTION)) {
            const suit = findSuit(context);
            suit.enableReaction({ target: target, onReactionEnd: handler })
        } else {
            handler(false);
        }
    }

    function killSuspect(target: Position, context: GameContext, killEventType: GameEvents.Kills['type']): void {
        const suspect = context.arena.atPosition(target);

        const suspectRole = suspect.role;

        suspect.assertClosedState();

        let event: GameEvents.Arrest | GameEvents.Kills;

        if (suspectRole instanceof Mafioso) {
            const newIdentity = arrestMafioso(suspect, context);
            event = { type: 'Arrest', arrested: target, newIdentity: newIdentity }
        } else {
            suspect.role = 'killed';

            if (suspectRole instanceof Player) {
                context.scores[0] += 2;

                const newIdentity = peekNewIdentityFor(suspectRole, context);

                event = { type: killEventType, killed: target, newIdentity: GameHelper.findSuspectInArena(newIdentity, context) };
            } else {
                context.scores[0] += 1;
                event = { type: killEventType, killed: target };
            }
        }

        context.game.fireEvent(event);
    }

    export function accuse(target: Position, mafiosoRole: RoleType, context: GameContext) {
        const accuseEvent: GameEvents.Accuse = {
            type: 'Accuse',
            target: target,
            mafioso: mafiosoRole
        };
        this.fireEvent(accuseEvent);

        const suspect = context.arena.atPosition(target);

        const handler = () => arrestMafioso(suspect, context);

        suspect.assertClosedState();

        assert(suspect.role !== 'innocent', `You cannot accuse innocents`);

        const mafioso = findPlayerByRole(context.game, mafiosoRole)!;

        if (suspect.role === 'suspect' || suspect.role !== mafioso) {
            const event: GameEvents.UnsuccessfulAccuse = { type: 'UnsuccessfulAccuse', target: target };
            context.game.fireEvent(event);
        }
        else {
            if (suspect.hasMarker(Marker.BOMB)) {
                const bomber = findBomber(context);
                bomber.enableReaction({ target: target, onReactionEnd: handler });
            } else {
                handler();
            }
        }
    }

    function arrestMafioso(suspect: Suspect, context: GameContext): Position {
        if (!(suspect.role instanceof Mafioso)) {
            throw new Error("Only mafioso can be arrested");
        }

        const suspectRole = suspect.role;

        suspect.role = 'arrested';

        context.scores[1] += 1;

        const ownMarker = suspectRole.ownMarker();
        if (ownMarker) {
            removeMarkersFromArena(ownMarker, context);
        }

        const newIdentity = peekNewIdentityFor(suspectRole, context);

        return GameHelper.findSuspectInArena(newIdentity, context);
    }

    export function disguise(player: Killer<any> | Undercover<any>, context: GameContext) {
        const oldIdentity = GameHelper.findPlayerInArena(player, context);
        const newIdentity = GameHelper.tryPeekNewIdentityFor(player, context);
        const newIdentityPos = newIdentity ? GameHelper.findSuspectInArena(newIdentity, this.context) : undefined;

        const event: GameEvents.Disguise = {
            type: 'Disguise',
            oldIdentity: oldIdentity,
            newIdentity: newIdentityPos
        };
        this.fireEvent(event);
    }

    function suitCanProtect(target: Position, context: GameContext) {
        const suspect = context.arena.atPosition(target);

        const suit = GameHelper.findPlayer(Suit, this.context);

        return suspect.role !== suit
            && (isPlayerInRow(suit, context.arena, target.x) || isPlayerInColumn(suit, context.arena, target.y));
    }

    export function canvasAll(target: Position, context: GameContext): Player<any>[] {
        return canvas(target, context);
    }


    export function canvasMafioso(target: Position, context: GameContext): Mafioso<any>[] {
        return canvas(target, context, (suspect: Suspect) => suspect.role instanceof Mafioso) as Mafioso<any>[];
    }

    function canvas(target: Position, context: GameContext, predicate?: (suspect: Suspect) => boolean): Player<any>[] {
        const suspect = context.arena.atPosition(target);

        if (suspect.role !== 'suspect') {
            throw new Error("Illegal state");
        }

        suspect.role = 'innocent';

        const adjacentPlayers = GameHelper.getAdjacentPlayers(target, context, predicate);

        return adjacentPlayers;
    }

    export function peekNewIdentityFor(player: Player<any>, context: GameContext): Suspect {
        while (true) {
            const newIdentity = tryPeekNewIdentityFor(player, context);
            if (newIdentity) {
                return newIdentity;
            }
        }
    }

    export function tryPeekNewIdentityFor(player: Player<any>, context: GameContext): Suspect | undefined {
        const newIdentity = context.evidenceDeck.pop();
        if (!newIdentity) {
            throw new Error("hmmm"); // TODO: wtf state
        }

        if (newIdentity.role === 'killed') {
            return undefined;
        } else if (newIdentity.role === 'suspect') {
            newIdentity.role = player;
            return newIdentity;
        } else {
            throw new Error(`Illegal suspect role ${newIdentity.role}`);
        }
    }

    export function findPlayer(type: typeof Player, context: GameContext): Player<any> {
        return context.players.find(player => player instanceof type)!;
    }

    export function findSuit(context: GameContext): Suit<any> {
        return GameHelper.findPlayer(Suit, context) as Suit<any>;
    }

    export function findBomber(context: GameContext): Bomber<any> {
        return GameHelper.findPlayer(Bomber, context) as Bomber<any>;
    }

    export function findPsycho(context: GameContext): Psycho<any> {
        return GameHelper.findPlayer(Psycho, context) as Psycho<any>;
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
                suspect.removeMarker(marker);
            }
        }
    }
}

