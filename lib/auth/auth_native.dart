import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../core/app_config.dart';
import 'auth_contract.dart';

class NativeAuthGateway implements AuthGateway {
  NativeAuthGateway(this.config);
  final AppConfig config;
  final FlutterAppAuth _appAuth = const FlutterAppAuth();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  AuthTokens? _tokens;

  AuthorizationServiceConfiguration get _service =>
      AuthorizationServiceConfiguration(
        authorizationEndpoint: config.authorizationEndpoint,
        tokenEndpoint: config.tokenEndpoint,
        endSessionEndpoint: config.logoutEndpoint,
      );

  @override
  Future<AuthTokens?> initialize() async {
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken == null) return null;
    try {
      final response = await _appAuth.token(
        TokenRequest(
          config.keycloakClientId,
          config.nativeRedirectUri,
          refreshToken: refreshToken,
          serviceConfiguration: _service,
          scopes: const ['openid', 'profile', 'email', 'roles'],
        ),
      );
      if (response.accessToken == null) return null;
      _tokens = AuthTokens(
        accessToken: response.accessToken!,
        idToken: response.idToken,
        refreshToken: response.refreshToken ?? refreshToken,
      );
      await _persist(_tokens!);
      return _tokens;
    } catch (_) {
      await _storage.deleteAll();
      return null;
    }
  }

  @override
  Future<void> login() async {
    final response = await _appAuth.authorizeAndExchangeCode(
      AuthorizationTokenRequest(
        config.keycloakClientId,
        config.nativeRedirectUri,
        serviceConfiguration: _service,
        scopes: const ['openid', 'profile', 'email', 'roles'],
      ),
    );
    if (response.accessToken == null) return;
    _tokens = AuthTokens(
      accessToken: response.accessToken!,
      idToken: response.idToken,
      refreshToken: response.refreshToken,
    );
    await _persist(_tokens!);
  }

  Future<void> _persist(AuthTokens value) async {
    if (value.refreshToken != null) {
      await _storage.write(key: 'refresh_token', value: value.refreshToken);
    }
    if (value.idToken != null) {
      await _storage.write(key: 'id_token', value: value.idToken);
    }
  }

  @override
  Future<void> logout() async {
    final idToken = _tokens?.idToken ?? await _storage.read(key: 'id_token');
    if (idToken != null) {
      await _appAuth.endSession(
        EndSessionRequest(
          idTokenHint: idToken,
          postLogoutRedirectUrl: config.nativeLogoutRedirectUri,
          serviceConfiguration: _service,
        ),
      );
    }
    _tokens = null;
    await _storage.deleteAll();
  }

  @override
  Future<String?> accessToken() async => _tokens?.accessToken;
}

AuthGateway createAuthGateway(AppConfig config) => NativeAuthGateway(config);
