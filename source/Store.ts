import {RequestParams} from "./types/types";

export default class Store {

  cache: Map<String, RequestParams>

  static getInitialRequestParameters(commentId: string|null) : RequestParams {
    const params : RequestParams = {
      commentIndex: -1,
      depth: commentId ? 2 : 1,
      limit: commentId ? 1 : 0,
      sort: "top",
    };
    if (commentId) params.comment = commentId;
    return params;
  }

  constructor() {
    this.cache = new Map<String, RequestParams>();
  }

  /**
   * Generates the next request parameters for the given url and/or comment Id.
   * The parameters will target the next reply based on what is stored in the
   * cache. No commentId means that we are looking for the next reply of the listing (no parent comment).
   *
   * @param url - The main listing URL
   * @param commentId - The optional comment that we are fetching its replies for
   */
  getNextCommentRequestParameters(url: string, commentId: string|null) : RequestParams {
    const params = this.getRequestParameters(url, commentId) || Store.getInitialRequestParameters(commentId);
    params.limit += 1;
    params.commentIndex += 1;
    return params;
  }

  getRequestParameters(postUrl: string, commentId: string|null) : RequestParams|null {
    const cachedParams = this.cache.get(genKey(postUrl, commentId));
    return cachedParams ? Object.assign({}, cachedParams) : null;
  }

  updateRequestParameters(postUrl: string, commentId: string|null, params: RequestParams) : void {
    this.cache.set(genKey(postUrl, commentId), params);
  }

}

function genKey(postUrl: string, commentId: string|null) {
  const url = cleanUrl(postUrl);
  return commentId ? url + commentId : url;
}

// TODO: what is this for?
function cleanUrl(url: string): string {
  return url.slice(url.indexOf("/r/"));
}