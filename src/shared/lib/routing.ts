export interface RouteContext {
  type: string;
  entityId?: string | number;
  meta?: Record<string, any>;
}

/**
 * Single source of truth for all URL generation across the app.
 * Used by notifications, email links, and any component needing event-based routing.
 *
 * Adding a new route = add one case here, nowhere else.
 */
export const getUrl = (context: RouteContext): string => {
  const { type, entityId: id, meta } = context;

  switch (type) {
    // ── Products ──────────────────────────────────────────────────
    case 'new_product':
      return meta?.slug ? `/products/${meta.slug}-${id}` : `/products/${id}`;

    // ── Orders (buyer) ────────────────────────────────────────────
    case 'order_status_update':
      return `/orders/${id}/status`;
    case 'payment_approved':
      return `/orders/${id}/confirmed`;
    case 'payment_rejected':
      return `/orders/${id}/payment?retry=true`;

    // ── Orders (merchant) ─────────────────────────────────────────
    case 'new_order':
      return `/merchant/orders/${id}`;
    case 'order_cancelled':
      return `/merchant/orders/${id}?status=cancelled`;
    case 'payment_submitted':
      return `/merchant/orders/${id}/payment`;

    // ── Chat ──────────────────────────────────────────────────────
    case 'new_message':
      return `/chat/${id}`;

    // ── Reviews ───────────────────────────────────────────────────
    case 'new_review':
    case 'review_reply':
      return `/products/${id}#reviews`;

    // ── Appeals ───────────────────────────────────────────────────
    case 'appeal_submitted':
      return `/admin/appeals`;
    case 'appeal_decision':
      return `/appeals/${id}`;

    // ── Visibility / Suspension ───────────────────────────────────
    case 'product_visibility_change':
      return `/appeals/new?type=product&id=${id}`;

    // ── Social ────────────────────────────────────────────────────
    case 'follow':
      return `/store/${id}`;

    // ── Admin ─────────────────────────────────────────────────────
    case 'new_product_review':
      return `/admin/products/review`;
    case 'new_user_registered':
      return `/admin/users`;

    default:
      return '#';
  }
};
