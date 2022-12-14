export { };

declare global {
    interface Array<T> {
        isEmpty(): boolean;

        isNonEmpty(): boolean;

        has(item: T): boolean;

        removeFirstBy(predicate: (element: T) => boolean): T | undefined;

        removeFirst(element: T): boolean;

        equals(other: Array<T>): boolean;

        toMap<K>(keyExtractor: (element: T) => K): Map<K, T>;
    }
}

Array.prototype.isEmpty = function <T>(this: Array<T>): boolean {
    return this.length === 0;
}

Array.prototype.isNonEmpty = function <T>(this: Array<T>): boolean {
    return this.length !== 0;
}

Array.prototype.has = function <T>(this: Array<T>, item: T): boolean {
    return this.find(elem => elem === item) != undefined;
}

Array.prototype.removeFirstBy = function <T>(this: Array<T>, predicate: (element: T) => boolean): T | undefined {
    for (let index = 0; index < this.length; ++index) {
        const element = this[index];
        if (predicate(element)) {
            this.splice(index, 1);
            return element;
        }
    }

    return undefined;
}

Array.prototype.removeFirst = function <T>(this: Array<T>, element: T): boolean {
    return this.removeFirstBy(elem => elem === element) !== undefined;
}

Array.prototype.equals = function <T>(this: Array<T>, other: Array<T>): boolean {
    return this.length === other.length && this.every((val, index) => val === other[index]);
}

Array.prototype.toMap = function <K, T>(this: Array<T>, keyExtractor: (element: T) => K): Map<K, T> {
    return new Map(this.map(elem => [keyExtractor(elem), elem]));
}