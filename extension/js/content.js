/*
 * License:
 *
 * This software is distributed under the terms of the GNU General Public License v3.
 * https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Copyright (c) 2017, Iván Ruvalcaba <mario.i.ruvalcaba[at]gmail[dot]com>
 */

// Based on 'highlight: JavaScript text higlighting jQuery plugin' by Johann Burkard.
// http://johannburkard.de/blog/programming/javascript/highlight-javascript-text-higlighting-jquery-plugin.html
// MIT license.

function keywordsHighlighter(options, remove) {
  let occurrences = 0;

  function highlight(node, pos, keyword, options, style) {
    let span = document.createElement('span');

    span.className = 'highlighted' + ' ' + (options.subtleHighlighting ? 'subtle ' : 'notsubtle ') + 'style-' + style;
    span.style.color = options.foreground;
    span.style.backgroundColor = options.background;

    let highlighted = node.splitText(pos);

    highlighted.splitText(keyword.length);

    let highlightedClone = highlighted.cloneNode(true);

    span.appendChild(highlightedClone);
    highlighted.parentNode.replaceChild(span, highlighted);

    occurrences++;
  }

  function addHighlights(node, keywords, options) {
    let skip = 0;

    if (3 === node.nodeType) {
      for (let i = 0; i < keywords.length; i++) {
        let keyword = keywords[i].toLowerCase();
        let pos = node.data.toLowerCase().indexOf(keyword);

        if (0 <= pos) {
          highlight(node, pos, keyword, options, String(i).slice(-1));
          skip = 1;
        }
      }
    }
    else if (1 === node.nodeType && !/(script|style|textarea)/i.test(node.tagName) && node.childNodes) {
      for (let i = 0; i < node.childNodes.length; i++) {
        i += addHighlights(node.childNodes[i], keywords, options);
      }
    }

    return skip;
  }

  function removeHighlights(node) {
    let span;

    while ((span = node.querySelector('span.highlighted'))) {
      span.outerHTML = span.innerHTML;
    }

    occurrences = 0;
  }

  if (remove) {
    removeHighlights(document.body);
  }

  let keywords = options.keywords.split(',');

  delete options.keywords;
  addHighlights(document.body, keywords, options);

  browser.runtime.sendMessage({
    'message': 'showOccurrences',
    'occurrences': occurrences
  });
}

browser.runtime.onMessage.addListener(function(request) {
  if ('returnOptions' === request.message) {
    if ('undefined' != typeof request.keywords && request.keywords) {
      keywordsHighlighter({
        'keywords': request.keywords,
		'subtleHighlighting' : request.subtleHighlighting
      },
      request.remove
      );
    }
  }
});

browser.runtime.sendMessage({
  'message': 'getOptions',
  'remove': false
});
