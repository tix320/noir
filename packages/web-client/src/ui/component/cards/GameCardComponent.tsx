import styles from './GameCardComponent.module.scss';

export type Props = {
    image: string,
    additionalClassName?: string, 
    highlight?: boolean,
    additionalHighLightClassName?: string,
    description: string,
    onMouseEnter?: () => void,
    onMouseLeave?: () => void,
    onClick?: (...args: any[]) => any,
}


export default function GameCardComponent(props: Props) {
    const highlightClassName = props.highlight ? `${styles.highlight} ${props.additionalHighLightClassName ?? ''}` : '';

    return (
        <div className={`${styles.box} ${props.additionalClassName} ${highlightClassName}`}
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
            onClick={props.onClick}>
            <img className={styles.contentImage} src={props.image} />
            <span className={styles.description}> {props.description} </span>
        </div>

    );
}