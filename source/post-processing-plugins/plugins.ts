import stickied_automod_comment from "./stickied_automod_comment";
import { RequestData, SuccessfulCommentResponseData } from "../types/types";

export interface PostProcessingPlugin {
  doesApply(
    commentResponseData: SuccessfulCommentResponseData,
    requestData: RequestData
  ): boolean;

  execute(
    commentResponseData: SuccessfulCommentResponseData,
    requestData: RequestData
  ): void;
}

export default [stickied_automod_comment] as PostProcessingPlugin[];
