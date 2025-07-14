export const isValidMagnetUri = (magnetUri: string | undefined): boolean => {
  if (!magnetUri) return false;

  const patern =
    '^magnet:\?(?=.*xt=urn:btih:([A-Fa-f0-9]{40}|[A-Z2-7]{32}))(?=.*dn=[^&]+)(?=.*tr=[^&]+).*$';

  const isValid = magnetUri.match(patern) !== null;
  return isValid;
};
