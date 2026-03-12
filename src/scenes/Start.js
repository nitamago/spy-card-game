/*
  基本ルール v0
  ・能力なし
  ・左回り
  ・受信は選択式
  ・一周したら送信者が強制受信
*/

import { Player } from '../models/Player.js'
import { Card } from '../models/Card.js'
import { AI } from '../AIlogic/AI.js'
import { Abilities } from '../systems/AbilitySystem.js'
import { GameUI } from '../view/UI.js'
import { GameCard } from '../view/Card.js'

const CARD = new Card().CARD;

const Faction = [
    "A", "A", "B", "B", "C", "C"
];


const  charaIndices = [0, 1, 2, 3, 4, 5]
const charaSpriteList = [
  "officer",
  "director",
  "investor",
  "growth",
  "lawyer",
  "cutter"
];

const abilityList = [
  "skipNext",
  "reverseDirection",
  "forceReceive",
  "extraDraw",
  "ignoreDummy",
  "destroyCard",
];

const abilityDescriptions = [
  "次の受信者をスキップできる",
  "送信方向を逆にできる",
  "次の受信者に強制受信させることができる",
  "ターン開始時カードを1枚ドローする",
  "受信したダミーカードを1枚削除できる",
  "受信したカードを1枚削除できる",
];

const playerPositions = [
  { x: 400, y: 500 }, // P0 : 下（プレイヤー）
  { x: 400, y: 100 }, // P1 : 上
  { x: 100, y: 300 }, // P2 : 左
  { x: 700, y: 300 }, // P3 : 右
];

export class Start extends Phaser.Scene {
    constructor() {
        super("Start");
        this.gameUI = new GameUI(this);
    }
    preload() {
        this.load.image('cardBack', 'assets/00000-1827215688.png');
        this.load.image('cardA', 'assets/00001-664435943.png');
        this.load.image('cardB', 'assets/00002-4178699725.png');
        this.load.image('cardDummy', 'assets/00003-3311800611.png');
        this.load.image("backBoard", "assets/backBoard.png");
        this.load.image("bannerA", "assets/victoryBannerA.png");
        this.load.image("bannerB", "assets/victoryBannerB.png");
        this.load.image("bannerC", "assets/victoryBannerC.png");
        this.load.image("officer", "assets/officer.png");
        this.load.image("director", "assets/director.png");
        this.load.image("investor", "assets/investor.png");
        this.load.image("growth", "assets/growth.png");
        this.load.image("lawyer", "assets/lawyer.png");
        this.load.image("cutter", "assets/cutter.png");
        
    }

    create(data) {
        this.gameUI.makeBackground();
        
        
        this.playerCount = data?.playerCount ?? 6;

        Phaser.Utils.Array.Shuffle(Faction);
        Phaser.Utils.Array.Shuffle(charaIndices);
        
        this.players = [];
        this.playerAIs = [];
        for (let i = 0; i < this.playerCount; i++) {
            const idx = charaIndices[i];
            const p = new Player(Faction[idx], abilityList[idx], charaSpriteList[idx], abilityDescriptions[idx]);
            this.players.push(p);
            this.playerAIs.push(new AI(p));
        }
        this.history = new Map();
        for (let i = 0; i < this.playerCount; i++) {
            this.history.set(i, []);
        }

        this.deck = this.createDeck(120);
        Phaser.Utils.Array.Shuffle(this.deck);

        // 初期手札5枚
        for (let p of this.players) {
            for (let i = 0; i < 5; i++) {
                p.hand.push(this.deck.pop());
            }
        }

        this.turnPlayer = 0;

        this.flowingCard = null;
        this.senderIndex = null;
        this.currentIndex = null;
        this.selectedHandIndex = null;

        this.inputLocked = false;
        this.turnStarted = true;

        this.phase = "SEND";

        this.direction = 1;
        this.discardPile = [];

        this.isHuman = (i) => i === 0;

        this.gameUI.addUI();
        this.redraw();
    }

    

    createDeck(total) {
        const deck = [];
        const each = Math.floor(total / 4);

        for (let i = 0; i < each; i++) deck.push(CARD.A);
        for (let i = 0; i < each; i++) deck.push(CARD.B);
        for (let i = 0; i < each*2; i++) deck.push(CARD.DUMMY);

        return deck;
    }


    nextPlayer(i){
        const n = this.players.length;
        let idx =  (i + this.direction + n) % n;
        while(this.players[idx].eliminated) {
            i++;
            idx =  (i + this.direction + n) % n;
        }
        return idx;
    }

    update() {
        if (this.phase === "SEND") {
            this.startSend();
        }
    }

    startSend() {
        const player = this.players[this.turnPlayer];

        if (player.eliminated || player.hand.length === 0) {
            this.endTurn();
            return;
        }
        
        // ターン開始能力は1回だけ
        if (this.turnStarted) {
            this.turnStarted = false;
            this.triggerAbility("turnStart", this.turnPlayer);
        }

        let index;
        if (this.isHuman(this.turnPlayer)) {
            // まだ選んでいなければ送信しない
            if (this.selectedHandIndex === null) { 
                return;
            }
            index = this.selectedHandIndex;
            this.selectedHandIndex = null;
        } else {
            index = this.playerAIs[this.turnPlayer].palyCardJudge();
        }
        
        this.flowingCard = player.hand.splice(index, 1)[0];

        this.senderIndex = this.turnPlayer;
        this.currentIndex = this.nextPlayer(this.senderIndex);
        if(this.skipNext){
            this.currentIndex = this.nextPlayer(this.currentIndex);
            this.skipNext = false;
        }

        const start = this.playerPositions[this.senderIndex];

        this.gameUI.makeFlowingCard(start.x, start.y);
        

        this.phase = "RECEIVE_CHOICE";
        this.redraw();
        this.gameUI.moveCardToPlayer(this.currentIndex, () => {
            this.triggerAbility("receiveStart", this.currentIndex);
            
            // 強制能力処理
            const player = this.players[this.currentIndex];

            console.log(this.currentIndex);
            console.log(player.forceReceive);
            if(player.forceReceive){
                player.forceReceive = false;
                this.acceptCard();
                return;
            } else if(player.forcePass){
                player.forcePass = false;
                this.declineCard();
                return;
            } else {
                this.tryAIDecision(this.currentIndex);
            }
        });

    }

