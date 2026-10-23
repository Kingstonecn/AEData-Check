/* ===================================================================
   AE数据分析 — 数据分析仪表盘
   依赖：ECharts 5.x, app.js (S, r2v, r2n, r2s, getMergedVal, serialToDate)
   =================================================================== */
'use strict';

/* ---- 全局 tooltip 互斥：同一时间只显示一个 ---- */
var _anaTipDismissBound = false;
function _anaAllCharts() {
  var list = [];
  Object.keys(ANA.charts).forEach(function(k) {
    var c = ANA.charts[k];
    if (c && c.dispatchAction) list.push(c);
    if (Array.isArray(c)) c.forEach(function(fc) { if (fc && fc.dispatchAction) list.push(fc); });
  });
  return list;
}
function _anaHideOtherTips(exceptChart) {
  _anaAllCharts().forEach(function(c) {
    if (c !== exceptChart) c.dispatchAction({ type: 'hideTip' });
  });
  var calTip = document.getElementById('anaCalTooltip');
  if (calTip && exceptChart !== 'cal') calTip.style.display = 'none';
}
function _anaBindTipDismiss() {
  if (_anaTipDismissBound) return;
  _anaTipDismissBound = true;
  document.addEventListener('mousedown', function(e) {
    if (e.target.closest('.echarts-tooltip')) return;
    if (e.target.closest('[data-tooltip]')) return;
    _anaHideOtherTips(null);
  }, true);
}

const ANA = {
  raw: [],
  filtered: [],
  charts: {},
  hoveredSeriesName: null,
  stackView: 'month',
  stackMode: 'abs',
  stackLossOnly: false,
  stackDateStart: null,
  stackDateEnd: null,
  spanLocked: false,
  stackAssets: null,
  stackAssetsActive: false,
  stackExpand: 'none',
  stackTooltipOff: false,
  stackZoomStart: null,
  stackZoomEnd: null,
  stackAllKeys: null,
  stackZoomPct: null,
  stackMap: null,
  stackCatDetailMap: null,
  stackCatRows: null,
  stackCatGrain: null,
  aeStackView: 'month',
  aeStackMode: 'abs',
  aeStackDateStart: null,
  aeStackDateEnd: null,
  aeSpanLocked: false,
  aeStackAssets: null,
  aeStackAssetsActive: false,
  aeStackExpand: 'none',
  aeStackLegend: 'none',
  aeStackTooltipOff: false,
  aeStackZoomStart: null,
  aeStackZoomEnd: null,
  aeStackAllKeys: null,
  aeStackZoomPct: null,
  aeStackMap: null,
  paretoMode: 'abs',
  paretoDateStart: null,
  paretoDateEnd: null,
  paretoSpanLocked: false,
  paretoAssets: null,
  paretoAssetsActive: false,
  paretoExpand: 'none',
  paretoTooltipOff: false,
  lossCalWorkshop: null,
  lossCalAsset: null,
  lossCalYear: null,
  lossCalMonth: null,
  lossCalTooltipOff: false,
  lossCalExpand: 'none',
  initialized: false
};

/* ---- 数据提取 ---- */
function extractRawData() {
  const ws = S.ws, max = S.maxRow;
  const rows = [];
  for (let r = S.dataStart; r <= max; r++) {
    const dv = r2v(ws, 'C', r);
    let dateStr = null;
    if (dv instanceof Date) { dateStr = dv; }
    else if (typeof dv === 'number') { dateStr = serialToDate(dv); }
    else if (typeof dv === 'string') { const d = _parseDateLocal(dv); if (!isNaN(d.getTime())) { dateStr = d; } }
    rows.push({
      row: r,
      workshop: String(getMergedVal(ws, 'A', r) || '').trim(),
      month: (r2s(ws, 'B', r) || '').trim(),
      date: dateStr,
      shift: (r2s(ws, 'D', r) || '').trim(),
      line: String(getMergedVal(ws, 'F', r) || '').trim(),
      status: (r2s(ws, 'G', r) || '').trim(),
      product: (r2s(ws, 'H', r) || '').trim(),
      asset: (r2s(ws, 'I', r) || '').trim(),
      actual: r2n(ws, 'K', r),
      lossTime: r2n(ws, 'P', r),
      reason: (r2s(ws, 'Q', r) || '').trim(),
      category: (r2s(ws, 'R', r) || '').trim(),
      equipment: (r2s(ws, 'S', r) || '').trim(),
      component: (r2s(ws, 'T', r) || '').trim(),
      oae: r2n(ws, 'U', r),
      sl: r2n(ws, 'V', r),
      ul: r2n(ws, 'W', r),
      bo: r2n(ws, 'X', r),
      mainCat: (r2s(ws, 'Y', r) || '').trim(),
      individual: (r2s(ws, 'AA', r) || '').trim(),
      shiftHours: S.shiftHours.get(r) || 12,
      startSerial: readTimeSerial(ws, 'N', r),
      endSerial: readTimeSerial(ws, 'O', r)
    });
  }
  return rows;
}

/* ---- 疑误修订同步：把数据检查中已采纳/手改的值应用到分析层 ---- */
var ANA_COL_FIELD = {A:'workshop',B:'month',C:'date',D:'shift',F:'line',G:'status',H:'product',I:'asset',K:'actual',N:'startSerial',O:'endSerial',P:'lossTime',Q:'reason',R:'category',S:'equipment',T:'component',U:'oae',V:'sl',W:'ul',X:'bo',Y:'mainCat',AA:'individual'};
/* 本地时间逐段解析 YMD[-T ]H:M[:S]，避免 new Date('YYYY-MM-DD') 按 UTC 解析导致日期偏移 */
function _parseDateLocal(v) {
  var m = String(v).trim().replace(/：/g, ':').match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (m) return new Date(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  return new Date(String(v));
}
/* 修订 D/F/C 后 S.shiftHours 已过期：按修正后的分析数据重算每行班制时长（中班组→8h） */
function _anaRecomputeShiftHours() {
  var ghm = {};
  ANA.raw.forEach(function(r) {
    if (!(r.date instanceof Date)) return;
    var s = r.shift;
    if (s && String(s).indexOf('中班') >= 0) {
      var dk = r.date.getFullYear() + '-' + (r.date.getMonth() + 1) + '-' + r.date.getDate();
      if (r.line) ghm[dk + '|' + r.workshop + '|' + r.line] = 1;
      ghm[dk + '|' + r.workshop] = 1;
    }
  });
  ANA.raw.forEach(function(r) {
    if (!(r.date instanceof Date)) { r.shiftHours = (S.shiftHours && S.shiftHours.get(r.row)) || 12; return; }
    var dk = r.date.getFullYear() + '-' + (r.date.getMonth() + 1) + '-' + r.date.getDate();
    r.shiftHours = ((r.line && ghm[dk + '|' + r.workshop + '|' + r.line]) || ghm[dk + '|' + r.workshop]) ? 8 : 12;
  });
}
var ANA_NUM_COLS = {J:1,K:1,L:1,M:1,P:1,U:1,V:1,W:1,X:1};
function _anaApplyCell(row, col, v) {
  var fld = ANA_COL_FIELD[col];
  if (!fld) return;
  if (v == null || v === '␣' || v === '-' || v === '') {
    row[fld] = (col === 'C' || col === 'N' || col === 'O') ? null : (ANA_NUM_COLS[col] ? 0 : '');
    return;
  }
  if (col === 'C') {
    var d = v instanceof Date ? v : (typeof v === 'number' ? serialToDate(v) : _parseDateLocal(v));
    if (!isNaN(d.getTime())) row[fld] = d;
    return;
  }
  if (col === 'N' || col === 'O') {
    if (typeof v === 'number') { row[fld] = v; return; }
    var d2 = _parseDateLocal(v);
    if (!isNaN(d2.getTime())) row[fld] = toExcelSerial(d2);
    return;
  }
  if (ANA_NUM_COLS[col]) { var n = Number(v); if (!isNaN(n)) row[fld] = n; return; }
  row[fld] = String(v).trim();
}
function anaApplyIssueFixes() {
  var byRow = {};
  ANA.raw.forEach(function(r) { byRow[r.row] = r; });
  var mergedCol = {A: 1, F: 1};
  function applyToRow(r, col, v) {
    _anaApplyCell(r, col, v);
    /* A/F 列存在合并单元格：疑误只记录在组头行，修订需同步到合并范围内所有行 */
    var mm = mergedCol[col] && S.dict && S.dict.mergedMap && S.dict.mergedMap[col];
    if (mm) {
      Object.keys(mm).forEach(function(rStr) {
        if (mm[rStr] === r.row && +rStr !== r.row && byRow[rStr]) _anaApplyCell(byRow[rStr], col, v);
      });
    }
  }
  var timeFixedRows = {};
  var pFixedRows = {};
  var vwxFixedRows = {};
  var uFixedRows = {};
  S.issues.forEach(function(i) {
    if (i.resolved !== 'accept' && i.resolved !== 'manual') return;
    var row = byRow[i.row];
    if (!row) return;
    var multiApplied = false;
    if (i.resolved === 'manual' && i.manualVal) {
      try {
        var f = JSON.parse(i.manualVal);
        if (f && typeof f === 'object') {
          Object.keys(f).forEach(function(c) {
            applyToRow(row, c, f[c]);
            if (c === 'N' || c === 'O') timeFixedRows[row.row] = row;
            if (c === 'P') pFixedRows[row.row] = 1;
            if (c === 'V' || c === 'W' || c === 'X') vwxFixedRows[row.row] = row;
            if (c === 'U') uFixedRows[row.row] = 1;
          });
          multiApplied = true;
        }
      } catch (e) {}
    }
    if (!multiApplied) {
      applyToRow(row, i.col, i.value);
      if (i.col === 'N' || i.col === 'O') timeFixedRows[row.row] = row;
      if (i.col === 'P') pFixedRows[row.row] = 1;
      if (i.col === 'V' || i.col === 'W' || i.col === 'X') vwxFixedRows[row.row] = row;
      if (i.col === 'U') uFixedRows[row.row] = 1;
    }
  });
  /* N/O 被修订后原表 P 列公式(#VALUE!)读数为 0：按新起止时间重算损失时长 */
  Object.keys(timeFixedRows).forEach(function(rk) {
    if (pFixedRows[rk]) return;
    var r = timeFixedRows[rk];
    if (r.startSerial != null && r.endSerial != null && r.endSerial >= r.startSerial) {
      r.lossTime = +((r.endSerial - r.startSerial) * 24).toFixed(2);
    }
  });
  /* V/W/X 被修订且 U 未单独指定：OAE 按原公式基数(=N-V-W-X)重算，原缓存值可能是 #VALUE!=0 */
  Object.keys(vwxFixedRows).forEach(function(rk) {
    if (uFixedRows[rk]) return;
    var r = vwxFixedRows[rk];
    var uc = S.ws['U' + r.row];
    if (!uc || !uc.f) return;
    var fm = String(uc.f).match(/^(?:=\s*)?(\d+)\s*-/);
    if (!fm) return;
    r.oae = +(parseInt(fm[1]) - r.sl - r.ul - r.bo).toFixed(2);
  });
}
function _anaRefreshWsAssetMap() {
  var map = ANA.wsAssetMap || {};
  Object.keys(map).forEach(function(k) { delete map[k]; });
  ANA.raw.forEach(function(r) {
    if (!r.workshop) return;
    if (!map[r.workshop]) map[r.workshop] = new Set();
    if (r.asset) map[r.workshop].add(r.asset);
  });
  ANA.wsAssetMap = map;
}

/* ---- 筛选 ---- */
function applyAnaFilters() {
  ANA.filtered = ANA.raw.slice();
}

/* ---- 共享辅助 ---- */
function anaFmtH(v) { return v.toLocaleString('en-US', {maximumFractionDigits:0}) + 'h'; }
function anaFmtT(v) { return (v / 1000).toLocaleString('en-US', {maximumFractionDigits:0}) + '\u00A0t'; }
function anaAssetSort(a, b) {
  const am = a.match(/^(\D*)(\d+)/), bm = b.match(/^(\D*)(\d+)/);
  if (am && bm && am[1] === bm[1]) return parseInt(am[2]) - parseInt(bm[2]);
  return a.localeCompare(b);
}
function anaWsAssetSort(a, b) {
  const [wa, aa] = a.split('|'), [wb, ab] = b.split('|');
  if (wa !== wb) return wa.localeCompare(wb);
  return anaAssetSort(aa, ab);
}
function anaDateKey(row, offsetDays, grain) {
  if (!row.date || !(row.date instanceof Date)) return null;
  const d = new Date(row.date.getTime() + offsetDays * 86400000);
  if (grain === 'day') return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  if (grain === 'week') {
    /* 一周从周四开始：归并到本周四 */
    var day = d.getDay();
    var wkStart = new Date(d);
    wkStart.setDate(d.getDate() - ((day - 4 + 7) % 7));
    return wkStart.getFullYear() + '-' + String(wkStart.getMonth() + 1).padStart(2, '0') + '-' + String(wkStart.getDate()).padStart(2, '0');
  }
  if (grain === 'year') return d.getFullYear() + '年';
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function anaAggregate(rows, grain) {
  const map = {};
  function addToMap(key, oae, sl, ul, bo, actual, count) {
    if (!key) return;
    if (!map[key]) map[key] = { oae: 0, sl: 0, ul: 0, bo: 0, actual: 0, count: 0 };
    map[key].oae += oae; map[key].sl += sl; map[key].ul += ul; map[key].bo += bo; map[key].actual += actual; map[key].count += count;
  }
  rows.forEach(r => {
    const cmf = crossMidnightFrac(r.shift, r.shiftHours);
    if (cmf) {
      addToMap(anaDateKey(r, 0, grain), r.oae * cmf[0], r.sl * cmf[0], r.ul * cmf[0], r.bo * cmf[0], r.actual * cmf[0], cmf[0]);
      addToMap(anaDateKey(r, 1, grain), r.oae * cmf[1], r.sl * cmf[1], r.ul * cmf[1], r.bo * cmf[1], r.actual * cmf[1], cmf[1]);
    } else {
      addToMap(anaDateKey(r, 0, grain), r.oae, r.sl, r.ul, r.bo, r.actual, 1);
    }
  });
  return map;
}
function anaAggregateCatDetail(rows, grain) {
  var catMap = {};
  rows.forEach(function(r) {
    var cat = r.mainCat || '(空)';
    var ind = r.individual || '(空)';
    var catKey = cat + '\x00' + ind;
    var cmf = crossMidnightFrac(r.shift, r.shiftHours);
    var fracs = cmf ? [{ off: 0, f: cmf[0] }, { off: 1, f: cmf[1] }] : [{ off: 0, f: 1 }];
    fracs.forEach(function(fr) {
      var key = anaDateKey(r, fr.off, grain);
      if (!key) return;
      if (!catMap[key]) catMap[key] = {};
      if (!catMap[key][catKey]) catMap[key][catKey] = { oae: 0, sl: 0, ul: 0, bo: 0, count: 0, mainCat: cat, individual: ind };
      catMap[key][catKey].oae += r.oae * fr.f;
      catMap[key][catKey].sl += r.sl * fr.f;
      catMap[key][catKey].ul += r.ul * fr.f;
      catMap[key][catKey].bo += r.bo * fr.f;
      catMap[key][catKey].count += fr.f;
    });
  });
  return catMap;
}
function anaFmtSeries(map, keys, isPct, lossOnly, ulOnly, totMap, useCount) {
  function fmtData(field) {
    return keys.map(k => {
      const v = map[k];
      if (useCount) {
        var t = totMap ? totMap[k] : v;
        var tot = t.count;
        if (isPct) return tot > 0 ? +(v.count / tot * 100).toFixed(1) : 0;
        return v.count;
      }
      var t2 = totMap ? totMap[k] : v;
      var tot2 = ulOnly ? t2.ul : lossOnly ? t2.sl + t2.ul : t2.oae + t2.sl + t2.ul + t2.bo;
      if (isPct) return tot2 > 0 ? +(v[field] / tot2 * 100).toFixed(1) : 0;
      return +v[field].toFixed(1);
    });
  }
  return {
    oae: fmtData('oae'), sl: fmtData('sl'), ul: fmtData('ul'), bo: fmtData('bo'),
    actual: keys.map(k => +map[k].actual.toFixed(0)),
    count: keys.map(k => map[k].count)
  };
}
function anaTooltipFormatter(isPct, localData) {
  var fields = (localData && localData.fields) || [
    {name:'OAE', key:'oae', color:'#0070c0'},
    {name:'SL', key:'sl', color:'#ffc000'},
    {name:'UL', key:'ul', color:'#ff0000'},
    {name:'BO', key:'bo', color:'#00b050'}
  ];
  var showTotal = !localData || localData.showTotal !== false;
  var showOutput = !localData || localData.showOutput !== false;
  return function(params) {
    var key = params[0].axisValue;
    var map = (localData && localData.map) || ANA.stackMap;
    var catRows = (localData && localData.catRows) || ANA.stackCatRows;
    var catGrain = (localData && localData.catGrain) || ANA.stackCatGrain;
    var catDetailMap = (localData && localData.catDetailMap) || ANA.stackCatDetailMap;
    var mode = (localData && localData.mode) || ANA.stackMode;
    var viewMode = (localData && localData.view) || ANA.stackView;
    if (!catDetailMap && catRows) { catDetailMap = anaAggregateCatDetail(catRows, catGrain); if (localData) { localData.catDetailMap = catDetailMap; } else { ANA.stackCatDetailMap = catDetailMap; } }
    var v = map && map[key];
    var useCount = mode === 'count' || mode === 'countpct';
    var titleHtml = key;
    if (viewMode === 'week') {
      var parts = key.split('-');
      var wkDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      var jan1 = new Date(wkDate.getFullYear(), 0, 1);
      var jan1WkStart = new Date(jan1);
      jan1WkStart.setDate(jan1.getDate() - ((jan1.getDay() - 4 + 7) % 7));
      var weekNum = Math.round((wkDate - jan1WkStart) / (7 * 86400000)) + 1;
      var wkEnd = new Date(wkDate);
      wkEnd.setDate(wkEnd.getDate() + 6);
      var wkEndStr = String(wkEnd.getMonth() + 1).padStart(2, '0') + '-' + String(wkEnd.getDate()).padStart(2, '0');
      titleHtml = '<span>' + key + ' ~ ' + wkEndStr + '</span><span style="float:right;margin-left:1em">第' + weekNum + '周</span>';
    }
    var s = '<div style="font-weight:700;margin-bottom:4px;overflow:hidden">' + titleHtml + '</div>';
    if (v && mode !== 'output') {
      var tot = fields.reduce(function(s, f) { return s + v[f.key]; }, 0);
      var pctDen = (localData && localData.shareTotal != null) ? localData.shareTotal : tot;
      function pct(val) { return pctDen > 0 ? (val / pctDen * 100).toFixed(1) + '%' : '0%'; }
      function fmtH1(val) { return val.toLocaleString('en-US', {maximumFractionDigits:1, minimumFractionDigits:1}) + 'h'; }
      function fmtVal(val) { return useCount ? String(Math.round(val)) + '次' : fmtH1(val); }
      s += '<table style="border-collapse:collapse;font-size:12px"><tbody>';
      if (showTotal) {
        s += '<tr><td style="color:#7030a0;padding:1px 8px 1px 0">Total</td><td style="color:#7030a0;text-align:right;padding:1px 8px 1px 0">' + fmtVal(tot) + '</td>' + (useCount ? '<td></td>' : '<td style="color:#7030a0;text-align:right;padding:1px 0">' + (v.actual / 1000).toLocaleString('en-US', {maximumFractionDigits:0}) + 't</td>') + '</tr>';
      }
      fields.forEach(function(f) {
        s += '<tr><td style="color:' + f.color + ';padding:1px 8px 1px 0">' + f.name + '</td><td style="color:' + f.color + ';text-align:right;padding:1px 8px 1px 0">' + fmtVal(v[f.key]) + '</td><td style="color:' + f.color + ';text-align:right;padding:1px 0">' + pct(v[f.key]) + '</td></tr>';
      });
      if (localData && localData.legendGroups && localData.legendGroups.length > 0) {
        var hovered = ANA.hoveredSeriesName;
        var filterByHover = localData.legendDim === 'equipment';
        localData.legendGroups.forEach(function(g) {
          if (filterByHover && hovered && g.name !== hovered) return;
          var gv = g.map[key];
          var val = gv ? (useCount ? gv.count : gv.ul) : 0;
          if (val <= 0.01) return;
          s += '<tr><td style="color:' + g.color + ';padding:1px 8px 1px 0;text-align:left">' + escXml(String(g.name).trim()) + '</td><td style="color:' + g.color + ';text-align:right;padding:1px 8px 1px 0">' + fmtVal(val) + '</td><td style="color:' + g.color + ';text-align:right;padding:1px 0">' + pct(val) + '</td></tr>';
        });
      }
      s += '</tbody></table>';
    } else if (v && mode === 'output' && showOutput) {
      s += '<div><span style="color:#7030a0">产量 ' + anaFmtT(v.actual) + '</span></div>';
    }
    if (localData && localData.legendGroups && mode !== 'output') {
      var hovered = ANA.hoveredSeriesName;
      var hovGroup = null;
      for (var gi = 0; gi < localData.legendGroups.length; gi++) {
        if (localData.legendGroups[gi].name === hovered && localData.legendGroups[gi].compMap) { hovGroup = localData.legendGroups[gi]; break; }
      }
      if (hovGroup) {
        var compEntries = Object.keys(hovGroup.compMap).map(function(comp) {
          var cv = hovGroup.compMap[comp][key];
          return { comp: comp, val: cv ? (useCount ? cv.count : cv.ul) : 0 };
        }).filter(function(e) { return e.val > 0.01; }).sort(function(a, b) { return b.val - a.val; }).slice(0, 10);
        if (compEntries.length > 0) {
          var compTotal = compEntries.reduce(function(s, e) { return s + e.val; }, 0);
          s += '<div style="border-top:1px solid #ddd;padding-top:4px;margin-top:4px;font-size:.85em">';
          s += '<table style="border-collapse:collapse;width:100%;font-size:11px"><thead><tr style="opacity:.6"><td style="padding:1px 6px 1px 0">故障组件</td><td style="text-align:right;padding:1px 0">' + (useCount ? '频次' : '时长') + '</td><td style="text-align:right;padding:1px 0">占比</td></tr></thead><tbody>';
          compEntries.forEach(function(e) {
            var ePct = compTotal > 0 ? (e.val / compTotal * 100).toFixed(1) + '%' : '0%';
            var eValStr = useCount ? Math.round(e.val) + '次' : e.val.toFixed(1) + 'h';
            s += '<tr><td style="padding:1px 6px 1px 0;text-align:left">' + escXml(String(e.comp).trim()) + '</td><td style="text-align:right;padding:1px 6px 1px 0">' + eValStr + '</td><td style="text-align:right;padding:1px 0">' + ePct + '</td></tr>';
          });
          s += '</tbody></table></div>';
        }
      }
    }
    if (catDetailMap && catDetailMap[key] && mode !== 'output') {
      var hoveredSeries2 = ANA.hoveredSeriesName;
      var fieldMap2 = {};
      fields.forEach(function(f) { fieldMap2[f.name] = f.key; });
      var field2 = fieldMap2[hoveredSeries2];
      if (field2) {
        var detailCats = catDetailMap[key];
        var detailEntries = Object.keys(detailCats).map(function(c) {
          return { mainCat: detailCats[c].mainCat, individual: detailCats[c].individual, val: detailCats[c][field2] };
        });
        if (field2 === 'bo') {
          var boTotal = detailEntries.reduce(function(s, e) { return s + e.val; }, 0);
          detailEntries = boTotal > 0.01 ? [{ mainCat: 'BO', individual: 'lack of demand 无需求', val: boTotal }] : [];
        }
        detailEntries = detailEntries
          .filter(function(e) { return e.val > 0.01; })
          .sort(function(a, b) { return b.val - a.val; })
          .slice(0, 10);
        if (detailEntries.length > 0) {
          var detailTotal = detailEntries.reduce(function(s, e) { return s + e.val; }, 0);
          s += '<div style="border-top:1px solid #ddd;padding-top:4px;margin-top:4px;font-size:.85em">';
          s += '<table style="border-collapse:collapse;width:100%;font-size:11px"><thead><tr style="opacity:.6"><td style="padding:1px 6px 1px 0">主AE分类</td><td style="padding:1px 6px 1px 0">AE分类</td><td style="text-align:right;padding:1px 0">' + (useCount ? '频次' : '时长') + '</td><td style="text-align:right;padding:1px 0">占比</td></tr></thead><tbody>';
          detailEntries.forEach(function(e) {
            var ePct = detailTotal > 0 ? (e.val / detailTotal * 100).toFixed(1) + '%' : '0%';
            var eValStr2 = useCount ? Math.round(e.val) + '次' : e.val.toFixed(1) + 'h';
            s += '<tr><td style="padding:1px 6px 1px 0">' + escXml(e.mainCat) + '</td><td style="padding:1px 6px 1px 0">' + escXml(e.individual) + '</td><td style="text-align:right;padding:1px 6px 1px 0">' + eValStr2 + '</td><td style="text-align:right;padding:1px 0">' + ePct + '</td></tr>';
          });
          s += '</tbody></table>';
          s += '</div>';
        }
      }
    }
    return s;
  };
}

/* ---- KPI 统计条 ---- */
function anaKpiSums(rows) {
  var oae = 0, sl = 0, ul = 0, bo = 0, actual = 0, count = 0;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    oae += r.oae; sl += r.sl; ul += r.ul; bo += r.bo; actual += r.actual; count += r.count || 0;
  }
  return { oae: oae, sl: sl, ul: ul, bo: bo, actual: actual, count: count, total: oae + sl + ul + bo };
}
function anaKpiHtml(s, mode, lossOnly, ulOnly) {
  function pct(v, t) { return t > 0 ? (v / t * 100).toFixed(1) + '%' : '0%'; }
  if (mode === 'output') {
    return '<span class="zk-item"><span class="zk-val" style="color:#7030a0">' + anaFmtT(s.actual) + '</span><span class="zk-pct" style="color:#7030a0">产量</span></span>';
  }
  var lossTot = s.sl + s.ul;
  var cards = ulOnly ? [
    { label: 'UL', val: anaFmtH(s.ul), pct: '', color: '#b1281e' }
  ] : lossOnly ? [
    { label: 'SL', val: anaFmtH(s.sl), pct: pct(s.sl, lossTot), color: '#ffc000' },
    { label: 'UL', val: anaFmtH(s.ul), pct: pct(s.ul, lossTot), color: '#ff0000' }
  ] : [
    { label: 'OAE', val: anaFmtH(s.oae), pct: pct(s.oae, s.total), color: '#0070c0' },
    { label: 'SL', val: anaFmtH(s.sl), pct: pct(s.sl, s.total), color: '#ffc000' },
    { label: 'UL', val: anaFmtH(s.ul), pct: pct(s.ul, s.total), color: '#ff0000' },
    { label: 'BO', val: anaFmtH(s.bo), pct: pct(s.bo, s.total), color: '#00b050' },
    { label: '产量', val: anaFmtT(s.actual), pct: '', color: '#7030a0' }
  ];
  return cards.map(function(c) {
    return '<span class="zk-item"><span class="zk-val" style="color:' + c.color + '">' + c.val + '</span><span class="zk-pct" style="color:' + c.color + '">' + (c.pct ? c.label + ' ' + c.pct : c.label) + '</span></span>';
  }).join('<span style="opacity:.3">/</span>');
}
function renderKPI() {
  /* 时长/产量口径与图表一致：仅统计含有效日期的行；行数仍为全部载入行 */
  var datedRows = ANA.filtered.filter(function(r) { return r.date instanceof Date; });
  const s = anaKpiSums(datedRows);
  function pct(v) { return s.total > 0 ? (v / s.total * 100).toFixed(1) + '%' : '0%'; }
  $('#anaCntRows').textContent = ANA.filtered.length;
  var uniqueDays = new Set();
  datedRows.forEach(function(r) {
    uniqueDays.add(r.date.getFullYear() + '-' + r.date.getMonth() + '-' + r.date.getDate());
  });
  $('#anaCntDays').textContent = uniqueDays.size;
  $('#anaCntOae').textContent = anaFmtH(s.oae);
  $('#anaCntOaePct').textContent = pct(s.oae);
  $('#anaCntSl').textContent = anaFmtH(s.sl);
  $('#anaCntSlPct').textContent = pct(s.sl);
  $('#anaCntUl').textContent = anaFmtH(s.ul);
  $('#anaCntUlPct').textContent = pct(s.ul);
  $('#anaCntBo').textContent = anaFmtH(s.bo);
  $('#anaCntBoPct').textContent = pct(s.bo);
  $('#anaCntVol').textContent = (s.actual / 1000).toLocaleString('en-US', {maximumFractionDigits:0}) + '\u00A0t';
}

/* ---- 时间分布总览 ---- */
/* 生产日定义为 8:00AM-次日 8:00AM，C列日期为操作员认定的班次日期，不做跨午夜拆分 */
function crossMidnightFrac(shift, hours) {
  return null;
}
function renderZoomKpi(map, keys, elId, zoomStart, zoomEnd, mode, lossOnly, ulOnly) {
  var zi = 0, zj = keys.length - 1;
  if (zoomStart && zoomEnd) {
    for (var i = 0; i < keys.length; i++) { if (keys[i] >= zoomStart) { zi = i; break; } }
    for (var j = keys.length - 1; j >= 0; j--) { if (keys[j] <= zoomEnd) { zj = j; break; } }
  }
  var el = $('#' + elId);
  if (!el) return;
  var zoomRows = [];
  for (var i = zi; i <= zj; i++) { zoomRows.push(map[keys[i]]); }
  if (mode === 'count' || mode === 'countpct') {
    var s = anaKpiSums(zoomRows);
    el.innerHTML = '<span class="zk-item"><span class="zk-val" style="color:#b1281e">' + s.count + '</span><span class="zk-pct" style="color:#b1281e">频次</span></span>';
  } else {
    el.innerHTML = anaKpiHtml(anaKpiSums(zoomRows), mode, lossOnly, ulOnly);
  }
}
function stackFilteredRows() {
  var rows = ANA.stackAssetsActive ? (ANA.stackAssets && ANA.stackAssets.size ? ANA.filtered.filter(r => ANA.stackAssets.has(r.workshop + '|' + r.asset)) : []) : ANA.filtered;
  if (ANA.stackDateStart || ANA.stackDateEnd) {
    rows = rows.filter(function(r) {
      if (!r.date || !(r.date instanceof Date)) return false;
      var ds = r.date.getFullYear() + '-' + String(r.date.getMonth() + 1).padStart(2, '0') + '-' + String(r.date.getDate()).padStart(2, '0');
      if (ANA.stackDateStart && ds < ANA.stackDateStart) return false;
      if (ANA.stackDateEnd && ds > ANA.stackDateEnd) return false;
      return true;
    });
  }
  return rows;
}
function renderStackView() {
  const rows = stackFilteredRows();
  const grain = ANA.stackView;
  const isPct = ANA.stackMode === 'pct';
  const isOutput = ANA.stackMode === 'output';
  const isLoss = ANA.stackLossOnly;
  const map = anaAggregate(rows, grain);
  const keys = Object.keys(map).sort();
  const series = anaFmtSeries(map, keys, isPct, isLoss);
  ANA.stackMap = map;
  ANA.stackCatRows = rows;
  ANA.stackCatGrain = grain;
  ANA.stackCatDetailMap = null;

  const showLabel = keys.length <= 24;
  function lblFmt(v) { return v >= 1000 ? v.toLocaleString('en-US', {maximumFractionDigits:0}) : String(Math.round(v)); }
  const barLabel = showLabel ? { show: true, position: 'inside', fontSize: 8, color: '#fff', hideOverlap: true, formatter: function(p) { return p.value > 0 ? lblFmt(p.value) + (isPct ? '%' : '') : ''; } } : { show: false };
  const lineLabel = showLabel ? { show: true, position: 'top', fontSize: 8, color: '#7030a0', hideOverlap: true, formatter: function(p) { return p.value > 0 ? (p.value / 1000).toLocaleString('en-US', {maximumFractionDigits:0}) + 't' : ''; } } : { show: false };

  const el = $('#stackViewChart');
  let chart = ANA.charts.stackView;
  if (!chart) {
    chart = echarts.init(el); ANA.charts.stackView = chart;
    chart.on('mouseover', function(p) { if (p.seriesName) ANA.hoveredSeriesName = p.seriesName; _anaHideOtherTips(chart); });
    chart.on('globalout', function() { ANA.hoveredSeriesName = null; });
    chart.on('datazoom', function(params) {
      var p = (params.batch && params.batch[0]) || params;
      ANA.stackZoomPct = { start: p.start, end: p.end };
      var kr = _facetZoomKeyRange(ANA.stackAllKeys || [], ANA.stackZoomPct);
      if (kr) {
        ANA.stackZoomStart = kr.startKey;
        ANA.stackZoomEnd = kr.endKey;
      }
      renderZoomKpi(ANA.stackMap || {}, ANA.stackAllKeys || [], 'anaZoomKpi', ANA.stackZoomStart, ANA.stackZoomEnd, ANA.stackMode, ANA.stackLossOnly);
    });
  }
  var stackLocalData = { map: map, catRows: rows, catGrain: grain, mode: ANA.stackMode, view: ANA.stackView, showTotal: !isLoss, showOutput: !isLoss, fields: isLoss ? [
    {name:'SL', key:'sl', color:'#ffc000'},
    {name:'UL', key:'ul', color:'#ff0000'}
  ] : undefined };
  chart.setOption({
    tooltip: { show: !ANA.stackTooltipOff, trigger: 'axis', axisPointer: { type: 'cross' }, formatter: anaTooltipFormatter(isPct, stackLocalData) },
    legend: { data: isOutput ? ['产量'] : (isLoss ? ['SL', 'UL'] : ['OAE', 'SL', 'UL', 'BO', '产量']), top: 5 },
    grid: { left: '8%', right: '8%', bottom: '12%', top: '18%' },
    dataZoom: [
      { type: 'inside', start: (ANA.stackZoomPct || { start: 0 }).start, end: (ANA.stackZoomPct || { end: 100 }).end }
    ],
    xAxis: { type: 'category', data: keys, axisLabel: { fontSize: 10, rotate: keys.length > 15 ? 35 : 0, hideOverlap: true } },
    yAxis: isOutput ? [
      { type: 'value', name: '产量', splitLine: { show: true } }
    ] : isLoss ? [
      { type: 'value', name: isPct ? '%' : '小时', max: isPct ? 100 : undefined, splitLine: { show: true } }
    ] : [
      { type: 'value', name: isPct ? '%' : '小时', max: isPct ? 100 : undefined, splitLine: { show: true } },
      { type: 'value', name: '产量', position: 'right', splitLine: { show: false }, axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false } }
    ],
    series: isOutput ? [
      { name: '产量', type: 'line', data: series.actual, smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: '#7030a0' }, itemStyle: { color: '#7030a0' }, label: lineLabel, areaStyle: { color: 'rgba(112,48,160,0.1)' } }
    ] : isLoss ? [
      { name: 'SL', type: 'bar', stack: 'total', data: series.sl, itemStyle: { color: '#ffc000' }, label: barLabel },
      { name: 'UL', type: 'bar', stack: 'total', data: series.ul, itemStyle: { color: '#ff0000' }, label: barLabel }
    ] : [
      { name: 'OAE', type: 'bar', stack: 'total', data: series.oae, itemStyle: { color: '#0070c0' }, label: barLabel },
      { name: 'SL', type: 'bar', stack: 'total', data: series.sl, itemStyle: { color: '#ffc000' }, label: barLabel },
      { name: 'UL', type: 'bar', stack: 'total', data: series.ul, itemStyle: { color: '#ff0000' }, label: barLabel },
      { name: 'BO', type: 'bar', stack: 'total', data: series.bo, itemStyle: { color: '#00b050' }, label: barLabel },
      { name: '产量', type: 'line', yAxisIndex: 1, data: series.actual, smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: '#7030a0' }, itemStyle: { color: '#7030a0' }, label: lineLabel }
    ]
  }, true);

  ANA.stackAllKeys = keys;
  var _kr = _facetZoomKeyRange(keys, ANA.stackZoomPct || { start: 0, end: 100 });
  ANA.stackZoomStart = _kr ? _kr.startKey : null;
  ANA.stackZoomEnd = _kr ? _kr.endKey : null;
  renderZoomKpi(map, keys, 'anaZoomKpi', ANA.stackZoomStart, ANA.stackZoomEnd, ANA.stackMode, isLoss);

  if (ANA.stackExpand !== 'none') {
    $('#stackViewChart').style.display = 'none';
    renderStackFacet(rows, ANA.stackExpand);
  } else {
    $('#stackViewChart').style.display = '';
    const fc = $('#stackFacetContainer');
    fc.style.display = 'none';
    fc.innerHTML = '';
    _disposeFacetCharts('stackFacet', 'stackFacetZoom');
  }
}

