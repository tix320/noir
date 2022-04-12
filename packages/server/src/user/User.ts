import { BehaviorSubject, Observable, Subject } from 'rxjs';

export class User {
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

    equals(other: User) {
        return this.id === other.id;
    }
}