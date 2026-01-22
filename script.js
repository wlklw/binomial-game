// ==========================================
// 1. 全域變數與預設資料
// ==========================================

// 預設關卡 (離線時可玩)
let levels = [
    {
        id: "static-1",
        targetName: "Melanogaster",
        desc: "【入門】這隻蒼蠅有著「黑色的肚皮」",
        hint: "(遺傳學模式生物)",
        icon: "🪰",
        solution: ["Melano-", "-gaster"],
        pool: [
            { text: "Melano-", meaning: "黑色" },
            { text: "Leuco-", meaning: "白色" },
            { text: "-gaster", meaning: "腹部" },
            { text: "-cephala", meaning: "頭部" }
        ]
    }
];

let currentLevelIdx = 0;
let currentSlots = [];
const GBIF_API = "https://api.gbif.org/v1/occurrence/search";

// ==========================================
// 2. 核心遊戲介面邏輯 (UI)
// ==========================================

function initLevel() {
    // 安全檢查
    if (!levels || levels.length === 0) return;

    const level = levels[currentLevelIdx];
    
    // 1. UI 文字更新
    const descEl = document.getElementById('mission-desc');
    
    // 判斷是否為「屬名挑戰模式」(有 displayGenus 欄位)
    if (level.displayGenus) {
        // 顯示格式：Begonia _______ ?
        descEl.innerHTML = 
            `<span style="color:#e94560; font-size:1.3em; font-weight:bold;">${level.displayGenus}</span> ` +
            `<span style="border-bottom: 2px solid #fff; display:inline-block; width:80px; text-align:center;">?</span>` +
            `<div style="font-size:0.9rem; color:#bbb; margin-top:5px; font-weight:normal;">${level.desc}</div>`;
    } else {
        // 一般模式
        descEl.textContent = level.desc;
    }
    
    document.getElementById('mission-hint').textContent = level.hint;
    
    // 2. 圖片處理
    const iconEl = document.getElementById('target-icon');
    if (level.imageUrl) {
        iconEl.textContent = "";
        iconEl.style.backgroundImage = `url('${level.imageUrl}')`;
        iconEl.style.backgroundColor = "#fff";
    } else {
        iconEl.style.backgroundImage = "none";
        iconEl.style.backgroundColor = "#fff";
        iconEl.textContent = level.icon || "❓";
    }
    
    // 3. 重置狀態
    document.getElementById('feedback-msg').textContent = "";
    document.getElementById('feedback-msg').className = "feedback";
    document.getElementById('next-btn').style.display = "none";
    
    // 4. 動態生成插槽
    const chamber = document.getElementById('chamber');
    chamber.innerHTML = ""; 
    currentSlots = new Array(level.solution.length).fill(null);

    for (let i = 0; i < level.solution.length; i++) {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot';
        slotDiv.id = `slot-${i}`;
        slotDiv.onclick = function() { removeSlot(i); }; // Closure
        chamber.appendChild(slotDiv);
    }

    // 5. 生成卡牌池
    const poolDiv = document.getElementById('pool');
    poolDiv.innerHTML = "";
    
    let shuffledPool = [...level.pool].sort(() => Math.random() - 0.5);

    shuffledPool.forEach((cardData) => {
        const btn = document.createElement('div');
        btn.className = 'card';
        btn.innerHTML = `${cardData.text}<span>${cardData.meaning}</span>`;
        btn.onclick = function() { addToSlot(cardData); };
        poolDiv.appendChild(btn);
    });
}

function addToSlot(cardData) {
    const emptyIdx = currentSlots.indexOf(null);
    if (emptyIdx === -1) return;

    currentSlots[emptyIdx] = cardData;
    renderSlots();
    checkAnswer();
}

function removeSlot(index) {
    if (currentSlots[index] === null) return;
    currentSlots[index] = null;
    document.getElementById('feedback-msg').textContent = "";
    document.getElementById('feedback-msg').className = "feedback";
    renderSlots();
}

function renderSlots() {
    currentSlots.forEach((card, index) => {
        const slotEl = document.getElementById(`slot-${index}`);
        if (card) {
            slotEl.textContent = card.text;
            slotEl.classList.add('filled');
        } else {
            slotEl.textContent = "";
            slotEl.classList.remove('filled');
        }
    });
}

function checkAnswer() {
    if (currentSlots.includes(null)) return;

    const level = levels[currentLevelIdx];
    // 玩家答案：把字根接起來，轉小寫，去掉連字號
    const playerAnswer = currentSlots.map(c => c.text.replace(/-/g, '')).join("").toLowerCase();
    // 正確答案：也是同樣處理
    const targetSimple = level.targetName.replace(/-/g, '').toLowerCase();
    
    const feedbackEl = document.getElementById('feedback-msg');

    // 比對邏輯：只要包含或是相等都算對
    if (targetSimple.includes(playerAnswer) || playerAnswer.includes(targetSimple)) {
        
        // 如果是 API 模式，顯示完整學名
        const displayName = level.displayGenus ? 
                           `${level.displayGenus} ${level.targetName}` : 
                           level.targetName;

        feedbackEl.textContent = `✅ 鑑定成功！學名：${displayName}`;
        feedbackEl.classList.add('success');
        document.getElementById('next-btn').style.display = "inline-block";
    } else {
        feedbackEl.textContent = "❌ 錯誤：這不是正確的種小名";
        feedbackEl.classList.add('fail');
    }
}

