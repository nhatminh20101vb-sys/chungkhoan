const {
    Client, GatewayIntentBits, EmbedBuilder,
    ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ButtonBuilder, ButtonStyle, Events
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// ==================== 📝 CẤU HÌNH ====================

const TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

const ROOT_ADMIN_IDS = ['1442129832401043606'];

const PREFIX = '!';
const INITIAL_MONEY = 5_000_000;
const PRICE_TICK_MS = 3000;
const LARGE_TRADE_THRESHOLD = {
    1: 1_000_000_000,
    2: 250,
    3: 500
};
const SUSPICIOUS_ASSET_THRESHOLD = {
    1: 100_000_000,
    2: 20_000,
    3: 50_000
};
const MAP_UNLOCK_REQUIREMENTS = {
    2: { level: 25, netWorth: 50_000_000 },        // Map1: level 25 + 50M VND
    3: { level: 50, netWorth: 50_000_000 }         // Map2: level 50 + 50M CAD
};
const MAP_CURRENCY = { 1: 'VND', 2: 'CAD', 3: 'USD' };
const MAP_SWITCH_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
const ANNOUNCE_CHANNEL_NAME = 'general';

const SESSION_OPEN_HOUR = 6;
const SESSION_CLOSE_HOUR = 23;

// ==================== 📊 MAP STAGES & CỔ PHIẾU ====================

const MAP_STOCKS = {
    1: {
        TECH: { basePrice: 150_000, emoji: '💻', name: 'VinTech', sector: 'Công nghệ', volatility: 0.015, map: 1 },
        FOOD: { basePrice: 80_000, emoji: '🍔', name: 'VinFood', sector: 'Tiêu dùng', volatility: 0.008, map: 1 },
        ENERGY: { basePrice: 120_000, emoji: '⚡', name: 'EVNPower', sector: 'Năng lượng', volatility: 0.012, map: 1 },
        GOLD: { basePrice: 300_000, emoji: '🥇', name: 'SJC Gold', sector: 'Hàng hóa', volatility: 0.006, map: 1 },
        REAL: { basePrice: 200_000, emoji: '🏠', name: 'VinHomes', sector: 'Địa ốc', volatility: 0.010, map: 1 },
        BANK: { basePrice: 100_000, emoji: '🏦', name: 'VietcomBank', sector: 'Tài chính', volatility: 0.007, map: 1 },
        HEALTH: { basePrice: 90_000, emoji: '💊', name: 'VinPharma', sector: 'Y tế', volatility: 0.009, map: 1 },
        CRYPTO: { basePrice: 500_000, emoji: '🪙', name: 'BitVN', sector: 'Crypto', volatility: 0.030, map: 1 },
        AUTO: { basePrice: 180_000, emoji: '🚗', name: 'VinFast', sector: 'Ô tô', volatility: 0.014, map: 1 },
        STEEL: { basePrice: 70_000, emoji: '🔩', name: 'HoaSen Steel', sector: 'Vật liệu', volatility: 0.011, map: 1 },
        AGRI: { basePrice: 55_000, emoji: '🌾', name: 'LongAn Agri', sector: 'Nông nghiệp', volatility: 0.009, map: 1 },
        RETAIL: { basePrice: 95_000, emoji: '🛒', name: 'MWG Market', sector: 'Bán lẻ', volatility: 0.010, map: 1 },
        MEDIA: { basePrice: 130_000, emoji: '📺', name: 'VTV Media', sector: 'Truyền thông', volatility: 0.013, map: 1 },
        SHIP: { basePrice: 85_000, emoji: '🚢', name: 'Vinalines', sector: 'Vận tải', volatility: 0.012, map: 1 },
        TOUR: { basePrice: 110_000, emoji: '🛫', name: 'VietJet Air', sector: 'Du lịch', volatility: 0.018, map: 1 },
        FISH: { basePrice: 45_000, emoji: '🐟', name: 'Minh Phu Fish', sector: 'Thủy sản', volatility: 0.008, map: 1 },
        INSURE: { basePrice: 160_000, emoji: '🔰', name: 'BaoViet Ins', sector: 'Bảo hiểm', volatility: 0.007, map: 1 },
        RUBBER: { basePrice: 60_000, emoji: '🌱', name: 'Dong Nai Rubber', sector: 'Cao su', volatility: 0.010, map: 1 },
        PHARMA: { basePrice: 220_000, emoji: '🧬', name: 'DHG Pharma', sector: 'Dược phẩm', volatility: 0.009, map: 1 },
        SOLAR: { basePrice: 175_000, emoji: '🌞', name: 'VinSolar', sector: 'Năng lượng xanh', volatility: 0.016, map: 1 },
    },
    2: {
        NANO: { basePrice: 12, emoji: '🧬', name: 'NanoPharm', sector: 'Công nghệ sinh học', volatility: 0.018, map: 2 },
        ARCT: { basePrice: 8, emoji: '🏔️', name: 'Arctic Mining', sector: 'Vật liệu', volatility: 0.016, map: 2 },
        CANN: { basePrice: 15, emoji: '🍁', name: 'Canada Green', sector: 'Nông nghiệp', volatility: 0.015, map: 2 },
        SKY: { basePrice: 18, emoji: '✈️', name: 'SkyLink', sector: 'Vận tải', volatility: 0.014, map: 2 },
        ROBO: { basePrice: 20, emoji: '🤖', name: 'RoboAI', sector: 'Trí tuệ nhân tạo', volatility: 0.020, map: 2 },
        WAVE: { basePrice: 10, emoji: '🌊', name: 'Wave Energy', sector: 'Năng lượng tái tạo', volatility: 0.013, map: 2 },
        ICE: { basePrice: 14, emoji: '❄️', name: 'IceWater', sector: 'Nước sạch', volatility: 0.012, map: 2 },
        MAPL: { basePrice: 9, emoji: '🍁', name: 'Maple Finance', sector: 'Tài chính', volatility: 0.011, map: 2 },
        CRYO: { basePrice: 22, emoji: '🌌', name: 'CryoTech', sector: 'Công nghệ cao', volatility: 0.021, map: 2 },
        POLA: { basePrice: 7, emoji: '🐻', name: 'Polar Logistics', sector: 'Logistics', volatility: 0.012, map: 2 },
    },
    3: {
        APEX: { basePrice: 35, emoji: '🚀', name: 'Apex Space', sector: 'Không gian', volatility: 0.017, map: 3 },
        QUANT: { basePrice: 28, emoji: '⚛️', name: 'Quantum Labs', sector: 'Công nghệ cao', volatility: 0.019, map: 3 },
        GRID: { basePrice: 24, emoji: '🔋', name: 'GridCore', sector: 'Năng lượng', volatility: 0.016, map: 3 },
        ORBIT: { basePrice: 31, emoji: '🛰️', name: 'Orbit Media', sector: 'Truyền thông', volatility: 0.015, map: 3 },
        DRONE: { basePrice: 19, emoji: '🛸', name: 'DroneX', sector: 'Hàng không', volatility: 0.014, map: 3 },
        NOVA: { basePrice: 26, emoji: '✨', name: 'Nova Health', sector: 'Y tế', volatility: 0.013, map: 3 },
        ALIEN: { basePrice: 21, emoji: '🪐', name: 'Alien Foods', sector: 'Tiêu dùng', volatility: 0.012, map: 3 },
        ECHO: { basePrice: 17, emoji: '🔊', name: 'Echo AI', sector: 'AI', volatility: 0.018, map: 3 },
        VORTEX: { basePrice: 33, emoji: '🌀', name: 'Vortex Capital', sector: 'Tài chính', volatility: 0.016, map: 3 },
        FUSION: { basePrice: 29, emoji: '☀️', name: 'Fusion Energy', sector: 'Năng lượng xanh', volatility: 0.015, map: 3 },
    }
};

const STOCKS = { ...MAP_STOCKS[1], ...MAP_STOCKS[2], ...MAP_STOCKS[3] };

// ==================== 🏠 BẤT ĐỘNG SẢN ====================
// Bất động sản: tài sản dài hạn, không "nhảy giá" theo tick như cổ phiếu,
// mà tăng giá trị đều theo thời gian (mô phỏng giá nhà tăng chậm) + có thể
// được admin tạo "cơn sốt đất" (boost) hoặc chính sách hạ nhiệt (giảm).
const REAL_ESTATE = {
    1: [
        { id: 'CHDC', name: 'Chung cư bình dân', emoji: '🏢', basePrice: 800_000_000, dailyGrowth: 0.0015 },
        { id: 'NHAPHO', name: 'Nhà phố mặt tiền', emoji: '🏠', basePrice: 2_500_000_000, dailyGrowth: 0.0020 },
        { id: 'BIETTHU', name: 'Biệt thự ven đô', emoji: '🏡', basePrice: 6_000_000_000, dailyGrowth: 0.0025 },
        { id: 'DATNEN', name: 'Đất nền dự án', emoji: '🌳', basePrice: 1_200_000_000, dailyGrowth: 0.0030 },
    ],
    2: [
        { id: 'CONDO', name: 'Condo Toronto', emoji: '🏙️', basePrice: 350, dailyGrowth: 0.0018 },
        { id: 'TOWNHOME', name: 'Townhouse', emoji: '🏘️', basePrice: 600, dailyGrowth: 0.0022 },
        { id: 'CABIN', name: 'Cabin vùng Bắc Cực', emoji: '🛖', basePrice: 200, dailyGrowth: 0.0028 },
    ],
    3: [
        { id: 'HABITAT', name: 'Habitat Module', emoji: '🛰️', basePrice: 900, dailyGrowth: 0.0020 },
        { id: 'DOME', name: 'Dome trên Sao Hỏa', emoji: '🪐', basePrice: 2_000, dailyGrowth: 0.0035 },
    ],
};

function getRealEstateList(mapStage) {
    return REAL_ESTATE[mapStage] || [];
}

function getRealEstateInfo(mapStage, typeId) {
    return getRealEstateList(mapStage).find(p => p.id === typeId) || null;
}

/** Giá hiện tại của 1 loại BĐS = basePrice * (1 + dailyGrowth)^số_ngày + tác động thị trường BĐS (admin set) */
function getRealEstateCurrentPrice(data, mapStage, typeId) {
    const info = getRealEstateInfo(mapStage, typeId);
    if (!info) return 0;
    if (!data.realEstate) data.realEstate = {};
    const key = `${mapStage}_${typeId}`;
    if (!data.realEstate[key]) {
        data.realEstate[key] = { createdAt: new Date().toISOString(), boostPct: 0 };
    }
    const market = data.realEstate[key];
    const days = Math.max(0, (Date.now() - new Date(market.createdAt).getTime()) / 86_400_000);
    const grown = info.basePrice * Math.pow(1 + info.dailyGrowth, days);
    const boosted = grown * (1 + (market.boostPct || 0) / 100);
    return Math.round(boosted);
}

// ==================== 📰 TIN TỨC NGẪU NHIÊN ====================

const NEWS_TEMPLATES = [
    { text: '{name} ký hợp đồng xuất khẩu trị giá 500 triệu USD', impact: [0.05, 0.12] },
    { text: 'Chính phủ tăng thuế ngành {sector} lên 15%', impact: [-0.10, -0.04] },
    { text: 'CEO {name} từ chức đột ngột', impact: [-0.12, -0.05] },
    { text: '{name} báo cáo lợi nhuận Q3 vượt kỳ vọng 40%', impact: [0.06, 0.15] },
    { text: 'Sự cố kỹ thuật nghiêm trọng tại {name}', impact: [-0.09, -0.03] },
    { text: 'Quỹ đầu tư nước ngoài rót 2 tỷ USD vào {name}', impact: [0.08, 0.18] },
    { text: 'Ngân hàng Nhà nước siết tín dụng ngành {sector}', impact: [-0.07, -0.02] },
    { text: '{name} được chọn làm nhà cung cấp độc quyền cho VinGroup', impact: [0.10, 0.20] },
    { text: 'Bão số 12 ảnh hưởng nặng đến hoạt động của {name}', impact: [-0.08, -0.03] },
    { text: '{name} công bố chia cổ tức 20% bằng tiền mặt', impact: [0.04, 0.10] },
    { text: 'Mỹ áp thuế chống bán phá giá lên hàng hóa ngành {sector}', impact: [-0.11, -0.05] },
    { text: '{name} mua lại đối thủ lớn nhất thị trường', impact: [0.07, 0.16] },
    { text: 'Tin đồn {name} sắp phá sản lan rộng trên mạng', impact: [-0.15, -0.06] },
    { text: 'Chuyên gia Goldman Sachs nâng khuyến nghị {name} lên BUY', impact: [0.05, 0.11] },
    { text: 'Thiếu điện diện rộng tác động xấu đến sản xuất ngành {sector}', impact: [-0.06, -0.02] },
];

// ==================== 🏅 DANH HIỆU ====================

const TITLES = [
    { minLevel: 1, title: 'Gà Mới Nở', emoji: '🥚', color: 0x95a5a6 },
    { minLevel: 5, title: 'Tập Sự Đầu Tư', emoji: '📰', color: 0x3498db },
    { minLevel: 10, title: 'Chuyên Gia Cổ Phiếu', emoji: '💼', color: 0x2ecc71 },
    { minLevel: 20, title: 'Cá Mập Thị Trường', emoji: '🦅', color: 0xe67e22 },
    { minLevel: 35, title: 'Trùm Chứng Khoán', emoji: '🐉', color: 0xe74c3c },
    { minLevel: 50, title: 'Vua Sàn Giao Dịch', emoji: '👑', color: 0xf1c40f },
    { minLevel: 75, title: 'Huyền Thoại Phố Wall', emoji: '💎', color: 0x9b59b6 },
    { minLevel: 100, title: 'Thần Tài Tái Thế', emoji: '🌌', color: 0x1abc9c },
    { minLevel: 125, title: 'Đế Vương Chứng Khoán', emoji: '👹', color: 0x8e44ad },
    { minLevel: 150, title: 'Quỷ Cập Sàn', emoji: '🔥', color: 0xc0392b },
    { minLevel: 200, title: 'Thượng Đế Phố Wall', emoji: '⚡', color: 0x00cec9 },
];

// ==================== 🏆 THÀNH TÍCH ====================

const ACHIEVEMENTS = [
    { id: 'first_trade', name: 'Giao dịch đầu tiên', emoji: '🎯', desc: 'Thực hiện giao dịch lần đầu' },
    { id: 'trader_10', name: 'Nhà đầu tư nghiêm túc', emoji: '📈', desc: '10 giao dịch' },
    { id: 'trader_100', name: 'Chiến binh sàn', emoji: '⚔️', desc: '100 giao dịch' },
    { id: 'trader_1000', name: 'Bàn Tay Thép', emoji: '🦾', desc: '1000 giao dịch' },
    { id: 'millionaire', name: 'Triệu phú', emoji: '💰', desc: 'Tổng tài sản đạt 10 triệu xu' },
    { id: 'billionaire', name: 'Tỷ phú', emoji: '🤑', desc: 'Tổng tài sản đạt 1 tỷ xu' },
    { id: 'big_loss', name: 'Nhà đầu tư dũng cảm', emoji: '😭', desc: 'Lỗ một lần hơn 50 triệu xu' },
    { id: 'big_win', name: 'Tay to', emoji: '🎰', desc: 'Lãi một lần hơn 100 triệu xu' },
    { id: 'whale', name: 'Cá voi', emoji: '🐳', desc: 'Giao dịch 1 lần hơn 1 tỷ xu' },
    { id: 'diversified', name: 'Nhà đầu tư đa dạng', emoji: '🌈', desc: 'Ôm cùng lúc 5+ loại cổ phiếu' },
    { id: 'banker', name: 'Ông chủ ngân hàng', emoji: '🏦', desc: 'Gửi tiết kiệm hơn 100 triệu xu' },
    { id: 'news_victim', name: 'Nạn nhân tin tức', emoji: '📰', desc: 'Bị ảnh hưởng bởi tin xấu' },
    { id: 'level_75', name: 'Huyền thoại', emoji: '🌟', desc: 'Đạt level 75' },
    { id: 'map_2', name: 'Bước chân Map 2', emoji: '🗺️', desc: 'Đạt được Map 2' },
    { id: 'map_3', name: 'Vương giả Map 3', emoji: '🌌', desc: 'Đạt được Map 3' },
    { id: 'level_100', name: 'Tướng lĩnh sàn', emoji: '🛡️', desc: 'Đạt level 100' },
    { id: 'level_200', name: 'Thượng đế sàn', emoji: '⚡', desc: 'Đạt level 200' },
    // Thành tích mới
    { id: 'profit_100m', name: 'Vua Lợi Nhuận', emoji: '👑', desc: 'Lãi tích lũy 100 triệu' },
    { id: 'profit_1b', name: 'Thiên Tài Đầu Tư', emoji: '🧠', desc: 'Lãi tích lũy 1 tỷ' },
    { id: 'slot_100', name: 'Dân Chơi Máy', emoji: '🎰', desc: 'Chơi Slot 100 lần' },
    { id: 'dice_50', name: 'Cúc Xắc Huyền Thoại', emoji: '🎲', desc: 'Chơi Dice 50 lần' },
    { id: 'repay_on_time', name: 'Con Nợ Đúng Hẹn', emoji: '✅', desc: 'Trả nợ đúng hạn lần đầu' },
    { id: 'credit_vip', name: 'Khách VIP', emoji: '💎', desc: 'Điểm tín nhiệm đạt 850+' },
    { id: 'crisis_survivor', name: 'Vượt Bão Thị Trường', emoji: '🌪️', desc: 'Sống sót qua sự kiện khủng hoảng toàn thị trường' },
    { id: 'bds_owner', name: 'Địa Chủ', emoji: '🏠', desc: 'Mua bất động sản đầu tiên' },
    { id: 'level_25', name: 'Lính Mới Trưởng Thành', emoji: '🌱', desc: 'Đạt level 25 — đủ điều kiện Map 2' },
    { id: 'level_50', name: 'Chiến Binh Lão Làng', emoji: '⚔️', desc: 'Đạt level 50 — đủ điều kiện Map 3' },
];

// ==================== 💳 ĐIỂM TÍN NHIỆM (CREDIT SCORE) ====================

const CREDIT_SCORE_TIERS = [
    { min: 800, label: 'Khách VIP 💎', emoji: '💎', loanMultiplier: 1.5, interestDiscount: 0.3 },
    { min: 700, label: 'Bình thường ✅', emoji: '✅', loanMultiplier: 1.0, interestDiscount: 0.0 },
    { min: 500, label: 'Rủi ro ⚠️', emoji: '⚠️', loanMultiplier: 0.7, interestDiscount: -0.2 },
    { min: 300, label: 'Nợ xấu 🔴', emoji: '🔴', loanMultiplier: 0.4, interestDiscount: -0.5 },
    { min: 0,   label: 'Phá sản ☠️', emoji: '☠️', loanMultiplier: 0.1, interestDiscount: -1.0 },
];

function getCreditTier(score) {
    for (const tier of CREDIT_SCORE_TIERS) {
        if (score >= tier.min) return tier;
    }
    return CREDIT_SCORE_TIERS[CREDIT_SCORE_TIERS.length - 1];
}

function addCreditScore(userData, delta, reason = '') {
    if (userData.creditScore === undefined) userData.creditScore = 700;
    userData.creditScore = Math.max(0, Math.min(1000, (userData.creditScore || 700) + delta));
    if (!userData.creditHistory) userData.creditHistory = [];
    userData.creditHistory.unshift({ time: new Date().toISOString(), delta, score: userData.creditScore, reason });
    if (userData.creditHistory.length > 20) userData.creditHistory.pop();
}

// ==================== 🏷️ DANH HIỆU NHÀ ĐẦU TƯ ====================

const INVESTOR_BADGES = [
    { id: 'badge_whale', name: 'Cá Voi 🐳', emoji: '🐳', desc: 'Lãi tích lũy hơn 10 triệu', check: (u) => (u.totalProfit || 0) >= 10_000_000 },
    { id: 'badge_market_dominator', name: 'Đại Gia Ngân Hàng 🏦', emoji: '🏦', desc: 'Gửi tiết kiệm 100 triệu', check: (u) => (u.bank?.savings || 0) >= 100_000_000 },
    { id: 'badge_gambler', name: 'Con Bạc Khát Nước 🎰', emoji: '🎰', desc: 'Thua Slot 100 lần', check: (u) => (u.slotLosses || 0) >= 100 },
    { id: 'badge_bankrupt', name: 'Kẻ Vỡ Nợ 💀', emoji: '💀', desc: 'Bị siết nợ lần đầu', check: (u) => (u.timesLiquidated || 0) >= 1 },
    { id: 'badge_diversifier', name: 'Phù Thủy Đa Ngành 🌈', emoji: '🌈', desc: 'Ôm đồng thời 7+ loại cổ phiếu', check: (u, d) => Object.values(u.portfolio || {}).filter(p => p.qty > 0).length >= 7 },
    { id: 'badge_tax_lord', name: 'Đại Gia Thuế 📋', emoji: '📋', desc: 'Nộp thuế tổng cộng 5 triệu', check: (u) => (u.totalTaxPaid || 0) >= 5_000_000 },
    { id: 'badge_high_roller', name: 'Tay Chơi Lớn 💸', emoji: '💸', desc: 'Giao dịch đơn lẻ hơn 100 triệu', check: (u) => (u.maxSingleTrade || 0) >= 100_000_000 },
    { id: 'badge_iron_hand', name: 'Bàn Tay Thép 🦾', emoji: '🦾', desc: '1000 giao dịch', check: (u) => (u.totalTrades || 0) >= 1000 },
    { id: 'badge_map2_pioneer', name: 'Tiên Phong Map 2 🗺️', emoji: '🗺️', desc: 'Đặt chân lên Map 2', check: (u) => (u.mapStage || 1) >= 2 || u.map2RegisteredAt },
    { id: 'badge_map3_legend', name: 'Huyền Thoại Map 3 🌌', emoji: '🌌', desc: 'Chinh phục Map 3', check: (u) => (u.mapStage || 1) >= 3 || u.map3RegisteredAt },
    { id: 'badge_vip_credit', name: 'Khách VIP 💎', emoji: '💎', desc: 'Điểm tín nhiệm 850+', check: (u) => (u.creditScore || 700) >= 850 },
    { id: 'badge_bds_mogul', name: 'Ông Trùm BĐS 🏢', emoji: '🏢', desc: 'Sở hữu 3+ bất động sản cùng lúc', check: (u) => (u.properties || []).length >= 3 },
];

function checkInvestorBadges(userData, data) {
    if (!userData.investorBadges) userData.investorBadges = [];
    const newBadges = [];
    for (const badge of INVESTOR_BADGES) {
        if (!userData.investorBadges.includes(badge.id)) {
            try {
                if (badge.check(userData, data)) {
                    userData.investorBadges.push(badge.id);
                    newBadges.push(badge);
                }
            } catch(e) {}
        }
    }
    return newBadges;
}

// ==================== 🌍 SỰ KIỆN TOÀN THỊ TRƯỜNG ====================

const MARKET_CRISIS_EVENTS = [
    {
        id: 'economic_crisis',
        name: '💥 Khủng hoảng kinh tế',
        desc: 'Khủng hoảng tài chính toàn cầu bùng nổ! Tất cả cổ phiếu đồng loạt lao dốc.',
        impact: [-0.15, -0.08],
        color: 0xff0000,
        affectAll: true,
    },
    {
        id: 'inflation',
        name: '📈 Lạm phát cao bất thường',
        desc: 'Lạm phát tăng vọt, áp lực lên thị trường. Cổ phiếu hàng hóa & năng lượng tăng, còn lại giảm.',
        impact: [-0.05, 0.10],
        color: 0xff8800,
        affectAll: true,
        sectorBoost: { 'Hàng hóa': 0.08, 'Năng lượng': 0.06, 'Năng lượng xanh': 0.05 },
    },
    {
        id: 'tech_boom',
        name: '🚀 Bùng nổ công nghệ',
        desc: 'Làn sóng AI và công nghệ bùng nổ toàn cầu! Cổ phiếu công nghệ tăng mạnh.',
        impact: [0.05, 0.18],
        color: 0x00ff88,
        affectAll: true,
        sectorBoost: { 'Công nghệ': 0.15, 'Trí tuệ nhân tạo': 0.18, 'AI': 0.15 },
    },
    {
        id: 'bank_crisis',
        name: '🏦 Khủng hoảng ngân hàng',
        desc: 'Loạt ngân hàng lớn mất thanh khoản! Cổ phiếu tài chính và ngân hàng lao dốc.',
        impact: [-0.12, -0.04],
        color: 0xff4444,
        affectAll: true,
        sectorPenalty: { 'Tài chính': -0.15, 'Bảo hiểm': -0.10 },
    },
    {
        id: 'trade_war',
        name: '⚔️ Chiến tranh thương mại',
        desc: 'Căng thẳng địa chính trị leo thang, thuế quan trả đũa khắp nơi. Thị trường hỗn loạn.',
        impact: [-0.08, 0.03],
        color: 0xe67e22,
        affectAll: true,
    },
    {
        id: 'green_revolution',
        name: '🌿 Cách mạng xanh toàn cầu',
        desc: 'Hội nghị khí hậu COP thông qua hiệp ước lịch sử! Năng lượng tái tạo bứt phá.',
        impact: [0.03, 0.15],
        color: 0x00cc66,
        affectAll: true,
        sectorBoost: { 'Năng lượng xanh': 0.18, 'Năng lượng tái tạo': 0.16, 'Nông nghiệp': 0.07 },
    },
];

function startMarketCrisisEngine() {
    function scheduleNext() {
        // Sự kiện toàn thị trường: mỗi 3-8 giờ
        const delay = (Math.random() * 300 + 180) * 60_000;
        setTimeout(async () => {
            try {
                const data = loadData();
                if (!data.sessionOpen) { scheduleNext(); return; }
                if (!data.marketCrisisHistory) data.marketCrisisHistory = [];

                const event = MARKET_CRISIS_EVENTS[Math.floor(Math.random() * MARKET_CRISIS_EVENTS.length)];
                const [minImpact, maxImpact] = event.impact;

                for (const [code, info] of Object.entries(STOCKS)) {
                    let impact = minImpact + Math.random() * (maxImpact - minImpact);
                    // Bonus/penalty theo ngành
                    if (event.sectorBoost && event.sectorBoost[info.sector]) {
                        impact = event.sectorBoost[info.sector] + (Math.random() * 0.04 - 0.02);
                    } else if (event.sectorPenalty && event.sectorPenalty[info.sector]) {
                        impact = event.sectorPenalty[info.sector] + (Math.random() * 0.04 - 0.02);
                    }
                    const oldPrice = data.stockPrices[code];
                    let newPrice = Math.round(oldPrice * (1 + impact) * 10) / 10;
                    if (newPrice < 1) newPrice = 1;
                    data.stockPrices[code] = newPrice;
                }

                const entry = { time: new Date().toISOString(), eventId: event.id, name: event.name };
                data.marketCrisisHistory.unshift(entry);
                if (data.marketCrisisHistory.length > 20) data.marketCrisisHistory.pop();
                saveData(data);

                for (const guild of client.guilds.cache.values()) {
                    const channel = getAnnounceChannel(guild);
                    if (!channel) continue;
                    const isPositive = (minImpact + maxImpact) / 2 > 0;
                    const embed = new EmbedBuilder()
                        .setTitle(`🌍 SỰ KIỆN TOÀN THỊ TRƯỜNG: ${event.name}`)
                        .setDescription(`**${event.desc}**\n\n⚠️ Tất cả cổ phiếu trên toàn thị trường bị ảnh hưởng!`)
                        .setColor(event.color)
                        .addFields(
                            { name: 'Biên độ tác động', value: `${(minImpact*100).toFixed(1)}% đến ${(maxImpact*100).toFixed(1)}%`, inline: true },
                            { name: 'Phạm vi', value: 'Toàn bộ thị trường', inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: '💡 Sự kiện toàn thị trường ảnh hưởng đồng loạt tất cả mã!' });
                    channel.send({ content: '@everyone 🌍 **SỰ KIỆN THỊ TRƯỜNG!**', embeds: [embed] }).catch(() => {});
                }
            } catch(e) { console.log(`❌ Crisis engine: ${e.message}`); }
            scheduleNext();
        }, delay);
    }
    scheduleNext();
}

function checkAchievements(userData, data, context = {}) {
    const unlocked = [];
    const has = (id) => userData.achievements.includes(id);

    if (!has('first_trade') && userData.totalTrades >= 1) unlocked.push('first_trade');
    if (!has('trader_10') && userData.totalTrades >= 10) unlocked.push('trader_10');
    if (!has('trader_100') && userData.totalTrades >= 100) unlocked.push('trader_100');
    if (!has('trader_1000') && userData.totalTrades >= 1000) unlocked.push('trader_1000');

    const netWorth = userData.balance + (userData.bank?.savings || 0) +
        Object.entries(userData.portfolio).reduce((s, [c, p]) => s + p.qty * (data.stockPrices[c] || 0), 0);
    if (!has('millionaire') && netWorth >= 10_000_000) unlocked.push('millionaire');
    if (!has('billionaire') && netWorth >= 1_000_000_000) unlocked.push('billionaire');

    if (!has('big_loss') && context.profit !== undefined && context.profit <= -50_000_000) unlocked.push('big_loss');
    if (!has('big_win') && context.profit !== undefined && context.profit >= 100_000_000) unlocked.push('big_win');
    if (!has('whale') && context.total !== undefined && context.total >= 1_000_000_000) unlocked.push('whale');

    const stocksHeld = Object.values(userData.portfolio).filter(p => p.qty > 0).length;
    if (!has('diversified') && stocksHeld >= 5) unlocked.push('diversified');
    if (!has('banker') && userData.bank?.savings >= 100_000_000) unlocked.push('banker');
    if (!has('news_victim') && context.newsVictim) unlocked.push('news_victim');
    if (!has('level_75') && userData.level >= 75) unlocked.push('level_75');
    if (!has('map_2') && (userData.mapStage || 1) >= 2) unlocked.push('map_2');
    if (!has('map_3') && (userData.mapStage || 1) >= 3) unlocked.push('map_3');
    if (!has('level_100') && userData.level >= 100) unlocked.push('level_100');
    if (!has('level_200') && userData.level >= 200) unlocked.push('level_200');

    // Thành tích mới
    if (!has('profit_100m') && (userData.totalProfit || 0) >= 100_000_000) unlocked.push('profit_100m');
    if (!has('profit_1b') && (userData.totalProfit || 0) >= 1_000_000_000) unlocked.push('profit_1b');
    if (!has('slot_100') && (userData.slotPlays || 0) >= 100) unlocked.push('slot_100');
    if (!has('dice_50') && (userData.dicePlays || 0) >= 50) unlocked.push('dice_50');
    if (!has('credit_vip') && (userData.creditScore || 700) >= 850) unlocked.push('credit_vip');
    if (!has('bds_owner') && (userData.properties || []).length >= 1) unlocked.push('bds_owner');
    if (!has('level_25') && userData.level >= 25) unlocked.push('level_25');
    if (!has('level_50') && userData.level >= 50) unlocked.push('level_50');
    if (!has('repay_on_time') && context.repaidOnTime) unlocked.push('repay_on_time');
    if (!has('crisis_survivor') && context.crisisSurvivor) unlocked.push('crisis_survivor');

    for (const id of unlocked) userData.achievements.push(id);
    return unlocked;
}

// ==================== 🤖 KHỞI TẠO BOT ====================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==================== 💾 DATABASE ====================

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
    if (!fs.existsSync(DATA_FILE)) { const d = makeDefaultData(); saveData(d); return d; }
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf8').trim();
        if (!content) throw new Error('File rỗng');
        const data = JSON.parse(content);
        if (!data.stockPrices) data.stockPrices = {};
        if (!data.stockHistory) data.stockHistory = {};
        if (!data.dailyOpen) data.dailyOpen = {};
        if (!data.totalTransactions) data.totalTransactions = 0;
        if (!data.lastSessionClose) data.lastSessionClose = null;
        if (!data.lastSessionOpen) data.lastSessionOpen = null;
        if (data.sessionOpen === undefined) data.sessionOpen = true;
        if (!data.limitOrders) data.limitOrders = [];
        if (!data.adminIds) data.adminIds = [];
        if (!data.adminActions) data.adminActions = [];
        if (!data.suspiciousAssets) data.suspiciousAssets = [];
        if (!data.usedIds) data.usedIds = { 1: [], 2: [], 3: [] };
        if (!data.releasedIds) data.releasedIds = { 1: [], 2: [], 3: [] };
        if (!data.priceAlerts) data.priceAlerts = {};
        if (!data.transactionLog) data.transactionLog = [];
        if (!data.giveaways) data.giveaways = [];
        if (!data.cheatAlerts) data.cheatAlerts = [];
        if (!data.transferLog) data.transferLog = [];
        if (!data.realEstate) data.realEstate = {};
        for (const code of Object.keys(STOCKS)) {
            if (!data.stockPrices[code]) data.stockPrices[code] = STOCKS[code].basePrice;
            if (!data.stockHistory[code]) data.stockHistory[code] = [];
            if (!data.dailyOpen[code]) data.dailyOpen[code] = data.stockPrices[code];
        }
        saveData(data);
        return data;
    } catch (e) {
        console.log(`⚠️ Lỗi đọc file: ${e.message}`);
        if (fs.existsSync(DATA_FILE)) fs.renameSync(DATA_FILE, `data_backup_${Date.now()}.json`);
        const d = makeDefaultData();
        saveData(d);
        return d;
    }
}

