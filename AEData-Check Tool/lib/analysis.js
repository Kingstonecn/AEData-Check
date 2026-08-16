/* ===================================================================
   AE数据分析 — 数据分析仪表盘
   依赖：ECharts 5.x, app.js (S, r2v, r2n, r2s, getMergedVal, serialToDate)
   =================================================================== */
'use strict';
const ANA = {
  raw: [],
  filtered: [],
  charts: {},
  hoveredSeriesName: null,
  dim: 'reason',
  hmMode: 'oae',
  stackDim: 'shift',
  stackView: 'month',
  stackMode: 'abs',
  stackRange: 'all',
  stackRangeDay: 'all',
  stackAssets: null,
  stackAssetsActive: false,
  stackExpand: 'none',
  stackTooltipOff: false,
  stackZoomStart: null,
  stackZoomEnd: null,
  stackAllKeys: null,
  stackZoomPct: null,
  stackMap: null,
  stackCatMap: null,
  stackCatRows: null,
  stackCatGrain: null,
  paretoView: 'month',
  paretoMode: 'abs',
  paretoAssets: null,
  paretoAssetsActive: false,
  paretoExpand: 'none',
  paretoTooltipOff: false,
  crossTooltipOff: false,
  initialized: false
};

const STACK_FACET_DIM = { workshop: 'workshop', asset: 'workshop|asset', line: 'line' };
const PARETO_FACET_DIM = { workshop: 'workshop', asset: 'workshop|asset' };


