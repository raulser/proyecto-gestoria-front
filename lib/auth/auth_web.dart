import 'package:flutter_openid_web/flutter_openid_web.dart';

import '../core/app_config.dart';
import 'auth_contract.dart';

class WebAuthGateway implements AuthGateway {
  WebAuthGateway(this.config);
  final AppConfig config;

  AuthServiceConfiguration get _service => AuthServiceConfiguration(
    authorizationEndpoint: config.authorizationEndpoint,
    tokenEndpoint: config.tokenEndpoint,
    endSessionEndpoint: config.logoutEndpoint,
  );

  @override
  Future<AuthTokens?> initialize() async {
    final cancelled = Uri.base.queryParameters.containsKey('error');
    await FlutterOpenidWeb.initialize();
    if (cancelled) {
      throw StateError(
        'El inicio de sesión no se ha completado. Puedes volver a intentarlo.',
      );
    }
    if (FlutterOpenidWeb.instance.currentState.status == AuthStatus.error) {
      throw StateError(
        'No se ha podido recuperar la sesión. Vuelve a iniciar sesión.',
      );
    }
    final tokens = FlutterOpenidWeb.instance.currentState.tokens;
    return tokens == null
        ? null
        : AuthTokens(
            accessToken: tokens.accessToken,
            idToken: tokens.idToken,
            refreshToken: tokens.refreshToken,
          );
  }

  @override
  Future<void> login() async {
    await FlutterOpenidWeb.instance.authenticateAndExchangeCode(
      AuthRequest(
        issuer: config.issuer,
        clientId: config.keycloakClientId,
        redirectUri: config.webRedirectUri,
        scopes: const ['openid', 'profile', 'email', 'roles'],
        serviceConfiguration: _service,
      ),
    );
  }

  @override
  Future<void> logout() async {
    final tokens = FlutterOpenidWeb.instance.currentState.tokens;
    if (tokens?.idToken == null) return;
    await FlutterOpenidWeb.instance.endSession(
      EndSessionRequest(
        idToken: tokens!.idToken!,
        issuer: config.issuer,
        clientId: config.keycloakClientId,
        postLogoutRedirectUri: '${config.webRedirectUri}/?signed_out=1',
        serviceConfiguration: _service,
      ),
    );
  }

  @override
  Future<String?> accessToken() async =>
      FlutterOpenidWeb.instance.currentState.tokens?.accessToken;
}

AuthGateway createAuthGateway(AppConfig config) => WebAuthGateway(config);
