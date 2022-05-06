import { Dto } from "@tix320/noir-core/src/api/Dto";
import { Player, Suspect } from "@tix320/noir-core/src/game/Game";
import { GameEvents } from "@tix320/noir-core/src/game/GameEvents";
import { GameEventVisitor } from "@tix320/noir-core/src/game/GameEventVisitor";
import { User } from "../user/User";

export class GameEventConverter implements GameEventVisitor<User, Dto.Events.Any> {

    Hello(event: GameEvents.Hello): Dto.Events.Any & { type: 'Hello' } {
        return event;
    }

    GameStarted(event: GameEvents.Started<User>): Dto.Events.Started {
        const eventDto: Dto.Events.Started = {
            type: 'GameStarted',
            players: event.players.map(player => convertPlayer(player)),
            arena: event.arena.map(suspect => convertSuspect(suspect)).raw(),
            evidenceDeck: event.evidenceDeck,
            profilerHand: event.profilerHand
        }

        return eventDto;
    }

    GameCompleted(event: GameEvents.Completed): Dto.Events.Any & { type: 'GameCompleted' } {
        return event;
    }

    GameAborted(event: GameEvents.Aborted): Dto.Events.Any & { type: 'GameAborted' } {
        return event;
    }

    TurnChanged(event: GameEvents.TurnChanged<User>): Dto.Events.Any & { type: 'TurnChanged' } {
        return {
            type: 'TurnChanged',
            player: convertUser(event.player),
            score: event.score,
            lastShift: event.lastShift
        }
    }

    AvailableActionsChanged(event: GameEvents.AvailableActionsChanged): Dto.Events.AvailableActionsChanged {
        const eventDto: Dto.Events.AvailableActionsChanged = {
            type: 'AvailableActionsChanged',
            actions: [...event.actions]
        }

        return eventDto;
    }

    Shifted(event: GameEvents.Shifted): Dto.Events.Any & { type: 'Shifted' } {
        return event;
    }

    Collapsed(event: GameEvents.Collapsed): Dto.Events.Any & { type: 'Collapsed' } {
        return event;
    }

    KilledByKnife(event: GameEvents.KilledByKnife): Dto.Events.Any & { type: 'KilledByKnife' } {
        return event;
    }

    KilledByThreat(event: GameEvents.KilledByThreat): Dto.Events.Any & { type: 'KilledByThreat' } {
        return event;
    }

    KilledByBomb(event: GameEvents.KilledByBomb): Dto.Events.Any & { type: 'KilledByBomb' } {
        return event;
    }

    KilledBySniper(event: GameEvents.KilledBySniper): Dto.Events.Any & { type: 'KilledBySniper' } {
        return event;
    }

    BombDetonated(event: GameEvents.BombDetonated): Dto.Events.Any & { type: 'BombDetonated' } {
        return event;
    }

    Accused(event: GameEvents.Accused): Dto.Events.Any & { type: 'Accused' } {
        return {
            type: 'Accused',
            target: event.target,
            mafioso: event.mafioso.name
        }
    }

    UnsuccessfulAccused(event: GameEvents.UnsuccessfulAccused): Dto.Events.Any & { type: 'UnsuccessfulAccused' } {
        return {
            type: 'UnsuccessfulAccused',
            target: event.target,
            mafioso: event.mafioso.name
        }
    }

    Arrested(event: GameEvents.Arrested): Dto.Events.Any & { type: 'Arrested' } {
        return event;
    }

    Disarmed(event: GameEvents.Disarmed): Dto.Events.Any & { type: 'Disarmed' } {
        return event;
    }

    AutopsyCanvased(event: GameEvents.AutopsyCanvased<User>): Dto.Events.Any & { type: 'AutopsyCanvased' } {
        return {
            type: 'AutopsyCanvased',
            target: event.target,
            mafiosi: event.mafiosi.map(mafioso => convertUser(mafioso)),
        }
    }

    AllCanvased(event: GameEvents.AllCanvased<User>): Dto.Events.Any & { type: 'AllCanvased' } {
        return {
            type: 'AllCanvased',
            target: event.target,
            players: event.players.map(player => convertUser(player)),
        }
    }

    Profiled(event: GameEvents.Profiled<User>): Dto.Events.Any & { type: 'Profiled' } {
        return {
            type: 'Profiled',
            target: event.target,
            mafiosi: event.mafiosi.map(mafioso => convertUser(mafioso)),
            newHand: event.newHand.map(character => character.name)
        }
    }

    Disguised(event: GameEvents.Disguised): Dto.Events.Any & { type: 'Disguised' } {
        return event;
    }

    MarkerMoved(event: GameEvents.MarkerMoved): Dto.Events.Any & { type: 'MarkerMoved' } {
        return event;
    }

    InnocentsForCanvasPicked(event: GameEvents.InnocentsForCanvasPicked): Dto.Events.Any & { type: 'InnocentsForCanvasPicked' } {
        return {
            type: 'InnocentsForCanvasPicked',
            suspects: event.suspects.map(character => character.name)
        };
    }

    ThreatPlaced(event: GameEvents.ThreatPlaced): Dto.Events.Any & { type: 'ThreatPlaced' } {
        return event;
    }

    BombPlaced(event: GameEvents.BombPlaced): Dto.Events.Any & { type: 'BombPlaced' } {
        return event;
    }

    ProtectionPlaced(event: GameEvents.ProtectionPlaced): Dto.Events.Any & { type: 'ProtectionPlaced' } {
        return event;
    }

    ProtectionRemoved(event: GameEvents.ProtectionRemoved): Dto.Events.Any & { type: 'ProtectionRemoved' } {
        return event;
    }

    SuspectsSwapped(event: GameEvents.SuspectsSwapped): Dto.Events.Any & { type: 'SuspectsSwapped' } {
        return event;
    }

    SelfDestructionActivated(event: GameEvents.SelfDestructionActivated): Dto.Events.Any & { type: 'SelfDestructionActivated' } {
        return event;
    }

    ProtectionActivated(event: GameEvents.ProtectionActivated): Dto.Events.Any & { type: 'ProtectionActivated' } {
        return {
            type: 'ProtectionActivated',
            target: event.target,
            trigger: event.trigger.name
        }
    }

    ProtectDecided(event: GameEvents.ProtectDecided): Dto.Events.Any & { type: 'ProtectDecided' } {
        return {
            type: 'ProtectDecided',
            target: event.target,
            trigger: event.trigger.name,
            protect: event.protect,
        }
    }
}

function convertSuspect(suspect: Suspect<User>): Dto.Suspect {
    return {
        character: suspect.character,
        role: typeof suspect.role === 'string' ? suspect.role : convertPlayer(suspect.role),
        markers: suspect.markersSnapshot()
    }
}

function convertPlayer(player: Player<User>): Dto.Player {
    return {
        identity: convertUser(player.identity),
        role: player.role.name
    }
}

function convertUser(user: User): Dto.User {
    return {
        id: user.id,
        name: user.name,
    };
}