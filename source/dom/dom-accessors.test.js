import { getListingUrlPathElement } from "./dom-accessors";

test("listing path extracted correctly when href is full URL", () => {
  const a = document.createElement("a");
  a.href =
    "https://old.reddit.com/r/videos/comments/o2ow6o/whoopi_goldberg_says_she_was_stoned_when_she_won/";
  const test = getListingUrlPathElement(a);
  expect(test).toBe(
    "/r/videos/comments/o2ow6o/whoopi_goldberg_says_she_was_stoned_when_she_won/"
  );
});

test("listing path extracted correctly when href path", () => {
  const a = document.createElement("a");
  a.href =
    "/r/videos/comments/o2ow6o/whoopi_goldberg_says_she_was_stoned_when_she_won/";
  const test = getListingUrlPathElement(a);
  // Surprise, surprise turns out href has logic and it always returns full url!
  expect(test).toBe(
    "/r/videos/comments/o2ow6o/whoopi_goldberg_says_she_was_stoned_when_she_won/"
  );
});

test("listing path extract correctly when path is escaped", () => {
  const a = document.createElement("a");
  const escaped =
    "/r/soccer/comments/o2sahp/o_pa%C3%ADs_reinildo_mandava_lille_escapes_attack_in/";
  const unescaped =
    "/r/soccer/comments/o2sahp/o_país_reinildo_mandava_lille_escapes_attack_in/";
  a.href = escaped;
  expect(getListingUrlPathElement(a)).toBe(unescaped);
  a.href = unescaped;
  expect(getListingUrlPathElement(a)).toBe(unescaped);
});

test("listing path extracted correctly when search exists", () => {
  const a = document.createElement("a");
  a.href =
    "/r/videos/comments/o2ow6o/whoopi_goldberg_says_she_was_stoned_when_she_won/?some-search-value";
  a.search = "some-search-value";
  const test = getListingUrlPathElement(a);
  expect(test).toBe(
    "/r/videos/comments/o2ow6o/whoopi_goldberg_says_she_was_stoned_when_she_won/"
  );
});

test("no listing url is returned when element does not have href", () => {
  const div = document.createElement("div");
  expect(getListingUrlPathElement(div)).toBeNull();
  const a = document.createElement("a");
  expect(getListingUrlPathElement(a)).toBeNull();
  a.href = "";
  expect(getListingUrlPathElement(a)).toBeNull();
});
