import 'dotenv/config';
import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TEMPLATES = ['noir', 'paper', 'wood', 'neon', 'sunset', 'ocean'];
const CITY_LIKE = ['Hangzhou', 'Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou', 'Chengdu', 'Wuhan', 'Nanjing'];
const NAMES = ['张一', '李二', '王三', '赵四', '钱五', '孙六', '周七', '吴八', '郑九', '冯十'];
const CLICK_TYPES = ['click_phone', 'click_email', 'click_map', 'click_wechat', 'click_social', 'save_contact', 'copy'];

function code(): string {
  const b = randomBytes(10);
  let s = '';
  for (let i = 0; i < 10; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return s;
}
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const rand = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

async function main() {
  const c = new Client({
    host: process.env.PGHOST ?? '127.0.0.1',
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD ?? '',
    database: process.env.PGDATABASE ?? 'nfc_saas',
  });
  await c.connect();

  const email = 'biguser@nfc.local';
  console.log('清理旧数据…');
  await c.query(
    `DELETE FROM events WHERE "cardId" IN (SELECT id FROM cards WHERE "userId" IN (SELECT id FROM users WHERE email=$1))`,
    [email],
  );
  await c.query(`DELETE FROM cards WHERE "userId" IN (SELECT id FROM users WHERE email=$1)`, [email]);
  await c.query(`DELETE FROM users WHERE email=$1`, [email]);

  const hash = await bcrypt.hash('Big12345!', 12);

  // 1 个用户，300 张名片
  const u = await c.query(
    `INSERT INTO users (email,"passwordHash",name,role,plan,"tokenVersion","createdAt")
     VALUES ($1,$2,'名片大户','user','pro',0, now() - interval '60 days') RETURNING id`,
    [email, hash],
  );
  const userId = u.rows[0].id;

  console.log('创建 300 张名片…');
  const CARD_COUNT = 300;
  const cardIds: string[] = [];

  for (let i = 0; i < CARD_COUNT; i++) {
    const name = pick(NAMES) + (i + 1);
    const profile = {
      name,
      role: pick(['销售总监', '渠道经理', '商务拓展', '客户成功', '产品经理']),
      org: pick(['华东分部', '华南大区', '总部', '城市分公司']),
      phone: `138${rand(10000000, 99999999)}`,
      email: `c${i + 1}@example.com`,
      addr: pick(['杭州市西湖区', '上海市静安区', '深圳市南山区']),
    };
    const r = await c.query(
      `INSERT INTO cards ("code","userId","profile","templateSlug",enabled,"createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,true, now() - ($5 || ' days')::interval, now()) RETURNING id`,
      [code(), userId, JSON.stringify(profile), pick(TEMPLATES), String(rand(0, 45))],
    );
    cardIds.push(r.rows[0].id);
  }

  console.log('生成行为事件…');
  const rows: unknown[][] = [];
  const now = Date.now();
  for (const cardId of cardIds) {
    const days = rand(5, 30);
    for (let d = 0; d < days; d++) {
      const views = rand(1, 8);
      for (let v = 0; v < views; v++) {
        const at = new Date(now - d * 86400000 - rand(0, 82800000));
        const visitor = `v${rand(1, 2000)}c${cardId.slice(0, 4)}`;
        const city = pick(CITY_LIKE);
        rows.push([cardId, 'view', visitor, city, 'ZJ', 'CN', at, null, null, null, null, null, {}]);
        if (Math.random() < 0.55) {
          const n = rand(1, 2);
          for (let k = 0; k < n; k++) {
            rows.push([
              cardId, pick(CLICK_TYPES), visitor, city, 'ZJ', 'CN',
              new Date(at.getTime() + rand(1000, 90000)),
              null, null, 'a', '拨打电话', 'tel:13800000000', {},
            ]);
          }
        }
        if (Math.random() < 0.6) {
          rows.push([
            cardId, 'dwell', visitor, city, 'ZJ', 'CN',
            new Date(at.getTime() + rand(3000, 60000)),
            rand(2000, 45000), rand(20, 100), null, null, null, {},
          ]);
        }
      }
    }
  }

  console.log(`写入 ${rows.length} 条事件（分批）…`);
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const placeholders: string[] = [];
    const vals: unknown[] = [];
    slice.forEach((r, idx) => {
      const b = idx * 13;
      placeholders.push(
        `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12},$${b + 13})`,
      );
      vals.push(...r);
    });
    await c.query(
      `INSERT INTO events ("cardId",type,"visitorHash",city,region,country,"createdAt",duration,"scrollDepth","targetTag","targetLabel","targetHref",extra)
       VALUES ${placeholders.join(',')}`,
      vals,
    );
  }

  const stat = await c.query(
    `SELECT (SELECT COUNT(*) FROM cards WHERE "userId"=$1) cards,
            (SELECT COUNT(*) FROM events WHERE "cardId" IN (SELECT id FROM cards WHERE "userId"=$1)) events`,
    [userId],
  );
  console.log('完成:', stat.rows[0]);
  console.log('用户 ID:', userId);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
