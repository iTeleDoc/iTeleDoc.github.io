/*
	iTeleDoc - Main Script with Universal Google Gemini API Engine
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

        // Reset Universal Search on Close
        $('.universal-search-box').removeClass('active');
        $('.universal-search-input').val('').trigger('input');
        $('.search-icon-indicator').removeClass('fa-times fa-spinner fa-spin fa-globe').addClass('fa-search');

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
   UNIVERSAL SEARCH ENGINE (Handles all articles automatically)
   ========================================================================== */

// 1. Close search when clicking outside
$(document).on('click', function(e) {
    $('.universal-search-box.active').each(function() {
        if (!$(this).is(e.target) && $(this).has(e.target).length === 0) {
            let $input = $(this).find('.universal-search-input');
            if ($input.val().trim() === "") {
                $(this).removeClass('active');
                $(this).find('.search-icon-indicator').removeClass('fa-times fa-globe fa-spinner fa-spin').addClass('fa-search');
            }
        }
    });
});

// 2. Handle Icon Button Click
$(document).on('click', '.universal-search-btn', function(e) {
    e.preventDefault();
    let $searchBox = $(this).closest('.universal-search-box');
    let $input = $searchBox.find('.universal-search-input');
    let $icon = $(this).find('.search-icon-indicator');
    let $article = $(this).closest('article');
    let query = $input.val().trim();

    // Open if closed
    if (!$searchBox.hasClass('active')) {
        $searchBox.addClass('active');
        $input.focus();
        return;
    }

    // Trigger API if globe is active
    if ($icon.hasClass('fa-globe') && query !== "") {
        $input.blur(); // Hide Keyboard
        triggerGeminiSearch(query, $article, $icon);
    } 
    // Clear search if X is clicked
    else if (query !== "") {
        $input.val('').trigger('input').focus();
    } 
    // Close if empty
    else {
        $searchBox.removeClass('active');
    }
});

// 3. Handle Keyboard Enter
$(document).on('keydown', '.universal-search-input', function(e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        $(this).blur(); // HIDE KEYBOARD ON MOBILE INSTANTLY
        
        let query = $(this).val().trim();
        let $icon = $(this).closest('.universal-search-box').find('.search-icon-indicator');
        let $article = $(this).closest('article');

        if ($icon.hasClass('fa-globe') && query !== "") {
            triggerGeminiSearch(query, $article, $icon);
        }
    }
});

// 4. Live Local Filtration Engine
$(document).on('input', '.universal-search-input', function() {
    let query = $(this).val().toLowerCase().trim();
    let $article = $(this).closest('article');
    let $icon = $(this).closest('.universal-search-box').find('.search-icon-indicator');

    let totalLocalMatches = 0;
    
    // Clear old AI cards and dots
    $article.find('.universal-dynamic-card').remove();
    $article.find('.local-dot-indicator').remove();

    // Toggle hidden native content wrappers
    let $hiddenContent = $article.find('[id^="hiddenContent"]');
    let $toggleLink = $article.find('[id^="showMoreLink"]');
    
    if (query !== '') {
        if ($hiddenContent.length) { $hiddenContent.show(); if ($toggleLink.length) $toggleLink.text('Show Less'); }
    } else {
        if ($hiddenContent.length) { $hiddenContent.hide(); if ($toggleLink.length) $toggleLink.text('Show More'); }
    }

    // Filter Cards
    $article.find('.approach-card').each(function() {
        let title = $(this).find('h4').text().toLowerCase();
        let tag = $(this).find('.protocol-tag').text().toLowerCase();

        if (title.includes(query) || tag.includes(query)) {
            $(this).css({ display: 'flex', position: 'relative' });
            totalLocalMatches++;
            
            // Add Gray Dot for local hits
            if (query !== '' && $(this).find('.local-dot-indicator').length === 0) {
                $(this).append('<span class="local-dot-indicator" style="position: absolute; top: 25px; right: 25px; width: 8px; height: 8px; background-color: #7f8c8d; border-radius: 50%; box-shadow: 0 0 8px #7f8c8d;"></span>');
            }
        } else {
            $(this).css('display', 'none');
        }
    });

    // Hide empty grids and headers
    $article.find('.approach-grid').each(function() {
        let $grid = $(this);
        let visibleCards = $grid.find('.approach-card').filter(function() { return $(this).css('display') !== 'none'; }).length;
        let $heading = $grid.prevAll('.search-target-heading').first();

        if (visibleCards === 0) {
            $grid.css('display', 'none');
            if ($heading.length) $heading.css('display', 'none');
        } else {
            $grid.css('display', 'grid');
            if ($heading.length) $heading.css('display', 'block');
        }
    });

    // Handle Icon States
    if (query === '') {
        $icon.removeClass('fa-globe fa-times fa-spinner fa-spin').addClass('fa-search');
    } else if (totalLocalMatches === 0) {
        $icon.removeClass('fa-search fa-times fa-spinner fa-spin').addClass('fa-globe');
    } else {
        $icon.removeClass('fa-search fa-globe fa-spinner fa-spin').addClass('fa-times');
    }
});


