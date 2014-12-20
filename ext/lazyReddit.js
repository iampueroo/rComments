var rCommentsController = {

	model : rCommentsModel,
	view : rCommentsView,
	request : new XMLHttpRequest(),

	init : function() {
		var self = this;
		$('body')
			.on('mouseover', 'a.comments', function() {
				self.showFirstComment($(this));
			})
			.on('mouseleave', 'a.comments', function() {
				self.view.hidePopup();
			});
	},

	showFirstComment : function($el) {
		var self = this,
			requestData = model.firstRequest($el),
			request = this.request;

		if (requestData.cached) {
			self.view.show(requestData.cached, el);
			return;
		}

		request.abort();

		request = $.getJSON(requestData).done(function(data) {
				self.view.show(data, $el);
				self.model.store(requestData.url, data);
			});

		this.request = request;
	}
};

var rCommentsView = {
	$popup : null,

	show : function(data, $el) {
		var commentHtml = this.toHtml(data),
			popup = this.popup($el);

		popup.html(commentHtml);
		popup.show();
	},

	toHtml : function(json) {
		var html = '' +
			'<div class="comment">' +
				'<div class="tagline">Username</div>' +
				'<div class="entry">This is a comment test</div>' +
			'</div>';
		return html;
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

	firstRequest : function($el) {
		var url = $el.attr('href') + '.json',
			data = {
				url : url,
				params : this.requestParams(url),
				cached : this.commentCache[url],
			};

		return data;
	},

	requestParams : function(url) {
		var params = this.commentStatus[url];

		// TODO: update comment status for replies, more comments
		if (!params) params = {
			limit : 1,
			depth : 1
		};

		params['sort'] = 'top';

		return params;
	},

	cache : function(url, data) {
		self.commentCache[url] = data;
	}
};

rCommentsController.init();