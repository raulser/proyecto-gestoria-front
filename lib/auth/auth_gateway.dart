export 'auth_contract.dart';
export 'auth_native.dart'
    if (dart.library.js_interop) 'auth_web.dart'
    show createAuthGateway;
