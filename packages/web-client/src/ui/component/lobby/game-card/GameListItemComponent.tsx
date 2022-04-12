import { Dto } from "@tix320/noir-core/src/api/Dto";
import { Component } from "react";
import { Button, Card } from "react-bootstrap";
import teamVSteamImg from "../../../images/teamVSteam.png";

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
            <Card style={{ width: '18rem' }}>
                <Card.Img variant="top" src={teamVSteamImg} />
                <Card.Body>
                    <Card.Title>{game.name}</Card.Title>
                    <Card.Text>
                        {`Players: ${currentPlayersCount}/${maxPlayersCount}`}
                    </Card.Text>
                    <Button variant="primary" onClick={this.join}>Join</Button>
                </Card.Body>
            </Card>
        );
    }
}