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
import { decodeHTML, getFirstParent } from "../../dom/DOM";
import * as DOM from "../../dom/DOM";

export default {
  doesApply(
    commentResponseData: SuccessfulCommentResponseData,
    requestData: RequestData
  ): boolean {
    const commentJson = commentResponseData.commentJson;
    return (
      isStickiedModeratorPost(commentJson) &&
      shouldAttemptVideoExtraction(commentJson)
    );
  },

  async execute(
    commentResponseData: SuccessfulCommentResponseData,
    requestData: RequestData
  ): Promise<boolean> {
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
    const html = generateTableHtml(links);
    this.view.appendToComment(commentResponseData.commentId, html);
    const commentDiv = this.view.getCommentDiv(commentResponseData.commentId);
    const actionsDiv = commentDiv.querySelector(
      DOM.classedSelector("comment_actions")
    );
    let buttonSpan = actionsDiv.querySelector(DOM.classedSelector("aa_mirror"));
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

export function shouldAttemptVideoExtraction(json: CommentData): boolean {
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

export function isAALinksTogglerElement(element: HTMLElement | null): boolean {
  if (!element) {
    return false;
  }
  return (
    element.classList && element.classList.contains(DOM.classed("aa_mirror"))
  );
}

export function handleAAExtractorClick(event): void {
  event.stopImmediatePropagation();
  const parentEntryDiv = getWrapperElement(event.target);
  const links = parentEntryDiv.querySelector("._rcomments_extracted_links");
  if (!links) {
    // No links were created, this shouldn't be clicked
    return;
  }
  links.classList.toggle("_rcomments_hidden");
  event.target.remove();
}

function getWrapperElement(element: HTMLElement): HTMLElement | null {
  const parent = getFirstParent(element, `.${DOM.classed("entry")}`);
  return parent || null;
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
  <div class="_rcomments_extracted_links _rcomments_body_html _rcomments_hidden md">
  <p class="_rcomments_extracted_links_msg">ⓘ Links extracted from first-level replies</p>
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
    linkBody: decodeHTML(commentData.body_html),
  };
}
