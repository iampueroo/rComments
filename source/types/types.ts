export type CommentData = {
  id: string;

  author: string;
  subreddit: string;

  stickied: boolean;

  // admin or moderator
  distinguished: string;

  body: string;
  body_html: string;

  ups: number;
  downs: number;
  score: number;

  // User-determined vote (1, 0, -1)
  likes: number;

  all_awardings: Award[];

  replies: Thing[] | string; // Could be empty string
};

type Thing = MoreThing | ListingThing;

type MoreThing = {
  kind: "more";
  data: {
    children: [];
    count: number;
    depth: number;
    id: string;
    name: string;
    parent_id: string;
  };
};

type ListingThing = {
  kind: "Listing"; // Enum,
  data: {
    children: [];
  };
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
};

export type CachedContent = {
  content: string;
  commentId: string;
};

export type RequestData = {
  url: string;
  params: RequestParams;
  cached?: CachedContent;
};

export type Obj = {
  [key: string]: any;
};
export type EmptyObject = {};

export type FailedCommentResponseData = {
  success: false;
  el: HTMLElement;
  isLastReply: boolean;
  url: string;
};
export type SuccessfulCommentResponseData = {
  success: true;
  el: HTMLElement;
  isLastReply: boolean;
  url: string;
  commentJson: CommentData;
  commentId: string;
};

export type CommentResponseData =
  | SuccessfulCommentResponseData
  | FailedCommentResponseData;

export type ExtractedCommentData = {
  kind: string;
  json: CommentData;
  isLastReply: boolean;
};
