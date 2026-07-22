/* ===================================================================
   AE数据检查 — AE详细编辑器
   Y列：全行上下文 + U/V/W/X/Y/Z/AA 联动编辑
   其他列：简化编辑（单输入框 + 批量修改）
   =================================================================== */
'use strict';
const YEDITOR_ROW_LIMIT=200;

function renderYEditor(issues) {
  if (!issues.length) return;
  const col=issues[0].col;
  if(col==='Y'||col==='Z'||col==='AA') return renderYEditorFull(issues);
  return renderSimpleEditor(issues,col);
}

/* ---- 简化编辑器（非Y列）---- */
function renderSimpleEditor(issues,col){
  const ws=S.ws;
  const cname={};COLS.forEach(function(c){cname[c.L]=c.cn||c.L;});
  const colName=cname[col]||col;
  const shown=issues.slice(0,YEDITOR_ROW_LIMIT);
  const remaining=issues.length-shown.length;

  function rowCtxLite(r){
    const A=r2s(ws,'A',r)||'';
    const Cv=r2v(ws,'C',r);
    const C=(function(){const c=ws['C'+r];if(c&&c.w)return c.w;if(Cv instanceof Date)return esc(Cv);if(typeof Cv==='number')return serialToDate(Cv).toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});return String(Cv||'');})();
    const D=r2s(ws,'D',r)||'';
    const F=r2s(ws,'F',r)||'';
    const mergedF=S.dict.mergedF.has(r)?function(){var ws2=S.ws;if(!ws2['!merges'])return null;for(var mi=0;mi<ws2['!merges'].length;mi++){var m=ws2['!merges'][mi];if(m.s.c===5&&m.e.c===5&&m.s.r<=r-1&&r-1<=m.e.r){var cell=ws2['F'+(m.s.r+1)];return cell&&cell.v!=null?String(cell.v):null;}}return null;}():null;
    const I=r2s(ws,'I',r)||'';
    const AF=(A||'')+((F||mergedF)?' '+(F||mergedF):'');
    const cur=r2s(ws,col,r);
    return{r,AF,C,D:DH(D,r),I,cur:cur!=null?String(cur):''};
  }
  function DH(D,r){return(D||'')+(S.shiftHours.get(r)?'('+S.shiftHours.get(r)+'H)':'');}

  const d=document.createElement('div');
  d.className='modal open';d.id='yEditorModal';
  let html='<div class="modal-paper" style="width:min(900px,94vw);max-height:90vh;overflow-y:auto;padding:1.6rem 1.6rem .5rem;">';
  html+='<h2 style="font-family:var(--serif-cn);font-weight:900;font-size:1.3rem;letter-spacing:.2em;margin-bottom:.6rem;">AE详细编辑<span class="mp-sub" style="display:block;font-family:var(--serif-en);font-style:italic;color:var(--ink-faded);font-size:.82rem;">'+colName+' · '+issues.length+' 条记录</span></h2>';
  /* 批量修改栏 */
  html+='<div style="display:flex;gap:.6rem;align-items:center;padding:.6rem;margin-bottom:.8rem;background:var(--paper-2);border:1px solid var(--rule-soft);">';
  html+='<span style="font-size:.82rem;color:var(--ink-soft);white-space:nowrap">批量修改为：</span>';
  html+='<input id="batchVal" placeholder="统一改为…" style="font-family:var(--mono);font-size:.82rem;border:1px solid var(--rule-soft);background:#fff;padding:.3rem .5rem;flex:1;min-width:8em;">';
  html+='<button class="btn-primary" id="batchApply" style="padding:.4rem 1rem;font-size:.82rem">全部应用</button></div>';
  /* 行列表 */
  shown.forEach(function(iss){
    const ctx=rowCtxLite(iss.row);
    html+='<div class="y-editor-row" data-row="'+ctx.r+'" style="display:flex;align-items:center;gap:.6rem;padding:.35rem .5rem;margin-bottom:.3rem;background:var(--paper-2);border:1px solid var(--rule-soft);font-family:var(--mono);font-size:.75rem;">';
    html+='<span style="min-width:3em;color:var(--ink-faded)">#'+ctx.r+'</span>';
    html+='<span style="min-width:10em;color:var(--ink-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escAA(ctx.AF)+'</span>';
    html+='<span style="min-width:7em;color:var(--ink-soft)">'+ctx.C+'</span>';
    html+='<span style="min-width:5em;color:var(--ink-soft)">'+escAA(ctx.D)+'</span>';
    html+='<span style="min-width:6em;color:var(--ink-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escAA(ctx.I)+'</span>';
    html+='<span style="color:var(--vermillion);min-width:6em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escAA(ctx.cur||'␣')+'</span>';
    html+='<span style="color:var(--ink-faded)">→</span>';
    html+='<input class="y-simple-input" value="'+escAA(iss.suggest!=null&&iss.suggest!=='␣'&&iss.suggest!=='-'?iss.suggest:ctx.cur)+'" style="width:10em;font-family:var(--mono);font-size:.75rem;border:1px solid var(--blue-soft);background:#fff;padding:.2rem .35rem;">';
    html+='<button class="iact y-apply" style="padding:.15rem .4rem;font-size:.72rem;color:var(--ok);border:1px solid var(--ok);background:var(--paper);cursor:pointer;">应用</button>';
    html+='</div>';
  });
  if(remaining>0) html+='<p style="text-align:center;color:var(--ink-faded);font-size:.82rem;padding:.6rem">…还有 '+remaining+' 行未显示，请使用上方「批量修改」或「全部应用」</p>';
  html+='<div style="display:flex;justify-content:flex-end;gap:.5rem;padding:.6rem 0 0;position:sticky;bottom:0;background:var(--paper);">';
  html+='<button class="btn-ghost" id="yEditorCancel" style="background:var(--paper);border:1px solid var(--rule);color:var(--ink);">返回</button>';
  html+='<button class="btn-primary" id="yEditorSave">保存</button></div></div>';
  d.innerHTML=html;
  document.body.appendChild(d);

  /* 单行应用 */
  d.querySelectorAll('.y-apply').forEach(function(btn){
    btn.addEventListener('click',function(){
      var rowDiv=this.closest('.y-editor-row');
      var r=parseInt(rowDiv.dataset.row);
      var inp=rowDiv.querySelector('.y-simple-input');
      var v=inp.value.trim();
      var nv=v===''?'':(isNaN(Number(v))?v:Number(v));
      var iss=issues.find(function(i){return i.row===r;});
      if(!iss)return;
      iss.resolved='manual';iss.value=nv;iss.manualVal=String(nv);
      rowDiv.style.opacity='.5';
      toast('已应用 #'+r);
    });
  });
  /* 批量应用 */
  d.querySelector('#batchApply').addEventListener('click',function(){
    var inp=d.querySelector('#batchVal');
    if(!inp.value.trim()){toast('请输入值');return;}
    var v=inp.value.trim();
    var nv=v===''?'':(isNaN(Number(v))?v:Number(v));
    issues.forEach(function(iss){
      if(iss.resolved)return;
      iss.resolved='manual';iss.value=nv;iss.manualVal=String(nv);
    });
    d.querySelectorAll('.y-editor-row').forEach(function(rd){rd.style.opacity='.5';});
    var applied=issues.filter(function(i){return i.resolved==='manual';}).length;
    toast('已批量应用 '+applied+' 条');
  });
  /* 保存 */
  d.querySelector('#yEditorCancel').onclick=function(){d.remove();};
  d.querySelector('#yEditorSave').onclick=function(){
    /* 未点应用的行：取输入框值自动保存 */
    d.querySelectorAll('.y-editor-row').forEach(function(rowDiv){
      var r=parseInt(rowDiv.dataset.row);
      var iss=issues.find(function(i){return i.row===r;});
      if(!iss||iss.resolved)return;
      var inp=rowDiv.querySelector('.y-simple-input');
      var v=inp.value.trim();
      var nv=v===''?'':(isNaN(Number(v))?v:Number(v));
      iss.resolved='manual';iss.value=nv;iss.manualVal=String(nv);
    });
    var el=document.querySelector('.col-group[data-col="'+col+'"] .issue-group');
    if(el)el.classList.toggle('dismissed',issues.every(function(i){return i.resolved;}));
    var saved=issues.filter(function(i){return i.resolved;}).length;
    updateCounts();d.remove();
    toast('已保存 '+saved+' 条');
  };
}

