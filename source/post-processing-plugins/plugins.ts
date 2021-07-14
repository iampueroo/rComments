import stickied_automod_comment from "./stickied_automod_comment";
import { RequestData, SuccessfulCommentResponseData } from "../types/types";
import aa_video_extractor from "./aa-video-extractor/aa_video_extractor";

export interface PostProcessingPlugin {
  doesApply(
    commentResponseData: SuccessfulCommentResponseData,
    requestData: RequestData
  ): boolean;

  execute(
    commentResponseData: SuccessfulCommentResponseData,
    requestData: RequestData
  ): Promise<boolean>;
}

export default [stickied_automod_comment, aa_video_extractor] as PostProcessingPlugin[];
