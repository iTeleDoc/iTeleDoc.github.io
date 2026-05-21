/*
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		$wrapper = $('#wrapper'),
		$header = $('#header'),
		$footer = $('#footer'),
		$main = $('#main'),
		$main_articles = $main.children('article');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ '361px',   '480px'  ],
			xxsmall:  [ null,      '360px'  ]
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Fix: Flexbox min-height bug on IE.
		if (browser.name == 'ie') {

			var flexboxFixTimeoutId;

			$window.on('resize.flexbox-fix', function() {

				clearTimeout(flexboxFixTimeoutId);

				flexboxFixTimeoutId = setTimeout(function() {

					if ($wrapper.prop('scrollHeight') > $window.height())
						$wrapper.css('height', 'auto');
					else
						$wrapper.css('height', '100vh');

				}, 250);

			}).triggerHandler('resize.flexbox-fix');

		}

	// Nav.
		var $nav = $header.children('nav'),
			$nav_li = $nav.find('li');

		// Add "middle" alignment classes if we're dealing with an even number of items.
			if ($nav_li.length % 2 == 0) {

				$nav.addClass('use-middle');
				$nav_li.eq( ($nav_li.length / 2) ).addClass('is-middle');

			}

	// Main.
		var	delay = 325,
			locked = false;

		// Methods.
			$main._show = function(id, initial) {

				var $article = $main_articles.filter('#' + id);

				// No such article? Bail.
					if ($article.length == 0)
						return;

				// Handle lock.

					// Already locked? Speed through "show" steps w/o delays.
						if (locked || (typeof initial != 'undefined' && initial === true)) {

							// Mark as switching.
								$body.addClass('is-switching');

							// Mark as visible.
								$body.addClass('is-article-visible');

							// Deactivate all articles (just in case one's already active).
								$main_articles.removeClass('active');

							// Hide header, footer.
								$header.hide();
								$footer.hide();

							// Show main, article.
								$main.show();
								$article.show();

							// Activate article.
								$article.addClass('active');

							// Unlock.
								locked = false;

							// Unmark as switching.
								setTimeout(function() {
									$body.removeClass('is-switching');
								}, (initial ? 1000 : 0));

							return;

						}

					// Lock.
						locked = true;

				// Article already visible? Just swap articles.
					if ($body.hasClass('is-article-visible')) {

						// Deactivate current article.
							var $currentArticle = $main_articles.filter('.active');

							$currentArticle.removeClass('active');

						// Show article.
							setTimeout(function() {

								// Hide current article.
									$currentArticle.hide();

								// Show article.
									$article.show();

								// Activate article.
									setTimeout(function() {

										$article.addClass('active');

										// Window stuff.
											$window
												.scrollTop(0)
												.triggerHandler('resize.flexbox-fix');

										// Unlock.
											setTimeout(function() {
												locked = false;
											}, delay);

									}, 25);

							}, delay);

					}

				// Otherwise, handle as normal.
					else {

						// Mark as visible.
							$body
								.addClass('is-article-visible');

						// Show article.
							setTimeout(function() {

								// Hide header, footer.
									$header.hide();
									$footer.hide();

								// Show main, article.
									$main.show();
									$article.show();

								// Activate article.
									setTimeout(function() {

										$article.addClass('active');

										// Window stuff.
											$window
												.scrollTop(0)
												.triggerHandler('resize.flexbox-fix');

										// Unlock.
											setTimeout(function() {
												locked = false;
											}, delay);

									}, 25);

							}, delay);

					}

			};

			$main._hide = function(addState) {

				var $article = $main_articles.filter('.active');

				// Article not visible? Bail.
					if (!$body.hasClass('is-article-visible'))
						return;

				// Add state?
					if (typeof addState != 'undefined'
					&&	addState === true)
						history.pushState(null, null, '#');

				// Handle lock.

					// Already locked? Speed through "hide" steps w/o delays.
						if (locked) {

							// Mark as switching.
								$body.addClass('is-switching');

							// Deactivate article.
								$article.removeClass('active');

							// Hide article, main.
								$article.hide();
								$main.hide();

							// Show footer, header.
								$footer.show();
								$header.show();

							// Unmark as visible.
								$body.removeClass('is-article-visible');

							// Unlock.
								locked = false;

							// Unmark as switching.
								$body.removeClass('is-switching');

							// Window stuff.
								$window
									.scrollTop(0)
									.triggerHandler('resize.flexbox-fix');

							return;

						}

					// Lock.
						locked = true;

				// Deactivate article.
					$article.removeClass('active');

				// Hide article.
					setTimeout(function() {

						// Hide article, main.
							$article.hide();
							$main.hide();

						// Show footer, header.
							$footer.show();
							$header.show();

						// Unmark as visible.
							setTimeout(function() {

								$body.removeClass('is-article-visible');

								// Window stuff.
									$window
										.scrollTop(0)
										.triggerHandler('resize.flexbox-fix');

								// Unlock.
									setTimeout(function() {
										locked = false;
									}, delay);

							}, 25);

					}, delay);


			};

		// Articles.
			$main_articles.each(function() {

				var $this = $(this);

				// Close.
					$('<div class="close">Close</div>')
						.appendTo($this)
						.on('click', function() {
							location.hash = '';
						});

				// Prevent clicks from inside article from bubbling.
					$this.on('click', function(event) {
						event.stopPropagation();
					});

			});

		// Events.
			$body.on('click', function(event) {

				// Article visible? Hide.
					if ($body.hasClass('is-article-visible'))
						$main._hide(true);

			});

			$window.on('keyup', function(event) {

				switch (event.keyCode) {

					case 27:

						// Article visible? Hide.
							if ($body.hasClass('is-article-visible'))
								$main._hide(true);

						break;

					default:
						break;

				}

			});

			$window.on('hashchange', function(event) {

				// Empty hash?
					if (location.hash == ''
					||	location.hash == '#') {

						// Prevent default.
							event.preventDefault();
							event.stopPropagation();

						// Hide.
							$main._hide();

					}

				// Otherwise, check for a matching article.
					else if ($main_articles.filter(location.hash).length > 0) {

						// Prevent default.
							event.preventDefault();
							event.stopPropagation();

						// Show article.
							$main._show(location.hash.substr(1));

					}

			});

		// Scroll restoration.
		// This prevents the page from scrolling back to the top on a hashchange.
			if ('scrollRestoration' in history)
				history.scrollRestoration = 'manual';
			else {

				var	oldScrollPos = 0,
					scrollPos = 0,
					$htmlbody = $('html,body');

				$window
					.on('scroll', function() {

						oldScrollPos = scrollPos;
						scrollPos = $htmlbody.scrollTop();

					})
					.on('hashchange', function() {
						$window.scrollTop(oldScrollPos);
					});

			}

		// Initialize.

			// Hide main, articles.
				$main.hide();
				$main_articles.hide();

			// Initial article.
				if (location.hash != ''
				&&	location.hash != '#')
					$window.on('load', function() {
						$main._show(location.hash.substr(1), true);
					});

})(jQuery);

  // Booking Menu Button
  function toggleMenu() {
    const menu = document.getElementById("menuContent");
    if (menu) menu.classList.toggle("show");
  }

  // Toggle Menu
  const menuButton = document.getElementById("menuButton");
  const menuContent = document.getElementById("menuContent");

  if(menuButton && menuContent) {
    menuButton.addEventListener("click", function () {
      menuContent.classList.toggle("show");
    });
  }

  // Collapse menu on outside click
  document.addEventListener("click", function (event) {
    if(menuContent && menuButton) {
        const isClickInsideMenu = menuContent.contains(event.target);
        const isClickOnMenuButton = menuButton.contains(event.target);

        if (!isClickInsideMenu && !isClickOnMenuButton) {
          menuContent.classList.remove("show");
        }
    }
  });

  // Article Show More
  const showMoreLnk = document.getElementById('showMoreLink');
  if(showMoreLnk) {
    showMoreLnk.addEventListener('click', function(event) {
        event.preventDefault(); 
        var hiddenContent = document.getElementById('hiddenContent');
        if (hiddenContent) {
            if (hiddenContent.style.display === 'none') {
                hiddenContent.style.display = 'block';
                this.textContent = 'Show Less';
            } else {
                hiddenContent.style.display = 'none';
                this.textContent = 'Show More';
            }
        }
    });
  }


/* ==========================================================================
   AI CHAT ENGINE: JSON ROUTING, API INTEGRATION & RENDERING
   ========================================================================== */

