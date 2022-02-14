import { shuffle } from "@tix320/noir-core";

export default class Suspect {
    readonly name: string;
    state: 'alive' | 'arested' | 'killed';
    innocent: boolean;

    constructor(name: string) {
        this.name = name;
        this.state = 'alive';
        this.innocent = false;
    }
}

const SUSPECTS = [
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

export function generateSuspectSet(count: number) {
    shuffle(SUSPECTS);

    return SUSPECTS.slice(0, count).sort().map(suspectName => new Suspect(suspectName));
} 