// --- 字根字典 (這是我們的翻譯機) ---
// 我們只能考我們「認得」的字根，這樣遊戲才有教育意義
const KNOWN_ROOTS = {
    "ptera": { meaning: "翅膀", type: "suffix" },
    "poda": { meaning: "腳/足", type: "suffix" },
    "ceros": { meaning: "角", type: "suffix" },
    "gaster": { meaning: "腹部", type: "suffix" },
    "cephala": { meaning: "頭", type: "suffix" },
    "mega": { meaning: "巨大的", type: "prefix" },
    "micro": { meaning: "微小的", type: "prefix" },
    "melano": { meaning: "黑色的", type: "prefix" },
    "leuco": { meaning: "白色的", type: "prefix" }
};

// --- GBIF API 設定 ---
const GBIF_API = "https://api.gbif.org/v1/occurrence/search";

// 這一區是用來從網路抓題目的
async function fetchFromGBIF(rootKeyword) {
    // 顯示載入中...
    document.getElementById('mission-desc').textContent = "正在連線至全球生物多樣性資料庫...";
    
    try {
        // 建構查詢：搜尋有圖片的、屬於昆蟲綱的、學名包含我們指定字根的物種
        // q=${rootKeyword} 表示搜尋學名裡包含這個字的
        const url = `${GBIF_API}?mediaType=StillImage&taxonKey=1&limit=10&q=${rootKeyword}`; 
        
        const response = await fetch(url);
        const data = await response.json();
        
        // 過濾出有學名且有圖片的資料
        const validResults = data.results.filter(item => 
            item.scientificName && item.media && item.media[0].identifier
        );

        if (validResults.length === 0) {
            alert("找不到適合的標本，請重試！");
            return null;
        }

        // 隨機選一隻
        const specimen = validResults[Math.floor(Math.random() * validResults.length)];
        
        return convertSpecimenToLevel(specimen, rootKeyword);

    } catch (error) {
        console.error("GBIF Error:", error);
        document.getElementById('mission-desc').textContent = "連線失敗，請檢查網路。";
    }
}

// 將 GBIF 的資料轉換成我們的遊戲關卡格式
function convertSpecimenToLevel(specimen, targetRoot) {
    // 簡化學名 (去掉命名者和年份，只留屬名+種小名)
    // 例如 "Dynastes hercules (Linnaeus, 1758)" -> "Dynastes hercules"
    let cleanName = specimen.scientificName.split(' ').slice(0, 2).join(' ');
    
    // 建立新關卡物件
    const newLevel = {
        id: "gbif-" + Math.floor(Math.random() * 10000),
        targetName: cleanName,
        desc: `【GBIF 標本】這隻生物的學名包含「${KNOWN_ROOTS[targetRoot].meaning}」`,
        hint: `(發現地: ${specimen.country || '未知'})`,
        icon: "", // 這裡我們會用真正的圖片取代 icon
        imageUrl: specimen.media[0].identifier, // 存入圖片網址
        solution: [], // 這裡需要更複雜的邏輯來自動拆解，目前先做簡單版
        pool: []
    };

    // --- 自動生成選項邏輯 (簡單版) ---
    // 1. 把正確答案放進去 (只針對我們搜尋的那個字根)
    newLevel.solution.push(targetRoot); // 注意：這裡只會放一個字根當作測試
    
    // 2. 填充卡池
    newLevel.pool.push({ 
        text: targetRoot, 
        meaning: KNOWN_ROOTS[targetRoot].meaning 
    });
    
    // 3. 加幾個隨機錯誤選項
    const distractors = ["pseudo", "mega", "micro", "phylla"];
    distractors.forEach(d => {
        newLevel.pool.push({ text: d, meaning: "隨機字根" }); // 這裡可以優化
    });

    return newLevel;
}

// --- 修改原本的 initLevel 讓它可以支援圖片 URL ---
// 你需要去修改原本的 initLevel 函式，增加這一段判斷：
/*
    if (level.imageUrl) {
        document.getElementById('target-icon').textContent = ""; // 清空 emoji
        document.getElementById('target-icon').style.backgroundImage = `url(${level.imageUrl})`;
        document.getElementById('target-icon').style.backgroundSize = "cover";
    } else {
        document.getElementById('target-icon').style.backgroundImage = "none";
        document.getElementById('target-icon').textContent = level.icon;
    }
*/
