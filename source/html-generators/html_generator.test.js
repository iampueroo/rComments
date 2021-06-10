import {
  authorTagHtml,
  nextReplyPromptHtml,
  voteTagHtml,
} from "./html_generator";
import {UserContext} from "../UserContext";

test("author tag renders succesfully for admin and OP", () => {
  const author = "iampueroo";
  const isOp = true;
  const isAdmin = true;
  const html =
    '<a class="author submitter admin _rcomments_author" href="/user/iampueroo">iampueroo</a>';
  expect(authorTagHtml(author, isOp, isAdmin)).toBe(html);
});

test("author tag renders sucessfully", () => {
  const author = "iampueroo";
  const isOp = false;
  const isAdmin = false;
  // double space whatever
  const html =
    '<a class="author   _rcomments_author" href="/user/iampueroo">iampueroo</a>';
  expect(authorTagHtml(author, isOp, isAdmin)).toBe(html);
});

test("next reply rendered succesfully when no replies are left", () => {
  const html =
    '<div class="_rcomments_no_reply" style="padding-top:5px">No Replies</div>';
  expect(nextReplyPromptHtml(false)).toBe(html);
});

test("next reply rendered succesfully when no replies are left", () => {
  const html =
    '<div class="_rcomments_next_reply" style="padding-top:5px">&#8618 Next Reply</div>';
  expect(nextReplyPromptHtml(true)).toBe(html);
});

/**
 * @jest-
 */
test("Vote tag renders succesfully", () => {
  const userContext = new UserContext('', false, false, false);
  const voteHtml = voteTagHtml(userContext, 201, 201);
  const expectedHTML =
    '<span><span class="score dislikes">200 points</span><span class="score unvoted">201 points</span><span class="score likes">202 points</span></span>';
  expect(voteHtml).toBe(expectedHTML);
});
