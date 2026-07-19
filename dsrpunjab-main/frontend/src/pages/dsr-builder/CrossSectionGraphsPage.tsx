import React, { useEffect, useRef, useState } from "react";
import { Download, Plus, Layers, Save, Trash2 } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import { useLocalDraft } from "../../hooks/useLocalDraft";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { projectsApi } from "../../api/projects.api";
import jsPDF from "jspdf";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const uiPointLabelsPlugin = {
  id: 'uiPointLabels',
  afterDatasetsDraw(chart: any) {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset: any, i: number) => {
      if (dataset.label && dataset.label.includes('Elevation')) {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((element: any, index: number) => {
          ctx.fillStyle = '#1e293b';
          ctx.font = '11px "Times New Roman"';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          const val = dataset.data[index];
          if (val !== undefined && val !== null) ctx.fillText(Number(val).toFixed(2), element.x + 8, element.y - 6);
        });
      }
    });
  }
};

type Graph = {
  id: string;
  name: string;
  dist: string;
  post: string;
  red: string;
  thal: string;
  area: string;
  noMine: string;
  bulk: string;
  pct: string;
  calcThick?: string;
  hasSubGraph?: boolean;
  subName?: string;
  subDist?: string;
  subElev?: string;
  subRed?: string;
  subThal?: string;
  pdfLayout?: 1 | 2;
};

const seed: Graph = {
  id: 'g' + Date.now(),
  name: "PO_JL_NR_ST_28",
  dist: "0,25,50",
  post: "227.76,227.75,227.65",
  red: "224.30",
  thal: "223.40",
  area: "1.60",
  noMine: "0",
  bulk: "1.52",
  pct: "60",
  calcThick: "3.0",
  hasSubGraph: false,
  subName: 'PR_JL_NR_ST_28',
  subDist: '0,25,50',
  subElev: '227.59,227.39,227.26',
  subRed: '224.30',
  subThal: '223.40',
  pdfLayout: 1
};

function getYBounds(values: number[]) {
  if (!values.length) return { min: 220, max: 230 };
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const diff = maxVal - minVal;
  const pad = Math.max(diff * 0.1, 0.2);
  const min = Math.floor((minVal - pad) * 10) / 10;
  const max = Math.ceil((maxVal + pad) * 10) / 10;
  return { min, max };
}

function calcGraph(g: Graph) {
  const dist = (String(g.dist || '')).split(',').map(Number).filter(v => !isNaN(v));
  const post = (String(g.post || '')).split(',').map(Number).filter(v => !isNaN(v));
  const subDistSrc = g.subDist !== undefined ? g.subDist : g.dist;
  const subDist = (String(subDistSrc || '')).split(',').map(Number).filter(v => !isNaN(v));
  const subElevSrc = g.subElev !== undefined ? g.subElev : g.post;
  const subElev = (String(subElevSrc || '')).split(',').map(Number).filter(v => !isNaN(v));
  const red = Number(g.red) || 0;
  const thal = Number(g.thal) || 0;
  const subRed = g.subRed !== undefined ? Number(g.subRed) : red;
  const subThal = g.subThal !== undefined ? Number(g.subThal) : thal;
  const area = Number(g.area) || 0;
  const noMine = Number(g.noMine) || 0;
  const bulk = Number(g.bulk) || 1.52;
  const pct = Number(g.pct) || 60;
  
  const thickPre = subElev.map(e => Math.max(0, e - subRed));
  const avgThickPre = thickPre.length ? thickPre.reduce((a, b) => a + b, 0) / thickPre.length : 0;
  
  const thickPost = post.map(e => Math.max(0, e - red));
  const avgThickPost = thickPost.length ? thickPost.reduce((a, b) => a + b, 0) / thickPost.length : 0;
  
  const activeCalcThick = g.calcThick && !isNaN(Number(g.calcThick)) ? Number(g.calcThick) : avgThickPost;
  
  const pArea = Math.max(0, area - noMine);
  const volume = pArea * 10000 * activeCalcThick;
  const tonnes = volume * bulk;
  const allowed = tonnes * (pct / 100);
  
  return {
    dist, post, subDist, subElev, thickPre, avgThickPre, thickPost, avgThickPost,
    activeCalcThick, avgThick: activeCalcThick, pArea, volume, tonnes, allowed,
    red, thal, subRed, subThal, bulk, area, noMine, pct
  };
}

