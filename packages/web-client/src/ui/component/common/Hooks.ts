import { MutableRefObject, useEffect, useRef, useState } from "react";

export function useForceUpdate() {
    const [value, setValue] = useState(0); // integer state
    return () => setValue(value => value + 1); // update the state to force render
}
export function useRefState<S>(initialValue: S) {
    const [value, setValue] = useState<S>(initialValue);
    const ref = useRef<S>(initialValue);
    ref.current = value;

    return [ref, setValue] as const;
}

export type ComponentForceUpdate = ReturnType<typeof useForceUpdate>;