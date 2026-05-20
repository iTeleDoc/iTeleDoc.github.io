/*
	Main Script with High-Precision Multi-Registry Fallback Layer
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

  // Toggle Appointment Menu
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
   Clinical Protocols Module: Layout, Toggles, & Filter Engine
   ========================================================================== */

// 1. Integrated Search Expand, Collapse, and Click Action Routing Handler
function toggleSearch(event) {
    if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }

    const searchBox = document.getElementById('searchBox');
    const searchInput = document.getElementById('searchInput');
    const iconWrapper = document.getElementById('searchIconWrapper');
    
    if (!searchBox || !searchInput) return false;

    if (!searchBox.classList.contains('active')) {
        searchBox.classList.add('active');
        searchInput.focus();
        return false;
    }

    const query = searchInput.value.trim();

    if (iconWrapper && (iconWrapper.classList.contains('fa-globe') || iconWrapper.classList.contains('fa-cloud-download-alt'))) {
        // External lookup removed. Local-only search active.
        return false;
    }

    if (query !== "") {
        searchInput.value = "";
        if (iconWrapper) iconWrapper.className = "icon solid fa-search";
        filterProtocols(); 
        searchInput.focus();
    } else {
        searchBox.classList.remove('active');
    }
    return false;
}

// 2. Local Manual Drawer Show More/Less Button Engine
function toggleShowMore(forceState) {
    const hiddenContent = document.getElementById('hiddenContentServices');
    const toggleLink = document.getElementById('showMoreLinkServices');
    
    if (!hiddenContent) return;
    
    let isHidden = hiddenContent.style.display === 'none' || hiddenContent.style.display === '';
    let targetState = isHidden ? 'block' : 'none';
    
    if (forceState) targetState = forceState; 
    
    hiddenContent.style.display = targetState;
    
    if (toggleLink) {
        toggleLink.textContent = targetState === 'none' ? 'Show More' : 'Show Less';
    }
}

// 3. High-Precision Local Search Filtration Engine with Accurate API Routing

// 3. Universal Local Search Engine (Offline / Local Only)
function filterProtocols() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const query = searchInput.value.toLowerCase().trim();

    const iconWrapper = document.getElementById('searchIconWrapper');
    if (iconWrapper) {
        iconWrapper.className = "icon solid fa-search";
    }

    const searchableCards = document.querySelectorAll(
        '#main article .approach-card, #main article .service-card, #main article .card, #main article section, #main article .box'
    );

    const searchableHeadings = document.querySelectorAll(
        '#main article .search-target-heading'
    );

    let totalMatches = 0;

    searchableCards.forEach(card => {
        const text = card.innerText.toLowerCase();

        if (query === '' || text.includes(query)) {
            card.style.display = '';
            card.classList.remove('universal-search-hidden');
            totalMatches++;
        } else {
            card.style.display = 'none';
            card.classList.add('universal-search-hidden');
        }
    });

    searchableHeadings.forEach(heading => {
        const nextGrid = heading.nextElementSibling;

        if (!nextGrid) return;

        const visibleCards = nextGrid.querySelectorAll(
            '.approach-card:not(.universal-search-hidden), .service-card:not(.universal-search-hidden), .card:not(.universal-search-hidden)'
        );

        if (query === '' || visibleCards.length > 0) {
            heading.style.display = '';
            nextGrid.style.display = '';
        } else {
            heading.style.display = 'none';
            nextGrid.style.display = 'none';
        }
    });

    const hiddenDrawer = document.getElementById('hiddenContentServices');
    if (hiddenDrawer) {
        hiddenDrawer.style.display = query ? 'block' : 'none';
    }

    let noResults = document.getElementById('universalNoResults');

    if (totalMatches === 0 && query !== '') {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.id = 'universalNoResults';
            noResults.className = 'universal-no-results';

            noResults.innerHTML = `
                <h3>No Local Results Found</h3>
                <p>Universal offline search scanned all local articles and protocols.</p>
            `;

            const protocols = document.getElementById('protocols');
            if (protocols) protocols.appendChild(noResults);
        }

        noResults.style.display = 'block';
    } else if (noResults) {
        noResults.style.display = 'none';
    }
}


