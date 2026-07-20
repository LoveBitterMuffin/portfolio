/**
 * Determines whether the current device is considered low-end.
 *
 * Checks:
 * – Mobile user-agent (phones / tablets)
 * – Less than 4 GB of device memory (Navigator.deviceMemory API)
 * – Slow or data-saver network connection (Navigator.connection API)
 *
 * @returns `true` when the device should receive a reduced-quality experience.
 */
export function detectLowEndDevice(): boolean {
  // Mobile device
  if (/Mobi|Android/i.test(navigator.userAgent)) return true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any;

  // Limited RAM (< 4 GB)
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return true;

  // Slow or data-saver network
  if (nav.connection) {
    const conn = nav.connection;
    if (conn.effectiveType === '2g' || conn.saveData) return true;
  }

  return false;
}
