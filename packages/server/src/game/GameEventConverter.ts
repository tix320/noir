import { Dto } from "@tix320/noir-core/src/api/Dto";
import { Player, Suspect } from "@tix320/noir-core/src/game/Game";
import { GameEvents } from "@tix320/noir-core/src/game/GameEvents";
import { GameEventVisitor } from "@tix320/noir-core/src/game/GameEventVisitor";
import { User } from "../user/User";

type Type = {
    [EVENT in GameEvents.Any<User> as EVENT['type']]:
    (event: GameEvents.ByKey<EVENT['type']>) =>
        Dto.Events.Specific<EVENT['type']> extends (infer D)
        ? D extends Dto.Events.Specific<EVENT['type']>
        ? EVENT['type'] extends D['type']
        ? D : never : never : never
}

export class GameEventConverter implements Type, GameEventVisitor<User, Dto.Events.Any> {

    Hello(event: GameEvents.Hello): Dto.Events.Specific<'Hello'> {
        return event;
    }

    GameStarted(event: GameEvents.Started<User>): Dto.Events.Started {
        return {
            type: 'GameStarted',
            players: event.players.map(player => convertPlayer(player)),
            arena: event.arena.map(suspect => convertSuspect(suspect)).raw(),
            evidenceDeck: event.evidenceDeck,
            profilerHand: event.profilerHand
        }
    }

    GameCompleted(event: GameEvents.Completed): Dto.Events.Specific<'GameCompleted'> {
        return event;
    }

    GameAborted(event: GameEvents.Aborted): Dto.Events.Specific<'GameAborted'> {
        return event;
    }

    TurnChanged(event: GameEvents.TurnChanged<User>): Dto.Events.Specific<'TurnChanged'> {
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

    Shifted(event: GameEvents.Shifted): Dto.Events.Specific<'Shifted'> {
        return event;
    }

    Collapsed(event: GameEvents.Collapsed): Dto.Events.Specific<'Collapsed'> {
        return event;
    }

    KilledByKnife(event: GameEvents.KilledByKnife): Dto.Events.Specific<'KilledByKnife'> {
        return event;
    }

    KilledByThreat(event: GameEvents.KilledByThreat): Dto.Events.Specific<'KilledByThreat'> {
        return event;
    }

    KilledByBomb(event: GameEvents.KilledByBomb): Dto.Events.Specific<'KilledByBomb'> {
        return event;
    }

    KilledBySniper(event: GameEvents.KilledBySniper): Dto.Events.Specific<'KilledBySniper'> {
        return event;
    }

    BombDetonated(event: GameEvents.BombDetonated): Dto.Events.Specific<'BombDetonated'> {
        return event;
    }

    Accused(event: GameEvents.Accused): Dto.Events.Specific<'Accused'> {
        return {
            type: 'Accused',
            target: event.target,
            mafioso: event.mafioso.name
        }
    }

    UnsuccessfulAccused(event: GameEvents.UnsuccessfulAccused): Dto.Events.Specific<'UnsuccessfulAccused'> {
        return {
            type: 'UnsuccessfulAccused',
            target: event.target,
            mafioso: event.mafioso.name
        }
    }

    Arrested(event: GameEvents.Arrested): Dto.Events.Specific<'Arrested'> {
        return event;
    }

    Disarmed(event: GameEvents.Disarmed): Dto.Events.Specific<'Disarmed'> {
        return event;
    }

    AutopsyCanvased(event: GameEvents.AutopsyCanvased<User>): Dto.Events.Specific<'AutopsyCanvased'> {
        return {
            type: 'AutopsyCanvased',
            target: event.target,
            mafiosi: event.mafiosi.map(mafioso => convertUser(mafioso)),
        }
    }

    AllCanvased(event: GameEvents.AllCanvased<User>): Dto.Events.Specific<'AllCanvased'> {
        return {
            type: 'AllCanvased',
            target: event.target,
            players: event.players.map(player => convertUser(player)),
        }
    }

    Profiled(event: GameEvents.Profiled<User>): Dto.Events.Specific<'Profiled'> {
        return {
            type: 'Profiled',
            target: event.target,
            mafiosi: event.mafiosi.map(mafioso => convertUser(mafioso)),
            newHand: event.newHand.map(character => character.name)
        }
    }

    Disguised(event: GameEvents.Disguised): Dto.Events.Specific<'Disguised'> {
        return event;
    }

    MarkerMoved(event: GameEvents.MarkerMoved): Dto.Events.Specific<'MarkerMoved'> {
        return event;
    }

    InnocentsForCanvasPicked(event: GameEvents.InnocentsForCanvasPicked): Dto.Events.Specific<'InnocentsForCanvasPicked'> {
        return {
            type: 'InnocentsForCanvasPicked',
            suspects: event.suspects.map(character => character.name)
        };
    }

    ThreatPlaced(event: GameEvents.ThreatPlaced): Dto.Events.Specific<'ThreatPlaced'> {
        return event;
    }

    BombPlaced(event: GameEvents.BombPlaced): Dto.Events.Specific<'BombPlaced'> {
        return event;
    }

    ProtectionPlaced(event: GameEvents.ProtectionPlaced): Dto.Events.Specific<'ProtectionPlaced'> {
        return event;
    }

    ProtectionRemoved(event: GameEvents.ProtectionRemoved): Dto.Events.Specific<'ProtectionRemoved'> {
        return event;
    }

    SuspectsSwapped(event: GameEvents.SuspectsSwapped): Dto.Events.Specific<'SuspectsSwapped'> {
        return event;
    }

    SelfDestructionActivated(event: GameEvents.SelfDestructionActivated): Dto.Events.Specific<'SelfDestructionActivated'> {
        return event;
    }

    ProtectionActivated(event: GameEvents.ProtectionActivated): Dto.Events.Specific<'ProtectionActivated'> {
        return {
            type: 'ProtectionActivated',
            target: event.target,
            trigger: event.trigger.name
        }
    }

    ProtectDecided(event: GameEvents.ProtectDecided): Dto.Events.Specific<'ProtectDecided'> {
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