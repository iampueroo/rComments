const map = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&grave;",
};
export default function sanitize(string) {
  const reg = /[&<>"'`/]/gi;
  return string.replace(reg, (match) => map[match]);
}
