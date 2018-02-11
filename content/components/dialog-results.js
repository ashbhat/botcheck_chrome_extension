Vue.component('dialog-results', {
  template: html`
    <el-dialog :visible.sync="dialogVisible" :class="{ 'botcheck-result-positive': results.prediction, 'botcheck-dialog': true }">
      <el-container v-loading="loading">
    
        <el-header height="auto">
          <h1 v-if="results.prediction === true">
            Propaganda Bot like patterns found
          </h1>
          <h1 v-if="results.prediction === false">
            Propaganda Bot like patterns not found
          </h1>
        </el-header>
    
        <el-main>
          <img :src="profileImage" class="botcheck-profile-image" v-if="predictionLoaded">
          <span v-if="results.prediction === true">
            Our model has classified
            <strong>@{{ results.username }}</strong> to exhibit patterns conducive to a political bot or highly moderated account.
          </span>
          <span v-if="results.prediction === false">
            Our model finds that
            <strong>@{{ results.username }}</strong> does not exhibit patterns conducive to propaganda bots or moderated behavior conducive
            to political propaganda accounts.
          </span>
        </el-main>
    
        <el-footer height="auto" v-if="predictionLoaded">
          <el-row type="flex" align="middle">
    
            <el-col :span="12">
              <a href="https://medium.com/@robhat/identifying-propaganda-bots-on-twitter-5240e7cb81a9" target="_blank">How this works</a>
              &bull;
              <a href="http://twitter.com/theashbhat" target="_blank">Follow us for updates</a>
            </el-col>
    
            <el-col :span="12" class="text-right">
              <el-button size="medium" round @click="disagree" class="u-textUserColorHover u-borderUserColorHover">
                Disagree
              </el-button>
              <el-button size="medium" round @click="share" v-if="results.prediction == true">
                Share
              </el-button>
              <el-button size="medium" round type="primary" @click="dialogVisible = false" class="u-bgUserColor u-borderUserColor u-bgUserColorDarkHover">Close</el-button>
            </el-col>
    
          </el-row>
        </el-footer>
    
      </el-container>
      </el-dialog>
  `(),
  computed: {
    screenName() {
      return this.$store.state.synced.dialogs.results.screenName;
    },
    results() {
      let results = this.$store.state.synced.results;
      let dialogScreenName = this.$store.state.synced.dialogs.results.screenName;
      if (results && results[dialogScreenName]) {
        return results[dialogScreenName];
      }
      return {};
    },
    loading() {
      return this.$store.state.synced.dialogs.results.loading;
    },
    dialogVisible: {
      get() {
        return this.$store.state.synced.dialogs.results.visible;
      },
      set() {
        this.$store.broadcastMutation('RESULTS_CLOSE');
      }
    },
    predictionLoaded() {
      return typeof this.results.prediction !== 'undefined';
    },
    profileImage() {
      return this.results.profile_image && this.results.profile_image.replace('http:', 'https:');
    }
  },
  methods: {
    disagree() {
      this.$store.broadcastMutation('RESULTS_CLOSE');
      this.$store.broadcastAction('DISAGREE', this.results.prediction);
      this.$store.broadcastMutation('THANKS_OPEN');
    },
    share() {
      this.$store.broadcastMutation('RESULTS_CLOSE');
      this.$store.broadcastMutation('SHARE', this.screenName);
    }
  }
});
