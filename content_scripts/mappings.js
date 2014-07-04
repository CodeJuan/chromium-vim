var Mappings = {
  repeats: '',
  queue: '',
  siteSpecificBlacklists: ''
};

Mappings.actions = {

  toggleVisualMode: function() {
    if (!Command.domElementsLoaded) {
      return false;
    }
    Visual.caretModeActive = true;
    Visual.getTextNodes();
    Visual.lineMode = false;
    document.body.spellcheck = false;
    document.designMode = 'on';
    Visual.selection = document.getSelection();
    if (document.getSelection().type === 'Range') {
      return false;
    }
    if (Find.matches.length) {
      Visual.focusSearchResult();
    } else {
      var closestNode = Visual.closestNode();
      if (closestNode) {
        Visual.selection.setPosition(Visual.closestNode(), 0);
        HUD.display(' -- CARET -- ');
        Visual.scrollIntoView();
      } else {
        Visual.lineMode = false;
        Visual.visualModeActive = false;
        Visual.exit();
      }
    }
  },
  toggleVisualLineMode: function() {
    if (Visual.caretModeActive || Visual.visualModeActive) {
      return false;
    }
    Visual.caretModeActive = true;
    Visual.getTextNodes();
    Visual.lineMode = true;
    document.body.spellcheck = false;
    document.designMode = 'on';
    Visual.selection = document.getSelection();
    if (document.getSelection().type === 'Range') {
      return false;
    }
    if (Find.matches.length) {
      Visual.focusSearchResult(true);
    }
  },
  openLastHint: function() {
    Hints.dispatchAction(Hints.lastClicked);
  },
  nextMatchPattern: function() {
    Hints.matchPatterns(true);
  },
  previousMatchPattern: function() {
    Hints.matchPatterns(false);
  },
  cancelWebRequest: function() {
    window.stop();
  },
  cancelAllWebRequests: function() {
    chrome.runtime.sendMessage({action: 'cancelAllWebRequests'});
  },
  percentScroll: function(repeats) {
    if (Mappings.repeats === '0' || Mappings.repeats === '') {
      repeats = 0;
    }
    document.body.scrollTop =
      (document.body.scrollHeight - window.innerHeight) * repeats / 100;
  },
  goToTab: function(repeats) {
    chrome.runtime.sendMessage({action: 'goToTab', index: repeats - 1});
  },
  hideDownloadsShelf: function() {
    chrome.runtime.sendMessage({action: 'hideDownloadsShelf'});
  },
  goToRootUrl: function() {
    if (window.location.pathname.length !== 0 && window.location.pathname !== '/') {
      chrome.runtime.sendMessage({
        action: 'openLink',
        tab: {
          pinned: false
        },
        url: window.location.origin
      });
    }
  },
  goUpUrl: function(repeats) {
    var rxp = new RegExp('(\/([^\/])+){0,' + repeats + '}(\/)?$');
    if (window.location.pathname.length !== 0 && window.location.pathname !== '/') {
      var match = window.location.pathname.replace(rxp, '');
      if (match !== window.location.pathname) {
        chrome.runtime.sendMessage({
          action: 'openLink',
          tab: {
            pinned: false
          },
          url: window.location.origin + match
        });
      }
    }
  },
  nextFrame: function(repeats) {
    chrome.runtime.sendMessage({action: 'focusFrame', repeats: repeats});
  },
  rootFrame: function() {
    chrome.runtime.sendMessage({action: 'focusFrame', isRoot: true});
  },
  closeTab: function(repeats) {
    chrome.runtime.sendMessage({action: 'closeTab', repeats: repeats});
  },
  pinTab: function() {
    chrome.runtime.sendMessage({action: 'pinTab'});
  },
  firstTab: function() {
    chrome.runtime.sendMessage({action: 'firstTab'});
  },
  lastTab: function() {
    chrome.runtime.sendMessage({action: 'lastTab'});
  },
  lastClosedTab: function() {
    chrome.runtime.sendMessage({action: 'openLast'});
  },
  moveTabRight: function(repeats) {
    chrome.runtime.sendMessage({action: 'moveTabRight', repeats: repeats});
  },
  moveTabLeft: function(repeats) {
    chrome.runtime.sendMessage({action: 'moveTabLeft', repeats: repeats});
  },
  lastActiveTab: function() {
    chrome.runtime.sendMessage({action: 'lastActiveTab'});
  },
  reverseImage: function() {
    if (/\(\d+×\d+\)$/.test(document.title) === true && document.body.firstChild.localName === 'img') {
      if (document.body.firstChild.src) {
        return chrome.runtime.sendMessage({
          action: 'openLinkTab',
          active: false,
          url: 'https://www.google.com/searchbyimage?image_url=' +
                document.body.firstChild.src,
          noconvert: true
        });
      }
    } else {
      window.setTimeout(function() {
        Hints.create('image');
      }, 0);
    }
  },
  multiReverseImage: function() {
    window.setTimeout(function() {
      Hints.create('multiimage');
    }, 0);
  },
  toggleImages: function() {
    if (!this.imagesDisabled) {
      this.images = [];
      var walker = document.createTreeWalker(document.body, 1, false, null);
      var el;
      while (el = walker.nextNode()) {
        var computedStyle = getComputedStyle(el, null);
        if (el.localName === 'img' || computedStyle.getPropertyValue('background-image') !== 'none') {
          var opacity = computedStyle.getPropertyValue('opacity');
          var bimg = computedStyle.getPropertyValue('background-image');
          if (opacity === '1') {
            opacity = null;
          }
          if (bimg === 'none') {
            bimg = null;
          }
          this.images.push([opacity, bimg, el]);
        }
      }
    }
    this.imagesDisabled = (this.imagesDisabled === void 0 ? true : !this.imagesDisabled);
    for (i = 0, l = this.images.length; i < l; ++i) {
      if (this.images[i][2].localName === 'img') {
        this.images[i][2].style.opacity = (this.imagesDisabled ? '0' : this.images[i][1]);
      }
      if (this.images[i][1] !== null) {
        if (this.imagesDisabled) {
          this.images[i][2].style.backgroundImage = 'none';
        } else {
          this.images[i][2].style.backgroundImage = this.images[i][1];
        }
      }
    }
  },
  toggleImageZoom: function() {
    if (/\.[a-z]+\s+\(\d+×\d+\)/.test(document.title)) {
      var images = document.getElementsByTagName('img');
      if (images.length) {
        images[0].simulateClick();
      }
    }
  },
  zoomPageIn: function(repeats) {
    document.body.style.zoom =
      (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1) + 0.1 * repeats;
  },
  zoomPageOut: function(repeats) {
    document.body.style.zoom =
      (+document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1) - 0.1 * repeats;
  },
  zoomOrig: function() {
    document.body.style.zoom = '1';
  },
  centerMatchT: function() {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index]) {
      window.scrollBy(0, Find.matches[Find.index].getBoundingClientRect().top * documentZoom);
    }
  },
  centerMatchH: function() {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index]) {
      var scrollOffset = (function() {
        return this.matches[this.index].getBoundingClientRect().top *
               documentZoom + this.matches[this.index].offsetHeight -
               0.5 * window.innerHeight;
      }).call(Find);
      window.scrollBy(0, scrollOffset);
    }
  },
  centerMatchB: function() {
    var documentZoom = parseFloat(document.body.style.zoom) || 1;
    if (Find.matches.length && Find.matches[Find.index]) {
      var scrollOffset = (function() {
        return this.matches[this.index].getBoundingClientRect().top *
               documentZoom + this.matches[this.index].offsetHeight *
               documentZoom - window.innerHeight;
      }).call(Find);
      window.scrollBy(0, scrollOffset);
    }
  },
  openLastLinkInTab: function(repeats) {
    chrome.runtime.sendMessage({
      action: 'openLastLinkInTab',
      repeats: repeats
    });
  },
  openNextLinkInTab: function(repeats) {
    chrome.runtime.sendMessage({
      action: 'openNextLinkInTab',
      repeats: repeats
    });
  },
  scrollDown: function(repeats) {
    Scroll.scroll('down', repeats);
  },
  scrollUp: function(repeats) {
    Scroll.scroll('up', repeats);
  },
  scrollPageDown: function(repeats) {
    Scroll.scroll('pageDown', repeats);
  },
  scrollFullPageDown: function(repeats) {
    Scroll.scroll('fullPageDown', repeats);
  },
  scrollPageUp: function(repeats) {
    Scroll.scroll('pageUp', repeats);
  },
  scrollFullPageUp: function(repeats) {
    Scroll.scroll('fullPageUp', repeats);
  },
  scrollLeft: function(repeats) {
    Scroll.scroll('left', repeats);
  },
  scrollRight: function(repeats) {
    Scroll.scroll('right', repeats);
  },
  scrollToTop: function() {
    Scroll.scroll('top');
  },
  scrollToBottom: function() {
    Scroll.scroll('bottom');
  },
  scrollToLeft: function() {
    Scroll.scroll('leftmost');
  },
  scrollToRight: function() {
    Scroll.scroll('rightmost');
  },
  lastScrollPosition: function() {
    if (!Scroll.lastPosition) {
      return;
    }
    var currentPosition = [document.body.scrollLeft, document.body.scrollTop];
    window.scrollTo.apply(null, Scroll.lastPosition);
    Scroll.lastPosition = currentPosition;
  },
  goToMark: function(repeats, queue) {
    var key = queue.slice(-1);
    if (Scroll.positions.hasOwnProperty(key)) {
      Scroll.lastPosition = [document.body.scrollLeft, document.body.scrollTop];
      window.scrollTo.apply(null, Scroll.positions[key]);
    } else {
      Status.setMessage('Mark not set', 1, 'error');
    }
  },
  setMark: function(repeats, queue) {
    Scroll.positions[queue.slice(-1)] = [document.body.scrollLeft, document.body.scrollTop];
  },
  createHint: function() {
    window.setTimeout(function() {
      Hints.create();
    }, 0);
  },
  createTabbedHint: function() {
    window.setTimeout(function() {
      Hints.create('tabbed');
    }, 0);
  },
  createActiveTabbedHint: function() {
    window.setTimeout(function() {
      Hints.create('tabbedActive');
    }, 0);
  },
  createMultiHint: function() {
    window.setTimeout(function() {
      Hints.create('multi');
    }, 0);
  },
  createHintWindow: function() {
    window.setTimeout(function() {
      Hints.create('window');
    }, 0);
  },
  createHoverHint: function() {
    window.setTimeout(function() {
      Hints.create('hover');
    }, 0);
  },
  createUnhoverHint: function() {
    window.setTimeout(function() {
      Hints.create('unhover');
    }, 0);
  },
  yankUrl: function() {
    window.setTimeout(function() {
      Hints.create('yank');
    }, 0);
  },
  multiYankUrl: function() {
    window.setTimeout(function() {
      Hints.create('multiyank');
    }, 0);
  },
  yankDocumentUrl: function() {
    Clipboard.copy(document.URL);
    Status.setMessage(document.URL, 2);
  },
  openPaste: function() {
    Clipboard.paste(false);
  },
  openPasteTab: function(repeats) {
    for (var i = 0; i < repeats; ++i) {
      Clipboard.paste(true);
    }
  },
  nextCompletionResult: function() {
    commandMode &&
      document.activeElement.id === 'cVim-command-bar-input' &&
      Command.type === 'action' &&
      Search.nextResult(false);
  },
  previousCompletionResult: function() {
    commandMode &&
      document.activeElement.id === 'cVim-command-bar-input' &&
      Command.type === 'action' &&
      Search.nextResult(true);
  },
  addQuickMark: function(repeats, queue) {
    Marks.addQuickMark(queue.slice(-1));
  },
  openQuickMark: function(repeats, queue) {
    Marks.openQuickMark(queue.slice(-1), false, repeats);
  },
  openQuickMarkTabbed: function(repeats, queue) {
    Marks.openQuickMark(queue.slice(-1), true, repeats);
  },
  insertMode: function() {
    if (Command.domElementsLoaded) {
      HUD.display(' -- INSERT -- ');
      insertMode = true;
    }
  },
  reloadTab: function() {
    chrome.runtime.sendMessage({action: 'reloadTab', nocache: false});
  },
  reloadTabUncached: function() {
    chrome.runtime.sendMessage({action: 'reloadTab', nocache: true});
  },
  reloadAllButCurrent: function() {
    chrome.runtime.sendMessage({action: 'reloadAllTabs', nocache: false, current: false});
  },
  reloadAllTabs: function() {
    chrome.runtime.sendMessage({action: 'reloadAllTabs', nocache: false, current: true});
  },
  nextSearchResult: function(repeats) {
    if (Find.matches.length) {
      Find.search(false, repeats);
    } else if (Find.lastSearch !== void 0 && typeof Find.lastSearch === 'string') {
      Find.highlight({
        base: document.body,
        search: Find.lastSearch,
        setIndex: true,
        executeSearch: true
      });
    }
  },
  previousSearchResult: function(repeats) {
    if (Find.matches.length) {
      Find.search(true, repeats);
    } else if (Find.lastSearch !== void 0 && typeof Find.lastSearch === 'string') {
      Find.highlight({
        base: document.body,
        search: Find.lastSearch,
        setIndex: true,
        executeSearch: true,
        reverse: true
      });
    }
  },
  nextTab: function(r) {
    chrome.runtime.sendMessage({action: 'nextTab', repeats: r});
  },
  previousTab: function(r) {
    chrome.runtime.sendMessage({action: 'previousTab', repeats: r});
  },
  goBack: function(repeats) {
    history.go(-1 * repeats);
  },
  goForward: function(repeats) {
    history.go(1 * repeats);
  },
  goToSource: function() {
    chrome.runtime.sendMessage({
      action: 'openLinkTab',
      active: true,
      url: 'view-source:' + document.URL,
      noconvert: true
    });
  },
  goToLastInput: function() {
    if (this.inputElements && this.inputElements[this.inputElementsIndex]) {
      this.inputElements[this.inputElementsIndex].focus();
    }
  },
  goToInput: function(repeats) {
    this.inputElements = [];
    var allInput = document.querySelectorAll('input,textarea'),
        i;
    for (i = 0, l = allInput.length; i < l; i++) {
      if (allInput[i].isInput() && allInput[i].isVisible() && allInput[i].id !== 'cVim-command-bar-input') {
        this.inputElements.push(allInput[i]);
      }
    }
    if (this.inputElements.length === 0) {
      return false;
    }
    this.inputElementsIndex = repeats % this.inputElements.length - 1;
    if (this.inputElementsIndex < 0) {
      this.inputElementsIndex = 0;
    }
    for (i = 0, l = this.inputElements.length; i < l; i++) {
      var br = this.inputElements[i].getBoundingClientRect();
      if (br.top + br.height >= 0 &&
          br.left + br.width >= 0 &&
          br.right - br.width <= window.innerWidth &&
          br.top < window.innerHeight) {
        this.inputElementsIndex = i;
        break;
      }
    }
    this.inputFocused = true;
    this.inputElements[this.inputElementsIndex].focus();
    document.activeElement.select();
    if (!document.activeElement.getAttribute('readonly')) {
      document.getSelection().collapseToEnd();
    }
  },
  shortCuts: function(s, repeats) {
    if (!Command.domElementsLoaded) {
      return false;
    }
    if (!window.isContentFrame) {
      return chrome.runtime.sendMessage({action: 'sendKeySequence', keys: Mappings.queue, frameIndex: +Frames.index});
    }
    for (var i = 0, l = Mappings.shortCuts.length; i < l; i++) {
      if (s === Mappings.shortCuts[i][0]) {
        commandMode = true;
        return window.setTimeout(function() {
          Command.show(false,
            Mappings.shortCuts[i][1]
                    .replace(/^:/, '')
                    .replace(/<cr>(\s+)?$/i, '')
                    .replace(/<space>/ig, ' ')
          );
          this.queue = '';
          this.repeats = '';
          if (/<cr>(\s+)?$/i.test(Mappings.shortCuts[i][1])) {
            var inputValue = Command.input.value;
            Command.hide(function() {
              Command.execute(inputValue, repeats);
            });
          } else {
            Command.complete(Command.input.value);
          }
        }, 0);
      }
    }
  },
  openSearchBar: function() {
    if (!window.isContentFrame) {
      Find.lastIndex = Find.index;
      Find.previousMatches = Find.matches.length > 0;
      Find.swap = false;
      if (document && document.body) {
        Command.lastScrollTop = document.body.scrollTop;
      }
      return chrome.runtime.sendMessage({action: 'sendKeySequence', keys: Mappings.queue, frameIndex: +Frames.index});
    }
    commandMode = true;
    return Command.show('/');
  },
  openSearchBarReverse: function() {
    if (!window.isContentFrame) {
      return chrome.runtime.sendMessage({action: 'sendKeySequence', keys: Mappings.queue, frameIndex: +Frames.index});
    }
    // Command.hide();
    Find.lastIndex = Find.index;
    commandMode = true;
    if (document && document.body) {
      Command.lastScrollTop = document.body.scrollTop;
    }
    Find.previousMatches = Find.matches.length > 0;
    Find.swap = true;
    return Command.show('?');
  },
  openCommandBar: function() {
    if (window.isContentFrame) {
      commandMode = true;
      return Command.show(false);
    } else {
      chrome.runtime.sendMessage({action: 'sendKeySequence', keys: Mappings.queue, frameIndex: +Frames.index});
    }
  }

};

