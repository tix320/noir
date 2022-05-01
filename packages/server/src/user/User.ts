import { Player } from '@tix320/noir-core/src/game/Game';
import Identifiable from '@tix320/noir-core/src/util/Identifiable';
import { BehaviorSubject, Observable } from 'rxjs';

export class User implements Identifiable {
    readonly id: string
    readonly name: string
    readonly #currentGameContext = new BehaviorSubject<CurrentGameContext | undefined>(undefined);

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    get currentGameContext() {
        return this.#currentGameContext.value;
    }

    set currentGameContext(value: CurrentGameContext | undefined) {
        this.#currentGameContext.next(value);
    }

    currentGameChange(): Observable<CurrentGameContext | undefined> {
        return this.#currentGameContext.asObservable();
    }

    equals(other: this | undefined) {
        return !!other && this.id === other.id;
    }

    toString() {
        return `[id=${this.id} , name=${this.name}]`;
    }
}

export class CurrentGameContext {

    constructor(public readonly id: string) {
    }
}