export class GameCard {
    constructor(scene) {
        this.scene = scene;
    }

    flipReveal(cardValue, onComplete) {
        // 裏→エッジ
        this.scene.tweens.add({
            targets: [this.scene.card],
            scaleX: 0,
            duration: 120,
            ease: "Linear",
            onComplete: () => {

                // 表示を本当のカードにする
                const x = this.scene.card.x;
                const y = this.scene.card.y;
                this.scene.card.destroy();
                this.scene.card = this.makeCard(cardValue);
                this.scene.card.setPosition(x, y);

                // const scale = 80/
                // エッジ→表
                this.scene.tweens.add({
                    targets: [this.scene.card],
                    // scaleX: scale,
                    duration: 120,
                    ease: "Linear",
                    onComplete: () => {
                        this.scene.time.delayedCall(500, () => {
                            if (onComplete) onComplete();
                        });
                    }
                });
            }
        });
    }
    
    makeCard(type) {
        let card;
        switch(type){
            case 'A':
                card = this.scene.add.image(400, 250, 'cardA');
                break;
            case 'B':
                card = this.scene.add.image(400, 250, 'cardB');
                break;
            case 'D':
                card = this.scene.add.image(400, 250, 'cardDummy');
                break;
            case 'back':
                card = this.scene.add.image(400, 250, 'cardBack');
                break;
            default:
                card = this.scene.add.image(400, 250, 'cardBack');
        }
        const targetWidth = 80;   // 表示したい横幅(px)
        const scale = targetWidth / card.width;
        card.setScale(scale);
        return card;
    }
}