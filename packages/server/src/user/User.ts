import Identifiable from '@tix320/noir-core/src/util/Identifiable';
import { BehaviorSubject, Observable } from 'rxjs';

export class User implements Identifiable {
    readonly id: string
    readonly name: string
    readonly #currentGameId = new BehaviorSubject<string | undefined>(undefined);

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    get currentGameId() {
        return this.#currentGameId.value;
    }

    set currentGameId(value: string | undefined) {
        this.#currentGameId.next(value);
    }

    currentGameIdChange(): Observable<string | undefined> {
        return this.#currentGameId.asObservable();
    }

    equals(other: this | undefined) {
        return !!other && this.id === other.id;
    }
    
    toString() {
        return `[id=${this.id} , name=${this.name}]`;
    }
}