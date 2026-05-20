/*
	Main Script with High-Precision Open-Source AI (Llama 3) Fallback Layer
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		$wrapper = $('#wrapper'),
		$header = $('#header'),
		$footer = $('#footer'),
		$main = $('#main'),
		$main_articles = $main.children('article');

	breakpoints({
		xlarge:   [ '1281px',  '1680px' ],
		large:    [ '981px',   '1280px' ],
		medium:   [ '737px',   '980px'  ],
		small:    [ '481px',   '736px'  ],
		xsmall:   [ '361px',   '480px'  ],
		xxsmall:  [ null,      '360px'  ]
	});

	$window.on('load', function() {
		window.setTimeout(function() {
			$body.removeClass('is-preload');
		}, 100);
	});

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

	var $nav = $header.children('nav'),
		$nav_li = $nav.find('li');
		if ($nav_li.length % 2 == 0) {
			$nav.addClass('use-middle');
			$nav_li.eq( ($nav_li.length / 2) ).addClass('is-middle');
		}

	var	delay = 325, locked = false;

	$main._show = function(id, initial) {
		var $article = $main_articles.filter('#' + id);
		if ($article.length == 0) return;
		if (locked || (typeof initial != 'undefined' && initial === true)) {
			$body.addClass('is-switching').addClass('is-article-visible');
			$main_articles.removeClass('active');
			$header.hide(); $footer.hide();
			$main.show(); $article.show().addClass('active');
			locked = false;
			setTimeout(function() { $body.removeClass('is-switching'); }, (initial ? 1000 : 0));
			return;
		}
		locked = true;
		if ($body.hasClass('is-article-visible')) {
			var $currentArticle = $main_articles.filter('.active');
			$currentArticle.removeClass('active');
			setTimeout(function() {
				$currentArticle.hide();
				$article.show();
				setTimeout(function() {
					$article.addClass('active');
					$window.scrollTop(0).triggerHandler('resize.flexbox-fix');
					setTimeout(function() { locked = false; }, delay);
				}, 25);
			}, delay);
		} else {
			$body.addClass('is-article-visible');
			setTimeout(function() {
				$header.hide(); $footer.hide();
				$main.show(); $article.show();
				setTimeout(function() {
					$article.addClass('active');
					$window.scrollTop(0).triggerHandler('resize.flexbox-fix');
					setTimeout(function() { locked = false; }, delay);
				}, 25);
			}, delay);
		}
	};

	$main._hide = function(addState) {
		var $article = $main_articles.filter('.active');
		if (!$body.hasClass('is-article-visible')) return;
		if (typeof addState != 'undefined' && addState === true) history.pushState(null, null, '#');

        // NEW: Close all search bars and reset UI when article hides
        $('.search-box').removeClass('active');
        $('.search-box input').val('');
        $('.search-btn .icon').removeClass('fa-times fa-spinner fa-spin fa-globe').addClass('fa-search');
        if(window.filterProtocols) filterProtocols();
        if(window.filterDiseases) filterDiseases();

		if (locked) {
			$body.addClass('is-switching');
			$article.removeClass('active').hide();
			$main.hide();
			$footer.show(); $header.show();
			$body.removeClass('is-article-visible').removeClass('is-switching');
			locked = false;
			$window.scrollTop(0).triggerHandler('resize.flexbox-fix');
			return;
		}
		locked = true;
		$article.removeClass('active');
		setTimeout(function() {
			$article.hide(); $main.hide();
			$footer.show(); $header.show();
			setTimeout(function() {
				$body.removeClass('is-article-visible');
				$window.scrollTop(0).triggerHandler('resize.flexbox-fix');
				setTimeout(function() { locked = false; }, delay);
			}, 25);
		}, delay);
	};

	$main_articles.each(function() {
		var $this = $(this);
		$('<div class="close">Close</div>').appendTo($this).on('click', function() {
			location.hash = '';
		});
		$this.on('click', function(event) { event.stopPropagation(); });
	});

	$body.on('click', function(event) {
		if ($body.hasClass('is-article-visible')) $main._hide(true);
	});

	$window.on('keyup', function(event) {
		if (event.keyCode === 27 && $body.hasClass('is-article-visible')) $main._hide(true);
	});

	$window.on('hashchange', function(event) {
		if (location.hash == '' || location.hash == '#') {
			event.preventDefault(); event.stopPropagation(); $main._hide();
		} else if ($main_articles.filter(location.hash).length > 0) {
			event.preventDefault(); event.stopPropagation(); $main._show(location.hash.substr(1));
		}
	});

	if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
	else {
		var	oldScrollPos = 0, scrollPos = 0, $htmlbody = $('html,body');
		$window.on('scroll', function() { oldScrollPos = scrollPos; scrollPos = $htmlbody.scrollTop(); })
			   .on('hashchange', function() { $window.scrollTop(oldScrollPos); });
	}

	$main.hide(); $main_articles.hide();
	if (location.hash != '' && location.hash != '#') {
		$window.on('load', function() { $main._show(location.hash.substr(1), true); });
	}

})(jQuery);

/* ==========================================================================
   Search Modules: Toggles & Global Click-to-Close Logic
   ========================================================================== */

