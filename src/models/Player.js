export class Player {
    constructor(faction, ability, chara) {
        this.hand = [];
        this.received = [];
        this.eliminated = false;
        this.faction = faction;
        this.ability = ability;
        this.chara = chara;
        this.abilityUsed = {};
        this.forceReceive = false;
        this.forcePass = false;
    }
}