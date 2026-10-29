import 'package:flutter_test/flutter_test.dart';
import 'package:proyecto_gestoria/domain/models.dart';

void main() {
  group('modelos de la aplicación', () {
    test('interpreta una solicitud y conserva su contexto fiscal', () {
      final request = Solicitud.fromJson({
        'id': 7,
        'clienteId': 3,
        'nombreCliente': 'Cliente Demo',
        'titulo': 'Facturas del trimestre',
        'estado': 'ABIERTA',
        'fechaVencimiento': '2026-10-31',
        'cumplimientoObligacionId': 11,
        'tiposDocumentoEsperados': ['FACTURA_EMITIDA'],
      });

      expect(request.editable, isTrue);
      expect(request.cumplimientoObligacionId, 11);
      expect(request.tiposEsperados, ['FACTURA_EMITIDA']);
    });

    test('normaliza etiquetas para mostrarlas al usuario', () {
      expect(etiqueta('PENDIENTE_DOCUMENTACION'), 'Pendiente Documentacion');
      expect(etiqueta('AUTONOMO'), 'Autonomo');
    });
  });
}
