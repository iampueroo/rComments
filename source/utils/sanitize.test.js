import sanitize from "./sanitize";

test("sanitize() properly espaces special chars", () => {
  const html = "<script>This is a script</script>";
  const escapedHtml = "&lt;script&gt;This is a script&lt;&#x2F;script&gt;";
  expect(sanitize(html)).toBe(escapedHtml);
});
