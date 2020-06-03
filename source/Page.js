/**
 * Returns true/false if current page is the "new style" 
 * @return {Boolean} 
 */
export function isNewStyle() {
	if (window.origin.match(/new\.reddit\.com/)) {
		return true;
	}
	if (window.origin.match(/old\.reddit\.com/)) {
		return false;
	}
	if (document.querySelector('.redesign-beta-optin')) {
		return false;
	}
	if (typeof _pageHasNewRedditstyles === 'undefined') {
		const header = document.querySelector('header');
		return header && header.getAttribute('data-redditstyle') === 'true';
	}
	return false;
}