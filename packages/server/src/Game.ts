import {GameMode} from '@tix320/noir-core';

export default class Game {
    id;
    mode;
    currentPlayersCount = 0;
    maxPlayersCount;


    constructor(id, mode) {
        this.id = id;
        switch (mode) {
           
            case GameMode.KILLER_VS_INSPECTOR:
                this.mode = new KillerVSInspector();
                this.maxPlayersCount = 2;
                break;
            case GameMode.MAFIA_VS_FBI:
                this.mode = new MafiaVSFBI();
                this.maxPlayersCount = 8;
                break;
            default:
                throw new Error(`Invalid mode ${mode}`);
        }
    }
}

class KillerVSInspector {

    getType(){
        return GameMode.KILLER_VS_INSPECTOR
    }
}

class MafiaVSFBI {

    getType(){
        return GameMode.MAFIA_VS_FBI
    }
}