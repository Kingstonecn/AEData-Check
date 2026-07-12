/* ===================================================================
   AE数据检查 — app.js v2.0
   纯前端、本地处理。保留公式，分组展示、批量处理、导出新簿+CSV。
   =================================================================== */
'use strict';
let COLS=[
{L:'A',type:'skip'},{L:'B',type:'skip'},{L:'C',type:'skip'},{L:'D',type:'shift'},{L:'E',type:'text'},
{L:'F',type:'line'},{L:'G',type:'status'},{L:'H',type:'product'},{L:'I',type:'asset'},
{L:'J',type:'num'},{L:'K',type:'num'},{L:'L',type:'num'},{L:'M',type:'num'},{L:'N',type:'time'},{L:'O',type:'time'},
{L:'P',type:'formula',noEdit:true},{L:'Q',type:'text'},{L:'R',type:'text'},{L:'S',type:'text'},{L:'T',type:'text'},
{L:'U',type:'oae',noEdit:true},{L:'V',type:'num'},{L:'W',type:'num'},{L:'X',type:'num'},{L:'Y',type:'formula',noEdit:true},
{L:'Z',type:'formula',noEdit:true},{L:'AA',type:'individual'},{L:'AB',type:'residual'}];
const SHIFT_ENUM=['早班','白班','夜班','中班'];const STATUS_ENUM=['生产','停机'];const LINE_PATTERN=/^\d+#$/;
let SYNONYMS={status:{'开机':'生产','运行':'生产','计划':'停机','停/':'停机'},shift:{'日班':'白班','晚班':'夜班'}};
const FW=String.fromCharCode(0x3000);
const dirty=s=>/\s/.test(s)||s.includes(FW);
const clean=s=>s.replace(/[\s　]+/g,' ').replace(/^[\s　]+|[\s　]+$/g,'');
const vis=(s)=>String(s==null?'':s).replace(/ /g,'␣').replace(/　/g,'␣');
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function esc(v){if(v==null)return'␣';if(typeof v=='string')return v;if(v instanceof Date)return v.toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});return String(v)}
function escAA(v){return v==null||v===''?'␣':String(v)}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2200)}
function serialToDate(n){const wd=Math.floor(n),frac=n-wd;return new Date(1899,11,30+(n<60?wd:wd-1),0,0,0,Math.round(frac*86400000))}
const S={wb:null,ws:null,fileName:'资产数据(GAP).xlsx',srcExt:'xlsx',dataStart:3,maxRow:0,catMap:{},origBuf:null,
  dict:{product:new Set(),asset:new Map(),individual:new Set(),mergedF:new Set(),mergedA:new Set(),mergedMap:{}},
  shiftHours:new Map(),issues:[],curCol:null,filterYear:null,filterMonth:null};
function groupKey(i){if(i.demo)return i.col+'\x00'+i.type+'\x00*';return i.col+'\x00'+i.type+'\x00'+(i.suggest==null?'∅':String(i.suggest).slice(0,60))}
function initLoad(){const dz=$('#dropzone'),fi=$('#fileInput');
  $('#pickBtn').addEventListener('click',e=>{e.stopPropagation();fi.click()});dz.addEventListener('click',()=>fi.click());
  fi.addEventListener('change',()=>{if(fi.files[0])handleFile(fi.files[0])});
  ['dragover','dragenter'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('drag')}));
  ['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('drag')}));
  dz.addEventListener('drop',e=>{if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0])});
  $('#todayStamp').textContent=new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'})}
async function handleFile(file){try{const buf=await file.arrayBuffer();S.origBuf=buf.slice(0);toast('正在解析…');const wb=XLSX.read(buf,{type:'array',cellFormula:true,cellNF:true});
  if(!wb.SheetNames.includes('AE Data')){toast('未找到 AE Data 工作表');return}
  S.wb=wb;S.ws=wb.Sheets['AE Data'];S.fileName=file.name;S.srcExt=/\.xlsm?$/i.test(file.name)?'xlsm':(/\.xlsx$/i.test(file.name)?'xlsx':'xls');
  readHeaders();buildDicts();detectShiftHours();detectMergedCells();S.issues=scanAll();showReview();toast('已载入：共 '+S.issues.length+' 处疑误')
}catch(err){console.error(err);toast('载入失败：'+err.message)}}
function readHeaders(){const ws=S.ws;const r1=[],r2=[];
  for(let i=0;i<28;i++){r1[i]=ws[XLSX.utils.encode_cell({r:0,c:i})]?.v;r2[i]=ws[XLSX.utils.encode_cell({r:1,c:i})]?.v}
  const known=new Set(['Workshop','Month','Date','Shift','Shift leader','Line','Status','Product','Asset','Throughput','Actual','Unfinished Volume','Loss Volume','Start','End','Loss Time','Reason','OAE','SL','UL','BO','Main Category','Sub Category','Individual Category']);
  let enRow=0,cnRow=1;for(let i=0;i<28;i++){if(r1[i]&&known.has(String(r1[i]).trim())){enRow=0;cnRow=1;break}if(r2[i]&&known.has(String(r2[i]).trim())){enRow=1;cnRow=0;break}}
  const en=enRow===0?r1:r2,cn=enRow===0?r2:r1;const fb={'A':'车间','B':'月份','C':'日期','P':'损失时间','U':'OAE','Y':'主AE分类','Z':'次AE分类','R':'分类','S':'故障设备','T':'故障组件','AB':'(空残留)'};
  COLS.forEach((col,i)=>{if(!col.cn){col.cn=cn[i]||fb[col.L]||col.L;col.en=en[i]||col.L}if(col.L==='U')col.cn='OAE';if(col.L==='AB')col.cn='(空残留)'})}
