'use client';

import { useState } from 'react';
import Link from 'next/link';

const TIERS = [
  { key: 'S', label: 'S', index: 5, cls: 'tier-S' },
  { key: 'A', label: 'A', index: 4, cls: 'tier-A' },
  { key: 'B', label: 'B', index: 3, cls: 'tier-B' },
  { key: 'C', label: 'C', index: 2, cls: 'tier-C' },
  { key: 'D', label: 'D', index: 1, cls: 'tier-D' },
  { key: 'E', label: 'E', index: 0, cls: 'tier-E' },
];

const PRICE_E = 50;
const PRICE_D = 190;

const COMBINE_COSTS: Record<string, number> = {
  S: 5000,
  A: 1000,
  B: 200,
  C: 50,
  D: 0,
};

function formatCurrency(silver: number): string {
  const goldImg = '<img src="/images/currency/gold.png" alt="gold" class="inline-block h-3.5 w-3.5 align-middle -mt-0.5 mx-0.5">';
  const silverImg = '<img src="/images/currency/silver.png" alt="silver" class="inline-block h-3.5 w-3.5 align-middle -mt-0.5 mx-0.5">';
  if (silver === 0) return `0${silverImg}`;
  const gold = Math.floor(silver / 100);
  const silv = silver % 100;
  const parts: string[] = [];
  if (gold > 0) parts.push(`${gold}${goldImg}`);
  if (silv > 0) parts.push(`${silv}${silverImg}`);
  return parts.join(' ');
}

