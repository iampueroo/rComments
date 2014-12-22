var Comment = function(json) {

	this.init = function(json) {
		this.data = json.data;
	};

	// Fuck this function.
	this.toHtml = function() {
		var d  = this.data;
		return '' +
			'<div class="comment thing" id=' + d.id + '>' +
				'<div class="tagline">' + d.author + '</div>' +
				'<div class="entry">' + d.body_html + '</div>' +
			'</div>';
	};

	this.init(json);
};

var rCommentsView = {
	$popup : null,

	show : function(json, $el) {
		var comment = new Comment(json),
			commentHtml = comment.toHtml(),
			popup = this.popup($el);
		popup.html(commentHtml);
		popup.show();
	},

	popup : function($el) {
		var $popup = this.$popup;

		if (!$popup) {
			$popup = $('<div/>', {id : this._popupId})
				.appendTo("body");
		}

		var offset = $el.offset(),
			height = $el.outerHeight();

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

		this.$popup = $popup;
		return $popup;
	},

	hidePopup : function() {
		this.$popup.hide();
	},
};

var rCommentsModel = {

	commentCache : {},
	commentStatus : {},

	getRequestData : function(url, commentId) {
		var key = this.genKey(url, commentId),
			params = this.requestParams(url, commentId);

			data = {
				url : url,
				params : params,
				cached : this.commentCache[key]
			};

		return data;
	},

	requestParams : function(url, commentId) {
		var key = this.genKey(url, commentId),
			params = this.commentStatus[key];

		if (!params) {
			params = {
				depth : (commentId ? 2 : 1),
				limit : 0, // Incremented below 
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
			json = this.extractJson(data, params);

		this.commentCache[key] = json;
		return json;
	},

	extractJson : function(data, params) {
		var isCommentReply = params.depth == 2,
			commentIndex = params.limit - 1,
			commentList = data[1]['data']['children'];

		if (isCommentReply) {
			commentList = commentList[0]['data']['replies']['data']['children'];
		}

		return commentList[commentIndex];
	},

	genKey : function(url, commentId) {
		return url + commentId;
	}
};

var rCommentsController = {

	model : rCommentsModel,
	view : rCommentsView,
	request : new XMLHttpRequest(),

	init : function() {
		var self = this;
		$('body')
			.on('mouseover', 'a.comments', function() {
				self.renderComment($(this));
			})
			.on('mouseleave', 'a.comments', function() {
				self.view.hidePopup();
			});
	},

	renderComment : function($el) {
		var self = this,
			url = $el.attr('href') + '.json',
			commentId = $el.closest('.thing').attr('id'), // this gonna break
			requestData = self.model.getRequestData(url, commentId),
			request = self.request,
			commentJson;

		request.abort();

		if (requestData.cached) {
			self.view.show(requestData.cached, $el);
			return;
		}

		request = $.getJSON(requestData.url, requestData.params).done(function(data) {
				commentJson = self.model.registerComment(requestData.url, data, commentId);
				self.view.show(commentJson, $el);
			});

		this.request = request;
	}
};

rCommentsController.init();