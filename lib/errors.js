// Send any uncaught exceptions up to log collector
Vue.config.errorHandler = errorHandler;
window.addEventListener('error', errorHandler);

function errorHandler(error) {
  console.error(error);
  store.broadcastAction('RUNTIME_ERROR', {
    message: error.message,
    stack: error.stack,
    error: error.error,
    filename: error.filename
  });
}
