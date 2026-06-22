import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '你好！我是紫微斗数 AI 助手。\n\n请告诉我你的出生信息，比如：\n「1990年3月15日早上8点，男」\n\n💡 提示：请尽量提供准确的出生时辰，因为不同时辰排出的命盘会完全不同。'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      if (result) {
        setResult(null);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '好的，让我为你重新排盘。请告诉我你的出生信息。'
        }]);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/parse-birth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const parsed = await response.json();

      if (parsed.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: '解析出错：' + parsed.error }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: parsed.reply }]);

        if (parsed.year && parsed.month && parsed.day && parsed.hour && parsed.gender) {
          const data = {
            year: parsed.year,
            month: parsed.month,
            day: parsed.day,
            hour: parsed.hour,
            gender: parsed.gender
          };

          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '信息已收到，正在为你排盘...'
            }]);
            calculateChart(data);
          }, 500);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '出错了：' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const calculateChart = async (data) => {
    setLoading(true);
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const res = await response.json();
      if (res.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: '排盘出错：' + res.error }]);
      } else {
        setResult(res);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '排盘完成！请查看下方命盘和分析结果。如需重新排盘，请发送新的出生信息。'
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '计算出错：' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const PALACE_ORDER = [0, 1, 2, 3, 11, -1, -1, 4, 10, -1, -1, 5, 9, 8, 7, 6];
  
  const GAN_ZHI_MAP = {
    0: ['命', '兄', '夫', '子', '财', '疾', '迁', '友', '事', '田', '福', '父'],
  };

  const renderPalace = (palace, index) => {
    const stars = palace.stars || [];
    const isMainPalace = palace.isMinggong;
    const isBodyPalace = palace.isShengong;
    const starNames = stars.map(s => s.name).join('、') || '无主星';

    const mainStars = stars.filter(s => s.type === '主星');
    const auxStars = stars.filter(s => s.type === '辅星');

    return (
      <div
        key={index}
        className={`palace ${isMainPalace ? 'minggong' : ''} ${isBodyPalace ? 'shengong' : ''}`}
        role="cell"
        aria-label={`${palace.name}：${starNames}`}
      >
        <div className="palace-header">
          <span className="palace-name">{palace.name}</span>
          <div className="palace-tags">
            {isMainPalace && <span className="tag tag-ming">命</span>}
            {isBodyPalace && <span className="tag tag-shen">身</span>}
          </div>
        </div>
        
        <div className="palace-stars">
          {mainStars.length > 0 && (
            <div className="star-group main-stars">
              {mainStars.map((star, i) => (
                <div key={i} className={`star-item ${star.sihua ? 'has-sihua' : ''}`}>
                  <span className="star-name">{star.name}</span>
                  {star.sihua && <span className="sihua-indicator">{star.sihua.replace('化', '')}</span>}
                  <span className="star-brightness">{star.brightness}</span>
                </div>
              ))}
            </div>
          )}
          
          {auxStars.length > 0 && (
            <div className="star-group aux-stars">
              {auxStars.map((star, i) => (
                <span key={i} className="aux-star">{star.name}</span>
              ))}
            </div>
          )}
          
          {stars.length === 0 && (
            <div className="no-star">空宫</div>
          )}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    if (!result) return null;
    
    const palaces = result.ziweiData.palaces;
    const gridOrder = [
      [palaces[0], palaces[1], palaces[2], palaces[3]],
      [palaces[11], null, null, palaces[4]],
      [palaces[10], null, null, palaces[5]],
      [palaces[9], palaces[8], palaces[7], palaces[6]]
    ];
    
    return (
      <div className="chart-container">
        <div className="chart-grid">
          {gridOrder.map((row, rowIdx) => 
            row.map((palace, colIdx) => {
              if (palace === null) {
                if (rowIdx === 1 && colIdx === 1) {
                  return (
                    <div key={`${rowIdx}-${colIdx}`} className="chart-center" row={rowIdx} col={colIdx}>
                      <div className="center-content">
                        <div className="center-gua">☰</div>
                        <div className="center-title">紫微斗数</div>
                        <div className="center-info">
                          <span>{result.ziweiData.lunar.yearGanZhi}年</span>
                          <span>{result.ziweiData.lunar.month}月{result.ziweiData.lunar.day}日</span>
                          <span>{result.ziweiData.lunar.hour}时</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                if (rowIdx === 1 && colIdx === 2) {
                  return (
                    <div key={`${rowIdx}-${colIdx}`} className="chart-center" row={rowIdx} col={colIdx}>
                      <div className="sihua-display">
                        <div className="sihua-title">四化</div>
                        <div className="sihua-grid">
                          <div className="sihua-item lu">
                            <span className="sihua-label">禄</span>
                            <span className="sihua-star">{result.ziweiData.sihua.huaLu}</span>
                          </div>
                          <div className="sihua-item quan">
                            <span className="sihua-label">权</span>
                            <span className="sihua-star">{result.ziweiData.sihua.huaQuan}</span>
                          </div>
                          <div className="sihua-item ke">
                            <span className="sihua-label">科</span>
                            <span className="sihua-star">{result.ziweiData.sihua.huaKe}</span>
                          </div>
                          <div className="sihua-item ji">
                            <span className="sihua-label">忌</span>
                            <span className="sihua-star">{result.ziweiData.sihua.huaJi}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                if (rowIdx === 2 && colIdx === 1) {
                  return (
                    <div key={`${rowIdx}-${colIdx}`} className="chart-center" row={rowIdx} col={colIdx}>
                      <div className="gender-display">
                        <span className="gender-icon">{result.ziweiData.gender === 'male' ? '♂' : '♀'}</span>
                        <span className="gender-text">{result.ziweiData.gender === 'male' ? '乾造' : '坤造'}</span>
                      </div>
                    </div>
                  );
                }
                if (rowIdx === 2 && colIdx === 2) {
                  return (
                    <div key={`${rowIdx}-${colIdx}`} className="chart-center" row={rowIdx} col={colIdx}>
                      <div className="lunar-display">
                        <div className="lunar-label">农历</div>
                        <div className="lunar-month">{result.ziweiData.lunar.monthGanZhi}月</div>
                      </div>
                    </div>
                  );
                }
                return <div key={`${rowIdx}-${colIdx}`} className="chart-empty" />;
              }
              const palIndex = palaces.indexOf(palace);
              return <div key={`${rowIdx}-${colIdx}`}>{renderPalace(palace, palIndex)}</div>;
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header role="banner">
        <h1>紫微斗数</h1>
        <p>AI 智能命盘分析</p>
      </header>

      <main role="main">
        <section aria-label="AI 对话排盘">
          <div className="chat-container">
            <div className="messages" role="log" aria-live="polite">
              {messages.map((msg, i) => (
                <article key={i} className={`message ${msg.role}`}>
                  <div className="message-content">
                    {msg.content.split('\n').map((line, j) => (
                      <p key={j}>{line}</p>
                    ))}
                  </div>
                </article>
              ))}
              {loading && (
                <div className="message assistant" aria-label="AI 正在思考">
                  <div className="message-content typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="input-area" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={result ? "发送新信息重新排盘..." : "输入出生信息，如：1990年3月15日早上8点，男"}
                disabled={loading}
                aria-label="输入出生信息"
              />
              <button type="submit" disabled={loading || !input.trim()} aria-label="发送消息">
                发送
              </button>
            </form>
          </div>
        </section>

        {result && (
          <section className="result" aria-label="命盘分析结果">
            <div className="result-header">
              <h2>命盘排布</h2>
            </div>
            
            {renderChart()}

            <div className="analysis">
              <h2>AI 解盘分析</h2>
              <div className="analysis-content">
                {result.analysis.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer role="contentinfo">
        <p>紫微斗数仅供娱乐参考，不可作为人生决策依据</p>
      </footer>
    </div>
  );
}

export default App;
