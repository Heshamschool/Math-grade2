/* ============================================================
   محرّك أسئلة رياضيات الصف الثاني — مشترك بين صفحة التمارين ولعبة الفرق
   يولّد أسئلة عشوائية مختلفة في كل مرة حسب نوع موضوع الدرس
   ============================================================ */

const MathEngine = (function(){

  function randInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

  function toArabicDigits(n){
    const map = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    return String(n).split('').map(ch => /\d/.test(ch) ? map[ch] : ch).join('');
  }

  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  // ---------- topic detection from a lesson title ----------
  function detectTopic(title){
    if(!title) return 'addition';
    if(/نمط/.test(title)) return 'pattern';
    if(/مقارنة|ترتيب/.test(title)) return 'compare';
    if(/طرح/.test(title)) return 'subtraction';
    if(/جمع/.test(title)) return 'addition';
    if(/الآحاد|العشرات|القيمة المنزلية|قراءة الأعداد|تقدير/.test(title)) return 'placevalue';
    return 'addition';
  }

  const TOPIC_META = {
    pattern:     { label:'الأنماط',            icon:'🧩', prompt:'أكمل النمط — ما العدد التالي؟' },
    compare:     { label:'مقارنة الأعداد',      icon:'⚖️', prompt:'قارن العددين — أي إشارة تناسب؟' },
    addition:    { label:'الجمع',               icon:'➕', prompt:'أكمل الجملة العددية' },
    subtraction: { label:'الطرح',               icon:'➖', prompt:'أكمل الجملة العددية' },
    placevalue:  { label:'الآحاد والعشرات',     icon:'🔢', prompt:'أجب عن السؤال' },
  };

  // ---------- individual generators ----------
  function genPattern(){
    const steps = [1,2,3,5,10];
    const step = steps[randInt(0, steps.length-1)];
    const decreasing = Math.random() < 0.4;
    let seq;
    if(decreasing){
      const start = randInt(step*4, 30);
      seq = [start, start-step, start-step*2, start-step*3];
    } else {
      const start = randInt(1, 12);
      seq = [start, start+step, start+step*2, start+step*3];
    }
    const answer = seq[3];
    const parts = [
      {t:'n', v:seq[0]}, {t:'s', v:'،'},
      {t:'n', v:seq[1]}, {t:'s', v:'،'},
      {t:'n', v:seq[2]}, {t:'s', v:'،'},
      {t:'b'}
    ];
    const off1 = decreasing ? answer + step : answer - step;
    const off2 = decreasing ? answer - step : answer + step;
    const distractors = new Set();
    [off1, off2, answer + (decreasing?-2:2)].forEach(v=>{ if(v>=0 && v!==answer) distractors.add(v); });
    let options = [answer, ...Array.from(distractors)].slice(0,3);
    while(options.length < 3){
      const v = Math.max(0, answer + randInt(-4,4));
      if(v !== answer && !options.includes(v)) options.push(v);
    }
    return { parts, answer, options:shuffle(options), optionType:'number', prompt:TOPIC_META.pattern.prompt };
  }

  function genCompare(){
    let a = randInt(2,99), b = randInt(2,99);
    if(Math.random() < 0.2) b = a;
    const answer = a>b ? 'gt' : (a<b ? 'lt' : 'eq');
    const parts = [ {t:'n', v:a}, {t:'b'}, {t:'n', v:b} ];
    return { parts, answer, options:shuffle(['gt','eq','lt']), optionType:'symbol', prompt:TOPIC_META.compare.prompt };
  }

  function genAddition(range){
    let a,b;
    if(range === 'twoDigit'){
      a = randInt(10,79); b = randInt(10, Math.min(89, 98-a));
    } else {
      a = randInt(1,9); b = randInt(1,9);
    }
    const answer = a+b;
    const parts = [ {t:'n', v:a}, {t:'s', v:'+'}, {t:'n', v:b}, {t:'s', v:'='}, {t:'b'} ];
    const distractors = new Set([answer+1, answer-1, answer+2].filter(v=>v>=0 && v!==answer));
    let options = [answer, ...Array.from(distractors)].slice(0,3);
    while(options.length<3){
      const v = Math.max(0, answer + randInt(-3,3));
      if(v!==answer && !options.includes(v)) options.push(v);
    }
    return { parts, answer, options:shuffle(options), optionType:'number', prompt:TOPIC_META.addition.prompt };
  }

  function genSubtraction(range){
    let a,b;
    if(range === 'twoDigit'){
      a = randInt(20,99); b = randInt(10, a-1);
    } else {
      a = randInt(2,18); b = randInt(1, a);
    }
    const answer = a-b;
    const parts = [ {t:'n', v:a}, {t:'s', v:'−'}, {t:'n', v:b}, {t:'s', v:'='}, {t:'b'} ];
    const distractors = new Set([answer+1, answer-1, answer+2].filter(v=>v>=0 && v!==answer));
    let options = [answer, ...Array.from(distractors)].slice(0,3);
    while(options.length<3){
      const v = Math.max(0, answer + randInt(-3,3));
      if(v!==answer && !options.includes(v)) options.push(v);
    }
    return { parts, answer, options:shuffle(options), optionType:'number', prompt:TOPIC_META.subtraction.prompt };
  }

  function genPlaceValue(){
    const number = randInt(11,99);
    const tens = Math.floor(number/10), ones = number%10;
    const askTens = Math.random() < 0.5;
    const answer = askTens ? tens : ones;
    const parts = [ {t:'n', v:number} ];
    const prompt = askTens ? 'كم عدد العَشَرات في العدد؟' : 'كم عدد الآحاد في العدد؟';
    const distractors = new Set([answer+1, answer-1, askTens?ones:tens].filter(v=>v>=0 && v<=9 && v!==answer));
    let options = [answer, ...Array.from(distractors)].slice(0,3);
    while(options.length<3){
      const v = Math.max(0, Math.min(9, answer + randInt(-2,2)));
      if(v!==answer && !options.includes(v)) options.push(v);
    }
    return { parts, answer, options:shuffle(options), optionType:'number', prompt };
  }

  function generate(topic, opts){
    opts = opts || {};
    switch(topic){
      case 'pattern': return genPattern();
      case 'compare': return genCompare();
      case 'subtraction': return genSubtraction(opts.range);
      case 'placevalue': return genPlaceValue();
      case 'addition':
      default: return genAddition(opts.range);
    }
  }

  function symbolFor(code){ return code==='gt' ? '>' : (code==='lt' ? '<' : '='); }

  return { randInt, toArabicDigits, shuffle, detectTopic, TOPIC_META, generate, symbolFor };
})();
