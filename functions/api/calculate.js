import { calculateZiwei, formatForAI } from '../../src/lib/ziwei.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const birthData = await request.json();
    
    if (!birthData.year || !birthData.month || !birthData.day || !birthData.hour || !birthData.gender) {
      return new Response(JSON.stringify({ error: '请填写完整的出生信息' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const ziweiData = calculateZiwei(birthData);
    const aiPrompt = formatForAI(ziweiData);
    
    const aiResponse = await env.AI.run('@cf/qwen/qwen1.5-14b-chat-awq', {
      messages: [
        {
          role: 'system',
          content: `你是一位精通紫微斗数的命理大师。请根据提供的命盘信息，给出详细、专业、易懂的解读。

解读要求：
1. 命宫主星分析（性格特质、天赋才能）
2. 事业财运分析（适合行业、财运特点）
3. 感情婚姻分析（桃花运、婚姻特点）
4. 健康提示（注意事项）
5. 流年运势建议（近期建议）

请用通俗易懂的中文回答，避免过于玄学的表述，多给正面积极的建议。每个部分 2-3 句话，整体 300-500 字。`
        },
        {
          role: 'user',
          content: aiPrompt
        }
      ],
      max_tokens: 1024,
      temperature: 0.7
    });
    
    return new Response(JSON.stringify({
      success: true,
      ziweiData,
      analysis: aiResponse.response
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
