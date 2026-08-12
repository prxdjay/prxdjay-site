(function () {
  "use strict";
  var themes = ["tube", "desktop", "clean"];
  var accents = ["red", "green", "blue", "violet", "gold"];
  try {
    var theme = localStorage.getItem("prxdjay.theme");
    var accent = localStorage.getItem("prxdjay.accent");
    document.documentElement.dataset.theme = themes.indexOf(theme) > -1 ? theme : "tube";
    document.documentElement.dataset.accent = accents.indexOf(accent) > -1 ? accent : "red";
  } catch (e) {
    document.documentElement.dataset.theme = "tube";
    document.documentElement.dataset.accent = "red";
  }
})();
