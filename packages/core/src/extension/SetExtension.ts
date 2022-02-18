export { }

declare global {
    interface Set<T> {
        equals(other: Set<T>): boolean;
    }
}

Set.prototype.equals = function (other: Set<any>): boolean {
    if (this.size !== other.size) return false;

    for (var a of other) if (!this.has(a)) return false;
    return true;
}