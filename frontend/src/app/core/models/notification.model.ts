// notification.model.ts
export type NotificationType =
  'VISITOR_ARRIVED' | 'DELIVERY_OTP' | 'COMPLAINT_STATUS' |
  'MAINTENANCE_BILL' | 'MAINTENANCE_PAYMENT' | 'NOTICE_POSTED' |
  'POLL_OPENED' | 'POLL_CLOSED' | 'EVENT_VOTING_OPENED' |
  'HELPDESK_STATUS' | 'NOC_FULFILLED' | 'NOC_REJECTED' | 'GENERAL';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  deeplink: string;
  read: boolean;
  createdAt: string;
}

export const NOTIF_ICONS: Partial<Record<NotificationType, string>> = {
  VISITOR_ARRIVED:     'user',
  DELIVERY_OTP:        'package',
  COMPLAINT_STATUS:    'clipboard-list',
  MAINTENANCE_BILL:    'credit-card',
  MAINTENANCE_PAYMENT: 'check-circle',
  NOTICE_POSTED:       'megaphone',
  POLL_OPENED:         'vote',
  POLL_CLOSED:         'vote',
  EVENT_VOTING_OPENED: 'party-popper',
  HELPDESK_STATUS:     'hammer',
  NOC_FULFILLED:       'scroll',
  NOC_REJECTED:        'x-circle',
  GENERAL:             'bell',
};
