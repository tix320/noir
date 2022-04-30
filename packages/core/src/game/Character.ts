import Identifiable from "../util/Identifiable";
import { shuffle } from "../util/RandUtils";

const CHARACTER_NAMES: readonly string[] = [
    "Logan",
    "Fred",
    "Gus",
    "Doug",
    "Chris",
    "Dave",
    "Darren",
    "Eddy",
    "Gerald",
    "Rach",
    "Simon",
    "Xuan",
    "Yin",
    "Zak",
    "Pogo",
    "Albert",
    "Brian",
    "Calvin",
    "Clay",
    "Violet",
    "Anna",
    "Lynn",
    "Kathy",
    "Rench",
    "Harris",
    "Barby",
    "Oxy",
    "Diana",
    "Helen",
    "Iva",
    "Jacob",
    "James",
    "Donald",
    "Isaak",
    "Umi",
    "Yota",
    "Jane",
    "Julian",
    "Karina",
    "Linda",
    "Lily",
    "Megan",
    "Paula",
    "Russ",
    "Damian",
    "Steve",
    "Trevor",
    "Victor",
    "Xavier",
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