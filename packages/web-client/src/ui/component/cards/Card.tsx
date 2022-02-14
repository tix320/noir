import { Component } from "react";
import frameImg from '../../images/cards/frame.png';
import styles from './Card.module.css';

type Props = {
    className?: string,
    image: string,
    description?: string,
    onClick?: () => void
}

type State = {
}

export class Card extends Component<Props, State> {

    state: State = {}

    render() {
        const image = this.props.image;
        const description = this.props.description;

        return (
                <div className={this.props.className} >
                    <div className={styles.frame} onClick={this.props.onClick}>
                    <img className={styles.contentImage} src={image} />
                    <div className={styles.description} > {description} </div>
                    </div>
                   
                </div>
        );
    }
}