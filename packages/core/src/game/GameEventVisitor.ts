import Identifiable from "../util/Identifiable";
import { GameEvents } from "./GameEvents";

export interface GameEventVisitor<I extends Identifiable, R = unknown> {

    Hello?(event: GameEvents.Hello): R;

    GameStarted?(event: GameEvents.Started<I>): R;

    GameCompleted?(event: GameEvents.Completed): R;

    GameAborted(event: GameEvents.Aborted): R;

    TurnChanged?(event: GameEvents.TurnChanged<I>): R;

    AvailableActionsChanged?(event: GameEvents.AvailableActionsChanged): R;

    Shifted?(event: GameEvents.Shifted): R;

    Collapsed?(event: GameEvents.Collapsed): R;

    KilledByKnife?(event: GameEvents.KilledByKnife): R;

    KilledByThreat?(event: GameEvents.KilledByThreat): R;

    KilledByBomb?(event: GameEvents.KilledByBomb): R;

    KilledBySniper?(event: GameEvents.KilledBySniper): R;

    BombDetonated?(event: GameEvents.BombDetonated): R;

    Accused?(event: GameEvents.Accused): R;

    UnsuccessfulAccused?(event: GameEvents.UnsuccessfulAccused): R;

    Arrested?(event: GameEvents.Arrested): R;

    Disarmed?(event: GameEvents.Disarmed): R;

    AutopsyCanvased?(event: GameEvents.AutopsyCanvased<I>): R;

    AllCanvased?(event: GameEvents.AllCanvased<I>): R;

    Profiled?(event: GameEvents.Profiled<I>): R;

    Disguised?(event: GameEvents.Disguised): R;

    MarkerMoved?(event: GameEvents.MarkerMoved): R;

    InnocentsForCanvasPicked?(event: GameEvents.InnocentsForCanvasPicked): R;

    ThreatPlaced?(event: GameEvents.ThreatPlaced): R;

    BombPlaced?(event: GameEvents.BombPlaced): R;

    ProtectionPlaced?(event: GameEvents.ProtectionPlaced): R;

    ProtectionRemoved?(event: GameEvents.ProtectionRemoved): R;

    SuspectsSwapped?(event: GameEvents.SuspectsSwapped): R;

    SelfDestructionActivated?(event: GameEvents.SelfDestructionActivated): R;

    ProtectionActivated?(event: GameEvents.ProtectionActivated): R;

    ProtectDecided?(event: GameEvents.ProtectDecided): R;
}

export function visitEvent<I extends Identifiable, R>(event: GameEvents.Any<I>, eventVisitor: GameEventVisitor<I, R>): R | undefined {
    const functionName = event.type;
    const func = (eventVisitor as any)[functionName];

    if (typeof func === 'function') {
        return func(event);
    }
}