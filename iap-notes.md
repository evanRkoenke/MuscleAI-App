# expo-iap Integration Notes

## Package: expo-iap v3.4
- npm install expo-iap
- Uses StoreKit 2 on iOS (requires iOS 15+)
- Uses Google Play Billing v5+ on Android
- Requires custom dev client (NOT Expo Go)

## Key API: useIAP hook
```tsx
import { useIAP } from 'expo-iap';

const {
  connected,
  products,
  fetchProducts,
  requestPurchase,
  finishTransaction,
} = useIAP({
  onPurchaseSuccess: async (purchase) => {
    // Verify receipt on backend
    const isValid = await verifyReceiptOnServer(purchase);
    if (isValid) {
      await finishTransaction({ purchase, isConsumable: false }); // false for subscriptions
    }
  },
  onPurchaseError: (error) => {
    console.error('Purchase failed:', error);
  },
});
```

## Product IDs (to be configured in App Store Connect)
- com.muscleai.essential.monthly ($9.99/mo)
- com.muscleai.pro.monthly ($19.99/mo)
- com.muscleai.elite.annual ($79.99/yr)

## Purchase Flow
1. initConnection (automatic via useIAP)
2. fetchProducts({ skus: productIds, type: 'subs' })
3. requestPurchase({ request: { apple: { sku: productId } } })
4. onPurchaseSuccess → verify on server → finishTransaction
5. Update subscription status in app

## Platform-specific request (v2.7.0+)
```tsx
await requestPurchase({
  request: {
    apple: { sku: productId },
    google: { skus: [productId] },
  },
});
```

## Web Fallback
expo-iap does NOT work on web. Need Stripe links as fallback for web preview.
Use Platform.OS check to determine which flow to use.
