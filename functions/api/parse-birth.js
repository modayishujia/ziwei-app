export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { message } = await request.json();

    const aiResponse = await env.AI.run('@cf/qwen/qwen3-30b-a3b-fp8', {
      messages: [
        {
          role: 'system',
          content: `你是一个出生信息解析助手。从用户的消息中提取出生信息。

重要：只返回 JSON，不要有任何其他文字或解释。

JSON 格式：
{"year":数字或null,"month":数字或null,"day":数字或null,"hour":"时辰或null","gender":"male/female或null","missing":["缺少的字段"],"reply":"回复用户的话"}

时辰对照：
23:00-01:00=子时, 01:00-03:00=丑时, 03:00-05:00=寅时
05:00-07:00=卯时, 07:00-09:00=辰时, 09:00-11:00=巳时
11:00-13:00=午时, 13:00-15:00=未时, 15:00-17:00=申时
17:00-19:00=酉时, 19:00-21:00=戌时, 21:00-23:00=亥时

要求：
1. 把"早上8点"转为辰时，"下午3点"转为申时，"晚上10点"转为亥时
2. missing 数组只包含还没提供的字段
3. reply 用友好中文，询问缺少信息或确认已解析信息
4. 如果信息完整，reply 提醒用户确认并说明时辰准确性很重要`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 512,
      temperature: 0.1
    });

    let parsed;
    try {
      let responseText = aiResponse.response || '';
      
      // Remove thinking tags if present
      responseText = responseText.replace(/<think>[\s\S]*?<\/think>/g, '');
      
      // Try to find JSON object
      const jsonMatch = responseText.match(/\{[^{}]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      // If parsing fails, try to extract info with simple logic
      const text = (message || '').toLowerCase();
      
      let year = null, month = null, day = null, hour = null, gender = null;
      const missing = [];
      
      // Try to extract year
      const yearMatch = text.match(/(\d{4})\s*年/);
      if (yearMatch) year = parseInt(yearMatch[1]);
      
      // Try to extract month
      const monthMatch = text.match(/(\d{1,2})\s*月/);
      if (monthMatch) month = parseInt(monthMatch[1]);
      
      // Try to extract day
      const dayMatch = text.match(/(\d{1,2})\s*[日号]/);
      if (dayMatch) day = parseInt(dayMatch[1]);
      
      // Try to extract hour
      const hourPatterns = [
        { pattern: /凌晨|子时|23[:点时]|0[:点时]/, hour: '子' },
        { pattern: /丑时|[12][:点时]/, hour: '丑' },
        { pattern: /寅时|[34][:点时]/, hour: '寅' },
        { pattern: /早上|卯时|[56][:点时]/, hour: '卯' },
        { pattern: /辰时|[78][:点时]/, hour: '辰' },
        { pattern: /上午|巳时|[9]|10[:点时]|11[:点时]/, hour: '巳' },
        { pattern: /中午|午时|12[:点时]|13[:点时]/, hour: '午' },
        { pattern: /未时|14[:点时]|15[:点时]/, hour: '未' },
        { pattern: /下午|申时|15[:点时]|16[:点时]|17[:点时]/, hour: '申' },
        { pattern: /酉时|17[:点时]|18[:点时]|19[:点时]/, hour: '酉' },
        { pattern: /晚上|戌时|19[:点时]|20[:点时]|21[:点时]/, hour: '戌' },
        { pattern: /亥时|21[:点时]|22[:点时]|23[:点时]/, hour: '亥' },
      ];
      
      // Simple hour extraction
      const simpleHourMatch = text.match(/(\d{1,2})\s*[点时]/);
      if (simpleHourMatch) {
        const h = parseInt(simpleHourMatch[1]);
        if (h >= 23 || h < 1) hour = '子';
        else if (h < 3) hour = '丑';
        else if (h < 5) hour = '寅';
        else if (h < 7) hour = '卯';
        else if (h < 9) hour = '辰';
        else if (h < 11) hour = '巳';
        else if (h < 13) hour = '午';
        else if (h < 15) hour = '未';
        else if (h < 17) hour = '申';
        else if (h < 19) hour = '酉';
        else if (h < 21) hour = '戌';
        else hour = '亥';
      } else {
        for (const hp of hourPatterns) {
          if (hp.pattern.test(text)) {
            hour = hp.hour;
            break;
          }
        }
      }
      
      // Try to extract gender
      if (/男/.test(text)) gender = 'male';
      else if (/女/.test(text)) gender = 'female';
      
      // Build missing list
      if (!year) missing.push('年份');
      if (!month) missing.push('月份');
      if (!day) missing.push('日期');
      if (!hour) missing.push('时辰');
      if (!gender) missing.push('性别');
      
      let reply = '';
      if (missing.length > 0) {
        reply = `我已获取到部分信息。还请补充以下内容：${missing.join('、')}。\n\n请尽量提供准确的出生时辰（精确到小时），因为不同时辰排出的命盘会完全不同。`;
      } else {
        reply = `我已记录您的信息：${year}年${month}月${day}日 ${hour}时 ${gender === 'male' ? '男' : '女'}\n\n请确认是否准确？特别是时辰，因为不同时辰命盘会完全不同。`;
      }
      
      parsed = { year, month, day, hour, gender, missing, reply };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