function buildDicts(){const wb=S.wb,d=S.dict;
  if(wb.SheetNames.includes('Product')){d.product=new Set();XLSX.utils.sheet_to_json(wb.Sheets['Product'],{header:1,raw:1}).forEach((r,i)=>{if(i&&r[0])d.product.add(String(r[0]).trim())})}
  if(wb.SheetNames.includes('Asset')){d.asset=new Map();XLSX.utils.sheet_to_json(wb.Sheets['Asset'],{header:1,raw:1}).forEach((r,i)=>{const c=r[1]?String(r[1]).trim():null,sh=r[0]?String(r[0]).trim():null;if(c&&sh)d.asset.set(sh+'|'+c,1);else if(c)d.asset.set(c,1)})}
  if(wb.SheetNames.includes('Category')){d.individual=new Set();S.catMap={};
    XLSX.utils.sheet_to_json(wb.Sheets['Category'],{header:1,raw:1}).forEach((r,i)=>{if(!i)return;const ind=r[3]?String(r[3]).trim():null;if(ind){d.individual.add(ind);S.catMap[ind]={main:r[4]?String(r[4]).trim():'',sub:r[5]?String(r[5]).trim():''}}})}}
function detectShiftHours(){const ws=S.ws,max=getMaxRow();S.maxRow=max;const ghm=new Map();
  for(let r=S.dataStart;r<=max;r++){const l=r2s(ws,'F',r),s=r2s(ws,'D',r),d=r2s(ws,'C',r);if(l&&s&&s.includes('中班'))ghm.set(d+'|'+l,1)}
  for(let r=S.dataStart;r<=max;r++){const l=r2s(ws,'F',r),d=r2s(ws,'C',r);S.shiftHours.set(r,ghm.get(d+'|'+l)?8:12)}}
