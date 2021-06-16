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
