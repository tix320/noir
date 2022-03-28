import { Character } from "./Character";
import { Player } from "./Game";
import { Marker } from "./Marker";

export class Suspect {
    readonly character: Character;
    role: Player<any> | 'suspect' | 'innocent' | 'arested' | 'killed';
    markers: Set<Marker>;

    constructor(character: Character) {
        this.character = character;
        this.role = 'suspect';
        this.markers = new Set();
    }

    toString(): string {
        return `${this.character}[${this.role}]`;
    }
}

export namespace Suspect {
    export function generateSet(count: number) {
        return Character.generateSet(count).map(character => new Suspect(character));
    }
}

