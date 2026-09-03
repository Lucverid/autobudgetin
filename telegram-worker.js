// Cloudflare Worker relay for Agis Finance v24.4
// Secrets/vars required in Worker settings:
// TELEGRAM_BOT_TOKEN = token from BotFather
// TELEGRAM_CHAT_ID   = your Telegram chat/user/group id
// APP_KEY            = a random secret shared with Agis Finance settings
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Content-Type': 'application/json; charset=utf-8'
    };
    if (request.method === 'OPTIONS') return new Response(null, {status:204,headers:cors});
    if (request.method !== 'POST') return new Response(JSON.stringify({ok:false,error:'method_not_allowed'}),{status:405,headers:cors});
    let body; try { body = await request.json(); } catch { return new Response(JSON.stringify({ok:false,error:'invalid_json'}),{status:400,headers:cors}); }
    if (!env.APP_KEY || body.key !== env.APP_KEY) return new Response(JSON.stringify({ok:false,error:'unauthorized'}),{status:401,headers:cors});
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return new Response(JSON.stringify({ok:false,error:'worker_not_configured'}),{status:500,headers:cors});
    const title = String(body.title || 'Agis Finance').slice(0,160);
    const message = String(body.message || '').slice(0,3500);
    const text = `${title}\n\n${message}`;
    const tg = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text,disable_web_page_preview:true})
    });
    const result = await tg.json().catch(()=>({ok:false}));
    return new Response(JSON.stringify({ok:tg.ok && result.ok}),{status:tg.ok?200:502,headers:cors});
  }
};
