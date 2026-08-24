(function () {
  'use strict';

  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  var backToTop = document.getElementById('back-to-top');
  var progress = document.getElementById('reading-progress-bar');
  var article = document.getElementById('article-content');
  var postToc = document.getElementById('post-toc');
  var postTocNav = document.getElementById('post-toc-nav');
  var postTocProgress = document.getElementById('post-toc-progress');
  var tocHeadings = [];
  var tocLinks = [];

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('shileyuan-color-scheme', next); } catch (error) {}
    });
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  function updatePostToc() {
    if (!tocHeadings.length) return;
    var activeIndex = 0;
    tocHeadings.forEach(function (heading, index) {
      if (heading.getBoundingClientRect().top <= 145) activeIndex = index;
    });

    tocLinks.forEach(function (link, index) {
      var active = index === activeIndex;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    var activeLink = tocLinks[activeIndex];
    if (activeLink && postTocNav) {
      var linkTop = activeLink.offsetTop;
      if (linkTop < postTocNav.scrollTop) postTocNav.scrollTop = linkTop;
      else if (linkTop + activeLink.offsetHeight > postTocNav.scrollTop + postTocNav.clientHeight) {
        postTocNav.scrollTop = linkTop - postTocNav.clientHeight + activeLink.offsetHeight;
      }
    }

    if (postTocProgress && article) {
      var articleTop = article.getBoundingClientRect().top + window.scrollY;
      var start = articleTop - 145;
      var end = articleTop + article.offsetHeight - window.innerHeight * .55;
      var value = Math.max(0, Math.min(1, (window.scrollY - start) / Math.max(1, end - start)));
      postTocProgress.style.width = (value * 100) + '%';
    }
  }

  function onScroll() {
    var top = window.scrollY || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (height > 0 ? Math.min(100, top / height * 100) : 0) + '%';
    if (backToTop) backToTop.classList.toggle('visible', top > 500);
    if (document.body.classList.contains('is-post')) {
      document.body.classList.toggle('post-header-visible', top > 120);
    }
    updatePostToc();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTop) backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  if (article) {
    article.querySelectorAll('pre').forEach(function (pre) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code';
      button.textContent = '复制';
      button.addEventListener('click', function () {
        var code = pre.querySelector('code');
        navigator.clipboard.writeText((code || pre).textContent).then(function () {
          button.textContent = '已复制';
          window.setTimeout(function () { button.textContent = '复制'; }, 1600);
        });
      });
      pre.appendChild(button);
    });

    if (postToc && postTocNav) {
      tocHeadings = Array.from(article.querySelectorAll('h2, h3, h4'));
      tocHeadings.forEach(function (heading, index) {
        if (!heading.id) heading.id = 'section-' + (index + 1);
        var link = document.createElement('a');
        link.href = '#' + heading.id;
        link.className = 'toc-level-' + heading.tagName.slice(1);
        link.textContent = heading.textContent.trim().replace(/\s+/g, ' ');
        link.title = link.textContent;
        link.addEventListener('click', function (event) {
          event.preventDefault();
          heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
          try { history.replaceState(null, '', '#' + encodeURIComponent(heading.id)); } catch (error) {}
        });
        postTocNav.appendChild(link);
        tocLinks.push(link);
      });
      if (tocHeadings.length) {
        postToc.hidden = false;
        var count = document.getElementById('post-toc-count');
        if (count) count.textContent = String(tocHeadings.length).padStart(2, '0');
        updatePostToc();
      }
    }
  }

  var playground = document.getElementById('live-css-playground');
  var mutableStyle = document.getElementById('shileyuan-mutable-css');

  if (playground && mutableStyle && mutableStyle.sheet) {
    var tokens = Array.from(playground.querySelectorAll('.live-css-token'));
    var deleteHint = playground.querySelector('.live-css-delete-hint');
    var resetButton = playground.querySelector('.live-css-reset');
    var removedCount = 0;

    function findMutableRule(selector) {
      return Array.from(mutableStyle.sheet.cssRules).find(function (rule) {
        return rule.selectorText === selector;
      });
    }

    function applyTokenValue(token, value) {
      var property = token.dataset.property;
      var rule = findMutableRule(token.dataset.selector);
      value = value.trim();
      if (!rule || !CSS.supports(property, value)) {
        token.classList.add('invalid');
        return false;
      }
      token.classList.remove('invalid');
      rule.style.setProperty(property, value);
      return true;
    }

    function syncPalette(token, value) {
      token.querySelectorAll('.live-css-palette button').forEach(function (button) {
        button.classList.toggle('active', button.dataset.color.toLowerCase() === value.toLowerCase());
      });
    }

    function syncOptions(token, value) {
      token.querySelectorAll('.live-css-options button').forEach(function (button) {
        button.classList.toggle('active', button.dataset.value === value);
      });
    }

    function adjustNumericValue(token, input, direction) {
      var match = input.value.match(/-?(?:\d+\.?\d*|\.\d+)/);
      var step = Number(token.dataset.step);
      if (!match || !Number.isFinite(step)) return;

      var current = Number(match[0]);
      var minimum = token.dataset.min === undefined ? -Infinity : Number(token.dataset.min);
      var maximum = token.dataset.max === undefined ? Infinity : Number(token.dataset.max);
      var precision = (String(step).split('.')[1] || '').length;
      var next = Math.max(minimum, Math.min(maximum, current + step * direction));
      next = Number(next.toFixed(precision));
      if (Object.is(next, -0)) next = 0;

      var value = input.value.replace(match[0], String(next));
      if (applyTokenValue(token, value)) {
        input.value = value;
        syncPalette(token, value);
        syncOptions(token, value);
      }
    }

    function addStepper(token, input) {
      if (!token.dataset.step) return;
      var stepper = document.createElement('span');
      var up = document.createElement('button');
      var down = document.createElement('button');
      stepper.className = 'live-css-stepper';
      up.type = 'button';
      down.type = 'button';
      up.textContent = '▲';
      down.textContent = '▼';
      up.setAttribute('aria-label', '增大数值');
      down.setAttribute('aria-label', '减小数值');
      up.addEventListener('click', function () { adjustNumericValue(token, input, 1); });
      down.addEventListener('click', function () { adjustNumericValue(token, input, -1); });
      stepper.appendChild(up);
      stepper.appendChild(down);
      input.insertAdjacentElement('afterend', stepper);
      input.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        adjustNumericValue(token, input, event.key === 'ArrowUp' ? 1 : -1);
      });
    }

    function removeTokenCss(token) {
      if (token.classList.contains('removed')) return;
      var rule = findMutableRule(token.dataset.selector);
      if (rule) rule.style.removeProperty(token.dataset.property);
      token.classList.add('removed');
      token.setAttribute('aria-hidden', 'true');
      removedCount += 1;
      resetButton.hidden = false;
      window.setTimeout(function () { token.hidden = true; }, 180);
    }

    function resetTokens() {
      tokens.forEach(function (token) {
        var rule = findMutableRule(token.dataset.selector);
        if (rule) rule.style.setProperty(token.dataset.property, token.dataset.default);
        token.hidden = false;
        token.classList.remove('removed', 'invalid', 'dragging', 'delete-ready');
        token.removeAttribute('aria-hidden');
        token.style.removeProperty('left');
        token.style.removeProperty('top');
        token.style.removeProperty('right');
        token.style.removeProperty('bottom');
        var input = token.querySelector('.live-css-value');
        if (input) input.value = token.dataset.default;
        syncPalette(token, token.dataset.default);
        syncOptions(token, token.dataset.default);
      });
      removedCount = 0;
      resetButton.hidden = true;
      document.body.classList.remove('live-css-deleting');
    }

    tokens.forEach(function (token) {
      var valueInput = token.querySelector('.live-css-value');
      var paletteButtons = token.querySelectorAll('.live-css-palette button');
      var optionButtons = token.querySelectorAll('.live-css-options button');

      addStepper(token, valueInput);

      valueInput.addEventListener('input', function () {
        if (applyTokenValue(token, valueInput.value)) {
          syncPalette(token, valueInput.value);
          syncOptions(token, valueInput.value);
        }
      });
      valueInput.addEventListener('blur', function () {
        if (token.classList.contains('invalid')) {
          var rule = findMutableRule(token.dataset.selector);
          valueInput.value = rule.style.getPropertyValue(token.dataset.property).trim();
          token.classList.remove('invalid');
        }
      });
      paletteButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          valueInput.value = button.dataset.color;
          applyTokenValue(token, button.dataset.color);
          syncPalette(token, button.dataset.color);
        });
      });
      optionButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          valueInput.value = button.dataset.value;
          applyTokenValue(token, button.dataset.value);
          syncOptions(token, button.dataset.value);
        });
      });
      syncPalette(token, valueInput.value);
      syncOptions(token, valueInput.value);

      token.addEventListener('pointerdown', function (event) {
        if (event.target.closest('input, button')) return;
        event.preventDefault();
        token.setPointerCapture(event.pointerId);

        var area = playground.getBoundingClientRect();
        var rect = token.getBoundingClientRect();
        var startX = event.clientX;
        var startY = event.clientY;
        var originX = rect.left - area.left;
        var originY = rect.top - area.top;
        var outside = false;

        token.style.left = originX + 'px';
        token.style.top = originY + 'px';
        token.style.right = 'auto';
        token.style.bottom = 'auto';
        token.classList.add('dragging');

        function move(moveEvent) {
          var x = originX + moveEvent.clientX - startX;
          var y = originY + moveEvent.clientY - startY;
          token.style.left = x + 'px';
          token.style.top = y + 'px';
          var viewportLeft = area.left + x;
          var viewportTop = area.top + y;
          var edge = 7;
          outside = viewportLeft <= edge || viewportLeft + rect.width >= window.innerWidth - edge || viewportTop <= edge || viewportTop + rect.height >= window.innerHeight - edge;
          token.classList.toggle('delete-ready', outside);
          document.body.classList.toggle('live-css-deleting', outside);
        }

        function end() {
          token.removeEventListener('pointermove', move);
          token.removeEventListener('pointerup', end);
          token.removeEventListener('pointercancel', end);
          token.classList.remove('dragging', 'delete-ready');
          document.body.classList.remove('live-css-deleting');
          if (outside) removeTokenCss(token);
        }

        token.addEventListener('pointermove', move);
        token.addEventListener('pointerup', end);
        token.addEventListener('pointercancel', end);
      });
    });

    resetButton.addEventListener('click', resetTokens);
    if (deleteHint) deleteHint.setAttribute('aria-hidden', 'true');
  }
})();
