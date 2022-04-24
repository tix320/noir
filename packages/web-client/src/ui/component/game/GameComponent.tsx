import { Game, Marker, Player, ShiftAction, Suspect } from '@tix320/noir-core/src/game/Game';
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
import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { concatMap, delay, of } from 'rxjs';
import User from '../../../entity/User';
import CharacterCard from '../cards/character/CharacterCardComponent';
import RoleCardComponent from '../cards/role/RoleCardComponent';
import SuspectCard from '../cards/suspect/SuspectCardComponent';
import { useForceUpdate, useRefState } from '../common/Hooks';
import ActionDialog from './action-dialog/ActionDialogComponent';
import ActionsPanel, { ActionAvailability } from './actions/ActionsPanelComponent';
import ArenaComponent from './arena/ArenaComponent';
import styles from './GameComponent.module.css';
import TeamPlayersPanel, { PlayerInfo } from './TeamPlayersPanelComponent';

type Props = {
    className?: string,
    game: Game.Play<User>,
    identity: User
}

export default function GameComponent(props: Props) {
    const { game } = props;

    const [playersRef, setPlayers] = useRefState<Player<User>[]>([]);
    const [myPlayerRef, setMyPlayer] = useRefState<Player<User> | undefined>(undefined);
    const [currentTurnPlayerRef, setCurrentTurnPlayer] = useRefState<Player<User> | undefined>(undefined);
    const [performingActionRef, setPerformingAction] = useRefState<PerformingAction | undefined>(undefined);
    const [performingEventRef, setPerformingEvent] = useRefState<PerformingEvent | undefined>(undefined);

    const [arenaRef, setArena] = useRefState<Matrix<StandardSuspect>>(new Matrix([]));
    const [profilerHandRef, setProfilerHand] = useRefState<StandardSuspect[]>([]);
    const [lastShiftRef, setLastShift] = useRefState<ShiftAction | undefined>(undefined);

    const [actionsEnabled, setActionsEnabled] = useState<boolean>(false);
    const [actionsAvailability, setActionsAvailability] = useState<ActionAvailability[]>([]);

    const [teamPlayersRef, setTeamPlayers] = useRefState<[Player<User>[], Player<User>[]]>([[], []]);

    const getMyPosition = () => {
        assert(myPlayerRef.current);
        const res = arenaRef.current.findFirst((sus => sus.role === myPlayerRef.current));
        assert(res);
        return res[1];
    }

    const forceUpdate = useForceUpdate();
    const [t] = useTranslation();

    useEffect(() => {
        const subscription = game.events().subscribe(event => processEvent(event));

        return () => {
            subscription.unsubscribe();
        }
    }, [game])

    const _process_kill_event = (event: GameEvents.AbstractKill): StandardSuspect => {
        const suspect = arenaRef.current.atPosition(event.killed);

        if (event.newFbiIdentity) {
            const player = suspect.role as Player;
            const newSuspect = arenaRef.current.atPosition(event.newFbiIdentity);
            newSuspect.role = player;
        }

        suspect.role = 'killed';

        return suspect;
    }

    const eventVisitor: GameEventVisitor<User> = {

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
            //setMyPlayer(player); //TODO: remove after test

            setLastShift(event.lastShift);
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

                switch (role) {
                    case Role.PSYCHO:
                        if (availableActions.has('placeThreat')) {
                            setPerformingAction({
                                key: 'placeThreat',
                                targets: [],
                                supportHighlight: GameHelper.getThreatPlacePositions(arena, getMyPosition()),
                            });
                        } else {
                            setPerformingAction(undefined);
                            setActionsEnabled(true);
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
                        } else if (!availableActions.has('decideProtect')) {
                            setPerformingAction(undefined);
                            setActionsEnabled(true);
                        }
                        break;
                    default:
                        setActionsEnabled(true);
                }

                setActionsAvailability(actions);
            } else {
                setPerformingAction(undefined);
                setActionsEnabled(false);
                setActionsAvailability(resolveAvailableActions(myPlayer.role, new Set()));
            }
        },

        Shifted(event: GameEvents.Shifted) {
            arenaRef.current.shift(event.direction, event.index, event.fast ? 2 : 1);
        },

        Collapsed(event: GameEvents.Collapsed) {
            //TODO:
        },

        KillTry(event: GameEvents.KillTry) {
            //TODO:
        },

        KilledByKnife(event: GameEvents.KilledByKnife) {
            _process_kill_event(event); //TODO: specific effect
        },

        KilledByThreat(event: GameEvents.KilledByThreat) {
            _process_kill_event(event); //TODO: specific effect
        },

        KilledByBomb(event: GameEvents.KilledByBomb) {
            const suspect = _process_kill_event(event); //TODO: specific effect
            suspect.removeMarker(Marker.BOMB);
        },

        KilledBySniper(event: GameEvents.KilledBySniper) {
            _process_kill_event(event); //TODO: specific effect
        },

        Accused(event: GameEvents.Accused) {
            //TODO: specific effect

        },

        UnsuccessfulAccused(event: GameEvents.UnsuccessfulAccused) {
            //TODO: specific effect

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
        },

        Disarmed(event: GameEvents.Disarmed) {
            const suspect = arenaRef.current.atPosition(event.target);
            suspect.removeMarker(event.marker);
        },

        AutoSpyCanvased(event: GameEvents.AutoSpyCanvased<User>) {
            setPerformingEvent({
                key: 'AllCanvased',
                players: event.mafiosi
            })

            setTimeout(() => {
                setPerformingEvent(undefined);
            }, 10000);
        },

        AllCanvased(event: GameEvents.AllCanvased<User>) {
            const suspect = arenaRef.current.atPosition(event.target);
            suspect.role = 'innocent';

            setPerformingEvent({
                key: 'AllCanvased',
                players: event.players
            })

            setTimeout(() => {
                setPerformingEvent(undefined);
            }, 10000);
        },

        Profiled(event: GameEvents.Profiled<User>) {
            const suspect = arenaRef.current.atPosition(event.target);
            suspect.role = 'innocent';

            setPerformingEvent({
                key: 'AllCanvased',
                players: event.mafiosi
            })

            setTimeout(() => {
                setPerformingEvent(undefined);
            }, 10000);
        },

        Disguised(event: GameEvents.Disguised) {
            if (event.newIdentity) {
                const suspect = arenaRef.current.atPosition(event.oldIdentity);
                const newSuspect = arenaRef.current.atPosition(event.newIdentity);
                newSuspect.role = suspect.role;
                suspect.role = 'innocent';
            }
        },

        MarkerMoved(event: GameEvents.MarkerMoved) {
            const from = arenaRef.current.atPosition(event.from);
            const to = arenaRef.current.atPosition(event.to);

            from.removeMarker(event.marker);
            to.addMarker(event.marker);
        },

        InnocentsForCanvasPicked(event: GameEvents.InnocentsForCanvasPicked) {
            assert(myPlayerRef.current, 'Invalid state');

            if (myPlayerRef.current.role === Role.DETECTIVE) {

                setPerformingAction({
                    key: 'canvas',
                    innocents: event.suspects
                });
            }
        },

        ThreatPlaced(event: GameEvents.ThreatPlaced) {
            event.targets.forEach(target => arenaRef.current.atPosition(target).addMarker(Marker.THREAT));
        },

        BombPlaced(event: GameEvents.BombPlaced) {
            const suspect = arenaRef.current.atPosition(event.target);
            suspect.addMarker(Marker.BOMB);

        },

        ProtectionPlaced(event: GameEvents.ProtectionPlaced) {
            const suspect = arenaRef.current.atPosition(event.target);
            suspect.addMarker(Marker.PROTECTION);
        },

        ProtectionRemoved(event: GameEvents.ProtectionRemoved) {
            const suspect = arenaRef.current.atPosition(event.target);
            suspect.removeMarker(Marker.PROTECTION);
        },


        SuspectsSwapped(event: GameEvents.SuspectsSwapped) {
            arenaRef.current.swap(event.position1, event.position2);
        },

        SelfDestructionActivated(event: GameEvents.SelfDestructionActivated) {
            assert(myPlayerRef.current);
            assert(playersRef.current);

            const bomber = playersRef.current.find(player => player.role === Role.BOMBER);
            setCurrentTurnPlayer(bomber);
            // setMyPlayer(bomber); //TODO: remove after test

            if (myPlayerRef.current === bomber) {
                setPerformingAction({
                    key: 'selfDestruct',
                    chain: [],
                    supportHighlight: [event.target],
                });
            }
        },

        ProtectionActivated(event: GameEvents.ProtectionActivated) {
            assert(myPlayerRef.current);
            assert(playersRef.current);

            const suit = playersRef.current.find(player => player.role === Role.SUIT);
            setCurrentTurnPlayer(suit);
            //  setMyPlayer(suit); //TODO: remove after test

            if (myPlayerRef.current === suit) {
                setPerformingAction({
                    key: 'decideProtect',
                    target: event.target,
                    canProtect: GameHelper.canProtect(getMyPosition(), event.target),
                    supportHighlight: [event.target],
                });
            }
        },

        ProtectDecided(event: GameEvents.ProtectDecided) {
            assert(arenaRef.current);

            if (event.protect) {
                const suspect = arenaRef.current.atPosition(event.target);
                suspect.removeMarker(Marker.PROTECTION);
                if (event.triggerMarker) {
                    suspect.removeMarker(event.triggerMarker);
                }
            }

            //TODO: specific effect
        }
    };

    const processEvent = (event: GameEvents.Any<User>) => {
        console.log('Event', event);
        setTimeout(() => {
            visitEvent(event, eventVisitor);
            forceUpdate();
        })
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
            case 'collapse': //TODO:
                setPerformingAction({
                    key: 'collapse',
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
                    supportHighlight: positions.map(val => val[0]),
                    supportHighlightMarkers: positions
                });
                break
            case 'autospy':
                setPerformingAction({
                    key: 'autospy',
                    supportHighlight: GameHelper.getAutoSpyPositions(arena, getMyPosition()),
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
                const set = new Set<number>()
                setPerformingAction({
                    key: 'profile',
                });
                break
        }
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
                performingAction.supportHighlight = GameHelper.getBombChainPositions(arena, position);
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
            case 'autospy':
                action = { type: 'autospy', target: position }
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

    const doShift = (direction: Direction, index: number, fast: boolean) => {
        const action: GameActions.Common.Shift = {
            type: 'shift',
            direction: direction,
            index: index,
            fast: fast
        }

        commitAction(action);
    };

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

    const profilerDialogOpenPredicate = myPlayer?.role === Role.PROFILER && performingAction?.key === 'profile';
    const canvasDialogOpenPredicate = performingAction?.key === 'canvas' && Boolean(performingAction?.innocents);
    const accuseDialogOpenPredicate = (performingAction?.key === 'accuse' || performingAction?.key === 'farAccuse')
        && Boolean(performingAction?.target);
    const decideProtectDialogOpenPredicate = performingAction?.key === 'decideProtect';

    const dialogOpenPredicate = profilerDialogOpenPredicate || canvasDialogOpenPredicate
        || accuseDialogOpenPredicate
        || decideProtectDialogOpenPredicate;

    const onActionSelect = (action: GameActions.Key) => {
        if (performingActionRef.current && performingActionRef.current.key === action) {
            setPerformingAction(undefined);
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

    return (
        <div className={classNames(styles.container, props.className)}>

            {myPlayer &&
                <TeamPlayersPanel
                    className={styles.leftPlayersPanel}
                    hidden={myPlayer.role.team === 'FBI'}
                    players={mafiosiPlayersInfo}
                    me={myPlayer.identity}
                    currentTurn={currentTurnPlayer?.identity}
                    alert={canvasAlertList} />
            }

            <ArenaComponent className={styles.arena}
                arena={arena}
                fastShift={!!currentTurnPlayer && GameHelper.canDoFastShift(currentTurnPlayer)}
                disableShift={performingAction?.key !== 'shift'}
                lastShift={lastShift}
                meHighlight={myPosition}
                teamHighlight={myTeamPositions}
                supportHighlight={performingAction?.supportHighlight}
                supportHighlightMarkers={performingAction?.supportHighlightMarkers}
                onShift={doShift}
                onSuspectClick={onSuspectClick}
                onMarkerClick={onMarkerClick} />

            {myPlayer && <TeamPlayersPanel
                className={styles.rightPlayersPanel}
                hidden={myPlayer.role.team === 'MAFIA'}
                players={fbiPlayersInfo}
                me={myPlayer.identity}
                currentTurn={currentTurnPlayer?.identity}
                alert={canvasAlertList} />
            }

            <ActionsPanel
                className={styles.actionsPanel}
                actions={actionsAvailability}
                enabled={actionsEnabled}
                selectedAction={performingAction?.key}
                onActionSelect={onActionSelect}
            />

            <ActionDialog show={dialogOpenPredicate}>
                {
                    (accuseDialogOpenPredicate &&
                        mafiosiPlayers.map((player, index) => <RoleCardComponent key={index}
                            role={player.role}
                            highlight={true}
                            onClick={() => doAccuse(player.role)} />))
                    ||

                    (canvasDialogOpenPredicate &&
                        performingAction.innocents!.map((pos, index: 0 | 1) => <SuspectCard key={index}
                            suspect={arena.atPosition(pos)}
                            highlight={arena.atPosition(pos).isAlive()}
                            onMouseEnter={() => performingAction.supportHighlight = [pos]}
                            onMouseLeave={() => performingAction.supportHighlight = []}
                            onSuspectClick={() => onSuspectClick(pos)} />))
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
                        ))
                    ||
                    (profilerDialogOpenPredicate &&
                        (
                            profilerHand.map((suspect, index) => {
                                const position = arena.findFirst((sus) => sus.character.name === suspect.character.name)![1];

                                return <SuspectCard key={index}
                                    suspect={suspect}
                                    highlight={performingAction?.key === 'profile' && suspect.isPlayerOrSuspect()}
                                    onMouseEnter={() => performingAction?.key === 'profile' && (performingAction.supportHighlight = [position])}
                                    onMouseLeave={() => performingAction?.key === 'profile' && (performingAction.supportHighlight = [])}
                                    onSuspectClick={() => suspect.isPlayerOrSuspect() && onSuspectClick(position)}
                                />
                            })
                        ))
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
    | GameActions.Key<GameActions.Common.Collapse>
    | GameActions.Key<GameActions.Common.Disguise>
    | GameActions.Key<GameActions.Common.Disarm>
    | GameActions.Key<GameActions.Killer.Kill>
    | GameActions.Key<GameActions.Bomber.PlaceBomb>
    | GameActions.Key<GameActions.Sniper.Kill>
    | GameActions.Key<GameActions.Undercover.AutoSpy>
    | GameActions.Key<GameActions.Suit.PlaceProtection>
    | GameActions.Key<GameActions.Profiler.Profile>

interface ActionsWithoutContext extends BaseActionContext {
    readonly key: ActionKeysWithoutContext,
}

type PerformingAction =
    | ActionsWithoutContext
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