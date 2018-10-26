
// Global namespace to keep things organized
window.BC = {};

// Enum of message types.
BC.backgroundMessageTypes = {
  openNewTab: 'botcheck-open-new-tab',
  storageQueueUpdate: 'botcheck-storage-queue-update'
};

// This is so that browser-polyfill.js doesn't error out in Safari.
// With this line, in safari loading that script won't do anything but at least it loads.
window.chrome = window.chrome || {};

// TODO rename
const botcheckConfig = { // eslint-disable-line no-unused-vars
  // API for production: 'https://botcheck2-dot-surfsafe-rbl.appspot.com',
  // API for development: 'https://botcheckdummy-dot-surfsafe-rbl.appspot.com'
  // When changing this value, make sure to also change it in manifest.json's permissions
  apiRoot: 'https://botcheck2-dot-surfsafe-rbl.appspot.com'
};
