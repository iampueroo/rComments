((window) => {

	const R_COMMENTS_ID = '_rcomment_div';
	const R_COMMENTS_CLASS_PREFIX = '_rcomments_';
	const NEXT_REPLY_TEXT = '&#8618 Next Reply';
	const NEXT_COMMENT_TEXT = '&#8595 Next Comment';

	function decodeHTML(html) {
		let txt = document.createElement('textarea');
		txt.innerHTML = html;
		return txt.value;
	}

	function getFirstParent(el, selector) {
		if (!el.parentElement) {
			return;
		} else if (el.parentElement.matches(selector)) {
			return el.parentElement;
		}
		return getFirstParent(el.parentElement, selector)
	}

	function formEncode(data) {
		let encodedString = '';
		for (key in data) {
			encodedString += key + '=' + data[key] + '&';
		}
		return encodedString.slice(0, -1);
	}

	// screw you jQuery
	function _request(url, options = {}) {
		if (typeof url === 'object') {
			options = url;
			url = options.url;
		}

		let type = options.type || 'GET';
		let data = formEncode(options.data || {});
		if (type === 'GET') {
			url += '?' + data;
			data = undefined;
		}

		let xhttp = new XMLHttpRequest();
		let promise = new Promise((resolve, reject) => {
			xhttp.onreadystatechange = function() {
				if (xhttp.readyState === 4 && xhttp.status == 200) {
					resolve(JSON.parse(xhttp.responseText));
				} else if (xhttp.readyState === 4) {
					reject();
				}
			}
			xhttp.ontimeout = () => {
				reject();
			}
			xhttp.open(type, url, true);
			if (options.timeout) xhttp.timeout = options.timeout;
			xhttp.setRequestHeader('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
			xhttp.send(data);
		});
		promise.abort = function() {
			xhttp.abort();
		}
		return promise;
	}

	function classed(classes) {
		return R_COMMENTS_CLASS_PREFIX + classes;
	}

	let Comment = {

		isLoggedIn : false,
		openLinksInNewTab : false,

		getHtml : function(json, listing) {
			if (!json || !json.id) return this.noReplyHtml();

			this.data = json;
			this.listing = listing;
			let d = this.data,
				commentHtml = `<div>${decodeHTML(d.body_html)}</div>`,
				bodyHtml = `<div>${commentHtml}</div>`,
				tagline = this.buildTagline(),
				arrows = this.arrows();

			if (this.openLinksInNewTab) {
				let regex = /(<a\s)(.*<\/a>)/;
				bodyHtml = bodyHtml.replace(regex, '$1target="_blank" $2');
			}

			let wrapperOpen = `<div id="${d.id}" class="${classed('comment comment thing')}">`;
			let wrapperClose = '</div>';
			let entry = '<div class="entry">'
				+ 	tagline
				+ 	bodyHtml
				+ 	this.nextReply(!!d.replies)
				+ 	'<div class="children"></div>'
				+ '</div>';

			return wrapperOpen + arrows + entry + wrapperClose;
		},

		noReplyHtml : function() {
			return `<div class="${classed('comment comment thing')}">Oops, no more replies.</div>`;
		},

		buildTagline : function() {
			return `<div class="tagline">${this.authorTag() + this.voteTag()}</div>`;
		},

		voteTag : function() {
			let votes = this.data.ups - this.data.downs,
				unvoted = `<span class="score unvoted">${votes} points</span>`,
				likes = `<span class="score likes">${votes + 1} points</span>`,
				dislikes = `<span class="score dislikes">${votes - 1} points</span>`;
			return `<span>${dislikes + unvoted + likes}</span>`;
		},

		nextReply : function(hasChildren) {
			let _class = classed(hasChildren ? 'next_reply' : 'no_reply'),
				html = hasChildren ? NEXT_REPLY_TEXT : 'No Replies';
			return `<div class="${_class}" style="padding-top:5px">${html}</div>`;
		},

		authorTag : function() {
			let author = this.data.author;
			let op = this.listing && this.listing.author === author ? 'submitter' : '';
			return `<a class="author ${op}" href="/user/${author}">${author}</a>`;
		},

		arrows : function() {
			if (!this.isLoggedIn) return '';
			let score = this.data.ups - this.data.downs;
			let arrowDiv = document.createElement('div');
			let arrowUp = document.createElement('div');
			let arrowDown = document.createElement('div');
			arrowDiv.className = classed('arrows unvoted');
			arrowUp.className = 'arrow up';
			arrowDown.className = 'arrow down';
			arrowDiv.appendChild(arrowUp);
			arrowDiv.appendChild(arrowDown);
			return this.applyVote(arrowDiv, this.data.likes).outerHTML;
		},

		applyVote : function(arrows, vote) {
			let upArrow = arrows.querySelector('.arrow.up, .arrow.upmod');
			let downArrow = arrows.querySelector('.arrow.down, .arrow.downmod');
			// Reset - gross, could find a better way of doing this.
			arrows.classList.remove('unvoted');
			arrows.classList.remove('likes');
			arrows.classList.remove('dislikes');
			upArrow.classList.remove('upmod');
			upArrow.classList.add('up');
			downArrow.classList.remove('downmod');
			downArrow.classList.add('down');

			// Switch statement with boolean cases? #yolo(?)
			switch(vote) {
				case 1:
				case true:
					arrows.classList.add('likes');
					upArrow.classList.remove('up');
					upArrow.classList.add('upmod');
					break;
				case -1:
				case false:
					arrows.classList.add('dislikes');
					downArrow.classList.remove('down');
					downArrow.classList.add('downmod');
					break;
				default:
					arrows.classList.add('unvoted');
					if (arrows.querySelector('.score')) {
						arrows.querySelector('.score').classList.add('unovoted');
					}
			}

			return arrows;
		}
	};

	let rCommentsView = {
		popup : null,

		show : function(el, json, listing) {
			let commentHtml = Comment.getHtml(json, listing),
				popup,
				container;

			if (this.isFirstComment(el)) {
				let popup = this.popup(el);
				popup.querySelector('.' + classed('content')).innerHTML = commentHtml;
				popup.style.display = 'block';
			} else {
				let content = el.querySelector('._rcomments_content, .children');
				let loading = content.getElementsByClassName(classed('loading'))[0];
				if (loading) {
					loading.parentNode.removeChild(loading);
				}
				content.innerHTML = commentHtml + content.innerHTML;
			}
		},

		getPopup: function() {
			if (!this._popup) {
				let popup = document.createElement('div');
				let nextCommentDiv = document.createElement('div');
				let contentDiv = document.createElement('div');
				nextCommentDiv.className = classed('next_comment');
				nextCommentDiv.innerHTML = NEXT_COMMENT_TEXT;
				contentDiv.className = classed('content');
				popup.id = R_COMMENTS_ID;
				popup.style.display = 'none';
				popup.appendChild(nextCommentDiv);
				popup.appendChild(contentDiv);
				document.body.appendChild(popup);
				popup.addEventListener('mouseleave', this.hidePopup.bind(this));
				this._popup = popup;
			}
			return this._popup;
		},

		popup : function(el) {
			let popup = this.getPopup();
			let nextCommentNone = popup.getElementsByClassName(classed('next_comment_none'))[0];

			if (nextCommentNone) {
				nextCommentNone.innerHTML = NEXT_COMMENT_TEXT;
				nextCommentNone.classList = [classed('next_comment')];
			}

			let clientRect = el.getBoundingClientRect();

			if (this.isFirstComment(el)) {
				let windowOffsetY = window.window.pageYOffset;
				let windowOffsetX = window.pageXOffset;
				let nextComment = popup.getElementsByClassName(classed('next_comment'))[0];
				if (nextComment) {
					nextComment.innerHTML = NEXT_COMMENT_TEXT;
				}
				popup.style.top = clientRect.top + clientRect.height + windowOffsetY + 'px';
				popup.style.left = clientRect.left + windowOffsetX + 'px';
			}

			return popup;
		},

		hidePopup : function() {
			if (this._popup) this._popup.style.display = 'none';
		},

		isFirstComment : function(el) {
			return el.tagName.toLowerCase() === 'a';
		},

		loading : function(el) {
			let isFirst = this.isFirstComment(el);
			let loadingClasses = classed('loading') + ' ' + classed('comment comment thing');
			let loadingContent = '<div class="' + loadingClasses + '">' +
				'<span>Fetching comment...</span>' +
				'</div>';

			if (isFirst) {
				let popup = this.popup(el);
				popup.querySelector('.' + classed('content')).innerHTML = loadingContent;
				popup.style.display = 'block';
			} else {
				let children = el.querySelector('._rcomments_content, .children');
				if (children) {
					children.innerHTML = loadingContent + children.innerHTML;
				}
			}
		},

		loadContentHtml : function(el, content) {
			this.popup(el).innerHTML = content;
		},

		contentHtml : function() {
			return this._popup.innerHTML;
		},

		updateParentComment : function(el, isLastReply) {
			if (!isLastReply) return;

			let container;
			for (let i = 0; i < el.children.length; i++) {
				if (el.children[i].classList.contains('entry')) {
					container = el.children[i].querySelector('.' + classed('next_reply'));
					break;
				}
			}

			if (!container) {
				container = this._popup.querySelector('.' + classed('next_comment'));
			}

			if (container.classList.contains(classed('next_comment'))) {
				container.classList.remove(classed('next_comment'));
				container.classList.add(classed('next_comment_none'));
				container.innerHTML = 'No more Comments';
			} else {
				container.classList.remove(classed('next_reply'));
				container.classList.add(classed('no_reply'));
				container.innerHTML = 'No More replies';
			}
		},

		handleError : function(el, error) {
			let errorHtml = `<div class="${classed('error')}">${error}</div>`;

			if (this.isFirstComment(el)) {
				this.popup(el).querySelector('.' + classed('content')).innerHTML = errorHtml;
			} else {
				let node = el.querySelector('._rcomments_content, .children');
				node.innerHTML = errorHtml + node.innerHTML;
				let loading = node.querySelector('.' + classed('loading'));
				if (loading) {
					loading.remove();
				}
			}
		}
	};

	let rCommentsModel = {

		listingCache : {},
		htmlCache : {},
		commentStatus : {},
		currentListing : {},

		getRequestData : function(url, commentId) {
			let params = this.requestParams(url, commentId);

			data = {
				url : url,
				params : params
			};

			if (!commentId) data.cached = this.cache(url);

			return data;
		},

		requestParams : function(url, commentId) {
			let key = this.genKey(url, commentId),
				params = Object.assign({}, this.commentStatus[key] || {});

			if (!params.sort) {
				params = {
					depth : (commentId ? 2 : 1),
					limit : (commentId ? 1 : 0), // Incremented below
					sort : 'top'
				};

				if (commentId) params.comment = commentId;
			}

			params.limit++;

			return params;
		},

		registerComment : function(url, data, commentId) {
			let key = this.genKey(url, commentId),
				params = this.requestParams(url, commentId),
				listingJson = this.extractListingJson(data),
				commentData = this.extractCommentData(data, params);

			if (!commentData) return;
			this.commentStatus[key] = params;
			this.listingCache[commentData.json.id] = listingJson;
			this.currentListing = listingJson;
			return commentData;
		},

		extractListingJson : function(data) {
			return data[0]['data']['children'][0]['data'];
		},

		extractCommentData : function(data, params) {
			let isCommentReply = params.depth == 2,
				commentIndex = params.commentIndex !== undefined ? params.commentIndex : params.limit - 1,
				commentList = data[1]['data']['children'],
				hasMoreReplies, commentData;

			if (isCommentReply) {
				commentIndex--;
				commentList = commentList[0]['data']['replies']['data'];
				if (!commentList) return null; // Sometimes reddit lies to us. See below.
				commentList = commentList['children'];
			}

			if (params.commentIndex !== undefined) {
				params.commentIndex++;
			}

			// Reddit had replied to parent comment saying there were
			// more replies. They lied.
			if (!commentList[commentIndex]) {
				return null;
			}

			hasMoreReplies = !!commentList[commentIndex + 1]; // "More comments"
			return {
				kind: commentList[commentIndex].kind,
				json: commentList[commentIndex].data,
				isLastReply : !hasMoreReplies
			};
		},

		genKey : function(url, commentId) {
			url = this.cleanUrl(url);
			return commentId ? url + commentId : url;
		},

		getUrl : function(commentId) {
			let listing = this.listingCache[commentId];
			return listing ? listing.permalink : this.currentListing.permalink;
		},

		cache : function(url, args) {
			url = this.cleanUrl(url);

			if (args)
				this.htmlCache[url] = args;
			else
				return this.htmlCache[url];
		},

		setCurrentListing : function(commentId) {
			this.currentListing = this.listingCache[commentId];
		},

		cleanUrl : function(url) {
			return url.slice(url.indexOf('/r/')); // Ok now I'm getting sloppy.
		}
	};

	let rCommentsController = {

		model : rCommentsModel,
		view : rCommentsView,
		request : new XMLHttpRequest(),
		go : false,
		disableRequest : false,

		init : function() {
			let popup = this.view.getPopup();

			_request('/api/me.json').then((response) => {
				if (!response || !response.data || !response.data.modhash) return;
				this.modhash = response.data.modhash;
				Comment.openLinksInNewTab = /('|")new_window('|")\s?:\s?true/.test(window.config.innerHTML);
				Comment.isLoggedIn = true; // Sure... this works.
			});

			let firstLink = document.querySelector('.sitetable .title.loggedin');
			if (firstLink && firstLink.target === '_blank') {
				Comment.openInNewWindow = true;
			}

			popup.addEventListener('click', (e) => {
				if (e.target.className === '_rcomments_next_reply') {
					this.renderCommentFromElement(e.target.parentElement.parentElement);
				} else if (e.target.className === '_rcomments_next_comment') {
					this.renderCommentFromElement(e.target.parentElement);
				} else if (e.target.classList && e.target.classList[0] === 'arrow') {
					e.stopImmediatePropagation();
					this.handleVote(e.target);
				}
				return false;
			});

			let active = false;
			document.body.addEventListener('mousemove', (e) => {
				let a = e.target.nodeName === 'A' ? e.target : false;
				if (a && !(a.classList.contains('comments') || a.classList.contains('search-comments'))) {
					// Not a comment anchor.
					a = false;
				}

				if (!active && !a) {
					// Exit early if non active and not an anchor
					return;
				}
				if (active && a && a.href === active.href) {
					// Exit early if on the same anchor
					return;
				}

				if (!active && a) {
					// Hovering over anchor for the first tme
					active = e.target;
					this.handleAnchorMouseEnter(a);
				} else if (active) {
					this.handleAnchorMouseLeave(e, active);
					active = false;
				}
			});
		},

		findClosestThing: function(node) {
			while (node) {
				if (node.classList && node.classList.contains('thing')) {
					return node;
				}
				node = node.parentNode;
				if (node.tagName.toLowerCase() === 'body') {
					break;
				}
			}
			return false;
		},

		renderCommentFromElement : function(el, init) {
			if (this.disableRequest) return;
			let request = this.request,
				commentId = !init && this.findClosestThing(el).id,
				url = el.href || this.model.getUrl(commentId),
				isNextComment = el.id === '_rcomment_div',
				commentData, commentJson, isLastComment, content, newCommentId;

			// Sometimes the URL contains query parameters we don't want.
			// This removes them.
			if (url === el.href && el.nodeName === 'A') {
				url = url.slice(0, el.search ? url.indexOf(el.search) : url.length);
			}
			url += '.json';

			let requestData = this.model.getRequestData(url, commentId);

			this.view.loading(el);
			request.abort();

			if (requestData.cached && !isNextComment) {
				content = requestData.cached.content;
				this.view.loadContentHtml(el, content);
				let id = this.view.getPopup().querySelector('._rcomments_comment').id;
				this.model.setCurrentListing(id);
				return;
			}

			this.executeCommentRequest(el, commentId, {
				url : requestData.url,
				data: requestData.params,
				timeout: 4000
			}).then(this.showComment.bind(this));
		},

		executeCommentRequest(el, commentId, parameters) {
			this.disableRequest = true;
			this.request = _request(parameters);
			return this.request.then(
				this.getCommentData(el, parameters.url, commentId).bind(this), // success
				this.handleCommentFail(el).bind(this) // failure
			);
		},

		getCommentData(el, url, commentId) {
			return (data) => {
				let commentData = this.model.registerComment(url, data, commentId);
				let isLastReply;
				if (commentData && commentData.kind === 'more') {
					// Sometimes, Reddit responds with a "more" thing rather than the
					// actual comment. We'll handle it by upping the limit parameter
					// on the request, which seems to force the "more" thing to expand
					// to actual comments
					return this.handleMoreThing(el, url, commentId, commentData);
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
					commentJson: commentData.json,
					commentId: commentData.json && commentData.json.id,
					url: url
				};
			};
		},

		handleMoreThing(el, url, commentId, responseData) {
			this.request.abort();
			let params = this.model.requestParams(url, commentId);
			params.commentIndex = params.limit - 2;
			params.limit++;
			this.model.commentStatus[this.model.genKey(url, commentId)] = params;
			return this.executeCommentRequest(el, commentId, {
				url : url,
				data: params,
				timeout: 4000
			}).then(this.showComment.bind(this));
		},

		showComment(data) {
			this.disableRequest = false;
			if (!data) {
				// Something went wrong earlier
				return;
			}
			let {commentJson, isLastReply, commentId, url, el} = data;
			this.view.show(el, commentJson, this.model.currentListing);
			this.view.updateParentComment(el, isLastReply);
			this.updateCache(url, commentId);
		},

		handleCommentFail(el) {
			return () => {
				this.view.handleError(el, 'Error: Reddit did not respond.');
				this.disableRequest = false;
			};
		},

		updateCache : function(url, commentId) {
			if (!commentId) return;

			this.model.cache(url, {
				content : this.view.contentHtml(),
				commentId
			});
		},

		handleAnchorMouseEnter : function(commentAnchor) {
			if (commentAnchor.text.split(' ').length <= 1) return;
			this.go = true;
			setTimeout(() => {
				if (this.go) this.renderCommentFromElement(commentAnchor, true);
			}, 250);
		},

		handleAnchorMouseLeave : function(e, commentAnchor) {
			let bbox = commentAnchor.getBoundingClientRect(),
				bottom = bbox.top + window.pageYOffset + bbox.height;

			this.go = false;
			// Do stuff only if exiting anchor not through comment.
			if (e.pageY >= bottom) return;
			this.request.abort();
			this.view.hidePopup();
		},

		handleVote : function(arrow) {
			if (!this.modhash) return;

			const VOTE_URL = '/api/vote/.json';

			let parentComment = getFirstParent(arrow, '.' + classed('comment')),
				id = parentComment && ('t1_' + parentComment.id),
				url = this.model.currentListing.permalink + '.json',
				commentId = getFirstParent(arrow, '.comment').id,
				data, dir;

			if (arrow.classList.contains('up')) dir = 1;
			else if (arrow.classList.contains('down')) dir = -1;
			else dir = 0;

			data = {
				id : id,
				dir : dir,
				uh : this.modhash
			};

			_request(VOTE_URL, {type: 'POST', data});
			Comment.applyVote(arrow.parentElement, dir);
			this.updateCache(url, commentId);
		}
	};

	rCommentsController.init();
})(window);