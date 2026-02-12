import { captureFrontendMessage } from './observability';

type ProductEventName =
  | 'app_opened'
  | 'login_profile_selected'
  | 'login_success'
  | 'maps_viewed'
  | 'map_created'
  | 'map_create_failed'
  | 'map_deleted'
  | 'map_duplicated'
  | 'map_opened';

type ProductEventPayload = Record<string, unknown>;

const enabled = import.meta.env.PROD || import.meta.env.VITE_PRODUCT_METRICS_ENABLED === 'true';

export function trackProductEvent(name: ProductEventName, payload: ProductEventPayload = {}): void {
  if (!enabled) return;

  captureFrontendMessage('info', `product_event:${name}`, {
    eventName: name,
    ...payload,
    ts: new Date().toISOString(),
  });
}
