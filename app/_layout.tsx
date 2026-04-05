import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as IAP from "expo-iap"; // Basic Apple/Google pay check

export default function RootLayout() {
  const [hasPaid, setHasPaid] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Check if the user has an active subscription on launch
    const checkSubscription = async () => {
      // Logic to check with Apple/Google if user is 'Pro'
      const active = false; // Replace with real IAP check
      setHasPaid(active);
    };
    checkSubscription();
  }, []);

  useEffect(() => {
    const isInsideApp = segments[0] === "(tabs)";
    
    // Redirect logic: If not paid and trying to enter the app, go to Paywall
    if (!hasPaid && isInsideApp) {
      router.replace("/paywall");
    }
  }, [hasPaid, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