function detectMergedCells(){const ws=S.ws;S.dict.mergedF=new Set();S.dict.mergedA=new Set();S.dict.mergedMap={};if(!ws['!merges'])return;ws['!merges'].forEach(mr=>{if(mr.s.c===mr.e.c){const col=XLSX.utils.encode_col(mr.s.c);if(!S.dict.mergedMap[col])S.dict.mergedMap[col]={};for(let r=mr.s.r;r<=mr.e.r;r++){const row=r+1;S.dict.mergedMap[col][row]=mr.s.r+1;if(col==='F')S.dict.mergedF.add(row);if(col==='A')S.dict.mergedA.add(row)}}})}
function getMergedVal(ws,col,row){const v=r2s(ws,col,row);if(v!=null&&v!=='')return v;const mm=S.dict.mergedMap[col];if(mm&&mm[row]){return r2s(ws,col,mm[row])}return v}
function getMaxRow(){const ref=S.ws['!ref'];if(!ref)return 0;const m=ref.match(/A\d+:(\w+?)(\d+)/);return m?parseInt(m[2]):0}
function r2s(ws,col,row){const c=ws[col+row];if(!c)return null;return c.v==null?null:String(c.v)}
function r2v(ws,col,row){const c=ws[col+row];return c?c.v:null}
function r2n(ws,col,row){const v=r2v(ws,col,row);if(v==null)return 0;if(typeof v==='number')return v;const n=Number(v);return isNaN(n)?0:n}
/* 日期有效性检查 */
function isValidDate(v){
  if(v==null||v==='')return false;
  if(v instanceof Date)return !isNaN(v.getTime());
  if(typeof v==='number'){const d=serialToDate(v);return d instanceof Date&&!isNaN(d.getTime())&&d.getFullYear()>2000;}
  if(typeof v==='string'){
    const t=v.trim();
    const fmts=[/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/];
    for(const f of fmts){const m=t.match(f);if(m){const y=m[3].length<=2?'20'+m[3]:m[3],mo=m[1],d=m[2];const dt=new Date(y,mo-1,d);if(!isNaN(dt.getTime()))return true}}
    return !!Date.parse(t);
  }
  return false;
}
/* 从日期值提取 "yy年mm月" */
function fmtMonthFromDate(v){
  if(v==null)return null;
  let d=null;
  if(v instanceof Date)d=v;
  else if(typeof v==='number')d=serialToDate(v);
  else if(typeof v==='string'){
    const t=v.trim();
    const m=t.match(/^(\d{4})[-/](\d{1,2})[-/]\d{1,2}$/);
    if(m)return m[1].slice(2)+'年'+m[2].padStart(2,'0')+'月';
    const m2=t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if(m2){const yy=m2[3].length<=2?m2[3]:m2[3].slice(2);return yy+'年'+m2[1].padStart(2,'0')+'月';}
    d=new Date(t);
  }
  if(d&&!isNaN(d.getTime()))return String(d.getFullYear()).slice(2)+'年'+String(d.getMonth()+1).padStart(2,'0')+'月';
  return null;
}
/* 从 "yy年mm月" 文字转为当月1号的 Excel 日期序列号 */
function monthLabelToSerial(s){
  const m=s.match(/^(\d{2})年(\d{2})月$/);
  if(!m)return null;
  const y=2000+parseInt(m[1]),mo=parseInt(m[2]);
  return 25569+Math.floor(Date.UTC(y,mo-1,1)/86400000);
}
function isMergedF(r){return S.dict.mergedF.has(r)}
/* 扫描 */
function scanAll(){const ws=S.ws,max=S.maxRow,issues=[];let id=0;
  const push=(r,c,t,reason,cur,sug)=>{issues.push({id:++id,row:r,col:c,type:t,reason,current:(cur==null||cur===''?'␣':String(cur)),suggest:sug==null?'␣':String(sug),value:sug==null?'␣':String(sug),resolved:null,manualVal:null,demo:true})};
  const push1=(r,c,t,reason,cur,sug)=>{issues.push({id:++id,row:r,col:c,type:t,reason,current:(cur==null||cur===''?'␣':String(cur)),suggest:sug==null?'␣':String(sug),value:sug==null?'␣':String(sug),resolved:null,manualVal:null,demo:false})};
  for(let r=S.dataStart;r<=max;r++){
    const dv=r2v(ws,'D',r);
    if(dv==null||dv==='')push(r,'D','missing','班次为空','-','-');
    else{const s=String(dv);if(SYNONYMS.shift[s])push(r,'D','synonym','同义词«'+vis(s.trim())+'»→',s,SYNONYMS.shift[s]);else if(!SHIFT_ENUM.includes(s))push(r,'D','unknown','不在词库['+SHIFT_ENUM.join('/')+']',s,'-')}
    const ev=r2v(ws,'E',r);if(ev&&typeof ev==='string'&&dirty(ev))push(r,'E','dirty','含空白字符',vis(ev),vis(clean(ev)));
    const fv=r2v(ws,'F',r);
    if(fv==null||fv===''){if(!isMergedF(r))push(r,'F','missing','产线为空（可忽略）','-','-')}else{const s=String(fv);if(dirty(s))push1(r,'F','dirty','含空格',vis(s),vis(clean(s)));else if(!LINE_PATTERN.test(s))push(r,'F','unknown','格式异常',s,'-')}
    const gv=r2v(ws,'G',r);
    if(gv==null||gv==='')push(r,'G','missing','状态为空','-','-');else{const s=String(gv);if(dirty(s))push(r,'G','dirty','含空白字符',vis(s),vis(clean(s)));else if(STATUS_ENUM.includes(s)){}else{const syn=SYNONYMS.status[s];if(syn)push(r,'G','synonym','同义词«'+vis(s)+'»→',s,syn,{demo:true});else push(r,'G','unknown','可加入词库',s,'-')}}
    const hv=r2v(ws,'H',r);
    if(hv==null||hv===''||(typeof hv==='string'&&/^\s+$/.test(hv)))push(r,'H','missing','产品为空','-','-');else{const s=String(hv);if(dirty(s))push(r,'H','dirty','含空白字符',vis(s),vis(clean(s)));else if(!S.dict.product.has(s)){let hit=0;for(const p of S.dict.product)if(p.toLowerCase()===s.toLowerCase()){hit=1;push(r,'H','case','大小写不符',s,p);break}if(!hit)push(r,'H','unknown','不在Product字典',s,'-')}}
    /* C列日期检查 */
    const cv=r2v(ws,'C',r);
    if(cv==null||cv==='')push(r,'C','missing','日期为空','-','-');
    else if(!isValidDate(cv))push(r,'C','date-invalid','日期格式无效',esc(cv),'-');
    else if(typeof cv==='string'&&dirty(cv))push(r,'C','dirty','含空白字符',vis(cv),vis(clean(cv)));
    /* B列月份检查（参考C列日期） */
    const bv=r2v(ws,'B',r);
    const expectedMonth=isValidDate(cv)?fmtMonthFromDate(cv):null;
    if(bv!=null&&bv!==''){
      const s=String(bv).trim();
      if(/^\d{2}年\d{2}月$/.test(s)){
        if(expectedMonth&&s!==expectedMonth)push(r,'B','month-mismatch','月份与C列日期不符：C列='+esc(cv),s,expectedMonth);
      }else{
        push(r,'B','month-format','月份格式应为「yy年mm月」',s,expectedMonth||'yy年mm月');
      }
      if(typeof bv==='string'&&dirty(bv))push(r,'B','dirty','含空白字符',vis(bv),vis(s));
    }
    /* A列车间检查 */
    const av=r2v(ws,'A',r);
    if(av!=null&&av!==''){
      const s=String(av).trim();
      if(typeof av==='string'&&dirty(av))push(r,'A','dirty','含空白字符',vis(av),vis(s));
      if(!['01火法','02火法','10车间'].includes(s))push(r,'A','workshop','车间不在许可范围内（01火法/02火法/10车间）',s,'-');
    }
    const iv=r2v(ws,'I',r),rs=r2s(ws,'A',r);
    if(iv==null||iv==='')push(r,'I','missing','资产为空','-','-');else{const s=String(iv);if(dirty(s))push(r,'I','dirty','含空格',vis(s),vis(clean(s)));if(!S.dict.asset.has(rs+'|'+s)&&!S.dict.asset.has(s))push1(r,'I','unknown','本车间无此资产',rs+'/'+s,'-')}
    ['J','K','L','M'].forEach(L=>{const nv=r2v(ws,L,r);if(nv!=null&&typeof nv==='string'&&nv.trim()!==''){if(dirty(nv))push1(r,L,'dirty','含空格字符串',vis(nv),vis(clean(nv)));else if(!isNaN(Number(nv)))push1(r,L,'numstr','文本型数字',nv,Number(nv));else push(r,L,'nonnum','非数字',nv,'-')}});
    const nv=r2v(ws,'N',r),ov=r2v(ws,'O',r);
    if(typeof nv==='string'&&/^\s+$/.test(nv))push(r,'N','whitespace','开始时间为空白字符',vis(nv),'');
    if(typeof ov==='string'&&/^\s+$/.test(ov))push(r,'O','whitespace','结束时间为空白字符',vis(ov),'');
    if((nv==null||nv==='')&&(ov!=null&&ov!==''))push(r,'N','timealone','存在结束时间但开始时间为空','␣→'+String(ov),'-')
    if((ov==null||ov==='')&&(nv!=null&&nv!==''))push(r,'O','timealone','存在开始时间但结束时间为空',String(nv)+'→␣','-')
    // 字符串时间：尝试解析为标准格式
    const parseTime=s=>{
      if(!s||typeof s!=='string'||s.trim()==='')return null;
      let t=s.trim();let r=null;
      if(/[;：]/.test(t)){t=t.replace(/[;：]+/g,':').replace(/:+/g,':');r='含异常分隔符，建议修复为「'+t+'」';}
      const fmts=[
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
        /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/,
      ];
      for(const f of fmts){const m=t.match(f);if(m){const y=m[1].length===2?'20'+m[1]:m[1],mo=m[2].padStart(2,'0'),d=m[3].padStart(2,'0'),h=m[4].padStart(2,'0'),mi=m[5],se=m[6]||'00';return {sug:y+'-'+mo+'-'+d+' '+h+':'+mi+':'+se};}}
      if(r)return{sug:t,reason:r};
      return null;
    };
    if(nv&&typeof nv==='string'){
      const p=parseTime(nv);
      if(p)push(r,'N','type','开始时间为字符串'+(p.reason?'（'+p.reason+'）':''),vis(nv),p.sug);
      else push(r,'N','type','开始时间为字符串（无法解析）',vis(nv),'-');
    }
    if(ov&&typeof ov==='string'){
      const p=parseTime(ov);
      if(p)push(r,'O','type','结束时间为字符串'+(p.reason?'（'+p.reason+'）':''),vis(ov),p.sug);
      else push(r,'O','type','结束时间为字符串（无法解析）',vis(ov),'-');
    }
    if(nv instanceof Date&&ov instanceof Date&&ov<nv)push(r,'O','reverse','结束早于开始',String(nv)+'>'+String(ov),'-')
    const pc=ws['P'+r];if(pc&&pc.f){const pf=String(pc.f).replace(/\s/g,'');if(!pf.startsWith('ROUND((O')&&!/O\d+-N\d+/.test(pf))push1(r,'P','formula','公式异常',pc.f,'-')}
    if(typeof r2v(ws,'P',r)==='number'&&r2v(ws,'P',r)<0)push1(r,'P','negtime','值为负',String(r2v(ws,'P',r)),'-')
    ['Q','R','S','T'].forEach(L=>{const tv=r2v(ws,L,r);if(tv!=null&&typeof tv==='string'&&dirty(tv))push(r,L,'dirty','含空白字符',vis(tv),vis(clean(tv)))})
    const uc=ws['U'+r];if(uc&&uc.f){const m=String(uc.f).match(/^=\s*(\d+)\s*-/);if(m){const base=parseInt(m[1]),exp=S.shiftHours.get(r)||12;if(base!==exp)push1(r,'U','oaebase','基数='+base+'与班制('+exp+'h)不符','='+base+'-...','='+exp+'-...')}}
    ['V','W','X'].forEach(L=>{const nv2=r2v(ws,L,r);if(nv2!=null&&typeof nv2==='string'&&nv2.trim()!==''){if(dirty(nv2))push1(r,L,'dirty','含空格',vis(nv2),vis(clean(nv2)));else if(!isNaN(Number(nv2)))push1(r,L,'numstr','文本型数字',nv2,Number(nv2));else push1(r,L,'nonnum','非数字',nv2,'-')}})
    const aav=r2v(ws,'AA',r);
    if(aav!=null&&aav!==''){const s=String(aav).trim();if(typeof aav==='string'&&/^\s+$/.test(aav))push(r,'AA','whitespace','含空白字符',vis(aav),'');else if(!S.dict.individual.has(s))push1(r,'AA','unknown','不在Category字典',s,'-')}
    const ab=ws['AB'+r];if(ab&&ab.v!=null&&ab.v!=='')push1(r,'AB','residual','列本应空','值:'+String(ab.v),'-')
    /* 跨列复合校验 */
    const slv=r2n(ws,'V',r),ulv=r2n(ws,'W',r),box=r2n(ws,'X',r),yv=r2s(ws,'Y',r);
    if(slv>0&&ulv>0)push1(r,'Y','sl+ul','同一行不能同时存在SL和UL',slv+'/'+ulv,'-')
    else if(slv>0&&yv!=='SL')push1(r,'Y','sl→cat','存在SL损失时间但主AE分类≠SL',yv||'(空)','SL')
    else if(ulv>0&&yv!=='UL')push1(r,'Y','ul→cat','存在UL损失时间但主AE分类≠UL',yv||'(空)','UL')
    const uvc=r2n(ws,'U',r);
    if(uvc>0||slv>0||ulv>0||box>0){const hrs=S.shiftHours.get(r)||12;const sum=uvc+slv+ulv+box;if(Math.abs(sum-hrs)>0.05)push1(r,'cat','sum≠hrs','OAE+SL+UL+BO='+sum+'≠班制'+hrs+'h',sum+'≠'+hrs,'-')}
    const pv=r2n(ws,'P',r);
    if(pv>0||slv>0||ulv>0||box>0){const sum2=slv+ulv+box;if(Math.abs(pv-sum2)>0.05)push1(r,'cat','p≠sum','损失时间='+pv+'≠SL+UL+BO='+sum2,pv+'≠'+sum2,'-')}
    const aav2=r2v(ws,'AA',r);
    if(aav2!=null&&aav2!==''){const ind=String(aav2).trim();const cat=S.catMap[ind];if(!cat)push1(r,'Y','nomap','AE分类不在Category字典',vis(ind),'-');else{const yv2=r2s(ws,'Y',r);const zv2=r2s(ws,'Z',r);if(yv2!==null&&yv2!==''&&cat.main&&yv2!==cat.main)push1(r,'Y','main-mismatch','主AE分类应为「'+cat.main+'」',yv2,cat.main);if(zv2!==null&&zv2!==''&&cat.sub&&zv2!==cat.sub)push1(r,'Y','sub-mismatch','次AE分类应为「'+cat.sub+'」',zv2,cat.sub)}}
  }
  const ss=new Map();
  for(let r=S.dataStart;r<=max;r++){const gv=r2v(ws,'G',r);if(gv==null||gv==='')continue;const st=clean(String(gv));if(!STATUS_ENUM.includes(st))continue;const d=r2s(ws,'C',r),l=r2s(ws,'F',r),s=r2s(ws,'D',r),a=r2s(ws,'A',r);if(!d||!s)continue;const key=(a||'')+'|'+d+'|'+(l||'(空)')+'|'+s;if(ss.has(key)&&ss.get(key)!==st)push1(r,'G','dup','同班次已有「'+ss.get(key)+'」又现「'+st+'」',st,'-');if(!ss.has(key))ss.set(key,st)}
  return issues}
