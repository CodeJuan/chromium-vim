var Command = {};
var settings, sessions;

Command.dataElements = [];
Command.matches = [];

Command.setup = function() {
  this.bar = document.createElement("div");
  this.bar.id = "cVim-command-bar";
  this.bar.cVim = true;
  this.bar.style[(this.onBottom) ? "bottom" : "top"] = "0";
  this.input = document.createElement("input");
  this.input.type = "text";
  this.input.id = "cVim-command-bar-input";
  this.input.cVim = true;
  this.statusBar = document.createElement("div");
  this.statusBar.id = "cVim-status-bar";
  this.statusBar.style[(this.onBottom) ? "bottom" : "top"] = "0";
  this.modeIdentifier = document.createElement("span");
  this.modeIdentifier.id = "cVim-command-bar-mode";
  this.modeIdentifier.cVim = true;
  this.bar.appendChild(this.modeIdentifier);
  this.bar.appendChild(this.input);
  this.bar.spellcheck = false;
  try {
    document.lastChild.appendChild(this.bar);
    document.lastChild.appendChild(this.statusBar);
  } catch(e) {
    document.body.appendChild(this.bar);
    document.body.appendChild(this.statusBar);
  }
  if (!this.data) {
    this.data = document.createElement("div");
    this.data.id = "cVim-command-bar-search-results";
    this.data.cVim = true;
    try {
      document.lastChild.appendChild(this.data);
    } catch(e) {
      document.body.appendChild(this.data);
    }
    this.barHeight = parseInt(getComputedStyle(this.bar).height);
    if (this.onBottom) {
      this.barPaddingTop = 0;
      this.barPaddingBottom = this.barHeight;
      this.data.style.bottom = this.barHeight + "px";
    } else {
      this.barPaddingBottom = 0;
      this.barPaddingTop = this.barHeight;
      this.data.style.top = this.barHeight + "px";
    }
  }
};

Command.history = {
  index: {},
  search: [],
  url: [],
  action: [],
  setInfo: function(type, index) {
    var fail = false;
    if (index < 0) {
      index = 0;
      fail = true;
    }
    if (index >= this[type].length) {
      index = this[type].length;
      fail = true;
    }
    this.index[type] = index;
    return !fail;
  },
  cycle: function(type, reverse) {
    if (this[type].length === 0) return false;
    var len = this[type].length,
        index = this.index[type];
    if (index === undefined) {
      index = len;
    }
    var lastIndex = index;
    index += reverse? -1 : 1;
    if (Command.typed && Command.typed.trim()) {
      while (this.setInfo(type, index)) {
        if (this[type][index].substring(0, Command.typed.length) === Command.typed) {
          break;
        }
        index += reverse? -1 : 1;
      }
    }
    if (reverse && index === -1) {
      this.index[type] = lastIndex;
      return;
    }
    Command.hideData();
    this.setInfo(type, index);
    if (this.index[type] !== this[type].length) {
      Command.input.value = this[type][this.index[type]];
    } else {
      Command.input.value = Command.typed || "";
    }
  }
};

Command.appendResults = function(data, extend, identifier, color) {
  var identifierEl;
  if (!data.length) return false;
  if (!extend || !Array.isArray(this.completionResults)) {
    this.dataElements = [];
    this.completionResults = data;
    this.data.innerHTML = "";
  } else this.completionResults = this.completionResults.concat(data);
  var arrCount = data[0].length;
  for (var i = 0, l = data.length; i < l; ++i) {
    if (this.dataElements.length > settings.searchlimit) return;
    var temp = document.createElement("div");
    temp.cVim = true;
    temp.className = "cVim-completion-item";
    if (identifier) {
      identifierEl = document.createElement("span");
      identifierEl.style.color = color;
      identifierEl.textContent = identifier + ": ";
    }
    if (arrCount >= 3) {
      var left = document.createElement("span");
      left.className = "cVim-left";
      left.textContent = data[i][1];
      var right = document.createElement("span");
      right.className = "cVim-right";
      right.textContent = data[i][2];
      if (identifier) {
        left.insertBefore(identifierEl, left.firstChild);
      }
      temp.appendChild(left);
      temp.appendChild(right);
    } else {
      var full = document.createElement("span");
      full.className = "cVim-full";
      full.textContent = data[i][1];
      temp.appendChild(full);
    }
    this.dataElements.push(temp);
    this.data.appendChild(temp);
  }
  this.data.style.display = "block";
};

