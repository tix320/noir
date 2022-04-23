export default interface Identifiable {
    readonly id: string;
}

export function equals(first: Identifiable | undefined, second: Identifiable | undefined) {
    return first?.id === second?.id;
}


export function notEquals(first: Identifiable | undefined, second: Identifiable | undefined) {
    return first?.id !== second?.id;
}