/* 渲染 */
function getIssueMonth(i){const ws=S.ws;const bv=r2v(ws,'B',i.row);if(bv!=null){const s=String(bv).trim();if(/^\d{2}年\d{2}月$/.test(s))return s}const cv=r2v(ws,'C',i.row);const m=fmtMonthFromDate(cv);return m}
function getFilteredIssues(){if(!S.filterYear&&!S.filterMonth)return S.issues;return S.issues.filter(i=>{const m=getIssueMonth(i);if(!m)return false;if(S.filterYear&&!m.startsWith(S.filterYear+'年'))return false;if(S.filterMonth&&!m.endsWith(S.filterMonth+'月'))return false;return true})}
function initDateFilter(){const years=new Set(),months=new Set();S.issues.forEach(i=>{const m=getIssueMonth(i);if(!m)return;const ym=m.match(/^(\d{2})年(\d{2})月$/);if(ym){years.add(ym[1]);months.add(ym[2])}});const ys=$('#filterYear'),ms=$('#filterMonth');ys.innerHTML='<option value="">全部年份</option>';[...years].sort().forEach(y=>ys.innerHTML+='<option value="'+y+'">20'+y+'年</option>');ms.innerHTML='<option value="">全部月份</option>';[...months].sort().forEach(mo=>ms.innerHTML+='<option value="'+mo+'">'+parseInt(mo)+'月</option>');S.filterYear=null;S.filterMonth=null;ys.value='';ms.value=''}
function showReview(){$('#stage-load').classList.remove('active');$('#stage-review').classList.add('active');renderSynonyms();initDateFilter();renderChart('ws-line');renderTabs();renderIssues();updateCounts();$('#exportBtn').addEventListener('click',openExport);$('#exportCancel').addEventListener('click',closeExport);$('#exportGo').addEventListener('click',doExport);$('#filterApply').addEventListener('click',()=>{S.filterYear=$('#filterYear').value||null;S.filterMonth=$('#filterMonth').value||null;renderTabs();renderIssues();updateCounts()});$('#filterClear').addEventListener('click',()=>{S.filterYear=null;S.filterMonth=null;$('#filterYear').value='';$('#filterMonth').value='';renderTabs();renderIssues();updateCounts()});$$('.ct-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.ct-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderChart(btn.dataset.dim)}))}
function renderSynonyms(){const grid=$('#synGrid');grid.innerHTML='';const block=(t,syn)=>{const c=document.createElement('div');c.className='syn-card';c.innerHTML='<div class="sc-head">'+t+'</div>';Object.keys(syn).forEach(from=>{const r=document.createElement('div');r.className='syn-row';r.innerHTML='<span>'+from+'</span><span class="arr">→</span>';const i=document.createElement('input');i.value=syn[from];i.addEventListener('change',()=>{syn[from]=i.value});r.appendChild(i);c.appendChild(r)});grid.appendChild(c)};block('STATUS',SYNONYMS.status);block('SHIFT',SYNONYMS.shift)}
function renderChart(dim){const area=$('#chartArea');if(!area)return;const ws=S.ws;
  let groups=[];
  if(dim==='ws-line'){
    const map={};S.issues.forEach(i=>{const ws_k=String(getMergedVal(ws,'A',i.row)||'(空)'),ln_k=String(getMergedVal(ws,'F',i.row)||'(空)');const k=ws_k+'\x00'+ln_k;if(!map[k])map[k]=0;map[k]++});
    const byWs={};Object.entries(map).forEach(([k,v])=>{const[ws_k,ln_k]=k.split('\x00');if(!byWs[ws_k])byWs[ws_k]=[];byWs[ws_k].push({sub:ln_k,val:v})});
    groups=Object.entries(byWs).sort((a,b)=>a[0].localeCompare(b[0])).map(([gk,items])=>({group:gk,items:items.sort((a,b)=>a.sub.localeCompare(b.sub))}));
  }else if(dim==='yr-mon'){
    const map={};S.issues.forEach(i=>{const m=getIssueMonth(i);if(!m)return;const ym=m.match(/^(\d{2})年(\d{2})月$/);if(!ym)return;const yr_k='20'+ym[1]+'年',mo_k=parseInt(ym[2])+'月';const k=yr_k+'\x00'+mo_k;if(!map[k])map[k]=0;map[k]++});
    const byYr={};Object.entries(map).forEach(([k,v])=>{const[yr_k,mo_k]=k.split('\x00');if(!byYr[yr_k])byYr[yr_k]=[];byYr[yr_k].push({sub:mo_k,val:v})});
    const allYrs=Object.keys(byYr).sort();const recentYrs=allYrs.slice(-3);
    groups=recentYrs.map(gk=>({group:gk,items:byYr[gk].sort((a,b)=>parseInt(a.sub)-parseInt(b.sub))}));
    if(allYrs.length>3)groups._extra='仅显示最近3年（共'+allYrs.length+'年），可横向滚动查看';
  }else return;
  if(!groups.length){area.innerHTML='<p style="color:var(--ink-faded);padding:1rem 0">暂无数据</p>';return}
  let maxVal=0;groups.forEach(g=>g.items.forEach(it=>{if(it.val>maxVal)maxVal=it.val}));
  let html='<div class="bar-chart">';
  groups.forEach(g=>{
    html+='<div class="bar-group">';
    g.items.forEach(it=>{
      const h=Math.round(it.val/maxVal*90);
      html+='<div class="bar-item"><div class="bar-fill" style="height:'+h+'%"><span class="bar-val">'+it.val+'</span></div><div class="bar-sub">'+it.sub+'</div></div>';
    });
    html+='<div class="bar-grp-bracket"></div><div class="bar-grp-label">'+g.group+'</div></div>';
  });
  html+='</div><div class="chart-xaxis"></div>';
  if(groups._extra)html+='<p style="font-size:.78rem;color:var(--ink-faded);margin-top:.4rem;font-family:var(--serif-cn)">'+groups._extra+'</p>';
  area.innerHTML=html}
function renderTabs(){const wrap=$('#colTabs');wrap.innerHTML='';const filtered=getFilteredIssues();const byCol={};filtered.forEach(i=>{(byCol[i.col]||(byCol[i.col]=[])).push(i)});S.curCol=null;
  COLS.forEach(col=>{const cnt=(byCol[col.L]||[]).length;if(!cnt)return;const t=document.createElement('div');t.className='col-tab';t.innerHTML='<span class="ct-letter">'+col.L+'</span><span>'+(col.cn||col.L)+'</span><span class="ct-badge">'+cnt+'</span>';t.addEventListener('click',()=>{S.curCol=col.L;renderIssues(col.L);$$('.col-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active')});wrap.appendChild(t)})
  const all=document.createElement('div');all.className='col-tab active';all.style.background='#1a1410';all.style.color='#f3ecdc';all.innerHTML='<span>全</span><span>全部</span><span class="ct-badge" style="background:#b1281e">'+filtered.length+'</span>';all.style.order='-1';all.addEventListener('click',()=>{S.curCol=null;renderIssues();$$('.col-tab').forEach(x=>x.classList.remove('active'));all.classList.add('active')});wrap.insertBefore(all,wrap.firstChild)}
function renderIssues(filterCol){const stream=$('#issuesStream');stream.innerHTML='';const filtered=getFilteredIssues();const groups={};filtered.forEach(i=>{if(!filterCol||i.col===filterCol){(groups[i.col]||(groups[i.col]=[])).push(i)}})
  COLS.forEach(col=>{const arr=groups[col.L];if(!arr||!arr.length)return;const g=document.createElement('div');g.className='col-group';g.dataset.col=col.L;const h=document.createElement('div');h.className='cg-head';h.innerHTML='<span class="cg-letter">'+col.L+'</span><span class="cg-title">'+(col.cn||col.L)+'</span><span class="cg-en">'+(col.en||'')+'</span><span class="cg-count">疑误 <b>'+arr.length+'</b> 处</span>';g.appendChild(h);const sub={};arr.forEach(i=>{const k=groupKey(i);(sub[k]||(sub[k]=[])).push(i)});Object.keys(sub).forEach(k=>g.appendChild(renderGroup(sub[k],col)));stream.appendChild(g)})}
function renderGroup(issues,col){const el=document.createElement('div');el.className='issue-group';el.dataset.type=issues[0].type;if(issues.every(i=>i.resolved))el.classList.add('dismissed')
  const first=issues[0],cnt=issues.length,pending=issues.filter(i=>!i.resolved).length,hasSug=(first.suggest!=null&&first.suggest!=='␣'&&first.suggest!==''&&first.suggest!=='-')||first.type==='whitespace',isMulti=cnt>1,lbl=typeLabel(first.type)
  const rows=cnt<=5?issues.map(i=>'#'+i.row).join(' '):issues.slice(0,5).map(i=>'#'+i.row).join(' ')+' …等 '+cnt+' 行'
  const normCur=s=>String(s).replace(/[\s　␣]+/g,'').trim();
  const byCur={};let multi=false;
  if(isMulti&&first.demo){issues.forEach(i=>{const k=normCur(i.current)+'\x00'+(i.suggest==null?'∅':normCur(i.suggest));(byCur[k]||(byCur[k]=[])).push(i)});multi=Object.keys(byCur).length>1}
  el.innerHTML='<div class="ig-head"><div class="ig-left"><span class="ig-type">'+lbl+'</span>'+
    (!col.noEdit?'<span class="ig-count">'+cnt+'处</span>':'')+'</div><div class="ig-rows">'+rows+'</div></div>'+
    '<div class="ig-body"><div class="issue-reason">'+first.reason+'</div>'+
    (hasSug?'<div class="issue-vals"><span class="lbl">原文</span><span class="old-val">'+esc(first.current)+'</span><span class="arrow">→</span><span class="lbl">修订为</span><span class="new-val">'+(first.suggest===''?'null':esc(first.suggest))+'</span>'+(isMulti?'<span class="demo-badge">示例</span>':'')+'</div>'
           :'<div class="issue-vals"><span class="lbl">原文</span><span class="old-val">'+esc(first.current)+'</span>'+(isMulti?'<span class="demo-badge">示例</span>':'')+'</div>')+
    (multi?'<div class="multi-wrap" style="display:none">'+Object.keys(byCur).map(cur=>{const sub=byCur[cur],subSug=sub[0].suggest;const done=sub.every(i=>i.resolved);return '<div class="multi-row'+(done?' dismissed':'')+'" data-norm="'+esc(cur)+'"><div class="m-head"><span class="m-cur">'+esc(sub[0].current)+(subSug?'<span class="m-arrow">→</span><span class="m-sug">'+esc(subSug)+'</span>':'')+'<span class="m-num">&ensp;'+sub.length+' 处</span></div><div class="m-actions"><button class="iact m-accept" data-mact="accept"><span>接受</span></button><input class="man-in-small" placeholder="统一为此值·回车确认"><button class="iact m-apply" data-mact="apply"><span>应用</span></button><button class="iact m-ignore" data-mact="ignore"><span>忽略</span></button></div></div>'}).join('')+'</div>':'')+
    '</div><div class="ig-actions">'+
    (col.L==='Y'?
      (cnt>1?'<button class="iact bulk-acc" data-act="bulk-accept" disabled><span>全部接受</span></button>':'<button class="iact" data-act="accept" disabled><span>接受</span></button>')+
      '<button class="iact" data-act="yeditor"><span>手动修改</span></button>'+
      '<button class="iact" data-act="ignore"><span>全部忽略</span></button>'
      :(col.noEdit?'<button class="iact" data-act="ignore" style="min-width:auto"><span>忽略</span></button>'
        :(multi?'<button class="iact bulk-acc" data-act="bulk-accept"'+(hasSug?'':'disabled')+'><span>全部接受</span></button><button class="iact reveal-manual" data-act="show-multi"><span>手动修改</span></button><button class="iact" data-act="ignore"><span>全部忽略</span></button>'
               :(isMulti?'<button class="iact bulk-acc" data-act="bulk-accept"'+(hasSug?'':'disabled')+'><span>全部接受</span></button><button class="iact" data-act="manual"><span>手动修改</span></button><button class="iact" data-act="ignore"><span>全部忽略</span></button>'
                        :'<button class="iact" data-act="accept"'+(hasSug?'':' disabled')+'><span>接受</span></button><button class="iact" data-act="manual"><span>手动修改</span></button><button class="iact" data-act="ignore"><span>忽略</span></button>'))))+
    '</div>'
  el.querySelectorAll('.iact').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const act=btn.dataset.act;
    if(act==='bulk-accept-all'){issues.filter(i=>!i.resolved&&i.suggest!=null).forEach(i=>{i.resolved='accept';i.value=i.suggest});el.classList.add('dismissed');updateCounts();return}
    if(act==='bulk-ignore-all'){issues.filter(i=>!i.resolved).forEach(i=>{i.resolved='ignore'});el.classList.add('dismissed');updateCounts();return}
    if(act==='show-multi'){const w=el.querySelector('.multi-wrap');if(w){w.style.display=w.style.display==='none'?'block':'none';return}}
    if(act==='yeditor'){renderYEditor(issues.filter(i=>!i.resolved));return}
    const mr=btn.closest('.multi-row');if(mr){const norm=mr.dataset.norm;const sub=issues.filter(i=>normCur(i.current)+'\x00'+(i.suggest==null?'∅':normCur(i.suggest))===norm);const ma=btn.dataset.mact;
      if(ma==='accept'){sub.filter(i=>!i.resolved&&i.suggest!=null).forEach(i=>{i.resolved='accept';i.value=i.suggest});mr.classList.add('dismissed')}
      else if(ma==='ignore'){sub.filter(i=>!i.resolved).forEach(i=>{i.resolved='ignore'});mr.classList.add('dismissed')}
      else if(ma==='apply'){const inp=mr.querySelector('.man-in-small');if(!inp||!inp.value.trim()){toast('未填值');return}const v=isNaN(Number(inp.value))?inp.value.trim():Number(inp.value);sub.filter(i=>!i.resolved).forEach(i=>{i.resolved='manual';i.value=v;i.manualVal=inp.value.trim()});mr.classList.add('dismissed')}
      el.classList.toggle('dismissed',issues.every(i=>i.resolved));updateCounts();return}
    if(act==='bulk-accept'){issues.filter(i=>i.resolved!=='accept'&&i.resolved!=='ignore'&&i.suggest!=null).forEach(i=>{i.resolved='accept';i.value=i.suggest})}
    else if(act==='ignore'){issues.filter(i=>i.resolved!=='accept'&&i.resolved!=='ignore').forEach(i=>{i.resolved='ignore'})}
    else if(act==='accept'){issues.filter(i=>!i.resolved&&i.suggest!=null).forEach(i=>{i.resolved='accept';i.value=i.suggest})}
    else if(act==='manual'){const body=el.querySelector('.ig-body .issue-vals');if(!body)return;const existing=body.querySelector('.man-in');if(existing){existing.focus();return}
      const wrap=document.createElement('span');wrap.style.display='contents';wrap.innerHTML='<span class="arrow">→</span><span class="lbl">修订为</span><input class="man-in" placeholder="统一改为…">';body.appendChild(wrap)
      const inp=wrap.querySelector('.man-in');inp.focus();const commit=()=>{const v=inp.value.trim();const nv=v===''?'':(isNaN(Number(v))?v:Number(v));issues.forEach(i=>{i.resolved='manual';i.value=nv;i.manualVal=v});el.classList.add('dismissed');wrap.remove();updateCounts()};inp.addEventListener('keydown',e=>{if(e.key==='Enter')commit();else if(e.key==='Escape')wrap.remove()});inp.addEventListener('blur',blurCommit);return}
    el.classList.add('dismissed');updateCounts()}))
  return el}
