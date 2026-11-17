import { defineMessages } from 'react-intl';

/**
 * The account strings, English as the default. Arabic, English and German live
 * in `src/locales` under the same `account.*` ids.
 */
export const messages = defineMessages({
  title: {
    id: 'account.title',
    defaultMessage: 'Account',
  },
  description: {
    id: 'account.description',
    defaultMessage:
      'Optional. Link your devices into a ring and your favourites and settings follow you between them.',
  },
  ringOf: {
    id: 'account.ringOf',
    defaultMessage: 'Your ring:',
  },
  deviceCount: {
    id: 'account.deviceCount',
    defaultMessage: '{count, plural, one {# device} other {# devices}}',
  },
  devices: {
    id: 'account.devices',
    defaultMessage: 'Devices',
  },
  addDevice: {
    id: 'account.addDevice',
    defaultMessage: 'Add device',
  },
  createTitle: {
    id: 'account.createTitle',
    defaultMessage: 'New ring',
  },
  createAction: {
    id: 'account.createAction',
    defaultMessage: 'Create ring',
  },
  ringName: {
    id: 'account.ringName',
    defaultMessage: 'Ring name',
  },
  rename: {
    id: 'account.rename',
    defaultMessage: 'Rename the ring',
  },
  renameSave: {
    id: 'account.renameSave',
    defaultMessage: 'Save',
  },
  renameCancel: {
    id: 'account.renameCancel',
    defaultMessage: 'Cancel',
  },
  createNote: {
    id: 'account.createNote',
    defaultMessage:
      'A ring is a key generated here and kept in this browser — no username, no password. Add another device now if you want the ring and its favourites to outlive this one.',
  },
  privacyNote: {
    id: 'account.privacyNote',
    defaultMessage:
      'What a ring syncs — favourites, settings and device names — is kept on a public sync relay. It is signed, so only your devices can change it, but it is not encrypted: anyone who knows the ring’s public key can read it.',
  },
  joinTitle: {
    id: 'account.joinTitle',
    defaultMessage: 'Join a ring',
  },
  joinNote: {
    id: 'account.joinNote',
    defaultMessage:
      'Scan a code from a device already in the ring, and this device copies the key.',
  },
  manualToggle: {
    id: 'account.manualToggle',
    defaultMessage: 'Enter the code by hand',
  },
  manualNote: {
    id: 'account.manualNote',
    defaultMessage:
      'For devices without a camera: copy the code from the other device and paste it here.',
  },
  manualPlaceholder: {
    id: 'account.manualPlaceholder',
    defaultMessage: 'Paste the code here',
  },
  manualAction: {
    id: 'account.manualAction',
    defaultMessage: 'Link',
  },
  manualInvalid: {
    id: 'account.manualInvalid',
    defaultMessage: 'That code is not valid, or it has expired',
  },
  shareTitle: {
    id: 'account.shareTitle',
    defaultMessage: 'Add a device to the ring',
  },
  shareNote: {
    id: 'account.shareNote',
    defaultMessage:
      'The code carries a one-time key, not the ring key. It expires in two minutes and is burned as soon as a device reads it.',
  },
  shareWarning: {
    id: 'account.shareWarning',
    defaultMessage:
      'For those two minutes the code is your ring: anyone who scans or copies it joins with full access. Show it only to your own devices.',
  },
  showCode: {
    id: 'account.showCode',
    defaultMessage: 'Show pairing code',
  },
  newCode: {
    id: 'account.newCode',
    defaultMessage: 'Generate a new code',
  },
  copyCode: {
    id: 'account.copyCode',
    defaultMessage: 'Copy the code',
  },
  copied: {
    id: 'account.copied',
    defaultMessage: 'Copied',
  },
  copyFailed: {
    id: 'account.copyFailed',
    defaultMessage: 'Could not copy',
  },
  expiresIn: {
    id: 'account.expiresIn',
    defaultMessage: 'expires in {seconds}s',
  },
  scanTitle: {
    id: 'account.scanTitle',
    defaultMessage: 'Scan a code',
  },
  scanHint: {
    id: 'account.scanHint',
    defaultMessage: 'Point the camera at the pairing code',
  },
  scanStart: {
    id: 'account.scanStart',
    defaultMessage: 'Scan with camera',
  },
  scanStop: {
    id: 'account.scanStop',
    defaultMessage: 'Stop camera',
  },
  linkedHere: {
    id: 'account.linkedHere',
    defaultMessage: 'This device is now in the ring',
  },
  linkedOther: {
    id: 'account.linkedOther',
    defaultMessage: 'A new device was added to the ring',
  },
  linkedOtherNamed: {
    id: 'account.linkedOtherNamed',
    defaultMessage: '“{name}” was added to the ring',
  },
  linkedHint: {
    id: 'account.linkedHint',
    defaultMessage:
      'The ring’s devices are listed below, and favourites and settings now sync on their own.',
  },
  scanJoining: {
    id: 'account.scanJoining',
    defaultMessage: 'Linking this device…',
  },
  scanAgain: {
    id: 'account.scanAgain',
    defaultMessage: 'Scan again',
  },
  codeTimeout: {
    id: 'account.codeTimeout',
    defaultMessage:
      'The pairing code did not arrive. Check your connection and try again.',
  },
  cameraUnavailable: {
    id: 'account.cameraUnavailable',
    defaultMessage: 'Camera unavailable',
  },
  cameraBlockedTitle: {
    id: 'account.cameraBlockedTitle',
    defaultMessage: 'The browser is blocking the camera',
  },
  cameraBlockedNote: {
    id: 'account.cameraBlockedNote',
    defaultMessage:
      'Allow the camera for this site in the browser settings, then try again.',
  },
  cameraNoDeviceTitle: {
    id: 'account.cameraNoDeviceTitle',
    defaultMessage: 'This device has no camera',
  },
  cameraNoDeviceNote: {
    id: 'account.cameraNoDeviceNote',
    defaultMessage:
      'Copy the code from the other device and paste it here; the result is the same.',
  },
  cameraBusyTitle: {
    id: 'account.cameraBusyTitle',
    defaultMessage: 'The camera is in use',
  },
  cameraBusyNote: {
    id: 'account.cameraBusyNote',
    defaultMessage:
      'Another app is using it. Close that app and try again, or paste the code instead.',
  },
  cameraSecureTitle: {
    id: 'account.cameraSecureTitle',
    defaultMessage: 'Scanning needs a secure connection',
  },
  cameraSecureNote: {
    id: 'account.cameraSecureNote',
    defaultMessage:
      'The camera only works over https or localhost. Paste the code instead.',
  },
  cameraRetry: {
    id: 'account.cameraRetry',
    defaultMessage: 'Try again',
  },
  scanOpening: {
    id: 'account.scanOpening',
    defaultMessage: 'Opening the camera…',
  },
  scanBack: {
    id: 'account.scanBack',
    defaultMessage: 'Back',
  },
  codeFailed: {
    id: 'account.codeFailed',
    defaultMessage: 'Could not create a pairing code',
  },
  devicesNote: {
    id: 'account.devicesNote',
    defaultMessage:
      'Every device in this ring holds the same key. Signing one out only affects that device; it does not revoke the key.',
  },
  noDevices: {
    id: 'account.noDevices',
    defaultMessage: 'No devices recorded yet.',
  },
  thisDevice: {
    id: 'account.thisDevice',
    defaultMessage: 'this device',
  },
  primary: {
    id: 'account.primary',
    defaultMessage: 'primary',
  },
  lastSeen: {
    id: 'account.lastSeen',
    defaultMessage: 'last seen {when}',
  },
  added: {
    id: 'account.added',
    defaultMessage: 'added {when}',
  },
  signOutTitle: {
    id: 'account.signOutTitle',
    defaultMessage: 'Sign out',
  },
  signOutSafe: {
    id: 'account.signOutSafe',
    defaultMessage:
      'Your other devices stay signed in. This browser forgets the key and will need a new pairing code.',
  },
  signOutLast: {
    id: 'account.signOutLast',
    defaultMessage:
      'This is the only device in the ring. Signing out here erases the key from this browser, and there is no password to bring it back — the ring and every favourite in it become unrecoverable. Add another device first, or keep this one.',
  },
  signOutConfirm: {
    id: 'account.signOutConfirm',
    defaultMessage: 'Type “{word}” to confirm',
  },
  signOutConfirmWord: {
    id: 'account.signOutConfirmWord',
    defaultMessage: 'sign out',
  },
  signOutAction: {
    id: 'account.signOutAction',
    defaultMessage: 'Sign out on this device',
  },
});