Command.hideData = function() {
  Search.lastActive = null;
  this.dataElements.length = 0;
  if (this.data) {
    this.data.innerHTML = "";
    Search.index = null;
  }
};

Command.descriptions = [
  ["tabopen",    "Open a link in a new tab"],
  ["winopen",    "Open a link in a new window"],
  ["buffers",    "Select from a list of current tabs"],
  ["closetab",   "Close the current tab"],
  ["open",       "Open a link in the current tab"],
  ["nohl",       "Clears the search highlight"],
  ["file",       "Browse local directories"],
  ["set",        "Configure Settings"],
  ["date",       "Display the current date"],
  ["mksession",  "Create a saved session of current tabs"],
  ["delsession", "Delete sessions"],
  ["qmark",      "Add QuickMarks"],
  ["execute",    "Execute a sequence of keys"],
  ["session",    "Open a saved session in a new window"],
  ["bookmarks",  "Search through your bookmarks"],
  ["history",    "Search through your browser history"],
  ["duplicate",  "Clone the current tab"],
  ["chrome://",  "Opens Chrome urls"],
  ["help",       "Shows the help page"],
  ["settings",   "Open the options page for this extension"]
];

Command.complete = function(value) {
  Search.index = null;
  this.typed = this.input.value;
  var search = value.replace(/^(chrome:\/\/|\S+ +)/, "");

  if (/^(tabopen|to|open|o|wo|winopen)(\s+)/.test(value)) {
    search = search.split(/ +/).filter(function(e) {
      return e;
    });
    if (search.length < 2 || Complete.engines.indexOf(search[0]) === -1) {
      var matches = [];
      if (Complete.engines.indexOf(search[0]) !== -1) {
        return this.hideData();
      }
      for (var i = 0, l = Complete.engines.length; i < l; ++i) {
        if (!search[0] || Complete.engines[i].indexOf(search.join(" ")) === 0) {
          matches.push(["engines", Complete.engines[i], Complete.requestUrls[Complete.engines[i]]]);
        }
      }
      Command.completionResults = [];
      var topsites = Search.topSites.filter(function(e) {
        return (e[0] + " " + e[1]).toLowerCase().indexOf(search.slice(0).join(" ").toLowerCase()) !== -1;
      }).slice(0, 5).map(function(e) {
        return ["search", e[0], e[1]];
      });
      this.engineMatches = matches;
      this.topSiteMatches = topsites;
      this.searchMode = true;
      return port.postMessage({action: "searchHistory", search: value.replace(/^\S+\s+/, ""), limit: settings.searchlimit});
    }
    if (Complete.engines.indexOf(search[0]) !== -1 && Complete.hasOwnProperty(search[0])) {
      Complete[search[0]](search.slice(1).join(" "), function(response) {
        if (!response.length) {
          return this.hideData();
        }
        this.appendResults(response, false);
      }.bind(this));
    }
    return;
  }

  if (/^chrome:\/\//.test(value)) {
    Search.chromeMatch(search, function(matches) {
      if (matches.length) {
        this.appendResults(matches);
      } else this.hideData();
    }.bind(this));
    return;
  }

  if (/^buffers(\s+)/.test(value)) {
    search = value.replace(/^\S+\s+/, "");
    port.postMessage({action: "getBuffers"});
    return;
  }

  if (/^(del)?session(\s+)/.test(value)) {
    var _res = sessions.filter(function(e) {
      var regexp;
      var isValidRegex = true;
      try {
        regexp = new RegExp(search, "i");
      } catch (ex) {
        isValidRegex = false;
      }
      if (isValidRegex) {
        return regexp.test(e[0]);
      }
      return e[0].substring(0, search.length) === search;
    }).map(function(e) { return ["session"].concat(e); });
    this.hideData();
    if (_res.length > 0) {
      this.appendResults(_res);
    }
    return;
  }

  if (/^set(\s+)/.test(value)) {
    Search.settingsMatch(search, function(matches) {
      if (matches.length) {
        this.appendResults(matches);
      } else this.hideData();
    }.bind(this));
    return;
  }

  if (/^hist(ory)?(\s+)/.test(value)) {
    if (search.trim() === "") return this.hideData();
    this.historyMode = true;
    port.postMessage({action: "searchHistory", search: search, limit: settings.searchlimit});
    return;
  }

  if (/^file +/.test(value)) {
    if ((search.slice(-1) === "/" && Marks.lastSearchLength < search.length) || Marks.lastSearchLength > search.length || !(Marks.lastFileSearch && Marks.lastFileSearch.replace(/[^\/]+$/, "") === search) && (search.slice(-1) === "/" && !(Marks.lastFileSearch && Marks.lastFileSearch.slice(-1) === "/"))) {
      Marks.lastFileSearch = search;
      Marks.lastSearchLength = search.length;
      return chrome.runtime.sendMessage({action: "getFilePath", path: search});
    } else {
      Marks.lastFileSearch = search;
      return Marks.filePath();
    }
  }

  if (/^b(ook)?marks(\s+)/.test(value)) {
    if (search[0] === "/") {
      return Marks.matchPath(search);
    }
    Marks.match(search, function(response) {
      if (response.length > 0) {
        this.appendResults(response);
      } else {
        this.hideData();
      }
    }.bind(this));
    return;
  }

  var data = this.descriptions.filter(function(element) {
    return value === element[0].slice(0, value.length);
  }).map(function(e){return["complete"].concat(e);});

  if (data.length) {
    this.appendResults(data);
  } else {
    this.hideData();
  }
};

