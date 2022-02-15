import { Component } from "react";
import { Subject } from "rxjs";


export default abstract class RxComponent<P, S> extends Component<P, S> {

    protected destroy$ = new Subject();

    componentWillUnmount() {
        this.destroy$.next(null);
        this.destroy$.complete();
    }
}