// 4. External Clinical Registry Dispatch Controller Interface
async function executeExternalV3ProtocolLookup(queryText) {
    const iconWrapper = document.getElementById('searchIconWrapper');
    if (iconWrapper) iconWrapper.className = "icon solid fa-spinner fa-spin";

    const clinicalRecord = await fetchHighPrecisionData(queryText);

    // FIX: If no data, stop here. No error messages, no dummy text.
    if (!clinicalRecord) {
        if (iconWrapper) iconWrapper.className = "icon solid fa-times";
        return; 
    }

    // Existing code to build the approach-card...
    // Only runs if clinicalRecord is valid.
}


/* ==========================================================================
   Diseases Module: Layout, Toggles, & Filter Engine
   ========================================================================== */

// 1. Diseases Search Expand and Click Action Routing Handler
function toggleDiseaseSearch(event) {
    if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }
    const searchBox = document.getElementById('diseaseSearchBox');
    const searchInput = document.getElementById('diseaseSearchInput');
    const iconWrapper = document.getElementById('diseaseSearchIconWrapper');
    
    if (!searchBox || !searchInput) return false;

    if (!searchBox.classList.contains('active')) {
        searchBox.classList.add('active');
        searchInput.focus();
        return false;
    }

    const query = searchInput.value.trim();

    if (iconWrapper && iconWrapper.classList.contains('fa-globe')) {
        executeExternalV3DiseaseLookup(query);
        return false;
    }

    if (query !== "") {
        searchInput.value = "";
        if (iconWrapper) iconWrapper.className = "icon solid fa-search";
        filterDiseases();
        searchInput.focus();
    } else {
        searchBox.classList.remove('active');
    }
    return false;
}

function toggleDiseaseShowMore(forceState) {
    const hiddenContent = document.getElementById('hiddenContentDiseases');
    const toggleLink = document.getElementById('showMoreLinkDiseases');
    
    if (!hiddenContent) return;
    
    let isHidden = hiddenContent.style.display === 'none' || hiddenContent.style.display === '';
    let targetState = isHidden ? 'block' : 'none';
    
    if (forceState) targetState = forceState;
    
    hiddenContent.style.display = targetState;
    
    if (toggleLink) {
        toggleLink.textContent = targetState === 'none' ? 'Show More' : 'Show Less';
    }
}