function typeLabel(t){const m={'missing':'数据缺失','dirty':'数据格式','whitespace':'空白字符','type':'格式','synonym':'同义词','unknown':'未知','case':'大小写','format':'格式','mismatch':'不一致','numstr':'文本数字','nonnum':'非数字','reverse':'倒序','formula':'公式','negtime':'负值','oaebase':'常数','residual':'残留','timealone':'不配套','dup':'重复','workshop':'车间','date-invalid':'日期无效','month-format':'月份格式','month-mismatch':'月份不符','sl+ul':'SL,UL冲突','sl→cat':'SL不匹配','ul→cat':'UL不匹配','sum≠hrs':'和≠班时','p≠sum':'时长≠分类和','nomap':'无映射','main-mismatch':'主类错','sub-mismatch':'次类错'};return m[t]||t}
function updateCounts(){const a=S.issues.filter(i=>i.resolved==='accept').length,m=S.issues.filter(i=>i.resolved==='manual').length,ig=S.issues.filter(i=>i.resolved==='ignore').length
  $('#cntDataRows').textContent=S.maxRow-S.dataStart+1;$('#cntTotal').textContent=S.issues.length;$('#cntAccept').textContent=a;$('#cntManual').textContent=m;$('#cntIgnore').textContent=ig;$('#cntPending').textContent=S.issues.length-a-m-ig;$('#exportBtn').style.opacity='1';$('#exportBtn').disabled=false;const nm=$('#newName');if(nm)nm.textContent=S.fileName.replace(/\.xlsx?m?$/,'')+'-Check.'+S.srcExt;const om=$('#origName');if(om)om.textContent=S.fileName}
