import Identifiable from "../util/Identifiable";
import { GameEvents } from "./GameEvents";

export interface GameEventVisitor<I extends Identifiable> {

    GameStarted?(event: GameEvents.Started<I>): any;

    GameCompleted?(event: GameEvents.Completed): any;

    TurnChanged?(event: GameEvents.TurnChanged<I>): any;

    AvailableActionsChanged?(event: GameEvents.AvailableActionsChanged): any;

    Shifted?(event: GameEvents.Shifted): any;

    Collapsed?(event: GameEvents.Collapsed): any;

    KillTry?(event: GameEvents.KillTry): any;

    KilledByKnife?(event: GameEvents.KilledByKnife): any;

    KilledByThreat?(event: GameEvents.KilledByThreat): any;

    KilledByBomb?(event: GameEvents.KilledByBomb): any;

    KilledBySniper?(event: GameEvents.KilledBySniper): any;

    Accused?(event: GameEvents.Accused): any;

    UnsuccessfulAccused?(event: GameEvents.UnsuccessfulAccused): any;

    Arrested?(event: GameEvents.Arrested): any;

    Disarmed?(event: GameEvents.Disarmed): any;

    AutoSpyCanvased?(event: GameEvents.AutoSpyCanvased<I>): any;

    AllCanvased?(event: GameEvents.AllCanvased<I>): any;

    Profiled?(event: GameEvents.Profiled<I>): any;

    Disguised?(event: GameEvents.Disguised): any;

    MarkerMoved?(event: GameEvents.MarkerMoved): any;

    InnocentsForCanvasPicked?(event: GameEvents.InnocentsForCanvasPicked): any;

    ThreatPlaced?(event: GameEvents.ThreatPlaced): any;

    BombPlaced?(event: GameEvents.BombPlaced): any;

    ProtectionPlaced?(event: GameEvents.ProtectionPlaced): any;

    ProtectionRemoved?(event: GameEvents.ProtectionRemoved): any;

    SuspectsSwapped?(event: GameEvents.SuspectsSwapped): any;

    SelfDestructionActivated?(event: GameEvents.SelfDestructionActivated): any;

    ProtectionActivated?(event: GameEvents.ProtectionActivated): any;

    ProtectDecided?(event: GameEvents.ProtectDecided): any;
}

export function visitEvent<I extends Identifiable>(event: GameEvents.Any<I>, eventVisitor: GameEventVisitor<I>) {
    const functionName = event.type;
    const func = (eventVisitor as any)[functionName];

    if (typeof func === 'function') {
        return func(event);
    }
}