// Auto-close search bars when clicking anywhere inside the article (but not inside the search bar itself)
document.addEventListener('click', function(event) {
    const searchBoxes = document.querySelectorAll('.search-box');
    searchBoxes.forEach(box => {
        // If click is outside this specific search box
        if (!box.contains(event.target) && box.classList.contains('active')) {
            const input = box.querySelector('input');
            if (input && input.value.trim() === "") {
                box.classList.remove('active');
                const icon = box.querySelector('.search-btn .icon');
                if (icon) icon.className = "icon solid fa-search";
            }
        }
    });
});

// Protocols Toggle
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
        executeExternalV3ProtocolLookup(query);
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

// Diseases Toggle
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

// Drawer Toggles
function toggleShowMore(forceState) {
    const hc = document.getElementById('hiddenContentServices');
    const tl = document.getElementById('showMoreLinkServices');
    if (!hc) return;
    let targetState = forceState ? forceState : ((hc.style.display === 'none' || hc.style.display === '') ? 'block' : 'none');
    hc.style.display = targetState;
    if (tl) tl.textContent = targetState === 'none' ? 'Show More' : 'Show Less';
}

function toggleDiseaseShowMore(forceState) {
    const hc = document.getElementById('hiddenContentDiseases');
    const tl = document.getElementById('showMoreLinkDiseases');
    if (!hc) return;
    let targetState = forceState ? forceState : ((hc.style.display === 'none' || hc.style.display === '') ? 'block' : 'none');
    hc.style.display = targetState;
    if (tl) tl.textContent = targetState === 'none' ? 'Show More' : 'Show Less';
}

/* ==========================================================================
   Local Search Filtration Engines
   ========================================================================== */

function filterProtocols() {
    const query = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase().trim() : '';
    const iconWrapper = document.getElementById('searchIconWrapper');
    const cards = document.querySelectorAll('#protocols .approach-card');
    const sections = document.querySelectorAll('#protocols .approach-grid');
    const headings = document.querySelectorAll('#protocols .search-target-heading');

    document.querySelectorAll('.v3-dynamic-injected-card').forEach(card => card.remove());
    document.querySelectorAll('.local-dot-indicator').forEach(dot => dot.remove());

    if (query === '') {
        if (iconWrapper) iconWrapper.className = "icon solid fa-search";
        toggleShowMore('none');
        cards.forEach(card => card.style.display = 'flex');
        sections.forEach(sec => sec.style.display = 'grid');
        headings.forEach(hd => hd.style.display = 'block');
        return;
    }

    toggleShowMore('block');
    let totalLocalMatches = 0;

    cards.forEach(card => {
        const title = card.querySelector('h4') ? card.querySelector('h4').textContent.toLowerCase() : '';
        const tags = card.querySelector('.protocol-tag') ? card.querySelector('.protocol-tag').textContent.toLowerCase() : '';
        if (title.includes(query) || tags.includes(query)) {
            card.style.display = 'flex'; 
            card.style.position = 'relative';
            totalLocalMatches++;
            if (!card.querySelector('.local-dot-indicator')) {
                const grayDot = document.createElement('span');
                grayDot.className = 'local-dot-indicator';
                grayDot.style.cssText = "position: absolute; top: 25px; right: 25px; width: 8px; height: 8px; background-color: #7f8c8d; border-radius: 50%; box-shadow: 0 0 8px #7f8c8d;";
                card.appendChild(grayDot);
            }
        } else {
            card.style.display = 'none';
        }
    });

    sections.forEach(grid => {
        const visibleCards = grid.querySelectorAll('.approach-card:not([style*="display: none"])');
        let heading = grid.previousElementSibling;
        while (heading && !heading.classList.contains('search-target-heading')) { heading = heading.previousElementSibling; }
        if (visibleCards.length === 0) {
            grid.style.display = 'none';
            if (heading) heading.style.display = 'none';
        } else {
            grid.style.display = 'grid'; 
            if (heading) heading.style.display = 'block';
        }
    });

    if (iconWrapper) iconWrapper.className = totalLocalMatches === 0 ? "icon solid fa-globe" : "icon solid fa-times";
}