function openExport(){$('#exportModal').classList.add('open');$('#exportModal').setAttribute('aria-hidden','false')}
function closeExport(){$('#exportModal').classList.remove('open');$('#exportModal').setAttribute('aria-hidden','true')}
const NUMERIC_COLS=new Set(['J','K','L','M','P','U','V','W','X']);
function escapeXml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function applyMod(addr,attrs,content,col,value){
  const stripT=()=>attrs.replace(/\s*t="[^"]*"/g,'');
  if(content.includes('<f')){
    if(NUMERIC_COLS.has(col)){const nv=Number(value);if(!isNaN(nv)){const nc=content.replace(/<v>[^<]*<\/v>/,'<v>'+nv+'</v>');return'<c r="'+addr+'"'+attrs+'>'+nc+'</c>'}}
    return null
  }
  if(value==='\u2423'||value==='-')return null;
  if(value===''||value==null)return'<c r="'+addr+'"'+stripT()+'/>';
  if(NUMERIC_COLS.has(col)){const nv=Number(value);if(!isNaN(nv))return'<c r="'+addr+'"'+stripT()+'><v>'+nv+'</v></c>'}
  return'<c r="'+addr+'"'+stripT()+' t="inlineStr"><is><t>'+escapeXml(value)+'</t></is></c>'
}
async function exportPatchedFile(){
  if(!S.origBuf){toast('无原始文件数据');return}
  toast('正在生成修正文件…');
  try{
    const zip=await JSZip.loadAsync(S.origBuf);
    const sheetPath='xl/worksheets/sheet1.xml';
    let sheetXml=await zip.file(sheetPath).async('string');
    const mods=new Map();
    S.issues.forEach(i=>{
      if(i.resolved!=='accept'&&i.resolved!=='manual')return;
      if(i.resolved==='manual'&&i.manualVal){
        try{const f=JSON.parse(i.manualVal);['U','V','W','X','Y','Z','AA'].forEach(c=>{if(f[c]!==undefined&&f[c]!=='')mods.set(c+i.row,{col:c,value:f[c]})});return}catch(e){}
      }
      mods.set(i.col+i.row,{col:i.col,value:i.value});
    });
    console.log('Modifications to apply:',mods.size);
    const cellRe=/<c r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>|<c r="([A-Z]+\d+)"([^>]*)\/>/g;
    let modCount=0;
    sheetXml=sheetXml.replace(cellRe,(m,addr1,attrs1,content,addr2,attrs2)=>{
      const addr=addr1||addr2,attrs=attrs1!=null?attrs1:(attrs2||''),inner=content||'';
      const mod=mods.get(addr);if(!mod)return m;
      const result=applyMod(addr,attrs,inner,mod.col,mod.value);
      if(result===null)return m;modCount++;return result;
    });
    console.log('Cells modified:',modCount);
    zip.file(sheetPath,sheetXml);
    toast('正在压缩打包…');
    const mimeType=S.srcExt==='xlsm'?'application/vnd.ms-excel.sheet.macroEnabled.12':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const blob=await zip.generateAsync({type:'blob',mimeType:mimeType});
    const ext=S.srcExt==='xlsm'?'.xlsm':'.xlsx';
    const name=S.fileName.replace(/\.(xlsx|xlsm)$/,'')+'-Check'+ext;
    download(blob,name);
    toast('已导出 '+name+'（修改 '+modCount+' 个单元格）');
  }catch(err){console.error('exportPatchedFile error:',err);toast('导出失败：'+err.message)}
}
async function doExport(){const mode=document.querySelector('input[name=save]:checked').value;closeExport()
  if(mode==='report'){exportCSV();return}
  if(mode==='direct'){await exportPatchedFile();exportCSV();return}
  /* 生成操作清单 CSV：只包含接受和手动修改的条目 */
  const rows=[['行','列','新值']];
  S.issues.forEach(i=>{
    if(i.resolved==='accept'||i.resolved==='manual'){
      let val=i.value;
      /* Y编辑器 manualVal 是 JSON */
      if(i.resolved==='manual'&&i.manualVal){
        try{
          const f=JSON.parse(i.manualVal);
          ['U','V','W','X','Y','Z','AA'].forEach(c=>{
            if(f[c]!==undefined&&f[c]!=='')rows.push([i.row,c,String(f[c])]);
          });
          return;
        }catch(e){val=i.value;}
      }
      rows.push([i.row,i.col,String(val)]);
    }
  });
  const csv='﻿'+rows.map(r=>{const s=String(r[2]==null?'':r[2]);if(/[",\n]/.test(s))return r[0]+','+r[1]+',"'+s.replace(/"/g,'""')+'"';return r.join(',')}).join('\r\n');
  download(new Blob([csv],{type:'text/csv;charset=utf-8'}),'操作清单.csv');
  exportCSV();
  toast('已导出操作清单 CSV 与报告 CSV')}
function download(blob,name){const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},500)}
function exportCSV(bookName){const rows=[['编号','行','列字母','列名','类型','问题描述','原值','订后值','处理方式']];const colMap={};COLS.forEach(c=>colMap[c.L]=c)
  S.issues.forEach(i=>rows.push([i.id,i.row,i.col,colMap[i.col]?colMap[i.col].cn:'',i.type,i.reason,esc(i.current),esc(i.value),i.resolved||'待批']))
  const csv='﻿'+rows.map(r=>r.map(c=>{const s=String(c==null?'':c);if(/[",\n]/.test(s))return'"'+s.replace(/"/g,'""')+'"';return s}).join(',')).join('\r\n')
  download(new Blob([csv],{type:'text/csv;charset=utf-8'}),(bookName||S.fileName).replace(/\.xlsx?m?$/,'')+'-report.csv')}
initLoad();