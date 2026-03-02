export function createRiwayaMessageIdMap<TEnum extends Record<string, string>>(
  enumObject: TEnum,
  prefix: string
): Map<TEnum[keyof TEnum], `${typeof prefix}.${string}`> {
  const map = new Map();

  for (const key of Object.keys(enumObject)) {
    const value = enumObject[key as keyof TEnum];
    if (!value) continue;

    map.set(value, `${prefix}.${key}`);
  }

  return map;
}
