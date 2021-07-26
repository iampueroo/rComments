import { ExtractedCommentData, Obj, RequestParams } from "../types/types";

export function extractListingJson(data) {
  return data[0].data.children[0].data;
}

export function extractAllComments(
  data: Obj,
  params: RequestParams
): ExtractedCommentData[] {
  const commentList = extractCommentList(data, params) || [];
  return commentList.map((data, index): any => ({
    kind: data.kind,
    json: data.data,
    isLastReply: !commentList[index + 1],
  }));
}

export function extractCommentData(
  data: Obj,
  params: RequestParams
): ExtractedCommentData | null {
  const commentList = extractCommentList(data, params);
  const commentIndex = params.commentIndex;
  // Reddit had replied to parent comment saying there were
  // more replies. They lied.
  if (!commentList[commentIndex]) {
    return null;
  }

  return {
    kind: commentList[commentIndex].kind,
    json: commentList[commentIndex].data,
    isLastReply: !commentList[commentIndex + 1], // "More comments"
  };
}

function extractCommentList(data: Obj, params: RequestParams): any {
  const isCommentReply = params.depth === 2;
  let commentList = data[1].data.children;
  if (isCommentReply) {
    commentList = commentList[0].data.replies.data;
    if (!commentList) return null; // Sometimes reddit lies to us. See below.
    commentList = commentList.children;
  }
  return commentList || [];
}
