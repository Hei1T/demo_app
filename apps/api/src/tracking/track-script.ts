/**
 * 注入到每张名片页 <head> 的采集脚本（/t.js）。
 * 模板（body）里完全不需要写任何监控代码。
 *
 * 采集项：
 *   view    打开：来源、屏幕、语言、时区、设备像素比、视口
 *   click   任意点击（捕获阶段，全站事件委托）：标签、路径、文案、href、坐标
 *   dwell   停留时长 + 最大滚动深度
 *   copy    复制行为（电话/邮箱/微信）
 *   out     外链跳转
 *
 * 上报：3 秒批量一次 + 离开时 sendBeacon 同步发。
 */
export const TRACK_SCRIPT = String.raw`(function(){
  'use strict';
  var s = document.currentScript;
  var CODE = (s && s.getAttribute('data-code')) || '';
  if (!CODE) return;
  var EP = '/api/collect';
  var q = [], start = Date.now(), maxScroll = 0, done = false;
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}

  function push(t, d) {
    var o = d || {};
    o.t = t;
    o.at = Date.now();
    o.dt = Date.now() - start;
    q.push(o);
    if (q.length >= 20) flush(false);
  }

  function flush(sync) {
    if (!q.length) return;
    var body = JSON.stringify({
      code: CODE,
      url: location.href,
      ref: document.referrer || '',
      ua: navigator.userAgent,
      lang: navigator.language || '',
      tz: tz,
      screen: screen.width + 'x' + screen.height,
      events: q
    });
    q = [];
    try {
      if (sync && navigator.sendBeacon) {
        navigator.sendBeacon(EP, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(EP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
          keepalive: true
        }).catch(function(){});
      }
    } catch (e) {}
  }

  // ① 打开
  push('view', {
    dpr: window.devicePixelRatio || 1,
    vw: window.innerWidth,
    vh: window.innerHeight
  });

  // ② 所有点击（任意元素，捕获阶段）
  document.addEventListener('click', function (e) {
    var el = e.target;
    if (!el || el.nodeType !== 1) return;
    var path = [], n = el;
    while (n && n.nodeType === 1 && path.length < 4) {
      var cls = (typeof n.className === 'string' && n.className)
        ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.')
        : '';
      path.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + cls);
      n = n.parentElement;
    }
    var a = el.closest ? el.closest('a') : null;
    var href = a ? (a.getAttribute('href') || '') : '';
    push('click', {
      tag: el.tagName.toLowerCase(),
      path: path.join('>').slice(0, 180),
      label: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      href: href.slice(0, 190),
      x: e.clientX || 0,
      y: e.clientY || 0,
      btn: e.button || 0
    });
    // 外链单独标记
    if (a && /^https?:/i.test(href) && href.indexOf(location.host) === -1) {
      push('out', { href: href.slice(0, 190), label: (el.textContent || '').trim().slice(0, 60) });
    }
    flush(false);
  }, true);

  // ③ 滚动深度
  window.addEventListener('scroll', function () {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.round((window.scrollY / h) * 100) : 100;
    if (p > maxScroll) maxScroll = p;
  }, { passive: true });

  // ④ 复制（电话/邮箱/微信常被复制）
  document.addEventListener('copy', function () {
    var sel = String(window.getSelection ? window.getSelection() : '');
    if (sel) push('copy', { text: sel.replace(/\s+/g, ' ').trim().slice(0, 80) });
  });

  // ⑤ 停留时长 + 离开
  function bye() {
    if (done) return;
    done = true;
    push('dwell', { duration: Date.now() - start, scroll: maxScroll });
    flush(true);
  }
  window.addEventListener('pagehide', bye);
  window.addEventListener('beforeunload', bye);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') bye();
  });

  // ⑥ 定时批量
  setInterval(function () { flush(false); }, 3000);
  setTimeout(function () { flush(false); }, 1000);
})();`;
