(function() {
	var _formEncode = function(data) {
		var encodedString = '';
		for (key in data) {
			encodedString += key + '=' + data[key] + '&';
		}
		return encodedString.slice(0, -1);
	}
	// screw you jQuery
	var _request = function(url, options) {
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
		var promise = new Promise(function(resolve, reject) {
			xhttp.onreadystatechange = function() {
				if (xhttp.readyState === 4 && xhttp.status == 200) {
					resolve(JSON.parse(xhttp.responseText));
				} else if (xhttp.readyState === 4) {
					reject();
				}
			}
			xhttp.ontimeout = function() {
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
			if (!json) return this.noReplyHtml();

			this.data = json;

			var d = this.data,
				$commentHtml = $($('<div>').html(d.body_html).text()), // html entity weirdness
				$bodyHtml = $('<div>').append($commentHtml),
				$tagline = this.buildTagline(),
				$wrapper, $entry;

			$wrapper = $('<div>')
				.attr('id', d.id)
				.addClass(this.prefix + 'comment comment thing');

			$entry = $('<div>')
				.addClass('entry')
				.append($tagline)
				.append($bodyHtml)
				.append(this.nextReply(!!d.replies))
				.append($('<div>').addClass('children'));

			return $wrapper.append(this.arrows()).append($entry);
		},

		noReplyHtml : function() {
			return $('<div>')
				.addClass(this.prefix + 'comment comment thing')
				.html('Oops, no more replies.');
		},

		buildTagline : function() {
			var $wrapper = $('<div>').addClass('tagline');

			$wrapper
				.append(this.authorTag())
				.append(this.voteTag());

			return $wrapper;
		},

		voteTag : function() {
			var votes = this.data.ups - this.data.downs,
				$wrapper = $('<span>'),
				$unvoted = $('<span>').addClass('score unvoted').html(votes + ' points'),
				$likes = $('<span>').addClass('score likes').html((votes + 1)  + ' points'),
				$dislikes = $('<span>').addClass('score dislikes').html((votes + 1) + ' points');

			$wrapper.append($dislikes).append($unvoted).append($likes);

			return $wrapper;
		},

		nextReply : function(hasChildren) {
			var _class = hasChildren ?  this.prefix + 'next_reply' : this.prefix + 'no_reply',
				html = hasChildren ? this.nextReplyText : 'No Replies';

			return $('<div>').addClass(_class).html(html);
		},

		authorTag : function() {
			var author = this.data.author;
			return $('<a>')
				.attr('href', '/user/' + author)
				.addClass('author')
				.html(author);
		},

		arrows : function() {
			if (!this.isLoggedIn) return $();

			var score = this.data.ups - this.data.downs,
				$arrows = $('<div>').addClass(this.prefix + 'arrows unvoted')
					.append($('<div>').addClass('arrow up'))
					.append($('<div>').addClass('arrow down'));

			return this.handleVote($arrows, this.data.likes);
		},

		handleVote : function($arrows, vote) {
			// Reset - gross, could find a better way of doing this.
			$arrows.removeClass('unvoted likes dislikes');
			$arrows.find('.arrow.up, .arrow.upmod').removeClass('upmod').addClass('up');
			$arrows.find('.arrow.down, .arrow.downmod').removeClass('downmod').addClass('down');

			// Switch statement with boolean cases? #yolo(?)
			switch(vote) {
				case 1:
				case true:
					$arrows.addClass('likes');
					$arrows.find('.up').removeClass('up').addClass('upmod');
					break;
				case -1:
				case false:
					$arrows.addClass('dislikes');
					$arrows.find('.down').removeClass('down').addClass('downmod');
					break;
				default:
					$arrows.addClass('unvoted');
					$arrows.find('.score').addClass('unvoted');
			}

			return $arrows;
		}
	};

	var rCommentsView = {
		$popup : null,
		_id : '_rcomment_div',
		prefix : '_rcomments_',
		nextReplyText : '&#8618 Next Reply',
		nextCommentText : '&#8595 Next Comment',

		show : function($el, json) {
			var commentHtml = Comment.getHtml(json),
				container;

			if (this.isFirstComment($el)) {
				popup = this.popup($el);
				popup.find('.' + this.prefix + 'content').html(commentHtml);
			} else {
				$el.find('._rcomments_content, .children').first()
					.prepend(commentHtml)
					.find('.' + this.prefix + 'loading').remove();
			}

			popup.show();
		},

		getPopup: function() {
			if (!this.$popup) {
				this.$popup = $('<div>', {id : this._id})
					.append($('<div>')
						.html(this.nextCommentText)
						.addClass(this.prefix + 'next_comment'))
					.append($('<div>').addClass(this.prefix + 'content'));
				this.$popup.appendTo('body');
			}
			return this.$popup;
		},

		popup : function($el) {
			var $popup = this.getPopup();

			$popup.find('.' + this.prefix + 'next_comment_none').html(this.nextCommentText)
				.removeClass().addClass(this.prefix + 'next_comment');

			var offset = $el.offset(),
				height = $el.outerHeight();

			if (this.isFirstComment($el)) {
				$popup.find('.' + this.prefix + 'next_comment').html(this.nextCommentText);
				$popup.css({
						'top' : offset.top + height + 'px',
						'left' : offset.left,
					});
			}

			this.$popup = $popup;
			return $popup;
		},

		hidePopup : function() {
			if (this.$popup) this.$popup.hide();
		},

		isFirstComment : function($el) {
			return $el.is('a');
		},

		loading : function($el) {
			var isFirst = this.isFirstComment($el),
				$loadingEl = $('<div>')
					.addClass(this.prefix + 'loading')
					.addClass(this.prefix + 'comment comment thing')
					.append('<span>Fetching comment...</span>');

			if (isFirst) {
				var popup = this.popup($el);
				popup.find('.' + this.prefix + 'content').html($loadingEl);
				popup.show();
			} else {
				$el.find('._rcomments_content, .children').first().prepend($loadingEl);
			}
		},

		loadContentHtml : function($el, content) {
			this.popup($el).html(content);
		},

		contentHtml : function() {
			return this.$popup.html();
		},

		updateParentComment : function($el, isLastReply) {
			if (!isLastReply) return;

			var container = $el.find('> .entry > .' + this.prefix + 'next_reply').first();

			if (!container.length) container = this.$popup.find('.' + this.prefix + 'next_comment').first();

			if (container.hasClass(this.prefix + 'next_comment')) {
				container
					.removeClass(this.prefix + 'next_comment')
					.addClass(this.prefix + 'next_comment_none')
					.html('No more Comments');
			} else {
				container
					.removeClass(this.prefix + 'next_reply')
					.addClass(this.prefix + 'no_reply')
					.html('No More replies');
			}
		},

		handleError : function($el) {
			var errorHtml = $('<div>A timeout error occured.</div>');

			if (this.isFirstComment($el)) {
				popup = this.popup($el);
				popup.find('.' + this.prefix + 'content').html(errorHtml);
			} else {
				$el.find('._rcomments_content, .children').first()
					.prepend(errorHtml)
					.find('.' + this.prefix + 'loading').remove();
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
			var self = this;

			_request('/api/me.json').then(function(response) {
				if (!response.data) return;
				self.modhash = response.data.modhash;
				Comment.isLoggedIn = true; // Sure... this works.
			});

			this.view.getPopup()
				.on('click', '._rcomments_next_reply', function() {
					self.renderComment($(this).parents('.comment').first());
				})
				.on('click', '._rcomments_next_comment', function() {
					self.renderComment($(this).parent());
				})
				.on('click', '._rcomments_arrows .arrow', function(e) {
					self.handleVote(this);
					e.stopImmediatePropagation();
				});

			$('body')
				.on('mouseenter', 'a.comments', function() {
					self.handleAnchorMouseEnter(this);
				})
				.on('mouseleave', 'a.comments', function(e) {
					self.handleAnchorMouseLeave(e, this);
				})
				.on('mouseleave', '#' + self.view._id, function() {
					self.request.abort();
					self.view.hidePopup();
				})
		},

		renderComment : function($el, init) {
			if (this.disableRequest) return;

			var self = this,
				request = self.request,
				commentId = !init && $el.closest('.thing').attr('id'),
				url = ($el.attr('href') || self.model.getUrl(commentId)) + '.json',
				isNextComment = $el.is('#_rcomment_div'),
				commentData, commentJson, isLastComment, content;

			var requestData = self.model.getRequestData(url, commentId);

			self.view.loading($el);
			request.abort();

			if (requestData.cached && !isNextComment) {
				content = requestData.cached.content;
				self.view.loadContentHtml($el, content);
				self.model.setCurrentListing($(content).find('._rcomments_comment').attr('id'));
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

				self.view.show($el, commentJson);
				self.view.updateParentComment($el, isLastReply);
				self.updateCache(requestData.url, commentId);
				self.disableRequest = false;
			}, function() {
				self.view.handleError($el);
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
			var self = this,
				$commentAnchor = $(commentAnchor);

			if ($commentAnchor.html().split(' ').length <= 1) return;

			self.go = true;
			setTimeout(function() {
				if (self.go) self.renderComment($commentAnchor, true);
			}, 250);
		},

		handleAnchorMouseLeave : function(e, commentAnchor) {
			var $commentAnchor = $(commentAnchor),
				bottom = $commentAnchor.offset().top + $commentAnchor.outerHeight();

			this.go = false;
			// Do stuff only if exiting anchor not through comment.
			if (e.pageY >= bottom) return;
			this.request.abort();
			this.view.hidePopup();
		},

		handleVote : function(arrow) {
			if (!this.modhash) return;

			var VOTE_URL = '/api/vote/.json';

			var $arrow = $(arrow),
				id = 't1_' + $arrow.parents('.' + this.view.prefix + 'comment').first().attr('id'),
				url = this.model.currentListing.permalink + '.json',
				commentId = $arrow.parents('comment').first().attr('id'),
				data, dir;

			if ($arrow.hasClass('up')) dir = 1;
			else if ($arrow.hasClass('down')) dir = -1;
			else dir = 0;

			data = {
				id : id,
				dir : dir,
				uh : this.modhash
			};
			$.post(VOTE_URL, data);
			Comment.handleVote($arrow.parent(), dir);
			this.updateCache(url, commentId);
		}
	};

	rCommentsController.init();
})();