export class Menu extends Phaser.Scene {

    constructor() {
        super("Menu");
    }

    create() {

        // 背景
        this.cameras.main.setBackgroundColor(0x444444);

        this.add.text(400, 120, "CARD GAME", {
            fontSize: "40px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // 初期値
        this.playerCount = 6;

        this.playerText = this.add.text(400, 220, "", {
            fontSize: "22px",
            color: "#ffffff"
        }).setOrigin(0.5);

        this.updatePlayerText();

        // －ボタン
        // this.makeButton(320, 260, "-", () => {
        //     this.playerCount = Math.max(3, this.playerCount - 1);
        //     this.updatePlayerText();
        // });

        // ＋ボタン
        // this.makeButton(480, 260, "+", () => {
        //     this.playerCount = Math.min(8, this.playerCount + 1);
        //     this.updatePlayerText();
        // });

        // スタートボタン
        this.makeButton(400, 340, "START", () => {
            this.scene.start("Start", {
                playerCount: this.playerCount
            });
        });
    }

    updatePlayerText() {
        this.playerText.setText(`Players : ${this.playerCount}`);
    }

    makeButton(x, y, label, onClick) {

        const bg = this.add.rectangle(x, y, 60, 40, 0x666666)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(x, y, label, {
            fontSize: "24px",
            color: "#ffffff"
        }).setOrigin(0.5);

        bg.on("pointerdown", onClick);

        return { bg, text };
    }
}