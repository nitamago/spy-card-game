export class Player {
    constructor(faction) {
        this.hand = [];
        this.received = [];
        this.eliminated = false;
        this.faction = faction;
    }
}