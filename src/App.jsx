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
        <div className="chat-container">
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-content">
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={result ? "发送新信息重新排盘..." : "输入出生信息，如：1990年3月15日早上8点，男"}
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()}>
              发送
            </button>
          </div>
        </div>

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
