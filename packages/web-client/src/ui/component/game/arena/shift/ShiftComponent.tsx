import { MouseEvent, useEffect, useState } from "react";
import DirectionButton, { Props as DirectionButtonProps } from "../../../util/DirectionButtonComponent";


type Props = Omit<DirectionButtonProps, 'double' | 'onClick'> & {
    fast: boolean,
    onAction: (fast: boolean) => void
}

export default function ShiftComponent(props: Props) {
    const onClick = (event: MouseEvent) => {
        props.onAction(props.fast && event.ctrlKey);
    }

    const [enableFast, setEnableFast] = useState<boolean>(false);

    useEffect(() => {
        if (props.fast) {
            const keyDownListener: (this: Document, ev: KeyboardEvent) => any = (event) => {
                if (event.code === 'ControlLeft') {
                    setEnableFast(true);
                }
            };

            const keyUpListener: (this: Document, ev: KeyboardEvent) => any = (event) => {
                if (event.code === 'ControlLeft') {
                    setEnableFast(false);
                }
            };

            document.addEventListener('keydown', keyDownListener);
            document.addEventListener('keyup', keyUpListener);

            return () => {
                document.removeEventListener('keydown', keyDownListener);
                document.removeEventListener('keydown', keyUpListener);
            }
        }
    }, [props.fast]);

    return (<DirectionButton {...props} double={enableFast} onClick={onClick} />)
}