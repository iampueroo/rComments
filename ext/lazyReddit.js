var Comment = function(json) {

	this.prefix = '_lazy_comments_';

	this.init = function(json) {
		this.data = json.data;
	};

	// Fuck this function.
	this.toHtml = function() {
		var d = this.data,
			$commentHtml = $($('<div>').html(d.body_html).text()), // html entity weirdness
			$bodyHtml = $('<div>').addClass('entry').append($commentHtml),
			$tagline = this.buildTagline();

		var $wrapper = $('<div>')
			.attr('id', d.id)
			.addClass(this.prefix + 'comment ')
			.addClass('comment thing');

		$wrapper
			.append($tagline)
			.append($bodyHtml)
			.append($('<div>').addClass('children')) // Children container
			.append(this.nextReply());

		return $wrapper;
	};

	this.buildTagline = function() {
		var $wrapper = $('<div>').addClass('tagline');

		$wrapper
			.append(this.authorTag())
			.append(this.voteTag());

		return $wrapper;
	};

	this.voteTag = function() {
		var votes = this.data.ups - this.data.downs,
			$wrapper = $('<span>'),
			$unvoted = $('<span>').addClass('score unvoted').html(votes + ' points'),
			$likes = $('<span>').addClass('score likes').html((votes + 1)  + ' points'),
			$dislikes = $('<span>').addClass('score dislikes').html((votes + 1) + ' points');

		$wrapper.append($dislikes).append($unvoted).append($likes);

		return $wrapper;
	};

	this.nextReply = function() {
		return $('<div class="' + this.prefix + 'next_reply">See Next Reply</div>');
	};

	this.authorTag = function() {
		var author = this.data.author;
		return $('<a>')
			.attr('href', '/user/' + author)
			.addClass('author')
			.html(author);
	};

	this.init(json);
};

var rCommentsView = {
	$popup : null,
	_id : '_lazy_comment_div',
	prefix : '_lazy_comments_',


	show : function($el, json) {
		var comment = new Comment(json),
			commentHtml = comment.toHtml(),
			container;

		if (this.isFirstComment($el)) {
			popup = this.popup($el);
			popup.find('.' + this.prefix + 'content').html(commentHtml);
		} else {
			$el.find('._lazy_comments_content, .children').first()
				.append(commentHtml)
				.find('.' + this.prefix + 'loading').remove();
		}

		popup.show();
	},

	popup : function($el) {
		var $popup = this.$popup;

		if (!$popup) {
			$popup = $('<div>', {id : this._id})
				.append($('<div>').addClass(this.prefix + 'content'))
				.append($('<div>')
					.html('Next Comment')
					.addClass(this.prefix + 'next_comment'));

			$popup.appendTo("body");
		}

		var offset = $el.offset(),
			height = $el.outerHeight();

		if (this.isFirstComment($el)) {
			$popup.css({
					'position' : 'absolute',
					'top' : offset.top + height + "px",
					'left' : offset.left,
					'max-width' : '500px',
					'background' : '#fff',
					'padding' : '0px',
					'border' : '1px solid #777',
					'z-index' : '99'
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
				.append('<span>Fetching comment...</span>');

		if (isFirst) {
			popup = this.popup($el);
			popup.find('.' + this.prefix + 'content').html($loadingEl);
			popup.show();
		} else {
			$el.find('._lazy_comments_content, .children').first().append($loadingEl);
		}
	}
};

var rCommentsModel = {

	listingCache : {},
	commentCache : {},
	commentStatus : {},
	currentListing : {},

	getRequestData : function(url, commentId) {
		var key = this.genKey(url, commentId),
			params = this.requestParams(url, commentId);

			data = {
				url : url,
				params : params
				// cached : this.commentCache[key]
			};

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
			commentJson = this.extractCommentJson(data, params);

		this.listingCache[commentJson.data.id] = listingJson;
		this.commentCache[key] = commentJson;
		this.currentListing = listingJson;

		return commentJson;
	},

	extractListingJson : function(data) {
		return data[0]['data']['children'][0]['data'];
	},

	extractCommentJson : function(data, params) {
		var isCommentReply = params.depth == 2,
			commentIndex = params.limit - 1,
			commentList = data[1]['data']['children'];

		if (isCommentReply) {
			commentIndex--;
			commentList = commentList[0]['data']['replies']['data']['children'];
		}

		return commentList[commentIndex];
	},

	genKey : function(url, commentId) {
		url = url.slice(url.indexOf('/r/')); // Ok now I'm getting sloppy.
		return commentId ? url + commentId : url;
	},

	getUrl : function(commentId) {
		var listing = this.listingCache[commentId];

		return listing ? listing.permalink : this.currentListing.permalink;
	}
};

var rCommentsController = {

	model : rCommentsModel,
	view : rCommentsView,
	request : new XMLHttpRequest(),
	go : false,

	init : function() {
		var self = this;

		$('body')
			.on('mouseenter', 'a.comments', function() {
				var $this = $(this);
				self.go = true;
				setTimeout(function() {
					if (self.go) self.renderComment($this);
				}, 250);
			})
			.on('mouseleave', 'a.comments', function(e) {
				self.handleAnchorMouseLeave(e, this);
			})
			.on('mouseleave', '#' + self.view._id, function() {
				self.request.abort();
				self.view.hidePopup();
			})
			.on('click', '._lazy_comments_next_reply', function() {
				self.renderComment($(this).parents('.comment').first());
			})
			.on('click', '._lazy_comments_next_comment', function() {
				self.renderComment($(this).parent());
			});
	},

	renderComment : function($el) {
		var self = this,
			request = self.request,
			commentId = $el.closest('.thing').attr('id'),
			url = ($el.attr('href') || self.model.getUrl(commentId)) + '.json',
			commentJson;

		var requestData = self.model.getRequestData(url, commentId);

		self.view.loading($el);

		request.abort();

		if (requestData.cached) {
			self.view.show($el, requestData.cached);
			return;
		}

		request = $.getJSON(requestData.url, requestData.params).done(function(data) {
				commentJson = self.model.registerComment(requestData.url, data, commentId);
				self.view.show($el, commentJson);
			});

		this.request = request;
	},

	handleAnchorMouseLeave : function(e, commentAnchor) {
		var $commentAnchor = $(commentAnchor),
			bottom = $commentAnchor.offset().top + $commentAnchor.outerHeight();

		this.go = false;
		// Do stuff only if exiting anchor not through comment.
		if (e.pageY >= bottom) return;

		this.request.abort();
		this.view.hidePopup();
	}
};

rCommentsController.init();