Command.execute = function(value, repeats) {

  var activeTab = true;
  if (value) {
    value = value.replace(/&$/, function() {
      activeTab = false;
      return "";
    });
  }
  if (document.activeElement.id !== "cVim-command-bar-input" || !commandMode) {
    this.hideData();
    this.hide();
  }

  this.history.index = {};

  switch (value) {
    case "nohl":
      Find.clear();
      HUD.hide();
      break;
    case "duplicate":
      chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: document.URL, repeats: repeats});
      break;
    case "settings":
      chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: chrome.extension.getURL("/pages/options.html"), repeats: repeats});
      break;
    case "date":
      var date = new Date();
      var weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      Status.setMessage(weekDays[date.getDay()] + ", " + months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear(), 2);
      break;
    case "help":
      chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: chrome.extension.getURL("/pages/mappings.html")});
      break;
    case "cl":
    case "closetab":
      chrome.runtime.sendMessage({action: "closeTab", repeats: repeats});
      break;
    default:
      if (/^chrome:\/\/\S+$/.test(value))
        chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: value, noconvert: true});
      else if (/^bookmarks +/.test(value) && value !== "bookmarks") {
        if (/^\S+\s+\//.test(value)) {
          chrome.runtime.sendMessage({action: "openBookmarkFolder", active: activeTab, path: value.replace(/\S+\s+/, ""), noconvert: true});
        } else {
          chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: value.replace(/^b(ook)?marks(\s+)?/, ""), noconvert: true});
        }
      } else if (/^history +/.test(value)) {
        chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: Complete.convertToLink(value), noconvert: true});
      } else if (/^file +/.test(value)) {
        chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: "file://" + value.replace(/\S+ +/, ""), noconvert: true});
      } else if (/^(winopen|wo)$/.test(value.replace(/ .*/, ""))) {
        chrome.runtime.sendMessage({action: "openLinkWindow", focused: activeTab, url: Complete.convertToLink(value), repeats: repeats, noconvert: true});
      } else if (/^(to|tabopen)$/.test(value.replace(/ .*/, ""))) {
        chrome.runtime.sendMessage({action: "openLinkTab", active: activeTab, url: Complete.convertToLink(value), repeats: repeats, noconvert: true});
      } else if (/^(o|open)$/.test(value.replace(/ .*/, ""))) {
        chrome.runtime.sendMessage({action: "openLink", active: activeTab, url: Complete.convertToLink(value), noconvert: true});
      } else if (/^buffers +[0-9]+(\s+)?$/.test(value))
        chrome.runtime.sendMessage({action: "goToTab", index: value.replace(/^.*([0-9]+).*$/, "$1")});
      else if (/^execute +/.test(value)) {
        var command = value.replace(/^\S+/, "").trim();
        realKeys = "";
        repeats = "";
        Command.hideData();
        Command.hide();
        Mappings.executeSequence(command);
        return;
      } else if (/^delsession/.test(value)) {
        value = value.replace(/^\S+(\s+)?/, "").trimAround();
        if (value === "") {
          Status.setMessage("argument required", 1, "error");
          break;
        }
        if (sessions.indexOf(value) !== -1) sessions.splice(sessions.indexOf(value), 1);
        value.split(" ").forEach(function(v) {
          chrome.runtime.sendMessage({action: "deleteSession", name: v});
        });
        port.postMessage({action: "getSessionNames"});
      } else if (/^mksession/.test(value)) {
        value = value.replace(/^\S+(\s+)?/, "").trimAround();
        if (value === "") {
          Status.setMessage("session name required", 1, "error");
          break;
        } else if (/[^a-zA-Z0-9_-]/.test(value)) {
          Status.setMessage("only alphanumeric characters, dashes, and underscores are allowed", 1, "error");
          break;
        }
        if (sessions.indexOf(value) === -1) sessions.push(value);
        chrome.runtime.sendMessage({action: "createSession", name: value});
      } else if (/^session/.test(value)) {
        value = value.replace(/^\S+(\s+)?/, "").trimAround();
        if (value === "") {
          Status.setMessage("session name required", 1, "error");
          break;
        }
        chrome.runtime.sendMessage({action: "openSession", name: value, sameWindow: !activeTab}, function() {
          Status.setMessage("session does not exist", 1, "error");
        });
      } else if (/^set +/.test(value) && value !== "set") {
        value = value.replace(/^set +/, "").split(/[ =]+/);
        var isSet, swapVal;
        var isQuery = /\?$/.test(value[0]);
        value[0] = value[0].replace(/\?$/, "");
        if (!settings.hasOwnProperty(value[0].replace(/^no|!$/g, ""))) {
          Status.setMessage("unknown option: " + value[0], 1, "error");
        } else if (isQuery) {
          Status.setMessage(value + ": " + settings[value[0]], 1);
        } else {
          isSet = !/^no/.test(value[0]);
          swapVal = /!$/.test(value[0]);
          value[0] = value[0].replace(/^no|[?!]$/g, "");
          if (value.length === 1 && (settings[value] === true || settings[value] === false)) {
            if (value[0] === "hud" && !isSet) {
              HUD.hide(true);
            }
            if (swapVal) {
              settings[value[0]] = !settings[value[0]];
            } else {
              settings[value[0]] = isSet;
            }
          } else if (value.length === 2) {
            switch (value[0]) {
              case "scrollstep":
                if (!/^[0-9]+$/.test(value[1])) Status.setMessage("invalid integer: '" + (value[1] || "") + "'", 1, "error");
                else settings.scrollstep = parseInt(value[1]);
                break;
              case "searchlimit":
                if (!/^[0-9]+$/.test(value[1])) Status.setMessage("invalid integer: " + value, 1, "error");
                else settings.searchlimit = parseInt(value[1]);
                break;
              case "hintcharacters":
                value = value[1].split("").unique().join("");
                if (value.length <= 1) Status.setMessage("two unique hint characters are required", 1, "error");
                else settings.hintcharacters = value;
                break;
            }
          }
        }
      } else if (/^qmark\s+/.test(value)) {
        value = value.replace(/\S+\s+/, "").split(/\s+/).filter(function(e) {
          return e.trim();
        });
        if (value.length !== 2) {
          Status.setMessage("two arguments are required", 1, "error");
        } else if (value[0].length !== 1) {
          Status.setMessage("argument must be an ASCI letter or digit", 1, "error");
        } else {
          if (Marks.quickMarks.hasOwnProperty(value[0])) {
            if (Marks.quickMarks[value[0]].indexOf(value[1]) !== -1) {
              Marks.quickMarks[value[0]].splice(Marks.quickMarks[value[0]].indexOf(value[1]), 1);
              if (Marks.quickMarks[value[0]].length === 0) {
                Status.setMessage("QuickMark \"" + value[0] + "\" removed", 1);
                delete Marks.quickMarks[value[0]];
              } else {
                Status.setMessage("URL removed from existing QuickMark \"" + value[0] + "\"", 1);
              }
            } else {
              Status.setMessage("URL added to existing QuickMark \"" + value[0] + "\"", 1);
              Marks.quickMarks[value[0]].push(value[1]);
            }
          } else {
            Status.setMessage("New QuickMark \"" + value[0] + "\" added", 1);
            Marks.quickMarks[value[0]] = [value[1]];
          }
        }
        chrome.runtime.sendMessage({action: "updateMarks", marks: Marks.quickMarks});
      }
  }
  this.hideData();
  this.hide();
};