function _disposeFacetCharts(arrKey, zoomKey) {
  var arr = ANA.charts[arrKey];
  if (Array.isArray(arr)) arr.forEach(function(c) { if (c) c.dispose(); });
  ANA.charts[arrKey] = [];
  if (zoomKey && ANA.charts[zoomKey]) { ANA.charts[zoomKey].dispose(); ANA.charts[zoomKey] = null; }
}

function _facetZoomKeyRange(allKeys, zoomPct) {
  var n = allKeys.length;
  if (!n) return null;
  var zi = Math.max(0, Math.min(n - 1, Math.round((n - 1) * zoomPct.start / 100)));
  var zj = Math.max(0, Math.min(n - 1, Math.round((n - 1) * zoomPct.end / 100)));
  return { startKey: allKeys[zi], endKey: allKeys[zj] };
}

function renderStackFacet(allRows, expandMode) {
  const grain = ANA.stackView;
  const isPct = ANA.stackMode === 'pct';
  const isOutput = ANA.stackMode === 'output';
  const isLoss = ANA.stackLossOnly;
  const container = $('#stackFacetContainer');
  /* 代数令牌：快速切换分面/筛选时作废旧的异步渲染批次 */
  ANA._stackFacetToken = (ANA._stackFacetToken || 0) + 1;

  function getFacetKey(r) {
    if (expandMode === 'workshop') return r.workshop || '';
    if (expandMode === 'line') return (r.workshop && r.line) ? r.workshop + '|' + r.line : '';
    return (r.workshop && r.asset) ? r.workshop + '|' + r.asset : '';
  }
  function facetLabel(key) {
    if (expandMode === 'workshop') return key;
    var parts = key.split('|');
    return parts[0] + ' / ' + parts[1];
  }

  const facetSet = new Set();
  allRows.forEach(r => { var k = getFacetKey(r); if (k) facetSet.add(k); });
  var selectedKeys = [...facetSet].sort();
  if (expandMode === 'asset' || expandMode === 'line') selectedKeys.sort(anaWsAssetSort);
  ANA._stackFacetLabels = selectedKeys.map(facetLabel);
  if (!selectedKeys.length) { container.style.display = 'block'; container.innerHTML = ''; _disposeFacetCharts('stackFacet', 'stackFacetZoom'); return; }

  container.style.display = 'block';
  container.innerHTML = '';
  _disposeFacetCharts('stackFacet', 'stackFacetZoom');

  const rowsByKey = {};
  allRows.forEach(r => {
    var k = getFacetKey(r);
    if (k) { if (!rowsByKey[k]) rowsByKey[k] = []; rowsByKey[k].push(r); }
  });

  var cols = Math.min(selectedKeys.length, 3);
  var rowCount = Math.ceil(selectedKeys.length / cols);
  var chartH = Math.max(160, Math.floor(380 / rowCount));

  var zoomPct = ANA.stackZoomPct || { start: 0, end: 100 };
  var zoomBar = document.createElement('div');
  zoomBar.style.cssText = 'width:100%;height:30px;margin-bottom:4px';
  container.appendChild(zoomBar);
  var grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
  grid.style.gap = '8px';
  container.appendChild(grid);

  /* DOM 与图表实例同步创建，setOption 分批渲染，避免分面多时长时间阻塞 UI */
  selectedKeys.forEach((key) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'stack-facet-item';
    const title = document.createElement('div');
    title.className = 'stack-facet-title';
    title.textContent = facetLabel(key);
    const div = document.createElement('div');
    div.className = 'stack-facet-chart';
    div.style.cssText = 'width:100%;height:' + chartH + 'px';
    wrapper.appendChild(title);
    wrapper.appendChild(div);
    grid.appendChild(wrapper);
    const chart = echarts.init(div);
    ANA.charts.stackFacet.push(chart);
    chart.on('mouseover', function(p) { if (p.seriesName) ANA.hoveredSeriesName = p.seriesName; _anaHideOtherTips(chart); });
    chart.on('globalout', function() { ANA.hoveredSeriesName = null; });
  });

  var myToken = ANA._stackFacetToken;
  ANA._stackFacetFlush = null;

  function renderFacetItem(idx) {
    var key = selectedKeys[idx];
    var chart = ANA.charts.stackFacet[idx];
    if (!chart) return;
    const assetRows = rowsByKey[key] || [];
    const map = anaAggregate(assetRows, grain);
    var keys = ANA.stackAllKeys || Object.keys(map).sort();
    keys.forEach(function(k) { if (!map[k]) map[k] = { oae: 0, sl: 0, ul: 0, bo: 0, actual: 0, count: 0 }; });
    const series = anaFmtSeries(map, keys, isPct, isLoss);
    const showLabel = keys.length <= 24;
    const barLabel = showLabel ? { show: true, position: 'inside', fontSize: 7, color: '#fff', hideOverlap: true, formatter: function(p) { return p.value > 0 ? String(Math.round(p.value)) + (isPct ? '%' : '') : ''; } } : { show: false };
    const lineLabel = showLabel ? { show: true, position: 'top', fontSize: 7, color: '#7030a0', hideOverlap: true, formatter: function(p) { return p.value > 0 ? (p.value / 1000).toLocaleString('en-US', {maximumFractionDigits:0}) + 't' : ''; } } : { show: false };
    var localData = { map: map, catRows: assetRows, catGrain: grain, mode: ANA.stackMode, view: ANA.stackView, showTotal: !isLoss, showOutput: !isLoss, fields: isLoss ? [
      {name:'SL', key:'sl', color:'#ffc000'},
      {name:'UL', key:'ul', color:'#ff0000'}
    ] : undefined };
    chart.setOption({
      tooltip: { show: !ANA.stackTooltipOff, trigger: 'axis', axisPointer: { type: 'cross' }, formatter: anaTooltipFormatter(isPct, localData) },
      legend: { data: isOutput ? ['产量'] : (isLoss ? ['SL', 'UL'] : ['OAE', 'SL', 'UL', 'BO', '产量']), top: 0, textStyle: { fontSize: 9 } },
      grid: { left: '8%', right: '8%', bottom: '18%', top: '15%' },
      dataZoom: [
        { type: 'inside', start: zoomPct.start, end: zoomPct.end, zoomOnMouseWheel: false, moveOnMouseMove: false, moveOnMouseWheel: false }
      ],
      xAxis: { type: 'category', data: keys, axisLabel: { fontSize: 8, rotate: keys.length > 8 ? 45 : 0, hideOverlap: true, interval: 0 } },
      yAxis: isOutput ? [
        { type: 'value', name: '产量', axisLabel: { fontSize: 8 }, splitLine: { show: true } }
      ] : isLoss ? [
        { type: 'value', name: isPct ? '%' : '小时', max: isPct ? 100 : undefined, axisLabel: { fontSize: 8 }, splitLine: { show: true } }
      ] : [
        { type: 'value', name: isPct ? '%' : '小时', max: isPct ? 100 : undefined, axisLabel: { fontSize: 8 }, splitLine: { show: true } },
        { type: 'value', name: '产量', position: 'right', splitLine: { show: false }, axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false } }
      ],
      series: isOutput ? [
        { name: '产量', type: 'line', data: series.actual, smooth: true, symbol: 'circle', symbolSize: 4, lineStyle: { width: 1.5, color: '#7030a0' }, itemStyle: { color: '#7030a0' }, label: lineLabel, areaStyle: { color: 'rgba(112,48,160,0.1)' } }
      ] : isLoss ? [
        { name: 'SL', type: 'bar', stack: 't', data: series.sl, itemStyle: { color: '#ffc000' }, label: barLabel },
        { name: 'UL', type: 'bar', stack: 't', data: series.ul, itemStyle: { color: '#ff0000' }, label: barLabel }
      ] : [
        { name: 'OAE', type: 'bar', stack: 't', data: series.oae, itemStyle: { color: '#0070c0' }, label: barLabel },
        { name: 'SL', type: 'bar', stack: 't', data: series.sl, itemStyle: { color: '#ffc000' }, label: barLabel },
        { name: 'UL', type: 'bar', stack: 't', data: series.ul, itemStyle: { color: '#ff0000' }, label: barLabel },
        { name: 'BO', type: 'bar', stack: 't', data: series.bo, itemStyle: { color: '#00b050' }, label: barLabel },
        { name: '产量', type: 'line', yAxisIndex: 1, data: series.actual, smooth: true, symbol: 'circle', symbolSize: 4, lineStyle: { width: 1.5, color: '#7030a0' }, itemStyle: { color: '#7030a0' }, label: lineLabel }
      ]
    });
  }

  var i = 0;
  function initFacetZoom() {
  var zoomChart = echarts.init(zoomBar);
  ANA.charts.stackFacetZoom = zoomChart;
  var allKeys = ANA.stackAllKeys || [];
  zoomChart.setOption({
    grid: { left: '8%', right: '8%', top: 0, bottom: 0, height: 0 },
    dataZoom: [
      { type: 'slider', show: true, start: zoomPct.start, end: zoomPct.end, top: 5, height: 10, zoomLock: true,
        borderColor: '#ccc', backgroundColor: '#f0f0f0', fillerColor: 'rgba(0,112,192,0.3)',
        handleSize: 18, handleStyle: { color: '#fff', borderColor: '#999', borderWidth: 1 },
        dataBackground: { lineStyle: { color: '#ccc' }, areaStyle: { color: '#e0e0e0' } },
        selectedDataBackground: { lineStyle: { color: '#0070c0' }, areaStyle: { color: 'rgba(0,112,192,0.15)' } },
        textStyle: { color: '#333', fontSize: 11 }, showDetail: true,
        brushSelect: false, moveHandleSize: 0 }
    ],
    xAxis: { type: 'category', data: allKeys, show: false },
    yAxis: { type: 'value', show: false },
    series: [{ type: 'line', data: [] }]
  });
  zoomChart.on('datazoom', function(params) {
    var p = (params.batch && params.batch[0]) || params;
    ANA.stackZoomPct = { start: p.start, end: p.end };
    if (ANA.charts.stackView) ANA.charts.stackView.dispatchAction({ type: 'dataZoom', start: p.start, end: p.end });
    ANA.charts.stackFacet.forEach(function(fc) {
      if (fc) fc.dispatchAction({ type: 'dataZoom', start: p.start, end: p.end });
    });
    var kr = _facetZoomKeyRange(allKeys, ANA.stackZoomPct);
    if (kr) {
      ANA.stackZoomStart = kr.startKey;
      ANA.stackZoomEnd = kr.endKey;
      renderZoomKpi(ANA.stackMap || {}, allKeys, 'anaZoomKpi', ANA.stackZoomStart, ANA.stackZoomEnd, ANA.stackMode, ANA.stackLossOnly);
    }
  });
  }

  ANA._stackFacetFlush = function() {
    if (myToken !== ANA._stackFacetToken) return;
    for (; i < selectedKeys.length; i++) renderFacetItem(i);
    initFacetZoom();
    ANA._stackFacetFlush = null;
  };
  function renderBatch() {
    if (myToken !== ANA._stackFacetToken) return;
    var end = Math.min(i + cols, selectedKeys.length);
    for (; i < end; i++) renderFacetItem(i);
    if (i < selectedKeys.length) requestAnimationFrame(renderBatch);
    else if (ANA._stackFacetFlush) { initFacetZoom(); ANA._stackFacetFlush = null; }
  }
  renderBatch();
}
function buildCompMap(rows, grain, keys) {
  var compMap = {}, compGroups = {};
  rows.forEach(function(r) {
    var comp = r.component || '(空)';
    if (!compGroups[comp]) compGroups[comp] = [];
    compGroups[comp].push(r);
  });
  Object.keys(compGroups).forEach(function(comp) {
    var cMap = anaAggregate(compGroups[comp], grain);
    keys.forEach(function(k) { if (!cMap[k]) cMap[k] = { oae: 0, sl: 0, ul: 0, bo: 0, actual: 0, count: 0 }; });
    compMap[comp] = cMap;
  });
  return compMap;
}
function aeStackFilteredRows() {
  var rows = ANA.aeStackAssetsActive ? (ANA.aeStackAssets && ANA.aeStackAssets.size ? ANA.filtered.filter(r => ANA.aeStackAssets.has(r.workshop + '|' + r.asset)) : []) : ANA.filtered;
  rows = rows.filter(function(r) { return r.category === '设备故障'; });
  if (ANA.aeStackDateStart || ANA.aeStackDateEnd) {
    rows = rows.filter(function(r) {
      if (!r.date || !(r.date instanceof Date)) return false;
      var ds = r.date.getFullYear() + '-' + String(r.date.getMonth() + 1).padStart(2, '0') + '-' + String(r.date.getDate()).padStart(2, '0');
      if (ANA.aeStackDateStart && ds < ANA.aeStackDateStart) return false;
      if (ANA.aeStackDateEnd && ds > ANA.aeStackDateEnd) return false;
      return true;
    });
  }
  return rows;
}
var AE_LEGEND_PALETTE = ['#004995','#085fa4','#1074b4','#188ac3','#209fd2','#007939','#198632','#32932c','#4b9f25','#64ac1e','#c50021','#d12519','#dc4a11','#e86f08','#f39400','#6d6e71','#818285','#959699','#a8aaac','#bcbec0'];
/* 确定性配色：跨步取色使相邻图例色相分离，同名图例项颜色跨渲染保持稳定 */
function aeLegendColors(){const n=AE_LEGEND_PALETTE.length,a=new Array(n);for(let i=0;i<n;i++)a[i]=AE_LEGEND_PALETTE[(i*7)%n];return a;}
function buildLegendGroups(rows, legendDim) {
  var groups = {};
  rows.forEach(function(r) {
    var lk = aeLegendKey(r, legendDim);
    if (!groups[lk]) groups[lk] = [];
    groups[lk].push(r);
  });
  var names = Object.keys(groups);
  if (legendDim === 'wsAsset' || legendDim === 'line') {
    names.sort(function(a, b) { return anaWsAssetSort(a.split(' / ').join('|'), b.split(' / ').join('|')); });
  } else {
    names.sort();
  }
  return { groups: groups, names: names };
}
function convertToPct(keys, map, gMap, useCount) {
  return keys.map(function(k) {
    var tot = useCount ? map[k].count : map[k].ul;
    var val = useCount ? gMap[k].count : gMap[k].ul;
    return tot > 0 ? +(val / tot * 100).toFixed(1) : 0;
  });
}
function buildTotalLabelSeries(keys, map, isPct, useCount, unit, showLabel, fontSize, shareOfTotal) {
  var grand = null;
  if (isPct && shareOfTotal) grand = keys.reduce(function(s, k) { return s + (useCount ? map[k].count : map[k].ul); }, 0);
  var totalLabels = keys.map(function(k) {
    var v = useCount ? map[k].count : +map[k].ul.toFixed(1);
    if (grand != null) return (grand > 0 ? +(v / grand * 100).toFixed(1) : 0) + '%';
    return v + unit;
  });
  var totalLineData = keys.map(function(k) {
    if (isPct) {
      var tot = useCount ? map[k].count : map[k].ul;
      if (grand != null) return grand > 0 ? +(tot / grand * 100).toFixed(1) : 0;
      return tot > 0 ? 100 : 0;
    }
    return useCount ? map[k].count : map[k].ul;
  });
  return { name: '总值', type: 'line', data: totalLineData, symbol: 'none', label: { show: showLabel, position: 'top', fontSize: fontSize, color: '#333', fontWeight: 600, hideOverlap: true, formatter: function(p) { return totalLabels[p.dataIndex]; } }, lineStyle: { width: 0 }, z: 10, silent: true };
}
function aeLegendKey(r, dim) {
  if (dim === 'workshop') return r.workshop || '(空)';
  if (dim === 'line') return (r.workshop || '(空)') + ' / ' + (r.line || '(空)');
  if (dim === 'wsAsset') return (r.workshop || '(空)') + ' / ' + (r.asset || '(空)');
  if (dim === 'shift') return r.shift || '(空)';
  if (dim === 'equipment') return r.equipment || '(空)';
  if (dim === 'mainCat') return r.mainCat || '(空)';
  return '(空)';
}
function renderAeStackView() {
  const rows = aeStackFilteredRows();
  const grain = ANA.aeStackView;
  var mode = ANA.aeStackMode;
  const isPct = mode === 'pct' || mode === 'countpct';
  const useCount = mode === 'count' || mode === 'countpct';
  const map = anaAggregate(rows, grain);
  const keys = Object.keys(map).sort();
  ANA.aeStackMap = map;

  const showLabel = keys.length <= 24;
  function lblFmt(v) { return v >= 1000 ? v.toLocaleString('en-US', {maximumFractionDigits:0}) : String(Math.round(v)); }
  const barLabel = showLabel ? { show: true, position: 'inside', fontSize: 8, color: '#fff', hideOverlap: true, formatter: function(p) { return p.value > 0 ? lblFmt(p.value) + (isPct ? '%' : '') : ''; } } : { show: false };
  var unit = useCount ? '次' : 'h';
  var totalLabelSeries = buildTotalLabelSeries(keys, map, isPct, useCount, unit, showLabel, 9, ANA.aeStackLegend === 'none');

  const el = $('#aeViewChart');
  let chart = ANA.charts.aeStackView;
  if (!chart) {
    chart = echarts.init(el); ANA.charts.aeStackView = chart;
    chart.on('mouseover', function(p) { if (p.seriesName) ANA.hoveredSeriesName = p.seriesName; _anaHideOtherTips(chart); });
    chart.on('globalout', function() { ANA.hoveredSeriesName = null; });
    chart.on('datazoom', function(params) {
      var p = (params.batch && params.batch[0]) || params;
      ANA.aeStackZoomPct = { start: p.start, end: p.end };
      var kr = _facetZoomKeyRange(ANA.aeStackAllKeys || [], ANA.aeStackZoomPct);
      if (kr) {
        ANA.aeStackZoomStart = kr.startKey;
        ANA.aeStackZoomEnd = kr.endKey;
      }
      renderZoomKpi(ANA.aeStackMap || {}, ANA.aeStackAllKeys || [], 'aeZoomKpi', ANA.aeStackZoomStart, ANA.aeStackZoomEnd, ANA.aeStackMode, false, true);
    });
  }

  var legendDim = ANA.aeStackLegend;
  var legendNames, chartSeries, legendData, legendGroups, shareTotal = null;
  if (legendDim !== 'none') {
    var lg = buildLegendGroups(rows, legendDim);
    var groups = lg.groups;
    legendNames = lg.names;
    chartSeries = [];
    legendData = [];
    legendGroups = [];
    var _shuffled = aeLegendColors();
    var blockBorder = legendDim === 'mainCat' ? { borderColor: '#fff', borderWidth: 1, borderType: 'solid' } : null;
    legendNames.forEach(function(name, i) {
      var gMap = anaAggregate(groups[name], grain);
      keys.forEach(function(k) { if (!gMap[k]) gMap[k] = { oae: 0, sl: 0, ul: 0, bo: 0, actual: 0, count: 0 }; });
      var gSeries = anaFmtSeries(gMap, keys, false, true, true, null, useCount);
      var color = _shuffled[i % _shuffled.length];
      legendData.push(name);
      var grp = { name: name, map: gMap, color: color };
      if (legendDim === 'equipment') {
        grp.compMap = buildCompMap(groups[name], grain, keys);
      }
      legendGroups.push(grp);
      var rawData = useCount ? gSeries.count : gSeries.ul;
      if (isPct) {
        rawData = convertToPct(keys, map, gMap, useCount);
      }
      chartSeries.push({ name: name, type: 'bar', stack: 'total', data: rawData, itemStyle: Object.assign({ color: color }, blockBorder), label: barLabel });
    });
  } else {
    var series = anaFmtSeries(map, keys, false, true, true, null, useCount);
    legendNames = ['UL'];
    legendData = ['UL'];
    var rawUl = useCount ? series.count : series.ul;
    var grandUl = keys.reduce(function(s, k) { return s + (useCount ? map[k].count : map[k].ul); }, 0);
    shareTotal = grandUl;
    if (isPct) {
      /* 无图例时桶内分母即自身，恒为100%无信息量——改为占全期总量，各柱之和为100% */
      rawUl = keys.map(function(k) {
        var v = useCount ? map[k].count : map[k].ul;
        return grandUl > 0 ? +(v / grandUl * 100).toFixed(1) : 0;
      });
    }
    chartSeries = [
      { name: 'UL', type: 'bar', stack: 'total', data: rawUl, itemStyle: { color: '#ff0000' }, label: barLabel }
    ];
  }

  var aeLocalData = { map: map, catRows: rows, catGrain: grain, catDetailMap: null, mode: ANA.aeStackMode, view: ANA.aeStackView, showTotal: false, showOutput: false, legendDim: legendDim, fields: [
    {name:'UL', key: useCount ? 'count' : 'ul', color:'#ff0000'}
  ] };
  if (legendGroups) aeLocalData.legendGroups = legendGroups;
  if (shareTotal != null) aeLocalData.shareTotal = shareTotal;
  chartSeries.push(totalLabelSeries);
  chart.setOption({
    tooltip: { show: !ANA.aeStackTooltipOff, trigger: 'axis', axisPointer: { type: 'cross' }, formatter: anaTooltipFormatter(isPct, aeLocalData) },
    legend: { show: legendDim !== 'none', data: legendData, top: 5, selectedMode: false, itemWidth: 10, itemHeight: 10, itemGap: 8, textStyle: { fontSize: 11 } },
    grid: { left: '8%', right: '8%', bottom: '12%', top: '18%' },
    dataZoom: [
      { type: 'inside', start: (ANA.aeStackZoomPct || { start: 0 }).start, end: (ANA.aeStackZoomPct || { end: 100 }).end }
    ],
    xAxis: { type: 'category', data: keys, axisLabel: { fontSize: 10, rotate: keys.length > 15 ? 35 : 0, hideOverlap: true } },
    yAxis: [
      { type: 'value', name: isPct ? '%' : (useCount ? '频次' : '小时'), max: isPct ? 100 : null, splitLine: { show: true } }
    ],
    series: chartSeries
  }, true);

  ANA.aeStackAllKeys = keys;
  var _kr = _facetZoomKeyRange(keys, ANA.aeStackZoomPct || { start: 0, end: 100 });
  ANA.aeStackZoomStart = _kr ? _kr.startKey : null;
  ANA.aeStackZoomEnd = _kr ? _kr.endKey : null;
  renderZoomKpi(map, keys, 'aeZoomKpi', ANA.aeStackZoomStart, ANA.aeStackZoomEnd, ANA.aeStackMode, false, true);

  if (ANA.aeStackExpand !== 'none') {
    $('#aeViewChart').style.display = 'none';
    renderAeStackFacet(rows, ANA.aeStackExpand);
  } else {
    ANA._aeFacetToken = (ANA._aeFacetToken || 0) + 1;
    ANA._aeFacetFlush = null;
    $('#aeViewChart').style.display = '';
    const fc = $('#aeFacetContainer');
    fc.style.display = 'none';
    fc.innerHTML = '';
    _disposeFacetCharts('aeStackFacet', 'aeStackFacetZoom');
    ANA._aeFacetKeys = null;
    ANA._aeFacetZoomBar = null;
  }
}
function renderAeStackFacet(allRows, expandMode) {
  const grain = ANA.aeStackView;
  var mode = ANA.aeStackMode;
  const isPct = mode === 'pct' || mode === 'countpct';
  const useCount = mode === 'count' || mode === 'countpct';
  const container = $('#aeFacetContainer');

  function getFacetKey(r) {
    if (expandMode === 'workshop') return r.workshop || '';
    if (expandMode === 'line') return (r.workshop && r.line) ? r.workshop + '|' + r.line : '';
    return (r.workshop && r.asset) ? r.workshop + '|' + r.asset : '';
  }
  function facetLabel(key) {
    if (expandMode === 'workshop') return key;
    var parts = key.split('|');
    return parts[0] + ' / ' + parts[1];
  }

  const facetSet = new Set();
  allRows.forEach(r => { var k = getFacetKey(r); if (k) facetSet.add(k); });
  var selectedKeys = [...facetSet].sort();
  if (expandMode === 'asset' || expandMode === 'line') selectedKeys.sort(anaWsAssetSort);
  ANA._aeFacetLabels = selectedKeys.map(facetLabel);
  ANA._aeFacetToken = (ANA._aeFacetToken || 0) + 1;
  var myToken = ANA._aeFacetToken;
  ANA._aeFacetFlush = null;
  if (!selectedKeys.length) { container.style.display = 'block'; container.innerHTML = ''; _disposeFacetCharts('aeStackFacet', 'aeStackFacetZoom'); ANA._aeFacetKeys = null; ANA._aeFacetZoomBar = null; return; }

  var cols = Math.min(selectedKeys.length, 3);
  var rowCount = Math.ceil(selectedKeys.length / cols);
  var chartH = Math.max(160, Math.floor(380 / rowCount));

  var legendDim = ANA.aeStackLegend;
  var _shuffled = legendDim !== 'none' ? aeLegendColors() : null;
  var blockBorder = legendDim === 'mainCat' ? { borderColor: '#fff', borderWidth: 1, borderType: 'solid' } : null;

  const rowsByKey = {};
  allRows.forEach(r => {
    var k = getFacetKey(r);
    if (k) { if (!rowsByKey[k]) rowsByKey[k] = []; rowsByKey[k].push(r); }
  });

  var zoomPct = ANA.aeStackZoomPct || { start: 0, end: 100 };
  var prevKeys = ANA._aeFacetKeys || [];
  var keysSame = prevKeys.length === selectedKeys.length && prevKeys.every(function(k, i) { return k === selectedKeys[i]; });
  var canReuse = keysSame && ANA.charts.aeStackFacet && ANA.charts.aeStackFacet.length === selectedKeys.length && container.querySelector('.stack-facet-item');

  if (!canReuse) {
    container.style.display = 'block';
    container.innerHTML = '';
    _disposeFacetCharts('aeStackFacet', 'aeStackFacetZoom');
    ANA._aeFacetZoomBar = null;

    var zoomBar = document.createElement('div');
    zoomBar.style.cssText = 'width:100%;height:30px;margin-bottom:4px';
    container.appendChild(zoomBar);
    ANA._aeFacetZoomBar = zoomBar;
    var grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    grid.style.gap = '8px';
    container.appendChild(grid);

    selectedKeys.forEach(function(key) {
      var wrapper = document.createElement('div');
      wrapper.className = 'stack-facet-item';
      var title = document.createElement('div');
      title.className = 'stack-facet-title';
      title.textContent = facetLabel(key);
      var div = document.createElement('div');
      div.className = 'stack-facet-chart';
      div.style.cssText = 'width:100%;height:' + chartH + 'px';
      wrapper.appendChild(title);
      wrapper.appendChild(div);
      grid.appendChild(wrapper);
      var chart = echarts.init(div);
      ANA.charts.aeStackFacet.push(chart);
      chart.on('mouseover', function(p) { if (p.seriesName) ANA.hoveredSeriesName = p.seriesName; _anaHideOtherTips(chart); });
      chart.on('globalout', function() { ANA.hoveredSeriesName = null; });
    });
    ANA._aeFacetKeys = selectedKeys;
  } else if (ANA.charts.aeStackFacetZoom) {
    /* 复用路径：粒度/日期范围可能已变化，先刷新滑块时间轴再同步缩放位置 */
    ANA.charts.aeStackFacetZoom.setOption({ xAxis: { data: ANA.aeStackAllKeys || [] } });
    ANA.charts.aeStackFacetZoom.dispatchAction({ type: 'dataZoom', start: zoomPct.start, end: zoomPct.end });
  }

  var allKeys = ANA.aeStackAllKeys || Object.keys(anaAggregate(allRows, grain)).sort();
  var showLabel = allKeys.length <= 24;
  var barLabel = showLabel ? { show: true, position: 'inside', fontSize: 7, color: '#fff', hideOverlap: true, formatter: function(p) { return p.value > 0 ? String(Math.round(p.value)) + (isPct ? '%' : '') : ''; } } : { show: false };

  function renderFacetItem(idx) {
    var key = selectedKeys[idx];
    var chart = ANA.charts.aeStackFacet[idx];
    if (!chart) return;
    var assetRows = rowsByKey[key] || [];
    var map = anaAggregate(assetRows, grain);
    allKeys.forEach(function(k) { if (!map[k]) map[k] = { oae: 0, sl: 0, ul: 0, bo: 0, actual: 0, count: 0 }; });

    var facetUnit = useCount ? '次' : 'h';
    var facetTotalSeries = buildTotalLabelSeries(allKeys, map, isPct, useCount, facetUnit, showLabel, 8, legendDim === 'none');

    var facetSeries, facetLegendData, facetLegendGroups, facetShareTotal = null;
    if (legendDim !== 'none') {
      var lg = buildLegendGroups(assetRows, legendDim);
      var groups = lg.groups;
      var lgNames = lg.names;
      facetSeries = [];
      facetLegendData = [];
      facetLegendGroups = [];
      lgNames.forEach(function(name, i) {
        var gMap = anaAggregate(groups[name], grain);
        allKeys.forEach(function(k) { if (!gMap[k]) gMap[k] = { oae: 0, sl: 0, ul: 0, bo: 0, actual: 0, count: 0 }; });
        var gSeries = anaFmtSeries(gMap, allKeys, false, true, true, null, useCount);
        var color = _shuffled[i % _shuffled.length];
        facetLegendData.push(name);
        var grp = { name: name, map: gMap, color: color };
        if (legendDim === 'equipment') {
          grp.compMap = buildCompMap(groups[name], grain, allKeys);
        }
        facetLegendGroups.push(grp);
        var rawData = useCount ? gSeries.count : gSeries.ul;
        if (isPct) {
          rawData = convertToPct(allKeys, map, gMap, useCount);
        }
        facetSeries.push({ name: name, type: 'bar', stack: 't', data: rawData, itemStyle: Object.assign({ color: color }, blockBorder), label: barLabel });
      });
    } else {
      var series = anaFmtSeries(map, allKeys, false, true, true, null, useCount);
      facetLegendData = ['UL'];
      var rawUl = useCount ? series.count : series.ul;
      var grandUl = allKeys.reduce(function(s, k) { return s + (useCount ? map[k].count : map[k].ul); }, 0);
      facetShareTotal = grandUl;
      if (isPct) {
        /* 与主图口径一致：无图例占比 = 该分面内各时间桶占全期总量 */
        rawUl = allKeys.map(function(k) {
          var v = useCount ? map[k].count : map[k].ul;
          return grandUl > 0 ? +(v / grandUl * 100).toFixed(1) : 0;
        });
      }
      facetSeries = [
        { name: 'UL', type: 'bar', stack: 't', data: rawUl, itemStyle: { color: '#ff0000' }, label: barLabel }
      ];
    }
    facetSeries.push(facetTotalSeries);

    var localData = { map: map, catRows: assetRows, catGrain: grain, catDetailMap: null, mode: ANA.aeStackMode, view: ANA.aeStackView, showTotal: false, showOutput: false, legendDim: legendDim, fields: [
      {name:'UL', key: useCount ? 'count' : 'ul', color:'#ff0000'}
    ] };
    if (facetLegendGroups) localData.legendGroups = facetLegendGroups;
    if (facetShareTotal != null) localData.shareTotal = facetShareTotal;
    chart.setOption({
      tooltip: { show: !ANA.aeStackTooltipOff, trigger: 'axis', axisPointer: { type: 'cross' }, formatter: anaTooltipFormatter(isPct, localData) },
      legend: { data: facetLegendData, top: 0, selectedMode: false, itemWidth: 6, itemHeight: 6, itemGap: 3, textStyle: { fontSize: facetLegendData.length > 10 ? 7 : 8 } },
      grid: { left: 38, right: 10, bottom: 38, top: 24 },
      dataZoom: [
        { type: 'inside', start: zoomPct.start, end: zoomPct.end, zoomOnMouseWheel: false, moveOnMouseMove: false, moveOnMouseWheel: false }
      ],
      xAxis: { type: 'category', data: allKeys, axisLabel: { fontSize: 8, rotate: allKeys.length > 6 ? 35 : 0, hideOverlap: true, interval: 0 }, axisLabelMargin: 6 },
      yAxis: [
        { type: 'value', name: isPct ? '%' : (useCount ? '频次' : '小时'), max: isPct ? 100 : null, nameTextStyle: { fontSize: 8, padding: [0, 0, 0, -20] }, axisLabel: { fontSize: 8 }, splitLine: { show: true } }
      ],
      series: facetSeries
    }, true);
  }

  var batchSize = cols;
  var i = 0;
  function initFacetZoom() {
    if (ANA._aeFacetZoomBar && !ANA.charts.aeStackFacetZoom) {
      var zoomChart = echarts.init(ANA._aeFacetZoomBar);
      ANA.charts.aeStackFacetZoom = zoomChart;
      var zkKeys = ANA.aeStackAllKeys || [];
      zoomChart.setOption({
        grid: { left: '8%', right: '8%', top: 0, bottom: 0, height: 0 },
        dataZoom: [
          { type: 'slider', show: true, start: zoomPct.start, end: zoomPct.end, top: 5, height: 10, zoomLock: true,
            borderColor: '#ccc', backgroundColor: '#f0f0f0', fillerColor: 'rgba(0,112,192,0.3)',
            handleSize: 18, handleStyle: { color: '#fff', borderColor: '#999', borderWidth: 1 },
            dataBackground: { lineStyle: { color: '#ccc' }, areaStyle: { color: '#e0e0e0' } },
            selectedDataBackground: { lineStyle: { color: '#0070c0' }, areaStyle: { color: 'rgba(0,112,192,0.15)' } },
            textStyle: { color: '#333', fontSize: 11 }, showDetail: true,
            brushSelect: false, moveHandleSize: 0 }
        ],
        xAxis: { type: 'category', data: zkKeys, show: false },
        yAxis: { type: 'value', show: false },
        series: [{ type: 'line', data: [] }]
      });
      zoomChart.on('datazoom', function(params) {
        var p = (params.batch && params.batch[0]) || params;
        ANA.aeStackZoomPct = { start: p.start, end: p.end };
        if (ANA.charts.aeStackView) ANA.charts.aeStackView.dispatchAction({ type: 'dataZoom', start: p.start, end: p.end });
        ANA.charts.aeStackFacet.forEach(function(fc) {
          if (fc) fc.dispatchAction({ type: 'dataZoom', start: p.start, end: p.end });
        });
        var liveKeys = ANA.aeStackAllKeys || zkKeys;
        var kr = _facetZoomKeyRange(liveKeys, ANA.aeStackZoomPct);
        if (kr) {
          ANA.aeStackZoomStart = kr.startKey;
          ANA.aeStackZoomEnd = kr.endKey;
          renderZoomKpi(ANA.aeStackMap || {}, liveKeys, 'aeZoomKpi', ANA.aeStackZoomStart, ANA.aeStackZoomEnd, ANA.aeStackMode, false, true);
        }
      });
    }
  }
  ANA._aeFacetFlush = function() {
    if (myToken !== ANA._aeFacetToken) return;
    for (; i < selectedKeys.length; i++) renderFacetItem(i);
    initFacetZoom();
    ANA._aeFacetFlush = null;
  };
  function renderBatch() {
    if (myToken !== ANA._aeFacetToken) return;
    var end = Math.min(i + batchSize, selectedKeys.length);
    for (; i < end; i++) renderFacetItem(i);
    if (i < selectedKeys.length) {
      requestAnimationFrame(renderBatch);
    } else if (ANA._aeFacetFlush) {
      initFacetZoom();
      ANA._aeFacetFlush = null;
    }
  }
  renderBatch();
}
function getAnaDateRange() {
  var minD = null, maxD = null;
  ANA.raw.forEach(function(r) {
    if (r.date instanceof Date) {
      if (minD === null || r.date < minD) minD = r.date;
      if (maxD === null || r.date > maxD) maxD = r.date;
    }
  });
  return { min: minD, max: maxD };
}
function createDateRangeControl(prefix, dateRangeFn, renderFn, stateKeys) {
  function fmtD(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parseD(s) { var p = s.split('-'); return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2])); }
  var sdEl = $('#' + prefix + 'DateStart'), edEl = $('#' + prefix + 'DateEnd');
  var spanEl = $('#' + prefix + 'DateSpan');
  var lockEl = $('#' + prefix + 'DateSpanLock');
  var clearEl = $('#' + prefix + 'DateClear');
  var customId = prefix + 'DateSpan_opt_custom';
  var lockedKey = stateKeys.lockedKey;
  var startKey = stateKeys.startKey;
  var endKey = stateKeys.endKey;

  function init() {
    var r = dateRangeFn();
    if (!r.min || !r.max) return;
    sdEl.min = fmtD(r.min); sdEl.max = fmtD(r.max); sdEl.value = fmtD(r.min);
    edEl.min = fmtD(r.min); edEl.max = fmtD(r.max); edEl.value = fmtD(r.max);
    ANA[startKey] = fmtD(r.min);
    ANA[endKey] = fmtD(r.max);
    updateSpanFromDates();
  }

  function updateSpanFromDates(forceDays) {
    var sdv = sdEl.value, edv = edEl.value;
    if (!sdv || !edv) return;
    var sdD = parseD(sdv), edD = parseD(edv);
    var matched = false;
    if (!forceDays) {
      var months = (edD.getFullYear() - sdD.getFullYear()) * 12 + (edD.getMonth() - sdD.getMonth());
      var isLastDayOfMonth = edD.getDate() === new Date(edD.getFullYear(), edD.getMonth() + 1, 0).getDate();
      /* 完整自然月（1号→月末）或起于月末日的区间按整月计 */
      var effectiveMonths = isLastDayOfMonth && (sdD.getDate() === 1 || sdD.getDate() > edD.getDate()) ? months + 1 : months;
      for (var i = 0; i < spanEl.options.length; i++) {
        if (spanEl.options[i].id === customId) continue;
        if (parseInt(spanEl.options[i].value) === effectiveMonths) { spanEl.selectedIndex = i; matched = true; break; }
      }
    }
    var custom = document.getElementById(customId);
    if (matched) {
      if (custom) custom.remove();
    } else {
      if (!custom) { custom = document.createElement('option'); custom.id = customId; spanEl.appendChild(custom); }
      var totalDays = Math.round((edD - sdD) / 86400000) + 1;
      custom.value = totalDays; custom.textContent = totalDays + '天';
      custom.selected = true;
    }
  }

  var _spanAdjusting = false;
  function applySpanToEndDate() {
    var sdv = sdEl.value;
    var opt = spanEl.options[spanEl.selectedIndex];
    if (opt && opt.id === customId) {
      var days = parseInt(opt.value);
      if (!sdv || !days || days < 1) return;
      var endD = parseD(sdv);
      endD.setDate(endD.getDate() + days - 1);
      var result = fmtD(endD);
      if (edEl.max && result > edEl.max) {
        result = edEl.max;
        edEl.value = result;
        ANA[endKey] = result;
        if (!_spanAdjusting) { _spanAdjusting = true; applySpanToStartDate(); _spanAdjusting = false; }
        return;
      }
      edEl.value = result;
      ANA[endKey] = result;
      return;
    }
    var months = parseInt(spanEl.value);
    if (!sdv || !months) return;
    var sdD = parseD(sdv);
    var endYear = sdD.getFullYear() + Math.floor((sdD.getMonth() + months) / 12);
    var endMonth = (sdD.getMonth() + months) % 12;
    var lastDayOfEndMonth = new Date(endYear, endMonth + 1, 0).getDate();
    var endDay = Math.min(sdD.getDate(), lastDayOfEndMonth);
    var endD = new Date(endYear, endMonth, endDay);
    endD.setDate(endD.getDate() - 1);
    var result = fmtD(endD);
    if (edEl.max && result > edEl.max) {
      result = edEl.max;
      edEl.value = result;
      ANA[endKey] = result;
      /* 结束日被数据边界截断时，回推起始日以维持所选跨度 */
      if (!_spanAdjusting) { _spanAdjusting = true; applySpanToStartDate(); _spanAdjusting = false; }
      return;
    }
    edEl.value = result;
    ANA[endKey] = result;
  }

  function applySpanToStartDate() {
    var edv = edEl.value;
    var opt = spanEl.options[spanEl.selectedIndex];
    if (opt && opt.id === customId) {
      var days = parseInt(opt.value);
      if (!edv || !days || days < 1) return;
      var startD = parseD(edv);
      startD.setDate(startD.getDate() - (days - 1));
      var result = fmtD(startD);
      if (sdEl.min && result < sdEl.min) {
        result = sdEl.min;
        sdEl.value = result;
        ANA[startKey] = result;
        if (!_spanAdjusting) { _spanAdjusting = true; applySpanToEndDate(); _spanAdjusting = false; }
        return;
      }
      sdEl.value = result;
      ANA[startKey] = result;
      return;
    }
    var months = parseInt(spanEl.value);
    if (!edv || !months) return;
    var edD = parseD(edv);
    var startMonth = edD.getMonth() - months;
    var startYear = edD.getFullYear() + Math.floor(startMonth / 12);
    startMonth = ((startMonth % 12) + 12) % 12;
    var lastDayOfStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
    var startD = new Date(startYear, startMonth, Math.min(edD.getDate(), lastDayOfStartMonth));
    startD.setDate(startD.getDate() + 1);
    var result = fmtD(startD);
    if (sdEl.min && result < sdEl.min) {
      result = sdEl.min;
      sdEl.value = result;
      ANA[startKey] = result;
      /* 起始日被数据边界截断时，前推结束日以维持所选跨度 */
      if (!_spanAdjusting) { _spanAdjusting = true; applySpanToEndDate(); _spanAdjusting = false; }
      return;
    }
    sdEl.value = result;
    ANA[startKey] = result;
  }

  function reset() {
    var r = dateRangeFn();
    if (!r.min || !r.max) return;
    sdEl.min = fmtD(r.min); sdEl.max = fmtD(r.max); sdEl.value = fmtD(r.min);
    edEl.min = fmtD(r.min); edEl.max = fmtD(r.max); edEl.value = fmtD(r.max);
    ANA[startKey] = fmtD(r.min);
    ANA[endKey] = fmtD(r.max);
    updateSpanFromDates();
  }

  /* 数据范围变化后重钳 min/max，尽量保留当前选择 */
  function refresh() {
    var r = dateRangeFn();
    if (!r.min || !r.max) return;
    var mn = fmtD(r.min), mx = fmtD(r.max);
    sdEl.min = mn; sdEl.max = mx; edEl.min = mn; edEl.max = mx;
    if (!sdEl.value || sdEl.value < mn || sdEl.value > mx) sdEl.value = mn;
    if (!edEl.value || edEl.value > mx || edEl.value < mn) edEl.value = mx;
    ANA[startKey] = sdEl.value || null;
    ANA[endKey] = edEl.value || null;
    updateSpanFromDates();
  }

  lockEl.addEventListener('click', function() {
    ANA[lockedKey] = this.classList.toggle('locked');
    var body = this.querySelector('.lock-body');
    if (body) { body.setAttribute('fill', ANA[lockedKey] ? 'currentColor' : 'none'); }
  });
  function resetZoom() { if (stateKeys.zoomKey) ANA[stateKeys.zoomKey] = null; }
  sdEl.addEventListener('change', function() {
    if (this.min && this.value < this.min) this.value = this.min;
    if (this.max && this.value > this.max) this.value = this.max;
    ANA[startKey] = this.value || null;
    if (this.value && edEl.value && this.value > edEl.value) { edEl.value = this.value; ANA[endKey] = this.value; }
    if (ANA[lockedKey]) { applySpanToEndDate(); } else { updateSpanFromDates(); }
    resetZoom();
    renderFn();
  });
  edEl.addEventListener('change', function() {
    if (this.min && this.value < this.min) this.value = this.min;
    if (this.max && this.value > this.max) this.value = this.max;
    ANA[endKey] = this.value || null;
    if (this.value && sdEl.value && this.value < sdEl.value) { sdEl.value = this.value; ANA[startKey] = this.value; }
    if (ANA[lockedKey]) { applySpanToStartDate(); } else { updateSpanFromDates(); }
    resetZoom();
    renderFn();
  });
  spanEl.addEventListener('change', function() {
    var custom = document.getElementById(customId);
    if (custom && parseInt(custom.value) !== parseInt(this.value)) { custom.remove(); }
    applySpanToEndDate();
    resetZoom();
    renderFn();
  });
  clearEl.addEventListener('click', function() { reset(); resetZoom(); renderFn(); });

  init();
  return { reset: reset, refresh: refresh };
}
function initParetoTimeBar() {
  var ctrl = createDateRangeControl('pareto', getAnaDateRange, renderPareto, {
    lockedKey: 'paretoSpanLocked',
    startKey: 'paretoDateStart',
    endKey: 'paretoDateEnd'
  });
  ANA._paretoTimeBarReset = ctrl.reset;
  ANA._paretoTimeBarRefresh = ctrl.refresh;
}
function paretoFilteredRows() {
  var rows = ANA.paretoAssetsActive ? (ANA.paretoAssets && ANA.paretoAssets.size ? ANA.filtered.filter(r => ANA.paretoAssets.has(r.workshop + '|' + r.asset)) : []) : ANA.filtered;
  rows = rows.filter(function(r) { return r.category === '设备故障'; });
  if (ANA.paretoDateStart || ANA.paretoDateEnd) {
    rows = rows.filter(function(r) {
      if (!r.date || !(r.date instanceof Date)) return false;
      var ds = r.date.getFullYear() + '-' + String(r.date.getMonth() + 1).padStart(2, '0') + '-' + String(r.date.getDate()).padStart(2, '0');
      if (ANA.paretoDateStart && ds < ANA.paretoDateStart) return false;
      if (ANA.paretoDateEnd && ds > ANA.paretoDateEnd) return false;
      return true;
    });
  }
  return rows;
}
function renderParetoKpi(rows) {
  var el = $('#paretoKpi');
  if (!el) return;
  var mode = ANA.paretoMode;
  /* 与图表聚合口径一致：仅统计故障设备+组件均非空的行，时长用 P 列损失时间 */
  var valid = rows.filter(function(r) { return r.equipment && r.component; });
  if (mode === 'count' || mode === 'countpct') {
    el.innerHTML = '<span class="zk-item"><span class="zk-val" style="color:#b1281e">' + valid.length + '</span><span class="zk-pct" style="color:#b1281e">频次</span></span>';
  } else {
    var tot = 0;
    valid.forEach(function(r) { if (r.lossTime > 0) tot += r.lossTime; });
    el.innerHTML = '<span class="zk-item"><span class="zk-val" style="color:#b1281e">' + anaFmtH(tot) + '</span><span class="zk-pct" style="color:#b1281e">损失时间</span></span>';
  }
}
function renderPareto() {
  const rows = paretoFilteredRows();
  renderParetoKpi(rows);
  var mode = ANA.paretoMode;
  var isPct = mode === 'pct' || mode === 'countpct';
  var useCount = mode === 'count' || mode === 'countpct';
  var unit = useCount ? '次' : 'h';

  const el = $('#paretoChart');
  let chart = ANA.charts.pareto;
  if (!chart) { chart = echarts.init(el); ANA.charts.pareto = chart; chart.on('mouseover', function() { _anaHideOtherTips(chart); }); }

  var agg = paretoStackedAggregate(rows, 'equipment', 'component', 15, useCount);
  var yName = isPct ? '%' : (useCount ? '频次' : '损失时间(h)');
  /* 占比口径：占全部筛选数据（含 top-15 之外）的总损失 */
  var grandTotal = agg.grandTotal;
  var series = agg.components.map(function(comp, i) {
    return {
      name: comp, type: 'bar', stack: 'comp',
      data: agg.matrix.map(function(row) { var v = row[i] || 0; return isPct ? +(grandTotal > 0 ? v / grandTotal * 100 : 0).toFixed(1) : v; }),
      label: { show: true, position: 'inside', fontSize: 8, color: '#fff', formatter: function(p) { return p.value > 0 ? p.seriesName : ''; } },
      itemStyle: { color: agg.colors[i] }
    };
  });
  /* agg.cats 已按组总量降序，无需二次排序（二次按四舍五入后的值排序会与聚合口径不一致） */
  var sortedCats = agg.cats;
  var sortedSeries = series;
  var sortedTotals = agg.cats.map(function(_, i) { return agg.matrix[i].reduce(function(s, v) { return s + v; }, 0); });
  /* pct 模式下总值=各分段舍入后之和，保证与堆叠柱顶和 tooltip 累加一致 */
  var dispTotals = agg.cats.map(function(_, i) {
    var s = 0;
    agg.components.forEach(function(_, j) {
      var v = agg.matrix[i][j] || 0;
      s += isPct ? +(grandTotal > 0 ? v / grandTotal * 100 : 0).toFixed(1) : v;
    });
    return +s.toFixed(1);
  });
  var sortedTotalLabels = dispTotals.map(function(v) {
    return isPct ? v + '%' : v + (useCount ? '次' : 'h');
  });
  sortedSeries.push({ name: '总值', type: 'line', data: dispTotals, symbol: 'none', label: { show: true, position: 'top', fontSize: 10, color: '#333', fontWeight: 600, formatter: function(p) { return sortedTotalLabels[p.dataIndex]; } }, lineStyle: { width: 0 }, z: 10, silent: true });
  var cumPct = 0, cumData = sortedTotals.map(function(v) { cumPct += v; return +(grandTotal > 0 ? cumPct / grandTotal * 100 : 0).toFixed(1); });
  sortedSeries.push({ name: '累计占比', type: 'line', yAxisIndex: 1, data: cumData, itemStyle: { color: '#1a1410' }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 6, label: { show: true, position: 'top', fontSize: 10, color: '#1a1410', formatter: '{c}%' } });
  chart.setOption({
    tooltip: { show: !ANA.paretoTooltipOff, trigger: 'axis', axisPointer: { type: 'cross' }, confine: true,
      backgroundColor: 'rgba(255,255,255,0.96)', borderColor: '#d0c8b8', borderWidth: 1, padding: [10,14], textStyle: { color: '#1a1410', fontSize: 12 },
      extraCssText: 'border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.18);max-width:320px',
      formatter: function(params) {
        var title = params[0].axisValueLabel;
        var total = 0, items = [], cumPct = null;
        params.forEach(function(p) {
          if (p.seriesName === '累计占比') { cumPct = p.value; return; }
          if (p.seriesName === '总值') return;
          if (p.value > 0) { total += p.value; items.push(p); }
        });
        var s = '<div style="font-weight:700;font-size:13px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #e0d8c8;color:#1a1410">' + escXml(title) + '</div>';
        items.sort(function(a,b){return b.value-a.value;});
        items.forEach(function(p) {
          s += '<div style="display:flex;align-items:center;gap:6px;margin:3px 0">' +
               '<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' + p.color + ';flex-shrink:0"></span>' +
               '<span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#333">' + escXml(p.seriesName) + '</span>';
          if (isPct) {
            s += '<span style="color:#b1281e;font-weight:600;margin-left:8px">' + p.value + '%</span>';
          } else {
            var pct = total > 0 ? (p.value / total * 100).toFixed(1) : '0';
            s += '<span style="color:#b1281e;font-weight:600;margin-left:8px">' + p.value + unit + '</span>' +
                 '<span style="color:#888;font-size:11px;margin-left:4px">' + pct + '%</span>';
          }
          s += '</div>';
        });
        if (cumPct !== null) {
          s += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid #e0d8c8;color:#1d4e89;font-size:11px;font-weight:600">累计占比: ' + cumPct + '%</div>';
        }
        return s;
      }
    },
    legend: { show: false },
    grid: { left: '8%', right: '8%', bottom: '15%', top: '15%' },
    xAxis: { type: 'category', data: sortedCats, axisLabel: { rotate: 35, fontSize: 10, fontFamily: 'JetBrains Mono' } },
    yAxis: isPct ? [
      { type: 'value', name: '%', position: 'left', axisLabel: { formatter: '{value}%' } },
      { type: 'value', show: false, max: 100 }
    ] : [
      { type: 'value', name: yName, position: 'left' },
      { type: 'value', show: false, max: 100 }
    ],
    series: sortedSeries
  }, true);

  if (ANA.paretoExpand !== 'none') {
    renderParetoFacet(rows, ANA.paretoExpand);
  } else {
    $('#paretoChart').style.display = '';
    const fc = $('#paretoFacetContainer');
    fc.style.display = 'none';
    fc.innerHTML = '';
    _disposeFacetCharts('paretoFacet');
  }
}
function paretoStackedAggregate(rows, groupCol, stackCol, topN, useCount) {
  var groupMap = {}, groupTotal = {};
  rows.forEach(function(r) {
    var gk = r[groupCol];
    var sk = r[stackCol];
    if (!gk || !sk) return;
    var val = useCount ? 1 : (r.lossTime > 0 ? r.lossTime : 0);
    if (!groupMap[gk]) { groupMap[gk] = {}; groupTotal[gk] = 0; }
    groupMap[gk][sk] = (groupMap[gk][sk] || 0) + val;
    groupTotal[gk] += val;
  });
  var grandTotal = 0;
  Object.keys(groupTotal).forEach(function(g) { grandTotal += groupTotal[g]; });
  var sortedGroups = Object.entries(groupTotal).sort(function(a, b) { return b[1] - a[1]; }).slice(0, topN);
  var cats = sortedGroups.map(function(x) { return x[0]; });
  var allStacks = new Set();
  sortedGroups.forEach(function(x) { Object.keys(groupMap[x[0]]).forEach(function(s) { allStacks.add(s); }); });
  var components = [...allStacks].sort();
  var palette = ['#1d4e89','#b1281e','#2a7a7a','#a98437','#3e6b3a','#6b6258','#3a6ba0','#c9483c','#3a9999','#c9a64e','#5a3a8a','#8a5a3a','#3a8a5a','#8a3a6a','#5a5a3a','#3a5a8a','#7a3a3a','#3a7a5a','#6a5a3a','#5a7a8a'];
  var colors = components.map(function(_, i) { return palette[i % palette.length]; });
  var matrix = sortedGroups.map(function(x) { return components.map(function(s) { return +(groupMap[x[0]][s] || 0).toFixed(1); }); });
  return { cats: cats, components: components, matrix: matrix, colors: colors, grandTotal: grandTotal };
}
function renderParetoFacet(allRows, expandMode) {
  var mode = ANA.paretoMode;
  var isPct = mode === 'pct' || mode === 'countpct';
  var useCount = mode === 'count' || mode === 'countpct';
  var unit = useCount ? '次' : 'h';
  const container = $('#paretoFacetContainer');
  /* 代数令牌：快速切换分面/筛选时作废旧的异步渲染批次 */
  ANA._paretoFacetToken = (ANA._paretoFacetToken || 0) + 1;

  function getFacetKey(r) {
    if (expandMode === 'workshop') return r.workshop || '';
    if (expandMode === 'line') return (r.workshop && r.line) ? r.workshop + '|' + r.line : '';
    return (r.workshop && r.asset) ? r.workshop + '|' + r.asset : '';
  }
  function facetLabel(key) {
    if (expandMode === 'workshop') return key;
    var parts = key.split('|');
    return parts[0] + ' / ' + parts[1];
  }

  const facetSet = new Set();
  allRows.forEach(r => { var k = getFacetKey(r); if (k) facetSet.add(k); });
  var selectedKeys = [...facetSet].sort();
  if (expandMode === 'asset' || expandMode === 'line') selectedKeys.sort(anaWsAssetSort);
  ANA._paretoFacetLabels = selectedKeys.map(facetLabel);

  container.innerHTML = '';
  _disposeFacetCharts('paretoFacet');
  if (!selectedKeys.length) { $('#paretoChart').style.display = ''; container.style.display = 'none'; return; }

  const rowsByKey = {};
  allRows.forEach(r => {
    var k = getFacetKey(r);
    if (k) { if (!rowsByKey[k]) rowsByKey[k] = []; rowsByKey[k].push(r); }
  });

  var cols = Math.min(selectedKeys.length, 3);
  var rowCount = Math.ceil(selectedKeys.length / cols);
  var chartH = Math.max(160, Math.floor(360 / rowCount));
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
  container.style.gap = '8px';
  $('#paretoChart').style.display = 'none';

  /* DOM 与图表实例同步创建，setOption 分批渲染，避免分面多时长时间阻塞 UI */
  selectedKeys.forEach((key) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'stack-facet-item';
    const title = document.createElement('div');
    title.className = 'stack-facet-title';
    title.textContent = facetLabel(key);
    const div = document.createElement('div');
    div.className = 'stack-facet-chart';
    div.style.cssText = 'width:100%;height:' + chartH + 'px';
    wrapper.appendChild(title);
    wrapper.appendChild(div);
    container.appendChild(wrapper);
    const chart = echarts.init(div);
    ANA.charts.paretoFacet.push(chart);
    chart.on('mouseover', function() { _anaHideOtherTips(chart); });
  });

  var myToken = ANA._paretoFacetToken;
  ANA._paretoFacetFlush = null;

  function renderFacetItem(idx) {
    var key = selectedKeys[idx];
    var chart = ANA.charts.paretoFacet[idx];
    if (!chart) return;
    const assetRows = rowsByKey[key] || [];
    var yName = isPct ? '%' : (useCount ? '频次' : 'h');
    var agg = paretoStackedAggregate(assetRows, 'equipment', 'component', 10, useCount);
    var fGrandTotal = agg.grandTotal;
    var fSeries = agg.components.map(function(comp, i) {
      return {
        name: comp, type: 'bar', stack: 'comp',
        data: agg.matrix.map(function(row) { var v = row[i] || 0; return isPct ? +(fGrandTotal > 0 ? v / fGrandTotal * 100 : 0).toFixed(1) : v; }),
        label: { show: true, position: 'inside', fontSize: 7, color: '#fff', formatter: function(p) { return p.value > 0 ? p.seriesName : ''; } },
        itemStyle: { color: agg.colors[i] }
      };
    });
    var fTotals = agg.cats.map(function(_, i) { return agg.matrix[i].reduce(function(s, v) { return s + v; }, 0); });
    /* pct 模式下总值=各分段舍入后之和，保证与堆叠柱顶和 tooltip 累加一致 */
    var fDispTotals = agg.cats.map(function(_, i) {
      var s = 0;
      agg.components.forEach(function(_, j) {
        var v = agg.matrix[i][j] || 0;
        s += isPct ? +(fGrandTotal > 0 ? v / fGrandTotal * 100 : 0).toFixed(1) : v;
      });
      return +s.toFixed(1);
    });
    var fTotalLabels = fDispTotals.map(function(t) {
      return isPct ? t + '%' : t + unit;
    });
    fSeries.push({ name: '总值', type: 'line', data: fDispTotals, symbol: 'none',
      label: { show: true, position: 'top', fontSize: 7, color: '#333', fontWeight: 600, formatter: function(p) { return fTotalLabels[p.dataIndex]; } },
      lineStyle: { width: 0 }, z: 10, silent: true });
    var fCum = 0;
    var fCumData = fTotals.map(function(v) { fCum += v; return +(fGrandTotal > 0 ? fCum / fGrandTotal * 100 : 0).toFixed(1); });
    fSeries.push({ name: '累计占比', type: 'line', yAxisIndex: 1, data: fCumData,
      itemStyle: { color: '#1a1410' }, lineStyle: { width: 1.5 }, symbol: 'circle', symbolSize: 4, label: { show: false } });
    chart.setOption({
      tooltip: { show: !ANA.paretoTooltipOff, trigger: 'axis', axisPointer: { type: 'cross' }, confine: true,
        backgroundColor: 'rgba(255,255,255,0.96)', borderColor: '#d0c8b8', borderWidth: 1, padding: [8,10], textStyle: { color: '#1a1410', fontSize: 11 },
        extraCssText: 'border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.18);max-width:260px',
        formatter: function(params) {
          var title = params[0].axisValueLabel;
          var total = 0, items = [], cumPct = null;
          params.forEach(function(p) { if (p.seriesName === '累计占比') { cumPct = p.value; return; } if (p.seriesName === '总值') return; if (p.value > 0) { total += p.value; items.push(p); } });
          var s = '<div style="font-weight:700;font-size:12px;margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid #e0d8c8;color:#1a1410">' + escXml(title) + '</div>';
          items.sort(function(a,b){return b.value-a.value;});
          items.forEach(function(p) {
            s += '<div style="display:flex;align-items:center;gap:5px;margin:2px 0">' +
                 '<span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:' + p.color + ';flex-shrink:0"></span>' +
                 '<span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#333">' + escXml(p.seriesName) + '</span>';
            if (isPct) {
              s += '<span style="color:#b1281e;font-weight:600;margin-left:6px">' + p.value + '%</span>';
            } else {
              var pct = total > 0 ? (p.value / total * 100).toFixed(1) : '0';
              s += '<span style="color:#b1281e;font-weight:600;margin-left:6px">' + p.value + unit + '</span>' +
                   '<span style="color:#888;font-size:10px;margin-left:3px">' + pct + '%</span>';
            }
            s += '</div>';
          });
          if (cumPct !== null) {
            s += '<div style="margin-top:5px;padding-top:5px;border-top:1px solid #e0d8c8;color:#1d4e89;font-size:10px;font-weight:600">累计占比: ' + cumPct + '%</div>';
          }
          return s;
        }
      },
      legend: { show: false },
      grid: { left: '8%', right: '8%', bottom: '15%', top: '15%' },
      xAxis: { type: 'category', data: agg.cats, axisLabel: { fontSize: 8, rotate: 30, hideOverlap: true } },
      yAxis: isPct ? [
        { type: 'value', name: '%', axisLabel: { fontSize: 8, formatter: '{value}%' } },
        { type: 'value', show: false, max: 100 }
      ] : [
        { type: 'value', name: yName, axisLabel: { fontSize: 8 } },
        { type: 'value', show: false, max: 100 }
      ],
      series: fSeries
    }, true);
  }

  var i = 0;
  ANA._paretoFacetFlush = function() {
    if (myToken !== ANA._paretoFacetToken) return;
    for (; i < selectedKeys.length; i++) renderFacetItem(i);
    ANA._paretoFacetFlush = null;
  };
  function renderBatch() {
    if (myToken !== ANA._paretoFacetToken) return;
    var end = Math.min(i + cols, selectedKeys.length);
    for (; i < end; i++) renderFacetItem(i);
    if (i < selectedKeys.length) requestAnimationFrame(renderBatch);
    else ANA._paretoFacetFlush = null;
  }
  renderBatch();
}