function filterDiseases() {
    const query = document.getElementById('diseaseSearchInput') ? document.getElementById('diseaseSearchInput').value.toLowerCase().trim() : '';
    const iconWrapper = document.getElementById('diseaseSearchIconWrapper');
    const cards = document.querySelectorAll('#diseases .approach-card');
    const headings = document.querySelectorAll('#diseases .search-target-heading');
    const grids = document.querySelectorAll('#diseases .approach-grid');

    document.querySelectorAll('.v3-dynamic-injected-disease-card').forEach(card => card.remove());
    document.querySelectorAll('.local-disease-dot-indicator').forEach(dot => dot.remove());

    if (query === '') {
        if (iconWrapper) iconWrapper.className = "icon solid fa-search";
        toggleDiseaseShowMore('none');
        headings.forEach(heading => heading.style.display = 'block');
        grids.forEach(grid => grid.style.display = 'grid');
        cards.forEach(card => card.style.display = 'flex');
        return;
    }

    toggleDiseaseShowMore('block');
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

    headings.forEach(heading => {
        let nextEl = heading.nextElementSibling;
        if (nextEl && nextEl.classList.contains('approach-grid')) {
            const hasVisibleCards = nextEl.querySelectorAll('.approach-card:not([style*="display: none"])').length > 0;
            heading.style.display = hasVisibleCards ? 'block' : 'none';
            nextEl.style.display = hasVisibleCards ? 'grid' : 'none';
        }
    });

    if (iconWrapper) iconWrapper.className = totalLocalMatches === 0 ? "icon solid fa-globe" : "icon solid fa-times";
}

/* ==========================================================================
   GLOBAL INTERACTIVE EVENT ROUTER CONTROLLERS (KEYBOARD AUTO-HIDE)
   ========================================================================== */

document.addEventListener('keydown', function(event) {
    const target = event.target;
    if (!target) return;

    if (target.id === 'searchInput' && (event.key === 'Enter' || event.keyCode === 13)) {
        target.blur(); // INSTANTLY HIDES KEYBOARD ON MOBILE
        const query = target.value.trim();
        const iconWrapper = document.getElementById('searchIconWrapper');
        if (iconWrapper && iconWrapper.classList.contains('fa-globe') && query !== "") {
            event.preventDefault();
            executeExternalV3ProtocolLookup(query);
        }
    }

    if (target.id === 'diseaseSearchInput' && (event.key === 'Enter' || event.keyCode === 13)) {
        target.blur(); // INSTANTLY HIDES KEYBOARD ON MOBILE
        const query = target.value.trim();
        const iconWrapper = document.getElementById('diseaseSearchIconWrapper');
        if (iconWrapper && iconWrapper.classList.contains('fa-globe') && query !== "") {
            event.preventDefault();
            executeExternalV3DiseaseLookup(query);
        }
    }
});


/* ==========================================================================
   DYNAMIC CLINICAL TRIAGE ENGINE
   ========================================================================== */
