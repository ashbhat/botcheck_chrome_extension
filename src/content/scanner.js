/**
 * /content/scanner.js
 *
 * Utility object for handling the Twitter DOM.
 */

let botcheckCacheUsername;

const botcheckScanner = {

  // This is a big serialized JSON object twitter puts onto the page
  // We are just using it to get the current user's screen name
  getUsername: () => {
    if (botcheckCacheUsername) {
      return botcheckCacheUsername;
    }
    if (!document.querySelector('#init-data')) {
      return;
    }

    let jsonData;
    try {
      jsonData = JSON.parse(document.querySelector('#init-data').value);
    } catch (ex) {
      console.error(ex);
      // botcheckUtils.errorHandler(ex);
    }

    botcheckCacheUsername = jsonData.screenName;
    return botcheckCacheUsername;
  },

  injectButtons: () => {
    // Process tweets already on the page
    botcheckScanner.processFeedTweets();
    document.querySelectorAll('.tweet.permalink-tweet').forEach((tweet) => {
      const result = botcheckScanner.processTweetEl(tweet, { isPermalink: true });
      store.dispatch('SCAN', {
        deepScan: true,
        realName: result.realName,
        username: result.username
      });
    });

    // Process profile element if present on the page
    botcheckScanner.getSmallUserCards().forEach((card) => {
      botcheckScanner.processProfileEl(card, { isProfile: false, isSmallProfile: true });
    });
    document.querySelectorAll('.ProfileHeaderCard, .ProfileCard').forEach((card) => {
      let isProfile = false;
      if (card.parentElement.classList.contains('ProfileSidebar')) {
        isProfile = true;
      }
      botcheckScanner.processProfileEl(card, { isProfile, isSmallProfile: !isProfile });
    });

    // Set up an observer to listen for any future tweets/profiles
    // when the user scrolls down or opens a tweet
    const observer = new MutationObserver((mutations) => {
      // Process feed and small profile cards when something changes
      botcheckScanner.processFeedTweets();
      botcheckScanner.getSmallUserCards().forEach((card) => {
        botcheckScanner.processProfileEl(card, { isSmallProfile: true, isProfile: false });
      });
      document.querySelectorAll('.ProfileHeaderCard, .ProfileCard').forEach((card) => {
        let isProfile = false;
        if (card.parentElement.classList.contains('ProfileSidebar')) {
          isProfile = true;
        }
        botcheckScanner.processProfileEl(card, { isProfile, isSmallProfile: !isProfile });
      });

      // Iterate over mutations
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((addedNode) => {
          if (!addedNode.querySelectorAll) {
            // Some nodes are just text
            return;
          }

          // Try to extract a tweet from the new node
          const result = botcheckScanner.extractTweetFromHTMLNode(addedNode);

          if (result && result.tweet) {
            const user = botcheckScanner.processTweetEl(result.tweet, {
              isFeed: result.isFeed,
              isRetweet: result.isRetweet,
              isPermalink: result.isPermalink,
              isReply: result.isReply
            });
            if (user && user.username && user.realName) {
              store.dispatch('SCAN', {
                deepScan: !result.isFeed,
                realName: user.realName,
                username: user.username
              });
            }
          }

          // Profile pages
          addedNode.querySelectorAll('.ProfileHeaderCard, .ProfileCard').forEach((profileCard) => {
            botcheckScanner.processProfileEl(profileCard);
          });
          // Hover profiles
          if (
            addedNode.classList.contains('ProfileHeaderCard')
            || addedNode.classList.contains('ProfileCard')
          ) {
            botcheckScanner.processProfileEl(addedNode);
          }
        });
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },
  getFeedTweets: () => document.querySelectorAll('.stream .tweet.js-stream-tweet') || [],
  getSmallUserCards: () => document.querySelectorAll('.UserSmallListItem, .account.js-actionable-user.js-profile-popup-actionable') || [],

  /**
   * Processes the tweets in a feed (could be a profile or search feed)
   * and issues a bulk light scan request.
   * Ignores tweets that have already been processed,
   * so it's fine to call this more than once.
   */
  processFeedTweets: () => {
    const users = [];
    const feedTweets = botcheckScanner.getFeedTweets();

    feedTweets.forEach((tweet) => {
      const result = botcheckScanner.processTweetEl(tweet, { isFeed: true });

      if (result && result.username && result.realName) {
        users.push(result);
      }
    });

    if (users.length > 1) {
      store.dispatch('BULK_LIGHT_SCAN', users);
    }
  },

  injectDialogs: () => {
    const el = document.createElement('div');
    el.innerHTML = `
      <dialog-results></dialog-results>
      <dialog-thanks></dialog-thanks>
    `;
    document.body.appendChild(el);
    new Vue({ el, store }); // eslint-disable-line no-new
  },

  // Process a Tweet and add the Botcheck button to it
  processTweetEl: (tweetEl, {
    isFeed = false,
    isRetweet = false,
    isReply = false,
    isPermalink = false,
    isSmallProfile = false,
    isProfile = false
  } = {}) => {
    if (!tweetEl.dataset || !tweetEl.dataset.screenName) {
      console.log(`
      (botcheck) Tried to process tweet element but it either had no dataset, no screenName, or already had been injected.
      `);
      return;
    }
    if (tweetEl.dataset.botcheckInjected) {
      return;
    }

    tweetEl.dataset.botcheckInjected = true;

    const username = botcheckScanner.getScreenNameFromElement(tweetEl);
    if (!username) {
      console.error('(botcheck) Could not extract username from tweet.');
    }
    const realName = botcheckScanner.getRealNameFromElement(tweetEl);
    if (!realName) {
      console.error('(botcheck) Could not extract realName from tweet.');
    }

    // Skip putting status on own tweets
    if (username === botcheckScanner.getUsername()) {
      return;
    }

    const el = document.createElement('div');
    el.classList = 'botcheck-feed-container';
    el.innerHTML = `
      <botcheck-status
        :real-name="realName"
        :username="username"
        :is-feed="isFeed"
        :is-retweet="isRetweet"
        :is-reply="isReply"
        :is-permalink="isPermalink"
        :is-profile="isProfile"
      ></botcheck-status>
    `;

    let appendTo;
    let insertAdjacent;
    if (isRetweet || isReply) {
      appendTo = tweetEl.querySelector('.stream-item-header');
    } else {
      insertAdjacent = tweetEl.querySelector('.ProfileTweet-actionList .ProfileTweet-action.ProfileTweet-action--dm');
    }

    if (appendTo) {
      appendTo.appendChild(el);
    } else if (insertAdjacent) {
      insertAdjacent.insertAdjacentElement('afterend', el);
    } else {
      console.error('(botcheck) Tried appending status to tweet but couldn\'t find the right container to insert it. Tweet element:');
      console.error(tweetEl);
      return;
    }

    new Vue({ // eslint-disable-line no-new
      el,
      store,
      data() {
        return {
          realName,
          username,
          isFeed,
          isRetweet,
          isReply,
          isPermalink,
          isSmallProfile,
          isProfile
        };
      }
    });

    return { username, realName };
  },

  // Process a Profile and add the Botcheck button to it
  processProfileEl: (profileEl, { isProfile = false, isSmallProfile = false } = {}) => {
    if (!profileEl || profileEl.dataset.botcheckInjected) {
      return;
    }

    profileEl.dataset.botcheckInjected = true;

    const username = botcheckScanner.getScreenNameFromElement(profileEl);
    const realName = botcheckScanner.getRealNameFromElement(profileEl);

    if (!username) {
      console.error('(botcheck) Tried processing profile element with no username.');
      console.error(profileEl);
      return;
    }

    // Skip putting button on own profile
    if (username === botcheckScanner.getUsername()) {
      return;
    }

    // Insert with other metadata
    const el = document.createElement('div');
    el.innerHTML = '<botcheck-status :real-name="realName" :username="username" :is-profile="isProfile" :is-small-profile="isSmallProfile"></botcheck-status>';

    // Insert status element
    const bigBio = profileEl.querySelector('.ProfileHeaderCard-bio'); // Profile page bio
    const smallBio = profileEl.querySelector('.ProfileCard-bio'); // Followers page bio
    const header = profileEl.querySelector('.stream-item-header, a.account-group');
    if (bigBio) {
      bigBio.insertAdjacentElement('afterend', el);
    } else if (smallBio) {
      smallBio.insertAdjacentElement('beforebegin', el);
    } else if (header) {
      header.insertAdjacentElement('afterend', el);
    } else {
      console.error('(botcheck) Tried appending status to profile card but couldn\'t find the right place. Element:');
      console.error(el);
    }

    new Vue({ // eslint-disable-line no-new
      el,
      store,
      data() {
        return {
          realName,
          username,
          isProfile,
          isSmallProfile
        };
      },
      mounted() {
        store.dispatch('SCAN', {
          deepScan: isProfile,
          realName: this.realName,
          username: this.username
        });
      }
    });
  },

  // You can pass in a tweet or profile DOM node and get the screen name here
  getScreenNameFromElement: (element) => {
    if (!element) {
      return;
    }

    // For profile cards
    const header = element.querySelector('h2.ProfileHeaderCard-screenname');

    if (header) {
      const anchor = header.querySelector('a.ProfileHeaderCard-screennameLink');

      if (anchor) {
        const b = anchor.querySelector('span b');
        if (b) {
          const html = b.innerHTML;
          const username = botcheckScanner.extractTextFromHTML(html);
          return username;
        }
      }
    }

    // For other elements
    if (element.dataset && element.dataset.screenName) {
      return element.dataset.screenName;
    }
    if (
      element.querySelector('[data-screen-name]')
      && element.querySelector('[data-screen-name]').dataset.screenName
    ) {
      return element.querySelector('[data-screen-name]').dataset.screenName;
    }
  },

  // You can pass in a tweet or profile DOM node and get the real name here
  getRealNameFromElement: (element) => {
    if (!element) {
      return;
    }

    // For profile cards
    const header = element.querySelector('h1.ProfileHeaderCard-name');

    if (header) {
      const anchor = header.querySelector('a.ProfileHeaderCard-nameLink');

      if (anchor && anchor.innerHTML) {
        const html = anchor.innerHTML;
        const name = botcheckScanner.extractTextFromHTML(html);
        return name;
      }
    }

    // For small profile cards
    const fullName = element.querySelector('.account-group-inner .fullname');
    if (fullName) {
      return botcheckScanner.extractTextFromHTML(fullName);
    }

    // For other elements
    if (element.dataset && element.dataset.name) {
      return element.dataset.name;
    }
    if (
      element.querySelector('[data-name]')
      && element.querySelector('[data-name]').dataset.name
    ) {
      return element.querySelector('[data-name]').dataset.name;
    }
  },

  /**
   * Receives an HTML node and extracts a tweet node from it
   * (it can be the node itself or a child)
   * Returns an object in the format:
   * {
   *   tweet: HTML Node,
   *   isRetweet: boolean,
   *   isReply: boolean,
   *   isPermalink: boolean,
   *   isFeed: boolean
   * }
   */
  extractTweetFromHTMLNode: (node) => {
    if (!node.querySelectorAll) {
      return { tweet: null };
    }
    // Node has class .tweet: Happens for replies and retweets
    if (node.classList.contains('tweet')) {
      // Retweet
      if (node.parentElement.getAttribute('id') === 'retweet-tweet-dialog-body') {
        return {
          tweet: node,
          isRetweet: true
        };
      }
      // Reply
      if (node.parentElement.getAttribute('id') === 'global-tweet-dialog-body') {
        return {
          tweet: node,
          isReply: true
        };
      }
    }
    // Node has child with class .tweet: Happens for feed and permalink tweets
    const tweet = node.querySelector('.tweet');
    if (tweet) {
      // Permalink tweet
      if (node.classList.contains('permalink-container')) {
        return {
          tweet,
          isPermalink: true
        };
      }
      // Feed tweet
      if (node.classList.contains('js-stream-item')) {
        return {
          tweet,
          isFeed: true
        };
      }
    }
    return { tweet: null };
  },

  extractTextFromHTML: (string) => {
    const doc = new DOMParser().parseFromString(string, 'text/html');
    return doc.body.textContent || '';
  }
};
