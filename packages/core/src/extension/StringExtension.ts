export { };

declare global {
    interface String {
        capitalize(): string;
    }
}

String.prototype.capitalize = function (this: string) {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};