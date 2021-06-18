import {CommentData, ExtractedCommentData, RequestData, SuccessfulCommentResponseData} from "../../types/types";
import {isStickiedModeratorPost} from "../../html-generators/html_generator";
import {PostProcessingPlugin} from "../plugins";
import {getCommentData} from "../../data-fetchers/commentFetcher";
import {extractAllComments} from "../../data-fetchers/commentInspector";

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
    this.view.show(commentResponseData.el, html);
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
  linkHtml: string,
  author: string,
  votes: number,
}

function generateTableHtml(comments: ExtractedCommentData[]) : string {
 return `
  <table>
  <thead>
  <tr>
  <th>Comment</th>
  <th>Author</th>
  <th>Votes</th>
</tr>
</thead>
  <tbody>
  ${comments.map((data) => convertCommentToHtml(data.json))}
</tbody>
  </table>
 `;
}

function convertCommentToHtml(commentData: CommentData) : string {
  const linkInfo = extractLinkInfoFromComment(commentData);
  if (!linkInfo) {
    return '';
  }
  return `<tr>
<td>${linkInfo.linkHtml}</td>
<td>${linkInfo.author}</td>
<td>${linkInfo.votes}</td>
</tr>`
}

function extractLinkInfoFromComment(commentData: CommentData) : ExtractedLinkInfo|null {
  return {
    author: commentData.author,
    votes: commentData.ups - commentData.downs, // TODO dedupe code,
    linkHtml: "<a href=\"https://streamable.com/g4t1bc\" class=\"_3t5uN8xUmg0TOwRCOGQEcU\" rel=\"noopener nofollow ugc\" target=\"_blank\">Streamable mirror</a>"
  }
}