// ==========================================
// 3. 工具函式：拆解學名
// ==========================================

function autoParseName(scientificName) {
    // 轉小寫並清乾淨
    let cleanName = scientificName.split(' ').slice(0, 2).join(' ').toLowerCase();
    let detectedRoots = [];
    
    // 檢查字典是否存在
    if (typeof LATIN_ROOTS === 'undefined') {
        console.error("字典檔 dictionary.js 未載入");
        return [];
    }

    // 依照字根長度排序，優先比對長字根
    let sortedDictionary = LATIN_ROOTS.sort((a, b) => b.root.length - a.root.length);

    sortedDictionary.forEach(item => {
        if (cleanName.includes(item.root)) {
            // 避免重複添加
            if (!detectedRoots.some(r => r.raw === item.root)) {
                let displayRoot = item.root.charAt(0).toUpperCase() + item.root.slice(1);
                
                // 判斷前後綴給予 "-" (純視覺效果)
                if (cleanName.startsWith(item.root)) displayRoot += "-";
                else if (cleanName.endsWith(item.root)) displayRoot = "-" + displayRoot;
                else displayRoot = "-" + displayRoot + "-";

                detectedRoots.push({
                    text: displayRoot,
                    raw: item.root,
                    meaning: item.meaning
                });
            }
        }
    });
    return detectedRoots;
}

// 產生觀察筆記文字 (支援維基提示)
function generateSpeciesNotes(genus, specimen, roots, wikiHint) {
    const location = specimen.country || "未知產地";
    
    // 如果有維基百科的資料，優先顯示維基百科！
    if (wikiHint) {
        return {
            desc: `📍 採集地：${location}`,
            hint: wikiHint // 直接用維基百科的摘要當提示
        };
    }

    // 否則顯示字根解釋
    let meanings = roots.map(r => `「${r.meaning}」`).join(" 加 ");
    if (meanings === "") meanings = "獨特的特徵";

    return {
        desc: `📍 採集地：${location}`,
        hint: `🕵️ 命名線索：種名描述了 ${meanings}`
    };
}

// ==========================================
// 4. 維基百科 API 連線 (雙語自動切換版)
// ==========================================

async function getWikiHelper(scientificName) {
    // 將學名轉為維基百科格式 (空格變底線)
    const wikiKey = scientificName.replace(' ', '_');
    
    // 定義要嘗試的語言順序：先中文 (zh)，再英文 (en)
    const languages = ['zh', 'en'];

    for (let lang of languages) {
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${wikiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) continue; // 如果 404，就換下一個語言試試

            const data = await response.json();
            if (!data.extract) continue;

            // --- 防雷處理 ---
            let cleanText = data.extract;
            
            // 替換學名 (不分大小寫)
            const regexSci = new RegExp(scientificName, "gi");
            const replacement = (lang === 'zh') ? "此物種" : "This species";
            cleanText = cleanText.replace(regexSci, replacement);
            
            // 針對英文，有時候開頭會是 "Begonia hydrophila is a..."，也要把屬名+種名分開替換
            const parts = scientificName.split(' ');
            if (parts.length === 2) {
                 // 嘗試把 "Begonia" 替換掉，避免太明顯
                 // 但為了保留語意，英文版我們通常只濾除全名，或者簡單截斷
            }

            // 截斷過長的文字
            const limit = (lang === 'zh') ? 60 : 100; // 英文給長一點
            if (cleanText.length > limit) {
                cleanText = cleanText.substring(0, limit) + "...";
            }

            // 回傳結果 (標註來源語言)
            const prefix = (lang === 'zh') ? "📖 維基記載" : "📖 Wiki (EN)";
            return `${prefix}：${cleanText}`;

        } catch (e) {
            console.log(`Wiki fetch failed for ${lang}`, e);
        }
    }

    return null; // 兩種語言都找不到
}
// ==========================================
// 5. 核心邏輯：屬名挑戰 (包含物種分組 + 維基百科)
// ==========================================

function quickSearch(keyword) {
    document.getElementById('genus-input').value = keyword;
    startGenusChallenge();
}

async// ==========================================
// 修正版：屬名挑戰 (含嚴格過濾 + HTTPS 修復)
// ==========================================

