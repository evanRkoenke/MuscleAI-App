/**
 * Muscle AI — Global Welcome Modal Wrapper
 *
 * Mounted once in the root layout, this component listens to
 * the justSubscribedTier state from AppContext and shows the
 * WelcomeModal automatically after any successful subscription purchase.
 */

import { useApp } from "@/lib/app-context";
import { WelcomeModal } from "@/components/welcome-modal";

export function GlobalWelcome() {
  const { justSubscribedTier, dismissWelcomeModal } = useApp();

  if (!justSubscribedTier || justSubscribedTier === "none") {
    return null;
  }

  return (
    <WelcomeModal
      visible={!!justSubscribedTier}
      tier={justSubscribedTier as Exclude<typeof justSubscribedTier, "none">}
      onDismiss={dismissWelcomeModal}
    />
  );
}