/* ---- 数据提取 ---- */
function extractRawData() {
  const ws = S.ws, max = S.maxRow;
  const rows = [];
  for (let r = S.dataStart; r <= max; r++) {
    const status = r2s(ws, 'G', r);
    const dv = r2v(ws, 'C', r);
    let dateStr = null, dateSer = null;
    if (dv instanceof Date) { dateSer = serialToDate((dv.getTime() - Date.UTC(1899, 11, 30)) / 86400000); dateStr = dv; }
    else if (typeof dv === 'number') { dateSer = dv; dateStr = serialToDate(dv); }
    else if (typeof dv === 'string') { const d = new Date(dv); if (!isNaN(d.getTime())) { dateSer = (d.getTime() - Date.UTC(1899, 11, 30)) / 86400000; dateStr = d; } }
    rows.push({
      row: r,
      workshop: String(getMergedVal(ws, 'A', r) || '').trim(),
      month: r2s(ws, 'B', r),
      date: dateStr,
      dateSer: dateSer,
      shift: r2s(ws, 'D', r) || '',
      line: String(getMergedVal(ws, 'F', r) || '').trim(),
      status: status || '',
      product: r2s(ws, 'H', r) || '',
      asset: r2s(ws, 'I', r) || '',
      actual: r2n(ws, 'K', r),
      lossTime: r2n(ws, 'P', r),
      reason: r2s(ws, 'Q', r) || '',
      equipment: r2s(ws, 'S', r) || '',
      component: r2s(ws, 'T', r) || '',
      oae: r2n(ws, 'U', r),
      sl: r2n(ws, 'V', r),
      ul: r2n(ws, 'W', r),
      bo: r2n(ws, 'X', r),
      mainCat: r2s(ws, 'Y', r) || '',
      individual: r2s(ws, 'AA', r) || '',
      shiftHours: S.shiftHours.get(r) || 12
    });
  }
  return rows;
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
  if (grain === 'year') return d.getFullYear() + '年';
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function anaAggregate(rows, grain) {
  const map = {};
  function addToMap(key, oae, sl, ul, bo, actual) {
    if (!key) return;
    if (!map[key]) map[key] = { oae: 0, sl: 0, ul: 0, bo: 0, actual: 0 };
    map[key].oae += oae; map[key].sl += sl; map[key].ul += ul; map[key].bo += bo; map[key].actual += actual;
  }
  rows.forEach(r => {
    const cmf = crossMidnightFrac(r.shift, r.shiftHours);
    if (cmf) {
      addToMap(anaDateKey(r, 0, grain), r.oae * cmf[0], r.sl * cmf[0], r.ul * cmf[0], r.bo * cmf[0], r.actual * cmf[0]);
      addToMap(anaDateKey(r, 1, grain), r.oae * cmf[1], r.sl * cmf[1], r.ul * cmf[1], r.bo * cmf[1], r.actual * cmf[1]);
    } else {
      addToMap(anaDateKey(r, 0, grain), r.oae, r.sl, r.ul, r.bo, r.actual);
    }
  });
  return map;
}
function anaAggregateCat(rows, grain) {
  var catMap = {};
  rows.forEach(function(r) {
    var cat = r.mainCat || '(空)';
    var cmf = crossMidnightFrac(r.shift, r.shiftHours);
    var fracs = cmf ? [{ off: 0, f: cmf[0] }, { off: 1, f: cmf[1] }] : [{ off: 0, f: 1 }];
    fracs.forEach(function(fr) {
      var key = anaDateKey(r, fr.off, grain);
      if (!key) return;
      if (!catMap[key]) catMap[key] = {};
      if (!catMap[key][cat]) catMap[key][cat] = { sl: 0, ul: 0, bo: 0 };
      catMap[key][cat].sl += r.sl * fr.f;
      catMap[key][cat].ul += r.ul * fr.f;
      catMap[key][cat].bo += r.bo * fr.f;
    });
  });
  return catMap;
}
function anaFmtSeries(map, keys, isPct) {
  function fmtData(field) {
    return keys.map(k => {
      const v = map[k];
      const tot = v.oae + v.sl + v.ul + v.bo;
      if (isPct) return tot > 0 ? +(v[field] / tot * 100).toFixed(1) : 0;
      return +v[field].toFixed(1);
    });
  }
  return {
    oae: fmtData('oae'), sl: fmtData('sl'), ul: fmtData('ul'), bo: fmtData('bo'),
    actual: keys.map(k => +map[k].actual.toFixed(0))
  };
}
function anaTooltipFormatter(isPct, localData) {
  return function(params) {
    var key = params[0].axisValue;
    var map = (localData && localData.map) || ANA.stackMap;
    var catRows = (localData && localData.catRows) || ANA.stackCatRows;
    var catGrain = (localData && localData.catGrain) || ANA.stackCatGrain;
    var catMap = (localData && localData.catMap) || ANA.stackCatMap;
    var mode = (localData && localData.mode) || ANA.stackMode;
    if (!catMap && catRows) { catMap = anaAggregateCat(catRows, catGrain); if (localData) { localData.catMap = catMap; } else { ANA.stackCatMap = catMap; } }
    var v = map && map[key];
    var s = '<div style="font-weight:700;margin-bottom:4px">' + key + '</div>';
    if (v && mode !== 'output') {
      var tot = v.oae + v.sl + v.ul + v.bo;
      function pct(val) { return tot > 0 ? (val / tot * 100).toFixed(1) + '%' : '0%'; }
      s += '<div style="margin-bottom:2px">';
      function fmtH1(val) { return val.toLocaleString('en-US', {maximumFractionDigits:1, minimumFractionDigits:1}) + 'h'; }
      s += '<span style="color:#7030a0">Total ' + fmtH1(tot) + '</span> ';
      s += '<span style="color:#7030a0">' + (v.actual / 1000).toLocaleString('en-US', {maximumFractionDigits:0}) + 't</span>';
      s += '<span style="color:#aaa;margin:0 6px">|</span>';
      s += '<span style="color:#0070c0">OAE ' + fmtH1(v.oae) + ' ' + pct(v.oae) + '</span>';
      s += '</div>';
      s += '<div>';
      s += '<span style="color:#ffc000">SL ' + fmtH1(v.sl) + ' ' + pct(v.sl) + '</span>';
      s += '<span style="color:#aaa;margin:0 6px">|</span>';
      s += '<span style="color:#ff0000">UL ' + fmtH1(v.ul) + ' ' + pct(v.ul) + '</span>';
      s += '<span style="color:#aaa;margin:0 6px">|</span>';
      s += '<span style="color:#00b050">BO ' + fmtH1(v.bo) + ' ' + pct(v.bo) + '</span>';
      s += '</div>';
    } else if (v && mode === 'output') {
      s += '<div><span style="color:#7030a0">产量 ' + anaFmtT(v.actual) + '</span></div>';
    }
    if (catMap && catMap[key] && mode !== 'output') {
      var hoveredSeries = ANA.hoveredSeriesName;
      var fieldMap = { SL: 'sl', UL: 'ul', BO: 'bo' };
      var field = fieldMap[hoveredSeries];
      if (field) {
        var cats = catMap[key];
        var entries = Object.keys(cats).map(function(c) { return { cat: c, val: cats[c][field] }; })
          .filter(function(e) { return e.val > 0.01; })
          .sort(function(a, b) { return b.val - a.val; })
          .slice(0, 8);
        if (entries.length > 0) {
          var catTotal = entries.reduce(function(s, e) { return s + e.val; }, 0);
          s += '<div style="border-top:1px solid #ddd;padding-top:4px;margin-top:4px;font-size:.85em">';
          s += '<div style="opacity:.7;margin:2px 0">' + hoveredSeries + ' AE分类分布:</div>';
          entries.forEach(function(e) {
            var catPct = catTotal > 0 ? (e.val / catTotal * 100).toFixed(1) + '%' : '0%';
            s += '<div style="display:flex;justify-content:space-between"><span>' + e.cat + '</span><span style="margin-left:1.5em">' + e.val.toFixed(1) + 'h (' + catPct + ')</span></div>';
          });
          s += '</div>';
        }
      }
    }
    return s;
  };
}

/* ---- KPI 统计条 ---- */
function anaKpiSums(rows) {
  var oae = 0, sl = 0, ul = 0, bo = 0, actual = 0;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    oae += r.oae; sl += r.sl; ul += r.ul; bo += r.bo; actual += r.actual;
  }
  return { oae: oae, sl: sl, ul: ul, bo: bo, actual: actual, total: oae + sl + ul + bo };
}
function anaKpiHtml(s, mode) {
  function pct(v) { return s.total > 0 ? (v / s.total * 100).toFixed(1) + '%' : '0%'; }
  if (mode === 'output') {
    return '<span class="zk-item"><span class="zk-val" style="color:#7030a0">' + anaFmtT(s.actual) + '</span><span class="zk-pct" style="color:#7030a0">产量</span></span>';
  }
  return [
    { label: 'OAE', val: anaFmtH(s.oae), pct: pct(s.oae), color: '#0070c0' },
    { label: 'SL', val: anaFmtH(s.sl), pct: pct(s.sl), color: '#ffc000' },
    { label: 'UL', val: anaFmtH(s.ul), pct: pct(s.ul), color: '#ff0000' },
    { label: 'BO', val: anaFmtH(s.bo), pct: pct(s.bo), color: '#00b050' },
    { label: '产量', val: anaFmtT(s.actual), pct: '', color: '#7030a0' }
  ].map(function(c) {
    return '<span class="zk-item"><span class="zk-val" style="color:' + c.color + '">' + c.val + '</span><span class="zk-pct" style="color:' + c.color + '">' + (c.pct ? c.label + ' ' + c.pct : c.label) + '</span></span>';
  }).join('<span style="opacity:.3">/</span>');
}
function renderKPI() {
  const s = anaKpiSums(ANA.filtered);
  function pct(v) { return s.total > 0 ? (v / s.total * 100).toFixed(1) + '%' : '0%'; }
  $('#anaCntRows').textContent = ANA.filtered.length;
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
/* 跨午夜班次分割比例（基于 8:30 班次起始时间） */
/* 夜班/晚班12: 20:30-08:30 → 3.5h 当天 + 8.5h 次日 */
/* 夜班/晚班8:  00:30-08:30 → 0h 当天 + 8h 次日（三班制夜班全部在次日） */
/* 中班8:  16:30-00:30 → 7.5h 当天 + 0.5h 次日 */
function crossMidnightFrac(shift, hours) {
  if (shift === '晚班') shift = '夜班';
  if (shift === '夜班' && hours === 12) return [3.5 / 12, 8.5 / 12];
  if (shift === '夜班' && hours === 8) return [0, 1];
  if (shift === '中班' && hours === 8) return [7.5 / 8, 0.5 / 8];
  return null;
}
function renderZoomKpi(map, keys) {
  var zi = 0, zj = keys.length - 1;
  if (ANA.stackZoomStart && ANA.stackZoomEnd) {
    for (var i = 0; i < keys.length; i++) { if (keys[i] >= ANA.stackZoomStart) { zi = i; break; } }
    for (var j = keys.length - 1; j >= 0; j--) { if (keys[j] <= ANA.stackZoomEnd) { zj = j; break; } }
  }
  var el = $('#anaZoomKpi');
  if (!el) return;
  var zoomRows = [];
  for (var i = zi; i <= zj; i++) { zoomRows.push(map[keys[i]]); }
  el.innerHTML = anaKpiHtml(anaKpiSums(zoomRows), ANA.stackMode);
}
function renderStackView() {
  const rows = ANA.stackAssetsActive ? (ANA.stackAssets && ANA.stackAssets.size ? ANA.filtered.filter(r => ANA.stackAssets.has(r.workshop + '|' + r.asset)) : []) : ANA.filtered;
  const grain = ANA.stackView;
  const isPct = ANA.stackMode === 'pct';
  const isOutput = ANA.stackMode === 'output';
  const map = anaAggregate(rows, grain);
  const keys = Object.keys(map).sort();
  const series = anaFmtSeries(map, keys, isPct);
  ANA.stackMap = map;
  ANA.stackCatRows = rows;
  ANA.stackCatGrain = grain;
  ANA.stackCatMap = null;

  const showLabel = keys.length <= 24;
  function lblFmt(v) { return v >= 1000 ? v.toLocaleString('en-US', {maximumFractionDigits:0}) : String(v); }
  const barLabel = showLabel ? { show: true, position: 'inside', fontSize: 8, color: '#fff', hideOverlap: true, formatter: function(p) { return p.value > 0 ? lblFmt(p.value) + (isPct ? '%' : '') : ''; } } : { show: false };
  const lineLabel = showLabel ? { show: true, position: 'top', fontSize: 8, color: '#7030a0', hideOverlap: true, formatter: function(p) { return p.value > 0 ? (p.value / 1000).toLocaleString('en-US', {maximumFractionDigits:0}) + 't' : ''; } } : { show: false };

  const el = $('#stackViewChart');
  let chart = ANA.charts.stackView;
  if (!chart) {
    chart = echarts.init(el); ANA.charts.stackView = chart;
    chart.on('mouseover', function(p) { if (p.seriesName) ANA.hoveredSeriesName = p.seriesName; });
    chart.on('globalout', function() { ANA.hoveredSeriesName = null; });
  }
  var zi = 0, zj = keys.length - 1, zs = 0;
  if (ANA.stackView === 'month' && ANA.stackRange === '12' && keys.length > 12) {
    zi = keys.length - 12; zs = 12;
  } else if (ANA.stackView === 'day' && ANA.stackRangeDay && ANA.stackRangeDay !== 'all') {
    var mc = { '365': 12, '180': 6, '90': 3, '30': 1 }[ANA.stackRangeDay];
    if (mc && keys.length > 0) {
      var lastKey = keys[keys.length - 1];
      var lp = String(lastKey).split('-');
      var ey = parseInt(lp[0]), em = parseInt(lp[1]);
      var sm = em - (mc - 1), sy = ey;
      while (sm <= 0) { sm += 12; sy--; }
      var sk = sy + '-' + String(sm).padStart(2, '0') + '-01';
      for (var i = 0; i < keys.length; i++) { if (keys[i] >= sk) { zi = i; break; } }
      zs = zj - zi + 1;
      if (zi === 0 && zs === keys.length) zs = 0;
    }
  }
  chart.setOption({
    tooltip: { show: !ANA.stackTooltipOff, trigger: 'axis', axisPointer: { type: 'cross' }, formatter: anaTooltipFormatter(isPct) },
    legend: { data: isOutput ? ['产量'] : ['OAE', 'SL', 'UL', 'BO', '产量'], top: zs > 0 ? 40 : 5 },
    grid: { left: '8%', right: '8%', bottom: '12%', top: zs > 0 ? '28%' : '18%' },
    dataZoom: zs > 0 ? [
      { type: 'slider', show: true, startValue: keys[zi], endValue: keys[zj], top: 10, height: 10, zoomLock: true,
        minValueSpan: zs, maxValueSpan: zs,
        borderColor: '#ccc', backgroundColor: '#f0f0f0', fillerColor: 'rgba(0,112,192,0.3)',
        handleSize: 18, handleStyle: { color: '#fff', borderColor: '#999', borderWidth: 1 },
        dataBackground: { lineStyle: { color: '#ccc' }, areaStyle: { color: '#e0e0e0' } },
        selectedDataBackground: { lineStyle: { color: '#0070c0' }, areaStyle: { color: 'rgba(0,112,192,0.15)' } },
        textStyle: { color: '#333', fontSize: 11 }, showDetail: true,
        brushSelect: false, moveHandleSize: 0 }
    ] : [],
    xAxis: { type: 'category', data: keys, axisLabel: { fontSize: 10, rotate: keys.length > 15 ? 35 : 0, hideOverlap: true } },
    yAxis: isOutput ? [
      { type: 'value', name: '产量', splitLine: { show: true } }
    ] : [
      { type: 'value', name: isPct ? '%' : '小时', max: isPct ? 100 : undefined },
      { type: 'value', name: '产量', position: 'right', splitLine: { show: false } }
    ],
    series: isOutput ? [
      { name: '产量', type: 'line', data: series.actual, smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: '#7030a0' }, itemStyle: { color: '#7030a0' }, label: lineLabel, areaStyle: { color: 'rgba(112,48,160,0.1)' } }
    ] : [
      { name: 'OAE', type: 'bar', stack: 'total', data: series.oae, itemStyle: { color: '#0070c0' }, label: barLabel },
      { name: 'SL', type: 'bar', stack: 'total', data: series.sl, itemStyle: { color: '#ffc000' }, label: barLabel },
      { name: 'UL', type: 'bar', stack: 'total', data: series.ul, itemStyle: { color: '#ff0000' }, label: barLabel },
      { name: 'BO', type: 'bar', stack: 'total', data: series.bo, itemStyle: { color: '#00b050' }, label: barLabel },
      { name: '产量', type: 'line', yAxisIndex: 1, data: series.actual, smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: '#7030a0' }, itemStyle: { color: '#7030a0' }, label: lineLabel }
    ]
  }, true);

  ANA.stackAllKeys = keys;
  if (zs > 0) {
    ANA.stackZoomStart = keys[zi];
    ANA.stackZoomEnd = keys[zj];
    ANA.stackZoomPct = { start: zi / (keys.length - 1) * 100, end: zj / (keys.length - 1) * 100 };
  } else {
    ANA.stackZoomStart = null;
    ANA.stackZoomEnd = null;
    ANA.stackZoomPct = null;
  }
  renderZoomKpi(map, keys);

  chart.off('datazoom');
  if (zs > 0) {
    var facetTimer = null;
    chart.on('datazoom', function(params) {
      var s, e;
      if (params.startValue != null && params.endValue != null) {
        s = typeof params.startValue === 'number' ? keys[params.startValue] : params.startValue;
        e = typeof params.endValue === 'number' ? keys[params.endValue] : params.endValue;
      } else {
        var si = Math.round(params.start / 100 * (keys.length - 1));
        var ei = Math.round(params.end / 100 * (keys.length - 1));
        s = keys[si]; e = keys[ei];
      }
      ANA.stackZoomStart = s;
      ANA.stackZoomEnd = e;
      ANA.stackZoomPct = { start: params.start, end: params.end };
      renderZoomKpi(map, keys);
      if (ANA.stackExpand !== 'none' && ANA.charts.stackFacet) {
        if (facetTimer) clearTimeout(facetTimer);
        var ps = params.start, pe = params.end;
        facetTimer = setTimeout(function() {
          facetTimer = null;
          ANA.charts.stackFacet.forEach(function(fc) {
            if (fc) fc.dispatchAction({ type: 'dataZoom', start: ps, end: pe });
          });
        }, 150);
      }
    });
  }

  if (ANA.stackExpand !== 'none') {
    var facetDim = STACK_FACET_DIM[ANA.stackExpand];
    var facetRows = ANA.stackAssetsActive ? rows : ANA.filtered;
    $('#stackViewChart').style.display = 'none';
    renderStackFacet(facetRows, facetDim, ANA.stackExpand);
  } else {
    $('#stackViewChart').style.display = '';
    const fc = $('#stackFacetContainer');
    fc.style.display = 'none';
    fc.innerHTML = '';
  }
}

