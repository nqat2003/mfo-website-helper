export interface Card {
  id: number;
  card_number?: string;
  name_cn: string;
  name_vn: string;
  rarity: string;
  description?: string;
  description_vn?: string;
  pet_usable?: string;
  pet_usable_vn?: string;
  cost: number;
  sp_cost: number;
  attack_point_cost: number;
  min_level: number;
  cooldown: number;
  warmup: number;
  attack_attribute?: string;
  attack_attribute_vn?: string;
  attack_domain?: string;
  attack_domain_vn?: string;
  attack_range?: string;
  attack_range_vn?: string;
  cast_method?: string;
  cast_method_vn?: string;
  phantom_side_effect?: number;
  map_effect?: number;
  side_effects?: Record<string, number> | string;
  skill_effect?: string;
  skill_effect_vn?: string;
  image?: string;
}

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSideEffectsTags(sideEffects: Card['side_effects']): string {
  if (!sideEffects) return '';
  let entries: [string, number][] = [];
  if (typeof sideEffects === 'object' && !Array.isArray(sideEffects)) {
    entries = Object.entries(sideEffects);
  } else if (typeof sideEffects === 'string' && sideEffects.trim()) {
    sideEffects.split(',').forEach(pair => {
      const [key, val] = pair.split(':');
      if (key && val !== undefined) {
        entries.push([key.trim(), parseFloat(val.trim())]);
      }
    });
  }
  if (entries.length === 0) return '';
  const tags = entries.map(([name, val]) => {
    const numVal = parseFloat(String(val));
    const colorClass = numVal < 0 ? 'text-red-400 border-red-400/50' : 'text-emerald-400 border-emerald-400/50';
    const prefix = numVal > 0 ? '+' : '';
    return `<span class="inline-block px-2 py-1 rounded-md text-xs font-medium bg-gray-800 border ${colorClass}">${escapeHtml(name)}: ${prefix}${val}</span>`;
  }).join('');
  return `<div class="mb-4"><div class="text-xs text-gray-500 mb-2 uppercase tracking-wider">Tác dụng phụ thuộc tính</div><div class="flex flex-wrap gap-2">${tags}</div></div>`;
}

interface CardDetailProps {
  card: Card;
}

export default function CardDetail({ card }: CardDetailProps) {
  const hasImage = card.image && card.image.trim() !== '';

  const effectsHtml = [];
  if ((card.phantom_side_effect || 0) !== 0) {
    effectsHtml.push(
      `<div class="flex justify-between py-2 px-3 bg-gray-950/30 rounded-lg border border-gray-800/50"><span class="text-sm text-gray-400">Ảo ảnh phụ</span><span class="text-sm font-semibold ${(card.phantom_side_effect || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}">${(card.phantom_side_effect || 0) > 0 ? '+' : ''}${card.phantom_side_effect}</span></div>`
    );
  }
  if ((card.map_effect || 0) !== 0) {
    effectsHtml.push(
      `<div class="flex justify-between py-2 px-3 bg-gray-950/30 rounded-lg border border-gray-800/50"><span class="text-sm text-gray-400">Hiệu ứng bản đồ</span><span class="text-sm font-semibold ${(card.map_effect || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}">${(card.map_effect || 0) > 0 ? '+' : ''}${card.map_effect}</span></div>`
    );
  }

  return (
    <div className="fade-in">
      {/* Image */}
      <div className="mb-6">
        {hasImage && (
          <img
            src={escapeHtml(card.image)}
            alt={escapeHtml(card.name_vn)}
            className="w-full max-w-sm mx-auto rounded-xl border-2 border-gray-700"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
              if (next) next.style.display = 'flex';
            }}
          />
        )}
        <div
          className={`placeholder-card w-full max-w-sm mx-auto rounded-xl border-2 border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col items-center justify-center py-12`}
          style={{ display: hasImage ? 'none' : 'flex' }}
        >
          <div className="text-5xl mb-2">🃏</div>
          <div className="text-lg font-bold text-gray-300">{escapeHtml(card.name_cn) || 'Thẻ chưa đặt tên'}</div>
          <div className="text-sm text-gray-500">{escapeHtml(card.name_vn)}</div>
        </div>
      </div>

      {/* Names & Rarity */}
      <div className="text-center mb-6">
        {card.card_number ? (
          <div className="text-sm text-gray-500 mb-1">
            Số thẻ: <span className="text-yellow-400 font-mono font-bold">{escapeHtml(card.card_number)}</span>
          </div>
        ) : null}
        <h1 className="text-2xl font-bold text-white">{escapeHtml(card.name_vn) || 'Tên tiếng Việt'}</h1>
        <p className="text-sm text-gray-400 mt-1">{escapeHtml(card.name_cn) || 'Tên tiếng Trung'}</p>
        <span className={`inline-block mt-3 px-4 py-1 rounded-full text-sm font-bold rarity-${card.rarity || 'E'}`}>
          {card.rarity || '-'}
        </span>
        {(card.pet_usable_vn || card.pet_usable) ? (
          <div className="mt-3 text-sm">
            <span className="text-gray-500">Thú cưng:</span>{' '}
            <span className="text-amber-400 font-medium">{escapeHtml(card.pet_usable_vn || card.pet_usable)}</span>
          </div>
        ) : null}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Cost</div><div className="text-lg font-bold text-white">{(card.cost ?? 0).toFixed(2)}</div></div>
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">SP Tiêu hao</div><div className="text-lg font-bold text-white">{card.sp_cost ?? 0}</div></div>
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Điểm PP</div><div className="text-lg font-bold text-white">{card.attack_point_cost ?? 0}</div></div>
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Cấp tối thiểu</div><div className="text-lg font-bold text-white">{card.min_level ?? 0}</div></div>
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Hồi chiêu</div><div className="text-lg font-bold text-white">{card.cooldown ?? 0}</div></div>
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Khởi động</div><div className="text-lg font-bold text-white">{card.warmup ?? 0}</div></div>
      </div>

      {/* Categorical Stats */}
      <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 mb-6 space-y-2">
        <div className="flex justify-between"><span className="text-sm text-gray-400">Thuộc tính tấn công</span><span className="text-sm font-semibold text-white">{escapeHtml(card.attack_attribute_vn)} <span className="text-gray-500">({escapeHtml(card.attack_attribute)})</span></span></div>
        <div className="flex justify-between"><span className="text-sm text-gray-400">Lĩnh vực tấn công</span><span className="text-sm font-semibold text-white">{escapeHtml(card.attack_domain_vn)} <span className="text-gray-500">({escapeHtml(card.attack_domain)})</span></span></div>
        <div className="flex justify-between"><span className="text-sm text-gray-400">Phạm vi tấn công</span><span className="text-sm font-semibold text-white">{escapeHtml(card.attack_range_vn)}</span></div>
        <div className="flex justify-between"><span className="text-sm text-gray-400">Phương thức thi triển</span><span className="text-sm font-semibold text-white">{escapeHtml(card.cast_method_vn)}</span></div>
      </div>

      {/* Effects */}
      {effectsHtml.length > 0 ? (
        <div className="space-y-2 mb-6" dangerouslySetInnerHTML={{ __html: effectsHtml.join('') }} />
      ) : null}
      <div dangerouslySetInnerHTML={{ __html: renderSideEffectsTags(card.side_effects) }} />

      {/* Skill Effect */}
      <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Hiệu ứng kỹ năng</div>
        <p className="text-sm text-gray-300 leading-relaxed">{escapeHtml(card.skill_effect_vn || card.skill_effect) || 'Chưa có mô tả.'}</p>
      </div>
    </div>
  );
}
