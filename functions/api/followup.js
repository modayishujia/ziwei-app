export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { question, ziweiData, previousAnalysis } = await request.json();

    if (!question || !ziweiData) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { lunar, palaces, sihua, gender } = ziweiData;
    
    let chartContext = `命盘信息：\n`;
    chartContext += `- 性别：${gender === 'male' ? '男' : '女'}\n`;
    chartContext += `- 农历：${lunar.yearGanZhi}年 ${lunar.monthGanZhi}月 ${lunar.day}日 ${lunar.hour}时\n`;
    chartContext += `- 四化：禄${sihua.huaLu} 权${sihua.huaQuan} 科${sihua.huaKe} 忌${sihua.huaJi}\n`;
    chartContext += `- 十二宫分布：\n`;
    
    palaces.forEach(p => {
      const stars = p.stars.length > 0
        ? p.stars.map(s => `${s.name}${s.sihua ? `(${s.sihua})` : ''}[${s.brightness}]`).join('、')
        : '空宫';
      chartContext += `  ${p.name}：${stars}${p.isMinggong ? ' (命宫)' : ''}${p.isShengong ? ' (身宫)' : ''}\n`;
    });

    const aiResponse = await env.AI.run('@cf/qwen/qwen3-30b-a3b-fp8', {
      messages: [
        {
          role: 'system',
          content: `你是一位精通紫微斗数的命理大师。根据以下命盘信息回答用户的问题。

${chartContext}

之前的分析：
${previousAnalysis || '无'}

要求：
1. 基于命盘信息回答，不要编造不存在的星曜
2. 回答要专业但易懂
3. 给出积极正面的建议
4. 控制在 200 字以内`
        },
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 512,
      temperature: 0.7
    });

    let responseText = aiResponse.response || '';
    responseText = responseText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    return new Response(JSON.stringify({ reply: responseText }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
