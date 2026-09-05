const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1400)}
function rate(a,b){return b?((a/b)*100).toFixed(1)+"%":"0.0%"}
function totalObj(o){return Object.values(o||{}).reduce((a,b)=>a+(Number(b)||0),0)}
function chancePointsSnapshot(){return {...state.chancePts}}
function img(key){return (state.ui.images&&state.ui.images[key])||IMAGE_KEYS[key]||"assets/placeholder.svg"}
function buttonImg(key){const custom=state.ui.images&&state.ui.images[key];return custom||BONUS_IMAGE_KEYS[key]||"assets/placeholder.svg"}
function esc(s){return String(s).replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]))}

const undoStack=[];
function pushUndo(){
  const snap=clone(state);
  if(snap.ui)snap.ui.images={};
  undoStack.push(snap);
  if(undoStack.length>15)undoStack.shift();
}
function undoLast(){
  if(!undoStack.length)return toast("戻せる操作がありません");
  const images={...(state.ui?.images||{})};
  state=undoStack.pop();
  state.ui=state.ui||clone(defaultState.ui);
  state.ui.images=images;
  saveState();render();toast("1つ前の状態に戻しました");
}
function fmtDateTime(v){try{return new Date(v).toLocaleString('ja-JP')}catch{return v||'—'}}
function sumChanceData(chance){return Object.values(chance||{}).reduce((n,d)=>n+totalObj(d),0)}


const ITEM_HINT={"ツラヌキ筒":"設定4で出現しづらい","無名の短銃":"設定3で出現しづらい","自決袋":"設定1で出現しづらい","来栖の刀":"設定2・3否定（設定6で出やすい）","無名のけん玉":"設定1・3否定（設定6で出やすい）","菖蒲の弓":"高設定期待度UP","ミヤマカラスアゲハ":"高設定期待度UP（強）","小吉":"設定2以上濃厚","中吉":"設定4以上濃厚","大吉":"設定6濃厚"};
const VOICE_HINT={男性:"設定3 or 5示唆",女性:"偶数設定示唆（弱）",景之弱:"16%超で高設定期待度UP",景之中:"3回以上で高設定濃厚",景之強:"3回以上で高設定濃厚",無し:"設定5以上濃厚",特殊:"設定2以上濃厚"};
const INTRO_HINT={男性:"設定3 or 5示唆（60%超で強く見る）",女性:"偶数設定示唆（60%超で強く見る）",美馬:"高設定確定"};
const TROPHY_HINT={銅:"設定2以上",銀:"設定3以上",金:"設定4以上",キリン:"設定5以上",虹:"設定6確定"};
const END_HINT={甲鉄城メンバー:"高設定期待度UP",水着:"設定6確定"};
const SEA_CHAR_HINT={"侑那":[3,6],"鰍":[2,5],"菖蒲":[2,3,4,7],"無名":[1,4],"無名②":[5,6,7],"無名③":[6,7]};
const SEA_STAGE_HINT={"操車場":{1:1,2:2,3:3,4:2,5:2,6:2,7:2},"甲鉄城":{1:1,2:3,3:2,4:3,5:2,6:2,7:2},"第六区画線路沿い":{1:3,2:1,3:1,4:3,5:3,6:2,7:2}};
const STAR=(n)=>"★".repeat(Math.max(0,Math.min(5,n)))+"☆".repeat(Math.max(0,5-Math.min(5,n)));
const levelRank={"不明":0,"参考":1,"期待度UP":2,"期待高":3,"濃厚":4,"確定":5};
function labelLevel(text){for(const k of ["確定","濃厚","期待高","期待度UP","参考"]){if(text.includes(k))return k}return "参考"}
function stars(level){return STAR(levelRank[level]||0)}