Command.show = function(search, value) {
  this.type = "";
  this.active = true;
  if (document.activeElement) {
    document.activeElement.blur();
  }
  if (search) {
    this.type = "search";
    this.modeIdentifier.innerHTML = search;
  } else {
    this.type = "action";
    this.modeIdentifier.innerHTML = ":";
  }
  if (value) {
    this.input.value = value;
    this.typed = value;
  }
  if (Status.active) Status.hide();
  this.bar.style.display = "inline-block";
  setTimeout(function() {
    this.input.focus();
  }.bind(this), 0);
};

Command.hide = function() {
  if (!commandMode) return false;
  document.activeElement.blur();
  this.hideData();
  this.bar.style.display = "none";
  this.input.value = "";
  this.historyMode = false;
  this.active = false;
  commandMode = false;
  Search.index = null;
  this.history.index = {};
  this.typed = "";
  this.dataElements = [];
  if (this.data) this.data.style.display = "none";
};

Command.onDOMLoad = function() {
  var head = document.getElementsByTagName("head");
  if (head.length) { // Use chrome.tabs.insertCSS if document.head does not exist
    this.css = document.createElement("style");
    this.css.textContent = settings.COMMANDBARCSS;
    head[0].appendChild(this.css);
  }
  if (!head.length && document.URL.indexOf("chrome") !== 0) {
    chrome.runtime.sendMessage({action: "injectCSS", css: settings.COMMANDBARCSS, runAt: "document_start"});
  }
  this.onBottom = settings.barposition === "bottom";
  if (this.data !== undefined) {
    this.data.style[(!this.onBottom) ? "bottom" : "top"] = "";
    this.data.style[(this.onBottom) ? "bottom" : "top"] = "20px";
  }
  if (!Key.initialKey && !settings.autofocus) {
    var manualFocus = false;
    var initialFocus = window.setInterval(function() {
      if (document.activeElement) {
        if (/input|textarea/i.test(document.activeElement.localName) && !manualFocus) {
          document.activeElement.blur();
        }
      }
      if (manualFocus) {
        window.clearInterval(initialFocus);
      }
    }, 5);
    var initialKeyDown = document.addEventListener("keydown", function() {
      manualFocus = true;
      document.removeEventListener("keydown", initialKeyDown, true);
    }, true);
    var initialMouseDown = document.addEventListener("mousedown", function() {
      manualFocus = true;
      document.removeEventListener("mousedown", initialMouseDown, true);
    }, true);
  }
  this.setup();
  if (Key.initialKey) {
    var tmp = Key.initialKey;
    Key.initialKey = null;
    Key.down(tmp);
  }
};

