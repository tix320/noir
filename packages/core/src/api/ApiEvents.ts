export namespace ApiEvents {
    export const GET_MY_USER = "myUser";

    export const CREATE_GAME = 'createGame';
    export const JOIN_GAME = 'joinGame';
    export const CHANGE_ROLE_IN_GAME = 'changeRoleInGame';
    export const LEAVE_GAME = 'leaveGame';
    export const GET_GAME_INITIAL_STATE = 'getGamePlayers';

    export const SUBSCRIBE_ALL_PREPARING_GAMES = "subscribe_allPreparingGames";
    export const ROOM_ALL_PREPARING_GAMES = "room_allPreparingGames";

    export const SUBSCRIBE_MY_CURRENT_GAME = "subscribe_myCurrentGame";
    export const ROOM_MY_CURRENT_GAME = (userId: string) => `room_myCurrentGame_${userId}`;

    export const SUBSCRIBE_PREPARING_GAME = "subscribe_preparingGame";
    export const ROOM_PREPARING_GAME = (gameId: string) => `room_preparingGame_${gameId}`;

    export const SUBSCRIBE_PLAYING_GAME = "subscribe_playingGame";
    export const ROOM_PLAYING_GAME = (gameId: string) => `room_playingGame_${gameId}`;
}