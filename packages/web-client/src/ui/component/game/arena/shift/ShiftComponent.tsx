import { MouseEvent, useEffect, useState } from "react";
import DirectionButton, { Props as DirectionButtonProps } from "../../../util/DirectionButtonComponent";


type Props = Omit<DirectionButtonProps, 'double' | 'onClick'> & {
    fast: boolean,
    onAction: (fast: boolean) => void
}

export default function ShiftComponent(props: Props) {
    const onClick = () => {
        props.onAction(props.fast);
    }

    return (<DirectionButton {...props} double={props.fast} onClick={onClick} />)
}