function safeRenderPart(name,fn){try{fn()}catch(err){console.error(name+" render failed",err)}}
function render(){
 state.currentGames=Math.max(0,state.totalGames-(state.gameBase||0));
 safeRenderPart("pastRecords",renderPastRecords);
 safeRenderPart("common",()=>{
   const tg=$("#totalGamesDisplay"),cg=$("#currentGamesDisplay"),br=$("#bellRate"),bp=$("#bellProbText");
   if(tg)tg.textContent=`${state.totalGames}G`;if(cg)cg.textContent=`${state.currentGames}G`;
   const bell=state.bell.count?`1/${(state.totalGames/state.bell.count).toFixed(1)}`:"1/—";if(br)br.textContent=`${state.bell.count}回`;if(bp)bp.textContent=`確率 ${bell}`;
 });
 safeRenderPart("chance",renderChance);safeRenderPart("cz",renderCZ);safeRenderPart("cycles",renderCycles);safeRenderPart("items",renderItems);safeRenderPart("sea",renderSea);safeRenderPart("bonus",renderBonusStats);safeRenderPart("prediction",renderPredictions);safeRenderPart("ui",applyUI);
}
function settingLabelForSnapshot(data){
  const current=state;
  try{
    state=mergeState(clone(defaultState),clone(data||{}));
    const f=finalSetting();
    return f.tops?.length?f.tops.map(x=>`設定${x}`).join(" or "):"データ不足";
  }catch(err){
    console.warn("archived setting prediction failed",err);
    return "データ不足";
  }finally{
    state=current;
  }
}
function recordSummaryHtml(d){
  d=d||{};
  const trophy=Object.entries(d.trophy||{}).filter(([,v])=>Number(v)>0).map(([k,v])=>`${esc(k)}：${Number(v)}個`).join(" / ")||"なし";
  const chance=["無名","生駒","カバネ"].map(k=>{const x=d.chance?.[k]||{};const n=totalObj(x);return `<div class="stat-row"><span>${esc(k)}チャンス目発光率</span><b>${rate(Number(x.flash)||0,n)}</b><small>${Number(x.flash)||0}/${n}</small></div>`}).join("");
  const cz=["無名","生駒"].map(k=>{const x=d.cz?.[k]||{};return `<div class="stat-row"><span>${esc(k)}CZ成功率</span><b>${rate(Number(x.success)||0,Number(x.win)||0)}</b><small>${Number(x.success)||0}/${Number(x.win)||0}</small></div>`}).join("");
  const cycles=[1,2,3,4,5,6].map(c=>{const x=d.cycles?.[c]||{bonus:0,total:0};return `<div class="stat-row"><span>${c}周期当選率</span><b>${rate(Number(x.bonus)||0,Number(x.total)||0)}</b><small>${Number(x.bonus)||0}/${Number(x.total)||0}</small></div>`}).join("");
  const voice=d.voice||{},voiceTotal=totalObj(voice);const voiceRows=Object.entries(voice).map(([k,v])=>`<div class="stat-row"><span>${esc(k)}</span><b>${Number(v)||0}回</b><small>${rate(Number(v)||0,voiceTotal)}</small></div>`).join("")||'<div class="muted">データなし</div>';
  const intro=d.intro||{},introTotal=totalObj(intro),male=Number(intro.男性)||0,female=Number(intro.女性)||0,mima=Number(intro.美馬)||0;
  const introRows=`<div class="stat-row"><span>男性</span><b>${male}回</b><small>${rate(male,introTotal)}</small></div><div class="stat-row"><span>女性</span><b>${female}回</b><small>${rate(female,introTotal)}</small></div><div class="stat-row"><span>美馬</span><b>${mima}回</b><small>全${introTotal}回</small></div>`;
  const itemCounts=ITEMS.filter(k=>Number(d.items?.[k])>0).map(k=>`${esc(k)}：${Number(d.items[k])||0}個`).join("<br>")||"なし";
  const bellCount=Number(d.bell?.count)||0,totalGames=Number(d.totalGames)||0,bellProb=bellCount&&totalGames?`1/${(totalGames/bellCount).toFixed(1)}`:"1/—";
  return `<div class="record-summary-sections"><div class="record-metric-card"><h3>出現トロフィー</h3><p>${trophy}</p></div><div class="record-metric-card"><h3>チャンス目発光率</h3><div class="stat-list">${chance}</div></div><div class="record-metric-card"><h3>CZ成功率</h3><div class="stat-list">${cz}</div></div><div class="record-metric-card"><h3>周期当選率</h3><div class="stat-list">${cycles}</div></div><div class="record-metric-card"><h3>ボイス出現</h3><div class="stat-list">${voiceRows}</div><p class="muted">合計 ${voiceTotal}回</p></div><div class="record-metric-card"><h3>キャラ紹介</h3><div class="stat-list">${introRows}</div></div><div class="record-metric-card"><h3>アイテムくじまとめ</h3><p>${itemCounts}</p></div><div class="record-metric-card"><h3>下段ベル</h3><div class="stat-row"><span>確率</span><b>${bellProb}</b><small>${bellCount}回 / ${totalGames}G</small></div></div></div>`;
}
function historyHtmlFromData(d){
  d=d||{};
  const itemCounts=ITEMS.filter(k=>Number(d.items?.[k])>0).map(k=>`${esc(k)}：${Number(d.items[k])||0}個`).join("<br>")||"なし";
  const order=(d.itemOrder||[]).slice(0,50).map((x,i)=>`${i+1}. ${esc(x.item||"")}`).join("<br>")||"なし";
  const sea=(d.seaHistory||[]).map(x=>`${esc(x.date||"")} / ${esc(x.trigger||"")} / 現在${x.cycle??"—"}周期<br>${(x.predictions||[]).map(p=>`${p.cycle}周期:${esc(p.prediction||"不明")}`).join(" / ")}`).join("<hr>")||"なし";
  const cz=(d.czHistory||[]).map(x=>{
    const name=x.cz||"";
    const kindClass=name==="生駒CZ"?"cz-kind-ikoma":name==="無名CZ"?"cz-kind-mumei":"cz-kind-period";
    let result=x.result;
    if(result==="fail")result="失敗";
    if(!result)result=x.success?"EP":"失敗";
    const isFail=result==="失敗"||result==="駿城⇒失敗";
    const resultText=(result==="駿城⇒失敗"||result==="駿城⇒EP"||result==="EP"||result==="失敗")?result:(x.success?"EP":"失敗");
    const resultClass=isFail?"cz-result-fail":"cz-result-success";
    let pointKey=name==="無名CZ"?"無名":name==="生駒CZ"?"生駒":"カバネ";
    const pointVal=Number((x.points||{})[pointKey])||0;
    return `<div class="stat-row cz-history-row"><span>${esc(x.date||"")}<br><strong class="${kindClass}">${esc(name)}</strong> <strong class="${resultClass}">${esc(resultText)}</strong></span><b>${Number(x.games)||0}G / ${esc(pointKey)} ${pointVal}pt</b></div>`;
  }).join("")||"なし";
  return `${recordSummaryHtml(d)}<div class="record-details history-like"><div class="modal-section"><b>CZ履歴</b><div class="stat-list">${cz}</div></div><div class="modal-section"><b>アイテム集計</b><p>${itemCounts}</p><b>直近の出現順</b><p>${order}</p></div><div class="modal-section"><b>海門レベル履歴</b><p>${sea}</p></div></div>`;
}
function renderPastRecords(){
  const root=$("#pastRecords");if(!root)return;
  try{
    const records=loadPastRecords();state.pastRecords=records;
    if(!records.length){root.innerHTML='<div class="card empty-records">まだ保存された記録はありません。<br>「全データリセット」を押すと、その日の実戦記録がここに保存されます。</div>';return}
    root.innerHTML=records.map(rec=>{try{return renderRecordSession(rec)}catch(err){console.error("record render failed",err);return `<div class="card">${esc(rec?.dateKey||"日付不明")} / 詳細表示エラー</div>`}}).join("");
  }catch(err){console.error("past records render failed",err);root.innerHTML='<div class="card empty-records">記録の読み込みに失敗しました。</div>'}
}
function renderRecordSession(rec){
  const prediction=rec.prediction||settingLabelForSnapshot(rec.data||{});
  const manual=Number(rec.manualSetting)||0;
  const options=['<option value="">自分の推測</option>',...Array.from({length:6},(_,i)=>`<option value="${i+1}" ${manual===i+1?'selected':''}>設定${i+1}</option>`)].join('');
  const manualText=manual?`設定${manual}`:'未入力';
  return `<div class="record-date"><div class="record-date-head"><button class="record-date-toggle" data-record-date="${esc(rec.id)}"><span class="record-list-date">${esc(rec.dateKey||"日付不明")}</span><span class="record-list-setting">推定 ${esc(prediction)}</span></button><div class="record-manual-wrap"><span>自分</span><select class="record-manual-select" data-record-manual-setting="${esc(rec.id)}">${options}</select></div></div><div class="record-date-body"><div class="record-session-head"><div><b>${esc(rec.dateKey||"日付不明")} の記録</b><br><small>全リセット実行 ${fmtDateTime(rec.savedAt)}</small></div><button class="record-delete" data-delete-record="${esc(rec.id)}">この日の記録を削除</button></div><div class="record-prediction"><span>推定設定：<strong>${esc(prediction)}</strong></span><span class="record-manual-detail">自分の推測：<strong>${esc(manualText)}</strong></span></div>${historyHtmlFromData(rec.data||{})}<div class="record-note"><h3>メモ</h3><textarea data-record-note="${esc(rec.id)}" placeholder="この日のメモを自由に入力">${esc(rec.note||"")}</textarea><button class="primary record-note-save" data-record-note-save="${esc(rec.id)}">メモを保存</button></div></div></div>`;
}
function renderChance(){
 const el=$("#chanceGrid");if(!el)return;
 const toneClass={"無名":"chance-mumei","生駒":"chance-ikoma","カバネ":"chance-kabane"};
 el.innerHTML=Object.entries(state.chance).map(([name,d])=>{const n=totalObj(d),pt=state.chancePts[name]||0;return `<div class="chance-card ${toneClass[name]||''}"><div class="chance-head chance-head-compact"><img src="${img(name)}"><div class="chance-title"><b>${name}チャンス目</b></div><div class="chance-metrics"><div class="chance-pt-box"><span>現在PT</span><strong>${pt}<small>pt</small></strong></div><div class="chance-rate-box"><span>発光率</span><strong>${rate(d.flash,n)}</strong><small>${d.flash}/${n}</small></div></div></div><div class="counter-grid"><button class="counter-btn" data-chance="${name}" data-key="none"><b>${d.none}</b><span>無発光 +1pt</span></button><button class="counter-btn" data-chance="${name}" data-key="flash"><b>${d.flash}</b><span>発光 +15pt</span></button><button class="counter-btn" data-chance="${name}" data-key="high"><b>${d.high}</b><span>高確率 +15pt</span></button><button class="counter-btn" data-chance="${name}" data-key="combo"><b>${d.combo}</b><span>高確複合 +30pt</span></button></div></div>`}).join("");
}
function czPointHistoryHtml(czName, pointKey){
 const items=(state.czHistory||[]).filter(x=>x.cz===czName).slice().reverse();
 if(!items.length)return '<div class="cz-point-empty">記録なし</div>';
 return `<div class="cz-point-flow">${items.map((x,i)=>{
   const pt=Number(x.points?.[pointKey])||0;
   const raw=x.result||((x.success)?'成功':'失敗');
   const result=raw==='fail'?'失敗':raw;
   const cls=(result==='EP'||result==='駿城⇒EP')?'is-ep':(result==='駿城'||result==='駿城⇒失敗')?'is-shun':'is-fail';
   return `${i?'<span class="cz-point-arrow">⇒</span>':''}<span class="cz-point-item"><b>${pt}</b><em class="${cls}">(${esc(result)})</em></span>`;
 }).join('')}</div>`;
}
function renderCZ(){
 const rows=Object.entries(state.cz).map(([k,d])=>`<div class="stat-row"><span>${k}CZ成功率</span><b>${rate(d.success,d.win)}</b><small>${d.success}/${d.win}</small></div>`).join("");
 const life=[3,2,1].map(l=>{const d=state.ikoma[l],n=d.attack+d.avoid;return `<div class="stat-row"><span>生駒CZ LIFE${l}回避率</span><b>${rate(d.avoid,n)}</b><small>${d.avoid}/${n}</small></div>`}).join("");
 const cycleRows=[1,2,3,4,5,6].map(c=>{const d=state.cycles[c]||{bonus:0,total:0};return `<div class="stat-row"><span>${c}周期CZ当選率</span><b>${rate(d.bonus,d.total)}</b><small>${d.bonus}/${d.total}</small></div>`}).join("");
 const pointHistory=`<div class="cz-point-history"><div class="cz-point-block"><b>無名CZ当選時ポイント</b>${czPointHistoryHtml('無名CZ','無名')}</div><div class="cz-point-block"><b>生駒CZ当選時ポイント</b>${czPointHistoryHtml('生駒CZ','生駒')}</div><div class="cz-point-block"><b>周期CZ当選時ポイント</b>${czPointHistoryHtml('周期CZ','カバネ')}</div></div>`;
 $("#czRates").innerHTML=rows+life+`<div class="muted">周期CZ当選率</div>`+cycleRows+pointHistory;
}
function renderCycles(){ const el=$("#currentCycleLabel"); if(el) el.textContent=`${state.sea.cycle}周期`; }
function renderItems(){
 $("#itemButtons").innerHTML=ITEMS.map(k=>`<button class="image-choice" data-item="${k}"><img src="${img(k)}"><span>${k}<br>${state.items[k]||0}個</span></button>`).join("");
 const small=ITEMS.filter(k=>state.items[k]).map(k=>`${k}：${state.items[k]}個（${ITEM_HINT[k]}）`);const early=itemEarlyInference();$("#itemPrediction").innerHTML=`<b>小吉1～5回目のタイミング（別判定）</b><br>${early.text}<hr>${small.length?small.join("<br>"):"通常のアイテム示唆：データ不足"}`;
}
function getSeaCycle(c){
 state.sea.cycles=state.sea.cycles||{};
 if(!state.sea.cycles[c]) state.sea.cycles[c]={char:{},stage:{}};
 const bucket=state.sea.cycles[c];
 bucket.char=bucket.char||{}; bucket.stage=bucket.stage||{};
 // v10/v11 legacy data lived in state.sea.char/stage. Migrate it into the
 // active cycle even when an empty cycles object already exists.
 if(c===state.sea.cycle){
   const legacyChar=state.sea.char||{}; const legacyStage=state.sea.stage||{};
   if(Object.keys(bucket.char).length===0 && Object.keys(legacyChar).length) bucket.char={...legacyChar};
   if(Object.keys(bucket.stage).length===0 && Object.keys(legacyStage).length) bucket.stage={...legacyStage};
 }
 return bucket;
}
function renderSea(){
 const s=state.sea;
 const stats=$("#seaStats");if(stats)stats.innerHTML="";
 const table=$("#seaTable");if(table)table.innerHTML=[1,2,3,4,5,6].map(n=>{const current=n===s.cycle;const bucket=getSeaCycle(n);const hasLocal=totalObj(bucket.char)>0||totalObj(bucket.stage)>0;const hasRinne=!!rinnePredictionForCycle(n);return `<div class="sea-row ${current?"current":""}"><span class="sea-cycle">${current?"▶ ":""}${n}周期</span><b class="sea-prediction-values">${seaPredictHtmlForCycle(n)}</b><small>${hasRinne?"輪廻くじ優先":current?"現在周期":hasLocal?"キャラ＋ステージ":"未入力"}</small></div>`}).join("");
 const pred=$("#seaPrediction");if(pred)pred.innerHTML=`現在の${s.cycle}周期：<b class="sea-prediction-values">${seaPredictHtmlForCycle(s.cycle)}</b>`;
}
function renderLives(){
 const el=$("#lifeCards");if(!el)return;el.innerHTML=[3,2,1].map(l=>{const d=state.ikoma[l],n=d.attack+d.avoid;return `<div class="life-card"><div class="life-title"><b>LIFE ${l}</b><span>${d.avoid}/${n}</span></div><div class="life-actions"><button class="attack-btn" data-life="${l}" data-life-action="attack">ハズレ襲撃 +1</button><button class="avoid-btn" data-life="${l}" data-life-action="avoid">ハズレ回避 +1</button></div><div class="rate">回避率 ${rate(d.avoid,n)}</div></div>`}).join("");
}
function pieStats(o){
 const entries=Object.entries(o),total=totalObj(o);
 if(!total)return `<div class="pie-empty">データなし</div>`;
 const palette=["#d85a44","#e7a33e","#e0cd4d","#66b56f","#48a4b8","#6386d9","#a56bc6","#d56a9d"];
 let acc=0;const stops=[];
 entries.forEach(([k,v],i)=>{const from=acc;acc+=v/total*100;stops.push(`${palette[i%palette.length]} ${from}% ${acc}%`)});
 const legend=entries.map(([k,v],i)=>`<div class="pie-legend-row"><span class="pie-dot" style="background:${palette[i%palette.length]}"></span><span>${k}</span><b>${v}回</b><small>${rate(v,total)}</small></div>`).join("");
 return `<div class="pie-stats"><div class="pie-chart" style="background:conic-gradient(${stops.join(',')})"><div class="pie-hole"><b>${total}</b><small>回</small></div></div><div class="pie-legend">${legend}</div></div>`;
}
function renderBonusStats(){
 const mk=o=>Object.entries(o).map(([k,v])=>`<div class="stat-row"><span>${k}</span><b>${v}回</b><small>${rate(v,totalObj(o))}</small></div>`).join("");
 $("#voiceButtons").innerHTML=VOICES.map(k=>`<button class="image-choice" data-choice="voice" data-value="${k}"><img src="${buttonImg("voice:"+k)}"><span>${k}</span></button>`).join("");$("#introButtons").innerHTML=INTROS.map(k=>`<button class="image-choice" data-choice="intro" data-value="${k}"><img src="${buttonImg("intro:"+k)}"><span>${k}</span></button>`).join("");$("#trophyButtons").innerHTML=TROPHIES.map(k=>`<button class="image-choice compact-count-choice" data-choice="trophy" data-value="${k}"><img src="${buttonImg("trophy:"+k)}"><span class="choice-footer"><span class="choice-label">${k}</span><b class="choice-count ${(state.trophy[k]||0)===0?"is-zero":""}">${state.trophy[k]||0}個</b></span></button>`).join("");$("#endButtons").innerHTML=ENDS.map(k=>`<button class="image-choice compact-count-choice" data-choice="end" data-value="${k}"><img src="${buttonImg("end:"+k)}"><span class="choice-footer"><span class="choice-label">${k}</span><b class="choice-count ${(state.end[k]||0)===0?"is-zero":""}">${state.end[k]||0}枚</b></span></button>`).join("");
 $("#voiceStats").innerHTML=pieStats(state.voice);$("#introStats").innerHTML=pieStats(state.intro);$("#trophyStats").innerHTML="";$("#endStats").innerHTML="";
}
function itemEarlySmallYoshi(){
 const positions=[];
 (state.itemOrder||[]).forEach((x,i)=>{if(x.item==="小吉")positions.push(i+1)});
 return positions;
}
function itemEarlyInference(){
 const ys=itemEarlySmallYoshi();
 if(!ys.length)return {level:"参考",text:"小吉の出現順：未入力",entries:[]};
 const map={1:"設定6期待高",2:"設定2 or 6期待高",3:"設定3 or 6期待高",4:"設定4 or 6期待高",5:"設定5 or 6期待高"};
 const entries=ys.filter(pos=>pos<=5).map(pos=>({position:pos,hint:map[pos]}));
 const late=ys.filter(pos=>pos>5);
 if(!entries.length)return {level:"参考",text:ys.length?"小吉は出現済み（1～5回目の早期判定対象なし）":"小吉：データ不足",entries:[]};
 const lines=entries.map(x=>`アイテムくじ${x.position}回目：小吉 → ${x.hint}`);

 return {level:"期待高",text:lines.join("<br>"),entries};
}
function itemEvidence(){
 const arr=[];for(const k of ITEMS)if(state.items[k])arr.push({name:k,text:`${k} ${state.items[k]}個：${ITEM_HINT[k]}`,level:(k==="大吉"?"確定":k==="中吉"||k==="小吉"?"濃厚":k==="ミヤマカラスアゲハ"||k==="菖蒲の弓"?"期待高":"期待度UP")});return arr;
}
function trophyEvidence(){if(state.trophy.虹)return {level:"確定",text:"虹トロフィー → 設定6確定"};if(state.trophy.キリン)return {level:"濃厚",text:"キリントロフィー → 設定5以上濃厚"};if(state.trophy.金)return {level:"濃厚",text:"金トロフィー → 設定4以上濃厚"};if(state.trophy.銀)return {level:"濃厚",text:"銀トロフィー → 設定3以上濃厚"};if(state.trophy.銅)return {level:"濃厚",text:"銅トロフィー → 設定2以上濃厚"};return {level:"参考",text:"トロフィー：未入力"}}
function endEvidence(){if(state.end.水着)return {level:"確定",text:"ST終了画面・水着 → 設定6確定"};if(state.end.甲鉄城メンバー)return {level:"期待高",text:"ST終了画面・甲鉄城メンバー → 高設定期待度UP"};return {level:"参考",text:"ST終了画面：未入力"}}
function bonusPtOver100Stats(){
 const defs=[
  {name:"無名",cz:"無名CZ",pt:"無名"},
  {name:"生駒",cz:"生駒CZ",pt:"生駒"},
  {name:"カバネ",cz:"周期CZ",pt:"カバネ"}
 ];
 return defs.map(def=>{
  const rows=(state.czHistory||[]).filter(x=>x&&x.cz===def.cz&&x.success===true);
  const valid=rows.filter(x=>Number.isFinite(Number(x.points?.[def.pt])));
  const over=valid.filter(x=>Number(x.points?.[def.pt])>100).length;
  const total=valid.length;
  const ratio=total?over/total:null;
  let judgement="データ不足",signal="none",level="参考";
  if(total){
   if(ratio<=0.30){judgement="高設定濃厚";signal="high";level="濃厚"}
   else if(ratio>=0.40&&ratio<=0.50){judgement="設定3～5";signal="mid";level="期待高"}
   else if(ratio>0.60){judgement="設定2以下";signal="low";level="濃厚"}
   else judgement="中間・参考";
  }
  return {...def,total,over,ratio,judgement,signal,level};
 });
}
function bonusRateEvidence(){
 const stats=bonusPtOver100Stats();
 const valid=stats.filter(x=>x.total);
 if(!valid.length)return {level:"参考",text:"ボーナス当選時100pt超割合：データ不足",stats};
 const rank={"参考":0,"期待度UP":1,"期待高":2,"濃厚":3,"確定":4};
 const level=valid.reduce((best,x)=>rank[x.level]>rank[best]?x.level:best,"参考");
 const text=stats.map(x=>x.total?`${x.name} ${rate(x.over,x.total)}（${x.over}/${x.total}）→ ${x.judgement}`:`${x.name} データ不足`).join(" / ");
 return {level,text:`ボーナス当選時100pt超割合：${text}`,stats};
}
function czPtEvidence(){
 return {level:"参考",text:"CZ当選時PT判定は「ボーナス当選時100pt超割合」に統合"};
}
function chanceRateStats(){
 return ["無名","生駒","カバネ"].map(name=>{
  const d=state.chance[name]||{};const total=totalObj(d),flash=Number(d.flash)||0;const ratio=total?flash/total:null;
  let judgement="データ不足",signal="none",level="参考";
  if(total){
   if(ratio>0.25){judgement="高設定確定";signal="high-confirm";level="確定"}
   else if(ratio>0.20){judgement="高設定濃厚";signal="high";level="濃厚"}
   else if(ratio<=0.15){judgement="低設定濃厚";signal="low";level="濃厚"}
   else judgement="中間・参考";
  }
  return {name,total,flash,ratio,judgement,signal,level};
 });
}
function chanceEvidence(){
 const stats=chanceRateStats();const valid=stats.filter(x=>x.total);
 if(!valid.length)return {level:"参考",text:"チャンス目発光率：データ不足",stats};
 const rank={"参考":0,"期待度UP":1,"期待高":2,"濃厚":3,"確定":4};
 const level=valid.reduce((best,x)=>rank[x.level]>rank[best]?x.level:best,"参考");
 const text=stats.map(x=>x.total?`${x.name} ${rate(x.flash,x.total)}（${x.flash}/${x.total}）→ ${x.judgement}`:`${x.name} データ不足`).join(" / ");
 return {level,text:`チャンス目発光率（発光のみ）：${text}`,stats};
}
function voiceEvidence(){const n=totalObj(state.voice);if(!n)return {level:"参考",text:"キャラボイス：データ不足"};const m=state.voice.男性/n,f=state.voice.女性/n,weak=state.voice.景之弱/n; if(state.voice.景之中>=3||state.voice.景之強>=3)return {level:"濃厚",text:"景之中/景之強が3回以上 → 高設定濃厚"};if(state.voice.特殊)return {level:"期待度UP",text:"特殊ボイス → 設定2以上示唆"};if(state.voice.無し)return {level:"期待高",text:"無しボイス → 設定5以上示唆"};if(m>.6)return {level:"期待高",text:"男性ボイス60%超 → 設定3 or 5期待高"};if(f>.6)return {level:"期待高",text:"女性ボイス60%超 → 偶数設定期待高"};if(weak>.16)return {level:"期待高",text:"景之弱16%超 → 高設定期待高"};return {level:"参考",text:`キャラボイス：男性${rate(state.voice.男性,n)} / 女性${rate(state.voice.女性,n)} / 景之弱${rate(state.voice.景之弱,n)}`}}
function introEvidence(){const n=totalObj(state.intro);if(!n)return {level:"参考",text:"キャラ紹介：データ不足"};if(state.intro.美馬)return {level:"確定",text:"キャラ紹介・美馬 → 高設定確定"};const m=state.intro.男性/n,f=state.intro.女性/n;if(m>.6)return {level:"期待高",text:"キャラ紹介・男性60%超 → 設定3 or 5期待高"};if(f>.6)return {level:"期待高",text:"キャラ紹介・女性60%超 → 偶数設定期待高"};return {level:"参考",text:`キャラ紹介：男性${rate(state.intro.男性,n)} / 女性${rate(state.intro.女性,n)}`}}
function cycle34Evidence(){const parts=[];for(const c of [3,4]){const d=state.cycles[c];if(!d.total)continue;const obs=d.bonus/d.total;const probs=CYCLE_PROB[c];let best=1,bestDiff=Infinity;for(let s=1;s<=6;s++){const diff=Math.abs(obs-probs[s]);if(diff<bestDiff){best=s;bestDiff=diff}}parts.push(`${c}周期 ${rate(d.bonus,d.total)} → 設定${best}付近`)}return {level:parts.length?"期待度UP":"参考",text:parts.length?`3・4周期当選率：${parts.join(" / ")}`:"3・4周期当選率：データ不足"}}
function ratioEvidence(){const sh=state.bonuses.駿城.count,ep=state.bonuses.EP.count,n=sh+ep;if(!n)return {level:"参考",text:"駿城/EP比率：データ不足"};return {level:ep>sh?"参考":"参考",text:`駿城 ${rate(sh,n)} / EP ${rate(ep,n)}（EP多めなら高設定の可能性を参考）`}}
function bellEvidence(){return state.bell.count?{level:"参考",text:`下段ベル ${rate(state.bell.count,state.totalGames)}（${state.bell.count}回）`}:{level:"参考",text:"下段ベル：データ不足"}}

