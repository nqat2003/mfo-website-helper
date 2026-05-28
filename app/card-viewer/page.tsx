'use client';

import { useState, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';
import BackToMenu from '@/components/BackToMenu';
import CardDetail, { Card } from '@/components/CardDetail';
import baseCardsData from '@/data/cards.json';

export default function CardViewerPage() {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [fuse, setFuse] = useState<Fuse<Card> | null>(null);
  const [query, setQuery] = useState('');
  const [currentRarity, setCurrentRarity] = useState('all');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  useEffect(() => {
    const baseCards = (baseCardsData as unknown as { cards: Card[] }).cards || [];

    let customCards: Card[] = [];
    try {
      const raw = localStorage.getItem('card_editor_custom');
      if (raw) customCards = JSON.parse(raw);
    } catch (e) { /* ignore */ }

    const baseMap = new Map(baseCards.map(c => [c.id, c]));
    customCards.forEach(c => baseMap.set(c.id, c));
    const merged = Array.from(baseMap.values());
    merged.sort((a, b) => a.id - b.id);

    setAllCards(merged);
    setFuse(new Fuse(merged, {
      keys: ['id', 'card_number', 'name_cn', 'name_vn', 'description', 'description_vn',
             'pet_usable', 'pet_usable_vn', 'attack_attribute', 'attack_attribute_vn',
             'attack_domain', 'attack_domain_vn', 'skill_effect', 'skill_effect_vn'],
      threshold: 0.4,
      includeScore: false,
    }));
  }, []);

  const doSearch = useCallback((searchQuery: string, rarity: string) => {
    let results = allCards;
    if (searchQuery) {
      results = fuse?.search(searchQuery).map(r => r.item) || [];
    }
    if (rarity !== 'all') {
      results = results.filter(c => c.rarity === rarity);
    }
    return results;
  }, [allCards, fuse]);

  const results = doSearch(query, currentRarity);
  const selectedCard = allCards.find(c => c.id === selectedCardId) || null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6 min-h-screen">
      {/* Left Panel */}
      <aside className="w-80 flex-shrink-0 flex flex-col gap-4">
        <BackToMenu />

        {/* Search Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-lg font-bold text-white mb-3">Tra cứu thẻ</h2>
          <input
            type="text"
            placeholder="Nhập tên thẻ, số thẻ, hoặc từ khóa..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Rarity Filter */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <label className="text-sm text-gray-400 mb-2 block">Lọc độ hiếm:</label>
          <div className="flex flex-wrap gap-2">
            {['all', 'S', 'A', 'B', 'C', 'D', 'E'].map(r => (
              <button
                key={r}
                onClick={() => setCurrentRarity(r)}
                className={`px-3 py-1 rounded-md text-xs font-bold border border-gray-700 transition-all ${
                  currentRarity === r
                    ? `rarity-${r} active`
                    : 'text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                {r === 'all' ? '全部' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex-1 flex flex-col min-h-0">
          <div className="text-sm text-gray-400 mb-2">Tìm thấy <span className="text-yellow-400 font-bold">{results.length}</span> thẻ</div>
          <div className="flex-1 overflow-y-auto bg-gray-950 rounded-lg p-2 space-y-1">
            {results.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-8">Không tìm thấy thẻ nào phù hợp</div>
            ) : (
              results.map(card => (
                <div
                  key={card.id}
                  className={`cursor-pointer p-3 rounded-lg transition-all ${
                    selectedCardId === card.id
                      ? 'bg-yellow-900/40 border-l-4 border-yellow-400'
                      : 'bg-gray-800 hover:bg-gray-700 border-l-4 border-transparent'
                  }`}
                  onClick={() => setSelectedCardId(card.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono">#{card.id}</span>
                      <span className="text-sm font-semibold text-white">{card.name_cn}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold rarity-${card.rarity}`}>{card.rarity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Right Panel */}
      <main className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-6 fade-in">
        {selectedCard ? (
          <CardDetail card={selectedCard} />
        ) : (
          <div className="text-center text-gray-500 py-20">
            <div className="text-4xl mb-4">🃏</div>
            <p className="text-lg">Chọn một thẻ từ danh sách bên trái để xem chi tiết</p>
          </div>
        )}
      </main>
    </div>
  );
}
