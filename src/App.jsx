import { useState } from 'react';
import './App.css';

const HOUR_OPTIONS = [
  { value: '子', label: '子时 (23:00-01:00)' },
  { value: '丑', label: '丑时 (01:00-03:00)' },
  { value: '寅', label: '寅时 (03:00-05:00)' },
  { value: '卯', label: '卯时 (05:00-07:00)' },
  { value: '辰', label: '辰时 (07:00-09:00)' },
  { value: '巳', label: '巳时 (09:00-11:00)' },
  { value: '午', label: '午时 (11:00-13:00)' },
  { value: '未', label: '未时 (13:00-15:00)' },
  { value: '申', label: '申时 (15:00-17:00)' },
  { value: '酉', label: '酉时 (17:00-19:00)' },
  { value: '戌', label: '戌时 (19:00-21:00)' },
  { value: '亥', label: '亥时 (21:00-23:00)' }
];

const PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '事业', '田宅', '福德', '父母'];

function App() {
  const [formData, setFormData] = useState({
    year: 1990,
    month: 1,
    day: 1,
    hour: '子',
    gender: 'male'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'month' || name === 'day' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      alert('计算出错：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPalace = (palace, index) => {
    const stars = palace.stars || [];
    const isMainPalace = palace.isMinggong;
    const isBodyPalace = palace.isShengong;

    return (
      <div
        key={index}
        className={`palace ${isMainPalace ? 'minggong' : ''} ${isBodyPalace ? 'shengong' : ''}`}
      >
        <div className="palace-name">
          {palace.name}
          {isMainPalace && <span className="tag">命</span>}
          {isBodyPalace && <span className="tag">身</span>}
        </div>
        <div className="stars">
          {stars.map((star, i) => (
            <span key={i} className={`star ${star.type} ${star.sihua ? 'sihua' : ''}`}>
              {star.name}
              {star.sihua && <span className="sihua-tag">{star.sihua.replace('化', '')}</span>}
              <span className="brightness">{star.brightness}</span>
            </span>
          ))}
          {stars.length === 0 && <span className="no-star">无主星</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header>
        <h1>紫微斗数</h1>
        <p>AI 智能命盘分析</p>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>出生年份</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min="1900"
              max="2100"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>月份</label>
              <input
                type="number"
                name="month"
                value={formData.month}
                onChange={handleChange}
                min="1"
                max="12"
                required
              />
            </div>
            <div className="form-group">
              <label>日期</label>
              <input
                type="number"
                name="day"
                value={formData.day}
                onChange={handleChange}
                min="1"
                max="31"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>出生时辰</label>
            <select name="hour" value={formData.hour} onChange={handleChange}>
              {HOUR_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>性别</label>
            <div className="gender-select">
              <label className={formData.gender === 'male' ? 'active' : ''}>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleChange}
                />
                男
              </label>
              <label className={formData.gender === 'female' ? 'active' : ''}>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleChange}
                />
                女
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? '正在排盘...' : '开始排盘'}
          </button>
        </form>

        {result && (
          <div className="result">
            <div className="basic-info">
              <h2>命盘信息</h2>
              <p>农历：{result.ziweiData.lunar.yearGanZhi}年 {result.ziweiData.lunar.month}月 {result.ziweiData.lunar.day}日</p>
              <p>四化：禄{result.ziweiData.sihua.huaLu} · 权{result.ziweiData.sihua.huaQuan} · 科{result.ziweiData.sihua.huaKe} · 忌{result.ziweiData.sihua.huaJi}</p>
            </div>

            <div className="palace-grid">
              {result.ziweiData.palaces.map((palace, i) => renderPalace(palace, i))}
            </div>

            <div className="analysis">
              <h2>AI 解盘分析</h2>
              <div className="analysis-content">
                {result.analysis.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>紫微斗数仅供娱乐参考，不可作为人生决策依据</p>
      </footer>
    </div>
  );
}

export default App;