function finalSetting(){
 const evidence=[trophyEvidence(),endEvidence(),bonusRateEvidence(),itemEarlyInference(),chanceEvidence(),voiceEvidence(),introEvidence(),cycle34Evidence(),ratioEvidence(),bellEvidence()];
 let candidates=[1,2,3,4,5,6];
 const hard=[];
 if(state.trophy.虹||state.end.水着||state.intro.美馬)hard.push(6);
 if(state.trophy.キリン&&!state.trophy.虹)hard.push(5,6);
 if(state.trophy.金&&!state.trophy.キリン&&!state.trophy.虹)hard.push(4,5,6);
 if(state.trophy.銀&&!state.trophy.金&&!state.trophy.キリン&&!state.trophy.虹)hard.push(3,4,5,6);
 if(state.trophy.銅&&!state.trophy.銀&&!state.trophy.金&&!state.trophy.キリン&&!state.trophy.虹)hard.push(2,3,4,5,6);
 const chanceHardHigh=chanceRateStats().some(x=>x.signal==="high-confirm");
 if(chanceHardHigh){const hs=[4,5,6];if(hard.length){const inter=[...new Set(hard)].filter(x=>hs.includes(x));hard.length=0;hard.push(...(inter.length?inter:hs));}else hard.push(...hs);}
 if(hard.length)candidates=candidates.filter(x=>hard.includes(x));
 let scores={1:0,2:0,3:0,4:0,5:0,6:0};
 candidates.forEach(s=>scores[s]+=1);
 const addRange=(sets,w)=>sets.forEach(s=>{if(scores[s]!=null)scores[s]+=w});
 if(state.trophy.虹)addRange([6],100); else if(state.trophy.キリン)addRange([5,6],80); else if(state.trophy.金)addRange([4,5,6],70); else if(state.trophy.銀)addRange([3,4,5,6],60); else if(state.trophy.銅)addRange([2,3,4,5,6],50);
 if(state.end.水着)addRange([6],90);
 if(state.intro.美馬)addRange([4,5,6],85);
 const vr=totalObj(state.voice);if(vr){if(state.voice.男性/vr>.6)addRange([3,5],18);if(state.voice.女性/vr>.6)addRange([2,4,6],16);if(state.voice.景之弱/vr>.16)addRange([4,5,6],20);if(state.voice.景之中>=3||state.voice.景之強>=3)addRange([4,5,6],50)}
 const ir=totalObj(state.intro);if(ir){if(state.intro.男性/ir>.6)addRange([3,5],15);if(state.intro.女性/ir>.6)addRange([2,4,6],14)}
 const ie=itemEarlyInference();for(const entry of (ie.entries||[])){if(entry.position===1)addRange([6],25);if(entry.position===2)addRange([2,6],20);if(entry.position===3)addRange([3,6],20);if(entry.position===4)addRange([4,6],20);if(entry.position===5)addRange([5,6],20);}
 for(const k of ITEMS){if(!state.items[k])continue;if(k==="大吉")addRange([6],100);if(k==="中吉")addRange([4,5,6],45);if(k==="小吉")addRange([2,3,4,5,6],20);if(k==="ミヤマカラスアゲハ")addRange([4,5,6],12);if(k==="菖蒲の弓")addRange([4,5,6],8);}
 // アイテムの「否定／出現しづらい」は候補から減点。否定を強く扱う。
 for(const k of ITEMS){if(!state.items[k])continue;const n=state.items[k];if(k==="来栖の刀"){[2,3].forEach(s=>{if(scores[s]!=null)scores[s]-=45*n})}if(k==="無名のけん玉"){[1,3].forEach(s=>{if(scores[s]!=null)scores[s]-=55*n})}if(k==="ツラヌキ筒"&&scores[4]!=null)scores[4]-=10*n;if(k==="無名の短銃"&&scores[3]!=null)scores[3]-=10*n;if(k==="自決袋"&&scores[1]!=null)scores[1]-=10*n}
 // ボーナス当選時PT：無名・生駒・カバネを個別に評価。100pt超の割合で判定する。
 for(const x of bonusPtOver100Stats()){
  if(x.signal==="high")addRange([4,5,6],34);
  else if(x.signal==="mid")addRange([3,4,5],22);
  else if(x.signal==="low")addRange([1,2],34);
 }
 // チャンス目発光率：無名・生駒・カバネを個別に評価。
 for(const x of chanceRateStats()){
  if(x.signal==="high-confirm")addRange([4,5,6],70);
  else if(x.signal==="high")addRange([4,5,6],45);
  else if(x.signal==="low")addRange([1,2],45);
 }
 const c34=cycle34Evidence();if(c34.level!=="参考")addRange([3,4,5,6],6);
 const max=Math.max(...Object.values(scores));const tops=Object.entries(scores).filter(([,v])=>v===max).map(([s])=>s);return {evidence,candidates:candidates.length?candidates:[1,2,3,4,5,6],scores,tops};
}
function normalPredict(){
 const f=finalSetting();const lines=f.evidence.map((e,i)=>`<div class="setting-item"><span>${i+1}. ${e===f.evidence[3]?e.text:esc(e.text)}</span><b>${stars(levelRank[e.level]||0)}</b><em class="setting-level level-${e.level}">${e.level}</em></div>`).join("");
 return `<div class="final-setting"><strong>総合設定予想：${f.tops.map(x=>`設定${x}`).join(" or ")}</strong><small>優先順位：確定 ＞ 濃厚 ＞ 期待高 ＞ 期待度UP ＞ 参考</small></div>${lines}`;
}
function bonusPredict(){return normalPredict()}
function renderPredictions(){
 const normal=$("#normalPrediction");
 const bonus=$("#bonusPrediction");
 const normalHtml=normalPredict();
 const bonusHtml=bonusPredict();
 if(normal) normal.innerHTML=normalHtml;
 if(bonus) bonus.innerHTML=bonusHtml;
}

