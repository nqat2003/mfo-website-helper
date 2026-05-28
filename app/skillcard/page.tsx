'use client';

import { useState } from 'react';
import BackToMenu from '@/components/BackToMenu';
import { DATA, LEVELS, RARITY_COLORS } from '@/data/skillcards';

export default function SkillcardPage() {
  const [search, setSearch] = useState('');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentRarity, setCurrentRarity] = useState('all');
  const [currentCard, setCurrentCard] = useState<string | null>(null);

  const filteredCards = Object.entries(DATA.cards)
    .filter(([name, card]) => {
      if (currentRarity !== 'all' && card.rarity !== currentRarity) return false;
      const s = search.toLowerCase();
      if (s && !name.toLowerCase().includes(s) && !(card.skill || '').toLowerCase().includes(s)) return false;
      return true;
    })
    .sort((a, b) => (b[1].index || 0) - (a[1].index || 0));

  const card = currentCard ? DATA.cards[currentCard] : null;

  function updateCardDisplay(name: string) {
    setCurrentCard(name);
  }

  function getDesc(cardName: string, level: number) {
    const c = DATA.cards[cardName];
    if (!c) return '';
    let desc = c.description || '';
    const values = c.level_values && c.level_values[String(level)] || {};
    desc = desc.replace(/\[([^\]]+)\]/g, (match, expr) => {
      let calc = expr;
      Object.entries(values).forEach(([k, v]) => {
        calc = calc.replace(new RegExp(k, 'g'), String(v));
      });
      try {
        if (/^[\d\s\+\-\*\/\.\(\)]+$/.test(calc)) {
          const r = eval(calc);
          return '<span class="param-value">' + Math.floor(r) + '</span>';
        }
      } catch (e) { /* ignore */ }
      return '<span class="param-value">' + calc + '</span>';
    });
    return desc;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <BackToMenu />
      </div>
      <div className="flex gap-5 min-h-[calc(100vh-120px)]">
        {/* Control Panel */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-center text-lg font-bold text-yellow-400 mb-3">技能卡查看器</h2>
            <div className="mb-3">
              <input
                type="text"
                placeholder="搜索技能卡..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition-all"
              />
            </div>

            <div className="mb-3">
              <label className="text-sm text-gray-400 mb-2 block">选择等级:</label>
              <div className="flex gap-2 flex-wrap">
                {LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => setCurrentLevel(l)}
                    className={`w-12 h-10 rounded-lg font-bold text-sm border-2 transition-all ${
                      currentLevel === l
                        ? 'bg-yellow-400 border-yellow-400 text-black'
                        : 'bg-gray-800 border-yellow-400/50 text-yellow-400 hover:bg-gray-700'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="text-sm text-gray-400 mb-2 block">稀有度筛选:</label>
              <div className="flex gap-2 flex-wrap">
                {['all', 'E', 'D', 'C', 'B', 'A', 'S'].map(r => (
                  <button
                    key={r}
                    onClick={() => setCurrentRarity(r)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      currentRarity === r
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {r === 'all' ? '全部' : r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex-1 flex flex-col min-h-0">
            <div className="text-sm text-gray-400 mb-2">卡片列表 (<span className="text-yellow-400">{filteredCards.length}</span>)</div>
            <div className="flex-1 overflow-y-auto bg-gray-950 rounded-lg p-2 space-y-1">
              {filteredCards.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">请输入关键词搜索卡片<br/>或选择稀有度筛选</div>
              ) : (
                filteredCards.map(([name, c]) => (
                  <div
                    key={name}
                    onClick={() => updateCardDisplay(name)}
                    className={`cursor-pointer p-3 rounded-lg transition-all flex items-center justify-between ${
                      currentCard === name
                        ? 'bg-yellow-400/10 border-l-4 border-yellow-400'
                        : 'bg-gray-800 hover:bg-gray-700 border-l-4 border-transparent'
                    }`}
                  >
                    <span className="text-sm text-white">{name}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: RARITY_COLORS[c.rarity] || '#666' }}>{c.rarity || '-'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Card Display */}
        <div className="flex-1">
          {card ? (
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-gray-700 rounded-2xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
                  <span className="text-xl font-bold text-white">{card.name || currentCard}</span>
                  <span className="px-4 py-1 rounded-full text-sm font-bold" style={{ background: RARITY_COLORS[card.rarity] || '#666', color: card.rarity === 'SS' ? '#000' : '#fff' }}>{card.rarity || '-'}</span>
                </div>

                {/* Pet Range */}
                {card.pet_range && card.pet_range.length > 0 && (
                  <div className="text-center mb-4 p-2 rounded bg-cyan-400/5 text-sm">
                    <span className="text-gray-400">适用: </span>
                    {card.pet_range.map((item, i) => (
                      <span key={i}>
                        <span className={item.type === 'pet' ? 'text-orange-400' : 'text-blue-400'}>{item.text}</span>
                        {i < (card.pet_range?.length || 0) - 1 && <span className="text-gray-600">, </span>}
                      </span>
                    ))}
                  </div>
                )}

                {/* Level */}
                <div className="text-center text-3xl text-yellow-400 font-bold mb-4">Lv.{currentLevel}</div>

                {/* Skill */}
                <div className="text-center p-3 bg-gray-950 rounded-lg mb-4">
                  <span className="text-gray-400 text-sm">技能: </span>
                  <span className="text-yellow-400 font-bold text-lg ml-2">{card.skill || '-'}</span>
                </div>

                {/* Description */}
                <div className="bg-gray-950 rounded-lg p-4 mb-4">
                  <div className="text-xs text-gray-500 mb-2">效果说明</div>
                  <p className="text-sm text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: getDesc(currentCard!, currentLevel) }} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-950 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">SP消耗</div>
                    <div className="text-base font-bold text-white">{card.sp_cost || '-'}</div>
                  </div>
                  <div className="bg-gray-950 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Cost</div>
                    <div className="text-base font-bold text-white">{card.cost ? (parseFloat(card.cost) / 2).toFixed(1) : '-'}</div>
                  </div>
                  <div className="bg-gray-950 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">优先度</div>
                    <div className="text-base font-bold text-white">{card.priority || '-'}</div>
                  </div>
                  <div className="bg-gray-950 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">冷却</div>
                    <div className="text-base font-bold text-white">{parseInt(card.cooldown) > 0 ? (parseInt(card.cooldown) - 1) : '-'}</div>
                  </div>
                  <div className="bg-gray-950 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">最低等级</div>
                    <div className="text-base font-bold text-white">{card.min_level || '-'}</div>
                  </div>
                  <div className="bg-gray-950 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">预热</div>
                    <div className="text-base font-bold text-white">{card.warmup || '-'}</div>
                  </div>
                </div>

                {/* Side Effects */}
                {card.side_effects && Object.keys(card.side_effects).length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">副作用</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(card.side_effects).map(([name, val]) => {
                        const numVal = parseFloat(val);
                        const groupA = new Set(['自然', '电气', '火焰', '水']);
                        const cls = groupA.has(name) ? 'text-yellow-400 border-yellow-400' : 'text-gray-300 border-gray-500';
                        const prefix = numVal > 0 ? '+' : '';
                        return (
                          <span key={name} className={`px-2 py-1 rounded-md text-xs bg-gray-800 border ${cls}`}>
                            {name}: {prefix}{val}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-20">
              <div className="text-4xl mb-4">🃏</div>
              <p className="text-lg">请从左侧选择一张技能卡</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
