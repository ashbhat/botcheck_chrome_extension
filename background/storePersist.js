// Save api key to chrome storage when API key changes
store.subscribe((mutation, state) => {
  if (mutation.type === 'AUTH_APIKEY_SET' && mutation.payload) {
    chrome.storage.sync.set({ apiKey: mutation.payload });
  }
});

// Load api key from chrome storage on startup
chrome.storage.sync.get(null, state => {
  if (state.apiKey) {
    store.commit('AUTH_APIKEY_SET', state.apiKey);
  }
});
