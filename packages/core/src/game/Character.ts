import { shuffle } from "../util/RandUtils";

export class Character {
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    toString(): string {
        return this.name;
    }
}

const CHARACTERS = [
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

export namespace Character {
    export function generateSet(count: number): Character[] {
        shuffle(CHARACTERS);

        return CHARACTERS.slice(0, count).sort().map(characterName => new Character(characterName));
    }
}