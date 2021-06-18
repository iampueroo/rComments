import * as Request from "../Request";
import {getCommentData} from "./commentFetcher";

test('getCommentData does not call ajax unnecessarily', () => {
    const requestMock = jest.spyOn(Request, '_request');
    requestMock.mockImplementation(() => Promise.resolve('success'));
    const options = {
        url: 'url',
        data: {
            depth: 1,
            limit: 1,
        }
    };
    return getCommentData(options)
        .then((result1) => {
            expect(result1).toBe('success');
            expect(requestMock).toHaveBeenCalledWith({
                url: 'url',
                data: {
                    depth: 1,
                    limit: 11,
                }
            });
            return getCommentData(options).then((result2) => {
                expect(result2).toBe('success');
                expect(requestMock).toHaveBeenCalledTimes(1);
                return result2;
            });
        })
        .then(() => {
            options.data.limit = 11;
            getCommentData(options).then(() => {
                expect(requestMock).toHaveBeenLastCalledWith({
                    url: 'url',
                    data: {
                        depth: 1,
                        limit: 21,
                    }
                });
                expect(requestMock).toHaveBeenCalledTimes(2);
            });
        });

})
