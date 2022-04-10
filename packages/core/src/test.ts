import { Bomber, Detective, Game, Killer, Psycho, RoleSelection, Suit, Undercover } from "./game/Game";
import { RoleType } from "./game/RoleType";
import { StandardGame } from "./game/StandardGame";
import Position from "./util/Position";

let gamePreparation: StandardGame.Preparation<Id> = new StandardGame.Preparation<Id>();

class Id {

    constructor(public id: string) { }
}

const participants: RoleSelection<Id>[] = [
    { identity: new Id("1"), role: RoleType.KILLER, ready: true },
    { identity: new Id('2'), role: RoleType.PSYCHO, ready: true },
    { identity: new Id("3"), role: RoleType.BOMBER, ready: true },
    { identity: new Id("4"), role: RoleType.SUIT, ready: true },
    { identity: new Id("5"), role: RoleType.DETECTIVE, ready: true },
    { identity: new Id("6"), role: RoleType.UNDERCOVER, ready: true },
];

participants.forEach(p => {
    gamePreparation.join(p.identity);
    gamePreparation.changeRole(p);
});

const game = gamePreparation.start() as Game.Play<Id>;

const players = game.initialState.players;

const KILLER: Killer<Id> = players.find(p => p.role === RoleType.KILLER) as Killer<Id>;
const BOMBER: Bomber<Id> = players.find(p => p.role === RoleType.BOMBER) as Bomber<Id>;
const PSYCHO: Psycho<Id> = players.find(p => p.role === RoleType.PSYCHO) as Psycho<Id>;
const SUIT: Suit<Id> = players.find(p => p.role === RoleType.SUIT) as Suit<Id>;
const DETECTIVE: Detective<Id> = players.find(p => p.role === RoleType.DETECTIVE) as Detective<Id>;
const UNDERCOVER: Undercover<Id> = players.find(p => p.role === RoleType.UNDERCOVER) as Undercover<Id>;

const position = KILLER.locate();

KILLER.gameEvents().subscribe(event => {
    console.log(event);
});




KILLER.doAction('knifeKill', { target: new Position(position.x, position.y - 1) });

console.log(2312);
