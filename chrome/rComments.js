(function() {

	function decodeHTML(html) {
		var txt = document.createElement("textarea");
		txt.innerHTML = html;
		return txt.value;
	}

	function getFirstParent(el, query) {
		if (!el.parentElement) {
			return;
		} else if (el.parentElement.matches(query)) {
			return el.parentElement;
		}
		return getFirstParent(el.parentElement, query)
	}

	function _formEncode(data) {
		var encodedString = '';
		for (key in data) {
			encodedString += key + '=' + data[key] + '&';
		}
		return encodedString.slice(0, -1);
	}
	// screw you jQuery
	function _request(url, options) {
		if (typeof url === 'object') {
			options = url;
			url = options.url;
		} else if (!options) {
			options = {};
		}
		var type = options.type || 'GET';
		var data = _formEncode(options.data || {});
		if (type === 'GET') {
			url += '?' + data;
			data = undefined;
		}

		var xhttp = new XMLHttpRequest();
		var promise = new Promise((resolve, reject) => {
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

	var Comment =  {

		prefix : '_rcomments_',
		nextReplyText : '&#8618 Next Reply',
		nextCommentText : '&#8595 Next Comment',
		isLoggedIn : false,

		getHtml : function(json) {
			if (!json || !json.id) return this.noReplyHtml();

			this.data = json;
			var d = this.data,
				commentHtml = '<div>' + decodeHTML(d.body_html) + '</div>',
				bodyHtml = '<div>' + commentHtml + '</div>',
				tagline = this.buildTagline(),
				arrows = this.arrows();

			var wrapperOpen = '<div id="'+d.id+'"" class="'+this.prefix+'comment comment thing">';

			var entry = '<div class="entry">'
				+ 	tagline
				+ 	bodyHtml
				+ 	this.nextReply(!!d.replies)
				+ 	'<div class="children"></div>'
				+ '</div>';
			return wrapperOpen + arrows + entry + '</div>';
		},

		noReplyHtml : function() {
			return '<div class="'+this.prefix+'comment comment thing">Oops, no more replies.</div>';
		},

		buildTagline : function() {
			return '<div class="tagline">' + this.authorTag() + this.voteTag() + '</div>';
		},

		voteTag : function() {
			var votes = this.data.ups - this.data.downs,
				unvoted = '<span class="score unvoted">' + votes + ' points</span>',
				likes = '<span class="score likes">' + (votes + 1)  + ' points</span>',
				dislikes = '<span class="score dislikes">' + (votes + 1) + ' points</span>';
			return '<span>' + dislikes + unvoted + likes + '</span>';
		},

		nextReply : function(hasChildren) {
			var _class = hasChildren ?  this.prefix + 'next_reply' : this.prefix + 'no_reply',
				html = hasChildren ? this.nextReplyText : 'No Replies';
			return '<div class="' + _class + '">' + html + '</div>';
		},

		authorTag : function() {
			var author = this.data.author;
			return '<a class="author" href="/user/' + author + '">' + author + '</a>';
		},

		arrows : function() {
			if (!this.isLoggedIn) return '';
			var score = this.data.ups - this.data.downs;
			var arrowDiv = document.createElement('div');
			var arrowUp = document.createElement('div');
			var arrowDown = document.createElement('div');
			arrowDiv.className = this.prefix + 'arrows unvoted';
			arrowUp.className = 'arrow up';
			arrowDown.className = 'arrow down';
			arrowDiv.appendChild(arrowUp);
			arrowDiv.appendChild(arrowDown);
			return this.applyVote(arrowDiv, this.data.likes).outerHTML;
		},

		applyVote : function(arrows, vote) {
			var upArrow = arrows.querySelector('.arrow.up, .arrow.upmod');
			var downArrow = arrows.querySelector('.arrow.down, .arrow.downmod');
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

	var rCommentsView = {
		popup : null,
		_id : '_rcomment_div',
		prefix : '_rcomments_',
		nextReplyText : '&#8618 Next Reply',
		nextCommentText : '&#8595 Next Comment',

		show : function(el, json) {
			var commentHtml = Comment.getHtml(json),
				popup,
				container;

			if (this.isFirstComment(el)) {
				var popup = this.popup(el);
				popup.querySelector('.' + this.prefix + 'content').innerHTML = commentHtml;
				popup.style.display = 'block';
			} else {
				var content = el.querySelector('._rcomments_content, .children');
				var loading = content.getElementsByClassName(this.prefix + 'loading')[0];
				if (loading) {
					loading.parentNode.removeChild(loading);
				}
				content.innerHTML = commentHtml + content.innerHTML;
			}
		},

		getPopup: function() {
			if (!this._popup) {
				var popup = document.createElement('div');
				var nextCommentDiv = document.createElement('div');
				var contentDiv = document.createElement('div');
				nextCommentDiv.className = this.prefix+'next_comment';
				nextCommentDiv.innerHTML = this.nextCommentText;
				contentDiv.className = this.prefix+'content';
				popup.id = this._id;
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
			var popup = this.getPopup();

			var nextCommentNone = popup.getElementsByClassName(this.prefix + 'next_comment_none')[0];
			if (nextCommentNone) {
				nextCommentNone.innerHTML = this.nextCommentText;
				nextCommentNone.classList = [this.prefix + 'next_comment'];
			}

			var clientRect = el.getBoundingClientRect();

			if (this.isFirstComment(el)) {
				var windowOffsetY = window.window.pageYOffset;
				var windowOffsetX = window.pageXOffset;
				var nextComment = popup.getElementsByClassName(this.prefix + 'next_comment')[0];
				if (nextComment) {
					nextComment.innerHTML = this.nextCommentText;
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
			var isFirst = this.isFirstComment(el);
			var loadingClasses = this.prefix + 'loading ' + this.prefix + 'comment comment thing';
			var loadingContent = '<div class="' + loadingClasses + '">' +
				'<span>Fetching comment...</span>' +
				'</div>';

			if (isFirst) {
				var popup = this.popup(el);
				popup.querySelector('.' + this.prefix + 'content').innerHTML = loadingContent;
				popup.style.display = 'block';
			} else {
				var children = el.querySelector('._rcomments_content, .children');
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

			var container;
			for (var i = 0; i < el.children.length; i++) {
				if (el.children[i].classList.contains('entry')) {
					container = el.children[i].querySelector('.' + this.prefix + 'next_reply');
					break;
				}
			}

			if (!container) {
				container = this._popup.querySelector('.' + this.prefix + 'next_comment');
			}

			if (container.classList.contains(this.prefix + 'next_comment')) {
				container.classList.remove(this.prefix + 'next_comment');
				container.classList.add(this.prefix + 'next_comment_none');
				container.innerHTML = 'No more Comments';
			} else {
				container.classList.remove(this.prefix + 'next_reply');
				container.classList.add(this.prefix + 'no_reply');
				container.innerHTML = 'No More replies';
			}
		},

		handleError : function(el) {
			var errorHtml = '<div>A timeout error occured.</div>';

			if (this.isFirstComment(el)) {
				this.popup(el).querySelector('.' + this.prefix + 'content').innerHTML = errorHtml;
			} else {
				var node = el.querySelector('._rcomments_content, .children');
				node.innerHTML = errorHtml + node.innerHTML;
				var loading = node.querySelector('.' + this.prefix + 'loading');
				if (loading) {
					loading.remove();
				}
			}
		}
	};

	var rCommentsModel = {

		listingCache : {},
		htmlCache : {},
		commentStatus : {},
		currentListing : {},

		getRequestData : function(url, commentId) {
			var params = this.requestParams(url, commentId);

			data = {
				url : url,
				params : params
			};

			if (!commentId) data.cached = this.cache(url);

			return data;
		},

		requestParams : function(url, commentId) {
			var key = this.genKey(url, commentId),
				params = this.commentStatus[key];

			if (!params) {
				params = {
					depth : (commentId ? 2 : 1),
					limit : (commentId ? 1 : 0), // Incremented below
					sort : 'top'
				};

				if (commentId) params.comment = commentId;
			}

			params.limit++;
			this.commentStatus[key] = params;

			return params;
		},

		registerComment : function(url, data, commentId) {
			var key = this.genKey(url, commentId),
				params = this.commentStatus[key],
				listingJson = this.extractListingJson(data),
				commentData = this.extractCommentData(data, params);

			if (!commentData) return;
			this.listingCache[commentData.json.id] = listingJson;
			this.currentListing = listingJson;

			return commentData;
		},

		extractListingJson : function(data) {
			return data[0]['data']['children'][0]['data'];
		},

		extractCommentData : function(data, params) {
			var isCommentReply = params.depth == 2,
				commentIndex = params.limit - 1,
				commentList = data[1]['data']['children'],
				hasMoreReplies, commentData;

			if (isCommentReply) {
				commentIndex--;
				commentList = commentList[0]['data']['replies']['data'];
				if (!commentList) return null; // Sometimes reddit lies to us. See below.
				commentList = commentList['children'];
			}

			// Reddit had replied to parent comment saying there were
			// more replies. They lied.
			if (!commentList[commentIndex]) {
				return null;
			}

			hasMoreReplies = !!commentList[commentIndex + 1]; // "More comments"

			return {
				json: commentList[commentIndex].data,
				isLastReply : !hasMoreReplies
			};
		},

		genKey : function(url, commentId) {
			url = this.cleanUrl(url);
			return commentId ? url + commentId : url;
		},

		getUrl : function(commentId) {
			var listing = this.listingCache[commentId];
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

	var rCommentsController = {

		model : rCommentsModel,
		view : rCommentsView,
		request : new XMLHttpRequest(),
		go : false,
		disableRequest : false,

		init : function() {
			var popup = this.view.getPopup();

			_request('/api/me.json').then((response) => {
				if (!response.data) return;
				this.modhash = response.data.modhash;
				Comment.isLoggedIn = true; // Sure... this works.
			})

			var firstLink = document.querySelector('.sitetable .title.loggedin');
			if (firstLink && firstLink.target === '_blank') {
				Comment.openInNewWindow = true;
			}

			popup.addEventListener('click', (e) => {
				if (e.target.className === '_rcomments_next_reply') {
					this.renderComment(e.target.parentElement.parentElement);
				} else if (e.target.className === '_rcomments_next_comment') {
					this.renderComment(e.target.parentElement);
				} else if (e.target.classList && e.target.classList[0] === 'arrow') {
					e.stopImmediatePropagation();
					this.handleVote(e.target);
				}
				return false;
			});

			var active = false;
			document.body.addEventListener('mousemove', (e) => {
				var commentAnchors = e.path.filter(function(n) {
					return n && n.nodeName == 'A' && n.classList && n.classList.contains('comments');
				});
				if (commentAnchors.length === 1 && (!active || active.href !== commentAnchors[0].href)) {
					// Hovering over anchor for the first tme
					active = commentAnchors[0];
					this.handleAnchorMouseEnter(active);
				} else if (active && commentAnchors.length === 0) {
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

		renderComment : function(el, init) {
			if (this.disableRequest) return;
			var self = this,
				request = self.request,
				commentId = !init && this.findClosestThing(el).id,
				url = (el.href || self.model.getUrl(commentId)) + '.json',
				isNextComment = el.id === '_rcomment_div',
				commentData, commentJson, isLastComment, content;

			var requestData = self.model.getRequestData(url, commentId);

			self.view.loading(el);
			request.abort();

			if (requestData.cached && !isNextComment) {
				content = requestData.cached.content;
				self.view.loadContentHtml(el, content);
				var id = self.view.getPopup().querySelector('._rcomments_comment').id;
				self.model.setCurrentListing(id);
				return;
			}

			self.disableRequest = true;
			request = _request({
				url : requestData.url,
				data: requestData.params,
				timeout: 4000
			});
			request.then(function(data) {
				commentData = self.model.registerComment(requestData.url, data, commentId);
				isLastReply = true;

				if (commentData) {
					commentJson = commentData.json;
					isLastReply = commentData.isLastReply;
					commentId = commentData.json.id; // Different value.
				}

				self.view.show(el, commentJson);
				self.view.updateParentComment(el, isLastReply);
				self.updateCache(requestData.url, commentId);
				self.disableRequest = false;
			}, function() {
				self.view.handleError(el);
				self.disableRequest = false;
			});
			this.request = request;
		},

		updateCache : function(url, commentId) {
			if (!commentId) return;

			this.model.cache(url, {
				content : this.view.contentHtml(),
				commentId : commentId
			});
		},

		handleAnchorMouseEnter : function(commentAnchor) {
			var self = this;

			if (commentAnchor.text.split(' ').length <= 1) return;

			self.go = true;
			setTimeout(function() {
				if (self.go) self.renderComment(commentAnchor, true);
			}, 250);
		},

		handleAnchorMouseLeave : function(e, commentAnchor) {
			var bbox = commentAnchor.getBoundingClientRect(),
				bottom = bbox.top + window.pageYOffset + bbox.height;

			this.go = false;
			// Do stuff only if exiting anchor not through comment.
			if (e.pageY >= bottom) return;
			this.request.abort();
			this.view.hidePopup();
		},

		handleVote : function(arrow) {
			if (!this.modhash) return;

			var VOTE_URL = '/api/vote/.json';

			var parentComment = getFirstParent(arrow, '.' + this.view.prefix + 'comment'),
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
})();