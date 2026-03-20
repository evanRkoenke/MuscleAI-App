import { useNotifications } from "@/hooks/use-notifications";

/**
 * Invisible component that initializes the notification system.
 * Must be rendered inside AppProvider (needs useApp context).
 */
export function NotificationInitializer() {
  useNotifications();
  return null;
}
