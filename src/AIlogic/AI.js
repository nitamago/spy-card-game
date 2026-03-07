import { Card } from '../models/Card.js'

const CARD = new Card().CARD;

export class AI {
    constructor(player, playerNum) {
        this.player = player;
        this.playerCredits = [];
        for (let i; i<playerNum; i++) {
            this.playerCredits.push(0.5);
        }
    }

    takeJudge(sender, history) {
        // ダミー2枚まで積極的にとっていく
        // const dummyCount = this.player.received.filter(c => c === CARD.DUMMY).length;
        const cards = history.get(sender);
        const cardCount = cards.length
        const dummyCount = cards.filter(c => c!=='D').length
        console.log(Phaser.Math.RND.frac(), dummyCount/(cardCount+0.0001))
        if (Phaser.Math.RND.frac() < dummyCount/(cardCount+0.0001)) {
            return true;
        }else {
            return false;
        }
        
    }

    palyCardJudge(){
        const hands = this.player.hand;
        for (let i = 0; i < hands.length; i++) {
            // 自陣営のカード優先で出す
            if (this.player.faction === hands[i]) {
                return i;
            } 
            // Cはダミー優先            
            else if (this.player.faction === "C") {
                if (CARD['DUMMY'] === hands[i]) {
                    return i;
                }
            }
        }
        const index = Phaser.Math.Between(0, hands.length - 1);
        return index;
    }
}