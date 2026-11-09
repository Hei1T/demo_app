const base = 'http://127.0.0.1:3000';
(async () => {
  const l = await (await fetch(base + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo12@nfc.local', password: 'Demo12345!' }),
  })).json();
  const H = { Authorization: 'Bearer ' + l.accessToken, 'Content-Type': 'application/json' };
  const cards = await (await fetch(base + '/api/cards', { headers: H })).json();
  const code = cards.cards[0].code;

  const profile = {
    name: '叶白', role: '咖啡师', org: '白夜咖啡',
    bio: '一杯好咖啡，交一个朋友',
    phone: '13800002222', email: 'hi@baiye.coffee',
    addr: '杭州市西湖区文三路 90 号',
    website: 'https://baiye.coffee',
    wechat: 'yebai_coffee',
    languages: ['zh-CN', 'en', 'ja'],
    links: [
      { platform: 'wechat', value: 'yebai_coffee' },
      { platform: 'linkedin', value: 'yebai' },
      { platform: 'instagram', value: 'yebai.coffee' },
      { platform: 'x', value: 'yebai_coffee' },
      { platform: 'douyin', value: 'https://www.douyin.com/user/yebai' },
      { platform: 'xiaohongshu', value: 'https://www.xiaohongshu.com/user/yebai' },
      { platform: 'github', value: 'yebai' },
      { platform: 'telegram', value: 'yebai' },
      { platform: 'whatsapp', value: '8613800002222' },
      { platform: 'youtube', value: 'https://youtube.com/@baiyecoffee' },
      { platform: 'bilibili', value: '12345678' },
      { platform: 'spotify', value: 'https://open.spotify.com/user/yebai' },
    ],
  };
  const r = await fetch(base + '/api/cards/' + code, {
    method: 'PATCH', headers: H, body: JSON.stringify({ profile }),
  });
  console.log('更新资料:', r.status, await r.text());

  const p = await (await fetch(base + '/api/platforms')).json();
  console.log('平台总数:', p.count, '| 国内:', p.platforms.filter(x => x.region === 'cn').length,
    '国际:', p.platforms.filter(x => x.region === 'intl').length,
    '通用:', p.platforms.filter(x => x.region === 'both').length);

  const html = await (await fetch(base + '/u/' + code)).text();
  console.log('名片页:', html.length, '字节 | 社交胶囊:', (html.match(/class="soc"/g) || []).length);
  console.log('名片短码:', code);
})();
