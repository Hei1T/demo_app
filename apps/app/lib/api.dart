import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Android 模拟器访问宿主机用 10.0.2.2
const String kApiBase = String.fromEnvironment(
  'API_BASE',
  defaultValue: 'http://10.0.2.2:3000',
);

class ApiException implements Exception {
  final int status;
  final String message;
  ApiException(this.status, this.message);
  @override
  String toString() => message;
}

class Session {
  /// 登录态变化通知：token 失效时让根组件切回登录页
  static final ValueNotifier<int> authChanged = ValueNotifier<int>(0);

  /// 资料/卡片变更后通知各页面重新拉数据
  static final ValueNotifier<int> dataChanged = ValueNotifier<int>(0);

  static String? _token;
  static String? _refreshToken;
  static Map<String, dynamic>? user;

  static bool get loggedIn => _token != null && _token!.isNotEmpty;
  static String? get token => _token;
  static String? get refreshToken => _refreshToken;

  static Future<void> load() async {
    final sp = await SharedPreferences.getInstance();
    _token = sp.getString('token');
    _refreshToken = sp.getString('refreshToken');
    final u = sp.getString('user');
    if (u != null) user = jsonDecode(u) as Map<String, dynamic>;
  }

  static Future<void> save(
    String token,
    Map<String, dynamic> u, {
    String? refreshToken,
  }) async {
    _token = token;
    if (refreshToken != null) _refreshToken = refreshToken;
    user = u;
    final sp = await SharedPreferences.getInstance();
    await sp.setString('token', token);
    await sp.setString('user', jsonEncode(u));
    if (refreshToken != null) {
      await sp.setString('refreshToken', refreshToken);
    }
  }

  static Future<void> clear() async {
    _token = null;
    _refreshToken = null;
    user = null;
    final sp = await SharedPreferences.getInstance();
    await sp.remove('token');
    await sp.remove('refreshToken');
    await sp.remove('user');
    authChanged.value++;
  }
}

