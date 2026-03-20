import { useNotifications } from "@/hooks/use-notifications";

/**
 * Component that initializes push notifications.
 * Must be rendered inside AppProvider (needs useApp context).
 */
export function NotificationInitializer() {
  useNotifications();
  return null;
}
