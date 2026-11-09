import 'dotenv/config';
import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TEMPLATES = ['noir', 'paper', 'wood', 'neon', 'sunset', 'ocean'];
const NAMES = [
  ['林小满', '品牌设计师', '小满工作室'],
  ['陈默', '产品经理', '字节跳动'],
  ['苏晚', '独立摄影师', 'SU Studio'],
  ['周野', '增长负责人', '某 SaaS'],
  ['何一', 'AI 课程主理人', '夜航 AI'],
  ['姜屿', '前端工程师', '自由职业'],
  ['宋知', '插画师', '知了插画'],
  ['许棠', '电商店主', '棠棠小铺'],
  ['孟舟', '投资人', '启明创投'],
  ['陆离', '内容创作者', '陆离频道'],
  ['沈疏', 'UX 设计师', '蚂蚁集团'],
  ['叶白', '咖啡师', '白夜咖啡'],
];
const ADDRS = [
  '杭州市西湖区文三路 90 号',
  '上海市静安区南京西路 1266 号',
  '深圳市南山区科技园南区',
  '北京市朝阳区望京 SOHO',
  '广州市天河区珠江新城',
  '成都市高新区天府三街',
];

function code(): string {
  const b = randomBytes(10);
  let s = '';
  for (let i = 0; i < 10; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return s;
}
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  const c = new Client({
    host: process.env.PGHOST ?? '127.0.0.1',
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD ?? '',
    database: process.env.PGDATABASE ?? 'nfc_saas',
  });
  await c.connect();

  console.log('清理旧演示数据…');
  await c.query("DELETE FROM events WHERE \"cardId\" IN (SELECT id FROM cards WHERE \"profile\"->>'name' IS NOT NULL AND \"userId\" IN (SELECT id FROM users WHERE email LIKE 'demo%@nfc.local'))");
  await c.query("DELETE FROM cards WHERE \"userId\" IN (SELECT id FROM users WHERE email LIKE 'demo%@nfc.local')");
  await c.query("DELETE FROM users WHERE email LIKE 'demo%@nfc.local'");

  const hash = await bcrypt.hash('Demo12345!', 12);
  console.log('创建用户 + 名片 + 事件…');

  for (let i = 0; i < NAMES.length; i++) {
    const [name, role, org] = NAMES[i];
    const email = `demo${i + 1}@nfc.local`;
    const plan = i % 3 === 0 ? 'pro' : 'free';
    const u = await c.query(
      `INSERT INTO users (email,"passwordHash",name,role,plan,"tokenVersion","createdAt")
       VALUES ($1,$2,$3,'user',$4,0, now() - ($5 || ' days')::interval) RETURNING id`,
      [email, hash, name, plan, String(rand(1, 40))],
    );
    const userId = u.rows[0].id;

    // 每人 1-3 张卡
    const cardCount = rand(1, 3);
    for (let k = 0; k < cardCount; k++) {
      const tpl = pick(TEMPLATES);
      const profile = {
        name,
        role,
        org,
        phone: `138${rand(10000000, 99999999)}`,
        email: `${name}@example.com`,
        addr: pick(ADDRS),
      };
      const cardRes = await c.query(
        `INSERT INTO cards ("code","userId","profile","templateSlug",enabled,"createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,true, now() - ($5 || ' days')::interval, now()) RETURNING id,"createdAt"`,
        [code(), userId, JSON.stringify(profile), tpl, String(rand(0, 30))],
      );
      const cardId = cardRes.rows[0].id;
      const created = new Date(cardRes.rows[0].createdAt);

      // 事件：按天生成，越近越多
      const days = Math.min(14, Math.floor((Date.now() - created.getTime()) / 86400000) + 1);
      for (let d = 0; d < days; d++) {
        const dayViews = rand(0, 14);
        for (let v = 0; v < dayViews; v++) {
          const at = new Date(Date.now() - d * 86400000 - rand(0, 82800000));
          const visitor = `v${rand(1, 60)}card${cardId.slice(0, 6)}`;
          await c.query(
            `INSERT INTO events ("cardId",type,"visitorHash","ua","ipMasked","createdAt")
             VALUES ($1,'view',$2,'demo',$3,$4)`,
            [cardId, visitor, '10.0.x.x', at],
          );
          // 部分打开会点
          if (Math.random() < 0.45) {
            const types = ['click_phone', 'click_email', 'click_map', 'click_wechat', 'click_social', 'save_contact'];
            const n = rand(1, 2);
            for (let t = 0; t < n; t++) {
              await c.query(
                `INSERT INTO events ("cardId",type,"visitorHash","ua","ipMasked","createdAt")
                 VALUES ($1,$2,$3,'demo','10.0.x.x',$4)`,
                [cardId, pick(types), visitor, new Date(at.getTime() + rand(1000, 60000))],
              );
            }
          }
        }
      }
    }
  }

  const counts = await c.query(`
    SELECT (SELECT COUNT(*) FROM users) users,
           (SELECT COUNT(*) FROM cards) cards,
           (SELECT COUNT(*) FROM events) events
  `);
  console.log('完成:', counts.rows[0]);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
