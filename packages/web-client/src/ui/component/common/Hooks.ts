import { MutableRefObject, useEffect, useRef, useState } from "react";

export type ComponentForceUpdate = ReturnType<typeof useForceUpdate>;

export function useForceUpdate() {
    const [value, setValue] = useState(0);
    return () => setValue(value => value + 1);
}