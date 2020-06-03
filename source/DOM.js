const R_COMMENTS_CLASS_PREFIX = '_rcomments_';

export function decodeHTML(html) {
	const txt = window.document.createElement('textarea');
	txt.innerHTML = html;
	return txt.value;
}

export function getFirstParent(el, selector) {
	if (!el.parentElement) {
		return false;
	} 
	if (el.parentElement.matches(selector)) {
		return el.parentElement;
	}
	return getFirstParent(el.parentElement, selector);
}

export function getParents(el, selector) {
	const parents = [];
	while (el.parentElement && el.parentElement.matches) {
		el = el.parentElement;
		if (el.matches(selector)) {
			parents.push(el);
		}
	}
	return parents;
}

export function classed(classes) {
	return R_COMMENTS_CLASS_PREFIX + classes;
}
