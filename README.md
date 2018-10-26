# Botcheck.me Chrome/Firefox/Safari Extension

A cross-browser extension that uses machine learning techniques to detect propaganda accounts on Twitter.

## Details

This extension uses [Vue.js](https://vuejs.org/) with [element](http://element.eleme.io) for UI components, along with [Vuex](https://vuex.vuejs.org/en/intro.html) to manage state.

## Architecture

The extension injects various Vue components into twitter, as well as one Vuex store.
A background script is used to listen for authentication, and another as a centralized point for interacting with the browser's storage.

The Vuex store is only accessible by the content scripts that have been injected into the same tab.

### Cross-browser support

Avoid calling `chrome.*` or similar APIs.
All browser extension API are to be done via  `xbrowser.js`, to abstract out differences between browsers. 
Chrome and Firefox have largely compatible extension API's, with some differences that are handled in [webextension-polyfill](https://github.com/mozilla/webextension-polyfill).

Safari is much more limited: background pages are not supported, so we rely on content scripts for everything. This means that certain things need special safari handling, but most of it is handled inside `xbrowser.js`
Certain things like opening a new tab need to happen in Swift-land, so the Safari JS achieves this by passing a message into the Swift handler: https://developer.apple.com/documentation/safariservices/safari_app_extensions/passing_messages_between_safari_app_extensions_and_injected_scripts

### Whitelist

The whitelist is managed both on the Twitter interface (whitelisting users) as well as on the extension popup (removing users from whitelist).

Synchronization between these two parts is achieved by storing changes on the browser.
Both sides use the browser storage as the source of truth for both fetching/updating the data and for listening for changes.

The content scripts keep an up to date version of the whitelist in the Vuex store, in order to quickly be able to check for the presence of a username.

## Development 

- Install npm
- Run  `npm i` to install local development deps 
- Run `npx gulp watch` - this uses gulp to watch your folders for changes and recompiles JS/less/etc

### on Chrome/Firefox 
The watch script outputs files into the `build` folder.
This is the folder you want to open in Chrome/Firefox to test the extension while developing.

### on Safari
- Open the Xcode project inside `safari`
- Make sure the watch command above is running
- `Cmd+R` to run the project
- Open safari, go to Develop > Enable unsigned extensions
- In safari, go to Preferences > Extensions and enable Botcheck.
 
## Deployment

### on Chrome/Firefox

- Update the version number in `src/manifest.json`
- Run `npx gulp dist`
- This outputs a zip file to `dist` which can be uploaded in the browser extension marketplaces.
- Commit changes to the manifest

### on Safari
- Make sure the JS/CSS is up to date `npx gulp build`
- Open the Xcode project inside `safari`
- Increment the build numbers for both the Botcheck and Botheck Extension build targets.
- Make sure you're logged in to the shared Apple Developer account in Xcode
- Click on Product > Archive to compile the build
- Clik on Distribute app, and follow steps to upload to to Mac App Store
- Finish app update submit process in iTunes Connect

## Further reading
* [Botcheck.me](https://botcheck.me)