// ------------- PDF HELPERS --------------
function buildGraphPdfPageHTML(g: Graph, o: any, imgPost: string, imgPre: string, pageNum: number) {
  const mathStr = `${o.pArea.toFixed(2)}*10000*${o.activeCalcThick.toFixed(1)}*${g.bulk}=${o.tonnes.toFixed(2)} Tonnes`;
  const allowedStr = o.allowed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  let page = '';
  if (g.hasSubGraph && g.pdfLayout !== 2) {
    const maxLen = Math.max(o.dist.length, o.subDist.length);
    let dualTableRows = '';
    for (let i = 0; i < maxLen; i++) {
      const preVal = o.thickPre[i] !== undefined ? o.thickPre[i].toFixed(2) : '-';
      const postVal = o.thickPost[i] !== undefined ? o.thickPost[i].toFixed(2) : '-';
      dualTableRows += `<tr>
        <td style="background:#f1f3fa;border:1px solid #fff;padding:4px;">${postVal}</td>
        <td style="background:#f1f3fa;border:1px solid #fff;padding:4px;">${preVal}</td>
      </tr>`;
    }
    page = `
    <div id="pdf-container" style="width:1040px;height:710px;position:relative;background:#fff;color:#000;font-family:'Times New Roman',serif;box-sizing:border-box;font-size:15px;margin:0;overflow:hidden;">
      <div style="position:absolute;top:50px;left:20px;width:330px;line-height:1.3;">
        <div><b>Source-</b> Primary Data generated<br>by DGPS<br>Hi- Target DGPS ( Model No.<br>V30plus)</div>
        <div style="font-size:18px;font-weight:bold;margin:15px 0 10px 0;">Calculation</div>
        <div style="padding-left:18px;position:relative;"><span style="position:absolute;left:0;">➢</span><b>Total Area: ${g.area}Ha.(Source:Table no. 7.2)</b></div>
        <div style="padding-left:18px;position:relative;margin:8px 0;"><span style="position:absolute;left:0;">➢</span><b>No mining area: ${g.noMine} Ha.</b> &nbsp;&nbsp;&nbsp;&nbsp;(Source: Page No 84)</div>
        <div style="padding-left:18px;font-size:14px;">Potential area(Ha.): Total area(Ha.)- No mining Area(Ha.)<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${g.area}-${g.noMine}=${o.pArea.toFixed(2)} Ha.</div>
        <div style="padding-left:18px;position:relative;margin-top:15px;"><span style="position:absolute;left:0;">➢</span>Potential Area(Ha.):${o.pArea.toFixed(2)}</div>
        <div style="padding-left:18px;position:relative;"><span style="position:absolute;left:0;">➢</span>Average Thickness:${o.activeCalcThick.toFixed(1)}</div>
        <div style="padding-left:18px;position:relative;"><span style="position:absolute;left:0;">➢</span>Bulk Density:${g.bulk}</div>
        <div style="margin:4px 0;font-size:15px;">${mathStr}</div>
        <div style="padding-left:18px;position:relative;"><span style="position:absolute;left:0;">➢</span>Total excavation in Tonnes<br>&nbsp;&nbsp;&nbsp;(Considering ${g.pct}% as per EMGSM,<br>&nbsp;&nbsp;&nbsp;2020)=${allowedStr}</div>
        <div style="margin-top:70px;margin-left:20px;">
          <div style="display:flex;align-items:center;margin-bottom:6px;"><span style="display:inline-block;width:35px;height:3px;background:#de3b3b;margin-right:8px;"></span> Red Line</div>
          <div style="display:flex;align-items:center;margin-bottom:6px;"><span style="display:inline-block;width:35px;height:3px;background:#da8b4e;margin-right:8px;"></span> Post monsoon Elevation</div>
          <div style="display:flex;align-items:center;margin-bottom:6px;"><span style="display:inline-block;width:35px;height:3px;background:#eec34a;margin-right:8px;"></span> Pre monsoon Elevation</div>
          <div style="display:flex;align-items:center;margin-bottom:6px;"><span style="display:inline-block;width:35px;height:3px;background:#3b8bba;margin-right:8px;"></span> Thalweg line</div>
        </div>
      </div>
      <div style="position:absolute;top:480px;left:320px;font-size:16px;transform:rotate(-90deg);transform-origin:left top;">Elevation (m)</div>
      <div style="position:absolute;top:35px;left:360px;width:480px;text-align:center;">
        <div style="font-size:18px;">Cross Section Sand Bar</div>
        <div style="font-size:16px;font-weight:bold;margin-bottom:5px;">${g.name || 'Post Monsoon'}</div>
        <img src="${imgPost}" style="width:100%;margin-bottom:20px;" />
        <div style="font-size:16px;font-weight:bold;margin-bottom:5px;">${g.subName || 'Pre Monsoon'}</div>
        <img src="${imgPre}" style="width:100%;margin-bottom:5px;" />
        <div style="font-size:16px;">Distance of the sand bar from river bank towards river (m)</div>
      </div>
      <div style="position:absolute;top:120px;right:20px;width:180px;text-align:center;font-size:16px;">
        <div style="text-align:left;margin-left:10px;">Post Monsoon<br>Average Thickness:${o.avgThickPost.toFixed(2)}</div>
        <table style="width:100%;border-collapse:collapse;text-align:center;font-size:12px;margin-top:100px;margin-bottom:100px;">
          <tr>
            <th style="background:#e4e7f2;border:1px solid #fff;padding:4px;font-weight:normal;">Post-<br>Thickness</th>
            <th style="background:#e4e7f2;border:1px solid #fff;padding:4px;font-weight:normal;">Pre-<br>Thickness</th>
          </tr>
          ${dualTableRows}
          <tr>
            <td style="background:#e4e7f2;border:1px solid #fff;padding:4px;font-weight:bold;">${o.avgThickPost.toFixed(2)}</td>
            <td style="background:#e4e7f2;border:1px solid #fff;padding:4px;font-weight:bold;">${o.avgThickPre.toFixed(2)}</td>
          </tr>
        </table>
        <div style="text-align:left;margin-left:10px;">Pre Monsoon<br>Average Thickness:${o.avgThickPre.toFixed(2)}</div>
      </div>
      <div style="position:absolute;bottom:30px;left:330px;width:650px;font-size:13px;line-height:1.3;">
        Note: The levels given in the cross- section as observed in the field has been checked and found<br>nearly matching with the office record.
      </div>
      <div style="position:absolute;bottom:-5px;right:0;font-size:20px;font-weight:bold;padding:5px;background:#fff;">${pageNum}</div>
      <div style="position:absolute;top:20px;left:20px;width:1000px;height:670px;border:1px solid #000;pointer-events:none;"></div>
    </div>`;
  } else {
    // pdfLayout === 2 (Format 2)
    const imgPost2 = g.pdfLayout === 2 ? getFormat2PdfChartDataURL(g, o, 'post') : '';
    const imgPre2 = (g.hasSubGraph && g.pdfLayout === 2) ? getFormat2PdfChartDataURL(g, o, 'pre') : '';

    if (g.pdfLayout === 2) {
      page = `
      <div id="pdf-container" style="width:1040px;height:710px;position:relative;background:#fff;color:#000;font-family:Arial,sans-serif;box-sizing:border-box;margin:0;overflow:hidden;padding:20px;">
        <div style="text-align:center;font-size:14px;margin-bottom:10px;">Site: ${g.name}</div>
        ${g.hasSubGraph ? `
        <div style="border: 2px solid #ccc; padding: 10px; margin-bottom: 20px; height: 310px;">
           <img src="${imgPre2}" style="width:100%; height: 100%; object-fit: contain;" />
        </div>
        ` : ''}
        <div style="border: 2px solid #ccc; padding: 10px; height: 310px;">
           <img src="${imgPost2}" style="width:100%; height: 100%; object-fit: contain;" />
        </div>
        <div style="position:absolute;bottom:10px;right:20px;font-size:14px;">${pageNum}</div>
      </div>`;
    } else {
      const singleTableRows = o.dist.map((_d: any, i: number) => `<tr><td style="background:#f1f3fa;border:1px solid #fff;padding:4px;">${o.thickPost[i] !== undefined ? o.thickPost[i].toFixed(2) : '-'}</td></tr>`).join('');
      page = `
      <div id="pdf-container" style="width:1040px;height:710px;position:relative;background:#fff;color:#000;font-family:'Times New Roman',serif;box-sizing:border-box;font-size:15px;margin:0;overflow:hidden;">
        <div style="position:absolute;top:10px;left:0;width:100%;text-align:center;font-size:18px;">Cross Section Sand Bar</div>
        <div style="position:absolute;top:35px;left:0;width:100%;text-align:center;font-size:17px;font-weight:bold;">${g.name}</div>
        <div style="position:absolute;top:70px;left:20px;width:330px;line-height:1.3;">
          <div><b>Source-</b> Primary Data generated<br>by DGPS<br>Hi- Target DGPS ( Model No.<br>V30plus)</div>
          <div style="font-size:18px;font-weight:bold;margin:15px 0 10px 0;">Calculation</div>
          <div style="padding-left:18px;position:relative;"><span style="position:absolute;left:0;">➢</span><b>Total Area: ${g.area} Ha.</b>(Source: Table 7.2 )</div>
          <div style="padding-left:18px;position:relative;margin-bottom:8px;"><span style="position:absolute;left:0;">➢</span><b>No mining area: ${g.noMine}Ha.</b> (Source: Page No 88)</div>
          <div style="padding-left:18px;">Potential area(Ha.): Total area(Ha.)- No mining Area(Ha.)<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${g.area}-${g.noMine}=${o.pArea.toFixed(2)} Ha.</div>
          <div style="padding-left:18px;position:relative;margin-top:8px;"><span style="position:absolute;left:0;">➢</span>Potential Area(Ha.):${o.pArea.toFixed(2)}</div>
          <div style="padding-left:18px;position:relative;"><span style="position:absolute;left:0;">➢</span>Average Thickness:${o.activeCalcThick.toFixed(2)}</div>
          <div style="padding-left:18px;position:relative;"><span style="position:absolute;left:0;">➢</span>Bulk Density:${g.bulk}</div>
          <div style="margin:4px 0;font-size:15px;">${mathStr.replace('Tonnes', 'Ton<br>es')}</div>
          <div style="padding-left:18px;position:relative;"><span style="position:absolute;left:0;">➢</span>Total excavation in Tonnes<br>(Considering ${g.pct}% as per EMGSM,<br>2020)=${allowedStr}</div>
          <div style="margin-top:40px;">
            <div style="display:flex;align-items:center;margin-bottom:6px;"><span style="display:inline-block;width:35px;height:3px;background:#de3b3b;margin-right:8px;"></span> Red Line</div>
            <div style="display:flex;align-items:center;margin-bottom:6px;"><span style="display:inline-block;width:35px;height:3px;background:#3b82f6;margin-right:8px;"></span> Post monsoon Elevation</div>
            <div style="display:flex;align-items:center;margin-bottom:6px;"><span style="display:inline-block;width:35px;height:3px;background:#8b5cf6;margin-right:8px;"></span> Thalweg line</div>
          </div>
        </div>
        <div style="position:absolute;top:85px;left:360px;width:550px;text-align:center;">
          <img src="${imgPost}" style="width:100%;margin-bottom:5px;" />
          <div style="font-size:16px;">Distance of the sand bar from river bank towards river (m)</div>
        </div>
        <div style="position:absolute;top:180px;right:20px;width:110px;">
          <table style="width:100%;border-collapse:collapse;text-align:center;font-size:13px;">
            <tr><th style="background:#e4e7f2;border:1px solid #fff;padding:4px;font-weight:normal;">Post -Thickness</th></tr>
            ${singleTableRows}
            <tr><td style="background:#f1f3fa;border:1px solid #fff;padding:4px;font-weight:bold;">${o.avgThickPost.toFixed(2)}</td></tr>
          </table>
        </div>
        <div style="position:absolute;top:375px;right:-15px;width:220px;text-align:center;font-size:16px;line-height:1.3;">
          Post Monsoon<br>Average Thickness: ${o.avgThickPost.toFixed(2)}
        </div>
        <div style="position:absolute;bottom:40px;left:360px;width:550px;font-size:13px;line-height:1.3;">
          Note: The levels given in the cross- section as observed in the field has been checked and found<br>nearly matching with the office record.
        </div>
        <div style="position:absolute;bottom:-5px;right:0;font-size:20px;font-weight:bold;padding:5px;background:#fff;">${pageNum}</div>
        <div style="position:absolute;top:5px;left:5px;width:1025px;height:695px;border:1px solid #000;pointer-events:none;"></div>
      </div>`;
    }
  }
  const exportStyles = `<style>
    .cross-section-pdf-page { font-size:12px !important; line-height:1.2 !important; }
    .cross-section-pdf-page [style*="font-size:20px"] { font-size:14px !important; }
    .cross-section-pdf-page [style*="font-size:18px"] { font-size:13px !important; }
    .cross-section-pdf-page [style*="font-size:17px"] { font-size:12px !important; }
    .cross-section-pdf-page [style*="font-size:16px"] { font-size:12px !important; }
    .cross-section-pdf-page [style*="font-size:15px"] { font-size:11px !important; }
    .cross-section-pdf-page [style*="font-size:14px"] { font-size:10px !important; }
    .cross-section-pdf-page [style*="font-size:13px"] { font-size:10px !important; }
    .cross-section-pdf-page [style*="font-size:12px"] { font-size:9px !important; }
    .cross-section-pdf-page [style*="font-size:11px"] { font-size:9px !important; }
    .cross-section-pdf-page [style*="font-size:10px"] { font-size:8px !important; }
  </style>`;
  return exportStyles + page.replace('id="pdf-container"', 'id="pdf-container" class="cross-section-pdf-page"');
}