function renderStackFacet(allRows, facetDim, expandMode) {
  const grain = ANA.stackView;
  const isPct = ANA.stackMode === 'pct';
  const isOutput = ANA.stackMode === 'output';
  const container = $('#stackFacetContainer');

  function getFacetKey(r) {
    if (expandMode === 'workshop') return r.workshop || '';
    if (expandMode === 'line') return (r.workshop || '') + '|' + (r.line || '');
    return (r.workshop || '') + '|' + (r.asset || '');
  }
  function facetLabel(key) {
    if (expandMode === 'workshop') return key;
    var parts = key.split('|');
    return parts[0] + ' / ' + parts[1];
  }

  const facetSet = new Set();
  allRows.forEach(r => { var k = getFacetKey(r); if (k) facetSet.add(k); });
  var selectedKeys = [...facetSet].sort();
  if (expandMode === 'asset') selectedKeys.sort(anaWsAssetSort);

  container.style.display = 'block';
  container.innerHTML = '';
  if (!ANA.charts.stackFacet) ANA.charts.stackFacet = [];
  ANA.charts.stackFacet.forEach(c => c && c.dispose());
  ANA.charts.stackFacet = [];

  const rowsByKey = {};
  allRows.forEach(r => {
    var k = getFacetKey(r);
    if (k) { if (!rowsByKey[k]) rowsByKey[k] = []; rowsByKey[k].push(r); }
  });

  var cols = Math.min(selectedKeys.length, 3);
  var rowCount = Math.ceil(selectedKeys.length / cols);
  var chartH = Math.max(160, Math.floor(380 / rowCount));
  container.style.display = 'block';
  container.innerHTML = '';
  if (!ANA.charts.stackFacet) ANA.charts.stackFacet = [];
  ANA.charts.stackFacet.forEach(c => c && c.dispose());
  ANA.charts.stackFacet = [];
  if (ANA.charts.stackFacetZoom) { ANA.charts.stackFacetZoom.dispose(); ANA.charts.stackFacetZoom = null; }

  var hasZoom = !!ANA.stackZoomPct;
  var zoomBar = null;
  if (hasZoom) {
    zoomBar = document.createElement('div');
    zoomBar.style.cssText = 'width:100%;height:30px;margin-bottom:4px';
    container.appendChild(zoomBar);
  }
  var grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
  grid.style.gap = '8px';
  container.appendChild(grid);

  selectedKeys.forEach((key) => {
    const assetRows = rowsByKey[key] || [];
    const map = anaAggregate(assetRows, grain);
    var keys = ANA.stackAllKeys || Object.keys(map).sort();
    keys.forEach(function(k) { if (!map[k]) map[k] = { oae: 0, sl: 0, ul: 0, bo: 0, actual: 0 }; });
    const series = anaFmtSeries(map, keys, isPct);

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
    chart.on('mouseover', function(p) { if (p.seriesName) ANA.hoveredSeriesName = p.seriesName; });
    chart.on('globalout', function() { ANA.hoveredSeriesName = null; });
    const showLabel = keys.length <= 24;
    const barLabel = showLabel ? { show: true, position: 'inside', fontSize: 7, color: '#fff', hideOverlap: true, formatter: function(p) { return p.value > 0 ? String(p.value) + (isPct ? '%' : '') : ''; } } : { show: false };
    const lineLabel = showLabel ? { show: true, position: 'top', fontSize: 7, color: '#7030a0', hideOverlap: true, formatter: function(p) { return p.value > 0 ? (p.value / 1000).toLocaleString('en-US', {maximumFractionDigits:0}) + 't' : ''; } } : { show: false };
    var localData = { map: map, catRows: assetRows, catGrain: grain, catMap: null, mode: ANA.stackMode };
    chart.setOption({
      tooltip: { show: !ANA.stackTooltipOff, trigger: 'axis', axisPointer: { type: 'cross' }, formatter: anaTooltipFormatter(isPct, localData) },
      legend: { data: isOutput ? ['产量'] : ['OAE', 'SL', 'UL', 'BO', '产量'], top: 0, textStyle: { fontSize: 9 } },
      grid: { left: '8%', right: '8%', bottom: '12%', top: '15%' },
      dataZoom: hasZoom ? [
        { type: 'inside', start: ANA.stackZoomPct.start, end: ANA.stackZoomPct.end, zoomOnMouseWheel: false, moveOnMouseMove: false, moveOnMouseWheel: false }
      ] : [],
      xAxis: { type: 'category', data: keys, axisLabel: { fontSize: 8, rotate: keys.length > 8 ? 30 : 0, hideOverlap: true } },
      yAxis: isOutput ? [
        { type: 'value', name: '产量', axisLabel: { fontSize: 8 } }
      ] : [
        { type: 'value', name: isPct ? '%' : 'h', max: isPct ? 100 : undefined, axisLabel: { fontSize: 8 } },
        { type: 'value', position: 'right', splitLine: { show: false }, axisLabel: { fontSize: 8 } }
      ],
      series: isOutput ? [
        { name: '产量', type: 'line', data: series.actual, smooth: true, symbol: 'circle', symbolSize: 4, lineStyle: { width: 1.5, color: '#7030a0' }, itemStyle: { color: '#7030a0' }, label: lineLabel, areaStyle: { color: 'rgba(112,48,160,0.1)' } }
      ] : [
        { name: 'OAE', type: 'bar', stack: 't', data: series.oae, itemStyle: { color: '#0070c0' }, label: barLabel },
        { name: 'SL', type: 'bar', stack: 't', data: series.sl, itemStyle: { color: '#ffc000' }, label: barLabel },
        { name: 'UL', type: 'bar', stack: 't', data: series.ul, itemStyle: { color: '#ff0000' }, label: barLabel },
        { name: 'BO', type: 'bar', stack: 't', data: series.bo, itemStyle: { color: '#00b050' }, label: barLabel },
        { name: '产量', type: 'line', yAxisIndex: 1, data: series.actual, smooth: true, symbol: 'circle', symbolSize: 4, lineStyle: { width: 1.5, color: '#7030a0' }, itemStyle: { color: '#7030a0' }, label: lineLabel }
      ]
    });
  });

  if (hasZoom && zoomBar) {
    var zoomChart = echarts.init(zoomBar);
    ANA.charts.stackFacetZoom = zoomChart;
    var allKeys = ANA.stackAllKeys || [];
    zoomChart.setOption({
      grid: { left: '8%', right: '8%', top: 0, bottom: 0, height: 0 },
      dataZoom: [
        { type: 'slider', show: true, start: ANA.stackZoomPct.start, end: ANA.stackZoomPct.end, top: 5, height: 10, zoomLock: true,
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
      ANA.stackZoomPct = { start: params.start, end: params.end };
      if (ANA.charts.stackView) ANA.charts.stackView.dispatchAction({ type: 'dataZoom', start: params.start, end: params.end });
      ANA.charts.stackFacet.forEach(function(fc) {
        if (fc) fc.dispatchAction({ type: 'dataZoom', start: params.start, end: params.end });
      });
    });
  }
}
function paretoFilteredRows() {
  var rows = ANA.paretoAssetsActive ? (ANA.paretoAssets && ANA.paretoAssets.size ? ANA.filtered.filter(r => ANA.paretoAssets.has(r.workshop + '|' + r.asset)) : []) : ANA.filtered;
  return rows;
}
function renderParetoKpi(rows) {
  var el = $('#paretoKpi');
  if (!el) return;
  el.innerHTML = anaKpiHtml(anaKpiSums(rows), ANA.paretoMode);
}
function paretoAggregate(rows, dimCol, isOutput, topN) {
  var total = 0;
  const map = {};
  rows.forEach(r => {
    var val = isOutput ? r.actual : (r.lossTime > 0 ? r.lossTime : 0);
    total += val;
    const key = r[dimCol] || '(空)';
    map[key] = (map[key] || 0) + val;
  });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, topN);
  const topTotal = sorted.reduce((s, [, v]) => s + v, 0);
  let cumPct = 0;
  const cats = sorted.map(([k]) => k);
  const isPct = ANA.paretoMode === 'pct';
  const barData = sorted.map(function([, v]) {
    if (isPct) return total > 0 ? +(v / total * 100).toFixed(1) : 0;
    return +v.toFixed(1);
  });
  const cumData = sorted.map(function([, v]) {
    cumPct += v;
    return topTotal > 0 ? +(cumPct / topTotal * 100).toFixed(1) : 0;
  });
  return { cats: cats, barData: barData, cumData: cumData };
}
function renderPareto() {
  const dimCol = { reason: 'reason', equipment: 'equipment', component: 'component', asset: 'asset' }[ANA.dim];
  const rows = paretoFilteredRows();
  renderParetoKpi(rows);
  const isPct = ANA.paretoMode === 'pct';
  const isOutput = ANA.paretoMode === 'output';
  var pa = paretoAggregate(rows, dimCol, isOutput, 15);

  var barName = isOutput ? '产量' : (isPct ? '占比%' : '损失时间(h)');
  var barColor = isOutput ? '#7030a0' : '#b1281e';
  var yName = isOutput ? '产量' : (isPct ? '%' : '损失时间(h)');

  const el = $('#paretoChart');
  let chart = ANA.charts.pareto;
  if (!chart) { chart = echarts.init(el); ANA.charts.pareto = chart; }
  chart.setOption({
    tooltip: { show: !ANA.paretoTooltipOff, trigger: 'axis', axisPointer: { type: 'cross' } },
    grid: { left: '8%', right: '8%', bottom: '15%', top: '15%' },
    xAxis: { type: 'category', data: pa.cats, axisLabel: { rotate: 35, fontSize: 10, fontFamily: 'JetBrains Mono' } },
    yAxis: [{ type: 'value', name: yName, position: 'left' }, { type: 'value', name: '累计%', position: 'right', max: 100, axisLabel: { formatter: '{value}%' } }],
    series: [
      { name: barName, type: 'bar', data: pa.barData, itemStyle: { color: barColor } },
      { name: '累计占比', type: 'line', yAxisIndex: 1, data: pa.cumData, itemStyle: { color: '#1a1410' }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 6 }
    ]
  }, true);

  if (ANA.paretoExpand !== 'none') {
    renderParetoFacet(rows, ANA.paretoExpand);
  } else {
    $('#paretoChart').style.display = '';
    const fc = $('#paretoFacetContainer');
    fc.style.display = 'none';
    fc.innerHTML = '';
  }
}
function renderParetoFacet(allRows, expandMode) {
  const dimCol = { reason: 'reason', equipment: 'equipment', component: 'component', asset: 'asset' }[ANA.dim];
  const isPct = ANA.paretoMode === 'pct';
  const isOutput = ANA.paretoMode === 'output';
  const container = $('#paretoFacetContainer');

  function getFacetKey(r) {
    if (expandMode === 'workshop') return r.workshop || '';
    return (r.workshop || '') + '|' + (r.asset || '');
  }
  function facetLabel(key) {
    if (expandMode === 'workshop') return key;
    var parts = key.split('|');
    return parts[0] + ' / ' + parts[1];
  }

  const facetSet = new Set();
  allRows.forEach(r => { var k = getFacetKey(r); if (k) facetSet.add(k); });
  var selectedKeys = [...facetSet].sort();
  if (expandMode === 'asset') selectedKeys.sort(anaWsAssetSort);

  container.innerHTML = '';
  if (!ANA.charts.paretoFacet) ANA.charts.paretoFacet = [];
  ANA.charts.paretoFacet.forEach(c => c && c.dispose());
  ANA.charts.paretoFacet = [];

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

  selectedKeys.forEach((key) => {
    const assetRows = rowsByKey[key] || [];
    var pa = paretoAggregate(assetRows, dimCol, isOutput, 10);

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

    var barName = isOutput ? '产量' : (isPct ? '占比%' : '损失时间(h)');
    var barColor = isOutput ? '#7030a0' : '#b1281e';
    var yName = isOutput ? '产量' : (isPct ? '%' : 'h');
    const chart = echarts.init(div);
    ANA.charts.paretoFacet.push(chart);
    chart.setOption({
      tooltip: { show: !ANA.paretoTooltipOff, trigger: 'axis', axisPointer: { type: 'cross' } },
      grid: { left: '8%', right: '8%', bottom: '15%', top: '15%' },
      xAxis: { type: 'category', data: pa.cats, axisLabel: { fontSize: 8, rotate: 30, hideOverlap: true } },
      yAxis: [{ type: 'value', name: yName, axisLabel: { fontSize: 8 } }, { type: 'value', name: '%', max: 100, axisLabel: { fontSize: 8, formatter: '{value}%' } }],
      series: [
        { name: barName, type: 'bar', data: pa.barData, itemStyle: { color: barColor } },
        { name: '累计占比', type: 'line', yAxisIndex: 1, data: pa.cumData, itemStyle: { color: '#1a1410' }, lineStyle: { width: 1.5 }, symbol: 'circle', symbolSize: 4 }
      ]
    });
  });
}

/* ---- 交叉对比：热力图 ---- */
function renderHeatmap() {
  const workshops = [...new Set(ANA.filtered.map(r => r.workshop).filter(Boolean))].sort();
  const lines = [...new Set(ANA.filtered.map(r => r.line).filter(Boolean))].sort();
  const data = [];
  let maxVal = 0, minVal = Infinity;
  const grouped = {};
  ANA.filtered.forEach(r => {
    const k = r.workshop + '\x00' + r.line;
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(r);
  });
  for (let wi = 0; wi < workshops.length; wi++) {
    for (let li = 0; li < lines.length; li++) {
      const subset = grouped[workshops[wi] + '\x00' + lines[li]];
      if (!subset || !subset.length) { data.push([li, wi, '-']); continue; }
      let val;
      if (ANA.hmMode === 'oae') {
        const oaeRows = subset.filter(r => r.status === '生产');
        val = oaeRows.length ? oaeRows.reduce((s, r) => s + r.oae, 0) / oaeRows.length : 0;
      } else {
        val = subset.reduce((s, r) => s + (r.lossTime > 0 ? r.lossTime : 0), 0);
      }
      val = +val.toFixed(1);
      maxVal = Math.max(maxVal, val); minVal = Math.min(minVal, val);
      data.push([li, wi, val]);
    }
  }
  if (minVal === Infinity) minVal = 0;
  if (maxVal === 0) maxVal = 1;

  const el = $('#heatmapChart');
  let chart = ANA.charts.heatmap;
  if (!chart) { chart = echarts.init(el); ANA.charts.heatmap = chart; }
  const isOae = ANA.hmMode === 'oae';
  chart.setOption({
    title: { text: '车间 × 产线 ' + (isOae ? 'OAE%' : '损失时间'), left: 'center', textStyle: { fontSize: 14, fontFamily: 'Noto Serif SC' } },
    tooltip: { show: !ANA.crossTooltipOff, position: 'top', formatter: p => workshops[p.value[1]] + ' / ' + lines[p.value[0]] + '<br/>' + (isOae ? 'OAE: ' : '损失: ') + p.value[2] + (isOae ? '%' : 'h') },
    grid: { left: '15%', right: '5%', bottom: '10%', top: '15%' },
    xAxis: { type: 'category', data: lines, axisLabel: { rotate: 30, fontSize: 10 } },
    yAxis: { type: 'category', data: workshops },
    visualMap: {
      min: minVal, max: maxVal, calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
      inRange: { color: isOae ? ['#b1281e', '#d6c9ad', '#1a1410'] : ['#1a1410', '#d6c9ad', '#b1281e'] }
    },
    series: [{ type: 'heatmap', data: data, label: { show: true, fontSize: 9, fontFamily: 'JetBrains Mono' }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } } }]
  });
}

