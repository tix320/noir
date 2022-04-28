import { onFirst } from '@tix320/noir-core/src/extension/RxJSExtension';
import { Game, Marker, Player, Score, ShiftAction, Suspect } from '@tix320/noir-core/src/game/Game';
import { GameActions } from '@tix320/noir-core/src/game/GameActions';
import { GameEvents } from '@tix320/noir-core/src/game/GameEvents';
import { GameEventVisitor, visitEvent } from "@tix320/noir-core/src/game/GameEventVisitor";
import { GameHelper } from '@tix320/noir-core/src/game/GameHelper';
import { Role } from '@tix320/noir-core/src/game/Role';
import { StandardSuspect } from '@tix320/noir-core/src/game/StandardSuspect';
import { assert, AssertionError } from '@tix320/noir-core/src/util/Assertions';
import { Direction } from '@tix320/noir-core/src/util/Direction';
import { equals } from '@tix320/noir-core/src/util/Identifiable';
import Matrix from '@tix320/noir-core/src/util/Matrix';
import Position from '@tix320/noir-core/src/util/Position';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { toast, ToastContent, ToastOptions, Zoom } from 'react-toastify';
import User from '../../../entity/User';
import RoleCardComponent from '../cards/role/RoleCardComponent';
import SuspectCard from '../cards/suspect/SuspectCardComponent';
import { useForceUpdate, useServerConnectedEffect } from '../common/Hooks';
import DirectionButton from '../util/DirectionButtonComponent';
import ActionDialog from './action-dialog/ActionDialogComponent';
import ActionsPanel, { ActionAvailability } from './actions/ActionsPanelComponent';
import ArenaComponent from './arena/ArenaComponent';
import styles from './GameComponent.module.css';
import TeamPlayersPanel from './TeamPlayersPanelComponent';

type Props = {
    className?: string,
    game: Game.Play<User>,
    identity: User
}

function useRefState<S>(defaultValue: S) {
    const ref = useRef<S>(defaultValue);

    if (ref.current === undefined) {
        ref.current = defaultValue;
    }

    const setValue = (value: S) => {
        ref.current = value;
    }

    return [ref, setValue] as const;
}