Mappings.shortCuts = [
  ['a',  ':tabnew google '],
  ['zr', ':chrome://restart&<CR>'],
  ['o',  ':open '],
  ['O',  ':open @%'],
  ['b',  ':bookmarks '],
  ['t',  ':tabnew '],
  ['I',  ':history '],
  ['T',  ':tabnew @%'],
  ['B',  ':buffer '],
  ['gd', ':chrome://downloads!<cr>'],
  ['ge', ':chrome://extensions!<cr>']
];

Mappings.defaults = {
  closeTab:                ['x'],
  scrollDown:              ['s', 'j'],
  scrollUp:                ['w', 'k'],
  scrollPageUp:            ['e', 'u'],
  scrollFullPageUp:        [],
  scrollPageDown:          ['d'],
  scrollFullPageDown:      [],
  scrollToTop:             ['gg'],
  scrollToBottom:          ['G'],
  scrollLeft:              ['h'],
  scrollRight:             ['l'],
  scrollToLeft:            ['0'],
  scrollToRight:           ['$'],
  insertMode:              ['i'],
  reloadTab:               ['r'],
  reloadAllTabs:           [],
  reloadAllButCurrent:     ['cr'],
  reloadTabUncached:       ['gR'],
  createHint:              ['f'],
  createMultiHint:         ['mf'],
  nextMatchPattern:        [']]'],
  previousMatchPattern:    ['[['],
  createHintWindow:        ['W'],
  pinTab:                  ['gp'],
  moveTabRight:            ['>'],
  moveTabLeft:             ['<'],
  toggleCvim:              ['<A-z>'],
  goBack:                  ['H', 'S'],
  reverseImage:            ['gr'],
  multiReverseImage:       ['mr'],
  goForward:               ['L', 'D'],
  firstTab:                ['g0'],
  addQuickMark:            ['M*'],
  openLastHint:            ['A'],
  openQuickMark:           ['go*'],
  openQuickMarkTabbed:     ['gn*'],
  cancelWebRequest:        ['gq'],
  openLastLinkInTab:       ['<C-S-h>', 'gh'],
  openNextLinkInTab:       ['<C-S-l>', 'gl'],
  cancelAllWebRequests:    ['gQ'],
  createHoverHint:         ['q'],
  toggleImages:            ['ci'],
  createUnhoverHint:       ['Q'],
  lastTab:                 ['g$'],
  lastClosedTab:           ['X'],
  hideDownloadsShelf:      ['gj'],
  createTabbedHint:        ['F'],
  createActiveTabbedHint:  [],
  goToInput:               ['gi'],
  goToLastInput:           ['gI'],
  nextTab:                 ['K', 'R', 'gt'],
  nextFrame:               ['gf'],
  rootFrame:               ['gF'],
  lastActiveTab:           ['g\''],
  percentScroll:           ['g%'],
  goToTab:                 ['%'],
  toggleImageZoom:         ['z<Enter>'],
  zoomPageIn:              ['zi'],
  zoomPageOut:             ['zo'],
  zoomOrig:                ['z0'],
  lastScrollPosition:      ['\'\''],
  goToMark:                ['\'*'],
  setMark:                 [';*'],
  toggleBlacklisted:       [],
  centerMatchT:            ['zt'],
  centerMatchB:            ['zb'],
  centerMatchH:            ['zz'],
  goToSource:              ['gs'],
  goToRootUrl:             ['gU'],
  goUpUrl:                 ['gu'],
  yankUrl:                 ['gy'],
  multiYankUrl:            ['my'],
  yankDocumentUrl:         ['yy'],
  openPaste:               ['p'],
  toggleVisualMode:        ['v'],
  toggleVisualLineMode:    ['V'],
  openPasteTab:            ['P'],
  previousTab:             ['J', 'E', 'gT'],
  nextSearchResult:        ['n'],
  previousSearchResult:    ['N'],
  openSearchBar:           ['/'],
  openSearchBarReverse:    ['?'],
  openCommandBar:          [':'],
  shortCuts:               []
};