class Api {
  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (Session.loggedIn) 'Authorization': 'Bearer ${Session.token}',
      };


  /// 静默刷新：用 refreshToken 换新的 accessToken
  static Future<bool> _tryRefresh() async {
    final rt = Session.refreshToken;
    if (rt == null || rt.isEmpty) return false;
    try {
      final res = await http
          .post(
            Uri.parse('$kApiBase/auth/refresh'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'refreshToken': rt}),
          )
          .timeout(const Duration(seconds: 10));
      if (res.statusCode >= 400) return false;
      final j = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      final newToken = j['accessToken'] as String?;
      if (newToken == null) return false;
      await Session.save(
        newToken,
        Session.user ?? {},
        refreshToken: j['refreshToken'] as String?,
      );
      return true;
    } catch (_) {
      return false;
    }
  }
  static Future<dynamic> _req(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool retried = false,
  }) async {
    final uri = Uri.parse('$kApiBase$path');
    late http.Response res;
    try {
      switch (method) {
        case 'GET':
          res = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 15));
          break;
        case 'POST':
          res = await http
              .post(uri, headers: _headers, body: jsonEncode(body ?? {}))
              .timeout(const Duration(seconds: 15));
          break;
        case 'PATCH':
          res = await http
              .patch(uri, headers: _headers, body: jsonEncode(body ?? {}))
              .timeout(const Duration(seconds: 15));
          break;
        default:
          res = await http.delete(uri, headers: _headers).timeout(const Duration(seconds: 15));
      }
    } catch (e) {
      throw ApiException(0, '网络连接失败，请检查服务是否启动');
    }

    if (res.statusCode == 401) {
      // 先静默刷新一次，成功就重放这次请求（只重试一次）
      if (!retried && await _tryRefresh()) {
        return _req(method, path, body: body, retried: true);
      }
      String msg = '登录已过期，请重新登录';
      try {
        final j = jsonDecode(utf8.decode(res.bodyBytes));
        if (j is Map && j['message'] != null) msg = j['message'].toString();
      } catch (_) {}
      await Session.clear();
      throw ApiException(401, msg);
    }
    if (res.statusCode >= 400) {
      String msg = '请求失败 (${res.statusCode})';
      try {
        final j = jsonDecode(utf8.decode(res.bodyBytes));
        if (j is Map && j['message'] != null) {
          final m = j['message'];
          msg = m is List ? m.join('，') : m.toString();
        }
      } catch (_) {}
      throw ApiException(res.statusCode, msg);
    }
    if (res.body.isEmpty) return null;
    return jsonDecode(utf8.decode(res.bodyBytes));
  }

  // ---------- 认证 ----------
  static Future<void> login(String email, String password) async {
    final j = await _req('POST', '/auth/login', body: {'email': email, 'password': password});
    await Session.save(
      j['accessToken'] as String,
      j['user'] as Map<String, dynamic>,
      refreshToken: j['refreshToken'] as String?,
    );
    Session.authChanged.value++;
  }

  static Future<void> register(String email, String password, String name) async {
    final j = await _req('POST', '/auth/register', body: {
      'email': email,
      'password': password,
      'name': name,
    });
    await Session.save(
      j['accessToken'] as String,
      j['user'] as Map<String, dynamic>,
      refreshToken: j['refreshToken'] as String?,
    );
    Session.authChanged.value++;
  }

  static Future<void> logout() => Session.clear();

  // ---------- 名片 ----------
  /// 只要总数（几秒刷新一次也几乎没成本）
  static Future<Map<String, dynamic>> myCardsPage({int page = 1, int size = 20}) async {
    final j = await _req('GET', '/api/cards?page=$page&size=$size&lite=1') as Map;
    return Map<String, dynamic>.from(j);
  }

  /// 批量更新所有卡（一次请求）
  static Future<void> bulkUpdateProfile(
    Map<String, dynamic> profile,
    String templateSlug,
  ) async {
    await _req('PATCH', '/api/cards/bulk', body: {
      'profile': profile,
      'templateSlug': templateSlug,
    });
    await refreshMe();
    Session.dataChanged.value++;
  }

  /// 最近一次 myCards 的总数（列表只取前 N 条，总数单独记）
  static int lastCardsTotal = 0;

  static Future<List<dynamic>> myCards({int size = 20}) async {
    final j = await _req('GET', '/api/cards?size=$size') as Map;
    lastCardsTotal = (j['total'] ?? 0) as int;
    return (j['items'] ?? j['cards'] ?? []) as List;
  }

  static Future<Map<String, dynamic>> createCard({
    required String name,
    String? role,
    String? org,
    String? phone,
    String? email,
    String? bio,
    String? website,
    String? wechat,
    List<Map<String, String>>? links,
    required String templateSlug,
  }) async {
    final j = await _req('POST', '/api/cards', body: {
      'profile': {
        'name': name,
        if (role != null && role.isNotEmpty) 'role': role,
        if (org != null && org.isNotEmpty) 'org': org,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (email != null && email.isNotEmpty) 'email': email,
        if (bio != null && bio.isNotEmpty) 'bio': bio,
        if (website != null && website.isNotEmpty) 'website': website,
        if (wechat != null && wechat.isNotEmpty) 'wechat': wechat,
        if (links != null && links.isNotEmpty) 'links': links,
      },
      'templateSlug': templateSlug,
    });
    Session.dataChanged.value++;
    return j as Map<String, dynamic>;
  }

  /// 我名下每张卡的独立数据（分页 + 搜索）
  static Future<dynamic> statsCardsPaged(
    int days, {
    int page = 1,
    int size = 20,
    String q = '',
  }) =>
      _req('GET',
          '/api/stats/cards?days=$days&page=$page&size=$size&q=${Uri.encodeComponent(q)}');

  /// 我名下每张卡的独立数据
  static Future<dynamic> statsCards([int days = 30]) =>
      _req('GET', '/api/stats/cards?days=$days');

  /// 单张卡明细
  static Future<dynamic> statsCard(String code, [int days = 30]) =>
      _req('GET', '/api/stats/cards/$code?days=$days');

  /// 重新拉一次当前用户（改名后用）
  static Future<void> refreshMe() async {
    try {
      final j = await _req('GET', '/auth/me') as Map;
      final u = (j['user'] ?? j) as Map;
      Session.user = Map<String, dynamic>.from(u);
      final sp = await SharedPreferences.getInstance();
      await sp.setString('user', jsonEncode(Session.user));
      Session.authChanged.value++;
    } catch (_) {}
  }

  /// 我的页三个数字：卡片数 / 累计打开 / 使用天数
  static Future<Map<String, dynamic>> userSummary() async {
    final j = await _req('GET', '/api/stats/summary') as Map;
    return Map<String, dynamic>.from(j);
  }

  /// 我的洞察（城市/设备/时段/来源/停留）
  static Future<dynamic> statsInsights([int days = 30]) =>
      _req('GET', '/api/stats/insights?days=$days');

  /// 作废这张卡（仅所有者）：所有入口立刻失效
  static Future<void> revokeCard(String code) async {
    await _req('POST', '/api/cards/' + code + '/revoke');
    Session.dataChanged.value++;
  }

  /// 恢复作废的卡
  static Future<void> restoreCard(String code) async {
    await _req('POST', '/api/cards/' + code + '/restore');
    Session.dataChanged.value++;
  }

  /// 更新某张卡的资料和模板
  static Future<void> updateCard(
    String code,
    Map<String, dynamic> profile,
    String templateSlug,
  ) async {
    await _req('PATCH', '/api/cards/' + code, body: {
      'profile': profile,
      'templateSlug': templateSlug,
    });
    Session.dataChanged.value++;
  }

  static Future<List<dynamic>> platforms() async {
    final j = await _req('GET', '/api/platforms');
    if (j is Map) return (j['platforms'] ?? []) as List;
    return [];
  }

  static Future<List<dynamic>> templates() async {
    final j = await _req('GET', '/api/templates');
    if (j is List) return j;
    if (j is Map) return (j['templates'] ?? j['items'] ?? []) as List;
    return [];
  }

  // ---------- 数据 ----------
  static Future<Map<String, dynamic>> myStats({int days = 30}) async {
    final j = await _req('GET', '/api/stats/me?days=$days');
    return j as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> cardStats(String code, {int days = 30}) async {
    final j = await _req('GET', '/api/stats/cards/$code?days=$days');
    return j as Map<String, dynamic>;
  }
}
