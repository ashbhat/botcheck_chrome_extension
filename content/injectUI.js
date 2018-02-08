function injectUI() {
  injectDialog();
  injectButtons();
}

function injectDialog() {
  let el = document.createElement('div');
  el.innerHTML = `
    <dialog-auth></dialog-auth>
    <dialog-results></dialog-results>
    <dialog-thanks></dialog-thanks>
  `;
  document.body.appendChild(el);
  new Vue({ el, store });
}

function injectButtons() {
  document.querySelectorAll('.tweet').forEach(processTweetEl);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(addedNode => {
        if (!addedNode.querySelectorAll) {
          return;
        }
        addedNode.querySelectorAll('.tweet').forEach(processTweetEl);
      });
    });
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  function processTweetEl(tweetEl) {
    if (
      !tweetEl.dataset ||
      !tweetEl.dataset.screenName ||
      tweetEl.dataset.botcheckInjected
    ) {
      return;
    }

    tweetEl.dataset.botcheckInjected = true;

    let el = document.createElement('span');
    el.innerHTML = `<button-check :tweet="tweet"></button-check>`;
    tweetEl.querySelector('.ProfileTweet-actionList').appendChild(el);

    new Vue({
      el,
      store,
      data() {
        return {
          tweet: tweetEl.dataset
        };
      }
    });
  }
}
