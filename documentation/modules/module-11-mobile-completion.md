# Module 11 — Mobile completion

Implemented one Expo SDK 54 application with customer and vendor navigation, secure session storage, push-token registration, universal/app links, deep routes, camera/gallery portfolio selection, optional location, offline city/saved-state foundations, upload progress/retry, Expo Updates, and EAS build profiles.

## Privacy and permissions

- Tokens use Expo SecureStore; AsyncStorage is limited to non-secret preferences and offline data.
- Manual city selection works without location access.
- Location, camera, and notifications are requested only after an explicit user action with an explanation.
- Transactional notification preferences are separate from marketing consent.
- Private enquiry deep links load no data until authentication and object-level authorization succeed.

## Build readiness

- Android package: `in.wedconnect.app`
- iOS bundle identifier: `in.wedconnect.app`
- Development, preview, and production EAS profiles are defined.
- Store signing credentials, EAS project ID, FCM/APNs credentials, privacy URLs, screenshots, and final store copy remain deployment-owner tasks.
- Universal/App Links require publishing valid `apple-app-site-association` and `assetlinks.json` files for `wedconnect.in` before production release.
