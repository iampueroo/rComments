import * as DOM from "./DOM";
import { UserContext } from "./UserContext.ts";
import {applyVote, isStickiedModeratorPost, generateCommentHtml} from "./html-generators/html_generator.ts";
import _request from "./Request";

UserContext.init();

((window) => {
  const R_COMMENTS_MAIN_CLASS = "_rcomment_div";
  const R_COMMENTS_NEW_REDDIT_STYLE = "_rcomments_new_reddit_styles";
  const NEXT_COMMENT_TEXT = "&#8595 Next Comment";

  const rCommentsView = {
    show(el, json, listing) {
      const commentHtml = generateCommentHtml(UserContext.get(), json, listing);
      let popup;
      if (this.isFirstComment(el)) {
        popup = this.popup(el);
        popup.querySelector(`.${DOM.classed("content")}`).innerHTML =
          commentHtml;
      } else {
        const content = el.querySelector("._rcomments_content, .children");
        const loading = content.getElementsByClassName(
          DOM.classed("loading")
        )[0];
        const nthCommentDeep = DOM.getParents(
          content,
          "._rcomments_entry"
        ).length;
        if (loading) {
          loading.parentNode.removeChild(loading);
        }
        if (nthCommentDeep % 2 !== 0) {
          content.classList.add(DOM.classed("comment_odd"));
        }
        content.innerHTML = commentHtml + content.innerHTML;
      }
    },

    hasAlreadyBuiltPopup() {
      return !!this._popup;
    },

    getPopup() {
      if (!this._popup) {
        const popup = window.document.createElement("div");
        const nextCommentDiv = window.document.createElement("div");
        const contentDiv = window.document.createElement("div");
        nextCommentDiv.className = DOM.classed("next_comment");
        nextCommentDiv.innerHTML = NEXT_COMMENT_TEXT;
        contentDiv.className = DOM.classed("content");
        popup.classList.add(R_COMMENTS_MAIN_CLASS);
        if (UserContext.get().usesNewStyles()) {
          popup.classList.add(R_COMMENTS_NEW_REDDIT_STYLE);
        }
        popup.style.display = "none";
        popup.appendChild(nextCommentDiv);
        popup.appendChild(contentDiv);
        window.document.body.appendChild(popup);

        // Right click triggers mouseleave, so let's ignore
        // the immediate mouseleave.
        let leftClickMouseLeave = false;
        popup.addEventListener("mousedown", (e) => {
          if (e.which === 3) {
            leftClickMouseLeave = true;
          }
        });
        popup.addEventListener("mouseleave", () => {
          if (leftClickMouseLeave) {
            leftClickMouseLeave = false;
            return;
          }
          this.hidePopup();
        });
        popup.addEventListener("mousemove", () => {
          if (this.hideTimeout) {
            window.clearTimeout(this.hideTimeout);
            delete this.hideTimeout;
          }
        });
        this._popup = popup;
      }
      this._popup.classList.toggle(
        "res-nightmode",
        UserContext.get().usesNewStyles() && UserContext.get().isNightMode()
      );
      return this._popup;
    },

    popup(el) {
      const popup = this.getPopup();
      const nextCommentNone = popup.getElementsByClassName(
        DOM.classed("next_comment_none")
      )[0];

      if (nextCommentNone) {
        nextCommentNone.innerHTML = NEXT_COMMENT_TEXT;
        nextCommentNone.classList = [DOM.classed("next_comment")];
      }

      const clientRect = el.getBoundingClientRect();

      if (this.isFirstComment(el)) {
        const windowOffsetY = window.pageYOffset;
        const windowOffsetX = window.pageXOffset;
        const top = Math.round(
          clientRect.top + clientRect.height + windowOffsetY
        );
        const left = Math.round(clientRect.left + windowOffsetX);
        const nextComment = popup.getElementsByClassName(
          DOM.classed("next_comment")
        )[0];
        if (nextComment) {
          nextComment.innerHTML = NEXT_COMMENT_TEXT;
        }
        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;
      }
      return popup;
    },

    hidePopup() {
      if (this._popup) {
        // this._popup.style.display = 'none';
      }
    },

    hidePopupSoon() {
      this.hideTimeout = window.setTimeout(() => this.hidePopup(), 300);
    },

    isFirstComment(el) {
      return el.tagName.toLowerCase() === "a";
    },

    loading(el) {
      const isFirst = this.isFirstComment(el);
      const loadingClasses = `${DOM.classed("loading")} ${DOM.classed(
        "comment comment thing"
      )}`;
      const span = "<span>Fetching comment...</span>";
      const loadingContent = `<div class="${loadingClasses}">${span}</div>`;
      if (isFirst) {
        const popup = this.popup(el);
        popup.querySelector(`.${DOM.classed("content")}`).innerHTML =
          loadingContent;
        popup.style.display = "block";
      } else {
        const children = el.querySelector("._rcomments_content, .children");
        if (children) {
          children.innerHTML = loadingContent + children.innerHTML;
        }
      }
    },

    loadContentHtml(el, content) {
      this.popup(el).innerHTML = content;
    },

    contentHtml() {
      return this._popup.innerHTML;
    },

    updateParentComment(el, isLastReply) {
      if (!isLastReply) return;

      let container;
      for (let i = 0; i < el.children.length; i += 1) {
        if (el.children[i].classList.contains("entry")) {
          container = el.children[i].querySelector(
            `.${DOM.classed("next_reply")}`
          );
          break;
        }
      }

      if (!container) {
        container = this._popup.querySelector(
          `.${DOM.classed("next_comment")}`
        );
      }

      if (container.classList.contains(DOM.classed("next_comment"))) {
        container.classList.remove(DOM.classed("next_comment"));
        container.classList.add(DOM.classed("next_comment_none"));
        container.innerHTML = "No more Comments";
      } else {
        container.classList.remove(DOM.classed("next_reply"));
        container.classList.add(DOM.classed("no_reply"));
        container.innerHTML = "No More replies";
      }
    },

    handleError(el, error) {
      const errorHtml = `<div class="${DOM.classed("error")}">${error}</div>`;

      if (this.isFirstComment(el)) {
        this.popup(el).querySelector(`.${DOM.classed("content")}`).innerHTML =
          errorHtml;
      } else {
        const node = el.querySelector("._rcomments_content, .children");
        node.innerHTML = errorHtml + node.innerHTML;
        const loading = node.querySelector(`.${DOM.classed("loading")}`);
        if (loading) {
          loading.remove();
        }
      }
    },
  };

  const rCommentsModel = {
    listingCache: {},
    htmlCache: {},
    commentStatus: {},
    currentListing: {},

    getRequestData(url, commentId) {
      const params = this.requestParams(url, commentId);

      const data = {
        url,
        params,
      };

      if (!commentId) data.cached = this.cache(url);

      return data;
    },

    /**
     * Generates the next request parameters for the given url and/or comment Id.
     * The parameters will target the next reply based on what is stored in the
     * cache.
     *
     * @param url
     * @param commentId
     * @returns {*}
     */
    requestParams(url, commentId) {
      const key = this.genKey(url, commentId);
      let params = Object.assign({}, this.commentStatus[key] || {});

      if (!params.sort) {
        // Initial request parameters
        params = {
          commentIndex: -1,
          depth: commentId ? 2 : 1,
          limit: commentId ? 1 : 0, // Incremented below
          sort: "top",
        };

        if (commentId) params.comment = commentId;
      }

      params.limit += 1;
      params.commentIndex += 1;

      return params;
    },

    registerComment(url, data, commentId) {
      const key = this.genKey(url, commentId);
      const params = this.requestParams(url, commentId);
      const listingJson = this.extractListingJson(data);
      const commentData = this.extractCommentData(data, params);

      if (!commentData) return false;
      this.commentStatus[key] = params;
      this.setCurrentListing(commentData.json.id, listingJson);
      return commentData;
    },

    extractListingJson(data) {
      return data[0].data.children[0].data;
    },

    extractCommentData(data, params) {
      const isCommentReply = params.depth === 2;
      const commentIndex = params.commentIndex;
      let commentList = data[1].data.children;

      if (isCommentReply) {
        commentList = commentList[0].data.replies.data;
        if (!commentList) return null; // Sometimes reddit lies to us. See below.
        commentList = commentList.children;
      }

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
    },

    genKey(url, commentId) {
      url = this.cleanUrl(url);
      return commentId ? url + commentId : url;
    },

    getUrl(commentId) {
      const listing = this.listingCache[commentId];
      return listing ? listing.permalink : this.currentListing.permalink;
    },

    cache(url, args) {
      url = this.cleanUrl(url);

      if (args) {
        this.htmlCache[url] = args;
      }

      return this.htmlCache[url];
    },

    setCurrentListing(commentId, data) {
      if (data) {
        this.listingCache[commentId] = data;
      }
      this.currentListing = this.listingCache[commentId];
    },

    cleanUrl(url) {
      return url.slice(url.indexOf("/r/")); // Ok now I'm getting sloppy.
    },
  };

  const rCommentsController = {
    model: rCommentsModel,
    view: rCommentsView,
    go: false,
    disableRequest: false,

    init() {
      let active = false;
      let yPos = false;

      function isValidCommentAnchor(element = {}) {
        const a = element.nodeName === "A" ? element : false;
        if (!a) {
          return false;
        }
        const validAttributeMap = {
          class: /((\s|^)comments(\s|$)|(\s|^)search-comments(\s|$))/,
          "data-click-id": /(\s|^)comments(\s|$)/,
        };
        const keys = Object.keys(validAttributeMap);
        for (let i = 0; i < keys.length; i++) {
          const attributeName = keys[i];
          const regex = validAttributeMap[attributeName];
          const value = a.getAttribute(attributeName) || "";
          if (value.match(regex)) {
            return true;
          }
        }
        return false;
      }

      window.document.body.addEventListener("mousemove", (e) => {
        let a = isValidCommentAnchor(e.target) ? e.target : null;
        if (!a && e.target) {
          a = isValidCommentAnchor(e.target.parentElement)
            ? e.target.parentElement
            : null;
        }
        if (!active && !a) {
          // Exit early if non active and not an anchor
          return;
        }
        if (active && a && a.href === active.href) {
          yPos = e.pageY;
          // Exit early if on the same anchor
          return;
        }
        if (!active && a) {
          this.registerPopup(); // Lazily build and register popup
          // Hovering over anchor for the first tme
          active = e.target;
          yPos = e.pageY;
          this.handleAnchorMouseEnter(a);
        } else if (active) {
          this.handleAnchorMouseLeave(e, yPos);
          active = false;
        }
      });
    },

    registerPopup() {
      if (this.view.hasAlreadyBuiltPopup()) {
        return;
      }
      const popup = this.view.getPopup();
      popup.addEventListener("click", (e) => {
        if (e.target.className === "_rcomments_next_reply") {
          this.renderCommentFromElement(e.target.parentElement.parentElement);
        } else if (e.target.className === "_rcomments_next_comment") {
          this.renderCommentFromElement(e.target.parentElement);
        } else if (e.target.classList && e.target.classList[0] === "arrow") {
          e.stopImmediatePropagation();
          this.handleVote(e.target);
        } else if (
          e.target.classList &&
          e.target.classList.contains("md-spoiler-text")
        ) {
          e.stopImmediatePropagation();
          e.target.classList.add("revealed");
        } else if (
          e.target.className === DOM.classed("automod-comment-toggle")
        ) {
          e.stopImmediatePropagation();
          this.handleAutomodComment(e.target);
        }
        return false;
      });
    },

    findClosestThing(node) {
      while (node) {
        if (node.classList && node.classList.contains("thing")) {
          return node;
        }
        node = node.parentNode;
        if (node.tagName.toLowerCase() === "body") {
          break;
        }
      }
      return false;
    },

    renderCommentFromElement(el, init) {
      if (this.request) return;

      // If not first comment, find first parent "thing" div
      // which represents is a comment div with id attribute
      const commentId = !init && this.findClosestThing(el).id;
      const isNextComment = el.classList.contains(R_COMMENTS_MAIN_CLASS);
      // Target URL for request is comment page or comment's permalink
      // Initial request will not have a comment ID, so will use overall comment page
      let url = el.href || this.model.getUrl(commentId);

      // Sometimes the URL contains query parameters we don't want.
      // This removes them.
      if (url === el.href && el.nodeName === "A") {
        url = url.slice(0, el.search ? url.indexOf(el.search) : url.length);
      }
      url += ".json";

      const requestData = this.model.getRequestData(url, commentId);

      this.view.loading(el);

      if (requestData.cached && !isNextComment) {
        const content = requestData.cached.content;
        this.view.loadContentHtml(el, content);
        const id = this.view.getPopup().querySelector("._rcomments_comment").id;
        this.model.setCurrentListing(id);
        return;
      }

      this.executeCommentRequest(el, commentId, {
        url: requestData.url,
        data: requestData.params,
        timeout: 4000,
      })
        .then(this.showComment.bind(this))
        .then((commentJSON) => {
          if (isStickiedModeratorPost(commentJSON)) {
            const parentElement = this.view.getPopup();
            this.view.loading(parentElement);
            const params = Object.assign({}, requestData.params);
            params.limit++;
            this.executeCommentRequest(parentElement, commentId, {
              url: requestData.url,
              data: params,
              timeout: 4000,
            }).then(this.showComment.bind(this));
          }
        });
    },

    /**
     * Responsible for executing the Reddit API request, registering response
     * with the model, handling the "more" response, and handling the fail scenario
     * as well.
     *
     * @param el
     * @param commentId
     * @param parameters
     * @returns {Promise<unknown>}
     */
    executeCommentRequest(el, commentId, parameters) {
      this.request = _request(parameters);
      const onSuccess = this.getCommentData(el, parameters.url, commentId).bind(
        this
      );
      const onFail = this.handleCommentFail(el).bind(this);
      return this.request
        .then(onSuccess)
        .catch(onFail)
        .finally(() => {
          delete this.request;
        });
    },

    getCommentData(el, url, commentId) {
      return (data) => {
        let commentData = this.model.registerComment(url, data, commentId);
        let isLastReply;
        if (commentData && commentData.kind === "more") {
          // Sometimes, Reddit responds with a "more" thing rather than the
          // actual comment. We'll handle it by upping the limit parameter
          // on the request, which seems to force the "more" thing to expand
          // to actual comments
          return this.handleMoreThing(el, url, commentId);
        }

        if (commentData) {
          isLastReply = commentData.isLastReply;
        } else {
          isLastReply = true;
          commentData = {};
        }
        return {
          el,
          isLastReply,
          url,
          commentJson: commentData.json,
          commentId: commentData.json && commentData.json.id,
        };
      };
    },

    /**
     * Handles the weird "more" response that Reddit periodically returns
     * by skipping the response and upping our limit and updating our comment index.
     *
     * @param el
     * @param url
     * @param commentId
     * @returns {Promise<unknown>}
     */
    handleMoreThing(el, url, commentId) {
      const params = this.model.requestParams(url, commentId);
      params.commentIndex = params.limit - 2;
      params.limit += 1;
      this.model.commentStatus[this.model.genKey(url, commentId)] = params;
      return this.executeCommentRequest(el, commentId, {
        url,
        data: params,
        timeout: 4000,
      }).then(this.showComment.bind(this));
    },

    showComment(data) {
      if (!data) {
        // Something went wrong earlier
        return null;
      }
      const { commentJson, isLastReply, commentId, url, el } = data;
      this.view.show(el, commentJson, this.model.currentListing);
      this.view.updateParentComment(el, isLastReply);
      this.updateCache(url, commentId);
      return commentJson;
    },

    handleCommentFail(el) {
      return () => {
        this.view.handleError(el, "Error: Reddit did not respond.");
        this.disableRequest = false;
      };
    },

    updateCache(url, commentId) {
      if (!commentId) return;

      this.model.cache(url, {
        content: this.view.contentHtml(),
        commentId,
      });
    },

    handleAnchorMouseEnter(commentAnchor) {
      const commentAnchorWords = commentAnchor.text.split(" ");
      if (commentAnchorWords.length === 0) {
        return;
      }
      const numberOfComments = Number.parseInt(commentAnchorWords[0], 10);
      const firstWordIsNumber = !Number.isNaN(numberOfComments);
      if (firstWordIsNumber && numberOfComments === 0) {
        return;
      }
      if (!firstWordIsNumber && commentAnchorWords.length === 1) {
        // Label on the button is "comments" (old reddit's no comments flag)
        return;
      }
      this.go = true;
      setTimeout(() => {
        if (this.go) this.renderCommentFromElement(commentAnchor, true);
      }, 250);
    },

    handleAnchorMouseLeave(e, prevPageY) {
      this.go = false;

      if (prevPageY >= e.pageY) {
        // If leaving through the side or top, cancel any request
        // and hide the popup
        this.abortOngoingRequest();
        this.view.hidePopup();
      } else {
        // Still try to hide the popup, but the timeout
        // will be canceled if we hover over the popup
        this.view.hidePopupSoon();
      }
    },

    abortOngoingRequest() {
      if (this.request) {
        this.request.abort();
        delete this.request;
      }
    },

    handleVote(arrow) {
      if (!UserContext.get().modhash) return;

      const VOTE_URL = "/api/vote/.json";

      const parentComment = DOM.getFirstParent(
        arrow,
        `.${DOM.classed("comment")}`
      );
      const id = parentComment && `t1_${parentComment.id}`;
      const url = `${this.model.currentListing.permalink}.json`;
      const commentId = DOM.getFirstParent(arrow, ".comment").id;
      let dir;

      if (arrow.classList.contains("up")) {
        dir = 1;
      } else if (arrow.classList.contains("down")) {
        dir = -1;
      } else {
        dir = 0;
      }

      const data = {
        id,
        dir,
        uh: UserContext.get().modhash,
      };

      _request(VOTE_URL, { type: "POST", data });
      applyVote(arrow.parentElement, dir);
      this.updateCache(url, commentId);
    },

    handleAutomodComment(element) {
      const parentComment = DOM.getFirstParent(
        element,
        `.${DOM.classed("comment")}`
      );
      const automodRealCommentWrapper = parentComment.querySelector(
        `.${DOM.classed("automod-real-txt")}`
      );
      const automodCommentTextWarning = parentComment.querySelector(
        `.${DOM.classed("automod-comment-txt")}`
      );
      parentComment.classList.remove(DOM.classed("automod-comment"));
      automodCommentTextWarning.remove();
      element.remove();
      automodRealCommentWrapper.classList.remove(DOM.classed("hidden"));
    },
  };

  rCommentsController.init();
})(window);
