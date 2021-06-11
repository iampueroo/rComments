import {
  authorTagHtml,
  generateCommentHtml,
  nextReplyPromptHtml,
  voteTagHtml,
} from "./html_generator";
import { UserContext } from "../UserContext";

test("comment html should be empty for no comment json", () => {
  const userContext = defaultUserContext();
  expect(generateCommentHtml(userContext)).toContain("Oops");
  expect(generateCommentHtml(userContext, {})).toContain("Oops");
});

test("should render comment HTML with like on old reddit styles", () => {
  const userContext = defaultUserContext();
  const commentJSON = {
    id: "IDENTIFIER",
    author: "iampueroo",
    stickied: false,
    body_html: "THIS IS MY HTML : <a href='/target'>Go to site</a>",
    ups: 100,
    downs: 50,
    score: 0,
    likes: 1, // We are testing for this too
    all_awardings: [],
    replies: [],
  };
  const listingData = {
    author: "Someone else",
  };
  const html = generateCommentHtml(userContext, commentJSON, listingData);
  expect(html).toContain("THIS IS MY HTML");
  expect(html).toContain("iampueroo");
  expect(html).toContain("_rcomments_arrows likes"); // Indicates it was liked
  expect(html).not.toContain(" submitter "); // Indicates not OP
  expect(html).not.toContain('<a target="_blank" '); // Indicates not to open in new tabs
});

test("should render unvoted comment HTML on old reddit styles", () => {
  const userContext = defaultUserContext();
  const commentJSON = {
    id: "IDENTIFIER",
    author: "iampueroo",
    stickied: false,
    body_html: "THIS IS MY HTML : <a href='/target'>Go to site</a>",
    ups: 100,
    downs: 50,
    score: 0,
    likes: 0,
    all_awardings: [],
    replies: [],
  };
  const listingData = {
    author: "Someone else",
  };
  const html = generateCommentHtml(userContext, commentJSON, listingData);
  expect(html).not.toContain("_rcomments_arrows dislikes");
  expect(html).not.toContain("_rcomments_arrows likes");
});

test("should render unliked comment HTML on old reddit styles", () => {
  const userContext = defaultUserContext();
  const commentJSON = {
    id: "IDENTIFIER",
    author: "iampueroo",
    stickied: false,
    body_html: "THIS IS MY HTML : <a href='/target'>Go to site</a>",
    ups: 100,
    downs: 50,
    score: 0,
    likes: -1,
    all_awardings: [],
    replies: [],
  };
  const listingData = {
    author: "Someone else",
  };
  const html = generateCommentHtml(userContext, commentJSON, listingData);
  expect(html).toContain("_rcomments_arrows dislikes"); // Indicates it was disliked
});

test("should not render arrows for new styles, even if logged in", () => {
  const userContext = defaultUserContext(true);
  const commentJSON = {
    id: "IDENTIFIER",
    author: "iampueroo",
    stickied: false,
    body_html: "THIS IS MY HTML",
    ups: 100,
    downs: 50,
    score: 0,
    likes: 1, // We are testing for this too
    all_awardings: [],
    replies: [],
  };
  const listingData = {
    author: "iampueroo", // Same as commenter
  };
  const html = generateCommentHtml(userContext, commentJSON, listingData);
  expect(html).not.toContain("_rcomments_arrows"); // Indicates it was liked
});

test("should render OP stylings", () => {
  const userContext = defaultUserContext();
  const commentJSON = {
    id: "IDENTIFIER",
    author: "iampueroo",
    stickied: false,
    body_html: "THIS IS MY HTML",
    ups: 100,
    downs: 50,
    score: 0,
    likes: 0,
    all_awardings: [],
    replies: [],
  };
  const listingData = {
    author: "iampueroo", // Same as commenter
  };
  const html = generateCommentHtml(userContext, commentJSON, listingData);
  expect(html).toContain(" submitter "); // Indicates OP
});

test("adds new tab target to anchor elements when desired", () => {
  const userContext = new UserContext("loggedin", false, false, true);
  const commentJSON = {
    id: "IDENTIFIER",
    author: "iampueroo",
    stickied: false,
    body_html: "<a href='/target.html'>Go here</a>",
    ups: 100,
    downs: 50,
    score: 0,
    likes: 0,
    all_awardings: [],
    replies: [],
  };
  const listingData = {
    author: "iampueroo", // Same as commenter
  };
  const html = generateCommentHtml(userContext, commentJSON, listingData);
  expect(html).toContain(
    "<a target=\"_blank\" href='/target.html'>Go here</a>"
  ); // Indicates OP
});

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

test("Vote tag renders succesfully", () => {
  const userContext = new UserContext("", false, false, false);
  const voteHtml = voteTagHtml(userContext, 201, 201);
  const expectedHTML =
    '<span><span class="score dislikes">200 points</span><span class="score unvoted">201 points</span><span class="score likes">202 points</span></span>';
  expect(voteHtml).toBe(expectedHTML);
});

test("should render old reddit styles awards", () => {
  const userContext = new UserContext("loggedin", false, false, true);
  const commentJSON = {
    id: "IDENTIFIER",
    author: "iampueroo",
    body_html: "<a href='/target.html'>Go here</a>",
    all_awardings: [
      {
        icon_url: "http://example.com",
      },
    ],
    replies: [],
  };
  const listingData = {
    author: "Someone else", // Same as commenter
  };
  const html = generateCommentHtml(userContext, commentJSON, listingData);
  // This test is to ensure that the example url is included
  expect(html).toContain(
    '<img alt="award" class="awarding-icon" src="http://example.com" style="max-width:16px" />'
  );
  // This test is to ensure the final count is hidden
  expect(html).toContain('<span class="_rcomments_awarding-count"></span>');
});

test("should render new reddit styles awards", () => {
  const userContext = new UserContext("loggedin", true, false, true);
  const commentJSON = {
    id: "IDENTIFIER",
    author: "iampueroo",
    body_html: "<a href='/target.html'>Go here</a>",
    all_awardings: [
      {
        resized_icons: [
          {
            url: "http://example.com",
          },
          {
            url: "http://do-not-use-this-one.com",
          },
        ],
        count: 40,
      },
    ],
    replies: [],
  };
  const listingData = {
    author: "Someone else", // Same as commenter
  };
  const html = generateCommentHtml(userContext, commentJSON, listingData);
  // This test is to ensure that the example url is included
  expect(html).toContain(
    '<img alt="award" class="awarding-icon" src="http://example.com" style="max-width:16px" />'
  );
  // This test is to ensure the final count is included
  expect(html).toContain('<span class="_rcomments_awarding-count">40</span>');
});

test("should render without error when no awardings passed in on new styles", () => {
  const userContext = new UserContext("loggedin", true, false, true);
  const commentJSON = {
    id: "IDENTIFIER",
    author: "iampueroo",
    body_html: "<a href='/target.html'>Go here</a>",
    replies: [],
  };
  const listingData = {
    author: "Someone else", // Same as commenter
  };
  const html = generateCommentHtml(userContext, commentJSON, listingData);
  // This test is to ensure that the example url is included
  expect(html).not.toContain("awarding-icon");
  commentJSON.all_awardings = [{}];
  expect(
    generateCommentHtml(userContext, commentJSON, listingData)
  ).not.toContain("awarding-icon");
});

function defaultUserContext(newStyle) {
  return new UserContext("loggedin", newStyle, false, false);
}