/* ---- 损失日历 ---- */
function serialToHoursInProdDay(serial) {
  if (serial == null || isNaN(serial)) return null;
  var frac = serial - Math.floor(serial);
  var hours = frac * 24;
  if (hours < 8) hours += 24;
  return hours - 8;
}
function lcFmtTime(h) {
  var realH = h + 8;
  var days = realH >= 24 ? Math.floor(realH / 24) : 0;
  realH -= days * 24;
  var hh = Math.floor(realH);
  var mm = Math.round((realH - hh) * 60);
  return (days ? '+' + days + 'd ' : '') + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}
function buildCalendarGrid(year, month, rows, compact) {
  var byDate = {};
  rows.forEach(function(r) {
    var ds = r.date.getFullYear() + '-' + String(r.date.getMonth() + 1).padStart(2, '0') + '-' + String(r.date.getDate()).padStart(2, '0');
    if (!byDate[ds]) byDate[ds] = [];
    byDate[ds].push(r);
  });

  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var firstDay = new Date(year, month, 1);
  var startWeekday = firstDay.getDay();

  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(7,1fr);gap:2px;width:100%' + (compact ? ';aspect-ratio:7/' + Math.ceil((startWeekday + daysInMonth) / 7) : '');

  var weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  weekdays.forEach(function(wd) {
    var h = document.createElement('div');
    h.style.cssText = 'text-align:center;font-size:' + (compact ? '9px' : '11px') + ';font-weight:700;padding:4px 0;color:#666';
    h.textContent = wd;
    grid.appendChild(h);
  });

  for (var i = 0; i < startWeekday; i++) {
    var blank = document.createElement('div');
    grid.appendChild(blank);
  }

  for (var d = 1; d <= daysInMonth; d++) {
    var ds = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    var dayRows = byDate[ds] || [];
    var cell = document.createElement('div');
    cell.style.cssText = 'border:1px solid #e0e0e0;' + (compact ? 'min-height:0;aspect-ratio:1;display:flex;flex-direction:column' : 'min-height:80px') + ';position:relative;font-size:' + (compact ? '8px' : '10px') + ';overflow:hidden';

    var dateLabel = document.createElement('div');
    dateLabel.style.cssText = 'text-align:right;padding:1px 4px;color:#333;font-size:' + (compact ? '8px' : '10px');
    dateLabel.textContent = d;
    cell.appendChild(dateLabel);

    if (dayRows.length > 0) {
      var timeline = document.createElement('div');
      timeline.style.cssText = 'position:relative;' + (compact ? 'flex:1;margin:1px 2px' : 'height:60px;margin:2px 4px') + ';background:#f5f5f5;border-radius:2px;overflow:hidden';

      var shiftBgColors = { '早': '#f5f5f5', '白': '#f5f5f5', '中': '#e8ecf5', '夜': '#f5ece8' };
      dayRows.forEach(function(r) {
        var sh = r.shiftHours || 12;
        var startH = serialToHoursInProdDay(r.startSerial);
        var endH = serialToHoursInProdDay(r.endSerial);
        if (startH == null) {
          if (r.shift && (r.shift.indexOf('早') >= 0 || r.shift.indexOf('白') >= 0)) { startH = 0; endH = sh; }
          else if (r.shift && r.shift.indexOf('中') >= 0) { startH = 8; endH = 8 + sh; }
          else if (r.shift && r.shift.indexOf('夜') >= 0) { startH = 24 - sh; endH = 24; }
          else { startH = 0; endH = sh; }
        }
        /* O 列为空时按班制时长兜底；起止序列号齐全时按真实时长（含跨夜与跨多日）；缺序列号时跨夜+24 */
        if (startH != null && endH == null) endH = startH + sh;
        else if (startH != null && r.startSerial != null && r.endSerial != null && r.endSerial > r.startSerial) endH = startH + (r.endSerial - r.startSerial) * 24;
        else if (endH != null && startH != null && endH < startH) endH += 24;
        var bgKey = null;
        if (r.shift) {
          if (r.shift.indexOf('早') >= 0 || r.shift.indexOf('白') >= 0) bgKey = '早';
          else if (r.shift.indexOf('中') >= 0) bgKey = '中';
          else if (r.shift.indexOf('夜') >= 0) bgKey = '夜';
        }
        if (bgKey && shiftBgColors[bgKey] !== '#f5f5f5') {
          var bgTop = startH / 24 * 100;
          var bgHeight = (endH - startH) / 24 * 100;
          var shiftBg = document.createElement('div');
          shiftBg.style.cssText = 'position:absolute;left:0;right:0;top:' + bgTop + '%;height:' + bgHeight + '%;background:' + shiftBgColors[bgKey];
          timeline.appendChild(shiftBg);
        }
      });

      dayRows.forEach(function(r) {
        var sh = r.shiftHours || 12;
        var startH = serialToHoursInProdDay(r.startSerial);
        var endH = serialToHoursInProdDay(r.endSerial);
        if (startH == null) {
          if (r.shift && (r.shift.indexOf('早') >= 0 || r.shift.indexOf('白') >= 0)) { startH = 0; endH = sh; }
          else if (r.shift && r.shift.indexOf('中') >= 0) { startH = 8; endH = 8 + sh; }
          else if (r.shift && r.shift.indexOf('夜') >= 0) { startH = 24 - sh; endH = 24; }
          else { startH = 0; endH = sh; }
        }
        /* O 列为空时按班制时长兜底；起止序列号齐全时按真实时长（含跨夜与跨多日）；缺序列号时跨夜+24 */
        if (startH != null && endH == null) endH = startH + sh;
        else if (startH != null && r.startSerial != null && r.endSerial != null && r.endSerial > r.startSerial) endH = startH + (r.endSerial - r.startSerial) * 24;
        else if (endH != null && startH != null && endH < startH) endH += 24;
        var shiftDur = endH - startH;
        var slDur = Math.min(r.sl, shiftDur);
        var ulDur = Math.min(r.ul, shiftDur - slDur);
        if (ulDur < 0) ulDur = 0;

        function buildTooltipHtml(type, dur, tStart, tEnd) {
          var typeColor = type === 'SL' ? '#ffc000' : '#ff0000';
          var html = '<div style="font-weight:700;margin-bottom:4px"><span style="color:' + typeColor + '">' + type + '</span> ' + dur.toFixed(1) + 'h <span style="opacity:.6;margin-left:6px">' + lcFmtTime(tStart) + ' - ' + lcFmtTime(tEnd) + '</span></div>';
          html += '<table style="border-collapse:collapse;font-size:12px"><tbody>';
          html += '<tr><td style="color:#666;padding:1px 8px 1px 0">AE分类</td><td style="padding:1px 0">' + escXml(r.mainCat || '-') + '</td></tr>';
          html += '<tr><td style="color:#666;padding:1px 8px 1px 0">分类</td><td style="padding:1px 0">' + escXml(r.category || '-') + '</td></tr>';
          html += '<tr><td style="color:#666;padding:1px 8px 1px 0">故障设备</td><td style="padding:1px 0">' + escXml(r.equipment || '-') + '</td></tr>';
          html += '<tr><td style="color:#666;padding:1px 8px 1px 0">故障组件</td><td style="padding:1px 0">' + escXml(r.component || '-') + '</td></tr>';
          html += '<tr><td style="color:#666;padding:1px 8px 1px 0">损失原因</td><td style="padding:1px 0">' + escXml(r.reason || '-') + '</td></tr>';
          html += '</tbody></table>';
          return html;
        }

        if (slDur > 0) {
          var slTop = startH / 24 * 100;
          var slHeight = slDur / 24 * 100;
          var slBar = document.createElement('div');
          slBar.style.cssText = 'position:absolute;left:0;right:0;top:' + slTop + '%;height:' + slHeight + '%;background:#ffc000;opacity:0.8';
          slBar.dataset.tooltip = buildTooltipHtml('SL', slDur, startH, startH + slDur);
          timeline.appendChild(slBar);
        }
        if (ulDur > 0) {
          var ulStart = startH + slDur;
          var ulTop = ulStart / 24 * 100;
          var ulHeight = ulDur / 24 * 100;
          var ulBar = document.createElement('div');
          ulBar.style.cssText = 'position:absolute;left:0;right:0;top:' + ulTop + '%;height:' + ulHeight + '%;background:#ff0000;opacity:0.8';
          ulBar.dataset.tooltip = buildTooltipHtml('UL', ulDur, ulStart, ulStart + ulDur);
          timeline.appendChild(ulBar);
        }
      });

      var totalSL = 0, totalUL = 0;
      dayRows.forEach(function(r) { totalSL += r.sl; totalUL += r.ul; });
      var summary = document.createElement('div');
      summary.style.cssText = 'font-size:' + (compact ? '6px' : '8px') + ';color:#666;padding:0 ' + (compact ? '2px' : '4px');
      summary.textContent = 'SL ' + totalSL.toFixed(1) + 'h UL ' + totalUL.toFixed(1) + 'h';
      cell.appendChild(timeline);
      cell.appendChild(summary);
    }
    grid.appendChild(cell);
  }
  return grid;
}
function attachLossCalTooltip(container) {
  if (ANA.lossCalTooltipOff) return;
  var tooltip = document.getElementById('anaCalTooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'anaCalTooltip';
    tooltip.style.cssText = 'position:fixed;z-index:9999;background:#fff;color:#333;padding:6px 10px;font-size:12px;font-family:var(--serif-cn);pointer-events:none;display:none;border:1px solid #ccc;box-shadow:2px 2px 6px rgba(0,0,0,.15);max-width:360px;line-height:1.5;border-radius:3px';
    document.body.appendChild(tooltip);
  }
  container.querySelectorAll('[data-tooltip]').forEach(function(bar) {
    bar.style.cursor = 'pointer';
    bar.addEventListener('mouseenter', function(e) {
      _anaHideOtherTips('cal');
      tooltip.innerHTML = bar.dataset.tooltip;
      tooltip.style.display = 'block';
    });
    bar.addEventListener('mousemove', function(e) {
      var x = Math.min(e.clientX + 12, window.innerWidth - tooltip.offsetWidth - 8);
      var y = Math.min(e.clientY + 12, window.innerHeight - tooltip.offsetHeight - 8);
      tooltip.style.left = Math.max(0, x) + 'px';
      tooltip.style.top = Math.max(0, y) + 'px';
    });
    bar.addEventListener('mouseleave', function() {
      tooltip.style.display = 'none';
    });
  });
}
function renderLossCalendar() {
  var container = $('#lossCalContainer');
  if (!container) return;
  container.innerHTML = '';
  var year = ANA.lossCalYear, month = ANA.lossCalMonth;
  if (year == null || month == null) { container.innerHTML = '<div style="padding:20px;color:#999;text-align:center">无数据</div>'; return; }
  var monthInput = $('#lossCalMonthInput');
  if (monthInput) monthInput.value = year + '-' + String(month + 1).padStart(2, '0');

  var legend = document.createElement('div');
  legend.style.cssText = 'display:flex;gap:16px;padding:8px 0;font-size:11px;align-items:center';
  legend.innerHTML = '<span style="display:inline-block;width:12px;height:12px;background:#ffc000;opacity:0.8;vertical-align:middle"></span> SL（计划停机损失）' +
    '<span style="display:inline-block;width:12px;height:12px;background:#ff0000;opacity:0.8;vertical-align:middle"></span> UL（非计划停机损失）' +
    '<span style="color:#999;margin-left:8px">时间轴：上=8:00 → 下=次日8:00，SL在上、UL在下按发生时间排列</span>';
  container.appendChild(legend);

  if (ANA.lossCalExpand === 'asset') {
    var workshops = Object.keys(ANA.wsAssetMap).sort(anaAssetSort);
    if (!workshops.length) {
      container.innerHTML = '<div style="padding:20px;color:#999;text-align:center">无资产数据</div>';
      return;
    }
    var rowsByAsset = {};
    ANA.filtered.forEach(function(r) {
      if (!r.date || !(r.date instanceof Date)) return;
      if (r.date.getFullYear() !== year || r.date.getMonth() !== month) return;
      if (!(r.sl > 0 || r.ul > 0)) return;
      var k = r.workshop + '\x00' + r.asset;
      if (!rowsByAsset[k]) rowsByAsset[k] = [];
      rowsByAsset[k].push(r);
    });
    var facets = [];
    var allFacetKeys = [];
    workshops.forEach(function(workshop) {
      [...(ANA.wsAssetMap[workshop] || [])].forEach(function(asset) {
        allFacetKeys.push(workshop + '|' + asset);
      });
    });
    allFacetKeys.sort(anaWsAssetSort);
    allFacetKeys.forEach(function(key) {
      var parts = key.split('|');
      var workshop = parts[0], asset = parts[1];
      facets.push({ label: workshop + ' / ' + asset, rows: rowsByAsset[workshop + '\x00' + asset] || [] });
    });
    /* 分面模式仅展示当月有损失的资产，避免为大量零损失资产建空日历 DOM */
    var totalAssets = facets.length;
    facets = facets.filter(function(f) { return f.rows.some(function(r) { return r.sl > 0 || r.ul > 0; }); });
    if (totalAssets > facets.length) {
      var zeroNote = document.createElement('div');
      zeroNote.style.cssText = 'font-size:11px;color:#888;margin:4px 0';
      zeroNote.textContent = '共 ' + totalAssets + ' 个资产，其中 ' + (totalAssets - facets.length) + ' 个当月无损失，已隐藏';
      container.appendChild(zeroNote);
    }
    var cols = Math.min(facets.length, 3);
    var facetGrid = document.createElement('div');
    facetGrid.style.display = 'grid';
    facetGrid.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    facetGrid.style.gap = '8px';
    container.appendChild(facetGrid);
    var monthLabel = year + '年' + (month + 1) + '月';
    facets.forEach(function(f) {
      var wrapper = document.createElement('div');
      wrapper.className = 'stack-facet-item';
      var title = document.createElement('div');
      title.className = 'stack-facet-title';
      title.style.display = 'flex';
      title.style.justifyContent = 'space-between';
      var labelSpan = document.createElement('span');
      labelSpan.textContent = f.label;
      var monthSpan = document.createElement('span');
      monthSpan.style.fontFamily = 'var(--mono)';
      monthSpan.style.fontWeight = '400';
      monthSpan.style.opacity = '.7';
      monthSpan.textContent = monthLabel;
      title.appendChild(labelSpan);
      title.appendChild(monthSpan);
      wrapper.appendChild(title);
      var calGrid = buildCalendarGrid(year, month, f.rows, true);
      wrapper.appendChild(calGrid);
      attachLossCalTooltip(calGrid);
      facetGrid.appendChild(wrapper);
    });
  } else {
    var workshop = ANA.lossCalWorkshop, asset = ANA.lossCalAsset;
    if (!asset) {
      container.innerHTML = '<div style="padding:20px;color:#999;text-align:center">请选择资产</div>';
      return;
    }
    var rows = ANA.filtered.filter(function(r) {
      if (!r.date || !(r.date instanceof Date)) return false;
      if (r.workshop !== workshop) return false;
      if (r.asset !== asset) return false;
      if (r.date.getFullYear() !== year || r.date.getMonth() !== month) return false;
      return r.sl > 0 || r.ul > 0;
    });
    var grid = buildCalendarGrid(year, month, rows);
    container.appendChild(grid);
    attachLossCalTooltip(grid);
  }
}

