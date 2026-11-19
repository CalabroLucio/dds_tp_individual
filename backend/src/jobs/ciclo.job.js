import { autoUtilizable, estaVencida, QUIEN_SISTEMA, transicionar } from '../domain/compra.js';

// Ciclo periódico (R11, patrón de CierreAutomatico.job.js de tp_desarrollo). `ejecutar(ahora)` es síncrono y
// se puede llamar a mano desde los tests; `iniciarJob` lo programa con setInterval.
export function crearCiclo({ repos, reglas }) {
  return {
    ejecutar(ahora) {
      let expiradas = 0;
      let utilizadas = 0;
      for (const compra of repos.compras.listar()) {
        // FR-016: PENDIENTE sin pagar a los 15 minutos → CANCELADA (el cupo se libera al cambiar el estado).
        if (estaVencida(compra, ahora)) {
          transicionar(compra, 'CANCELADA', QUIEN_SISTEMA, ahora);
          expiradas++;
        } else if (autoUtilizable(compra, repos.eventos.porId(compra.eventoId), ahora, reglas)) {
          // Clarificación 2: CONFIRMADA sin marcar 24 h después del inicio → UTILIZADA por el sistema.
          transicionar(compra, 'UTILIZADA', QUIEN_SISTEMA, ahora);
          utilizadas++;
        }
      }
      return { expiradas, utilizadas };
    },
  };
}

export function iniciarJob({ ciclo, reloj, reglas, alTerminar = () => {} }) {
  const id = setInterval(() => {
    const resumen = ciclo.ejecutar(reloj.ahora());
    alTerminar(resumen);
  }, reglas.INTERVALO_JOB_SEG * 1000);
  id.unref?.();
  return () => clearInterval(id);
}
