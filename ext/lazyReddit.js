var rCommentsController = {

	model : rComments,
	view : rCommentsView,

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
			$request = model.firstRequest($el);

		$request.done(function(data) {
			self.view.show(data, $el);
			self.model.store(data, $el);
		});
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

var rComments = {

	commentCache : [],
	commentStatus : [],

	firstRequest : function($el) {
		var self = this,
			url = $el.attr('href') + '.json';
			cached = this.commentCache[url];

		if (cached) return cached;

		var params = this.requestParams(url);

		return $.post(url, params).done(function(data) {
			self.commentCache[url] = data;
			self.commentStatus[url] = {
				limit : 1,
				depth : 1
			};
		});
	},

	requestParams : function(url) {
		var status = this.commentStatus[url],
			limit = 1,
			depth = 1;

		if (status) {
			//
			// Change based on reply / next question.
		}

		return {
				limit : limit,
				depth : depth,
				sort : 'top',
			};
	},


};

rCommentsController.init();