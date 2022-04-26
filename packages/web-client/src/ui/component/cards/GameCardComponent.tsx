import classNames from 'classnames';
import styles from './GameCardComponent.module.scss';

export type Props = {
    className?: string,
    image: string,
    additionalClassName?: string,
    highlight?: boolean,
    additionalHighLightClassName?: string,
    description?: string,
    onMouseEnter?: () => void,
    onMouseLeave?: () => void,
    onClick?: (...args: any[]) => any,
}


export default function GameCardComponent(props: Props) {
    const highlightClassName = props.highlight ? `${styles.highlight} ${props.additionalHighLightClassName ?? ''}` : '';

    const classnames = classNames(styles.box, props.className, props.additionalClassName, highlightClassName);

    return (
        <div className={classnames}
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
            onClick={props.onClick}>
            <img className={styles.contentImage} src={props.image} />
            <span className={styles.description}> {props.description} </span>
        </div>

    );
}