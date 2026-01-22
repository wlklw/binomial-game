// --- GBIF API 設定 ---
const GBIF_API = "https://api.gbif.org/v1/occurrence/search";

// --- 全自動拆解引擎 (核心邏輯) ---
function autoParseName(scientificName) {
    // 1. 預處理：轉小寫，去掉命名者 (只留屬名+種小名)
    // 例如 "Dynastes hercules (Linnaeus)" -> "dynastes hercules"
    let cleanName = scientificName.split(' ').slice(0, 2).join(' ').toLowerCase();
    
    let detectedRoots = [];
    
    // 2. 智慧匹配：按照字根長度排序 (優先匹配長字根，避免 "bi" 誤判 "biology")
    let sortedDictionary = LATIN_ROOTS.sort((a, b) => b.root.length - a.root.length);

    // 3. 掃描學名
    sortedDictionary.forEach(item => {
        if (cleanName.includes(item.root)) {
            // 避免重複添加 (例如找到 two 'ptera')
            if (!detectedRoots.some(r => r.text === item.root)) {
                // 為了美觀，將字首大寫 (e.g., "melano" -> "Melano")
                let displayRoot = item.root.charAt(0).toUpperCase() + item.root.slice(1);
                // 判斷是字首還是字尾 (加 "-" 號)
                if (cleanName.startsWith(item.root)) displayRoot += "-";
                else if (cleanName.endsWith(item.root)) displayRoot = "-" + displayRoot;
                else displayRoot = "-" + displayRoot + "-";

                detectedRoots.push({
                    text: displayRoot, // 顯示在卡片上的字
                    raw: item.root,    // 原始字根用於比對
                    meaning: item.meaning
                });
            }
        }
    });

    return detectedRoots;
}

// --- 透過 API 抓題並自動生成關卡 ---
async function startAutoGBIFMode(keyword) {
    document.getElementById('mission-desc').textContent = `正在獵捕含有「${keyword}」的物種...`;
    
    try {
        // 搜尋 GBIF
        const url = `${GBIF_API}?mediaType=StillImage&taxonKey=1&limit=20&q=${keyword}`; 
        const response = await fetch(url);
        const data = await response.json();
        
        // 過濾：要有圖、要是種級別 (species)、學名要包含關鍵字
        const validResults = data.results.filter(item => 
            item.scientificName && 
            item.media && 
            item.media[0].identifier &&
            item.scientificName.toLowerCase().includes(keyword)
        );

        if (validResults.length === 0) {
            alert("找不到標本，換個關鍵字試試！");
            return;
        }

        // 隨機選一隻
        const specimen = validResults[Math.floor(Math.random() * validResults.length)];
        
        // --- 啟動全自動拆解 ---
        const parsedRoots = autoParseName(specimen.scientificName);
        
        // 如果拆解出來的字根太少 (只有 1 個)，遊戲會太無聊，我們補一些干擾項
        if (parsedRoots.length < 1) {
            // 如果連關鍵字都沒拆出來 (字典缺字)，手動補上關鍵字
            parsedRoots.push({
                text: keyword,
                meaning: "未知字根 (請更新字典)",
                raw: keyword
            });
        }

        generateAutoLevel(specimen, parsedRoots);

    } catch (error) {
        console.error(error);
        alert("連線發生錯誤");
    }
}

function generateAutoLevel(specimen, correctRoots) {
    let cleanName = specimen.scientificName.split(' ').slice(0, 2).join(' ');

    // 準備正確答案
    const solutionTexts = correctRoots.map(r => r.text);

    // 準備卡池 (正確答案 + 隨機干擾項)
    let pool = [...correctRoots];
    
    // 隨機從字典抓 4 個無關的字根當干擾
    for(let i=0; i<4; i++) {
        const randomRoot = LATIN_ROOTS[Math.floor(Math.random() * LATIN_ROOTS.length)];
        // 避免重複
        if (!pool.some(p => p.raw === randomRoot.root)) {
             let display = randomRoot.root.charAt(0).toUpperCase() + randomRoot.root.slice(1);
             pool.push({
                 text: display + "?", // 加個問號增加不確定性
                 meaning: randomRoot.meaning
             });
        }
    }

    // 建立關卡物件
    const newLevel = {
        id: "auto-" + Date.now(),
        targetName: cleanName,
        desc: `【野外採集】發現一隻生物！`,
        hint: `採集地: ${specimen.country || '未知'} (嘗試拼湊出它的名字)`,
        icon: "",
        imageUrl: specimen.media[0].identifier,
        solution: solutionTexts,
        pool: pool
    };

    // 強制切換關卡
    // 這裡我們用一個簡單的方法更新全域變數
    // 在真實專案中建議把 levels 變成 let 宣告
    levels[currentLevelIdx] = newLevel;
    
    // 重新繪製
    initLevel();
    
    // 特別處理圖片顯示
    const iconEl = document.getElementById('target-icon');
    iconEl.textContent = "";
    iconEl.style.backgroundImage = `url('${newLevel.imageUrl}')`;
    iconEl.style.backgroundSize = "cover";
    iconEl.style.backgroundPosition = "center";
}

// 讓原本的 initLevel 也能處理圖片 (請修改你的 initLevel 函式)
// 在 initLevel 裡加上這一段：
/*
    const iconEl = document.getElementById('target-icon');
    if (level.imageUrl) {
        iconEl.textContent = "";
        iconEl.style.backgroundImage = `url('${level.imageUrl}')`;
        iconEl.style.backgroundSize = "cover";
         iconEl.style.backgroundPosition = "center";
    } else {
        iconEl.style.backgroundImage = "none";
        iconEl.textContent = level.icon;
    }
*/
