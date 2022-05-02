import Identifiable from "@tix320/noir-core/src/util/Identifiable";

export class User implements Identifiable {
    constructor(public readonly id: string, public readonly name: string) {
    }

    equals(other: this | undefined): boolean {
        return !!other && this.id === other.id;
    }

    toString() {
        return `[id=${this.id} , name=${this.name}]`;
    }
}