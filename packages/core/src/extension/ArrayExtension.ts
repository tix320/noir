export { };

declare global {
    interface Array<T> {
        has(item: T): boolean;

        removeFirst(predicate: (element: T) => boolean): T | undefined;

        equals(other: Array<T>): boolean;
    }
}

Array.prototype.has = function <T>(this: Array<T>, item: T): boolean {
    return this.find(elem => elem === item) != undefined;
}

Array.prototype.removeFirst = function <T>(this: Array<T>, predicate: (element: T) => boolean): T | undefined {
    for (let index = 0; index < this.length; ++index) {
        const element = this[index];
        if (predicate(element)) {
            this.splice(index, 1);
            return element;
        }
    }

    return undefined;
}

Array.prototype.equals = function <T>(this: Array<T>, other: Array<T>): boolean {
    return this.length === other.length && this.every((val, index) => val === other[index]);
}

