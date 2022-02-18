export { }

declare global {
    interface Array<T> {
        removeFirst(predicate: (element: T) => boolean): T | undefined;

        equals(other: Array<T>): boolean;
    }
}

Array.prototype.removeFirst = function <T>(predicate: (element: T) => boolean): T | undefined {
    for (let index = 0; index < this.length; ++index) {
        const element = this[index];
        if (predicate(element)) {
            this.splice(index, 1);
            return element;
        }
    }

    return undefined;
}

Array.prototype.equals = function (other: Array<any>): boolean {
    return this.length === other.length && this.every((val, index) => val === other[index]);
}

