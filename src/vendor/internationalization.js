(function () {
  // Retrieves localization JSON file
  const getJSONData = (lang) =>
    axios
      .get(`${botcheckConfig.internationalizationURL}locale/${lang}`)
      .then(result => result.data);

  // Replaces all ocurrences of a string (safely)
  const replaceAll = (str, find, replace) => {
    function escapeRegExp(str) {
      return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
  };

  /**
   * Exposed functionality
   */

  if (!window.BC) {
    window.BC = {};
  }

  window.BC.internationalization = {};

  window.BC.internationalization.data = null;

  // Returns the value of the lang attribute of the <html> tag
  window.BC.internationalization.getTwitterLang = () => {
    const html = document.querySelector('html');
    if (html.attributes['lang'] && html.attributes['lang'].value) {
      return html.attributes['lang'].value;
    } else {
      return 'en';
    }
  }

  window.BC.internationalization.load = (lang = 'en') => {
    // Store loaded language for reference
    BC.internationalization.lang = lang;

    return getJSONData(lang)
      .catch((e) => {
        console.error(e);
        console.log(`(botcheck) Something went wrong when loading translation for language "${lang}". Loading english...`);

        return getJSONData('en');
      })
      .then((data) => {
        BC.internationalization.data = data;

        BC.internationalization.callbacks.forEach(fn =>
          fn(BC.internationalization.getString)
        );
      });
  };

  /**
   * getString: Returns a localized string given its key
   *
   * @param key Identifies the string to be retrieved
   * @param filler An object holding values to fill the string with
   *
   * A key representing a string "Hello %%name%%" received with a filler
   * object of { name: 'John' } returns "Hello John".
   *
   * %% %% was used instead of the more common {{ }} due to Vue already
   * using the latter.
   */
  window.BC.internationalization.getString = (key, filler = {}) => {
    if (!BC.internationalization.data) {
      throw new Error(`
        (botcheck) Called internationalization.getString()
        but there is no internationalization data.
      `);
    }
    if (!BC.internationalization.data[key]) {
      console.error('Missing translation string for key ', key, ' in lang ', BC.internationalization.lang);
      return key;
    }

    const string = BC.internationalization.data[key];

    let filledString = string;

    Object.keys(filler).forEach((key) => {
      filledString = replaceAll(string, `%%${key}%%`, filler[key]);
    });

    return filledString;
  };

  window.BC.internationalization.callbacks = [];

  /**
   * This function is called by scripts that need access to the
   * internationalization getString function.
   *
   * @param fn A callback which is called as soon as internationalization data
   *           is ready to use. BC.internationalization.getString is sent
   *           as a parameter for ease of use.
   */
  window.BC.internationalization.getInternationalizer = (fn) => {
    if (BC.internationalization.data) {
      fn(BC.internationalization.getString);
    } else {
      BC.internationalization.callbacks.push(fn);
    }
  }
})();
