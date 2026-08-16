import { Trade } from '../types';

// Utility helper to create realistic inline SVG chart screenshots for demo trade entries
function createSampleChartSVG(title: string, isWin: boolean): string {
  const color = isWin ? '#10b981' : '#f43f5e';
  const bgColor = '#0f172a';
  const strokeColor = isWin ? '#34d399' : '#fb7185';
  
  const points = isWin
    ? "20,120 50,110 80,130 110,90 140,95 170,70 200,80 230,50 260,60 290,30"
    : "20,40 50,30 80,60 110,50 140,80 170,75 200,100 230,95 260,130 290,140";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180" fill="none">
    <rect width="320" height="180" rx="8" fill="${bgColor}"/>
    <path d="M20 30 H300 M20 70 H300 M20 110 H300 M20 150 H300" stroke="#1e293b" stroke-dasharray="4 4"/>
    <polyline fill="none" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${points}"/>
    <circle cx="290" cy="${isWin ? 30 : 140}" r="5" fill="${color}"/>
    <text x="20" y="22" fill="#94a3b8" font-family="sans-serif" font-size="11" font-weight="600">${title}</text>
    <rect x="220" y="14" width="80" height="20" rx="4" fill="${isWin ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}"/>
    <text x="260" y="28" text-anchor="middle" fill="${color}" font-family="sans-serif" font-size="10" font-weight="700">${isWin ? '+WIN' : '-LOSS'}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_TRADES: Trade[] = [
  {
    id: 'trd-101',
    date: '2026-07-29',
    time: '09:30',
    symbol: 'EUR/USD',
    direction: 'LONG',
    entryPrice: 1.0850,
    exitPrice: 1.0910,
    slPrice: 1.0825,
    tpPrice: 1.0925,
    riskPips: 25,
    positionSize: 1.5,
    strategyType: 'D.C.QML A+',
    levelTimeframe: '1D',
    confirmationTimeframe: '15M',
    emotionalState: 'Disciplined',
    status: 'WIN',
    calculatedRiskReward: 3.0,
    actualRiskReward: 2.4,
    pnlPips: 60,
    pnlAmount: 360.00,
    pnlPercentage: 3.6,
    notes: 'Clean 15-minute London breakout above session high on 2026-07-29. Executed strictly according to trade plan.',
    chartImages: [createSampleChartSVG('EUR/USD London Breakout', true)],
    rating: 5,
    tags: ['Forex', 'London Session', 'A+ Setup']
  }
];
