import {CommentData, ExtractedCommentData, RequestData, SuccessfulCommentResponseData} from "../../types/types";
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
    this.view.show(this.view.getPopup(), html);
    /**
     *
     * HERE HERE HERE -> NEED TO GENERATE HTML AND ADD IT
     * NICELY AS A rCOMMENTS MESSAGE INSTEAD OF ANYTHING ELSE
     *
     */
    return;
  },
} as PostProcessingPlugin;

function isSoccerAAPostWithReplies(json: CommentData) : boolean {
  if (json.subreddit !== 'soccer' || json.author !== 'AutoModerator' || !json.body.includes('Alternate Angles')) {
    return false;
  }
  const replies = json.replies;
  return typeof replies !== 'string';
}

type ExtractedLinkInfo = {
  linkBody: string,
  linkHtml: string,
  author: string,
  votes: number,
}

function generateTableHtml(comments: ExtractedCommentData[]) : string {
 return `
  <div class="_rcomments_body_html">
  <table>
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
  const regex = /<a href=(?:"|')(.*)(?:"|').*>(.*)<\/a>/gm;
  const matches = [];
  const commentHtml = decodeHTML(commentData.body_html);
  let match = regex.exec(commentHtml);
  while(match) {
    matches.push(match);
    match = regex.exec(commentHtml);
  }
  const fakeHtml = matches.map(m => {
    const div = document.createElement('div');
    div.innerHTML = m[0];
   return `<a href="${m[1]}">${div.textContent}</a>`;
  }).join('');
  return {
    author: commentData.author,
    votes: commentData.ups - commentData.downs, // TODO dedupe code,
    linkHtml: commentData.body_html,
    linkBody: fakeHtml,
  }
}
