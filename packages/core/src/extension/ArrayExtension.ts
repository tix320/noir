export { };

declare global {
    interface Array<T> {
        has(item: T): boolean;

        removeFirstBy(predicate: (element: T) => boolean): T | undefined;

        removeFirst(element: T): boolean;

        equals(other: Array<T>): boolean;
    }
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

