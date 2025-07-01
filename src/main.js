document.addEventListener('DOMContentLoaded', () => {
    // ...既存のUI要素取得・変数定義...
    const backgroundSuggestionsContainer = document.getElementById('backgroundSuggestions');
    const psToast = document.getElementById('psToast');
    // ...existing code...

    // ユーティリティ
    function getLuminance(rgb) {
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    }
    function getRecommendedTextColor(rgb) {
        return getLuminance(rgb) > 128 ? '#111111' : '#FFFFFF';
    }

    // トースト
    function showToast(message, type = 'success', duration = 1800) {
        psToast.textContent = message;
        psToast.className = `ps-toast show ${type}`;
        setTimeout(() => {
            psToast.classList.remove('show');
        }, duration);
    }

    // コピー
    function copyToClipboard(text, toastMsg) {
        navigator.clipboard.writeText(text).then(() => showToast(toastMsg, 'success'));
    }
    // ダウンロード
    function downloadTextHex(hex) {
        const blob = new Blob([hex], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recommended_text_color.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('テキスト色HEXをダウンロードしました', 'success');
    }

    // 背景色提案ボタン生成
    function createBgSuggestionButton(bg) {
        const btn = document.createElement('button');
        btn.className = 'w-full p-3 rounded-lg text-xs font-medium flex items-center gap-2 justify-between border border-[#e5e7eb] hover:scale-[1.03] transition';
        btn.style.background = bg.hex;
        btn.style.color = bg.textColor;
        btn.textContent = `${bg.name} (${bg.hex})`;
        // HEXコピー
        const copyIcon = document.createElement('span');
        copyIcon.innerHTML = `<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" stroke="${bg.textColor}" stroke-width="2"/><path d="M5 5h6a2 2 0 0 1 2 2v6" stroke="${bg.textColor}" stroke-width="2" stroke-linecap="round"/></svg>`;
        copyIcon.style.cursor = 'pointer';
        copyIcon.title = '背景色HEXをコピー';
        copyIcon.onclick = (e) => { e.stopPropagation(); copyToClipboard(bg.hex, '背景色HEXをコピーしました'); };
        btn.appendChild(copyIcon);
        // 推奨テキスト色HEXコピー
        const textHexBtn = document.createElement('button');
        textHexBtn.className = 'ml-2 text-xs underline decoration-dotted opacity-70 hover:opacity-100';
        textHexBtn.style.background = 'none';
        textHexBtn.style.border = 'none';
        textHexBtn.style.color = bg.textColor;
        textHexBtn.textContent = bg.textColor;
        textHexBtn.title = '推奨テキスト色HEXをコピー';
        textHexBtn.onclick = (e) => { e.stopPropagation(); copyToClipboard(bg.textColor, 'テキスト色HEXをコピーしました'); };
        btn.appendChild(textHexBtn);
        // 推奨テキスト色HEXダウンロード
        const dlBtn = document.createElement('button');
        dlBtn.className = 'ml-1 opacity-60 hover:opacity-100';
        dlBtn.title = '推奨テキスト色HEXをダウンロード';
        dlBtn.innerHTML = `<svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M12 5v14m0 0l-5-5m5 5l5-5" stroke="${bg.textColor}" stroke-width="2" stroke-linecap="round"/></svg>`;
        dlBtn.onclick = (e) => { e.stopPropagation(); downloadTextHex(bg.textColor); };
        btn.appendChild(dlBtn);
        return btn;
    }

    // 背景色提案エリアの更新
    function updateBackgroundSuggestions(palette) {
        backgroundSuggestionsContainer.innerHTML = '';
        if (!palette || palette.length === 0) return;
        const rgbToHex = (r, g, b) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        const rgbToHsl = (rgb) => { let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255; let max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2; if (max == min) { h = s = 0; } else { let d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6; } return { h: h * 360, s: s, l: l }; };
        const hslToRgb = (hsl) => { let h = hsl.h, s = hsl.s, l = hsl.l; let r, g, b; if (s == 0) { r = g = b = l; } else { const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p; }; let q = l < 0.5 ? l * (1 + s) : l + s - l * s; let p = 2 * l - q; h /= 360; r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3); } return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }; };
        const endColorHsl = rgbToHsl(palette[palette.length - 1].rawRgb);
        const softTintRgb = hslToRgb({ h: endColorHsl.h, s: Math.max(0, endColorHsl.s - 0.2), l: 0.97 });
        const startColorHsl = rgbToHsl(palette[0].rawRgb);
        const complementaryRgb = hslToRgb({ h: (startColorHsl.h + 180) % 360, s: 0.15, l: 0.96 });
        const suggestions = [
            { name: 'White', hex: '#FFFFFF', rgb: {r: 255, g: 255, b: 255}},
            { name: 'Dark Gray', hex: '#1F2937', rgb: {r: 31, g: 41, b: 55}},
            { name: 'やさしい色合い', hex: rgbToHex(softTintRgb.r, softTintRgb.g, softTintRgb.b), rgb: softTintRgb},
            { name: '上品なアクセント', hex: rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b), rgb: complementaryRgb}
        ];
        suggestions.forEach(bg => {
            bg.textColor = getRecommendedTextColor(bg.rgb);
            // ボタン本体（button要素）
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'w-full p-3 rounded-lg text-xs font-medium flex flex-col border border-[#e5e7eb] bg-white shadow-sm mb-1';
            btn.style.background = bg.hex;
            btn.style.color = bg.textColor;
            // ラベル
            const label = document.createElement('div');
            label.className = 'flex items-center justify-between mb-1';
            label.innerHTML = `<span>${bg.name} <span style="font-size:0.95em;">(${bg.hex})</span></span>`;
            btn.appendChild(label);
            // 機能ボタン群
            const actions = document.createElement('div');
            actions.className = 'flex gap-2 mt-1';
            // 背景色HEXコピー専用ボタン
            const hexCopyBtn = document.createElement('button');
            hexCopyBtn.type = 'button';
            hexCopyBtn.className = 'copy-hex-btn flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-xs';
            hexCopyBtn.innerHTML = `<svg width="13" height="13" fill="none" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" stroke="${bg.textColor}" stroke-width="2"/><path d="M5 5h6a2 2 0 0 1 2 2v6" stroke="${bg.textColor}" stroke-width="2" stroke-linecap="round"/></svg>HEXコピー`;
            hexCopyBtn.title = '背景色HEXをコピー';
            hexCopyBtn.onclick = (e) => { e.stopPropagation(); copyToClipboard(bg.hex, '背景色HEXをコピーしました'); };
            actions.appendChild(hexCopyBtn);
            // 推奨テキスト色HEXコピー
            const textHexBtn = document.createElement('button');
            textHexBtn.type = 'button';
            textHexBtn.className = 'text-hex-btn flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-xs';
            textHexBtn.style.color = bg.textColor;
            textHexBtn.innerHTML = `<svg width="13" height="13" fill="none" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" stroke="${bg.textColor}" stroke-width="2"/><path d="M5 5h6a2 2 0 0 1 2 2v6" stroke="${bg.textColor}" stroke-width="2" stroke-linecap="round"/></svg>${bg.textColor}`;
            textHexBtn.title = '推奨テキスト色HEXをコピー';
            textHexBtn.onclick = (e) => { e.stopPropagation(); copyToClipboard(bg.textColor, 'テキスト色HEXをコピーしました'); };
            actions.appendChild(textHexBtn);
            // 推奨テキスト色HEXダウンロード
            const dlBtn = document.createElement('button');
            dlBtn.type = 'button';
            dlBtn.className = 'dl-hex-btn flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-xs';
            dlBtn.title = '推奨テキスト色HEXをダウンロード';
            dlBtn.innerHTML = `<svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M12 5v14m0 0l-5-5m5 5l5-5" stroke="${bg.textColor}" stroke-width="2" stroke-linecap="round"/></svg>DL`;
            dlBtn.onclick = (e) => { e.stopPropagation(); downloadTextHex(bg.textColor); };
            actions.appendChild(dlBtn);
            btn.appendChild(actions);
            btn.onclick = () => {
                // プレビューの背景色を上書き
                const preview = document.getElementById('preview');
                preview.style.backgroundColor = bg.hex;
                preview.classList.remove('bg-gradient-to-br', 'from-[#fafdff]', 'to-[#f5f6fa]');
            };
            backgroundSuggestionsContainer.appendChild(btn);
        });
    }

    // ...既存の初期化・イベントリスナー・他ロジック...
});