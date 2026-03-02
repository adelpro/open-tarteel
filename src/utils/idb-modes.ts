/**
 * IndexedDB transaction modes
 * Safe replacement for IDBTransactionMode type
 */

export const IDB_MODES = {
  READONLY: 'readonly',
  READWRITE: 'readwrite',
  VERSIONCHANGE: 'versionchange',
} as const;
