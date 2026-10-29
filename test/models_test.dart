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
      expect(etiqueta('PENDIENTE_DOCUMENTACION'), 'Pendiente de documentación');
      expect(etiqueta('AUTONOMO'), 'Autónomo');
      expect(
        etiqueta('pagaProfesionalesRetencion'),
        'Paga profesionales con retención',
      );
    });

    test('conserva la configuración completa de una obligación', () {
      final obligation = Obligacion.fromJson({
        'id': 12,
        'clienteId': 3,
        'codigo': '303',
        'nombre': 'IVA trimestral',
        'categoria': 'FISCAL',
        'periodicidad': 'TRIMESTRAL',
        'mesesPresentacion': '4,7,10,1',
        'diaLimite': 20,
        'observaciones': 'Presentación telemática',
        'tiposDocumentoEsperados': ['FACTURA_EMITIDA', 'FACTURA_RECIBIDA'],
        'activa': true,
      });

      expect(obligation.diaLimite, 20);
      expect(obligation.mesesPresentacion, '4,7,10,1');
      expect(obligation.tiposDocumentoEsperados, hasLength(2));
    });

    test('serializa el perfil fiscal para revisión', () {
      final profile = PerfilFiscal.fromJson({
        'clienteId': 8,
        'territorioFiscal': 'COMUN',
        'regimenIrpf': 'ESTIMACION_DIRECTA_SIMPLIFICADA',
        'regimenIva': 'GENERAL',
        'tieneTrabajadores': 'SI',
        'estadoRevision': 'BORRADOR',
        'porcentajeCompletado': 46,
      });

      final payload = profile.toJson(reviewed: true);
      expect(payload['tieneTrabajadores'], 'SI');
      expect(payload['operacionesTerceros'], 'PENDIENTE');
      expect(payload['marcarRevisado'], isTrue);
    });
  });
}
