export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { message } = await request.json();

    const aiResponse = await env.AI.run('@cf/qwen/qwen3-30b-a3b-fp8', {
      messages: [
        {
          role: 'system',
          content: `你是一个出生信息解析助手。从用户的消息中提取出生信息。

返回严格的 JSON 格式：
{
  "year": 数字或null,
  "month": 数字或null,
  "day": 数字或null,
  "hour": "子/丑/寅/卯/辰/巳/午/未/申/酉/戌/亥" 或 null,
  "gender": "male/female" 或 null,
  "missing": ["缺少的字段1", "缺少的字段2"],
  "reply": "给用户的回复"
}

时辰对照：
23:00-01:00=子时, 01:00-03:00=丑时, 03:00-05:00=寅时
05:00-07:00=卯时, 07:00-09:00=辰时, 09:00-11:00=巳时
11:00-13:00=午时, 13:00-15:00=未时, 15:00-17:00=申时
17:00-19:00=酉时, 19:00-21:00=戌时, 21:00-23:00=亥时

要求：
1. 如果用户说了大概时间（如"早上8点"），转换为对应时辰
2. 如果信息不完整，在 missing 数组中列出缺少的字段
3. reply 用友好自然的中文回复，告知解析结果或询问缺少的信息
4. 特别提醒用户时辰要准确，因为不同时辰命盘会完全不同
5. 如果信息完整，reply 中提醒用户确认信息是否准确`
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
      const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse.response);
    } catch {
      parsed = {
        year: null, month: null, day: null, hour: null, gender: null,
        missing: ['无法解析'],
        reply: '抱歉，我没有完全理解您的输入。请告诉我您的出生年份、月、日、时辰（如1990年3月15日早上8点）和性别。'
      };
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
