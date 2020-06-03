import { _request } from './Request.js';

export async function get() {
	const response = await getData();
	const isLoggedIn = new Boolean(response && response.data && response.data.modhash);
	const modhash = isLoggedIn ? response.data.modhash : '';
	const prefersNightmode = isLoggedIn ? response.data.pref_nightmode : '';
	const preferNewTab = prefersOpenLinksInNewTab(); 
	return {
		isLoggedIn,
		modhash,
		prefersNightmode,
		preferNewTab,
	};
}

async function getData() {
	return _request('/api/me.json');
}


function prefersOpenLinksInNewTab() {
	if (window.config) {
		return /('|")new_window('|")\s?:\s?true/.test(window.config.innerHTM);
	}
	return false;
}
