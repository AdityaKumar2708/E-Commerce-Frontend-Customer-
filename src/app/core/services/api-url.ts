/** Keep the mobile devices on the same Mac/LAN host serving the storefront. */
export function apiBaseUrl(): string {
  const hostname = typeof window === 'undefined' ? 'localhost' : window.location.hostname;
  return `http://${hostname}:8080`;
}