export default function GameComponent(props: Props) {
    const { game } = props;

    const [eventUIChangeSkipCount, setEventUIChangeSkipCount] = useRefState<number>(0);

    const [playersRef, setPlayers] = useRefState<Player<User>[]>([]);
    const [myPlayerRef, setMyPlayer] = useRefState<Player<User> | undefined>(undefined);
    const [currentTurnPlayerRef, setCurrentTurnPlayer] = useRefState<Player<User> | undefined>(undefined);
    const [performingActionRef, setPerformingAction] = useRefState<PerformingAction | undefined>(undefined);
    const [performingEventRef, setPerformingEvent] = useRefState<PerformingEvent | undefined>(undefined);

    const [arenaRef, setArena] = useRefState<Matrix<StandardSuspect>>(new Matrix([]));
    const [profilerHandRef, setProfilerHand] = useRefState<StandardSuspect[]>([]);
    const [lastShiftRef, setLastShift] = useRefState<ShiftAction | undefined>(undefined);

    const [actionsEnabledRef, setActionsEnabled] = useRefState<boolean>(false);
    const [actionsAvailabilityRef, setActionsAvailability] = useRefState<ActionAvailability[]>([]);

    const [fastShiftRef, setFastShift] = useRefState<boolean>(false);

    const [teamPlayersRef, setTeamPlayers] = useRefState<[Player<User>[], Player<User>[]]>([[], []]);

    const [score, setScore] = useRefState<Score>([0, 0]);

    function resetState() {
        eventUIChangeSkipCount.current = 0;
        playersRef.current = [];
        myPlayerRef.current = undefined;
        currentTurnPlayerRef.current = undefined;
        performingActionRef.current = undefined;
        performingEventRef.current = undefined;
        arenaRef.current = new Matrix([]);
        profilerHandRef.current = [];
        lastShiftRef.current = undefined;
        actionsEnabledRef.current = false;
        actionsAvailabilityRef.current = [];
        fastShiftRef.current = false;
        teamPlayersRef.current = [[], []];
        score.current = [0, 0];
    };

    function getMyPosition() {
        assert(myPlayerRef.current);
        const res = arenaRef.current.findFirst((sus => sus.role === myPlayerRef.current));
        assert(res);
        return res[1];
    }

    const forceUpdate = useForceUpdate();
    const [t] = useTranslation();

    function onKeyDown(event: KeyboardEvent) {
        if (event.code === 'KeyP') {
            if (performingActionRef.current?.key === 'profile') {
                setPerformingAction(undefined);
            } else {
                setPerformingAction({
                    key: 'profile'
                });
            }
            forceUpdate();
        } else if (event.code === 'KeyS') {
            if (GameHelper.canDoFastShift(myPlayerRef.current!))  {
                setFastShift(!fastShiftRef.current);
                forceUpdate();
            }
        }
    }

    useServerConnectedEffect(() => {
        const eventsQueue: GameEvents.Any<User>[] = [];

        let stopListener = false;

        const scheduleEventProcessor = (delaySeconds: number) => {
            if (stopListener) {
                return;
            }
            return setTimeout(() => {
                const event = eventsQueue.shift();
                if (event) {
                    const toastData = processEvent(event);
                    if (toastData) {
                        toast(toastData[0], {
                            ...toastData[1],
                            position: 'bottom-right',
                            theme: 'dark',
                            transition: Zoom,
                            pauseOnFocusLoss: false,

                        });
                    }
                    forceUpdate();
                    scheduleEventProcessor(2);
                } else {
                    scheduleEventProcessor(1);
                }
            }, delaySeconds * 1000);
        }

        const subscription = game.events().pipe(
            onFirst((event: GameEvents.Hello) => {
                if (event.readyEventsCount !== 0) {
                    setEventUIChangeSkipCount(event.readyEventsCount);
                }
            })).subscribe(event => {
                if (eventUIChangeSkipCount.current === 0) {
                    eventsQueue.push(event);
                } else {
                    eventUIChangeSkipCount.current--;
                    processEvent(event);
                    if (eventUIChangeSkipCount.current === 0) {
                        setPerformingEvent(undefined);
                        forceUpdate();
                    }
                }
            });

        const keyDownListener = (event: KeyboardEvent) => {
            onKeyDown(event);
        };

        document.addEventListener('keydown', keyDownListener);

        scheduleEventProcessor(1);

        return () => {
            stopListener = true;
            subscription.unsubscribe();
            document.removeEventListener('keydown', keyDownListener);
            resetState();
        }
    }, [game]);

    const _process_kill_event = (event: GameEvents.AbstractKill, killedByText: string): [ToastContent, ToastOptions] => {
        const suspect = arenaRef.current.atPosition(event.killed);

        let text;
        if (event.newFbiIdentity) {
            const player = suspect.role as Player;
            const newSuspect = arenaRef.current.atPosition(event.newFbiIdentity);
            newSuspect.role = player;
            text = `${suspect.character.name} (${player.role.name.capitalize()}) killed by ${killedByText}`;
        } else {
            text = `${suspect.character.name} killed by ${killedByText}`;
        }

        suspect.role = 'killed';


        const options: ToastOptions = {
            type: 'error',
        }
        return [text, options];
    }

    const eventVisitor: GameEventVisitor<User, [ToastContent, ToastOptions] | void> = {

        GameStarted(event: GameEvents.Started<User>) {
            const arena = event.arena.map(suspect => new StandardSuspect(suspect.character, suspect.role, suspect.markersSnapshot()));
            setArena(arena);

            setProfilerHand(event.profilerHand.map(character => arena.findFirst(suspect => equals(suspect.character, character))![0]));
            setPlayers(event.players);
            setTeamPlayers(GameHelper.groupPlayersByTeam(event.players));

            const myPlayer = GameHelper.findPlayerByIdentityOrThrow(event.players, props.identity);
            setMyPlayer(myPlayer);
        },

        GameCompleted(event: GameEvents.Completed) {
            console.log('Game completed');
        },

        TurnChanged(event: GameEvents.TurnChanged<User>) {
            const player = GameHelper.findPlayerByIdentity(playersRef.current, event.player);
            assert(player, `Player with identity ${event.player} not found`);
            setCurrentTurnPlayer(player);
            setLastShift(event.lastShift);
            setScore(event.score);
        },

        AvailableActionsChanged(event: GameEvents.AvailableActionsChanged) {
            assert(currentTurnPlayerRef.current);
            assert(myPlayerRef.current);

            const currentTurnPlayer = currentTurnPlayerRef.current;
            const myPlayer = myPlayerRef.current;

            const availableActions = event.actions;
            const role = currentTurnPlayer.role;
            const arena = arenaRef.current;

            if (currentTurnPlayer === myPlayer) {
                let actions: ActionAvailability[] = resolveAvailableActions(role, availableActions);
                setActionsAvailability(actions);

                switch (role) {
                    case Role.PSYCHO:
                        if (availableActions.has('placeThreat')) {
                            setPerformingAction({
                                key: 'placeThreat',
                                targets: [],
                                supportHighlight: GameHelper.getThreatPlacePositions(arena, getMyPosition()),
                            });
                            setActionsEnabled(false);
                            return ['Now place threats', { type: 'success' }];
                        } else {
                            setPerformingAction(undefined);
                            setActionsEnabled(true);
                            return ['Your turn', { type: 'success' }];
                        }
                        break;
                    case Role.SUIT:
                        if (availableActions.has('placeProtection') || availableActions.has('removeProtection')) {
                            const placePositions = GameHelper.getProtectionPlacePositions(arena);
                            const removePositions = GameHelper.getProtectionRemovePositions(arena);

                            setPerformingAction({
                                key: 'placeProtection',
                                supportHighlight: placePositions,
                                supportHighlightMarkers: removePositions.map(pos => [pos, [Marker.PROTECTION]]),
                            });
                            setActionsEnabled(false);
                            return ['Your turn: at the beginning place or remove protection', { type: 'success' }];
                        } else if (availableActions.has('decideProtect')) {
                            setActionsEnabled(false);
                        } else {
                            setPerformingAction(undefined);
                            setActionsEnabled(true);
                            return ['Now do action', { type: 'success' }];
                        }
                        break;
                    case Role.DETECTIVE:
                        if (!availableActions.has('canvas')) {
                            setActionsEnabled(true);
                            return ['Your turn', { type: 'success' }];
                        }
                        break;
                    default:
                        setActionsEnabled(true);
                        return ['Your turn', { type: 'success' }];
                }


            } else {
                setPerformingAction(undefined);
                setActionsEnabled(false);
                setActionsAvailability(resolveAvailableActions(myPlayer.role, new Set()));
            }
        },

        Shifted(event: GameEvents.Shifted) {
            arenaRef.current.shift(event.direction, event.index, event.fast ? 2 : 1);

            const indexText = `${event.direction === Direction.UP || event.direction === Direction.DOWN ? 'column' : 'row'} ${event.index + 1}`;
            const text = `${currentTurnPlayerRef.current!.role.name.capitalize()}: ${event.direction.capitalize()} ${event.fast ? 'double' : ''} shift at ${indexText}`;
            const options: ToastOptions = {
                type: 'info',

            }

            return [text, options];
        },

        Collapsed(event: GameEvents.Collapsed) {
            arenaRef.current = GameHelper.collapse(arenaRef.current, event.direction) as Matrix<StandardSuspect>;

            const text = `${currentTurnPlayerRef.current!.role.name.capitalize()}: Collapsed to ${event.direction.capitalize()}`;
            const options: ToastOptions = {
                type: 'info',
            }

            return [text, options];
        },

        KillTry(event: GameEvents.KillTry) {
            const suspect = arenaRef.current.atPosition(event.target);
            const text = `${suspect.character.name} under the danger`;
            const options: ToastOptions = {
                type: 'warning',
            }

            return [text, options];
        },

        KilledByKnife(event: GameEvents.KilledByKnife) {
            return _process_kill_event(event, 'Killer');
        },

        KilledByThreat(event: GameEvents.KilledByThreat) {
            return _process_kill_event(event, 'Psycho');
        },

        KilledByBomb(event: GameEvents.KilledByBomb) {
            const res = _process_kill_event(event, 'bomb detonation');

            const suspect = arenaRef.current.atPosition(event.killed);
            suspect.removeMarker(Marker.BOMB);

            return res;
        },

        KilledBySniper(event: GameEvents.KilledBySniper) {
            return _process_kill_event(event, 'Sniper');
        },

        Accused(event: GameEvents.Accused) {
            const suspect = arenaRef.current.atPosition(event.target);

            const text = `${suspect.character.name} was accused of being the ${event.mafioso.name.capitalize()}`;
            const options: ToastOptions = {
                type: 'warning',

            }

            return [text, options];

        },

        UnsuccessfulAccused(event: GameEvents.UnsuccessfulAccused) {
            const suspect = arenaRef.current.atPosition(event.target);

            const text = `${suspect.character.name}'s accuse was unsuccessful. Not a ${event.mafioso.name.capitalize()}`;
            const options: ToastOptions = {
                type: 'warning',

            }

            return [text, options];
        },

        Arrested(event: GameEvents.Arrested) {
            const arena = arenaRef.current;
            const suspect = arena.atPosition(event.arrested);
            const player = suspect.role as Player;

            suspect.role = 'arrested';

            const newSuspect = arena.atPosition(event.newMafiosoIdentity);
            newSuspect.role = player;

            const removedMarker = player.role === Role.BOMBER ? Marker.BOMB : player.role === Role.PSYCHO ? Marker.THREAT : undefined;
            if (removedMarker) {
                arena.foreach((suspect) => suspect.removeMarker(removedMarker));
            }

            const text = `${suspect.character.name} (${player.role.name.capitalize()}) was arrested`;
            const options: ToastOptions = {
                type: 'error',

            }

            return [text, options];
        },

        Disarmed(event: GameEvents.Disarmed) {
            const suspect = arenaRef.current.atPosition(event.target);
            suspect.removeMarker(event.marker);

            const text = `${event.marker.capitalize()} marker was removed from suspect ${suspect.character.name}`;
            const options: ToastOptions = {
                type: 'error',
            }

            return [text, options];
        },

        AutopsyCanvased(event: GameEvents.AutopsyCanvased<User>) {
            setPerformingEvent({
                key: 'AllCanvased',
                players: event.mafiosi
            })

            if (event.mafiosi.isEmpty()) {
            } else {
                setTimeout(() => {
                    setPerformingEvent(undefined);
                    forceUpdate();
                }, 10000);
            }

            const suspect = arenaRef.current.atPosition(event.target);

            const text = `Autopsy done on ${suspect.character.name}'s corpse`;
            const options: ToastOptions = {
                type: 'warning',

            }

            return [text, options];
        },

        AllCanvased(event: GameEvents.AllCanvased<User>) {
            const suspect = arenaRef.current.atPosition(event.target);
            suspect.role = 'innocent';

            setPerformingEvent({
                key: 'AllCanvased',
                players: event.players
            })

            if (event.players.isEmpty()) {
            } else {
                setTimeout(() => {
                    setPerformingEvent(undefined);
                    forceUpdate();
                }, 10000);
            }

            const text = `${suspect.character.name} interrogated for finding mafiosi and agents`;
            const options: ToastOptions = {
                type: 'warning',

            }

            return [text, options];
        },

        Profiled(event: GameEvents.Profiled<User>) {
            const arena = arenaRef.current;
            const suspect = arena.atPosition(event.target);
            suspect.role = 'innocent';

            setProfilerHand(event.newHand.map(character => arena.findFirst(suspect => equals(suspect.character, character))![0]));

            setPerformingEvent({
                key: 'AllCanvased',
                players: event.mafiosi
            })

            if (event.mafiosi.isEmpty()) {
            } else {
                setTimeout(() => {
                    setPerformingEvent(undefined);
                    forceUpdate();
                }, 10000);
            }

            const text = `${suspect.character.name} interrogated for finding mafiosi`;
            const options: ToastOptions = {
                type: 'warning',

            }

            return [text, options];
        },

        Disguised(event: GameEvents.Disguised) {
            const suspect = arenaRef.current.atPosition(event.oldIdentity);
            const role = (suspect.role as Player).role;


            let toastText;
            if (event.newIdentity) {
                const newSuspect = arenaRef.current.atPosition(event.newIdentity);
                newSuspect.role = suspect.role;
                suspect.role = 'innocent';

                toastText = `${role.name.capitalize()} disguised. Old identity was ${suspect.character.name}`;
            } else {
                toastText = `${role.name.capitalize()}'s disguise failed`;
            }

            const options: ToastOptions = {
                type: 'warning',

            }

            return [toastText, options];
        },

        MarkerMoved(event: GameEvents.MarkerMoved) {
            const from = arenaRef.current.atPosition(event.from);
            const to = arenaRef.current.atPosition(event.to);

            from.removeMarker(event.marker);
            to.addMarker(event.marker);

            const text = `${event.marker.capitalize()} marker moved from ${from.character.name} to  ${to.character.name}`;
            const options: ToastOptions = {
                type: 'warning',

            }

            return [text, options];
        },

        InnocentsForCanvasPicked(event: GameEvents.InnocentsForCanvasPicked) {
            assert(myPlayerRef.current, 'Invalid state');

            if (myPlayerRef.current.role === Role.DETECTIVE) {

                setPerformingAction({
                    key: 'canvas',
                    innocents: event.suspects
                });
            } else {
                const text = `Detective picks card for interrogation`;
                const options: ToastOptions = {
                    type: 'info',

                }

                return [text, options];
            }
        },

        ThreatPlaced(event: GameEvents.ThreatPlaced) {
            const suspects = event.targets.map(target => arenaRef.current.atPosition(target));
            suspects.forEach(suspect => suspect.addMarker(Marker.THREAT));

            const text = `Threat marker placed on suspects ${suspects.map(suspect => suspect.character.name).join(', ')}`;
            const options: ToastOptions = {
                type: 'info',

            }

            return [text, options];
        },

        BombPlaced(event: GameEvents.BombPlaced) {
            const suspect = arenaRef.current.atPosition(event.target);
            suspect.addMarker(Marker.BOMB);

            const text = `Bomb marker placed on ${suspect.character.name}`;
            const options: ToastOptions = {
                type: 'info',

            }

            return [text, options];
        },

        ProtectionPlaced(event: GameEvents.ProtectionPlaced) {
            const suspect = arenaRef.current.atPosition(event.target);
            suspect.addMarker(Marker.PROTECTION);

            const text = `Protection marker placed on ${suspect.character.name}`;
            const options: ToastOptions = {
                type: 'info',

            }

            return [text, options];
        },

        ProtectionRemoved(event: GameEvents.ProtectionRemoved) {
            const suspect = arenaRef.current.atPosition(event.target);
            suspect.removeMarker(Marker.PROTECTION);

            const text = `Bomb marker removed from ${suspect.character.name}`;
            const options: ToastOptions = {
                type: 'info',

            }

            return [text, options];
        },


        SuspectsSwapped(event: GameEvents.SuspectsSwapped) {
            arenaRef.current.swap(event.position1, event.position2);

            const suspect1 = arenaRef.current.atPosition(event.position1);
            const suspect2 = arenaRef.current.atPosition(event.position2);

            const text = `Suspects ${suspect1.character.name} and  ${suspect2.character.name} swapped`;
            const options: ToastOptions = {
                type: 'info',

            }

            return [text, options];
        },

        SelfDestructionActivated(event: GameEvents.SelfDestructionActivated) {
            assert(myPlayerRef.current);
            assert(playersRef.current);

            const bomber = playersRef.current.find(player => player.role === Role.BOMBER);
            setCurrentTurnPlayer(bomber);
            if (myPlayerRef.current === bomber) {
                setPerformingAction({
                    key: 'selfDestruct',
                    chain: [],
                    supportHighlight: [event.target],
                });
            }

            const suspect = arenaRef.current.atPosition(event.target);
            const mafioso = (suspect.role as Player).role;

            const text = `Mafioso ${suspect.character.name} (${mafioso.name.capitalize()}) found, but activated self destruction.`;
            const options: ToastOptions = {
                type: 'error',
            }

            return [text, options];
        },

        ProtectionActivated(event: GameEvents.ProtectionActivated) {
            assert(myPlayerRef.current);
            assert(playersRef.current);

            const suit = playersRef.current.find(player => player.role === Role.SUIT);
            setCurrentTurnPlayer(suit);
            if (myPlayerRef.current === suit) {
                setPerformingAction({
                    key: 'decideProtect',
                    target: event.target,
                    canProtect: GameHelper.canProtect(getMyPosition(), event.target),
                    supportHighlight: [event.target],
                });
            }

            const suspect = arenaRef.current.atPosition(event.target);

            const text = `Protection activated for suspect ${suspect.character.name}.`;
            const options: ToastOptions = {
                type: 'warning',
            }

            return [text, options];
        },

        ProtectDecided(event: GameEvents.ProtectDecided) {
            assert(arenaRef.current);

            const suspect = arenaRef.current.atPosition(event.target);

            if (event.protect) {
                suspect.removeMarker(Marker.PROTECTION);
                if (event.triggerMarker) {
                    suspect.removeMarker(event.triggerMarker);
                }
            }

            if (event.triggerMarker === Marker.THREAT) { // workaround
                const psycho = playersRef.current.find(player => player.role === Role.PSYCHO);
                setCurrentTurnPlayer(psycho);
            }

            const text = event.protect ? `Suit decided to protect ${suspect.character.name}` : `Suit decided to let ${suspect.character.name} die`;
            const options: ToastOptions = {
                type: event.protect ? 'success' : 'warning',
            }

            return [text, options];
        }
    };

    const processEvent = (event: GameEvents.Any<User>) => {
        console.log('ProcessingEvent', event);
        const result = visitEvent(event, eventVisitor);

        return result;
    }

    const prepareAction = (key: GameActions.Key) => {
        console.log('Preparing action', key);

        const arena = arenaRef.current;
        switch (key) {
            case 'shift':
                setPerformingAction({
                    key: 'shift',
                });
                break;
            case 'collapse':
                setPerformingAction({
                    key: 'collapse',
                    availableDirections: GameHelper.getAvailableCollapseDirections(arena)
                });
                break;
            case 'disguise':
                setPerformingAction({
                    key: 'disguise',
                });
                const disguiseAction: GameActions.Common.Disguise = {
                    type: 'disguise'
                }
                commitAction(disguiseAction);
                break;
            case 'disarm':
                const disarmPositions = GameHelper.getDisarmPositions(arena, getMyPosition());
                setPerformingAction({
                    key: 'disarm',
                    supportHighlightMarkers: disarmPositions
                });
                break
            case 'accuse':
                setPerformingAction({
                    key: 'accuse',
                    supportHighlight: GameHelper.getAccusePositions(arena, getMyPosition())
                });
                break
            case 'farAccuse':
                setPerformingAction({
                    key: 'farAccuse',
                    supportHighlight: GameHelper.getFarAccusePositions(arena, getMyPosition())
                });
                break
            case 'knifeKill':
                setPerformingAction({
                    key: 'knifeKill',
                    supportHighlight: GameHelper.getKnifeKillPositions(arena, getMyPosition()),
                });
                break
            case 'swapSuspects':
                setPerformingAction({
                    key: 'swapSuspects',
                    supportHighlight: arena.filter(() => true),
                });
                break
            case 'placeBomb':
                const myPos = getMyPosition();
                setPerformingAction({
                    key: 'placeBomb',
                    supportHighlight: GameHelper.getBombPlacePositions(arena, myPos).concat(myPos),
                });
                break
            case 'detonateBomb':
                setPerformingAction({
                    key: 'detonateBomb',
                    chain: [],
                    supportHighlight: GameHelper.getBombPositions(arena),
                });
                break
            case 'snipeKill':
                setPerformingAction({
                    key: 'snipeKill',
                    supportHighlight: GameHelper.geSnipeKillPositions(arena, getMyPosition()),
                });
                break
            case 'setup':
                const positions = GameHelper.getMovableMarkerPositions(arena);
                setPerformingAction({
                    key: 'setup',
                    supportHighlightMarkers: positions
                });
                break
            case 'autopsy':
                setPerformingAction({
                    key: 'autopsy',
                    supportHighlight: GameHelper.getAutopsyPositions(arena, getMyPosition()),
                });
                break
            case 'canvas':
                setPerformingAction({
                    key: 'canvas',
                });

                const peekAction: GameActions.Detective.PickInnocentsForCanvas = {
                    type: 'pickInnocentsForCanvas'
                }
                commitAction(peekAction);
                break
            case 'profile':
                setPerformingAction({
                    key: 'profile',
                });
                break
        }

        forceUpdate();
    }

    const onSuspectClick = (position: Position) => {
        const performingAction = performingActionRef.current;
        const arena = arenaRef.current;
        if (!performingAction || !performingAction.supportHighlight?.some(pos => pos.equals(position))) {
            return;
        }

        let action: GameActions.Any;
        switch (performingAction.key) {
            case 'accuse':
            case 'farAccuse':
                if (performingAction.target) {
                    const mafiosoRole = (arena.atPosition(position).role as Player).role;
                    const action: GameActions.Common.Accuse | GameActions.Detective.FarAccuse = {
                        type: performingAction.key,
                        target: performingAction.target,
                        mafioso: mafiosoRole
                    }

                    commitAction(action);
                } else {
                    performingAction.supportHighlight = undefined;
                    performingAction.target = position;
                    forceUpdate();
                }
                break;
            case 'knifeKill':
                action = { type: 'knifeKill', target: position }
                commitAction(action);
                break;
            case 'swapSuspects':
                if (performingAction.firstPosition) {
                    const action: GameActions.Psycho.SwapSuspects = {
                        type: 'swapSuspects',
                        position1: performingAction.firstPosition,
                        position2: position
                    }

                    commitAction(action);
                } else {
                    performingAction.firstPosition = position;
                    performingAction.supportHighlight = arena.getAdjacentPositions(position);
                    forceUpdate();
                }
                break;
            case 'placeThreat':
                performingAction.targets.push(position);
                if (performingAction.targets.length === 3 || performingAction.supportHighlight!.length == 1) {
                    const action: GameActions.Psycho.PlaceThreat = {
                        type: 'placeThreat',
                        targets: performingAction.targets
                    }

                    commitAction(action);
                } else {
                    performingAction.supportHighlight!.removeFirstBy(pos => pos.equals(position));
                    forceUpdate();
                }
                break;
            case 'placeBomb':
                action = { type: 'placeBomb', target: position }
                commitAction(action);
                break;
            case 'detonateBomb':
            case 'selfDestruct':
                performingAction.chain.push(position);
                performingAction.supportHighlight = GameHelper.getBombChainPositions(arena, position).filter(pos => !performingAction.chain.some(ch => pos.equals(ch)));
                if (arena.atPosition(position).hasMarker(Marker.BOMB) && performingAction.supportHighlight.isNonEmpty()) {
                    forceUpdate();
                } else {
                    const action: GameActions.Bomber.DetonateBomb | GameActions.Bomber.SelfDestruct =
                        { type: performingAction.key, chain: performingAction.chain }
                    commitAction(action);
                }
                break;
            case 'snipeKill':
                action = { type: 'snipeKill', target: position }
                commitAction(action);
                break
            case 'setup':
                assert(performingAction.fromPosition, 'Invalid state');

                action = {
                    type: 'setup',
                    from: performingAction.fromPosition,
                    marker: performingAction.marker!,
                    to: position
                }
                commitAction(action);
                break;
            case 'autopsy':
                action = { type: 'autopsy', target: position }
                commitAction(action);
                break
            case 'placeProtection':
                action = { type: 'placeProtection', target: position }
                commitAction(action);
                break
            case 'decideProtect':
                break
            case 'profile':
                action = {
                    type: 'profile',
                    position: position
                }

                commitAction(action);
                break;
            case 'canvas':
                assert(performingAction.innocents, 'Illegal state');

                action = {
                    type: 'canvas',
                    position: position
                }

                commitAction(action);
                break;
        }
    }

    const onMarkerClick = (position: Position, suspect: Suspect, marker: Marker) => {
        const performingAction = performingActionRef.current;
        const arena = arenaRef.current;

        if (!performingAction || !performingAction.supportHighlightMarkers?.some(([pos, markers]) => pos.equals(position) && markers.includes(marker))) {
            return;
        }

        let action: GameActions.Any;
        switch (performingAction.key) {
            case 'disarm':
                action = { type: 'disarm', target: position, marker: marker }
                commitAction(action);
                break;
            case 'setup':
                performingAction.fromPosition = position;
                performingAction.marker = marker;
                performingAction.supportHighlightMarkers = undefined;
                performingAction.supportHighlight = GameHelper.getMarkerMoveDestPositions(arena, position, marker);
                break;
            case 'placeProtection':
                action = { type: 'removeProtection', target: position }
                commitAction(action);
                break
        }
    }

    const onArenaRightClick = () => {
        const performingAction = performingActionRef.current;
        if (!performingAction) {
            return;
        }

        switch (performingAction.key) {
            case 'placeThreat':
                if (performingAction.targets.length > 0) {
                    const action: GameActions.Psycho.PlaceThreat = {
                        type: 'placeThreat',
                        targets: performingAction.targets
                    }

                    commitAction(action);
                }
                break;
            case 'detonateBomb':
            case 'selfDestruct':
                if (performingAction.chain.length > 0) {
                    const action: GameActions.Bomber.DetonateBomb | GameActions.Bomber.SelfDestruct =
                        { type: performingAction.key, chain: performingAction.chain }
                    commitAction(action);
                }
                break;
        }
    }

    const doShift = (direction: Direction, index: number, fast: boolean) => {
        const action: GameActions.Common.Shift = {
            type: 'shift',
            direction: direction,
            index: index,
            fast: fast
        }

        commitAction(action);
    };

    const doCollapse = (direction: Direction) => {
        const action: GameActions.Common.Collapse = {
            type: 'collapse',
            direction: direction,
        }

        commitAction(action);
    }

    const doAccuse = (role: Role) => {
        assert(performingActionRef.current);
        const key = performingActionRef.current.key;
        if (key !== 'accuse' && key !== 'farAccuse') {
            throw new AssertionError();
        }

        const action: GameActions.Common.Accuse | GameActions.Detective.FarAccuse = {
            type: key,
            target: performingActionRef.current.target!,
            mafioso: role
        }

        commitAction(action);
    }

    const doProtectDecisionAction = (protect: boolean) => {
        const action: GameActions.Suit.DecideProtect = {
            type: 'decideProtect',
            protect: protect
        }

        commitAction(action);
    }

    const commitAction = (action: GameActions.Any) => {
        console.log("Commit action", action);

        assert(currentTurnPlayerRef.current, 'Current player not set');

        currentTurnPlayerRef.current.doAction(action);

        setPerformingAction(undefined);
        setActionsEnabled(false);
        forceUpdate();
    }

    const arena = arenaRef.current;
    const lastShift = lastShiftRef.current;
    const profilerHand = profilerHandRef.current;

    const performingAction = performingActionRef.current;
    const performingEvent = performingEventRef.current;
    const myPlayer = myPlayerRef.current;
    const currentTurnPlayer = currentTurnPlayerRef.current;

    const _teamPlayers = teamPlayersRef.current ? teamPlayersRef.current : [[], []];

    const mafiosiPlayers = _teamPlayers[0];
    const fbiPlayers = _teamPlayers[1];

    const myTeamPlayers = myPlayer && myPlayer.role.team === 'MAFIA' ? mafiosiPlayers : fbiPlayers;
    const myTeamPositions = myTeamPlayers.map(player => {
        return GameHelper.locatePlayer(arena, player);
    });
    const myPosition = myTeamPositions.find(pos => arena.atPosition(pos).role === myPlayer);

    const canvasAlertList = (performingEvent?.key === 'AllCanvased' && performingEvent.players) || [];

    const canvasDialogOpenPredicate = performingAction?.key === 'canvas' && Boolean(performingAction?.innocents);
    const accuseDialogOpenPredicate = (performingAction?.key === 'accuse' || performingAction?.key === 'farAccuse')
        && Boolean(performingAction?.target);
    const decideProtectDialogOpenPredicate = performingAction?.key === 'decideProtect';
    const collapseDialogOpenPredicate = performingAction?.key === 'collapse';
    const profilerDialogOpenPredicate = myPlayer?.role === Role.PROFILER && performingAction?.key === 'profile';


    const dialogOpenPredicate =
        collapseDialogOpenPredicate
        || profilerDialogOpenPredicate
        || canvasDialogOpenPredicate
        || accuseDialogOpenPredicate
        || decideProtectDialogOpenPredicate;

    const onActionSelect = (action: GameActions.Key) => {
        if (performingActionRef.current && performingActionRef.current.key === action) {
            setPerformingAction(undefined);
            forceUpdate();
        } else {
            prepareAction(action);
        }
    }

    const mafiosiPlayersInfo = mafiosiPlayers.map(player => ({
        identity: player.identity,
        role: player.role,
        character: arena.atPosition(GameHelper.locatePlayer(arena, player)).character
    }));


    const fbiPlayersInfo = fbiPlayers.map(player => ({
        identity: player.identity,
        role: player.role,
        character: arena.atPosition(GameHelper.locatePlayer(arena, player)).character
    }));


    function changeHighLight(positions: Position[]) {
        assert(performingActionRef.current);
        performingActionRef.current.supportHighlight = positions;
        forceUpdate();
    }

    return (
        <div className={classNames(styles.container, props.className)}>
            <div className={styles.score}>
                <span style={{ color: '#ff7070' }}>{score.current[0]}</span>
                :
                <span style={{ color: '#7575f3' }}>{score.current[1]}</span>
            </div>

            {myPlayer &&
                <TeamPlayersPanel
                    className={styles.leftPlayersPanel}
                    hidden={myPlayer.role.team === 'FBI'}
                    players={mafiosiPlayersInfo}
                    me={myPlayer.identity}
                    currentTurn={currentTurnPlayer?.identity}
                    alert={canvasAlertList} />
            }

            <ArenaComponent
                arena={arena}
                fastShift={fastShiftRef.current}
                disableShift={performingAction?.key !== 'shift'}
                lastShift={lastShift}
                meHighlight={myPosition}
                teamHighlight={myTeamPositions}
                supportHighlight={performingAction?.supportHighlight}
                supportHighlightMarkers={performingAction?.supportHighlightMarkers}
                onShift={doShift}
                onSuspectClick={onSuspectClick}
                onMarkerClick={onMarkerClick}
                onContextMenu={() => onArenaRightClick()}
            />

            {myPlayer && <TeamPlayersPanel
                className={styles.rightPlayersPanel}
                hidden={myPlayer.role.team === 'MAFIA'}
                players={fbiPlayersInfo}
                me={myPlayer.identity}
                currentTurn={currentTurnPlayer?.identity}
                alert={canvasAlertList} />
            }

            {myPlayer && <ActionsPanel
                className={styles.actionsPanel}
                role={myPlayer.role}
                actions={actionsAvailabilityRef.current}
                enabled={actionsEnabledRef.current}
                selectedAction={performingAction?.key}
                onActionSelect={onActionSelect}
            />}

            <ActionDialog show={dialogOpenPredicate}>
                {
                    (accuseDialogOpenPredicate &&
                        mafiosiPlayers.map((player, index) => <RoleCardComponent key={index}
                            role={player.role}
                            highlight={true}
                            onClick={() => doAccuse(player.role)} />)
                    )
                    ||

                    (canvasDialogOpenPredicate &&
                        performingAction.innocents!.map((pos, index: 0 | 1) => <SuspectCard key={index}
                            suspect={arena.atPosition(pos)}
                            highlight={arena.atPosition(pos).isAlive()}
                            onMouseEnter={() => changeHighLight([pos])}
                            onMouseLeave={() => changeHighLight([])}
                            onSuspectClick={() => onSuspectClick(pos)} />)
                    )
                    ||
                    (decideProtectDialogOpenPredicate &&
                        (<div>
                            <Button onClick={() => doProtectDecisionAction(true)}
                                disabled={!performingAction.canProtect} >
                                {t('protect')}
                            </Button>

                            <Button onClick={() => doProtectDecisionAction(false)} >
                                {t('let-die')}
                            </Button>
                        </div>
                        )
                    )
                    ||
                    (collapseDialogOpenPredicate &&
                        (
                            Direction.ALL.map(direction => <DirectionButton
                                className={styles.collapseDirectionButton}
                                key={direction}
                                direction={direction}
                                disabled={!performingAction.availableDirections.includes(direction)}
                                onClick={() => doCollapse(direction)}
                                onMouseEnter={() => changeHighLight(GameHelper.getCollapseCandidatePositions(arenaRef.current, direction))}
                                onMouseLeave={() => changeHighLight([])}
                            />)
                        )
                    )
                    ||
                    (profilerDialogOpenPredicate &&
                        (
                            profilerHand.map((suspect, index) => {
                                const position = arena.findFirst((sus) => sus.character.name === suspect.character.name)![1];

                                return <SuspectCard key={index}
                                    suspect={suspect}
                                    highlight={equals(currentTurnPlayer?.identity, myPlayer.identity) && suspect.isPlayerOrSuspect()}
                                    onMouseEnter={() => changeHighLight([position])}
                                    onMouseLeave={() => changeHighLight([])}
                                    onSuspectClick={() => equals(currentTurnPlayer?.identity, myPlayer.identity) && suspect.isPlayerOrSuspect() && onSuspectClick(position)}
                                />
                            })
                        )
                    )
                }
            </ActionDialog>


        </div>
    );
}