/* ---- 全量渲染 ---- */
function renderAnalysis() {
  applyAnaFilters();
  renderKPI();
  renderStackView();
  renderAeStackView();
  renderLossCalendar();
  renderPareto();
}

/* ---- 导出报告 ---- */
async function exportAnalysisReport() {
  if (!ANA.filtered.length) { toast('无数据可导出'); return; }
  if (ANA._aeFacetFlush) ANA._aeFacetFlush();
  if (ANA._stackFacetFlush) ANA._stackFacetFlush();
  if (ANA._paretoFacetFlush) ANA._paretoFacetFlush();
  /* 报告封面如实反映当前各面板筛选条件 */
  const _fp = ['数据行 ' + ANA.filtered.length];
  const _rng = function(a, b) { return (a || b) ? ((a || '—') + '~' + (b || '—')) : null; };
  var _r1 = _rng(ANA.stackDateStart, ANA.stackDateEnd); if (_r1) _fp.push('效率范围 ' + _r1);
  var _r2 = _rng(ANA.aeStackDateStart, ANA.aeStackDateEnd); if (_r2) _fp.push('故障范围 ' + _r2);
  var _r3 = _rng(ANA.paretoDateStart, ANA.paretoDateEnd); if (_r3) _fp.push('帕累托范围 ' + _r3);
  if (ANA.stackAssetsActive && ANA.stackAssets) _fp.push('效率资产 ' + ANA.stackAssets.size + ' 项');
  if (ANA.aeStackAssetsActive && ANA.aeStackAssets) _fp.push('故障资产 ' + ANA.aeStackAssets.size + ' 项');
  if (ANA.paretoAssetsActive && ANA.paretoAssets) _fp.push('帕累托资产 ' + ANA.paretoAssets.size + ' 项');
  const filterText = _fp.join('；');
  const ts = new Date().toLocaleString('zh-CN');

  /* 口径与顶部 KPI 一致：仅统计含有效日期的行 */
  const s = anaKpiSums(ANA.filtered.filter(function(r) { return r.date instanceof Date; }));
  function pct(v) { return s.total > 0 ? (v / s.total * 100).toFixed(1) : '0.0'; }
  const kpiHtml = [
    { label: 'OAE', value: anaFmtH(s.oae), color: '#0070c0', sub: pct(s.oae) + '%' },
    { label: 'SL', value: anaFmtH(s.sl), color: '#ffc000', sub: pct(s.sl) + '%' },
    { label: 'UL', value: anaFmtH(s.ul), color: '#ff0000', sub: pct(s.ul) + '%' },
    { label: 'BO', value: anaFmtH(s.bo), color: '#00b050', sub: pct(s.bo) + '%' }
  ].map(c => '<div class="kpi-card" style="border-left:3px solid ' + c.color + '"><div class="kpi-val" style="color:' + c.color + '">' + c.value + '</div><div class="kpi-label">' + c.label + '</div><div class="kpi-sub">' + c.sub + '</div></div>').join('');
  /* 分面模式导出分面图，否则导出主图 */
  const chartSpecs = [
    { title: '资产效率总览', charts: ANA.stackExpand !== 'none' ? (ANA.charts.stackFacet || []) : [ANA.charts.stackView] },
    { title: '设备故障总览', charts: ANA.aeStackExpand !== 'none' ? (ANA.charts.aeStackFacet || []) : [ANA.charts.aeStackView] },
    { title: '设备故障帕累托分析', charts: ANA.paretoExpand !== 'none' ? (ANA.charts.paretoFacet || []) : [ANA.charts.pareto] }
  ];
  const images = chartSpecs.map(function(spec) {
    var imgs = spec.charts.filter(function(c) {
      if (!c) return false;
      try { var o = c.getOption(); return o && o.series && o.series.length > 0; } catch (e) { return false; }
    }).map(function(c) {
      var url = _anaChartURL(c, { type: 'png', pixelRatio: 2, backgroundColor: '#f3ecdc' });
      return '<img src="' + url + '" style="max-width:100%;border:1px solid #b8a98a;margin-bottom:.5rem">';
    }).join('');
    if (!imgs) return '<p style="color:#999">[' + spec.title + ' 图表未渲染]</p>';
    return '<h3 style="font-family:Noto Serif SC;margin:1rem 0 .3rem">' + spec.title + '</h3>' + imgs;
  }).join('');

  const html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>AE数据分析报告 — ' + escXml(S.fileName) + '</title>' +
    '<style>body{font-family:"Noto Serif SC",serif;background:#f3ecdc;color:#1a1410;max-width:1200px;margin:0 auto;padding:2rem}' +
    'h1{text-align:center;letter-spacing:.2em;border-bottom:3px solid #1a1410;padding-bottom:.5rem}' +
    '.meta{text-align:center;color:#6b6258;font-size:.85rem;margin:.3rem 0 1rem}' +
    '.kpi-row{display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap}' +
    '.kpi-card{flex:1;min-width:140px;background:#ece3cf;border:1px solid #d6c9ad;padding:.8rem;text-align:center}' +
    '.kpi-val{font-family:"JetBrains Mono",monospace;font-size:1.8rem;font-weight:700}' +
    '.kpi-label{font-size:.85rem;color:#3a2f25;margin-top:.2rem}.kpi-sub{font-size:.7rem;color:#6b6258;margin-top:.1rem}' +
    '</style></head><body>' +
    '<h1>AE 数据分析报告</h1><div class="meta">文件：' + escXml(S.fileName) + ' | 筛选：' + filterText + ' | 生成时间：' + ts + '</div>' +
    '<div class="kpi-row">' + kpiHtml + '</div>' + images +
    '</body></html>';

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const ok = await download(blob, S.fileName.replace(/\.(xlsx|xlsm)$/, '') + '-Analysis-Report.html');
  toast(ok ? '已导出分析报告' : '已取消保存');
}

