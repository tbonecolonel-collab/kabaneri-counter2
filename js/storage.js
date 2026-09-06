const STORAGE_KEY="kabaneri-counter-v31";
const RECORDS_KEY="kabaneri-counter-past-records-v39";
const LEGACY_RECORD_KEYS=["kabaneri-counter-past-records-v30","kabaneri-counter-past-records-v29","kabaneri-counter-past-records-v5","kabaneri-counter-past-records-v4","kabaneri-counter-past-records-v3","kabaneri-counter-past-records-v2","kabaneri-counter-past-records-v1"];
const LEGACY_KEYS=["kabaneri-counter-v30","kabaneri-counter-v29","kabaneri-counter-v28","kabaneri-counter-v27","kabaneri-counter-v26","kabaneri-counter-v25","kabaneri-counter-v24","kabaneri-counter-v23","kabaneri-counter-v22","kabaneri-counter-v21","kabaneri-counter-v20","kabaneri-counter-v19","kabaneri-counter-v18","kabaneri-counter-v17","kabaneri-counter-v16","kabaneri-counter-v15","kabaneri-counter-v14","kabaneri-counter-v13","kabaneri-counter-v12","kabaneri-counter-v11","kabaneri-counter-v10"];
const IMAGE_DB_NAME="kabaneri-counter-image-db";
const IMAGE_STORE="images";
const defaultState={
  totalGames:0,currentGames:0,gameBase:0,bell:{count:0},
  chance:{無名:{none:0,flash:0,high:0,combo:0},生駒:{none:0,flash:0,high:0,combo:0},カバネ:{none:0,high:0,ceiling:0}},
  cz:{無名:{win:0,success:0},生駒:{win:0,success:0}},czHistory:[],chancePts:{無名:0,生駒:0,カバネ:0},chanceMax:{カバネ:false},
  bonuses:{駿城:{count:0,games:[]},EP:{count:0,games:[]}},
  shunChance:{p1000:0,p3000:0},
  cycles:{1:{bonus:0,total:0},2:{bonus:0,total:0},3:{bonus:0,total:0},4:{bonus:0,total:0},5:{bonus:0,total:0},6:{bonus:0,total:0}},
  cycleBonuses:{1:{駿城:0,EP:0},2:{駿城:0,EP:0},3:{駿城:0,EP:0},4:{駿城:0,EP:0},5:{駿城:0,EP:0},6:{駿城:0,EP:0}},
  items:{},itemOrder:[],sea:{cycle:1,char:{},stage:{},rinne:[],cycles:{}},
  ikoma:{attack:0,avoid:0},
  voice:{男性:0,女性:0,景之弱:0,景之中:0,景之強:0,無し:0,特殊:0},intro:{男性:0,女性:0,美馬:0},
  trophy:{銅:0,銀:0,金:0,キリン:0,虹:0},end:{甲鉄城メンバー:0,水着:0},seaHistory:[],history:[],lastBonusTotalGames:0,
  pastRecords:[],sessionStartedAt:new Date().toISOString(),
  ui:{theme:"dark",compact:false,background:"steel-dark",borderColor:"#303640",accent:"#b44b34",images:{}}
};
function clone(o){return JSON.parse(JSON.stringify(o))}
function mergeState(base,saved){if(!saved)return base;const out=clone(base);const merge=(a,b)=>{for(const k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==="object"&&!Array.isArray(a[k]))merge(a[k],b[k]);else a[k]=b[k]};return a};return merge(out,saved)}
function compactRecordData(d){
  d=d||{};
  // 「履歴」と同じ内容に加え、保存時の推定設定を再計算できる集計値も保持する。
  const keys=["totalGames","currentGames","gameBase","bell","chance","cz","czHistory","chancePts","chanceMax","bonuses","shunChance","cycles","cycleBonuses","items","itemOrder","sea","ikoma","voice","intro","trophy","end","seaHistory","history","lastBonusTotalGames"];
  const out={}; for(const k of keys) out[k]=clone(d[k] ?? defaultState[k]);
  return out;
}
function normalizePastRecord(rec){
  if(!rec||typeof rec!=="object")return null;
  return {
    id:rec.id||`${rec.savedAt||Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    dateKey:rec.dateKey||"日付不明",
    savedAt:rec.savedAt||new Date().toISOString(),
    startedAt:rec.startedAt||null,
    prediction:rec.prediction||null,
    manualSetting:[1,2,3,4,5,6].includes(Number(rec.manualSetting))?Number(rec.manualSetting):null,
    note:typeof rec.note==="string"?rec.note:"",
    data:compactRecordData(rec.data||{})
  };
}
function loadPastRecords(){
  // v39: ユーザー指定により、これまでの「今までの記録」は削除して空から開始する。
  // 現在の実戦データや画像設定には影響しない。過去記録専用キーだけを削除する。
  try{
    const old=[];
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith("kabaneri-counter-past-records-")&&k!==RECORDS_KEY)old.push(k)}
    old.forEach(k=>localStorage.removeItem(k));
  }catch(err){console.warn("old records cleanup failed",err)}
  const found=[];
  try{
    const arr=JSON.parse(localStorage.getItem(RECORDS_KEY)||"[]");
    for(const raw of (Array.isArray(arr)?arr:[])){const rec=normalizePastRecord(raw);if(rec)found.push(rec)}
  }catch(err){console.warn("records load failed",err)}
  found.sort((a,b)=>String(b.savedAt||"").localeCompare(String(a.savedAt||"")));
  return found;
}
function persistPastRecords(records){
  const compact=(records||[]).map(normalizePastRecord).filter(Boolean);
  try{localStorage.setItem(RECORDS_KEY,JSON.stringify(compact));return true}
  catch(err){console.error("past records save failed",err);return false}
}
function loadState(){
  let loaded=null;
  try{
    const cur=localStorage.getItem(STORAGE_KEY);
    if(cur)loaded=mergeState(defaultState,JSON.parse(cur));
    if(!loaded){for(const key of LEGACY_KEYS){const old=localStorage.getItem(key);if(old){loaded=mergeState(defaultState,JSON.parse(old));break}}}
  }catch(err){console.warn("state load failed",err)}
  const out=loaded||clone(defaultState);
  if(out.sea&&!out.sea.cycles)out.sea.cycles={};
  out.chanceMax=out.chanceMax||{カバネ:false};
  out.shunChance={p1000:Number(out.shunChance?.p1000)||0,p3000:Number(out.shunChance?.p3000)||0};
  out.chance=out.chance||clone(defaultState.chance);out.chance.カバネ=out.chance.カバネ||{};
  if(out.chance.カバネ.ceiling==null)out.chance.カバネ.ceiling=0;
  if(out.ikoma && (out.ikoma[1]||out.ikoma[2]||out.ikoma[3])){let attack=Number(out.ikoma.attack)||0,avoid=Number(out.ikoma.avoid)||0;for(const l of [1,2,3]){attack+=Number(out.ikoma[l]?.attack)||0;avoid+=Number(out.ikoma[l]?.avoid)||0}out.ikoma={attack,avoid};}
  else out.ikoma={attack:Number(out.ikoma?.attack)||0,avoid:Number(out.ikoma?.avoid)||0};
  out.pastRecords=loadPastRecords();
  return out;
}
let state=loadState();
function serializableState(){const out=clone(state);if(out.ui)out.ui.images={};out.pastRecords=[];return out}
function saveState(){const payload=JSON.stringify(serializableState());try{localStorage.setItem(STORAGE_KEY,payload);return true}catch(err){console.error("state save failed",err);return false}}
function activeDataSnapshot(){
  return compactRecordData(state);
}
function hasSessionData(s=state){return Number(s.totalGames)>0||Number(s.bell?.count)>0||Object.values(s.chance||{}).some(x=>Object.values(x||{}).some(Number))||(s.czHistory||[]).length||(s.itemOrder||[]).length||(s.seaHistory||[]).length||Object.values(s.voice||{}).some(Number)||Object.values(s.intro||{}).some(Number)||Object.values(s.trophy||{}).some(Number)||Object.values(s.end||{}).some(Number)}
function archiveCurrentSession(){
  const now=new Date();
  const rec={
    id:`${now.getTime()}-${Math.random().toString(36).slice(2,7)}`,
    dateKey:`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`,
    savedAt:now.toISOString(),startedAt:state.sessionStartedAt||null,
    manualSetting:null,
    prediction:(typeof finalSetting==="function"?(()=>{try{const f=finalSetting();return f?.tops?.length?f.tops.map(x=>`設定${x}`).join(" or "):"データ不足"}catch{return "データ不足"}})():"データ不足"),
    note:"",data:activeDataSnapshot()
  };
  const records=[rec,...loadPastRecords()];
  if(!persistPastRecords(records))return null;
  state.pastRecords=records;return rec;
}
function resetSessionPreservingRecords(){
  const records=loadPastRecords();
  const ui=clone(state.ui||defaultState.ui);
  state=clone(defaultState);state.pastRecords=records;state.ui=ui;state.sessionStartedAt=new Date().toISOString();
  return saveState();
}
function archiveAndResetSession(){
  const before=clone(state);const rec=archiveCurrentSession();
  if(!rec){state=before;return {archived:false,ok:false,record:null}}
  if(!resetSessionPreservingRecords()){state=before;state.pastRecords=loadPastRecords();return {archived:true,ok:false,record:rec}}
  state.pastRecords=loadPastRecords();return {archived:true,ok:true,record:rec};
}
function resetState(){return resetSessionPreservingRecords()}
function deletePastRecord(id){
  const records=loadPastRecords().filter(x=>x.id!==String(id));
  const ok=persistPastRecords(records);state.pastRecords=records;saveState();return ok;
}
function updatePastRecordNote(id,note){
  const records=loadPastRecords();const rec=records.find(x=>x.id===String(id));if(!rec)return false;
  rec.note=String(note??"");const ok=persistPastRecords(records);if(ok)state.pastRecords=records;return ok;
}
function updatePastRecordManualSetting(id,value){
  const records=loadPastRecords();const rec=records.find(x=>x.id===String(id));if(!rec)return false;
  const n=Number(value);rec.manualSetting=[1,2,3,4,5,6].includes(n)?n:null;
  const ok=persistPastRecords(records);if(ok)state.pastRecords=records;return ok;
}


function openImageDB(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return resolve(null);const req=indexedDB.open(IMAGE_DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(IMAGE_STORE))db.createObjectStore(IMAGE_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function loadStoredImages(){try{const legacy={...(state.ui?.images||{})};const db=await openImageDB();if(!db)return legacy;const stored=await new Promise((resolve,reject)=>{const tx=db.transaction(IMAGE_STORE,'readonly');const store=tx.objectStore(IMAGE_STORE);const req=store.getAllKeys();req.onsuccess=()=>{const keys=req.result||[];if(!keys.length)return resolve({});const out={};let left=keys.length;keys.forEach(k=>{const r=store.get(k);r.onsuccess=()=>{out[k]=r.result;if(--left===0)resolve(out)};r.onerror=()=>{if(--left===0)resolve(out)}})};req.onerror=()=>reject(req.error)});if(Object.keys(legacy).length){for(const [k,v] of Object.entries(legacy)){if(v&&!stored[k])await setStoredImage(k,v)}}return {...legacy,...stored}}catch(err){console.warn('image load failed',err);return state.ui?.images||{}}}
async function setStoredImage(key,value){const db=await openImageDB();if(!db)return false;return new Promise((resolve,reject)=>{const tx=db.transaction(IMAGE_STORE,'readwrite');tx.objectStore(IMAGE_STORE).put(value,key);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})}
async function clearStoredImages(){try{const db=await openImageDB();if(!db)return;await new Promise((resolve,reject)=>{const tx=db.transaction(IMAGE_STORE,'readwrite');tx.objectStore(IMAGE_STORE).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}catch(err){console.warn('image clear failed',err)}}