function rinneLevelForCycle(cycle){let level=0;for(const x of state.sea.rinne){const cs=x.cycles||[];const applies=(x.type==="輪廻"||x.type==="六根清浄")?x.cycle===cycle:cs.includes(cycle);if(!applies)continue;if(x.type==="輪廻"||x.type==="六根清浄")level=Math.max(level,7);else if(x.type==="好機有")level=Math.max(level,5);else if(x.type==="兆し有")level=Math.max(level,4)}return level}
function charCandidates(cycle=state.sea.cycle){const data=getSeaCycle(cycle).char;const scores={1:0,2:0,3:0,4:0,5:0,6:0,7:0};for(const [name,c] of Object.entries(data))for(const lv of SEA_CHAR_HINT[name]||[])scores[lv]+=c;const max=Math.max(...Object.values(scores));return max?Object.entries(scores).filter(([,v])=>v===max).map(([k])=>Number(k)):[]}
function stageCandidates(cycle=state.sea.cycle){const data=getSeaCycle(cycle).stage;const scores={1:0,2:0,3:0,4:0,5:0,6:0,7:0};for(const [name,c] of Object.entries(data)){const row=SEA_STAGE_HINT[name];if(row)for(let lv=1;lv<=7;lv++)scores[lv]+=row[lv]*c}const max=Math.max(...Object.values(scores));return max?Object.entries(scores).filter(([,v])=>v===max).map(([k])=>Number(k)):[]}
function formatLvCandidates(cs){return cs.length?cs.map(x=>`Lv${x}`).join("・"):"不明"}
function rinnePredictionForCycle(cycle){const r=rinneLevelForCycle(cycle);if(r===7)return {text:"Lv7濃厚",html:"Lv7濃厚"};if(r===5)return {text:"Lv5以上期待度UP",html:"Lv5以上期待度UP"};if(r===4)return {text:"Lv4以上期待度UP",html:"Lv4以上期待度UP"};return null}
function combinedSeaPrediction(cycle){
 const rinne=rinnePredictionForCycle(cycle);
 if(rinne)return rinne;
 const cc=charCandidates(cycle),sc=stageCandidates(cycle);
 if(!cc.length&&!sc.length)return {text:"不明",html:"不明"};
 const union=[...new Set([...cc,...sc])].sort((a,b)=>a-b);
 const overlap=new Set(cc.filter(x=>sc.includes(x)));
 const text=union.map(x=>`Lv${x}`).join("・");
 const html=union.map(x=>overlap.has(x)?`<span class="sea-overlap">Lv${x}</span>`:`<span>Lv${x}</span>`).join('<span class="sea-sep">・</span>');
 return {text,html};
}
function seaPredictForCycle(cycle){return combinedSeaPrediction(cycle).text}
function seaPredictHtmlForCycle(cycle){return combinedSeaPrediction(cycle).html}
function recordBonusResult(type,games,cyc,source){
 const before={date:new Date().toLocaleString("ja-JP"),trigger:source||type,cycle:cyc,predictions:[1,2,3,4,5,6].map(n=>({cycle:n,prediction:seaPredictForCycle(n)}))};
 state.bonuses[type].count++;state.bonuses[type].games.push(games);state.lastBonusTotalGames=state.totalGames;
 state.seaHistory.unshift(before);
 if(type==="EP"){
   state.sea={cycle:1,char:{},stage:{},rinne:[],cycles:{}};
   state.gameBase=state.totalGames;state.currentGames=0;
 }
}
function openCz(kind){
 const pts=chancePointsSnapshot();
 const lifeButtons=kind==="生駒"?`<div class="modal-section"><b>生駒CZ LIFE</b>${[3,2,1].map(l=>{const d=state.ikoma[l]||{attack:0,avoid:0};return `<div class="life-inline"><strong>LIFE ${l}</strong><button class="image-action-button" data-life="${l}" data-life-action="attack"><img src="${buttonImg("result:襲撃")}"><span>襲撃 ${d.attack}回</span></button><button class="image-action-button" data-life="${l}" data-life-action="avoid"><img src="${buttonImg("result:回避")}"><span>回避 ${d.avoid}回</span></button></div>`}).join("")}</div>`:"";
 const recordButton=kind==="生駒"?'<button class="primary modal-record-btn" id="czRecord">記録する</button>':'';
 modalBase(`<h2>${kind}CZ当選</h2><div class="prediction">現在ゲーム数：<strong>${state.currentGames}G</strong><br>無名 ${pts.無名}pt / 生駒 ${pts.生駒}pt / カバネ ${pts.カバネ}pt</div><div class="modal-section"><b>結果</b><div class="three-col result-buttons">${["失敗","駿城","EP"].map(x=>`<button type="button" class="image-result-button" data-cz-result="${x}"><img src="${buttonImg("result:"+x)}"><span>${x}</span></button>`).join("")}</div></div>${lifeButtons}${recordButton}`);
 let result="";
 const hitGames=Math.max(0,Number(state.currentGames)||0);
 const hitCycle=state.sea.cycle;
 const finishSimple=(finalResult)=>{
   pushUndo();
   const success=finalResult!=="失敗";
   state.cz[kind].win++;
   if(success)state.cz[kind].success++;
   state.czHistory.unshift({cz:kind+"CZ",games:hitGames,success,result:finalResult,points:pts,elapsedGames:Math.max(0,state.totalGames-(state.lastBonusTotalGames||0)),date:new Date().toLocaleString('ja-JP')});
   state.chancePts[kind]=0;
   if(success){
     recordBonusResult(finalResult,hitGames,hitCycle,kind+"CZ→"+finalResult);
     if(finalResult==="EP")state.chancePts.カバネ=0;
   }
   saveState();closeModal();render();toast(`${kind}CZ ${finalResult}を記録しました`);
 };
 const finishShun=(afterResult)=>{
   pushUndo();
   // 無名CZ・生駒CZは駿城に当選した時点でCZ成功。
   // 駿城⇒EP / 駿城⇒失敗のどちらも、CZ1回・成功1回として集計する。
   state.cz[kind].win++;
   state.cz[kind].success++;
   const shunToEp=afterResult==='EP';
   state.czHistory.unshift({
     cz:kind+"CZ",
     games:hitGames,
     success:true,
     result:shunToEp?'駿城⇒EP':'駿城⇒失敗',
     points:pts,
     elapsedGames:Math.max(0,state.totalGames-(state.lastBonusTotalGames||0)),
     date:new Date().toLocaleString('ja-JP')
   });
   state.chancePts[kind]=0;

   // 駿城ボーナス自体の当選はボーナス記録に残す。
   recordBonusResult('駿城',hitGames,hitCycle,kind+'CZ→駿城');

   // 駿城ボーナス消化分として必ず22G加算。
   state.totalGames+=22;
   state.currentGames=Math.max(0,state.totalGames-(state.gameBase||0));

   if(shunToEp){
     const epGames=Math.max(0,Number(state.currentGames)||0);
     recordBonusResult('EP',epGames,hitCycle,'駿城→EP');
     state.chancePts.カバネ=0;
     saveState();closeModal();render();
     toast(`${kind}CZ 駿城 ${hitGames}G → EP ${epGames}G をCZ1回・成功1回として記録しました`);
   }else{
     // 無名CZ・生駒CZ経由の駿城失敗では周期は進めない。
     saveState();closeModal();render();
     toast(`${kind}CZ 駿城 ${hitGames}G → 失敗（+22G）をCZ1回・成功1回として記録しました`);
   }
 };
 const openShunFollowup=()=>{
   const projected=hitGames+22;
   modalBase(`<h2>駿城ボーナス</h2><div class="prediction">${kind}CZから駿城ボーナス当選：<strong>${hitGames}G</strong><br>終了時に22G加算 → <strong>${projected}G</strong></div><div class="two-col shun-followup-buttons"><button class="image-result-button" data-shun-follow="fail"><img src="${buttonImg("result:失敗")}"><span>失敗</span></button><button class="image-result-button" data-shun-follow="EP"><img src="${buttonImg("result:EP")}"><span>EP</span></button></div><p class="muted">失敗：駿城終了として記録 / EP：+22G後のゲーム数でEP当選として周期をリセット</p>`);
   $$('#modalRoot [data-shun-follow]').forEach(b=>b.onclick=()=>finishShun(b.dataset.shunFollow));
 };
 $$('#modalRoot [data-cz-result]').forEach(b=>b.addEventListener('click',()=>{
   result=b.dataset.czResult;
   if(result==='駿城'){
     // 全CZ共通：駿城を押した時点で即「失敗 / EP」の2択へ進む。
     openShunFollowup();
     return;
   }
   if(kind==='無名'){
     // 無名CZは失敗/EPを押した時点で即記録。
     finishSimple(result);
     return;
   }
   // 生駒CZは従来通り、失敗/EPを選択してから「記録する」。
   $$('#modalRoot [data-cz-result]').forEach(x=>x.classList.remove('selected'));
   b.classList.add('selected');
 }));
 $$('[data-life][data-life-action]').forEach(b=>b.onclick=()=>{const l=b.dataset.life,a=b.dataset.lifeAction;pushUndo();state.ikoma[l][a]++;saveState();const d=state.ikoma[l];b.querySelector('span').textContent=(a==='attack'?'襲撃 ':'回避 ')+(d[a]||0)+'回';});
 const czRecord=$('#czRecord');
 if(czRecord)czRecord.onclick=()=>{if(!result)return toast('結果を選択してください');if(result==='駿城')return openShunFollowup();finishSimple(result)};
}
function openPeriodCZ(){
 const pts=state.chancePts.カバネ||0;
 const cyc=state.sea.cycle;
 const hitGames=Math.max(0,Number(state.currentGames)||0);
 modalBase(`<h2>周期CZ</h2><div class="prediction">現在周期：<strong>${cyc}周期</strong><br>当選時カバネPT：<strong>${pts}pt</strong></div><div class="three-col result-buttons"><button type="button" class="image-result-button" data-period-result="fail"><img src="${buttonImg("result:失敗")}"><span>失敗</span></button><button type="button" class="image-result-button" data-period-result="駿城"><img src="${buttonImg("result:駿城")}"><span>駿城</span></button><button type="button" class="image-result-button" data-period-result="EP"><img src="${buttonImg("result:EP")}"><span>EP</span></button></div>`);
 let result=null;
 const finishSimple=(result)=>{
   pushUndo();
   const success=result!=="fail";
   state.cycles[cyc].total++;
   if(success){state.cycles[cyc].bonus++;state.cycleBonuses[cyc][result]++;}
   state.czHistory.unshift({cz:'周期CZ',games:hitGames,success,result,cycle:cyc,points:{カバネ:pts},date:new Date().toLocaleString('ja-JP')});
   state.chancePts.カバネ=0;
   if(success)recordBonusResult(result,hitGames,cyc,'周期CZ→'+result);
   if(result==='fail'){state.sea.cycle=cyc>=6?1:cyc+1;getSeaCycle(state.sea.cycle);}
   saveState();closeModal();render();
   if(result==='fail')toast(`${cyc}周期の周期CZ失敗を記録 → ${state.sea.cycle}周期へ進みました`);
   else toast(`${cyc}周期のEP当選を記録しました`);
 };
 const finishShun=(afterResult)=>{
   pushUndo();
   // 駿城ボーナス自体はCZ成功として当選時ゲーム数で記録する。
   state.cycles[cyc].total++;
   state.cycles[cyc].bonus++;
   state.cycleBonuses[cyc].駿城++;
   state.chancePts.カバネ=0;
   recordBonusResult('駿城',hitGames,cyc,'周期CZ→駿城');

   // 駿城ボーナス消化分として必ず22G加算。
   state.totalGames+=22;
   state.currentGames=Math.max(0,state.totalGames-(state.gameBase||0));

   // 周期CZのポイント履歴は駿城後の最終結果まで1つにまとめて表示する。
   state.czHistory.unshift({
     cz:'周期CZ',
     games:hitGames,
     success:true,
     result:afterResult==='EP'?'駿城⇒EP':'駿城⇒失敗',
     cycle:cyc,
     points:{カバネ:pts},
     date:new Date().toLocaleString('ja-JP')
   });

   if(afterResult==='EP'){
     const epGames=Math.max(0,Number(state.currentGames)||0);
     recordBonusResult('EP',epGames,cyc,'駿城→EP');
     state.chancePts.カバネ=0;
     saveState();closeModal();render();
     toast(`駿城 ${hitGames}G → EP ${epGames}G を記録しました`);
   }else{
     state.sea.cycle=cyc>=6?1:cyc+1;
     getSeaCycle(state.sea.cycle);
     saveState();closeModal();render();
     toast(`駿城 ${hitGames}G → 失敗（+22G）を記録 → ${state.sea.cycle}周期へ進みました`);
   }
 };
 const openShunFollowup=()=>{
   const projected=hitGames+22;
   modalBase(`<h2>駿城ボーナス</h2><div class="prediction">駿城ボーナス当選：<strong>${hitGames}G</strong><br>終了時に22G加算 → <strong>${projected}G</strong></div><div class="two-col shun-followup-buttons"><button class="image-result-button" data-shun-follow="fail"><img src="${buttonImg("result:失敗")}"><span>失敗</span></button><button class="image-result-button" data-shun-follow="EP"><img src="${buttonImg("result:EP")}"><span>EP</span></button></div><p class="muted">失敗：次の周期へ進む / EP：EP当選として周期をリセット</p>`);
   $$('#modalRoot [data-shun-follow]').forEach(b=>b.onclick=()=>finishShun(b.dataset.shunFollow));
 };
 $$('#modalRoot [data-period-result]').forEach(b=>b.addEventListener('click',()=>{
   result=b.dataset.periodResult;
   if(result==='駿城'){
     openShunFollowup();
     return;
   }
   // 周期CZは失敗/EPを押した時点で即記録。
   finishSimple(result);
 }));
}
function closeModal(){const root=$("#modalRoot");if(root)root.innerHTML=""}
function modalBase(body){$("#modalRoot").innerHTML=`<div class="modal-back"><div class="modal"><button class="modal-close" id="modalClose">✕</button>${body}</div></div>`;$("#modalClose").onclick=closeModal;return $("#modalRoot .modal")}
function openRinne(){modalBase(`<h2>輪廻くじ</h2><div class="choice-grid" id="rinneTypes">${["好機有","兆し有","輪廻","六根清浄"].map(x=>`<button data-rinne-type="${x}">${x}</button>`).join("")}</div><div id="rinneCycles"></div><button class="primary modal-record-btn" id="rinneSave">記録する</button>`);let type="";$$('#rinneTypes button').forEach(b=>b.onclick=()=>{type=b.dataset.rinneType;$$('#rinneTypes button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');$("#rinneCycles").innerHTML=(type==="好機有"||type==="兆し有")?`<div class="field"><label>対象周期（複数選択可）</label><div class="cycle-buttons">${[1,2,3,4,5,6].map(n=>`<button data-rinne-cycle="${n}">${n}</button>`).join("")}</div></div>`:`<div class="prediction">現在の${state.sea.cycle}周期だけをLv7にします。</div>`});$("#rinneSave").onclick=()=>{if(!type)return toast("種類を選択してください");const cycles=$$('[data-rinne-cycle].active').map(x=>Number(x.dataset.rinneCycle));if((type==="好機有"||type==="兆し有")&&!cycles.length)return toast("周期を1つ以上選択してください");pushUndo();state.sea.rinne.push({type,cycles,cycle:state.sea.cycle,date:new Date().toLocaleString('ja-JP')});saveState();closeModal();render();toast("輪廻くじを記録しました")};$("#rinneCycles").addEventListener("click",e=>{if(e.target.dataset.rinneCycle)e.target.classList.toggle("active")})}
function openSeaChoice(kind){
 const options=kind==="char"?["侑那","鰍","菖蒲","無名","無名②","無名③"]:["操車場","甲鉄城","第六区画線路沿い"];
 const title=kind==="char"?"演出キャラ":"ステージ";
 const prefix=kind==="char"?"sea-char:":"sea-stage:";
 modalBase(`<h2>${title}記録</h2><div class="prediction">現在の${state.sea.cycle}周期に記録します</div><div class="choice-grid sea-choice-grid ${kind==="char"?"sea-char-choice-grid":"sea-stage-choice-grid"}">${options.map(x=>`<button class="image-choice" data-sea-choice="${x}"><img src="${buttonImg(prefix+x)}" alt="${esc(x)}"><span>${esc(x)}</span></button>`).join("")}</div>`);
 $$('#modalRoot [data-sea-choice]').forEach(b=>b.onclick=()=>{
   const bucket=getSeaCycle(state.sea.cycle);
   const target=kind==="char"?bucket.char:bucket.stage;
   const key=b.dataset.seaChoice;
   pushUndo();
   target[key]=(Number(target[key])||0)+1;
   saveState();closeModal();render();toast(`${state.sea.cycle}周期の${title}「${key}」を記録しました`);
 });
}
function openHistory(){modalBase(`<h2>履歴</h2>${historyHtmlFromData(state)}`)}
function openSettings(){modalBase(`<h2>画像・UI設定</h2><div class="modal-section"><b>全体テーマ</b><div class="choice-grid"><button data-theme="dark">ダーク</button><button data-theme="light">ライト</button></div></div><div class="modal-section"><b>背景</b><div class="choice-grid"><button class="bg-choice ${state.ui.background==="steel-dark"?"selected":""}" data-bg="steel-dark" style="background-image:linear-gradient(#0006,#0008),url(assets/backgrounds/steel-dark.svg)">鋼鉄</button><button class="bg-choice ${state.ui.background==="rail-night"?"selected":""}" data-bg="rail-night" style="background-image:linear-gradient(#0006,#0008),url(assets/backgrounds/rail-night.svg)">夜の線路</button><button class="bg-choice ${state.ui.background==="iron-red"?"selected":""}" data-bg="iron-red" style="background-image:linear-gradient(#0006,#0008),url(assets/backgrounds/iron-red.svg)">鉄・赤</button><button class="bg-choice ${state.ui.background==="black-minimal"?"selected":""}" data-bg="black-minimal" style="background-image:linear-gradient(#0006,#0008),url(assets/backgrounds/black-minimal.svg)">黒・ミニマル</button></div></div><div class="modal-section"><b>枠・アクセントカラー</b><div class="color-row"><span>カウンターなどの枠色</span><input id="borderColor" type="color" value="${state.ui.borderColor||"#303640"}"></div><div class="color-row"><span>強調色</span><input id="accentColor" type="color" value="${state.ui.accent||"#b44b34"}"></div></div><div class="modal-section"><b>画像ファイル</b><p class="muted">「画像選択」で登録した画像はボタンに即反映されます。登録画像を削除したい場合はデータリセットが必要です。</p>${Object.entries({...IMAGE_KEYS,...Object.fromEntries(Object.keys(BONUS_IMAGE_KEYS).map(k=>[k,BONUS_IMAGE_KEYS[k]]))}).map(([k,v])=>`<div class="image-setting"><img src="${(BONUS_IMAGE_KEYS[k]?buttonImg(k):img(k))}"><span>${esc(k)}<br><small>${v}</small></span><label class="file-btn">画像選択<input type="file" accept="image/*" data-image-key="${k}" hidden></label></div>`).join("")}<div class="modal-section"><b>UI</b><div class="field"><label><input id="compactUI" type="checkbox" ${state.ui.compact?"checked":""}> コンパクト表示</label></div></div>`);$$('[data-theme]').forEach(b=>b.onclick=()=>{state.ui.theme=b.dataset.theme;saveState();applyUI();openSettings()});$$('[data-bg]').forEach(b=>b.onclick=()=>{state.ui.background=b.dataset.bg;saveState();applyUI();openSettings()});$("#borderColor").onchange=e=>{state.ui.borderColor=e.target.value;saveState();applyUI()};$("#accentColor").onchange=e=>{state.ui.accent=e.target.value;saveState();applyUI()};$("#compactUI").onchange=e=>{state.ui.compact=e.target.checked;saveState();applyUI()};$$("[data-image-key]").forEach(inp=>inp.onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=async()=>{const key=e.target.dataset.imageKey;state.ui.images[key]=r.result;await setStoredImage(key,r.result);saveState();openSettings();toast("画像を保存しました")};r.readAsDataURL(f)})}
function applyUI(){const light=state.ui.theme==="light";document.documentElement.style.setProperty("--bg",light?"#f4f5f7":"#0d0f13");document.documentElement.style.setProperty("--card",light?"#ffffff":"#171a20");document.documentElement.style.setProperty("--card2",light?"#e3e6eb":"#20242c");document.documentElement.style.setProperty("--text",light?"#111318":"#f4f5f7");document.documentElement.style.setProperty("--muted",light?"#535b67":"#9ba2ad");document.documentElement.style.setProperty("--warn",light?"#9a5a00":"#f0bd4f");document.documentElement.style.setProperty("--border",light?"#aeb5bf":(state.ui.borderColor||"#303640"));document.documentElement.style.setProperty("--accent",state.ui.accent||"#b44b34");document.documentElement.style.setProperty("--page-bg",`url("assets/backgrounds/${state.ui.background||"steel-dark"}.svg")`);document.body.classList.toggle("compact",state.ui.compact);document.body.classList.toggle("light-theme",light)}
function changeCycle(n){if(state.sea.cycle===n)return;pushUndo();state.sea.cycle=n;getSeaCycle(n);saveState();render();toast(`${n}周期に変更しました`) }

