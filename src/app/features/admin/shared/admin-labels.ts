/** Human labels + badge tones shared by every admin screen. */
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';

export const ORDER_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  pending_payment: { label: 'Pago pendiente', tone: 'warning' },
  payment_failed: { label: 'Pago fallido', tone: 'danger' },
  paid: { label: 'Pagado', tone: 'info' },
  processing: { label: 'En preparación', tone: 'info' },
  shipped: { label: 'Enviado', tone: 'success' },
  delivered: { label: 'Entregado', tone: 'success' },
  cancelled: { label: 'Cancelado', tone: 'danger' },
  refunded: { label: 'Reembolsado', tone: 'neutral' },
  partially_refunded: { label: 'Reembolso parcial', tone: 'neutral' },
};

/** Statuses an admin can set manually from the orders table. */
export const ORDER_STATUS_EDITABLE = [
  'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
];

export const PAYMENT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  succeeded: { label: 'Cobrado', tone: 'success' },
  processing: { label: 'Procesando', tone: 'info' },
  requires_payment_method: { label: 'Sin método / fallido', tone: 'warning' },
  requires_action: { label: 'Requiere acción', tone: 'warning' },
  requires_confirmation: { label: 'Sin confirmar', tone: 'warning' },
  canceled: { label: 'Cancelado', tone: 'danger' },
  pending: { label: 'Pendiente', tone: 'warning' },
  failed: { label: 'Fallido', tone: 'danger' },
};

export const SHIPMENT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  created: { label: 'Prerregistrado', tone: 'info' },
  in_transit: { label: 'En tránsito', tone: 'info' },
  delivered: { label: 'Entregado', tone: 'success' },
  returned: { label: 'Devuelto', tone: 'danger' },
  cancelled: { label: 'Anulado', tone: 'danger' },
  error: { label: 'Error', tone: 'danger' },
};

export const REVIEW_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  approved: { label: 'Aprobada', tone: 'success' },
  rejected: { label: 'Rechazada', tone: 'danger' },
};

export const POS_LEAD_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  new: { label: 'Nuevo', tone: 'warning' },
  contacted: { label: 'Contactado', tone: 'info' },
  sample_sent: { label: 'Muestra enviada', tone: 'info' },
  closed_won: { label: 'Ganado', tone: 'success' },
  closed_lost: { label: 'Perdido', tone: 'danger' },
};

export function statusInfo(map: Record<string, { label: string; tone: BadgeTone }>, key: string | null | undefined) {
  if (!key) return { label: '—', tone: 'neutral' as BadgeTone };
  return map[key] ?? { label: key, tone: 'neutral' as BadgeTone };
}

export const INVOICE_TYPE: Record<string, { label: string; tone: BadgeTone }> = {
  simplified: { label: 'Simplificada', tone: 'neutral' },
  full: { label: 'Completa (NIF)', tone: 'info' },
  corrective: { label: 'Rectificativa', tone: 'danger' },
};

export const INVOICE_PDF_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  stored: { label: 'Guardado', tone: 'success' },
  pending: { label: 'Pendiente', tone: 'warning' },
  failed: { label: 'Error', tone: 'danger' },
};
