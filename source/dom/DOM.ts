const R_COMMENTS_CLASS_PREFIX = "_rcomments_";

export function decodeHTML(html: string) : string {
  const txt = window.document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

/**
 * Returns the first parent element of el that satisfies given selector
 *
 * @param el
 * @param selector
 */
export function getFirstParent(el: HTMLElement, selector: string) : HTMLElement|boolean {
  if (!el.parentElement) {
    return false;
  }
  if (el.parentElement.matches(selector)) {
    return el.parentElement;
  }
  return getFirstParent(el.parentElement, selector);
}

export function getParents(el: HTMLElement, selector: string) : HTMLElement[] {
  const parents = [];
  while (el.parentElement && el.parentElement.matches) {
    el = el.parentElement;
    if (el.matches(selector)) {
      parents.push(el);
    }
  }
  return parents;
}

export function classed(classes: string) : string {
  return R_COMMENTS_CLASS_PREFIX + classes;
}