// Custom Show More Toggles for manual clicks
window.toggleShowMore = function() {
    const hc = document.getElementById('hiddenContentServices');
    const tl = document.getElementById('showMoreLinkServices');
    if (!hc) return;
    let targetState = (hc.style.display === 'none' || hc.style.display === '') ? 'block' : 'none';
    hc.style.display = targetState;
    if (tl) tl.textContent = targetState === 'none' ? 'Show More' : 'Show Less';
}

window.toggleDiseaseShowMore = function() {
    const hc = document.getElementById('hiddenContentDiseases');
    const tl = document.getElementById('showMoreLinkDiseases');
    if (!hc) return;
    let targetState = (hc.style.display === 'none' || hc.style.display === '') ? 'block' : 'none';
    hc.style.display = targetState;
    if (tl) tl.textContent = targetState === 'none' ? 'Show More' : 'Show Less';
}

/* ==========================================================================
   GOOGLE GEMINI API INTEGRATION (Universal Output)
   ========================================================================== */
async function triggerGeminiSearch(queryText, $article, $icon) {
    $icon.removeClass('fa-globe').addClass('fa-spinner fa-spin');

    // INSERT YOUR GEMINI KEY HERE
    const apiKey = AIzaSyCwN2xr4Dwi5ZmU6JbDQDXm3lCeesutN4Y; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `You are an expert clinical medicine assistant. Provide structured, evidence-based data for the requested pathology, disease, or medical protocol. Return your answer precisely as a JSON object with the following keys:
    - "tag": a short category string (e.g., "Clinical Protocol", "Cardiology")
    - "title": the exact medical title (e.g., "${queryText.toUpperCase()}")
    - "subtitle": a short mapping description (e.g., "Diagnostic & Management Mapping.")
    - "steps": an array of exactly 4-6 objects, each with a "prefix" (a short bolded category, e.g., "Assessment") and "text" (the instruction/guideline).
    - "tip": a crucial clinical tip or urgent triage rule.
    Do not include any extra markdown formatting or backticks outside of the valid JSON object.`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\nQuery: ${queryText}` }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        if (!response.ok) throw new Error("Gemini API Request Failed");

        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) throw new Error("No data");

        // Clean JSON formatting if Gemini adds markdown blocks
        let jsonString = data.candidates[0].content.parts[0].text;
        jsonString = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const content = JSON.parse(jsonString);
        renderGeminiCard(content, $article);
        
        $icon.removeClass('fa-spinner fa-spin').addClass('fa-times');

    } catch (error) {
        console.error("Lookup Error:", error);
        $icon.removeClass('fa-spinner fa-spin').addClass('fa-times');
        
        // Render a clean fallback card if API fails or key is missing
        renderGeminiCard({
            tag: "Global Registry",
            title: queryText.toUpperCase(),
            subtitle: "Automated Search Failure.",
            steps: [{ prefix: "Error", text: "Unable to reach the global registry. Please check API Key or network connection." }],
            tip: "Return to local search or verify connectivity parameters."
        }, $article);
    }
}

// Function to build and inject the HTML perfectly matching your design
function renderGeminiCard(data, $article) {
    const listItemsHtml = data.steps.map(s => 
        `<li style="margin-bottom: 8px;"><strong>${s.prefix}:</strong> ${s.text}</li>`
    ).join('');

    const dynamicCardHtml = `
    <div class="approach-grid universal-dynamic-card">
        <div class="approach-card gemini-api-card" style="position: relative;">
            <span style="position: absolute; top: 25px; right: 25px; width: 8px; height: 8px; background-color: #2ecc71; border-radius: 50%; box-shadow: 0 0 8px #2ecc71;"></span>
            
            <div style="display: flex; align-items: center; width: 100%; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 8px;">
                <span class="protocol-tag" style="background: rgba(46,204,113,0.15); color: #2ecc71; border: 1px solid rgba(46,204,113,0.3);">${data.tag}</span>
            </div>
            
            <h4>${data.title}</h4>
            <p><strong>${data.subtitle}</strong></p>
            
            <ul style="list-style-type: disc; list-style-position: outside; padding-left: 20px; color: #ffffff; font-size: 0.9rem; margin-bottom: 1.5rem;">
                ${listItemsHtml}
            </ul>

            <div class="clinical-tip" style="background: rgba(255, 51, 51, 0.05); border-left: 3px solid #ff3333; color: #ffffff; margin-top: auto;">
                <strong style="color: #ff3333; display: block; margin-bottom: 4px; text-transform: uppercase;">Urgent Clinical Management Tip:</strong> ${data.tip}
            </div>
        </div>
    </div>`;

    // Inject directly under the category header or at the top of the article
    let $insertionPoint = $article.find('.search-target-heading').first();
    if ($insertionPoint.length) {
        $insertionPoint.before(dynamicCardHtml);
    } else {
        $article.find('.close').after(dynamicCardHtml);
    }
}



// Add this to your main.js
$(document).on('click', '.search-box', function(event) {
    event.stopPropagation(); // Prevents click inside search from closing the article
});

$(document).on('click', '#searchBtn', function(event) {
    event.stopPropagation(); // Prevents button click from closing the article
    toggleSearch(); // Your existing function
});