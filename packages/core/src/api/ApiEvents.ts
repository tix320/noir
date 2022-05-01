export namespace ApiEvents {
    export const GET_MY_USER = "myUser";

    export const CREATE_GAME = 'createGame';
    export const JOIN_GAME = 'joinGame';
    export const CHANGE_ROLE_IN_GAME = 'changeRoleInGame';
    export const LEAVE_GAME = 'leaveGame';

    export const DO_GAME_ACTION = 'doGameAction';

    export const SUBSCRIBE_ALL_PREPARING_GAMES = "subscribe_allPreparingGames";
    export const STREAM_ALL_PREPARING_GAMES = "stream_allPreparingGames";

    export const SUBSCRIBE_MY_CURRENT_GAME = "subscribe_myCurrentGame";
    export const STREAM_MY_CURRENT_GAME = (userId: string) => `stream_myCurrentGame_${userId}`;

    export const SUBSCRIBE_PREPARING_GAME = "subscribe_preparingGame";
    export const STREAM_PREPARING_GAME = (gameId: string) => `stream_preparingGame_${gameId}`;

    export const SUBSCRIBE_PLAYING_GAME = "subscribe_playingGame";
    export const STREAM_PLAYING_GAME = (gameId: string) => `stream_playingGame_${gameId}`;

    export const UNSUBSCRIBE = (subscriptionName: string) => `unsubscribe_${subscriptionName}`;
}