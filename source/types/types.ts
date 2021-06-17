export type CommentData = {
  id: string;

  author: string;

  stickied: boolean;

  // admin or moderator
  distinguished: string;

  body_html: string;

  ups: number;
  downs: number;
  score: number;

  // User-determined vote (1, 0, -1)
  likes: number;

  all_awardings: Award[];
  replies: [];
};

export type Award = {
  resized_icons: AwardIcon[];
  count: number;
  icon_url: string;
};

type AwardIcon = {
  url: string;
};

export type ListingData = {
  author: string;
};

export type Context = {
  isLoggedIn: boolean;
  isNewStyle: boolean;
  doesOpenLinksInNewTab: boolean;
};

export type RequestParams = {
  commentIndex: number;
  depth: number;
  limit: number;
  sort: string;
  comment?: string; // This is actually commentId
}

export type CachedContent = {
  content: string,
  commentId: string,
}

export type RequestData = {
  url: string;
  params: RequestParams;
  cached?: CachedContent;
}

export type Obj = {
  [key: string]: any;
}
export type EmptyObject = {
}

export type CommentResponseData = {
  el: HTMLElement,
  isLastReply: boolean,
  url: string,
  commentJson: CommentData|EmptyObject,
  commentId: string|false
}

export type ExtractedCommentData = {
  kind: string,
  json: CommentData|EmptyObject,
  isLastReply: boolean,
}

