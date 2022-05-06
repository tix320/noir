import { BehaviorSubject, concat, filter, identity, map, Observable, of, ReplaySubject } from 'rxjs';
import { swap } from '../util/ArrayUtils';
import { assert, AssertionError } from '../util/Assertions';
import { Direction } from '../util/Direction';
import Identifiable, { equals } from '../util/Identifiable';
import Matrix from '../util/Matrix';
import Position from '../util/Position';
import { shuffle } from '../util/RandUtils';
import { Character } from './Character';
import {
    Game, GameInitialState, Marker, Player as IPlayer, PlayerInfo, RoleSelection, Score, Suspect, Winner
} from './Game';
import { GameActions } from './GameActions';
import { GameEvents } from './GameEvents';
import { GameHelper } from './GameHelper';
import { Role } from './Role';
import { StandardSuspect } from './StandardSuspect';

export namespace StandardGame {

    export const ROLE_SETS = [
        new Set(Role.FOR_6_GAME),
        new Set(Role.FOR_8_GAME)
    ];

    export const MIN_PLAYER_COUNT = 6;
    export const MAX_PLAYER_COUNT = 8;

    export class Preparation<I extends Identifiable> implements Game.Preparation<I> {

        #participants: RoleSelection<I>[] = [];
        #participantsSubject = new BehaviorSubject<RoleSelection<I>[]>([]);
        #notStarted = true;

        getParticipants(): RoleSelection<I>[] {
            return this.#participantsSubject.value;
        }

