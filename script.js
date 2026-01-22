// ==========================================
// 1. 全域變數設定
// ==========================================

// 預設關卡 (當不連網時可玩)
let levels = [
    {
        id: "static-1",
        targetName: "Melanogaster",
        desc: "【遺傳學】觀察重點：這隻蒼蠅有著明顯特徵",
        hint: "🕵️ 線索：學名意指「黑色的」+「腹部」",
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
// 2. 核心遊戲邏輯
// ==========================================

function initLevel() {
    if (!levels || levels.length === 0) return;

    const level = levels[currentLevelIdx];
    
    // 1. UI 文字更新
    if (level.displayGenus) {
        document.getElementById('mission-desc').innerHTML = 
            `<span style="color:#e94560; font-size:1.2em;">${level.displayGenus}</span> <i>_______</i> ?<br>` + 
            `<span style="font-size:0.8em; color:#ccc;">${level.desc}</span>`;
    } else {
        document.getElementById('mission-desc').textContent = level.desc;
    document.getElementById('mission-hint').textContent = level.hint;
    document.getElementById('mission-hint').style.color = "#ffeb3b"; // 讓提示顯眼一點
    
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
    const playerAnswer = currentSlots.map(c => c.text.replace(/-/g, '')).join("").toLowerCase();
    const targetSimple = level.targetName.replace(/-/g, '').toLowerCase();
    
    const feedbackEl = document.getElementById('feedback-msg');

    if (targetSimple.includes(playerAnswer)) {
        feedbackEl.textContent = `✅ 鑑定成功！學名：${level.targetName}`;
        feedbackEl.classList.add('success');
        document.getElementById('next-btn').style.display = "inline-block";
    } else {
        feedbackEl.textContent = "❌ 鑑定錯誤：特徵與學名不符";
        feedbackEl.classList.add('fail');
    }
}

// ==========================================
// 3. GBIF 自動連線 (種名挑戰模式)
// ==========================================

// 快速搜索輔助函式
function quickSearch(keyword) {
    document.getElementById('genus-input').value = keyword;
    startGenusChallenge();
}

// 核心功能：開始屬名挑戰
async function startGenusChallenge() {
    const inputEl = document.getElementById('genus-input');
    const genusKeyword = inputEl.value.trim();
    
    if (!genusKeyword) {
        alert("請先輸入想要挑戰的屬名！");
        return;
    }

    const feedbackEl = document.getElementById('mission-desc');
    feedbackEl.textContent = `正在定位 ${genusKeyword} 屬的生物信號...`;
    
    try {
        // 搜尋該屬底下的物種
        // limit=100 抓多一點才能過濾掉太簡單的
        const url = `${GBIF_API}?mediaType=StillImage&limit=100&q=${genusKeyword}`; 
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        
        // 過濾資料：
        // 1. 要有學名和圖片
        // 2. 學名必須是「二名法」 (Genus species) 結構
        // 3. 學名的第一個字必須包含我們搜尋的屬名 (確保沒搜歪)
        const validResults = data.results.filter(item => {
            if (!item.scientificName || !item.media || !item.media[0].identifier) return false;
            
            const parts = item.scientificName.split(' ');
            // 確保至少有 屬名+種名 (長度>=2)
            if (parts.length < 2) return false;
            
            // 確保搜出來的是目標屬 (忽略大小寫)
            return parts[0].toLowerCase().includes(genusKeyword.toLowerCase());
        });

        if (validResults.length === 0) {
            alert(`找不到 ${genusKeyword} 屬的相關圖片標本，請換一個屬名試試！`);
            feedbackEl.textContent = "搜尋結果為空。";
            return;
        }

        // 隨機取一隻
        const specimen = validResults[Math.floor(Math.random() * validResults.length)];
        
        // --- 關鍵修改：分離 屬名 (Genus) 與 種名 (Species) ---
        const nameParts = specimen.scientificName.split(' ');
        const genusName = nameParts[0];      // e.g., Begonia
        const speciesName = nameParts[1];    // e.g., maculata (這才是我們要猜的!)

        // 拆解「種名」的字根
        let parsedRoots = autoParseName(speciesName);
        
        // 如果字典裡沒有這個種名的字根，手動把種名當作一個卡牌
        if (parsedRoots.length === 0) {
             let dictEntry = LATIN_ROOTS.find(r => r.root === speciesName.toLowerCase()) || { root: speciesName, meaning: "獨特特徵" };
             parsedRoots.push({
                 text: speciesName, // 不轉大寫，保持原味或是首字大寫看你喜好
                 raw: speciesName.toLowerCase(),
                 meaning: dictEntry.meaning
             });
        }

        // 生成描述 (傳入 屬名 和 字根)
        const notes = generateSpeciesNotes(genusName, specimen, parsedRoots);

        // 準備正確答案 (只含種名)
        const solutionTexts = parsedRoots.map(r => r.text);
        
        // 準備混淆卡池
        let pool = [...parsedRoots];
        for(let i=0; i<5; i++) { // 多給一點干擾項
            const randomRoot = LATIN_ROOTS[Math.floor(Math.random() * LATIN_ROOTS.length)];
            // 避免重複
            if (!pool.some(p => p.raw === randomRoot.root)) {
                let display = randomRoot.root.charAt(0).toUpperCase() + randomRoot.root.slice(1);
                // 視覺上加個後綴讓它看起來像種名
                if(!display.startsWith("-")) display = display; 
                
                pool.push({
                    text: display + "?",
                    meaning: randomRoot.meaning,
                    raw: randomRoot.root
                });
            }
        }

        const newLevel = {
            id: "gbif-" + Date.now(),
            targetName: speciesName, // 答案改成只有種名！
            displayGenus: genusName, // 額外欄位：顯示屬名給玩家看
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
        alert("連線失敗，請檢查網路。");
    }
}

// 產生針對「種名」的提示
function generateSpeciesNotes(genus, specimen, roots) {
    const location = specimen.country || "未知產地";
    
    // 把意思串起來
    let meanings = roots.map(r => `「${r.meaning}」`).join(" 或 ");
    if (meanings === "") meanings = "某種特殊命名";

    return {
        desc: `📍 ${location} 發現的 ${genus} (屬)`,
        hint: `🕵️ 種名解碼：這隻 ${genus} 的種名描述了 ${meanings}`
    };
}

// 修改 initLevel 的 checkAnswer 邏輯 (配合 script.js 前半段)
// 注意：你原本的 initLevel 裡面的 checkAnswer 可能比對的是 targetName
// 因為現在 targetName 只有種名，所以邏輯不用大改，但 UI 顯示要注意
// 產生「野外觀察筆記」文字
function generateFieldNotes(specimen, roots) {
    // 1. 地理位置
    const location = specimen.country || "未知地區";
    
    // 2. 分類學線索 (利用 GBIF 的 family/order 欄位)
    let taxonomy = "";
    if (specimen.family) taxonomy += `${specimen.family}科`;
    else if (specimen.order) taxonomy += `${specimen.order}目`;
    else taxonomy += "某種生物";

    // 3. 字根線索 (這是最重要的部分)
    // 把拆解出來的意思串起來，變成提示
    let meanings = roots.map(r => `「${r.meaning}」`).join(" 加 ");
    if (meanings === "") meanings = "某種特殊特徵";

    return {
        desc: `📍 採集紀錄：這是在 ${location} 發現的 ${taxonomy}。`,
        hint: `🕵️ 命名線索：請尋找代表 ${meanings} 的字根。`
    };
}

async function startAutoGBIFMode(keyword) {
    const feedbackEl = document.getElementById('mission-desc');
    feedbackEl.textContent = `正在資料庫中檢索「${keyword}」...`;
    
    try {
        const url = `${GBIF_API}?mediaType=StillImage&limit=50&q=${keyword}`; 
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        
        const validResults = data.results.filter(item => 
            item.scientificName && item.media && item.media[0].identifier &&
            item.scientificName.toLowerCase().includes(keyword.toLowerCase())
        );

        if (validResults.length === 0) {
            alert(`找不到相關標本。`);
            return;
        }

        const specimen = validResults[Math.floor(Math.random() * validResults.length)];
        
        // 拆解字根
        let parsedRoots = autoParseName(specimen.scientificName);
        
        if (parsedRoots.length === 0) {
             let dictEntry = LATIN_ROOTS.find(r => r.root === keyword) || { root: keyword, meaning: "關鍵字" };
             parsedRoots.push({
                 text: keyword.charAt(0).toUpperCase() + keyword.slice(1),
                 raw: keyword,
                 meaning: dictEntry.meaning
             });
        }

        // --- 這裡呼叫新函式來產生描述 ---
        const notes = generateFieldNotes(specimen, parsedRoots);

        const cleanName = specimen.scientificName.split(' ').slice(0, 2).join(' ');
        const solutionTexts = parsedRoots.map(r => r.text);
        
        // 填充卡池
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
            desc: notes.desc,  // 使用生成的描述
            hint: notes.hint,  // 使用生成的線索
            icon: "",
            imageUrl: specimen.media[0].identifier,
            solution: solutionTexts,
            pool: pool
        };

        levels[currentLevelIdx] = newLevel;
        initLevel();

    } catch (error) {
        console.error(error);
        alert("連線失敗。");
    }
}

document.getElementById('next-btn').onclick = () => {
    // 讓按鈕可以直接搜尋下一隻 (稍微改善體驗)
    // 這裡我們簡單重置介面，實際上你可以讓它記錄上次搜尋的 keyword
    alert("請點擊下方按鈕選擇下一個探索目標！");
    currentLevelIdx = 0;
    initLevel();
};

initLevel();


