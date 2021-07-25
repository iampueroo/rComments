import { classedSelector, decodeHTML, getFirstParent, getParents } from "./DOM";

test("should decode HTML as expected", () => {
  const output = decodeHTML(
    '&lt;div class="md"&gt;&lt;p&gt;This just seems like an the onion article&lt;/p&gt;&lt;/div&gt;'
  );
  expect(output).toBe(
    '<div class="md"><p>This just seems like an the onion article</p></div>'
  );
});

test("should getFirstParent as expected", () => {
  const el = document.createElement("span");
  expect(getFirstParent(el)).toBe(false);
  const parent = document.createElement("div");
  parent.appendChild(el);
  expect(getFirstParent(el, "span")).toBe(false);
  expect(getFirstParent(el, "div")).toBe(parent);
  const grandparent = document.createElement("div");
  grandparent.classList.add("my-class");
  grandparent.appendChild(parent);
  expect(getFirstParent(el, ".my-class")).toBe(grandparent);
  expect(getFirstParent(el, ".does-not-exist-class")).toBe(false);
});

test("should implement getParents() as expected", () => {
  const el = document.createElement("span");
  expect(getParents(el)).toEqual([]);
  const parent = document.createElement("div");
  parent.appendChild(el);
  expect(getParents(el, "span")).toEqual([]);
  expect(getParents(el, "div")).toEqual([parent]);
  const grandparent = document.createElement("div");
  grandparent.appendChild(parent);
  expect(getParents(el, "div")).toEqual([parent, grandparent]);
});

test("classedSelector should work as expected", () => {
  expect(classedSelector("className")).toBe("._rcomments_className");
});
