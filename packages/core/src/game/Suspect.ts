import { assert } from "../util/Assertions";
import { Character } from "./Character";
import { Player } from "./Game";
import { Marker } from "./Marker";

type Role = Player<any> | 'suspect' | 'innocent' | 'arrested' | 'killed'

export class Suspect {
    readonly character: Character;
    #role: Role;
    #markers: Set<Marker>;

    constructor(character: Character, role: Role = 'suspect', markers: Marker[] = []) {
        this.character = character;
        this.#role = role;
        this.#markers = new Set(markers);
    }

    set role(value: Role) {
        this.assertAlive();
        this.#role = value;

        if (!this.isAlive()) {
            this.#markers.delete(Marker.PROTECTION);
            this.#markers.delete(Marker.THREAT);
        }
    }

    get role(): Role {
        return this.#role;
    }

    get markers(): Marker[] {
        return [...this.#markers];
    }

    hasMarker(marker: Marker): boolean {
        return this.#markers.has(marker);
    }

    addMarker(marker: Marker) {
        if (marker === Marker.PROTECTION || marker === Marker.THREAT) { 
            this.assertAlive();
        }

        this.#markers.add(marker);
    }

    removeMarker(marker: Marker): boolean {
        return this.#markers.delete(marker);
    }

    isAlive(): boolean {
        return this.#role !== 'arrested' && this.#role !== 'killed';
    }

    assertAlive() {
        assert(this.isAlive(), "Suspect is arrested or killed");
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

