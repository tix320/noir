import { Character } from "@tix320/noir-core/src/game/Character";
import { useEffect, useState } from "react";
import GameCard, { Props as GameCardProps } from "../GameCardComponent";

type OmitFields = 'onClick' | 'description' | 'image';

export type Props = Omit<Partial<GameCardProps>, OmitFields > & {
    character: Character,
    onClick?: (character: Character) => void
}

export default function CharacterCardComponent(props: Props) {
    const { character, onClick } = props;

    const image = require(`../../../images/card/character/${character.id}.png`);

    return (
        <GameCard {...props} image={image!} description={character.name.capitalize()} onClick={onClick} />
    );
}