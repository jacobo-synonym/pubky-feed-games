/* Pure, seeded rules shared with tests. Scores remain casual and self-reported. */
(function(root){
 function random(seed){let n=seed>>>0;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};}
 function deck(seed,difficulty){const count=[4,6,8][difficulty-1], cards=Array.from({length:count*2},(_,i)=>i%count),rng=random(seed);for(let i=cards.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}return cards;}
 function memoryScore(pairs,moves){return Math.max(10,pairs*100-Math.max(0,moves-pairs)*20);}
 function reactionDelays(seed, difficulty){const rng=random(seed);return Array.from({length:3+difficulty*2},()=>1000+Math.floor(rng()*2200));}
 function reactionScore(times){return times.reduce((sum,ms)=>sum+(ms===null?0:Math.max(0,1000-Math.round(ms))),0);}
 root.ArcadeEngine={deck,memoryScore,reactionDelays,reactionScore};
})(globalThis);
