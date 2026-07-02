let points = 888000, totalBetMap = new Map(), pendingMap = new Map(), curChip = 100, isSettling = false, bettingLocked = false, countdown = 15, timer = null, diceResults = [1,2,3], totalSum = 6, historyList = [];
let allBets = ['small','big','odd','even'];
for(let i=1;i<=6;i++) { allBets.push(`single${i}`); allBets.push(`double${i}`); }
const doubleCombos = [[1,2],[1,3],[1,4],[1,5],[1,6],[2,3],[2,4],[2,5],[2,6],[3,4],[3,5],[3,6],[4,5],[4,6],[5,6]];
doubleCombos.forEach(combo => allBets.push(`combo_${combo[0]}_${combo[1]}`));
for(let i=1;i<=6;i++) allBets.push(`triple_${i}`);
allBets.push('anyTriple');
for(let s=4;s<=17;s++) allBets.push(`sum_${s}`);
allBets.forEach(k => { totalBetMap.set(k,0); pendingMap.set(k,0); });
const sumOdds = { 4:50, 5:18, 6:14, 7:12, 8:8, 9:6, 10:6, 11:6, 12:6, 13:8, 14:12, 15:14, 16:18, 17:50 };
function updatePointsUI() { document.getElementById('pointsDisplay').innerText = points.toLocaleString(); }
function addChatMessage(name, msg, color="#ffbb88") {
let container = document.getElementById('chatMessages');
let t = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
let d = document.createElement('div');
d.className = 'chat-msg';
d.innerHTML = `<span class="msg-name" style="color:${color};">${name}</span><span class="msg-time">${t}</span><span> : ${msg}</span>`;
container.appendChild(d);
container.scrollTop = container.scrollHeight;
if(container.children.length > 50) container.removeChild(container.children[0]);
}
function addGiftAnimation(giftName, giftPrice) {
const animDiv = document.createElement('div');
animDiv.className = 'gift-animation';
animDiv.innerHTML = `🎁 ${giftName} +${giftPrice}`;
document.body.appendChild(animDiv);
setTimeout(() => animDiv.remove(), 1500);
}
function updateTotalSpan() { let sum=0; for(let v of totalBetMap.values()) sum+=v; document.getElementById('totalBetAmount').innerText = sum.toLocaleString(); updateChatPermission && updateChatPermission(); }
function formatChipLabel(val) {
if(val >= 1000000) return (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1) + 'M';
if(val >= 1000) return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'K';
return String(val);
}
function renderChipStack(area, amount, hasPending) {
if(!area || amount <= 0) return;
const chipCount = Math.min(3, Math.max(1, Math.ceil(amount / 5000)));
for(let i = 0; i < chipCount; i++) {
const chip = document.createElement('div');
chip.className = 'bet-chip-full bet-chip-pop' + (hasPending ? ' pending' : '');
chip.innerText = i === chipCount - 1 ? formatChipLabel(amount) : '';
area.appendChild(chip);
}
if(amount > curChip) {
const badge = document.createElement('div');
badge.className = 'bet-chip-badge';
badge.innerText = formatChipLabel(amount);
area.appendChild(badge);
}
}
function refreshAllChips() {
document.querySelectorAll('[id^="chipsArea-"]').forEach(area => area.innerHTML = '');
const keys = new Set([...totalBetMap.keys(), ...pendingMap.keys()]);
keys.forEach(key => {
const confirmed = totalBetMap.get(key) || 0;
const pending = pendingMap.get(key) || 0;
const amount = confirmed + pending;
const area = document.getElementById(`chipsArea-${key}`);
renderChipStack(area, amount, pending > 0);
});
}
function getDice3x3Positions(v) { const m={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}; return m[v]||[4]; }
function isRedDot(v) { return v===1||v===4||v===6; }
function getClearDiceDots(value) { let indexes = getDice3x3Positions(value); let dotClass = isRedDot(value) ? 'dot-large-red' : 'dot-large'; let html = '<div class="dice-dot-grid-large">'; for(let i=0;i<9;i++) { let has = indexes.includes(i); html += `<div class="dot-cell-large">${has ? `<div class="${dotClass}"></div>` : ''}</div>`; } html += '</div>'; return html; }
function updateDiceDisplay(arr) { document.getElementById('dice1').innerHTML = getClearDiceDots(arr[0]); document.getElementById('dice2').innerHTML = getClearDiceDots(arr[1]); document.getElementById('dice3').innerHTML = getClearDiceDots(arr[2]); document.getElementById('totalResult').innerHTML = `總和: ${arr[0]+arr[1]+arr[2]}`; }
function hideCountdown() { const el=document.getElementById('radarCountdown')||document.querySelector('.radar-countdown'); if(el) el.classList.add('hidden-countdown'); }
function showCountdown() { const el=document.getElementById('radarCountdown')||document.querySelector('.radar-countdown'); if(el) el.classList.remove('hidden-countdown'); }
function startShaking() { document.querySelectorAll('.dice-cup').forEach(cup => cup.classList.add('shaking')); document.getElementById('dealerMsg').innerHTML = '🎲 骰盅搖晃中 ... 🎲'; }
function stopShaking() { document.querySelectorAll('.dice-cup').forEach(cup => cup.classList.remove('shaking')); }
async function rollDiceAnim() {
startShaking();
hideCountdown();
await new Promise(r => setTimeout(r, 800));
let d1 = Math.floor(Math.random() * 6) + 1, d2 = Math.floor(Math.random() * 6) + 1, d3 = Math.floor(Math.random() * 6) + 1;
diceResults = [d1, d2, d3];
totalSum = d1 + d2 + d3;
stopShaking();
document.getElementById('dealerMsg').innerHTML = '🔓 揭開骰盅 ... 🔓';
const diceDivs = [document.getElementById('dice1'), document.getElementById('dice2'), document.getElementById('dice3')];
diceDivs.forEach(d => d.classList.add('reveal'));
updateDiceDisplay(diceResults);
await new Promise(r => setTimeout(r, 300));
diceDivs.forEach(d => d.classList.remove('reveal'));
document.getElementById('dealerMsg').innerHTML = '🔍 開牌確認中 (6秒) ... 🔍';
await new Promise(r => setTimeout(r, 6000));
document.getElementById('dealerMsg').innerHTML = '✨ 開放下注 ✨';
return { dice: diceResults, sum: totalSum };
}
function generateSingleDice(v) { let idx=getDice3x3Positions(v); let cls=isRedDot(v)?'dot-red-single':'dot-black-single'; let h='<div class="dice-grid-single">'; for(let i=0;i<9;i++){ h+=`<div class="flex justify-center items-center">${idx.includes(i)?`<div class="${cls}"></div>`:''}</div>`; } h+='</div>'; return h; }
function generateDoubleDice(v) { let idx=getDice3x3Positions(v); let cls=isRedDot(v)?'dot-red-double':'dot-black-double'; let h='<div class="dice-grid-double">'; for(let i=0;i<9;i++){ h+=`<div class="flex justify-center items-center">${idx.includes(i)?`<div class="${cls}"></div>`:''}</div>`; } h+='</div>'; return h; }
function getComboDiceHTML(v) { let idx=getDice3x3Positions(v); let cls=isRedDot(v)?'dot-red-combo':'dot-black-combo'; let h='<div class="dice-combo-grid">'; for(let i=0;i<9;i++){ h+=`<div class="flex justify-center items-center">${idx.includes(i)?`<div class="${cls}"></div>`:''}</div>`; } h+='</div>'; return h; }
function getTripleDiceHTML(v) { let idx=getDice3x3Positions(v); let cls=isRedDot(v)?'triple-dot-red':'triple-dot-black'; let h='<div class="triple-dice-grid">'; for(let i=0;i<9;i++){ h+=`<div class="flex justify-center items-center">${idx.includes(i)?`<div class="${cls}"></div>`:''}</div>`; } h+='</div>'; return h; }
function getCenterDiceHTML(v) { let idx=getDice3x3Positions(v); let cls=isRedDot(v)?'center-dot-red':'center-dot-black'; let h='<div class="center-dice-grid">'; for(let i=0;i<9;i++){ h+=`<div class="flex justify-center items-center">${idx.includes(i)?`<div class="${cls}"></div>`:''}</div>`; } h+='</div>'; return h; }

function sicboLangCode(){try{return localStorage.getItem('ab_sicbo_lang_v1')||'zh-TW';}catch(e){return 'zh-TW';}}
function sicboBetWord(key){
  const lang=sicboLangCode();
  const words={
    'zh-TW':{big:'大',small:'小',odd:'單',even:'雙',oddSub:'奇數',evenSub:'偶數',anyTriple:'全圍',single:'單骰',double:'對子',triple:'圍骰',combo:'組合',sum:'總和',waiting:'等待開獎'},
    'zh-CN':{big:'大',small:'小',odd:'单',even:'双',oddSub:'奇数',evenSub:'偶数',anyTriple:'全围',single:'单骰',double:'对子',triple:'围骰',combo:'组合',sum:'总和',waiting:'等待开奖'},
    en:{big:'Big',small:'Small',odd:'Odd',even:'Even',oddSub:'Odd',evenSub:'Even',anyTriple:'Any Triple',single:'Single',double:'Pair',triple:'Triple',combo:'Combo',sum:'Total',waiting:'Waiting'},
    ja:{big:'大',small:'小',odd:'奇',even:'偶',oddSub:'奇数',evenSub:'偶数',anyTriple:'全ゾロ',single:'単一',double:'ペア',triple:'ゾロ目',combo:'組合せ',sum:'合計',waiting:'結果待ち'},
    ko:{big:'대',small:'소',odd:'홀',even:'짝',oddSub:'홀수',evenSub:'짝수',anyTriple:'전체 트리플',single:'단일',double:'페어',triple:'트리플',combo:'조합',sum:'합계',waiting:'결과 대기'}
  };
  return (words[lang]||words['zh-TW'])[key] || key;
}
function translateBigSmall(v){return (v==='大'||v==='Big'||v==='大'||v==='대')?sicboBetWord('big'):sicboBetWord('small');}
function translateOddEven(v){return (v==='單'||v==='单'||v==='Odd'||v==='奇'||v==='홀')?sicboBetWord('odd'):sicboBetWord('even');}

