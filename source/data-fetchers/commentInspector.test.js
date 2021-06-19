import {extractAllComments, extractCommentData, extractListingJson} from "./commentInspector";
import comment from '../test/mocks/comment.json';

test('extract listing json', () => {
    const listing = extractListingJson(comment);
    expect(listing).toBeTruthy();
    expect(listing.title).toBe('Dubravka save vs Isak 71’ [UEFA EURO 2020]');
    expect(listing.subreddit).toBe('soccer');
});

test('extract first comment json from a list', () => {
    const extractedCommentData = extractCommentData(comment, {
       commentIndex: 0,
       depth: 2,
        limit: 12,
        sort: "top",
    });
    expect(extractedCommentData).not.toBeNull();
    expect(extractedCommentData.json.id).toBe('h27p6o1');
    expect(extractedCommentData.json.body).toBe("Yeah, lad was riding tackles like it was the 80s out there.");
    expect(extractedCommentData.isLastReply).toBe(false);
});

test('extract last comment json from a list', () => {
    const extractedCommentData = extractCommentData(comment, {
        commentIndex: 2,
        depth: 2,
        limit: 12,
        sort: "top",
    });
    expect(extractedCommentData).not.toBeNull();
    expect(extractedCommentData.json.id).toBe('h29f5e2');
    expect(extractedCommentData.json.body).toBe("Was an impressive save but yeah isak was out there playing with defenders like Neymar at Santos");
    expect(extractedCommentData.isLastReply).toBe(true);
});

test('handle asking for comment json that does not exist', () => {
    const extractedCommentData = extractCommentData(comment, {
        commentIndex: 3,
        depth: 2,
        limit: 12,
        sort: "top",
    });
    expect(extractedCommentData).toBeNull();
});

test('handle extracting all comments', () => {
    const list = extractAllComments(comment, {
        commentIndex: 3,
        depth: 2,
        limit: 12,
        sort: "top",
    });

    expect(list.map(ecd => ecd.json.id)).toEqual(["h27p6o1", "h27qd3a", "h29f5e2"]);
    expect(list[1].isLastReply).toBe(false);
    expect(list[2].isLastReply).toBe(true);

})