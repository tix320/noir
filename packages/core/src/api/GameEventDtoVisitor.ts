import { GameEvents } from "../game/GameEvents";
import Identifiable from "../util/Identifiable";
import { Dto } from "./Dto";

export abstract class GameEventDtoVisitor<I extends Identifiable> {

    Hello(event: GameEvents.Hello): GameEvents.Hello {
        return event;
    }

    abstract GameStarted(event: Dto.Events.Started): GameEvents.Started<I>;

    GameCompleted(event: GameEvents.Completed): GameEvents.Completed {
        return event;
    }

    abstract TurnChanged(event: Dto.Events.TurnChanged): GameEvents.TurnChanged<I>;

    abstract AvailableActionsChanged(event: Dto.Events.AvailableActionsChanged): GameEvents.AvailableActionsChanged;

    Shifted(event: GameEvents.Shifted): GameEvents.Shifted {
        return event;
    }

    Collapsed(event: GameEvents.Collapsed): GameEvents.Collapsed {
        return event;
    }

    abstract KillTry(event: GameEvents.KillTry): GameEvents.KillTry;

    abstract KilledByKnife(event: GameEvents.KilledByKnife): GameEvents.KilledByKnife;

    abstract KilledByThreat(event: GameEvents.KilledByThreat): GameEvents.KilledByThreat;

    abstract KilledByBomb(event: GameEvents.KilledByBomb): GameEvents.KilledByBomb;

    abstract KilledBySniper(event: GameEvents.KilledBySniper): GameEvents.KilledBySniper;

    abstract Accused(event: Dto.Events.Accused): GameEvents.Accused;

    abstract UnsuccessfulAccused(event: Dto.Events.UnsuccessfulAccused): GameEvents.UnsuccessfulAccused;

    abstract Arrested(event: GameEvents.Arrested): GameEvents.Arrested;

    abstract Disarmed(event: GameEvents.Disarmed): GameEvents.Disarmed;

    abstract AutopsyCanvased(event: Dto.Events.AutopsyCanvased): GameEvents.AutopsyCanvased<I>;

    abstract AllCanvased(event: Dto.Events.AllCanvased): GameEvents.AllCanvased<I>;

    abstract Profiled(event: Dto.Events.Profiled): GameEvents.Profiled<I>;

    abstract Disguised(event: GameEvents.Disguised): GameEvents.Disguised;

    abstract MarkerMoved(event: GameEvents.MarkerMoved): GameEvents.MarkerMoved;

    abstract InnocentsForCanvasPicked(event: GameEvents.InnocentsForCanvasPicked): GameEvents.InnocentsForCanvasPicked;

    abstract ThreatPlaced(event: GameEvents.ThreatPlaced): GameEvents.ThreatPlaced;

    abstract BombPlaced(event: GameEvents.BombPlaced): GameEvents.BombPlaced;

    abstract ProtectionPlaced(event: GameEvents.ProtectionPlaced): GameEvents.ProtectionPlaced;

    abstract ProtectionRemoved(event: GameEvents.ProtectionRemoved): GameEvents.ProtectionRemoved;

    abstract SuspectsSwapped(event: GameEvents.SuspectsSwapped): GameEvents.SuspectsSwapped;

    abstract SelfDestructionActivated(event: GameEvents.SelfDestructionActivated): GameEvents.SelfDestructionActivated;

    abstract ProtectionActivated(event: GameEvents.ProtectionActivated): GameEvents.ProtectionActivated;

    abstract ProtectDecided(event: GameEvents.ProtectDecided): GameEvents.ProtectDecided;
}

export function visitEvent<I extends Identifiable>(event: Dto.Events.Any, eventVisitor: GameEventDtoVisitor<I>) {
    const functionName = event.type;
    const func = (eventVisitor as any)[functionName];

    if (typeof func === 'function') {
        return func(event);
    }
}