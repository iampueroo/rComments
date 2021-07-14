import {
  CommentData,
  Obj,
  RequestData,
  SuccessfulCommentResponseData,
} from "../../types/types";
import { isStickiedModeratorPost } from "../../html-generators/html_generator";
import { PostProcessingPlugin } from "../plugins";
import { getCommentData } from "../../data-fetchers/commentFetcher";
import { extractAllComments } from "../../data-fetchers/commentInspector";
import { decodeHTML } from "../../dom/DOM";
import * as DOM from "../../dom/DOM";

export default {
  doesApply(
    commentResponseData: SuccessfulCommentResponseData,
    requestData: RequestData
  ): boolean {
    const commentJson = commentResponseData.commentJson;
    return (
      isStickiedModeratorPost(commentJson) &&
      isSoccerAAPostWithReplies(commentJson)
    );
  },

  async execute(
    commentResponseData: SuccessfulCommentResponseData,
    requestData: RequestData
  ): Promise<boolean> {
    // Get all params
    const params = this.model.commentStatus.getNNextCommentRequestParameters(
      5,
      commentResponseData.url,
      commentResponseData.commentId
    );
    const response = await getCommentData({
      url: commentResponseData.url,
      data: params,
      timeout: 4000,
    });
    const comments = extractAllComments(response, params);
    const links = comments
      .map((comment) => extractLinkInfoFromComment(comment.json))
      .filter((info) => info !== null);
    if (links.length === 0) {
      return false;
    }
    /**
     *
     * HERE HERE HERE -> NEED TO GENERATE HTML AND ADD IT
     * NICELY AS A rCOMMENTS MESSAGE INSTEAD OF ANYTHING ELSE
     *
     */
    const html = generateTableHtml(links);
    this.view.appendToComment(commentResponseData.commentId, html);
    /**
     *
     * HERE HERE HERE -> NEED TO GENERATE HTML AND ADD IT
     * NICELY AS A rCOMMENTS MESSAGE INSTEAD OF ANYTHING ELSE
     *
     */
    const commentDiv = this.view.getCommentDiv(commentResponseData.commentId);
    const actionsDiv = commentDiv.querySelector("._rcomments_comment_actions");
    let buttonSpan = actionsDiv.querySelector("._rcomments_aa_mirror");
    if (!buttonSpan) {
      buttonSpan = createActionSpanElement(links.length);
      actionsDiv.appendChild(buttonSpan);
    }
    return true;
  },
} as PostProcessingPlugin;

type PostMatcher = {
  author: string;
  subreddit: string;
  bodyMatch: RegExp;
  replies?: string | Obj[];
};

export function isSoccerAAPostWithReplies(json: CommentData): boolean {
  const replies = json.replies;
  if (typeof replies === "string" || !replies) {
    return;
  }
  const options: PostMatcher[] = [
    {
      subreddit: "soccer",
      author: "AutoModerator",
      bodyMatch: /alternate angles/,
    },
    {
      subreddit: "nba",
      author: "NBA_MOD",
      bodyMatch: /replay/,
    },
  ];
  for (let i = 0; i < options.length; i++) {
    const match = options[i];
    if (
      match.subreddit === json.subreddit &&
      match.author === json.author &&
      match.bodyMatch.test(json.body.toLowerCase())
    ) {
      return true;
    }
  }
  return false;
}

type ExtractedLinkInfo = {
  linkBody: string;
  linkHtml: string;
  author: string;
  votes: number;
};

function createActionSpanElement(count: number): HTMLElement {
  const actionClass = DOM.classed("comment_action");
  const action: HTMLSpanElement = document.createElement("span");
  action.classList.add(DOM.classed("aa_mirror"), actionClass);
  action.innerText = `AA/Mirrors (${count})`;
  return action;
}

function generateTableHtml(links: ExtractedLinkInfo[]): string {
  return `
  <div class="_rcomments_extracted_links _rcomments_body_html _rcomments_hidden">
  <table width="100%">
  <thead>
  <tr>
  <th>Comment</th>
  <th>Author</th>
  <th>Votes</th>
</tr>
</thead>
  <tbody>
  ${links.map(convertCommentToHtml).join("")}
</tbody>
  </table>
  </div>
 `;
}

function convertCommentToHtml(linkInfo: ExtractedLinkInfo): string {
  return `<tr>
<td>${linkInfo.linkBody}</td>
<td>${linkInfo.author}</td>
<td>${linkInfo.votes}</td>
</tr>`;
}

function extractLinkInfoFromComment(
  commentData: CommentData
): ExtractedLinkInfo | null {
  const regex = /<a href=(?:"|')(.*?)(?:"|').*>(.*)<\/a>/gm;
  const matches = [];
  const commentHtml = decodeHTML(commentData.body_html);
  let match = regex.exec(commentHtml);
  while (match) {
    matches.push(match);
    match = regex.exec(commentHtml);
  }
  if (matches.length === 0) {
    return null;
  }
  return {
    author: commentData.author,
    votes: commentData.ups - commentData.downs, // TODO dedupe code,
    linkHtml: commentData.body_html,
    linkBody: decodeHTML(commentData.body_html), //generateHtmlFromLinks(links),
  };
}

function generateHtmlFromLinks(links: string[]): string {
  if (links.length < 2) {
    return links.join("");
  }
  return `<ul>${links.map((l) => `<li>${l}</li>`).join("")}</ul>`;
}
