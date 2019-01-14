BC.internationalization.getInternationalizer((i) => {

  Vue.component('dialog-thanks', {
    template: `
      <el-dialog :visible.sync="dialogVisible" class="botcheck-dialog">
        <el-main>
          <el-container>
            <el-row>
              <el-col :span="24">
                <span class="header">${i('thanksDialog_title')}</span>
                <span>${i('thanksDialog_description')}</span>
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

});