// 3. Diseases Local Search Filtration Engine with Local Gray Dot Visual Injector
function filterDiseases() {
    const searchInput = document.getElementById('diseaseSearchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const iconWrapper = document.getElementById('diseaseSearchIconWrapper');
    const cards = document.querySelectorAll('#diseases .approach-card');
    const hiddenSection = document.getElementById('hiddenContentDiseases');
    const allHeadings = document.querySelectorAll('#diseases .search-target-heading');
    const allGrids = document.querySelectorAll('#diseases .approach-grid');

    const dynamicCards = document.querySelectorAll('.v3-dynamic-injected-disease-card');
    dynamicCards.forEach(card => card.remove());
    document.querySelectorAll('.local-disease-dot-indicator').forEach(dot => dot.remove());

    if (query === '') {
        if (iconWrapper) iconWrapper.className = "icon solid fa-search";
        if (hiddenSection) hiddenSection.style.display = 'none';

        const toggleLink = document.getElementById('showMoreLinkDiseases');
        if (toggleLink) toggleLink.textContent = 'Show More';

        allHeadings.forEach(heading => heading.style.display = 'block');
        allGrids.forEach(grid => grid.style.display = 'grid');
        cards.forEach(card => card.style.display = 'flex');
        return;
    }

    if (hiddenSection && (hiddenSection.style.display === 'none' || hiddenSection.style.display === '')) {
        hiddenSection.style.display = 'block';
        const toggleLink = document.getElementById('showMoreLinkDiseases');
        if (toggleLink) toggleLink.textContent = 'Show Less';
    }

    let totalLocalMatches = 0;

    cards.forEach(card => {
        const title = card.querySelector('h4') ? card.querySelector('h4').textContent.toLowerCase() : '';
        const tag = card.querySelector('.protocol-tag') ? card.querySelector('.protocol-tag').textContent.toLowerCase() : '';
        
        if (title.includes(query) || tag.includes(query)) {
            card.style.display = 'flex';
            card.style.position = 'relative';
            totalLocalMatches++;

            if (!card.querySelector('.local-disease-dot-indicator')) {
                const grayDot = document.createElement('span');
                grayDot.className = 'local-disease-dot-indicator';
                grayDot.style.cssText = "position: absolute; top: 25px; right: 25px; width: 8px; height: 8px; background-color: #7f8c8d; border-radius: 50%; box-shadow: 0 0 8px #7f8c8d;";
                card.appendChild(grayDot);
            }
        } else {
            card.style.display = 'none';
        }
    });

    allHeadings.forEach(heading => {
        let nextEl = heading.nextElementSibling;
        if (nextEl && nextEl.classList.contains('approach-grid')) {
            const hasVisibleCards = nextEl.querySelectorAll('.approach-card:not([style*="display: none"])').length > 0;
            heading.style.display = hasVisibleCards ? 'block' : 'none';
            nextEl.style.display = hasVisibleCards ? 'grid' : 'none';
        }
    });

    if (totalLocalMatches === 0) {
        if (iconWrapper) iconWrapper.className = "icon solid fa-globe";
    } else {
        if (iconWrapper) iconWrapper.className = "icon solid fa-times";
    }
}

// Diseases External Online Lookup Injection Engine
async function executeExternalV3DiseaseLookup(queryText) {
    const iconWrapper = document.getElementById('diseaseSearchIconWrapper');
    if (iconWrapper) iconWrapper.className = "icon solid fa-spinner fa-spin";

    const cleanTerm = queryText.replace(/[^-a-zA-Z0-9 ]/g, '').trim();
    const clinicalRecord = await fetchHighPrecisionData(cleanTerm);
    const urgentTriageTip = getUrgentClinicalTip(cleanTerm);

    if (iconWrapper) iconWrapper.className = "icon solid fa-times";

    const diseasesArticle = document.getElementById('diseases');
    const dynamicCardDeck = document.createElement('div');
    dynamicCardDeck.className = 'approach-grid v3-dynamic-injected-disease-card';
    dynamicCardDeck.style.cssText = "margin-top: 20px; width: 100%; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 20px; display: grid;";

    dynamicCardDeck.innerHTML = `
        <div class="approach-card" style="width: 100%; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: start; position: relative;">
            <span style="position: absolute; top: 25px; right: 25px; width: 8px; height: 8px; background-color: #2ecc71; border-radius: 50%; box-shadow: 0 0 8px #2ecc71;"></span>
            
            <div style="display: flex; align-items: center; width: 100%; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 8px;">
                <span class="protocol-tag" style="font-family: 'Source Sans Pro', Helvetica, sans-serif !important; font-weight: 600 !important; font-size: 0.65rem !important; letter-spacing: 1px !important; text-transform: uppercase !important; background: rgba(51, 153, 255, 0.15); color: #3399ff; border: 1px solid rgba(51, 153, 255, 0.3); padding: 0.2rem 0.6rem; border-radius: 4px; display: inline-block; line-height: 1.2;">${clinicalRecord.tag}</span>
            </div>
            <h4 style="font-family: 'Source Sans Pro', Helvetica, sans-serif !important; font-weight: 700 !important; font-size: 1.2rem !important; letter-spacing: 1px !important; text-transform: uppercase !important; margin: 0 0 0.5rem 0; color: #ffffff !important; padding-right: 20px;">${cleanTerm.toUpperCase()} ANALYSIS</h4>
            
            <h5 style="color: #ffffff; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin: 1rem 0 0.5rem 0; font-weight: 600;">Pathology Diagnostic Parameters:</h5>
            <ol style="margin: 0 0 1.5rem 1.25rem; padding: 0; color: rgba(255,255,255,0.75); font-size: 0.9rem; line-height: 1.6; width: 100%;">
                ${clinicalRecord.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>

            <div style="font-family: 'Source Sans Pro', Helvetica, sans-serif !important; font-size: 0.85rem !important; line-height: 1.5 !important; background: rgba(255, 51, 51, 0.05) !important; color: #ffffff !important; border-left: 3px solid #ff3333; padding: 12px 16px !important; border-radius: 4px; margin-top: auto; width: 100%; box-sizing: border-box;">
                <strong style="color: #ff5555 !important; font-weight: 600 !important; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Urgent Triage Rule:</strong> ${urgentTriageTip}
            </div>
        </div>
    `;

    const insertionMarker = diseasesArticle.querySelector('.more-container-services') || diseasesArticle.querySelector('ul.actions');
    if (insertionMarker) {
        diseasesArticle.insertBefore(dynamicCardDeck, insertionMarker);
    } else {
        diseasesArticle.appendChild(dynamicCardDeck);
    }
}


/* ==========================================================================
   GLOBAL INTERACTIVE EVENT ROUTER CONTROLLERS
   ========================================================================== */

// Unified Document Level Keydown Handler for Input Form Fields (Fixes late dynamic binding bugs)
document.addEventListener('keydown', function(event) {
    const target = event.target;
    if (!target) return;

    // 1. Handle Protocols Key Enter Routing
    if (target.id === 'searchInput' && (event.key === 'Enter' || event.keyCode === 13)) {
        const query = target.value.trim();
        const iconWrapper = document.getElementById('searchIconWrapper');
        
        if (iconWrapper && iconWrapper.classList.contains('fa-globe') && query !== "") {
            event.preventDefault();
            // External lookup removed. Local-only search active.
        }
    }

    // 2. Handle Diseases Key Enter Routing
    if (target.id === 'diseaseSearchInput' && (event.key === 'Enter' || event.keyCode === 13)) {
        const query = target.value.trim();
        const iconWrapper = document.getElementById('diseaseSearchIconWrapper');
        
        if (iconWrapper && iconWrapper.classList.contains('fa-globe') && query !== "") {
            event.preventDefault();
            executeExternalV3DiseaseLookup(query);
        }
    }
});

// Blur catching context layout resetting logic
document.addEventListener('click', function(event) {
    const searchBox = document.getElementById('searchBox');
    const searchInput = document.getElementById('searchInput');
    const iconWrapper = document.getElementById('searchIconWrapper');
    
    if (searchBox && searchInput && !searchBox.contains(event.target) && searchInput.value.trim() === "") {
        searchBox.classList.remove('active');
        if (iconWrapper) iconWrapper.className = "icon solid fa-search";
    }

    const dSearchBox = document.getElementById('diseaseSearchBox');
    const dSearchInput = document.getElementById('diseaseSearchInput');
    const dIconWrapper = document.getElementById('diseaseSearchIconWrapper');
    
    if (dSearchBox && dSearchInput && !dSearchBox.contains(event.target) && dSearchInput.value.trim() === "") {
        dSearchBox.classList.remove('active');
        if (dIconWrapper) dIconWrapper.className = "icon solid fa-search";
    }
});


/* ==========================================================================
   DYNAMIC CLINICAL TRIAGE ENGINE (COMPREHENSIVE URGENT PROTOCOLS)
   ========================================================================== */
   function getUrgentClinicalTip(condition) {
    const term = condition.toLowerCase();
    
    if (term.includes('myocarditis') || term.includes('pericarditis')) {
        return "Continuous 12-lead ECG monitoring is mandatory. Rule out acute coronary syndrome (ACS). Restrict intense physical activity immediately; initiate supportive cardiac care and evaluate for signs of progressive cardiogenic shock or high-grade AV blocks.";
    }
    if (term.includes('infarction') || term.includes('mi ') || term.includes('heart attack') || term.includes('coronary')) {
        return "EMERGENCY: Initiate immediate high-flow oxygen if SpO2 < 90%, administer chewed Aspirin 162-325 mg, and establish dual IV access. Obtain a stat 12-lead ECG within 10 minutes and activate the Cardiac Catheterization Lab for immediate reperfusion therapy.";
    }
    if (term.includes('arrhythmia') || term.includes('fibrillation') || term.includes('tachycardia')) {
        return "Assess hemodynamic stability immediately. If unstable (hypotension, altered mental status, chest pain), prepare for immediate synchronized cardioversion or transcutaneous pacing. If stable, obtain a 12-lead ECG and consider vagal maneuvers or targeted antiarrhythmic infusions.";
    }
    if (term.includes('sepsis') || term.includes('septic') || term.includes('shock')) {
        return "CRITICAL TIME-DEPENDENT PROTOCOL: Draw tracking blood cultures immediately before initiating broad-spectrum IV antibiotics. Administer a stat 30 mL/kg crystalloid fluid bolus for hypotension or lactate >= 4.0 mmol/L. Prepare immediate central venous access and start Norepinephrine if fluid-refractory.";
    }
    if (term.includes('anaphylaxis') || term.includes('allergic')) {
        return "IMMEDIATE ACTION REQUIRED: Administer Epinephrine 0.3 mg IM (1:1000) in the anterolateral thigh immediately. Secure the airway, place the patient recumbent with legs elevated, provide high-flow oxygen, and prepare rapid crystal fluid volumes via large-bore IV lines.";
    }
    if (term.includes('asthma') || term.includes('copd') || term.includes('bronchospasm')) {
        return "Administer immediate continuous inline nebulized Albuterol mixed with Ipatropium Bromide. Provide supplemental oxygen titrated to an SpO2 of 88-92% for COPD or 94-98% for acute asthma. Initiate early IV or PO systemic corticosteroids and prepare for non-invasive positive pressure ventilation (BiPAP) if respiratory distress increases.";
    }
    if (term.includes('embolism') || term.includes('pe ')) {
        return "Maintain strict bed rest to prevent clot dislodgement. Provide immediate high-flow oxygen therapy. Evaluate hemodynamics rapidly; prepare for therapeutic anticoagulation with Unfractionated Heparin (UFH) bolus/infusion, or immediate thrombolysis if signs of obstructive shock or right ventricular failure occur.";
    }
    if (term.includes('stroke') || term.includes('cva') || term.includes('ischemic')) {
        return "TIME IS BRAIN: Perform an immediate stroke scale assessment (NIHSS) and note exact Last Known Well (LKW) time. Obtain an urgent non-contrast head CT within 20 minutes to rule out intracranial hemorrhage. Maintain blood pressure below 185/110 mmHg if a candidate for IV thrombolysis.";
    }
    if (term.includes('seizure') || term.includes('epilepticus')) {
        return "Protect the airway and prevent physical trauma; do not insert items into the mouth. If seizure activity exceeds 5 minutes, initiate Status Epilepticus Protocol: administer Lorazepam 4 mg IV push over 2 minutes. Establish secondary IV lines and prepare a loading infusion of Levetiracetam or Fosphenytoin.";
    }
    if (term.includes('diabetic') || term.includes('dka') || term.includes('hhs')) {
        return "Initiate aggressive fluid resuscitation immediately with 0.9% Normal Saline (typically 1-1.5L in the first hour). Check serum potassium levels before administering IV insulin; if potassium < 3.3 mEq/L, hold insulin and correct potassium immediately to prevent fatal cardiac arrhythmias.";
    }
    // High-Precision Matching Additions for Acid-Base, Metabolic, and Electrolyte Crises
    if (term.includes('acid') || term.includes('alkalosis') || term.includes('base') || term.includes('electrolyte') || term.includes('metabolic')) {
        return "CRITICAL FLUID/ELECTROLYTE MAP: Draw a stat arterial or venous blood gas (ABG/VBG) along with a comprehensive metabolic panel (CMP) and ionized calcium. Assess respiratory compensation efficiency immediately. Isolate underlying etiology (e.g., toxic ingestion, severe sepsis, renal failures, profound fluid depletion) before administering correction infusions.";
    }

    return "Stabilize immediate life threats first: Assess Airway patency, Breathing work/adequacy, and Circulatory perfusion parameters (ABC). Establish dual large-bore IV access, apply continuous cardiac monitoring, note trends in serial vital signs, and prepare immediate diagnostic verification lines.";
}

