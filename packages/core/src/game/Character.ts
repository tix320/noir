import Identifiable from "../util/Identifiable";
import { shuffle } from "../util/RandUtils";

const CHARACTER_NAMES: readonly string[] = [
    "Logan",
    "Poncho",
    "Blondie",
    "Bumper",
    "Sally",
    "Jack",
    "Mcduff",
    "Lincoln",
    "Thor",
    "Stanley",
    "Rosy",
    "Buttons",
    "Yin",
    "Butter",
    "Pogo",
    "Annie",
    "Macy",
    "Monty",
    "Hudson",
    "Taffy",
    "Aires",
    "Mitch",
    "Flint",
    "Chico",
    "Pugsley",
    "Jagger",
    "Powder",
    "Fifi",
    "Pandora",
    "Rosa",
    "Silvester",
    "Bam-bam",
    "Sweetie",
    "Pearl",
    "Godiva",
    "Tobie",
    "Truffles",
    "Connor",
    "Weaver",
    "Latte",
    "Roxy",
    "Pirate",
    "Tom",
    "Nibby",
    "Biablo",
    "Mojo",
    "Fresier",
    "Garfield",
    "Bucko",
    "Maggie-moo",
];

export class Character implements Identifiable {

    public static ALL: readonly Character[] = CHARACTER_NAMES.map((name, index) => new Character(index + "", name));

    public constructor(public readonly id: string, public readonly name: string) {
    }

    toString(): string {
        return this.name;
    }
}


export namespace Character {
    export function generateSet(count: number): Character[] {
        const characters = [...Character.ALL];
        shuffle(characters);

        return characters.slice(0, count);
    }
}