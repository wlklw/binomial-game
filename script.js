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
// 3. 工具函式：拆解學名 (之前報錯就是缺這個!)
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

// 產生觀察筆記文字
function generateSpeciesNotes(genus, specimen, roots) {
    const location = specimen.country || "未知產地";
    let meanings = roots.map(r => `「${r.meaning}」`).join(" 加 ");
    if (meanings === "") meanings = "獨特的特徵";

    return {
        desc: `📍 採集地：${location}`,
        hint: `🕵️ 命名線索：種名描述了 ${meanings}`
    };
}

// ==========================================
// 4. API 連線邏輯 (屬名挑戰模式)
// ==========================================

function quickSearch(keyword) {
    document.getElementById('genus-input').value = keyword;
    startGenusChallenge();
}

async function startGenusChallenge() {
    const inputEl = document.getElementById('genus-input');
    const genusKeyword = inputEl.value.trim();
    const feedbackEl = document.getElementById('mission-desc');

    if (!genusKeyword) {
        alert("請輸入屬名！");
        return;
    }

    feedbackEl.innerHTML = `📡 正在搜尋 <span style="color:#e94560">${genusKeyword}</span> 屬的標本...`;
    
    try {
        // limit=100 抓多一點才能隨機出題
        const url = `${GBIF_API}?mediaType=StillImage&limit=100&q=${genusKeyword}`; 
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Network Error");
        const data = await response.json();
        
        // 過濾：1.要有圖 2.學名要是該屬開頭
        const validResults = data.results.filter(item => {
            if (!item.scientificName || !item.media || !item.media[0].identifier) return false;
            const parts = item.scientificName.split(' ');
            if (parts.length < 2) return false;
            // 比對屬名 (忽略大小寫)
            return parts[0].toLowerCase().includes(genusKeyword.toLowerCase());
        });

        if (validResults.length === 0) {
            alert(`找不到 ${genusKeyword} 屬的相關圖片，請確認拼字或換個屬名。`);
            feedbackEl.textContent = "搜尋結果為空。";
            return;
        }

        // 隨機選一隻
        const specimen = validResults[Math.floor(Math.random() * validResults.length)];
        
        const nameParts = specimen.scientificName.split(' ');
        const genusName = nameParts[0];   // 屬名 (e.g. Begonia)
        const speciesName = nameParts[1]; // 種名 (e.g. maculata)

        // 拆解「種名」
        let parsedRoots = autoParseName(speciesName);
        
        // 如果字典拆不出來，手動把種名加進去
        if (parsedRoots.length === 0) {
             let dictEntry = LATIN_ROOTS.find(r => r.root === speciesName.toLowerCase()) || { root: speciesName, meaning: "特有名稱" };
             parsedRoots.push({
                 text: speciesName.charAt(0).toUpperCase() + speciesName.slice(1),
                 raw: speciesName.toLowerCase(),
                 meaning: dictEntry.meaning
             });
        }

        const notes = generateSpeciesNotes(genusName, specimen, parsedRoots);
        const solutionTexts = parsedRoots.map(r => r.text);
        
        // 混淆卡池
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
            targetName: speciesName, // 答案是種名
            displayGenus: genusName, // UI顯示屬名
            desc: notes.desc,
            hint: notes.hint,
            icon: "",
            imageUrl: specimen.media[0].identifier,
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
// 5. 事件綁定
// ==========================================

document.getElementById('next-btn').onclick = () => {
    // 簡單重置，引導玩家再按一次搜索
    alert("標本已歸檔！請再次點擊「開始搜捕」或選擇新的標籤。");
    // 這裡不自動重置畫面，保留成就感，等待玩家下一步操作
};

// 啟動
initLevel();
