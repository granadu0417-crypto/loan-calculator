// Cloudflare Pages Function - 대출 계산기 결과 공유
const CRAWLER_PATTERNS = ['kakaotalk', 'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot', 'Slackbot', 'TelegramBot', 'WhatsApp', 'Pinterest', 'Google-InspectionTool', 'Googlebot', 'bingbot', 'Discordbot'];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  return CRAWLER_PATTERNS.some(p => userAgent.toLowerCase().includes(p.toLowerCase()));
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function generateOGTags(urlParams) {
  const monthly = urlParams.get('monthly');
  const total = urlParams.get('total');
  const interest = urlParams.get('interest');

  if (!monthly || !total) return null;

  const monthlyF = formatNumber(parseInt(monthly));
  const totalF = formatNumber(parseInt(total));
  const interestF = formatNumber(parseInt(interest));

  return {
    title: `💳 나의 대출 상환: 월 ${monthlyF}원!`,
    description: `월 상환 ${monthlyF}원 → 총 상환 ${totalF}원 → 총 이자 ${interestF}원\n당신의 대출도 계산해보세요 👉`
  };
}

function injectOGTags(html, ogData) {
  if (!ogData) return html;
  let modifiedHtml = html.replace(/<meta property="og:.*?".*?>/g, '');
  const ogTags = \`
    <meta property="og:type" content="website">
    <meta property="og:title" content="\${escapeHtml(ogData.title)}">
    <meta property="og:description" content="\${escapeHtml(ogData.description)}">
    <meta property="og:url" content="https://loan-calculator-36y.pages.dev/">
    <meta property="og:site_name" content="대출 계산기">
  \`;
  return modifiedHtml.replace('</head>', \`\${ogTags}\\n</head>\`);
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export async function onRequest(context) {
  const { request, next } = context;
  if (!isCrawler(request.headers.get('User-Agent') || '')) return next();
  
  const ogData = generateOGTags(new URL(request.url).searchParams);
  if (!ogData) return next();
  
  const response = await next();
  if (!(response.headers.get('Content-Type') || '').includes('text/html')) return response;
  
  let html = await response.text();
  return new Response(injectOGTags(html, ogData), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}
