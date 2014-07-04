var port = chrome.extension.connect({name: 'main'});

port.onMessage.addListener(function(response) {
  var key;
  switch (response.type) {
    case 'hello':
      port.postMessage({action: 'getBookmarks'});
      port.postMessage({action: 'getQuickMarks'});
      port.postMessage({action: 'getSessionNames'});
      port.postMessage({action: 'getTopSites'});
      port.postMessage({action: 'retrieveAllHistory'});
      port.postMessage({action: 'sendLastSearch'});
      break;
    case 'commandHistory':
      for (key in response.history) {
        Command.history[key] = response.history[key];
      }
      break;
    case 'history':
      var matches = [];
      for (key in response.history) {
        if (response.history[key].url) {
          if (response.history[key].title.trim() === '') {
            matches.push(['Untitled', response.history[key].url]);
          } else {
            matches.push([response.history[key].title, response.history[key].url]);
          }
        }
      }
      matches = matches.sort(function(a, b) {
        return a[1].length - b[1].length;
      });
      if (Command.historyMode) {
        if (Command.active && Command.bar.style.display !== 'none') {
          Command.completions = { history: matches };
          Command.updateCompletions(false);
        }
      } else if (Command.searchMode) {
        Command.searchMode = false;
        if (Command.active && Command.bar.style.display !== 'none') {
          Command.completions.history = matches;
          Command.updateCompletions(true);
        }
      }
      Marks.history = matches;
      break;
    case 'bookmarks':
      Marks.bookmarks = [];
      Marks.parse(response.bookmarks);
      break;
    case 'topsites':
      Search.topSites = response.sites;
      break;
    case 'buffers':
      if (Command.bar.style.display !== 'none') {
        var regexp;
        var val = Command.input.value.replace(/\S+\s+/, ''),
            useRegex = true;
        Command.hideData();
        Command.completions = {
          buffers: response.buffers.filter(function(s) {
            try {
              regexp = new RegExp(val, 'i');
            } catch (e) {
              useRegex = false;
            }
            if (useRegex) {
              return regexp.test(s[0]);
            }
            return s[0].substring(0, val.length) === val;
          })
        };
        Command.updateCompletions();
      }
      break;
    case 'sessions':
      sessions = response.sessions;
      break;
    case 'quickMarks':
      Marks.quickMarks = {};
      for (key in response.marks) {
        if (Array.isArray(response.marks[key])) {
          Marks.quickMarks[key] = response.marks[key];
        } else if (typeof response.marks[key] === 'string') {
          Marks.quickMarks[key] = [response.marks[key]];
        }
      }
      break;
    case 'bookmarkPath':
      if (response.path.length) {
        Command.completions = {};
        Command.completions.paths = response.path;
        Command.updateCompletions();
      } else {
        Command.hideData();
      }
      break;
  }
});

chrome.extension.onMessage.addListener(function(request, sender, callback) {
  switch (request.action) {
    case 'getWindows':
      if (request.windows && Command.active === true) {
        Command.completions = {
          windows: Object.keys(request.windows).map(function(e, i) {
            var tlen = request.windows[e].length.toString();
            return [(i+1).toString() + ' (' + tlen + (tlen === '1' ? ' Tab)' : ' Tabs)'),  request.windows[e].join(', '), e];
          })
        };
        Command.updateCompletions();
      }
      break;
    case 'commandHistory':
      for (var key in request.history) {
        Command.history[key] = request.history[key];
      }
      break;
    case 'updateLastSearch':
      if (!window.isContentFrame) {
        Find.lastSearch = request.value;
      }
      break;
    case 'sendSettings':
      Mappings.defaults = Object.clone(Mappings.defaultsClone);
      Mappings.shortCuts = Object.clone(Mappings.shortCutsClone);
      if (!Command.initialLoadStarted) {
        Command.configureSettings(request.settings);
      } else {
        Mappings.parseCustom(request.settings.MAPPINGS);
        settings = request.settings;
      }
      break;
    case 'confirm':
      callback(confirm(request.message));
      break;
    case 'cancelAllWebRequests':
      window.stop();
      break;
    case 'updateMarks':
      Marks.quickMarks = request.marks;
      break;
    case 'base64Image':
      chrome.runtime.sendMessage({action: 'openLinkTab', active: false, url: 'data:text/html;charset=utf-8;base64,' + window.btoa(reverseImagePost(request.data, null)), noconvert: true});
      break;
    case 'focusFrame':
      if (window.iframe) {
        iframe.style.display = 'none';
      }
      if (!window.isContentFrame && request.index === Frames.index) {
        Frames.focus(request.highlight);
        if (request.highlight) {
          iframe.style.display = 'none';
        }
      }
      break;
    case 'sendHighlight':
      if (!window.isContentFrame && request.index === Frames.index) {
        Find.clear();
        request.params.base = document.body;
        Find.highlight(request.params);
        port.postMessage({
          action: 'updateLastSearch',
          value: Find.lastSearch
        });
        // Find.search(false, 1);
      }
      break;
    case 'sessions':
      sessions = request.sessions;
      break;
    case 'nextCompletionResult':
      if (settings.cncpcompletion && Command.type === 'action' && commandMode && document.activeElement.id === 'cVim-command-bar-input') {
        if (window.isContentFrame) {
          Search.nextResult();
        } else {
          callback(true);
        }
        break;
      } else if (window.isContentFrame) {
        callback(true);
      }
      break;
    case 'deleteBackWord':
      if (!insertMode && document.activeElement.isInput()) {
        Mappings.insertFunctions.deleteWord();
        if (document.activeElement.id === 'cVim-command-bar-input') {
          Command.complete(Command.input.value);
        }
      }
      break;
    case 'getFilePath':
      var parsed = request.data;
      Marks.files = parsed;
      Marks.filePath();
      break;
    case 'toggleEnabled':
      addListeners();
      if (!settings) {
        chrome.runtime.sendMessage({action: 'getSettings'});
      }
      Command.init(request.state);
      break;
    case 'getBlacklistStatus':
      callback(Command.blacklisted);
      break;
    case 'alert':
      alert(request.message);
      break;
    case 'displayIframe':
      if (window.iframe) {
        iframe.style.display = 'block';
      }
      break;
    case 'sendKeySequence':
      if (window.isContentFrame) {
        window.focus();
        window.setTimeout(function() {
          Mappings.convertToAction(request.keys);
        });
      }
      break;
  }
});
