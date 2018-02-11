let initialData = initData();

// This is a big serialized JSON object twitter puts onto the page
// We are just using it to get the current user's screen name
function initData() {
  if (!document.querySelector('#init-data')) {
    return;
  }

  let jsonData;

  try {
    jsonData = JSON.parse(document.querySelector('#init-data').value);
  } catch (ex) {
    errorHandler(ex);
  }

  return jsonData;
}

function injectButtons() {
  // This first tries to inject the buttons on tweets/profiles already on the page
  document.querySelectorAll('.tweet').forEach(processTweetEl);
  document.querySelectorAll('.ProfileHeaderCard, .ProfileCard').forEach(processProfileEl);

  // Then we set up an observer to do the same for any future tweets/profiles
  // that get added to the DOM because e.g. the user scrolled down or opened a tweet
  let observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(addedNode => {
        if (!addedNode.querySelectorAll) {
          return;
        }
        // Tweets
        addedNode.querySelectorAll('.tweet').forEach(processTweetEl);
        // Profile pages
        addedNode.querySelectorAll('.ProfileHeaderCard, .ProfileCard').forEach(processProfileEl);
        // Hover profiles
        if (addedNode.classList.contains('ProfileCard')) {
          processProfileEl(addedNode);
        }
      });
    });
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Process a Tweet and add the Botcheck button to it
function processTweetEl(tweetEl) {
  if (!tweetEl.dataset || !tweetEl.dataset.screenName || tweetEl.dataset.botcheckInjected) {
    return;
  }

  tweetEl.dataset.botcheckInjected = true;

  let screenName = getScreenNameFromElement(tweetEl);

  let el = document.createElement('span');
  el.innerHTML = '<button-check :screen-name="screenName"></button-check>';
  tweetEl.querySelector('.ProfileTweet-actionList').appendChild(el);

  new Vue({
    el,
    store,
    data() {
      return {
        screenName
      };
    }
  });
}

// Process a Profile and add the Botcheck button to it
function processProfileEl(profileEl) {
  if (!profileEl || profileEl.dataset.botcheckInjected) {
    return;
  }

  profileEl.dataset.botcheckInjected = true;

  let screenName = getScreenNameFromElement(profileEl);

  if (!screenName) return;

  // Skip putting button on own profile
  if (screenName === initialData.screenName) {
    return;
  }

  // Insert button below screen name
  let el = document.createElement('div');
  el.innerHTML = '<button-check :screen-name="screenName"></button-check>';
  profileEl
    .querySelector('.ProfileHeaderCard-screenname, .ProfileCard-screenname')
    .insertAdjacentElement('afterend', el);

  new Vue({
    el,
    store,
    data() {
      return {
        screenName
      };
    }
  });
}

// You can pass in a tweet or profile DOM node and get the screen name here
function getScreenNameFromElement(element) {
  if (!element) {
    return;
  }

  if (element.dataset && element.dataset.screenName) {
    return element.dataset.screenName;
  } else if (
    element.querySelector('[data-screen-name]') &&
    element.querySelector('[data-screen-name]').dataset.screenName
  ) {
    return element.querySelector('[data-screen-name]').dataset.screenName;
  }
}