// Global Unified Data Store
window.protocolData = [];

// 1. Initialize Local JSON Database
async function loadProtocols() {
    try {
        const response = await fetch('data.json');
        window.protocolData = await response.json();
    } catch (error) {
        console.error("Critical Failure: Unable to load local protocol database.", error);
    }
}

// Boot the database on load
document.addEventListener('DOMContentLoaded', loadProtocols);

// 2. Chat Interface Renderer
function renderProtocol(protocol, isOnline = false) {
    const container = document.getElementById('ai-chat-display');
    if (!container) return;

    // Clear previous results to enforce a clean 1-to-1 chat interface
    container.innerHTML = "";

    const onlineDot = isOnline ? '<span class="online-indicator">●</span>' : '';
    const sourceLabel = isOnline ? 'External Intelligence Search' : protocol.category;

    // Map list items safely
    let pointsHTML = "";
    if (protocol.points && Array.isArray(protocol.points)) {
        pointsHTML = `<ul>${protocol.points.map(p => `<li>${p}</li>`).join('')}</ul>`;
    } else if (protocol.content) {
        pointsHTML = `<p>${protocol.content}</p>`;
    }

    const html = `
        <h3 class="category-heading">${onlineDot} ${sourceLabel}</h3>
        <div class="article-card" style="display: flex; position: relative;">
            <h4>${protocol.title || "Query Result"}</h4>
            ${protocol.description ? `<p><strong>${protocol.description}</strong></p>` : ''}
            ${pointsHTML}
            ${protocol.tip ? `<div class="clinical-tip"><strong>Urgent Clinical Management Tip:</strong> ${protocol.tip}</div>` : ''}
        </div>
    `;
    
    container.innerHTML = html;
    
    // Auto-scroll to the top of the new result
    window.scrollTo({ top: container.offsetTop - 20, behavior: 'smooth' });
}

