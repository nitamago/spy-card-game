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

const CARD = new Card().CARD;

const Faction = [
    "A", "A", "B", "B", "C", "C"
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
    }

    create(data) {
        this.cameras.main.setBackgroundColor(0x666666);
        const w = this.scale.width;
        const h = this.scale.height;
        const bg = this.add.image(w/2, h/2-300, "backBoard");
        
        this.playerCount = data?.playerCount ?? 6;

        Phaser.Utils.Array.Shuffle(Faction);
        this.players = [];
        this.playerAIs = [];
        for (let i = 0; i < this.playerCount; i++) {
            const p = new Player(Faction[i]);
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

        this.phase = "SEND";

        this.isHuman = (i) => i === 0;

        this.uiText = {
            fontSize: "30px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4
        };

        this.addUI();
        this.redraw();
    }

    addUI() {
        // ---- UI ----
        this.playerNodes = [];
        this.playerTexts = [];
        this.playerPositions = [];
        this.backCards = [];

        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w/2;
        const cy = h/2-300;
        const r = 200;

        for (let i = 0; i < this.playerCount; i++) {
            const ang = (Math.PI * 2 / this.playerCount) * i - Math.PI / 2;

            const x = cx + Math.cos(ang) * r;
            const y = cy + Math.sin(ang) * r;

            const g = this.add.circle(x, y, 50, 0x666666);
            g.setStrokeStyle(3, 0x000000); 
            const t = this.add.text(x - 35, y-20, `P${i}`, this.uiText);

            this.playerNodes.push(g);
            this.playerTexts.push(t);

            this.playerPositions.push({ x, y });
            
            // this.cardRect = this.add.rectangle(400, 250, 60, 80, 0x333399);
            // this.cardText = this.add.text(385, 240, "?", { fontSize: 24 });

            this.card = this.makeCard('back');
            this.card.setPosition(cx, cy);

            this.info = this.add.text(20, 20, "");
            this.gameResult = this.add.text(20, 40, "");
        }
        
        this.btnAccept = this.makeButton(w/2-100, h/2+400, "受け取る", () => {
            if (this.phase === "RECEIVE_CHOICE" && this.isHuman(this.currentIndex)) {
                this.acceptCard();
            }
        });

        this.btnDecline = this.makeButton(w/2+100, h/2+400, "パス", () => {
            if (this.phase === "RECEIVE_CHOICE" && this.isHuman(this.currentIndex)) {
                this.declineCard();
            }
        });

        this.handSprites = [];

        this.selectCardText = this.add.text(
            w/2-200,
            h/2+400,
            "カードをクリックしてください",
            this.uiText
        );

        this.selectCardText.setVisible(false);
        
        this.btnBackToMenu = this.makeButton(w/2, h/2+400, "メニューに戻る", () => {
            this.scene.start("Menu");
        });

        this.btnBackToMenu.bg.setVisible(false);
        this.btnBackToMenu.t.setVisible(false);

        this.btnRules = this.makeButton(w/2+250, h/2-600, "ルール", () => {
            this.showQuickRules();
        });
    }
    
    makeCard(type) {
        let card;
        switch(type){
            case 'A':
                card = this.add.image(400, 250, 'cardA');
                break;
            case 'B':
                card = this.add.image(400, 250, 'cardB');
                break;
            case 'D':
                card = this.add.image(400, 250, 'cardDummy');
                break;
            case 'back':
                card = this.add.image(400, 250, 'cardBack');
                break;
            default:
                card = this.add.image(400, 250, 'cardBack');
        }
        const targetWidth = 80;   // 表示したい横幅(px)
        const scale = targetWidth / card.width;
        card.setScale(scale);
        return card;
    }

    drawPlayerHand() {
        // いったん全部消す
        for (const s of this.handSprites) {
            s.card.destroy();
        }
        this.handSprites.length = 0;

        const hand = this.players[0].hand;

        const w = this.scale.width;
        const h = this.scale.height;
        const startX = w/2-150;
        const y = h/2+500;
        const gap = 80;

        for (let i = 0; i < hand.length; i++) {

            const x = startX + i * gap;

            // const rect = this.add.rectangle(x, y, 50, 70, 0xffffff)
            //     .setStrokeStyle(2, 0x000000)
            //     .setInteractive();   // ★追加

            // const text = this.add.text(
            //     x - 8,
            //     y - 12,
            //     hand[i],
            //     { fontSize: "20px", color: "#000" }
            // );
            const card = this.makeCard(hand[i]);
            card.setPosition(x, y);
            card.setInteractive({ useHandCursor: true });

            card.on("pointerdown", () => {
                // 自分の手番 & SEND フェイズのみ有効
                if (this.turnPlayer !== 0) return;
                if (this.phase !== "SEND") return;

                this.selectedHandIndex = i;
            });

            // ★選択中の見た目
            if (this.selectedHandIndex === i &&
                this.turnPlayer === 0 &&
                this.phase === "SEND") {

                card.setStrokeStyle(3, 0xff0000);
            }

            this.handSprites.push({card});
        }
    }

    makeButton(x, y, label, onClick) {
        const dx = 40;
        const dy = 12;
        const bg = this.add.rectangle(x, y, 180, 50, 0x444444).setInteractive();
        const t = this.add.text(x -dx, y-dy, label,
            {
                fontSize: "30px",
                color: "#ffffff",
            });

        bg.on("pointerdown", onClick);
        return { bg, t };
    }

    createDeck(total) {
        const deck = [];
        const each = Math.floor(total / 4);

        for (let i = 0; i < each; i++) deck.push(CARD.A);
        for (let i = 0; i < each; i++) deck.push(CARD.B);
        for (let i = 0; i < each*2; i++) deck.push(CARD.DUMMY);

        return deck;
    }

    leftOf(i) {
        let n = i;
        do {
            n = (n + 1) % this.playerCount;
        } while (this.players[n].eliminated);
        return n;
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

        let index;
        if (this.isHuman(this.turnPlayer)) {
            // まだ選んでいなければ送信しない
            if (this.selectedHandIndex === null) return;

            index = this.selectedHandIndex;
            this.selectedHandIndex = null;
        } else {
            index = this.playerAIs[this.turnPlayer].palyCardJudge();
        }
        
        this.flowingCard = player.hand.splice(index, 1)[0];

        this.senderIndex = this.turnPlayer;
        this.currentIndex = this.leftOf(this.senderIndex);
        
        const start = this.playerPositions[this.senderIndex];
        // this.cardRect.setPosition(400, 250);
        this.card.destroy();
        this.card = this.makeCard('back');
        this.card.setPosition(start.x, start.y);
        // this.cardText.setPosition(385, 240);
        // this.cardText.setPosition(start.x-15, start.y-10);

        this.phase = "RECEIVE_CHOICE";
        this.redraw();
        this.moveCardToPlayer(this.currentIndex, () => {
            this.tryAIDecision(this.currentIndex);
        });

    }

    acceptCard() {
        if (this.inputLocked) return;
        this.inputLocked = true;

        const idx = this.currentIndex;

        this.moveCardToPlayer(idx, () => {

            this.flipReveal(this.flowingCard, () => {

                const p = this.players[idx];
                p.received.push(this.flowingCard);
                this.history.get(this.senderIndex).push(this.flowingCard);
                this.afterReceive(idx);
                
                this.inputLocked = false;
            });

        });
    }

    declineCard() {
        if (this.inputLocked) return;
        this.inputLocked = true;

        const next = this.leftOf(this.currentIndex);

        // 一周して送信者に戻る
        if (next === this.senderIndex) {
            this.currentIndex = this.senderIndex;

            this.moveCardToPlayer(this.currentIndex, () => {
                this.forceReceive();
                this.inputLocked = false;
            });
            return;
        }

        this.currentIndex = next;

        this.redraw();

        this.moveCardToPlayer(this.currentIndex, () => {
            this.tryAIDecision(this.currentIndex);
            this.inputLocked = false;
        });
    }

    forceReceive() {
        const idx = this.currentIndex;

        this.moveCardToPlayer(idx, () => {

            this.flipReveal(this.flowingCard, () => {

                const p = this.players[idx];
                p.received.push(this.flowingCard);
                this.history.get(this.senderIndex).push(this.flowingCard);
                this.afterReceive(idx);

            });

        });
    }

    afterReceive(playerIndex) {    
        this.flowingCard = null;

        this.checkEliminate(playerIndex);

        const winner = this.checkWin();
        if (winner) {
            this.phase = "GAME_END";
            this.gameResult.setText(`WIN : ${winner}`);

            this.showVictoryBanner(winner);

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

    showVictoryBanner(winner) {
        let key;
        let title;

        if (winner === "A TEAM") {
            key = "bannerA";
            title = "TEAM A VICTORY";
        }
        else if (winner === "B TEAM") {
            key = "bannerB";
            title = "TEAM B VICTORY";
        }
        else {
            key = "bannerC";
            title = "TEAM C VICTORY";
        }

        // バナー画像
        const banner = this.add.image(0, 0, key).setScale(0.8);

        // テキスト
        const text = this.add.text(
            0,
            0,
            title,
            {
                fontSize: "42px",
                fontStyle: "bold",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6
            }
        ).setOrigin(0.5);

        // Containerにまとめる
        const w = this.scale.width;
        const h = this.scale.height;
        const container = this.add.container(w/2, h/2, [banner, text])
            .setDepth(100);

        container.setAlpha(0);
        container.setScale(0.5);

        // 登場アニメーション
        this.tweens.add({
            targets: container,
            alpha: 1,
            scale: 1,
            duration: 600,
            ease: "Back.Out"
        });

        this.victoryBanner = container;
    }

    endTurn() {
        this.turnPlayer = this.leftOf(this.turnPlayer);
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
        for (let c of this.backCards){
            c.destroy();
        }
        for (let i = 0; i < this.playerCount; i++) {
            let color = 0x666666;

            if (this.players[i].eliminated) color = 0x222222;
            else if (i === this.currentIndex && this.phase === "RECEIVE_CHOICE")
                color = 0xffff00;
            else if (i === this.turnPlayer)
                color = 0x00aa00;

            this.playerNodes[i].fillColor = color;

            let factionText = "";
            const p = this.players[i];
            if (i === 0) {
                // 自分の所属は常に見える
                factionText = this.players[i].faction;
            }
            else if (this.phase === "GAME_END") {
                // ゲーム終了後は全員公開
                factionText = this.players[i].faction;
            }
            else if (this.players[i].eliminated) {
                // 脱落者は公開
                factionText = this.players[i].faction;
            }
            else {
                // 生存中の他人は非公開
                factionText = "?";
            }
            this.playerTexts[i].setText(
                `P${i} ${factionText}`
            );
            for(let j=0; j<p.hand.length; j++) {
                const card = this.makeCard('back');
                this.backCards.push(card);
                card.setPosition(this.playerTexts[i].x+20*j, this.playerTexts[i].y+70);
                card.setScale(0.1);
            }
            for(let j=0; j<p.received.length; j++) {
                console.log(p.received[j]);
                const card = this.makeCard(p.received[j]);
                card.setPosition(this.playerTexts[i].x+20*j, this.playerTexts[i].y+120);
                card.setScale(0.1);
            }
        }

        if (this.flowingCard) {
            this.card.setVisible(true);
            // this.cardText.setVisible(true);
            // this.cardText.setText("?");
        } else {
            this.card.setVisible(false);
            // this.cardText.setVisible(false);
        }

        this.info.setText(
            `TURN:P${this.turnPlayer}  PHASE:${this.phase}`
        );

        // 受け取りボタンの表示制御（自分にカードが来た時だけ）
        const show =
            this.phase === "RECEIVE_CHOICE" &&
            this.currentIndex === 0;

        this.btnAccept.bg.setVisible(show);
        this.btnAccept.t.setVisible(show);
        this.btnDecline.bg.setVisible(show);
        this.btnDecline.t.setVisible(show);

        this.drawPlayerHand()

        const showSelect =
            this.phase === "SEND" &&
            this.turnPlayer === 0;

        this.selectCardText.setVisible(showSelect);

        if (this.phase === "GAME_END") {
            this.btnBackToMenu.bg.setVisible(true);
            this.btnBackToMenu.t.setVisible(true);
        } else {
            this.btnBackToMenu.bg.setVisible(false);
            this.btnBackToMenu.t.setVisible(false);
        }
    }

    moveCardToPlayer(index, onComplete) {
        const pos = this.playerPositions[index];

        this.tweens.add({
            targets: [this.card],
            x: pos.x,
            y: pos.y,
            duration: 300,
            ease: "Sine.easeInOut",
            onComplete: onComplete
        });
    }

    flipReveal(cardValue, onComplete) {
        // 裏→エッジ
        this.tweens.add({
            targets: [this.card],
            scaleX: 0,
            duration: 120,
            ease: "Linear",
            onComplete: () => {

                // 表示を本当のカードにする
                const x = this.card.x;
                const y = this.card.y;
                this.card.destroy();
                this.card = this.makeCard(cardValue);
                this.card.setPosition(x, y);

                // const scale = 80/
                // エッジ→表
                this.tweens.add({
                    targets: [this.card],
                    // scaleX: scale,
                    duration: 120,
                    ease: "Linear",
                    onComplete: () => {
                        this.time.delayedCall(500, () => {
                            if (onComplete) onComplete();
                        });

                    }
                });
            }
        });
    }

    showQuickRules() {
        const w = this.scale.width;
        const h = this.scale.height;

        // 半透明背景
        const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.6)
            .setOrigin(0)
            .setDepth(1000)
            .setInteractive();

        // ルールパネル
        const panel = this.add.rectangle(w/2, h/2, w*0.8, h*0.8, 0xffffff)
            .setStrokeStyle(4, 0x333333)
            .setDepth(1001);

        const text = this.add.text(
            w/2,
            h/2 - 500,
    `クイックルール

    目的
    自分のチームのカードを3枚集めると勝利

    ターン
    1. 手札からカードを1枚出す
    2. カードはプレイヤーの間を回る
    3. 回ってきたら「受け取る」か「パス」

    ルール
    カードが一周すると
    出した人が必ず受け取る

    ダミーカード3枚で脱落
    
    勝利条件
    ・Aチーム：Aカードを3枚集める
    ・Bチーム：Bカードを3枚集める
    ・Cチーム：最後まで生き残り、単独勝利`,
            {
                fontSize: "24px",
                color: "#000",
                align: "left",
            }
        )
        .setOrigin(0.5, 0)
        .setDepth(1002);

        // 閉じるボタン
        const closeBtn = this.add.text(
            w/2,
            h/2 + 380,
            "閉じる",
            {
                fontSize: "30px",
                color: "#ffffff",
                backgroundColor: "#444444",
                padding: { x: 12, y: 6 }
            }
        )
        .setOrigin(0.5)
        .setDepth(1002)
        .setInteractive({ useHandCursor: true });

        const container = this.add.container(0, 0, [
            bg,
            panel,
            text,
            closeBtn
        ]).setDepth(1000);

        closeBtn.on("pointerdown", () => {
            container.destroy();
        });

        const rowA = this.makeRuleCardRow(
            w/2 -150,
            h/2 +80,
            "cardA",
            "Aカード\nAチームが3枚集めると勝利"
        );

        const rowB = this.makeRuleCardRow(
            w/2  -150,
            h/2 +150,
            "cardB",
            "Bカード\nBチームが3枚集めると勝利"
        );

        const rowD = this.makeRuleCardRow(
            w/2  -150,
            h/2 + 230,
            "cardDummy",
            "ダミーカード\n3枚受け取ると脱落"
        );

        container.setScale(0.8);
        container.setAlpha(0);

        container.add([rowA, rowB, rowD]);

        this.tweens.add({
            targets: container,
            scale: 1,
            alpha: 1,
            duration: 200,
            ease: "Quad.Out"
        });
    }

    makeRuleCardRow(x, y, key, text) {
        const img = this.add.image(0, 0, key)
            .setDisplaySize(60, 84);

        const txt = this.add.text(
            50,
            -20,
            text,
            {
                fontSize: "24px",
                color: "#000"
            }
        );

        return this.add.container(x, y, [img, txt]);
    }
}