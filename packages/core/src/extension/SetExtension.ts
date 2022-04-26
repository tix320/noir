export { };

declare global {
    interface Set<T> {
        equals(other: Set<T>): boolean;
    }
}

Set.prototype.equals = function <T>(this: Set<T>, other: Set<T>): boolean {
    if (this.size !== other.size) return false;

    for (var a of this) if (!other.has(a)) return false;
    return true;
}