const getPdfChartDataURL = (g: Graph, o: any, type: 'pre' | 'post'): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 600 * 3;
  canvas.height = 280 * 3;
  
  const isPre = type === 'pre';
  const dists = isPre ? o.subDist : o.dist;
  const elevs = isPre ? o.subElev : o.post;
  const redArr = isPre ? dists.map(() => o.subRed) : dists.map(() => o.red);
  const thalArr = isPre ? dists.map(() => o.subThal) : dists.map(() => o.thal);

  const postY = [...o.post, o.red, o.thal].filter((v: number) => !isNaN(v));
  const { min: postYMin, max: postYMax } = getYBounds(postY);
  const preY = [...(g.hasSubGraph ? o.subElev : []), o.subRed, o.subThal].filter((v: number) => !isNaN(v));
  const { min: preYMin, max: preYMax } = getYBounds(preY);
  const yMin = isPre ? preYMin : postYMin;
  const yMax = isPre ? preYMax : postYMax;

  const chart = new ChartJS(canvas, {
    type: 'line',
    data: {
      labels: dists,
      datasets: [
        { label: isPre ? 'Pre monsoon Elevation' : 'Post monsoon Elevation', data: elevs, borderColor: isPre ? '#eec34a' : '#da8b4e', backgroundColor: isPre ? '#eec34a' : '#da8b4e', pointBackgroundColor: isPre ? '#eec34a' : '#da8b4e', tension: 0.1, pointRadius: 12, borderWidth: 4.5, fill: false },
        { label: 'Red Line', data: redArr, borderColor: '#de3b3b', pointBackgroundColor: '#de3b3b', borderWidth: 4.5, pointRadius: 12, fill: false },
        { label: 'Thalweg', data: thalArr, borderColor: '#3b8bba', pointBackgroundColor: '#3b8bba', borderWidth: 4.5, pointRadius: 12, fill: false }
      ]
    },
    plugins: [{
      id: 'customPdfLabels',
      afterDatasetsDraw(c) {
        const ctx = c.ctx;
        c.data.datasets.forEach((dataset: any, i: number) => {
          if (dataset.label && dataset.label.includes('Elevation')) {
            const meta = c.getDatasetMeta(i);
            meta.data.forEach((element: any, index: number) => {
              ctx.fillStyle = '#000';
              ctx.font = '30px "Times New Roman"';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              const val = dataset.data[index];
              if (val !== undefined && val !== null) ctx.fillText(Number(val).toFixed(2), element.x + 18, element.y - 21);
            });
          }
        });
      }
    }],
    options: {
      animation: false,
      responsive: false,
      layout: { padding: { top: 45, right: 90, bottom: 15, left: 15 } },
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#000', font: { family: 'Times New Roman', size: 30 }, padding: 12 }, grid: { color: '#e5e5e5', lineWidth: 3 } },
        y: { min: yMin, max: yMax, ticks: { color: '#000', font: { family: 'Times New Roman', size: 30 }, padding: 12 }, grid: { color: '#e5e5e5', lineWidth: 3 } }
      }
    }
  });

  const url = canvas.toDataURL('image/png');
  chart.destroy();
  return url;
};