Command.init = function(enabled) {
  var key;
  Mappings.defaults = Object.clone(Mappings.defaultsClone);
  Mappings.shortCuts = Object.clone(Mappings.shortCutsClone);
  Mappings.parseCustom(settings.MAPPINGS);
  if (enabled) {
    if (settings.searchengines && !Array.isArray(settings.searchengines) && typeof settings.searchengines === "object") {
      for (key in settings.searchengines) {
        if (Complete.engines.indexOf(key) === -1 && typeof settings.searchengines[key] === "string") {
          Complete.engines.push(key);
          Complete.requestUrls[key] = settings.searchengines[key];
        }
      }
    }
    waitForLoad(this.onDOMLoad, this);
    if (settings.autohidecursor) {
      waitForLoad(Cursor.init, Cursor);
    }
    Scroll.smoothScroll = settings.smoothscroll;
    Scroll.stepSize = parseInt(settings.scrollstep);
    if (settings.hintcharacters.split("").unique().length > 1) {
      settings.hintcharacters = settings.hintcharacters.split("").unique().join("");
    }
    Hints.containsUppercase = /[A-Z]/.test(settings.hintcharacters);
    if (Array.isArray(settings.completionengines) && settings.completionengines.length) {
      Complete.engines = Complete.engines.filter(function(e) {
        return settings.completionengines.indexOf(e) !== -1;
      });
    }
  } else {
    this.loaded = false;
    if (this.css && this.css.parentNode) {
      this.css.parentNode.removeChild(this.css);
    }
    var links = document.getElementById("cVim-link-container");
    if (Cursor.overlay && Cursor.overlay.parentNode) {
      Cursor.overlay.parentNode.removeChild(Cursor.overlay);
    }
    if (this.bar && this.bar.parentNode) {
      this.bar.parentNode.removeChild(this.bar);
    }
    if (links) {
      links.parentNode.removeChild(links);
    }
    removeListeners();
  }
};

