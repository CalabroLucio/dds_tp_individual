import { z, uuid } from './zod.js';
import { IDS_MEDIOS_PAGO } from '../domain/pagos.js';

// data-model.md · Compra.cantidad, Compra.tipoEntradaId y Compra.compradorId.
// En el borde solo se valida que la cantidad sea un entero ≥ 1: el máximo por compra (10) y el cupo los valida
// el servicio con 409 (CANTIDAD_EXCEDE_MAXIMO / CUPO_INSUFICIENTE), como define el contrato. El comprador sale
// de la sesión, nunca del cuerpo.
export const nuevaCompraSchema = z.object({
  eventoId: uuid,
  tipoEntradaId: uuid,
  cantidad: z
    .number({ message: 'La cantidad debe ser un número' })
    .int({ message: 'La cantidad debe ser un número entero' })
    .min(1, { message: 'La cantidad mínima es 1' }),
});

export const nuevoPagoSchema = z.object({
  medioPago: z.enum(IDS_MEDIOS_PAGO, { message: 'Elegí un medio de pago válido' }),
});

export const compraIdParams = z.object({ compraId: uuid });
