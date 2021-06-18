export function getListingUrlPathElement(
  el: HTMLAnchorElement | HTMLElement
): string | null {
  if (!("href" in el) || typeof el.href !== "string" || !el.href) {
    // If there is no href property, or the href property is not a string or empty
    // return null early
    return null;
  }
  const url = new URL(el.href);
  const path = decodeURIComponent(url.pathname);
  return path && path !== "/" ? path : null;
}
