import { _request } from './Request.js';

export async function get() {
	const response = await getData();
	const isLoggedIn = Boolean(response && response.data && response.data.modhash);
	const modhash = isLoggedIn ? response.data.modhash : '';
	const prefersNightmode = isLoggedIn ? response.data.pref_nightmode : extractNightModeFromStyles();
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

function extractNightModeFromStyles() {
	const body = document.querySelector('body');
	const bodyStyle = window.getComputedStyle(body);
	const colorValue = bodyStyle.getPropertyValue('--newCommunityTheme-body').trim();
	if (!colorValue) {
		// Warn
		return false;
	}
	if (!colorValue.startsWith('#')) {
		// Warn
		return false;
	}
	return isDark(colorValue); 
}

function isDark(color) {

    // Variables for red, green, blue values
    let r, g, b, hsp;
    
    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {
        // If RGB --> store the red, green, blue values in separate variables
        color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
        r = color[1];
        g = color[2];
        b = color[3];
    } else {
        // If hex --> Convert it to RGB: http://gist.github.com/983661
        color = +("0x" + color.slice(1).replace( 
        color.length < 5 && /./g, '$&$&'));
        r = color >> 16;
        g = color >> 8 & 255;
        b = color & 255;
    }
    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(
	    0.299 * (r * r) +
	    0.587 * (g * g) +
	    0.114 * (b * b)
    );
    // > 127.5 is light, less than it is dark
    return hsp <= 127.5;
}