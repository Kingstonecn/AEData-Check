/* ===================================================================
   AE数据检查 — AE分类编辑器
   全行上下文 + 下拉框 + 联动自动填充
   =================================================================== */
'use strict';

/* renderYEditor: 打开一个模态弹窗，逐行展示全行上下文 + ${cname['U']}/${cname['V']}/${cname['W']}/${cname['X']}/Y/Z/AA 编辑控件 */
function renderYEditor(issues) {
  if (!issues.length) return;
  const ws = S.ws;
  const catMap = S.catMap;
  const mainOpts = ['Main Category', 'SL', 'UL', 'BO'];
  const subOpts  = ['Sub Category', 'Shift oac', 'Struc oac', 'Tech', 'Op',
                     'Enhance', 'Util oac', 'RM oac', 'Qual', 'Other ext', 'B Dec', 'No dem'];
  const allAA = Array.from(S.dict.individual);
  function aaLabel(aa){var m=catMap[aa];if(!m)return aa;return (m.main||'?')+'|'+(m.sub||'?')+'|'+aa;}
  const cname={};COLS.forEach(function(c){cname[c.L]=c.cn||c.L;});
  function aShort(v){if(!v)return v;var m=v.match(/^([A-Za-z ]+)\s+/);if(m&&m[1].length<28)return m[1].trim()+" | "+v;return v;}

  // 每行列信息
  function rowCtx(r) {
    const get = c => { const cell = ws[c + r]; return cell ? cell.v : null; };
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
    const J  = r2n(ws, 'J', r);
    const K  = r2n(ws, 'K', r);
    const L  = r2n(ws, 'L', r);
    const M  = r2n(ws, 'M', r);
    const Nv = r2v(ws, 'N', r);
    const Ov = r2v(ws, 'O', r);
    const N = (function(){const c=ws["N"+r];if(c&&c.w)return c.w;if(Nv instanceof Date)return Nv.toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});if(typeof Nv==="number")return serialToDate(Nv).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});return String(Nv||"");})();
    const O = (function(){const c=ws["O"+r];if(c&&c.w)return c.w;if(Ov instanceof Date)return Ov.toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});if(typeof Ov==="number")return serialToDate(Ov).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});return String(Ov||"");})();
    const P  = r2n(ws, 'P', r);
    const Q  = (r2s(ws, 'Q', r) || '').substring(0, 24);
    const Rv = r2s(ws, 'R', r) || '';
    const Sv = r2s(ws, 'S', r) || '';
    const Tv = r2s(ws, 'T', r) || '';
    const U  = r2n(ws, 'U', r);
    const V  = r2n(ws, 'V', r);
    const W  = r2n(ws, 'W', r);
    const X  = r2n(ws, 'X', r);
    const Y  = r2s(ws, 'Y', r) || '';
    const Z  = r2s(ws, 'Z', r) || '';
    const AA = r2s(ws, 'AA', r) || '';
    return { A, C, D, F, DH, AF, H, I, J, K, L, M, N, O, P, Q, Rv, Sv, Tv,
             U, V, W, X, Y, Z, AA, r };
  }

  // 构建弹窗
  const d = document.createElement('div');
  d.className = 'modal open';
  d.id = 'yEditorModal';
  let html = `<div class="modal-paper" style="width:min(1200px,96vw);max-height:90vh;overflow-y:auto;padding:1.6rem 1.6rem .5rem;">
    
    <h2 style="font-family:var(--serif-cn);font-weight:900;font-size:1.3rem;letter-spacing:.2em;margin-bottom:1rem;">
      AE分类编辑
      <span class="mp-sub" style="display:block;font-family:var(--serif-en);font-style:italic;color:var(--ink-faded);font-size:.82rem;">
        ${issues.length} 条记录
      </span>
    </h2>`;

  issues.forEach(iss => {
    const ctx = rowCtx(iss.row);
    const r = ctx.r;
    function selOpts(opts, cur) {
      return opts.map(function(o){return '<option value="'+escAA(o)+'"'+(o===cur?' selected':'')+'>'+escAA(o)+'</option>';}).join('');
    }
    html += `
    <div class="y-editor-row" data-row="${r}" style="border:1px solid var(--rule);padding:.45rem;margin-bottom:.45rem;background:var(--paper-2);">
      <div class="y-ctx" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:.1rem .5rem;font-family:var(--mono);font-size:.7rem;color:var(--ink-soft);margin-bottom:.4rem;padding-bottom:.3rem;border-bottom:1px dashed var(--rule-soft);"><span><b>#${r}</b> 车间产线 ${escAA(ctx.AF)}</span><span>${cname["C"]} ${ctx.C}</span><span>${cname["D"]} ${escAA(ctx.DH)}</span><span>${cname["I"]} ${escAA(ctx.I)}</span><span>${cname["H"]} ${escAA(ctx.H)}</span><span>${cname["N"]} ${ctx.N}</span><span>${cname["O"]} ${ctx.O}</span><span>${cname["P"]} ${ctx.P}</span><span>${cname["Q"]} ${escAA(ctx.Q)}</span><span>${cname["S"]} ${escAA(ctx.Sv)}</span><span>${cname["T"]} ${escAA(ctx.Tv)}</span></div>
      <div class="y-edit-fields" style="display:flex;flex-wrap:wrap;gap:.35rem .7rem;align-items:center;font-family:var(--mono);font-size:.7rem;color:var(--ink-soft);">
        <span>${cname["U"]}</span> <input class="y-num" data-col="U" value="${ctx.U}" style="width:56px;">
        <span>${cname["V"]}</span> <input class="y-num" data-col="V" value="${ctx.V}" style="width:56px;">
        <span>${cname["W"]}</span> <input class="y-num" data-col="W" value="${ctx.W}" style="width:56px;">
        <span>${cname["X"]}</span> <input class="y-num" data-col="X" value="${ctx.X}" style="width:56px;">
        <span style="margin:0 .15rem"></span>
        <span>${cname['Y']}</span> <select class="y-sel y-sel-main" data-col="Y" style="">
          ${selOpts(mainOpts, ctx.Y)}
        </select>
        <span>${cname['Z']}</span> <select class="y-sel y-sel-sub" data-col="Z" style="">
          ${selOpts(subOpts, ctx.Z)}
        </select>
        <span>${cname['AA']}</span> <select class="y-sel-aa" data-col="AA" style="max-width:220px;">
          <option value="">(空)</option>
          ${allAA.map(function(aa){return '<option value="'+escAA(aa)+'"'+(aa===ctx.AA?' selected':'')+'>'+aaLabel(aa)+'</option>';}).join('')}
        </select>
        <button class="iact y-apply" style="padding:.2rem .5rem;font-size:.75rem;color:var(--ok);border-color:var(--ok);cursor:pointer;border:1px solid;background:var(--paper);">应用</button>
      </div>
    </div>`;
  });

  html += `<div style="display:flex;justify-content:flex-end;gap:.5rem;padding:.6rem 0 0;position:sticky;bottom:0;">
    <button class="btn-ghost" id="yEditorCancel" style="background:var(--paper);border:1px solid var(--rule);color:var(--ink);">返回</button>
    <button class="btn-primary" id="yEditorSave">保存</button></div></div>`;
  const se=document.createElement('style');se.textContent='.y-num,.y-sel-main,.y-sel-sub,.y-sel-aa{font-family:var(--mono);font-size:.7rem;border:1px solid var(--rule-soft);padding:.12rem .25rem;background:var(--paper);color:var(--ink);}.y-edit-fields span{white-space:nowrap;}';d.appendChild(se);d.innerHTML = html;
  document.body.appendChild(d);

  /* ---- 联动逻辑 ---- */

  // AA 改变 → 自动填充 Y 和 Z
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

  // Y 改变 → 如果 AA 匹配某主分类则自动选 Z
  d.querySelectorAll('.y-sel-main').forEach(sel => {
    sel.addEventListener('change', function () {
      const y = this.value;
      const rowDiv = this.closest('.y-editor-row');
      const aaSel = rowDiv.querySelector('.y-sel-aa');
      const aa = aaSel && aaSel.value;
      if (!aa || !catMap[aa]) return;
      if (catMap[aa].main !== y) {
        // 主分类和 AA 不匹配，只提示不清空
      }
    });
  });

  // Z 改变 → 尝试找到对应的主分类
  d.querySelectorAll('.y-sel-sub').forEach(sel => {
    sel.addEventListener('change', function () {
      const z = this.value;
      const rowDiv = this.closest('.y-editor-row');
      const aaSel = rowDiv.querySelector('.y-sel-aa');
      const aa = aaSel && aaSel.value;
      if (!aa || !catMap[aa]) return;
      const subFound = z === catMap[aa].sub;
      if (subFound) {
        const ySel = rowDiv.querySelector('.y-sel-main');
        if (ySel && catMap[aa].main) ySel.value = catMap[aa].main;
      }
    });
  });

  // 「应用」按钮→单行保存
  d.querySelectorAll('.y-apply').forEach(btn => {
    btn.addEventListener('click', function () {
      const rowDiv = this.closest('.y-editor-row');
      const r = parseInt(rowDiv.dataset.row);
      const fields = {};
      rowDiv.querySelectorAll('.y-num').forEach(inp => fields[inp.dataset.col] = parseFloat(inp.value) || 0);
      rowDiv.querySelectorAll('.y-sel').forEach(sel => fields[sel.dataset.col] = sel.value);
      const aaSel = rowDiv.querySelector('.y-sel-aa');
      fields['AA'] = aaSel ? aaSel.value : '';
      const iss = issues.find(i => i.row === r);
      if (!iss) return;
      iss.resolved = 'manual';
      iss.manualVal = JSON.stringify(fields);
      iss.value = fields['Y'] || '';
      rowDiv.style.opacity = '.55';
      toast('已应用 #' + r);
    });
  });

  // 保存→关闭
  d.querySelector('#yEditorCancel').onclick = () => { d.remove(); };
  d.querySelector('#yEditorSave').onclick = () => {
    // 检查所有未应用的行
    let appCount = 0;
    d.querySelectorAll('.y-editor-row').forEach(rowDiv => {
      const r = parseInt(rowDiv.dataset.row);
      const iss = issues.find(i => i.row === r);
      if (iss && iss.resolved === 'manual') appCount++;
    });
    if (appCount < issues.length) {
      // 剩下没点的行自动保存
      d.querySelectorAll('.y-editor-row').forEach(rowDiv => {
        const r = parseInt(rowDiv.dataset.row);
        const iss = issues.find(i => i.row === r);
        if (!iss || iss.resolved === 'manual') return;
        const fields = {};
        rowDiv.querySelectorAll('.y-num').forEach(inp => fields[inp.dataset.col] = parseFloat(inp.value) || 0);
        rowDiv.querySelectorAll('.y-sel').forEach(sel => fields[sel.dataset.col] = sel.value);
        const aaSel = rowDiv.querySelector('.y-sel-aa');
        fields['AA'] = aaSel ? aaSel.value : '';
        iss.resolved = 'manual';
        iss.manualVal = JSON.stringify(fields);
        iss.value = fields['Y'] || '';
      });
    }
    // 更新分组状态
    const el = document.querySelector('.col-group[data-col="Y"] .issue-group');
    if (el) el.classList.toggle('dismissed', issues.every(i => i.resolved));
    updateCounts();
    d.remove();
    toast('已保存 ' + issues.length + ' 条');
  };
}

/* Y列导出：将 manualVal JSON 写回工作表 */
function applyYExport(ws, issues) {
  issues.forEach(i => {
    if (i.resolved !== 'manual' || !i.manualVal) return;
    try {
      const fields = JSON.parse(i.manualVal);
      const r = i.row;
      ['U', 'V', 'W', 'X'].forEach(col => {
        if (fields[col] !== undefined) {
          const addr = col + r;
          const cell = ws[addr];
          if (cell) { if (cell.f) return; cell.v = fields[col]; delete cell.ix; cell.t = 'n'; }
          else { ws[addr] = { t: 'n', v: fields[col] }; }
        }
      });
      ['Y', 'Z', 'AA'].forEach(col => {
        if (fields[col] !== undefined && fields[col] !== '') {
          const addr = col + r;
          const cell = ws[addr];
          if (cell) { if (cell.f) return; cell.v = fields[col]; delete cell.ix; cell.t = 's'; }
          else { ws[addr] = { t: 's', v: fields[col] }; }
        }
      });
    } catch(e) {
      console.warn('Y export error row', i.row, e);
    }
  });
}
