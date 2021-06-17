import Store from "./Store";

test('simple Store test', () => {
    const store = new Store();
    expect(store.getRequestParameters('url', 'commentId')).toBeNull();
    store.updateRequestParameters('url', 'commentId', {
        depth: 1,
    });
    const value = store.getRequestParameters('url', 'commentId');
    expect(value).not.toBeNull();
    expect(value.depth).toBe(1);
    value.depth++;
    // Ensure the object itself isn't returned
    expect(store.getRequestParameters('url', 'commentId').depth).toBe(1);
    // Ensure genkey is working propertly
    expect(store.getRequestParameters('url')).toBeNull();
    expect(store.getCachedHtml('url')).toBe(null);
    store.setCachedHtml('url', 'my-html');
    expect(store.getCachedHtml('url')).toBe('my-html');
    store.setCachedHtml('url', 'different-html');
    expect(store.getCachedHtml('url')).toBe('different-html');
});

test('simple initial params test', () => {
    // This test needs to be moved higher up, we should test the request param CHANGES as instead
    // of these getters and setters
    const initialParamsForListing = Store.getInitialRequestParameters();
    expect(initialParamsForListing).not.toBeNull();
    expect(initialParamsForListing.comment).toBeUndefined();
    const initialParamsForComment = Store.getInitialRequestParameters('commentId');
    expect(initialParamsForComment.comment).toBe('commentId');
});

test('getting next comment for first comment (no parent) and beyond', () => {
    const store = new Store();
    const requestParameters = store.getNextCommentRequestParameters('url');
    expect(requestParameters).toEqual({
        commentIndex: 0,
        depth: 1,
        limit: 1,
        sort: "top"
    });
    store.updateRequestParameters('url', null, requestParameters);
    const nextRequestParams = store.getNextCommentRequestParameters('url');
    expect(nextRequestParams).toEqual({
        commentIndex: 1,
        depth: 1,
        limit: 2,
        sort: "top"
    });
});

test('getting next comment for first reply', () => {
    const store = new Store();
    const requestParameters = store.getNextCommentRequestParameters('url' ,'commentId');
    expect(requestParameters).toEqual({
        comment: "commentId",
        commentIndex: 0,
        depth: 2,
        limit: 2,
        sort: "top"
    });
    store.updateRequestParameters('url', 'commentId', requestParameters);
    const nextRequestParams = store.getNextCommentRequestParameters('url', 'commentId');
    expect(nextRequestParams).toEqual({
        comment: "commentId",
        commentIndex: 1,
        depth: 2,
        limit: 3,
        sort: "top"
    });
});
