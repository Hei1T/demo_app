import { Injectable } from '@nestjs/common';

type Entry = { value: unknown; expires: number };

/**
 * 极简内存缓存：几十秒 TTL，挡住后台切页/重复请求。
 * 单机够用；多实例时可整体换 Redis（接口不变）。
 */
@Injectable()
export class CacheService {
  private store = new Map<string, Entry>();

  get<T>(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value as T;
  }

  set(key: string, value: unknown, ttlMs = 30_000) {
    this.store.set(key, { value, expires: Date.now() + ttlMs });
    if (this.store.size > 500) {
      const now = Date.now();
      for (const [k, v] of this.store) if (v.expires < now) this.store.delete(k);
    }
  }

  /** 先查缓存，未命中再执行并写回 */
  async wrap<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const hit = this.get<T>(key);
    if (hit !== undefined) return hit;
    const value = await fn();
    this.set(key, value, ttlMs);
    return value;
  }

  clear() {
    this.store.clear();
  }
}