export default function HomePage() {
  const [view, setView] = useState<'menu' | 'card-helper'>('menu');
  const [displayMode, setDisplayMode] = useState<'E' | 'D'>('D');
  const [stepsVisible, setStepsVisible] = useState(false);
  const [reqValues, setReqValues] = useState<Record<string, string>>({});
  const [ownValues, setOwnValues] = useState<Record<string, string>>({});

  function handleInput(prefix: string, tier: string, value: string) {
    const cleaned = value.replace(/^0+(?=\d)/, '');
    if (prefix === 'req') {
      setReqValues(prev => ({ ...prev, [tier]: cleaned }));
    } else {
      setOwnValues(prev => ({ ...prev, [tier]: cleaned }));
    }
  }

  function clearInputs(prefix: string) {
    if (prefix === 'req') {
      setReqValues({});
    } else {
      setOwnValues({});
    }
  }

  function getVal(prefix: string, label: string): number {
    const vals = prefix === 'req' ? reqValues : ownValues;
    return Math.max(0, parseInt(vals[label] || '0') || 0);
  }

  function calculate() {
    const req: Record<string, number> = {};
    const own: Record<string, number> = {};
    TIERS.forEach(t => {
      req[t.label] = getVal('req', t.label);
      own[t.label] = getVal('own', t.label);
    });

    const need = { ...req };
    const deficits: Record<string, number> = {};
    const steps: string[] = [];

    deficits.S = Math.max(0, need.S - own.S);
    if (deficits.S > 0) {
      need.A += deficits.S * 4;
      steps.push(`<span class="${TIERS[0].cls}">S</span>: Need <strong>${deficits.S}</strong> more → requires <strong>${deficits.S * 4}</strong> A (combine: ${formatCurrency(deficits.S * COMBINE_COSTS.S)})`);
    } else {
      steps.push(`<span class="${TIERS[0].cls}">S</span>: Have ${own.S}, Need ${need.S}. <span class="text-gray-500">OK</span>`);
    }

    deficits.A = Math.max(0, need.A - own.A);
    if (deficits.A > 0) {
      need.B += deficits.A * 4;
      steps.push(`<span class="${TIERS[1].cls}">A</span>: Need <strong>${deficits.A}</strong> more → requires <strong>${deficits.A * 4}</strong> B (combine: ${formatCurrency(deficits.A * COMBINE_COSTS.A)})`);
    } else {
      steps.push(`<span class="${TIERS[1].cls}">A</span>: Have ${own.A}, Need ${need.A}. <span class="text-gray-500">OK</span>`);
    }

    deficits.B = Math.max(0, need.B - own.B);
    if (deficits.B > 0) {
      need.C += deficits.B * 4;
      steps.push(`<span class="${TIERS[2].cls}">B</span>: Need <strong>${deficits.B}</strong> more → requires <strong>${deficits.B * 4}</strong> C (combine: ${formatCurrency(deficits.B * COMBINE_COSTS.B)})`);
    } else {
      steps.push(`<span class="${TIERS[2].cls}">B</span>: Have ${own.B}, Need ${need.B}. <span class="text-gray-500">OK</span>`);
    }

    deficits.C = Math.max(0, need.C - own.C);
    if (deficits.C > 0) {
      need.D += deficits.C * 4;
      steps.push(`<span class="${TIERS[3].cls}">C</span>: Need <strong>${deficits.C}</strong> more → requires <strong>${deficits.C * 4}</strong> D (combine: ${formatCurrency(deficits.C * COMBINE_COSTS.C)})`);
    } else {
      steps.push(`<span class="${TIERS[3].cls}">C</span>: Have ${own.C}, Need ${need.C}. <span class="text-gray-500">OK</span>`);
    }

    deficits.D = Math.max(0, need.D - own.D);
    if (deficits.D > 0) {
      need.E += deficits.D * 4;
      steps.push(`<span class="${TIERS[4].cls}">D</span>: Need <strong>${deficits.D}</strong> more → requires <strong>${deficits.D * 4}</strong> E (combine: ${formatCurrency(deficits.D * COMBINE_COSTS.D)})`);
    } else {
      steps.push(`<span class="${TIERS[4].cls}">D</span>: Have ${own.D}, Need ${need.D}. <span class="text-gray-500">OK</span>`);
    }

    deficits.E = Math.max(0, need.E - own.E);
    if (deficits.E > 0) {
      steps.push(`<span class="${TIERS[5].cls}">E</span>: Have ${own.E}, Need ${need.E}. Must buy: <strong class="text-emerald-400">${deficits.E}</strong> E`);
    } else {
      steps.push(`<span class="${TIERS[5].cls}">E</span>: Have ${own.E}, Need ${need.E}. <span class="text-gray-500">OK</span>`);
    }

    let purchaseCost = 0;
    let buyD = 0;
    let buyE = deficits.E;

    if (displayMode === 'E') {
      purchaseCost = buyE * PRICE_E;
    } else {
      buyD = Math.floor(buyE / 4);
      buyE = buyE % 4;
      purchaseCost = buyD * PRICE_D + buyE * PRICE_E;
    }

    let combineCost = 0;
    combineCost += deficits.S * COMBINE_COSTS.S;
    combineCost += deficits.A * COMBINE_COSTS.A;
    combineCost += deficits.B * COMBINE_COSTS.B;
    combineCost += deficits.C * COMBINE_COSTS.C;
    combineCost += deficits.D * COMBINE_COSTS.D;

    const totalCost = purchaseCost + combineCost;

    let resultNumber = '0';
    let resultLabel = 'Nothing to Buy';

    if (displayMode === 'E') {
      resultNumber = String(deficits.E);
      resultLabel = deficits.E === 1 ? 'E Ingredient to Buy' : 'E Ingredients to Buy';
    } else {
      const d = Math.floor(deficits.E / 4);
      const e = deficits.E % 4;
      if (d === 0 && e === 0) {
        resultNumber = '0';
        resultLabel = 'Nothing to Buy';
      } else if (e === 0) {
        resultNumber = String(d);
        resultLabel = d === 1 ? 'D Ingredient to Buy' : 'D Ingredients to Buy';
      } else if (d === 0) {
        resultNumber = String(e);
        resultLabel = e === 1 ? 'E Ingredient to Buy' : 'E Ingredients to Buy';
      } else {
        resultNumber = `${d} D + ${e} E`;
        resultLabel = 'Ingredients to Buy';
      }
    }

    return {
      resultNumber,
      resultLabel,
      purchaseCost,
      combineCost,
      totalCost,
      steps,
    };
  }

  const result = calculate();

  if (view === 'menu') {
    return (
      <div className="fade-in max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">Game Helper Tool</h1>
          <p className="text-gray-400">A collection of utilities to make your gaming life easier.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <button
            onClick={() => setView('card-helper')}
            className="group relative bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-xl p-6 text-left transition-all hover:shadow-lg hover:shadow-blue-900/20 hover:-translate-y-0.5"
          >
            <div className="text-3xl mb-3">🃏</div>
            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">Card Creation Helper</h3>
            <p className="text-sm text-gray-400">Calculate how many base materials you need to buy to craft your target card.</p>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </div>
          </button>

          <Link href="/card-viewer" className="group relative bg-gray-900 border border-gray-800 hover:border-purple-500 rounded-xl p-6 text-left transition-all hover:shadow-lg hover:shadow-purple-900/20 hover:-translate-y-0.5 block">
            <div className="text-3xl mb-3">🃏</div>
            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">Card Viewer</h3>
            <p className="text-sm text-gray-400">Tra cứu và xem chi tiết các thẻ bài trong game.</p>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </div>
          </Link>

          <Link href="/card-editor" className="group relative bg-gray-900 border border-gray-800 hover:border-emerald-500 rounded-xl p-6 text-left transition-all hover:shadow-lg hover:shadow-emerald-900/20 hover:-translate-y-0.5 block">
            <div className="text-3xl mb-3">✏️</div>
            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">Card Editor</h3>
            <p className="text-sm text-gray-400">Thêm và chỉnh sửa thông tin thẻ bài.</p>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setView('menu')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Back to Menu
        </button>
        <h2 className="text-2xl font-bold text-white">Card Creation Helper</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* Required */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>📋</span> Card Recipe <span className="text-xs font-normal text-gray-500 ml-2">(What the card needs)</span>
              </h3>
              <button onClick={() => clearInputs('req')} className="text-xs text-gray-500 hover:text-white underline">Clear</button>
            </div>
            <div className="space-y-3">
              {TIERS.map(t => (
                <div key={`req-${t.label}`} className="flex items-center gap-3">
                  <div className={`w-8 text-center font-bold text-lg ${t.cls}`}>{t.label}</div>
                  <input
                    type="number"
                    min="0"
                    value={reqValues[t.label] || ''}
                    onChange={e => handleInput('req', t.label, e.target.value)}
                    className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Owned */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>🎒</span> Your Inventory <span className="text-xs font-normal text-gray-500 ml-2">(What you already have)</span>
              </h3>
              <button onClick={() => clearInputs('own')} className="text-xs text-gray-500 hover:text-white underline">Clear</button>
            </div>
            <div className="space-y-3">
              {TIERS.map(t => (
                <div key={`own-${t.label}`} className="flex items-center gap-3">
                  <div className={`w-8 text-center font-bold text-lg ${t.cls}`}>{t.label}</div>
                  <input
                    type="number"
                    min="0"
                    value={ownValues[t.label] || ''}
                    onChange={e => handleInput('own', t.label, e.target.value)}
                    className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Price Reference */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>💰</span> Price Reference
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
                <span className="font-bold tier-E text-lg">E</span>
                <span className="text-gray-300 flex items-center gap-1">50<img src="/images/currency/silver.png" alt="silver" className="inline-block h-3.5 w-3.5" /></span>
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
                <span className="font-bold tier-D text-lg">D</span>
                <span className="text-gray-300 flex items-center gap-1">1<img src="/images/currency/gold.png" alt="gold" className="inline-block h-3.5 w-3.5" /> 90<img src="/images/currency/silver.png" alt="silver" className="inline-block h-3.5 w-3.5" /></span>
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
                <span className="font-bold tier-C text-lg">C</span>
                <span className="text-gray-500 text-xs">not sold</span>
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
                <span className="font-bold tier-B text-lg">B</span>
                <span className="text-gray-500 text-xs">not sold</span>
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
                <span className="font-bold tier-A text-lg">A</span>
                <span className="text-gray-500 text-xs">not sold</span>
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
                <span className="font-bold tier-S text-lg">S</span>
                <span className="text-gray-500 text-xs">not sold</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-1">🔧 <strong className="text-gray-300">E → D</strong> combine: <span className="text-emerald-400">Free</span></div>
              <div className="flex items-center gap-1">🔧 <strong className="text-gray-300">D → C</strong> combine: <span className="text-amber-400 flex items-center gap-1">50<img src="/images/currency/silver.png" alt="silver" className="inline-block h-3 w-3" /></span></div>
              <div className="flex items-center gap-1">🔧 <strong className="text-gray-300">C → B</strong> combine: <span className="text-amber-400 flex items-center gap-1">2<img src="/images/currency/gold.png" alt="gold" className="inline-block h-3 w-3" /></span></div>
              <div className="flex items-center gap-1">🔧 <strong className="text-gray-300">B → A</strong> combine: <span className="text-amber-400 flex items-center gap-1">10<img src="/images/currency/gold.png" alt="gold" className="inline-block h-3 w-3" /></span></div>
              <div className="flex items-center gap-1">🔧 <strong className="text-gray-300">A → S</strong> combine: <span className="text-amber-400 flex items-center gap-1">50<img src="/images/currency/gold.png" alt="gold" className="inline-block h-3 w-3" /></span></div>
            </div>
          </div>
        </div>

        {/* Right Column: Result */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>🧮</span> Result
            </h3>

            {/* Toggle */}
            <div className="flex items-center justify-between mb-5 bg-gray-800 rounded-lg p-1">
              <span className="text-sm text-gray-400 pl-3">Display unit:</span>
              <div className="flex bg-gray-950/50 rounded-md p-0.5">
                <button
                  onClick={() => setDisplayMode('E')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${displayMode === 'E' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  E
                </button>
                <button
                  onClick={() => setDisplayMode('D')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${displayMode === 'D' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  D
                </button>
              </div>
            </div>

            {/* Big Number */}
            <div className="text-center py-5 bg-gray-950/40 rounded-xl border border-gray-800/50 mb-5">
              <div className="text-5xl font-bold text-emerald-400 tracking-tight">{result.resultNumber}</div>
              <div className="text-sm text-gray-400 mt-2 font-medium uppercase tracking-wide">{result.resultLabel}</div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-950/30 rounded-lg border border-gray-800/50">
                <span className="text-sm text-gray-400">Ingredient Cost</span>
                <span className="text-sm font-semibold text-white" dangerouslySetInnerHTML={{ __html: formatCurrency(result.purchaseCost) }} />
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-950/30 rounded-lg border border-gray-800/50">
                <span className="text-sm text-gray-400">Combine Cost</span>
                <span className="text-sm font-semibold text-amber-400" dangerouslySetInnerHTML={{ __html: formatCurrency(result.combineCost) }} />
              </div>
              <div className="flex items-center justify-between py-3 px-3 bg-emerald-950/20 rounded-lg border border-emerald-900/30">
                <span className="text-sm font-semibold text-emerald-300">Total Cost</span>
                <span className="text-lg font-bold text-emerald-400" dangerouslySetInnerHTML={{ __html: formatCurrency(result.totalCost) }} />
              </div>
            </div>

            {/* Steps */}
            <div className={`mt-2 pt-3 border-t border-gray-800 ${stepsVisible ? '' : 'hidden'}`}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Calculation Steps</h4>
              <div className="space-y-1.5 text-xs text-gray-400 font-mono">
                {result.steps.map((step, i) => (
                  <div key={i} className="flex gap-2" dangerouslySetInnerHTML={{ __html: `• ${step}` }} />
                ))}
              </div>
            </div>

            <button
              onClick={() => setStepsVisible(!stepsVisible)}
              className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-1"
            >
              <span>{stepsVisible ? 'Hide calculation steps' : 'Show calculation steps'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${stepsVisible ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
