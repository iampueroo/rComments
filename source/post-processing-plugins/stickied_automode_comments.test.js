import stickied_automod_comment from "./stickied_automod_comment";

test('sticked automod executes when it should', () => {
    const responseData = {
        url: 'url',
     commentJson: {
         stickied: true,
         distinguished: 'moderator'
     },
        isLastReply: false,
    };
    expect(stickied_automod_comment.doesApply(responseData, {}))
        .toBe(true);
    responseData.isLastReply = true;
    expect(stickied_automod_comment.doesApply(responseData, {}))
        .toBe(false);
    responseData.isLastReply = false;
    responseData.commentJson.stickied = false;
    expect(stickied_automod_comment.doesApply(responseData, {}))
        .toBe(false);
    responseData.commentJson.stickied = true;
    responseData.commentJson.distinguished = '';
    expect(stickied_automod_comment.doesApply(responseData, {}))
        .toBe(false);
});

test('stickied automod behavior is correct', () => {
    const nextCommentResponse = {
        success: true,
        el: {},
        isLastReply: true,
        url: 'url',
        commentJson: {},
        commentId: '',
    };
    const responseData = {
        url: 'url',
        commentJson: {
            stickied: true,
            distinguished: 'moderator'
        },
        isLastReply: false,
    };
    const spy = {
        view: {
            loading: () => {},
            getPopup: () => {},
        },
        model: {
            commentStatus: {
                getNextCommentRequestParameters: () => {},
            },
        },
        executeCommentRequest: () => {
            return Promise.resolve(nextCommentResponse);
        },
        showComment: () => {},
    };
    const executeSpy = jest.spyOn(spy, 'executeCommentRequest');
    const showCommentSpy = jest.spyOn(spy, 'showComment');
    stickied_automod_comment.execute.call(spy, responseData, {})
        .then(() => {
            expect(true).toBeTruthy();
            expect(executeSpy).toHaveBeenCalledTimes(1);
            expect(showCommentSpy).toHaveBeenCalledWith(nextCommentResponse)
        });

});