const getFormat2PdfChartDataURL = (g: Graph, o: any, type: 'pre' | 'post'): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 560;
  const isPre = type === 'pre';
  const distances = isPre ? o.subDist : o.dist;
  const elevations = isPre ? o.subElev : o.post;
  const redLine = isPre ? o.subRed : o.red;
  const thalweg = isPre ? o.subThal : o.thal;
  const { min, max } = getYBounds([...elevations, redLine, thalweg].filter((value: number) => Number.isFinite(value)));
  const season = isPre ? 'Pre Monsoon' : 'Post Monsoon';

  const chart = new ChartJS(canvas, {
    type: 'line',
    data: {
      labels: distances,
      datasets: [
        { label: season, data: elevations, borderColor: '#1f77b4', backgroundColor: '#1f77b4', pointRadius: 6, borderWidth: 3, tension: 0, fill: false },
        { label: `Red Line (${isPre ? 'Pre' : 'Post'}-monsoon)`, data: distances.map(() => redLine), borderColor: '#ff7f0e', backgroundColor: '#ff7f0e', pointRadius: 5, borderWidth: 3, fill: false },
        { label: `Thalweg Line (${isPre ? 'Pre' : 'Post'}-monsoon)`, data: distances.map(() => thalweg), borderColor: '#7f7f7f', backgroundColor: '#7f7f7f', pointRadius: 5, borderWidth: 3, fill: false },
      ],
    },
    options: {
      animation: false,
      responsive: false,
      layout: { padding: { top: 15, right: 30, bottom: 15, left: 15 } },
      plugins: {
        legend: { display: true, position: 'right', labels: { font: { size: 24, family: 'Arial' }, padding: 24 } },
        title: { display: true, text: `Site: ${g.name || 'Cross Section'} - ${season}`, font: { size: 30, family: 'Arial', weight: 'bold' }, padding: { bottom: 12 } },
      },
      scales: {
        x: { title: { display: true, text: 'Distance (m)', font: { size: 25 } }, ticks: { color: '#000', font: { size: 22 } }, grid: { color: '#e5e7eb' } },
        y: { min, max, title: { display: true, text: 'Elevation (m)', font: { size: 25 } }, ticks: { color: '#000', font: { size: 22 } }, grid: { color: '#e5e7eb' } },
      },
     },
   });
  const url = canvas.toDataURL('image/png');
  chart.destroy();
  return url;
};

