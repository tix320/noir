import { Dto } from "@tix320/noir-core/src/api/Dto";
import { Component } from "react";
import { Button, Card } from "react-bootstrap";
import cardImg from "@tix320/noir-web-client-core/src/images/battle.png";
import styles from "./GameListItemComponent.module.css";

type Props = {
    game: Dto.GamePreparation,
    onJoin(): void
}

type State = {
}

export default class GameListItemComponent extends Component<Props,State> {

    join = () => {
        this.props.onJoin();
    }

    render() {
        const game = this.props.game;
        
        const currentPlayersCount = game.roles.length;
        const maxPlayersCount = game.maxPlayersCount;

        return (
            <Card style={{ width: 'min(20%,250px)', backgroundColor: 'rgb(68 72 78)', borderRadius: '5%' }}>
                <Card.Img variant="top" src={cardImg} />
                <Card.Body className={styles.body} >
                    <Card.Title>{game.name}</Card.Title>
                    <Card.Text>
                        {`Players: ${currentPlayersCount}/${maxPlayersCount}`}
                    </Card.Text>
                    <Button className={styles.joinButton} variant="primary" onClick={this.join}>Join</Button>
                </Card.Body>
            </Card>
        );
    }
}