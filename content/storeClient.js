Vue.use(Vuex);

let store = new Vuex.Store({
  state: {
    // Values inside the 'synced' object will be updated
    // from the background store automatically (see below)
    synced: {}
  },
  mutations: {
    // Called from incoming mutations from background script,
    // we sync our state with the background script's here.
    // This is what makes it feels like there is one
    // state tree among the background scripts
    // and all the content scripts.
    REMOTE_STATE_UPDATE(state, remoteState) {
      state.synced = remoteState;
    }
  }
});

// This is like vuex commit(), but gets sent to background script
store.broadcastMutation = function(name, args) {
  chrome.runtime.sendMessage({
    name: 'STATE_MUTATION',
    details: { name, args }
  });
};

// This is like vuex dispatch(), but gets sent to background script
store.broadcastAction = function(name, args) {
  chrome.runtime.sendMessage({
    name: 'STATE_ACTION',
    details: { name, args }
  });
};

// Listen for incoming state changes from the background, and commit
// them to our local store, thus giving the illusion of a unified data
// store across background and all tabs with our extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // console.log(request.name, request.payload);
  if (request.name === 'STATE_UPDATE') {
    store.commit('REMOTE_STATE_UPDATE', request.payload);
  } else if (request.name === 'STATE_INIT') {
    store.commit('REMOTE_STATE_UPDATE', request.payload);
    // Once the initial state arrives, inject the UI
    injectDialogs();
    injectButtons();
  }
});

// Ask background script for the initial state on startup
chrome.runtime.sendMessage({ name: 'STATE_INITIAL' });