function resolveAvailableActions(role: Role, availableActions: Set<GameActions.Key>): ActionAvailability[] {
    let actions: ActionAvailability[];

    if (role === Role.DETECTIVE) {
        actions = role.actions
            .filter(action => action !== 'pickInnocentsForCanvas' && action !== 'canvas')
            .map(action => (
                {
                    key: action,
                    available: availableActions.has(action),
                }));

        actions.push({
            key: 'canvas',
            available: availableActions.has('pickInnocentsForCanvas'),
        });

    } else if (role === Role.SUIT) {
        actions = role.actions
            .filter(action => action !== 'placeProtection' && action !== 'removeProtection' && action !== 'decideProtect')
            .map(action => (
                {
                    key: action,
                    available: availableActions.has(action),
                }));

        actions.push({
            key: 'placeProtection',
            available: availableActions.has('placeProtection') || availableActions.has('removeProtection'),
        });
    } else if (role === Role.BOMBER) {
        actions = role.actions.filter(action => action !== 'selfDestruct').map(action => ({
            key: action,
            available: availableActions.has(action)
        }));
    } else {
        actions = role.actions.map(action => ({
            key: action,
            available: availableActions.has(action)
        }));
    }

    return actions;
}

interface BaseActionContext {
    readonly key: GameActions.Key,
    supportHighlight?: Position[],
    supportHighlightMarkers?: [Position, Marker[]][],
}

