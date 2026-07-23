# MoodMap AI — App Store Setup

## Apple Team ID
1. Go to https://developer.apple.com/account → Membership Details
2. Copy your 10-character Team ID (e.g. A1B2C3D4E5)
3. Replace `REPLACE_WITH_YOUR_TEAM_ID` in `app.json` → `expo.ios.appleTeamId`
4. Also run: `eas credentials` to provision certificates and provisioning profiles

## iOS Build
```
eas build --platform ios --profile production
```
EAS will automatically create/manage your distribution certificate and provisioning profile via `credentialsSource: remote`.

## Android Build
```
eas build --platform android --profile production
```

## Submit to Stores
```
eas submit --platform ios
eas submit --platform android
```