async function startGenusChallenge() {
    const inputEl = document.getElementById('genus-input');
    const genusKeyword = inputEl.value.trim();
    const feedbackEl = document.getElementById('mission-desc');

    if (!genusKeyword) {
        alert("請輸入屬名！");
        return;
    }

    feedbackEl.innerHTML = `📡 正在廣域搜索 <span style="color:#e94560">${genusKeyword}</span> 屬的多樣性標本...`;
    
    try {
        // 1. 抓取資料
        const url = `${GBIF_API}?mediaType=StillImage&limit=300&q=${genusKeyword}`; 
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Network Error");
        const data = await response.json();
        
        // 2. 嚴格過濾 (Strict Filtering)
        const validResults = data.results.filter(item => {
            // 基本檢查：要有學名、有圖片
            if (!item.scientificName || !item.media || !item.media[0].identifier) return false;
            
            const parts = item.scientificName.split(' ');
            
            // 條件 A: 至少要有兩個字 (屬名 + 種名)
            if (parts.length < 2) return false;
            
            // 條件 B: 屬名要對 (防呆)
            if (!parts[0].toLowerCase().includes(genusKeyword.toLowerCase())) return false;

            const speciesPart = parts[1];

            // 條件 C: 踢掉 "Begonia L." 或 "Begonia sp." (種名太短或有點)
            if (speciesPart.length < 3 || speciesPart.includes('.')) return false;

            // 條件 D: 踢掉 "Begonia ×" 或數字 (非純字母)
            // 正則表達式：只允許純英文字母
            if (!/^[a-zA-Z]+$/.test(speciesPart)) return false;

            return true;
        });

        if (validResults.length === 0) {
            alert(`找不到 ${genusKeyword} 屬的「有效」物種圖片 (過濾了雜交種與未定種)。`);
            feedbackEl.textContent = "搜尋結果為空。";
            return;
        }

        // 3. 物種分組 (Species Grouping)
        const speciesGroups = {};
        
        validResults.forEach(item => {
            const speciesName = item.scientificName.split(' ').slice(0, 2).join(' ');
            if (!speciesGroups[speciesName]) {
                speciesGroups[speciesName] = [];
            }
            speciesGroups[speciesName].push(item);
        });

        const uniqueSpeciesNames = Object.keys(speciesGroups);
        console.log(`過濾後剩下 ${uniqueSpeciesNames.length} 種有效物種`); // 方便除錯

        // 4. 抽籤
        const randomSpecies = uniqueSpeciesNames[Math.floor(Math.random() * uniqueSpeciesNames.length)];
        const targetList = speciesGroups[randomSpecies];
        const specimen = targetList[Math.floor(Math.random() * targetList.length)];
        
        // --- HTTPS 修復 (Mixed Content Fix) ---
        // 如果圖片網址是 http 開頭，強制轉成 https，並嘗試避開某些不支援 https 的舊伺服器問題
        // (註：大部分博物館伺服器支援 https，若圖片破圖通常是因為對方證書過期，這無法從前端完全解決)
        let safeImageUrl = specimen.media[0].identifier;
        if (safeImageUrl.startsWith("http://")) {
            safeImageUrl = safeImageUrl.replace("http://", "https://");
        }

        // --------------------------------------------------

        const nameParts = specimen.scientificName.split(' ');
        const genusName = nameParts[0];
        const speciesName = nameParts[1];

        // 5. 拆解字根
        let parsedRoots = autoParseName(speciesName);
        let wikiHint = null;

        // 6. 維基百科連線
        if (parsedRoots.length === 0) {
             let dictEntry = { root: speciesName, meaning: "特有名稱" };
             
             // 呼叫維基
             wikiHint = await getWikiHelper(genusName + " " + speciesName);
             
             if (wikiHint) {
                 dictEntry.meaning = "請參考特徵提示";
             }

             parsedRoots.push({
                 text: speciesName.charAt(0).toUpperCase() + speciesName.slice(1),
                 raw: speciesName.toLowerCase(),
                 meaning: dictEntry.meaning
             });
        }

        const notes = generateSpeciesNotes(genusName, specimen, parsedRoots, wikiHint);
        const solutionTexts = parsedRoots.map(r => r.text);
        
        let pool = [...parsedRoots];
        for(let i=0; i<5; i++) {
            const randomRoot = LATIN_ROOTS[Math.floor(Math.random() * LATIN_ROOTS.length)];
            if (!pool.some(p => p.raw === randomRoot.root)) {
                let display = randomRoot.root.charAt(0).toUpperCase() + randomRoot.root.slice(1);
                pool.push({
                    text: display + "?",
                    meaning: randomRoot.meaning,
                    raw: randomRoot.root
                });
            }
        }

        const newLevel = {
            id: "gbif-" + Date.now(),
            targetName: speciesName,
            displayGenus: genusName,
            desc: notes.desc,
            hint: notes.hint,
            icon: "",
            imageUrl: safeImageUrl, // 使用修復後的網址
            solution: solutionTexts,
            pool: pool
        };

        levels[currentLevelIdx] = newLevel;
        initLevel();

    } catch (error) {
        console.error(error);
        alert("連線失敗，請檢查網路狀態。");
    }
}
// ==========================================
// 6. 事件綁定
// ==========================================

document.getElementById('next-btn').onclick = () => {
    alert("標本已歸檔！請再次點擊「開始搜捕」或選擇新的標籤。");
};

// 啟動
initLevel();


