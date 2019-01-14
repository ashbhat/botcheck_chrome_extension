
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
