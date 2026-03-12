export class Player {
    constructor(faction, ability, chara, abilityDescription) {
        this.hand = [];
        this.received = [];
        this.eliminated = false;
        this.faction = faction;
        this.ability = ability;
        this.abilityDescription = abilityDescription;
        this.chara = chara;
        this.abilityUsed = {};
        this.forceReceive = false;
        this.forcePass = false;
    }
}