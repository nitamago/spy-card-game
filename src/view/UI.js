import { GameCard } from './Card.js'

export class GameUI {
    constructor(scene) {
        this.scene = scene;

        this.uiStyle = {
            title: {
                fontSize: "56px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6
            },
            normal: {
                fontSize: "34px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4
            },
            small: {
                fontSize: "26px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 3
            }
        };

        this.gameCard = new GameCard(scene);
    }

    redraw() {
        for (let c of this.scene.backCards){
            c.destroy();
        }
        for (let i = 0; i < this.scene.playerCount; i++) {
            if (this.scene.players[i].eliminated) {
                const spriteColor = 0x222222;
                this.scene.playerSprites[i].list[0].setTint(spriteColor);
            }

            let color = 0x666666;
            if (i === this.scene.currentIndex && this.scene.phase === "RECEIVE_CHOICE")
                color = 0xffff00;
            else if (i === this.scene.turnPlayer)
                color = 0x00aa00;

            const frame = this.scene.playerSprites[i].frame;
            frame.clear();
            frame.lineStyle(4, color);
            frame.strokeRect(-50, -50, 100, 100);

            let factionText = "";
            const p = this.scene.players[i];
            if (i === 0) {
                // 自分の所属は常に見える
                factionText = this.scene.players[i].faction;
            }
            else if (this.scene.phase === "GAME_END") {
                // ゲーム終了後は全員公開
                factionText = this.scene.players[i].faction;
            }
            else if (this.scene.players[i].eliminated) {
                // 脱落者は公開
                factionText = this.scene.players[i].faction;
            }
            else {
                // 生存中の他人は非公開
                factionText = "?";
            }
            this.scene.playerTexts[i].setText(
                `P${i} ${factionText}`
            );
            for(let j=0; j<p.hand.length; j++) {
                const card = this.gameCard.makeCard('back');
                this.scene.backCards.push(card);
                card.setPosition(this.scene.playerTexts[i].x+20*j, this.scene.playerTexts[i].y+70);
                card.setScale(0.1);
            }
            for(let j=0; j<p.received.length; j++) {
                const card = this.gameCard.makeCard(p.received[j]);
                card.setPosition(this.scene.playerTexts[i].x+20*j, this.scene.playerTexts[i].y+120);
                card.setScale(0.1);
            }
        }

        if (this.scene.flowingCard) {
            this.scene.card.setVisible(true);
            // this.scene.cardText.setVisible(true);
            // this.scene.cardText.setText("?");
        } else {
            this.scene.card.setVisible(false);
            // this.scene.cardText.setVisible(false);
        }

        this.scene.info.setText(
            `TURN:P${this.scene.turnPlayer}  PHASE:${this.scene.phase}`
        );

        // 受け取りボタンの表示制御（自分にカードが来た時だけ）
        const show =
            this.scene.phase === "RECEIVE_CHOICE" &&
            this.scene.currentIndex === 0;

        this.scene.btnAccept.bg.setVisible(show);
        this.scene.btnAccept.t.setVisible(show);
        this.scene.btnDecline.bg.setVisible(show);
        this.scene.btnDecline.t.setVisible(show);

        this.drawPlayerHand()

        const showSelect =
            this.scene.phase === "SEND" &&
            this.scene.turnPlayer === 0;

        this.scene.selectCardText.setVisible(showSelect);

        if (this.scene.phase === "GAME_END") {
            this.scene.btnBackToMenu.bg.setVisible(true);
            this.scene.btnBackToMenu.t.setVisible(true);
        } else {
            this.scene.btnBackToMenu.bg.setVisible(false);
            this.scene.btnBackToMenu.t.setVisible(false);
        }
    }

    drawPlayerHand() {
        // いったん全部消す
        for (const s of this.scene.handSprites) {
            s.card.destroy();
        }
        this.scene.handSprites.length = 0;

        const hand = this.scene.players[0].hand;

        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        const startX = w/2-150;
        const y = h/2+500;
        const gap = 80;

        for (let i = 0; i < hand.length; i++) {

            const x = startX + i * gap;

            const card = this.gameCard.makeCard(hand[i]);
            card.setPosition(x, y);
            card.setInteractive({ useHandCursor: true });

            card.once("pointerdown", () => {
                // 自分の手番 & SEND フェイズのみ有効
                if (this.scene.turnPlayer !== 0) return;
                if (this.scene.phase !== "SEND") return;

                if (this.scene.skillUIContainer)
                    this.scene.skillUIContainer.destroy();

                this.scene.selectedHandIndex = i;
            });

            // ★選択中の見た目
            if (this.scene.selectedHandIndex === i &&
                this.scene.turnPlayer === 0 &&
                this.scene.phase === "SEND") {

                card.setStrokeStyle(3, 0xff0000);
            }

            this.scene.handSprites.push({card});
        }
    }

