import { Component } from "react";
import { Button, Card } from "react-bootstrap";
import { Game } from "../../../../entity/Game";
import {GameMode} from '@tix320/noir-core';
import OneVSOneImg from "../../../images/mode/1VS1.png";
import teamVSteamImg from "../../../images/mode/teamVSteam.png";


const images = {
    [GameMode.KILLER_VS_INSPECTOR]: OneVSOneImg,
    [GameMode.MAFIA_VS_FBI]: teamVSteamImg,
}

type Props = {
    game: Game,
    onJoin(): void
}

type State = {
}

export class GameCard extends Component<Props,State> {

    join = () => {
        this.props.onJoin();
    }

    render() {
        const game = this.props.game;
        const mode = game.mode;
        const currentPlayersCount = game.currentPlayersCount;
        const maxtPlayersCount = game.maxPlayersCount;

        return (
            <Card style={{ width: '18rem' }}>
                <Card.Img variant="top" src={images[mode]} />
                <Card.Body>
                    <Card.Title>{mode}</Card.Title>
                    <Card.Text>
                        {`Players: ${currentPlayersCount}/${maxtPlayersCount}`}
                    </Card.Text>
                    <Button variant="primary" onClick={this.join}>Join</Button>
                </Card.Body>
            </Card>
        );
    }
}