        public join(identity: I) {
            this.assertNotStarted();
            assert(!this.#participants.find(p => equals(p.identity, identity)), 'Already joined');

            assert(this.#participants.length !== MAX_PLAYER_COUNT, 'Participants already full');

            this.#participants.push({ identity: identity, ready: false });
            this.emitParticipants();
        }

        public changeRole(participant: RoleSelection<I>) {
            this.assertNotStarted();

            const currentParticipant = this.#participants.removeFirstBy(p => equals(participant.identity, p.identity));
            assert(currentParticipant, `Participant ${participant.identity} not joined this game`);

            if (currentParticipant.role !== participant.role) {
                this.resetReadiness();
            }

            if (participant.role) {
                assert(!this.#participants.find(p => p.role === participant.role), `Role ${participant.role} already selected`);
            }

            this.#participants.push({ ...participant });
            this.emitParticipants();
        }

        public leave(identity: I) {
            this.assertNotStarted();

            const participant = this.#participants.removeFirstBy(p => equals(p.identity, identity));
            assert(participant, 'Not a participant');

            // reset ready states
            this.resetReadiness();
            this.emitParticipants();
        }

        public participantChanges(): Observable<RoleSelection<I>[]> {
            return this.#participantsSubject.asObservable();
        }

        public start(): Game.Play<I> | undefined {
            this.assertNotStarted();

            if (this.readyForGame()) {
                this.#participantsSubject.complete();
                return this.createGame();
            } else {
                return undefined;
            }
        }

        public isStarted(): boolean {
            return !this.#notStarted;
        }

        private assertNotStarted() {
            assert(this.#notStarted, "Game already started");
        }

        private emitParticipants() {
            this.#participantsSubject.next(this.#participants);
        }

        private resetReadiness() {
            this.#participants.forEach(p => p.ready = false);
        }

        private readyForGame(): boolean {
            if (this.readyCount !== this.#participants.length) {
                return false;
            }

            const roles = new Set(this.#participants.map(p => p.role!));

            return this.matchRoleSet(roles);
        }

        private get readyCount() {
            let readyCount = 0;
            this.#participants.forEach(p => {
                if (p.ready) {
                    readyCount++;
                }
            });

            return readyCount;
        }


        private matchRoleSet(roles: Set<Role>): boolean {
            return ROLE_SETS.some(set => set.equals(roles));
        }

        private createGame(): StandardGame.Play<I> {
            assert(this.#participants.length === 6 || this.#participants.length === 8, `Invalid players count ${this.#participants.length}`);

            const for6: boolean = this.#participants.length === 6;

            const arenaSize = for6 ? 6 : 7;

            const characters = Character.generateSet(arenaSize * arenaSize);
            shuffle(characters);

            let matrix: Character[][];

            if (for6) {
                matrix = [
                    characters.slice(0, 6),
                    characters.slice(6, 12),
                    characters.slice(12, 18),
                    characters.slice(18, 24),
                    characters.slice(24, 30),
                    characters.slice(30, 36),
                ]
            } else {
                matrix = [
                    characters.slice(0, 7),
                    characters.slice(7, 14),
                    characters.slice(14, 21),
                    characters.slice(21, 28),
                    characters.slice(28, 35),
                    characters.slice(35, 42),
                    characters.slice(42, 49),
                ]
            }

            shuffle(characters);

            const arena = new Matrix<Character>(matrix);

            const players: PlayerInfo<I>[] = this.#participants.map(participant => ({ identity: participant.identity, role: participant.role! }));
            this.resolvePlayersOrder(players);

            const initialState: GameInitialState<I> = {
                players: players,
                arena: arena,
                evidenceDeck: characters
            }

            return new StandardGame.Play(initialState);
        }

        private resolvePlayersOrder(players: PlayerInfo[]): void {
            const mafia: PlayerInfo[] = players.filter(p => p.role.team === 'MAFIA');
            const fbi: PlayerInfo[] = players.filter(p => p.role.team === 'FBI');

            shuffle(mafia);
            shuffle(fbi);

            const killerIndex = mafia.findIndex(player => player.role === Role.KILLER);
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

        #completed = new BehaviorSubject(false);

        #context: GameContext<I>;

        #events = new ReplaySubject<GameEvents.Any<I>>();
        #eventsCount = 0;

        #winningScores: Score;

        constructor(public readonly initialState: GameInitialState<I>) {
            const for6 = initialState.players.length === 6;

            this.#winningScores = for6 ? [18, 5] : [25, 6];

            const evidenceDeck = initialState.evidenceDeck.map(character => new StandardSuspect<I>(character));

            const arena = initialState.arena.map(character => evidenceDeck.find(suspect => equals(suspect.character, character))!);
            const context = new GameContext<I>(this, arena);
            this.#context = context;

            const players: Player<I>[] = this.initialState.players.map(playerInfo => this.createPlayerForRole(playerInfo.identity, playerInfo.role!, context));
            context.players = players;

            context.currentTurnPlayer = players[0];

            players.forEach(player => evidenceDeck.pop()!.role = player);
            const profilerEvidenceHand = for6 ? [] : evidenceDeck.splice(-4, 4);

            context.evidenceDeck = evidenceDeck;
            context.profiler.evidenceHand = profilerEvidenceHand;

            const gameStartedEvent: GameEvents.Started<I> = {
                type: 'GameStarted',
                players: [...context.players],
                arena: context.arena.clone(suspect => suspect.clone()),
                evidenceDeck: context.evidenceDeck.map(suspect => suspect.character),
                profilerHand: context.profiler.evidenceHand.map(suspect => suspect.character)
            }
            this.fireEvent(gameStartedEvent);

            Helper.fireTurnChangedEvent(context.currentTurnPlayer, context);
            context.currentTurnPlayer.initTurn();
        }

        public get players() {
            return [...this.#context.players];
        }

        public events(): Observable<GameEvents.Any<I>> {
            const hello: GameEvents.Hello = {
                type: 'Hello',
                readyEventsCount: this.#eventsCount
            }

            return concat(of(hello), this.#events.asObservable());
        }

        public forceComplete(): void {
            assert(!this.isCompleted, 'Already completed');

            const event: GameEvents.Aborted = {
                type: 'GameAborted'
            }

            this.fireEvent(event);
            this.complete();
        }

        public get isCompleted() {
            return this.#completed.value;
        }

        public onComplete(): Observable<void> {
            return this.#completed.asObservable().pipe(filter(completed => completed), map(() => { }));
        }

        checkWin(score: Score): Winner | undefined {
            if (score[0] >= this.#winningScores[0] && score[1] >= this.#winningScores[1]) {
                return 'DRAW';
            }

            if (score[0] >= this.#winningScores[0]) {
                return 'MAFIA';
            } else if (score[1] >= this.#winningScores[1]) {
                return 'FBI';
            } else {
                return undefined;
            }
        }

        complete() {
            this.#completed.next(true);
            this.#completed.complete();
            this.#events.complete();
        }

        fireEvent(event: GameEvents.Any<I>) {
            this.#events.next(event);
            this.#eventsCount++;
        }

        private createPlayerForRole(identity: I, role: Role, context: GameContext<I>): Player<I> {
            switch (role) {
                case Role.KILLER:
                    return new Killer(identity, context);
                case Role.PSYCHO:
                    return new Psycho(identity, context);
                case Role.BOMBER:
                    return new Bomber(identity, context);
                case Role.SNIPER:
                    return new Sniper(identity, context);
                case Role.UNDERCOVER:
                    return new Undercover(identity, context);
                case Role.DETECTIVE:
                    return new Detective(identity, context);
                case Role.SUIT:
                    return new Suit(identity, context);
                case Role.PROFILER:
                    return new Profiler(identity, context);
                default:
                    throw new AssertionError(`Unknown role ${role}`);
            }
        }
    }
}

abstract class Player<I extends Identifiable = Identifiable, A extends GameActions.Any = GameActions.Any> implements IPlayer<I, A> {
    public abstract readonly role: Role<A>;

    abstract readonly phases: readonly string[];
    readonly phaseHistory: number[] = [];
    #currentPhaseIndex: number = -1;

    constructor(public readonly identity: I, protected context: GameContext<I>) {
    }

    public doAction(action: A): Promise<void> {
        try {
            this.assertStateForAction();

            const thisAny = this as any;
            const actionFunc = thisAny[action.type] as Function;

            assert(actionFunc, `Action ${action.type} is invalid`);

            this.context.actionInProcess = action.type;
            actionFunc.call(this, action);
            this.context.actionInProcess = undefined;

            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public gameEvents(): Observable<GameEvents.Any<I>> {
        return this.context.game.events();
    }

    locate(): Position {
        return GameHelper.locatePlayer(this.context.arena, this);
    }

    getActionsAvailability(): Set<GameActions.Key<A>> {
        if (this.isMyTurn()) {
            const availableActions = this.getAvailableActions();

            const set = new Set<GameActions.Key<A>>(availableActions);

            const inActionPhase = this.getCurrentPhase() === 'ACTION';
            if (inActionPhase) {
                set.add('shift');
            }
            if (inActionPhase && GameHelper.getAvailableCollapseDirections(this.context.arena).isNonEmpty()) {
                set.add('collapse');
            }

            return set;
        }

        return new Set();
    }

    changePhase(phase: string, reaction?: boolean) {
        if (phase === 'END') {
            if (this.tryCompleteGame()) {
                return;
            }

            if (this.context.actionInProcess !== 'placeThreat' && this.context.actionInProcess !== 'shift') {
                this.context.lastShift = undefined;
            }

            const nextPlayer = this.getNextPlayer();
            this.context.currentTurnPlayer = nextPlayer;
            Helper.fireTurnChangedEvent(nextPlayer, this.context);
            nextPlayer.initTurn();
        } else {
            const index = this.phases.findIndex(p => p === phase);
            assert(index !== -1, `Invalid phase ${phase}`);

            this.phaseHistory.push(this.#currentPhaseIndex);
            this.#currentPhaseIndex = index;

            if (!reaction) {
                Helper.fireAvailableActionsChangedEvent(this, this.context);
            }
        }
    }

    abstract initTurn(): void;

    protected abstract getAvailableActions(): readonly GameActions.Key<A>[];

    protected shift(shift: GameActions.Common.Shift): void {
        this.assertPhase('ACTION');

        Helper.shift(shift, this, this.context);

        this.changePhase('END');
    }

    protected collapse(collapse: GameActions.Common.Collapse): void {
        this.assertPhase('ACTION');

        Helper.collapse(collapse.direction, this.context);

        this.changePhase('END');
    }

    protected getCurrentPhase(): string {
        return this.phases[this.#currentPhaseIndex];
    }

    protected assertPhase(phases: string) {
        assert(this.phases[this.#currentPhaseIndex] === phases, `Not in phase ${phases}`);
    }

    private tryCompleteGame(): boolean {
        const winner = this.context.game.checkWin(this.context.score);
        if (winner) {
            const event: GameEvents.Completed = { type: 'GameCompleted', winner: winner, score: [...this.context.score] };
            this.context.game.fireEvent(event);
            this.context.game.complete();

            return true;
        }

        return false;
    }

    private assertStateForAction() {
        assert(!this.context.game.isCompleted, "Game completed");

        assert(this.isMyTurn(), 'Not your turn');
    }

    private isMyTurn() {
        const reactions = this.context.reactions;
        if (reactions.length === 0) {
            if (this === this.context.currentTurnPlayer) {
                return true;
            };
        } else {
            const lastReactionOwner = reactions.at(-1)!;
            if (this === lastReactionOwner) {
                return true;
            }
        }

        return false;
    }

    private getNextPlayer(): Player<I> {
        const currentTurnPlayer = this.context.currentTurnPlayer;

        const nextPlayer: Player<I> = Helper.findNextPlayerOf(currentTurnPlayer, this.context);

        return nextPlayer;
    }
}

abstract class Mafioso<I extends Identifiable = Identifiable, A extends GameActions.Any = GameActions.Any> extends Player<I, A>  {

}

abstract class Agent<I extends Identifiable = Identifiable, A extends GameActions.Any = GameActions.Any> extends Player<I, A> {

    protected disarm(action: GameActions.Common.Disarm): void {
        const { target, marker } = action;

        assert(marker === Marker.BOMB || marker === Marker.THREAT, "You can remove bomb or threat markers");

        const arena = this.context.arena;

        assert(Helper.isAdjacentTo(this, target), `Invalid target=${arena.atPosition(target)}. You can remove marker on adjacent suspects`);

        const suspect = arena.atPosition(target);
        const deleted = suspect.removeMarker(marker);
        assert(deleted, `Target does not have marker ${marker}`);

        const event: GameEvents.Disarmed = { type: 'Disarmed', target: target, marker: marker };
        this.context.game.fireEvent(event);

        this.changePhase('END');
    }

    protected canDisarm(): boolean {
        const arena = this.context.arena;

        return GameHelper.getDisarmPositions(arena, this.locate()).isNonEmpty();
    }
}

class Killer<I extends Identifiable> extends Mafioso<I, GameActions.OfKiller>  {
    readonly role = Role.KILLER;
    readonly phases: readonly string[] = ['ACTION'];

    override initTurn(): void {
        this.changePhase('ACTION');
    }

    protected getAvailableActions() {
        const arena = this.context.arena;
        const position = this.locate();

        const suitableForKill = GameHelper.getKnifeKillPositions(arena, position);
        if (suitableForKill.isEmpty()) {
            return ['disguise'] as const;
        } else {
            return ['knifeKill', 'disguise'] as const;
        }
    }

    protected knifeKill(action: GameActions.Killer.Kill): void {
        const { target } = action;

        assert(Helper.isAdjacentTo(this, target), `You can kill only your adjacent suspects`);

        Helper.tryKillSuspect(target, this.context, 'KilledByKnife', this, () => {
            this.changePhase('END');
        });
    }

    protected disguise(): void {
        Helper.disguise(this, this.context);

        this.changePhase('END');
    }
}

class Psycho<I extends Identifiable> extends Mafioso<I, GameActions.OfPsycho> {
    readonly role = Role.PSYCHO;
    readonly phases: readonly string[] = ['ACTION', 'PLACE'];

    override initTurn(): void {
        const arena = this.context.arena;

        const threatPositions = GameHelper.getThreatKillPositions(arena, this.locate());

        const iterator = threatPositions[Symbol.iterator]();

        const handler = () => {
            let item = iterator.next();
            if (item.done) {
                this.changePhase('ACTION');
            } else {
                const target = item.value;
                Helper.tryKillSuspect(target, this.context, 'KilledByThreat', this, handler);
            }
        }

        handler();
    }

    protected getAvailableActions() {
        switch (this.getCurrentPhase()) {
            case 'ACTION':
                return ['swapSuspects'] as const;
            case 'PLACE':
                return ['placeThreat'] as const;
            default:
                throw new Error(`Invalid phase ${this.getCurrentPhase()}`);
        }
    }

    protected override shift(shift: GameActions.Common.Shift): void {
        this.assertPhase('ACTION');

        Helper.shift(shift, this, this.context);

        this.changeToPlacePhaseOrEnd();
    }

    protected override collapse(collapse: GameActions.Common.Collapse): void {
        this.assertPhase('ACTION');

        Helper.collapse(collapse.direction, this.context);

        this.changeToPlacePhaseOrEnd();
    }

    protected swapSuspects(action: GameActions.Psycho.SwapSuspects) {
        const { position1, position2 } = action;
        this.assertPhase('ACTION');

        assert(position1.isAdjacentTo(position2), "Non adjacent targets");

        const arena = this.context.arena;
        arena.swap(position1, position2);

        const event: GameEvents.SuspectsSwapped = {
            type: 'SuspectsSwapped',
            position1: position1,
            position2: position2
        };
        this.context.game.fireEvent(event);

        this.changeToPlacePhaseOrEnd();
    }

    protected placeThreat(action: GameActions.Psycho.PlaceThreat) {
        const { targets } = action;

        this.assertPhase('PLACE');

        assert(targets.isNonEmpty() && targets.length <= 3, "You can mark up to 3 suspects");

        if (targets.length === 2) {
            assert(!targets[0].equals(targets[1]), 'Non unique positions');
        } else if (targets.length === 3) {
            assert(!targets[0].equals(targets[1]), 'Non unique positions');
            assert(!targets[1].equals(targets[2]), 'Non unique positions');
            assert(!targets[0].equals(targets[2]), 'Non unique positions');
        }

        const suitablePositionsForPlace = GameHelper.getThreatPlacePositions(this.context.arena, this.locate());
        assert(suitablePositionsForPlace);

        assert(targets.every(position => suitablePositionsForPlace.some(pos => pos.equals(position))), "You can mark within 3 orthogonal spaces");

        const arena = this.context.arena;

        targets.forEach(position => arena.atPosition(position).addMarker(Marker.THREAT));

        const event: GameEvents.ThreatPlaced = {
            type: 'ThreatPlaced',
            targets: targets
        };
        this.context.game.fireEvent(event);

        this.changePhase('END');
    }

    private changeToPlacePhaseOrEnd() {
        const arena = this.context.arena;

        const canPlaceThreats = GameHelper.getThreatPlacePositions(arena, this.locate()).isNonEmpty();

        if (canPlaceThreats) {
            this.changePhase('PLACE');
        } else {
            this.changePhase('END');
        }
    }
}

class Bomber<I extends Identifiable> extends Mafioso<I, GameActions.OfBomber> {
    readonly role = Role.BOMBER;
    readonly phases: Readonly<string[]> = ['ACTION', 'SELF_DESTRUCT'];

    override initTurn(): void {
        this.changePhase('ACTION');
    }

    protected getAvailableActions() {
        switch (this.getCurrentPhase()) {
            case 'ACTION':
                const canPlaceBomb = GameHelper.getBombPlacePositions(this.context.arena, this.locate()).isNonEmpty();
                const canDetonateBomb = this.context.arena.count(suspect => suspect.hasMarker(Marker.BOMB)) !== 0;

                const actions: GameActions.Key<GameActions.OfBomber>[] = [];
                if (canPlaceBomb) {
                    actions.push('placeBomb');
                }

                if (canDetonateBomb) {
                    actions.push('detonateBomb');
                }

                return actions;
            case 'SELF_DESTRUCT':
                return ['selfDestruct'] as const;
            default:
                throw new Error(`Invalid phase ${this.getCurrentPhase()}`);
        }
    }

    enableReaction(context: SelfDestructContext) {
        this.context.bomber.selfDestruct = context;
        this.context.reactions.push(this);

        const event: GameEvents.SelfDestructionActivated = {
            type: 'SelfDestructionActivated',
            target: context.target
        }
        this.context.game.fireEvent(event);

        this.changePhase('SELF_DESTRUCT', true);
    }

    protected placeBomb(action: GameActions.Bomber.PlaceBomb) {
        this.assertPhase('ACTION');

        const { target } = action;

        const arena = this.context.arena;
        const targetSuspect = arena.atPosition(target);

        const isValidTarget = targetSuspect.role === this || Helper.isAdjacentTo(this, target);
        assert(isValidTarget, `Invalid target=${arena.atPosition(target)}. You can place bomb only on yourself or adjacent suspects`);

        assert(!targetSuspect.hasMarker(Marker.BOMB), 'Target already has bomb');

        targetSuspect.addMarker(Marker.BOMB);

        const event: GameEvents.BombPlaced = {
            type: 'BombPlaced',
            target: target
        };
        this.context.game.fireEvent(event);

        this.changePhase('END');

    }

    protected detonateBomb(action: GameActions.Bomber.DetonateBomb) {
        this.assertPhase('ACTION');

        const { chain } = action;
        assert(chain.isNonEmpty(), 'Empty chain');

        this._detonate(chain, () => this.changePhase('END'));
    }

    protected selfDestruct(action: GameActions.Bomber.SelfDestruct) {
        this.assertPhase('SELF_DESTRUCT');
        assert(this.context.bomber.selfDestruct, 'Invalid state');

        const { chain } = action;
        const selfTarget = this.context.bomber.selfDestruct.target;
        if (chain.isEmpty() || !chain[0].equals(selfTarget)) {
            chain.unshift(selfTarget);
        }

        this._detonate(chain, () => {
            const onReactionEnd = this.context.bomber.selfDestruct!.onReactionEnd;

            this.context.bomber.selfDestruct = undefined;
            Helper.cleanupOnReactionEnd(this, this.context);
            onReactionEnd();
        });
    }

    private _detonate(chain: Position[], onComplete: () => void): void {
        const positionsSet = new Set();
        chain.forEach(pos => positionsSet.add(pos.toString()));
        assert(positionsSet.size === chain.length, 'Non unique targets');

        const arena = this.context.arena;

        for (let i = 1; i < chain.length; i++) {
            const target = chain[i];
            const previous = chain[i - 1];

            assert(target.isAdjacentTo(previous), `Non adjacent targets ${chain}`);
            assert(arena.atPosition(previous).hasMarker(Marker.BOMB), `Target ${previous} does not have bomb marker`);
        }

        const lastTarget = arena.atPosition(chain.at(-1)!);
        if (!lastTarget.hasMarker(Marker.BOMB)) {
            assert(lastTarget.isAlive(), 'Last target must be alive, when does not have a bomb');
        }

        const iterator = chain[Symbol.iterator]();

        const handler = () => {
            let item = iterator.next();
            if (item.done) {
                onComplete();
            } else {
                const target = item.value;
                const suspect = arena.atPosition(target);
                suspect.removeMarker(Marker.BOMB);

                const event: GameEvents.BombDetonated = {
                    type: 'BombDetonated',
                    target: target
                }
                this.context.game.fireEvent(event);

                if (suspect.isAlive()) {
                    Helper.tryKillSuspect(target, this.context, 'KilledByBomb', this, (isProtect) => {
                        if (isProtect) {
                            onComplete();
                        } else {
                            handler();
                        }
                    });
                } else {
                    handler();
                }
            }
        }

        handler();
    }
}

interface BomberContext {
    selfDestruct?: SelfDestructContext;
}

type SelfDestructEndHandler = () => void;

interface SelfDestructContext {
    target: Position;
    onReactionEnd: SelfDestructEndHandler;
}

class Sniper<I extends Identifiable> extends Mafioso<I, GameActions.OfSniper>{
    readonly role = Role.SNIPER;
    readonly phases: Readonly<string[]> = ['ACTION'];

    override initTurn(): void {
        this.changePhase('ACTION');
    }

    protected getAvailableActions() {
        const arena = this.context.arena;

        const canKill = GameHelper.geSnipeKillPositions(arena, this.locate()).isNonEmpty();
        const canSetup = GameHelper.getMovableMarkerPositions(arena).isNonEmpty();

        const actions: GameActions.Key<GameActions.OfSniper>[] = [];
        if (canKill) {
            actions.push('snipeKill');
        }
        if (canSetup) {
            actions.push('setup');
        }

        return actions;
    }

    protected snipeKill(action: GameActions.Sniper.Kill) {
        const { target } = action;

        const arena = this.context.arena;
        const validSniperPositions = arena.getDiagonalPositions(target, 3);

        assert(validSniperPositions.some(pos => arena.atPosition(pos).role === this),
            `Invalid target=${arena.atPosition(target)}. You can kill only suspects 3 spaces away from you in diagonal line`);


        Helper.tryKillSuspect(target, this.context, 'KilledBySniper', this, () => {
            this.changePhase('END');
        });
    }

    protected setup(action: GameActions.Sniper.Setup) {
        const { from, to, marker } = action;

        assert(from.isAdjacentTo(to), 'Non adjacent suspects');

        const arena = this.context.arena;

        const fromSuspect = arena.atPosition(from);
        const toSuspect = arena.atPosition(to);

        assert(fromSuspect.hasMarker(marker), `Suspect does not have marker ${marker}`);
        assert(!toSuspect.hasMarker(marker), `Suspect already have marker ${marker}`);

        assert(marker === Marker.BOMB || toSuspect.isAlive(), 'You cannot move threat or protection marker to non alive suspect');

        fromSuspect.removeMarker(marker);
        toSuspect.addMarker(marker);

        const event: GameEvents.MarkerMoved = {
            type: 'MarkerMoved',
            from: from,
            to: to,
            marker: marker
        }
        this.context.game.fireEvent(event);

        this.changePhase('END');
    }
}

class Undercover<I extends Identifiable> extends Agent<I, GameActions.OfUndercover>  {
    readonly role = Role.UNDERCOVER;
    readonly phases: Readonly<string[]> = ['ACTION'];

    override initTurn(): void {
        this.changePhase('ACTION');
    }

    protected getAvailableActions() {
        const actions: GameActions.Key<GameActions.OfUndercover>[] = ['disguise'];
        if (this.canDisarm()) {
            actions.push('disarm');
        }

        const arena = this.context.arena;

        const canAccuse = GameHelper.getAccusePositions(arena, this.locate()).isNonEmpty();
        const canAutopsy = GameHelper.getAutopsyPositions(arena, this.locate()).isNonEmpty();

        if (canAccuse) {
            actions.push('accuse');
        }
        if (canAutopsy) {
            actions.push('autopsy');
        }

        return actions;
    }

    protected accuse(action: GameActions.Common.Accuse): void {
        const { target, mafioso } = action;

        const arena = this.context.arena;
        const suspect = arena.atPosition(target);

        assert(suspect.role === this || Helper.isAdjacentTo(this, target), `You can accuse yourself or your adjacent suspects`);

        Helper.accuse(target, mafioso, this.context, () => {
            this.changePhase('END');
        });
    }

    protected disguise() {
        Helper.disguise(this, this.context);

        this.changePhase('END');
    }

    protected autopsy(action: GameActions.Undercover.Autopsy) {
        const { target } = action;

        assert(Helper.isAdjacentTo(this, target), 'Not adjacent target');

        const suspect = this.context.arena.atPosition(target);

        assert(suspect.role === 'killed', "Target must be killed");

        const mafiosi = Helper.getAdjacentMafiosi(target, this.context);

        const event: GameEvents.AutopsyCanvased<Identifiable> = {
            type: 'AutopsyCanvased',
            target: target,
            mafiosi: mafiosi.map(m => m.identity)
        }
        this.context.game.fireEvent(event);

        this.changePhase('END');
    }
}

class Detective<I extends Identifiable> extends Agent<I, GameActions.OfDetective> {
    readonly role = Role.DETECTIVE;
    readonly phases: Readonly<string[]> = ['ACTION', 'CANVAS'];

    override initTurn(): void {
        this.changePhase('ACTION');
    }

    protected getAvailableActions() {
        switch (this.getCurrentPhase()) {
            case 'ACTION':
                const arena = this.context.arena;

                const actions: GameActions.Key<GameActions.OfDetective>[] = ['pickInnocentsForCanvas'];

                if (this.canDisarm()) {
                    actions.push('disarm');
                }

                const canAccuse = GameHelper.getFarAccusePositions(arena, this.locate()).isNonEmpty();

                if (canAccuse) {
                    actions.push('farAccuse');
                }

                return actions;
            case 'CANVAS':
                return ['canvas'] as const;
            default:
                throw new Error(`Invalid phase ${this.getCurrentPhase()}`);
        }
    }

    protected farAccuse(action: GameActions.Detective.FarAccuse) {
        this.assertPhase('ACTION');

        const { target, mafioso } = action;

        const arena = this.context.arena;
        const suspect = arena.atPosition(target);

        assert(suspect.role === this || arena.getOrthogonalPositions(target, 3).some(ps => arena.atPosition(ps).role === this),
            `You can accuse yourself or within 3 spaces orthogonally`);

        Helper.accuse(target, mafioso, this.context, () => {
            this.changePhase('END');
        });
    }

    protected pickInnocentsForCanvas() {
        this.assertPhase('ACTION');

        const first = this.context.evidenceDeck.pop()!;
        const second = this.context.evidenceDeck.pop()!;

        const suspects: StandardSuspect<I>[] = [first, second];

        let success = false;

        if (first.isAlive()) {
            success = true;
        } else {
            this.context.evidenceDeck.unshift(first);
        }
        if (second.isAlive()) {
            success = true;
        } else {
            this.context.evidenceDeck.unshift(second);
        }

        const event: GameEvents.InnocentsForCanvasPicked = {
            type: 'InnocentsForCanvasPicked',
            suspects: suspects.map(s => s.character)
        }
        this.context.game.fireEvent(event);

        if (success) {
            this.context.detective.canvas = suspects;
            this.changePhase('CANVAS');
        } else {
            this.changePhase('END');
        }
    }

    protected canvas(action: GameActions.Detective.Canvas) {
        const { character } = action;

        this.assertPhase('CANVAS');

        const canvas = this.context.detective.canvas;
        assert(canvas);

        const suspect = canvas.find(suspect => equals(suspect.character, character));
        assert(suspect, `Invalid character ${character}`);
        assert(suspect.isAlive(), `${suspect} not alive`);

        const position = Helper.findSuspectInArena(suspect, this.context);

        const adjacentPlayers = Helper.canvas(position, this.context, true);

        const secondCardToDrop = canvas.find(s => s !== suspect);
        if (secondCardToDrop) {
            this.context.evidenceDeck.unshift(secondCardToDrop);
        }

        const event: GameEvents.AllCanvased<Identifiable> = {
            type: 'AllCanvased',
            target: position,
            players: adjacentPlayers.map(p => p.identity)
        }
        this.context.game.fireEvent(event);

        this.changePhase('END');
    }
}

class DetectiveContext<I extends Identifiable> {
    canvas?: StandardSuspect<I>[];
}

class Suit<I extends Identifiable> extends Agent<I, GameActions.OfSuit>  {
    readonly role = Role.SUIT;
    readonly phases: readonly string[] = ['MARKER', 'ACTION', 'PROTECTION'];

    override initTurn(): void {
        this.changePhase('MARKER');
    }

    protected getAvailableActions() {
        const arena = this.context.arena;

        switch (this.getCurrentPhase()) {
            case 'MARKER':
                const protectionsCount = arena.count(suspect => suspect.hasMarker(Marker.PROTECTION));
                switch (protectionsCount) {
                    case 0:
                        return ['placeProtection'] as const;
                    case 6:
                        return ['removeProtection'] as const;
                    default:
                        return ['placeProtection', 'removeProtection'] as const;
                }
            case 'ACTION':
                const actions: GameActions.Key<GameActions.OfSuit>[] = [];
                if (this.canDisarm()) {
                    actions.push('disarm');
                }

                const canAccuse = GameHelper.getAccusePositions(arena, this.locate()).isNonEmpty();

                if (canAccuse) {
                    actions.push('accuse');
                }

                return actions;
            case 'PROTECTION':
                return ['decideProtect'] as const;
            default:
                throw new Error(`Invalid phase ${this.getCurrentPhase()}`);
        }
    }

    enableReaction(context: ProtectionContext) {
        this.context.suit.protection = context;
        this.context.reactions.push(this);

        const event: GameEvents.ProtectionActivated = {
            type: 'ProtectionActivated',
            target: context.target,
            trigger: context.trigger.role
        }
        this.context.game.fireEvent(event);

        this.changePhase('PROTECTION', true);
    }

    protected placeProtection(action: GameActions.Suit.PlaceProtection) {
        this.assertPhase('MARKER');

        const { target } = action;

        const arena = this.context.arena;
        const protectionsCount = arena.count(suspect => suspect.hasMarker(Marker.PROTECTION));
        if (protectionsCount === 6) {
            throw new Error("You may not have more than 6 protections in play at a time.");
        };

        const suspect = arena.atPosition(target);

        assert(suspect.isAlive(), 'You can place protection on alive suspect');
        assert(!suspect.hasMarker(Marker.PROTECTION), "Suspect already have protection marker");

        suspect.addMarker(Marker.PROTECTION);

        const event: GameEvents.ProtectionPlaced = { type: 'ProtectionPlaced', target: target };
        this.context.game.fireEvent(event);

        this.changePhase('ACTION');
    }

    protected removeProtection(action: GameActions.Suit.RemoveProtection) {
        const { target } = action;

        this.assertPhase('MARKER');

        const arena = this.context.arena;

        const suspect = arena.atPosition(target);

        assert(suspect.removeMarker(Marker.PROTECTION), "Suspect does not have protection marker");

        const event: GameEvents.ProtectionRemoved = { type: 'ProtectionRemoved', target: target };
        this.context.game.fireEvent(event);

        this.changePhase('ACTION');
    }

    protected accuse(action: GameActions.Common.Accuse): void {
        this.assertPhase('ACTION');

        const { target, mafioso } = action;

        const arena = this.context.arena;
        const suspect = arena.atPosition(target);
        assert(suspect.role === this || Helper.isAdjacentTo(this, target), `You can accuse yourself or your adjacent suspects`);

        Helper.accuse(target, mafioso, this.context, () => {
            this.changePhase('END');
        });
    }

    protected decideProtect(action: GameActions.Suit.DecideProtect): void {
        this.assertPhase('PROTECTION');

        const { protect } = action;

        const protectionContext = this.context.suit.protection;
        assert(protectionContext, "There are no protection context");

        const arena = this.context.arena;
        assert(!protect || GameHelper.canProtect(this.locate(), protectionContext.target),
            "You cannot protect from your position");

        const triggerMarker = protectionContext.trigger.role.ownMarker;

        if (protect) {
            const suspect = arena.atPosition(protectionContext.target);
            suspect.removeMarker(Marker.PROTECTION);
            if (triggerMarker) {
                suspect.removeMarker(triggerMarker);
            }
        }

        const event: GameEvents.ProtectDecided = {
            type: 'ProtectDecided',
            target: protectionContext.target,
            protect: protect,
            trigger: protectionContext.trigger.role
        };
        this.context.game.fireEvent(event);

        this.context.suit.protection = undefined;
        Helper.cleanupOnReactionEnd(this, this.context);
        protectionContext.onReactionEnd(protect);
    }
}

interface SuitContext {
    protection?: ProtectionContext;
}

type ProtectionEndHandler = (isProtected: boolean) => void;

interface ProtectionContext {
    target: Position;
    trigger: Player,
    onReactionEnd: ProtectionEndHandler;
}

class Profiler<I extends Identifiable> extends Agent<I, GameActions.OfProfiler>  {
    readonly role = Role.PROFILER;
    readonly phases: Readonly<string[]> = ['ACTION'];

    override initTurn(): void {
        this.changePhase('ACTION');
    }

    protected getAvailableActions() {
        const actions: GameActions.Key<GameActions.OfProfiler>[] = [];

        if (this.canDisarm()) {
            actions.push('disarm');
        }

        const arena = this.context.arena;

        const canAccuse = GameHelper.getAccusePositions(arena, this.locate()).isNonEmpty();
        const canProfile = this.context.profiler.evidenceHand.some(suspect => suspect.isAlive());

        if (canAccuse) {
            actions.push('accuse');
        }

        if (canProfile) {
            actions.push('profile');
        }

        return actions;
    }

    protected accuse(action: GameActions.Common.Accuse): void {
        const { target, mafioso } = action;

        const arena = this.context.arena;
        const suspect = arena.atPosition(target);
        assert(suspect.role === this || Helper.isAdjacentTo(this, target), `You can accuse yourself or your adjacent suspects`);

        Helper.accuse(target, mafioso, this.context, () => {
            this.changePhase('END');
        });
    }

    protected profile(action: GameActions.Profiler.Profile): void {
        const { character } = action;

        const hand = this.context.profiler.evidenceHand;

        const arena = this.context.arena;
        const suspect = hand.find(s => equals(s.character, character));

        assert(suspect, `Invalid character ${character}`);
        assert(suspect.isAlive(), 'Suspect not alive');

        const position = Helper.findSuspectInArena(suspect, this.context);

        const mafiosi = Helper.canvas(position, this.context, false);

        const newHand = hand.filter(suspect => suspect.role !== 'killed');
        newHand.removeFirst(suspect);

        const newHandCount = 4 - newHand.length;
        const newSuspects = this.context.evidenceDeck.splice(-newHandCount, newHandCount);
        newHand.push(...newSuspects);

        this.context.profiler.evidenceHand = newHand;

        const event: GameEvents.Profiled<Identifiable> =
        {
            type: 'Profiled',
            target: position,
            mafiosi: mafiosi.map(m => m.identity),
            newHand: newHand.map(suspect => suspect.character)
        };
        this.context.game.fireEvent(event);

        this.changePhase('END');
    }
}

interface ProfilerContext<I extends Identifiable> {
    evidenceHand: StandardSuspect<I>[];
}

class GameContext<I extends Identifiable = Identifiable> {
    game: StandardGame.Play<I>;

    arena: Matrix<StandardSuspect<I>>;

    players: Player<I>[];
    currentTurnPlayer: Player<I>;

    actionInProcess?: GameActions.Key;

    reactions: Player<I>[];

    evidenceDeck: StandardSuspect<I>[];

    lastShift?: GameActions.Common.Shift;

    bomber: BomberContext;
    detective: DetectiveContext<I>;
    suit: SuitContext;
    profiler: ProfilerContext<I>;

    score: Score;

    constructor(game: StandardGame.Play<I>, arena: Matrix<StandardSuspect<I>>) {
        this.game = game;
        this.arena = arena;
        this.players = undefined as any;
        this.currentTurnPlayer = undefined as any;
        this.reactions = [];
        this.evidenceDeck = undefined as any;
        this.bomber = {};
        this.detective = {};
        this.suit = {};
        this.profiler = { evidenceHand: undefined as any };
        this.score = [0, 0];
    }
}

namespace Helper {

    export function findNextPlayerOf(player: Player, context: GameContext): Player<any> {
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

    export function isAdjacentTo(player: Player, position: Position): boolean {
        const playerPosition = player.locate();

        return playerPosition.isAdjacentTo(position);
    }

    export function getAdjacentPlayers(position: Position, context: GameContext): Player[] {
        return context.players.filter(mafioso => Helper.isAdjacentTo(mafioso, position));
    }

    export function getAdjacentMafiosi(position: Position, context: GameContext): Mafioso[] {
        return context.players.filter(player => player instanceof Mafioso).filter(mafioso => Helper.isAdjacentTo(mafioso, position));
    }

    export function shift(shift: GameActions.Common.Shift, actor: Player, context: GameContext) {
        assert(actor.role.canDoFastShift || !shift.fast, "You cannot do fast shift");

        assert(!context.lastShift || !GameHelper.isReverseShifts(shift, context.lastShift), "Cannot undo last shift");

        const arena = context.arena;
        arena.shift(shift.direction, shift.index, shift.fast ? 2 : 1);

        context.lastShift = shift;

        const event: GameEvents.Shifted = { type: 'Shifted', direction: shift.direction, index: shift.index, fast: shift.fast };
        context.game.fireEvent(event);
    }

    export function collapse(direction: Direction, context: GameContext) {
        const newArena = GameHelper.collapse(context.arena, direction);
        context.arena = newArena as Matrix<StandardSuspect>;

        const event: GameEvents.Collapsed = { type: 'Collapsed', direction: direction };
        context.game.fireEvent(event);
    }


    export function tryKillSuspect(target: Position, context: GameContext, killEventType: GameEvents.Kills['type'], killer: Player, onProtectionEnd: ProtectionEndHandler): void {
        const suspect = context.arena.atPosition(target);
        suspect.assertAlive();

        const handler = (isProtected: boolean) => {
            if (!isProtected) {
                killSuspect(target, context, killEventType);
            }

            onProtectionEnd?.(isProtected);
        }

        if (suspect.hasMarker(Marker.PROTECTION)) {
            const suit = findSuit(context);
            suit.enableReaction({ target: target, trigger: killer, onReactionEnd: handler })
        } else {
            handler(false);
        }
    }

    function killSuspect(target: Position, context: GameContext, killEventType: GameEvents.Kills['type']): void {
        const suspect = context.arena.atPosition(target);

        const suspectRole = suspect.role;
        suspect.assertAlive();

        if (suspectRole instanceof Mafioso) {
            arrestMafioso(target, context);
        } else {
            suspect.role = 'killed';

            let event: GameEvents.Kills;
            if (suspectRole instanceof Agent) {
                context.score[0] += 2;

                const newFbiIdentity = peekNewIdentityFor(suspectRole, context);

                event = { type: killEventType, killed: target, newFbiIdentity: Helper.findSuspectInArena(newFbiIdentity, context) };
            } else {
                context.score[0] += 1;
                event = { type: killEventType, killed: target };
            }

            context.game.fireEvent(event);
        }
    }

    export function accuse(target: Position, mafiosoRole: Role, context: GameContext, onEnd: SelfDestructEndHandler) {
        const suspect = context.arena.atPosition(target);

        suspect.assertPlayerOrSuspect();

        const mafioso = GameHelper.findPlayerByRole(context.players, mafiosoRole);
        assert(mafioso instanceof Mafioso, 'Not a mafioso');

        const accuseEvent: GameEvents.Accused = {
            type: 'Accused',
            target: target,
            mafioso: mafiosoRole
        };
        context.game.fireEvent(accuseEvent);


        if (suspect.role === 'suspect' || suspect.role !== mafioso) {
            const event: GameEvents.UnsuccessfulAccused = { type: 'UnsuccessfulAccused', target: target, mafioso: mafioso!.role };
            context.game.fireEvent(event);
            onEnd?.();
        }
        else {
            if (suspect.hasMarker(Marker.BOMB)) {
                const bomber = findBomber(context);
                bomber.enableReaction({
                    target: target,
                    onReactionEnd: () => {
                        if (context.arena.atPosition(target).role instanceof Mafioso) { // maybe suit protected him from self destruct, so arrest anyway
                            arrestMafioso(target, context);
                        }

                        onEnd?.();
                    }
                });
            } else {
                arrestMafioso(target, context);
                onEnd?.();
            }
        }
    }

    function arrestMafioso(target: Position, context: GameContext): void {
        const suspect = context.arena.atPosition(target);
        if (!(suspect.role instanceof Mafioso)) {
            throw new Error("Only mafioso can be arrested");
        }

        const suspectRole = suspect.role;

        suspect.role = 'arrested';

        context.score[1] += 1;

        const ownMarker = suspectRole.role.ownMarker;
        if (ownMarker) {
            context.arena.foreach((suspect) => suspect.removeMarker(ownMarker));
        }

        const newIdentity = peekNewIdentityFor(suspectRole, context);

        const newMafiosiPos = Helper.findSuspectInArena(newIdentity, context);

        const event: GameEvents.Arrested = { type: 'Arrested', arrested: target, newMafiosoIdentity: newMafiosiPos };
        context.game.fireEvent(event);
    }

    export function disguise(player: Killer<any> | Undercover<any>, context: GameContext) {
        const oldIdentity = GameHelper.locatePlayer(context.arena, player);

        const newIdentity = tryPeekNewIdentityFor(player, context);

        let newIdentityPos: Position | undefined = undefined;

        if (newIdentity) {
            context.arena.atPosition(oldIdentity).role = 'innocent';
            newIdentityPos = findSuspectInArena(newIdentity, context);
        }

        const event: GameEvents.Disguised = {
            type: 'Disguised',
            oldIdentity: oldIdentity,
            newIdentity: newIdentityPos
        };

        context.game.fireEvent(event);
    }

    export function canvas(target: Position, context: GameContext, includeFbi: boolean): Player[] {
        const suspect = context.arena.atPosition(target);

        assert(suspect.role === 'suspect');

        suspect.role = 'innocent';

        const adjacentPlayers = includeFbi ? Helper.getAdjacentPlayers(target, context) : Helper.getAdjacentMafiosi(target, context);

        return adjacentPlayers;
    }

    export function peekNewIdentityFor(player: Player, context: GameContext): StandardSuspect {
        while (true) {
            const newIdentity = tryPeekNewIdentityFor(player, context);
            if (newIdentity) {
                return newIdentity;
            }
        }
    }

    export function tryPeekNewIdentityFor(player: Player, context: GameContext): StandardSuspect | undefined {
        const newIdentity = context.evidenceDeck.pop();
        if (!newIdentity) {
            throw new Error("Illegal state, evidence deck is empty");
        }

        if (newIdentity.role === 'killed') {
            context.evidenceDeck.unshift(newIdentity);
            return undefined;
        } else if (newIdentity.role === 'suspect') {
            newIdentity.role = player;
            return newIdentity;
        } else {
            throw new Error(`Illegal suspect role ${newIdentity.role}`);
        }
    }

    export function findPlayer(type: typeof Player, context: GameContext): Player {
        const player = context.players.find(player => player instanceof type);
        assert(player);
        return player;
    }

    export function findSuit(context: GameContext): Suit<any> {
        return Helper.findPlayer(Suit as any, context) as Suit<any>;
    }

    export function findBomber(context: GameContext): Bomber<any> {
        return Helper.findPlayer(Bomber as any, context) as Bomber<any>;
    }

    export function findSuspectInArena(suspect: StandardSuspect, context: GameContext): Position {
        const res = context.arena.findFirst(s => s === suspect);
        assert(res, `${suspect} not found in arena`);
        return res[1];
    }

    export function findCharacterInArena(character: Character, context: GameContext): Position {
        const res = context.arena.findFirst(s => equals(s.character, character));
        assert(res, 'Invalid state');
        return res[1];
    }

    export function cleanupOnReactionEnd(player: Player, context: GameContext) {
        context.reactions.pop();
    }

    export function fireTurnChangedEvent<I extends Identifiable>(player: Player<I>, context: GameContext) {
        const turnChangedEvent: GameEvents.TurnChanged<I> = {
            type: 'TurnChanged',
            player: player.identity,
            score: context.score,
            lastShift: context.lastShift
        }

        context.game.fireEvent(turnChangedEvent);
    }

    export function fireAvailableActionsChangedEvent<I extends Identifiable>(player: Player<I>, context: GameContext) {
        const event: GameEvents.AvailableActionsChanged = {
            type: 'AvailableActionsChanged',
            actions: player.getActionsAvailability(),
        }

        context.game.fireEvent(event);
    }
}