interface ShiftActionContext extends BaseActionContext {
    readonly key: GameActions.Key<GameActions.Common.Shift>,
}

interface CollapseActionContext extends BaseActionContext {
    readonly key: GameActions.Key<GameActions.Common.Collapse>,
    readonly availableDirections: Direction[]
}

interface CanvasActionContext extends BaseActionContext {
    readonly key: GameActions.Key<GameActions.Detective.Canvas>,
    innocents?: Position[],
}

interface AccuseActionContext extends BaseActionContext {
    readonly key: GameActions.Key<GameActions.Common.Accuse | GameActions.Detective.FarAccuse>
    target?: Position,
}

interface SwapSuspectsContext extends BaseActionContext {
    readonly key: GameActions.Key<GameActions.Psycho.SwapSuspects>
    firstPosition?: Position,
}

interface PlaceThreatContext extends BaseActionContext {
    readonly key: GameActions.Key<GameActions.Psycho.PlaceThreat>,
    targets: Position[]
}

interface BombDetonationContext extends BaseActionContext {
    readonly key: GameActions.Key<GameActions.Bomber.DetonateBomb> | GameActions.Key<GameActions.Bomber.SelfDestruct>,
    chain: Position[]
}

interface SetupContext extends BaseActionContext {
    readonly key: GameActions.Key<GameActions.Sniper.Setup>,
    fromPosition?: Position
    marker?: Marker
}