function renderGraphPdfPage(document: jsPDF, graph: Graph, pageNumber: number) {
  const output = calcGraph(graph);
  const isFormat2 = (graph.pdfLayout || 1) === 2;
  const postImage = isFormat2 ? getFormat2PdfChartDataURL(graph, output, 'post') : getPdfChartDataURL(graph, output, 'post');
  const preImage = graph.hasSubGraph
    ? (isFormat2 ? getFormat2PdfChartDataURL(graph, output, 'pre') : getPdfChartDataURL(graph, output, 'pre'))
    : '';

  document.setTextColor(0, 0, 0);
  if (isFormat2) {
    document.setFont('helvetica', 'normal');
    document.setFontSize(10);
    document.text(`Site: ${graph.name || 'Cross Section'}`, 148.5, 9, { align: 'center' });
    if (preImage) {
      document.setDrawColor(190, 190, 190);
      document.roundedRect(9, 14, 279, 80, 1, 1);
      document.addImage(preImage, 'PNG', 12, 17, 273, 74);
    }
    document.setDrawColor(190, 190, 190);
    document.roundedRect(9, preImage ? 99 : 30, 279, preImage ? 80 : 145, 1, 1);
    document.addImage(postImage, 'PNG', 12, preImage ? 102 : 33, 273, preImage ? 74 : 139);
  } else {
    document.setDrawColor(0, 0, 0);
    document.rect(8, 8, 281, 194);
    document.setFont('times', 'normal');
    document.setFontSize(12);
    document.text('Cross Section Sand Bar', 171, 17, { align: 'center' });
    document.setFont('times', 'bold');
    document.text(graph.name || 'Cross Section', 171, 24, { align: 'center' });

    document.setFont('times', 'normal');
    document.setFontSize(8);
    const leftX = 12;
    document.text(['Source- Primary Data generated', 'by DGPS', 'Hi- Target DGPS (Model No.', 'V30plus)'], leftX, 30);
    document.setFont('times', 'bold');
    document.setFontSize(11);
    document.text('Calculation', leftX, 48);
    document.setFont('times', 'normal');
    document.setFontSize(8);
    const calculationLines = [
      `- Total Area: ${graph.area || '-'} Ha. (Source: Table no. 7.2)`,
      `- No mining area: ${graph.noMine || '0'} Ha.`,
      `   Potential area: ${graph.area || '0'} - ${graph.noMine || '0'} = ${output.pArea.toFixed(2)} Ha.`,
      `- Potential Area (Ha.): ${output.pArea.toFixed(2)}`,
      `- Average Thickness: ${output.activeCalcThick.toFixed(2)}`,
      `- Bulk Density: ${graph.bulk || '-'}`,
      `${output.pArea.toFixed(2)} x 10000 x ${output.activeCalcThick.toFixed(2)} x ${graph.bulk || '0'} = ${output.tonnes.toFixed(2)} Tonnes`,
      `- Total excavation (${graph.pct || '0'}% as per EMGSM 2020) = ${output.allowed.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    ];
    document.text(calculationLines, leftX, 58, { lineHeightFactor: 1.65, maxWidth: 92 });

    const chartX = 108;
    const chartWidth = 112;
    document.addImage(postImage, 'PNG', chartX, 27, chartWidth, graph.hasSubGraph ? 60 : 108);
    if (preImage) {
      document.setFont('times', 'bold');
      document.setFontSize(10);
      document.text(graph.subName || 'Pre Monsoon', 164, 94, { align: 'center' });
      document.addImage(preImage, 'PNG', chartX, 98, chartWidth, 60);
    }

    document.setFont('times', 'normal');
    document.setFontSize(8);
    document.text(`Post Monsoon\nAverage Thickness: ${output.avgThickPost.toFixed(2)}`, 232, 35);
    if (graph.hasSubGraph) document.text(`Pre Monsoon\nAverage Thickness: ${output.avgThickPre.toFixed(2)}`, 232, 142);

    const maxRows = Math.max(output.thickPost.length, graph.hasSubGraph ? output.thickPre.length : 0);
    const tableX = 234;
    const tableY = 58;
    const cellW = graph.hasSubGraph ? 22 : 34;
    const cellH = 7;
    document.setFillColor(232, 235, 244);
    document.rect(tableX, tableY, cellW, cellH, 'F');
    document.text('Post', tableX + cellW / 2, tableY + 4.5, { align: 'center' });
    if (graph.hasSubGraph) {
      document.rect(tableX + cellW, tableY, cellW, cellH, 'F');
      document.text('Pre', tableX + cellW * 1.5, tableY + 4.5, { align: 'center' });
    }
    for (let index = 0; index < maxRows; index++) {
      const y = tableY + cellH * (index + 1);
      document.setFillColor(242, 244, 249);
      document.rect(tableX, y, cellW, cellH, 'F');
      document.text(output.thickPost[index]?.toFixed(2) || '-', tableX + cellW / 2, y + 4.5, { align: 'center' });
      if (graph.hasSubGraph) {
        document.rect(tableX + cellW, y, cellW, cellH, 'F');
        document.text(output.thickPre[index]?.toFixed(2) || '-', tableX + cellW * 1.5, y + 4.5, { align: 'center' });
      }
    }
    const averageY = tableY + cellH * (maxRows + 1);
    document.setFont('times', 'bold');
    document.setFillColor(232, 235, 244);
    document.rect(tableX, averageY, cellW, cellH, 'F');
    document.text(output.avgThickPost.toFixed(2), tableX + cellW / 2, averageY + 4.5, { align: 'center' });
    if (graph.hasSubGraph) {
      document.rect(tableX + cellW, averageY, cellW, cellH, 'F');
      document.text(output.avgThickPre.toFixed(2), tableX + cellW * 1.5, averageY + 4.5, { align: 'center' });
    }

    document.setFont('times', 'normal');
    document.setFontSize(8);
    document.text('Distance of the sand bar from river bank towards river (m)', 169, 166, { align: 'center' });
    const legends = [['Red Line', 220, 59, 59], ['Post monsoon Elevation', 218, 109, 63], ['Pre monsoon Elevation', 238, 190, 48], ['Thalweg line', 59, 130, 186]] as const;
    legends.forEach(([label, red, green, blue], index) => {
      const y = 176 + index * 7;
      document.setDrawColor(red, green, blue);
      document.setLineWidth(0.7);
      document.line(16, y, 30, y);
      document.setTextColor(0, 0, 0);
      document.text(label, 33, y + 1.5);
    });
    document.setFontSize(7);
    document.text('Note: The levels given in the cross-section as observed in the field have been checked and found nearly matching with the office record.', 180, 190, { align: 'center', maxWidth: 145 });
  }
  document.setFont('helvetica', 'normal');
  document.setFontSize(9);
  document.setTextColor(60, 60, 60);
  document.text(String(pageNumber), 286, 198, { align: 'right' });
}

// ------------- GRAPH BLOCK COMPONENT --------------
function GraphBlock({ graph: g, updateG, onDelete }: { graph: Graph; updateG: (k: keyof Graph, v: any) => void; onDelete: () => void }) {
  const o = calcGraph(g);
  
  const postY = [...o.post, o.red, o.thal].filter((v: number) => !isNaN(v));
  const { min: postYMin, max: postYMax } = getYBounds(postY);
  
  const postData = {
    labels: o.dist,
    datasets: [
      { label: 'Post monsoon Elevation', data: o.post, borderColor: '#da8b4e', backgroundColor: '#da8b4e', pointBackgroundColor: '#8ba3b5', tension: 0.1, pointRadius: 4, borderWidth: 1.5, fill: false },
      { label: 'Red Line', data: o.dist.map(() => o.red), borderColor: '#de3b3b', pointBackgroundColor: '#e37878', borderWidth: 1.5, pointRadius: 4, fill: false },
      { label: 'Thalweg', data: o.dist.map(() => o.thal), borderColor: '#3b8bba', pointBackgroundColor: '#7db1e3', borderWidth: 1.5, pointRadius: 4, fill: false }
    ]
  };

  const preY = [...(g.hasSubGraph ? o.subElev : []), o.subRed, o.subThal].filter((v: number) => !isNaN(v));
  const { min: preYMin, max: preYMax } = getYBounds(preY);

  const preData = {
    labels: o.subDist,
    datasets: [
      { label: 'Pre monsoon Elevation', data: o.subElev, borderColor: '#eec34a', backgroundColor: '#eec34a', pointBackgroundColor: '#aab6c2', tension: 0.1, pointRadius: 4, borderWidth: 1.5, fill: false },
      { label: 'Red Line', data: o.subDist.map(() => o.subRed), borderColor: '#de3b3b', pointBackgroundColor: '#e37878', borderWidth: 1.5, pointRadius: 4, fill: false },
      { label: 'Thalweg', data: o.subDist.map(() => o.subThal), borderColor: '#3b8bba', pointBackgroundColor: '#7db1e3', borderWidth: 1.5, pointRadius: 4, fill: false }
    ]
  };

  const options = (yMin: number, yMax: number) => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 15, left: 15, right: 15, bottom: 10 } },
    plugins: { legend: { display: false }, tooltip: { mode: 'index' as const, intersect: false } },
    scales: {
      x: { ticks: { color: '#64748b', font: { family: 'Times New Roman', size: 12 }, padding: 8 }, grid: { color: '#f1f5f9' } },
      y: { min: yMin, max: yMax, ticks: { color: '#64748b', font: { family: 'Times New Roman', size: 12 }, padding: 10 }, grid: { color: '#f1f5f9' } }
    }
  });

  const downloadPDF = () => {
    try {
      toast.info('Assembling PDF, please wait...');
      const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      renderGraphPdfPage(document, g, 1);
      const filenameBase = (g.hasSubGraph ? g.subName : g.name) || g.name || 'Cross_Section';
      const filename = `${filenameBase.replace(/\s+/g, '_')}_Report.pdf`;
      document.save(filename);
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF.');
    }
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/80 p-4">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div className="grid min-w-0 flex-1 gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(330px,auto)]">
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Post-monsoon section name</span>
              <input
                value={g.name}
                placeholder="Main Graph Name"
                onChange={(e) => updateG('name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Report format</span>
              <div className="grid grid-cols-2 rounded-xl border border-slate-300 bg-white p-1" role="radiogroup" aria-label="Cross-section report format">
                {([1, 2] as const).map((format) => {
                  const selected = (g.pdfLayout || 1) === format;
                  return (
                    <button
                      key={format}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => updateG('pdfLayout', format)}
                      className={`rounded-lg px-3 py-2 text-left text-xs transition ${selected ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      <span className="block font-bold">Format {format}</span>
                      <span className={`mt-0.5 block text-[10px] ${selected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {format === 1 ? 'Calculation + graphs' : 'Stacked graphs'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 2xl:justify-end">
            <button type="button" className="module-btn whitespace-nowrap" onClick={downloadPDF}>
              <Download size={15} /> Download section PDF
            </button>
            <button type="button" className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50" onClick={onDelete}>
              <Trash2 size={15} /> Delete section
            </button>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Distance Array (m)</label><input value={g.dist} onChange={e => updateG('dist', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Elevation Array (m)</label><input value={g.post} onChange={e => updateG('post', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Red Line (m)</label><input type="number" step="0.01" value={g.red} onChange={e => updateG('red', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Thalweg (m)</label><input type="number" step="0.01" value={g.thal} onChange={e => updateG('thal', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Total Area (Ha)</label><input type="number" step="0.01" value={g.area} onChange={e => updateG('area', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">No-Mine (Ha)</label><input type="number" step="0.01" value={g.noMine} onChange={e => updateG('noMine', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Density (g/cc)</label><input type="number" step="0.01" value={g.bulk} onChange={e => updateG('bulk', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mining %</label><input type="number" value={g.pct} onChange={e => updateG('pct', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
            <div className="col-span-2 sm:col-span-3"><label className="block text-xs font-semibold text-blue-500 uppercase mb-1">Calculation Thickness Override (m)</label><input type="number" step="0.01" value={g.calcThick || ''} placeholder="Defaults to Post Avg if empty" onChange={e => updateG('calcThick', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none border-blue-200 focus:border-blue-500 bg-blue-50/30" /></div>
          </div>
        </div>

        {g.hasSubGraph ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/30 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <strong className="text-amber-600 text-sm font-semibold">Sub-Graph for Comparison (Pre-Monsoon)</strong>
              <button className="text-xs text-red-600 hover:underline font-semibold" onClick={() => updateG('hasSubGraph', false)}>Remove Comparison</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pre Name</label><input value={g.subName || ''} onChange={e => updateG('subName', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pre Distance (m)</label><input value={g.subDist || ''} onChange={e => updateG('subDist', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pre Elevation (m)</label><input value={g.subElev || ''} onChange={e => updateG('subElev', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pre Red Line (m)</label><input type="number" step="0.01" value={g.subRed !== undefined ? g.subRed : g.red} onChange={e => updateG('subRed', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pre Thalweg (m)</label><input type="number" step="0.01" value={g.subThal !== undefined ? g.subThal : g.thal} onChange={e => updateG('subThal', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <button className="rounded-lg border border-dashed border-amber-300 bg-amber-50 text-amber-600 px-4 py-2 text-xs font-semibold hover:bg-amber-100 transition" onClick={() => {
              updateG('hasSubGraph', true);
              if (g.subRed === undefined) updateG('subRed', g.red);
              if (g.subThal === undefined) updateG('subThal', g.thal);
              if (!g.subDist) updateG('subDist', g.dist);
              if (!g.subElev) updateG('subElev', g.post);
            }}>+ Add Sub-Graph for Comparison (Pre-Monsoon)</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 flex flex-col gap-4">
            {g.hasSubGraph ? (
              <>
                <div className="rounded-xl border bg-slate-50 p-4">
                  <div className="flex justify-between items-center mb-2"><span className="font-bold text-slate-700">{g.name || 'Post Monsoon'}</span><span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">POST-MONSOON</span></div>
                  <div className="h-[180px] w-full bg-white"><Line data={postData} options={options(postYMin, postYMax)} plugins={[uiPointLabelsPlugin]} /></div>
                </div>
                <div className="rounded-xl border bg-slate-50 p-4">
                  <div className="flex justify-between items-center mb-2"><span className="font-bold text-slate-700">{g.subName || 'Pre Monsoon'}</span><span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded">PRE-MONSOON</span></div>
                  <div className="h-[180px] w-full bg-white"><Line data={preData} options={options(preYMin, preYMax)} plugins={[uiPointLabelsPlugin]} /></div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="flex justify-between items-center mb-2"><span className="font-bold text-slate-700">{g.name || 'Post Monsoon'}</span><span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">SINGLE GRAPH</span></div>
                <div className="h-[300px] w-full bg-white"><Line data={postData} options={options(postYMin, postYMax)} plugins={[uiPointLabelsPlugin]} /></div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border bg-slate-50 p-3"><div className="text-[11px] text-slate-500 font-medium">Post Avg Thick</div><div className="text-lg font-bold text-slate-900">{o.avgThickPost.toFixed(2)}<span className="text-xs text-slate-500 ml-1">m</span></div></div>
              {g.hasSubGraph && <div className="rounded-xl border bg-slate-50 p-3"><div className="text-[11px] text-slate-500 font-medium">Pre Avg Thick</div><div className="text-lg font-bold text-slate-900">{o.avgThickPre.toFixed(2)}<span className="text-xs text-slate-500 ml-1">m</span></div></div>}
              <div className="rounded-xl border bg-slate-50 p-3"><div className="text-[11px] text-slate-500 font-medium">Potential Area</div><div className="text-lg font-bold text-slate-900">{o.pArea.toFixed(2)}<span className="text-xs text-slate-500 ml-1">Ha</span></div></div>
              <div className="rounded-xl border bg-slate-50 p-3"><div className="text-[11px] text-slate-500 font-medium">Total Excav.</div><div className="text-lg font-bold text-slate-900">{new Intl.NumberFormat().format(Math.floor(o.allowed))}<span className="text-xs text-slate-500 ml-1">MT</span></div></div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-1">Allowed Excavation ({g.pct}%)</div>
              <div className="text-2xl font-black mb-2 text-slate-900">{o.allowed.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-sm font-bold text-slate-500">MT</span></div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight leading-relaxed break-words">= {o.pArea.toFixed(2)} Ha × 10000 × {o.activeCalcThick.toFixed(2)}m × {g.bulk} × {g.pct}%</div>
            </div>

            <div className="max-h-[250px] overflow-y-auto rounded-xl border bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr><th className="p-2 border-b text-slate-500">Dist</th><th className="p-2 border-b text-slate-500">Post</th><th className="p-2 border-b text-slate-500">Thick</th></tr>
                </thead>
                <tbody>
                  {o.dist.map((d: any, i: number) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-2 font-medium">{d}</td>
                      <td className="p-2">{o.post[i] ?? '-'}</td>
                      <td className="p-2 text-blue-600 font-semibold">{(o.thickPost[i] ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------- LIVE PREVIEW PANEL --------------
function LivePreviewPanel({ graphs }: { graphs: Graph[] }) {
  return (
    <aside className="h-full overflow-y-auto rounded-2xl border bg-slate-200 p-4 shadow-sm">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
        <Layers size={13} /> Cross Section Live Preview
      </p>
      <div className="min-h-[900px] bg-white p-4 shadow sm:p-6" style={{ fontFamily: "'Times New Roman', serif" }}>
        {/* Document header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[.2em]">Government of Punjab</p>
          <h1 className="mt-2 text-base font-bold uppercase">Cross Section Sand Bar Report</h1>
          <p className="mt-0.5 text-[9px] text-slate-500">District Survey Report</p>
        </div>

        {graphs.length === 0 && (
          <p className="text-center text-sm text-slate-400 mt-16">No sections added yet.</p>
        )}

        {graphs.map((g, idx) => {
          const o = calcGraph(g);
          const postY = [...o.post, o.red, o.thal].filter((v: number) => !isNaN(v));
          const { min: postYMin, max: postYMax } = getYBounds(postY);
          const preY = [...(g.hasSubGraph ? o.subElev : []), o.subRed, o.subThal].filter((v: number) => !isNaN(v));
          const { min: preYMin, max: preYMax } = getYBounds(preY);

          const postData = {
            labels: o.dist,
            datasets: [
              { label: 'Post monsoon Elevation', data: o.post, borderColor: '#da8b4e', backgroundColor: '#da8b4e', tension: 0.1, pointRadius: 2, borderWidth: 1.2, fill: false },
              { label: 'Red Line', data: o.dist.map(() => o.red), borderColor: '#de3b3b', borderWidth: 1.2, pointRadius: 2, fill: false },
              { label: 'Thalweg', data: o.dist.map(() => o.thal), borderColor: '#3b8bba', borderWidth: 1.2, pointRadius: 2, fill: false },
            ],
          };
          const preData = {
            labels: o.subDist,
            datasets: [
              { label: 'Pre monsoon Elevation', data: o.subElev, borderColor: '#eec34a', backgroundColor: '#eec34a', tension: 0.1, pointRadius: 2, borderWidth: 1.2, fill: false },
              { label: 'Red Line', data: o.subDist.map(() => o.subRed), borderColor: '#de3b3b', borderWidth: 1.2, pointRadius: 2, fill: false },
              { label: 'Thalweg', data: o.subDist.map(() => o.subThal), borderColor: '#3b8bba', borderWidth: 1.2, pointRadius: 2, fill: false },
            ],
          };
          const isFormat2 = (g.pdfLayout || 1) === 2;
          const chartOpts = (yMin: number, yMax: number, stacked = false) => ({
            responsive: true,
            maintainAspectRatio: false,
            animation: false as const,
            plugins: {
              legend: { display: stacked, position: 'right' as const, labels: { boxWidth: 14, font: { size: 7 }, padding: 8 } },
              tooltip: { enabled: false },
            },
            scales: {
              x: { title: { display: stacked, text: 'Distance (m)', font: { size: 7 } }, ticks: { color: '#374151', font: { size: 7 } }, grid: { color: '#f3f4f6' } },
              y: { min: yMin, max: yMax, title: { display: stacked, text: 'Elevation (m)', font: { size: 7 } }, ticks: { color: '#374151', font: { size: 7 } }, grid: { color: '#f3f4f6' } },
            },
          });

          return (
            <section key={g.id} className="mb-8 border-b border-slate-200 pb-6 last:border-0">
              {/* Section header */}
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mr-2">Section {idx + 1}</span>
                  <span className="text-sm font-bold text-slate-800">{g.name || 'Untitled'}</span>
                  {g.hasSubGraph && g.subName && (
                    <span className="ml-2 text-[9px] text-amber-600 font-semibold">/ {g.subName}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-[9px] text-slate-500">
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 font-bold text-blue-700">Format {isFormat2 ? 2 : 1}</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">Area: {g.area} Ha</span>
                  <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold">{new Intl.NumberFormat().format(Math.floor(o.allowed))} MT</span>
                </div>
              </div>

              {/* Charts */}
              {isFormat2 ? (
                <div className="mb-3 space-y-3 rounded border-2 border-slate-300 p-2">
                  {g.hasSubGraph && (
                    <div className="rounded border border-slate-200 bg-white p-1">
                      <p className="text-center text-[9px] font-bold text-slate-900">Site: {g.name} - Pre Monsoon</p>
                      <div className="h-[155px]">
                        <Line data={preData} options={chartOpts(preYMin, preYMax, true)} />
                      </div>
                    </div>
                  )}
                  <div className="rounded border border-slate-200 bg-white p-1">
                    <p className="text-center text-[9px] font-bold text-slate-900">Site: {g.name} - Post Monsoon</p>
                    <div className="h-[155px]">
                      <Line data={postData} options={chartOpts(postYMin, postYMax, true)} />
                    </div>
                  </div>
                </div>
              ) : <>
              <div className="mb-3 grid grid-cols-1 gap-3">
                <div>
                  <p className="text-[8px] font-bold text-blue-700 mb-1 uppercase">Post-Monsoon — {g.name}</p>
                  <div className="h-[120px] bg-white border border-slate-100 rounded">
                    <Line data={postData} options={chartOpts(postYMin, postYMax)} />
                  </div>
                </div>
                {g.hasSubGraph && (
                  <div>
                    <p className="text-[8px] font-bold text-amber-700 mb-1 uppercase">Pre-Monsoon — {g.subName}</p>
                    <div className="h-[120px] bg-white border border-slate-100 rounded">
                      <Line data={preData} options={chartOpts(preYMin, preYMax)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Calculation summary */}
              <div className="grid grid-cols-4 gap-2 text-[8px]">
                <div className="bg-slate-50 rounded p-2">
                  <p className="text-slate-400 mb-0.5">Potential Area</p>
                  <p className="font-bold text-slate-800">{o.pArea.toFixed(2)} Ha</p>
                </div>
                <div className="bg-slate-50 rounded p-2">
                  <p className="text-slate-400 mb-0.5">Post Avg Thick</p>
                  <p className="font-bold text-slate-800">{o.avgThickPost.toFixed(2)} m</p>
                </div>
                {g.hasSubGraph && (
                  <div className="bg-amber-50 rounded p-2">
                    <p className="text-amber-500 mb-0.5">Pre Avg Thick</p>
                    <p className="font-bold text-amber-700">{o.avgThickPre.toFixed(2)} m</p>
                  </div>
                )}
                <div className="bg-blue-50 rounded p-2">
                  <p className="text-blue-400 mb-0.5">Calc Thickness</p>
                  <p className="font-bold text-blue-700">{o.activeCalcThick.toFixed(2)} m</p>
                </div>
                <div className="col-span-4 bg-slate-50 rounded p-2">
                  <p className="text-slate-400 font-semibold text-[7px] mb-0.5">Allowed Excavation ({g.pct}%)</p>
                  <p className="font-black text-slate-800 text-[11px]">{o.allowed.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[8px] font-bold text-slate-500">MT</span></p>
                  <p className="text-slate-400 text-[7px] font-mono mt-0.5">{o.pArea.toFixed(2)} × 10000 × {o.activeCalcThick.toFixed(2)} × {g.bulk} × {g.pct}%</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-3 mt-2">
                {[['#de3b3b', 'Red Line'], ['#da8b4e', 'Post Monsoon'], ['#eec34a', 'Pre Monsoon'], ['#3b8bba', 'Thalweg']].map(([color, label]) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="inline-block w-4 h-0.5" style={{ background: color }} />
                    <span className="text-[7px] text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
              </>}
            </section>
          );
        })}
      </div>
    </aside>
  );
}

export default function CrossSectionGraphsPage() {
  const { projectId = "default" } = useParams();
  const [graphs, setGraphs] = useLocalDraft<Graph[]>("cross-sections-full", [seed]);
  const [saving, setSaving] = useState(false);
  const [wideLayout, setWideLayout] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const updateLayout = () => setWideLayout(media.matches);
    updateLayout();
    media.addEventListener('change', updateLayout);
    return () => media.removeEventListener('change', updateLayout);
  }, []);

  useEffect(() => {
    if (!/^\d+$/.test(projectId)) return;

    let active = true;
    projectsApi.get(projectId).then((project) => {
      if (!active) return;
      const crossSectionsState = project.projectState?.["cross-sections"] as { graphs?: Graph[] } | Graph[] | undefined;
      if (Array.isArray(crossSectionsState)) setGraphs(crossSectionsState);
      else if (Array.isArray(crossSectionsState?.graphs)) setGraphs(crossSectionsState.graphs);
    }).catch((error) => {
      console.error("Failed to load cross-section draft:", error);
    });

    return () => { active = false; };
  }, [projectId, setGraphs]);

  const addGraph = () => {
    setGraphs(c => [...c, { ...seed, id: 'g' + Date.now(), name: `SECTION_${c.length + 1}` }]);
  };

  const saveDraft = async () => {
    if (!/^\d+$/.test(projectId)) {
      toast.error("Project ID missing");
      return;
    }

    setSaving(true);
    try {
      const project = await projectsApi.get(projectId);
      await projectsApi.updateState(projectId, {
        state: {
          ...(project.projectState || {}),
          "cross-sections": {
            graphs,
            savedAt: new Date().toISOString(),
          },
        },
      });
      toast.success("Cross sections saved to database");
    } catch (error) {
      console.error("Failed to save cross-section draft:", error);
      toast.error("Draft save failed");
    } finally {
      setSaving(false);
    }
  };

  const generateAllGraphsPDF = () => {
    if (!graphs.length) return toast.error('No cross-sections available to compile.');
    try {
      toast.info('Generating multi-page survey booklet, please wait...');
      const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      graphs.forEach((graph, index) => {
        if (index) document.addPage('a4', 'landscape');
        renderGraphPdfPage(document, graph, index + 1);
      });
      document.save('All_Cross_Sections_Consolidated_Report.pdf');
      toast.success('Unified booklet generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to compile consolidated PDF.');
    }
  };

  const editorPanel = (
    <div className={wideLayout ? "h-full space-y-6 overflow-y-auto pb-12 pr-2" : "space-y-6 pb-6"}>
      {graphs.map((g, i) => (
        <GraphCard
          key={g.id}
          graph={g}
          updateG={(k: keyof Graph, v: any) => {
            setGraphs(c => c.map((x, j) => j === i ? { ...x, [k]: v } : x));
          }}
          onDelete={() => setGraphs(c => c.filter((_, j) => j !== i))}
        />
      ))}
    </div>
  );

  const previewPanel = <LivePreviewPanel graphs={graphs} />;

  return (
    <>
      <PageHeader 
        backLink={`/projects/${projectId}`}
        title="Cross Section Graph Generator" 
        description="Input elevation & distance data to generate sandbar cross-section graphs with auto-calculated volumes" 
        action={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:max-w-[48%] sm:justify-end lg:max-w-none">
            <button className="module-btn" onClick={generateAllGraphsPDF}>
              <Download size={17} /> Download All Graphs PDF
            </button>
            <button className="module-btn-primary" onClick={addGraph}>
              <Plus size={17} /> Add Section
            </button>
            <button className="module-btn-primary" disabled={saving} onClick={saveDraft}>
              <Save size={17} /> {saving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        } 
      />
      
      {wideLayout ? (
        <div className="h-[calc(100vh-11rem)] min-h-[680px]">
          <ResizableLayout
            leftPanelDefaultSize={60}
            rightPanelDefaultSize={40}
            leftPanel={editorPanel}
            rightPanel={previewPanel}
          />
        </div>
      ) : (
        <div className="space-y-6 px-3 pb-8 sm:px-4">
          {editorPanel}
          <div className="min-h-[700px]">{previewPanel}</div>
        </div>
      )}
    </>
  );
}

const GraphCard = GraphBlock;