function getUrgentClinicalTip(condition) {
    const term = condition.toLowerCase();
    if (term.includes('myocarditis') || term.includes('pericarditis')) return "Continuous 12-lead ECG monitoring is mandatory. Rule out acute coronary syndrome (ACS). Restrict physical activity immediately.";
    if (term.includes('infarction') || term.includes('mi ') || term.includes('heart attack')) return "EMERGENCY: Initiate high-flow O2 if SpO2 < 90%, administer chewed Aspirin 162-325 mg, obtain stat 12-lead ECG, and activate Cath Lab.";
    if (term.includes('arrhythmia') || term.includes('fibrillation')) return "Assess hemodynamic stability. If unstable, prepare for immediate synchronized cardioversion. If stable, consider targeted antiarrhythmics.";
    if (term.includes('sepsis') || term.includes('shock')) return "CRITICAL: Draw blood cultures immediately. Administer 30 mL/kg crystalloid fluid bolus. Prepare Norepinephrine if fluid-refractory.";
    if (term.includes('anaphylaxis') || term.includes('allergic')) return "IMMEDIATE: Administer Epinephrine 0.3 mg IM (1:1000) in the anterolateral thigh. Secure airway, provide high-flow O2, and IV fluids.";
    if (term.includes('asthma') || term.includes('copd')) return "Administer continuous nebulized Albuterol/Ipratropium. Provide O2, initiate systemic corticosteroids, prepare for BiPAP if worsening.";
    if (term.includes('embolism') || term.includes('pe ')) return "Strict bed rest. High-flow O2. Prepare therapeutic anticoagulation (UFH) or thrombolysis if obstructive shock develops.";
    if (term.includes('stroke') || term.includes('cva')) return "TIME IS BRAIN: Assess NIHSS, note Last Known Well time. Obtain urgent non-contrast head CT within 20 mins. Keep BP < 185/110 mmHg.";
    if (term.includes('seizure') || term.includes('epilepticus')) return "Protect airway. If >5 mins, administer Lorazepam 4 mg IV push. Prepare loading infusion of Levetiracetam or Fosphenytoin.";
    if (term.includes('diabetic') || term.includes('dka') || term.includes('hhs')) return "Aggressive fluid resuscitation (0.9% NS). Check serum potassium before starting IV insulin (must be > 3.3 mEq/L).";
    if (term.includes('acid') || term.includes('metabolic')) return "Draw stat ABG/VBG and CMP. Isolate underlying etiology (e.g., toxic ingestion, sepsis, renal failure) before correction infusions.";
    return "Stabilize immediate life threats first: Assess Airway, Breathing, Circulation. Establish IV access, apply cardiac monitoring, and track vitals.";
}

/* ==========================================================================
   AI LOOKUP INJECTION ENGINES
   ========================================================================== */

async function executeExternalV3ProtocolLookup(queryText) {
    const iconWrapper = document.getElementById('searchIconWrapper');
    if (iconWrapper) iconWrapper.className = "icon solid fa-spinner fa-spin";

    const cleanTerm = queryText.replace(/[^-a-zA-Z0-9 ]/g, '').trim();
    const clinicalRecord = await fetchHighPrecisionData(cleanTerm);
    const urgentTriageTip = getUrgentClinicalTip(cleanTerm);

    if (!clinicalRecord) {
        if (iconWrapper) iconWrapper.className = "icon solid fa-times";
        return; 
    }

    if (iconWrapper) iconWrapper.className = "icon solid fa-times";

    const protocolsArticle = document.getElementById('protocols');
    const dynamicCardDeck = document.createElement('div');
    dynamicCardDeck.className = 'approach-grid v3-dynamic-injected-card';
    dynamicCardDeck.style.cssText = "margin-top: 20px; width: 100%; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 20px; display: grid;";

    dynamicCardDeck.innerHTML = `
        <div class="approach-card" style="width: 100%; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: start; position: relative;">
            <span style="position: absolute; top: 25px; right: 25px; width: 8px; height: 8px; background-color: #2ecc71; border-radius: 50%; box-shadow: 0 0 8px #2ecc71;"></span>
            
            <div style="display: flex; align-items: center; width: 100%; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 8px;">
                <span class="protocol-tag" style="font-family: 'Source Sans Pro', Helvetica, sans-serif !important; font-weight: 600 !important; font-size: 0.65rem !important; letter-spacing: 1px !important; text-transform: uppercase !important; background: rgba(51, 153, 255, 0.15); color: #3399ff; border: 1px solid rgba(51, 153, 255, 0.3); padding: 0.2rem 0.6rem; border-radius: 4px; display: inline-block; line-height: 1.2;">${clinicalRecord.tag}</span>
            </div>
            <h4 style="font-family: 'Source Sans Pro', Helvetica, sans-serif !important; font-weight: 700 !important; font-size: 1.2rem !important; letter-spacing: 1px !important; text-transform: uppercase !important; margin: 0 0 0.5rem 0; color: #ffffff !important; padding-right: 20px;">${cleanTerm.toUpperCase()} PROTOCOL</h4>
            
            <h5 style="color: #ffffff; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin: 1rem 0 0.5rem 0; font-weight: 600;">Regulated Directive Actions:</h5>
            <ul style="margin: 0 0 1.5rem 1.25rem; padding: 0; color: rgba(255,255,255,0.75); font-size: 0.9rem; line-height: 1.6; width: 100%; list-style-type: disc !important;">
                ${clinicalRecord.steps.map(step => `<li style="margin-bottom: 0.4rem;">${step}</li>`).join('')}
            </ul>

            <div style="font-family: 'Source Sans Pro', Helvetica, sans-serif !important; font-size: 0.85rem !important; line-height: 1.5 !important; background: rgba(255, 51, 51, 0.05) !important; color: #ffffff !important; border-left: 3px solid #ff3333; padding: 12px 16px !important; border-radius: 4px; margin-top: auto; width: 100%; box-sizing: border-box;">
                <strong style="color: #ff5555 !important; font-weight: 600 !important; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Urgent Triage Rule:</strong> ${urgentTriageTip}
            </div>
        </div>
    `;

    const insertionMarker = protocolsArticle.querySelector('.more-container-services') || protocolsArticle.querySelector('ul.actions');
    if (insertionMarker) protocolsArticle.insertBefore(dynamicCardDeck, insertionMarker);
    else protocolsArticle.appendChild(dynamicCardDeck);
}