function makeDefaultData() {
    return {
        users: {},
        stockPrices: Object.fromEntries(Object.entries(STOCKS).map(([k, v]) => [k, v.basePrice])),
        stockHistory: Object.fromEntries(Object.keys(STOCKS).map(k => [k, []])),
        dailyOpen: Object.fromEntries(Object.entries(STOCKS).map(([k, v]) => [k, v.basePrice])),
        totalTransactions: 0,
        lastSessionClose: null,
        lastSessionOpen: null,
        sessionOpen: true,
        limitOrders: [],
        adminIds: [],
        adminActions: [],
        suspiciousAssets: [],
        priceAlerts: {},
        transactionLog: [],
        giveaways: [],
        cheatAlerts: [],
        transferLog: [],
        realEstate: {},
        usedIds: { 1: [], 2: [], 3: [] },   // pool ID đã cấp cho từng map
        releasedIds: { 1: [], 2: [], 3: [] }, // pool ID đã giải phóng (reset)
    };
}

function makeDefaultUserData() {
    return {
        balance: INITIAL_MONEY,   // ví hiện tại (alias, thực ra dùng balanceVND/CAD/USD)
        balanceVND: INITIAL_MONEY, // ví Map 1 — VND
        balanceCAD: 0,             // ví Map 2 — CAD (nhận khi lên Map 2 lần đầu)
        balanceUSD: 0,             // ví Map 3 — USD (nhận khi lên Map 3 lần đầu)
        portfolio: Object.fromEntries(Object.keys(STOCKS).map(k => [k, { qty: 0, avgCost: 0 }])),
        bank: {
            savings: 0,
            depositedAt: null,
            depositAmount: 0,
            depositDueAt: null,
            depositTermDays: 0,
            depositActive: false,
        },
        margin: { borrowed: 0, borrowedAt: null, dueAt: null, termDays: 0 },
        joinedAt: new Date().toISOString(),
        lastDaily: null,
        totalTrades: 0,
        totalProfit: 0,
        dailyProfit: 0,
        tradeHistory: [],
        level: 1,
        exp: 0,
        achievements: [],
        shortPositions: {},
        totalInvested: 0,
        totalTaxPaid: 0,
        lastWithdrawTime: null,
        exchangeId: null,
        registeredAt: null,
        map2ExchangeId: null,
        map2RegisteredAt: null,
        map3ExchangeId: null,
        map3RegisteredAt: null,
        mapStage: 1,
        currency: 'VND',
        mapSwitchCooldownUntil: null,
        moneyHistory: [],
        tradeBanUntil: null,
        bankruptcy: null,
        transferDayKey: null,
        transferCountToday: 0,
        properties: [], // bất động sản đang sở hữu: { id, typeId, boughtAt, boughtPrice, mapStage }
        // Stats mới
        creditScore: 700,
        creditHistory: [],
        investorBadges: [],
        slotPlays: 0,
        slotWins: 0,
        slotLosses: 0,
        dicePlays: 0,
        diceWins: 0,
        diceLosses: 0,
        timesLiquidated: 0,
        timesRepaidOnTime: 0,
        maxSingleTrade: 0,
        peakNetWorth: 0,
    };
}

function ensureUserData(data, userId) {
    const uid = userId.toString();
    if (!data.users[uid]) data.users[uid] = makeDefaultUserData();
    const u = data.users[uid];
    if (!u.portfolio) u.portfolio = Object.fromEntries(Object.keys(STOCKS).map(k => [k, { qty: 0, avgCost: 0 }]));
    for (const code of Object.keys(STOCKS)) {
        if (!u.portfolio[code]) u.portfolio[code] = { qty: 0, avgCost: 0 };
    }
    if (!u.bank) u.bank = { savings: 0, depositedAt: null, depositAmount: 0, depositDueAt: null, depositTermDays: 0, depositActive: false };
    if (!u.margin) u.margin = { borrowed: 0, borrowedAt: null, dueAt: null, termDays: 0 };
    if (!u.shortPositions) u.shortPositions = {};
    if (u.dailyProfit === undefined) u.dailyProfit = 0;
    if (!u.achievements) u.achievements = [];
    if (u.totalInvested === undefined) u.totalInvested = 0;
    if (u.totalTaxPaid === undefined) u.totalTaxPaid = 0;
    if (u.lastWithdrawTime === undefined) u.lastWithdrawTime = null;
    if (!u.moneyHistory) u.moneyHistory = [];
    if (!u.mapStage) u.mapStage = 1;
    if (!u.currency) u.currency = 'VND';
    if (!u.map2ExchangeId) u.map2ExchangeId = null;
    if (!u.map2RegisteredAt) u.map2RegisteredAt = null;
    if (!u.map3ExchangeId) u.map3ExchangeId = null;
    if (!u.map3RegisteredAt) u.map3RegisteredAt = null;
    if (u.tradeBanUntil === undefined) u.tradeBanUntil = null;
    if (u.mapSwitchCooldownUntil === undefined) u.mapSwitchCooldownUntil = null;
    if (!u.bankruptcy) u.bankruptcy = null;
    if (u.transferDayKey === undefined) u.transferDayKey = null;
    if (u.transferCountToday === undefined) u.transferCountToday = 0;
    if (!u.properties) u.properties = [];
    // Mới: credit score & stats
    if (u.creditScore === undefined) u.creditScore = 700;
    if (!u.creditHistory) u.creditHistory = [];
    if (!u.investorBadges) u.investorBadges = [];
    if (u.slotPlays === undefined) u.slotPlays = 0;
    if (u.slotWins === undefined) u.slotWins = 0;
    if (u.slotLosses === undefined) u.slotLosses = 0;
    if (u.dicePlays === undefined) u.dicePlays = 0;
    if (u.diceWins === undefined) u.diceWins = 0;
    if (u.diceLosses === undefined) u.diceLosses = 0;
    if (u.timesLiquidated === undefined) u.timesLiquidated = 0;
    if (u.timesRepaidOnTime === undefined) u.timesRepaidOnTime = 0;
    if (u.maxSingleTrade === undefined) u.maxSingleTrade = 0;
    if (u.peakNetWorth === undefined) u.peakNetWorth = 0;
    // 3 ví tiền độc lập theo map
    if (u.balanceVND === undefined) { u.balanceVND = u.balance || INITIAL_MONEY; }
    if (u.balanceCAD === undefined) u.balanceCAD = 0;
    if (u.balanceUSD === undefined) u.balanceUSD = 0;
    // Đồng bộ balance với ví của map hiện tại
    u.balance = getWallet(u);
    if (u.bank.depositAmount === undefined) u.bank.depositAmount = 0;
    if (u.bank.depositDueAt === undefined) u.bank.depositDueAt = null;
    if (u.bank.depositTermDays === undefined) u.bank.depositTermDays = 0;
    if (u.bank.depositActive === undefined) u.bank.depositActive = false;
    if (u.margin.dueAt === undefined) u.margin.dueAt = null;
    if (u.margin.termDays === undefined) u.margin.termDays = 0;
    return u;
}

function getMapStocks(stage) {
    return MAP_STOCKS[stage] || {};
}

function getUserStockCodes(userData) {
    return Object.keys(getMapStocks(userData?.mapStage || 1));
}

function isStockAllowedForUser(code, userData) {
    return getUserStockCodes(userData).includes(code);
}