document.addEventListener("click",e=>{
 const b=e.target.closest?.("button");if(!b)return;
 try{
   if(b.dataset.page){$$('.tab').forEach(x=>x.classList.toggle('active',x===b));$$('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+b.dataset.page));document.body.classList.toggle('records-page-active',b.dataset.page==='records');if(b.dataset.page==='records')renderPastRecords();return}
   if(b.dataset.recordDate){b.closest('.record-date')?.classList.toggle('open');return}
   if(b.dataset.deleteRecord){if(confirm('この保存記録を削除しますか？')){pushUndo();deletePastRecord(b.dataset.deleteRecord);render();toast('保存記録を削除しました')}return}
   if(b.dataset.recordNoteSave){const ta=document.querySelector(`[data-record-note="${CSS.escape(b.dataset.recordNoteSave)}"]`);if(updatePastRecordNote(b.dataset.recordNoteSave,ta?.value||'')){renderPastRecords();toast('メモを保存しました')}else toast('メモの保存に失敗しました');return}
   if(b.dataset.action==='undo'){undoLast();return}
   if(b.dataset.chance){pushUndo();const d=state.chance[b.dataset.chance],k=b.dataset.key;d[k]++;state.chancePts[b.dataset.chance]+=POINTS[k];saveState();render();return}
   if(b.dataset.action==='games-add'){pushUndo();state.totalGames=Math.max(0,state.totalGames+(Number(b.dataset.value)||0));state.currentGames=Math.max(0,state.totalGames-(state.gameBase||0));saveState();render();return}
   if(b.dataset.action==='games-minus'){pushUndo();state.totalGames=Math.max(0,state.totalGames-1);saveState();render();return}
   if(b.dataset.action==='games-input'){
     let inputMode='total';
     let fresh={current:true,total:true};
     let values={
       current:String(Math.max(0,Number(state.currentGames)||0)),
       total:String(Math.max(0,Number(state.totalGames)||0))
     };
     const draw=()=>{
       const out=$("#gamesKeypadValue");
       const title=$("#gamesKeypadTitle");
       if(out)out.textContent=(values[inputMode]||"0")+"G";
       if(title)title.textContent=inputMode==='current'?"現在ゲーム数":"総ゲーム数";
       $$('#modalRoot [data-game-input-mode]').forEach(x=>x.classList.toggle('selected',x.dataset.gameInputMode===inputMode));
     };
     modalBase(`<div class="game-input-top"><div class="game-input-switch"><button data-game-input-mode="total" class="selected">総ゲーム数</button><button data-game-input-mode="current">現在ゲーム数</button></div></div><h2 id="gamesKeypadTitle">総ゲーム数</h2><div class="keypad-display" id="gamesKeypadValue">${values.total}G</div><div class="number-keypad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-keypad-number="${n}">${n}</button>`).join("")}<button class="keypad-zero" data-keypad-number="0">0</button><button class="keypad-delete" data-keypad-delete>×</button></div><button class="primary modal-record-btn" id="modalSave">保存</button>`);
     $$('#modalRoot [data-game-input-mode]').forEach(x=>x.onclick=()=>{inputMode=x.dataset.gameInputMode;draw()});
     $$('#modalRoot [data-keypad-number]').forEach(k=>k.onclick=()=>{const n=k.dataset.keypadNumber;let v=fresh[inputMode]?'':(values[inputMode]||'');fresh[inputMode]=false;if(v==='0')v=n;else v+=n;values[inputMode]=v.replace(/^0+(?=\d)/,'');draw()});
     $('#modalRoot [data-keypad-delete]').onclick=()=>{if(fresh[inputMode]){values[inputMode]='';fresh[inputMode]=false}else values[inputMode]=(values[inputMode]||'').slice(0,-1);draw()};
     $("#modalSave").onclick=()=>{
       pushUndo();
       if(inputMode==='total'){
         state.totalGames=Math.max(0,Number(values.total)||0);
         state.currentGames=Math.max(0,state.totalGames-(state.gameBase||0));
         toast("総ゲーム数を更新しました");
       }else{
         const current=Math.max(0,Number(values.current)||0);
         if(current>state.totalGames){
           state.totalGames=current;
           state.gameBase=0;
         }else{
           state.gameBase=state.totalGames-current;
         }
         state.currentGames=current;
         toast("現在ゲーム数を更新しました");
       }
       saveState();closeModal();render();
     };return}
   if(b.dataset.action==='bell-plus'){pushUndo();state.bell.count++;saveState();render();return}
   if(b.dataset.action==='bell-minus'){pushUndo();state.bell.count=Math.max(0,state.bell.count-1);saveState();render();return}
   if(b.dataset.action==='cz-win'){openCz(b.dataset.cz);return}
   if(b.dataset.action==='period-cz'){openPeriodCZ();return}
   if(b.dataset.item){pushUndo();state.items[b.dataset.item]=(state.items[b.dataset.item]||0)+1;state.itemOrder.push({item:b.dataset.item,date:new Date().toLocaleString('ja-JP')});saveState();render();return}
   if(b.dataset.action==='rinne'){openRinne();return}
   if(b.dataset.action==='sea-char'){openSeaChoice('char');return}
   if(b.dataset.action==='sea-stage'){openSeaChoice('stage');return}
   // LIFE buttons inside the CZ modal have their own handler. Handling them here too caused duplicate input in v16.
   if(b.dataset.choice){pushUndo();state[b.dataset.choice][b.dataset.value]++;saveState();render();return}
   if(b.dataset.action==='history'){openHistory();return}
   if(b.dataset.action==='open-settings'){openSettings();return}
   if(b.dataset.action==='reset'){
     if(confirm('現在の実戦データを「今までの記録」に保存してからリセットしますか？')){
       pushUndo();
       const result=archiveAndResetSession();
       render();
       if(!result.ok)toast('保存に失敗したためリセットを中止しました');
       else {renderPastRecords();toast('その日の履歴を保存してリセットしました')}
     }
     return;
   }
 }catch(err){console.error('operation failed',err)}
});
document.addEventListener("change",e=>{
  const sel=e.target.closest?.("[data-record-manual-setting]");if(!sel)return;
  const id=sel.dataset.recordManualSetting;
  if(updatePastRecordManualSetting(id,sel.value)){
    renderPastRecords();toast(sel.value?`自分の推測を設定${sel.value}で保存しました`:'自分の推測を未入力に戻しました');
  }else toast('自分の推測設定の保存に失敗しました');
});
// v44: iPhone/PWA用。アプリ本体をオフライン利用できるようService Workerを登録。
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js?v=45').catch(err => console.warn('service worker registration failed', err));
  });
}
render();
loadStoredImages().then(images=>{state.ui.images=images||{};saveState();render()}).catch(err=>console.warn("image init failed",err));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
