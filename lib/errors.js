// Send any uncaught exceptions up to log collector
Vue.config.errorHandler = errorHandler;
window.addEventListener('error', errorHandler);

function errorHandler(error) {
  console.error(error);
  store.broadcastAction('LOG', {
    message: error.message,
    stack: error.stack,
    error: error.error,
    filename: error.filename
  });
}
