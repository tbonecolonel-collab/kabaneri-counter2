const CHANCE_TYPES=["無発光","発光","発光中","高確率"];
const POINTS={none:1,flash:15,high:1,combo:15};
const ITEMS=["ツラヌキ筒","無名の短銃","自決袋","来栖の刀","無名のけん玉","菖蒲の弓","ミヤマカラスアゲハ","小吉","中吉","大吉"];
const VOICES=["男性","女性","景之弱","景之中","景之強","無し","特殊"];
const INTROS=["男性","女性","美馬"];
const TROPHIES=["銅","銀","金","キリン","虹"];
const ENDS=["甲鉄城メンバー","水着"];
const BELL_DEN={1:121.1,2:114.4,3:112.8,4:106.2,5:104.2,6:99.1};
const CYCLE_PROB={
  3:{1:.184,2:.211,3:.238,4:.285,5:.324,6:.371},
  4:{1:.336,2:.352,3:.363,4:.402,5:.434,6:.469}
};
const RESULT_IMAGES={失敗:"assets/buttons/result-fail.svg",駿城:"assets/fixed/result_shun.jpg",EP:"assets/fixed/result_ep.jpg",襲撃:"assets/buttons/attack.svg",回避:"assets/buttons/avoid.svg"};
const IMAGE_KEYS={
  無名:"assets/mumei.png",生駒:"assets/ikoma.png",カバネ:"assets/kabane.png",
  ツラヌキ筒:"assets/fixed/item_tsuranuiki.jpg",無名の短銃:"assets/fixed/item_mumei_gun.jpg",自決袋:"assets/fixed/item_jiketsu.jpg",
  来栖の刀:"assets/fixed/item_kurusu_sword.jpg",無名のけん玉:"assets/fixed/item_mumei_kendama.jpg",菖蒲の弓:"assets/fixed/item_ayame_bow.jpg",
  ミヤマカラスアゲハ:"assets/fixed/item_butterfly.jpg",小吉:"assets/fixed/item_shokichi.jpg",中吉:"assets/fixed/item_chukichi.jpg",大吉:"assets/fixed/item_daikichi.jpg"
};

const SEA_BUTTON_IMAGES={
  "sea-char:侑那":"assets/fixed/sea_yukina.jpg",
  "sea-char:鰍":"assets/fixed/sea_kajika.jpg",
  "sea-char:菖蒲":"assets/fixed/sea_ayame.jpg",
  "sea-char:無名":"assets/fixed/sea_mumei.jpg",
  "sea-char:無名②":"assets/fixed/sea_lie_mumei.jpg",
  "sea-char:無名③":"assets/fixed/sea_sakura_mumei.jpg",
  "sea-stage:操車場":"assets/fixed/stage_yard.jpg",
  "sea-stage:甲鉄城":"assets/fixed/stage_kotetsujo.jpg",
  "sea-stage:第六区画線路沿い":"assets/fixed/stage_line6.jpg"
};
const BONUS_IMAGE_KEYS={...SEA_BUTTON_IMAGES,
  "voice:男性":"assets/fixed/voice_male.jpg","voice:女性":"assets/fixed/voice_female.jpg","voice:景之弱":"assets/fixed/voice_kage_weak.jpg","voice:景之中":"assets/fixed/voice_kage_mid.jpg","voice:景之強":"assets/fixed/voice_kage_strong.jpg","voice:無し":"assets/fixed/voice_none.jpg","voice:特殊":"assets/fixed/voice_special.jpg",
  "intro:男性":"assets/fixed/intro_male.jpg","intro:女性":"assets/fixed/intro_female.jpg","intro:美馬":"assets/fixed/intro_biba.jpg",
  "trophy:銅":"assets/fixed/trophy_bronze.jpg","trophy:銀":"assets/fixed/trophy_silver.jpg","trophy:金":"assets/fixed/trophy_gold.jpg","trophy:キリン":"assets/fixed/trophy_kirin.jpg","trophy:虹":"assets/fixed/trophy_rainbow.jpg",
  "end:甲鉄城メンバー":"assets/fixed/end_members.jpg","end:水着":"assets/fixed/end_swimsuit.jpg",
  ...Object.fromEntries(Object.keys(RESULT_IMAGES).map(x=>["result:"+x,RESULT_IMAGES[x]]))};
