import { User } from '@shared/types';

export interface RouteOrder {
  id: number | string;
  merchantId?: number | string;
}

export const getOrderRoute = (order: RouteOrder, user: User | null) => {
  if (!user) return "/login";

  // check if user is the merchant owner
  const isMerchantOwner = user.id.toString() === order.merchantId?.toString();
  
  // admins can also see the merchant view for auditing
  const isPrivileged = user.role === 'admin' || user.is_staff;

  if (isMerchantOwner || isPrivileged) {
    return `/merchant/orders/${order.id}`;
  }

  return `/orders/${order.id}`;
};