// 3. OpenRouter API Integration (External Fallback)
async function executeExternalV3ProtocolLookup(queryText) {
    const iconWrapper = document.getElementById('searchIconWrapper');
    if (iconWrapper) iconWrapper.className = "icon solid fa-spinner fa-spin";

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer YOUR_OPENROUTER_API_KEY`, // INSERT YOUR API KEY HERE
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.5-pro", // You can swap models here
                "messages": [
                    { "role": "system", "content": "You are a clinical AI assistant. Provide highly structured, concise, bulleted medical protocols for the queried condition." },
                    { "role": "user", "content": queryText }
                ]
            })
        });

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Render the online data
        renderProtocol({
            title: queryText.toUpperCase(),
            content: aiResponse.replace(/\n/g, '<br>'), // Simple line-break formatting
            category: "External Database",
            tip: "Verify all external AI intelligence with local clinical guidelines prior to execution."
        }, true);

    } catch (error) {
        console.error("External API Gateway Error:", error);
    } finally {
        if (iconWrapper) iconWrapper.className = "icon solid fa-search";
    }
}

// 4. Universal Search & Routing Controller
function toggleSearch(event) {
    if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }

    const searchInput = document.getElementById('searchInput');
    const iconWrapper = document.getElementById('searchIconWrapper');
    
    if (!searchInput) return false;

    const query = searchInput.value.trim().toLowerCase();

    if (query === "") return false;

    // Universal Search: Check titles, categories, and descriptions
    const localResults = window.protocolData.filter(item => 
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
    );

    if (localResults.length > 0) {
        // Local Match Found
        renderProtocol(localResults[0], false);
    } else {
        // No Local Match -> Route to External API
        executeExternalV3ProtocolLookup(query);
    }
    
    // Commit Search Actions: Clear input and force keyboard to hide
    searchInput.value = "";
    searchInput.blur(); 
    if (iconWrapper) iconWrapper.className = "icon solid fa-search";

    return false;
}

/* ==========================================================================
   GLOBAL INTERACTIVE EVENT ROUTER CONTROLLERS
   ========================================================================== */

// 1. Keyboard Handling (Enter to Submit)
document.addEventListener('keydown', function(event) {
    const target = event.target;
    if (!target) return;

    if (target.id === 'searchInput' && (event.key === 'Enter' || event.keyCode === 13)) {
        event.preventDefault();
        toggleSearch(event);
    }
});

// 2. Clear & Close Logic (Exiting the Article)
document.addEventListener('click', function(event) {
    // If the native [X] close button is clicked
    if (event.target.classList.contains('close')) {
        const container = document.getElementById('ai-chat-display');
        const searchInput = document.getElementById('searchInput');
        
        // Wipe the display and clear the input memory
        if (container) container.innerHTML = ""; 
        if (searchInput) searchInput.value = ""; 
    }
});