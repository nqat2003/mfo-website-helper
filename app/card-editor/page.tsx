'use client';

import { useState, useEffect, useCallback } from 'react';
import BackToMenu from '@/components/BackToMenu';
import CardDetail, { Card } from '@/components/CardDetail';
import baseCardsData from '@/data/cards.json';

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function CardEditorPage() {
  const [baseCards, setBaseCards] = useState<Card[]>([]);
  const [customCards, setCustomCards] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMsgs, setErrorMsgs] = useState<string[]>([]);

  // Form state
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const base = (baseCardsData as unknown as { cards: Card[] }).cards || [];
    setBaseCards(base);

    let custom: Card[] = [];
    try {
      const raw = localStorage.getItem('card_editor_custom');
      if (raw) custom = JSON.parse(raw);
    } catch (e) { /* ignore */ }
    setCustomCards(custom);

    rebuildAllCards(base, custom);
  }, []);

  function rebuildAllCards(base: Card[], custom: Card[]) {
    const map = new Map(base.map(c => [c.id, c]));
    custom.forEach(c => map.set(c.id, c));
    const merged = Array.from(map.values());
    merged.sort((a, b) => a.id - b.id);
    setAllCards(merged);
  }

  function isCustomCard(id: number) {
    return customCards.some(c => c.id === id);
  }

  function getField(id: string): string {
    return form[id] || '';
  }

  function setField(id: string, val: string) {
    setForm(prev => ({ ...prev, [id]: val }));
  }

  function buildCardFromForm(): Card {
    const getNum = (key: string) => {
      const v = form[key];
      return v === '' || v === undefined ? 0 : parseFloat(v);
    };
    return {
      id: parseInt(form.id || '0') || 0,
      name_cn: form.name_cn || '',
      name_vn: form.name_vn || '',
      rarity: form.rarity || '',
      description: form.description || '',
      description_vn: form.description_vn || '',
      pet_usable: form.pet_usable || '',
      pet_usable_vn: form.pet_usable_vn || '',
      card_number: form.card_number || '',
      cost: getNum('cost'),
      sp_cost: getNum('sp_cost'),
      attack_point_cost: getNum('attack_point_cost'),
      min_level: getNum('min_level'),
      cooldown: getNum('cooldown'),
      warmup: getNum('warmup'),
      attack_attribute: form.attack_attribute || '',
      attack_attribute_vn: form.attack_attribute_vn || '',
      attack_domain: form.attack_domain || '',
      attack_domain_vn: form.attack_domain_vn || '',
      attack_range: form.attack_range || '',
      attack_range_vn: form.attack_range_vn || '',
      cast_method: form.cast_method || '',
      cast_method_vn: form.cast_method_vn || '',
      phantom_side_effect: getNum('phantom_side_effect'),
      map_effect: getNum('map_effect'),
      side_effects: parseSideEffects(form.side_effects || ''),
      skill_effect: form.skill_effect || '',
      skill_effect_vn: form.skill_effect_vn || '',
      image: form.image || '',
    };
  }

  function populateForm(card: Card) {
    const newForm: Record<string, string> = {
      id: String(card.id || ''),
      name_cn: card.name_cn || '',
      name_vn: card.name_vn || '',
      rarity: card.rarity || '',
      description: card.description || '',
      description_vn: card.description_vn || '',
      pet_usable: card.pet_usable || '',
      pet_usable_vn: card.pet_usable_vn || '',
      card_number: card.card_number || '',
      cost: card.cost !== undefined ? String(card.cost) : '0',
      sp_cost: card.sp_cost !== undefined ? String(card.sp_cost) : '0',
      attack_point_cost: card.attack_point_cost !== undefined ? String(card.attack_point_cost) : '0',
      min_level: card.min_level !== undefined ? String(card.min_level) : '0',
      cooldown: card.cooldown !== undefined ? String(card.cooldown) : '0',
      warmup: card.warmup !== undefined ? String(card.warmup) : '0',
      attack_attribute: card.attack_attribute || '',
      attack_attribute_vn: card.attack_attribute_vn || '',
      attack_domain: card.attack_domain || '',
      attack_domain_vn: card.attack_domain_vn || '',
      attack_range: card.attack_range || '',
      attack_range_vn: card.attack_range_vn || '',
      cast_method: card.cast_method || '',
      cast_method_vn: card.cast_method_vn || '',
      phantom_side_effect: card.phantom_side_effect !== undefined ? String(card.phantom_side_effect) : '0',
      map_effect: card.map_effect !== undefined ? String(card.map_effect) : '0',
      side_effects: stringifySideEffects(card.side_effects) || '',
      skill_effect: card.skill_effect || '',
      skill_effect_vn: card.skill_effect_vn || '',
      image: card.image || '',
    };
    setForm(newForm);
  }

  function parseSideEffects(str: string): Record<string, number> {
    if (!str || !str.trim()) return {};
    const result: Record<string, number> = {};
    str.split(',').forEach(pair => {
      const [key, val] = pair.split(':');
      if (key && val !== undefined) {
        result[key.trim()] = parseFloat(val.trim());
      }
    });
    return result;
  }

  function stringifySideEffects(obj: Card['side_effects']): string {
    if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) return '';
    return Object.entries(obj).map(([k, v]) => k.trim() + ':' + v).join(',');
  }

  function clearForm() {
    setForm({});
    setEditingId(null);
    setErrorMsgs([]);
  }

  function validate(): string[] {
    const errors: string[] = [];
    const idVal = parseInt(form.id || '0');
    if (!idVal || idVal < 1) errors.push('ID phải là số nguyên dương.');
    if (!form.name_cn) errors.push('Tên tiếng Trung là bắt buộc.');
    if (!form.name_vn) errors.push('Tên tiếng Việt là bắt buộc.');
    if (!form.rarity) errors.push('Độ hiếm là bắt buộc.');

    if (!editingId && customCards.some(c => c.id === idVal)) {
      errors.push('ID thẻ đã tồn tại. Vui lòng chọn ID khác hoặc chuyển sang chế độ chỉnh sửa.');
    }
    if (editingId && editingId !== idVal && customCards.some(c => c.id === idVal)) {
      errors.push('ID thẻ đã được sử dụng bởi thẻ khác.');
    }

    return errors;
  }

  function saveCard() {
    setErrorMsgs([]);
    const errors = validate();
    if (errors.length > 0) {
      setErrorMsgs(errors);
      return;
    }

    const card = buildCardFromForm();
    let newCustom = [...customCards];

    if (editingId) {
      const idx = newCustom.findIndex(c => c.id === editingId);
      if (idx >= 0) {
        newCustom[idx] = card;
      } else {
        newCustom.push(card);
      }
    } else {
      newCustom.push(card);
    }

    setCustomCards(newCustom);
    try {
      localStorage.setItem('card_editor_custom', JSON.stringify(newCustom));
    } catch (e) {
      alert('Bộ nhớ trình duyệt đầy. Hãy xuất JSON và xóa bớt thẻ.');
    }
    rebuildAllCards(baseCards, newCustom);
    clearForm();
  }

  function deleteCard() {
    if (!editingId) return;
    if (!isCustomCard(editingId)) {
      alert('Không thể xóa thẻ gốc. Chỉ có thể xóa thẻ custom.');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa thẻ #' + editingId + '?')) return;

    const newCustom = customCards.filter(c => c.id !== editingId);
    setCustomCards(newCustom);
    try {
      localStorage.setItem('card_editor_custom', JSON.stringify(newCustom));
    } catch (e) { /* ignore */ }
    rebuildAllCards(baseCards, newCustom);
    clearForm();
  }

  function editCard(id: number) {
    const card = allCards.find(c => c.id === id);
    if (!card) return;
    setEditingId(id);
    populateForm(card);
    setErrorMsgs([]);
  }

  function removeCard(id: number) {
    if (!isCustomCard(id)) {
      alert('Không thể xóa thẻ gốc. Chỉ có thể xóa thẻ custom.');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa thẻ #' + id + '?')) return;
    const newCustom = customCards.filter(c => c.id !== id);
    setCustomCards(newCustom);
    try {
      localStorage.setItem('card_editor_custom', JSON.stringify(newCustom));
    } catch (e) { /* ignore */ }
    rebuildAllCards(baseCards, newCustom);
    if (editingId === id) clearForm();
  }

  async function exportJSON() {
    const map = new Map(baseCards.map(c => [c.id, c]));
    customCards.forEach(c => map.set(c.id, c));
    const all = Array.from(map.values()).sort((a, b) => a.id - b.id);

    const blob = new Blob([JSON.stringify({ cards: all }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cards_merged.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const previewCard = buildCardFromForm();
  const hasPreview = !!previewCard.name_cn || !!previewCard.id;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BackToMenu />
          <h1 className="text-xl font-bold text-white">Card Editor / Quản lý thẻ</h1>
        </div>
        <button onClick={exportJSON} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          Export JSON
        </button>
      </div>

      <div className="flex gap-6 min-h-[calc(100vh-140px)]">
        {/* Left Panel: Form */}
        <div className="w-[55%] flex-shrink-0 flex flex-col gap-4">
          {/* Mode Indicator */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-bold text-white">{editingId ? `Chỉnh sửa thẻ #${editingId}` : 'Thêm thẻ mới'}</h2>
            <p className="text-sm text-gray-400">{editingId ? 'Cập nhật thông tin thẻ và nhấn Lưu.' : 'Điền thông tin thẻ bên dưới và nhấn Lưu.'}</p>
          </div>

          {/* Error Banner */}
          {errorMsgs.length > 0 && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-300 text-sm">
              {errorMsgs.map((m, i) => <div key={i}>• {m}</div>)}
            </div>
          )}

          {/* Form */}
          <form className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-5" onSubmit={e => { e.preventDefault(); saveCard(); }}>
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Thông tin cơ bản</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs text-gray-400 mb-1">ID <span className="text-red-400">*</span></label>
                  <input type="number" min="1" required value={getField('id')} onChange={e => setField('id', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-gray-400 mb-1">Độ hiếm <span className="text-red-400">*</span></label>
                  <select required value={getField('rarity')} onChange={e => setField('rarity', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all">
                    <option value="">Chọn...</option>
                    <option value="S">S</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-gray-400 mb-1">Số thẻ</label>
                  <input type="text" value={getField('card_number')} onChange={e => setField('card_number', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Tên (Tiếng Trung) <span className="text-red-400">*</span></label>
                  <input type="text" required value={getField('name_cn')} onChange={e => setField('name_cn', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Tên (Tiếng Việt) <span className="text-red-400">*</span></label>
                  <input type="text" required value={getField('name_vn')} onChange={e => setField('name_vn', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Chỉ số</h3>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs text-gray-400 mb-1">Cost</label><input type="number" step="0.01" value={getField('cost') || '0'} onChange={e => setField('cost', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                <div><label className="block text-xs text-gray-400 mb-1">SP</label><input type="number" value={getField('sp_cost') || '0'} onChange={e => setField('sp_cost', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                <div><label className="block text-xs text-gray-400 mb-1">Điểm PP</label><input type="number" value={getField('attack_point_cost') || '0'} onChange={e => setField('attack_point_cost', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                <div><label className="block text-xs text-gray-400 mb-1">Cấp tối thiểu</label><input type="number" value={getField('min_level') || '0'} onChange={e => setField('min_level', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                <div><label className="block text-xs text-gray-400 mb-1">Hồi chiêu</label><input type="number" value={getField('cooldown') || '0'} onChange={e => setField('cooldown', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                <div><label className="block text-xs text-gray-400 mb-1">Khởi động</label><input type="number" value={getField('warmup') || '0'} onChange={e => setField('warmup', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
              </div>
            </div>

            {/* Attributes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Thuộc tính</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-gray-400 mb-1">Thuộc tính tấn công (CN)</label><input type="text" value={getField('attack_attribute')} onChange={e => setField('attack_attribute', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                  <div><label className="block text-xs text-gray-400 mb-1">Thuộc tính tấn công (VN)</label><input type="text" value={getField('attack_attribute_vn')} onChange={e => setField('attack_attribute_vn', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-gray-400 mb-1">Lĩnh vực (CN)</label><input type="text" value={getField('attack_domain')} onChange={e => setField('attack_domain', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                  <div><label className="block text-xs text-gray-400 mb-1">Lĩnh vực (VN)</label><input type="text" value={getField('attack_domain_vn')} onChange={e => setField('attack_domain_vn', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-gray-400 mb-1">Phạm vi (CN)</label><input type="text" value={getField('attack_range')} onChange={e => setField('attack_range', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                  <div><label className="block text-xs text-gray-400 mb-1">Phạm vi (VN)</label><input type="text" value={getField('attack_range_vn')} onChange={e => setField('attack_range_vn', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-gray-400 mb-1">Thi triển (CN)</label><input type="text" value={getField('cast_method')} onChange={e => setField('cast_method', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                  <div><label className="block text-xs text-gray-400 mb-1">Thi triển (VN)</label><input type="text" value={getField('cast_method_vn')} onChange={e => setField('cast_method_vn', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-gray-400 mb-1">Thú cưng (CN)</label><input type="text" value={getField('pet_usable')} onChange={e => setField('pet_usable', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                  <div><label className="block text-xs text-gray-400 mb-1">Thú cưng (VN)</label><input type="text" value={getField('pet_usable_vn')} onChange={e => setField('pet_usable_vn', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                </div>
              </div>
            </div>

            {/* Effects */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Hiệu ứng</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-400 mb-1">Ảo ảnh phụ</label><input type="number" value={getField('phantom_side_effect') || '0'} onChange={e => setField('phantom_side_effect', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                <div><label className="block text-xs text-gray-400 mb-1">Hiệu ứng bản đồ</label><input type="number" value={getField('map_effect') || '0'} onChange={e => setField('map_effect', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
                <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Tác dụng phụ thuộc tính (VD: Lửa:-30,Thủy:-20)</label><input type="text" value={getField('side_effects')} onChange={e => setField('side_effects', e.target.value)} placeholder="Lửa:-30,Thủy:-20" className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
              </div>
            </div>

            {/* Descriptions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Mô tả</h3>
              <div className="space-y-3">
                <div><label className="block text-xs text-gray-400 mb-1">Mô tả ngắn (CN)</label><textarea rows={2} value={getField('description')} onChange={e => setField('description', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all resize-none"></textarea></div>
                <div><label className="block text-xs text-gray-400 mb-1">Mô tả ngắn (VN)</label><textarea rows={2} value={getField('description_vn')} onChange={e => setField('description_vn', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all resize-none"></textarea></div>
                <div><label className="block text-xs text-gray-400 mb-1">Hiệu ứng kỹ năng (CN)</label><textarea rows={4} value={getField('skill_effect')} onChange={e => setField('skill_effect', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all resize-none"></textarea></div>
                <div><label className="block text-xs text-gray-400 mb-1">Hiệu ứng kỹ năng (VN)</label><textarea rows={4} value={getField('skill_effect_vn')} onChange={e => setField('skill_effect_vn', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all resize-none"></textarea></div>
              </div>
            </div>

            {/* Image */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Hình ảnh</h3>
              <div><label className="block text-xs text-gray-400 mb-1">Đường dẫn ảnh (tùy chọn)</label><input type="text" value={getField('image')} onChange={e => setField('image', e.target.value)} placeholder="images/cards/card_670.png" className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" /></div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">{editingId ? 'Cập nhật thẻ' : 'Lưu thẻ'}</button>
              <button type="button" onClick={clearForm} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">Hủy</button>
              {editingId && (
                <button type="button" onClick={deleteCard} className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors">Xóa thẻ</button>
              )}
            </div>
          </form>
        </div>

        {/* Right Panel: Preview + List */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Live Preview */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Xem trước</h3>
            <div className="fade-in">
              {hasPreview ? (
                <CardDetail card={previewCard} />
              ) : (
                <div className="text-center text-gray-500 py-10">
                  <div className="text-3xl mb-2">👁️</div>
                  <p>Điền thông tin thẻ để xem trước</p>
                </div>
              )}
            </div>
          </div>

          {/* All Cards List */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Danh sách thẻ <span className="text-yellow-400">{allCards.length}</span></h3>
            <div className="flex-1 overflow-y-auto bg-gray-950 rounded-lg">
              {allCards.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">Chưa có thẻ nào.</div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {allCards.map(card => {
                    const custom = isCustomCard(card.id);
                    return (
                      <div key={card.id} className={`flex items-center justify-between p-3 hover:bg-gray-800/50 transition-colors ${editingId === card.id ? 'bg-blue-900/20 border-l-2 border-l-blue-400' : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-mono">#{card.id}</span>
                          {card.card_number ? <span className="text-xs text-yellow-400 font-mono font-bold">[{escapeHtml(card.card_number)}]</span> : null}
                          <span className="text-sm font-semibold text-white">{escapeHtml(card.name_cn)}</span>
                          <span className="text-xs text-gray-400">{escapeHtml(card.name_vn)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold rarity-${card.rarity}`}>{card.rarity}</span>
                          {custom ? <span className="px-1 py-0.5 rounded text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-800">custom</span> : null}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => editCard(card.id)} className="px-2 py-1 bg-blue-900/40 hover:bg-blue-900/60 rounded text-xs text-blue-300 transition-colors">Sửa</button>
                          {custom && (
                            <button onClick={() => removeCard(card.id)} className="px-2 py-1 bg-red-900/40 hover:bg-red-900/60 rounded text-xs text-red-300 transition-colors">Xóa</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
