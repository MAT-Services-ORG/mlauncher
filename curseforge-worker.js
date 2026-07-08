/**
 * CurseForge API Proxy - Cloudflare Worker
 * 
 * KURULUM TALİMATLARI (Cloudflare Dashboard üzerinden):
 * 1. Cloudflare hesabınıza giriş yapın ve "Workers & Pages" sekmesine gidin.
 * 2. "Create application" -> "Create Worker" butonuna tıklayın.
 * 3. Worker'a bir isim verin (örn: aqua-cf-proxy) ve "Deploy"a tıklayın.
 * 4. Başarıyla oluştuktan sonra "Edit code" butonuna basın.
 * 5. Bu dosyadaki tüm kodları kopyalayıp oradaki editöre yapıştırın.
 * 6. "Save and deploy" butonuna basarak kodu kaydedin.
 * 7. Worker'ınızın ayarlarına gidin (Settings -> Variables).
 * 8. "Environment Variables" altında "Add variable" tıklayın.
 * 9. Variable name (Değişken adı) olarak: CF_API_KEY girin.
 * 10. Value (Değer) kısmına CurseForge'dan aldığınız API anahtarınızı yapıştırın. 
 * 11. "Deploy" veya "Save" diyerek değişkenleri kaydedin.
 * 12. Worker'ınıza atanan URL'yi (örn: https://aqua-cf-proxy.yaman.workers.dev) kopyalayın.
 * 13. Aqua Launcher ayarlarındaki "CurseForge API Proxy URL" alanına bu URL'yi yapıştırın!
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const apiKey = env.CF_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "CF_API_KEY is missing. Please add it to your Cloudflare Worker Environment Variables."
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const targetUrl = new URL(url.pathname + url.search, 'https://api.curseforge.com');

    const newHeaders = new Headers(request.headers);
    newHeaders.set('x-api-key', apiKey);
    newHeaders.set('Host', targetUrl.hostname);

    newHeaders.delete('Origin');
    newHeaders.delete('Referer');

    const init = {
      method: request.method,
      headers: newHeaders,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
    }

    try {
      const response = await fetch(targetUrl.toString(), init);

      const newResponse = new Response(response.body, response);
      for (const [key, value] of Object.entries(corsHeaders)) {
        newResponse.headers.set(key, value);
      }

      return newResponse;
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
