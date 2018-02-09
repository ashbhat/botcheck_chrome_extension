// Subscribe to state updates on the store and send them down to tabs
store.subscribe((mutation, state) => {
  // console.log(mutation, state);
  chrome.tabs.sendMessage(state.clientTabId, {
    name: 'STATE_UPDATE',
    payload: state.synced
  });
});

// Listen to incoming messages from tabs
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // console.log(request.name, request.details);

  // We need to know which tab to send messages to,
  // so we store it in state when the client tab sends
  // a mutation or action
  store.commit('CLIENT_TAB_SET', sender.tab.id);

  if (request.name === 'STATE_MUTATION') {
    store.commit(request.details.name, request.details.args);
  } else if (request.name === 'STATE_ACTION') {
    store.dispatch(request.details.name, request.details.args);
  } else if (request.name === 'STATE_INITIAL') {
    chrome.tabs.sendMessage(sender.tab.id, {
      name: 'STATE_INIT',
      payload: store.state.synced
    });
  }
});
