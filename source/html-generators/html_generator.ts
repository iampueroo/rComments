import * as DOM from "../dom/DOM";
import { Award, CommentData, ListingData } from "../types/types";
import { UserContext } from "../UserContext";

export function generateCommentHtml(
  context: UserContext,
  comment: CommentData | null,
  listing: ListingData
): string {
  if (!comment || !comment.id) {
    return noReplyHtml();
  }
  const isStickiedModPost = isStickiedModeratorPost(comment);
  return `
		<div id="${comment.id}" class="${DOM.classed("comment comment thing")} ${
    isStickiedModPost ? DOM.classed("automod-comment") : ""
  }">
		  ${getArrowHtml(context, comment)}	
			<div class="entry ${DOM.classed("entry")}">	
			  ${commentContentHtml(context, comment, listing)}
				${nextReplyPromptHtml(!!comment.replies)}
				<div class="children"></div>
			</div>
		</div>
	`;
}

function commentContentHtml(
  userContext: UserContext,
  comment: CommentData,
  listing: ListingData
): string {
  const innerHTML = `
  ${taglineHtml(userContext, comment, listing)}
  ${generateBodyHtml(userContext, comment.body_html)}
  `;
  if (isStickiedModeratorPost(comment)) {
    return `
    <span class="${DOM.classed(
      "automod-comment-txt"
    )}">ℹ️&nbsp&nbspStickied automod post by <span class="author ${DOM.classed(
      "author"
    )}">${comment.author}</span> hidden by default.&nbsp</span>
    <span class="${DOM.classed(
      "automod-comment-toggle"
    )}">Click here to view.</span>
    <span class="${DOM.classed("hidden")} ${DOM.classed(
      "automod-real-txt"
    )}">${innerHTML}</span>`;
  }
  return innerHTML;
}

export function applyVote(
  arrows: HTMLDivElement,
  vote: number | boolean
): HTMLDivElement {
  const upArrow = arrows.querySelector(".arrow.up, .arrow.upmod");
  const downArrow = arrows.querySelector(".arrow.down, .arrow.downmod");
  // Reset - gross, could find a better way of doing this.
  arrows.classList.remove("unvoted");
  arrows.classList.remove("likes");
  arrows.classList.remove("dislikes");
  upArrow.classList.remove("upmod");
  upArrow.classList.add("up");
  downArrow.classList.remove("downmod");
  downArrow.classList.add("down");

  // Switch statement with boolean cases? #yolo(?)
  switch (vote) {
    case 1:
    case true:
      arrows.classList.add("likes");
      upArrow.classList.remove("up");
      upArrow.classList.add("upmod");
      break;
    case -1:
    case false:
      arrows.classList.add("dislikes");
      downArrow.classList.remove("down");
      downArrow.classList.add("downmod");
      break;
    default:
      arrows.classList.add("unvoted");
      if (arrows.querySelector(".score")) {
        arrows.querySelector(".score").classList.add("unvoted");
      }
  }
  return arrows;
}

function getArrowHtml(
  userContext: UserContext,
  commentData: CommentData
): string {
  if (
    !userContext.isLoggedIn() ||
    userContext.usesNewStyles() ||
    isStickied(commentData)
  ) {
    // Only show arrows when logged in on old Reddit styles.
    // Stickied comments do not show arrows - they are only viewable by admins
    return "";
  }
  const arrowDiv = window.document.createElement("div");
  const arrowUp = window.document.createElement("div");
  const arrowDown = window.document.createElement("div");
  arrowDiv.className = DOM.classed("arrows unvoted");
  arrowUp.className = "arrow up";
  arrowDown.className = "arrow down";
  arrowDiv.appendChild(arrowUp);
  arrowDiv.appendChild(arrowDown);
  return applyVote(arrowDiv, commentData.likes).outerHTML;
}

function generateBodyHtml(context: UserContext, bodyHtml: string): string {
  if (context.prefersNewTabs()) {
    const regex = /(<a\s)(.*<\/a>)/;
    bodyHtml = bodyHtml.replace(regex, '$1target="_blank" $2');
  }
  return `<div class="${DOM.classed("body_html")}">${DOM.decodeHTML(
    bodyHtml
  )}</div>`;
}