async function executeExternalV3DiseaseLookup(queryText) {
    const iconWrapper = document.getElementById('diseaseSearchIconWrapper');
    if (iconWrapper) iconWrapper.className = "icon solid fa-spinner fa-spin";

    const cleanTerm = queryText.replace(/[^-a-zA-Z0-9 ]/g, '').trim();
    const clinicalRecord = await fetchHighPrecisionData(cleanTerm);
    const urgentTriageTip = getUrgentClinicalTip(cleanTerm);

    if (!clinicalRecord) {
        if (iconWrapper) iconWrapper.className = "icon solid fa-times";
        return;
    }

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
            <ul style="margin: 0 0 1.5rem 1.25rem; padding: 0; color: rgba(255,255,255,0.75); font-size: 0.9rem; line-height: 1.6; width: 100%; list-style-type: disc !important;">
                ${clinicalRecord.steps.map(step => `<li style="margin-bottom: 0.4rem;">${step}</li>`).join('')}
            </ul>

            <div style="font-family: 'Source Sans Pro', Helvetica, sans-serif !important; font-size: 0.85rem !important; line-height: 1.5 !important; background: rgba(255, 51, 51, 0.05) !important; color: #ffffff !important; border-left: 3px solid #ff3333; padding: 12px 16px !important; border-radius: 4px; margin-top: auto; width: 100%; box-sizing: border-box;">
                <strong style="color: #ff5555 !important; font-weight: 600 !important; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Urgent Triage Rule:</strong> ${urgentTriageTip}
            </div>
        </div>
    `;

    const insertionMarker = diseasesArticle.querySelector('.more-container-services') || diseasesArticle.querySelector('ul.actions');
    if (insertionMarker) diseasesArticle.insertBefore(dynamicCardDeck, insertionMarker);
    else diseasesArticle.appendChild(dynamicCardDeck);
}

/* ==========================================================================
   FREE OPEN SOURCE AI API (OpenRouter hosting Meta Llama 3)
   ========================================================================== */
async function fetchHighPrecisionData(queryString) {
    // OpenRouter provides a free unified endpoint for open-source models like Llama-3
    const url = "https://openrouter.ai/api/v1/chat/completions";
    
    // REPLACE THIS WITH YOUR FREE OPENROUTER API KEY
    const apiKey = "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"; 

    // Instructions to force bullet points and clean JSON
    const systemPrompt = `You are a clinical medicine assistant. Provide structured, evidence-based data for the requested pathology or treatment. Return your answer precisely as a JSON object with two keys: "tag" (a short category string, e.g., "Cardiology") and "steps" (an array of exactly 4-5 concise, clear clinical actions, parameters, or guidelines as bullet points). Do not return any text outside of the valid JSON structure.`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://iteledoc.com", // Required by OpenRouter
                "X-Title": "iTeleDoc" // Required by OpenRouter
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3-8b-instruct:free", // Utilizing Meta's free Open Source Llama 3 Model
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Provide clinical data for: ${queryString}` }
                ],
                temperature: 0.2,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error("API Request Failed");

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) return null;

        const content = JSON.parse(data.choices[0].message.content);
        
        return {
            tag: content.tag || "Clinical Registry",
            title: queryString.toUpperCase(),
            steps: Array.isArray(content.steps) ? content.steps : ["No specific step data generated."]
        };
    } catch (error) {
        console.error("Lookup Error:", error);
        return null;
    }
}