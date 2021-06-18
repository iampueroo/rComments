export type RequestOptions<T> = {
  url: string;
  type?: string;
  data: T;
  timeout?: number;
}

// screw you jQuery
export function _request<T, R>(_url: string|RequestOptions<T>, _options: RequestOptions<T>|null = null) : Promise<R> {
  let url: string;
  let options: RequestOptions<T>;
  if (typeof _url === "object") {
    options = _url;
    url = options.url;
  } else {
    url = _url;
    options = _options || {
     url,
     type: 'GET',
     data: null,
    };
  }
  const type = options.type || "GET";
  const isPostRequest = type === "POST";
  let data = formEncode(options.data || {});
  if (type === "GET" && data) {
    url += `?${data}`;
    data = undefined;
  }
  const controller = new AbortController();
  const payload = {
    method: type,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: isPostRequest ? data : null,
    signal: controller.signal,
  };
  if (url[0] === "/") {
    url = `${window.origin}${url}`;
  }
  const promises = [];
  let timeoutId;
  if (options.timeout) {
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("timeout")),
        options.timeout
      );
    });
    promises.push(timeoutPromise);
  }

  const requestPromise = new Promise((resolve, reject) => {
    window
      .fetch(url, payload)
      .then((response) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (!response.ok) {
          reject(`Request to ${url} failed`);
        }
        return response;
      })
      .then((response) => resolve(response.json()))
      .finally(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
  });
  promises.push(requestPromise);
  const masterPromise = Promise.race(promises);
  // @ts-ignore TODO
  masterPromise.abort = function abort() {
    controller.abort();
  };
  return masterPromise;
}

function formEncode(data) {
  return Object.keys(data)
    .map((key) => `${key}=${data[key]}&`)
    .join("")
    .slice(0, -1);
}