function buildSingleDice() { let c=document.getElementById('singleDiceGrid'); c.innerHTML=''; for(let i=1;i<=6;i++){ let dice=generateSingleDice(i); let cd=document.createElement('div'); cd.className='bet-card p-1 text-center relative transition-all'; cd.setAttribute('data-bet',`single${i}`); cd.innerHTML=`${dice}<div class="text-white font-bold text-[9px] mt-0.5">${i}</div><div class="absolute right-0.5 bottom-0.5 flex gap-0.5 pointer-events-none" id="chipsArea-single${i}"></div>`; c.appendChild(cd); } }
function buildDoubleDice() { let c=document.getElementById('doubleDiceGrid'); c.innerHTML=''; for(let i=1;i<=6;i++){ let left=generateDoubleDice(i); let right=generateDoubleDice(i); let cd=document.createElement('div'); cd.className='bet-card p-0.5 text-center relative transition-all'; cd.setAttribute('data-bet',`double${i}`); cd.innerHTML=`<div class="double-dice-group"><div>${left}</div><div>${right}</div></div><div class="text-white font-bold text-[7px] mt-0.5">${sicboBetWord('double')} ${i}</div><div class="absolute right-0.5 bottom-0.5 flex gap-0.5 pointer-events-none" id="chipsArea-double${i}"></div>`; c.appendChild(cd); } }
function buildComboButtons() { let c=document.getElementById('comboGrid'); let combos=[{id:'small',label:sicboBetWord('small'),sub:'4~10',color:'from-blue-600 to-indigo-800'},{id:'odd',label:sicboBetWord('odd'),sub:sicboBetWord('oddSub'),color:'from-purple-600 to-pink-800'},{id:'big',label:sicboBetWord('big'),sub:'11~17',color:'from-red-600 to-rose-800'},{id:'even',label:sicboBetWord('even'),sub:sicboBetWord('evenSub'),color:'from-emerald-600 to-teal-800'}]; c.innerHTML=''; combos.forEach(com=>{ let cd=document.createElement('div'); cd.className=`combo-card text-center relative transition-all bg-gradient-to-br ${com.color} bg-opacity-60 backdrop-blur-sm`; cd.setAttribute('data-bet',com.id); cd.innerHTML=`<div class="combo-label text-white drop-shadow-lg">${com.label}</div><div class="combo-sub text-cyan-100 font-medium">${com.sub}</div><div class="combo-odds font-bold text-yellow-300">1:1</div><div class="absolute right-0.5 bottom-0.5 flex gap-0.5 pointer-events-none" id="chipsArea-${com.id}"></div>`; c.appendChild(cd); }); }
function buildDoubleComboGrid() { let c=document.getElementById('doubleComboGrid'); c.innerHTML=''; doubleCombos.forEach(com=>{ let d1=com[0],d2=com[1]; let betKey=`combo_${d1}_${d2}`; let cd=document.createElement('div'); cd.className='combo-bet-card'; cd.setAttribute('data-bet',betKey); cd.innerHTML=`<div class="two-dice-row">${getComboDiceHTML(d1)}${getComboDiceHTML(d2)}</div><div class="absolute right-0.5 bottom-0.5 flex gap-0.5 pointer-events-none" id="chipsArea-${betKey}"></div>`; c.appendChild(cd); }); }
function buildTripleSection() { let container=document.getElementById('tripleBettingContainer'); container.innerHTML=''; let leftVals=[1,2,3], rightVals=[4,5,6]; let leftDiv=document.createElement('div'); leftDiv.className='triple-side'; let leftGrid=document.createElement('div'); leftGrid.className='triple-side-grid'; leftVals.forEach(v=>{ let cd=document.createElement('div'); cd.className='triple-card'; cd.setAttribute('data-bet',`triple_${v}`); cd.innerHTML=`<div class="three-dice-row">${getTripleDiceHTML(v)}${getTripleDiceHTML(v)}${getTripleDiceHTML(v)}</div><div class="triple-odds">1:180</div><div class="absolute right-1 bottom-1 flex gap-0.5 pointer-events-none" id="chipsArea-triple_${v}"></div>`; leftGrid.appendChild(cd); }); leftDiv.appendChild(leftGrid); let rightDiv=document.createElement('div'); rightDiv.className='triple-side'; let rightGrid=document.createElement('div'); rightGrid.className='triple-side-grid'; rightVals.forEach(v=>{ let cd=document.createElement('div'); cd.className='triple-card'; cd.setAttribute('data-bet',`triple_${v}`); cd.innerHTML=`<div class="three-dice-row">${getTripleDiceHTML(v)}${getTripleDiceHTML(v)}${getTripleDiceHTML(v)}</div><div class="triple-odds">1:180</div><div class="absolute right-1 bottom-1 flex gap-0.5 pointer-events-none" id="chipsArea-triple_${v}"></div>`; rightGrid.appendChild(cd); }); rightDiv.appendChild(rightGrid); let centerDiv=document.createElement('div'); centerDiv.className='triple-center'; centerDiv.setAttribute('data-bet','anyTriple'); let gridHtml='<div class="center-triple-grid">'; for(let i=0;i<3;i++){ let leftVal=[1,2,3][i]; let rightVal=[4,5,6][i]; gridHtml+=`<div class="center-triple-item"><div class="center-triple-dice-row">${getCenterDiceHTML(leftVal)}${getCenterDiceHTML(leftVal)}${getCenterDiceHTML(leftVal)}</div></div><div class="center-triple-item"><div class="center-triple-dice-row">${getCenterDiceHTML(rightVal)}${getCenterDiceHTML(rightVal)}${getCenterDiceHTML(rightVal)}</div></div>`; } gridHtml+='</div>'; centerDiv.innerHTML=`<div class="center-title">${sicboBetWord('anyTriple')}</div>${gridHtml}<div class="center-odds">1:30</div><div class="absolute right-1 bottom-1 flex gap-0.5 pointer-events-none" id="chipsArea-anyTriple"></div>`; container.appendChild(leftDiv); container.appendChild(centerDiv); container.appendChild(rightDiv); }
function buildTotalSection() { const wrapper = document.getElementById('totalBetWrapper'); wrapper.innerHTML = ''; const row1Sums = [4,5,6,7,8,9,10]; const row2Sums = [11,12,13,14,15,16,17]; const row1Div = document.createElement('div'); row1Div.className = 'total-row'; const row2Div = document.createElement('div'); row2Div.className = 'total-row'; row1Sums.forEach(sum => { const card = document.createElement('div'); card.className = 'total-card relative'; card.setAttribute('data-bet', `sum_${sum}`); const odds = sumOdds[sum]; card.innerHTML = `<div class="total-number">${sum}</div><div class="total-odds">1:${odds}</div><div class="absolute right-0.5 bottom-0.5 flex gap-0.5 pointer-events-none" id="chipsArea-sum_${sum}"></div>`; row1Div.appendChild(card); }); row2Sums.forEach(sum => { const card = document.createElement('div'); card.className = 'total-card relative'; card.setAttribute('data-bet', `sum_${sum}`); const odds = sumOdds[sum]; card.innerHTML = `<div class="total-number">${sum}</div><div class="total-odds">1:${odds}</div><div class="absolute right-0.5 bottom-0.5 flex gap-0.5 pointer-events-none" id="chipsArea-sum_${sum}"></div>`; row2Div.appendChild(card); }); wrapper.appendChild(row1Div); wrapper.appendChild(row2Div); attachBetEvents(); }
function getDefaultChips(){
return [
{val:5,tone:'red',label:'5'},
{val:10,tone:'blue',label:'10'},
{val:50,tone:'green',label:'50'},
{val:100,tone:'purple',label:'100'},
{val:500,tone:'gold',label:'500'},
{val:1000,tone:'blackgold',label:'1K'}
];
}
function getCustomChips(){
try{
const saved = JSON.parse(localStorage.getItem('ab_sicbo_custom_chips') || 'null');
if(Array.isArray(saved) && saved.length){
return saved.map((v,i)=>({val:Number(v)||0,tone:getDefaultChips()[i]?.tone||'gold',label:formatChipLabel(Number(v)||0)})).filter(c=>c.val>0).slice(0,7);
}
}catch(e){}
return getDefaultChips();
}
function buildChips() {
let chips=getCustomChips();
let con=document.getElementById('chipsContainer');
if(!con) return;
con.innerHTML='';
chips.forEach(ch=>{
let btn=document.createElement('div');
btn.className=`chip-btn ab-chip chip-tone-${ch.tone}`;
btn.setAttribute('data-value',ch.val);
btn.innerHTML=`<span>${ch.label}</span>`;
con.appendChild(btn);
});
let custom=document.createElement('button');
custom.type='button';
custom.id='customChipBtn';
custom.className='chip-custom-btn';
custom.innerHTML='<i class="fas fa-sliders"></i><span>自訂</span>';
con.appendChild(custom);
const active=[...document.querySelectorAll('.chip-btn')].find(x=>Number(x.getAttribute('data-value'))===curChip) || document.querySelectorAll('.chip-btn')[0];
if(active){
active.classList.add('active-chip');
curChip=parseInt(active.getAttribute('data-value'));
const sel=document.getElementById('selectedChipVal');
if(sel) sel.innerText=formatChipLabel(curChip);
}
}
function attachBetEvents() { document.querySelectorAll('.bet-card, .combo-card, .combo-bet-card, .triple-card, .triple-center, .total-card').forEach(card=>{ card.removeEventListener('click', betHandler); card.addEventListener('click', betHandler); }); }
function getMapTotal(map) { let sum = 0; for (let v of map.values()) sum += v; return sum; }
function getPendingTotal() { return getMapTotal(pendingMap); }
function getConfirmedTotal() { return getMapTotal(totalBetMap); }
function setBettingLocked(lock, reason='') {
bettingLocked = !!lock;
document.body.classList.toggle('betting-locked', bettingLocked);
const msg = document.getElementById('dealerMsg');
if (msg && reason) msg.innerHTML = reason;
}
function showToast(msg) {
const old = document.querySelector('.lock-toast');
if(old) old.remove();
const div = document.createElement('div');
div.className = 'lock-toast';
div.textContent = msg;
document.body.appendChild(div);
setTimeout(()=>div.remove(), 1400);
}
function betHandler(e) {
if(isSettling || bettingLocked){ addChatMessage("⚠️ 系統", "本局已鎖盤，等待下一局", "#ff8888"); showToast('本局已鎖盤'); return; }
let betKey=this.getAttribute('data-bet');
if(!betKey) return;
const pendingTotal = getPendingTotal();
if(points < pendingTotal + curChip){
addChatMessage("⚠️ 系統", `餘額不足：目前 ${points.toLocaleString()} 點，暫存已達 ${pendingTotal.toLocaleString()} 點`, "#ff8888");
showToast('餘額不足');
return;
}
let newAmt=(pendingMap.get(betKey)||0)+curChip;
pendingMap.set(betKey,newAmt);
refreshAllChips();
addChatMessage("📌 暫存", `${getBetLabel(betKey)} +${curChip.toLocaleString()}`, "#ddcc99");
this.classList.add('selected');
setTimeout(()=>this.classList.remove('selected'),150);
}
function confirmBets() {
if(isSettling || bettingLocked){ addChatMessage("⚠️ 系統", "本局已鎖盤，無法確認下注", "#ff8888"); showToast('本局已鎖盤'); return; }
const pendingTotal = getPendingTotal();
if(pendingTotal <= 0){ addChatMessage("⚠️ 系統", "尚未暫存注碼", "#ff8888"); return; }
if(points < pendingTotal){ addChatMessage("⚠️ 系統", `餘額不足，還缺 ${(pendingTotal-points).toLocaleString()} 點`, "#ff8888"); showToast('餘額不足'); return; }
for(let [k,v] of pendingMap.entries()){
if(v>0){ totalBetMap.set(k,(totalBetMap.get(k)||0)+v); pendingMap.set(k,0); }
}
points -= pendingTotal;
updatePointsUI();
updateTotalSpan();
refreshAllChips();
addChatMessage("✅ 系統", `${pendingTotal.toLocaleString()}`, "#88ffaa");
updateChatPermission();
}
function cancelPending() { for(let k of pendingMap.keys()) pendingMap.set(k,0); refreshAllChips(); addChatMessage("❌ 系統", "暫存已清除", "#ffaa66"); }
async function settleGame() {
if(isSettling) return;
isSettling=true;
setBettingLocked(true, '🎲 開始搖骰 ... 🎲');
// 鎖盤後若還有未確認暫存，直接清除，不扣點
for(let k of pendingMap.keys()) pendingMap.set(k,0);
refreshAllChips();
let result = await rollDiceAnim();
let winOdds = determineWins(result.sum, result.dice);
let totalWin=0;
for(let [betKey,amount] of totalBetMap.entries()){
if(amount>0 && winOdds.has(betKey) && winOdds.get(betKey)>0){
let odds=winOdds.get(betKey);
let winAmt=amount*(odds+1);
totalWin+=winAmt;
addChatMessage("💎 中獎", `${getBetLabel(betKey)} 派彩 ${winAmt.toLocaleString()}`, "#aaffaa");
}
}
if(totalWin>0){
points+=totalWin;
updatePointsUI();
addChatMessage("🏆 狂賀", `本局總派彩 ${totalWin.toLocaleString()} 點`, "#ffcc66");
} else addChatMessage("🍀 結果", "再接再厲", "#ffaa88");
let bigSmallFlag=result.sum>=11?"大":"小", oddEvenFlag=result.sum%2===1?"單":"雙";
historyList.unshift({sum:result.sum,dice:result.dice,bigSmall:bigSmallFlag,oddEven:oddEvenFlag});
if(historyList.length>20) historyList.pop();
renderRoadmapUI();
for(let k of totalBetMap.keys()) totalBetMap.set(k,0);
updateTotalSpan();
refreshAllChips();
document.getElementById('dealerMsg').innerHTML = '✨ 下注時間 ✨';
isSettling=false;
setBettingLocked(false, '✨ 開放下注 ✨');
showCountdown();
startCountdown();
}
function determineWins(sum, diceArr) {
let wins=new Map();
const isTriple = diceArr[0]===diceArr[1] && diceArr[1]===diceArr[2];
let isBig=(sum>=11&&sum<=17), isSmall=(sum>=4&&sum<=10), isOdd=(sum%2===1), isEven=(sum%2===0);
// SICBO VIP 05：開出任何圍骰時，大/小/單/雙不派彩。
if(!isTriple){
if(isBig) wins.set('big',1); if(isSmall) wins.set('small',1); if(isOdd) wins.set('odd',1); if(isEven) wins.set('even',1);
}
for(let n=1;n<=6;n++){ let cnt=diceArr.filter(v=>v===n).length; if(cnt>0) wins.set(`single${n}`,cnt); }
let doubleSet=new Set(); for(let i=0;i<3;i++) for(let j=i+1;j<3;j++) if(diceArr[i]===diceArr[j]) doubleSet.add(diceArr[i]);
for(let d of doubleSet) wins.set(`double${d}`,10);
let twoDiceCombos=new Set(); for(let i=0;i<3;i++) for(let j=i+1;j<3;j++){ let a=diceArr[i],b=diceArr[j]; if(a!==b){ let key=a<b?`${a}_${b}`:`${b}_${a}`; twoDiceCombos.add(key); } }
for(let ck of twoDiceCombos) wins.set(`combo_${ck}`,5);
if(isTriple){ let tv=diceArr[0]; wins.set(`triple_${tv}`,180); wins.set('anyTriple',30); }
if(sum>=4 && sum<=17) wins.set(`sum_${sum}`, sumOdds[sum]);
return wins;
}
function getBetLabel(key){
const map = {small:sicboBetWord('small'), big:sicboBetWord('big'), odd:sicboBetWord('odd'), even:sicboBetWord('even'), anyTriple:sicboBetWord('anyTriple')};
if(map[key]) return map[key];
if(key.startsWith('single')) return sicboBetWord('single') + ' ' + key.replace('single','');
if(key.startsWith('double')) return sicboBetWord('double') + ' ' + key.replace('double','');
if(key.startsWith('triple_')) return sicboBetWord('triple') + ' ' + key.replace('triple_','');
if(key.startsWith('combo_')) return sicboBetWord('combo') + ' ' + key.replace('combo_','').replace('_',' + ');
if(key.startsWith('sum_')) return sicboBetWord('sum') + ' ' + key.replace('sum_','');
return key;
}
function startCountdown() {
if(timer) clearInterval(timer);
countdown=15;
showCountdown();
setBettingLocked(false, '✨ 開放下注 ✨');
let cdSpan=document.getElementById('countdownNum');
cdSpan.innerText=countdown;
timer=setInterval(()=>{
if(isSettling) return;
countdown--;
cdSpan.innerText = Math.max(countdown, 0);
// 倒數到 0：立即隱藏倒數，開牌結束、重新開放下注時才再顯示。
if(countdown <= 0){
clearInterval(timer);
hideCountdown();
setBettingLocked(true, '🔒 0秒鎖盤｜本局停止下注');
settleGame();
}
},1000);
}
function getRoadDiceHTML(v) { let idx=getDice3x3Positions(v); let cls=isRedDot(v)?'road-dot-red':'road-dot-black'; let h='<div class="road-dice-grid">'; for(let i=0;i<9;i++){ h+=`<div class="flex justify-center items-center">${idx.includes(i)?`<div class="${cls}"></div>`:''}</div>`; } h+='</div>'; return h; }
function renderRoadmapUI() {
let track=document.getElementById('historyRoadmapTrack');
if(!track) return;
track.innerHTML='';
for(let h of historyList.slice(0,20)){
let diceHtml=`<div class="vertical-dice-item">${getRoadDiceHTML(h.dice[0])}</div><div class="vertical-dice-item">${getRoadDiceHTML(h.dice[1])}</div><div class="vertical-dice-item">${getRoadDiceHTML(h.dice[2])}</div>`;
let col=document.createElement('div');
col.className='road-column';
col.innerHTML=`<div class="dice-area-vertical">${diceHtml}</div><div class="total-cell-mini">${h.sum}</div><div class="result-cell-mini ${h.bigSmall==='大'?'big-bg':'small-bg'}">${translateBigSmall(h.bigSmall)}</div><div class="result-cell-mini ${h.oddEven==='單'?'odd-bg':'even-bg'}">${translateOddEven(h.oddEven)}</div>`;
track.appendChild(col);
}
if(historyList.length===0) track.innerHTML='<div class="text-cyan-400 text-[10px] p-2">'+sicboBetWord('waiting')+'</div>'; 
}
function initGiftBox() {
const giftBtn = document.getElementById('giftIconBtn');
const giftModal = document.getElementById('giftModal');
giftBtn.addEventListener('click', (e) => {
e.stopPropagation();
let spent = 0;
for(let v of totalBetMap.values()) spent += v;
if(spent < 200) {
addChatMessage("🔒 系統", `${spent}`, "#ff8888");
return;
}
giftModal.classList.toggle('hide');
});
document.querySelectorAll('.gift-option').forEach(opt => {
opt.addEventListener('click', () => {
let price = parseInt(opt.getAttribute('data-price'));
let name = opt.getAttribute('data-gift');
let emoji = opt.querySelector('.gift-emoji').innerText;
if(points >= price) {
points -= price;
updatePointsUI();
addChatMessage("🎁 炫風俠客", `贈送 ${emoji} ${name} (價值 ${price.toLocaleString()} 點)`, "#ff88aa");
addGiftAnimation(name, price);
} else {
addChatMessage("⚠️ 系統", `點數不足，贈送 ${name} 需要 ${price.toLocaleString()} 點`, "#ff8888");
}
giftModal.classList.add('hide');
});
});
document.addEventListener('click', (e) => {
if(!giftBtn.contains(e.target) && !giftModal.contains(e.target)) {
giftModal.classList.add('hide');
}
});
}
function initChat() {
const chatRoom = document.getElementById('chatRoom');
const collapseIcon = document.querySelector('.collapse-icon');
const chatHeader = document.getElementById('chatToggleBtn');
collapseIcon.addEventListener('click', (e) => {
e.stopPropagation();
chatRoom.classList.toggle('collapsed');
});
chatHeader.addEventListener('click', (e) => {
if(e.target.classList.contains('gift-icon')) return;
chatRoom.classList.toggle('collapsed');
});
document.getElementById('sendChatBtn').addEventListener('click', () => {
let spent = 0;
for(let v of totalBetMap.values()) spent += v;
const inp = document.getElementById('chatInput');
const txt = inp.value.trim();
if(txt && spent >= 200) {
addChatMessage("💎 VIP", txt, "#ffcc66");
inp.value = "";
} else if(spent < 200) {
addChatMessage("🔒 系統", `${spent}`, "#ff8888");
}
});
}
function updateChatPermission() {
let spent=0;
for(let v of totalBetMap.values()) spent+=v;
let can = spent >= 200;
document.getElementById('chatInput').disabled = !can;
document.getElementById('sendChatBtn').disabled = !can;
document.getElementById('chatInput').placeholder = can ? "輸入訊息..." : `${spent}`;
}
function initChipSelection() {
document.querySelectorAll('.chip-btn').forEach(ch=>{
ch.addEventListener('click',()=>{
document.querySelectorAll('.chip-btn').forEach(c=>c.classList.remove('active-chip'));
ch.classList.add('active-chip');
let val=parseInt(ch.getAttribute('data-value'));
curChip=val;
document.getElementById('selectedChipVal').innerText=curChip>=1000?(curChip/1000)+'K':curChip;
});
});
}
function initCarousel() {
let wrap=document.getElementById('carouselWrapper'), dots=document.getElementById('carouselDots'), pages=document.querySelectorAll('.bet-page');
for(let i=0;i<pages.length;i++){
let d=document.createElement('div');
d.classList.add('dot-page');
if(i===0) d.classList.add('active');
d.addEventListener('click',()=>{ wrap.scrollTo({left:i*wrap.clientWidth,behavior:'smooth'}); });
dots.appendChild(d);
}
function updateDots(){
let idx=Math.round(wrap.scrollLeft/wrap.clientWidth);
if(isNaN(idx)) idx=0;
let dts=document.querySelectorAll('.dot-page');
dts.forEach((d,i)=>{ if(i===idx) d.classList.add('active'); else d.classList.remove('active'); });
}
wrap.addEventListener('scroll',()=>{ clearTimeout(wrap.scrollTimer); wrap.scrollTimer=setTimeout(updateDots,50); });
window.addEventListener('resize',updateDots);
setTimeout(updateDots,100);
}
function initDiceDisplay() { updateDiceDisplay([1,2,3]); }
// 抽屜功能
function initDrawer() {
const drawerPanel = document.getElementById('roomDrawerPanel');
const videoHandle = document.getElementById('videoDrawerHandle');
const drawerClose = document.getElementById('drawerCloseBtn');
videoHandle.addEventListener('click', () => {
drawerPanel.classList.toggle('open');
});
drawerClose.addEventListener('click', () => {
drawerPanel.classList.remove('open');
});
document.querySelectorAll('.room-item').forEach(item => {
item.addEventListener('click', () => {
let roomName = item.getAttribute('data-room');
let roomTitle = item.querySelector('.room-name')?.innerText || roomName;
let gameType = item.getAttribute('data-game') || 'sicbo';
let roomStatus = item.getAttribute('data-status') || '開放下注';
const gameMap = {
baccarat: { title: '真人百家樂', subtitle: '真人荷官 · 莊閒和路紙', badge: roomName },
sicbo: { title: 'SICBO VIP 05', subtitle: '真人荷官 · 透明骰盅', badge: roomName },
roulette: { title: '真人輪盤', subtitle: '真人荷官 · 歐式輪盤', badge: roomName },
dragon: { title: '真人龍虎', subtitle: '真人荷官 · 龍虎對決', badge: roomName }
};
const picked = gameMap[gameType] || gameMap.sicbo;
const titleEl = document.querySelector('.room-title');
const subEl = document.querySelector('.room-subtitle');
const badgeEl = document.querySelector('.room-badge');
if(titleEl) titleEl.textContent = picked.title;
if(subEl) subEl.textContent = `${picked.subtitle} · ${roomStatus}`;
if(badgeEl) badgeEl.textContent = picked.badge;
addChatMessage("🏠 系統", `您已換桌至 ${roomTitle}`, "#88ffdd");
document.getElementById('dealerMsg').innerHTML = `✨ 歡迎來到 ${roomTitle} ✨`;
setTimeout(() => {
if(!isSettling) document.getElementById('dealerMsg').innerHTML = "✨ 開放下注 ✨";
}, 2000);
drawerPanel.classList.remove('open');
});
});
}
function init() {
initDiceDisplay();
buildSingleDice();
buildDoubleDice();
buildComboButtons();
buildDoubleComboGrid();
buildTripleSection();
buildTotalSection();
buildChips();
attachBetEvents();
initChipSelection();
document.getElementById('confirmBtn').addEventListener('click', confirmBets);
document.getElementById('cancelBtn').addEventListener('click', cancelPending);
updatePointsUI();
updateTotalSpan();
refreshAllChips();
for(let i=0;i<5;i++){
let d1=Math.floor(Math.random()*6)+1,d2=Math.floor(Math.random()*6)+1,d3=Math.floor(Math.random()*6)+1,s=d1+d2+d3;
historyList.push({sum:s,dice:[d1,d2,d3],bigSmall:s>=11?"大":"小",oddEven:s%2===1?"單":"雙"});
}
renderRoadmapUI();
startCountdown();
initChat();
initCarousel();
initGiftBox();
initDrawer();
addChatMessage("🎲 荷官", "百家樂風格導航｜遊戲房抽屜（與大廳相同房號）｜浮動聊天室", "#0ff");
}
init();
;
/* V3 live dealer HUD bridge */
(function(){
window.setLiveDealerVideo = function(src){
var v=document.getElementById('liveDealerVideo');
if(!v) return;
v.innerHTML='';
var s=document.createElement('source');
s.src=src;
v.appendChild(s);
v.load();
v.play && v.play().catch(function(){});
var ph=document.querySelector('.live-video-placeholder');
if(ph) ph.style.display='none';
};
function updateLivePanel(arr){
if(!arr || arr.length<3) return;
var sum=arr[0]+arr[1]+arr[2];
var main=document.getElementById('liveResultMain');
var bs=document.getElementById('liveBigSmall');
var oe=document.getElementById('liveOddEven');
if(main) main.textContent=arr.join(' + ') + ' = ' + sum;
if(bs) bs.textContent=sum>=11?'大':'小';
if(oe) oe.textContent=sum%2?'單':'雙';
}
var wait=setInterval(function(){
if(typeof window.updateDiceDisplay === 'function'){
var original=window.updateDiceDisplay;
window.updateDiceDisplay=function(arr){
original(arr);
updateLivePanel(arr);
};
updateLivePanel([1,2,3]);
clearInterval(wait);
}
},50);
})();
;
/* AB Casino V5 Premium UI Sync */
(function(){
const syncCountdownLabel = () => {
const n = document.getElementById('countdownNum');
if(n) n.setAttribute('data-v5-count', (n.textContent || '15').trim());
};
const oldStart = window.startCountdown;
if(typeof oldStart === 'function'){
window.startCountdown = function(){
const result = oldStart.apply(this, arguments);
syncCountdownLabel();
return result;
};
}
const obs = new MutationObserver(syncCountdownLabel);
window.addEventListener('DOMContentLoaded',()=>{
const n=document.getElementById('countdownNum');
if(n){ syncCountdownLabel(); obs.observe(n,{childList:true,characterData:true,subtree:true}); }
const info=document.querySelector('.room-live-info');
if(info) info.innerHTML='<span class="room-limit-chip"><i class="fas fa-coins"></i> 限紅 1K-100K</span><span class="room-countdown-chip"><i class="fas fa-clock"></i> 15s</span>';
const badge=document.querySelector('.room-badge'); if(badge) badge.textContent='AB';
const gift=document.getElementById('giftIconBtn'); if(gift) gift.className='fas fa-gem gift-icon';
});
})();
/* v5.1 上方快捷鍵：離開 / 遊戲說明 / 遊戲注單 / 投注紀錄 */
(function(){
function ready(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
function fmt(n){ return Number(n||0).toLocaleString(); }
function nowText(offsetDay){
var d = new Date(Date.now() - (offsetDay||0)*86400000);
var z = n => String(n).padStart(2,'0');
return d.getFullYear()+'.'+z(d.getMonth()+1)+'.'+z(d.getDate())+' '+z(d.getHours())+':'+z(d.getMinutes())+':'+z(d.getSeconds());
}
function makeDemoRecords(dayOffset){
var names=['大','小','單','雙','總和 12','單骰 6'];
return [0,1,2].map(function(i){
var bet = [1000,500,1500][i];
var win = [950,-500,2200][i] - (dayOffset?i*80:0);
return {
no:'SB'+new Date(Date.now()-dayOffset*86400000).toISOString().slice(0,10).replace(/-/g,'')+'0'+(i+1),
time:nowText(dayOffset),
table:'骰寶｜骰寶 1 VIP',
items:[{type:names[i], bet:bet, valid:bet, payout:win>0?bet+win:0, win:win}],
dice:[(i%6)+1, ((i+2)%6)+1, ((i+4)%6)+1]
};
});
}
function renderHistory(dayOffset){
var records=makeDemoRecords(dayOffset||0);
var totalBet=records.reduce((s,r)=>s+r.items.reduce((a,b)=>a+b.bet,0),0);
var totalWin=records.reduce((s,r)=>s+r.items.reduce((a,b)=>a+b.win,0),0);
return '<div class="ab-record-tabs">'+
'<button class="ab-record-tab '+(dayOffset===0?'active':'')+'" data-day="0">今日</button>'+
'<button class="ab-record-tab '+(dayOffset===1?'active':'')+'" data-day="1">昨日</button>'+
'<button class="ab-record-tab '+(dayOffset===7?'active':'')+'" data-day="7">七日</button>'+
'</div>'+
'<div class="ab-record-summary"><span>總投注 <b>'+fmt(totalBet)+'</b></span><span>輸贏 <b class="'+(totalWin>=0?'plus':'minus')+'">'+(totalWin>=0?'+':'')+fmt(totalWin)+'</b></span></div>'+
records.map(function(r,idx){
var bet=r.items.reduce((s,x)=>s+x.bet,0), win=r.items.reduce((s,x)=>s+x.win,0);
return '<div class="ab-record-card">'+
'<div class="ab-record-row main"><div><b>'+r.table+'</b><span>'+r.time+'</span></div><button class="ab-replay-btn" data-rec="'+idx+'" data-dice="'+r.dice.join(',')+'">回放</button></div>'+
'<div class="ab-record-id">遊戲編號：'+r.no+'</div>'+
'<div class="ab-record-row"><span>投注 '+fmt(bet)+'</span><b class="'+(win>=0?'plus':'minus')+'">'+(win>=0?'+':'')+fmt(win)+'</b></div>'+
'<table class="ab-record-table"><thead><tr><th>下注類型</th><th>投注金額</th><th>有效投注</th><th>派彩</th><th>輸贏</th></tr></thead><tbody>'+r.items.map(function(x){return '<tr><td>'+x.type+'</td><td>'+fmt(x.bet)+'</td><td>'+fmt(x.valid)+'</td><td>'+fmt(x.payout)+'</td><td class="'+(x.win>=0?'plus':'minus')+'">'+(x.win>=0?'+':'')+fmt(x.win)+'</td></tr>';}).join('')+'</tbody></table>'+
'</div>';
}).join('');
}
ready(function(){
var mask = document.getElementById('roomModalMask');
var title = document.getElementById('roomModalTitle');
var body = document.getElementById('roomModalBody');
var close = document.getElementById('roomModalClose');
function openModal(t, html){
if(!mask || !title || !body) return;
title.textContent = t;
body.innerHTML = html;
mask.classList.add('show');
}
function closeModal(){ if(mask) mask.classList.remove('show'); }
close && close.addEventListener('click', closeModal);
mask && mask.addEventListener('click', function(e){ if(e.target === mask) closeModal(); });
var exitBtn = document.getElementById('exitRoomBtn');
exitBtn && exitBtn.addEventListener('click', function(){
if(history.length > 1) history.back();
else location.href = './AB_lobby_v34_guide_big_right(1).html';
});
function openGuide(){
openModal('遊戲說明',
'<b>國際骰寶玩法</b><br>'+
'每局開出 3 顆骰子，下注項目包含：大小、單雙、單骰、雙骰、兩粒組合、圍骰、全圍、總和。<br><br>'+
'<b>大小 / 單雙</b><br>'+
'總和 4–10 為小，11–17 為大；總和奇數為單，偶數為雙。<br><br>'+
'<b>重要規則</b><br>'+
'開出任意圍骰（三顆相同）時，大小與單雙不派彩。<br><br>'+
'<b>下注流程</b><br>'+
'選擇籌碼 → 點下注區 → 確認下注 → 倒數 0 秒停止下注 → 開骰派彩。'
);
}
function openSlip(){ openModal('遊戲注單', renderHistory(0)); }
function openHistory(day){ openModal('遊戲注單', renderHistory(Number(day||0))); }
function diceGrid(n){
var red=(n===1||n===4), cells=[0,0,0,0,0,0,0,0,0];
var map={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
(map[n]||[]).forEach(function(i){cells[i]=1});
return '<span class="ab-replay-die '+(red?'red':'')+'">'+cells.map(function(v){return '<i class="'+(v?'':'blank')+'"></i>';}).join('')+'</span>';
}
function renderReplay(dice){
var total=dice.reduce(function(a,b){return a+b;},0);
var bs=(total>=11&&total<=17)?'大':'小';
var oe=(total%2)?'單':'雙';
return '<div class="ab-replay-box"><div class="ab-replay-stage"><div class="ab-replay-top"><span>骰寶｜單局回放</span><b>LIVE REPLAY</b></div><div class="ab-replay-cup"></div><div class="ab-replay-dice">'+dice.map(diceGrid).join('')+'</div></div><div class="ab-replay-result">開獎點數：<b>'+dice.join('、')+'</b>｜總和 <b>'+total+'</b>｜'+bs+'｜'+oe+'</div><div class="ab-replay-timeline"><div class="ab-replay-timebar"><i></i></div><div class="ab-replay-times"><span>00:00</span><span>00:03</span></div></div><div class="ab-replay-actions"><button type="button" class="primary" onclick="this.closest(\'.help-modal-overlay,.room-modal-mask\')&&this.closest(\'.help-modal-overlay,.room-modal-mask\').classList.remove(\'show\')">完成</button><button type="button" onclick="var b=this.closest(\'.ab-replay-box\').querySelector(\'.ab-replay-timebar i\'); if(b){b.style.animation=\'none\'; b.offsetHeight; b.style.animation=\'abReplayRun 2.6s linear both\';}">重播</button></div></div>';
}
document.getElementById('gameGuideBtn')?.addEventListener('click', openGuide);
document.getElementById('videoGuideShortcut')?.addEventListener('click', openGuide);
document.getElementById('betSlipBtn')?.addEventListener('click', openSlip);
document.getElementById('videoBetSlipShortcut')?.addEventListener('click', openSlip);
document.getElementById('betHistoryBtn')?.addEventListener('click', function(){ openHistory(0); });
body && body.addEventListener('click', function(e){
var tab=e.target.closest('.ab-record-tab');
if(tab){ openHistory(tab.dataset.day); return; }
var replay=e.target.closest('.ab-replay-btn');
if(replay){
var dice=(replay.dataset.dice||'1,2,3').split(',').map(Number);
openModal('單局回放', renderReplay(dice));
}
});
});
})();
/* V5.3 玩法切換滑動強化：修正籌碼 overflow 後造成手機滑不動 */
(function(){
function ready(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
ready(function(){
var wrap = document.getElementById('carouselWrapper');
if(!wrap) return;
wrap.style.overflowX = 'auto';
wrap.style.touchAction = 'pan-x pan-y';
var startX = 0, startLeft = 0, dragging = false, moved = false;
wrap.addEventListener('pointerdown', function(e){
if(e.target.closest('button,input,.chip-btn,.bet-card,.combo-card,.combo-bet-card,.triple-card,.triple-center,.total-card')) return;
dragging = true; moved = false; startX = e.clientX; startLeft = wrap.scrollLeft;
try{ wrap.setPointerCapture(e.pointerId); }catch(err){}
}, {passive:true});
wrap.addEventListener('pointermove', function(e){
if(!dragging) return;
var dx = e.clientX - startX;
if(Math.abs(dx) > 6) moved = true;
wrap.scrollLeft = startLeft - dx;
}, {passive:true});
function endDrag(){
if(!dragging) return;
dragging = false;
if(moved){
var idx = Math.round(wrap.scrollLeft / wrap.clientWidth);
wrap.scrollTo({left:idx * wrap.clientWidth, behavior:'smooth'});
}
}
wrap.addEventListener('pointerup', endDrag, {passive:true});
wrap.addEventListener('pointercancel', endDrag, {passive:true});
});
})();
/* v5.2 功能選單互動 */
(function(){
function ready(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
ready(function(){
var moreBtn = document.getElementById('roomMoreBtn');
var panel = document.getElementById('roomMorePanel');
function closeMore(){
if(panel) panel.classList.remove('show');
if(moreBtn) moreBtn.setAttribute('aria-expanded','false');
}
function toggleMore(e){
if(e) e.stopPropagation();
if(!panel || !moreBtn) return;
var willShow = !panel.classList.contains('show');
panel.classList.toggle('show', willShow);
moreBtn.setAttribute('aria-expanded', willShow ? 'true' : 'false');
}
moreBtn && moreBtn.addEventListener('click', toggleMore);
document.addEventListener('click', function(e){
if(panel && panel.classList.contains('show') && !e.target.closest('.room-more-wrap')) closeMore();
});
panel && panel.addEventListener('click', function(e){
if(e.target.closest('.sound-toggle-row')) return;
if(e.target.closest('button')) closeMore();
});
var historyBtn = document.getElementById('betHistoryBtn');
historyBtn && historyBtn.addEventListener('click', function(){
var title = document.getElementById('roomModalTitle');
var body = document.getElementById('roomModalBody');
var mask = document.getElementById('roomModalMask');
if(title && body && mask){
title.textContent = '投注紀錄';
body.innerHTML = '<b>投注紀錄</b><br><br><div class="bet-slip-empty">目前此展示版尚未串接歷史資料，之後可接 API 顯示近 20 局下注、派彩與輸贏。</div>';
mask.classList.add('show');
}
});
var abSoundState = window.abSoundState || (window.abSoundState = {fx:true, dealer:true});
function setToggle(btn, on){
if(!btn) return;
btn.classList.toggle('active', !!on);
btn.setAttribute('aria-pressed', on ? 'true' : 'false');
}
function playTinyTone(kind){
if(kind === 'fx' && !abSoundState.fx) return;
if(kind === 'dealer' && !abSoundState.dealer) return;
try{
var AC = window.AudioContext || window.webkitAudioContext;
if(!AC) return;
var ctx = window.__abAudioCtx || (window.__abAudioCtx = new AC());
var osc = ctx.createOscillator();
var gain = ctx.createGain();
osc.type = 'sine';
osc.frequency.value = kind === 'dealer' ? 520 : 760;
gain.gain.setValueAtTime(0.0001, ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.02);
gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
osc.connect(gain); gain.connect(ctx.destination);
osc.start(); osc.stop(ctx.currentTime + 0.2);
}catch(err){}
}
var fxBtn = document.getElementById('soundFxToggle');
var dealerBtn = document.getElementById('dealerVoiceToggle');
setToggle(fxBtn, abSoundState.fx);
setToggle(dealerBtn, abSoundState.dealer);
fxBtn && fxBtn.addEventListener('click', function(e){
e.stopPropagation();
abSoundState.fx = !abSoundState.fx;
setToggle(fxBtn, abSoundState.fx);
addChatMessage('🔊 系統', '音效已' + (abSoundState.fx ? '開啟' : '關閉'), '#ffdd99');
playTinyTone('fx');
});
dealerBtn && dealerBtn.addEventListener('click', function(e){
e.stopPropagation();
abSoundState.dealer = !abSoundState.dealer;
setToggle(dealerBtn, abSoundState.dealer);
addChatMessage('🎙️ 荷官', '荷官聲音已' + (abSoundState.dealer ? '開啟' : '關閉'), '#ffdd99');
playTinyTone('dealer');
});
});
})();
;
(function(){
function setupNicknameEdit(){
const nameEl=document.getElementById('playerNickname');
const editBtn=document.getElementById('editNicknameBtn');
if(!nameEl || !editBtn) return;
const saved=localStorage.getItem('ab_sicbo_player_nickname');
if(saved) nameEl.textContent=saved;
editBtn.addEventListener('click', function(e){
e.preventDefault(); e.stopPropagation();
const current=(nameEl.textContent||'旋風俠客').trim();
const next=prompt('請輸入新的暱稱', current);
if(next===null) return;
const clean=next.trim().slice(0,12);
if(!clean) return;
nameEl.textContent=clean;
localStorage.setItem('ab_sicbo_player_nickname', clean);
});
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', setupNicknameEdit);
else setupNicknameEdit();
})();
;
(function(){
function setupVideoActionShortcuts(){
var slip=document.getElementById('videoBetSlipShortcut');
var guide=document.getElementById('videoGuideShortcut');
var gift=document.getElementById('videoGiftShortcut');
var bet=document.getElementById('betSlipBtn');
var help=document.getElementById('gameGuideBtn');
var giftIcon=document.getElementById('giftIconBtn');
if(slip && bet) slip.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); bet.click(); });
if(guide && help) guide.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); help.click(); });
if(gift && giftIcon) gift.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); giftIcon.click(); });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', setupVideoActionShortcuts);
else setupVideoActionShortcuts();
})();
;
(function(){
function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
function fmt(v){ v=Number(v)||0; return v>=1000 ? (v%1000===0 ? (v/1000)+'K' : (v/1000).toFixed(1)+'K') : String(v); }
var tones=['white','red','blue','green','purple','gold','blackgold'];
function defaults(){ return [1,5,10,50,100,500,1000]; }
function currentVals(){
try{ var arr=JSON.parse(localStorage.getItem('ab_sicbo_custom_chips')||'null'); if(Array.isArray(arr)&&arr.length) return arr.slice(0,7); }catch(e){}
return defaults();
}
function buildFields(vals){
var grid=document.getElementById('customChipGrid'); if(!grid) return;
grid.innerHTML='';
for(var i=0;i<7;i++){
var v=Number(vals[i] || defaults()[i]);
var row=document.createElement('label');
row.className='custom-chip-field';
row.innerHTML='<span class="custom-chip-preview chip-tone-'+tones[i]+'">'+fmt(v)+'</span><input inputmode="numeric" pattern="[0-9]*" value="'+v+'" aria-label="籌碼 '+(i+1)+' 面額">';
var input=row.querySelector('input'), preview=row.querySelector('.custom-chip-preview');
input.addEventListener('input', function(){
var val=Number(this.value.replace(/[^0-9]/g,''))||0;
this.value=val?String(val):'';
this.parentElement.querySelector('.custom-chip-preview').textContent=fmt(val);
});
grid.appendChild(row);
}
}
function openModal(){ var mask=document.getElementById('customChipMask'); buildFields(currentVals()); if(mask){ mask.classList.add('show'); mask.setAttribute('aria-hidden','false'); } }
function closeModal(){ var mask=document.getElementById('customChipMask'); if(mask){ mask.classList.remove('show'); mask.setAttribute('aria-hidden','true'); } }
function saveChips(){
var vals=[].map.call(document.querySelectorAll('#customChipGrid input'), function(inp){ return Math.max(1, Number(inp.value)||0); }).filter(Boolean);
vals=[...new Set(vals)].slice(0,7);
while(vals.length<7) vals.push(defaults()[vals.length]);
vals.sort(function(a,b){return a-b;});
localStorage.setItem('ab_sicbo_custom_chips', JSON.stringify(vals));
if(window.curChip && vals.indexOf(window.curChip)===-1) window.curChip=vals[0];
if(typeof buildChips==='function') buildChips();
if(typeof initChipSelection==='function') initChipSelection();
closeModal();
try{ addChatMessage('🪙 系統','選擇籌碼已套用','#ffdd99'); }catch(e){}
}
ready(function(){
document.addEventListener('click', function(e){ if(e.target.closest('#customChipBtn')){ e.preventDefault(); e.stopPropagation(); openModal(); } });
var close=document.getElementById('customChipClose'); if(close) close.addEventListener('click', closeModal);
var mask=document.getElementById('customChipMask'); if(mask) mask.addEventListener('click', function(e){ if(e.target===mask) closeModal(); });
var save=document.getElementById('chipSaveBtn'); if(save) save.addEventListener('click', saveChips);
var reset=document.getElementById('chipResetBtn'); if(reset) reset.addEventListener('click', function(){ localStorage.removeItem('ab_sicbo_custom_chips'); buildFields(defaults()); });
});
})();
;
(function(){
const STORAGE_KEY='ab_sicbo_custom_chips';
const CATALOG=[
{val:5,tone:'red',label:'5'},
{val:10,tone:'blue',label:'10'},
{val:20,tone:'green',label:'20'},
{val:50,tone:'green',label:'50'},
{val:100,tone:'purple',label:'100'},
{val:200,tone:'purple',label:'200'},
{val:500,tone:'gold',label:'500'},
{val:1000,tone:'blackgold',label:'1K'},
{val:2000,tone:'blackgold',label:'2K'},
{val:5000,tone:'orange',label:'5K'},
{val:10000,tone:'diamond',label:'10K'}
];
const DEFAULT=[5,10,50,100,500,1000];
function curLang(){try{return localStorage.getItem('ab_sicbo_lang_v1')||'zh-TW';}catch(e){return 'zh-TW';}}
function chipText(){if(typeof getSicboLangPack==='function') return getSicboLangPack(curLang()); return {chipTitle:'選擇籌碼',chipAfter:' / 選擇面額',chipSub:'從已做好的面額中選 6 種，已新增 5K / 10K，會顯示在下注籌碼列',chipSelected:'已選',chipTypes:'種面額',chipReset:'預設6顆',chipSave:'套用這 6 顆',chipApplied:'已切換 6 種籌碼面額',chipCustom:'選籌碼',now:'目前',totalBet:'總注'};}
function fmt(v){v=Number(v)||0;return v>=1000?(v%1000===0?(v/1000)+'K':(v/1000).toFixed(1)+'K'):String(v);}
function getVals(){
try{
const arr=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
if(Array.isArray(arr) && arr.length){
const legal=arr.map(Number).filter(v=>CATALOG.some(c=>c.val===v));
if([...new Set(legal)].length===6) return [...new Set(legal)].slice(0,6);
}
}catch(e){}
return DEFAULT.slice();
}
function chipObj(v,idx){
const found=CATALOG.find(c=>c.val===Number(v));
if(found) return found;
const tones=['white','red','blue','green','purple','gold'];
return {val:Number(v)||1,tone:tones[idx%tones.length],label:fmt(v)};
}
window.getCustomChips=function(){return getVals().map(chipObj);};
window.buildChips=function(){
const chips=window.getCustomChips();
const con=document.getElementById('chipsContainer');
if(!con) return;
con.innerHTML='';
chips.forEach(ch=>{
const btn=document.createElement('div');
btn.className=`chip-btn ab-chip chip-tone-${ch.tone}`;
btn.setAttribute('data-value',ch.val);
btn.innerHTML=`<span>${ch.label}</span>`;
con.appendChild(btn);
});
const custom=document.createElement('button');
custom.type='button';custom.id='customChipBtn';custom.className='chip-custom-btn';
custom.innerHTML='<i class="fas fa-sliders"></i><span>'+chipText().chipCustom+'</span>'; 
con.appendChild(custom);
const all=[...document.querySelectorAll('#chipsContainer .chip-btn')];
let active=all.find(x=>Number(x.getAttribute('data-value'))===Number(window.curChip||0)) || all[0];
if(active){
all.forEach(x=>x.classList.remove('active-chip'));
active.classList.add('active-chip');
window.curChip=parseInt(active.getAttribute('data-value'),10);
const sel=document.getElementById('selectedChipVal'); if(sel) sel.innerText=fmt(window.curChip);
}
if(typeof window.initChipSelection==='function') window.initChipSelection();
};
function renderSelector(){
const grid=document.getElementById('customChipGrid'); if(!grid) return;
const selected=new Set(getVals());
const txt=chipText();
grid.innerHTML='<div class="custom-chip-count" style="grid-column:1/-1">'+txt.chipSelected+' <b id="chipPickCount">'+selected.size+'</b> / 6 '+txt.chipTypes+'</div>';
CATALOG.forEach(ch=>{
const card=document.createElement('button');
card.type='button';
card.className='custom-chip-option'+(selected.has(ch.val)?' selected':'');
card.dataset.value=ch.val;
card.innerHTML='<span class="checkmark">✓</span><span class="option-chip chip-tone-'+ch.tone+'">'+ch.label+'</span><span class="option-label">'+ch.val.toLocaleString()+'</span>';
card.addEventListener('click',()=>{
const now=new Set([...document.querySelectorAll('.custom-chip-option.selected')].map(x=>Number(x.dataset.value)));
if(now.has(ch.val)){
if(now.size<=1) return;
now.delete(ch.val);
}else{
if(now.size>=6) return;
now.add(ch.val);
}
updateSelection(now);
});
grid.appendChild(card);
});
updateSelection(selected);
}
function updateSelection(set){
document.querySelectorAll('.custom-chip-option').forEach(el=>{
const v=Number(el.dataset.value);
el.classList.toggle('selected',set.has(v));
el.classList.toggle('disabled',!set.has(v)&&set.size>=6);
});
const cnt=document.getElementById('chipPickCount'); if(cnt) cnt.textContent=set.size;
const save=document.getElementById('chipSaveBtn'); if(save) save.disabled=(set.size!==6);
}
function openModal(){
const txt=chipText();
const title=document.getElementById('customChipTitle'); if(title){ title.textContent=txt.chipTitle; title.setAttribute('data-after',txt.chipAfter||''); }
const sub=document.querySelector('.custom-chip-sub'); if(sub) sub.textContent=txt.chipSub;
const save=document.getElementById('chipSaveBtn'); if(save) save.textContent=txt.chipSave;
const reset=document.getElementById('chipResetBtn'); if(reset) reset.textContent=txt.chipReset;
renderSelector();
const mask=document.getElementById('customChipMask'); if(mask){mask.classList.add('show');mask.setAttribute('aria-hidden','false');}
}
function closeModal(){const mask=document.getElementById('customChipMask'); if(mask){mask.classList.remove('show');mask.setAttribute('aria-hidden','true');}}
function save(){
let vals=[...document.querySelectorAll('.custom-chip-option.selected')].map(x=>Number(x.dataset.value)).sort((a,b)=>a-b).slice(0,6);
if(vals.length!==6) return;
localStorage.setItem(STORAGE_KEY,JSON.stringify(vals));
if(!vals.includes(Number(window.curChip||0))) window.curChip=vals[0];
window.buildChips();
closeModal();
try{ addChatMessage('🪙 '+(chipText().system||'系統'),chipText().chipApplied,'#ffdd99'); }catch(e){}
}
function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
ready(()=>{
setTimeout(()=>{ try{ window.buildChips(); }catch(e){} },0);
document.addEventListener('click',e=>{ if(e.target.closest('#customChipBtn')){e.preventDefault();e.stopPropagation();openModal();} });
const close=document.getElementById('customChipClose'); if(close) close.onclick=closeModal;
const mask=document.getElementById('customChipMask'); if(mask) mask.addEventListener('click',e=>{ if(e.target===mask) closeModal(); });
const saveBtn=document.getElementById('chipSaveBtn'); if(saveBtn) saveBtn.onclick=save;
const reset=document.getElementById('chipResetBtn'); if(reset) reset.onclick=()=>{ localStorage.setItem(STORAGE_KEY,JSON.stringify(DEFAULT)); renderSelector(); window.buildChips(); const t=chipText(); reset.textContent=t.chipReset; const save=document.getElementById('chipSaveBtn'); if(save) save.textContent=t.chipSave; };
document.addEventListener('abSicboLanguageChanged',()=>{ const t=chipText(); const title=document.getElementById('customChipTitle'); if(title){title.textContent=t.chipTitle; title.setAttribute('data-after',t.chipAfter||'');} const sub=document.querySelector('.custom-chip-sub'); if(sub) sub.textContent=t.chipSub; const resetBtn=document.getElementById('chipResetBtn'); if(resetBtn) resetBtn.textContent=t.chipReset; const save=document.getElementById('chipSaveBtn'); if(save) save.textContent=t.chipSave; const custom=document.querySelector('#customChipBtn span'); if(custom) custom.textContent=t.chipCustom; document.querySelectorAll('.sicbo-bet-info span').forEach((el,i)=>{ if(i===0) el.textContent=t.now; if(i===1) el.textContent=t.totalBet; }); if(document.getElementById('customChipMask')?.classList.contains('show')) renderSelector(); });
});
})();
;
(function(){
let hotManuallyClosed = false;
function qs(sel){return document.querySelector(sel);}
function ensureHotControls(){
const panel = qs('.live-hot-panel');
const video = qs('.dice-video-area');
if(!panel || !video) return null;
const title = panel.querySelector('.hot-title');
if(title) title.textContent = '熱門下注';
if(!panel.querySelector('.hot-close-btn')){
const btn = document.createElement('button');
btn.type = 'button'; btn.className = 'hot-close-btn'; btn.setAttribute('aria-label','關閉熱門下注'); btn.innerHTML = '×';
panel.appendChild(btn);
btn.addEventListener('click', function(e){
e.preventDefault(); e.stopPropagation(); hotManuallyClosed = true;
panel.classList.remove('hot-open'); panel.classList.add('hot-closed');
const mini = qs('#hotMiniTrigger'); if(mini && !document.body.classList.contains('betting-locked')) mini.classList.add('show');
});
}
if(!qs('#hotMiniTrigger')){
const mini = document.createElement('button');
mini.type = 'button'; mini.id = 'hotMiniTrigger'; mini.className = 'hot-mini-trigger'; mini.innerHTML = '🔥 熱門下注';
video.appendChild(mini);
mini.addEventListener('click', function(e){e.preventDefault(); e.stopPropagation(); hotManuallyClosed = false; showHotPanel(false);});
}
return panel;
}
function showHotPanel(resetManual){
const panel = ensureHotControls(); const mini = qs('#hotMiniTrigger'); if(!panel) return;
if(resetManual) hotManuallyClosed = false;
panel.classList.remove('hot-auto-hidden');
if(hotManuallyClosed){panel.classList.remove('hot-open'); panel.classList.add('hot-closed'); if(mini) mini.classList.add('show'); return;}
panel.classList.remove('hot-closed'); panel.classList.add('hot-open'); if(mini) mini.classList.remove('show');
}
function hideHotPanel(){
const panel = ensureHotControls(); const mini = qs('#hotMiniTrigger'); if(!panel) return;
panel.classList.remove('hot-open','hot-closed'); panel.classList.add('hot-auto-hidden'); if(mini) mini.classList.remove('show');
}
window.abShowHotPanel = showHotPanel; window.abHideHotPanel = hideHotPanel;
function hook(){
ensureHotControls(); hideHotPanel();
if(typeof window.startCountdown === 'function' && !window.startCountdown.__abHotHooked){
const originalStartCountdown = window.startCountdown;
window.startCountdown = function(){const result = originalStartCountdown.apply(this, arguments); setTimeout(function(){showHotPanel(true);}, 40); return result;};
window.startCountdown.__abHotHooked = true;
}
if(typeof window.setBettingLocked === 'function' && !window.setBettingLocked.__abHotHooked){
const originalSetBettingLocked = window.setBettingLocked;
window.setBettingLocked = function(lock){const result = originalSetBettingLocked.apply(this, arguments); if(lock) hideHotPanel(); else setTimeout(function(){showHotPanel(true);}, 40); return result;};
window.setBettingLocked.__abHotHooked = true;
}
setTimeout(function(){if(!document.body.classList.contains('betting-locked')) showHotPanel(true);}, 260);
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
})();
;
(function(){
function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
function qs(s){return document.querySelector(s)}
ready(function(){
// 統一右側漢堡選單 class：原本用 room-more-panel，補上 show/open 切換相容
var btn=qs('#roomMoreBtn'), panel=qs('#roomMorePanel');
if(btn && panel){
btn.addEventListener('click',function(e){
setTimeout(function(){
if(panel.style.display==='block' || !panel.classList.contains('hidden')) panel.classList.toggle('show');
},0);
});
document.addEventListener('click',function(e){
if(panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) panel.classList.remove('show','open');
});
}
// 確保熱門下注有 X，並可收起/重開
var hot=qs('.live-hot-panel');
if(hot && !hot.querySelector('.hot-close-btn')){
var x=document.createElement('button'); x.type='button'; x.className='hot-close-btn'; x.innerHTML='×'; x.setAttribute('aria-label','關閉熱門下注'); hot.appendChild(x);
x.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();hot.classList.add('hot-closed');});
}
// 收藏按鈕狀態
var fav=qs('#videoGiftShortcut');
if(fav){fav.addEventListener('click',function(){fav.classList.toggle('active')});}
});
})();
;
(function(){
'use strict';
function $(id){return document.getElementById(id)}
function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn()}
function fmt(n){return Number(n||0).toLocaleString('zh-TW')}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var currentChip=100;
var filter='all';
var bets={};
var timer=null;
var GAME_COUNTDOWN={baccarat:15,dragontiger:15,sicbo:15,roulette:35};
function maxCountdown(game){return GAME_COUNTDOWN[game]||15;}
var rooms=[
{id:'ba1',section:'百家樂',game:'baccarat',name:'百家1',tag:'好路',online:26,time:15,meta:'一閒兩莊｜在線 1031',p:5,b:0,counts:{b:8,p:9,t:3,total:20},seq:'p p b p b b t p b p b p b b p t b p p b'.split(' ')},
{id:'ba2',section:'百家樂',game:'baccarat',name:'百家2',tag:'長莊',online:32,time:15,meta:'長莊路｜在線 1181',p:0,b:0,counts:{b:13,p:7,t:2,total:22},seq:'b b b p b b b t p b b b p p b b t b b p b b'.split(' ')},
{id:'ba3',section:'百家樂',game:'baccarat',name:'百家3',tag:'單跳',online:18,time:15,meta:'單跳路｜在線 842',p:0,b:0,counts:{b:9,p:10,t:1,total:20},seq:'b p b p b p t p b p p b p b b p b p p b'.split(' ')},
{id:'ba4',section:'百家樂',game:'baccarat',name:'百家4',tag:'穩定',online:24,time:15,meta:'穩定路｜在線 776',p:0,b:0,counts:{b:10,p:9,t:1,total:20},seq:'p b p p b t b p b b p p b p b p b b p p'.split(' ')},
{id:'ba5',section:'百家樂',game:'baccarat',name:'百家5',tag:'洗牌',online:0,time:15,meta:'洗牌中｜在線 0',p:0,b:0,counts:{b:0,p:0,t:0,total:0},seq:'t t t t t t t t t t t t t t t t t t t t'.split(' ')},
{id:'ba6',section:'百家樂',game:'baccarat',name:'百家6',tag:'長閒',online:29,time:15,meta:'長閒路｜在線 924',p:0,b:0,counts:{b:7,p:12,t:1,total:20},seq:'p p p p p b p p t p p b p p p b p p b p'.split(' ')},
{id:'ba7',section:'百家樂',game:'baccarat',name:'百家7',tag:'跳莊',online:21,time:15,meta:'跳莊路｜在線 681',p:0,b:0,counts:{b:10,p:10,t:0,total:20},seq:'b p b p b p b p b p b p b p b p b p b p'.split(' ')},
{id:'dt1',section:'龍虎',game:'dragontiger',name:'龍虎1',tag:'龍強',online:22,time:15,meta:'龍強勢｜在線 726',p:0,b:0,counts:{d:11,tg:8,e:1,total:20},seq:'d d t d d e t d d t d d t t d d e d t d'.split(' ')},
{id:'sb1',section:'骰寶',game:'sicbo',name:'骰寶1',tag:'大路',online:19,time:15,meta:'大路偏熱｜在線 918',p:0,b:0,counts:{big:11,small:8,triple:1,total:20},seq:[12,15,9,11,16,8,14,7,10,13,17,6,4,15,12,18,9,11,16,5]},
{id:'rl1',section:'輪盤',game:'roulette',name:'輪盤1',tag:'均衡',online:17,time:35,meta:'紅黑均衡｜在線 606',p:0,b:0,counts:{red:10,black:9,zero:1,total:20},seq:[32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,0,5]}
];
function key(t,side){return t.id+'_'+side}
function tableTotal(t){
return ['player','banker','tie','dragon','tiger','big','small','red','black','zero'].reduce(function(sum,s){
return sum+(bets[key(t,s)]||0);
},0)
}
function grand(){return rooms.reduce(function(sum,t){return sum+tableTotal(t)},0)}
function labelOf(side){
return ({player:'閒',banker:'莊',tie:'和',dragon:'龍',tiger:'虎',big:'大',small:'小',red:'紅',black:'黑',zero:'0'})[side]||side;
}
function toast(msg){
var el=$('ab100Toast');
if(!el)return;
el.textContent=msg;
el.classList.add('show');
clearTimeout(toast._t);
toast._t=setTimeout(function(){el.classList.remove('show')},1100);
}
function bead(x,game){
var cls=x==='b'?'b':x==='p'?'p':x==='t'?'t':'empty';
var text='';
if(x==='b') text=game==='dragontiger'?'龍':game==='sicbo'?'大':game==='roulette'?'紅':'莊';
if(x==='p') text=game==='dragontiger'?'虎':game==='sicbo'?'小':game==='roulette'?'黑':'閒';
if(x==='t') text=game==='roulette'?'0':'和';
return '<span class="quick-bead '+cls+'">'+text+'</span>';
}
function mini(x){
var cls=x==='p'?'p':x==='t'?'t':'';
return '<span class="quick-mini-cell '+cls+'"></span>';
}
function road(t){
var c=t.counts||{};
if(t.game==='baccarat'){
function bead(x){
var cls=x==='b'?'b':x==='p'?'p':x==='t'?'t':'empty';
var text=x==='b'?'莊':x==='p'?'閒':x==='t'?'和':'';
return '<span class="quick-bead '+cls+'">'+text+'</span>';
}
function mini(x){
var cls=x==='p'?'p':x==='t'?'t':'';
return '<span class="quick-mini-cell '+cls+'"></span>';
}
var seq=(t.seq||[]).slice();
var beads=seq.slice(0,27).map(bead).join('');
while((beads.match(/quick-bead/g)||[]).length<27)beads+='<span class="quick-bead empty"></span>';
var miniSeq=seq.concat(seq).concat(seq);
var minis=miniSeq.slice(0,54).map(mini).join('');
return '<div class="quick-road-counts"><b>莊 '+(c.b||0)+'</b><b>閒 '+(c.p||0)+'</b><b>和 '+(c.t||0)+'</b><span>總 '+(c.total||0)+'</span></div>'+
'<div class="quick-bead-grid">'+beads+'</div>'+
'<div class="quick-mini-road">'+minis+'</div>';
}
if(t.game==='dragontiger'){
var dt=(t.seq||[]).slice(0,42).map(function(x){
var cls=x==='d'?'dragon':x==='t'?'tiger':'tie';
return '<span class="intl-dt-cell"><i class="intl-dt-ball '+cls+'"></i>'+(x==='e'?'<em></em>':'')+'</span>';
}).join('');
return '<div class="intl-road-counts dt"><b>龍 '+(c.d||0)+'</b><b>虎 '+(c.tg||0)+'</b><b>和 '+(c.e||0)+'</b><span>總 '+(c.total||0)+'</span></div>'+
'<div class="intl-dt-grid">'+dt+'</div>';
}
if(t.game==='sicbo'){
var vals=(t.seq||[]).slice(0,24).map(function(n){
var cls=n>=11?'big':'small';
var odd=n%2?'odd':'even';
var triple=n===3||n===18?' triple':'';
return '<span class="intl-sicbo-cell '+cls+' '+odd+triple+'"><b>'+n+'</b><small>'+(n>=11?'大':'小')+' '+(n%2?'單':'雙')+'</small></span>';
}).join('');
return '<div class="intl-road-counts sicbo"><b>大 '+(c.big||0)+'</b><b>小 '+(c.small||0)+'</b><b>圍 '+(c.triple||0)+'</b><span>總 '+(c.total||0)+'</span></div>'+
'<div class="intl-sicbo-grid">'+vals+'</div>';
}
if(t.game==='roulette'){
var red={1:1,3:1,5:1,7:1,9:1,12:1,14:1,16:1,18:1,19:1,21:1,23:1,25:1,27:1,30:1,32:1,34:1,36:1};
var nums=(t.seq||[]).slice(0,24).map(function(n){
var cls=n===0?'zero':(red[n]?'red':'black');
return '<span class="intl-roulette-num '+cls+'">'+n+'</span>';
}).join('');
return '<div class="intl-road-counts roulette"><b>紅 '+(c.red||0)+'</b><b>黑 '+(c.black||0)+'</b><b>0 '+(c.zero||0)+'</b><span>總 '+(c.total||0)+'</span></div>'+
'<div class="intl-roulette-grid">'+nums+'</div>';
}
return '';
}
function betCell(t,side,label,odds,cls){
var amt=bets[key(t,side)]||0;
var disabled=t.locked||t.time<=0?' locked-disabled':'';
if(t.game==='baccarat' && !disabled){
if(side==='player' && (bets[key(t,'banker')]||0)>0) disabled=' mutual-disabled';
if(side==='banker' && (bets[key(t,'player')]||0)>0) disabled=' mutual-disabled';
}
return '<div class="quick-bet-cell '+cls+(amt?' has-bet':'')+disabled+'" data-table="'+t.id+'" data-side="'+side+'">'+
'<div class="quick-bet-label">'+label+'</div>'+
'<div class="quick-bet-odds">'+odds+'</div>'+
'<div class="quick-bet-amount">'+fmt(amt)+'</div>'+
'</div>';
}
function betPanel(t){
if(t.game==='baccarat'){
return '<div class="quick-score-row"><div class="quick-score-pill player">閒點 <b>'+t.p+'</b></div><div class="quick-score-pill banker">莊點 <b>'+t.b+'</b></div></div>'+
'<div class="quick-bet-row">'+
betCell(t,'player','閒','1:1','player')+
betCell(t,'tie','和','1:8','tie')+
betCell(t,'banker','莊','1:0.95','banker')+
'</div>';
}
if(t.game==='dragontiger'){
return '<div class="quick-score-row"><div class="quick-score-pill player">虎牌 <b>'+t.p+'</b></div><div class="quick-score-pill banker">龍牌 <b>'+t.b+'</b></div></div>'+
'<div class="quick-bet-row">'+
betCell(t,'tiger','虎','1:1','player')+
betCell(t,'tie','和','1:8','tie')+
betCell(t,'dragon','龍','1:1','banker')+
'</div>';
}
if(t.game==='sicbo'){
return '<div class="quick-score-row"><div class="quick-score-pill player">小 / 單</div><div class="quick-score-pill banker">大 / 雙</div></div>'+
'<div class="quick-bet-row">'+
betCell(t,'small','小','1:1','player')+
betCell(t,'tie','圍','1:30','tie')+
betCell(t,'big','大','1:1','banker')+
'</div>';
}
return '<div class="quick-score-row"><div class="quick-score-pill player">黑 / 小</div><div class="quick-score-pill banker">紅 / 大</div></div>'+
'<div class="quick-bet-row">'+
betCell(t,'black','黑','1:1','player')+
betCell(t,'zero','0','35:1','tie')+
betCell(t,'red','紅','1:1','banker')+
'</div>';
}
function card(t){
var isLocked=!!t.locked||t.time<=0;
var urgent=t.time>0&&t.time<=5?' urgent':'';
var countdown=!isLocked&&t.time>0?'<div class="quick-card-countdown'+urgent+'" data-time="'+t.id+'"><span>倒數</span><b>'+t.time+'</b></div>':'';
var hasTableBet=tableTotal(t)>0;
var clearBtn='<button class="quick-card-clear '+(hasTableBet?'':'empty')+'" data-act="clear" data-table="'+t.id+'" type="button" aria-label="清除'+esc(t.name)+'下注">×</button>';
return '<article class="quick-table-card '+(isLocked?'locked':'')+'" data-game="'+t.game+'" data-locked="'+(isLocked?'1':'0')+'">'+
'<div class="quick-table-top">'+
'<div class="quick-room-name"><span class="quick-live-dot"></span>'+esc(t.name)+'<span class="quick-tag">'+esc(t.tag)+'</span>'+(isLocked?'<span class="quick-lock-chip">封盤</span>':'')+'</div>'+
'<div class="quick-room-meta">'+esc(t.meta)+'</div>'+clearBtn+
'</div>'+
'<div class="quick-card-grid">'+
'<div class="quick-road-preview">'+countdown+road(t)+'</div>'+
'<div class="quick-table-bet">'+
betPanel(t)+
'</div>'+
'</div>'+
'</article>';
}
function render(){
var body=$('ab100List');
var total=$('ab100Total');
var count=$('ab100Count');
var chip=$('ab100Chip');
if(!body)return;
var list=rooms.filter(function(t){return filter==='all'||t.game===filter});
body.innerHTML=list.map(card).join('');
if(total)total.textContent=fmt(grand());
if(count)count.textContent=Object.keys(bets).length;
if(chip)chip.textContent=fmt(currentChip);
}
function ensure(){
var m=$('abV100Mask');
if(m)return m;
m=document.createElement('div');
m.id='abV100Mask';
m.className='quick-bet-mask';
m.setAttribute('aria-hidden','true');
m.innerHTML=
'<section class="quick-bet-sheet" role="dialog" aria-modal="true" aria-label="多檯快速押注">'+
'<header class="quick-bet-head">'+
'<div><div class="quick-title">多檯快速押注</div><div class="quick-sub">手機版｜看路紙直接押注，不離開目前房間</div></div>'+
'<button class="quick-close" type="button">×</button>'+
'</header>'+
'<div class="quick-bet-body" id="ab100List"></div>'+
'<div class="quick-fixed-panel">'+
'<div class="quick-chip-strip" id="ab100ChipStrip">'+
'<button class="quick-chip active" data-val="100" type="button">100</button>'+
'<button class="quick-chip" data-val="500" type="button">500</button>'+
'<button class="quick-chip" data-val="1000" type="button">1K</button>'+
'<button class="quick-chip" data-val="5000" type="button">5K</button>'+
'<button class="quick-chip" data-val="10000" type="button">10K</button>'+
'<button class="quick-chip" data-val="50000" type="button">50K</button>'+
'</div>'+
'<div class="quick-bottom-row">'+
'<div class="quick-total-box">已選 <span id="ab100Count">0</span> 注｜總額 <b id="ab100Total">0</b></div>'+
'<button class="quick-main-btn clear" id="ab100ClearAll" type="button">清除全部</button>'+
'<button class="quick-main-btn submit" id="ab100SubmitAll" type="button">送出下注</button>'+
'</div>'+
'</div>'+
'<div class="quick-toast" id="ab100Toast"></div>'+
'</section>';
document.body.appendChild(m);
m.querySelector('.quick-close').onclick=close;
m.addEventListener('click',function(e){if(e.target===m)close()});
m.querySelector('#ab100ChipStrip').addEventListener('click',function(e){
var ch=e.target.closest('.quick-chip');
if(!ch)return;
m.querySelectorAll('.quick-chip').forEach(function(x){x.classList.remove('active')});
ch.classList.add('active');
currentChip=Number(ch.dataset.val)||100;
render();
});
m.querySelector('#ab100List').addEventListener('click',function(e){
var cell=e.target.closest('.quick-bet-cell');
if(cell && !cell.classList.contains('mutual-disabled')){
var t=rooms.find(function(x){return x.id===cell.dataset.table});
if(!t)return;
if(t.locked||t.time<=0){
toast(t.name+' 已封盤，請等下一局');
return;
}
var side=cell.dataset.side;
if(t.game==='baccarat'){
if(side==='player')delete bets[key(t,'banker')];
if(side==='banker')delete bets[key(t,'player')];
}
bets[key(t,side)]=(bets[key(t,side)]||0)+currentChip;
render();
toast(t.name+' '+labelOf(side)+' +'+fmt(currentChip));
return;
}
var btn=e.target.closest('.quick-card-clear,.quick-mini-btn');
if(btn){
var tt=rooms.find(function(x){return x.id===btn.dataset.table});
if(!tt)return;
if(btn.dataset.act==='clear'){
Object.keys(bets).forEach(function(k){if(k.indexOf(tt.id+'_')===0)delete bets[k]});
render();
toast(tt.name+' 已清除');
}
}
});
m.querySelector('#ab100ClearAll').onclick=function(){
Object.keys(bets).forEach(function(k){delete bets[k]});
render();
toast('已清除全部');
};
m.querySelector('#ab100SubmitAll').onclick=function(){
var removed=false;
rooms.forEach(function(t){
if(t.locked||t.time<=0){
Object.keys(bets).forEach(function(k){
if(k.indexOf(t.id+'_')===0){delete bets[k];removed=true;}
});
}
});
if(removed){
render();
toast('封盤桌別已自動移除');
return;
}
var g=grand();
toast(g?'多檯投注已送出 '+fmt(g):'尚未下注');
if(g)setTimeout(close,700);
};
return m;
}
function open(e){
if(e){e.preventDefault();e.stopPropagation()}
var m=ensure();
render();
m.classList.add('show');
m.setAttribute('aria-hidden','false');
document.body.style.overflow='hidden';
}
function close(){
var m=$('abV100Mask');
if(m){
m.classList.remove('show');
m.setAttribute('aria-hidden','true');
document.body.style.overflow='';
}
}
function patchButtons(){
document.querySelectorAll('#multiTableBetBtn,.multi-table-open,.sicbo-multi-table-btn,.ab-v100-open,[data-open-multitable]').forEach(function(btn){
if(btn.dataset.abV100Bound)return;
btn.dataset.abV100Bound='1';
btn.addEventListener('click',open,true);
});
}
ready(function(){
patchButtons();
ensure();
if(!timer){
timer=setInterval(function(){
rooms.forEach(function(r){
if(r.locked){
if(r._restart&&Date.now()>r._restart){
r.time=maxCountdown(r.game);
r.locked=false;
r._restart=null;
}
return;
}
r.time--;
if(r.time<=0){
r.time=0;
r.locked=true;
if(!r._restart)r._restart=Date.now()+1600;
Object.keys(bets).forEach(function(k){if(k.indexOf(r.id+'_')===0)delete bets[k]});
}
});
var m=$('abV100Mask');
if(m&&m.classList.contains('show'))render();
patchButtons();
},1000);
}
});
// V121 fallback：即使後面有舊版 JS/CSS 殘留，也強制讓多檯投注按鈕可開啟新版 abV100Mask
ready(function(){
document.addEventListener('click',function(e){
var btn=e.target.closest('#multiTableBetBtn,.multi-table-open,.sicbo-multi-table-btn,.ab-v100-open,[data-open-multitable]');
if(btn){ open(e); }
},true);
});
window.openABV100MultiTable=open;
window.closeABV100MultiTable=close;
})();
;
(function(){
function place(){
var btn=document.getElementById('multiTableBetBtn');
var actions=document.querySelector('.sicbo-action-buttons');
if(!btn||!actions)return;
var wrap=document.querySelector('.sicbo-action-multi-wrap');
if(!wrap){
wrap=document.createElement('div');
wrap.className='sicbo-action-multi-wrap';
actions.appendChild(wrap);
}
if(btn.parentNode!==wrap)wrap.appendChild(btn);
btn.innerHTML='<span>多檯投注</span>';
btn.classList.add('sicbo-multi-table-btn','ab-v101-multi-pill');
btn.type='button';
}
function boot(){place();setTimeout(place,80);setTimeout(place,350);setTimeout(place,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
var n=0,t=setInterval(function(){place();if(++n>10)clearInterval(t)},700);
})();
;
(function(){
function fixChipActions(){
var panel=document.querySelector('.sicbo-chip-panel');
var oldActions=document.querySelector('.sicbo-action-buttons');
var ok=document.getElementById('confirmBtn');
var cancel=document.getElementById('cancelBtn');
var multi=document.getElementById('multiTableBetBtn');
if(!panel||!oldActions||!ok||!cancel||!multi)return;
if(oldActions.parentNode!==panel){ panel.appendChild(oldActions); }
var okItem=ok.closest('.sicbo-action-item');
var cancelItem=cancel.closest('.sicbo-action-item');
if(okItem && okItem.parentNode!==oldActions) oldActions.appendChild(okItem);
if(cancelItem && cancelItem.parentNode!==oldActions) oldActions.appendChild(cancelItem);
var wrap=oldActions.querySelector('.sicbo-action-multi-wrap');
if(!wrap){
wrap=document.createElement('div');
wrap.className='sicbo-action-multi-wrap';
oldActions.appendChild(wrap);
}
if(multi.parentNode!==wrap) wrap.appendChild(multi);
// 保留原本彈窗 id，不新增第二顆按鈕
multi.innerHTML='<span>多檯投注</span>';
multi.type='button';
multi.classList.add('sicbo-multi-table-btn','ab-v101-multi-pill');
// 移除 action 區以外重複的多檯投注按鈕，避免畫面出現兩顆
document.querySelectorAll('button').forEach(function(btn){
if(btn!==multi && /多檯投注/.test(btn.textContent||'') && !btn.closest('#abV100Mask')){
btn.remove();
}
});
}
function boot(){
fixChipActions();
setTimeout(fixChipActions,60);
setTimeout(fixChipActions,250);
setTimeout(fixChipActions,800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
;
(function(){
function fixCountdownOnly(){
var box = document.getElementById('radarCountdown') || document.querySelector('.radar-countdown');
if(!box) return;
var current = box.querySelector('#countdownNum') || box.querySelector('.countdown-number');
var raw = current ? current.textContent : box.textContent;
var match = String(raw || '').match(/\d+/);
var value = match ? match[0] : '15';
var urgent = box.classList.contains('urgent');
box.className = 'radar-countdown' + (urgent ? ' urgent' : '');
box.id = 'radarCountdown';
box.innerHTML = '<div class="radar-scan"></div><div class="countdown-number" id="countdownNum">' + value + '</div>';
}
if(document.readyState === 'loading'){
document.addEventListener('DOMContentLoaded', fixCountdownOnly);
}else{
fixCountdownOnly();
}
/* disabled: repeated DOM rebuild froze countdown */
})();
;
(function(){
function ready(fn){
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
else fn();
}
ready(function(){
var topbarInfo = document.querySelector('.dice-video-area .room-live-info');
if(topbarInfo){
topbarInfo.innerHTML =
'<span class="room-limit-chip"><i class="fas fa-coins"></i> 限紅 1K-100K</span>' +
'<span class="room-countdown-chip"><i class="fas fa-clock"></i> 15s</span>';
}
var roomTitle = document.querySelector('.dice-video-area .room-title');
if(roomTitle) roomTitle.textContent = 'SICBO VIP 05';
var moreBtn = document.getElementById('roomMoreBtn');
var morePanel = document.getElementById('roomMorePanel');
function setMore(open){
if(!morePanel || !moreBtn) return;
morePanel.classList.toggle('show', !!open);
morePanel.classList.toggle('open', !!open);
moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
if(moreBtn && morePanel){
moreBtn.addEventListener('click', function(e){
e.preventDefault();
e.stopPropagation();
if(e.stopImmediatePropagation) e.stopImmediatePropagation();
setMore(!(morePanel.classList.contains('show') || morePanel.classList.contains('open')));
}, true);
morePanel.addEventListener('click', function(e){
e.stopPropagation();
}, true);
document.addEventListener('click', function(e){
if(!morePanel.contains(e.target) && !moreBtn.contains(e.target)) setMore(false);
}, true);
}
function clickProxy(shortcutId, targetId){
var shortcut = document.getElementById(shortcutId);
var target = document.getElementById(targetId);
if(shortcut && target){
shortcut.addEventListener('click', function(e){
e.preventDefault();
e.stopPropagation();
if(e.stopImmediatePropagation) e.stopImmediatePropagation();
target.click();
}, true);
}
}
clickProxy('videoBetSlipShortcut','betSlipBtn');
clickProxy('videoGuideShortcut','gameGuideBtn');
var fav = document.getElementById('videoGiftShortcut');
if(fav){
fav.addEventListener('click', function(e){
e.preventDefault();
e.stopPropagation();
if(e.stopImmediatePropagation) e.stopImmediatePropagation();
fav.classList.toggle('active');
var giftModal = document.getElementById('giftModal');
if(giftModal) giftModal.classList.toggle('hide');
}, true);
}
var drawerPanel = document.getElementById('roomDrawerPanel');
var drawerHandle = document.getElementById('videoDrawerHandle');
var drawerClose = document.getElementById('drawerCloseBtn');
function setDrawer(open){ if(drawerPanel) drawerPanel.classList.toggle('open', !!open); }
if(drawerHandle && drawerPanel){
drawerHandle.addEventListener('click', function(e){
e.preventDefault();
e.stopPropagation();
if(e.stopImmediatePropagation) e.stopImmediatePropagation();
setDrawer(!drawerPanel.classList.contains('open'));
}, true);
}
if(drawerClose){
drawerClose.addEventListener('click', function(e){
e.preventDefault();
e.stopPropagation();
setDrawer(false);
}, true);
}
});
})();
;
(function(){
function applyLimitOnly(){
var topbar = document.querySelector('.dice-video-area .room-video-topbar');
if(!topbar) return;
var main = topbar.querySelector('.room-main-info');
if(main) main.setAttribute('aria-hidden','true');
var info = topbar.querySelector('.room-live-info');
if(!info){
info = document.createElement('div');
info.className = 'room-live-info';
topbar.appendChild(info);
}
info.innerHTML = '<span class="room-limit-chip"><i class="fas fa-coins"></i> 限紅 1K-100K</span>';
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyLimitOnly);
else applyLimitOnly();
/* 保險：若舊版腳本又把 LIVE/VIP/倒數塞回來，立即改回只顯示限紅 */
setTimeout(applyLimitOnly, 0);
setTimeout(applyLimitOnly, 300);
setTimeout(applyLimitOnly, 1000);
})();
;
(function(){
function applyLimitCenterPill(){
var topbar = document.querySelector('.dice-video-area .room-video-topbar');
if(!topbar) return;
var main = topbar.querySelector('.room-main-info');
if(main) main.setAttribute('aria-hidden','true');
var info = topbar.querySelector('.room-live-info');
if(!info){
info = document.createElement('div');
info.className = 'room-live-info';
topbar.appendChild(info);
}
info.innerHTML = '<span class="room-limit-chip"><i class="fas fa-coins"></i> 限紅 1K-100K</span>';
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyLimitCenterPill);
else applyLimitCenterPill();
setTimeout(applyLimitCenterPill, 0);
setTimeout(applyLimitCenterPill, 300);
setTimeout(applyLimitCenterPill, 1000);
})();
;
(function(){
function handInHand(){
var topbar = document.querySelector('.dice-video-area .room-video-topbar');
if(!topbar) return;
var main = topbar.querySelector('.room-main-info');
if(main){ main.style.display='none'; main.setAttribute('aria-hidden','true'); }
var info = topbar.querySelector('.room-live-info');
if(!info){
info = document.createElement('div');
info.className = 'room-live-info';
topbar.appendChild(info);
}
info.innerHTML = '<span class="room-limit-chip"><i class="fas fa-coins"></i> 限紅 1K-100K</span>';
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', handInHand);
else handInHand();
setTimeout(handInHand, 0);
setTimeout(handInHand, 300);
setTimeout(handInHand, 800);
setTimeout(handInHand, 1500);
})();
;
(function(){
'use strict';
var AB_ROUTES = {
lobby: 'index.html',
home: 'index.html',
baccarat: 'baccarat.html',
dragon: 'dragon.html',
tiger: 'dragon.html',
dragonTiger: 'dragon.html',
sicbo: 'sicbo.html',
roulette: 'roulette.html'
};
window.AB_ROUTES = AB_ROUTES;
window.abGotoRoom = function(kind){
var key = String(kind || '').toLowerCase();
var target = AB_ROUTES[key] || kind;
if(target) window.location.href = target;
};
window.abBackLobby = function(){ window.location.href = AB_ROUTES.lobby; };
function roomFromText(txt){
txt = String(txt || '').toLowerCase();
if(/百家|baccarat/.test(txt)) return 'baccarat';
if(/龍虎|龙虎|dragon|tiger/.test(txt)) return 'dragon';
if(/骰寶|骰宝|sic\s*bo|sicbo/.test(txt)) return 'sicbo';
if(/輪盤|轮盘|roulette/.test(txt)) return 'roulette';
return '';
}
function clickableRoom(el){
if(!el) return '';
return roomFromText((el.getAttribute('data-kind')||'') + ' ' + (el.getAttribute('data-game')||'') + ' ' + (el.getAttribute('data-room')||'') + ' ' + (el.getAttribute('data-type')||'') + ' ' + (el.textContent||''));
}
function isBetAction(target){
return !!(target && target.closest && target.closest('button,input,select,textarea,.chip,.chip-btn,.ab-chip,.quick-chip,.sicbo-action-btn,.action-btn,.action-circle,.confirm,.cancel,.bet-card,.bet-card-main,.bet-card-sub,.cell,.grid-cell,[data-bet],[data-bet-type],[data-value],.quick-table-bet,.quick-table-actions,.quick-bet-actions,.quick-bottom-row'));
}
function bindOne(el, kind, opts){
if(!el || el.__abRouteBound) return;
var target = AB_ROUTES[kind];
if(!target) return;
el.__abRouteBound = true;
el.setAttribute('data-ab-route', kind);
if(el.style) el.style.cursor = 'pointer';
el.addEventListener('click', function(ev){
if(opts && opts.skipBetActions && isBetAction(ev.target)) return;
if(opts && opts.noStop !== true){ ev.preventDefault(); ev.stopPropagation(); }
window.location.href = target;
}, true);
}
function bindAll(){
// Lobby cards: data-kind controls destination.
document.querySelectorAll('.game-card,[data-kind]').forEach(function(el){
var kind = clickableRoom(el);
if(kind) bindOne(el, kind, {noStop:false});
});
// Leave / exit buttons in rooms -> lobby.
document.querySelectorAll('#abVideoExitBtn,.ab-video-exit,.video-exit-btn,[aria-label="離開"],[aria-label="离开"],[data-action="exit"],[data-action="leave"],.exit-btn,.leave-btn').forEach(function(el){
bindOne(el, 'lobby', {noStop:false});
});
document.querySelectorAll('button,a,div').forEach(function(el){
var t=(el.textContent||'').trim();
if(t === '離開' || t === '离开' || t === '退出') bindOne(el, 'lobby', {noStop:false});
});
// Change-table room list items / drawer items -> corresponding room.
document.querySelectorAll('.room-item,.drawer-room,.change-room-item,.table-room-item,.switch-room-item,[data-room],[data-game]').forEach(function(el){
var kind = clickableRoom(el);
if(kind) bindOne(el, kind, {noStop:false});
});
// Multi-table cards: clicking card background enters room, but betting controls remain usable.
document.querySelectorAll('.quick-card,.quick-room-card,.quick-table-card,.multi-table-card,.multi-room-card,.ab-multi-card,.dg-room-card,.quick-item,[class*="multi"][class*="card"],[class*="quick"][class*="card"]').forEach(function(el){
var kind = clickableRoom(el);
if(kind) bindOne(el, kind, {skipBetActions:true, noStop:false});
});
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindAll);
else bindAll();
setTimeout(bindAll, 500);
setTimeout(bindAll, 1500);
})();
;
(function(){
'use strict';
const MAX = 15;
let cdTimer = null;
function q(sel){ return document.querySelector(sel); }
function countdownBox(){ return document.getElementById('radarCountdown') || q('.radar-countdown'); }
function countdownNum(){ return document.getElementById('countdownNum') || q('.countdown-number'); }
function topbarChip(){ return q('.room-countdown-chip'); }
function setCountdownText(v){
const n = Math.max(0, Number(v)||0);
const num = countdownNum();
if(num) num.textContent = String(n);
const chip = topbarChip();
if(chip) chip.innerHTML = '<i class="fas fa-clock"></i> ' + n + 's';
const box = countdownBox();
if(box){
if(n <= 0){
box.classList.add('hidden-countdown');
box.classList.remove('urgent');
}else{
box.classList.remove('hidden-countdown');
box.classList.toggle('urgent', n <= 5);
}
}
}
function safeSetLocked(lock, msg){
if(typeof window.setBettingLocked === 'function'){
try{ window.setBettingLocked(!!lock, msg || ''); return; }catch(e){}
}
window.bettingLocked = !!lock;
document.body.classList.toggle('betting-locked', !!lock);
const dealer = document.getElementById('dealerMsg');
if(dealer && msg) dealer.innerHTML = msg;
}
function safeSettle(){
if(typeof window.settleGame === 'function'){
try{ window.settleGame(); return; }catch(e){ console.error('[SicBo countdown repair] settleGame error:', e); }
}
}
window.showCountdown = function(){
const box = countdownBox();
if(box) box.classList.remove('hidden-countdown');
};
window.hideCountdown = function(){
const box = countdownBox();
if(box) box.classList.add('hidden-countdown');
};
window.startCountdown = function(){
if(cdTimer) clearInterval(cdTimer);
if(window.timer) { try{ clearInterval(window.timer); }catch(e){} }
window.countdown = MAX;
safeSetLocked(false, '✨ 開放下注 ✨');
setCountdownText(MAX);
cdTimer = setInterval(function(){
if(window.isSettling) return;
window.countdown = Math.max(0, (Number(window.countdown)||0) - 1);
setCountdownText(window.countdown);
if(window.countdown <= 0){
clearInterval(cdTimer);
cdTimer = null;
window.hideCountdown();
safeSetLocked(true, '🔒 0秒鎖盤｜本局停止下注');
safeSettle();
}
}, 1000);
window.timer = cdTimer;
};
document.addEventListener('DOMContentLoaded', function(){
setCountdownText(MAX);
setTimeout(function(){
if(!window.isSettling) window.startCountdown();
}, 120);
});
})();
;
(function(){
'use strict';
function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
ready(function(){
var mode='goodroad';
var current = localStorage.getItem('abCurrentSicboRoom') || 'SB1';
var redNums={1:1,3:1,5:1,7:1,9:1,12:1,14:1,16:1,18:1,19:1,21:1,23:1,25:1,27:1,30:1,32:1,34:1,36:1};
var rooms=[
{id:'BAC1',game:'baccarat',name:'百家1 VIP',players:1031,score:98,label:'🔥 莊長龍',seq:'b b b b b p b b t p b b p b b p t b b b p b b p b b b'.split(' ')},
{id:'BAC2',game:'baccarat',name:'百家2 VIP',players:1181,score:86,label:'⚡ 跳路',seq:'b p b p b p b p t b p b p p b p b p b p b'.split(' ')},
{id:'BAC3',game:'baccarat',name:'百家3 VIP',players:808,score:92,label:'🔥 閒長龍',seq:'p p p p b p p t p p b p p p p b p p p b'.split(' ')},
{id:'BAC4',game:'baccarat',name:'百家4 VIP',players:742,score:84,label:'💎 雙跳',seq:'b b p p b b p p b b p p b b p p b b p p'.split(' ')},
{id:'BAC5',game:'baccarat',name:'百家5 VIP',players:963,score:70,label:'✨ 新靴',seq:'b p b b p b p b t p b p b'.split(' ')},
{id:'BAC6',game:'baccarat',name:'百家6 VIP',players:688,score:76,label:'👀 可觀察',seq:'p b t b p p b b p t b p b p b p b b'.split(' ')},
{id:'BAC7',game:'baccarat',name:'百家7 VIP',players:599,score:88,label:'🔥 單跳',seq:'p b p b p b p t b p b p t p b p b p b p b p'.split(' ')},
{id:'DT1',game:'dragon',name:'龍虎 VIP',players:512,score:82,label:'🐉 龍長龍',seq:'dragon dragon tiger dragon tiger dragon tiger dragon dragon tiger tie dragon tiger'.split(' ')},
{id:'SB1',game:'sicbo',name:'骰寶 VIP',players:234,score:78,label:'🎲 大長龍',state:'rolling',stateText:'開骰中',seq:[ [6,6,4],[5,5,3],[1,2,3],[6,3,2],[4,4,5],[2,2,1],[6,5,4],[1,3,5],[6,6,2],[2,4,4],[3,3,6],[1,1,2],[5,6,6],[2,6,1],[4,5,6],[1,2,2],[6,4,3],[5,5,6],[1,1,5],[3,4,5] ]},
{id:'RO1',game:'roulette',name:'輪盤 VIP',players:415,score:80,label:'🔴 紅旺',seq:[32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,0,18]}
];
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function ordered(){
var a=rooms.slice();
if(mode==='hot') a.sort(function(x,y){return (y.players||0)-(x.players||0);});
else if(mode==='goodroad') a.sort(function(x,y){
if(x.game==='baccarat' && y.game!=='baccarat') return -1;
if(x.game!=='baccarat' && y.game==='baccarat') return 1;
return (y.score||0)-(x.score||0);
});
else a.sort(function(x,y){
var order={'BAC1':1,'BAC2':2,'BAC3':3,'BAC4':4,'BAC5':5,'BAC6':6,'BAC7':7,'DT1':8,'SB1':9,'RO1':10};
return (order[x.id]||99)-(order[y.id]||99);
});
return a;
}
function bigRoad(seq, game){
var rows=6, cols=9, grid=Array(rows*cols).fill('');
var last='', col=0, row=0;
(seq||[]).forEach(function(v){
if(!v || v==='empty') return;
var side=v;
if(game==='baccarat' && v==='t') side=last || 't';
if(game==='dragon' && v==='tie') side=last || 'tie';
if(!last){last=side; col=0; row=0;}
else if(side===last && row<rows-1 && !grid[(row+1)*cols+col]) row++;
else if(side===last){col=Math.min(cols-1,col+1);}
else {col=Math.min(cols-1,col+1); row=0; last=side;}
var idx=row*cols+col;
if(grid[idx]){col=Math.min(cols-1,col+1); idx=row*cols+col;}
grid[idx]=v;
});
return grid;
}
function roadBaccarat(r){
var g=bigRoad(r.seq,r.game);
return '<div class="ab-v61-grid '+r.game+'">'+g.map(function(v){
var cls='';
if(r.game==='baccarat') cls=v==='b'?'ab-v61-banker':(v==='p'?'ab-v61-player':(v==='t'?'ab-v61-tie':''));
else cls=v==='dragon'?'ab-v61-dragon':(v==='tiger'?'ab-v61-tiger':(v==='tie'?'ab-v61-peace':''));
return '<span class="ab-v61-cell">'+(v?'<i class="ab-v61-mark '+cls+'"></i>':'')+'</span>';
}).join('')+'</div>';
}
function diceFace(n){return ['','⚀','⚁','⚂','⚃','⚄','⚅'][n]||'⚀';}
function roadSicbo(r){
var items=(r.seq||[]).slice(0,20);
return '<div class="ab-v61-grid sicbo">'+items.map(function(d){
var sum=d[0]+d[1]+d[2], size=sum>=11?'big':'small', odd=sum%2?'單':'雙';
return '<span class="ab-v61-cell ab-v61-sicbo-cell"><b class="ab-v61-sicbo-total '+size+'">'+sum+'</b><span class="ab-v61-dice">'+diceFace(d[0])+diceFace(d[1])+diceFace(d[2])+'</span><em class="ab-v61-sicbo-meta">'+(size==='big'?'大':'小')+' / '+odd+'</em></span>';
}).join('')+'</div>';
}
function roadRoulette(r){
var items=(r.seq||[]).slice(0,30);
return '<div class="ab-v61-grid roulette">'+items.map(function(n){
var color=n===0?'green':(redNums[n]?'red':'black');
return '<span class="ab-v61-cell ab-v61-roulette-cell"><b class="ab-v61-num '+color+'">'+n+'</b></span>';
}).join('')+'</div>';
}
function road(r){
if(r.game==='sicbo') return roadSicbo(r);
if(r.game==='roulette') return roadRoulette(r);
return roadBaccarat(r);
}
function render(){
var list=document.getElementById('roomList'); if(!list) return;
current=localStorage.getItem('abCurrentSicboRoom') || current || 'SB1';
list.className='room-list ab-v61-list';
list.innerHTML='<div class="ab-v61-sort"><div class="ab-v61-sort-head"><span>🔥 好路提示自動排序</span><span class="ab-v61-dot"></span></div><div class="ab-v61-tabs"><button type="button" class="ab-v61-tab '+(mode==='goodroad'?'active':'')+'" data-sort="goodroad">好路</button><button type="button" class="ab-v61-tab '+(mode==='hot'?'active':'')+'" data-sort="hot">人氣</button><button type="button" class="ab-v61-tab '+(mode==='default'?'active':'')+'" data-sort="default">全部</button></div></div><div class="ab-v61-section"><b>推薦房間</b><small>同步大廳房間</small></div>'+ordered().map(function(r){
var active=r.id===current;
var countClass=(r.players||0)===0?' zero':'';
var here=active?'<div class="ab-v61-here"><span class="ab-v61-home">⌂</span><span>您在這裡</span></div>':'';
var state='';
if(!active && r.game==='baccarat' && r.state==='shuffle') state='<div class="ab-v61-state shuffle"><div>♣</div><div>'+esc(r.stateText||'洗牌中')+'</div></div>';
else if(!active && r.game==='sicbo' && r.state==='rolling') state='<div class="ab-v61-state"><div>'+esc(r.stateText||'開骰中')+'</div></div>';
else if(!active && r.game==='roulette' && r.state==='spinning') state='<div class="ab-v61-state"><div>'+esc(r.stateText||'轉盤中')+'</div></div>';
else if(!active && r.game==='dragon' && r.state==='dealing') state='<div class="ab-v61-state"><div>'+esc(r.stateText||'開牌中')+'</div></div>';
return '<div class="room-item ab-v61-card '+(active?'active-room ab-v61-active ':'')+(r.game!=='sicbo'?'cross-game ':'')+'" data-game-type="'+esc(r.game)+'" data-room-id="'+esc(r.id)+'"><div class="ab-v61-head"><div class="ab-v61-name">'+esc(r.name)+'</div><div class="ab-v61-count'+countClass+'">'+esc(r.players)+'</div></div><div class="ab-v61-road">'+road(r)+here+state+'<span class="ab-v61-tag">'+esc(r.label||'好路')+'</span><span class="ab-v61-enter">›</span></div></div>';
}).join('');
list.querySelectorAll('.ab-v61-tab').forEach(function(btn){btn.onclick=function(e){e.preventDefault();e.stopPropagation();mode=btn.getAttribute('data-sort')||'goodroad';render();};});
}
window.abRenderSwitchDrawerV61=render;
window.abRenderSwitchDrawerV60=render;
window.abRenderSwitchDrawerV59=render;
window.abRenderSwitchDrawerV58=render;
window.abRenderSwitchDrawerSimpleRoad=render;
var panel=document.getElementById('roomDrawerPanel');
var handle=document.getElementById('videoDrawerHandle');
var close=document.getElementById('drawerCloseBtn');
if(handle && panel){handle.onclick=function(e){e.preventDefault();e.stopPropagation();render();panel.classList.add('open');};}
if(close && panel){close.onclick=function(e){e.preventDefault();panel.classList.remove('open');};}
document.addEventListener('click',function(e){
var item=e.target.closest&&e.target.closest('#roomDrawerPanel .ab-v61-card');
if(!item) return;
e.preventDefault();
e.stopPropagation();
var id=item.getAttribute('data-room-id') || 'SB1';
var game=item.getAttribute('data-game-type') || 'sicbo';
var nameEl=item.querySelector('.ab-v61-name');
var name=nameEl ? nameEl.textContent.trim() : '骰寶 VIP';
current=id;
localStorage.setItem('abCurrentSicboRoom', id);
var titleEl=document.querySelector('.room-title');
var subEl=document.querySelector('.room-subtitle');
var badgeEl=document.querySelector('.room-badge');
if(game==='sicbo'){
if(titleEl) titleEl.textContent='SICBO VIP 05';
if(subEl) subEl.textContent='真人荷官 · 透明骰盅 · '+name;
if(badgeEl) badgeEl.textContent='SB1';
}else if(game==='baccarat'){
if(titleEl) titleEl.textContent='真人百家樂';
if(subEl) subEl.textContent='真人荷官 · 莊閒和路紙 · '+name;
if(badgeEl) badgeEl.textContent=id.replace('BAC','B');
}else if(game==='dragon'){
if(titleEl) titleEl.textContent='真人龍虎';
if(subEl) subEl.textContent='真人荷官 · 龍虎對決 · '+name;
if(badgeEl) badgeEl.textContent='DT1';
}else if(game==='roulette'){
if(titleEl) titleEl.textContent='真人輪盤';
if(subEl) subEl.textContent='真人荷官 · 歐式輪盤 · '+name;
if(badgeEl) badgeEl.textContent='RO1';
}
// 換桌連動：同遊戲只切換目前骰寶房；跨遊戲直接進入對應頁面
var AB_SWITCH_ROUTES = {
baccarat: 'baccarat.html',
dragon: 'dragon.html',
sicbo: 'sicbo.html',
roulette: 'roulette.html'
};
localStorage.setItem('abSwitchTargetGame', game);
localStorage.setItem('abSwitchTargetRoomId', id);
localStorage.setItem('abSwitchTargetRoomName', name);
localStorage.setItem('abCurrentGame', game);
if(game === 'baccarat') localStorage.setItem('abCurrentBaccaratRoom', id);
if(game === 'dragon') localStorage.setItem('abCurrentDragonRoom', id);
if(game === 'roulette') localStorage.setItem('abCurrentRouletteRoom', id);
if(game === 'sicbo') localStorage.setItem('abCurrentSicboRoom', id);
if(game !== 'sicbo'){
if(typeof addChatMessage==='function') addChatMessage('🏠 系統','正在前往 '+name,'#88ffdd');
if(panel) panel.classList.remove('open');
setTimeout(function(){ window.location.href = AB_SWITCH_ROUTES[game] || (game + '.html'); }, 80);
return;
}
if(typeof addChatMessage==='function') addChatMessage('🏠 系統','您已換桌至 '+name,'#88ffdd');
var dealer=document.getElementById('dealerMsg');
if(dealer) dealer.innerHTML='✨ 歡迎來到 '+name+' ✨';
if(panel) panel.classList.remove('open');
setTimeout(render,30);
},true);
render();
});
})();
;
(function(){
'use strict';
var TRACKS={"none":{"name":"無背景音樂","src":"","tone":"none"},"lounge":{"name":"AB Lounge｜大廳主題","src":"./music/lounge-is-lounge.mp3","tone":"lounge"},"casino":{"name":"You're Beautiful","src":"./music/youre-beautiful.mp3","tone":"casino"},"vip":{"name":"A Light Sketch of Paris","src":"./music/light-sketch-of-paris.mp3","tone":"vip"},"roulette":{"name":"Piano Solo","src":"./music/piano-solo.mp3","tone":"roulette"},"sicbo":{"name":"Chill Cozy Lounge","src":"./music/chill-cozy-lounge.mp3","tone":"sicbo"},"paris":{"name":"Lounge Music","src":"./music/lounge-music.mp3","tone":"paris"},"piano":{"name":"Chardonnay Dreams","src":"./music/chardonnay-dreams.mp3","tone":"piano"},"chardonnay":{"name":"Velvet Steps","src":"./music/velvet-steps.mp3","tone":"chardonnay"}}
var SOUND_HTML="<div class=\"dropdown-label\"><span><i class=\"fas fa-volume-up\"></i> 音效 / 背景音樂</span><button class=\"ab-panel-close\" type=\"button\" data-close-panel=\"toolbarDropdown\" aria-label=\"關閉\">×</button></div>\n<div class=\"sound-control-card\">\n  <div class=\"sound-item-row\"><i class=\"fas fa-user-circle\"></i><input type=\"range\" id=\"dealerVolumeSlider\" min=\"0\" max=\"100\" value=\"70\"><span>荷官</span></div>\n  <div class=\"sound-item-row\"><i class=\"fas fa-gamepad\"></i><input type=\"range\" id=\"gameVolumeSlider\" min=\"0\" max=\"100\" value=\"50\"><span>遊戲</span></div>\n  <div class=\"mute-btn-panel\" id=\"globalMuteBtnDrop\"><i class=\"fas fa-volume-mute\"></i> 一鍵靜音</div>\n  <div class=\"ab-bgm-divider\"></div>\n  <div class=\"ab-bgm-title\"><i class=\"fas fa-music\"></i> 背景音樂</div>\n  <select class=\"ab-bgm-select\" id=\"abBgmSelect\" aria-label=\"背景音樂選擇\"><option value=\"none\">無背景音樂</option><option value=\"lounge\">AB Lounge｜大廳主題</option><option value=\"casino\">You're Beautiful</option><option value=\"vip\">A Light Sketch of Paris</option><option value=\"roulette\">Piano Solo</option><option value=\"sicbo\">Chill Cozy Lounge</option><option value=\"paris\">Lounge Music</option><option value=\"piano\">Chardonnay Dreams</option><option value=\"chardonnay\">Velvet Steps</option></select>\n  <div class=\"ab-bgm-volume-row\"><span>音量</span><input id=\"abBgmVolume\" class=\"ab-bgm-volume\" type=\"range\" min=\"0\" max=\"100\" value=\"65\"><b id=\"abBgmVolumeText\">65%</b></div>\n</div>";
var KEY='ab_sicbo_bgm_settings_clean_v1';
var STOP_KEY='ab_sicbo_bgm_user_stopped_clean_v1';
function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
function toast(msg){
if(typeof addChatMessage==='function'){try{addChatMessage('🎵 系統',msg,'#ffdd99');}catch(e){}}
}
function loadState(){
var s={track:'sicbo',volume:65,dealer:70,game:50,muted:false,enabled:false};
try{var old=JSON.parse(localStorage.getItem(KEY)||'null'); if(old) Object.assign(s,old);}catch(e){}
if(!TRACKS[s.track]) s.track='sicbo';
return s;
}
function saveState(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}}
function ensureToolbar(){
var video=document.querySelector('.dice-video-area')||document.querySelector('.video-area')||document.body;
var toolbar=document.getElementById('toolbarDropdown');
if(!toolbar){
toolbar=document.createElement('div');
toolbar.id='toolbarDropdown';
toolbar.className='ab-sicbo-panel collapsed';
video.appendChild(toolbar);
}
toolbar.innerHTML=SOUND_HTML;
if(toolbar.parentElement!==video) video.appendChild(toolbar);
return toolbar;
}
function ensurePanel(id){
var video=document.querySelector('.dice-video-area')||document.querySelector('.video-area')||document.body;
var panel=document.getElementById(id);
if(!panel){
panel=document.createElement('div');
panel.id=id;
panel.className='ab-sicbo-panel collapsed';
video.appendChild(panel);
}
if(panel.parentElement!==video) video.appendChild(panel);
return panel;
}
window.ABInitSicboSoundPanel=function(){
var audio=document.getElementById('abBgmAudio');
var select=document.getElementById('abBgmSelect');
var volume=document.getElementById('abBgmVolume');
var volumeText=document.getElementById('abBgmVolumeText');
var dealerVol=document.getElementById('dealerVolumeSlider');
var gameVol=document.getElementById('gameVolumeSlider');
var mute=document.getElementById('globalMuteBtnDrop');
if(!audio||!select||!volume) return;
var state=loadState();
function vol(){return state.muted?0:Math.max(0,Math.min(1,(Number(state.volume)||0)/100));}
function say(t){}
function syncUI(){
select.value=state.track;
volume.value=state.volume;
if(volumeText) volumeText.textContent=state.volume+'%';
if(dealerVol) dealerVol.value=state.dealer;
if(gameVol) gameVol.value=state.game;
if(mute){
mute.classList.toggle('active',!!state.muted);
mute.innerHTML=state.muted?'<i class="fas fa-volume-up"></i> 恢復聲音':'<i class="fas fa-volume-mute"></i> 一鍵靜音';
}
}
function setTrack(track){
state.track=TRACKS[track]?track:'sicbo';
var t=TRACKS[state.track]||TRACKS.none;
if(state.track==='none'){audio.pause(); audio.removeAttribute('src'); audio.load(); say('目前：未播放'); return;}
if(audio.getAttribute('src')!==t.src){audio.pause(); audio.src=t.src; audio.load();}
audio.loop=true; audio.volume=vol();
}
function stopAll(){audio.pause(); try{audio.currentTime=0;}catch(e){} say('目前：未播放');}
function playCurrent(){
if(state.track==='none'){stopAll(); return;}
state.enabled=true;
try{localStorage.removeItem(STOP_KEY);}catch(e){}
setTrack(state.track); audio.volume=vol();
var t=TRACKS[state.track]||TRACKS.none;
var p=audio.play();
if(p&&p.then){p.then(function(){}).catch(function(){});}
}
select.onchange=function(e){
state.track=this.value;
state.enabled=state.track!=='none';
saveState(state);
syncUI();
if(state.track==='none'){
try{localStorage.setItem(STOP_KEY,'1');}catch(ex){}
stopAll();
return;
}
// 使用者切換下拉選單本身就是手勢：直接換曲並播放，不另外疊播放器。
playCurrent();
};
volume.oninput=function(){state.volume=Number(this.value)||0; audio.volume=vol(); if(volumeText) volumeText.textContent=state.volume+'%'; saveState(state);};
if(dealerVol) dealerVol.oninput=function(){state.dealer=Number(this.value)||0; saveState(state);};
if(gameVol) gameVol.oninput=function(){state.game=Number(this.value)||0; saveState(state);};
if(mute) mute.onclick=function(e){e.stopPropagation(); state.muted=!state.muted; audio.volume=vol(); saveState(state); syncUI();};
syncUI(); setTrack(state.track);
};
ready(function(){
var toolbar=ensureToolbar();
var limitToolbar=ensurePanel('abLimitDropdown');
var langToolbar=ensurePanel('abLangDropdown');
var video=document.querySelector('.dice-video-area')||document.body;
var moreBtn=document.getElementById('roomMoreBtn');
var morePanel=document.getElementById('roomMorePanel');
function closeMenu(){if(morePanel) morePanel.classList.remove('show','open'); if(moreBtn) moreBtn.setAttribute('aria-expanded','false');}
function closePanels(except){[toolbar,limitToolbar,langToolbar].forEach(function(p){if(p&&p!==except)p.classList.add('collapsed');});}
function anyPanelOpen(){return [toolbar,limitToolbar,langToolbar].some(function(p){return p&&!p.classList.contains('collapsed');});}
function syncLayer(){var open=anyPanelOpen(); if(video.classList) video.classList.toggle('ab-panel-open',open); var r=document.getElementById('radarCountdown'); if(r) r.classList.toggle('hide',open);}
function openSound(e){if(e){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();} closeMenu(); closePanels(toolbar); toolbar.innerHTML=SOUND_HTML; toolbar.classList.toggle('collapsed'); syncLayer(); window.ABInitSicboSoundPanel(); return false;}
window.getSicboLangPack=function getSicboLangPack(lang){
var packs={
'zh-TW':{
logo:'骰寶',system:'系統設定',sound:'音效控制',limit:'限紅資訊',lang:'語言切換',slip:'遊戲注單',guide:'遊戲說明',room:'骰寶 VIP 05',sub:'AB 真人骰寶',wait:'等待開獎',dealer:'✨ 搖骰準備中 ✨',confirmLang:'確認切換',langTip:'先選擇語言，再按下確認套用。',close:'關閉',chipTitle:'選擇籌碼',chipAfter:' / 選擇面額',chipSub:'從已做好的面額中選 6 種，已新增 5K / 10K，會顯示在下注籌碼列',chipSelected:'已選',chipTypes:'種面額',chipReset:'預設6顆',chipSave:'套用這 6 顆',chipApplied:'已切換 6 種籌碼面額',chipCustom:'選籌碼',now:'目前',totalBet:'總注',
limitTitle:'限紅資訊',limitNote:'限紅依房間與會員等級顯示，實際派彩與可下注額以系統送出注單時為準。',
limits:['大 / 小','單 / 雙','圍骰 / 全圍','和值','單骰 / 雙骰','總限紅'],
soundTitle:'音效 / 背景音樂',noneMusic:'無背景音樂',dealerVol:'荷官',gameVol:'遊戲',mute:'一鍵靜音',bgm:'背景音樂',volume:'音量',
text:{'殿寶':'骰寶','LIVE SIC BO':'LIVE SIC BO','旋風俠客':'旋風俠客','鑽石VIP':'鑽石VIP','換桌':'換桌','開放下注':'開放下注','總和':'總和','最新開獎':'最新開獎','大':'大','小':'小','單':'單','雙':'雙','左右滑動切換玩法':'左右滑動切換玩法','單顆骰子・任選其點數':'單顆骰子・任選其點數','自訂籌碼':'自訂籌碼','確認':'確認','取消':'取消','多檯投注':'多檯投注','熱門下注':'熱門下注','遊戲注單':'遊戲注單','遊戲說明':'遊戲說明','限紅資訊':'限紅資訊','語言切換':'語言切換','音效控制':'音效控制','系統設定':'系統設定','限紅':'限紅','限紅 1K-100K':'限紅 1K-100K','繁體中文':'繁體中文','简体中文':'简体中文','日本語':'日本語','한국어':'한국어','VIP 真人館質感 · 黑金大廳同款':'VIP 真人館質感 · 黑金大廳同款','VIP 熱門下注':'VIP 熱門下注','單顆骰子 · 出現次數賠率':'單顆骰子 · 出現次數賠率','單骰 1:1':'單骰 1:1','雙骰 1:2':'雙骰 1:2','三骰 1:3':'三骰 1:3','雙骰 (對子)':'雙骰 (對子)','組合下注 · 1:1':'組合下注 · 1:1','兩粒骰子組合 · 賠率 1:5':'兩粒骰子組合 · 賠率 1:5','圍骰押注區 · 三同骰':'圍骰押注區 · 三同骰','總和押注區 · 4~17點':'總和押注區 · 4~17點','AB VIP LOUNGE · 下注滿200點可聊天':'AB VIP LOUNGE · 下注滿200點可聊天','🎲 荷官':'🎲 荷官','歡迎來到 AB VIP Lounge':'歡迎來到 AB VIP Lounge','發送':'發送','🎮 換桌':'🎮 換桌','鮮花':'鮮花','氣球':'氣球','派對':'派對','總和: 0':'總和: 0','總和：0':'總和：0'}
},
'zh-CN':{
logo:'骰宝',system:'系统设置',sound:'音效控制',limit:'限红信息',lang:'语言切换',slip:'游戏注单',guide:'游戏说明',room:'骰宝 VIP 05',sub:'AB 真人骰宝',wait:'等待开奖',dealer:'✨ 摇骰准备中 ✨',confirmLang:'确认切换',langTip:'先选择语言，再按下方确认套用。',close:'关闭',chipTitle:'选择筹码',chipAfter:' / 选择面额',chipSub:'从已做好的面额中选择 6 种，已新增 5K / 10K，会显示在下注筹码列',chipSelected:'已选',chipTypes:'种面额',chipReset:'预设6颗',chipSave:'套用这 6 颗',chipApplied:'已切换 6 种筹码面额',chipCustom:'选筹码',now:'目前',totalBet:'总注',
limitTitle:'限红信息',limitNote:'限红依房间与会员等级显示，实际派彩与可下注额以系统送出注单时为准。',
limits:['大 / 小','单 / 双','围骰 / 全围','和值','单骰 / 双骰','总限红'],
soundTitle:'音效 / 背景音乐',noneMusic:'无背景音乐',dealerVol:'荷官',gameVol:'游戏',mute:'一键静音',bgm:'背景音乐',volume:'音量',
text:{'殿寶':'骰宝','骰寶':'骰宝','LIVE SIC BO':'LIVE SIC BO','旋風俠客':'旋风侠客','鑽石VIP':'钻石VIP','換桌':'换桌','開放下注':'开放下注','總和':'总和','最新開獎':'最新开奖','大':'大','小':'小','單':'单','雙':'双','左右滑動切換玩法':'左右滑动切换玩法','單顆骰子・任選其點數':'单颗骰子・任选其点数','自訂籌碼':'自定义筹码','確認':'确认','取消':'取消','多檯投注':'多台投注','熱門下注':'热门下注','遊戲注單':'游戏注单','遊戲說明':'游戏说明','限紅資訊':'限红信息','語言切換':'语言切换','音效控制':'音效控制','系統設定':'系统设置','限紅':'限红','限紅 1K-100K':'限红 1K-100K','繁體中文':'繁體中文','简体中文':'简体中文','日本語':'日本語','한국어':'한국어','VIP 真人館質感 · 黑金大廳同款':'VIP 真人馆质感 · 黑金大厅同款','VIP 熱門下注':'VIP 热门下注','單顆骰子 · 出現次數賠率':'单颗骰子 · 出现次数赔率','單骰 1:1':'单骰 1:1','雙骰 1:2':'双骰 1:2','三骰 1:3':'三骰 1:3','雙骰 (對子)':'双骰（对子）','組合下注 · 1:1':'组合下注 · 1:1','兩粒骰子組合 · 賠率 1:5':'两粒骰子组合 · 赔率 1:5','圍骰押注區 · 三同骰':'围骰下注区 · 三同骰','總和押注區 · 4~17點':'和值下注区 · 4~17点','AB VIP LOUNGE · 下注滿200點可聊天':'AB VIP LOUNGE · 下注满200点可聊天','🎲 荷官':'🎲 荷官','歡迎來到 AB VIP Lounge':'欢迎来到 AB VIP Lounge','發送':'发送','🎮 換桌':'🎮 换桌','鮮花':'鲜花','氣球':'气球','派對':'派对','總和: 0':'总和: 0','總和：0':'总和：0'}
},
'en':{
logo:'Sic Bo',system:'System Settings',sound:'Sound Control',limit:'Table Limits',lang:'Language',slip:'Bet Slip',guide:'Game Guide',room:'SIC BO VIP 05',sub:'AB Live Sic Bo',wait:'Waiting for result',dealer:'✨ Dice ready ✨',confirmLang:'Confirm',langTip:'Choose a language, then tap Confirm to apply.',close:'Close',chipTitle:'Choose Chips',chipAfter:' / Denominations',chipSub:'Choose 6 denominations. 5K and 10K are included and will appear in the betting chip row.',chipSelected:'Selected',chipTypes:'types',chipReset:'Default 6',chipSave:'Apply 6 Chips',chipApplied:'Six chip denominations applied',chipCustom:'Chips',now:'Current',totalBet:'Total Bet',
limitTitle:'Table Limits',limitNote:'Limits may vary by room and member level. Final payout and available bet amount are subject to the system-confirmed bet slip.',
limits:['Big / Small','Odd / Even','Triple / Any Triple','Total','Single / Double Dice','Total Table Limit'],
soundTitle:'Sound / Background Music',noneMusic:'No Background Music',dealerVol:'Dealer',gameVol:'Game',mute:'Mute All',bgm:'Background Music',volume:'Volume',
text:{'殿寶':'Sic Bo','骰寶':'Sic Bo','骰宝':'Sic Bo','LIVE SIC BO':'LIVE SIC BO','旋風俠客':'Whirlwind Knight','鑽石VIP':'Diamond VIP','換桌':'Switch Table','開放下注':'Betting Open','總和':'Total','最新開獎':'Latest Result','大':'Big','小':'Small','單':'Odd','雙':'Even','单':'Odd','双':'Even','左右滑動切換玩法':'Swipe left/right to switch bet types','單顆骰子・任選其點數':'Single Dice · Choose any point','自訂籌碼':'Custom Chip','確認':'Confirm','取消':'Cancel','多檯投注':'Multi-Table','熱門下注':'Hot Bets','遊戲注單':'Bet Slip','遊戲說明':'Game Guide','限紅資訊':'Table Limits','語言切換':'Language','音效控制':'Sound Control','系統設定':'System Settings','限紅':'Limit','限紅 1K-100K':'Limit 1K-100K','繁體中文':'Traditional Chinese','简体中文':'Simplified Chinese','日本語':'Japanese','한국어':'Korean','VIP 真人館質感 · 黑金大廳同款':'VIP live-room style · Black-gold lobby theme','VIP 熱門下注':'VIP Hot Bets','單顆骰子 · 出現次數賠率':'Single Dice · Occurrence Payouts','單骰 1:1':'Single 1:1','雙骰 1:2':'Double 1:2','三骰 1:3':'Triple 1:3','雙骰 (對子)':'Double Dice (Pair)','組合下注 · 1:1':'Combination Bets · 1:1','兩粒骰子組合 · 賠率 1:5':'Two-Dice Combinations · Pays 1:5','圍骰押注區 · 三同骰':'Triple Bets · Three of a Kind','總和押注區 · 4~17點':'Total Bets · Points 4–17','AB VIP LOUNGE · 下注滿200點可聊天':'AB VIP LOUNGE · Chat after betting 200 points','🎲 荷官':'🎲 Dealer','歡迎來到 AB VIP Lounge':'Welcome to AB VIP Lounge','發送':'Send','🎮 換桌':'🎮 Switch Table','鮮花':'Flowers','氣球':'Balloons','派對':'Party','總和: 0':'Total: 0','總和：0':'Total: 0'}
},
'ja':{
logo:'シックボー',system:'システム設定',sound:'サウンド設定',limit:'ベット上限',lang:'言語切替',slip:'ベット履歴',guide:'ゲーム説明',room:'シックボー VIP 05',sub:'AB ライブシックボー',wait:'結果待ち',dealer:'✨ ダイス準備中 ✨',confirmLang:'切替を確定',langTip:'言語を選択してから、下の確認ボタンを押してください。',close:'閉じる',chipTitle:'チップ選択',chipAfter:' / 額面選択',chipSub:'用意された額面から6種類を選択します。5K / 10Kも追加済みで下注チップ列に表示されます。',chipSelected:'選択済み',chipTypes:'種類',chipReset:'既定の6枚',chipSave:'6枚を適用',chipApplied:'6種類のチップ額面を適用しました',chipCustom:'チップ',now:'現在',totalBet:'合計下注',
limitTitle:'ベット上限',limitNote:'ベット上限はルームと会員ランクにより表示されます。実際の配当と下注可能額はシステム送信時の注単を基準とします。',
limits:['大小','奇数 / 偶数','ゾロ目 / 全ゾロ','合計値','単一ダイス / 二重ダイス','総上限'],
soundTitle:'効果音 / BGM',noneMusic:'BGMなし',dealerVol:'ディーラー',gameVol:'ゲーム',mute:'全ミュート',bgm:'BGM',volume:'音量',
text:{'殿寶':'シックボー','骰寶':'シックボー','骰宝':'シックボー','LIVE SIC BO':'LIVE SIC BO','旋風俠客':'旋風の騎士','鑽石VIP':'ダイヤVIP','換桌':'テーブル変更','開放下注':'ベット受付中','總和':'合計','最新開獎':'最新結果','大':'大','小':'小','單':'奇','雙':'偶','单':'奇','双':'偶','左右滑動切換玩法':'左右にスワイプして玩法を切替','單顆骰子・任選其點數':'単一ダイス・任意の目を選択','自訂籌碼':'チップ設定','確認':'確認','取消':'取消','多檯投注':'マルチテーブル','熱門下注':'人気下注','遊戲注單':'ベット履歴','遊戲說明':'ゲーム説明','限紅資訊':'ベット上限','語言切換':'言語切替','音效控制':'サウンド設定','系統設定':'システム設定','限紅':'上限','限紅 1K-100K':'上限 1K-100K','繁體中文':'繁体字中国語','简体中文':'簡体字中国語','日本語':'日本語','한국어':'韓国語','VIP 真人館質感 · 黑金大廳同款':'VIPライブルーム質感 · ブラックゴールドロビー仕様','VIP 熱門下注':'VIP 人気ベット','單顆骰子 · 出現次數賠率':'単一ダイス · 出現数配当','單骰 1:1':'単一 1:1','雙骰 1:2':'ダブル 1:2','三骰 1:3':'トリプル 1:3','雙骰 (對子)':'ダブル（ペア）','組合下注 · 1:1':'組み合わせベット · 1:1','兩粒骰子組合 · 賠率 1:5':'2個ダイス組み合わせ · 配当 1:5','圍骰押注區 · 三同骰':'ゾロ目ベットエリア · 三同目','總和押注區 · 4~17點':'合計ベットエリア · 4〜17点','AB VIP LOUNGE · 下注滿200點可聊天':'AB VIP LOUNGE · 200点以上の下注でチャット可能','🎲 荷官':'🎲 ディーラー','歡迎來到 AB VIP Lounge':'AB VIP Loungeへようこそ','發送':'送信','🎮 換桌':'🎮 テーブル変更','鮮花':'花','氣球':'風船','派對':'パーティー','總和: 0':'合計: 0','總和：0':'合計: 0'}
},
'ko':{
logo:'식보',system:'시스템 설정',sound:'사운드 설정',limit:'베팅 한도',lang:'언어 변경',slip:'베팅 내역',guide:'게임 안내',room:'식보 VIP 05',sub:'AB 라이브 식보',wait:'결과 대기',dealer:'✨ 주사위 준비 중 ✨',confirmLang:'변경 확인',langTip:'언어를 선택한 뒤 아래 확인 버튼을 눌러 적용하세요.',close:'닫기',chipTitle:'칩 선택',chipAfter:' / 금액 선택',chipSub:'준비된 금액 중 6가지를 선택하세요. 5K / 10K가 추가되어 베팅 칩 목록에 표시됩니다.',chipSelected:'선택됨',chipTypes:'종류',chipReset:'기본 6개',chipSave:'6개 적용',chipApplied:'6가지 칩 금액이 적용되었습니다',chipCustom:'칩 선택',now:'현재',totalBet:'총 베팅',
limitTitle:'베팅 한도',limitNote:'한도는 방과 회원 등급에 따라 표시되며, 실제 배당과 베팅 가능 금액은 시스템에 제출된 베팅 내역을 기준으로 합니다.',
limits:['대 / 소','홀 / 짝','트리플 / 전체 트리플','합계','단일 주사위 / 더블 주사위','총 한도'],
soundTitle:'효과음 / 배경음악',noneMusic:'배경음악 없음',dealerVol:'딜러',gameVol:'게임',mute:'전체 음소거',bgm:'배경음악',volume:'음량',
text:{'殿寶':'식보','骰寶':'식보','骰宝':'식보','LIVE SIC BO':'LIVE SIC BO','旋風俠客':'선풍 협객','鑽石VIP':'다이아몬드 VIP','換桌':'테이블 변경','開放下注':'베팅 가능','總和':'합계','最新開獎':'최신 결과','大':'대','小':'소','單':'홀','雙':'짝','单':'홀','双':'짝','左右滑動切換玩法':'좌우로 밀어 베팅 유형 변경','單顆骰子・任選其點數':'단일 주사위 · 원하는 눈 선택','自訂籌碼':'칩 설정','確認':'확인','取消':'취소','多檯投注':'멀티 테이블','熱門下注':'인기 베팅','遊戲注單':'베팅 내역','遊戲說明':'게임 안내','限紅資訊':'베팅 한도','語言切換':'언어 변경','音效控制':'사운드 설정','系統設定':'시스템 설정','限紅':'한도','限紅 1K-100K':'한도 1K-100K','繁體中文':'중국어 번체','简体中文':'중국어 간체','日本語':'일본어','한국어':'한국어','VIP 真人館質感 · 黑金大廳同款':'VIP 라이브룸 감성 · 블랙골드 로비 테마','VIP 熱門下注':'VIP 인기 베팅','單顆骰子 · 出現次數賠率':'단일 주사위 · 출현 횟수 배당','單骰 1:1':'단일 1:1','雙骰 1:2':'더블 1:2','三骰 1:3':'트리플 1:3','雙骰 (對子)':'더블（페어）','組合下注 · 1:1':'조합 베팅 · 1:1','兩粒骰子組合 · 賠率 1:5':'두 주사위 조합 · 배당 1:5','圍骰押注區 · 三同骰':'트리플 베팅 구역 · 같은 눈 3개','總和押注區 · 4~17點':'합계 베팅 구역 · 4~17점','AB VIP LOUNGE · 下注滿200點可聊天':'AB VIP LOUNGE · 200점 이상 베팅 시 채팅 가능','🎲 荷官':'🎲 딜러','歡迎來到 AB VIP Lounge':'AB VIP Lounge에 오신 것을 환영합니다','發送':'전송','🎮 換桌':'🎮 테이블 변경','鮮花':'꽃','氣球':'풍선','派對':'파티','總和: 0':'합계: 0','總和：0':'합계: 0'}
}
};
return packs[lang]||packs['zh-TW'];
}
function applyTextMap(pack){
var root=document.querySelector('.compact-container')||document.body;
var map=pack.text||{};
var langs=['zh-TW','zh-CN','en','ja','ko'];
var reverse={};
langs.forEach(function(code){
  var p=getSicboLangPack(code);
  var m=p&&p.text?p.text:{};
  Object.keys(m).forEach(function(src){ reverse[m[src]]=src; });
});
var skip={SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,SELECT:1,OPTION:1,AUDIO:1,VIDEO:1};
var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
if(!n.nodeValue||!n.nodeValue.trim())return NodeFilter.FILTER_REJECT;
var p=n.parentNode; if(!p||skip[p.nodeName])return NodeFilter.FILTER_REJECT;
return NodeFilter.FILTER_ACCEPT;
}});
var nodes=[],n; while(n=walker.nextNode())nodes.push(n);
nodes.forEach(function(node){
var raw=node.nodeValue, key=raw.trim();
var sourceKey=map[key]?key:(reverse[key]||key);
if(map[sourceKey]){ node.nodeValue=raw.replace(key,map[sourceKey]); return; }
['總和','总和','Total','合計','합계'].forEach(function(w){if(key.indexOf(w+':')===0||key.indexOf(w+'：')===0){var m=key.match(/[0-9]+/); if(m&&map['總和: 0']) node.nodeValue=raw.replace(key,map['總和: 0'].replace('0',m[0]));}});
});
}
function applyLang(lang){
var t=getSicboLangPack(lang);
try{localStorage.setItem('ab_sicbo_lang_v1',lang);}catch(ex){}
document.documentElement.lang=lang;
var logo=document.querySelector('.logo-text'); if(logo) logo.childNodes[0].nodeValue=t.logo;
var titleSpan=document.querySelector('.video-menu-title span'); if(titleSpan) titleSpan.textContent=t.system;
var setTxt=function(id,txt){var el=document.querySelector(id+' span'); if(el) el.textContent=txt;};
setTxt('#menuSoundControlBtn',t.sound); setTxt('#menuLimitInfoBtn',t.limit); setTxt('#menuLanguageBtn',t.lang);
var slip=document.getElementById('videoBetSlipShortcut'); if(slip) slip.setAttribute('aria-label',t.slip);
var guide=document.getElementById('videoGuideShortcut'); if(guide) guide.setAttribute('aria-label',t.guide);
var room=document.querySelector('.room-title'); if(room) room.textContent=t.room;
var sub=document.querySelector('.room-subtitle'); if(sub) sub.textContent=t.sub;
var res=document.getElementById('liveResultMain'); if(res && /等待|开奖|Waiting|結果待ち|결과/.test(res.textContent)) res.textContent=t.wait;
var dealer=document.getElementById('dealerMsg'); if(dealer && /準備|准备|ready|待機|준비|ダイス/.test(dealer.textContent)) dealer.textContent=t.dealer;
applyTextMap(t);
try{ buildDoubleDice(); buildComboButtons(); buildTripleSection(); attachBetEvents(); refreshAllChips(); renderRoadmapUI(); }catch(ex){}
document.querySelectorAll('.sicbo-bet-info span').forEach(function(el,i){ if(i===0) el.textContent=t.now||el.textContent; if(i===1) el.textContent=t.totalBet||el.textContent; });
var customLbl=document.querySelector('#customChipBtn span'); if(customLbl) customLbl.textContent=t.chipCustom||customLbl.textContent;
document.dispatchEvent(new CustomEvent('abSicboLanguageChanged',{detail:{lang:lang,pack:t}}));
}
function openLimitPanel(e){
if(e){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();}
closeMenu(); closePanels(limitToolbar);
var cur='zh-TW'; try{cur=localStorage.getItem('ab_sicbo_lang_v1')||'zh-TW';}catch(ex){}
var t=getSicboLangPack(cur);
limitToolbar.innerHTML='<div class="ab-panel-head"><span><i class="fas fa-coins"></i> '+t.limitTitle+'</span><button class="ab-panel-close" type="button" data-close-panel="abLimitDropdown" aria-label="'+t.close+'">×</button></div>'+
'<table class="ab-limit-mini-table">'+
'<tr><td>'+t.limits[0]+'</td><td>1K - 100K</td></tr>'+ '<tr><td>'+t.limits[1]+'</td><td>1K - 100K</td></tr>'+ '<tr><td>'+t.limits[2]+'</td><td>100 - 20K</td></tr>'+ '<tr><td>'+t.limits[3]+'</td><td>100 - 50K</td></tr>'+ '<tr><td>'+t.limits[4]+'</td><td>100 - 30K</td></tr>'+ '<tr><td>'+t.limits[5]+'</td><td>300K</td></tr>'+ '</table>'+ '<div class="ab-limit-note">'+t.limitNote+'</div>';
limitToolbar.classList.remove('collapsed'); syncLayer(); return false;
}
function openLangPanel(e){
if(e){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();}
closeMenu(); closePanels(langToolbar);
var cur='zh-TW'; try{cur=localStorage.getItem('ab_sicbo_lang_v1')||'zh-TW';}catch(ex){}
var t=getSicboLangPack(cur);
var rows=[['zh-TW','繁體中文','TW'],['zh-CN','简体中文','CN'],['en','English','EN'],['ja','日本語','JP'],['ko','한국어','KR']];
langToolbar.dataset.pendingLang=cur;
langToolbar.innerHTML='<div class="ab-panel-head"><span><i class="fas fa-globe"></i> '+t.lang+'</span><button class="ab-panel-close" type="button" data-close-panel="abLangDropdown" aria-label="'+t.close+'">×</button></div><div class="ab-lang-list">'+rows.map(function(r){return '<button class="ab-lang-item '+(r[0]===cur?'active':'')+'" type="button" data-lang="'+r[0]+'" onclick="window.ABSicboSetPendingLang&amp;&amp;window.ABSicboSetPendingLang(\''+r[0]+'\');return false;"><span>'+r[1]+'</span><b>'+r[2]+'</b></button>';}).join('')+'</div><div class="ab-lang-tip">'+t.langTip+'</div><div class="ab-lang-actions"><button class="ab-lang-confirm" id="abLangConfirmBtn" type="button" onclick="window.ABSicboConfirmLang&amp;&amp;window.ABSicboConfirmLang();return false;"><i class="fas fa-check"></i> '+t.confirmLang+'</button></div>';
langToolbar.classList.remove('collapsed'); syncLayer(); return false;
}
function initLangFromStorage(){var cur='zh-TW'; try{cur=localStorage.getItem('ab_sicbo_lang_v1')||'zh-TW';}catch(ex){} applyLang(cur);}
window.ABSicboSetPendingLang=function(lang){
  if(!/^(zh-TW|zh-CN|en|ja|ko)$/.test(lang)) lang='zh-TW';
  langToolbar.dataset.pendingLang=lang;
  langToolbar.querySelectorAll('.ab-lang-item').forEach(function(btn){btn.classList.toggle('active',btn.getAttribute('data-lang')===lang);});
  return false;
};
window.ABSicboConfirmLang=function(){
  var pending=langToolbar.dataset.pendingLang||'zh-TW';
  applyLang(pending);
  langToolbar.classList.add('collapsed');
  syncLayer();
  return false;
};
document.addEventListener('click',function(e){
var closePanelBtn=e.target.closest&&e.target.closest('[data-close-panel]');
if(closePanelBtn){
e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
var target=document.getElementById(closePanelBtn.getAttribute('data-close-panel'));
if(target) target.classList.add('collapsed');
syncLayer();
return false;
}
var systemClose=e.target.closest&&e.target.closest('#systemMenuCloseBtn,.system-menu-close');
if(systemClose){
e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
closeMenu();
return false;
}
var soundBtn=e.target.closest&&e.target.closest('#menuSoundControlBtn,[data-menu-action="sound"]');
if(soundBtn) return openSound(e);
var limitBtn=e.target.closest&&e.target.closest('#menuLimitInfoBtn,[data-menu-action="limit"]');
if(limitBtn) return openLimitPanel(e);
var langBtn=e.target.closest&&e.target.closest('#menuLanguageBtn,[data-menu-action="lang"]');
if(langBtn) return openLangPanel(e);
var langPick=e.target.closest&&e.target.closest('#abLangDropdown .ab-lang-item[data-lang]');
if(langPick){
e.preventDefault();e.stopPropagation();
langToolbar.dataset.pendingLang=langPick.dataset.lang;
langToolbar.querySelectorAll('.ab-lang-item').forEach(function(btn){btn.classList.toggle('active',btn===langPick);});
return false;
}
var langConfirm=e.target.closest&&e.target.closest('#abLangConfirmBtn');
if(langConfirm){
e.preventDefault();e.stopPropagation();
var pending=langToolbar.dataset.pendingLang||'zh-TW';
window.ABSicboConfirmLang();
return false;
}
var menuBtn=e.target.closest&&e.target.closest('#roomMoreBtn');
if(!toolbar.contains(e.target) && !limitToolbar.contains(e.target) && !langToolbar.contains(e.target) && !menuBtn && !(morePanel&&morePanel.contains(e.target))){closePanels(null);syncLayer();}
},true);
langToolbar.addEventListener('pointerdown',function(e){e.stopPropagation();},true);
langToolbar.addEventListener('click',function(e){
var item=e.target.closest&&e.target.closest('.ab-lang-item[data-lang]');
if(item){
e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
langToolbar.dataset.pendingLang=item.dataset.lang;
langToolbar.querySelectorAll('.ab-lang-item').forEach(function(btn){btn.classList.toggle('active',btn===item);});
return false;
}
var ok=e.target.closest&&e.target.closest('#abLangConfirmBtn');
if(ok){
e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
window.ABSicboConfirmLang();
return false;
}
},true);
[toolbar,limitToolbar,langToolbar].forEach(function(p){p.addEventListener('click',function(e){e.stopPropagation();},true);});
window.ABInitSicboSoundPanel();
initLangFromStorage();
syncLayer();
});
})();
;
(function(){
document.addEventListener('DOMContentLoaded',function(){
var a=document.getElementById('abBgmAudio');
if(!a) return;
a.preload='none';
a.addEventListener('error',function(){
console.warn('背景音樂讀取不到，請確認 index.html 旁邊有 music 資料夾。');
});
});
})();