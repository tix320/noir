import { Character, Marker } from "@tix320/noir-core";
import Player from "./Player";

export class Suspect {
    readonly character: Character;
    player: Player | 'suspect' | 'innocent' | 'arested' | 'killed';
    markers: Marker[];

    constructor(character: Character) {
        this.character = character;
        this.player = 'suspect';
        this.markers = [];
    }

    toString(): string {
        return `${this.character}[${this.player}]`;
    }
}

export namespace Suspect {
    export function generateSet(count: number) {
        return Character.generateSet(count).map(character => new Suspect(character));
    }
}

