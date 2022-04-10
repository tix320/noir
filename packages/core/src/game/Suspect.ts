import { assert } from "../util/Assertions";
import { Character } from "./Character";
import { Player } from "./Game";
import { Marker } from "./Marker";

type Role = Player<any> | 'suspect' | 'innocent' | 'arrested' | 'killed'

export class Suspect {
    readonly character: Character;
    #role: Role;
    #markers: Set<Marker>;

    constructor(character: Character) {
        this.character = character;
        this.#role = 'suspect';
        this.#markers = new Set();
    }

    set role(value: Role) {
        this.assertClosedState();

        if (value === 'killed' || value === 'arrested') {
            this.#role = value;
            this.#markers.clear();
        }
    }

    get role(): Role {
        return this.#role;
    }

    hasMarker(marker: Marker): boolean {
        this.assertClosedState();

        return this.#markers.has(marker);
    }

    addMarker(marker: Marker) {
        this.assertClosedState();

        this.#markers.add(marker);
    }

    removeMarker(marker: Marker): boolean {
        this.assertClosedState();

        return this.#markers.delete(marker);
    }

    assertClosedState() {
        assert(this.#role !== 'arrested' && this.#role !== 'killed', "Suspect is arrested or killed");
    }

    clone(): Suspect {
        const suspect = new Suspect(this.character);
        suspect.#role = this.#role;
        suspect.#markers = new Set(this.#markers);

        return suspect;
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

