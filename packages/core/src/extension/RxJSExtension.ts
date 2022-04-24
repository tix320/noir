import { concat, Observable, of, Subject } from "rxjs";

export function onFirst<T, F>(callback: (item: F) => void): (source$: Observable<T>) => Observable<T> {
    return source$ => new Observable(observer => {
        const restItemsHandler = (item: T) => observer.next(item);

        let handler = (val: T) => {
            callback(val as any);
            handler = restItemsHandler;
        }

        const subscription = source$.subscribe({
            ...observer,
            next: (val: T) => handler(val)
        });

        return subscription;
    })
}

declare module 'rxjs' {
    interface Observable<T> {
        onFirst<F>(callback: (item: F) => void): Observable<T>;
    }

    interface Subject<T> {
        asObservableWithInitialValue<I>(initialValue: I): Observable<T>;
    }
}

Observable.prototype.onFirst = function <T, F>(this: Observable<T>, callback: (item: F) => void): Observable<T> {
    return this.pipe(onFirst(callback));
}

Subject.prototype.asObservableWithInitialValue = function <T, I>(this: Subject<T>, initialValue: I): Observable<T> {
    return concat(of(initialValue), this.asObservable()) as any;
}