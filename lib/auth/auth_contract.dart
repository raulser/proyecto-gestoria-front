class AuthTokens {
  const AuthTokens({
    required this.accessToken,
    this.idToken,
    this.refreshToken,
  });
  final String accessToken;
  final String? idToken;
  final String? refreshToken;
}

abstract interface class AuthGateway {
  Future<AuthTokens?> initialize();
  Future<void> login();
  Future<void> logout();
  Future<String?> accessToken();
}
