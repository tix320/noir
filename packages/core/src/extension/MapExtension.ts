export { };

declare global {
    interface Map<K, V> {
        remove(key: K): V | undefined;
    }
}

Map.prototype.remove = function <K, V>(this: Map<K, V>, key: K): V | undefined {
    const value = this.get(key);

    if (value) {
        this.delete(key);
    }

    return value;
}