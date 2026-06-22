import { Solar, Lunar } from 'lunar-javascript';

// 天干
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
// 地支
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
// 五行
const WU_XING = ['金', '木', '水', '火', '土'];
// 十二宫
const PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '事业', '田宅', '福德', '父母'];

// 紫微星系主星
const ZIWEI_STARS = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞'];
// 天府星系主星
const TIANFU_STARS = ['天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];

// 四化表（按天干）
const SI_HUA = {
  '甲': ['廉贞', '破军', '武曲', '太阳'],
  '乙': ['天机', '天梁', '紫微', '太阴'],
  '丙': ['天同', '天机', '文昌', '廉贞'],
  '丁': ['太阴', '天同', '天机', '巨门'],
  '戊': ['贪狼', '太阴', '右弼', '天机'],
  '己': ['武曲', '贪狼', '天梁', '文曲'],
  '庚': ['太阳', '武曲', '太阴', '天同'],
  '辛': ['巨门', '太阳', '文曲', '文昌'],
  '壬': ['天梁', '紫微', '左辅', '武曲'],
  '癸': ['破军', '巨门', '太阴', '贪狼']
};

// 星曜亮度
const STAR_BRIGHTNESS = {
  '紫微': ['庙', '旺', '得', '利', '平', '不', '陷'],
  '天机': ['旺', '庙', '得', '利', '平', '不', '陷'],
  '太阳': ['旺', '庙', '得', '利', '平', '不', '陷'],
  '武曲': ['庙', '旺', '得', '利', '平', '不', '陷'],
  '天同': ['庙', '旺', '得', '利', '平', '不', '陷'],
  '廉贞': ['利', '平', '不', '陷', '庙', '旺', '得'],
  '天府': ['庙', '旺', '得', '利', '平', '不', '陷'],
  '太阴': ['庙', '旺', '得', '利', '平', '不', '陷'],
  '贪狼': ['庙', '旺', '得', '利', '平', '不', '陷'],
  '巨门': ['庙', '旺', '得', '利', '平', '不', '陷'],
  '天相': ['庙', '旺', '得', '利', '平', '不', '陷'],
  '天梁': ['庙', '旺', '得', '利', '平', '不', '陷'],
  '七杀': ['庙', '旺', '得', '利', '平', '不', '陷'],
  '破军': ['庙', '旺', '得', '利', '平', '不', '陷']
};

// 安紫微星系（根据农历日和时辰）
function getZiweiPosition(lunarDay, lunarHour) {
  // 紫微星位置算法（简化版）
  const hourIndex = DI_ZHI.indexOf(lunarHour);
  const base = (lunarDay - 1) % 12;
  return (base + hourIndex) % 12;
}

// 安天府星系（根据紫微位置）
function getTianfuPosition(ziweiPos) {
  // 天府与紫微对宫
  return (12 - ziweiPos) % 12;
}

// 安辅星
function getFuxingPositions(birthYear, birthMonth, lunarDay, lunarHour) {
  const yearGan = TIAN_GAN[(birthYear - 4) % 10];
  const yearZhi = DI_ZHI[(birthYear - 4) % 12];
  
  // 文昌（根据出生年干）
  const wenchangBase = TIAN_GAN.indexOf(yearGan);
  const wenchang = (wenchangBase + 2) % 12;
  
  // 文曲（根据出生年干）
  const wenquBase = TIAN_GAN.indexOf(yearGan);
  const wenqu = (wenquBase + 6) % 12;
  
  // 左辅（根据出生月）
  const zuofu = (birthMonth + 1) % 12;
  
  // 右弼（根据出生月）
  const youbi = (12 - birthMonth + 1) % 12;
  
  return {
    '文昌': wenchang,
    '文曲': wenqu,
    '左辅': zuofu,
    '右弼': youbi
  };
}

// 安四化
function getSiHua(yearGan) {
  const [huaLu, huaQuan, huaKe, huaJi] = SI_HUA[yearGan] || [];
  return { huaLu, huaQuan, huaKe, huaJi };
}

// 主排盘函数
export function calculateZiwei(birthData) {
  const { year, month, day, hour, gender } = birthData;
  
  // 转换为农历
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  
  const lunarYear = lunar.getYear();
  const lunarMonth = lunar.getMonth();
  const lunarDay = lunar.getDay();
  const lunarHour = hour; // 简化处理
  
  // 天干地支
  const yearGan = TIAN_GAN[(lunarYear - 4) % 10];
  const yearZhi = DI_ZHI[(lunarYear - 4) % 12];
  const monthGan = TIAN_GAN[((lunarYear - 4) * 12 + lunarMonth + 1) % 10];
  const monthZhi = DI_ZHI[(lunarMonth + 1) % 12];
  
  // 安命宫（根据出生月和时辰）
  const hourIndex = DI_ZHI.indexOf(lunarHour);
  const minggongIndex = (12 + lunarMonth - hourIndex) % 12;
  
  // 安身宫
  const shengongIndex = (minggongIndex + 2) % 12;
  
  // 安紫微星系
  const ziweiPos = getZiweiPosition(lunarDay, lunarHour);
  
  // 安天府星系
  const tianfuPos = getTianfuPosition(ziweiPos);
  
  // 安辅星
  const fuxingPositions = getFuxingPositions(lunarYear, lunarMonth, lunarDay, lunarHour);
  
  // 安四化
  const sihua = getSiHua(yearGan);
  
  // 构建十二宫星曜分布
  const palaces = Array(12).fill(null).map((_, i) => ({
    name: PALACES[(minggongIndex + i) % 12],
    index: (minggongIndex + i) % 12,
    stars: [],
    isMinggong: i === 0,
    isShengong: i === (shengongIndex - minggongIndex + 12) % 12
  }));
  
  // 分配主星到宫位
  ZIWEI_STARS.forEach((star, i) => {
    const pos = (ziweiPos + i) % 12;
    const palaceIndex = (pos - minggongIndex + 12) % 12;
    if (palaceIndex >= 0 && palaceIndex < 12) {
      palaces[palaceIndex].stars.push({
        name: star,
        type: '主星',
        brightness: STAR_BRIGHTNESS[star]?.[pos % 7] || '平'
      });
    }
  });
  
  TIANFU_STARS.forEach((star, i) => {
    const pos = (tianfuPos + i) % 12;
    const palaceIndex = (pos - minggongIndex + 12) % 12;
    if (palaceIndex >= 0 && palaceIndex < 12) {
      palaces[palaceIndex].stars.push({
        name: star,
        type: '主星',
        brightness: STAR_BRIGHTNESS[star]?.[pos % 7] || '平'
      });
    }
  });
  
  // 分配辅星到宫位
  Object.entries(fuxingPositions).forEach(([star, pos]) => {
    const palaceIndex = (pos - minggongIndex + 12) % 12;
    if (palaceIndex >= 0 && palaceIndex < 12) {
      palaces[palaceIndex].stars.push({
        name: star,
        type: '辅星',
        brightness: '平'
      });
    }
  });
  
  // 标记四化
  palaces.forEach(palace => {
    palace.stars.forEach(star => {
      if (star.name === sihua.huaLu) star.sihua = '化禄';
      if (star.name === sihua.huaQuan) star.sihua = '化权';
      if (star.name === sihua.huaKe) star.sihua = '化科';
      if (star.name === sihua.huaJi) star.sihua = '化忌';
    });
  });
  
  return {
    lunar: {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      hour: lunarHour,
      yearGanZhi: `${yearGan}${yearZhi}`,
      monthGanZhi: `${monthGan}${monthZhi}`
    },
    palaces,
    sihua,
    gender,
    minggongIndex,
    shengongIndex
  };
}

// 格式化命盘数据为 AI 可读格式
export function formatForAI(ziweiData) {
  const { lunar, palaces, sihua, gender } = ziweiData;
  
  let text = `紫微斗数命盘分析\n`;
  text += `==================\n\n`;
  text += `基本信息：\n`;
  text += `- 性别：${gender === 'male' ? '男' : '女'}\n`;
  text += `- 农历：${lunar.yearGanZhi}年 ${lunar.monthGanZhi}月 ${lunar.day}日 ${lunar.hour}时\n\n`;
  text += `四化星：\n`;
  text += `- 化禄：${sihua.huaLu}\n`;
  text += `- 化权：${sihua.huaQuan}\n`;
  text += `- 化科：${sihua.huaKe}\n`;
  text += `- 化忌：${sihua.huaJi}\n\n`;
  text += `十二宫星曜分布：\n`;
  
  palaces.forEach(palace => {
    const starsStr = palace.stars.length > 0
      ? palace.stars.map(s => `${s.name}${s.sihua ? `(${s.sihua})` : ''}[${s.brightness}]`).join('、')
      : '无主星';
    text += `- ${palace.name}宫：${starsStr}${palace.isMinggong ? ' (命宫)' : ''}${palace.isShengong ? ' (身宫)' : ''}\n`;
  });
  
  return text;
}