function formatCurrency(value, currency = 'VND') {
    const amount = formatMoney(value);
    if (currency === 'USD') return `$${amount}`;
    if (currency === 'CAD') return `C$${amount}`;
    return `${amount} xu`;
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getUserData(userId) {
    const data = loadData();
    const uid = userId.toString();
    const u = ensureUserData(data, uid);
    saveData(data);
    return { data, userData: u };
}

function recordMoneyHistory(userData, amount, note) {
    if (!userData.moneyHistory) userData.moneyHistory = [];
    userData.moneyHistory.unshift({
        time: new Date().toISOString(),
        amount,
        balance: userData.balance,
        note,
    });
    if (userData.moneyHistory.length > 30) userData.moneyHistory.pop();
}

function logAdminAction(data, adminId, action) {
    if (!data.adminActions) data.adminActions = [];
    data.adminActions.push({ time: new Date().toISOString(), adminId: adminId.toString(), action });
}



// ==================== 💼 WALLET HELPERS ====================

/** Lấy số dư ví của map đang dùng */
function getWallet(userData) {
    const stage = userData.mapStage || 1;
    if (stage === 3) return userData.balanceUSD  ?? 0;
    if (stage === 2) return userData.balanceCAD  ?? 0;
    return userData.balanceVND ?? userData.balance ?? 0;
}

/** Ghi số dư vào ví đúng map và cập nhật balance alias */
function setWallet(userData, amount) {
    const stage = userData.mapStage || 1;
    if (stage === 3) userData.balanceUSD = amount;
    else if (stage === 2) userData.balanceCAD = amount;
    else userData.balanceVND = amount;
    userData.balance = amount;  // alias
}

/** Đọc-sửa ví: fn(currentBalance) => newBalance */
function mutWallet(userData, fn) {
    setWallet(userData, fn(getWallet(userData)));
}

function getCurrencyUnit(mapStage) {
    return { 1: 'VND', 2: 'CAD', 3: 'USD' }[mapStage] || 'VND';
}

function fmtCur(value, mapStage) {
    const u = getCurrencyUnit(mapStage || 1);
    const s = formatMoney(value);
    if (u === 'USD') return `$${s}`;
    if (u === 'CAD') return `C$${s}`;
    return `${s} ₫`;
}

// ==================== 🆔 SINH MÃ ĐỊNH DANH ====================

function randomLetters(count) {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let s = '';
    for (let i = 0; i < count; i++) s += A[Math.floor(Math.random() * 26)];
    return s;
}

function randomDigits(count) {
    let s = '';
    for (let i = 0; i < count; i++) s += Math.floor(Math.random() * 10).toString();
    return s;
}

function generateExchangeId(data, mapStage) {
    if (!data.usedIds) data.usedIds = { 1: [], 2: [], 3: [] };
    if (!data.releasedIds) data.releasedIds = { 1: [], 2: [], 3: [] };

    const used = new Set(data.usedIds[mapStage] || []);
    const released = data.releasedIds[mapStage] || [];

    // Ưu tiên dùng lại ID đã giải phóng
    while (released.length > 0) {
        const candidate = released.shift();
        if (!used.has(candidate)) {
            used.add(candidate);
            data.usedIds[mapStage] = [...used];
            data.releasedIds[mapStage] = released;
            return candidate;
        }
    }

    // Sinh ID mới, đảm bảo không trùng trong cùng map
    const letterCount = mapStage === 2 ? 3 : 2;  // Map2: 3 chữ, Map1&3: 2 chữ
    let attempts = 0;
    while (attempts < 10000) {
        const id = randomLetters(letterCount) + randomDigits(4);
        if (!used.has(id)) {
            used.add(id);
            data.usedIds[mapStage] = [...used];
            return id;
        }
        attempts++;
    }
    // Fallback nếu không còn slot (rất hiếm)
    const fallback = randomLetters(letterCount) + randomDigits(6);
    used.add(fallback);
    data.usedIds[mapStage] = [...used];
    return fallback;
}

function releaseExchangeId(data, mapStage, exchangeId) {
    if (!exchangeId) return;
    if (!data.releasedIds) data.releasedIds = { 1: [], 2: [], 3: [] };
    if (!data.usedIds) data.usedIds = { 1: [], 2: [], 3: [] };
    // Xóa khỏi usedIds
    data.usedIds[mapStage] = (data.usedIds[mapStage] || []).filter(id => id !== exchangeId);
    // Đưa vào releasedIds để tái sử dụng
    if (!(data.releasedIds[mapStage] || []).includes(exchangeId)) {
        if (!data.releasedIds[mapStage]) data.releasedIds[mapStage] = [];
        data.releasedIds[mapStage].push(exchangeId);
    }
}

function isRegistered(userData, mapStage = 1) {
    if (mapStage === 2) return Boolean(userData && userData.map2RegisteredAt && userData.map2ExchangeId);
    if (mapStage === 3) return Boolean(userData && userData.map3RegisteredAt && userData.map3ExchangeId);
    return Boolean(userData && userData.registeredAt && userData.exchangeId);
}

function registerUser(data, userId, mapStage = 1) {
    const uid = userId.toString();
    const userData = ensureUserData(data, uid);
    if (mapStage === 2) {
        if (isRegistered(userData, 2)) return userData;  // đã có ID rồi, không cấp lại
        const exchangeId = generateExchangeId(data, 2);
        userData.map2ExchangeId = exchangeId;
        userData.map2RegisteredAt = new Date().toISOString();
        return userData;
    }
    if (mapStage === 3) {
        if (isRegistered(userData, 3)) return userData;
        const exchangeId = generateExchangeId(data, 3);
        userData.map3ExchangeId = exchangeId;
        userData.map3RegisteredAt = new Date().toISOString();
        return userData;
    }
    // Map 1
    if (isRegistered(userData, 1)) return userData;  // chỉ đăng ký 1 lần
    const exchangeId = generateExchangeId(data, 1);
    userData.exchangeId = exchangeId;
    userData.registeredAt = new Date().toISOString();
    return userData;
}

function warnSuspiciousAssets(data, guild, userId, userData, reason) {
    const netWorth = calcNetWorth(userData, data.stockPrices);
    const threshold = SUSPICIOUS_ASSET_THRESHOLD[userData.mapStage || 1] || SUSPICIOUS_ASSET_THRESHOLD[1];
    if (netWorth < threshold) return;
    if (!data.suspiciousAssets) data.suspiciousAssets = [];
    const entry = {
        time: new Date().toISOString(),
        userId: userId.toString(),
        exchangeId: userData.exchangeId || 'UNKNOWN',
        netWorth,
        reason,
        mapStage: userData.mapStage || 1,
    };
    data.suspiciousAssets.unshift(entry);
    if (data.suspiciousAssets.length > 50) data.suspiciousAssets.pop();

    const channel = getAnnounceChannel(guild);
    if (!channel) return;
    const alertText = ROOT_ADMIN_IDS.map(id => `<@${id}>`).join(' ');
    const embed = new EmbedBuilder()
        .setTitle('⚠️ NGUỒN TÀI SẢN BẤT THƯỜNG')
        .setColor(0xff0000)
        .setDescription(`Người dùng ${userData.exchangeId || 'UNKNOWN'} có tài sản lớn: **${formatMoney(netWorth)} xu**`)
        .addFields(
            { name: 'ID sàn', value: `${userData.exchangeId || 'UNKNOWN'}`, inline: true },
            { name: 'Discord ID', value: `${userId}`, inline: true },
            { name: 'Lý do', value: reason, inline: false }
        )
        .setTimestamp();
    channel.send({ content: `${alertText} Cảnh báo tài sản bất thường`, embeds: [embed] }).catch(() => { });
}

// ==================== 🔑 ADMIN ====================

function isAdmin(userId) {
    const data = loadData();
    return ROOT_ADMIN_IDS.includes(userId.toString()) || (data.adminIds || []).includes(userId.toString());
}

function isRootAdmin(userId) {
    return ROOT_ADMIN_IDS.includes(userId.toString());
}

// ==================== 🛠️ TIỆN ÍCH ====================

function getMapExpMultiplier(mapStage = 1) {
    return { 1: 1, 2: 2, 3: 3 }[mapStage] || 1;
}

function addExp(userData, amount) {
    const multiplier = getMapExpMultiplier(userData?.mapStage || 1);
    userData.exp = (userData.exp || 0) + amount * multiplier;
    let leveled = false;
    while (userData.exp >= expToNextLevel(userData.level, userData?.mapStage || 1)) {
        userData.exp -= expToNextLevel(userData.level, userData?.mapStage || 1);
        userData.level += 1;
        leveled = true;
    }
    return leveled;
}

function expToNextLevel(level, mapStage = 1) {
    const base = level * 400 + 800;
    const multiplier = { 1: 1, 2: 2.2, 3: 3.2 }[mapStage] || 1;
    return Math.floor(base * multiplier);
}

function getTitle(level) {
    for (let i = TITLES.length - 1; i >= 0; i--)
        if (level >= TITLES[i].minLevel) return TITLES[i];
    return TITLES[0];
}

function formatMoney(n) {
    const abs = Math.abs(n);
    const UNITS = [
        [1e21, 'ZT'], [1e18, 'ET'], [1e15, 'PT'], [1e12, 'TT'],
        [1e9,  'BT'], [1e6,  'MT'], [1e3,  'KT'],
        [1e18, 'ET'], // fallback handled below
    ];
    // Đơn vị gọn: K M B T KT MT BT TT...
    const TIERS = [
        { v: 1e24, s: 'TT'  },
        { v: 1e21, s: 'BT'  },
        { v: 1e18, s: 'MT'  },
        { v: 1e15, s: 'KT'  },
        { v: 1e12, s: 'T'   },
        { v: 1e9,  s: 'B'   },
        { v: 1e6,  s: 'M'   },
        { v: 1e3,  s: 'K'   },
    ];
    let str;
    const tier = TIERS.find(t => abs >= t.v);
    if (tier) {
        const val = abs / tier.v;
        const decimals = val < 10 ? 2 : val < 100 ? 1 : 0;
        str = `${val.toFixed(decimals)}${tier.s}`;
    } else {
        str = Math.round(abs).toString();
    }
    return n < 0 ? `-${str}` : str;
}

function calculateTradeExp(total, profit = 0, userData = {}) {
    const base = Math.max(5, Math.floor(total / 250_000));
    const profitBonus = Math.floor(Math.abs(profit) / 500_000);
    const multiplier = getMapExpMultiplier(userData?.mapStage || 1);
    return Math.max(8, Math.floor((base + profitBonus) * multiplier));
}

function isTradeBanned(userData) {
    if (!userData?.tradeBanUntil) return false;
    return new Date(userData.tradeBanUntil).getTime() > Date.now();
}

// ==================== 🛡️ CHỐNG GIAN LẬN (ANTI-CHEAT) ====================

// Rate-limit: chặn spam lệnh quá nhanh (chống bot/macro tự động click)
const COMMAND_COOLDOWN_MS = 1200;
const lastCommandAt = {}; // userId -> timestamp

function isOnCommandCooldown(userId) {
    const now = Date.now();
    const last = lastCommandAt[userId] || 0;
    if (now - last < COMMAND_COOLDOWN_MS) return true;
    lastCommandAt[userId] = now;
    return false;
}

// Theo dõi chuyển tiền gần đây để phát hiện "rửa tiền" qua lại giữa 2 acc
const TRANSFER_WINDOW_MS = 10 * 60 * 1000; // 10 phút
const TRANSFER_LOOP_THRESHOLD = 3; // ≥3 lượt qua lại trong khung giờ là đáng ngờ

function recordTransferAndCheckLoop(data, fromId, toId, amount) {
    if (!data.transferLog) data.transferLog = [];
    const now = Date.now();
    data.transferLog.push({ from: fromId, to: toId, amount, t: now });
    // dọn log cũ
    data.transferLog = data.transferLog.filter(e => now - e.t < TRANSFER_WINDOW_MS);

    // Đếm số lần A->B và B->A trong khung giờ gần đây
    const aToB = data.transferLog.filter(e => e.from === fromId && e.to === toId).length;
    const bToA = data.transferLog.filter(e => e.from === toId && e.to === fromId).length;
    const isSuspiciousLoop = aToB >= TRANSFER_LOOP_THRESHOLD || bToA >= TRANSFER_LOOP_THRESHOLD || (aToB >= 2 && bToA >= 2);
    return isSuspiciousLoop;
}

function flagCheatAlert(data, guild, userId, exchangeId, reason) {
    if (!data.cheatAlerts) data.cheatAlerts = [];
    data.cheatAlerts.unshift({ time: new Date().toISOString(), userId: userId.toString(), exchangeId: exchangeId || 'UNKNOWN', reason });
    if (data.cheatAlerts.length > 50) data.cheatAlerts.pop();
    const channel = getAnnounceChannel(guild);
    if (!channel) return;
    const alertText = ROOT_ADMIN_IDS.map(id => `<@${id}>`).join(' ');
    const embed = new EmbedBuilder()
        .setTitle('🚨 CẢNH BÁO KHẢ NĂNG GIAN LẬN')
        .setColor(0xff0000)
        .setDescription(`Phát hiện hành vi đáng ngờ từ <@${userId}>`)
        .addFields(
            { name: 'ID sàn', value: `${exchangeId || 'UNKNOWN'}`, inline: true },
            { name: 'Discord ID', value: `${userId}`, inline: true },
            { name: 'Lý do', value: reason, inline: false }
        )
        .setTimestamp();
    channel.send({ content: `${alertText} Cảnh báo gian lận`, embeds: [embed] }).catch(() => { });
}

function processExpiredLoans(data) {
    let changed = false;
    for (const [uid, userData] of Object.entries(data.users || {})) {
        const margin = userData.margin || {};
        if (!margin.borrowed || margin.borrowed <= 0 || !margin.dueAt) continue;
        if (new Date(margin.dueAt).getTime() > Date.now()) continue;

        const netWorth = calcNetWorth(userData, data.stockPrices);
        if (netWorth < margin.borrowed) {
            userData.balance = 0;
            userData.bank = {
                savings: 0,
                depositedAt: null,
                depositAmount: 0,
                depositDueAt: null,
                depositTermDays: 0,
                depositActive: false,
            };
            userData.portfolio = Object.fromEntries(Object.keys(STOCKS).map(k => [k, { qty: 0, avgCost: 0 }]));
            userData.shortPositions = {};
            userData.margin = { borrowed: 0, borrowedAt: null, dueAt: null, termDays: 0 };
            userData.bankruptcy = {
                type: 'bankrupt',
                at: new Date().toISOString(),
                debt: margin.borrowed,
                reason: 'Không đủ tài sản để trả nợ đúng hạn',
            };
            userData.timesLiquidated = (userData.timesLiquidated || 0) + 1;
            addCreditScore(userData, -50, 'Bị siết nợ do phá sản');
        } else {
            userData.balance = 100;
            userData.bank = {
                savings: 0,
                depositedAt: null,
                depositAmount: 0,
                depositDueAt: null,
                depositTermDays: 0,
                depositActive: false,
            };
            userData.portfolio = Object.fromEntries(Object.keys(STOCKS).map(k => [k, { qty: 0, avgCost: 0 }]));
            userData.shortPositions = {};
            userData.margin = { borrowed: 0, borrowedAt: null, dueAt: null, termDays: 0 };
            userData.tradeBanUntil = new Date(Date.now() + 86_400_000).toISOString();
            userData.bankruptcy = {
                type: 'liquidated',
                at: new Date().toISOString(),
                debt: margin.borrowed,
                reason: 'Đã đủ tiền trả nhưng không trả đúng hạn',
            };
        }
        changed = true;
        notifyUser(uid, '⚠️ Khoản vay của bạn đã đến hạn và đã bị xử lý theo quy định của hệ thống.').catch(() => { });
    }
    return changed;
}

function calcNetWorth(userData, stockPrices) {
    let total = userData.balance + (userData.bank?.savings || 0);
    for (const [code, pos] of Object.entries(userData.portfolio))
        total += pos.qty * (stockPrices[code] || 0);
    return total;
}

function getTimeRemaining(targetDate) {
    const diff = targetDate - Date.now();
    if (diff <= 0) return '0s';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// ==================== 📡 PRICE ENGINE ====================

// Lưu xu hướng ngắn hạn cho mỗi cổ phiếu (tránh chỉ tăng mãi)
const priceTrends = {};

function startPriceEngine() {
    // Khởi tạo xu hướng ngẫu nhiên cho mỗi cổ phiếu
    for (const code of Object.keys(STOCKS)) {
        priceTrends[code] = { dir: Math.random() > 0.5 ? 1 : -1, ticks: Math.floor(Math.random() * 20) + 5 };
    }

    setInterval(() => {
        try {
            const data = loadData();
            if (!data.sessionOpen) return;
            const now = new Date();
            processExpiredLoans(data);

            for (const [code, info] of Object.entries(STOCKS)) {
                const current = data.stockPrices[code];
                const base = info.basePrice;

                // ── Xu hướng ngắn hạn (đổi chiều sau N tick) ──
                const trend = priceTrends[code];
                trend.ticks--;
                if (trend.ticks <= 0) {
                    // Đổi chiều: xác suất cao hơn nếu giá lệch xa base
                    const deviation = (current - base) / base;
                    const flipProb = 0.55 + Math.abs(deviation) * 0.8;
                    trend.dir = Math.random() < flipProb ? -trend.dir : trend.dir;
                    trend.ticks = Math.floor(Math.random() * 25) + 5;
                }

                // ── Drift nhẹ về base (mean-reversion yếu) ──
                const deviation = (current - base) / base;
                const drift = -deviation * base * 0.0003;  // nhẹ hơn nhiều

                // ── Shock ngẫu nhiên theo volatility (đã tăng để giá "nhảy" rõ hơn) ──
                const vol = info.volatility;
                const normalShock = (Math.random() * 2 - 1) * base * vol * 1.4;

                // ── Spike hiếm (5% mỗi tick, biên độ lớn hơn): tin tức giả lập ──
                let spike = 0;
                if (Math.random() < 0.05) {
                    spike = (Math.random() > 0.5 ? 1 : -1) * base * (0.05 + Math.random() * 0.10);
                }

                // ── Tổng hợp: xu hướng + drift + shock + spike ──
                const trendForce = trend.dir * base * vol * 0.9;
                let newPrice = current + drift + trendForce + normalShock + spike;

                // ── Giới hạn: ±60% quanh basePrice ──
                const minPrice = Math.max(base * 0.4, 1);
                const maxPrice = base * 1.6;
                newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
                newPrice = Math.round(newPrice * 10) / 10;

                data.stockHistory[code].push({ t: now.toISOString(), p: newPrice });
                if (data.stockHistory[code].length > 200) data.stockHistory[code].shift();
                data.stockPrices[code] = newPrice;
            }

            saveData(data);
            checkLimitOrders(data);
            checkPriceAlerts(data);
        } catch (e) { console.log(`❌ Price engine: ${e.message}`); }
    }, PRICE_TICK_MS);
}

// ==================== 📋 LIMIT ORDERS ====================

async function checkLimitOrders(data) {
    if (!data.limitOrders || data.limitOrders.length === 0) return;
    const triggered = [];
    const remaining = [];

    for (const order of data.limitOrders) {
        const price = data.stockPrices[order.code];
        const hit = order.action === 'buy' ? price <= order.targetPrice : price >= order.targetPrice;
        if (hit) triggered.push({ ...order, execPrice: price });
        else remaining.push(order);
    }

    if (triggered.length === 0) return;
    data.limitOrders = remaining;

    for (const order of triggered) {
        const { data: freshData, userData } = getUserData(order.userId);
        const total = order.execPrice * order.qty;

        if (order.action === 'buy') {
            if (userData.balance < total) {
                notifyUser(order.userId, `❌ Lệnh giới hạn **MUA ${order.code}** kích hoạt nhưng không đủ tiền! (Cần ${formatMoney(total)} xu)`);
                continue;
            }
            userData.balance -= total;
            const pos = userData.portfolio[order.code];
            pos.avgCost = (pos.avgCost * pos.qty + total) / (pos.qty + order.qty);
            pos.qty += order.qty;
            userData.totalTrades++;
            userData.dailyProfit -= total;
            userData.tradeHistory.unshift({ type: 'buy', code: order.code, qty: order.qty, price: order.execPrice, total, t: new Date().toISOString() });
            if (userData.tradeHistory.length > 30) userData.tradeHistory.pop();
            freshData.totalTransactions++;
            addExp(userData, Math.floor(total / 100_000));
            saveData(freshData);
            notifyUser(order.userId, `✅ **Lệnh giới hạn kích hoạt!** MUA **${order.qty}** cổ phiếu **${order.code}** @ ${formatMoney(order.execPrice)} xu (tổng ${formatMoney(total)} xu)`);
        } else {
            const pos = userData.portfolio[order.code];
            if ((pos?.qty || 0) < order.qty) {
                notifyUser(order.userId, `❌ Lệnh giới hạn **BÁN ${order.code}** kích hoạt nhưng không đủ cổ phiếu!`);
                continue;
            }
            const profit = (order.execPrice - pos.avgCost) * order.qty;
            userData.balance += total;
            pos.qty -= order.qty;
            if (pos.qty === 0) pos.avgCost = 0;
            userData.totalTrades++;
            userData.totalProfit += profit;
            userData.dailyProfit += total;
            userData.tradeHistory.unshift({ type: 'sell', code: order.code, qty: order.qty, price: order.execPrice, total, profit, t: new Date().toISOString() });
            if (userData.tradeHistory.length > 30) userData.tradeHistory.pop();
            freshData.totalTransactions++;
            addExp(userData, Math.floor(Math.abs(profit) / 50_000));
            saveData(freshData);
            notifyUser(order.userId, `💰 **Lệnh giới hạn kích hoạt!** BÁN **${order.qty}** cổ phiếu **${order.code}** @ ${formatMoney(order.execPrice)} xu | ${profit >= 0 ? '📈 Lãi' : '📉 Lỗ'} ${formatMoney(profit)} xu`);
        }
    }
}

// ==================== 🔔 PRICE ALERTS ====================

async function checkPriceAlerts(data) {
    if (!data.priceAlerts) return;
    const toDelete = [];
    for (const [alertId, alert] of Object.entries(data.priceAlerts)) {
        const price = data.stockPrices[alert.code];
        const hit = alert.direction === 'above' ? price >= alert.targetPrice : price <= alert.targetPrice;
        if (hit) {
            notifyUser(alert.userId, `🔔 **CẢNH BÁO GIÁ!** ${STOCKS[alert.code]?.emoji} **${alert.code}** đã ${alert.direction === 'above' ? 'vượt' : 'xuống dưới'} **${formatMoney(alert.targetPrice)} xu** (Giá hiện tại: ${formatMoney(price)} xu)`);
            toDelete.push(alertId);
        }
    }
    if (toDelete.length > 0) {
        for (const id of toDelete) delete data.priceAlerts[id];
        saveData(data);
    }
}

async function notifyUser(userId, message) {
    try {
        const user = await client.users.fetch(userId);
        await user.send(message);
    } catch { }
}

// ==================== 🕐 SESSION SCHEDULER ====================

function scheduleSession() {
    setInterval(async () => {
        const now = new Date();
        const h = now.getHours(), m = now.getMinutes();
        const todayDate = now.toDateString();

        if (h === SESSION_OPEN_HOUR && m === 0) {
            const data = loadData();
            if (data.lastSessionOpen !== todayDate) {
                await doOpenSession(data, todayDate, now, '⏰ Tự động mở phiên 06:00');
            }
        }

        if (h === SESSION_CLOSE_HOUR && m === 0) {
            const data = loadData();
            if (data.lastSessionClose !== todayDate && data.sessionOpen) {
                await doCloseSession(data, todayDate, now, '⏰ Tự động đóng phiên 23:00');
            }
        }
    }, 30_000);
}

async function doOpenSession(data, dateStr, now, reason) {
    const h = now.getHours();
    const isAfterClose = h >= SESSION_CLOSE_HOUR || h < SESSION_OPEN_HOUR;
    if (isAfterClose) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        data.lastSessionOpen = tomorrow.toDateString();
    } else {
        data.lastSessionOpen = dateStr;
    }

    data.sessionOpen = true;
    for (const code of Object.keys(STOCKS)) {
        data.dailyOpen[code] = data.stockPrices[code];
    }
    saveData(data);

    for (const guild of client.guilds.cache.values()) {
        const channel = getAnnounceChannel(guild);
        if (!channel) continue;
        channel.send({
            embeds: [new EmbedBuilder()
                .setTitle('🟢 PHIÊN GIAO DỊCH ĐÃ MỞ!')
                .setDescription(`${reason}\n📅 ${now.toLocaleDateString('vi-VN')} — Giao dịch bắt đầu từ bây giờ!`)
                .setColor(0x00ff88)
                .setTimestamp()
                .setFooter({ text: 'Chúc mọi người giao dịch vui vẻ!' })
            ]
        }).catch(() => { });
    }
    console.log(`[${now.toLocaleTimeString('vi-VN')}] 🟢 Phiên mở! (${reason})`);
}

async function doCloseSession(data, dateStr, now, reason) {
    const results = Object.entries(data.users).map(([uid, u]) => ({ uid, profit: u.dailyProfit || 0 }));
    results.sort((a, b) => b.profit - a.profit);
    for (const u of Object.values(data.users)) u.dailyProfit = 0;

    const richList = Object.entries(data.users).map(([uid, u]) => ({
        uid, total: calcNetWorth(u, data.stockPrices)
    })).sort((a, b) => b.total - a.total);

    data.sessionOpen = false;
    data.lastSessionClose = dateStr;
    saveData(data);

    for (const guild of client.guilds.cache.values()) {
        const channel = getAnnounceChannel(guild);
        if (!channel) continue;

        const emojis = ['🥇', '🥈', '🥉', '4.', '5.'];
        let topProfit = '';
        for (let i = 0; i < Math.min(5, results.length); i++) {
            const { uid, profit } = results[i];
            const member = guild.members.cache.get(uid);
            const name = member ? member.displayName : `#${uid.slice(0, 5)}`;
            topProfit += `${emojis[i]} **${name}**: ${profit >= 0 ? '+' : ''}${formatMoney(profit)} xu\n`;
        }

        const richEmoji = ['👑', '💎', '🔱', '⭐', '🌟'];
        let topRich = '';
        for (let i = 0; i < Math.min(5, richList.length); i++) {
            const { uid, total } = richList[i];
            const member = guild.members.cache.get(uid);
            const name = member ? member.displayName : `#${uid.slice(0, 5)}`;
            topRich += `${richEmoji[i]} **${name}**: ${formatMoney(total)} xu\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle('🔴 PHIÊN GIAO DỊCH ĐÃ ĐÓNG!')
            .setDescription(`${reason}\n📅 ${now.toLocaleDateString('vi-VN')} — Phiên kết thúc. Phiên mới sẽ mở lúc 06:00 sáng mai!`)
            .setColor(0xe74c3c)
            .setTimestamp()
            .addFields(
                { name: '💰 TOP LÃI RÒNG HÔM NAY', value: topProfit || '*Chưa có dữ liệu*', inline: false },
                { name: '🏆 TOP NGƯỜI GIÀU SERVER', value: topRich || '*Chưa có dữ liệu*', inline: false }
            );
        channel.send({ embeds: [embed] }).catch(() => { });
    }
    console.log(`[${now.toLocaleTimeString('vi-VN')}] 🔴 Phiên đóng! (${reason})`);
}

function getAnnounceChannel(guild) {
    return guild.channels.cache.find(c => c.name === ANNOUNCE_CHANNEL_NAME && c.isTextBased())
        || guild.channels.cache.filter(c => c.isTextBased()).first();
}

// ==================== 📰 TIN TỨC NGẪU NHIÊN ====================

function startNewsEngine() {
    function scheduleNext() {
        const delay = (Math.random() * 60 + 30) * 60_000;
        setTimeout(async () => {
            try {
                const data = loadData();
                if (!data.sessionOpen) { scheduleNext(); return; }

                const codes = Object.keys(STOCKS);
                const code = codes[Math.floor(Math.random() * codes.length)];
                const info = STOCKS[code];
                const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
                const text = template.text.replace('{name}', info.name).replace('{sector}', info.sector);
                const [minImpact, maxImpact] = template.impact;
                const impact = minImpact + Math.random() * (maxImpact - minImpact);
                const oldPrice = data.stockPrices[code];
                let newPrice = Math.round(oldPrice * (1 + impact) * 10) / 10;
                if (newPrice < 100) newPrice = 100;
                data.stockPrices[code] = newPrice;
                saveData(data);

                const pct = (impact * 100).toFixed(1);
                const isPos = impact >= 0;

                for (const guild of client.guilds.cache.values()) {
                    const channel = getAnnounceChannel(guild);
                    if (!channel) continue;
                    const embed = new EmbedBuilder()
                        .setTitle(`📰 TIN TỨC THỊ TRƯỜNG${isPos ? ' — TÍN HIỆU TÍCH CỰC' : ' — CẢNH BÁO'}`)
                        .setDescription(`**${text}**`)
                        .setColor(isPos ? 0x00ff88 : 0xff4444)
                        .addFields(
                            { name: `${info.emoji} ${code} — ${info.name}`, value: `${formatMoney(oldPrice)} xu → **${formatMoney(newPrice)} xu**`, inline: true },
                            { name: isPos ? '📈 Tác động' : '📉 Tác động', value: `${isPos ? '+' : ''}${pct}%`, inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: '💡 Tin tức ảnh hưởng trực tiếp đến giá cổ phiếu!' });
                    channel.send({ embeds: [embed] }).catch(() => { });
                }

                if (impact < -0.07) {
                    for (const [uid, uData] of Object.entries(data.users)) {
                        if ((uData.portfolio[code]?.qty || 0) > 0) {
                            const unlocked = checkAchievements(uData, data, { newsVictim: true });
                            if (unlocked.length > 0) {
                                saveData(data);
                                notifyUser(uid, `🏅 Mở khóa thành tích: **${ACHIEVEMENTS.find(a => a.id === 'news_victim')?.name}**!`);
                            }
                        }
                    }
                }
            } catch (e) { console.log(`❌ News engine: ${e.message}`); }
            scheduleNext();
        }, delay);
    }
    scheduleNext();
}

// ==================== 🏦 MARGIN / LÃNH SUẤT ====================

function applyMarginInterest() {
    setInterval(() => {
        try {
            const data = loadData();
            let changed = false;
            for (const [uid, uData] of Object.entries(data.users)) {
                const m = uData.margin;
                if (!m || !m.borrowed || m.borrowed <= 0 || !m.borrowedAt) continue;
                const days = (Date.now() - new Date(m.borrowedAt).getTime()) / 86_400_000;
                const interest = Math.floor(m.borrowed * 0.005 * days);
                if (interest > 0) {
                    uData.balance -= interest;
                    m.borrowedAt = new Date().toISOString();
                    changed = true;
                    const nw = calcNetWorth(uData, data.stockPrices);
                    if (nw < m.borrowed * 0.5) {
                        for (const [code, pos] of Object.entries(uData.portfolio)) {
                            if (pos.qty > 0) {
                                const val = pos.qty * (data.stockPrices[code] || 0);
                                uData.balance += val;
                                pos.qty = 0; pos.avgCost = 0;
                            }
                        }
                        uData.balance -= m.borrowed;
                        m.borrowed = 0; m.borrowedAt = null;
                        notifyUser(uid, '⚠️ **MARGIN CALL!** Tài sản của bạn đã bị thanh lý tự động để trả khoản vay margin!');
                    }
                }
            }
            if (changed) saveData(data);
        } catch (e) { console.log(`❌ Margin interest: ${e.message}`); }
    }, 60_000);
}

// ==================== 📢 THÔNG BÁO GIAO DỊCH LỚN ====================

async function announceHugeTrade(guild, user, type, code, qty, total, mapStage = 1) {
    const channel = getAnnounceChannel(guild);
    if (!channel) return;
    const info = STOCKS[code];
    const currencyText = mapStage === 2 ? 'CAD' : 'xu';
        const embed = new EmbedBuilder()
            .setTitle('🚨 GIAO DỊCH KHỦNG TRÊN SÀN!')
            .setDescription(`${user} vừa thực hiện giao dịch **${formatCurrency(total, currencyText)}**!`)
            .setColor(type === 'buy' ? 0x00ff00 : 0xff6600)
            .addFields(
                { name: 'Loại', value: type === 'buy' ? '🟢 MUA VÀO' : '🔴 BÁN RA', inline: true },
                { name: `${info.emoji} Cổ phiếu`, value: `**${code}** - ${info.name}`, inline: true },
                { name: 'Số lượng', value: `${qty.toLocaleString()} cp`, inline: true },
                { name: 'Giá trị', value: `**${formatCurrency(total, currencyText)}**`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Cá mập đang di chuyển - hãy chú ý!' });
    channel.send({ content: '@everyone 🚨 **CÁ MẬP VÀO SÀN!**', embeds: [embed] }).catch(() => { });
}

// ==================== 🎨 EMBEDS ====================

function createProfileEmbed(userObj, data, userData) {
    const titleInfo = getTitle(userData.level);
    let totalStockValue = 0;
    let portfolioLines = '';
    for (const [code, pos] of Object.entries(userData.portfolio)) {
        if (pos.qty > 0) {
            const price = data.stockPrices[code] || 0;
            const val = pos.qty * price;
            const pnl = val - pos.qty * pos.avgCost;
            totalStockValue += val;
            const info = STOCKS[code] || {};
            portfolioLines += `${info.emoji} **${code}** x${pos.qty} — ${formatMoney(val)} xu (${pnl >= 0 ? '+' : ''}${formatMoney(pnl)})\n`;
        }
    }

    let shortLines = '';
    for (const [code, short] of Object.entries(userData.shortPositions || {})) {
        if (short.qty > 0) {
            const price = data.stockPrices[code] || 0;
            const pnl = (short.openPrice - price) * short.qty;
            shortLines += `📉 **${code}** x${short.qty} short — ${pnl >= 0 ? '+' : ''}${formatMoney(pnl)} xu\n`;
        }
    }

    const netWorth = userData.balance + totalStockValue + (userData.bank?.savings || 0);
    // Cập nhật peak net worth
    if (netWorth > (userData.peakNetWorth || 0)) userData.peakNetWorth = netWorth;

    const expNeeded = expToNextLevel(userData.level, userData.mapStage || 1);
    const expBar = Math.floor((userData.exp / expNeeded) * 10);
    const expDisplay = '🟦'.repeat(expBar) + '⬛'.repeat(10 - expBar);

    const achs = (userData.achievements || []).map(id => {
        const a = ACHIEVEMENTS.find(x => x.id === id);
        return a ? a.emoji : '';
    }).join(' ');

    // Credit score
    const creditScore = userData.creditScore || 700;
    const creditTier = getCreditTier(creditScore);
    const creditBar = Math.floor((creditScore / 1000) * 10);
    const creditDisplay = '🟩'.repeat(creditBar) + '⬛'.repeat(10 - creditBar);

    // Investor badges
    const badgesDisplay = (userData.investorBadges || []).map(id => {
        const b = INVESTOR_BADGES.find(x => x.id === id);
        return b ? b.emoji : '';
    }).join(' ') || '*Chưa có*';

    // Mở khóa tính năng theo level
    const lvl = userData.level || 1;
    const unlockedFeatures = [];
    if (lvl >= 10) unlockedFeatures.push('🎰 Slot');
    if (lvl >= 20) unlockedFeatures.push('🎲 Dice');
    if (lvl >= 25) unlockedFeatures.push('🗺️ Map 2');
    if (lvl >= 50) unlockedFeatures.push('🌌 Map 3');
    const featureText = unlockedFeatures.length > 0 ? unlockedFeatures.join(' | ') : '*Lên lv 10 để mở Slot*';

    const depositStatus = userData.bank?.depositActive ? `🟢 Đang gửi ${formatMoney(userData.bank.depositAmount || 0)} xu đến ${new Date(userData.bank.depositDueAt).toLocaleString('vi-VN')}` : '⚪ Không có khoản gửi đang hoạt động';
    const loanStatus = userData.margin?.borrowed > 0 ? `🔴 Nợ ${formatMoney(userData.margin.borrowed)} xu, hạn ${new Date(userData.margin.dueAt).toLocaleString('vi-VN')}` : '🟢 Không có khoản vay';
    const banStatus = userData.tradeBanUntil && new Date(userData.tradeBanUntil).getTime() > Date.now() ? `⛔ Cấm giao dịch đến ${new Date(userData.tradeBanUntil).toLocaleString('vi-VN')}` : '✅ Có thể giao dịch';
    const bankruptcyStatus = userData.bankruptcy ? `💥 ${userData.bankruptcy.reason}` : '—';

    const embed = new EmbedBuilder()
        .setTitle(`${titleInfo.emoji} ${titleInfo.title}  —  ${userObj.displayName || userObj.username}`)
        .setThumbnail(userObj.displayAvatarURL?.() || null)
        .setColor(titleInfo.color)
        .setTimestamp()
        .addFields(
            { name: '🆔 ID sàn Map 1', value: `${userData.exchangeId || 'Chưa đăng ký'}`, inline: true },
            { name: '🆔 ID sàn Map 2', value: `${userData.map2ExchangeId || 'Chưa đăng ký'}`, inline: true },
            { name: '🆔 ID sàn Map 3', value: `${userData.map3ExchangeId || 'Chưa đăng ký'}`, inline: true },
            { name: `💰 Ví ${getCurrencyUnit(userData.mapStage||1)} (hiện tại)`, value: `**${fmtCur(getWallet(userData), userData.mapStage||1)}**`, inline: true },
            { name: '🏦 Tiết kiệm', value: `${fmtCur(userData.bank?.savings||0, userData.mapStage||1)}`, inline: true },
            { name: '💎 Tổng tài sản', value: `${fmtCur(netWorth, userData.mapStage||1)}`, inline: true },
            { name: '💼 Ví 3 map', value: `🇻🇳 VND: ${fmtCur(userData.balanceVND||0,1)}\n🇨🇦 CAD: ${fmtCur(userData.balanceCAD||0,2)}\n🇺🇸 USD: ${fmtCur(userData.balanceUSD||0,3)}`, inline: false },
            { name: '⭐ Level', value: `**${userData.level}**`, inline: true },
            { name: '🔄 Tổng GD', value: `${userData.totalTrades}`, inline: true },
            { name: '📊 Margin nợ', value: userData.margin?.borrowed > 0 ? `${formatMoney(userData.margin.borrowed)} xu` : 'Không có', inline: true },
            { name: `💳 Tín nhiệm: ${creditScore}/1000 — ${creditTier.label}`, value: creditDisplay, inline: false },
            { name: '📈 Thống kê chi tiết', value: [
                `💹 Tổng lợi nhuận: **${formatMoney(userData.totalProfit||0)} xu**`,
                `💸 GD đơn lớn nhất: **${formatMoney(userData.maxSingleTrade||0)} xu**`,
                `🏆 Tài sản đỉnh cao: **${formatMoney(userData.peakNetWorth||0)} xu**`,
                `🎰 Slot: ${userData.slotPlays||0} ván (W:${userData.slotWins||0}/L:${userData.slotLosses||0})`,
                `🎲 Dice: ${userData.dicePlays||0} ván (W:${userData.diceWins||0}/L:${userData.diceLosses||0})`,
                `🏦 Vay vốn: trả đúng hạn ${userData.timesRepaidOnTime||0} lần | bị siết ${userData.timesLiquidated||0} lần`,
                `📅 Tham gia: ${userData.joinedAt ? new Date(userData.joinedAt).toLocaleDateString('vi-VN') : 'N/A'}`,
            ].join('\n'), inline: false },
            { name: '🏦 Gửi ngân hàng', value: depositStatus, inline: false },
            { name: '💸 Vay vốn', value: loanStatus, inline: false },
            { name: '⚖️ Trạng thái', value: `${banStatus}\n${bankruptcyStatus}`, inline: false },
            { name: '🔓 Tính năng đã mở', value: featureText, inline: false },
            { name: '🗺️ Chuyển map', value: userData.mapSwitchCooldownUntil && new Date(userData.mapSwitchCooldownUntil).getTime() > Date.now() ? `⏳ Chờ quay lại map trước: ${getTimeRemaining(new Date(userData.mapSwitchCooldownUntil).getTime())}` : '✅ Có thể đổi sang map khác', inline: false },
            { name: `📈 EXP (${userData.exp}/${expNeeded})`, value: expDisplay, inline: false },
            { name: '📦 Danh mục', value: portfolioLines || '*Chưa có cổ phiếu*', inline: false }
        );
    if (shortLines) embed.addFields({ name: '📉 Vị thế Short', value: shortLines, inline: false });
    if (achs) embed.addFields({ name: '🏅 Thành tích', value: achs || '*Chưa có*', inline: false });
    embed.addFields({ name: '🏷️ Danh hiệu NĐT', value: badgesDisplay, inline: false });
    embed.setFooter({ text: `ID: ${userObj.id} | !credit — lịch sử tín nhiệm | !badges — danh hiệu` });
    return embed;
}

function createMarketEmbed(data, userData) {
    const mapStage = userData?.mapStage || 1;
    const codes = getUserStockCodes(userData);
    const status = data.sessionOpen ? '🟢 ĐANG MỞ' : '🔴 ĐÓNG PHIÊN';
    const embed = new EmbedBuilder()
        .setTitle(`📈 THỊ TRƯỜNG CHỨNG KHOÁN MAP ${mapStage} — LIVE [${status}]`)
        .setDescription(`Cập nhật: ${new Date().toLocaleTimeString('vi-VN')} | ${codes.length} mã`) 
        .setColor(data.sessionOpen ? 0x2c3e50 : 0x7f8c8d)
        .setTimestamp();

    const renderCol = (list) => list.map(code => {
        const info = STOCKS[code];
        const price = data.stockPrices[code];
        const open = data.dailyOpen[code] || price;
        const diff = price - open;
        const pct = ((diff / open) * 100).toFixed(2);
        const arrow = diff >= 0 ? '🟢' : '🔴';
        return `${arrow} **${code}** ${fmtCur(price, userData.mapStage||1)} (${diff >= 0 ? '+' : ''}${pct}%)`;
    }).join('\n');

    const half = Math.ceil(codes.length / 2);
    embed.addFields(
        { name: '📊 Cổ phiếu (1-' + half + ')', value: renderCol(codes.slice(0, half)), inline: true },
        { name: '📊 Cổ phiếu (' + (half + 1) + '-' + codes.length + ')', value: renderCol(codes.slice(half)), inline: true }
    );
    embed.setFooter({ text: '!cp [MÃ] xem chi tiết | Dropdown để giao dịch' });
    return embed;
}

function createStockDetailEmbed(code, data, userData) {
    const info = STOCKS[code];
    const price = data.stockPrices[code];
        const open = data.dailyOpen[code] || price; 
        const diff = price - open; 
    const pct = ((diff / open) * 100).toFixed(2);
    const history = (data.stockHistory[code] || []).slice(-30);
    const prices = history.map(h => h.p);
    let chart = '';
    if (prices.length >= 2) {
        const mn = Math.min(...prices), mx = Math.max(...prices);
        const range = mx - mn || 1;
        chart = prices.map(p => ['▁', '▂', '▃', '▄', '▅'][Math.round(((p - mn) / range) * 4)]).join('');
    }

    let holders = [];
    for (const [uid, uData] of Object.entries(data.users)) {
        const pos = uData.portfolio[code];
        if (pos && pos.qty > 0) holders.push({ uid, qty: pos.qty, val: pos.qty * price, currency: uData.currency || 'VND' });
    }
    holders.sort((a, b) => b.qty - a.qty);
    let holderText = holders.length === 0 ? '*Chưa có ai sở hữu*' : '';
    for (let i = 0; i < Math.min(5, holders.length); i++) {
        const h = holders[i];
        const member = client.guilds.cache.first()?.members.cache.get(h.uid);
        const name = member ? member.displayName : `#${h.uid.slice(0, 5)}`;
        holderText += `${i === 0 ? '🐋' : '🐟'} **${name}**: ${h.qty.toLocaleString()} cp (${formatCurrency(h.val, 'VND')})\n`;
    }

    const pending = (data.limitOrders || []).filter(o => o.code === code);
    const pendText = pending.length === 0 ? '*Không có*' :
        pending.map(o => `${o.action === 'buy' ? '🟢' : '🔴'} x${o.qty} @ ${formatCurrency(o.targetPrice, userData?.currency || 'VND')}`).join('\n').slice(0, 300);

    return new EmbedBuilder()
        .setTitle(`${info.emoji} ${code} — ${info.name}`)
        .setColor(diff >= 0 ? 0x00ff88 : 0xff4444)
        .setTimestamp()
        .addFields(
            { name: '💰 Giá hiện tại', value: `**${fmtCur(price, userData?.mapStage||1)}**`, inline: true },
            { name: '📂 Mở cửa', value: `${formatCurrency(open, userData?.currency || 'VND')}`, inline: true },
            { name: diff >= 0 ? '📈 Tăng' : '📉 Giảm', value: `${diff >= 0 ? '+' : ''}${pct}%`, inline: true },
            { name: '🏭 Ngành', value: info.sector, inline: true },
            { name: '👥 Người ôm', value: `${holders.length}`, inline: true },
            { name: '📊 Biểu đồ 30 tick', value: chart ? `\`${chart}\`` : '*Chưa đủ data*', inline: false },
            { name: '🐋 Top người ôm nhiều nhất', value: holderText, inline: false },
            { name: '⏰ Lệnh giới hạn đang chờ', value: pendText, inline: false }
        )
        .setFooter({ text: `Độ biến động: ${(info.volatility * 100).toFixed(1)}% mỗi tick` });
}

function createTopEmbed(data, guild) {
    const list = Object.entries(data.users).map(([uid, uData]) => ({
        uid,
        total: calcNetWorth(uData, data.stockPrices),
        level: uData.level,
        titleInfo: getTitle(uData.level)
    })).sort((a, b) => b.total - a.total).slice(0, 10);

    const medals = ['🥇', '🥈', '🥉', '4.', '5.', '6.', '7.', '8.', '9.', '10.'];
    let desc = '';
    for (let i = 0; i < list.length; i++) {
        const { uid, total, titleInfo } = list[i];
        const member = guild.members.cache.get(uid);
        const name = member ? member.displayName : `#${uid.slice(0, 5)}`;
        desc += `${medals[i]} **${name}** ${titleInfo.emoji}\n┗ ${formatMoney(total)} xu\n`;
    }
    return new EmbedBuilder()
        .setTitle('🏆 BẢNG XẾP HẠNG TỶ PHÚ SERVER')
        .setDescription(desc || '*Chưa có ai*')
        .setColor(0xffd700)
        .setTimestamp()
        .setFooter({ text: 'Tổng tài sản = tiền mặt + tiết kiệm + danh mục' });
}

// ==================== 🎛️ UI ====================

function createMarketView(userId) {
    const { data, userData } = getUserData(userId);
    const codes = getUserStockCodes(userData);

    const makeOptions = (list) => list.map(code => {
        const info = STOCKS[code];
        const price = data.stockPrices[code];
        return new StringSelectMenuOptionBuilder()
            .setLabel(`[${code}] ${info.name}`)
            .setDescription(`${fmtCur(price, userData.mapStage||1)} | ${info.sector}`)
            .setValue(`buy_${code}`);
    });
    const makeSellOptions = (list) => list.filter(code => (userData.portfolio[code]?.qty || 0) > 0).map(code => {
        const info = STOCKS[code];
        const price = data.stockPrices[code];
        return new StringSelectMenuOptionBuilder()
            .setLabel(`[${code}] ${info.name} (${userData.portfolio[code].qty.toLocaleString()} cp)`)
            .setDescription(`${fmtCur(price, userData.mapStage||1)} | ${info.sector}`)
            .setValue(`sell_${code}`);
    });

    const half = Math.ceil(codes.length / 2);
    const buyMenu1 = new StringSelectMenuBuilder().setCustomId(`buy1_${userId}`).setPlaceholder(`🟢 MUA cổ phiếu (1-${half})`).addOptions(makeOptions(codes.slice(0, half)));
    const buyMenu2 = new StringSelectMenuBuilder().setCustomId(`buy2_${userId}`).setPlaceholder(`🟢 MUA cổ phiếu (${half + 1}-${codes.length})`).addOptions(makeOptions(codes.slice(half)));
    const sellOptions = makeSellOptions(codes);
    const sellMenu = new StringSelectMenuBuilder().setCustomId(`sell_${userId}`).setPlaceholder('🔴 BÁN cổ phiếu')
        .addOptions(sellOptions.length > 0 ? sellOptions : [new StringSelectMenuOptionBuilder().setLabel('Chưa có cổ phiếu để bán').setDescription('Hãy mua trước!').setValue('no_stock')]);

    return {
        components: [
            new ActionRowBuilder().addComponents(buyMenu1),
            new ActionRowBuilder().addComponents(buyMenu2),
            new ActionRowBuilder().addComponents(sellMenu)
        ]
    };
}

function createProfileView(userId) {
    return {
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`btn_market_${userId}`).setLabel('📈 Giá').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`btn_top_${userId}`).setLabel('🏆 Top').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`btn_daily_${userId}`).setLabel('🎁 Daily').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`btn_refresh_${userId}`).setLabel('🔄 Refresh').setStyle(ButtonStyle.Secondary)
            )
        ]
    };
}

