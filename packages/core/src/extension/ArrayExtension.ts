export { }

declare global {
    interface Array<T> {
        removeFirst(predicate: (element: T) => boolean): Array<T>;
    }
}

Array.prototype.removeFirst = function <T>(predicate: (element: T) => boolean): T {
    for (let index = 0; index < this.length; ++index) {
        const element = this[index];
        if (predicate(element)) {
            this.splice(index, 1);
            return element;
        }
    }

    return null;
}