/* ---- 交叉对比：堆叠柱状图 ---- */
function renderStack() {
  const dimKey = { shift: 'shift', workshop: 'workshop', line: 'line' }[ANA.stackDim];
  const groups = [...new Set(ANA.filtered.map(r => r[dimKey]).filter(Boolean))].sort();
  const grouped = {};
  ANA.filtered.forEach(r => {
    const g = r[dimKey];
    if (!g) return;
    if (!grouped[g]) grouped[g] = { sl: 0, ul: 0, bo: 0 };
    grouped[g].sl += r.sl; grouped[g].ul += r.ul; grouped[g].bo += r.bo;
  });
  const slData = [], ulData = [], boData = [];
  groups.forEach(g => {
    const s = grouped[g] || { sl: 0, ul: 0, bo: 0 };
    slData.push(+s.sl.toFixed(1));
    ulData.push(+s.ul.toFixed(1));
    boData.push(+s.bo.toFixed(1));
  });
  const el = $('#stackChart');
  let chart = ANA.charts.stack;
  if (!chart) { chart = echarts.init(el); ANA.charts.stack = chart; }
  chart.setOption({
    title: { text: 'SL/UL/BO 堆叠（' + ({ shift: '班次', workshop: '车间', line: '产线' }[ANA.stackDim]) + '）', left: 'center', textStyle: { fontSize: 14, fontFamily: 'Noto Serif SC' } },
    tooltip: { show: !ANA.crossTooltipOff, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 5 },
    grid: { left: '8%', right: '5%', bottom: '12%', top: '15%' },
    xAxis: { type: 'category', data: groups, axisLabel: { rotate: 30, fontSize: 10 } },
    yAxis: { type: 'value', name: '损失时间(h)' },
    series: [
      { name: 'SL', type: 'bar', stack: 'total', data: slData, itemStyle: { color: '#ffc000' } },
      { name: 'UL', type: 'bar', stack: 'total', data: ulData, itemStyle: { color: '#ff0000' } },
      { name: 'BO', type: 'bar', stack: 'total', data: boData, itemStyle: { color: '#00b050' } }
    ]
  });
}

