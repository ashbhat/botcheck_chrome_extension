/**
 * Listens for storage requests and handle a queue in order to avoid race conditions.
 *
 * This interface was developed since chrome doesn't allow updating a single key
 * of an object in storage. Updating the entire object at once led to race conditions.
 */

(function() {

const storageQueue = [];
let isQueueBeingProcessed = false;

browser.runtime.onMessage.addListener(({ type, key, value } /* , sender, sendResponse */) => {
  // Key is an array containing a sequence of keys
  // Example: ['person', 'birth', 'year']
  // means we want to update person.birth.year
  if (
    type !== BC.backgroundMessageTypes.storageQueueUpdate
    || !value
    || !key
    || key.length < 1
  ) {
    return;
  }
  storageQueue.push({ key, value });

  if (!isQueueBeingProcessed) {
    isQueueBeingProcessed = true;
    processQueue(); // eslint-disable-line no-use-before-define
  }
});

function processQueue() {
  if (storageQueue.length < 1) {
    isQueueBeingProcessed = false;
    return;
  }
  console.log('(botcheck) Processing storage queue');

  const firstBaseKey = storageQueue[0].key[0];

  chrome.storage.local.get(firstBaseKey, (result) => {
    if (chrome.runtime.lastError) {
      console.error('(botcheck) Failed to get item from browser storage.');
      console.error(chrome.runtime.lastError);
    }
    const obj = result[firstBaseKey] || {};

    console.log('(botcheck) existing data for ', firstBaseKey, obj);
    console.log('(botcheck) Old storage size:');
    console.log(Object.keys(obj).length);
    console.log(JSON.stringify(Object.keys(obj)));

    // Process all queue items with same base key
    storageQueue.forEach(({ key, value }, index) => {
      if (key[0] !== firstBaseKey) {
        return;
      }
      BC.util.updateNestedKey(obj, key.slice(1), value); // eslint-disable-line no-use-before-define

      // Remove item from queue
      storageQueue.splice(index, 1);
    });

    console.log('(botcheck) New storage size:');
    console.log(Object.keys(obj).length);
    console.log(JSON.stringify(Object.keys(obj)));

    chrome.storage.local.set({ [firstBaseKey]: obj }, () => {
      if (chrome.runtime.lastError) {
        console.error('(botcheck) Failed to get item from browser storage.');
        console.error(chrome.runtime.lastError);
      }

      if (storageQueue.length > 0) {
        processQueue();
      } else {
        isQueueBeingProcessed = false;
      }
    });
  });
}

})();