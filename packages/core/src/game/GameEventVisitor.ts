import Identifiable from "../util/Identifiable";
import { GameEvents } from "./GameEvents";

export type GameEventVisitor<I extends Identifiable, R = unknown> = {
    [EVENT in GameEvents.Any<I> as EVENT['type']] : (event: EVENT) => R 
}

export function visitEvent<I extends Identifiable, R>(event: GameEvents.Any<I>, eventVisitor: GameEventVisitor<I, R>): R | undefined {
    const functionName = event.type;
    const func = (eventVisitor as any)[functionName];

    if (typeof func === 'function') {
        return func(event);
    }
}