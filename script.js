// --- 遊戲題庫 (難度升級版) ---
const levels = [
    // Lv 1: 入門 (2字根)
    {
        id: 1,
        targetName: "Melanogaster",
        desc: "【遺傳學】這隻蒼蠅有著「黑色的肚皮」",
        hint: "(實驗室最常見的果蠅)",
        icon: "🪰",
        solution: ["Melano-", "-gaster"],
        pool: [
            { text: "Melano-", meaning: "黑色" },
            { text: "Leuco-", meaning: "白色" },
            { text: "-gaster", meaning: "腹部" },
            { text: "-cephala", meaning: "頭部" }
        ]
    },
    // Lv 2: 昆蟲 (2字根 - 易混淆)
    {
        id: 2,
        targetName: "Isopoda",
        desc: "【分類學】這類生物的每一對「腳」都長得「一樣」",
        hint: "(鼠婦、海蟑螂都屬於此目)",
        icon: "🦐",
        solution: ["Iso-", "-poda"],
        pool: [
            { text: "Iso-", meaning: "相等/一致" },
            { text: "Hetero-", meaning: "不同/相異" },
            { text: "-poda", meaning: "腳/足" }, // 正解
            { text: "-ptera", meaning: "翅膀" }, // 陷阱：長得很像
            { text: "Pseudo-", meaning: "偽/假的" }
        ]
    },
    // Lv 3: 兩棲類 (2字根 - 意象題)
    {
        id: 3,
        targetName: "Dendrobates",
        desc: "【生態學】這種蛙喜歡在「樹木」上「遊走/攀爬」",
        hint: "(著名的有毒箭毒蛙屬)",
        icon: "🐸",
        solution: ["Dendro-", "-bates"],
        pool: [
            { text: "Dendro-", meaning: "樹木" },
            { text: "Hydro-", meaning: "水" },
            { text: "-bates", meaning: "攀爬者/行者" },
            { text: "-philus", meaning: "愛好者" },
            { text: "Litho-", meaning: "石頭" }
        ]
    },
    // Lv 4: 植物 (3字根 - 進階題)
    // 辣椒榕屬 Bucephalandra = Bous(牛) + Kephale(頭) + Andra(雄蕊)
    {
        id: 4,
        targetName: "Bucephalandra",
        desc: "【植物學】這屬水草的雄蕊形狀像「牛」「頭」",
        hint: "(水族造景常見的辣椒榕)",
        icon: "🌿",
        solution: ["Bu-", "-cephala-", "-ndra"], 
        pool: [
            { text: "Bu-", meaning: "牛/巨型" },
            { text: "-cephala-", meaning: "頭部" },
            { text: "-ndra", meaning: "雄性/雄蕊" },
            { text: "Micro-", meaning: "微小" },
            { text: "-phylla", meaning: "葉子" },
            { text: "Rhino-", meaning: "鼻子" }
        ]
    },
    // Lv 5: 古生物 (3字根 - 經典題)
    // 三葉蟲 Trilobita = Tri(三) + Lob(葉/瓣) + Ita(名詞後綴)
    {
        id: 5,
        targetName: "Trilobita",
        desc: "【古生物】這種化石身體直向分為「三個」「葉/瓣」",
        hint: "(古生代的指標化石)",
        icon: "🐚",
        solution: ["Tri-", "-lob-", "-ita"],
        pool: [
            { text: "Tri-", meaning: "數字 3" },
            { text: "Di-", meaning: "數字 2" },
            { text: "-lob-", meaning: "葉/瓣" },
            { text: "-ita", meaning: "名詞結尾" },
            { text: "Uni-", meaning: "單一" },
            { text: "-saurus", meaning: "蜥蜴" }
        ]
    }
];

// --- 遊戲邏輯 (已升級為動態插槽) ---
let currentLevelIdx = 0;
let currentSlots = []; // 改為動態陣列

function initLevel() {
    const level = levels[currentLevelIdx];
    
    // UI 更新
    document.getElementById('target-icon').textContent = level.icon;
    document.getElementById('mission-desc').textContent = level.desc;
    document.getElementById('mission-hint').textContent = level.hint;
    
    const feedbackEl = document.getElementById('feedback-msg');
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    document.getElementById('next-btn').style.display = "none";
    
    // --- 關鍵升級：動態產生插槽 ---
    const chamber = document.querySelector('.synthesis-chamber');
    chamber.innerHTML = ""; // 清空舊格子
    currentSlots = new Array(level.solution.length).fill(null); // 根據答案長度建立空陣列

    // 根據答案長度迴圈產生 HTML 格子
    for (let i = 0; i < level.solution.length; i++) {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot';
        slotDiv.id = `slot-${i}`;
        slotDiv.onclick = () => removeSlot(i); // 綁定移除事件
        chamber.appendChild(slotDiv);
    }

    // 產生下方字根卡牌
    const poolDiv = document.getElementById('pool');
    poolDiv.innerHTML = "";
    
    let shuffledPool = [...level.pool].sort(() => Math.random() - 0.5);

    shuffledPool.forEach((cardData) => {
        const btn = document.createElement('div');
        btn.className = 'card';
        btn.innerHTML = `${cardData.text}<span>${cardData.meaning}</span>`;
        btn.onclick = () => addToSlot(cardData);
        poolDiv.appendChild(btn);
    });
}

function addToSlot(cardData) {
    const emptyIdx = currentSlots.indexOf(null);
    if (emptyIdx === -1) return; // 沒空位了

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
    const playerAnswer = currentSlots.map(c => c.text).join("");
    const correctAnswer = level.solution.join("");
    
    const feedbackEl = document.getElementById('feedback-msg');

    if (playerAnswer === correctAnswer) {
        feedbackEl.textContent = `合成成功！學名：${level.targetName}`;
        feedbackEl.classList.add('success');
        document.getElementById('next-btn').style.display = "inline-block";
    } else {
        // 簡單的錯誤回饋
        let funnyMsg = "合成失敗！基因序列錯誤！";
        
        // 針對特定陷阱給提示
        const playerText = currentSlots.map(c => c.text).join("");
        if (playerText.includes("-ptera") && level.targetName === "Isopoda") {
            funnyMsg = "那是翅膀(-ptera)！題目要的是腳！";
        }
        if (playerText.includes("Hydro-") && level.targetName === "Dendrobates") {
            funnyMsg = "那是住在水裡的！箭毒蛙常在樹上！";
        }

        feedbackEl.textContent = funnyMsg;
        feedbackEl.classList.add('fail');
    }
}

document.getElementById('next-btn').onclick = () => {
    currentLevelIdx++;
    if (currentLevelIdx >= levels.length) {
        alert("太強了！你已經破解了所有生物密碼！坐等更新吧！");
        currentLevelIdx = 0;
    }
    initLevel();
};

// 啟動遊戲
initLevel();
