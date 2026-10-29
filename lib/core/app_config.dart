import 'dart:convert';

import 'package:flutter/services.dart';

class AppConfig {
  const AppConfig({
    required this.apiUrl,
    required this.keycloakUrl,
    required this.keycloakRealm,
    required this.keycloakClientId,
    required this.supportEmail,
  });

  final String apiUrl;
  final String keycloakUrl;
  final String keycloakRealm;
  final String keycloakClientId;
  final String supportEmail;

  String get issuer => '$keycloakUrl/realms/$keycloakRealm';
  String get discoveryUrl => '$issuer/.well-known/openid-configuration';
  String get authorizationEndpoint => '$issuer/protocol/openid-connect/auth';
  String get tokenEndpoint => '$issuer/protocol/openid-connect/token';
  String get logoutEndpoint => '$issuer/protocol/openid-connect/logout';
  String get webRedirectUri => Uri.base.hasAuthority ? Uri.base.origin : '';
  String get nativeRedirectUri => 'com.raulser.proyectogestoria:/oauthredirect';
  String get nativeLogoutRedirectUri => 'com.raulser.proyectogestoria:/';

  static Future<AppConfig> load() async {
    final source = await rootBundle.loadString('assets/config/app-config.json');
    final json = jsonDecode(source) as Map<String, dynamic>;
    return AppConfig(
      apiUrl: (json['apiUrl'] as String? ?? '').replaceAll(RegExp(r'/$'), ''),
      keycloakUrl: (json['keycloakUrl'] as String? ?? 'http://localhost:8081')
          .replaceAll(RegExp(r'/$'), ''),
      keycloakRealm: json['keycloakRealm'] as String? ?? 'gestoria',
      keycloakClientId: json['keycloakClientId'] as String? ?? 'gestoria-web',
      supportEmail: json['supportEmail'] as String? ?? 'soporte@example.com',
    );
  }
}
