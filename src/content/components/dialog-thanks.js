Vue.component('dialog-thanks', {
  template: `
    <el-dialog :visible.sync="dialogVisible" class="botcheck-dialog">
      <el-main>
        <el-container>
          <el-row>
            <el-col :span="24">
              <span class="header">Thank You for Your Feedback!</span>
              <span>Our model currently has about 90% accuracy but occasionally makes mistakes. Thank you for your input.</span>
            </el-col>
          </el-row>
        </el-container>
      </el-main>
    </el-dialog>
  `,
  computed: {
    dialogVisible: {
      get() {
        return this.$store.state.dialogs.thanks.visible;
      },
      set() {
        this.$store.commit('THANKS_CLOSE');
      }
    }
  }
});
