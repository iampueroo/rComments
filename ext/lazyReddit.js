// Note: these commits were done in an airplane with no internet
// so there is a very good chance it is broken right now.

var Comment = function(data) {

	init = function(json) {
		this.data = $.extend(json.data);
	};

	// Fuck this function.
	toHtml = function() {
		var d  = this.data;
		return '' +
			'<div class="comment">' +
				'<div class="tagline">' + d.author + '</div>' +
				'<div class="entry">' + d.body_html + '</div>' +
			'</div>';
	};
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
			url = $el.attr('href'),
			commentId = 412, // mocked for now.
			requestData = model.getRequestData(url, commentId),
			request = this.request;

		if (requestData.cached) {
			self.view.show(requestData.cached, el);
			return;
		}

		request.abort();

		request = $.getJSON(requestData).done(function(data) {
				var commentJson = self.model.registerComment(requestData.url, data);
				self.view.show(commentJson, $el);
			});

		this.request = request;
	}
};

var rCommentsView = {
	$popup : null,

	show : function(json, $el) {
		var comment = new Comment(json),
			html = comment.toHtml(),
			popup = this.pqopup($el);

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

	commentCache : [],
	commentStatus : [],

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

	cache : function(url, commentId, data) {
		this.commentCache[this.genKey(url, commentId)] = data;
	},

	genKey : function(url, commentId) {
		return url + commentId;
	}
};

rCommentsController.init();