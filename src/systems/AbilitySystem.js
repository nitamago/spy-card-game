export const Abilities = {

  // extraDraw(scene, playerIndex, event) {
  //   if (event === "turnStart") {
  //     const p = scene.players[playerIndex];
  //     if(scene.deck.length > 0){
  //       p.hand.push(scene.deck.pop());
  //       scene.redraw();
        
  //       scene.showAbility(playerIndex, "EXTRA DRAW");
  //       //scene.flashPlayer(playerIndex);
  //     } 
  //   }
  // },

  extraDraw:{
      description(){
        return 'hogehoge'
      },
      canUse(scene, playerIndex, event){
          if(event !== "turnStart") return false;
          if(scene.deck.length > 0) return true;
          return false;
      },
      ask(){
        return false;
      },
      use(scene, playerIndex){
          console.log('extraDraw');
          const p = scene.players[playerIndex];

          p.hand.push(scene.deck.pop());
          scene.redraw();
          
          scene.gameUI.showAbility(playerIndex, "EXTRA DRAW");
          //scene.flashPlayer(playerIndex);
      }
  },

  // ignoreDummy(scene, playerIndex, event) {
  //   const p = scene.players[playerIndex];
  
  //   const dummy = p.received.indexOf("D");
  //   if(dummy !== -1){
  //     // すでに使っていたら発動しない
  //     if(p.abilityUsed.ignoreDummy) return;

  //     // 発動
  //     p.abilityUsed.ignoreDummy = true;

  //     p.received.splice(dummy,1);
      
  //     scene.showAbility(playerIndex, "Ignore Dummy");
  //   }
  // },
  ignoreDummy:{
      canUse(scene, playerIndex, event){
          return true;
      },
      ask(){
        return false;
      },
      use(scene, playerIndex){
          console.log('ignoreDummy');
          const p = scene.players[playerIndex];
          const dummy = p.received.indexOf("D");
          if(dummy !== -1){
              // すでに使っていたら発動しない
              if(p.abilityUsed.ignoreDummy) return;

              // 発動
              p.abilityUsed.ignoreDummy = true;

              p.received.splice(dummy,1);
              
              scene.gameUI.showAbility(playerIndex, "Ignore Dummy");
              //scene.flashPlayer(playerIndex);
          }
      }
  },

  // forceReceive(scene, playerIndex, event){
  //   if(event !== "turnStart") return;
  //   console.log("forceReceive");

  //   const player = scene.players[playerIndex];
  //   if(player.abilityUsed.forceReceive) return;

  //   const target = scene.nextPlayer(playerIndex);

  //   scene.players[target].forceReceive = true;
  //   console.log(target);
  //   console.log(scene.players[target]);

  //   player.abilityUsed.forceReceive = true;
    
  //   scene.showAbility(playerIndex, "Force Receive");
  // },

  forceReceive:{
      canUse(scene, playerIndex, event){
          if(event !== "turnStart") return false;
          const player = scene.players[playerIndex];

          if(player.abilityUsed.forceReceive) return false;


          return true;
      },
      ask(){
        return true;
      },
      use(scene, playerIndex){
          console.log('forceReceive');
          const player = scene.players[playerIndex];
          if(player.abilityUsed.forceReceive) return;

          const target = scene.nextPlayer(playerIndex);

          scene.players[target].forceReceive = true;

          player.abilityUsed.forceReceive = true;
          
          scene.gameUI.showAbility(playerIndex, "Force Receive");
          //scene.flashPlayer(playerIndex);

          player.abilityUsed.forceReceive = true;
      }
  },

  // reverseDirection(scene, playerIndex, event){

  //   if(event !== "turnStart") return;

  //   const player = scene.players[playerIndex];
  //   if(player.abilityUsed.reverseDirection) return;

  //   scene.direction *= -1;

  //   scene.showAbility(playerIndex, "REVERSE");
  //   //scene.flashPlayer(playerIndex);

  //   player.abilityUsed.reverseDirection = true;
  // },
  
  reverseDirection:{
      canUse(scene, playerIndex, event){
          if(event !== "turnStart") return false;
          const player = scene.players[playerIndex];

          if(player.abilityUsed.reverseDirection) return false;


          return true;
      },
      ask(){
        return true;
      },
      use(scene, playerIndex){
          console.log('forceReceive');
          const player = scene.players[playerIndex];
          if(player.abilityUsed.reverseDirection) return;

          scene.direction *= -1;

          scene.gameUI.showAbility(playerIndex, "REVERSE");
          //scene.flashPlayer(playerIndex);

          player.abilityUsed.reverseDirection = true;
      }
  },

  // skipNext(scene, playerIndex, event){

  //   console.log("skipNext");
  //   if(event !== "turnStart") return;
  //   console.log("skipNext");

  //   const player = scene.players[playerIndex];
  //   if(player.abilityUsed.skipNext) return;

  //   scene.skipNext = true;

  //   scene.showAbility(playerIndex, "SKIP");
  //   //scene.flashPlayer(playerIndex);

  //   player.abilityUsed.skipNext = true;
  // },

  skipNext:{
      canUse(scene, playerIndex, event){
          if(event !== "turnStart") return false;
          return true;
      },
      ask(){
        return true;
      },
      use(scene, playerIndex){
          console.log('skipNext');
          const player = scene.players[playerIndex];
          if(player.abilityUsed.skipNext) return;

          scene.skipNext = true;

          scene.gameUI.showAbility(playerIndex, "SKIP");
          //scene.flashPlayer(playerIndex);

          player.abilityUsed.skipNext = true;
      }
  },

  // destroyCard(scene, playerIndex, event){
  //     if(event !== "afterReceive") return;

  //     const player = scene.players[playerIndex];
  //     if(player.abilityUsed.destroyCard) return;

  //     if(player.received.length === 0) return;

  //     const card = player.received.pop();

  //     scene.discardPile.push(card);

  //     scene.showAbility(playerIndex, "DESTROY");
  //     //scene.flashPlayer(playerIndex);
  //     //scene.destroyAnimation(card);

  //     player.abilityUsed.destroyCard = true;
  // },

  destroyCard:{
      canUse(scene, playerIndex, event){
          if(event !== "afterReceive") return false;
          const player = scene.players[playerIndex];

          if(player.abilityUsed.destroy) return false;

          if(player.received.length === 0) return false;

          return true;
      },
      ask(){
        return true;
      },
      use(scene, playerIndex){
          console.log('destroyCard');
          const player = scene.players[playerIndex];

          const card = player.received.pop();

          scene.discardPile.push(card);

          scene.gameUI.showAbility(playerIndex,"DESTROY");
          //scene.flashPlayer(playerIndex);

          player.abilityUsed.destroy = true;
      }
  },

};