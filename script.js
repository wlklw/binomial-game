// ==========================================
// 1. 全域變數設定 (必須放在最上面！)
// ==========================================

// 預設關卡 (當不連網時可玩)
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
    },
    {
        id: "static-2",
        targetName: "Pachypodium",
        desc: "【進階】這屬植物有「粗厚」的「腳/莖基」",
        hint: "(塊根植物愛好者必知)",
        icon: "🌵",
        solution: ["Pachy-", "-podium"],
        pool: [
            { text: "Pachy-", meaning: "厚/粗" },
            { text: "Micro-", meaning: "微小" },
            { text: "-podium", meaning: "腳/基座" },
            { text: "-phylla", meaning: "葉子" }
        ]
    }
];

// 遊戲狀態變數
let currentLevelIdx = 0;
let currentSlots = [];
const GBIF_API = "https://api.gbif.org/v1/occurrence/search";


// ==========================================
// 2. 核心遊戲邏輯
// ==========================================

function initLevel() {
    // 安全檢查：確保 levels 變數存在且有內容
    if (!levels || levels.length === 0) {
        console.error("錯誤：找不到關卡資料 (levels is undefined)");
        return;
    }

    const level = levels[currentLevelIdx];
    
    // 1. UI 文字更新
    document.getElementById('mission-desc').textContent = level.desc;
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
        // 使用 Closure 綁定 index
        slotDiv.onclick = function() { removeSlot(i); };
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
    if (emptyIdx === -1) return; // 沒空位

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
    if (currentSlots.includes(null)) return; // 還有空格

    const level = levels[currentLevelIdx];
    // 比對邏輯：忽略大小寫與連字號
    const playerAnswer = currentSlots.map(c => c.text.replace(/-/g, '')).join("").toLowerCase();
    const targetSimple = level.targetName.replace(/-/g, '').toLowerCase();
    
    const feedbackEl = document.getElementById('feedback-msg');

    if (targetSimple.includes(playerAnswer)) {
        feedbackEl.textContent = `成功破解！學名：${level.targetName}`;
        feedbackEl.classList.add('success');
        document.getElementById('next-btn').style.display = "inline-block";
    } else {
        feedbackEl.textContent = "基因序列錯誤！這不是這個物種的名字！";
        feedbackEl.classList.add('fail');
    }
}

// ==========================================
// 3. GBIF 自動連線邏輯
// ==========================================

// 自動拆解學名
function autoParseName(scientificName) {
    let cleanName = scientificName.split(' ').slice(0, 2).join(' ').toLowerCase();
    let detectedRoots = [];
    
    if (typeof LATIN_ROOTS === 'undefined') {
        console.error("找不到字典檔 dictionary.js，請檢查 index.html 是否引入");
        return [];
    }

    let sortedDictionary = LATIN_ROOTS.sort((a, b) => b.root.length - a.root.length);

    sortedDictionary.forEach(item => {
        if (cleanName.includes(item.root)) {
            if (!detectedRoots.some(r => r.raw === item.root)) {
                let displayRoot = item.root.charAt(0).toUpperCase() + item.root.slice(1);
                
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

// 啟動 API 模式
async function startAutoGBIFMode(keyword) {
    const feedbackEl = document.getElementById('mission-desc');
    feedbackEl.textContent = `正在野外搜尋「${keyword}」...`;
    
    try {
        // [修正] 移除了 taxonKey=1 以支援植物搜尋
        const url = `${GBIF_API}?mediaType=StillImage&limit=50&q=${keyword}`; 
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Network Error");
        
        const data = await response.json();
        
        // 過濾資料
        const validResults = data.results.filter(item => 
            item.scientificName && 
            item.media && 
            item.media[0].identifier &&
            item.scientificName.toLowerCase().includes(keyword.toLowerCase())
        );

        if (validResults.length === 0) {
            alert(`找不到「${keyword}」的相關標本。`);
            feedbackEl.textContent = "搜尋結果為空。";
            return;
        }

        // 隨機取樣
        const specimen = validResults[Math.floor(Math.random() * validResults.length)];
        
        // 拆解字根
        let parsedRoots = autoParseName(specimen.scientificName);
        
        // 補救措施：如果拆不出來，手動加入關鍵字
        if (parsedRoots.length === 0) {
             let dictEntry = LATIN_ROOTS.find(r => r.root === keyword) || { root: keyword, meaning: "關鍵字" };
             parsedRoots.push({
                 text: keyword.charAt(0).toUpperCase() + keyword.slice(1),
                 raw: keyword,
                 meaning: dictEntry.meaning
             });
        }

        // 生成新關卡物件
        const cleanName = specimen.scientificName.split(' ').slice(0, 2).join(' ');
        const solutionTexts = parsedRoots.map(r => r.text);
        
        let pool = [...parsedRoots];
        for(let i=0; i<4; i++) {
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
            targetName: cleanName,
            desc: `【野外採集】發現一隻生物！`,
            hint: `採集地: ${specimen.country || '未知'} (嘗試拼湊出它的名字)`,
            icon: "",
            imageUrl: specimen.media[0].identifier,
            solution: solutionTexts,
            pool: pool
        };

        // 更新全域變數 levels
        levels[currentLevelIdx] = newLevel;
        
        // 重新渲染
        initLevel();

    } catch (error) {
        console.error("API Error:", error);
        feedbackEl.textContent = "連線失敗 (請檢查 Console)";
        alert("連線失敗！請確認你是在 GitHub Pages 環境下執行，而非直接打開檔案。");
    }
}


// ==========================================
// 4. 事件綁定與啟動
// ==========================================

document.getElementById('next-btn').onclick = () => {
    // 簡單的循環邏輯：如果是在玩 API 抓到的，就跳回第0關，或者你可以設計成再抓一次
    currentLevelIdx++;
    if (currentLevelIdx >= levels.length) {
        alert("本輪實驗結束！請點擊下方的按鈕進行野外探索！");
        currentLevelIdx = 0;
    }
    initLevel();
};

// 程式進入點
initLevel();
