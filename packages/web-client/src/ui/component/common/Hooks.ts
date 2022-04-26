import { DependencyList, EffectCallback, MutableRefObject, useEffect, useRef, useState } from "react";
import Api, { ConnectionState } from "../../../service/Api";

export type ComponentForceUpdate = ReturnType<typeof useForceUpdate>;

export function useForceUpdate() {
    const [value, setValue] = useState(0);
    return () => setValue(value => value + 1);
}

export function useServerConnectionState() {
    const [value, setValue] = useState<ConnectionState>('DISCONNECTED');

    useEffect(() => {
        const subscription = Api.connectionState().subscribe(state => {
            setValue(state);
        })

        return () => {
            subscription.unsubscribe();
        }
    }, []);

    return value;
}

export function useServerConnectedEffect(effect: EffectCallback, deps: DependencyList) {
    const connectionState = useServerConnectionState();

    useEffect(() => {
        if (connectionState === 'CONNECTED') {
            return effect();
        }
    }, [connectionState, ...deps]);
}