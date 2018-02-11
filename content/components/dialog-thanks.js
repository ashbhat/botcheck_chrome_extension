Vue.component('dialog-thanks', {
  template: html`
    <el-dialog :visible.sync="dialogVisible" class="botcheck-dialog">
      <el-header height="auto">
        <h1>Thanks for the feedback!</h1>
      </el-header>
      <el-main>
        <p>Our model currently has ~90% accuracy and does make mistakes. Thank you for your response.</p>
      </el-main>
      <el-footer height="auto" class="text-right">
        <el-button type="primary" round @click="dialogVisible = false" class="u-bgUserColor u-borderUserColor u-bgUserColorDarkHover">
          Close
        </el-button>
      </el-footer>
      </el-dialog>
  `(),
  computed: {
    dialogVisible: {
      get() {
        return this.$store.state.synced.dialogs.thanks.visible;
      },
      set() {
        this.$store.broadcastMutation('THANKS_CLOSE');
      }
    }
  }
});