/* ---- 全量渲染 ---- */
function renderAnalysis() {
  applyAnaFilters();
  renderKPI();
  renderStackView();
  renderPareto();
  renderHeatmap();
  renderStack();
}

/* ---- 导出报告 ---- */
function exportAnalysisReport() {
  if (!ANA.filtered.length) { toast('无数据可导出'); return; }
  const filterText = '全部数据';
  const ts = new Date().toLocaleString('zh-CN');

  const rows = ANA.filtered;
  const s = anaKpiSums(rows);
  function pct(v) { return s.total > 0 ? (v / s.total * 100).toFixed(1) : '0.0'; }
  const kpiHtml = [
    { label: 'OAE', value: anaFmtH(s.oae), color: '#0070c0', sub: pct(s.oae) + '%' },
    { label: 'SL', value: anaFmtH(s.sl), color: '#ffc000', sub: pct(s.sl) + '%' },
    { label: 'UL', value: anaFmtH(s.ul), color: '#ff0000', sub: pct(s.ul) + '%' },
    { label: 'BO', value: anaFmtH(s.bo), color: '#00b050', sub: pct(s.bo) + '%' }
  ].map(c => '<div class="kpi-card" style="border-left:3px solid ' + c.color + '"><div class="kpi-val" style="color:' + c.color + '">' + c.value + '</div><div class="kpi-label">' + c.label + '</div><div class="kpi-sub">' + c.sub + '</div></div>').join('');
  const chartIds = ['paretoChart', 'heatmapChart', 'stackChart'];
  const chartTitles = ['损失 Pareto 分析', '车间×产线 热力图', 'SL/UL/BO 堆叠柱状图'];
  const chartMap = { paretoChart: 'pareto', heatmapChart: 'heatmap', stackChart: 'stack' };
  const images = chartIds.map((id, i) => {
    const c = ANA.charts[id] || ANA.charts[chartMap[id]];
    if (!c) return '<p style="color:#999">[' + chartTitles[i] + ' 图表未渲染]</p>';
    const imgUrl = c.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#f3ecdc' });
    return '<h3 style="font-family:Noto Serif SC;margin:1rem 0 .3rem">' + chartTitles[i] + '</h3><img src="' + imgUrl + '" style="max-width:100%;border:1px solid #b8a98a;margin-bottom:.5rem">';
  }).join('');

  const html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>AE数据分析报告 — ' + S.fileName + '</title>' +
    '<style>body{font-family:"Noto Serif SC",serif;background:#f3ecdc;color:#1a1410;max-width:1200px;margin:0 auto;padding:2rem}' +
    'h1{text-align:center;letter-spacing:.2em;border-bottom:3px solid #1a1410;padding-bottom:.5rem}' +
    '.meta{text-align:center;color:#6b6258;font-size:.85rem;margin:.3rem 0 1rem}' +
    '.kpi-row{display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap}' +
    '.kpi-card{flex:1;min-width:140px;background:#ece3cf;border:1px solid #d6c9ad;padding:.8rem;text-align:center}' +
    '.kpi-val{font-family:"JetBrains Mono",monospace;font-size:1.8rem;font-weight:700}' +
    '.kpi-label{font-size:.85rem;color:#3a2f25;margin-top:.2rem}.kpi-sub{font-size:.7rem;color:#6b6258;margin-top:.1rem}' +
    '</style></head><body>' +
    '<h1>AE 数据分析报告</h1><div class="meta">文件：' + S.fileName + ' | 筛选：' + filterText + ' | 生成时间：' + ts + '</div>' +
    '<div class="kpi-row">' + kpiHtml + '</div>' + images +
    '</body></html>';

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url; a.download = S.fileName.replace(/\.(xlsx|xlsm)$/, '') + '-Analysis-Report.html';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
  toast('已导出分析报告');
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
function initAnalysis() {
  if (ANA.initialized) { renderAnalysis(); return; }
  ANA.raw = extractRawData();
  ANA.initialized = true;

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
    det.addEventListener('toggle', function(e) {
      var icon = this.querySelector('.lock-icon.locked');
      if (icon) { this.open = true; }
    });
  });

  const wsAssetMap = {};
  ANA.raw.forEach(r => {
    if (!r.workshop) return;
    if (!wsAssetMap[r.workshop]) wsAssetMap[r.workshop] = new Set();
    if (r.asset) wsAssetMap[r.workshop].add(r.asset);
  });
  Object.keys(wsAssetMap).forEach(ws => {
    const menu = $('#dd-' + ws);
    if (!menu) return;
    const assets = [...wsAssetMap[ws]].sort(anaAssetSort);
    menu.innerHTML = '<label class="ana-dd-all"><input type="checkbox" data-stackws-all="' + escAA(ws) + '" checked>全选</label>' + assets.map(asset =>
      '<label><input type="checkbox" data-stackasset="' + escAA(ws) + '|' + escAA(asset) + '" checked>' + escAA(asset) + '</label>'
    ).join('');
  });

  $('#anaExportBtn').addEventListener('click', exportAnalysisReport);
  $('#anaReloadBtn').addEventListener('click', function() {
    Object.values(ANA.charts).forEach(c => { if (c && c.dispose) c.dispose(); if (Array.isArray(c)) c.forEach(fc => fc && fc.dispose && fc.dispose()); });
    ANA.charts = {};
    ANA.hoveredSeriesName = null;
    ANA.stackAssets = null;
    ANA.stackAssetsActive = false;
    ANA.stackExpand = 'none';
    ANA.stackTooltipOff = false;
    ANA.stackZoomStart = null;
    ANA.stackZoomEnd = null;
    ANA.stackAllKeys = null;
    ANA.stackZoomPct = null;
    ANA.stackMap = null;
    ANA.stackCatMap = null;
    ANA.stackCatRows = null;
    ANA.stackCatGrain = null;
    ANA.paretoAssets = null;
    ANA.paretoAssetsActive = false;
    ANA.paretoExpand = 'none';
    ANA.paretoTooltipOff = false;
    ANA.crossTooltipOff = false;
    ANA.stackView = 'month';
    ANA.stackMode = 'abs';
    ANA.stackRange = 'all';
    ANA.stackRangeDay = 'all';
    ANA.paretoView = 'month';
    ANA.paretoMode = 'abs';
    ANA.dim = 'reason';
    ANA.hmMode = 'oae';
    ANA.stackDim = 'shift';
    ANA.raw = extractRawData();
    $$('#stackAssetToggle input[type=checkbox]').forEach(cb => cb.checked = true);
    $$('#paretoAssetToggle input[type=checkbox]').forEach(cb => cb.checked = true);
    $$('#stackAssetToggle .ad-btn').forEach(b => b.classList.remove('active'));
    $('[data-stackasset-all]').classList.add('active');
    $$('#paretoAssetToggle .ad-btn').forEach(b => b.classList.remove('active'));
    $('[data-passet-all]').classList.add('active');
    _updateStackAssetBtnLabels();
    _updateParetoAssetBtnLabels();
    $$('#anaStack .ad-btn[data-stackview]').forEach(b => b.classList.toggle('active', b.dataset.stackview === 'month'));
    $$('#anaStack .ad-btn[data-stackmode]').forEach(b => b.classList.toggle('active', b.dataset.stackmode === 'abs'));
    $$('#anaPareto .ad-btn[data-pdim]').forEach(b => b.classList.toggle('active', b.dataset.pdim === 'reason'));
    $$('#anaPareto .ad-btn[data-pview]').forEach(b => b.classList.toggle('active', b.dataset.pview === 'month'));
    $$('#anaPareto .ad-btn[data-pmode]').forEach(b => b.classList.toggle('active', b.dataset.pmode === 'abs'));
    $$('#anaCross .ad-btn[data-hm]').forEach(b => b.classList.toggle('active', b.dataset.hm === 'oae'));
    $$('#anaCross .ad-btn[data-stack]').forEach(b => b.classList.toggle('active', b.dataset.stack === 'shift'));
    $$('#anaStack .ad-btn[data-stackexpand]').forEach(b => b.classList.toggle('active', b.dataset.stackexpand === 'none'));
    $$('#anaStack #stackTooltipBtn').classList.remove('active');
    $$('#anaPareto .ad-btn[data-pexpand]').forEach(b => b.classList.toggle('active', b.dataset.pexpand === 'none'));
    $$('#anaPareto #paretoTooltipBtn').classList.remove('active');
    $('#stackFacetContainer').style.display = 'none';
    $('#stackFacetContainer').innerHTML = '';
    $$('.lock-icon.locked').forEach(icon => {
      icon.classList.remove('locked');
      var body = icon.querySelector('.lock-body');
      if (body) body.setAttribute('fill', 'none');
    });
    $$('.ana-section').forEach(det => det.open = false);
    $('#anaStack').open = true;
    renderAnalysis();
  });

  $$('#anaStack .ad-btn[data-stackexpand]').forEach(btn => btn.addEventListener('click', function() {
    $$('#anaStack .ad-btn[data-stackexpand]').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    ANA.stackExpand = this.dataset.stackexpand;
    renderStackView();
  }));

  $('#stackTooltipBtn').addEventListener('click', function() {
    ANA.stackTooltipOff = !ANA.stackTooltipOff;
    this.classList.toggle('active', ANA.stackTooltipOff);
    renderStackView();
  });

  $$('#anaStack .ad-btn[data-stackview]').forEach(btn => btn.addEventListener('click', () => {
    $$('#anaStack .ad-btn[data-stackview]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ANA.stackView = btn.dataset.stackview;
    renderStackView();
  }));
  $$('#anaStack .ad-btn[data-stackmode]').forEach(btn => btn.addEventListener('click', () => {
    $$('#anaStack .ad-btn[data-stackmode]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ANA.stackMode = btn.dataset.stackmode;
    renderStackView();
  }));
  $$('input[name="stackrange"]').forEach(radio => radio.addEventListener('change', function() {
    ANA.stackRange = this.value;
    renderStackView();
  }));
  $$('input[name="stackrange-day"]').forEach(radio => radio.addEventListener('change', function() {
    ANA.stackRangeDay = this.value;
    renderStackView();
  }));
  $('[data-stackview="month"]').addEventListener('click', function(e) {
    if (e.target === this) {
      e.stopPropagation();
      $('#dd-stackrange-day').classList.remove('open');
      $('#dd-stackrange').classList.toggle('open');
    }
  });
  $('#dd-stackrange').addEventListener('click', e => e.stopPropagation());
  $('[data-stackview="day"]').addEventListener('click', function(e) {
    if (e.target === this) {
      e.stopPropagation();
      $('#dd-stackrange').classList.remove('open');
      $('#dd-stackrange-day').classList.toggle('open');
    }
  });
  $('#dd-stackrange-day').addEventListener('click', e => e.stopPropagation());
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
  $$('#stackAssetToggle .ana-ws-dropdown > .ad-btn').forEach(btn => btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const menu = this.nextElementSibling;
    menu.classList.toggle('open');
  }));
  document.addEventListener('click', () => {
    $$('#stackAssetToggle .ana-dropdown-menu').forEach(m => m.classList.remove('open'));
    $$('#paretoAssetToggle .ana-dropdown-menu').forEach(m => m.classList.remove('open'));
    const srm = $('#dd-stackrange'); if (srm) srm.classList.remove('open');
    const srd = $('#dd-stackrange-day'); if (srd) srd.classList.remove('open');
  });
  $$('#stackAssetToggle .ana-dropdown-menu').forEach(menu => menu.addEventListener('click', e => e.stopPropagation()));
  $$('#stackAssetToggle input[type=checkbox][data-stackws-all]').forEach(cb => cb.addEventListener('change', function() {
    if (!ANA.stackAssets) ANA.stackAssets = new Set();
    ANA.stackAssetsActive = true;
    const ws = this.dataset.stackwsAll;
    const assetCbs = $$('#dd-' + ws + ' input[type=checkbox][data-stackasset]');
    if (!this.checked) {
      if (ANA.stackAssets.size === 0) {
        $$('#stackAssetToggle input[type=checkbox][data-stackasset]').forEach(acb => ANA.stackAssets.add(acb.dataset.stackasset));
      }
      assetCbs.forEach(acb => { acb.checked = false; ANA.stackAssets.delete(acb.dataset.stackasset); });
    } else {
      assetCbs.forEach(acb => { acb.checked = true; ANA.stackAssets.add(acb.dataset.stackasset); });
    }
    $('[data-stackasset-all]').classList.toggle('active', !ANA.stackAssetsActive);
    _updateStackAssetBtnLabels();
    renderStackView();
  }));
  $$('#stackAssetToggle input[type=checkbox][data-stackasset]').forEach(cb => cb.addEventListener('change', function() {
    if (!ANA.stackAssets) ANA.stackAssets = new Set();
    ANA.stackAssetsActive = true;
    const key = this.dataset.stackasset;
    if (this.checked) {
      ANA.stackAssets.add(key);
    } else {
      if (ANA.stackAssets.size === 0) {
        $$('#stackAssetToggle input[type=checkbox][data-stackasset]').forEach(acb => ANA.stackAssets.add(acb.dataset.stackasset));
      }
      ANA.stackAssets.delete(key);
    }
    const ws = key.split('|')[0];
    const allCb = $('#dd-' + ws + ' input[data-stackws-all]');
    const assetCbs = $$('#dd-' + ws + ' input[type=checkbox][data-stackasset]');
    if (allCb) allCb.checked = assetCbs.length > 0 && assetCbs.every(acb => acb.checked);
    $('[data-stackasset-all]').classList.toggle('active', !ANA.stackAssetsActive);
    _updateStackAssetBtnLabels();
    renderStackView();
  }));
  // Pareto asset dropdown population
  Object.keys(wsAssetMap).forEach(ws => {
    const menu = $('#dd-pareto-' + ws);
    if (!menu) return;
    const assets = [...wsAssetMap[ws]].sort(anaAssetSort);
    menu.innerHTML = '<label class="ana-dd-all"><input type="checkbox" data-pws-all="' + escAA(ws) + '" checked>全选</label>' + assets.map(asset =>
      '<label><input type="checkbox" data-passet="' + escAA(ws) + '|' + escAA(asset) + '" checked>' + escAA(asset) + '</label>'
    ).join('');
  });

  // Pareto events
  $$('#anaPareto .ad-btn[data-pdim]').forEach(btn => btn.addEventListener('click', () => {
    $$('#anaPareto .ad-btn[data-pdim]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ANA.dim = btn.dataset.pdim;
    renderPareto();
  }));
  $$('#anaPareto .ad-btn[data-pview]').forEach(btn => btn.addEventListener('click', () => {
    $$('#anaPareto .ad-btn[data-pview]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ANA.paretoView = btn.dataset.pview;
    renderPareto();
  }));
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
  $$('#paretoAssetToggle .ana-ws-dropdown > .ad-btn').forEach(btn => btn.addEventListener('click', function(e) {
    e.stopPropagation();
    this.nextElementSibling.classList.toggle('open');
  }));
  $$('#paretoAssetToggle .ana-dropdown-menu').forEach(menu => menu.addEventListener('click', e => e.stopPropagation()));
  $$('#paretoAssetToggle input[type=checkbox][data-pws-all]').forEach(cb => cb.addEventListener('change', function() {
    if (!ANA.paretoAssets) ANA.paretoAssets = new Set();
    ANA.paretoAssetsActive = true;
    const ws = this.dataset.pwsAll;
    const assetCbs = $$('#dd-pareto-' + ws + ' input[type=checkbox][data-passet]');
    if (!this.checked) {
      if (ANA.paretoAssets.size === 0) {
        $$('#paretoAssetToggle input[type=checkbox][data-passet]').forEach(acb => ANA.paretoAssets.add(acb.dataset.passet));
      }
      assetCbs.forEach(acb => { acb.checked = false; ANA.paretoAssets.delete(acb.dataset.passet); });
    } else {
      assetCbs.forEach(acb => { acb.checked = true; ANA.paretoAssets.add(acb.dataset.passet); });
    }
    $('[data-passet-all]').classList.toggle('active', !ANA.paretoAssetsActive);
    _updateParetoAssetBtnLabels();
    renderPareto();
  }));
  $$('#paretoAssetToggle input[type=checkbox][data-passet]').forEach(cb => cb.addEventListener('change', function() {
    if (!ANA.paretoAssets) ANA.paretoAssets = new Set();
    ANA.paretoAssetsActive = true;
    const key = this.dataset.passet;
    if (this.checked) {
      ANA.paretoAssets.add(key);
    } else {
      if (ANA.paretoAssets.size === 0) {
        $$('#paretoAssetToggle input[type=checkbox][data-passet]').forEach(acb => ANA.paretoAssets.add(acb.dataset.passet));
      }
      ANA.paretoAssets.delete(key);
    }
    const ws = key.split('|')[0];
    const allCb = $('#dd-pareto-' + ws + ' input[data-pws-all]');
    const assetCbs = $$('#dd-pareto-' + ws + ' input[type=checkbox][data-passet]');
    if (allCb) allCb.checked = assetCbs.length > 0 && assetCbs.every(acb => acb.checked);
    $('[data-passet-all]').classList.toggle('active', !ANA.paretoAssetsActive);
    _updateParetoAssetBtnLabels();
    renderPareto();
  }));
  $('#crossTooltipBtn').addEventListener('click', function() {
    ANA.crossTooltipOff = !ANA.crossTooltipOff;
    this.classList.toggle('active', ANA.crossTooltipOff);
    renderHeatmap();
    renderStack();
  });
  $$('#anaCross .ad-btn[data-hm]').forEach(btn => btn.addEventListener('click', () => {
    $$('#anaCross .ad-btn[data-hm]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ANA.hmMode = btn.dataset.hm;
    renderHeatmap();
  }));
  $$('#anaCross .ad-btn[data-stack]').forEach(btn => btn.addEventListener('click', () => {
    $$('#anaCross .ad-btn[data-stack]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ANA.stackDim = btn.dataset.stack;
    renderStack();
  }));

  window.addEventListener('resize', () => {
    Object.values(ANA.charts).forEach(c => { if (c && c.resize) c.resize(); if (Array.isArray(c)) c.forEach(fc => fc && fc.resize()); });
  });

  renderAnalysis();
}

function switchToAnalysis() {
  $('#stage-review').classList.remove('active');
  $('#stage-analysis').classList.add('active');
  $$('#viewToggle .vt-btn').forEach(b => b.classList.toggle('active', b.dataset.view === 'analysis'));
  setTimeout(() => { initAnalysis(); Object.values(ANA.charts).forEach(c => { if (c && c.resize) c.resize(); if (Array.isArray(c)) c.forEach(fc => fc && fc.resize()); }); }, 100);
}

function switchToReview() {
  $('#stage-analysis').classList.remove('active');
  $('#stage-review').classList.add('active');
  $$('#viewToggle .vt-btn').forEach(b => b.classList.toggle('active', b.dataset.view === 'review'));
}