Command.configureSettings = function(_settings) {
  
  settings = _settings;
  function checkBlacklist() {
    var blacklists = settings.BLACKLISTS.split("\n"),
        blacklist;
    Command.blacklisted = false;
    for (var i = 0, l = blacklists.length; i < l; i++) {
      blacklist = blacklists[i].trimAround().split(/\s+/g);
      if (!blacklist.length) {
        continue;
      }
      if (matchLocation(document.URL, blacklist[0])) {
        if (blacklist.length > 1) {
          var unmaps      = blacklist.slice(1),
              unmapString = "";
          for (var j = 0, q = unmaps.length; j < q; ++j) {
            unmapString += "\nunmap " + unmaps[j];
          }
          Mappings.siteSpecificBlacklists += unmapString;
          break;
        }
        return true;
      }
    }
  }
  function loadMain() {
    Command.loaded = true;
    chrome.runtime.sendMessage({action: "setIconEnabled"});
    Command.init(true);
  }
  Search.settings = Object.keys(settings).filter(function(e) {
    return settings[e].constructor === Boolean;
  });
  removeListeners();
  settings.searchlimit = parseInt(settings.searchlimit);
  if (!checkBlacklist()) {
    chrome.runtime.sendMessage({action: "getActiveState"}, function(response) {
      if (response) {
        addListeners();
        loadMain();
      } else {
        Command.init(false);
      }
    });
  } else {
    this.init(false);
  }
};

window.addEventListener("focus", function() {
  window.setTimeout(function() {
    if (!Command.loaded) {
      chrome.runtime.sendMessage({action: "getSettings"});
    }
  }, 0);
});
