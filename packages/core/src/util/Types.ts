import { Dto } from "../api/Dto";
import { GameActions } from "../game/GameActions";
import { Role } from "../game/Role";
import Identifiable from "./Identifiable";
import Position from "./Position";

export type Constructor<T> = new (...args: any[]) => T;

export type Replace<
    TypeToBeChecked,
    KeyToBeReplaced extends keyof TypeToBeChecked,
    NewValueToUse
    > = Omit<TypeToBeChecked, KeyToBeReplaced> & {
        [P in KeyToBeReplaced]: NewValueToUse
    }

export type PickByType<T, Value> = {
    [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P]
}

export type OmitByType<T, Value> = {
    [P in keyof T as T[P] extends Value | undefined ? never : P]: T[P]
}

export type ReplaceByType<T, Value, ReplaceValue> = {
    [P in keyof T]: T[P] extends Value
    ? ReplaceValue
    : T[P] extends Value[]
    ? ReplaceValue[]
    // : T[P] extends (infer K)[]
    // ? ReplaceByType<K, Value, ReplaceValue>[]
    : T[P]
}