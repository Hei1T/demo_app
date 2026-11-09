/**
 * events 表按月分区（PostgreSQL 原生声明式分区）。
 *
 * 为什么：名片打开事件是增长最快的表。按月分区后：
 *   - 查「最近 30 天」只扫 1-2 个分区，不扫全表
 *   - 老分区可以整体归档/删除（DROP PARTITION 秒级）
 *   - 每个分区独立索引，索引更小更快
 *
 * 用法：node scripts/partition-events.cjs
 */
const { Client } = require('pg');

const MONTHS_AHEAD = 3;
const MONTHS_BACK = 3;

(async () => {
  const c = new Client({
    host: process.env.PGHOST ?? '127.0.0.1',
    port: Number(process.env.PGPORT ?? 55433),
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD ?? '',
    database: process.env.PGDATABASE ?? 'nfc_saas',
  });
  await c.connect();

  const exists = await c.query(
    `SELECT 1 FROM pg_tables WHERE tablename='events'`,
  );
  if (exists.rowCount === 0) {
    console.log('events 表不存在，跳过');
    await c.end();
    return;
  }

  const isPartitioned = await c.query(
    `SELECT 1 FROM pg_partitioned_table p
     JOIN pg_class cl ON cl.oid = p.partrelid WHERE cl.relname='events'`,
  );
  if (isPartitioned.rowCount > 0) {
    console.log('events 已是分区表，跳过');
    await c.end();
    return;
  }

  console.log('1) 重命名旧表');
  await c.query('ALTER TABLE events RENAME TO events_old');
  await c.query('ALTER INDEX IF EXISTS idx_events_user_time RENAME TO idx_events_old_user_time');
  await c.query('ALTER INDEX IF EXISTS idx_events_time_type RENAME TO idx_events_old_time_type');
  await c.query('ALTER INDEX IF EXISTS idx_events_type_time RENAME TO idx_events_old_type_time');
  await c.query('ALTER INDEX IF EXISTS idx_events_card_type_time RENAME TO idx_events_old_card_type_time');

  console.log('2) 创建分区主表');
  await c.query(`
    CREATE TABLE events (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      "cardId" uuid NOT NULL,
      "userId" uuid,
      type varchar(32) NOT NULL,
      "visitorHash" varchar(64),
      ua varchar(400),
      referer varchar(400),
      "ipMasked" varchar(64),
      city varchar(64),
      region varchar(64),
      country varchar(32),
      duration int,
      "scrollDepth" int,
      "targetTag" varchar(64),
      "targetLabel" varchar(160),
      "targetHref" varchar(200),
      extra jsonb DEFAULT '{}'::jsonb,
      "createdAt" timestamptz NOT NULL DEFAULT now()
    ) PARTITION BY RANGE ("createdAt")
  `);

  console.log('3) 创建月分区');
  const now = new Date();
  const created = [];
  for (let i = -MONTHS_BACK; i <= MONTHS_AHEAD; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    const name = `events_${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const from = d.toISOString().slice(0, 10);
    const to = next.toISOString().slice(0, 10);
    await c.query(
      `CREATE TABLE IF NOT EXISTS ${name} PARTITION OF events FOR VALUES FROM ('${from}') TO ('${to}')`,
    );
    created.push(`${name} [${from}, ${to})`);
  }
  // 兜底分区：超出范围的数据不报错
  await c.query(
    `CREATE TABLE IF NOT EXISTS events_default PARTITION OF events DEFAULT`,
  );
  created.forEach((x) => console.log('   ', x));

  console.log('4) 迁移数据');
  const t0 = Date.now();
  const moved = await c.query(`
    INSERT INTO events (id,"cardId","userId",type,"visitorHash",ua,referer,"ipMasked",
                        city,region,country,duration,"scrollDepth","targetTag","targetLabel","targetHref",extra,"createdAt")
    SELECT id,"cardId","userId",type,"visitorHash",ua,referer,"ipMasked",
           city,region,country,duration,"scrollDepth","targetTag","targetLabel","targetHref",extra,"createdAt"
    FROM events_old
  `);
  console.log(`    迁移 ${moved.rowCount} 行，${Date.now() - t0}ms`);

  console.log('5) 建索引（自动继承到所有分区）');
  await c.query('CREATE INDEX idx_events_user_time ON events ("userId","createdAt" DESC)');
  await c.query('CREATE INDEX idx_events_card_time ON events ("cardId","createdAt" DESC)');
  await c.query('CREATE INDEX idx_events_card_type ON events ("cardId", type)');
  await c.query('CREATE INDEX idx_events_time_type ON events ("createdAt" DESC, type)');
  await c.query('CREATE INDEX idx_events_type_time ON events (type,"createdAt" DESC)');
  await c.query('CREATE INDEX idx_events_visitor ON events ("visitorHash")');
  await c.query('CREATE INDEX idx_events_city ON events (city)');

  console.log('6) 删除旧表');
  await c.query('DROP TABLE events_old');
  await c.query('ANALYZE events');

  const parts = await c.query(`
    SELECT c.relname AS name,
           pg_size_pretty(pg_total_relation_size(c.oid)) AS size,
           (SELECT COUNT(*) FROM pg_inherits WHERE inhparent = c.oid) AS children
    FROM pg_class c
    WHERE c.relname LIKE 'events_%' AND c.relkind='r'
    ORDER BY c.relname
  `);
  console.log('\n分区结果:');
  parts.rows.forEach((r) => console.log(`  ${r.name.padEnd(20)} ${r.size}`));

  await c.end();
})().catch((e) => {
  console.error('失败:', e.message);
  process.exit(1);
});