// ==================== 🚀 READY ====================

client.once(Events.ClientReady, async () => {
    console.log('='.repeat(60));
    console.log('BOT CHỨNG KHOÁN v4 — 20 CỔ PHIẾU + FULL FEATURES');
    console.log('='.repeat(60));
    console.log(`Đăng nhập: ${client.user.tag}`);
    startPriceEngine();
    scheduleSession();
    startNewsEngine();
    applyMarginInterest();
    startMarketCrisisEngine();
    console.log('Price engine + Session + News + Margin interest + Crisis engine đã khởi động!');
    console.log('='.repeat(60));
});

// ==================== 📋 COMMANDS ====================

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const uid = message.author.id;

    // ── Chống spam lệnh (anti-macro/anti-bot) ──
    const NO_COOLDOWN_CMDS = ['help', 'h', 'huongdan', 'guide'];
    if (!NO_COOLDOWN_CMDS.includes(command) && isOnCommandCooldown(uid)) {
        return message.reply('⏳ Bạn đang gõ lệnh quá nhanh! Chờ một chút rồi thử lại.').catch(() => {});
    }

    if (!['help','h','help2','h2','dangky','register','dangnhap','dn','top','rank','price','stocks','p','gia','market','cp','xem','map','san','admin','huongdan','guide','huongdancanban','chart','bieudo','compare','sosanh','achievements','thanhtich','profile','me','info','bds','realestate','mylimits','lghan','myalerts','cbtoi','history','lichsu','bank','nh','credit','tinnhiem','badges','danhieu','stats','thongke'].includes(command)) {
        const data = loadData();
        const userData = data.users?.[uid];
        if (isTradeBanned(userData)) return message.reply(`❌ Bạn đang bị cấm giao dịch đến ${new Date(userData.tradeBanUntil).toLocaleString('vi-VN')}.`);
    }

    // ===== HELP =====
    if (['help', 'h'].includes(command)) {
        const embed = new EmbedBuilder()
            .setTitle('📚 DANH SÁCH LỆNH')
            .setColor(0x3498db)
            .addFields(
                { name: '🆕 BẮT ĐẦU', value: '`!dangky` — Đăng ký chơi (Map 1)\n`!huongdan` — Hướng dẫn cơ bản cho người mới\n`!dangnhap`/`!dn` — Đăng nhập sàn của map hiện tại', inline: false },
                { name: '📊 XEM', value: '`!price`/`!gia`/`!p` — Giá + dropdown giao dịch\n`!cp`/`!xem MÃ` — Chi tiết 1 mã (biểu đồ 30 tick)\n`!chart`/`!bieudo MÃ1 MÃ2...` — So biểu đồ nhiều mã\n`!compare`/`!sosanh MÃ1 MÃ2` — So sánh 2 mã\n`!profile`/`!me` — Hồ sơ của bạn\n`!top`/`!rank` — Bảng xếp hạng\n`!map`/`!san` — Thông tin & đổi map', inline: false },
                { name: '💰 GIAO DỊCH CỔ PHIẾU', value: '`!buy`/`!mua MÃ SL` — Mua\n`!sell`/`!ban MÃ SL` — Bán\n`!short`/`!khong MÃ SL` — Bán khống\n`!cover`/`!dong MÃ SL` — Đóng short\n`!limit`/`!gh [buy/sell] MÃ GIÁ SL` — Lệnh giới hạn\n`!mylimits`/`!lghan` — Lệnh giới hạn của bạn\n`!cancellimit`/`!huygh ID` — Hủy lệnh giới hạn', inline: false },
                { name: '🏠 BẤT ĐỘNG SẢN', value: '`!bds` — Xem danh sách BĐS của map\n`!bds mua MÃ` — Mua bất động sản\n`!bds ban MÃ_SỞ_HỮU` — Bán lại (phí 3%)\n`!bds tui` — BĐS bạn đang sở hữu', inline: false },
                { name: '🏦 NGÂN HÀNG & MARGIN', value: '`!bank`/`!nh` — Xem ngân hàng\n`!deposit`/`!tkiem SỐ NGÀY` — Gửi tiết kiệm (lãi 2%/ngày)\n`!withdraw`/`!rut SỐ` — Rút tiết kiệm\n`!transfer`/`!ck @user SỐ` — Chuyển tiền (phí 2%)\n`!borrow`/`!vay SỐ NGÀY` — Vay margin\n`!repay`/`!travay SỐ` — Trả margin', inline: false },
                { name: '🎮 VUI VẺ', value: '`!daily`/`!dd` — Thưởng hàng ngày\n`!dice`/`!xx SỐ` — Xúc xắc\n`!slot`/`!quay SỐ` — Máy đánh bạc\n`!history`/`!lichsu` — Lịch sử giao dịch\n`!achievements`/`!thanhtich` — Thành tích', inline: false },
                { name: '🔔 CẢNH BÁO GIÁ', value: '`!alert`/`!cb MÃ GIÁ` — Đặt cảnh báo\n`!myalerts`/`!cbtoi` — Xem cảnh báo của bạn', inline: false },
                { name: '💳 TÍN NHIỆM & DANH HIỆU', value: '`!credit`/`!tinnhiem` — Điểm tín nhiệm\n`!badges`/`!danhieu` — Danh hiệu Nhà Đầu Tư\n`!stats [@user]`/`!thongke` — Hồ sơ thống kê', inline: false },
                { name: '👑 ADMIN', value: '`!admin` — Panel quản trị (chỉ admin)', inline: false }
            )
            .setFooter({ text: 'Đóng phiên 23:00 | Mở phiên 06:00 mỗi ngày | !help2 để xem thêm lệnh nâng cao' });
        return message.reply({ embeds: [embed] });
    }

    // ===== REGISTER =====
    if (['dangky', 'register'].includes(command)) {
        const data = loadData();
        const existingUser = data.users?.[uid];
        // Chặn đăng ký lần 2 (trừ khi đã bị admin reset)
        if (existingUser && isRegistered(existingUser, 1)) {
            return message.reply(`❌ Bạn đã đăng ký rồi!
🆔 ID sàn Map 1: **${existingUser.exchangeId}**
Chỉ có thể đăng ký lại nếu admin reset tài khoản.`);
        }
        const userData = registerUser(data, uid, 1);
        saveData(data);
        if (!userData.exchangeId) return message.reply('❌ Lỗi đăng ký, vui lòng thử lại sau.');
        return message.reply({ embeds: [new EmbedBuilder()
            .setTitle('✅ ĐĂNG KÝ THÀNH CÔNG!')
            .setColor(0x2ecc71)
            .setDescription(`Chào mừng đến với **Sàn Giao Dịch Map 1**!\n🆔 ID sàn: **${userData.exchangeId}**\n💰 Số dư khởi đầu: **${fmtCur(userData.balanceVND || INITIAL_MONEY, 1)}**`)
            .addFields(
                { name: '🚀 Bắt đầu', value: '`!price` — Xem giá thị trường\n`!buy MÃ SỐ` — Mua cổ phiếu\n`!profile` — Xem tài khoản' },
                { name: '⚠️ Lưu ý', value: 'Mỗi tài khoản chỉ được đăng ký **1 lần**. ID sàn không thay đổi trừ khi admin reset.' }
            )
            .setTimestamp()
        ] });
    }

    if (['dangnhap', 'dn'].includes(command)) {
        const data = loadData();
        const userData = ensureUserData(data, uid);
        const mapStage = userData.mapStage || 1;
        // Đăng nhập = đăng ký sàn của map hiện tại
        const registered = registerUser(data, uid, mapStage);
        saveData(data);
        const exchangeId = mapStage === 3 ? registered.map3ExchangeId : mapStage === 2 ? registered.map2ExchangeId : registered.exchangeId;
        return message.reply({ embeds: [new EmbedBuilder()
            .setTitle(`✅ ĐĂNG NHẬP SÀN MAP ${mapStage} THÀNH CÔNG`)
            .setColor(mapStage === 3 ? 0x9b59b6 : mapStage === 2 ? 0x1abc9c : 0x3498db)
            .setDescription(`Bạn đã đăng nhập sàn **Map ${mapStage}** (${MAP_CURRENCY[mapStage]}).
ID sàn: **${exchangeId}**

Dùng \`!price\`, \`!buy MÃ SỐ\` để bắt đầu giao dịch!`)
        ] });
    }

    // ===== MARKET =====
    if (command === 'market') {
        const { data, userData } = getUserData(uid);
        return message.reply({ embeds: [createMarketEmbed(data, userData)], components: createMarketView(uid).components });
    }

    // ===== PRICE =====
    if (['price', 'stocks', 'p', 'gia'].includes(command)) {
        const data = loadData();
        const userData = ensureUserData(data, uid);
        saveData(data);
        // Nếu chưa đăng ký thì chỉ show embed, không có dropdown giao dịch
        if (!isRegistered(userData, userData.mapStage || 1)) {
            return message.reply({
                embeds: [createMarketEmbed(data, userData)],
                content: '⚠️ Dùng `!dangky` để đăng ký và mở khóa giao dịch!'
            });
        }
        const view = createMarketView(uid);
        return message.reply({ embeds: [createMarketEmbed(data, userData)], components: view.components });
    }

    // ===== MAP =====
    if (['map', 'san'].includes(command)) {
        const { data, userData } = getUserData(uid);
        const mapStage = userData.mapStage || 1;
        const targetArg = args[0]?.toLowerCase();
        const targetStage = targetArg === '1' || targetArg === 'map1' || targetArg === 'm1' ? 1 : targetArg === '2' || targetArg === 'map2' || targetArg === 'm2' ? 2 : targetArg === '3' || targetArg === 'map3' || targetArg === 'm3' ? 3 : null;
        if (targetStage !== null) {
            if (targetStage === mapStage) return message.reply(`ℹ️ Bạn đang ở Map ${mapStage} rồi.`);
            // Kiểm tra điều kiện mở map
            // Quay lại map cũ đã mở: luôn được, không cần điều kiện
            // Lần đầu mở map mới: cần đủ level + tài sản của map hiện tại
            const alreadyUnlocked = targetStage === 2
                ? isRegistered(userData, 2)
                : targetStage === 3 ? isRegistered(userData, 3) : true;

            const netWorth = calcNetWorth(userData, data.stockPrices);

            if (!alreadyUnlocked) {
                const req = MAP_UNLOCK_REQUIREMENTS[targetStage];
                if (!req) return message.reply('❌ Chỉ hỗ trợ Map 1, 2, 3.');
                const currentWallet = getWallet(userData);
                const totalAssets = currentWallet + (userData.bank?.savings || 0) +
                    Object.entries(userData.portfolio).reduce((s, [c, p]) => s + p.qty * (data.stockPrices[c] || 0), 0);
                if (userData.level < req.level || totalAssets < req.netWorth) {
                    return message.reply([
                        `❌ **Chưa đủ điều kiện mở Map ${targetStage}!**`,
                        `📊 Level: **${userData.level}** / cần **${req.level}**`,
                        `💰 Tài sản (${getCurrencyUnit(mapStage)}): **${fmtCur(totalAssets, mapStage)}** / cần **${fmtCur(req.netWorth, mapStage)}**`,
                    ].join('\n'));
                }
            }
                        // ── Logic chuyển map ──
            // Mỗi map có ví tiền độc lập (VND / CAD / USD).
            // Lần đầu lên map cao hơn → quy đổi tiền từ map thấp sang.
            // Quay về map cũ → dùng ví cũ, KHÔNG quy đổi ngược.
            // Tiền đã quy đổi không hoàn lại.

            let conversionNote = '';
            const isFirstVisit = targetStage === 2
                ? !isRegistered(userData, 2)
                : targetStage === 3 ? !isRegistered(userData, 3) : false;

            // ⚠️ FIX: quy đổi tiền KHÔNG phụ thuộc vào việc bạn đang đứng ở map nào
            // (trước đây chỉ quy đổi nếu mapStage hiện tại == map liền trước, nên nếu
            // bạn đã từng ghé Map 2 rồi quay về Map 1 và gõ thẳng !map 3, tiền sẽ KHÔNG
            // được quy đổi vì check `mapStage === 2` sai). Giờ luôn quy đổi từ ví map
            // liền trước (CAD cho Map3, VND cho Map2) bất kể đang ở map nào.
            if (isFirstVisit && targetStage === 2) {
                // Lần đầu lên Map 2: 1.000.000 VND = 1 CAD
                const vnd = userData.balanceVND || 0;
                const cad = Math.floor(vnd / 1_000_000);
                userData.balanceCAD = (userData.balanceCAD || 0) + cad;
                conversionNote = `\n💱 Quy đổi lần đầu: **${formatMoney(vnd)} ₫** → **C$${formatMoney(cad)}** (1.000.000 VND = 1 CAD)\n⚠️ Tiền VND đã quy đổi, không hoàn lại khi quay về Map 1.`;
            } else if (isFirstVisit && targetStage === 3) {
                // Lần đầu lên Map 3: 1.000.000 CAD = 1 USD
                const cad = userData.balanceCAD || 0;
                const usd = Math.floor(cad / 1_000_000);
                userData.balanceUSD = (userData.balanceUSD || 0) + usd;
                conversionNote = `\n💱 Quy đổi lần đầu: **C$${formatMoney(cad)}** → **$${formatMoney(usd)}** (1.000.000 CAD = 1 USD)\n⚠️ Tiền CAD đã quy đổi, không hoàn lại khi quay về Map 2.`;
                if (usd === 0) {
                    conversionNote += `\n⚠️ Bạn quy đổi ra **0 USD** vì CAD chưa đủ 1.000.000. Hãy tích lũy thêm CAD trước khi qua Map 3 để không bị mất trắng vốn quy đổi.`;
                }
            } else if (!isFirstVisit) {
                // Quay lại map cũ hoặc map đã mở → dùng ví cũ, không đổi tiền
                conversionNote = `\n🔄 Quay lại Map ${targetStage} — dùng ví **${getCurrencyUnit(targetStage)}** đã lưu.`;
            }

            // Chuyển map — giữ nguyên các ví, chỉ đổi mapStage & portfolio
            userData.mapStage = targetStage;
            userData.currency = MAP_CURRENCY[targetStage] || 'VND';
            // Đồng bộ balance alias với ví của map mới
            userData.balance = getWallet(userData);
            // Reset danh mục & bank sang map mới (bank riêng theo map)
            userData.bank = { savings: 0, depositedAt: null, depositAmount: 0, depositDueAt: null, depositTermDays: 0, depositActive: false };
            userData.portfolio = Object.fromEntries(Object.keys(getMapStocks(targetStage)).map(k => [k, { qty: 0, avgCost: 0 }]));
            userData.shortPositions = {};
            userData.mapHistory = userData.mapHistory || [];
            userData.mapHistory.push({ fromStage: mapStage, toStage: targetStage, at: new Date().toISOString(), netWorth, isFirstVisit });
            userData.mapSwitchCooldownUntil = null;  // không còn cooldown — tự do di chuyển

            saveData(data);
            const newBal = getWallet(userData);
            return message.reply({ embeds: [new EmbedBuilder()
                .setTitle('✅ CHUYỂN MAP THÀNH CÔNG')
                .setColor(targetStage === 3 ? 0x9b59b6 : targetStage === 2 ? 0x1abc9c : 0x3498db)
                .setDescription(`Bạn đã chuyển sang **Map ${targetStage}** (${getCurrencyUnit(targetStage)}).${conversionNote}\n\n💰 Số dư ví ${getCurrencyUnit(targetStage)}: **${fmtCur(newBal, targetStage)}**`)
                .addFields({ name: '💡 Ví tiền các map', value:
                    `🇻🇳 Map 1 VND: **${fmtCur(userData.balanceVND || 0, 1)}**\n` +
                    `🇨🇦 Map 2 CAD: **${fmtCur(userData.balanceCAD || 0, 2)}**\n` +
                    `🇺🇸 Map 3 USD: **${fmtCur(userData.balanceUSD || 0, 3)}**`
                })
                .setFooter({ text: isFirstVisit ? 'Dùng !dangnhap để đăng nhập sàn mới!' : 'Bạn đã có ID sàn ở map này.' })
            ] });
        }
        const stocks = getMapStocks(mapStage);
        const embed = new EmbedBuilder()
            .setTitle(`🗺️ MAP ${mapStage}`)
            .setColor(mapStage === 2 ? 0x1abc9c : mapStage === 3 ? 0x9b59b6 : 0x3498db)
            .setDescription(`Bạn đang ở **Map ${mapStage}** với đơn vị **${userData.currency}**.`)
            .addFields(
                { name: '🔸 Mã được phép', value: Object.keys(stocks).join(', ') || '*Chưa có mã nào*', inline: false },
                { name: '📌 Điều kiện mở map', value: `🗺️ Map 2: Level ≥ **${MAP_UNLOCK_REQUIREMENTS[2].level}** + Tài sản ≥ **${formatMoney(MAP_UNLOCK_REQUIREMENTS[2].netWorth)} VND**\n🌌 Map 3: Level ≥ **${MAP_UNLOCK_REQUIREMENTS[3].level}** + Tài sản ≥ **C$${formatMoney(MAP_UNLOCK_REQUIREMENTS[3].netWorth)} (100M CAD)**`, inline: false }
            );
        embed.addFields({ name: '➡️ Chuyển map', value: 'Gõ `!map 1`, `!map 2` hoặc `!map 3` để đổi map.' });
        return message.reply({ embeds: [embed] });
    }

    // ===== CP =====
    if (['cp', 'xem'].includes(command)) {
        const code = args[0]?.toUpperCase();
        const { data, userData } = getUserData(uid);
        if (!code || !STOCKS[code]) return message.reply(`❌ Mã không tồn tại! Các mã: ${Object.keys(getMapStocks(userData.mapStage || 1)).join(', ')}`);
        if (!isStockAllowedForUser(code, userData)) return message.reply('❌ Mã này không thuộc Map hiện tại của bạn.');
        return message.reply({ embeds: [createStockDetailEmbed(code, data, userData)] });
    }

    // ===== PROFILE =====
    if (['profile', 'me', 'info'].includes(command)) {
        if (message.mentions.users.size > 0) {
            if (!isAdmin(uid)) return message.reply('❌ Chỉ admin mới xem được profile người khác!');
            const target = message.mentions.users.first();
            const { data, userData } = getUserData(target.id);
            return message.reply({ embeds: [createProfileEmbed(target, data, userData)] });
        }
        const { data, userData } = getUserData(uid);
        return message.reply({ embeds: [createProfileEmbed(message.author, data, userData)], components: createProfileView(uid).components });
    }

    // ===== TOP =====
    if (['top', 'rank'].includes(command)) {
        return message.reply({ embeds: [createTopEmbed(loadData(), message.guild)] });
    }

    // ===== CHART (biểu đồ 30 tick nhiều mã) =====
    if (['chart', 'bieudo'].includes(command)) {
        const { data, userData } = getUserData(uid);
        const codes = args.map(a => a.toUpperCase()).filter(c => STOCKS[c]);
        if (codes.length === 0) return message.reply('❌ `!chart MÃ1 MÃ2 ...` — Ví dụ: `!chart TECH FOOD GOLD` (tối đa 6 mã)');
        const notAllowed = codes.filter(c => !isStockAllowedForUser(c, userData));
        if (notAllowed.length > 0) return message.reply(`❌ Mã không thuộc Map hiện tại của bạn: ${notAllowed.join(', ')}`);
        const targets = codes.slice(0, 6);

        const SPARKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
        let text = '';
        for (const code of targets) {
            const info = STOCKS[code];
            const price = data.stockPrices[code];
            const open = data.dailyOpen[code] || price;
            const pct = (((price - open) / open) * 100).toFixed(2);
            const history = (data.stockHistory[code] || []).slice(-30);
            const prices = history.map(h => h.p);
            let chart = '*Chưa đủ dữ liệu*';
            if (prices.length >= 2) {
                const mn = Math.min(...prices), mx = Math.max(...prices);
                const range = mx - mn || 1;
                chart = prices.map(p => SPARKS[Math.round(((p - mn) / range) * (SPARKS.length - 1))]).join('');
            }
            text += `${info.emoji} **${code}** — ${fmtCur(price, userData.mapStage || 1)} (${pct >= 0 ? '+' : ''}${pct}%)\n\`${chart}\`\n\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle(`📊 BIỂU ĐỒ 30 TICK — ${targets.join(', ')}`)
            .setColor(0x3498db)
            .setDescription(text)
            .setTimestamp()
            .setFooter({ text: 'Mỗi tick ≈ 3 giây | Dùng !cp MÃ để xem chi tiết 1 mã' });
        return message.reply({ embeds: [embed] });
    }

    // ===== COMPARE =====
    if (['compare', 'sosanh'].includes(command)) {
        const { data, userData } = getUserData(uid);
        const c1 = args[0]?.toUpperCase(), c2 = args[1]?.toUpperCase();
        if (!c1 || !c2 || !STOCKS[c1] || !STOCKS[c2]) return message.reply('❌ `!compare MÃ1 MÃ2`');
        if (!isStockAllowedForUser(c1, userData) || !isStockAllowedForUser(c2, userData)) return message.reply('❌ Cả hai mã phải thuộc Map hiện tại của bạn.');
        const i1 = STOCKS[c1], i2 = STOCKS[c2];
        const p1 = data.stockPrices[c1], p2 = data.stockPrices[c2];
        const o1 = data.dailyOpen[c1] || p1, o2 = data.dailyOpen[c2] || p2;
        const pct1 = ((p1 - o1) / o1 * 100).toFixed(2), pct2 = ((p2 - o2) / o2 * 100).toFixed(2);
        const embed = new EmbedBuilder()
            .setTitle(`📊 SO SÁNH: ${c1} vs ${c2}`)
            .setColor(0x9b59b6)
            .addFields(
                { name: `${i1.emoji} ${c1} — ${i1.name}`, value: `Giá: ${fmtCur(p1, userData.mapStage||1)}\nThay đổi: ${pct1 >= 0 ? '+' : ''}${pct1}%\nNgành: ${i1.sector}\nBiến động: ${(i1.volatility * 100).toFixed(1)}%`, inline: true },
                { name: `${i2.emoji} ${c2} — ${i2.name}`, value: `Giá: ${fmtCur(p2, userData.mapStage||1)}\nThay đổi: ${pct2 >= 0 ? '+' : ''}${pct2}%\nNgành: ${i2.sector}\nBiến động: ${(i2.volatility * 100).toFixed(1)}%`, inline: true }
            )
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    // ===== ACHIEVEMENTS =====
    if (['achievements', 'thanhtich'].includes(command)) {
        const { userData } = getUserData(uid);
        let text = '';
        for (const a of ACHIEVEMENTS) {
            const has = userData.achievements.includes(a.id);
            text += `${has ? a.emoji : '🔒'} **${a.name}** — ${a.desc}\n`;
        }
        const embed = new EmbedBuilder()
            .setTitle('🏅 THÀNH TÍCH')
            .setDescription(text)
            .setColor(0xf1c40f)
            .setFooter({ text: `${userData.achievements.length}/${ACHIEVEMENTS.length} đã mở khóa` });
        return message.reply({ embeds: [embed] });
    }

    // ===== BẤT ĐỘNG SẢN =====
    if (['bds', 'realestate'].includes(command)) {
        const sub = args[0]?.toLowerCase();
        const { data, userData } = getUserData(uid);
        const mapStage = userData.mapStage || 1;
        const list = getRealEstateList(mapStage);

        // !bds  hoặc  !bds list  → xem danh sách BĐS của map hiện tại
        if (!sub || sub === 'list' || sub === 'xem') {
            let text = '';
            for (const p of list) {
                const price = getRealEstateCurrentPrice(data, mapStage, p.id);
                text += `${p.emoji} **${p.id}** — ${p.name}\n┗ Giá: ${fmtCur(price, mapStage)} | Tăng giá: ~${(p.dailyGrowth * 100).toFixed(2)}%/ngày\n\n`;
            }
            saveData(data);
            const embed = new EmbedBuilder()
                .setTitle(`🏠 BẤT ĐỘNG SẢN — MAP ${mapStage}`)
                .setColor(0x8e44ad)
                .setDescription(text || '*Map này chưa có bất động sản*')
                .setFooter({ text: '!bds mua MÃ | !bds ban MÃ_SỞ_HỮU | !bds tui (xem BĐS của bạn)' });
            return message.reply({ embeds: [embed] });
        }

        // !bds tui  → xem BĐS đang sở hữu
        if (sub === 'tui' || sub === 'my' || sub === 'inventory') {
            const owned = (userData.properties || []).filter(p => p.mapStage === mapStage);
            if (owned.length === 0) return message.reply('🏠 Bạn chưa sở hữu bất động sản nào ở map này. Dùng `!bds mua MÃ` để mua!');
            let text = '';
            let totalVal = 0;
            for (const prop of owned) {
                const info = getRealEstateInfo(mapStage, prop.typeId);
                const curPrice = getRealEstateCurrentPrice(data, mapStage, prop.typeId);
                const pnl = curPrice - prop.boughtPrice;
                totalVal += curPrice;
                text += `${info?.emoji || '🏠'} **${prop.id}** (${info?.name || prop.typeId})\n┗ Mua: ${fmtCur(prop.boughtPrice, mapStage)} → Hiện tại: ${fmtCur(curPrice, mapStage)} (${pnl >= 0 ? '+' : ''}${fmtCur(pnl, mapStage)})\n\n`;
            }
            return message.reply({ embeds: [new EmbedBuilder()
                .setTitle('🏠 BẤT ĐỘNG SẢN CỦA BẠN')
                .setColor(0x8e44ad)
                .setDescription(text)
                .setFooter({ text: `Tổng giá trị hiện tại: ${fmtCur(totalVal, mapStage)}` })
            ] });
        }

        // !bds mua MÃ  → mua bất động sản mới
        if (sub === 'mua' || sub === 'buy') {
            if (!isRegistered(userData, mapStage)) return message.reply('❌ Bạn cần đăng ký trước bằng `!dangky`/`!dangnhap` trước khi mua bất động sản.');
            if (!data.sessionOpen) return message.reply('❌ Phiên giao dịch đang đóng! Chờ đến 06:00 sáng.');
            const typeId = args[1]?.toUpperCase();
            const info = getRealEstateInfo(mapStage, typeId);
            if (!info) return message.reply(`❌ Không tìm thấy mã BĐS này ở Map ${mapStage}! Dùng \`!bds\` để xem danh sách.`);
            const price = getRealEstateCurrentPrice(data, mapStage, typeId);
            if (userData.balance < price) return message.reply(`❌ Không đủ tiền! Cần ${fmtCur(price, mapStage)}, bạn có ${fmtCur(userData.balance, mapStage)}`);

            mutWallet(userData, b => b - price);
            userData.balance = getWallet(userData);
            recordMoneyHistory(userData, -price, `buy real estate ${typeId}`);
            const propId = `${typeId}-${randomDigits(4)}`;
            userData.properties = userData.properties || [];
            userData.properties.push({ id: propId, typeId, boughtAt: new Date().toISOString(), boughtPrice: price, mapStage });
            addExp(userData, 30);
            warnSuspiciousAssets(data, message.guild, uid, userData, `buy real estate ${typeId} (${price})`);
            saveData(data);
            return message.reply({ embeds: [new EmbedBuilder()
                .setTitle('✅ MUA BẤT ĐỘNG SẢN THÀNH CÔNG!')
                .setColor(0x8e44ad)
                .setDescription(`${message.author} đã mua **${info.emoji} ${info.name}**`)
                .addFields(
                    { name: 'Mã sở hữu', value: `\`${propId}\``, inline: true },
                    { name: 'Giá mua', value: fmtCur(price, mapStage), inline: true },
                    { name: 'Số dư còn lại', value: fmtCur(userData.balance, mapStage), inline: true }
                )
                .setFooter({ text: 'Giá BĐS tăng dần theo thời gian — dùng !bds ban để bán lại khi cần' })
            ] });
        }

        // !bds ban MÃ_SỞ_HỮU  → bán lại bất động sản đang sở hữu
        if (sub === 'ban' || sub === 'sell') {
            const propId = args[1]?.toUpperCase();
            if (!propId) return message.reply('❌ `!bds ban MÃ_SỞ_HỮU` — dùng `!bds tui` để xem mã sở hữu của bạn.');
            const idx = (userData.properties || []).findIndex(p => p.id === propId);
            if (idx === -1) return message.reply('❌ Bạn không sở hữu bất động sản với mã này!');
            const prop = userData.properties[idx];
            const info = getRealEstateInfo(prop.mapStage, prop.typeId);
            const curPrice = getRealEstateCurrentPrice(data, prop.mapStage, prop.typeId);
            // Phí giao dịch BĐS 3% (mô phỏng phí sang tên, môi giới)
            const fee = Math.ceil(curPrice * 0.03);
            const received = curPrice - fee;
            const pnl = received - prop.boughtPrice;

            mutWallet(userData, b => b + received);
            userData.balance = getWallet(userData);
            recordMoneyHistory(userData, received, `sell real estate ${prop.typeId} (phí ${fee})`);
            userData.properties.splice(idx, 1);
            saveData(data);
            return message.reply({ embeds: [new EmbedBuilder()
                .setTitle('🔴 BÁN BẤT ĐỘNG SẢN THÀNH CÔNG!')
                .setColor(pnl >= 0 ? 0x00ff88 : 0xff4444)
                .setDescription(`${message.author} đã bán **${info?.emoji || '🏠'} ${info?.name || prop.typeId}**`)
                .addFields(
                    { name: 'Giá bán (đã trừ phí 3%)', value: fmtCur(received, prop.mapStage), inline: true },
                    { name: pnl >= 0 ? 'Lãi' : 'Lỗ', value: `${pnl >= 0 ? '+' : ''}${fmtCur(pnl, prop.mapStage)}`, inline: true },
                    { name: 'Số dư mới', value: fmtCur(userData.balance, prop.mapStage), inline: true }
                )
            ] });
        }

        return message.reply('❌ Lệnh không hợp lệ. Dùng: `!bds`, `!bds mua MÃ`, `!bds ban MÃ_SỞ_HỮU`, `!bds tui`');
    }

    // ===== HƯỚNG DẪN CHO NGƯỜI MỚI =====
    if (['huongdan', 'guide', 'huongdancanban'].includes(command)) {
        const page = args[0]?.toLowerCase();

        if (page === '2') {
            const embed = new EmbedBuilder()
                .setTitle('📚 HƯỚNG DẪN CHƠI (2/2) — Khái niệm & rủi ro')
                .setColor(0x2980b9)
                .addFields(
                    { name: '📈 Giá cổ phiếu lên xuống thế nào?', value: 'Giá thay đổi liên tục mỗi vài giây, có xu hướng ngắn hạn (tăng/giảm theo "trend"), nhiễu ngẫu nhiên, và đôi khi có "spike" mạnh do tin tức. Đừng hoảng nếu giá đỏ vài phút — đó là bình thường.', inline: false },
                    { name: '💰 Lãi/lỗ tính sao?', value: 'Lãi = (Giá bán − Giá mua trung bình) × Số lượng. Bot tự tính `avgCost` khi bạn mua thêm cùng mã ở giá khác nhau.', inline: false },
                    { name: '📉 Short là gì? (rủi ro cao)', value: '`!short` là "cược giá sẽ giảm". Bạn ký quỹ 50% giá trị, lãi khi giá xuống, lỗ khi giá lên. Mới chơi nên **tránh short** cho đến khi hiểu rõ.', inline: false },
                    { name: '🏦 Gửi tiết kiệm vs Vay margin', value: '`!deposit` (hay `!tkiem`): gửi tiền ăn lãi an toàn, rút trước hạn bị phạt 50%.\n`!borrow` (hay `!vay`): vay tiền để có thêm vốn chơi, nhưng phải trả đúng hạn — trễ hạn có thể bị **phá sản** (mất hết tài sản)!', inline: false },
                    { name: '⚠️ Quy tắc an toàn', value: '• Không bao giờ vay vượt quá khả năng trả.\n• Đa dạng hóa: không "all-in" 1 mã.\n• Theo dõi `!cp MÃ` để xem biểu đồ 30 tick trước khi mua.\n• Đọc kỹ cảnh báo khi chuyển map — tiền quy đổi **không hoàn lại**.', inline: false }
                )
                .setFooter({ text: 'Dùng !huongdan 1 để xem lại trang trước | !help để xem toàn bộ lệnh' });
            return message.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle('📚 HƯỚNG DẪN CHƠI CHỨNG KHOÁN (1/2) — Dành cho người mới')
            .setColor(0x2980b9)
            .setDescription('Chào mừng bạn đến với sàn giao dịch ảo! Đây là hướng dẫn cơ bản để bắt đầu.')
            .addFields(
                { name: '1️⃣ Bước đầu tiên', value: '`!dangky` — đăng ký tài khoản, nhận **5.000.000 xu** khởi đầu (Map 1, đơn vị VND).', inline: false },
                { name: '2️⃣ Xem giá thị trường', value: '`!price` (hay `!gia`) — xem giá tất cả cổ phiếu + dropdown mua/bán nhanh.\n`!cp MÃ` — xem chi tiết 1 mã: giá, biểu đồ, ai đang ôm nhiều nhất.', inline: false },
                { name: '3️⃣ Mua / Bán cổ phiếu', value: '`!buy MÃ SỐ_LƯỢNG` (hay `!mua`) — mua cổ phiếu.\n`!sell MÃ SỐ_LƯỢNG` (hay `!ban`) — bán cổ phiếu đang có.\nVí dụ: `!mua TECH 10` mua 10 cổ phiếu VinTech.', inline: false },
                { name: '4️⃣ Theo dõi tài sản', value: '`!profile` (hay `!hoso`) — xem số dư, danh mục, level, thành tích.\n`!top` — bảng xếp hạng người giàu nhất server.', inline: false },
                { name: '5️⃣ Mẹo nhỏ', value: '• Mua khi giá đang thấp hơn giá mở cửa (`!price` hiện % thay đổi).\n• Đừng dồn hết tiền vào 1 mã — rủi ro cao.\n• Dùng `!alert MÃ GIÁ` để được báo khi giá đạt mức mong muốn.', inline: false }
            )
            .setFooter({ text: 'Gõ !huongdan 2 để xem tiếp phần khái niệm nâng cao & rủi ro' });
        return message.reply({ embeds: [embed] });
    }

    // ===== BUY =====
    if (['buy', 'mua'].includes(command)) {
        const code = args[0]?.toUpperCase(), qty = parseInt(args[1]);
        const { data, userData } = getUserData(uid);
        if (!isRegistered(userData, userData.mapStage || 1)) return message.reply('❌ Bạn cần đăng ký trước bằng `!dangky` (Map 1) hoặc `!dangnhap` (Map 2) trước khi giao dịch.');
        if (isTradeBanned(userData)) return message.reply(`❌ Bạn đang bị cấm giao dịch đến ${new Date(userData.tradeBanUntil).toLocaleString('vi-VN')}.`);
        if (!code || !STOCKS[code]) return message.reply('❌ Mã không tồn tại!');
        if (!isStockAllowedForUser(code, userData)) return message.reply('❌ Mã này không thuộc Map hiện tại của bạn.');
        if (!qty || qty <= 0) return message.reply('❌ Số lượng phải > 0!');
        if (!data.sessionOpen) return message.reply('❌ Phiên giao dịch đang đóng! Chờ đến 06:00 sáng.');
        const price = data.stockPrices[code], total = price * qty;
        if (userData.balance < total) return message.reply(`❌ Không đủ tiền! Cần ${fmtCur(total, userData.mapStage||1)}, bạn có ${fmtCur(userData.balance, userData.mapStage||1)}`);
        mutWallet(userData, b => b - total);
        userData.balance = getWallet(userData);
        recordMoneyHistory(userData, -total, `buy ${qty} ${code}`);
        const pos = userData.portfolio[code];
        pos.avgCost = (pos.avgCost * pos.qty + total) / (pos.qty + qty);
        pos.qty += qty;
        userData.totalTrades++;
        userData.dailyProfit -= total;
        userData.totalInvested = (userData.totalInvested || 0) + total;
        if (total > (userData.maxSingleTrade || 0)) userData.maxSingleTrade = total;
        userData.tradeHistory.unshift({ type: 'buy', code, qty, price, total, t: new Date().toISOString() });
        if (userData.tradeHistory.length > 30) userData.tradeHistory.pop();
        data.totalTransactions++;
        const leveled = addExp(userData, calculateTradeExp(total, 0, userData));
        const newAchs = checkAchievements(userData, data, { total });
        warnSuspiciousAssets(data, message.guild, uid, userData, `buy ${qty} ${code}`);
        saveData(data);
        const info = STOCKS[code];
        const embed = new EmbedBuilder().setTitle('✅ MUA THÀNH CÔNG!').setColor(0x00ff88)
            .setDescription(`${message.author} mua **${qty.toLocaleString()}** ${info.emoji} **${code}**`)
            .addFields(
                { name: 'Giá', value: `${fmtCur(price, userData.mapStage||1)}/${userData.currency === 'CAD' ? 'cp' : 'cp'}`, inline: true },
                { name: 'Tổng chi', value: `${fmtCur(total, userData.mapStage||1)}`, inline: true },
                { name: 'Số dư', value: `${fmtCur(userData.balance, userData.mapStage||1)}`, inline: true }
            );
        if (leveled) embed.addFields({ name: '🎊 LEVEL UP!', value: `Level **${userData.level}** — ${getTitle(userData.level).emoji} ${getTitle(userData.level).title}` });
        if (newAchs.length > 0) embed.addFields({ name: '🏅 Thành tích mới!', value: newAchs.map(id => { const a = ACHIEVEMENTS.find(x => x.id === id); return `${a?.emoji} **${a?.name}**`; }).join('\n') });
        if (total >= (LARGE_TRADE_THRESHOLD[userData.mapStage] || LARGE_TRADE_THRESHOLD[1])) announceHugeTrade(message.guild, message.author, 'buy', code, qty, total, userData.mapStage);
        return message.reply({ embeds: [embed] });
    }

    // ===== SELL =====
    if (['sell', 'ban'].includes(command)) {
        const code = args[0]?.toUpperCase(), qty = parseInt(args[1]);
        if (!code || !STOCKS[code]) return message.reply('❌ Mã không tồn tại!');
        const { data, userData } = getUserData(uid);
        if (!isRegistered(userData, userData.mapStage || 1)) return message.reply('❌ Bạn cần đăng ký trước bằng `!dangky` (Map 1) hoặc `!dangnhap` (Map 2) trước khi giao dịch.');
        if (!isStockAllowedForUser(code, userData)) return message.reply('❌ Mã này không thuộc Map hiện tại của bạn.');
        if (!qty || qty <= 0) return message.reply('❌ Số lượng phải > 0!');
        if (!data.sessionOpen) return message.reply('❌ Phiên giao dịch đang đóng! Chờ đến 06:00 sáng.');
        const pos = userData.portfolio[code];
        if ((pos?.qty || 0) < qty) return message.reply(`❌ Bạn chỉ có ${pos?.qty || 0} cổ phiếu ${code}!`);
        const price = data.stockPrices[code], total = price * qty;
        const profit = (price - pos.avgCost) * qty;
        mutWallet(userData, b => b + total);
        userData.balance = getWallet(userData);
        recordMoneyHistory(userData, total, `sell ${qty} ${code}`);
        pos.qty -= qty;
        if (pos.qty === 0) pos.avgCost = 0;
        userData.totalTrades++;
        userData.totalProfit += profit;
        userData.dailyProfit += total;
        userData.tradeHistory.unshift({ type: 'sell', code, qty, price, total, profit, t: new Date().toISOString() });
        if (userData.tradeHistory.length > 30) userData.tradeHistory.pop();
        data.totalTransactions++;
        const leveled = addExp(userData, calculateTradeExp(total, profit, userData));
        const newAchs = checkAchievements(userData, data, { profit, total });
        warnSuspiciousAssets(data, message.guild, uid, userData, `sell ${qty} ${code}`);
        saveData(data);
        const info = STOCKS[code];
        const embed = new EmbedBuilder().setTitle('🔴 BÁN THÀNH CÔNG!').setColor(profit >= 0 ? 0x00ff88 : 0xff4444)
            .setDescription(`${message.author} bán **${qty.toLocaleString()}** ${info.emoji} **${code}**`)
            .addFields(
                { name: 'Giá', value: `${fmtCur(price, userData.mapStage||1)}/${userData.currency === 'CAD' ? 'cp' : 'cp'}`, inline: true },
                { name: 'Thu về', value: `${fmtCur(total, userData.mapStage||1)}`, inline: true },
                { name: profit >= 0 ? 'Lãi' : 'Lỗ', value: `${profit >= 0 ? '+' : ''}${fmtCur(profit, userData.mapStage||1)}`, inline: true },
                { name: 'Số dư', value: `${fmtCur(userData.balance, userData.mapStage||1)}`, inline: true }
            );
        if (leveled) embed.addFields({ name: '🎊 LEVEL UP!', value: `Level **${userData.level}** — ${getTitle(userData.level).emoji} ${getTitle(userData.level).title}` });
        if (newAchs.length > 0) embed.addFields({ name: '🏅 Thành tích mới!', value: newAchs.map(id => { const a = ACHIEVEMENTS.find(x => x.id === id); return `${a?.emoji} **${a?.name}**`; }).join('\n') });
        if (total >= (LARGE_TRADE_THRESHOLD[userData.mapStage] || LARGE_TRADE_THRESHOLD[1])) announceHugeTrade(message.guild, message.author, 'sell', code, qty, total, userData.mapStage);
        return message.reply({ embeds: [embed] });
    }

    // ===== SHORT =====
    if (['short', 'khong'].includes(command)) {
        const code = args[0]?.toUpperCase(), qty = parseInt(args[1]);
        const { data, userData } = getUserData(uid);
        if (isTradeBanned(userData)) return message.reply(`❌ Bạn đang bị cấm giao dịch đến ${new Date(userData.tradeBanUntil).toLocaleString('vi-VN')}.`);
        if (!isRegistered(userData, userData.mapStage || 1)) return message.reply('❌ Bạn cần đăng ký trước bằng `!dangky` (Map 1) hoặc `!dangnhap` (Map 2) trước khi giao dịch.');
        if (!code || !STOCKS[code]) return message.reply('❌ Mã không tồn tại!');
        if (!qty || qty <= 0) return message.reply('❌ Số lượng phải > 0!');
        if (!data.sessionOpen) return message.reply('❌ Phiên giao dịch đang đóng! Chờ đến 06:00 sáng.');
        const price = data.stockPrices[code];
        const collateral = price * qty * 0.5;
        if (userData.balance < collateral) return message.reply(`❌ Cần ký quỹ ${formatMoney(collateral)} xu (50% giá trị)`);
        userData.balance -= collateral;
        if (!userData.shortPositions[code]) userData.shortPositions[code] = { qty: 0, openPrice: 0, collateral: 0 };
        const s = userData.shortPositions[code];
        s.openPrice = (s.openPrice * s.qty + price * qty) / (s.qty + qty);
        s.qty += qty;
        s.collateral += collateral;
        userData.totalTrades++;
        saveData(data);
        return message.reply(`📉 Đã mở vị thế short **${code}** x${qty} @ ${formatMoney(price)} xu | Ký quỹ: ${formatMoney(collateral)} xu`);
    }

    // ===== COVER =====
    if (['cover', 'dong'].includes(command)) {
        const code = args[0]?.toUpperCase(), qty = parseInt(args[1]);
        if (!code || !STOCKS[code]) return message.reply('❌ Mã không tồn tại!');
        if (!qty || qty <= 0) return message.reply('❌ Số lượng phải > 0!');
        const { data, userData } = getUserData(uid);
        if (!isRegistered(userData, userData.mapStage || 1)) return message.reply('❌ Bạn cần đăng ký trước bằng `!dangky` (Map 1) hoặc `!dangnhap` (Map 2) trước khi giao dịch.');
        const s = userData.shortPositions[code];
        if (!s || s.qty < qty) return message.reply(`❌ Bạn chỉ có ${s?.qty || 0} vị thế short ${code}!`);
        const price = data.stockPrices[code];
        const profit = (s.openPrice - price) * qty;
        const colReturn = (s.collateral / s.qty) * qty;
        userData.balance += colReturn + profit;
        s.qty -= qty;
        s.collateral -= colReturn;
        if (s.qty === 0) { s.openPrice = 0; s.collateral = 0; }
        userData.totalProfit += profit;
        userData.dailyProfit += profit;
        saveData(data);
        const embed = new EmbedBuilder()
            .setTitle(profit >= 0 ? '📈 ĐÓNG SHORT CÓ LÃI!' : '📉 ĐÓNG SHORT BỊ LỖ!')
            .setColor(profit >= 0 ? 0x00ff88 : 0xff4444)
            .addFields(
                { name: 'Giá đóng', value: `${formatMoney(price)} xu`, inline: true },
                { name: profit >= 0 ? 'Lãi' : 'Lỗ', value: `${profit >= 0 ? '+' : ''}${formatMoney(profit)} xu`, inline: true },
                { name: 'Số dư', value: `${formatMoney(userData.balance)} xu`, inline: true }
            );
        return message.reply({ embeds: [embed] });
    }

    // ===== LIMIT ORDER =====
    if (['limit', 'gh'].includes(command)) {
        const action = args[0]?.toLowerCase();
        const code = args[1]?.toUpperCase();
        const targetPrice = parseFloat(args[2]);
        const qty = parseInt(args[3]);
        if (!['buy', 'sell'].includes(action) || !code || !STOCKS[code] || isNaN(targetPrice) || !qty || qty <= 0)
            return message.reply('❌ `!limit [buy/sell] MÃ GIÁ [SỐLƯỢNG]`\nVí dụ: `!limit buy TECH 140000 10`');
        const data = loadData();
        const userData = ensureUserData(data, uid);
        if (!isRegistered(userData, userData.mapStage || 1)) return message.reply('❌ Bạn cần đăng ký trước bằng `!dangky` (Map 1) hoặc `!dangnhap` (Map 2) trước khi giao dịch.');
        const orderId = `${uid}_${Date.now()}`;
        data.limitOrders.push({ id: orderId, userId: uid, action, code, targetPrice, qty, createdAt: new Date().toISOString() });
        saveData(data);
        const embed = new EmbedBuilder()
            .setTitle('⏰ LỆNH GIỚI HẠN ĐÃ ĐẶT!')
            .setColor(0x9b59b6)
            .addFields(
                { name: 'Hành động', value: action === 'buy' ? '🟢 MUA khi giá <= mức tiêu' : '🔴 BÁN khi giá >= mức tiêu', inline: false },
                { name: 'Cổ phiếu', value: `${STOCKS[code].emoji} ${code}`, inline: true },
                { name: 'Giá mức tiêu', value: `${formatMoney(targetPrice)} xu`, inline: true },
                { name: 'Số lượng', value: `${qty}`, inline: true },
                { name: 'ID lệnh', value: `\`${orderId}\``, inline: false }
            )
            .setFooter({ text: '!cancellimit ID để hủy lệnh' });
        return message.reply({ embeds: [embed] });
    }

    // ===== MY LIMITS =====
    if (['mylimits', 'lghan'].includes(command)) {
        const data = loadData();
        const orders = (data.limitOrders || []).filter(o => o.userId === uid);
        if (orders.length === 0) return message.reply('❌ Bạn không có lệnh giới hạn nào đang chờ!');
        let text = '';
        for (const o of orders) {
            text += `${o.action === 'buy' ? '🟢' : '🔴'} **${o.action.toUpperCase()}** ${o.code} x${o.qty} @ ${formatMoney(o.targetPrice)} xu\nID: \`${o.id}\`\n\n`;
        }
        return message.reply({ embeds: [new EmbedBuilder().setTitle('⏰ LỆNH GIỚI HẠN CỦA BẠN').setDescription(text).setColor(0x9b59b6)] });
    }

    // ===== CANCEL LIMIT =====
    if (['cancellimit', 'huygh'].includes(command)) {
        const orderId = args[0];
        if (!orderId) return message.reply('❌ `!cancellimit ID`');
        const data = loadData();
        const before = data.limitOrders.length;
        data.limitOrders = data.limitOrders.filter(o => !(o.id === orderId && o.userId === uid));
        if (data.limitOrders.length === before) return message.reply('❌ Không tìm thấy lệnh này!');
        saveData(data);
        return message.reply(`✅ Đã hủy lệnh \`${orderId}\``);
    }

    // ===== ALERT =====
    if (['alert', 'cb'].includes(command)) {
        const code = args[0]?.toUpperCase();
        const targetPrice = parseFloat(args[1]);
        if (!code || !STOCKS[code] || isNaN(targetPrice)) return message.reply('❌ `!alert MÃ GIÁ`\nVí dụ: `!alert TECH 200000`');
        const data = loadData();
        const price = data.stockPrices[code];
        const direction = targetPrice > price ? 'above' : 'below';
        const alertId = `${uid}_${code}_${Date.now()}`;
        if (!data.priceAlerts) data.priceAlerts = {};
        data.priceAlerts[alertId] = { userId: uid, code, targetPrice, direction, createdAt: new Date().toISOString() };
        saveData(data);
        return message.reply(`🔔 Đã đặt cảnh báo! Bot sẽ DM bạn khi **${code}** ${direction === 'above' ? 'vượt' : 'xuống dưới'} **${formatMoney(targetPrice)} xu**`);
    }

    // ===== MY ALERTS =====
    if (['myalerts', 'cbtoi'].includes(command)) {
        const data = loadData();
        const alerts = Object.entries(data.priceAlerts || {}).filter(([, a]) => a.userId === uid);
        if (alerts.length === 0) return message.reply('❌ Bạn chưa có cảnh báo nào!');
        let text = '';
        for (const [id, a] of alerts) {
            text += `🔔 **${a.code}** ${a.direction === 'above' ? '>=' : '<='} ${formatMoney(a.targetPrice)} xu\nID: \`${id}\`\n\n`;
        }
        return message.reply({ embeds: [new EmbedBuilder().setTitle('🔔 CẢNH BÁO GIÁ CỦA BẠN').setDescription(text).setColor(0xf39c12)] });
    }

    // ===== DAILY =====
    if (['daily', 'dd'].includes(command)) {
        const { data, userData } = getUserData(uid);
        const now = new Date();
        if (userData.lastDaily) {
            const diff = (now - new Date(userData.lastDaily)) / 1000;
            if (diff < 86400) {
                const rem = 86400 - diff;
                return message.reply(`⏳ Còn **${Math.floor(rem / 3600)}h ${Math.floor((rem % 3600) / 60)}p** nữa được nhận thưởng!`);
            }
        }
        const bonus = Math.floor(Math.random() * 900_000) + 100_000;
        userData.balance += bonus;
        recordMoneyHistory(userData, bonus, 'daily bonus');
        userData.lastDaily = now.toISOString();
        addExp(userData, 50);
        saveData(data);
        return message.reply({
            embeds: [new EmbedBuilder().setTitle('🎁 THƯỞNG HÀNG NGÀY!').setColor(0xf1c40f)
                .setDescription(`${message.author} nhận được **${formatMoney(bonus)} xu**!`)
                .addFields({ name: 'Số dư mới', value: `${formatMoney(userData.balance)} xu` })]
        });
    }

    // ===== BANK =====
    if (['bank', 'nh'].includes(command)) {
        const { data, userData } = getUserData(uid);
        const bank = userData.bank;
        let interestNote = '';
        if (bank.savings > 0 && bank.depositedAt) {
            const days = (Date.now() - new Date(bank.depositedAt).getTime()) / 86_400_000;
            interestNote = `\nLãi tích lũy: ~${formatMoney(bank.savings * 0.02 * days)} xu (2%/ngày)`;
        }
        const depositInfo = userData.bank?.depositActive ? `🟢 Đang gửi ${formatMoney(userData.bank.depositAmount || 0)} xu, hạn đến ${new Date(userData.bank.depositDueAt).toLocaleString('vi-VN')}` : '⚪ Không có khoản gửi đang hoạt động';
        const loanInfo = userData.margin?.borrowed > 0 ? `🔴 Nợ ${formatMoney(userData.margin.borrowed)} xu, hạn ${new Date(userData.margin.dueAt).toLocaleString('vi-VN')}` : '🟢 Không có vay';
        return message.reply({
            embeds: [new EmbedBuilder().setTitle('🏦 NGÂN HÀNG CÁ NHÂN').setColor(0x2980b9)
                .setDescription('Lãi suất **2% mỗi ngày**\n`!deposit Số Ngày` — gửi | `!withdraw Số` — rút')
                .addFields(
                    { name: 'Tiền mặt', value: `${formatMoney(userData.balance)} xu`, inline: true },
                    { name: 'Tiết kiệm', value: `${formatMoney(bank.savings)} xu${interestNote}`, inline: true },
                    { name: 'Vay margin', value: loanInfo, inline: false },
                    { name: 'Gửi ngân hàng', value: depositInfo, inline: false }
                )]
        });
    }

    // ===== DEPOSIT =====
    if (['deposit', 'tkiem'].includes(command)) {
        const amount = parseInt(args[0]);
        const termDays = parseInt(args[1]);
        if (!amount || amount <= 0 || !termDays || termDays <= 0) return message.reply('❌ `!deposit Số Ngày`\nVí dụ: `!deposit 1000000 7`');
        const { data, userData } = getUserData(uid);
        if (userData.balance < amount) return message.reply('❌ Không đủ tiền!');
        const currentSavings = userData.bank?.savings || 0;
        const dueAt = new Date(Date.now() + termDays * 86_400_000).toISOString();
        const embed = new EmbedBuilder()
            .setTitle('🏦 XÁC NHẬN GỬI TIẾT KIỆM')
            .setColor(0x2980b9)
            .setDescription(`Bạn sắp gửi **${formatMoney(amount)} xu** vào ngân hàng trong **${termDays} ngày**.`)
            .addFields(
                { name: '💵 Tiền mặt hiện tại', value: `${formatMoney(userData.balance)} xu`, inline: true },
                { name: '🏦 Tiền trong ngân hàng', value: `${formatMoney(currentSavings)} xu`, inline: true },
                { name: '📅 Hạn chót', value: new Date(dueAt).toLocaleString('vi-VN'), inline: false },
                { name: '⚠️ Lưu ý', value: 'Nếu rút trước hạn, bạn sẽ bị khấu trừ 50% số tiền gửi.', inline: false }
            );
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`deposit_confirm_${uid}_${amount}_${termDays}`).setLabel('✅ Đồng ý').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`deposit_cancel_${uid}`).setLabel('❌ Không đồng ý').setStyle(ButtonStyle.Danger)
        );
        return message.reply({ embeds: [embed], components: [row] });
    }

    // ===== WITHDRAW =====
    if (['withdraw', 'rut'].includes(command)) {
        const { data, userData } = getUserData(uid);
        const amount = parseInt(args[0]);
        const withdraw = amount ? Math.min(amount, userData.bank.savings) : userData.bank.savings;
        if (!withdraw) return message.reply('❌ Không có tiền trong ngân hàng!');
        const beforeDue = userData.bank.depositActive && userData.bank.depositDueAt && new Date(userData.bank.depositDueAt).getTime() > Date.now();
        let received = withdraw;
        if (beforeDue) {
            const penalty = Math.floor(withdraw * 0.5);
            received = withdraw - penalty;
            userData.bank.depositActive = false;
            userData.bank.depositAmount = 0;
            userData.bank.depositDueAt = null;
            userData.bank.depositTermDays = 0;
        }
        userData.bank.savings -= withdraw;
        userData.balance += received;
        recordMoneyHistory(userData, received, beforeDue ? 'withdraw from bank early' : 'withdraw from bank');
        if (userData.bank.savings === 0) {
            userData.bank.depositedAt = null;
            userData.bank.depositActive = false;
            userData.bank.depositAmount = 0;
            userData.bank.depositDueAt = null;
            userData.bank.depositTermDays = 0;
        }
        saveData(data);
        return message.reply(beforeDue
            ? `⚠️ Bạn rút trước hạn, mất **${formatMoney(withdraw - received)} xu** phí phạt. Đã nhận **${formatMoney(received)} xu**.`
            : `✅ Đã rút **${formatMoney(withdraw)} xu**. Số dư mới: ${formatMoney(userData.balance)} xu`);
    }

    // ===== BORROW =====
    if (['borrow', 'vay'].includes(command)) {
        const amount = parseInt(args[0]);
        const termDays = parseInt(args[1]);
        if (!amount || amount <= 0 || !termDays || termDays <= 0) return message.reply('❌ `!borrow Số Ngày`\nVí dụ: `!borrow 1000000 7`');
        if (termDays > 7) return message.reply('❌ Thời gian vay tối đa là 7 ngày.');
        const { data, userData } = getUserData(uid);
        if ((userData.margin?.borrowed || 0) > 0) return message.reply('❌ Bạn vẫn còn khoản vay đang hoạt động.');
        const netWorth = calcNetWorth(userData, data.stockPrices);
        const maxBorrow = netWorth * 0.5;
        const currentBorrow = userData.margin?.borrowed || 0;
        if (currentBorrow + amount > maxBorrow)
            return message.reply(`❌ Vượt hạn mức vay! Tối đa ${formatMoney(maxBorrow)} xu (50% tài sản thuần)`);
        const dueAt = new Date(Date.now() + termDays * 86_400_000).toISOString();
        const embed = new EmbedBuilder()
            .setTitle('💸 XÁC NHẬN VAY VỐN')
            .setColor(0xff6600)
            .setDescription(`Bạn sắp vay **${formatMoney(amount)} xu** trong **${termDays} ngày**.`)
            .addFields(
                { name: '💵 Tổng tài sản hiện tại', value: `${formatMoney(netWorth)} xu`, inline: true },
                { name: '📅 Hạn trả', value: new Date(dueAt).toLocaleString('vi-VN'), inline: false },
                { name: '⚠️ Lưu ý', value: 'Nếu quá hạn và không trả, hệ thống sẽ xử lý nợ theo quy định: phá sản hoặc tịch thu tài sản.', inline: false }
            );
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`borrow_confirm_${uid}_${amount}_${termDays}`).setLabel('✅ Đồng ý').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`borrow_cancel_${uid}`).setLabel('❌ Không đồng ý').setStyle(ButtonStyle.Danger)
        );
        return message.reply({ embeds: [embed], components: [row] });
    }

    // ===== REPAY =====
    if (['repay', 'travay'].includes(command)) {
        const { data, userData } = getUserData(uid);
        const amount = parseInt(args[0]);
        const repay = amount ? Math.min(amount, userData.margin.borrowed || 0) : (userData.margin.borrowed || 0);
        if (!repay) return message.reply('❌ Bạn không có dư nợ để trả!');
        if (userData.balance < repay) return message.reply(`❌ Không đủ tiền! Cần ${formatMoney(repay)} xu`);
        userData.balance -= repay;
        recordMoneyHistory(userData, -repay, 'repay margin');
        const wasDue = userData.margin.dueAt && new Date(userData.margin.dueAt).getTime() > Date.now();
        userData.margin.borrowed = (userData.margin.borrowed || 0) - repay;
        let creditMsg = '';
        if (userData.margin.borrowed <= 0) {
            userData.margin.borrowed = 0; userData.margin.borrowedAt = null; userData.margin.dueAt = null; userData.margin.termDays = 0;
            // Trả hết nợ đúng hạn: +10 điểm tín nhiệm
            if (wasDue) {
                addCreditScore(userData, 10, 'Trả hết nợ đúng hạn');
                userData.timesRepaidOnTime = (userData.timesRepaidOnTime || 0) + 1;
                creditMsg = `\n💳 Điểm tín nhiệm: **+10** → ${userData.creditScore}`;
            }
        } else userData.margin.borrowedAt = new Date().toISOString();
        const newAchs = checkAchievements(userData, data, { repaidOnTime: wasDue && userData.margin.borrowed <= 0 });
        const newBadges = checkInvestorBadges(userData, data);
        saveData(data);
        let reply = `✅ Đã trả **${formatMoney(repay)} xu**. Dư nợ: ${formatMoney(userData.margin.borrowed)} xu${creditMsg}`;
        if (newAchs.length > 0) reply += `\n🏅 Thành tích mới: ${newAchs.map(id => ACHIEVEMENTS.find(a => a.id===id)?.name).join(', ')}`;
        if (newBadges.length > 0) reply += `\n🏷️ Danh hiệu mới: ${newBadges.map(b => b.name).join(', ')}`;
        return message.reply(reply);
    }

    // ===== TRANSFER =====
    if (['transfer', 'chuyentien', 'ck'].includes(command)) {
        const target = message.mentions.users.first();
        const amount = parseInt(args[1]);
        if (!target) return message.reply('❌ `!transfer @user Số` (hoặc `!ck @user Số`)');
        if (!amount || amount <= 0) return message.reply('❌ Số tiền phải > 0!');
        if (target.id === uid) return message.reply('❌ Không thể chuyển cho chính mình!');
        if (target.bot) return message.reply('❌ Không thể chuyển tiền cho bot!');
        const data = loadData();
        const userData = ensureUserData(data, uid);
        const tData = ensureUserData(data, target.id);
        if (userData.balance < amount) return message.reply('❌ Không đủ tiền!');

        // ── Phí chuyển khoản nhỏ (2%) để hạn chế động lực rửa tiền qua acc phụ ──
        const fee = Math.ceil(amount * 0.02);
        const received = amount - fee;

        // ── Giới hạn số lần chuyển/ngày để tránh chia nhỏ giao dịch né cảnh báo ──
        const today = new Date().toDateString();
        if (!userData.transferDayKey || userData.transferDayKey !== today) {
            userData.transferDayKey = today;
            userData.transferCountToday = 0;
        }
        const DAILY_TRANSFER_LIMIT = 20;
        if ((userData.transferCountToday || 0) >= DAILY_TRANSFER_LIMIT) {
            return message.reply(`❌ Bạn đã chuyển tiền quá **${DAILY_TRANSFER_LIMIT} lần** hôm nay. Vui lòng thử lại vào ngày mai.`);
        }

        // ── Phát hiện chuyển qua lại vòng tròn (khả năng rửa tiền giữa 2 acc) ──
        const isLoop = recordTransferAndCheckLoop(data, uid, target.id, amount);

        userData.balance -= amount;
        userData.transferCountToday = (userData.transferCountToday || 0) + 1;
        recordMoneyHistory(userData, -amount, `transfer to ${target.id}`);
        tData.balance += received;
        recordMoneyHistory(tData, received, `transfer from ${uid} (phí ${fee})`);
        warnSuspiciousAssets(data, message.guild, target.id, tData, `transfer from ${uid}`);

        if (isLoop) {
            flagCheatAlert(data, message.guild, uid, userData.exchangeId, `Chuyển tiền qua lại bất thường với <@${target.id}> trong thời gian ngắn (nghi ngờ rửa tiền/twink acc)`);
        }

        saveData(data);
        return message.reply(`✅ Đã chuyển **${formatMoney(amount)} xu** cho ${target} (phí 2%: ${formatMoney(fee)} xu, người nhận được ${formatMoney(received)} xu). Số dư: ${formatMoney(userData.balance)} xu`);
    }

    // ===== DICE =====
    if (['dice', 'xx'].includes(command)) {
        const bet = parseInt(args[0]);
        if (!bet || bet <= 0) return message.reply('❌ `!dice Số`');
        const { data, userData } = getUserData(uid);
        if (!isRegistered(userData)) return message.reply('❌ Bạn cần đăng ký trước bằng `!dangky` để bắt đầu chơi chứng khoán.');
        if (userData.balance < bet) return message.reply('❌ Không đủ tiền!');
        const roll = Math.floor(Math.random() * 6) + 1;
        const win = roll >= 4;
        if (win) { userData.balance += bet; userData.diceWins = (userData.diceWins||0)+1; }
        else { userData.balance -= bet; userData.diceLosses = (userData.diceLosses||0)+1; }
        userData.dicePlays = (userData.dicePlays||0)+1;
        const newAchs = checkAchievements(userData, data, {});
        const newBadges = checkInvestorBadges(userData, data);
        saveData(data);
        const embed = new EmbedBuilder().setTitle(`🎲 ${roll} — ${win ? 'THẮNG!' : 'THUA!'}`)
            .setColor(win ? 0x00ff88 : 0xff4444)
            .addFields(
                { name: 'Cược', value: `${formatMoney(bet)} xu`, inline: true },
                { name: win ? 'Nhận' : 'Mất', value: `${formatMoney(bet)} xu`, inline: true },
                { name: 'Số dư', value: `${formatMoney(userData.balance)} xu`, inline: true }
            );
        if (newAchs.length > 0) embed.addFields({ name: '🏅 Thành tích mới!', value: newAchs.map(id => { const a = ACHIEVEMENTS.find(x => x.id === id); return `${a?.emoji} **${a?.name}**`; }).join('\n') });
        if (newBadges.length > 0) embed.addFields({ name: '🏷️ Danh hiệu mới!', value: newBadges.map(b => `${b.emoji} **${b.name}**`).join('\n') });
        return message.reply({ embeds: [embed] });
    }

    // ===== SLOT =====
    if (['slot', 'quay'].includes(command)) {
        const bet = parseInt(args[0]);
        if (!bet || bet <= 0) return message.reply('❌ `!slot Số`');
        const { data, userData } = getUserData(uid);
        if (!isRegistered(userData)) return message.reply('❌ Bạn cần đăng ký trước bằng `!dangky` để bắt đầu chơi chứng khoán.');
        if (userData.balance < bet) return message.reply('❌ Không đủ tiền!');
        const sym = ['🍒', '🍋', '🍊', '🍇', '💎', '7'];
        const res = [sym[Math.floor(Math.random() * 6)], sym[Math.floor(Math.random() * 6)], sym[Math.floor(Math.random() * 6)]];
        let win = 0, txt = '';
        if (res[0] === res[1] && res[1] === res[2]) {
            const mult = res[0] === '7' ? 10 : res[0] === '💎' ? 5 : 3;
            win = bet * mult;
            userData.balance += win;
            txt = `JACKPOT x${mult}!`;
            userData.slotWins = (userData.slotWins||0)+1;
        } else if (res[0] === res[1] || res[1] === res[2] || res[0] === res[2]) {
            win = Math.floor(bet * 1.5);
            userData.balance += win;
            txt = 'Thắng nhỏ x1.5';
            userData.slotWins = (userData.slotWins||0)+1;
        } else {
            win = -bet;
            userData.balance -= bet;
            txt = 'Thua!';
            userData.slotLosses = (userData.slotLosses||0)+1;
        }
        userData.slotPlays = (userData.slotPlays||0)+1;
        const newAchs = checkAchievements(userData, data, {});
        const newBadges = checkInvestorBadges(userData, data);
        saveData(data);
        const embed = new EmbedBuilder().setTitle(`🎰 ${res.join(' | ')} — ${txt}`)
            .setColor(win > 0 ? 0xffd700 : 0xff4444)
            .addFields(
                { name: 'Cược', value: `${formatMoney(bet)} xu`, inline: true },
                { name: win > 0 ? 'Thắng' : 'Thua', value: `${win > 0 ? '+' : ''}${formatMoney(win)} xu`, inline: true },
                { name: 'Số dư', value: `${formatMoney(userData.balance)} xu`, inline: true },
                { name: '📊 Slot stats', value: `${userData.slotPlays} ván | ${userData.slotWins}W / ${userData.slotLosses}L`, inline: false }
            );
        if (newAchs.length > 0) embed.addFields({ name: '🏅 Thành tích mới!', value: newAchs.map(id => { const a = ACHIEVEMENTS.find(x => x.id === id); return `${a?.emoji} **${a?.name}**`; }).join('\n') });
        if (newBadges.length > 0) embed.addFields({ name: '🏷️ Danh hiệu mới!', value: newBadges.map(b => `${b.emoji} **${b.name}**`).join('\n') });
        return message.reply({ embeds: [embed] });
    }

    // ===== HISTORY =====
    if (['history', 'lichsu'].includes(command)) {
        const { userData } = getUserData(uid);
        const hist = (userData.tradeHistory || []).slice(0, 10);
        let text = hist.length === 0 ? '*Chưa có giao dịch*' : '';
        for (const t of hist) {
            const e = t.type === 'buy' ? '🟢' : '🔴';
            text += `${e} **${t.type.toUpperCase()}** ${t.code} x${t.qty} — ${formatMoney(t.total)} xu\n`;
        }
        return message.reply({ embeds: [new EmbedBuilder().setTitle('📜 LỊCH SỬ GIAO DỊCH').setColor(0x9b59b6).setDescription(text)] });
    }

    // ===== CREDIT SCORE =====
    if (['credit', 'tinnhiem'].includes(command)) {
        const { userData } = getUserData(uid);
        const score = userData.creditScore || 700;
        const tier = getCreditTier(score);
        const bar = Math.floor((score / 1000) * 20);
        const barDisplay = '🟩'.repeat(bar) + '⬛'.repeat(20 - bar);
        const history = (userData.creditHistory || []).slice(0, 8);
        let histText = history.length === 0 ? '*Chưa có biến động*' : '';
        for (const h of history) {
            const d = h.delta >= 0 ? `+${h.delta}` : `${h.delta}`;
            histText += `${h.delta >= 0 ? '📈' : '📉'} **${d}** điểm → ${h.score} | ${h.reason}\n`;
        }
        const embed = new EmbedBuilder()
            .setTitle('💳 ĐIỂM TÍN NHIỆM')
            .setColor(score >= 800 ? 0xffd700 : score >= 700 ? 0x00ff88 : score >= 500 ? 0xff8800 : 0xff0000)
            .addFields(
                { name: `${tier.emoji} Điểm hiện tại: **${score}/1000**`, value: barDisplay, inline: false },
                { name: '🏷️ Hạng tín nhiệm', value: tier.label, inline: true },
                { name: '💸 Hạn mức vay', value: `x${tier.loanMultiplier} tài sản ròng`, inline: true },
                { name: '📊 Lãi suất vay', value: tier.interestDiscount >= 0 ? `Giảm ${(tier.interestDiscount*100).toFixed(0)}%` : `Tăng ${Math.abs(tier.interestDiscount*100).toFixed(0)}%`, inline: true },
                { name: '📋 Bảng phân loại', value: '💎 850+: Khách VIP\n✅ 700+: Bình thường\n⚠️ 500+: Rủi ro\n🔴 300+: Nợ xấu\n☠️ 0+: Phá sản', inline: false },
                { name: '📈 Lịch sử gần đây', value: histText, inline: false }
            )
            .setFooter({ text: 'Trả nợ đúng hạn: +10 | Bị siết nợ: -50 | Tín nhiệm cao = lãi suất thấp hơn' });
        return message.reply({ embeds: [embed] });
    }

    // ===== INVESTOR BADGES =====
    if (['badges', 'danhieu'].includes(command)) {
        const { data, userData } = getUserData(uid);
        // Cập nhật badges mới nếu có
        const newBadges = checkInvestorBadges(userData, data);
        if (newBadges.length > 0) saveData(data);

        const owned = userData.investorBadges || [];
        let text = '';
        for (const badge of INVESTOR_BADGES) {
            const has = owned.includes(badge.id);
            text += `${has ? badge.emoji : '🔒'} **${badge.name}** ${has ? '✅' : ''}\n┗ ${badge.desc}\n`;
        }
        const embed = new EmbedBuilder()
            .setTitle('🏷️ DANH HIỆU NHÀ ĐẦU TƯ')
            .setColor(0xe67e22)
            .setDescription(text)
            .setFooter({ text: `Đã mở: ${owned.length}/${INVESTOR_BADGES.length} danh hiệu` });
        return message.reply({ embeds: [embed] });
    }

    // ===== STATS (HỒ SƠ THỐNG KÊ CHI TIẾT) =====
    if (['stats', 'thongke'].includes(command)) {
        const target = message.mentions.users.first();
        const targetUid = target ? target.id : uid;
        const { data, userData } = getUserData(targetUid);
        const targetName = target ? target.username : message.author.username;
        const netWorth = calcNetWorth(userData, data.stockPrices);

        const embed = new EmbedBuilder()
            .setTitle(`📊 HỒ SƠ THỐNG KÊ — ${targetName}`)
            .setColor(0x3498db)
            .addFields(
                { name: '💹 Giao dịch', value: [
                    `Tổng giao dịch: **${userData.totalTrades || 0}**`,
                    `Tổng lợi nhuận: **${formatMoney(userData.totalProfit || 0)} xu**`,
                    `GD đơn lớn nhất: **${formatMoney(userData.maxSingleTrade || 0)} xu**`,
                    `Tổng thuế đã nộp: **${formatMoney(userData.totalTaxPaid || 0)} xu**`,
                ].join('\n'), inline: false },
                { name: '🏦 Ngân hàng & Vay vốn', value: [
                    `Lần vay tổng: **${userData.timesRepaidOnTime || 0}** lần trả đúng hạn`,
                    `Số lần bị siết nợ: **${userData.timesLiquidated || 0}** lần`,
                    `Điểm tín nhiệm: **${userData.creditScore || 700}/1000**`,
                ].join('\n'), inline: false },
                { name: '🎮 Mini Games', value: [
                    `🎰 Slot: ${userData.slotPlays || 0} ván | Thắng: ${userData.slotWins || 0} | Thua: ${userData.slotLosses || 0}`,
                    `🎲 Dice: ${userData.dicePlays || 0} ván | Thắng: ${userData.diceWins || 0} | Thua: ${userData.diceLosses || 0}`,
                ].join('\n'), inline: false },
                { name: '📅 Mốc thời gian', value: [
                    `Tham gia: **${userData.joinedAt ? new Date(userData.joinedAt).toLocaleDateString('vi-VN') : 'N/A'}**`,
                    `Tài sản đỉnh cao: **${formatMoney(userData.peakNetWorth || 0)} xu**`,
                    `Tài sản hiện tại: **${formatMoney(netWorth)} xu**`,
                    `Level hiện tại: **${userData.level}**`,
                    `Map hiện tại: **Map ${userData.mapStage || 1}**`,
                ].join('\n'), inline: false },
                { name: '🏅 Thành tích', value: `${userData.achievements?.length || 0}/${ACHIEVEMENTS.length} thành tích`, inline: true },
                { name: '🏷️ Danh hiệu', value: `${userData.investorBadges?.length || 0}/${INVESTOR_BADGES.length} danh hiệu`, inline: true },
                { name: '🏠 Bất động sản', value: `${(userData.properties || []).length} tài sản`, inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'Dùng !profile để xem tổng hợp đầy đủ' });
        return message.reply({ embeds: [embed] });
    }

    // ===== HELP 2 =====
    if (['help2', 'h2'].includes(command)) {
        const embed = new EmbedBuilder()
            .setTitle('📚 DANH SÁCH LỆNH (2/2) — Hệ thống nâng cao')
            .setColor(0x9b59b6)
            .addFields(
                { name: '💳 TÍN NHIỆM & DANH HIỆU', value: '`!credit`/`!tinnhiem` — Xem điểm tín nhiệm & lịch sử\n`!badges`/`!danhieu` — Xem danh hiệu Nhà Đầu Tư\n`!stats [@user]`/`!thongke` — Hồ sơ thống kê chi tiết', inline: false },
                { name: '⭐ HỆ THỐNG CẤP ĐỘ', value: '`Lv 10` — Mở khóa Slot 🎰\n`Lv 20` — Mở khóa Dice 🎲\n`Lv 25` + 50M VND — Đủ điều kiện sang Map 2\n`Lv 50` + 50M CAD — Đủ điều kiện sang Map 3\nEXP nhận từ giao dịch x2 ở Map 2, x3 ở Map 3', inline: false },
                { name: '💳 ĐIỂM TÍN NHIỆM', value: '`850+` 💎 Khách VIP — Hạn mức vay x1.5\n`700+` ✅ Bình thường — Vay tiêu chuẩn\n`500+` ⚠️ Rủi ro — Hạn mức giảm, lãi cao\n`300+` 🔴 Nợ xấu — Hạn mức rất thấp\n**+10** khi trả nợ đúng hạn | **-50** khi bị siết nợ', inline: false },
                { name: '🌍 SỰ KIỆN THỊ TRƯỜNG', value: 'Bot tự động tạo sự kiện toàn thị trường theo giờ:\n💥 Khủng hoảng kinh tế | 🚀 Bùng nổ công nghệ\n📈 Lạm phát | 🏦 Khủng hoảng ngân hàng\n⚔️ Chiến tranh thương mại | 🌿 Cách mạng xanh\nMỗi sự kiện tác động lên toàn bộ cổ phiếu trên market!', inline: false },
                { name: '🏷️ DANH HIỆU NHÀ ĐẦU TƯ', value: '🐳 Cá Voi — Lãi 10M | 🏦 Đại Gia NH — Gửi 100M\n🎰 Con Bạc — Thua Slot 100L | 💀 Kẻ Vỡ Nợ — Bị siết\n🌈 Phù Thủy — 7+ cổ phiếu cùng lúc\n💸 Tay Chơi Lớn — GD đơn > 100M\n🦾 Bàn Tay Thép — 1000 giao dịch\n... và nhiều hơn nữa! Dùng `!badges` để xem tất cả', inline: false },
                { name: '📊 THÀNH TÍCH MỚI', value: '👑 Vua Lợi Nhuận — Lãi 100M tích lũy\n🧠 Thiên Tài ĐT — Lãi 1 tỷ tích lũy\n🎰 Dân Chơi Máy — Slot 100 ván\n🎲 Cúc Xắc HT — Dice 50 ván\n✅ Con Nợ Đúng Hẹn — Trả nợ đúng hạn\n🌪️ Vượt Bão TT — Sống sót qua khủng hoảng', inline: false }
            )
            .setFooter({ text: '!help — danh sách lệnh cơ bản | !huongdan — hướng dẫn người mới' });
        return message.reply({ embeds: [embed] });
    }

    // ==================== 👑 ADMIN COMMANDS ====================

    if (command === 'admin') {
        if (!isAdmin(uid)) return message.reply('⛔ Không có quyền!');
        const data = loadData();
        const sub = args[0]?.toLowerCase();

        if (!sub) {
            const sessionStatus = data.sessionOpen ? '🟢 ĐANG MỞ' : '🔴 ĐÓNG PHIÊN';
            const embed = new EmbedBuilder()
                .setTitle('👑 ADMIN PANEL v5')
                .setColor(0xff6600)
                .addFields(
                    { name: '📊 Thống kê', value: `👥 Người chơi: **${Object.keys(data.users).length}**\n🔄 Giao dịch: **${data.totalTransactions}**\n📈 Phiên: **${sessionStatus}**`, inline: false },
                    { name: '🛠️ Quản lý thị trường', value: '`!admin open` — Mở phiên\n`!admin close` — Đóng phiên\n`!admin set MÃ GIÁ` — Đặt giá\n`!admin change MÃ %` — Thay đổi %\n`!admin news MÃ` — Kích hoạt tin tức\n`!admin resetmarket` — Reset thị trường\n`!admin boostbds MAP MÃ %` — Tăng/giảm giá BĐS', inline: false },
                    { name: '👥 Quản lý người dùng', value: '`!admin give @user vnd/cad/usd SỐ` — Tặng tiền\n`!admin giveall vnd/cad/usd SỐ` — Tặng tất cả\n`!admin setbalance @user SỐ` — Đặt số dư\n`!admin setlevel @user SỐ` — Đặt level\n`!admin reset @user` — Reset user\n`!admin profile @user` — Xem profile\n`!admin ban @user PHÚT` — Cấm giao dịch tạm thời\n`!admin unban @user` — Bỏ cấm giao dịch', inline: false },
                    { name: '🛡️ Chống gian lận', value: '`!admin suspicious` — Cảnh báo tài sản bất thường\n`!admin cheats` — Cảnh báo nghi gian lận (rửa tiền,...)\n`!admin source @user` — Truy nguồn tiền của 1 người\n`!admin adminlog` — Log lệnh admin gần đây', inline: false },
                    { name: '🔑 Quyền hạn', value: '`!admin addadmin @user` — Thêm admin\n`!admin removeadmin @user` — Xóa admin\n`!admin listadmin` — Danh sách admin\n`!admin stats` — Thống kê toàn server', inline: false },
                    { name: '🎁 Quà tặng', value: '`!admin giveaway SỐ` — Tạo giveaway\n`!admin dailyall SỐ` — Thưởng hàng ngày cho tất cả', inline: false }
                );
            return message.reply({ embeds: [embed] });
        }

        // ===== Mở phiên =====
        if (sub === 'open' || sub === 'openmarket') {
            if (data.sessionOpen) return message.reply('⚠️ Phiên đang mở rồi!');
            const now = new Date();
            await doOpenSession(data, now.toDateString(), now, `👑 Admin ${message.author.displayName} mở phiên thủ công`);
            return message.reply('✅ Đã mở phiên giao dịch!');
        }

        // ===== Đóng phiên =====
        if (sub === 'close' || sub === 'closemarket') {
            if (!data.sessionOpen) return message.reply('⚠️ Phiên đang đóng rồi!');
            const now = new Date();
            await doCloseSession(data, now.toDateString(), now, `👑 Admin ${message.author.displayName} đóng phiên thủ công`);
            return message.reply('✅ Đã đóng phiên giao dịch!');
        }

        // ===== ADD ADMIN =====
        if (sub === 'addadmin') {
            if (!isRootAdmin(uid)) return message.reply('❌ Chỉ root admin mới có thể thêm/xóa admin!');
            const target = message.mentions.users.first();
            if (!target) return message.reply('❌ `!admin addadmin @user`');
            if (!data.adminIds.includes(target.id)) data.adminIds.push(target.id);
            logAdminAction(data, uid, `addadmin ${target.id}`);
            saveData(data);
            return message.reply(`✅ Đã thêm ${target} vào danh sách admin!`);
        }

        // ===== REMOVE ADMIN =====
        if (sub === 'removeadmin') {
            if (!isRootAdmin(uid)) return message.reply('❌ Chỉ root admin mới có thể thêm/xóa admin!');
            const target = message.mentions.users.first();
            if (!target) return message.reply('❌ `!admin removeadmin @user`');
            if (ROOT_ADMIN_IDS.includes(target.id)) return message.reply('❌ Không thể xóa root admin!');
            data.adminIds = data.adminIds.filter(id => id !== target.id);
            logAdminAction(data, uid, `removeadmin ${target.id}`);
            saveData(data);
            return message.reply(`✅ Đã xóa ${target} khỏi danh sách admin!`);
        }

        // ===== LIST ADMIN =====
        if (sub === 'listadmin') {
            let text = '**Root Admin:**\n';
            for (const id of ROOT_ADMIN_IDS) {
                const member = message.guild.members.cache.get(id);
                text += `👑 ${member ? member.displayName : id}\n`;
            }
            text += '\n**Admin:**\n';
            if (data.adminIds.length === 0) text += '*Chưa có*\n';
            for (const id of data.adminIds) {
                const member = message.guild.members.cache.get(id);
                text += `🔰 ${member ? member.displayName : id}\n`;
            }
            return message.reply({ embeds: [new EmbedBuilder().setTitle('👑 DANH SÁCH ADMIN').setDescription(text).setColor(0xff6600)] });
        }

        // ===== PROFILE ANYONE =====
        if (sub === 'profile') {
            const target = message.mentions.users.first();
            if (!target) return message.reply('❌ `!admin profile @user`');
            const { data: d, userData } = getUserData(target.id);
            return message.reply({ embeds: [createProfileEmbed(target, d, userData)] });
        }

        // ===== SUSPICIOUS ASSETS =====
        if (sub === 'suspicious') {
            const list = (data.suspiciousAssets || []).slice(0, 10);
            if (list.length === 0) return message.reply('ℹ️ Chưa có cảnh báo tài sản bất thường nào.');
            let text = '';
            for (const entry of list) {
                const time = new Date(entry.time).toLocaleString('vi-VN');
                text += '⏱ ' + time + ' — ID: **' + entry.exchangeId + '** — Discord: `' + entry.userId + '` — ' + formatMoney(entry.netWorth) + ' xu — ' + entry.reason + '\n';
            }
            return message.reply({ embeds: [new EmbedBuilder().setTitle('⚠️ CẢNH BÁO TÀI SẢN BẤT THƯỜNG').setDescription(text).setColor(0xff0000)] });
        }

        // ===== CHEAT ALERTS (rửa tiền, spam, v.v.) =====
        if (sub === 'cheats' || sub === 'cheat') {
            const list = (data.cheatAlerts || []).slice(0, 10);
            if (list.length === 0) return message.reply('ℹ️ Chưa có cảnh báo nghi gian lận nào.');
            let text = '';
            for (const entry of list) {
                const time = new Date(entry.time).toLocaleString('vi-VN');
                text += `⏱ ${time} — ID: **${entry.exchangeId}** — Discord: \`${entry.userId}\` — ${entry.reason}\n`;
            }
            return message.reply({ embeds: [new EmbedBuilder().setTitle('🚨 CẢNH BÁO NGHI GIAN LẬN').setDescription(text).setColor(0xff0000)] });
        }

        // ===== BAN / UNBAN (cấm giao dịch tạm thời) =====
        if (sub === 'ban') {
            const target = message.mentions.users.first();
            const minutes = parseInt(args[2]);
            if (!target || !minutes || minutes <= 0) return message.reply('❌ `!admin ban @user PHÚT`');
            const { data: bData, userData: tData } = getUserData(target.id);
            tData.tradeBanUntil = new Date(Date.now() + minutes * 60_000).toISOString();
            logAdminAction(bData, uid, `ban ${target.id} for ${minutes}m`);
            saveData(bData);
            return message.reply(`✅ Đã cấm giao dịch ${target} trong **${minutes} phút**.`);
        }
        if (sub === 'unban') {
            const target = message.mentions.users.first();
            if (!target) return message.reply('❌ `!admin unban @user`');
            const { data: bData, userData: tData } = getUserData(target.id);
            tData.tradeBanUntil = null;
            logAdminAction(bData, uid, `unban ${target.id}`);
            saveData(bData);
            return message.reply(`✅ Đã bỏ cấm giao dịch cho ${target}.`);
        }

        // ===== BOOST BẤT ĐỘNG SẢN =====
        if (sub === 'boostbds') {
            const mapNum = parseInt(args[1]);
            const typeId = args[2]?.toUpperCase();
            const pct = parseFloat(args[3]);
            const info = getRealEstateInfo(mapNum, typeId);
            if (!info || isNaN(pct)) return message.reply('❌ `!admin boostbds MAP MÃ %`\nVí dụ: `!admin boostbds 1 NHAPHO 15` (tăng 15%)');
            getRealEstateCurrentPrice(data, mapNum, typeId); // đảm bảo record đã được khởi tạo
            const key = `${mapNum}_${typeId}`;
            data.realEstate[key].boostPct = (data.realEstate[key].boostPct || 0) + pct;
            logAdminAction(data, uid, `boostbds ${typeId} map${mapNum} ${pct}%`);
            saveData(data);
            return message.reply(`✅ Đã ${pct >= 0 ? 'tăng' : 'giảm'} giá **${info.name}** (Map ${mapNum}) thêm **${pct}%**. Giá mới: ${fmtCur(getRealEstateCurrentPrice(data, mapNum, typeId), mapNum)}`);
        }

        // ===== SET PRICE =====
        if (sub === 'set') {
            const code = args[1]?.toUpperCase(), val = parseFloat(args[2]);
            if (!code || !STOCKS[code] || isNaN(val)) return message.reply('❌ `!admin set MÃ GIÁ`');
            data.stockPrices[code] = val;
            saveData(data);
            return message.reply(`✅ Đặt **${code}** = ${formatMoney(val)} xu`);
        }

        // ===== CHANGE % =====
        if (sub === 'change') {
            const code = args[1]?.toUpperCase(), pct = parseFloat(args[2]);
            if (!code || isNaN(pct)) return message.reply('❌ `!admin change MÃ %`');
            const codes = code === 'ALL' ? Object.keys(STOCKS) : [code];
            for (const c of codes) {
                if (data.stockPrices[c]) data.stockPrices[c] = Math.round(data.stockPrices[c] * (1 + pct / 100));
            }
            saveData(data);
            return message.reply(`✅ **${code}** thay đổi **${pct}%**`);
        }

        // ===== NEWS =====
        if (sub === 'news') {
            const code = args[1]?.toUpperCase();
            if (!code || !STOCKS[code]) return message.reply('❌ `!admin news MÃ`');
            const info = STOCKS[code];
            const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
            const text = template.text.replace('{name}', info.name).replace('{sector}', info.sector);
            const impact = template.impact[0] + Math.random() * (template.impact[1] - template.impact[0]);
            const oldPrice = data.stockPrices[code];
            let newPrice = Math.round(oldPrice * (1 + impact) * 10) / 10;
            if (newPrice < 100) newPrice = 100;
            data.stockPrices[code] = newPrice;
            saveData(data);
            const pct = (impact * 100).toFixed(1);
            const isPos = impact >= 0;
            for (const guild of client.guilds.cache.values()) {
                const channel = getAnnounceChannel(guild);
                if (!channel) continue;
                channel.send({
                    embeds: [new EmbedBuilder()
                        .setTitle(`📰 TIN TỨC THỊ TRƯỜNG${isPos ? ' — TIN HOT' : ' — CẢNH BÁO'}`)
                        .setDescription(`**${text}**`)
                        .setColor(isPos ? 0x00ff88 : 0xff4444)
                        .addFields(
                            { name: `${info.emoji} ${code}`, value: `${formatMoney(oldPrice)} -> **${formatMoney(newPrice)} xu**`, inline: true },
                            { name: 'Tác động', value: `${isPos ? '+' : ''}${pct}%`, inline: true }
                        )]
                }).catch(() => { });
            }
            return message.reply(`✅ Đã phát tin tức cho **${code}** (${isPos ? '+' : ''}${pct}%)`);
        }

        // ===== GIVE (FIXED) =====
        // ===== GIVE — !admin give @user vnd/cad/usd SỐ =====
        if (sub === 'give') {
            const target = message.mentions.users.first();
            const currency = args[2]?.toLowerCase();   // vnd | cad | usd
            const amount = parseFloat(args[3]);
            if (!target || !['vnd','cad','usd'].includes(currency) || isNaN(amount) || amount <= 0)
                return message.reply('❌ `!admin give @user vnd/cad/usd SỐ`\nVí dụ: `!admin give @player vnd 5000000`');

            const { data: gData, userData: tData } = getUserData(target.id);
            if (currency === 'vnd') { tData.balanceVND = (tData.balanceVND||0) + amount; }
            else if (currency === 'cad') { tData.balanceCAD = (tData.balanceCAD||0) + amount; }
            else { tData.balanceUSD = (tData.balanceUSD||0) + amount; }
            tData.balance = getWallet(tData);

            const mapNum = currency === 'usd' ? 3 : currency === 'cad' ? 2 : 1;
            recordMoneyHistory(tData, amount, `admin give ${currency.toUpperCase()} from ${uid}`);
            logAdminAction(gData, uid, `give ${formatMoney(amount)} ${currency.toUpperCase()} to ${target.id}`);
            warnSuspiciousAssets(gData, message.guild, target.id, tData, `admin give ${amount} ${currency}`);
            saveData(gData);
            return message.reply(`✅ Đã tặng **${fmtCur(amount, mapNum)}** cho ${target}\n🇻🇳 VND: ${fmtCur(tData.balanceVND||0,1)} | 🇨🇦 CAD: ${fmtCur(tData.balanceCAD||0,2)} | 🇺🇸 USD: ${fmtCur(tData.balanceUSD||0,3)}`);
        }

        // ===== GIVEALL — !admin giveall vnd/cad/usd SỐ =====
        if (sub === 'giveall') {
            const currency = args[1]?.toLowerCase();
            const amount = parseFloat(args[2]);
            if (!['vnd','cad','usd'].includes(currency) || isNaN(amount) || amount <= 0)
                return message.reply('❌ `!admin giveall vnd/cad/usd SỐ`');
            const gData = loadData();
            const mapNum = currency === 'usd' ? 3 : currency === 'cad' ? 2 : 1;
            for (const [uid2, uData] of Object.entries(gData.users)) {
                if (currency === 'vnd') uData.balanceVND = (uData.balanceVND||0) + amount;
                else if (currency === 'cad') uData.balanceCAD = (uData.balanceCAD||0) + amount;
                else uData.balanceUSD = (uData.balanceUSD||0) + amount;
                uData.balance = getWallet(uData);
                recordMoneyHistory(uData, amount, `admin giveall ${currency} from ${uid}`);
            }
            logAdminAction(gData, uid, `giveall ${formatMoney(amount)} ${currency.toUpperCase()}`);
            saveData(gData);
            return message.reply(`✅ Đã tặng **${fmtCur(amount, mapNum)}** cho **${Object.keys(gData.users).length}** người chơi.`);
        }

        // ===== SET BALANCE =====
        if (sub === 'setlevel') {
            const target = message.mentions.users.first();
            const level = parseInt(args[2]);
            if (!target || isNaN(level) || level < 1) return message.reply('❌ `!admin setlevel @user SỐ_LEVEL`');
            const { data, userData: targetData } = getUserData(target.id);
            targetData.level = level;
            targetData.exp = 0;
            logAdminAction(data, uid, `setlevel ${level} for ${target.id}`);
            saveData(data);
            return message.reply(`✅ Đã đặt level của ${target} thành **${level}**.`);
        }

        if (sub === 'setbalance') {
            const target = message.mentions.users.first();
            if (!target) return message.reply('❌ `!admin setbalance @user SỐ`');
            const amount = parseFloat(args[2]);
            if (isNaN(amount) || amount < 0) return message.reply('❌ Số tiền phải >= 0!');

            const { data, userData: targetData } = getUserData(target.id);
            const delta = amount - targetData.balance;
            targetData.balance = amount;
            recordMoneyHistory(targetData, delta, `admin setbalance by ${uid}`);
            logAdminAction(data, uid, `setbalance ${amount} for ${target.id}`);
            saveData(data);
            return message.reply(`✅ Đã đặt số dư của ${target} thành ${formatMoney(amount)} xu.`);
        }

        // ===== SOURCE MONEY =====
        if (sub === 'source') {
            const target = message.mentions.users.first();
            if (!target) return message.reply('❌ `!admin source @user`');
            const { userData: targetData } = getUserData(target.id);
            const hist = (targetData.moneyHistory || []).slice(0, 10);
            if (hist.length === 0) return message.reply(`ℹ️ ${target} chưa có lịch sử thay đổi số dư.`);
            let text = '';
            for (const entry of hist) {
                const time = new Date(entry.time).toLocaleString('vi-VN');
                text += `⏱ ${time} — ${formatMoney(entry.amount)} — Số dư: ${formatMoney(entry.balance)} — ${entry.note}\n`;
            }
            return message.reply({ embeds: [new EmbedBuilder().setTitle(`🔍 NGUỒN TIỀN ${target.username}`).setDescription(text).setColor(0x3498db)] });
        }

        // ===== ADMIN LOG =====
        if (sub === 'adminlog') {
            const data = loadData();
            const log = (data.adminActions || []).slice(-10).reverse();
            if (log.length === 0) return message.reply('ℹ️ Chưa có lệnh admin nào được ghi lại.');
            let text = '';
            for (const entry of log) {
                const adminName = message.guild.members.cache.get(entry.adminId)?.displayName || entry.adminId;
                const time = new Date(entry.time).toLocaleString('vi-VN');
                text += `⏱ ${time} — ${adminName} — ${entry.action}\n`;
            }
            return message.reply({ embeds: [new EmbedBuilder().setTitle('📋 10 LỆNH ADMIN MỚI NHẤT').setDescription(text).setColor(0xff6600)] });
        }

        // ===== RESET USER =====
        if (sub === 'reset') {
            const target = message.mentions.users.first();
            if (!target) return message.reply('❌ `!admin reset @user`');
            const data = loadData();
            const tUser = data.users?.[target.id];
            // Giải phóng các ID định danh về pool để tái sử dụng
            if (tUser) {
                if (tUser.exchangeId)    releaseExchangeId(data, 1, tUser.exchangeId);
                if (tUser.map2ExchangeId) releaseExchangeId(data, 2, tUser.map2ExchangeId);
                if (tUser.map3ExchangeId) releaseExchangeId(data, 3, tUser.map3ExchangeId);
            }
            const oldIds = {
                m1: tUser?.exchangeId || 'N/A',
                m2: tUser?.map2ExchangeId || 'N/A',
                m3: tUser?.map3ExchangeId || 'N/A',
            };
            data.users[target.id] = makeDefaultUserData();
            logAdminAction(data, uid, `reset ${target.id} (IDs released: ${oldIds.m1}/${oldIds.m2}/${oldIds.m3})`);
            saveData(data);
            return message.reply(`✅ Đã reset **${target}**
♻️ ID đã giải phóng: \`${oldIds.m1}\` / \`${oldIds.m2}\` / \`${oldIds.m3}\`
Người này cần dùng \`!dangky\` để đăng ký lại.`);
        }

        // ===== STATS =====
        if (sub === 'stats') {
            let totalBalance = 0, totalStock = 0, totalSavings = 0, totalBorrow = 0;
            for (const uData of Object.values(data.users)) {
                totalBalance += uData.balance;
                totalSavings += uData.bank?.savings || 0;
                totalBorrow += uData.margin?.borrowed || 0;
                for (const [code, pos] of Object.entries(uData.portfolio))
                    totalStock += pos.qty * (data.stockPrices[code] || 0);
            }
            const embed = new EmbedBuilder().setTitle('📊 THỐNG KÊ SERVER').setColor(0x3498db)
                .addFields(
                    { name: '👥 Người chơi', value: `${Object.keys(data.users).length}`, inline: true },
                    { name: '💰 Tổng tiền mặt', value: `${formatMoney(totalBalance)} xu`, inline: true },
                    { name: '🏦 Tổng tiết kiệm', value: `${formatMoney(totalSavings)} xu`, inline: true },
                    { name: '📈 Tổng cổ phiếu', value: `${formatMoney(totalStock)} xu`, inline: true },
                    { name: '📊 Tổng vay margin', value: `${formatMoney(totalBorrow)} xu`, inline: true },
                    { name: '🔄 Tổng giao dịch', value: `${data.totalTransactions}`, inline: true },
                    { name: '⏰ Lệnh giới hạn', value: `${data.limitOrders?.length || 0}`, inline: true },
                    { name: '📊 Phiên', value: data.sessionOpen ? '🟢 MỞ' : '🔴 ĐÓNG', inline: true }
                );
            return message.reply({ embeds: [embed] });
        }

        // ===== RESET MARKET =====
        if (sub === 'resetmarket') {
            for (const code of Object.keys(STOCKS)) {
                data.stockPrices[code] = STOCKS[code].basePrice;
                data.dailyOpen[code] = STOCKS[code].basePrice;
                data.stockHistory[code] = [];
            }
            saveData(data);
            return message.reply('✅ Đã reset thị trường về giá cơ bản!');
        }

        // ===== GIVEAWAY =====
        if (sub === 'giveaway') {
            const amount = parseFloat(args[1]);
            if (isNaN(amount) || amount <= 0) return message.reply('❌ `!admin giveaway SỐ`');
            const giveaway = {
                id: Date.now().toString(),
                amount: amount,
                createdBy: uid,
                createdAt: Date.now(),
                entries: [],
                ended: false,
                winner: null,
            };
            data.giveaways.push(giveaway);
            saveData(data);
            const channel = getAnnounceChannel(message.guild);
            if (channel) {
                channel.send({
                    embeds: [new EmbedBuilder()
                        .setTitle('🎉 GIVEAWAY! 🎉')
                        .setDescription(`Admin đang tổ chức giveaway **${formatMoney(amount)} xu**!\n📝 Tham gia bằng cách react với 🎉 hoặc gõ \`!join giveaway\``)
                        .setColor(0xffd700)
                        .setTimestamp()
                        .setFooter({ text: `ID: ${giveaway.id}` })]
                }).catch(() => { });
            }
            return message.reply(`✅ Đã tạo giveaway **${formatMoney(amount)} xu**!`);
        }

        // ===== JOIN GIVEAWAY =====
        if (command === 'joingiveaway' || command === 'join giveaway') {
            const data = loadData();
            const giveaway = data.giveaways.find(g => !g.ended);
            if (!giveaway) return message.reply('❌ Không có giveaway nào đang diễn ra!');
            if (giveaway.entries.includes(uid)) return message.reply('❌ Bạn đã tham gia rồi!');
            giveaway.entries.push(uid);
            saveData(data);
            return message.reply('✅ Bạn đã tham gia giveaway! Chúc may mắn 🍀');
        }

        // ===== DAILY ALL =====
        if (sub === 'dailyall') {
            const amount = parseFloat(args[1]);
            if (isNaN(amount) || amount <= 0) return message.reply('❌ `!admin dailyall SỐ`');
            let count = 0;
            for (const [uid, uData] of Object.entries(data.users)) {
                uData.balance += amount;
                count++;
            }
            saveData(data);
            const channel = getAnnounceChannel(message.guild);
            if (channel) {
                channel.send({
                    embeds: [new EmbedBuilder()
                        .setTitle('🎁 THƯỞNG HÀNG NGÀY ĐẶC BIỆT!')
                        .setDescription(`Admin đã tặng **${formatMoney(amount)} xu** cho tất cả **${count}** người chơi!`)
                        .setColor(0xf1c40f)]
                }).catch(() => { });
            }
            return message.reply(`✅ Đã tặng **${formatMoney(amount)} xu** cho ${count} người chơi!`);
        }

        // ===== END GIVEAWAY =====
        if (sub === 'endgiveaway') {
            const data = loadData();
            const giveaway = data.giveaways.find(g => !g.ended);
            if (!giveaway) return message.reply('❌ Không có giveaway nào đang diễn ra!');
            if (giveaway.entries.length === 0) {
                giveaway.ended = true;
                saveData(data);
                return message.reply('❌ Không ai tham gia giveaway!');
            }
            const winner = giveaway.entries[Math.floor(Math.random() * giveaway.entries.length)];
            giveaway.winner = winner;
            giveaway.ended = true;
            const { userData: winnerData } = getUserData(winner);
            winnerData.balance += giveaway.amount;
            saveData(data);
            const winnerUser = await client.users.fetch(winner).catch(() => null);
            const channel = getAnnounceChannel(message.guild);
            if (channel) {
                channel.send({
                    embeds: [new EmbedBuilder()
                        .setTitle('🎉 KẾT THÚC GIVEAWAY! 🎉')
                        .setDescription(`Người chiến thắng: ${winnerUser ? winnerUser.toString() : ('#' + winner.slice(0,5))}\n🎁 Nhận được **${formatMoney(giveaway.amount)} xu**!`)
                        .setColor(0xffd700)
                        .setTimestamp()]
                }).catch(() => { });
            }
            return message.reply(`✅ Giveaway đã kết thúc! Người thắng: ${winnerUser ? winnerUser.tag : winner}`);
        }
    }

    // ===== JOIN GIVEAWAY (standalone) =====
    if (command === 'joingiveaway' || command === 'join giveaway') {
        const data = loadData();
        const giveaway = data.giveaways.find(g => !g.ended);
        if (!giveaway) return message.reply('❌ Không có giveaway nào đang diễn ra!');
        if (giveaway.entries.includes(uid)) return message.reply('❌ Bạn đã tham gia rồi!');
        giveaway.entries.push(uid);
        saveData(data);
        return message.reply('✅ Bạn đã tham gia giveaway! Chúc may mắn 🍀');
    }
});

