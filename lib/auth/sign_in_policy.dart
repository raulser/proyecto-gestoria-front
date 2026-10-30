/// Start a fresh web login once, but preserve callback errors and explicit logout.
bool shouldOpenSignInAutomatically({
  required bool isWeb,
  required Uri entryUri,
}) =>
    isWeb &&
    !const [
      'code',
      'error',
      'state',
      'session_state',
      'signed_out',
    ].any(entryUri.queryParameters.containsKey);
