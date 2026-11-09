const base = 'http://127.0.0.1:3000';
const login = async () =>
  await (await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo12@nfc.local', password: 'Demo12345!' }),
  })).json();

const me = async (token) => {
  const r = await fetch(base + '/auth/me', {
    headers: { Authorization: 'Bearer ' + token },
  });
  return { status: r.status, body: await r.text() };
};

(async () => {
  console.log('=== 设备 A 登录 ===');
  const a = await login();
  console.log('A token:', a.accessToken.slice(0, 20) + '…');
  console.log('A /auth/me →', (await me(a.accessToken)).status);

  console.log('\n=== 设备 B 登录（同账号）===');
  const b = await login();
  console.log('B token:', b.accessToken.slice(0, 20) + '…');
  console.log('B /auth/me →', (await me(b.accessToken)).status);

  console.log('\n=== 回到设备 A ===');
  const ra = await me(a.accessToken);
  console.log('A /auth/me →', ra.status, ra.status === 401 ? '✅ 已被踢下线' : '❌ 仍可用');
  console.log('A 返回内容:', ra.body.slice(0, 120));

  console.log('\n=== 设备 B 仍然有效 ===');
  console.log('B /auth/me →', (await me(b.accessToken)).status);

  console.log('\n=== 旧 refresh token 也失效 ===');
  const rr = await fetch(base + '/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: a.refreshToken }),
  });
  console.log('A refresh →', rr.status, rr.status === 401 ? '✅ 失效' : '❌ 仍可用');
})();
