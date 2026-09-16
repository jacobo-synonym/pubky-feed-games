(()=>{
 'use strict';
 const $=id=>document.getElementById(id), symbols=['✦','●','▲','■','♥','☀','☂','◆'];
 let config,channel,parentOrigin,started=false,paused=false,done=false,timer=null,timerDeadline=0,remaining=0,pending=null,deck=[],open=[],matched=new Set(),moves=0,delays=[],times=[],goAt=0,go=false,round=0;
 const send=(type,data={})=>{if(channel)parent.postMessage({v:1,channel,type,...data},parentOrigin);};
 function cancel(){clearTimeout(timer);timer=null;pending=null;}
 function schedule(fn,ms){clearTimeout(timer);pending=fn;remaining=ms;timerDeadline=performance.now()+ms;timer=setTimeout(()=>{pending=null;timer=null;fn();},ms);}
 function finish(score){cancel();done=true;$('pause').hidden=true;send('result',{result:{score}});}
 function renderBoard(){
  const restoreFocus=$('board').contains(document.activeElement);
  $('board').replaceChildren();deck.forEach((symbol,index)=>{
   const b=document.createElement('button');const visible=open.includes(index)||matched.has(index);
   b.textContent=visible?symbols[symbol]:'?';b.dataset.open=String(visible);b.disabled=matched.has(index)||open.includes(index)||open.length===2;
   b.setAttribute('aria-label',visible?`Card ${index+1}: symbol ${symbol+1}${matched.has(index)?', matched':''}`:`Reveal card ${index+1}`);
   b.onclick=()=>flip(index);$('board').append(b);
  });if(restoreFocus)$('board').querySelector('button:not(:disabled)')?.focus();$('progress').textContent=`${matched.size/2} / ${deck.length/2} pairs`;$('metric').textContent=`${moves} moves`;
 }
 function flip(index){if(done||paused||open.length===2||matched.has(index)||open.includes(index))return;open.push(index);if(open.length===2){moves++;if(deck[open[0]]===deck[open[1]]){open.forEach(i=>matched.add(i));open=[];$('feedback').textContent='A perfect pair.';if(matched.size===deck.length){renderBoard();finish(ArcadeEngine.memoryScore(deck.length/2,moves));return;}}else{ $('feedback').textContent='Keep those two in mind.';schedule(()=>{open=[];renderBoard();},750);}}renderBoard();}
 function nextRound(){
  if(round>=delays.length){finish(ArcadeEngine.reactionScore(times));return;}
  go=false;$('signal').dataset.go='false';$('signal').disabled=false;$('signal').textContent='Wait for green…';$('progress').textContent=`Round ${round+1} / ${delays.length}`;$('metric').textContent=`${ArcadeEngine.reactionScore(times)} points`;
  schedule(()=>{go=true;goAt=performance.now();$('signal').dataset.go='true';$('signal').textContent='TAP NOW';schedule(()=>answer(true),2000);},delays[round]);
 }
 function answer(missed=false){if(done||paused||!started||$('signal').disabled)return;const elapsed=go&&!missed?Math.max(0,performance.now()-goAt):null;cancel();times.push(elapsed);$('feedback').textContent=elapsed===null?(missed?'Signal missed. Next one!':'Too soon. Wait for the green signal.'):`${Math.round(elapsed)} ms — nice catch.`;$('signal').disabled=true;go=false;round++;schedule(nextRound,850);}
 function start(){cancel();started=true;done=false;paused=false;$('intro').hidden=true;$('paused').hidden=true;$('play').hidden=false;$('pause').hidden=false;$('feedback').textContent='';send('start');
  if(config.kind==='memory'){deck=ArcadeEngine.deck(config.seed,config.difficulty);matched=new Set();open=[];moves=0;$('board').hidden=false;$('signal').hidden=true;renderBoard();$('board').querySelector('button')?.focus();}
  else{delays=ArcadeEngine.reactionDelays(config.seed,config.difficulty);times=[];round=0;$('board').hidden=true;$('signal').hidden=false;nextRound();$('signal').focus();}
 }
 function pause(){if(!started||done||paused)return;paused=true;if(timer){remaining=Math.max(0,timerDeadline-performance.now());clearTimeout(timer);timer=null;}$('play').hidden=true;$('paused').hidden=false;$('resume').focus();}
 function resume(){if(!paused)return;paused=false;$('paused').hidden=true;$('play').hidden=false;if(config.kind==='reaction'){cancel();nextRound();}else if(pending)schedule(pending,remaining);}
 $('start').onclick=start;$('pause').onclick=pause;$('resume').onclick=resume;$('signal').onclick=()=>answer();
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 document.addEventListener('keydown',e=>{if(e.code==='Escape')send('exit');});
 window.addEventListener('message',event=>{
  if(event.source!==parent||event.data?.v!==1)return;const m=event.data;
  if(m.type==='init'&&!channel&&typeof m.channel==='string'&&m.channel.length===36){const c=m.config;if(!c||!['memory','reaction'].includes(c.kind)||!['park','sunset','midnight'].includes(c.theme)||![1,2,3].includes(c.difficulty)||!Number.isInteger(c.seed)||c.seed<1||c.seed>2147483647)return;config=c;channel=m.channel;parentOrigin=event.origin;document.body.dataset.theme=c.theme;$('title').textContent=c.kind==='memory'?'Small cards. Sharp memory.':'A split second of glory.';$('badge').textContent=c.kind==='memory'?'POCKET PAIRS':'SIGNAL SPRINT';$('instructions').textContent=c.kind==='memory'?'Flip two cards. Find every matching pair in as few moves as you can.':'Wait until the signal turns green, then tap. An early tap scores zero for that round.';send('ready');}
  else if(channel&&m.channel===channel){if(m.type==='restart')start();if(m.type==='pause')pause();}
 });
 parent.postMessage({v:1,type:'boot'},'*');
})();
