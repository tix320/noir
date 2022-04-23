import { assert } from "../util/Assertions";
import Identifiable from "../util/Identifiable";
import { Character } from "./Character";
import { Marker, Suspect, SuspectRole } from "./Game";

export class StandardSuspect<I extends Identifiable = Identifiable> implements Suspect<I> {
    readonly character: Character;
    #role: SuspectRole<I>;
    #markers: Set<Marker>;

    constructor(character: Character, role: SuspectRole<I> = 'suspect', markers: Marker[] = []) {
        this.character = character;
        this.#role = role;
        this.#markers = new Set(markers);
    }

    public get role(): SuspectRole<I> {
        return this.#role;
    }

    markersSnapshot(): Marker[] {
        return [...this.#markers];
    }

    public hasMarker(marker: Marker): boolean {
        return this.#markers.has(marker);
    }

    public isAlive(): boolean {
        return this.#role !== 'arrested' && this.#role !== 'killed';
    }

    public isPlayerOrSuspect() {
        return typeof this.#role !== 'string' || this.#role === 'suspect';
    }

    set role(value: SuspectRole<I>) {
        this.assertAlive();
        this.#role = value;

        if (!this.isAlive()) {
            this.#markers.delete(Marker.PROTECTION);
            this.#markers.delete(Marker.THREAT);
        }
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

    assertAlive() {
        assert(this.isAlive(), `Suspect is ${this.#role}`);
    }

    assertPlayerOrSuspect() {
        assert(this.isPlayerOrSuspect(), `Suspect is ${this.#role}`);
    }

    clone(): StandardSuspect<I> {
        const suspect = new StandardSuspect<I>(this.character);
        suspect.#role = this.#role;
        suspect.#markers = new Set(this.#markers);

        return suspect;
    }

    toString(): string {
        return `${this.character}[${this.role}]`;
    }
}

export namespace StandardSuspect {
    export function generateSet<I extends Identifiable>(count: number): StandardSuspect<I>[] {
        return Character.generateSet(count).map(character => new StandardSuspect(character));
    }
}

