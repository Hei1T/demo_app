import 'dotenv/config';
import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';

/**
 * 创建/提升管理员账号
 *   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=xxxx node dist/scripts/seed-admin.js
 */
async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (!email || password.length < 8) {
    console.error('需要 ADMIN_EMAIL 和至少 8 位的 ADMIN_PASSWORD');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.PGHOST ?? '127.0.0.1',
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD ?? '',
    database: process.env.PGDATABASE ?? 'nfc_saas',
  });
  await client.connect();

  const exists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.rowCount) {
    await client.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
    console.log(`已把 ${email} 提升为 admin`);
  } else {
    const hash = await bcrypt.hash(password, 12);
    await client.query(
      "INSERT INTO users (email, \"passwordHash\", name, role, plan, \"tokenVersion\") VALUES ($1,$2,$3,'admin','pro',0)",
      [email, hash, 'Admin'],
    );
    console.log(`已创建管理员 ${email}`);
  }
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