    acceptCard() {
        if (this.inputLocked) return;
        this.inputLocked = true;

        const idx = this.currentIndex;

        this.gameUI.moveCardToPlayer(idx, () => {

            const gameCard = new GameCard(this);
            gameCard.flipReveal(this.flowingCard, () => {

                const p = this.players[idx];
                p.received.push(this.flowingCard);
                this.history.get(this.senderIndex).push(this.flowingCard);
                this.afterReceive(idx);
                
                this.inputLocked = false;
            });

        });

        this.direction = 1;
    }

    declineCard() {
        if (this.inputLocked) return;
        this.inputLocked = true;

        const next = this.nextPlayer(this.currentIndex);

        // 一周して送信者に戻る
        if (next === this.senderIndex) {
            this.currentIndex = this.senderIndex;

            this.gameUI.moveCardToPlayer(this.currentIndex, () => {
                this.forceReceive();
                this.inputLocked = false;
            });
            return;
        }

        this.currentIndex = next;

        this.redraw();

        this.gameUI.moveCardToPlayer(this.currentIndex, () => {
            this.tryAIDecision(this.currentIndex);
            this.inputLocked = false;
        });
    }

    forceReceive() {
        const idx = this.currentIndex;

        this.gameUI.moveCardToPlayer(idx, () => {

            const gameCard = new GameCard(this);
            gameCard.flipReveal(this.flowingCard, () => {

                const p = this.players[idx];
                p.received.push(this.flowingCard);
                this.history.get(this.senderIndex).push(this.flowingCard);
                this.afterReceive(idx);

            });

        });
        this.direction = 1;
    }

    async afterReceive(playerIndex) {   
        await this.triggerAbility("afterReceive", playerIndex);

        this.flowingCard = null;

        this.checkEliminate(playerIndex);

        const winner = this.checkWin();
        if (winner) {
            this.phase = "GAME_END";
            this.gameResult.setText(`WIN : ${winner}`);

            this.gameUI.showVictoryBanner(winner);

            this.redraw();
            return;
        }

        // 手札補充
        this.players[this.senderIndex].hand.push(this.deck.pop());

        this.endTurn();
    }

    checkEliminate(index) {
        const p = this.players[index];
        const dummyCount = p.received.filter(c => c === CARD.DUMMY).length;

        if (dummyCount >= 3) {
        p.eliminated = true;
        }
    }

    checkWin() {
        for (let p of this.players) {
            if (p.eliminated) continue;

            const a = p.received.filter(c => c === CARD.A).length;
            const b = p.received.filter(c => c === CARD.B).length;

            if (p.faction === "A" && a >= 3) return "A TEAM";
            if (p.faction === "B" && b >= 3) return "B TEAM";
        }
        // 生きている勢力が1つかどうか
        const surviveFaction = this.players.filter(p => !p.eliminated).map(p => p.faction);
        const factions = new Set(surviveFaction);
        if (factions.size === 1) {
            const f = factions.keys().next().value;
            if (f != 'C') {
                return factions.keys().next().value + " TEAM";
            } else if (surviveFaction.length == 1) {
                return "C player";
            }
        }
        return null;
    }

    endTurn() {
        this.turnStarted = true;
        this.turnPlayer = this.nextPlayer(this.turnPlayer);
        this.phase = "SEND";
        this.redraw();
    }

    tryAIDecision(currentIndex) {
        if (this.phase !== "RECEIVE_CHOICE") return;

        const idx = currentIndex;

        if (this.isHuman(idx)) return;

        // 少し待ってからAIが判断
        this.time.delayedCall(400, () => {
            if (this.phase !== "RECEIVE_CHOICE") return;

            const take = this.playerAIs[currentIndex].takeJudge(this.senderIndex, this.history);

            if (take) this.acceptCard();
            else this.declineCard();
        });
    }

    redraw() {
        this.gameUI.redraw();
    } 

    async triggerAbility(event, playerIndex){
        const player = this.players[playerIndex];
        if(!player) return;
        if(!player.ability) return;

        const ability = Abilities[player.ability];
        console.log(ability);

        if(ability){
            console.log("can use " +ability.canUse(this, playerIndex, event));
            if(!ability.canUse(this, playerIndex, event)) return;
            if(!ability.ask()) {
                ability.use(this, playerIndex);
                return;
            }

            await this.askAbilityUse(playerIndex, ability, player.ability);
        }
    }

    async askAbilityUse(playerIndex, ability, skillName){
        if(this.isHuman(playerIndex)){
            await this.gameUI.showAbilityChoice(playerIndex, ability, skillName);
        }else{
            if(Math.random() < 0.5){
                ability.use(this, playerIndex);
            }
        }
    }


    // flashPlayer(playerIndex){
    //     const sprite = this.playerSprites[playerIndex];

    //     this.tweens.add({
    //         targets: sprite,
    //         scale: 1.2,
    //         duration: 150,
    //         yoyo: true
    //     });
    // }

    // destroyAnimation(card){
    //     card.setTint(0xff0000);

    //     this.tweens.add({
    //         targets: card,
    //         scale: 0,
    //         alpha: 0,
    //         duration: 400,
    //         onComplete: () => card.destroy()
    //     });
    // }
}