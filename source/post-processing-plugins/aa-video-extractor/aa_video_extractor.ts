import {CommentData, ExtractedCommentData, Obj, RequestData, SuccessfulCommentResponseData} from "../../types/types";
import {isStickiedModeratorPost} from "../../html-generators/html_generator";
import {PostProcessingPlugin} from "../plugins";
import {getCommentData} from "../../data-fetchers/commentFetcher";
import {extractAllComments} from "../../data-fetchers/commentInspector";
import {decodeHTML} from "../../dom/DOM";

export default {
  doesApply(
      commentResponseData: SuccessfulCommentResponseData,
      requestData: RequestData
  ): boolean {
    const commentJson = commentResponseData.commentJson;
    return isStickiedModeratorPost(commentJson) && isSoccerAAPostWithReplies(commentJson);
  },

  async execute(
      commentResponseData: SuccessfulCommentResponseData,
      requestData: RequestData
  ): Promise<void> {
    // Get all params
    const params = this.model.commentStatus.getNNextCommentRequestParameters(
        5,
        commentResponseData.url,
        commentResponseData.commentId
    );
    const response = await getCommentData({
      url: commentResponseData.url,
      data: params,
      timeout: 4000
    });
    const comments = extractAllComments(response, params);
    /**
     *
     * HERE HERE HERE -> NEED TO GENERATE HTML AND ADD IT
     * NICELY AS A rCOMMENTS MESSAGE INSTEAD OF ANYTHING ELSE
     *
     */
    const html = generateTableHtml(comments);
    this.view.appendToComment(commentResponseData.commentId, html);
    /**
     *
     * HERE HERE HERE -> NEED TO GENERATE HTML AND ADD IT
     * NICELY AS A rCOMMENTS MESSAGE INSTEAD OF ANYTHING ELSE
     *
     */
    return;
  },
} as PostProcessingPlugin;

type PostMatcher = {
  author: string,
  subreddit : string,
  bodyMatch: RegExp,
  replies?: string|Obj[]
}

export function isSoccerAAPostWithReplies(json: CommentData) : boolean {
  const replies = json.replies;
  if (typeof replies === 'string' || !replies) {
    return;
  }
  const options: PostMatcher[] = [
    {
      subreddit: 'soccer',
      author: 'AutoModerator',
      bodyMatch: /alternate angles/,
    },
    {
      subreddit: 'nba',
      author: 'NBA_MOD',
      bodyMatch: /replay/,
    },
  ];
  for (let i = 0; i < options.length; i++) {
    const match = options[i];
    if (match.subreddit === json.subreddit && match.author === json.author && match.bodyMatch.test(json.body.toLowerCase())) {
      return true;
    }
  }
  return false;
}

type ExtractedLinkInfo = {
  linkBody: string,
  linkHtml: string,
  author: string,
  votes: number,
}

function generateTableHtml(comments: ExtractedCommentData[]) : string {
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
  ${comments.map((data) => convertCommentToHtml(data.json)).join('')}
</tbody>
  </table>
  </div>
 `;
}

function convertCommentToHtml(commentData: CommentData) : string {
  const linkInfo = extractLinkInfoFromComment(commentData);
  if (!linkInfo) {
    return '';
  }
  return `<tr>
<td>${linkInfo.linkBody}</td>
<td>${linkInfo.author}</td>
<td>${linkInfo.votes}</td>
</tr>`
}

function extractLinkInfoFromComment(commentData: CommentData) : ExtractedLinkInfo|null {
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
  const links : string[] = matches.map(m => {
    const div = document.createElement('div');
    div.innerHTML = m[0];
    const text = div.textContent;
    const url = m[1];
    if (!text || !url) {
      return '';
    }
    return `<a href="${url}" rel="noopener" target="_blank">${text}</a>`;
  }).filter(v => v !== '');
  return {
    author: commentData.author,
    votes: commentData.ups - commentData.downs, // TODO dedupe code,
    linkHtml: commentData.body_html,
    linkBody: decodeHTML(commentData.body_html),//generateHtmlFromLinks(links),
  }
}

function generateHtmlFromLinks(links: string[]) : string {
  if (links.length < 2) {
    return links.join('');
  }
  return `<ul>${links.map(l => `<li>${l}</li>`).join('')}</ul>`;
}
