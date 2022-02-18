import { Component } from "react";
import SuspectCard from "../../../entity/Card";

type Props = {
    className: string,
    hidden: boolean,
    cards: PlayerCard[]
}

type State = {
}

export default class PlayersPlaceComponent extends Component<Props, State> {

    render() {
        const cards = ['card'];// this.props.cards;

        return (
            <div>
                {
                    cards.map(card => {
                        return <img src={`../../${card}.png`}/>
                    })
                }
            </div>
        );
    }
}

export interface PlayerCard {
    readonly card: SuspectCard,

}