function taglineHtml(
  userContext: UserContext,
  json: CommentData,
  listing: ListingData
) {
  const authorHtml = authorTagHtml(
    userContext,
    json.author,
    isOP(json, listing),
    isAdmin(json),
    isStickied(json)
  );
  const voteHtml = voteTagHtml(userContext, json);
  const gildedHtml = awardsHtml(userContext, json.all_awardings);
  return `<div class="tagline ${DOM.classed(
    "tagline"
  )}">${authorHtml}${voteHtml}${gildedHtml}</div>`;
}

export function noReplyHtml() {
  return `<div class="${DOM.classed(
    "comment comment thing"
  )}">Oops, no more replies.</div>`;
}

export function authorTagHtml(
  userContext: UserContext,
  author: string,
  isOp: boolean,
  isAdmin: boolean,
  isStickied = false
): string {
  const op = isOp ? "submitter" : "";
  const admin = isAdmin ? "admin" : "";
  let stickied = isStickied
    ? `<span class="stickied-tagline ${DOM.classed(
        "stickied"
      )}">stickied comment</span>`
    : "";
  if (stickied && userContext.usesNewStyles()) {
    stickied = `<span>&nbsp·&nbsp</span>` + stickied;
  }
  return `<a class="author ${op} ${admin} ${DOM.classed(
    "author"
  )}" href="/user/${author}">${author}</a>${stickied}`;
}

export function nextReplyPromptHtml(hasMoreReplies: boolean) {
  const NEXT_REPLY_TEXT = "&#8618 Next Reply";
  const _class = DOM.classed(hasMoreReplies ? "next_reply" : "no_reply");
  const html = hasMoreReplies ? NEXT_REPLY_TEXT : "No Replies";
  return `<div class="${_class}" style="padding-top:5px">${html}</div>`;
}

export function voteTagHtml(
  userContext: UserContext,
  commentData: CommentData
) {
  const votes = commentData.ups - commentData.downs;
  const score = commentData.score;
  if (isStickied(commentData)) {
    // Stickied comments' vote totals are only visible to moderators
    return "";
  }
  if (userContext.usesNewStyles()) {
    return `<span class="score unvoted ${DOM.classed(
      "score"
    )}">${score} points</span>`;
  }
  const unvoted = `<span class="score unvoted">${votes} points</span>`;
  const likes = `<span class="score likes">${votes + 1} points</span>`;
  const dislikes = `<span class="score dislikes">${votes - 1} points</span>`;
  return `<span>${dislikes + unvoted + likes}</span>`;
}

export function awardsHtml(
  userContext: UserContext,
  allAwardings: Award[] = []
): string {
  const isNew = userContext.usesNewStyles();
  const awards = allAwardings
    .map((award) => {
      let iconSrc;
      if (isNew) {
        const firstIcon = (award.resized_icons || [])[0];
        iconSrc = firstIcon ? firstIcon.url : "";
        if (!iconSrc) {
          return "";
        }
      } else {
        iconSrc = award.icon_url;
      }
      const c = isNew && award.count > 1 ? award.count : "";
      // preload
      const img = new Image();
      img.src = iconSrc;
      return `<span class="awarding-icon-container">
				<img alt="award" class="awarding-icon" src="${iconSrc}" style="max-width:16px" />
				<span class="${DOM.classed("awarding-count")}">${c}</span>
				</span>`;
    })
    .filter((e) => e !== "")
    .slice(0, 4)
    .join("");
  return `<span class="${DOM.classed("awards")}">${awards}</span>`;
}

/**
 * This goes elsewehre
 * @param json
 */
export function isStickiedModeratorPost(json: CommentData): boolean {
  return json.distinguished === "moderator" && isStickied(json);
}

export function isStickied(json: CommentData): boolean {
  return json.stickied === true;
}

function isOP(commentData: CommentData, listingData: ListingData): boolean {
  return listingData.author === commentData.author;
}

function isAdmin(commentData: CommentData): boolean {
  return commentData.distinguished === "admin";
}
