import _request from "./Request";

export class UserContext {
  static singleton: UserContext | undefined;

  modhash: string;
  _prefersNightmode: boolean;
  _prefersNewTab: boolean;
  _usesNewStyles: boolean;

  static get(): UserContext {
    this.init();
    return this.singleton;
  }

  static init(): void {
    if (this.singleton) {
      return;
    }
    this.singleton = new UserContext(
      "",
      isNewStyle(),
      extractNightModeFromStyles(),
      prefersOpenLinksInNewTab()
    );
    getData().then((response) => {
      const modhash = response?.data?.modhash;
      if (modhash) {
        this.singleton.modhash = modhash;
        const dataPrefersNightMode = response.data.pref_nightmode || false;
        this.singleton._prefersNightmode =
          dataPrefersNightMode || this.singleton._prefersNightmode;
      }
    });
  }

  constructor(
    modhash: string,
    usesNewStyles: boolean,
    prefersNightMode: boolean,
    prefersNewTabs: boolean
  ) {
    this.modhash = modhash;
    this._usesNewStyles = usesNewStyles;
    this._prefersNewTab = prefersNewTabs;
    this._prefersNightmode = prefersNightMode;
  }

  isLoggedIn(): boolean {
    return this.modhash !== "";
  }

  isNightMode(): boolean {
    return this._prefersNightmode;
  }

  prefersNewTabs(): boolean {
    return this._prefersNewTab;
  }

  usesNewStyles(): boolean {
    return this._usesNewStyles;
  }
}

async function getData() {
  return _request("/api/me.json");
}

function prefersOpenLinksInNewTab(): boolean {
  // @ts-ignore
  if (window.config) {
    // @ts-ignore
    return /('|")new_window('|")\s?:\s?true/.test(window.config.innerHTM);
  }
  return false;
}

function extractNightModeFromStyles(): boolean {
  const body = document.querySelector("body");
  const bodyStyle = window.getComputedStyle(body);
  const colorValue = bodyStyle
    .getPropertyValue("--newCommunityTheme-body")
    .trim();
  if (!colorValue) {
    // Warn
    return false;
  }
  if (!colorValue.startsWith("#")) {
    // Warn
    return false;
  }
  return isDark(colorValue);
}

function isDark(color): boolean {
  // Variables for red, green, blue values
  let r, g, b, hsp;

  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {
    // If RGB --> store the red, green, blue values in separate variables
    color = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    );
    r = color[1];
    g = color[2];
    b = color[3];
  } else {
    // If hex --> Convert it to RGB: http://gist.github.com/983661
    color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&"));
    r = color >> 16;
    g = (color >> 8) & 255;
    b = color & 255;
  }
  // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
  hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  // > 127.5 is light, less than it is dark
  return hsp <= 127.5;
}

/**
 * Returns true/false if current page is the "new style"
 * @return {Boolean}
 */
export function isNewStyle(): boolean {
  if (window.origin.match(/new\.reddit\.com/)) {
    return true;
  }
  if (window.origin.match(/old\.reddit\.com/)) {
    return false;
  }
  if (document.querySelector(".redesign-beta-optin")) {
    return false;
  }
  // @ts-ignore
  if (typeof _pageHasNewRedditstyles === "undefined") {
    const header = document.querySelector("header");
    return header && header.getAttribute("data-redditstyle") === "true";
  }
  return false;
}
