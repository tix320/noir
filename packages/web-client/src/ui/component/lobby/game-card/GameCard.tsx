import { Component } from "react";
import { Button, Card } from "react-bootstrap";
import { Game } from "../../../../entity/Game";
import teamVSteamImg from "../../../images/teamVSteam.png";

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
        const currentPlayersCount = game.currentPlayersCount;
        const maxtPlayersCount = game.maxPlayersCount;

        return (
            <Card style={{ width: '18rem' }}>
                <Card.Img variant="top" src={teamVSteamImg} />
                <Card.Body>
                    <Card.Title>{game.name}</Card.Title>
                    <Card.Text>
                        {`Players: ${currentPlayersCount}/${maxtPlayersCount}`}
                    </Card.Text>
                    <Button variant="primary" onClick={this.join}>Join</Button>
                </Card.Body>
            </Card>
        );
    }
}