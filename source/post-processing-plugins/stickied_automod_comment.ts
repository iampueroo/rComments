import { isStickiedModeratorPost } from "../html-generators/html_generator";
import { PostProcessingPlugin } from "./plugins";
import { RequestData, SuccessfulCommentResponseData } from "../types/types";

export default {
  doesApply(
    commentResponseData: SuccessfulCommentResponseData,
    requestData: RequestData
  ): boolean {
    const commentJson = commentResponseData.commentJson;
    const isLastReply = commentResponseData.isLastReply;
    return !isLastReply && isStickiedModeratorPost(commentJson);
  },

  async execute(
    commentResponseData: SuccessfulCommentResponseData,
    requestData: RequestData
  ): Promise<void> {
    const parentElement = this.view.getPopup();
    this.view.loading(parentElement);
    const params = this.model.commentStatus.getNextCommentRequestParameters(
      commentResponseData.url
    );
    const data = await this.executeCommentRequest(parentElement, null, {
      url: commentResponseData.url,
      data: params,
      timeout: 4000,
    });
    if (data.success) {
      this.showComment(data);
    }
  },
} as PostProcessingPlugin;