interface ProtectDecisionContext extends BaseActionContext {
    readonly key: GameActions.Key<GameActions.Suit.DecideProtect>,
    target: Position
    canProtect: boolean
}

type ActionKeysWithoutContext =
    | GameActions.Key<GameActions.Common.Disguise>
    | GameActions.Key<GameActions.Common.Disarm>
    | GameActions.Key<GameActions.Killer.Kill>
    | GameActions.Key<GameActions.Bomber.PlaceBomb>
    | GameActions.Key<GameActions.Sniper.Kill>
    | GameActions.Key<GameActions.Undercover.Autopsy>
    | GameActions.Key<GameActions.Suit.PlaceProtection>
    | GameActions.Key<GameActions.Profiler.Profile>

interface ActionsWithoutContext extends BaseActionContext {
    readonly key: ActionKeysWithoutContext,
}

type PerformingAction =
    | ActionsWithoutContext
    | CollapseActionContext
    | ShiftActionContext
    | CanvasActionContext
    | AccuseActionContext
    | SwapSuspectsContext
    | PlaceThreatContext
    | BombDetonationContext
    | SetupContext
    | ProtectDecisionContext

interface BaseEventContext {
    readonly key: GameEvents.Key,
}

interface CanvasEventContext extends BaseEventContext {
    readonly key: GameEvents.Key<GameEvents.AllCanvased>,
    players: User[]
}

type PerformingEvent = CanvasEventContext