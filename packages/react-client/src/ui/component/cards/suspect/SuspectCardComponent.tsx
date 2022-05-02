import { Marker, Suspect, SuspectRole } from "@tix320/noir-core/src/game/Game";
import { MouseEvent } from "react";
import killedImage from "@tix320/noir-web-client-core/src/images/card/character/state/killed.png";
import arrestedImage from "@tix320/noir-web-client-core/src/images/card/character/state/arrested.png";
import innocentImage from "@tix320/noir-web-client-core/src/images/card/character/state/innocent.png";
import bombImage from "@tix320/noir-web-client-core/src/images/card/marker/bomb.png";
import shieldImage from "@tix320/noir-web-client-core/src/images/card/marker/shield.png";
import threatImage from "@tix320/noir-web-client-core/src/images/card/marker/threat.png";
import CharacterCard, { Props as CharacterCardProps } from "../character/CharacterCardComponent";
import styles from './SuspectCardComponent.module.css';
import classNames from "classnames";

type OmitFields = 'onClick' | 'character';

type Props = Omit<Partial<CharacterCardProps>, OmitFields> & {
    className?: string,
    additionalMarkerHighLightClassName?: string,
    suspect: Suspect,
    highlightMarkers?: Marker[],
    onMouseEnter?: () => void,
    onMouseLeave?: () => void,
    onSuspectClick?: (suspect: Suspect) => void,
    onMarkerClick?: (suspect: Suspect, marker: Marker) => void
}

export default function SuspectCardComponent(props: Props) {
    const { suspect } = props;

    const onSuspectClick = () => {
        if (props.onSuspectClick) {
            props.onSuspectClick(props.suspect);
        }
    }
    const onMarkerClick = (event: MouseEvent, suspect: Suspect, marker: Marker) => {
        props.onMarkerClick?.(suspect, marker);
        event.stopPropagation();
    }

    return (
        <div className={classNames(styles.container, props.className)}>

            <CharacterCard {...props}
                className={styles.card}
                character={suspect.character}
                highlight={props.highlight}
                onMouseEnter={props.onMouseEnter}
                onMouseLeave={props.onMouseLeave}
                onClick={onSuspectClick} />

            <img className={styles.stateModifier} src={getStateImage(suspect.role)} />

            <div className={styles.markers}>
                {suspect.markersSnapshot().map(marker =>
                    <img key={marker}
                        className={`${styles.markerImg} ${props.highlightMarkers?.includes(marker) ? styles.highlight : ''}`}
                        src={getMarkerImg(marker)}
                        onClick={(event) => onMarkerClick(event, suspect, marker)}
                    />)}
            </div>
        </div>
    );
}

function getMarkerImg(marker: Marker) {
    switch (marker) {
        case Marker.THREAT:
            return threatImage;
        case Marker.BOMB:
            return bombImage;
        case Marker.PROTECTION:
            return shieldImage;
    }
}


function getStateImage(state: SuspectRole<any>) {
    switch (state) {
        case 'killed':
            return killedImage;
        case 'arrested':
            return arrestedImage;
        case 'innocent':
            return innocentImage;
        default:
            return undefined;
    }
}