/* ---- 初始化与事件绑定 ---- */
function _updateStackAssetBtnLabels() {
  $$('#stackAssetToggle .ana-ws-dropdown > .ad-btn').forEach(btn => {
    var ws = btn.dataset.ws;
    if (!ws) return;
    var menu = btn.nextElementSibling;
    if (!menu) return;
    var allCb = menu.querySelector('input[data-stackws-all]');
    var assetCbs = [...menu.querySelectorAll('input[type=checkbox][data-stackasset]')];
    if (!assetCbs.length) return;
    var checked = assetCbs.filter(cb => cb.checked).length;
    if (allCb && allCb.checked && checked === assetCbs.length) {
      btn.textContent = ws + ' \u25be';
      btn.classList.remove('active');
    } else if (checked > 0) {
      btn.textContent = ws + '(' + checked + ')\u25be';
      btn.classList.add('active');
    } else {
      btn.textContent = ws + '(0)\u25be';
      btn.classList.add('active');
    }
  });
}
function _updateParetoAssetBtnLabels() {
  $$('#paretoAssetToggle .ana-ws-dropdown > .ad-btn').forEach(btn => {
    var ws = btn.dataset.pws;
    if (!ws) return;
    var menu = btn.nextElementSibling;
    if (!menu) return;
    var allCb = menu.querySelector('input[data-pws-all]');
    var assetCbs = [...menu.querySelectorAll('input[type=checkbox][data-passet]')];
    if (!assetCbs.length) return;
    var checked = assetCbs.filter(cb => cb.checked).length;
    if (allCb && allCb.checked && checked === assetCbs.length) {
      btn.textContent = ws + ' \u25be';
      btn.classList.remove('active');
    } else if (checked > 0) {
      btn.textContent = ws + '(' + checked + ')\u25be';
      btn.classList.add('active');
    } else {
      btn.textContent = ws + '(0)\u25be';
      btn.classList.add('active');
    }
  });
}
function _updateAeAssetBtnLabels() {
  $$('#aeAssetToggle .ana-ws-dropdown > .ad-btn').forEach(btn => {
    var ws = btn.dataset.aews;
    if (!ws) return;
    var menu = btn.nextElementSibling;
    if (!menu) return;
    var allCb = menu.querySelector('input[data-aews-all]');
    var assetCbs = [...menu.querySelectorAll('input[type=checkbox][data-aeasset]')];
    if (!assetCbs.length) return;
    var checked = assetCbs.filter(cb => cb.checked).length;
    if (allCb && allCb.checked && checked === assetCbs.length) {
      btn.textContent = ws + ' \u25be';
      btn.classList.remove('active');
    } else if (checked > 0) {
      btn.textContent = ws + '(' + checked + ')\u25be';
      btn.classList.add('active');
    } else {
      btn.textContent = ws + '(0)\u25be';
      btn.classList.add('active');
    }
  });
}
/* 全部资产重新勾齐后，自动恢复「全部资产」状态 */
function _syncAllAssetState(toggleId, assetAttr, setObj, activeKey) {
  var total = $$('#' + toggleId + ' input[type=checkbox][' + assetAttr + ']').length;
  if (total > 0 && setObj.size >= total) { setObj.clear(); ANA[activeKey] = false; }
}
/* 按数据动态生成车间/资产筛选下拉（不再依赖 HTML 硬编码的车间列表） */
function anaBuildWsDropdowns(toggleId, wsAssetMap, cfg) {
  var toggle = $('#' + toggleId);
  if (!toggle) return;
  Object.keys(wsAssetMap).sort(anaAssetSort).forEach(function(ws) {
    var wrap = document.createElement('div');
    wrap.className = 'ana-ws-dropdown';
    var btn = document.createElement('button');
    btn.className = 'ad-btn';
    btn.setAttribute('data-' + cfg.wsAttr, ws);
    btn.textContent = ws + ' \u25be';
    var menu = document.createElement('div');
    menu.className = 'ana-dropdown-menu';
    var assets = [...wsAssetMap[ws]].sort(anaAssetSort);
    menu.innerHTML = '<label class="ana-dd-all"><input type="checkbox" ' + cfg.wsAllAttr + '="' + escXml(ws) + '" checked>全选</label>' + assets.map(function(asset) {
      return '<label><input type="checkbox" ' + cfg.assetAttr + '="' + escXml(ws) + '|' + escXml(asset) + '" checked>' + escXml(asset) + '</label>';
    }).join('');
    wrap.appendChild(btn);
    wrap.appendChild(menu);
    toggle.appendChild(wrap);
  });
}
/* 绑定资产筛选下拉里动态生成的元素（「全部资产」按钮为静态元素，在 initAnalysis 中单独绑定） */
function _bindAssetFilter(cfg) {
  var toggleSel = '#' + cfg.toggleId;
  $$(toggleSel + ' .ana-ws-dropdown > .ad-btn').forEach(btn => btn.addEventListener('click', function(e) {
    e.stopPropagation();
    this.nextElementSibling.classList.toggle('open');
  }));
  $$(toggleSel + ' .ana-dropdown-menu').forEach(menu => menu.addEventListener('click', e => e.stopPropagation()));
  $$(toggleSel + ' input[type=checkbox][' + cfg.wsAllAttr + ']').forEach(cb => cb.addEventListener('change', function() {
    if (!ANA[cfg.setKey]) ANA[cfg.setKey] = new Set();
    ANA[cfg.activeKey] = true;
    const menu = this.closest('.ana-dropdown-menu');
    const assetCbs = menu ? [...menu.querySelectorAll('input[type=checkbox][' + cfg.assetAttr + ']')] : [];
    if (!this.checked) {
      if (ANA[cfg.setKey].size === 0) {
        $$(toggleSel + ' input[type=checkbox][' + cfg.assetAttr + ']').forEach(acb => ANA[cfg.setKey].add(acb.dataset[cfg.dsKey]));
      }
      assetCbs.forEach(acb => { acb.checked = false; ANA[cfg.setKey].delete(acb.dataset[cfg.dsKey]); });
    } else {
      assetCbs.forEach(acb => { acb.checked = true; ANA[cfg.setKey].add(acb.dataset[cfg.dsKey]); });
    }
    _syncAllAssetState(cfg.toggleId, cfg.assetAttr, ANA[cfg.setKey], cfg.activeKey);
    $(cfg.allSel).classList.toggle('active', !ANA[cfg.activeKey]);
    cfg.labelFn();
    cfg.renderFn();
  }));
  $$(toggleSel + ' input[type=checkbox][' + cfg.assetAttr + ']').forEach(cb => cb.addEventListener('change', function() {
    if (!ANA[cfg.setKey]) ANA[cfg.setKey] = new Set();
    ANA[cfg.activeKey] = true;
    const key = this.dataset[cfg.dsKey];
    if (this.checked) {
      ANA[cfg.setKey].add(key);
    } else {
      if (ANA[cfg.setKey].size === 0) {
        $$(toggleSel + ' input[type=checkbox][' + cfg.assetAttr + ']').forEach(acb => ANA[cfg.setKey].add(acb.dataset[cfg.dsKey]));
      }
      ANA[cfg.setKey].delete(key);
    }
    const menu = this.closest('.ana-dropdown-menu');
    const allCb = menu ? menu.querySelector('input[' + cfg.wsAllAttr + ']') : null;
    const assetCbs = menu ? [...menu.querySelectorAll('input[type=checkbox][' + cfg.assetAttr + ']')] : [];
    if (allCb) allCb.checked = assetCbs.length > 0 && assetCbs.every(acb => acb.checked);
    _syncAllAssetState(cfg.toggleId, cfg.assetAttr, ANA[cfg.setKey], cfg.activeKey);
    $(cfg.allSel).classList.toggle('active', !ANA[cfg.activeKey]);
    cfg.labelFn();
    cfg.renderFn();
  }));
}
var ANA_ASSET_FILTERS = [
  {toggleId:'stackAssetToggle', allSel:'[data-stackasset-all]', wsAttr:'ws', wsAllAttr:'data-stackws-all', assetAttr:'data-stackasset', dsKey:'stackasset', setKey:'stackAssets', activeKey:'stackAssetsActive', labelFn:function(){_updateStackAssetBtnLabels();}, renderFn:function(){renderStackView();}},
  {toggleId:'aeAssetToggle', allSel:'[data-aeasset-all]', wsAttr:'aews', wsAllAttr:'data-aews-all', assetAttr:'data-aeasset', dsKey:'aeasset', setKey:'aeStackAssets', activeKey:'aeStackAssetsActive', labelFn:function(){_updateAeAssetBtnLabels();}, renderFn:function(){renderAeStackView();}},
  {toggleId:'paretoAssetToggle', allSel:'[data-passet-all]', wsAttr:'pws', wsAllAttr:'data-pws-all', assetAttr:'data-passet', dsKey:'passet', setKey:'paretoAssets', activeKey:'paretoAssetsActive', labelFn:function(){_updateParetoAssetBtnLabels();}, renderFn:function(){renderPareto();}}
];
/* 数据修订后重建三组资产下拉；仍存在的已选资产予以保留 */
function _rebuildAssetDropdowns() {
  ANA_ASSET_FILTERS.forEach(function(cfg) {
    var toggle = $('#' + cfg.toggleId);
    if (!toggle) return;
    var prevSel = ANA[cfg.activeKey] && ANA[cfg.setKey] ? new Set(ANA[cfg.setKey]) : null;
    $$('#' + cfg.toggleId + ' .ana-ws-dropdown').forEach(e => e.remove());
    anaBuildWsDropdowns(cfg.toggleId, ANA.wsAssetMap, {wsAttr: cfg.wsAttr, wsAllAttr: cfg.wsAllAttr, assetAttr: cfg.assetAttr});
    _bindAssetFilter(cfg);
    var restored = false;
    if (prevSel && prevSel.size) {
      var kept = new Set();
      prevSel.forEach(function(k) {
        var p = k.split('|');
        if (ANA.wsAssetMap[p[0]] && ANA.wsAssetMap[p[0]].has(p[1])) kept.add(k);
      });
      if (kept.size) {
        ANA[cfg.setKey] = kept;
        ANA[cfg.activeKey] = true;
        $$('#' + cfg.toggleId + ' input[type=checkbox][' + cfg.assetAttr + ']').forEach(function(cb) {
          cb.checked = kept.has(cb.dataset[cfg.dsKey]);
        });
        $$('#' + cfg.toggleId + ' input[' + cfg.wsAllAttr + ']').forEach(function(cb) {
          var menu = cb.closest('.ana-dropdown-menu');
          var cbs = menu ? [...menu.querySelectorAll('input[type=checkbox][' + cfg.assetAttr + ']')] : [];
          cb.checked = cbs.length > 0 && cbs.every(function(acb) { return acb.checked; });
        });
        restored = true;
      }
    }
    if (!restored) {
      if (ANA[cfg.setKey]) ANA[cfg.setKey].clear();
      ANA[cfg.activeKey] = false;
    }
    _syncAllAssetState(cfg.toggleId, cfg.assetAttr, ANA[cfg.setKey], cfg.activeKey);
    var allBtn = $(cfg.allSel);
    if (allBtn) allBtn.classList.toggle('active', !ANA[cfg.activeKey]);
    cfg.labelFn();
  });
}
function _anaFixSignature() {
  var s = '';
  (S.issues || []).forEach(function(i) { if (i.resolved) s += i.id + ':' + i.resolved + ':' + (i.value || '') + (i.manualVal || '') + ';'; });
  return s;
}
/* 疑误修订发生变化后：重钳日期范围、重建资产下拉、回退损失日历选择 */
function _anaRefreshControls() {
  if (ANA._stackDateRefresh) ANA._stackDateRefresh();
  if (ANA._aeStackDateRefresh) ANA._aeStackDateRefresh();
  if (ANA._paretoTimeBarRefresh) ANA._paretoTimeBarRefresh();
  _rebuildAssetDropdowns();
  var valid = ANA.lossCalWorkshop && ANA.wsAssetMap[ANA.lossCalWorkshop] && ANA.wsAssetMap[ANA.lossCalWorkshop].has(ANA.lossCalAsset);
  if (!valid) {
    var wsList = Object.keys(ANA.wsAssetMap).sort(anaAssetSort);
    if (wsList.length) {
      var assets = [...(ANA.wsAssetMap[wsList[0]] || [])].sort(anaAssetSort);
      ANA.lossCalWorkshop = wsList[0];
      ANA.lossCalAsset = assets[0] || null;
    } else {
      ANA.lossCalWorkshop = null;
      ANA.lossCalAsset = null;
    }
    var label = $('#lossCalCascaderLabel');
    if (label) label.textContent = (ANA.lossCalWorkshop && ANA.lossCalAsset) ? ANA.lossCalWorkshop + ' / ' + ANA.lossCalAsset : '请选择';
  }
}
function initAnalysis() {
  /* 每次进入分析页都重新提取原始数据并应用疑误修订，保证与数据检查页一致 */
  ANA.raw = extractRawData();
  anaApplyIssueFixes();
  _anaRefreshWsAssetMap();
  _anaRecomputeShiftHours();
  var fixSig = _anaFixSignature();
  if (ANA.initialized) {
    /* 修订发生变化：重钳日期范围、重建资产下拉、回退损失日历选择 */
    if (fixSig !== ANA._fixSig) { ANA._fixSig = fixSig; _anaRefreshControls(); }
    renderAnalysis(); return;
  }
  ANA.initialized = true;
  ANA._fixSig = fixSig;
  _anaBindTipDismiss();
  _bindSecDl();

  $$('.lock-icon[data-lock]').forEach(function(icon) {
    icon.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var isLocked = this.classList.toggle('locked');
      var body = this.querySelector('.lock-body');
      if (body) { body.setAttribute('fill', isLocked ? 'currentColor' : 'none'); }
    });
  });
  $$('.ana-section').forEach(function(det) {
    var summary = det.querySelector('summary');
    if (summary) {
      summary.addEventListener('click', function(e) {
        var icon = det.querySelector('.lock-icon.locked');
        if (icon) { e.preventDefault(); }
      });
    }
    /* 折叠面板内的图表初始化时容器为 0 尺寸：展开时对其内部图表 resize */
    det.addEventListener('toggle', function() {
      if (!det.open) return;
      _anaAllCharts().forEach(function(c) {
        var d = c.getDom && c.getDom();
        if (d && det.contains(d)) { try { c.resize(); } catch (e) {} }
      });
    });
  });

  const wsAssetMap = ANA.wsAssetMap;
  anaBuildWsDropdowns('stackAssetToggle', wsAssetMap, {wsAttr: 'ws', wsAllAttr: 'data-stackws-all', assetAttr: 'data-stackasset'});
  anaBuildWsDropdowns('aeAssetToggle', wsAssetMap, {wsAttr: 'aews', wsAllAttr: 'data-aews-all', assetAttr: 'data-aeasset'});
  anaBuildWsDropdowns('paretoAssetToggle', wsAssetMap, {wsAttr: 'pws', wsAllAttr: 'data-pws-all', assetAttr: 'data-passet'});
  ANA_ASSET_FILTERS.forEach(function(cfg) { _bindAssetFilter(cfg); });

  $('#anaExportBtn').addEventListener('click', exportAnalysisReport);
  $('#anaReloadBtn').addEventListener('click', function() { location.reload(); });

  $$('#anaStack .ad-btn[data-stackexpand]').forEach(btn => btn.addEventListener('click', function() {
    $$('#anaStack .ad-btn[data-stackexpand]').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    ANA.stackExpand = this.dataset.stackexpand;
    renderStackView();
  }));

  $('#stackLossOnlyBtn').addEventListener('click', function() {
    ANA.stackLossOnly = !ANA.stackLossOnly;
    this.classList.toggle('active', ANA.stackLossOnly);
    renderStackView();
  });
  $('#stackTooltipBtn').addEventListener('click', function() {
    ANA.stackTooltipOff = !ANA.stackTooltipOff;
    this.classList.toggle('active', ANA.stackTooltipOff);
    renderStackView();
  });

  $$('#anaStack .ad-btn[data-stackview]').forEach(btn => btn.addEventListener('click', () => {
    $$('#anaStack .ad-btn[data-stackview]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ANA.stackView = btn.dataset.stackview;
    ANA.stackZoomPct = null;
    renderStackView();
  }));
  $$('#anaStack .ad-btn[data-stackmode]').forEach(btn => btn.addEventListener('click', () => {
    $$('#anaStack .ad-btn[data-stackmode]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ANA.stackMode = btn.dataset.stackmode;
    renderStackView();
  }));
  var stackCtrl = createDateRangeControl('stack', getAnaDateRange, renderStackView, {
    lockedKey: 'spanLocked',
    startKey: 'stackDateStart',
    endKey: 'stackDateEnd',
    zoomKey: 'stackZoomPct'
  });
  ANA._stackDateReset = stackCtrl.reset;
  ANA._stackDateRefresh = stackCtrl.refresh;
  $('[data-stackasset-all]').addEventListener('click', function() {
    if (!ANA.stackAssets) ANA.stackAssets = new Set();
    ANA.stackAssets.clear();
    ANA.stackAssetsActive = false;
    $$('#stackAssetToggle .ad-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    $$('#stackAssetToggle input[type=checkbox]').forEach(cb => cb.checked = true);
    _updateStackAssetBtnLabels();
    renderStackView();
  });
  document.addEventListener('click', () => {
    $$('#stackAssetToggle .ana-dropdown-menu').forEach(m => m.classList.remove('open'));
    $$('#aeAssetToggle .ana-dropdown-menu').forEach(m => m.classList.remove('open'));
    $$('#paretoAssetToggle .ana-dropdown-menu').forEach(m => m.classList.remove('open'));
  });
  // AE stack view/mode/expand buttons
  $$('#anaAeStack .ad-btn[data-astackview]').forEach(btn => btn.addEventListener('click', () => {
    $$('#anaAeStack .ad-btn[data-astackview]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ANA.aeStackView = btn.dataset.astackview;
    ANA.aeStackZoomPct = null;
    renderAeStackView();
  }));
  $$('#anaAeStack .ad-btn[data-astackmode]').forEach(btn => btn.addEventListener('click', () => {
    $$('#anaAeStack .ad-btn[data-astackmode]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ANA.aeStackMode = btn.dataset.astackmode;
    renderAeStackView();
  }));
  $$('#anaAeStack .ad-btn[data-astackexpand]').forEach(btn => btn.addEventListener('click', function() {
    $$('#anaAeStack .ad-btn[data-astackexpand]').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    ANA.aeStackExpand = this.dataset.astackexpand;
    renderAeStackView();
  }));
  $$('#anaAeStack .ad-btn[data-aelegend]').forEach(btn => btn.addEventListener('click', function() {
    $$('#anaAeStack .ad-btn[data-aelegend]').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    ANA.aeStackLegend = this.dataset.aelegend;
    renderAeStackView();
  }));
  $('#aeTooltipBtn').addEventListener('click', function() {
    ANA.aeStackTooltipOff = !ANA.aeStackTooltipOff;
    this.classList.toggle('active', ANA.aeStackTooltipOff);
    renderAeStackView();
  });
  // AE date range control
  var aeCtrl = createDateRangeControl('ae', getAnaDateRange, renderAeStackView, {
    lockedKey: 'aeSpanLocked',
    startKey: 'aeStackDateStart',
    endKey: 'aeStackDateEnd',
    zoomKey: 'aeStackZoomPct'
  });
  ANA._aeStackDateReset = aeCtrl.reset;
  ANA._aeStackDateRefresh = aeCtrl.refresh;
  // AE asset filter
  $('[data-aeasset-all]').addEventListener('click', function() {
    if (!ANA.aeStackAssets) ANA.aeStackAssets = new Set();
    ANA.aeStackAssets.clear();
    ANA.aeStackAssetsActive = false;
    $$('#aeAssetToggle .ad-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    $$('#aeAssetToggle input[type=checkbox]').forEach(cb => cb.checked = true);
    _updateAeAssetBtnLabels();
    renderAeStackView();
  });
  // Pareto time bar
  initParetoTimeBar();
  $$('#anaPareto .ad-btn[data-pmode]').forEach(btn => btn.addEventListener('click', () => {
    $$('#anaPareto .ad-btn[data-pmode]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ANA.paretoMode = btn.dataset.pmode;
    renderPareto();
  }));
  $$('#anaPareto .ad-btn[data-pexpand]').forEach(btn => btn.addEventListener('click', function() {
    $$('#anaPareto .ad-btn[data-pexpand]').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    ANA.paretoExpand = this.dataset.pexpand;
    renderPareto();
  }));

  $('#paretoTooltipBtn').addEventListener('click', function() {
    ANA.paretoTooltipOff = !ANA.paretoTooltipOff;
    this.classList.toggle('active', ANA.paretoTooltipOff);
    renderPareto();
  });
  $('[data-passet-all]').addEventListener('click', function() {
    if (!ANA.paretoAssets) ANA.paretoAssets = new Set();
    ANA.paretoAssets.clear();
    ANA.paretoAssetsActive = false;
    $$('#paretoAssetToggle .ad-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    $$('#paretoAssetToggle input[type=checkbox]').forEach(cb => cb.checked = true);
    _updateParetoAssetBtnLabels();
    renderPareto();
  });
  window.addEventListener('resize', () => {
    Object.values(ANA.charts).forEach(c => { if (c && c.resize) c.resize(); if (Array.isArray(c)) c.forEach(fc => fc && fc.resize()); });
  });

  /* 损失日历初始化 — cascader 两级联动 */
  var cascader = $('#lossCalCascader'), cascaderLabel = $('#lossCalCascaderLabel'),
      cascaderPanel = $('#lossCalCascaderPanel'),
      colWs = $('#lossCalColWs'), colAsset = $('#lossCalColAsset');
  if (cascader && colWs && colAsset) {
    /* 车间列表每次打开/渲染时重算，保证疑误修订新增/删除车间后级联内容同步 */
    function getLcWorkshops() { return Object.keys(wsAssetMap).sort(anaAssetSort); }
    var selectedWs = null;

    function renderAssetCol(ws) {
      colAsset.innerHTML = '';
      var assets = [...(wsAssetMap[ws] || [])].sort(anaAssetSort);
      if (!assets.length) {
        colAsset.innerHTML = '<div class="lc-cascader-empty">无资产</div>';
        return;
      }
      assets.forEach(function(a) {
        var item = document.createElement('div');
        item.className = 'lc-cascader-item';
        item.textContent = a;
        if (ws === ANA.lossCalWorkshop && a === ANA.lossCalAsset) item.classList.add('selected');
        item.addEventListener('click', function(e) {
          e.stopPropagation();
          ANA.lossCalWorkshop = ws;
          ANA.lossCalAsset = a;
          cascaderLabel.textContent = ws + ' / ' + a;
          cascaderPanel.classList.remove('open');
          colWs.querySelectorAll('.lc-cascader-item').forEach(function(el) { el.classList.toggle('selected', el.textContent === ws); });
          if (ANA.lossCalExpand === 'asset') {
            ANA.lossCalExpand = 'none';
            var facetBtn = $('[data-lcexpand="asset"]');
            if (facetBtn) facetBtn.classList.remove('active');
          }
          renderLossCalendar();
        });
        colAsset.appendChild(item);
      });
    }

    function renderWsCol() {
      colWs.innerHTML = '';
      getLcWorkshops().forEach(function(ws) {
        var item = document.createElement('div');
        item.className = 'lc-cascader-item';
        item.textContent = ws;
        if (ws === selectedWs) item.classList.add('selected');
        item.addEventListener('mouseenter', function() {
          selectedWs = ws;
          colWs.querySelectorAll('.lc-cascader-item').forEach(function(el) { el.classList.toggle('selected', el === item); });
          renderAssetCol(ws);
        });
        item.addEventListener('click', function(e) {
          e.stopPropagation();
          selectedWs = ws;
          var assets = [...(wsAssetMap[ws] || [])].sort(anaAssetSort);
          if (assets.length > 0) {
            ANA.lossCalWorkshop = ws;
            ANA.lossCalAsset = assets[0];
            cascaderLabel.textContent = ws + ' / ' + assets[0];
            cascaderPanel.classList.remove('open');
            renderLossCalendar();
          }
        });
        colWs.appendChild(item);
      });
    }

    var lcWs0 = getLcWorkshops()[0];
    if (lcWs0) {
      selectedWs = lcWs0;
      var firstAssets = [...(wsAssetMap[lcWs0] || [])].sort(anaAssetSort);
      if (firstAssets.length > 0) {
        ANA.lossCalWorkshop = lcWs0;
        ANA.lossCalAsset = firstAssets[0];
        cascaderLabel.textContent = lcWs0 + ' / ' + firstAssets[0];
      }
    }

    var dates = ANA.raw.filter(function(r) { return r.date instanceof Date && r.workshop === ANA.lossCalWorkshop && r.asset === ANA.lossCalAsset; }).map(function(r) { return r.date; });
    if (dates.length) {
      var maxDate = new Date(Math.max.apply(null, dates));
      ANA.lossCalYear = maxDate.getFullYear();
      ANA.lossCalMonth = maxDate.getMonth();
    } else {
      var now = new Date();
      ANA.lossCalYear = now.getFullYear();
      ANA.lossCalMonth = now.getMonth();
    }

    cascaderLabel.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = cascaderPanel.classList.toggle('open');
      if (isOpen) {
        selectedWs = ANA.lossCalWorkshop || (getLcWorkshops()[0] || null);
        renderWsCol();
        renderAssetCol(selectedWs);
      }
    });
    document.addEventListener('click', function() { cascaderPanel.classList.remove('open'); });
    cascaderPanel.addEventListener('click', function(e) { e.stopPropagation(); });
  }
  var prevBtn = $('#lossCalPrev'), nextBtn = $('#lossCalNext');
  if (prevBtn) prevBtn.addEventListener('click', function() {
    ANA.lossCalMonth--;
    if (ANA.lossCalMonth < 0) { ANA.lossCalMonth = 11; ANA.lossCalYear--; }
    renderLossCalendar();
  });
  if (nextBtn) nextBtn.addEventListener('click', function() {
    ANA.lossCalMonth++;
    if (ANA.lossCalMonth > 11) { ANA.lossCalMonth = 0; ANA.lossCalYear++; }
    renderLossCalendar();
  });
  var monthInput = $('#lossCalMonthInput');
  if (monthInput) monthInput.addEventListener('change', function() {
    var parts = this.value.split('-');
    if (parts.length === 2) {
      ANA.lossCalYear = parseInt(parts[0]);
      ANA.lossCalMonth = parseInt(parts[1]) - 1;
      renderLossCalendar();
    }
  });
  var lossCalTooltipBtn = $('#lossCalTooltipBtn');
  if (lossCalTooltipBtn) lossCalTooltipBtn.addEventListener('click', function() {
    ANA.lossCalTooltipOff = !ANA.lossCalTooltipOff;
    this.classList.toggle('active', ANA.lossCalTooltipOff);
    renderLossCalendar();
  });
  $$('#anaLossCal [data-lcexpand]').forEach(btn => btn.addEventListener('click', function() {
    var turnOn = ANA.lossCalExpand !== 'asset';
    ANA.lossCalExpand = turnOn ? 'asset' : 'none';
    this.classList.toggle('active', turnOn);
    renderLossCalendar();
  }));

  renderAnalysis();
}

function switchToAnalysis() {
  $('#stage-review').classList.remove('active');
  $('#stage-analysis').classList.add('active');
  $$('#viewToggle .vt-btn').forEach(b => b.classList.toggle('active', b.dataset.view === 'analysis'));
  /* 用户若在延迟期内切回检查页则不再初始化分析页 */
  setTimeout(() => { if (!$('#stage-analysis').classList.contains('active')) return; initAnalysis(); Object.values(ANA.charts).forEach(c => { if (c && c.resize) c.resize(); if (Array.isArray(c)) c.forEach(fc => fc && fc.resize()); }); }, 100);
}

function switchToReview() {
  $('#stage-analysis').classList.remove('active');
  $('#stage-review').classList.add('active');
  $$('#viewToggle .vt-btn').forEach(b => b.classList.toggle('active', b.dataset.view === 'review'));
}

/* ===================================================================
   导出功能 — 参考 HR Analysis 项目
   =================================================================== */
function sanitizeSheetName(name){return String(name).replace(/[\[\]:*?\/\\]/g,'_').slice(0,31);}
function base64ToUint8Array(base64){const binary=atob(base64);const arr=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)arr[i]=binary.charCodeAt(i);return arr;}
function _tsBaseName(prefix){const ts=new Date();const pad=n=>String(n).padStart(2,'0');return prefix+'_'+ts.getFullYear()+pad(ts.getMonth()+1)+pad(ts.getDate())+pad(ts.getHours())+pad(ts.getMinutes());}
function generateCoverImage(title,filterText){const canvas=document.createElement('canvas');canvas.width=800;canvas.height=Math.round(800*297/210);const ctx=canvas.getContext('2d');ctx.fillStyle='#f3ecdc';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#1d4e89';ctx.font='bold 48px Arial, sans-serif';ctx.textAlign='center';ctx.fillText(title||'AE数据分析报告',canvas.width/2,canvas.height/2-20);ctx.fillStyle='#646464';ctx.font='20px Arial, sans-serif';const ts=new Date().toLocaleString();ctx.fillText(ts,canvas.width/2,canvas.height/2+30);if(filterText){ctx.font='16px Arial, sans-serif';ctx.fillStyle='#8a7a6a';const lines=filterText.split('\n');lines.forEach((line,i)=>ctx.fillText(line,canvas.width/2,canvas.height/2+70+i*22));}return canvas.toDataURL('image/jpeg',0.85);}
/* 图表容器位于折叠的 .ana-section(<details>) 内时尺寸为 0：导出前临时展开并 resize，结束后恢复原状 */
function _anaChartURL(chart,opts){
  var dom=chart.getDom&&chart.getDom();
  var det=dom?dom.closest('details'):null;
  var reopen=det&&!det.open;
  if(reopen){det.open=true;try{chart.resize()}catch(e){}}
  var url=chart.getDataURL(opts);
  if(reopen)det.open=false;
  return url;
}
function chartImage(chart){
  if(!chart)return null;
  var dom=chart.getDom&&chart.getDom();
  var det=dom?dom.closest('details'):null;
  var reopen=det&&!det.open;
  if(reopen){det.open=true;try{chart.resize()}catch(e){}}
  /* 展开后仍为 0 尺寸（如 display:none 的缩放面板）导出的是空白图，直接跳过 */
  if(dom&&dom.offsetWidth===0&&dom.offsetHeight===0){if(reopen)det.open=false;return null;}
  var cw=chart.getWidth(),ch=chart.getHeight();
  if(!cw||!ch||!isFinite(cw)||!isFinite(ch)){cw=760;ch=380;}
  const url=chart.getDataURL({type:'jpeg',pixelRatio:1.3,backgroundColor:'#ffffff'});
  if(reopen)det.open=false;
  return{data:url,w:760,h:Math.round(760*(ch/cw))};
}

async function exportExcel(sheets,baseName,coverTitle,filterText){
  if(!sheets.length)return;
  const wb=new ExcelJS.Workbook();
  const usedNames={'Cover':true,'TOC':true};
  sheets.forEach(s=>{let n=s.name,i=2;while(usedNames[n]){n=s.name.slice(0,28)+'_'+i;i++;}s.name=n;usedNames[n]=true;});
  toast('Excel: 生成封面…',true);await yieldUI();
  const coverData=generateCoverImage(coverTitle,filterText);
  const coverWs=wb.addWorksheet('Cover');
  coverWs.columns=[{width:12}];
  for(let r=0;r<40;r++)coverWs.mergeCells(r+1,1,r+1,12);
  const coverImgId=wb.addImage({buffer:base64ToUint8Array(coverData.split(',')[1]),extension:'jpeg'});
  coverWs.addImage(coverImgId,{tl:{col:0,row:0},ext:{width:800,height:Math.round(800*297/210)}});
  if(sheets.length>1){
    const tocWs=wb.addWorksheet('TOC');
    tocWs.columns=[{width:6},{width:50}];
    tocWs.addRow(['No.','区域']);
    tocWs.getRow(1).font={bold:true};
    for(let j=0;j<sheets.length;j++){
      const row=tocWs.addRow([j+1,'']);
      const cell=row.getCell(2);
      cell.value={text:sheets[j].name,hyperlink:"#'"+sheets[j].name+"'!A1"};
      cell.font={color:{argb:'FF0563C1'},underline:true};
    }
  }
  for(let i=0;i<sheets.length;i++){
    const sheet=sheets[i];
    toast('Excel '+(i+1)+'/'+sheets.length+': '+sheet.name,true);await yieldUI();
    const ws=wb.addWorksheet(sheet.name);
    const hasBackLink=sheets.length>1;
    let curRow=hasBackLink?1:0;
    if(hasBackLink){
      ws.addRow(['← 返回目录']);
      const backCell=ws.getCell('A1');
      backCell.value={text:'← 返回目录',hyperlink:"#'TOC'!A1"};
      backCell.font={color:{argb:'FF0563C1'},underline:true};
      curRow=1;
    }
    if(sheet.images&&sheet.images.length){
      for(let j=0;j<sheet.images.length;j++){
        const img=sheet.images[j];
        const base64Data=img.data.split(',')[1];
        const imgId=wb.addImage({buffer:base64ToUint8Array(base64Data),extension:'jpeg'});
        const targetW=800;
        const targetH=Math.round(targetW*img.h/img.w);
        const rowSpan=Math.ceil(targetH/20);
        ws.addImage(imgId,{tl:{col:0,row:curRow},ext:{width:targetW,height:targetH}});
        curRow+=rowSpan+1;
      }
    }
    curRow+=1;
    const headerRow=curRow+1;
    if(sheet.headers&&sheet.headers.length){
      ws.getRow(headerRow).values=sheet.headers;
      ws.getRow(headerRow).font={bold:true};
      sheet.rows.forEach(row=>{curRow++;ws.getRow(curRow+1).values=row;});
      ws.columns.forEach(col=>{let maxLen=10;col.eachCell({includeEmpty:true},cell=>{const v=cell.value;const text=v&&typeof v==='object'?v.text:v;const len=String(text||'').length;if(len>maxLen)maxLen=len;});col.width=Math.min(maxLen+2,40);});
      ws.getRow(headerRow).font={bold:true,color:{argb:'FFFFFFFF'}};
      ws.getRow(headerRow).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1D4E89'}};
      ws.getRow(headerRow).alignment={vertical:'middle',horizontal:'center'};
      ws.getRow(headerRow).height=20;
      if(sheet.rows.length>0)ws.autoFilter={from:{row:headerRow,column:1},to:{row:headerRow+sheet.rows.length,column:ws.columnCount}};
    }
    await yieldUI();
  }
  toast('Excel: 序列化中…',true);await yieldUI();
  const buf=await wb.xlsx.writeBuffer();
  const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  return await downloadBlob(blob,baseName+'.xlsx');
}

/* ---- 导出弹层绑定 ---- */
var _secDlType=null,_secDlBound=false;
var _secDlSubtitles={stack:'资产效率总览',aestack:'设备故障总览',losscal:'AE损失日历',pareto:'设备故障帕累托分析'};
function _bindSecDl(){
  if(_secDlBound)return;
  _secDlBound=true;
  $$('.sec-dl-btn').forEach(btn=>{
    btn.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      _secDlType=this.getAttribute('data-secdl');
      $('#secDlTitle').innerHTML='导出<span class="mp-sub">'+_secDlSubtitles[_secDlType]+'</span>';
      const modal=$('#secDlModal');
      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');
    });
  });
  $('#secDlCancel').addEventListener('click',()=>{
    const modal=$('#secDlModal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
  });
  $('#secDlGo').addEventListener('click',async()=>{
    const modal=$('#secDlModal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    try{
      if(_secDlType==='stack')await _exportStack();
      else if(_secDlType==='aestack')await _exportAeStack();
      else if(_secDlType==='losscal')await _exportLossCal();
      else if(_secDlType==='pareto')await _exportPareto();
    }catch(err){toast('导出失败: '+err.message);}
  });
}

/* ---- 资产效率总览导出 ---- */
async function _exportStack(){
  if(!ANA.charts.stackView){toast('图表未初始化');return;}
  if(ANA._stackFacetFlush)ANA._stackFacetFlush();
  toast('准备导出资产效率总览…',true);await yieldUI();
  const baseName=_tsBaseName('AE_资产效率总览');
  const map=ANA.stackMap||{};
  const keys=Object.keys(map).sort();
  const isLoss=ANA.stackLossOnly;
  const isPct=ANA.stackMode==='pct';
  const modeLabel=ANA.stackMode==='output'?'产量':isPct?'百分比':'小时数';
  var headers,rows;
  if(ANA.stackMode==='output'){
    headers=['时间','产量'];
    rows=keys.map(k=>[k,Math.round(map[k].actual)]);
  }else if(isLoss){
    headers=['时间','SL'+(isPct?'%':''),'UL'+(isPct?'%':'')];
    rows=keys.map(k=>{
      var tot=map[k].sl+map[k].ul;
      if(isPct)return tot>0?[k,+(map[k].sl/tot*100).toFixed(1),+(map[k].ul/tot*100).toFixed(1)]:[k,0,0];
      return [k,+map[k].sl.toFixed(1),+map[k].ul.toFixed(1)];
    });
  }else{
    headers=['时间','OAE'+(isPct?'%':''),'SL'+(isPct?'%':''),'UL'+(isPct?'%':''),'BO'+(isPct?'%':''),'产量'];
    rows=keys.map(k=>{
      var tot=map[k].oae+map[k].sl+map[k].ul+map[k].bo;
      function pv(f){return isPct?(tot>0?+(map[k][f]/tot*100).toFixed(1):0):+map[k][f].toFixed(1)}
      return [k,pv('oae'),pv('sl'),pv('ul'),pv('bo'),Math.round(map[k].actual)];
    });
  }
  var img=chartImage(ANA.charts.stackView);
  var sheets=[{name:sanitizeSheetName('资产效率总览_'+modeLabel),headers:headers,rows:rows,images:img?[img]:[]}];
  if(ANA.stackExpand!=='none'&&ANA.charts.stackFacet&&ANA.charts.stackFacet.length){
    ANA.charts.stackFacet.forEach(function(fc,i){
      if(!fc)return;
      var fi=chartImage(fc);
      var lbl=(ANA._stackFacetLabels&&ANA._stackFacetLabels[i])||('分面'+(i+1));
      if(fi)sheets.push({name:sanitizeSheetName(lbl),headers:[],rows:[],images:[fi]});
    });
  }
  var filterParts=[];
  filterParts.push('时间粒度: '+ANA.stackView);
  filterParts.push('时间范围: '+(ANA.stackDateStart||'—')+' ~ '+(ANA.stackDateEnd||'—'));
  filterParts.push('显示指标: '+modeLabel);
  filterParts.push('资产筛选: '+((ANA.stackAssetsActive&&ANA.stackAssets)?'已选 '+ANA.stackAssets.size+' 项':'全部资产'));
  if(ANA.stackExpand!=='none')filterParts.push('资产分面: '+ANA.stackExpand);
  var ok=await exportExcel(sheets,baseName,'资产效率总览',filterParts.join('\n'));
  if(ok)toastResult('资产效率总览导出完成');else toast('已取消保存');
}

/* ---- 设备故障总览导出 ---- */
async function _exportAeStack(){
  if(!ANA.charts.aeStackView){toast('图表未初始化');return;}
  if(ANA._aeFacetFlush)ANA._aeFacetFlush();
  toast('准备导出设备故障总览…',true);await yieldUI();
  const baseName=_tsBaseName('AE_设备故障总览');
  const rows=aeStackFilteredRows();
  const grain=ANA.aeStackView;
  const map=anaAggregate(rows,grain);
  const keys=Object.keys(map).sort();
  var mode=ANA.aeStackMode;
  var useCount=mode==='count'||mode==='countpct';
  var isPct=mode==='pct'||mode==='countpct';
  const legendDim=ANA.aeStackLegend;
  var metricLabel={abs:'小时数',pct:'小时占比',count:'频次',countpct:'频次占比'}[mode];
  var headers,dataRows;
  if(legendDim==='none'){
    headers=['时间',isPct?metricLabel+'(占全期%)':metricLabel];
    var grandTot=keys.reduce(function(s,k){return s+(useCount?map[k].count:map[k].ul);},0);
    dataRows=keys.map(k=>{
      var raw=useCount?map[k].count:+map[k].ul.toFixed(1);
      if(isPct){
        var v=useCount?map[k].count:map[k].ul;
        raw=grandTot>0?+(v/grandTot*100).toFixed(1):0;
      }
      return [k,raw];
    });
  }else{
    var lg=buildLegendGroups(rows,legendDim);
    var groups=lg.groups,lgNames=lg.names;
    headers=['时间',...lgNames];
    var lgMaps={};
    lgNames.forEach(function(n){lgMaps[n]=anaAggregate(groups[n],grain);});
    dataRows=keys.map(k=>{
      var row=[k];
      var tot=useCount?map[k].count:map[k].ul;
      lgNames.forEach(n=>{
        var v=lgMaps[n][k];
        if(!v){row.push(0);return;}
        var raw=useCount?v.count:+v.ul.toFixed(1);
        if(isPct){
          var val=useCount?v.count:v.ul;
          raw=tot>0?+(val/tot*100).toFixed(1):0;
        }
        row.push(raw);
      });
      return row;
    });
  }
  var img=chartImage(ANA.charts.aeStackView);
  var sheets=[{name:sanitizeSheetName('设备故障总览'),headers:headers,rows:dataRows,images:img?[img]:[]}];
  if(ANA.aeStackExpand!=='none'&&ANA.charts.aeStackFacet&&ANA.charts.aeStackFacet.length){
    ANA.charts.aeStackFacet.forEach(function(fc,i){
      if(!fc)return;
      var fi=chartImage(fc);
      var lbl=(ANA._aeFacetLabels&&ANA._aeFacetLabels[i])||('分面'+(i+1));
      if(fi)sheets.push({name:sanitizeSheetName(lbl),headers:[],rows:[],images:[fi]});
    });
  }
  var filterParts=[];
  filterParts.push('时间粒度: '+grain);
  filterParts.push('时间范围: '+(ANA.aeStackDateStart||'—')+' ~ '+(ANA.aeStackDateEnd||'—'));
  filterParts.push('显示指标: '+{abs:'小时数',pct:'小时占比',count:'频次',countpct:'频次占比'}[mode]);
  filterParts.push('图例: '+legendDim);
  filterParts.push('资产筛选: '+((ANA.aeStackAssetsActive&&ANA.aeStackAssets)?'已选 '+ANA.aeStackAssets.size+' 项':'全部资产'));
  if(ANA.aeStackExpand!=='none')filterParts.push('资产分面: '+ANA.aeStackExpand);
  var ok=await exportExcel(sheets,baseName,'设备故障总览',filterParts.join('\n'));
  if(ok)toastResult('设备故障总览导出完成');else toast('已取消保存');
}

/* ---- AE损失日历导出 ---- */
async function _exportLossCal(){
  toast('准备导出AE损失日历…',true);await yieldUI();
  const baseName=_tsBaseName('AE_损失日历');
  var year=ANA.lossCalYear,month=ANA.lossCalMonth;
  /* 与视图口径一致：非资产分面时只导出级联选择的资产 */
  var singleAsset=ANA.lossCalExpand!=='asset'&&ANA.lossCalWorkshop&&ANA.lossCalAsset;
  var rows=ANA.filtered.filter(function(r){
    if(!r.date||!(r.date instanceof Date))return false;
    if(r.date.getFullYear()!==year||r.date.getMonth()!==month)return false;
    if(singleAsset&&(r.workshop!==ANA.lossCalWorkshop||r.asset!==ANA.lossCalAsset))return false;
    return r.sl>0||r.ul>0;
  });
  var headers=['日期','车间','产线','资产','班次','SL时长','UL时长','AE分类','主AE分类','AE分类明细','故障设备','故障组件'];
  var dataRows=rows.map(r=>[
    r.date?r.date.getFullYear()+'-'+String(r.date.getMonth()+1).padStart(2,'0')+'-'+String(r.date.getDate()).padStart(2,'0'):'',
    r.workshop||'',r.line||'',r.asset||'',r.shift||'',
    +r.sl.toFixed(1),+r.ul.toFixed(1),
    r.category||'',r.mainCat||'',r.individual||'',r.equipment||'',r.component||''
  ]);
  var sheets=[{name:sanitizeSheetName('损失日历明细'),headers:headers,rows:dataRows,images:[]}];
  var filterParts=[];
  filterParts.push('年份: '+ANA.lossCalYear);
  filterParts.push('月份: '+(ANA.lossCalMonth+1)+'月');
  filterParts.push('资产: '+(singleAsset?ANA.lossCalWorkshop+' / '+ANA.lossCalAsset:'全部资产'));
  if(ANA.lossCalExpand!=='none')filterParts.push('分面: '+ANA.lossCalExpand);
  var ok=await exportExcel(sheets,baseName,'AE损失日历',filterParts.join('\n'));
  if(ok)toastResult('AE损失日历导出完成');else toast('已取消保存');
}

/* ---- 设备故障帕累托分析导出 ---- */
async function _exportPareto(){
  if(!ANA.charts.pareto){toast('图表未初始化');return;}
  if(ANA._paretoFacetFlush)ANA._paretoFacetFlush();
  toast('准备导出设备故障帕累托分析…',true);await yieldUI();
  const baseName=_tsBaseName('AE_设备故障帕累托分析');
  var rows=paretoFilteredRows();
  var useCount=ANA.paretoMode==='count'||ANA.paretoMode==='countpct';
  var isPct=ANA.paretoMode==='pct'||ANA.paretoMode==='countpct';
  var agg=paretoStackedAggregate(rows,'equipment','component',15,useCount);
  var headers=['故障设备','故障组件',isPct?(useCount?'频次占比%':'损失占比%'):(useCount?'频次':'损失时间')];
  var dataRows=[];
  agg.cats.forEach(function(eq,i){
    agg.components.forEach(function(comp,j){
      var val=agg.matrix[i]&&agg.matrix[i][j]?agg.matrix[i][j]:0;
      if(isPct)val=agg.grandTotal>0?+(val/agg.grandTotal*100).toFixed(1):0;
      else if(!useCount)val=+val.toFixed(1);
      if(val>0.01)dataRows.push([eq,comp,val]);
    });
  });
  var img=chartImage(ANA.charts.pareto);
  var sheets=[{name:sanitizeSheetName('帕累托分析'),headers:headers,rows:dataRows,images:img?[img]:[]}];
  if(ANA.charts.paretoFacet&&ANA.charts.paretoFacet.length){
    ANA.charts.paretoFacet.forEach(function(fc,i){
      if(!fc)return;
      var fi=chartImage(fc);
      var lbl=(ANA._paretoFacetLabels&&ANA._paretoFacetLabels[i])||('分面'+(i+1));
      if(fi)sheets.push({name:sanitizeSheetName(lbl),headers:[],rows:[],images:[fi]});
    });
  }
  var filterParts=[];
  filterParts.push('时间范围: '+(ANA.paretoDateStart||'—')+' ~ '+(ANA.paretoDateEnd||'—'));
  filterParts.push('显示指标: '+{abs:'小时数',pct:'小时占比',count:'频次',countpct:'频次占比'}[ANA.paretoMode]);
  filterParts.push('资产筛选: '+((ANA.paretoAssetsActive&&ANA.paretoAssets)?'已选 '+ANA.paretoAssets.size+' 项':'全部资产'));
  if(ANA.paretoExpand!=='none')filterParts.push('资产分面: '+ANA.paretoExpand);
  var ok=await exportExcel(sheets,baseName,'设备故障帕累托分析',filterParts.join('\n'));
  if(ok)toastResult('设备故障帕累托分析导出完成');else toast('已取消保存');
}
