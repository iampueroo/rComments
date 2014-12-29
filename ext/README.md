rComments
=========

Quick and hassle-free traversal of Reddit comments

## Preview
![Preview of rComments Extension](http://i.imgur.com/sxInTK1.gif)

## Summary
rComments lets Redditors traverse through comments and their replies directly from the front pages of any subreddit. By hovering over the comments link, rComments creates a popup that then the user interacts with to see more comments and replies, as well as upvote and downvote them. 

The initial idea, and the 'hooking' of the inital anchor tags and the display of the first top comment comes directly from [hamstu's reddit-top-comment](https://github.com/hamstu/reddit-top-comment). Initially this project began as a fork of the repo, but I ended up starting this final version from scratch, using hamstu's code for the initial hook of the elements. 



## Installation

First, you need to download a local copy of the repo. You can:

    cd ~
    mkdir rCommentsExtension
    cd rCommentsExtension
    git clone git@github.com:iampueroo/rComments.git

or download the zip by clicking the button on the right.

Then in Chrome, 

1) Browse to 'chrome://extensions'

2) Be sure to check Developer Mode in the top right corner

3) Click Load Unpacked extension... and choose the ~/chrome-ext/reddit-top-comment/ext directory

## License
Honestly I clicked MIT license because of choosealicense.com's description, not really sure what it all means for sure. But go crazy! It definitely needs improvements (this is my first deep exploration of JavaScript).  
