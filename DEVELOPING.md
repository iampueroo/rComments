1. Go to [chrome://extensions](chrome://extensions)
2. Make sure "Developer Mode" is checked
3. Click "Load Unpacked Extension" 
4. Select repo's `rComments/chrome` directory.

That's it! You'll need to re-upload the extension any time you make a change, but that can be done by refreshing the chrome://extensions page.

If you can (and remember to), run `npm run test` before commiting. It'll just run `eslint`. I'm going to add tests, but... none for now.
