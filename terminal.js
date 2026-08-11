/* ============================================================
   terminal.js
   1. Injects the terminal panel into #terminal-mount on any page.
   2. Types the headline on pages that have one.
   Both are additive: the header nav and the real <h1> text work
   with this file absent.
   ============================================================ */

(function () {

  console.log('terminal.js v9 loaded');

  /* --------------------------------------------------------
     Pages. Add one line here and it appears in ls, cd, and
     tab completion everywhere.
     -------------------------------------------------------- */
  var PAGES = {
    about:       { file: 'about.html',       desc: 'background, inspirations, current work' },
    projects:    { file: 'projects.html',    desc: 'research, writing, things I built' },
    interactive: { file: 'interactive.html', desc: 'wander through my life sideways' },
    home:        { file: 'index.html',       desc: 'the front page' }
  };

  /* ========================================================
     terminal
     ======================================================== */

  var mount = document.getElementById('terminal-mount');

  if (mount) {
    mount.innerHTML =
      '<div class="term">' +
        '<div class="term-bar">nirvik@portfolio &mdash; bash</div>' +
        '<div class="term-body" id="term-body">' +
          '<p class="term-line term-dim">Type `help` for commands, or use the menu above.</p>' +
          '<p class="term-line">&nbsp;</p>' +
          '<p class="term-row" id="term-row">' +
            '<span class="term-prompt" aria-hidden="true">~ $</span>' +
            '<input class="term-input" id="term-input" type="text" ' +
                   'autocomplete="off" autocorrect="off" autocapitalize="off" ' +
                   'spellcheck="false" aria-label="Terminal command input">' +
          '</p>' +
        '</div>' +
      '</div>' +
      '<p class="term-hint">Try <code>ls</code>, then <code>cd about</code>.</p>';

    var body  = document.getElementById('term-body');
    var input = document.getElementById('term-input');
    var form  = document.getElementById('term-row');

    var history = [];
    var histIdx = 0;

    var print = function (text, cls) {
      var p = document.createElement('p');
      p.className = 'term-line' + (cls ? ' ' + cls : '');
      p.textContent = text;
      body.insertBefore(p, form);
      body.scrollTop = body.scrollHeight;
    };

    var echo = function (cmd) {
      var p = document.createElement('p');
      p.className = 'term-line';
      var s = document.createElement('span');
      s.className = 'term-prompt';
      s.textContent = '~ $';
      p.appendChild(s);
      p.appendChild(document.createTextNode(' ' + cmd));
      body.insertBefore(p, form);
    };

    var go = function (name) {
      print('opening ' + name + '...', 'term-ok');
      input.disabled = true;
      setTimeout(function () { window.location.href = PAGES[name].file; }, 320);
    };

    var COMMANDS = {
      help: function () {
        print('available commands', 'term-dim');
        print('  cd <page>    go to a page');
        print('  ls           list pages');
        print('  whoami       short version');
        print('  clear        wipe the screen');
        print('');
        print('tab completes, up/down repeats history.', 'term-dim');
      },
      ls: function () {
        Object.keys(PAGES).forEach(function (k) {
          print('  ' + k + new Array(Math.max(2, 14 - k.length)).join(' ') + PAGES[k].desc);
        });
      },
      whoami: function () {
        print('Nirvik Pande — sophomore, Carnegie Mellon.');
        print('CS, math, philosophy. AI safety, mostly alignment.');
        print('nirvikpande@gmail.com', 'term-dim');
      },
      clear: function () {
        Array.prototype.slice.call(body.querySelectorAll('.term-line')).forEach(function (n) {
          n.remove();
        });
      },
      pwd: function () { print('/home/nirvik'); },
      cd: function (arg) {
        if (!arg || arg === '~' || arg === '..' || arg === '/') { go('home'); return; }
        var target = arg.replace(/^\.?\//, '').replace(/\/$/, '').toLowerCase();
        if (PAGES[target]) { go(target); return; }
        print('cd: no such page: ' + arg, 'term-warn');
        print('try `ls` to see what is here.', 'term-dim');
      }
    };

    var run = function (raw) {
      var line = raw.trim();
      echo(line);
      if (!line) return;
      history.push(line);
      histIdx = history.length;

      var parts = line.split(/\s+/);
      var cmd = parts[0].toLowerCase();
      var arg = parts.slice(1).join(' ');

      if (COMMANDS[cmd]) { COMMANDS[cmd](arg); }
      else if (PAGES[cmd]) { go(cmd); }
      else {
        print(cmd + ': command not found', 'term-warn');
        print('type `help`.', 'term-dim');
      }
      body.scrollTop = body.scrollHeight;
    };

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var v = input.value;
        input.value = '';
        run(v);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
        else { histIdx = history.length; input.value = ''; }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        var v = input.value;
        var m = v.match(/^(cd\s+)(\S*)$/i);
        var stem = m ? m[2] : v;
        var hits = Object.keys(PAGES).filter(function (k) {
          return k.indexOf(stem.toLowerCase()) === 0;
        });
        if (hits.length === 1) input.value = (m ? m[1] : 'cd ') + hits[0];
      }
    });

    body.addEventListener('click', function () {
      if (window.getSelection().toString() === '') input.focus();
    });

    /* ------------------------------------------------------
       open / close
       ------------------------------------------------------ */

    /* The button is built here, not in the HTML. It only does
       something when this script runs, so it should only exist
       when this script runs — and it can't go missing from a
       page this way. */
    var btn = document.createElement('button');
    btn.className = 'term-toggle';
    btn.id = 'term-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'terminal-mount');
    btn.innerHTML = '<span aria-hidden="true">&gt;_</span> terminal';

    var navList = document.querySelector('.site-header nav ul');
    if (navList) {
      var li = document.createElement('li');
      li.appendChild(btn);
      navList.appendChild(li);
    }

    /* Starting state is decided by the page, every time:
       <body data-terminal="open"> opens it, anything else closes it.
       No memory, no exceptions. */
    var wide = function () { return window.matchMedia('(min-width: 62rem)').matches; };
    var open = document.body.getAttribute('data-terminal') === 'open';

    var apply = function (state, focus) {
      open = state;
      document.body.classList.toggle('term-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && focus && wide()) input.focus();
    };

    apply(open, false);

    btn.addEventListener('click', function () { apply(!open, true); });

    /* Escape closes it, the way you'd expect a panel to behave. */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) {
        apply(false, false);
        btn.focus();
      }
    });

    /* Focus the caret on load only when it's already open, we're on a
       wide screen, and no headline is mid-animation. */
    if (open && wide() && !document.querySelector('[data-type]')) input.focus();
  }

  /* ========================================================
     typed headline
     The real string lives in the HTML. We measure it, reserve
     the space, then retype it. No JS => full text, no shift.
     ======================================================== */

  var el = document.querySelector('[data-type]');
  if (!el) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var start = function () {
    var full = el.textContent;
    el.style.minHeight = el.getBoundingClientRect().height + 'px';
    el.textContent = '';

    var caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    el.appendChild(caret);

    var i = 0;
    var tick = function () {
      if (i < full.length) {
        el.insertBefore(document.createTextNode(full.charAt(i)), caret);
        i++;
        /* Slight pause at punctuation reads more like typing. */
        var d = ',.'.indexOf(full.charAt(i - 1)) > -1 ? 190 : 52 + Math.random() * 48;
        setTimeout(tick, d);
      } else {
        setTimeout(function () {
          caret.remove();
          var t = document.getElementById('term-input');
          if (t && document.body.classList.contains('term-open') &&
              window.matchMedia('(min-width: 62rem)').matches) t.focus();
        }, 1100);
      }
    };
    setTimeout(tick, 260);
  };

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  else window.addEventListener('load', start);

})();