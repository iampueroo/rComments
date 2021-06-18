import { _request, RequestOptions } from "../Request";
import { RequestParams } from "../types/types";
import { genKey } from "../Store";

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
  const currentParams = dataCache.get(key);
  if (
    !currentParams ||
    requestOptions.data.limit >= currentParams.params.limit
  ) {
    const requestParams = transformParams(requestOptions.data);
    const newRequestOptions = Object.assign({}, requestOptions, {
      data: requestParams,
    });
    const responseData = await _request<RequestParams, any>(newRequestOptions);
    dataCache.set(key, {
      responseData,
      params: newRequestOptions.data,
    });
  }
  return dataCache.get(key).responseData;
}

function transformParams(params: RequestParams): RequestParams {
  return Object.assign({}, params, {
    limit: params.limit + 10,
  });
}
