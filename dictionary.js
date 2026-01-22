// dictionary.js - 學名翻譯字典庫 (擴充版：膜翅目 + 秋海棠)

const LATIN_ROOTS = [
    // ==========================================
    //  新增區域：膜翅目 (Hymenoptera: 蜂、蟻)
    // ==========================================
    { root: "hymen", meaning: "膜" },
    { root: "ptera", meaning: "翅膀" },
    { root: "apis", meaning: "蜜蜂" },
    { root: "bombus", meaning: "發出嗡嗡聲 (熊蜂)" },
    { root: "vespa", meaning: "胡蜂/黃蜂" },
    { root: "sphex", meaning: "泥蜂" },
    { root: "formica", meaning: "螞蟻" },
    { root: "myrmex", meaning: "螞蟻 (希臘語)" },
    { root: "camponotus", meaning: "彎背/原野 (巨山蟻)" },
    { root: "solenopsis", meaning: "管狀臉 (火蟻)" },
    { root: "oecophylla", meaning: "住葉子的 (織葉蟻)" },
    { root: "polyrhachis", meaning: "多刺的 (多刺蟻)" },
    { root: "xylocopa", meaning: "切木者 (木蜂)" },
    { root: "megachile", meaning: "大顎/大唇 (切葉蜂)" },
    { root: "trigona", meaning: "三角形 (無螫蜂)" },

    // ==========================================
    //  新增區域：秋海棠科 (Begoniaceae)
    // ==========================================
    { root: "begonia", meaning: "秋海棠 (紀念 Bégon)" },
    { root: "maculata", meaning: "有斑點的 (圓點秋海棠)" },
    { root: "rex", meaning: "國王/帝王 (蝦蟆秋海棠)" },
    { root: "masoniana", meaning: "鐵十字" },
    { root: "obliqua", meaning: "歪斜的 (葉形特徵)" },
    { root: "grandis", meaning: "巨大的" },
    { root: "coccinea", meaning: "深紅色的" },
    { root: "peltata", meaning: "盾狀的 (葉柄在中央)" },
    { root: "bipinnatifida", meaning: "二回羽狀複葉 (鐵甲)" },
    { root: "darthvaderiana", meaning: "黑武士 (達斯維達)" }, // 這是真實存在的秋海棠學名！
    { root: "amphioxus", meaning: "兩頭尖 (兩棲)" },

    // ==========================================
    //  既有區域：甲蟲 (Coleoptera)
    // ==========================================
    { root: "coleo", meaning: "鞘/盒" },
    { root: "dorcus", meaning: "刀/大顎 (鍬形蟲)" },
    { root: "lucanus", meaning: "森林/光 (深山鍬)" },
    { root: "prosopocoilus", meaning: "鋸鍬形蟲" },
    { root: "dynastes", meaning: "統治者 (兜蟲)" },
    { root: "hercules", meaning: "大力士" },
    { root: "megasoma", meaning: "巨大的身體 (毛象)" },
    { root: "rhinoceros", meaning: "犀牛" },
    { root: "elytra", meaning: "鞘翅" },
    { root: "allotopus", meaning: "奇特的腳 (黃金鬼鍬)" },

    // ==========================================
    //  既有區域：塊根與多肉 (Caudex)
    // ==========================================
    { root: "bucephalandra", meaning: "牛頭雄蕊 (辣椒榕)" },
    { root: "pachypodium", meaning: "粗腳 (象牙宮)" },
    { root: "adenium", meaning: "沙漠玫瑰" },
    { root: "euphorbia", meaning: "大戟" },
    { root: "agave", meaning: "龍舌蘭" },
    { root: "rhizon", meaning: "根" },
    { root: "caudex", meaning: "樹幹/塊莖" },

    // ==========================================
    //  既有區域：兩棲、爬蟲、等足
    // ==========================================
    { root: "dendrobates", meaning: "樹上攀爬者 (箭毒蛙)" },
    { root: "phyllobates", meaning: "葉上攀爬者" },
    { root: "rana", meaning: "青蛙" },
    { root: "saurus", meaning: "蜥蜴/龍" },
    { root: "gecko", meaning: "守宮" },
    { root: "isopoda", meaning: "相等的腳" },
    { root: "armadillidium", meaning: "像犰狳一樣 (捲丸)" },
    { root: "porcellio", meaning: "豬 (鼠婦)" },

    // ==========================================
    //  通用形容詞 (顏色、形狀、大小)
    // ==========================================
    { root: "melano", meaning: "黑色的" },
    { root: "leuco", meaning: "白色的" },
    { root: "erythro", meaning: "紅色的" },
    { root: "cyano", meaning: "藍色的" },
    { root: "auranti", meaning: "橘色的" },
    { root: "viridis", meaning: "綠色的" },
    { root: "alba", meaning: "白色的" },
    { root: "nigra", meaning: "黑色的" },
    { root: "rubra", meaning: "紅色的" },
    
    { root: "longi", meaning: "長的" },
    { root: "brevi", meaning: "短的" },
    { root: "macro", meaning: "大的" },
    { root: "micro", meaning: "小的" },
    { root: "pseudo", meaning: "假的/偽" },
    { root: "neo", meaning: "新的" },
    
    // ==========================================
    //  身體部位
    // ==========================================
    { root: "cephala", meaning: "頭" },
    { root: "gaster", meaning: "腹部" },
    { root: "notus", meaning: "背部" },
    { root: "poda", meaning: "腳" },
    { root: "ceros", meaning: "角" },
    { root: "stoma", meaning: "嘴/口" },
    { root: "phylla", meaning: "葉子" },
    { root: "anthos", meaning: "花" },
    { root: "dendron", meaning: "樹木" },
    { root: "flora", meaning: "花" },
    { root: "andra", meaning: "雄蕊/雄性" },

    // ==========================================
    //  地理位置
    // ==========================================
    { root: "formosa", meaning: "美麗之島 (台灣)" },
    { root: "taiwan", meaning: "台灣" },
    { root: "sinensis", meaning: "中華/東方" },
    { root: "japonica", meaning: "日本" },
    { root: "indica", meaning: "印度/東印度群島" }
];
