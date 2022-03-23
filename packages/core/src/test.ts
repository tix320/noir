import { Direction, RoleType } from "..";
import Position from "./util/Position";
import Shift from "@tix320/noir-core/src/game/Shift";
import StandardGame from "./game/StandardGame";
import { Bomber, Detective, Killer, PreliminaryPlayer, Psycho, Suit, Undercover } from "./game/Game";

const game = new StandardGame<Id>();

class Id {

    constructor(public id: string) { }
}

const participants: PreliminaryPlayer<Id>[] = [
    { identity: new Id("1"), role: RoleType.KILLER, ready: true },
    { identity: new Id('2'), role: RoleType.PSYCHO, ready: true },
    { identity: new Id("3"), role: RoleType.BOMBER, ready: true },
    { identity: new Id("4"), role: RoleType.SUIT, ready: true },
    { identity: new Id("5"), role: RoleType.DETECTIVE, ready: true },
    { identity: new Id("6"), role: RoleType.UNDERCOVER, ready: true },
];

participants.forEach(p => game.getPreparingState().join(p));

const players = game.getPlayingState().players;

const KILLER: Killer<Id> = players.find(p => p.roleType === RoleType.KILLER) as Killer<Id>;
const BOMBER: Bomber<Id> = players.find(p => p.roleType === RoleType.BOMBER) as Bomber<Id>;
const PSYCHO: Psycho<Id> = players.find(p => p.roleType === RoleType.PSYCHO) as Psycho<Id>;
const SUIT: Suit<Id> = players.find(p => p.roleType === RoleType.SUIT) as Suit<Id>;
const DETECTIVE: Detective<Id> = players.find(p => p.roleType === RoleType.DETECTIVE) as Detective<Id>;
const UNDERCOVER: Undercover<Id> = players.find(p => p.roleType === RoleType.UNDERCOVER) as Undercover<Id>;

const position = KILLER.locate();

KILLER.onGameEvent(event => {
    const currentPlayer = event.currentTurnPlayer;
    console.log(currentPlayer);
    const shift: Shift = { direction: Direction.UP, index: 3, fast: false};
    currentPlayer.shift(shift);
});




KILLER.kill(new Position(position.x, position.y - 1));

console.log(2312);