Mappings.toggleCvim = [];
Mappings.toggleBlacklisted = [];
Mappings.defaultsClone = Object.clone(Mappings.defaults);
Mappings.shortCutsClone = Object.clone(Mappings.shortCuts);

Mappings.insertDefaults = {
  deleteWord:        ['<C-y>'],
  deleteForwardWord: ['<C-p>'],
  beginningOfLine:   ['<C-a>'],
  editWithVim:       ['<C-i>'],
  endOfLine:         ['<C-e>'],
  deleteToBeginning: ['<C-u>'],
  deleteToEnd:       ['<C-o>'],
  forwardChar:       ['<C-f>'],
  backwardChar:      ['<C-b>'],
  forwardWord:       ['<C-l>'],
  backwardWord:      ['<C-h>']
};

Mappings.insertFunctions = {
  editWithVim: function() {
    if (this.externalVimReq) {
      this.externalVimReq.abort();
    }
    this.externalVimReq = new XMLHttpRequest();
    var textbox = document.activeElement;
    this.externalVimReq.open('POST', 'http://127.0.0.1:8001');
    this.externalVimReq.onreadystatechange = function() {
      if (this.readyState === 4 && this.status === 200) {
        textbox.value = this.responseText.replace(/\n$/, ''); // Avoid ending newline
      }
    };
    this.externalVimReq.send(textbox.value);
  },
  deleteWord: function() {
    var activeElement = document.activeElement,
        left = activeElement.value.slice(0, activeElement.selectionStart),
        right = activeElement.value.slice(activeElement.selectionStart);
    if (activeElement.id === 'cVim-command-bar-input') {
      left = left.replace(/[^\/ ]*\/*\s*$/, '');
    } else {
      left = left.replace(/([a-zA-Z0-9_]+|[^a-zA-Z0-9\s]+)+[\n ]*$/, '');
    }
    activeElement.value = left + right;
    activeElement.selectionStart -= activeElement.value.length - left.length;
    activeElement.selectionEnd = activeElement.selectionStart;
    return true;
  },
  beginningOfLine: function() {
    document.activeElement.selectionStart = 0;
    document.activeElement.selectionEnd = 0;
    return true;
  },
  endOfLine: function() {
    document.activeElement.selectionStart = document.activeElement.value.length;
    document.activeElement.selectionEnd = document.activeElement.selectionStart;
    return true;
  },
  deleteToBeginning: function() {
    document.activeElement.value =
      document.activeElement.value.slice(document.activeElement.selectionStart - 1, -1);
    document.activeElement.selectionStart = 0;
    document.activeElement.selectionEnd = 0;
    return true;
  },
  deleteToEnd: function() {
    document.activeElement.value =
      document.activeElement.value.substring(0, document.activeElement.selectionStart);
    return true;
  },
  forwardChar: function() {
    document.activeElement.selectionStart += 1;
    return true;
  },
  backwardChar: function() {
    document.activeElement.selectionStart -= 1;
    document.activeElement.selectionEnd -= 1;
    return true;
  },
  forwardWord: function() {
    var aval = (document.activeElement.value + ' ').slice(document.activeElement.selectionStart, -1);
    var diff = aval.length - aval.replace(/^([a-zA-Z_]+|[^a-zA-Z\s]+)[\s\n]*/, '').length;
    if (diff === 0) {
      document.activeElement.selectionStart = document.activeElement.value.length;
    } else {
      document.activeElement.selectionStart += diff;
    }
    return true;
  },
  backwardWord: function() {
    var aval = document.activeElement.value.slice(0, document.activeElement.selectionStart);
    var diff = aval.length - aval.replace(/([a-zA-Z_]+|[^a-zA-Z\s]+)[\s\n]*$/, '').length;
    document.activeElement.selectionStart -= diff;
    document.activeElement.selectionEnd -= diff;
    return true;
  },
  deleteForwardWord: function() {
    var start = document.activeElement.selectionStart;
    var end = document.activeElement.selectionEnd;
    if (start !== end) {
      return false;
    }
    var s = document.activeElement.value.slice(0, start);
    var e = document.activeElement.value.slice(start);
    e = e.replace(/^([a-zA-Z_]+|\s+|[^\s\na-zA-Z]+)(\s+)?/, '');
    document.activeElement.value = s + e;
    document.activeElement.selectionStart = s.length;
    document.activeElement.selectionEnd = s.length;
    return true;
  }
};

Mappings.getInsertFunction = function(modifier, callback) {
  var validMapping = false;
  for (var key in this.insertDefaults) {
    if (typeof this.insertDefaults[key] !== 'object') {
      continue;
    }
    this.insertDefaults[key].forEach(function(item) {
      if (!validMapping && modifier === item) {
        validMapping = true;
        callback(key);
      }
    });
    if (validMapping) {
      break;
    }
  }
};

Mappings.insertCommand = function(modifier, callback) {
  this.getInsertFunction(modifier, function(func) {
    if (func && document.activeElement.hasOwnProperty('value')) {
      callback(Mappings.insertFunctions[func]());
    }
  });
};

Mappings.removeMapping = function(list, mapping) {
  for (var key in list) {
    if (Array.isArray(list[key])) {
      while (list[key].indexOf(mapping) !== -1) {
        list[key].splice(list[key].indexOf(mapping), 1);
      }
    }
  }
};

Mappings.indexFromKeybinding = function(keybinding) {
  for (var key in this.defaults) {
    if (Array.isArray(this.defaults[key]) && this.defaults[key].indexOf(keybinding) !== -1) {
      return key;
    }
  }
  return null;
};

Mappings.parseCustom = function(config) {
  config += this.siteSpecificBlacklists;
  config = config.split(/\n+/).map(function(item) {
    return item.replace(/(\s+)?'.*/, '')
               .split(/ +/)
               .map(function(e) {
                  return e.trimAround();
                });
  });
  config.forEach(function(mapping) {
    var key;
    if (mapping.length === 0) {
      return false;
    }
    if (!/^(imap|(re)?map|i?unmap(All)?)$/.test(mapping[0]) ||
        (mapping.length < 3 && /^((re)?map|imap)$/.test(mapping[0]))) {
      return false;
    }

    if (mapping.length === 1) {
      if (mapping[0] === 'unmapAll') {
        for (key in Mappings.defaults) {
          if (Array.isArray(Mappings.defaults[key])) {
            Mappings.defaults[key] = [];
          }
        }
        Mappings.shortCuts = [];
      } else if (mapping[0] === 'iunmapAll') {
        for (key in Mappings.insertDefaults) {
          if (Array.isArray(Mappings.insertDefaults[key])) {
            Mappings.insertDefaults[key] = [];
          }
        }
      }
      return;
    }

    if (mapping[0] === 'map' || mapping[0] === 'remap') {
      mapping[1] = mapping[1].replace(/<c(-s-)?/i, function(e) {
        return e.toUpperCase();
      }).replace(/<leader>/i, settings.mapleader);
      var fromKey = Mappings.indexFromKeybinding(mapping[2]);
      for (key in Mappings.defaults) {
        if (Array.isArray(Mappings.defaults[key])) {
          var match = Mappings.defaults[key].indexOf(mapping[1]);
          if (match !== -1) {
            Mappings.defaults[key].splice(match, 1);
          }
          if (fromKey !== null) {
            Mappings.defaults[fromKey].push(mapping[1]);
          }
        }
      }
      if (mapping[2][0] === ':') {
        return Mappings.shortCuts.push([mapping[1], mapping.slice(2).join(' ')]);
      }
      if (Object.keys(Mappings.defaults).indexOf(mapping[2]) !== -1) {
        return Mappings.defaults[mapping[2]].push(mapping[1]);
      }
      return;
    }

    if (mapping[0] === 'imap') {
      mapping.shift();
      mapping[0] = mapping[0].replace(/<c(-s-)?/i, function(e) {
        return e.toUpperCase();
      });
      if (Mappings.insertDefaults.hasOwnProperty(mapping[1])) {
        return Mappings.insertDefaults[mapping[1]].push(mapping[0]);
      }
      return;
    }

    if (mapping.length === 2) {
      mapping[1] = mapping[1].replace(/<c(-s-)?/i, function(e) {
        return e.toUpperCase();
      });
      if (mapping[0] === 'iunmap') {
        return Mappings.removeMapping(Mappings.insertDefaults, mapping[1]);
      }
      if (mapping[0] === 'unmap') {
        Mappings.removeMapping(Mappings.defaults, mapping[1]);
        Mappings.shortCuts = Mappings.shortCuts.filter(function(item) {
          return item[0] !== mapping[1];
        });
      }
    }
  });
  Mappings.toggleCvim = Mappings.defaults.toggleCvim;
  Mappings.toggleBlacklisted = Mappings.defaults.toggleBlacklisted;
  delete Mappings.defaults.toggleCvim;
  delete Mappings.defaults.toggleBlacklisted;
  Mappings.shortCuts = Mappings.shortCuts.map(function(item) {
    item[1] = item[1].replace(/@%/, document.URL);
    return item;
  });
  Mappings.shortCuts.forEach(function(item) {
    Mappings.defaults.shortCuts.push(item[0]);
  });
};

Mappings.executeSequence = function(c, r) {
  if (!c.length) {
    return;
  }
  if (/^[0-9]+/.test(c)) {
    r = c.match(/^[0-9]+/)[0];
    c = c.replace(/^[0-9]+/, '');
    this.repeats = r;
    if (!c.length) {
      return;
    }
  }
  var com = c[0];
  this.queue += com;
  this.queue = this.queue.slice(0, -1);
  this.convertToAction(com);
  if (!commandMode && !document.activeElement.isInput()) {
    Mappings.executeSequence(c.substring(1), r);
  }
};

Mappings.isValidQueue = function(wildCard) {
  var wild, key, i;
  for (key in this.defaults) {
    for (i = 0, l = this.defaults[key].length; i < l; i++) {
      wild = this.defaults[key][i].replace(/\*$/, wildCard);
      if (wild.substring(0, Mappings.queue.length) === Mappings.queue) {
        return true;
      }
    }
  }
};

Mappings.handleEscapeKey = function() {

  this.queue = '';
  this.repeats = '';

  if (commandMode) {
    if (Command.type === 'search') {
      document.body.scrollTop = Command.lastScrollTop;
      if (Find.previousMatches && Command.input.value && Find.lastSearch && Find.lastSearch !== Command.input.value) {
        Find.clear();
        HUD.hide();
        Find.highlight({ base: document.body,
          search: Find.lastSearch,
          setIndex: false,
          executeSearch: false,
          reverse: true,
          saveSearch: true });
        Find.index = Find.lastIndex - 1;
        Find.search(false, 1, false);
      }
    }
    Command.hideData();
    return Command.hide();
  }

  if (document.activeElement.isInput()) {
    this.actions.inputFocused = false;
    return document.activeElement.blur();
  }

  if (window.isContentFrame === true) {
    return;
  }

  if (Hints.active) {
    return Hints.hideHints(false, false);
  }

  if (insertMode) {
    insertMode = false;
    return HUD.hide();
  }

  if (Hints.lastHover) {
    Hints.lastHover.unhover();
    Hints.lastHover = null;
    return;
  }

  if (Find.matches.length) {
    Find.clear();
    return HUD.hide();
  }
};

Mappings.convertToAction = function(c) {
  if (c === '<Esc>' || c === '<C-[>') {
    return this.handleEscapeKey();
  }
  var addOne = false;
  if (!c || c.trim() === '') {
    return false;
  }
  if (!window.isContentFrame && Hints.active) {
    if (settings.numerichints && c === '<Enter>') {
      if (Hints.numericMatch) {
        return Hints.dispatchAction(Hints.numericMatch);
      }
      return Hints.hideHints(false);
    }
    if (settings.typelinkhints) {
      if (c === ';') {
        Hints.changeFocus();
      } else {
        Hints.handleHint(c.replace('<Space>', ' '));
      }
      return true;
    }
    if (c === '<Space>') {
      Hints.hideHints(false);
      return true;
    }
    return (c === ';' ? Hints.changeFocus() : Hints.handleHint(c));
  }
  if (/^[0-9]$/.test(c) && !(c === '0' && Mappings.repeats === '') && Mappings.queue.length === 0) {
    return Mappings.repeats += c;
  }

  Mappings.queue += c;
  for (var key in this.defaults) {
    if (!this.isValidQueue(c)) {
      Mappings.queue = '';
      Mappings.repeats = '';
      Mappings.validMatch = false;
      return false;
    }

    Mappings.validMatch = true;
    for (var i = 0, l = this.defaults[key].length; i < l; i++) {
      if (Mappings.queue === this.defaults[key][i].replace(/\*$/, c)) {
        Mappings.validMatch = false;
        if (/^0?$/.test(Mappings.repeats)) {
          addOne = true;
        }
        if (Mappings.actions.hasOwnProperty(key)) {
          if (key === 'shortCuts') {
            Mappings.actions[key](Mappings.queue, (addOne ? 1 : +Mappings.repeats));
          } else {
            Mappings.actions[key]((addOne ? 1 : +Mappings.repeats), Mappings.queue);
          }
        }
        window.clearTimeout(this.timeout);
        Mappings.queue = '';
        Mappings.repeats = '';
      }
    }
  }
  if (this.queue.length && c === settings.mapleader) {
    this.timeout = window.setTimeout(function() {
      Mappings.queue = '';
    }, settings.timeoutlen);
  }
  return true;
};
