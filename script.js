// --- 遊戲題庫 (想加題目就改這裡) ---
const levels = [
    {
        id: 1,
        targetName: "Melanogaster",
        desc: "客戶想要一隻「黑肚皮」的蒼蠅",
        hint: "(通常指果蠅)",
        icon: "🪰",
        solution: ["Melano-", "-gaster"],
        pool: [
            { text: "Melano-", meaning: "黑色的" },
            { text: "Leuco-", meaning: "白色的" },
            { text: "-gaster", meaning: "腹部" },
            { text: "-ptera", meaning: "翅膀" }
        ]
    },
    {
        id: 2,
        targetName: "Pachypodium",
        desc: "需要一株「腳很粗厚」的植物",
        hint: "(常見的塊根植物)",
        icon: "🌵",
        solution: ["Pachy-", "-podium"],
        pool: [
            { text: "Pachy-", meaning: "厚/粗" },
            { text: "Micro-", meaning: "微小" },
            { text: "-podium", meaning: "腳/基座" },
            { text: "-phylla", meaning: "葉子" },
            { text: "Rhino-", meaning: "鼻子" }
        ]
    },
    {
        id: 3,
        targetName: "Coleoptera",
        desc: "這隻昆蟲的「翅膀像鞘一樣」硬",
        hint: "(也就是甲蟲)",
        icon: "🐞",
        solution: ["Koleos-", "-ptera"],
        pool: [
            { text: "Koleos-", meaning: "鞘/盒" },
            { text: "Lepi-", meaning: "鱗片" },
            { text: "-ptera", meaning: "翅膀" },
            { text: "Bi-", meaning: "兩雙" },
            { text: "Di-", meaning: "兩次" }
        ]
    }
];

// --- 遊戲邏輯 ---
let currentLevelIdx = 0;
let currentSlots = [null, null];

function initLevel() {
    const level = levels[currentLevelIdx];
    document.getElementById('target-icon').textContent = level.icon;
    document.getElementById('mission-desc').textContent = level.desc;
    document.getElementById('mission-hint').textContent = level.hint;
    document.getElementById('feedback-msg').textContent = "";
    document.getElementById('next-btn').style.display = "none";
    document.getElementById('feedback-msg').className = "feedback";
    
    currentSlots = [null, null];
    renderSlots();

    const poolDiv = document.getElementById('pool');
    poolDiv.innerHTML = "";
    
    let shuffledPool = [...level.pool].sort(() => Math.random() - 0.5);

    shuffledPool.forEach((cardData) => {
        const btn = document.createElement('div');
        btn.className = 'card';
        btn.innerHTML = `${cardData.text}<span>${cardData.meaning}</span>`;
        // 解決閉包問題，使用箭頭函數傳遞參數
        btn.onclick = () => addToSlot(cardData);
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
        // 重新綁定 onclick 確保移除功能正常
        slotEl.onclick = () => removeSlot(index);
        
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
    const playerAnswer = currentSlots.map(c => c.text).join("");
    const correctAnswer = level.solution.join("");
    
    const feedbackEl = document.getElementById('feedback-msg');

    if (playerAnswer === correctAnswer) {
        feedbackEl.textContent = `合成成功！學名：${level.targetName}`;
        feedbackEl.classList.add('success');
        document.getElementById('next-btn').style.display = "inline-block";
    } else {
        let funnyMsg = "合成失敗！這甚至不是生物！";
        // 簡單的錯誤檢查邏輯
        if (currentSlots[0].text === "Leuco-") funnyMsg = "那是白色的！題目是黑色的！";
        
        feedbackEl.textContent = funnyMsg;
        feedbackEl.classList.add('fail');
    }
}

// 綁定按鈕事件 (取代原本 HTML 中的 onclick，符合分離原則)
document.getElementById('next-btn').onclick = () => {
    currentLevelIdx++;
    if (currentLevelIdx >= levels.length) {
        alert("恭喜！你已經完成了所有實習課程！");
        currentLevelIdx = 0;
    }
    initLevel();
};

// 啟動遊戲
initLevel();