// ==================== 🎯 INTERACTION HANDLER ====================

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isStringSelectMenu()) {
        const parts = interaction.customId.split('_');
        const userId = parts[1];
        if (interaction.user.id !== userId)
            return interaction.reply({ content: '❌ Menu này không phải của bạn!', ephemeral: true });

        const val = interaction.values[0];
        const [action, code] = val.split('_');

        const modal = new ModalBuilder()
            .setCustomId(`modal_${action}_${code}_${userId}`)
            .setTitle(`${action === 'buy' ? 'MUA' : 'BÁN'} ${code}`);
        modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('qty').setLabel('Số lượng cổ phiếu').setStyle(TextInputStyle.Short)
                .setPlaceholder('Nhập số lượng').setRequired(true).setMinLength(1).setMaxLength(12)
        ));
        return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        const parts = interaction.customId.split('_');
        const action = parts[1], code = parts[2], userId = parts[3];
        if (interaction.user.id !== userId)
            return interaction.reply({ content: '❌ Modal này không phải của bạn!', ephemeral: true });
        const qty = parseInt(interaction.fields.getTextInputValue('qty'));
        if (!qty || qty <= 0) return interaction.reply({ content: '❌ Số lượng phải > 0!', ephemeral: true });

        const { data, userData } = getUserData(userId);
        if (!isRegistered(userData, userData.mapStage || 1)) return interaction.reply({ content: '❌ Bạn cần đăng ký trước bằng `!dangky` (Map 1) hoặc `!dangnhap` (Map 2) trước khi giao dịch.', ephemeral: true });
        if (!isStockAllowedForUser(code, userData)) return interaction.reply({ content: '❌ Mã này không thuộc Map hiện tại của bạn.', ephemeral: true });
        if (!data.sessionOpen) return interaction.reply({ content: '❌ Phiên giao dịch đang đóng!', ephemeral: true });
        const price = data.stockPrices[code], total = price * qty, info = STOCKS[code];

        if (action === 'buy') {
            if (userData.balance < total)
                return interaction.reply({ content: `❌ Không đủ tiền! Cần ${formatMoney(total)} xu`, ephemeral: true });
            userData.balance -= total;
            const pos = userData.portfolio[code];
            pos.avgCost = (pos.avgCost * pos.qty + total) / (pos.qty + qty);
            pos.qty += qty;
            userData.totalTrades++;
            userData.dailyProfit -= total;
            data.totalTransactions++;
            const leveled = addExp(userData, calculateTradeExp(total, 0, userData));
            const newAchs = checkAchievements(userData, data, { total });
            userData.tradeHistory.unshift({ type: 'buy', code, qty, price, total, t: new Date().toISOString() });
            if (userData.tradeHistory.length > 30) userData.tradeHistory.pop();
            saveData(data);
            const embed = new EmbedBuilder().setTitle('✅ MUA THÀNH CÔNG!').setColor(0x00ff88)
                .setDescription(`${interaction.user} mua **${qty.toLocaleString()}** ${info.emoji} **${code}**`)
                .addFields(
                    { name: 'Giá', value: `${formatMoney(price)} xu`, inline: true },
                    { name: 'Tổng', value: `${formatMoney(total)} xu`, inline: true },
                    { name: 'Số dư', value: `${formatMoney(userData.balance)} xu`, inline: true }
                );
            if (leveled) embed.addFields({ name: '🎊 LEVEL UP!', value: `Level **${userData.level}** — ${getTitle(userData.level).emoji} ${getTitle(userData.level).title}` });
            if (newAchs.length > 0) embed.addFields({ name: '🏅 Thành tích!', value: newAchs.map(id => ACHIEVEMENTS.find(a => a.id === id)?.emoji + ' ' + ACHIEVEMENTS.find(a => a.id === id)?.name).join('\n') });
            if (total >= (LARGE_TRADE_THRESHOLD[userData.mapStage] || LARGE_TRADE_THRESHOLD[1])) announceHugeTrade(interaction.guild, interaction.user, 'buy', code, qty, total, userData.mapStage);
            return interaction.reply({ embeds: [embed] });
        }

        if (action === 'sell') {
            const pos = userData.portfolio[code];
            if ((pos?.qty || 0) < qty)
                return interaction.reply({ content: `❌ Chỉ có ${pos?.qty || 0} cổ phiếu ${code}!`, ephemeral: true });
            const profit = (price - pos.avgCost) * qty;
            userData.balance += total;
            pos.qty -= qty;
            if (pos.qty === 0) pos.avgCost = 0;
            userData.totalTrades++;
            userData.totalProfit += profit;
            userData.dailyProfit += total;
            data.totalTransactions++;
            const leveled = addExp(userData, calculateTradeExp(total, profit, userData));
            const newAchs = checkAchievements(userData, data, { profit, total });
            userData.tradeHistory.unshift({ type: 'sell', code, qty, price, total, profit, t: new Date().toISOString() });
            if (userData.tradeHistory.length > 30) userData.tradeHistory.pop();
            saveData(data);
            const embed = new EmbedBuilder().setTitle('🔴 BÁN THÀNH CÔNG!').setColor(profit >= 0 ? 0x00ff88 : 0xff4444)
                .setDescription(`${interaction.user} bán **${qty.toLocaleString()}** ${info.emoji} **${code}**`)
                .addFields(
                    { name: 'Giá', value: `${formatMoney(price)} xu`, inline: true },
                    { name: 'Thu về', value: `${formatMoney(total)} xu`, inline: true },
                    { name: profit >= 0 ? 'Lãi' : 'Lỗ', value: `${profit >= 0 ? '+' : ''}${formatMoney(profit)} xu`, inline: true },
                    { name: 'Số dư', value: `${formatMoney(userData.balance)} xu`, inline: true }
                );
            if (leveled) embed.addFields({ name: '🎊 LEVEL UP!', value: `Level **${userData.level}** — ${getTitle(userData.level).emoji} ${getTitle(userData.level).title}` });
            if (newAchs.length > 0) embed.addFields({ name: '🏅 Thành tích!', value: newAchs.map(id => ACHIEVEMENTS.find(a => a.id === id)?.emoji + ' ' + ACHIEVEMENTS.find(a => a.id === id)?.name).join('\n') });
            if (total >= (LARGE_TRADE_THRESHOLD[userData.mapStage] || LARGE_TRADE_THRESHOLD[1])) announceHugeTrade(interaction.guild, interaction.user, 'sell', code, qty, total, userData.mapStage);
            return interaction.reply({ embeds: [embed] });
        }
    }

    if (interaction.isButton()) {
        const id = interaction.customId, userId = interaction.user.id;
        if (id === `btn_profile_${userId}` || id === `btn_refresh_${userId}`) {
            const { data, userData } = getUserData(userId);
            return interaction.update({ embeds: [createProfileEmbed(interaction.user, data, userData)], components: createProfileView(userId).components });
        }
        if (id === `btn_market_${userId}`) {
            const { data, userData } = getUserData(userId);
            return interaction.update({ embeds: [createMarketEmbed(data, userData)], components: createMarketView(userId).components });
        }
        if (id === `btn_top_${userId}`) {
            return interaction.update({ embeds: [createTopEmbed(loadData(), interaction.guild)] });
        }
        if (id === `btn_daily_${userId}`) {
            const { data, userData } = getUserData(userId);
            const now = new Date();
            if (userData.lastDaily) {
                const diff = (now - new Date(userData.lastDaily)) / 1000;
                if (diff < 86400) {
                    const rem = 86400 - diff;
                    return interaction.reply({ content: `⏳ Còn **${Math.floor(rem / 3600)}h ${Math.floor((rem % 3600) / 60)}p** nữa!`, ephemeral: true });
                }
            }
            const bonus = Math.floor(Math.random() * 900_000) + 100_000;
            userData.balance += bonus;
            userData.lastDaily = now.toISOString();
            addExp(userData, 50);
            saveData(data);
            return interaction.update({
                embeds: [new EmbedBuilder().setTitle('🎁 THƯỞNG HÀNG NGÀY!').setColor(0xf1c40f)
                    .setDescription(`${interaction.user} nhận **${formatMoney(bonus)} xu**!`)
                    .addFields({ name: 'Số dư mới', value: `${formatMoney(userData.balance)} xu` })]
            });
        }
        if (id === 'btn_refresh') {
            const { data, userData } = getUserData(userId);
            return interaction.update({ embeds: [createMarketEmbed(data, userData)], components: createMarketView(userId).components });
        }

        if (id.startsWith('deposit_confirm_')) {
            const parts = id.split('_');
            const targetUserId = parts[2];
            const amount = parseInt(parts[3]);
            const termDays = parseInt(parts[4]);
            if (interaction.user.id !== targetUserId) return interaction.reply({ content: '❌ Nút này không phải của bạn!', ephemeral: true });
            const { data, userData } = getUserData(targetUserId);
            if (userData.bank.depositActive) return interaction.update({ content: '❌ Bạn đã có khoản gửi đang hoạt động.', components: [] });
            if (userData.balance < amount) return interaction.update({ content: '❌ Không đủ tiền để xác nhận gửi.', components: [] });
            userData.balance -= amount;
            userData.bank.savings += amount;
            userData.bank.depositAmount = amount;
            userData.bank.depositDueAt = new Date(Date.now() + termDays * 86_400_000).toISOString();
            userData.bank.depositTermDays = termDays;
            userData.bank.depositActive = true;
            userData.bank.depositedAt = new Date().toISOString();
            recordMoneyHistory(userData, -amount, `deposit to bank ${termDays}d`);
            saveData(data);
            return interaction.update({ content: `✅ Đã gửi **${formatMoney(amount)} xu** vào ngân hàng trong ${termDays} ngày.`, components: [] });
        }

        if (id.startsWith('deposit_cancel_')) {
            const targetUserId = id.split('_')[2];
            if (interaction.user.id !== targetUserId) return interaction.reply({ content: '❌ Nút này không phải của bạn!', ephemeral: true });
            return interaction.update({ content: '❌ Đã hủy giao dịch gửi tiền.', components: [] });
        }

        if (id.startsWith('borrow_confirm_')) {
            const parts = id.split('_');
            const targetUserId = parts[2];
            const amount = parseInt(parts[3]);
            const termDays = parseInt(parts[4]);
            if (interaction.user.id !== targetUserId) return interaction.reply({ content: '❌ Nút này không phải của bạn!', ephemeral: true });
            const { data, userData } = getUserData(targetUserId);
            if ((userData.margin?.borrowed || 0) > 0) return interaction.update({ content: '❌ Bạn vẫn còn khoản vay đang hoạt động.', components: [] });
            const netWorth = calcNetWorth(userData, data.stockPrices);
            const maxBorrow = netWorth * 0.5;
            if (amount > maxBorrow) return interaction.update({ content: `❌ Vượt hạn mức vay! Tối đa ${formatMoney(maxBorrow)} xu.`, components: [] });
            userData.balance += amount;
            userData.margin.borrowed = (userData.margin?.borrowed || 0) + amount;
            userData.margin.borrowedAt = new Date().toISOString();
            userData.margin.dueAt = new Date(Date.now() + termDays * 86_400_000).toISOString();
            userData.margin.termDays = termDays;
            recordMoneyHistory(userData, amount, `borrow margin ${termDays}d`);
            warnSuspiciousAssets(data, interaction.guild, targetUserId, userData, `borrow margin ${amount}`);
            saveData(data);
            return interaction.update({ content: `✅ Đã vay **${formatMoney(amount)} xu** và phải trả trước ${new Date(userData.margin.dueAt).toLocaleString('vi-VN')}.`, components: [] });
        }

        if (id.startsWith('borrow_cancel_')) {
            const targetUserId = id.split('_')[2];
            if (interaction.user.id !== targetUserId) return interaction.reply({ content: '❌ Nút này không phải của bạn!', ephemeral: true });
            return interaction.update({ content: '❌ Đã hủy giao dịch vay vốn.', components: [] });
        }
    }
});

// ==================== 🚀 KHỞI ĐỘNG ====================

client.login(TOKEN).catch(e => console.log(`❌ Lỗi đăng nhập: ${e.message}`));
