Vue.component('dialog-error', {
  template: html`
    <el-dialog :visible.sync="dialogVisible" class="botcheck-dialog">
      <el-header height="auto">
        <h1>Error</h1>
      </el-header>
      <el-main>
        <p>{{ message }}</p>
      </el-main>
      <el-footer height="auto" class="text-right">
        <el-button type="primary" round @click="dialogVisible = false" class="u-bgUserColor u-borderUserColor u-bgUserColorDarkHover">
          Close
        </el-button>
      </el-footer>
    </el-dialog>
  `(),
  computed: {
    message() {
      return this.$store.state.synced.dialogs.error.message;
    },
    dialogVisible: {
      get() {
        return this.$store.state.synced.dialogs.error.visible;
      },
      set() {
        this.$store.broadcastMutation('ERROR_CLOSE');
      }
    }
  }
});