    makeBackground() {
        this.scene.cameras.main.setBackgroundColor(0x666666);
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        const bg = this.scene.add.image(w/2, h/2-300, "backBoard");
    }

    addUI() {
        // ---- UI ----
        this.scene.playerNodes = [];
        this.scene.playerSprites = [];
        this.scene.playerTexts = [];
        this.scene.playerPositions = [];
        this.scene.backCards = [];

        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        const cx = w/2;
        const cy = h/2-300;
        const r = 200;

        for (let i = 0; i < this.scene.playerCount; i++) {
            const ang = (Math.PI * 2 / this.scene.playerCount) * i - Math.PI / 2;

            const x = cx + Math.cos(ang) * r;
            const y = cy + Math.sin(ang) * r;

            const g = this.scene.add.circle(x, y, 50, 0x666666);
            g.setStrokeStyle(3, 0x000000); 

            
            this.scene.playerNodes.push(g);

            const container = this.scene.add.container(x, y);
            const s = this.scene.add.image(0, 0, 
                this.scene.players[i].chara).setScale(0.2);
            const frame = this.scene.add.graphics();
            frame.lineStyle(4, 0xff0000);
            frame.strokeRect(-50, -50, 100, 100);
            container.add([s, frame]);
            container.frame = frame;
            container.setPosition(x, y);
            this.scene.playerSprites.push(container);

            const t = this.scene.add.text(x - 35, y-20, `P${i}`, this.uiStyle.normal);
            this.scene.playerTexts.push(t);

            this.scene.playerPositions.push({ x, y });
            
            // this.scene.cardRect = this.scene.add.rectangle(400, 250, 60, 80, 0x333399);
            // this.scene.cardText = this.scene.add.text(385, 240, "?", { fontSize: 24 });

            this.scene.card = this.gameCard.makeCard('back');
            this.scene.card.setPosition(cx, cy);

            this.scene.info = this.scene.add.text(20, 20, "");
            this.scene.gameResult = this.scene.add.text(20, 40, "");
        }
        
        this.scene.btnAccept = this.makeButton(w/2-100, h/2+400, "受け取る", () => {
            if (this.scene.phase === "RECEIVE_CHOICE" && this.scene.isHuman(this.scene.currentIndex)) {
                this.scene.acceptCard();
            }
        });

        this.scene.btnDecline = this.makeButton(w/2+100, h/2+400, "パス", () => {
            if (this.scene.phase === "RECEIVE_CHOICE" && this.scene.isHuman(this.scene.currentIndex)) {
                this.scene.declineCard();
            }
        });

        this.scene.handSprites = [];

        this.scene.selectCardText = this.scene.add.text(
            w/2-200,
            h/2+400,
            "カードをクリックしてください",
            this.uiStyle.normal
        );

        this.scene.selectCardText.setVisible(false);
        
        this.scene.btnBackToMenu = this.makeButton(w/2, h/2+400, 
            "メニューに戻る", () => {
                this.scene.scene.start("Menu");
    });

        this.scene.btnBackToMenu.bg.setVisible(false);
        this.scene.btnBackToMenu.t.setVisible(false);

        this.scene.btnRules = this.makeButton(w/2+250, h/2-600, "ルール", () => {
            this.showQuickRules();
        });
    }

