## Steps for Developing

### First, download and build the project
1. Clone repository.
2. `cd rComments/source`
3. `yarn install` - Install dependencies (download [yarn](https://yarnpkg.com/getting-started/install) if needed)
4. `yarn build` - This command creates a `./dist` directory, copies over all static files to it, and executes `webpack` to write script to it as well. `./dist` is the directory that Chrome/Firefox will read from when testing the extension.

### Secondly, load the extension to Chrome or Firefox
**Load in Chrome**
1. Go to [chrome://extensions](chrome://extensions)
2. Make sure "Developer Mode" is checked
3. Click "Load Unpacked Extension" 
4. Select repo's `rComments/src/dist` directory.
  
**Load in Firefox**
1. Follow instructions here: https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/

Done! At this point the browser will be using the addon using the files in `rComments/src/dist`
 
### Lastly, actually developing.
1. Run `yarn dev` - Will run `webpack --watch` which will write any changes to .js files to the dist folder (or complain if there are issues).
2. After doing a change, you must click "reload" in the browser extension tools to update the extension on the browser. After that your changes will live on reddit.com. 
