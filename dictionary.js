// dictionary.js - 你的本地端拉丁文翻譯機

const LATIN_ROOTS = [
    // --- 數字與形狀 ---
    { root: "uni", meaning: "單一的" },
    { root: "bi", meaning: "雙/兩個" },
    { root: "tri", meaning: "三個" },
    { root: "quadri", meaning: "四個" },
    { root: "penta", meaning: "五個" },
    { root: "longi", meaning: "長的" },
    { root: "brevi", meaning: "短的" },
    { root: "macro", meaning: "巨大的" },
    { root: "micro", meaning: "微小的" },
    { root: "mega", meaning: "巨大的" },
    
    // --- 顏色 ---
    { root: "melano", meaning: "黑色的" },
    { root: "leuco", meaning: "白色的" },
    { root: "erythro", meaning: "紅色的" },
    { root: "cyano", meaning: "藍色的" },
    { root: "chloro", meaning: "綠色的" },
    { root: "auranti", meaning: "橘黃色的" },
    { root: "alba", meaning: "白色的" },
    { root: "nigra", meaning: "黑色的" },
    { root: "rubra", meaning: "紅色的" },

    // --- 昆蟲/甲蟲專用 (Coleoptera) ---
    { root: "ptera", meaning: "翅膀" },
    { root: "poda", meaning: "腳/足" },
    { root: "ceros", meaning: "角" },
    { root: "rhino", meaning: "鼻子/角" },
    { root: "dorcus", meaning: "羚羊/大顎" }, // 鍬形蟲常用
    { root: "lucanus", meaning: "光/森林" }, // 深山鍬形蟲屬
    { root: "dynastes", meaning: "統治者/領主" }, // 兜蟲屬
    { root: "hercules", meaning: "大力士" },
    { root: "atlas", meaning: "泰坦巨人" },
    { root: "goliathus", meaning: "巨人" },
    
    // --- 兩棲/爬蟲/古生物 ---
    { root: "saurus", meaning: "蜥蜴/龍" },
    { root: "raptor", meaning: "掠食者" },
    { root: "dendro", meaning: "樹木" },
    { root: "bates", meaning: "攀爬者" },
    { root: "rana", meaning: "蛙" },
    { root: "ophi", meaning: "蛇" },
    
    // --- 植物 (塊根/辣椒榕) ---
    { root: "pachy", meaning: "厚/粗" },
    { root: "podium", meaning: "基座/腳" },
    { root: "phylla", meaning: "葉子" },
    { root: "flora", meaning: "花" },
    { root: "anthos", meaning: "花" },
    { root: "dendron", meaning: "樹" },
    { root: "bu", meaning: "牛/巨型" }, // Bucephalandra
    { root: "cephala", meaning: "頭" },
    { root: "andra", meaning: "雄蕊/雄性" },

    // --- 身體部位 ---
    { root: "gaster", meaning: "腹部" },
    { root: "notus", meaning: "背部" },
    { root: "stoma", meaning: "口/嘴" },
    { root: "ops", meaning: "眼睛/臉" },
    { root: "donta", meaning: "牙齒" },

    // --- 地理位置 (針對你的台灣化石興趣) ---
    { root: "taiwan", meaning: "台灣" },
    { root: "formosa", meaning: "美麗之島" },
    { root: "sinensis", meaning: "中國/東方" },
    { root: "japonica", meaning: "日本" }
];