/* ---- Y列完整编辑器（原有逻辑 + 行数限制）---- */
function renderYEditorFull(issues) {
  const ws = S.ws;
  const catMap = S.catMap;
  const mainOpts = ['(空)', 'SL', 'UL', 'BO'];
  const subOpts  = ['(空)', 'Shift oac', 'Struc oac', 'Tech', 'Op',
                     'Enhance', 'Util oac', 'RM oac', 'Qual', 'Other ext', 'B Dec', 'No dem'];
  const allAA = Array.from(S.dict.individual);
  function aaLabel(aa){var m=catMap[aa];if(!m)return aa;return (m.main||'?')+'|'+(m.sub||'?')+'|'+aa;}
  const cname={};COLS.forEach(function(c){cname[c.L]=c.cn||c.L;});
  const shown=issues.slice(0,YEDITOR_ROW_LIMIT);
  const remaining=issues.length-shown.length;

  function rowCtx(r) {
    const A  = r2s(ws, 'A', r) || '';
    const Cv = r2v(ws, 'C', r);
    const C = (function(){const c=ws["C"+r];if(c&&c.w){var cz=c.z;if(cz&&cz.startsWith('m/d/')){var pp=c.w.split('/');var dd=(2000+parseInt(pp[2]))+'/'+('00'+pp[0]).slice(-2)+'/'+('00'+pp[1]).slice(-2);return dd;}var pp2=c.w.split('/');var dd2=('0000'+pp2[0]).slice(-4)+'/'+('00'+pp2[1]).slice(-2)+'/'+('00'+pp2[2]).slice(-2);return dd2;}if(Cv instanceof Date)return esc(Cv);if(typeof Cv==='number')return serialToDate(Cv).toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});return String(Cv||'');})();
    const D  = r2s(ws, 'D', r) || '';
    const DH = (D||'')+(S.shiftHours.get(r)?'('+S.shiftHours.get(r)+'H)':'');
    const F  = r2s(ws, 'F', r) || '';
    const H  = r2s(ws, 'H', r) || '';
    const mergedF = S.dict.mergedF.has(r) ? function(){var ws2=S.ws;if(!ws2['!merges'])return null;for(var mi=0;mi<ws2['!merges'].length;mi++){var m=ws2['!merges'][mi];if(m.s.c===5&&m.e.c===5&&m.s.r<=r-1&&r-1<=m.e.r){var cell=ws2['F'+(m.s.r+1)];return cell&&cell.v!=null?String(cell.v):null;}}return null;}() : null;
    const I  = r2s(ws, 'I', r) || '';
    const AF = (A||'')+((F||mergedF)?' '+(F||mergedF):'');
    const Nv = r2v(ws, 'N', r);
    const Ov = r2v(ws, 'O', r);
    const N = (function(){const c=ws["N"+r];if(c&&c.w)return c.w;if(Nv instanceof Date)return Nv.toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});if(typeof Nv==="number")return serialToDate(Nv).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});return String(Nv||"");})();
    const O = (function(){const c=ws["O"+r];if(c&&c.w)return c.w;if(Ov instanceof Date)return Ov.toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});if(typeof Ov==="number")return serialToDate(Ov).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});return String(Ov||"");})();
    const P  = r2n(ws, 'P', r);
    const Q  = (r2s(ws, 'Q', r) || '').substring(0, 24);
    const Sv = r2s(ws, 'S', r) || '';
    const Tv = r2s(ws, 'T', r) || '';
    const K  = r2n(ws, 'K', r);
    const U  = r2n(ws, 'U', r);
    const V  = r2n(ws, 'V', r);
    const W  = r2n(ws, 'W', r);
    const X  = r2n(ws, 'X', r);
    const Y  = r2s(ws, 'Y', r) || '';
    const Z  = r2s(ws, 'Z', r) || '';
    const AA = r2s(ws, 'AA', r) || '';
    return { A, C, D, F, DH, AF, H, I, K, N, O, P, Q, Sv, Tv, U, V, W, X, Y, Z, AA, r };
  }

  const d = document.createElement('div');
  d.className = 'modal open';
  d.id = 'yEditorModal';
  let html = '<div class="modal-paper" style="width:min(1200px,96vw);max-height:90vh;overflow-y:auto;padding:1.6rem 1.6rem .5rem;">';
  html += '<h2 style="font-family:var(--serif-cn);font-weight:900;font-size:1.3rem;letter-spacing:.2em;margin-bottom:1rem;">AE详细编辑<span class="mp-sub" style="display:block;font-family:var(--serif-en);font-style:italic;color:var(--ink-faded);font-size:.82rem;">'+issues.length+' 条记录</span></h2>';

  shown.forEach(iss => {
    const ctx = rowCtx(iss.row);
    const r = ctx.r;
    function selOpts(opts, cur) {
      return opts.map(function(o){var isEmpty=o==='(空)';return '<option value="'+(isEmpty?'':escAA(o))+'"'+(isEmpty?(cur===''||cur==null?' selected':''):(o===cur?' selected':''))+'>'+escAA(o)+'</option>';}).join('');
    }
    html += '<div class="y-editor-row" data-row="'+r+'" style="border:1px solid var(--rule);padding:.45rem;margin-bottom:.45rem;background:var(--paper-2);">';
    html += '<div class="y-ctx" style="display:flex;flex-wrap:wrap;font-family:var(--mono);font-size:.7rem;color:var(--ink-soft);margin-bottom:.4rem;padding-bottom:.3rem;border-bottom:1px dashed var(--rule-soft);"><span style="min-width:11rem"><b>#'+r+'</b> 车间产线 '+escAA(ctx.AF)+'</span><span style="min-width:11rem">'+cname["C"]+' '+ctx.C+'</span><span style="min-width:11rem">'+cname["D"]+' '+escAA(ctx.DH)+'</span><span style="min-width:18rem">'+cname["I"]+' '+escAA(ctx.I)+'</span><span style="min-width:8rem">'+cname["H"]+' '+escAA(ctx.H)+'</span><span style="min-width:8rem">'+cname["K"]+' '+ctx.K+'</span></div>';
    html += '<div class="y-ctx2" style="display:flex;flex-wrap:wrap;font-family:var(--mono);font-size:.7rem;color:var(--ink-soft);margin-bottom:.4rem;padding-bottom:.3rem;border-bottom:1px dashed var(--rule-soft);"><span style="min-width:11rem">'+cname["N"]+' '+ctx.N+'</span><span style="min-width:11rem">'+cname["O"]+' '+ctx.O+'</span><span style="min-width:11rem">'+cname["P"]+' '+ctx.P+'</span><span style="min-width:18rem">'+cname["Q"]+' '+escAA(ctx.Q)+'</span><span style="min-width:8rem">'+cname["S"]+' '+escAA(ctx.Sv)+'</span><span style="min-width:8rem">'+cname["T"]+' '+escAA(ctx.Tv)+'</span></div>';
    html += '<div class="y-edit-fields" style="display:flex;flex-wrap:wrap;gap:.35rem .7rem;align-items:center;font-family:var(--mono);font-size:.7rem;color:var(--ink-soft);">';
    html += '<span>'+cname["U"]+'</span> <input class="y-num" data-col="U" value="'+ctx.U+'" style="width:56px;">';
    html += '<span>'+cname["V"]+'</span> <input class="y-num" data-col="V" value="'+ctx.V+'" style="width:56px;">';
    html += '<span>'+cname["W"]+'</span> <input class="y-num" data-col="W" value="'+ctx.W+'" style="width:56px;">';
    html += '<span>'+cname["X"]+'</span> <input class="y-num" data-col="X" value="'+ctx.X+'" style="width:56px;">';
    html += '<span style="margin:0 .15rem"></span>';
    html += '<span>'+cname['Y']+'</span> <select class="y-sel y-sel-main" data-col="Y">'+selOpts(mainOpts, ctx.Y)+'</select>';
    html += '<span>'+cname['Z']+'</span> <select class="y-sel y-sel-sub" data-col="Z">'+selOpts(subOpts, ctx.Z)+'</select>';
    html += '<span>'+cname['AA']+'</span> <select class="y-sel-aa" data-col="AA" style="max-width:220px;"><option value="">(空)</option>'+allAA.map(function(aa){return '<option value="'+escAA(aa)+'"'+(aa===ctx.AA?' selected':'')+'>'+aaLabel(aa)+'</option>';}).join('')+'</select>';
    html += '<span class="y-mark" style="font-size:.75rem;color:var(--ink-faded);"></span>';
    html += '</div></div>';
  });
  if(remaining>0) html+='<p style="text-align:center;color:var(--ink-faded);font-size:.82rem;padding:.6rem">…还有 '+remaining+' 行未显示</p>';
  html += '<div style="display:flex;justify-content:flex-end;gap:.5rem;padding:.6rem 0 0;position:sticky;bottom:0;background:var(--paper);"><button class="btn-ghost" id="yEditorCancel" style="background:var(--paper);border:1px solid var(--rule);color:var(--ink);">返回</button><button class="btn-primary" id="yEditorSave">应用</button></div></div>';
  html='<style>.y-num,.y-sel-main,.y-sel-sub,.y-sel-aa{font-family:var(--mono);font-size:.7rem;border:1px solid var(--rule-soft);padding:.12rem .25rem;background:var(--paper);color:var(--ink);}.y-edit-fields span{white-space:nowrap;}</style>'+html;
  d.innerHTML=html;
  document.body.appendChild(d);

  /* 联动逻辑 */
  d.querySelectorAll('.y-sel-aa').forEach(sel => {
    sel.addEventListener('change', function () {
      const aa = this.value;
      const rowDiv = this.closest('.y-editor-row');
      if (aa && catMap[aa]) {
        const ySel = rowDiv.querySelector('.y-sel-main');
        const zSel = rowDiv.querySelector('.y-sel-sub');
        if (ySel && catMap[aa].main) ySel.value = catMap[aa].main;
        if (zSel && catMap[aa].sub) zSel.value = catMap[aa].sub;
      }
    });
  });
  d.querySelectorAll('.y-sel-sub').forEach(sel => {
    sel.addEventListener('change', function () {
      const z = this.value;
      const rowDiv = this.closest('.y-editor-row');
      const aaSel = rowDiv.querySelector('.y-sel-aa');
      const aa = aaSel && aaSel.value;
      if (!aa || !catMap[aa]) return;
      if (z === catMap[aa].sub) {
        const ySel = rowDiv.querySelector('.y-sel-main');
        if (ySel && catMap[aa].main) ySel.value = catMap[aa].main;
      }
    });
  });
  /* 修改标记 */
  d.querySelectorAll('.y-editor-row').forEach(rowDiv => {
    const mark = rowDiv.querySelector('.y-mark');
    rowDiv.querySelectorAll('input,select').forEach(el => {
      el.addEventListener('change', function() {
        if (mark) { mark.textContent = '✎'; mark.style.color = 'var(--vermillion)'; }
      });
    });
  });
  d.querySelector('#yEditorCancel').onclick = () => { d.remove(); };
  d.querySelector('#yEditorSave').onclick = () => {
    let saved = 0;
    d.querySelectorAll('.y-editor-row').forEach(rowDiv => {
      const r = parseInt(rowDiv.dataset.row);
      const iss = issues.find(i => i.row === r);
      if (!iss) return;
      const mark = rowDiv.querySelector('.y-mark');
      if (!mark || mark.textContent !== '✎') return;
      const fields = {};
      rowDiv.querySelectorAll('.y-num').forEach(inp => fields[inp.dataset.col] = parseFloat(inp.value) || 0);
      rowDiv.querySelectorAll('.y-sel').forEach(sel => fields[sel.dataset.col] = sel.value);
      const aaSel = rowDiv.querySelector('.y-sel-aa');
      fields['AA'] = aaSel ? aaSel.value : '';
      iss.resolved = 'manual';
      iss.manualVal = JSON.stringify(fields);
      iss.value = fields['Y'] || '';
      saved++;
    });
    const el = document.querySelector('.col-group[data-col="'+issues[0].col+'"] .issue-group');
    if (el) el.classList.toggle('dismissed', issues.every(i => i.resolved));
    updateCounts();
    d.remove();
    toast('已应用 ' + saved + ' 条');
  };
}
