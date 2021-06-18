import { _request, RequestOptions } from "../Request";
import { RequestParams } from "../types/types";
import { genKey } from "../Store";

const NUM_COMMENTS_PER_BATCH = 10;
const NUM_COMMENTS_LEFT_BEFORE_FETCH = 3;

type CommentFetcherCacheValue = {
  responseData: any;
  params: RequestParams;
};

const dataCache = new Map<string, CommentFetcherCacheValue>();

export async function getCommentData(
  requestOptions: RequestOptions<RequestParams>
): Promise<any> {
  // This is the data that is currently active
  const key = genKey(requestOptions.url, requestOptions.data.comment);
  let currentParams = dataCache.get(key);
  const requestedLimit = requestOptions.data.limit;
  const currentLimit = currentParams ? currentParams.params.limit : 0;
  if (
    !currentParams ||
    requestedLimit >= currentLimit // We're at the end!
  ) {
    currentParams = await fetchNextBatch(requestOptions);
    dataCache.set(key, currentParams);
  } else if (requestedLimit >= currentLimit - NUM_COMMENTS_LEFT_BEFORE_FETCH) {
    // We are close to the end, let's get some more asynchronously.
    setTimeout(async () => {
      const updatedParams = await fetchNextBatch(requestOptions);
      dataCache.set(key, updatedParams);
    }, 0);
  }
  return currentParams.responseData;
}

function transformParams(params: RequestParams): RequestParams {
  return Object.assign({}, params, {
    limit: params.limit + NUM_COMMENTS_PER_BATCH,
  });
}

async function fetchNextBatch(
  requestOptions: RequestOptions<RequestParams>
): Promise<CommentFetcherCacheValue> {
  const requestParams = transformParams(requestOptions.data);
  const newRequestOptions = Object.assign({}, requestOptions, {
    data: requestParams,
  });
  const responseData = await _request<RequestParams, any>(newRequestOptions);
  return {
    responseData,
    params: newRequestOptions.data,
  };
}
