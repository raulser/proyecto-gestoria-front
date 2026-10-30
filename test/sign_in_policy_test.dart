import 'package:flutter_test/flutter_test.dart';
import 'package:proyecto_gestoria/auth/sign_in_policy.dart';

void main() {
  test('abre el formulario al entrar a la web sin sesión', () {
    expect(
      shouldOpenSignInAutomatically(
        isWeb: true,
        entryUri: Uri.parse('http://localhost:8090/'),
      ),
      isTrue,
    );
  });

  test('en móvil nativo espera una acción del usuario', () {
    expect(
      shouldOpenSignInAutomatically(isWeb: false, entryUri: Uri()),
      isFalse,
    );
  });

  for (final query in [
    'code=returned-code',
    'error=access_denied',
    'state=returned-state',
    'session_state=returned-session',
    'signed_out=1',
  ]) {
    test('no reinicia el acceso tras recibir $query', () {
      expect(
        shouldOpenSignInAutomatically(
          isWeb: true,
          entryUri: Uri.parse('http://localhost:8090/?$query'),
        ),
        isFalse,
      );
    });
  }
}
