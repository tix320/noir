import { Character } from "@tix320/noir-core/src/game/Character";
import { useEffect, useState } from "react";
import GameCard, { Props as GameCardProps } from "../GameCardComponent";

type OmitFields = 'onClick' | 'bottomDescription' | 'image';

export type Props = Omit<Partial<GameCardProps>, OmitFields > & {
    character: Character,
    onClick?: (character: Character) => void
}

export default function CharacterCardComponent(props: Props) {
    const { character, onClick } = props;

    const image = require(`@tix320/noir-web-client-core/src/images/card/character/${character.id}.png`);

    return (
        <GameCard {...props} image={image!} bottomDescription={character.name.capitalize()} onClick={onClick} />
    );
}