    showQuickRules() {
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        // 半透明背景
        const bg = this.scene.add.rectangle(0, 0, w, h, 0x000000, 0.6)
            .setOrigin(0)
            .setDepth(1000)
            .setInteractive();

        // ルールパネル
        const panel = this.scene.add.rectangle(w/2, h/2, w*0.8, h*0.8, 0xffffff)
            .setStrokeStyle(4, 0x333333)
            .setDepth(1001);

        const text = this.scene.add.text(
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
            this.uiStyle.small
        )
        .setOrigin(0.5, 0)
        .setDepth(1002);

        // 閉じるボタン
        const closeBtn = this.scene.add.text(
            w/2,
            h/2 + 380,
            "閉じる",
            this.uiStyle.normal
        )
        .setOrigin(0.5)
        .setDepth(1002)
        .setInteractive({ useHandCursor: true });

        const container = this.scene.add.container(0, 0, [
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
            h/2 + 110,
            "cardA",
            "Aカード\nAチームが3枚集めると勝利"
        );

        const rowB = this.makeRuleCardRow(
            w/2  -150,
            h/2 + 180,
            "cardB",
            "Bカード\nBチームが3枚集めると勝利"
        );

        const rowD = this.makeRuleCardRow(
            w/2  -150,
            h/2 + 260,
            "cardDummy",
            "ダミーカード\n3枚受け取ると脱落"
        );

        container.setScale(0.8);
        container.setAlpha(0);

        container.add([rowA, rowB, rowD]);

        this.scene.tweens.add({
            targets: container,
            scale: 1,
            alpha: 1,
            duration: 200,
            ease: "Quad.Out"
        });
    }

    makeRuleCardRow(x, y, key, text) {
        const img = this.scene.add.image(0, 0, key)
            .setDisplaySize(60, 84);

        const txt = this.scene.add.text(
            50,
            -20,
            text,
            this.uiStyle.small
        );

        return this.scene.add.container(x, y, [img, txt]);
    }


    makeButton(x, y, label, onClick) {
        const dx = 40;
        const dy = 12;
        const bg = this.scene.add.rectangle(x, y, 180, 50, 0x444444).setInteractive();
        const t = this.scene.add.text(x -dx, y-dy, label,
            this.uiStyle.normal);

        bg.on("pointerdown", onClick);
        return { bg, t };
    }

    makeFlowingCard(x, y){
        this.scene.card.destroy();
        this.scene.card = this.gameCard.makeCard('back');
        this.scene.card.setPosition(x, y);
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
        const banner = this.scene.add.image(0, 0, key).setScale(0.8);

        // テキスト
        const text = this.scene.add.text(
            0,
            0,
            title,
            this.uiStyle.title
        ).setOrigin(0.5);

        // Containerにまとめる
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        const container = this.scene.add.container(w/2, h/2, [banner, text])
            .setDepth(100);

        container.setAlpha(0);
        container.setScale(0.5);

        // 登場アニメーション
        this.scene.tweens.add({
            targets: container,
            alpha: 1,
            scale: 1,
            duration: 600,
            ease: "Back.Out"
        });

        this.scene.victoryBanner = container;
    }

    moveCardToPlayer(index, onComplete) {
        const pos = this.scene.playerPositions[index];

        this.scene.tweens.add({
            targets: [this.scene.card],
            x: pos.x,
            y: pos.y,
            duration: 300,
            ease: "Sine.easeInOut",
            onComplete: onComplete
        });
    }

    showAbility(playerIndex, text){
        const pos = this.scene.playerPositions[playerIndex];

        const label = this.scene.add.text(pos.x, pos.y - 60, text, {
            fontSize: "22px",
            color: "#ffff00",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: label,
            y: pos.y - 100,
            alpha: 0,
            duration: 1200,
            onComplete: () => label.destroy()
        });
    }

    showAbilityChoice(playerIndex, ability, abilityName){
        return new Promise(resolve => {    
            const w = this.scene.scale.width;
            const h = this.scene.scale.height;
            const skillName = this.scene.add.text(w/2-25,h/2+75, abilityName,{
                fontSize:"28px"
            })
            const btnUse = this.scene.add.text(w/2-100,h/2+110,"USE",{
                fontSize:"28px"
            }).setInteractive();

            const btnSkip = this.scene.add.text(w/2+100,h/2+110,"SKIP",{
                fontSize:"28px"
            }).setInteractive();

            this.scene.skillUIContainer = this.scene.add.container(0, 0, 
                [skillName, btnUse, btnSkip])

            btnUse.once("pointerdown",()=>{
                ability.use(this.scene, playerIndex);
                this.scene.skillUIContainer.destroy();
                resolve(true);
            });

            btnSkip.once("pointerdown",()=>{
                this.scene.skillUIContainer.destroy();
                resolve(false);
            });
        })
    }
}

