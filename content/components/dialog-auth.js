Vue.component('dialog-auth', {
  template: html`
    <el-dialog :visible.sync="dialogVisible" class="botcheck-dialog botcheck-dialog-auth text-center">
      <el-header height="auto">
        <h1>Welcome to Botcheck.me</h1>
      </el-header>
      <el-main>
        <p>Please authorize with Twitter to begin.</p>
        <p>Botcheck will never tweet on your behalf.</p>
      </el-main>
      <el-footer height="auto">
        <el-button type="primary" round @click="authWithTwitter" class="u-bgUserColor u-borderUserColor u-bgUserColorDarkHover">
          Authorize with Twitter
        </el-button>
      </el-footer>
      </el-dialog>
  `(),
  computed: {
    dialogVisible: {
      get() {
        return this.$store.state.synced.dialogs.auth.visible;
      },
      set() {
        this.$store.broadcast('AUTH_CLOSE');
      }
    }
  },
  methods: {
    authWithTwitter() {
      store.broadcastAction('AUTH_TWITTER');
    }
  }
});
