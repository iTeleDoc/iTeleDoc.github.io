/**
 * Cortexa AI — Medical Intelligence Platform
 * Production Refactored Object State Controller & Lifecycle Management Engine
 */

(function() {
    'use strict';

    // ==========================================================================
    // 1. SYSTEM CORE RUNTIME ARCHITECTURE STATE MATRIX
    // ==========================================================================
    let SystemState = {
        theme: 'dark',
        groqKey: '',
        activeThreadId: null,
        historyCollapsed: false,
        selectedContextMenuThreadId: null,
        activeViewPanelId: 'zeroStateScreen',
        threads: {}
    };

    let SYSTEM_KNOWLEDGE_POOLS = [];

    /**
     * Loops safely through available global module registries to build index arrays.
     * @returns {Array} Compiled system dataset dictionaries.
     */
    function compileMasterKnowledgeBase() {
        const pool = [];
        
        // Register array instances from integrated clinical file contexts safely
        if (window.PROTOCOLS_DB && Array.isArray(window.PROTOCOLS_DB)) {
            window.PROTOCOLS_DB.forEach(function(item) {
                pool.push(Object.assign({}, item, { type: 'protocol', origin: 'protocols.js' }));
            });
        }
        if (window.EMERGENCIES_DB && Array.isArray(window.EMERGENCIES_DB)) {
            window.EMERGENCIES_DB.forEach(function(item) {
                pool.push(Object.assign({}, item, { type: 'emergency', origin: 'emergencies.js' }));
            });
        }
        if (window.PROCEDURES_DB && Array.isArray(window.PROCEDURES_DB)) {
            window.PROCEDURES_DB.forEach(function(item) {
                pool.push(Object.assign({}, item, { type: 'procedure', origin: 'procedures.js' }));
            });
        }
        if (window.DRUGS_DB && Array.isArray(window.DRUGS_DB)) {
            window.DRUGS_DB.forEach(function(item) {
                pool.push(Object.assign({}, item, { type: 'condition', origin: 'drugs.js' }));
            });
        }
        if (window.CALCULATORS_DB && Array.isArray(window.CALCULATORS_DB)) {
            window.CALCULATORS_DB.forEach(function(item) {
                pool.push(Object.assign({}, item, { type: 'calc', origin: 'calculators.js' }));
            });
        }
        if (window.FLUIDS_DB && Array.isArray(window.FLUIDS_DB)) {
            window.FLUIDS_DB.forEach(function(item) {
                pool.push(Object.assign({}, item, { type: 'calc', origin: 'fluids.js' }));
            });
        }
        if (window.LABS_DB && Array.isArray(window.LABS_DB)) {
            window.LABS_DB.forEach(function(item) {
                pool.push(Object.assign({}, item, { type: 'calc', origin: 'labs.js' }));
            });
        }

        return pool;
    }

    // ==========================================================================
    // 2. RUNTIME SYSTEM LIFECYCLE CONTROLLER
    // ==========================================================================
    function initializeCortexaSystem() {
        SYSTEM_KNOWLEDGE_POOLS = compileMasterKnowledgeBase();
        loadLocalStorageCache();
        applyInterfaceThemeEngine();
        registerOperationalDOMEvents();
        renderThreadSidebarHistory();
        verifySendBufferCapacity();

        // Collapse desktop sidebar configuration schemas dynamically
        const isTouchTarget = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024;
        if (!isTouchTarget) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.add('collapsed');
            }
        }
    }

    function loadLocalStorageCache() {
        const cachedTheme = localStorage.getItem('ctx_theme');
        if (cachedTheme) {
            SystemState.theme = cachedTheme;
        }
    
        const cachedKey = localStorage.getItem('ctx_api_gateway_key');
        if (cachedKey) {
            SystemState.groqKey = cachedKey;
        }
    
        const cachedThreads = localStorage.getItem('ctx_saved_threads');
        if (cachedThreads) {
            try {
                SystemState.threads = JSON.parse(cachedThreads);
                if (Object.keys(SystemState.threads).length === 0) {
                    generateSeedConversation();
                }
            } catch (e) {
                console.error("Storage parse error, resetting state matrix:", e);
                generateSeedConversation();
            }
        } else {
            generateSeedConversation();
        }
    }

    function generateSeedConversation() {
        const initialId = 'thread_seed_' + Date.now();
        SystemState.threads = {};
        SystemState.threads[initialId] = { 
            id: initialId, 
            label: "Welcome System Record", 
            pinned: false, 
            messages: [
                { 
                    sender: 'ai', 
                    text: '<div class="system-card-container"><div class="system-card-header"><div class="system-card-title"><span class="material-symbols-rounded">forum</span> Welcome to Cortexa AI</div><div class="system-badge normal">Ready</div></div><div class="system-text-block">Hello! How can I assist you with clinical database protocols or analysis parameters today?</div></div>' 
                }
            ]
        };
        persistThreadsToStorage();
    }

    function applyInterfaceThemeEngine() {
        const list = document.body.classList;
        const themeIcon = document.querySelector('#themeQuickToggleBtn span');
        if (SystemState.theme === 'dark') {
            list.remove('theme-light');
            list.add('theme-dark');
            if (themeIcon) {
                themeIcon.textContent = 'light_mode';
            }
        } else {
            list.remove('theme-dark');
            list.add('theme-light');
            if (themeIcon) {
                themeIcon.textContent = 'dark_mode';
            }
        }
    }

    function persistThreadsToStorage() {
        try {
            localStorage.setItem('ctx_saved_threads', JSON.stringify(SystemState.threads));
        } catch (e) {
            console.error("Failed to write state context matrix to storage:", e);
        }
    }

    // ==========================================================================
    // 3. UI VIEWPORT INTEGRATED ROUTER MATRIX
    // ==========================================================================
    function routeWorkspaceView(panelId) {
        SystemState.activeViewPanelId = panelId;
        
        // Clear primary interface highlighting states
        document.querySelectorAll('.view-panel').forEach(function(panel) {
            panel.classList.add('hidden');
        });
        document.getElementById('sidebarSearchNavBtn').classList.remove('active');
        document.getElementById('libraryNavBtn').classList.remove('active');
        document.getElementById('settingsToggleBtn').classList.remove('active');

        const activePanel = document.getElementById(panelId);
        if (activePanel) {
            activePanel.classList.remove('hidden');
        }

        // Floating user entry text panel matrix state enforcement
        const deck = document.getElementById('globalInputDeck');
        if (panelId === 'searchWorkspaceScreen' || panelId === 'libraryWorkspaceScreen' || panelId === 'settingsWorkspaceScreen') {
            if (deck) {
                deck.classList.add('hidden');
            }
        } else {
            if (deck) {
                deck.classList.remove('hidden');
            }
        }

        // Sub-panel initializer evaluation paths
        if (panelId === 'searchWorkspaceScreen') {
            document.getElementById('sidebarSearchNavBtn').classList.add('active');
            processHistorySearchQuery('');
        } else if (panelId === 'libraryWorkspaceScreen') {
            document.getElementById('libraryNavBtn').classList.add('active');
            renderLibraryWorkspaceScreen('');
        } else if (panelId === 'settingsWorkspaceScreen') {
            document.getElementById('settingsToggleBtn').classList.add('active');
            const keyField = document.getElementById('groqKeyField');
            if (keyField) {
                keyField.value = SystemState.groqKey;
            }
        }
    }

    // ==========================================================================
    // 4. CORE CONTROLS AND EVENT ROUTER INTEGRATIONS
    // ==========================================================================
    function registerOperationalDOMEvents() {
        const area = document.getElementById('chatInputPayload');
        const submit = document.getElementById('submitPromptBtn');
    
        function closeMobileSidebarIfOpen() {
            const isTouchTarget = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024;
            if (isTouchTarget) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar && sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                    const overlay = document.getElementById('sidebarOverlay');
                    if (overlay) {
                        overlay.classList.remove('active');
                    }
                    syncSidebarButtonStates(false);
                }
            }
        }

        function syncSidebarButtonStates(isOpen) {
            const collapseBtn = document.getElementById('collapseSidebarBtn');
            const menuBtn = document.getElementById('menuToggleBtn');
            if (isOpen) {
                if (collapseBtn) collapseBtn.classList.add('is-open');
                if (menuBtn) menuBtn.classList.add('is-open');
            } else {
                if (collapseBtn) collapseBtn.classList.remove('is-open');
                if (menuBtn) menuBtn.classList.remove('is-open');
            }
        }
    
        document.getElementById('brandHomeLink').addEventListener('click', function() {
            SystemState.activeThreadId = null;
            renderThreadSidebarHistory();
            routeWorkspaceView('zeroStateScreen');
            closeMobileSidebarIfOpen();
        });

        document.getElementById('viewportHomeLink').addEventListener('click', function() {
            SystemState.activeThreadId = null;
            renderThreadSidebarHistory();
            routeWorkspaceView('zeroStateScreen');
            closeMobileSidebarIfOpen();
        });
    
        document.getElementById('newChatBtn').addEventListener('click', function() {
            SystemState.activeThreadId = null;
            renderThreadSidebarHistory();
            routeWorkspaceView('zeroStateScreen');
            if (area) { 
                area.value = ''; 
                area.style.height = 'auto'; 
            }
            verifySendBufferCapacity();
            closeMobileSidebarIfOpen();
        });
    
        document.getElementById('sidebarSearchNavBtn').addEventListener('click', function() {
            routeWorkspaceView('searchWorkspaceScreen');
            closeMobileSidebarIfOpen();
        });
        
        document.getElementById('libraryNavBtn').addEventListener('click', function() {
            routeWorkspaceView('libraryWorkspaceScreen');
            closeMobileSidebarIfOpen();
        });
    
        document.getElementById('collapseSidebarBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            const sidebar = document.getElementById('sidebar');
            const isTouchTarget = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024;
    
            if (isTouchTarget) {
                if (sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                    document.getElementById('sidebarOverlay').classList.remove('active');
                    syncSidebarButtonStates(false);
                } else {
                    sidebar.classList.add('mobile-open');
                    document.getElementById('sidebarOverlay').classList.add('active');
                    syncSidebarButtonStates(true);
                }
            } else {
                sidebar.classList.toggle('collapsed');
                const isCollapsed = sidebar.classList.contains('collapsed');
                syncSidebarButtonStates(!isCollapsed);
            }
        });
        
        document.getElementById('menuToggleBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            document.getElementById('sidebar').classList.add('mobile-open');
            document.getElementById('sidebarOverlay').classList.add('active');
            syncSidebarButtonStates(true);
        });
    
        document.getElementById('sidebarOverlay').addEventListener('click', function() {
            document.getElementById('sidebar').classList.remove('mobile-open');
            document.getElementById('sidebarOverlay').classList.remove('active');
            syncSidebarButtonStates(false);
        });
    
        if (area) {
            area.addEventListener('input', function() {
                area.style.height = 'auto';
                area.style.height = area.scrollHeight + 'px';
                verifySendBufferCapacity();
            });
            area.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey && !submit.disabled) {
                    e.preventDefault();
                    dispatchInferenceSequence();
                }
            });
        }
    
        const clearInputBtn = document.getElementById('clearInputBtn');
        if (clearInputBtn) {
            clearInputBtn.addEventListener('click', function() {
                if (area) { 
                    area.value = ''; 
                    area.style.height = 'auto'; 
                }
                verifySendBufferCapacity();
            });
        }
    
        if (submit) {
            submit.addEventListener('click', dispatchInferenceSequence);
        }
    
        document.querySelectorAll('.suggestion-card').forEach(function(card) {
            card.addEventListener('click', function() {
                if (area) {
                    area.value = card.getAttribute('data-prompt');
                    area.style.height = 'auto';
                    area.style.height = area.scrollHeight + 'px';
                    verifySendBufferCapacity();
                    dispatchInferenceSequence();
                }
            });
        });
    
        document.getElementById('internalSearchField').addEventListener('input', function(e) {
            processHistorySearchQuery(e.target.value.toLowerCase().trim());
        });
    
        document.getElementById('libraryWorkspaceSearchField').addEventListener('input', function(e) {
            renderLibraryWorkspaceScreen(e.target.value.toLowerCase().trim());
        });
    
        document.getElementById('toggleCollapseAllChatsBtn').addEventListener('click', function() {
            SystemState.historyCollapsed = !SystemState.historyCollapsed;
            const container = document.getElementById('chatHistoryContainer');
            const icon = document.getElementById('collapseListIcon');
            if (SystemState.historyCollapsed) {
                container.classList.add('list-collapsed'); 
                icon.textContent = 'unfold_more';
            } else {
                container.classList.remove('list-collapsed'); 
                icon.textContent = 'unfold_less';
            }
        });
    
        document.getElementById('deleteAllChatsBtn').addEventListener('click', function() {
            if (confirm('Are you sure you want to permanently wipe all configuration sessions?')) {
                SystemState.threads = {}; 
                SystemState.activeThreadId = null;
                persistThreadsToStorage(); 
                renderThreadSidebarHistory();
                routeWorkspaceView('zeroStateScreen');
                closeMobileSidebarIfOpen();
            }
        });
    
        document.getElementById('themeQuickToggleBtn').addEventListener('click', function() {
            SystemState.theme = (SystemState.theme === 'dark') ? 'light' : 'dark';
            localStorage.setItem('ctx_theme', SystemState.theme);
            applyInterfaceThemeEngine();
        });
    
        document.getElementById('settingsToggleBtn').addEventListener('click', function() {
            routeWorkspaceView('settingsWorkspaceScreen');
            closeMobileSidebarIfOpen(); 
        });
    
        const keyField = document.getElementById('groqKeyField');
        if (keyField) {
            const saveCredentials = function() {
                SystemState.groqKey = keyField.value.trim();
                localStorage.setItem('ctx_api_gateway_key', SystemState.groqKey);
            };
            keyField.addEventListener('input', saveCredentials);
            keyField.addEventListener('change', saveCredentials);
        }
    
        document.getElementById('flushMemoryBtn').addEventListener('click', function() {
            if (confirm('Are you sure you want to completely flash the local cache? System reset sequence will initiate.')) {
                localStorage.removeItem('ctx_theme');
                localStorage.removeItem('ctx_api_gateway_key');
                localStorage.removeItem('ctx_saved_threads');
                location.reload();
            }
        });

        // Global UI Context sheets dismissal paths
        document.addEventListener('click', function() {
            const contextMenu = document.getElementById('chatContextMenu');
            if (contextMenu) {
                contextMenu.classList.add('hidden');
            }
        });

        // Registry configuration options inside Context Panel sheets
        document.getElementById('contextPinThreadBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            const threadId = SystemState.selectedContextMenuThreadId;
            if (threadId && SystemState.threads[threadId]) {
                SystemState.threads[threadId].pinned = !SystemState.threads[threadId].pinned;
                persistThreadsToStorage();
                renderThreadSidebarHistory();
            }
            const contextMenu = document.getElementById('chatContextMenu');
            if (contextMenu) {
                contextMenu.classList.add('hidden');
            }
        });

        document.getElementById('contextDeleteThreadBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            const threadId = SystemState.selectedContextMenuThreadId;
            if (threadId && SystemState.threads[threadId]) {
                delete SystemState.threads[threadId];
                if (SystemState.activeThreadId === threadId) {
                    SystemState.activeThreadId = null;
                    routeWorkspaceView('zeroStateScreen');
                }
                persistThreadsToStorage();
                renderThreadSidebarHistory();
            }
            const contextMenu = document.getElementById('chatContextMenu');
            if (contextMenu) {
                contextMenu.classList.add('hidden');
            }
        });

        // ==========================================================================
        // NATIVE TOUCH EDGE-SWIPE TRACKING SUBSYSTEM
        // ==========================================================================
        (function initSidebarSwipeMechanics() {
            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;

            const SWIPE_THRESHOLD_X = 60;  
            const SWIPE_CONSTRAINT_Y = 40; 
            const EDGE_BOUNDARY_X = 40;    

            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');

            if (!sidebar || !overlay) return;

            document.addEventListener('touchstart', function(e) {
                touchStartX = e.changedTouches[0].clientX;
                touchStartY = e.changedTouches[0].clientY;
            }, { passive: true });

            document.addEventListener('touchend', function(e) {
                touchEndX = e.changedTouches[0].clientX;
                touchEndY = e.changedTouches[0].clientY;
                handleSwipeResolution();
            }, { passive: true });

            function handleSwipeResolution() {
                const deltaX = touchEndX - touchStartX;
                const deltaY = Math.abs(touchEndY - touchStartY);

                if (deltaY > SWIPE_CONSTRAINT_Y) return;

                const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024;
                if (!isTouchDevice) return;

                const isOpen = sidebar.classList.contains('mobile-open');

                if (deltaX > SWIPE_THRESHOLD_X && !isOpen) {
                    if (touchStartX <= EDGE_BOUNDARY_X) {
                        sidebar.classList.add('mobile-open');
                        overlay.classList.add('active');
                        syncSidebarButtonStates(true);
                    }
                } 
                else if (deltaX < -SWIPE_THRESHOLD_X && isOpen) {
                    sidebar.classList.remove('mobile-open');
                    overlay.classList.remove('active');
                    syncSidebarButtonStates(false);
                }
            }
        })();

        // ==========================================================================
        // TOUCHSCREEN VIRTUAL KEYBOARD VIEWPORT GEOMETRY FIX
        // ==========================================================================
        (function initTouchKeyboardResetMechanics() {
            const isTouchTarget = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024;
            if (!isTouchTarget || !window.visualViewport) return;

            const restoreViewport = function() {
                document.documentElement.style.height = '100dvh';
                document.body.style.height = '100dvh';
                
                const app = document.querySelector('.app-container');
                const workspace = document.querySelector('.main-workspace');
                const viewport = document.getElementById('contentViewport');
                
                if (app) app.style.height = '100dvh';
                if (workspace) workspace.style.height = '100dvh';
                
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        window.scrollTo(0, 0);
                        if (viewport) {
                            viewport.style.height = '0px';
                            viewport.offsetHeight; 
                            requestAnimationFrame(function() {
                                viewport.style.height = '';
                                viewport.offsetHeight; 
                            });
                        }
                    });
                });
            };

            let lastViewportHeight = window.visualViewport.height;
            
            window.visualViewport.addEventListener('resize', function() {
                const active = document.activeElement;
                const isEditing = active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT');
                const currentHeight = window.visualViewport.height;
                const keyboardClosed = currentHeight > lastViewportHeight + 80;
                
                lastViewportHeight = currentHeight;
                
                if (!isEditing || keyboardClosed) {
                    setTimeout(restoreViewport, 150);
                }
            });

            document.addEventListener('focusout', function() {
                setTimeout(restoreViewport, 150);
            });
        })();
    }

    function verifySendBufferCapacity() {
        const area = document.getElementById('chatInputPayload');
        if (!area) return;
        const val = area.value.trim();
        const submitBtn = document.getElementById('submitPromptBtn');
        if (submitBtn) {
            submitBtn.disabled = (val.length === 0);
        }
    }

    // ==========================================================================
    // 5. INTUITIVE INFERENCE LOGIC MATCHING & ROUTING ENGINE
    // ==========================================================================
    async function dispatchInferenceSequence() {
        const area = document.getElementById('chatInputPayload');
        if (!area) return;
        const query = area.value.trim();
        if (!query) return;

        area.value = '';
        area.style.height = 'auto';
        verifySendBufferCapacity();

        // Instantiate fallback thread wrapper contexts if empty
        if (!SystemState.activeThreadId) {
            const newId = 'case_log_' + Date.now();
            SystemState.activeThreadId = newId;
            SystemState.threads[newId] = {
                id: newId,
                label: query.length > 28 ? query.substring(0, 26) + '...' : query,
                pinned: false,
                messages: []
            };
        }

        const currentThread = SystemState.threads[SystemState.activeThreadId];
        currentThread.messages.push({ sender: 'user', text: query });
        
        routeWorkspaceView('chatStreamingScreen');
        renderActiveChatMessageStream();
        renderThreadSidebarHistory();

        // Pre-evaluation routing check against matching static clinical keywords
        const normalizedQuery = query.toLowerCase();
        let conceptMatchFound = false;

        for (let i = 0; i < SYSTEM_KNOWLEDGE_POOLS.length; i++) {
            const entity = SYSTEM_KNOWLEDGE_POOLS[i];
            if (normalizedQuery.includes(entity.title.toLowerCase())) {
                const formattedPayload = compileClinicalEntityTemplateHTML(entity);
                
                // Introduce structural layout execution delays to simulate pipeline processing
                await new Promise(function(resolve) { setTimeout(resolve, 450); });
                
                currentThread.messages.push({ sender: 'ai', text: formattedPayload });
                persistThreadsToStorage();
                renderActiveChatMessageStream();
                conceptMatchFound = true;
                break;
            }
        }

        if (conceptMatchFound) return;

        // Fallback interface sequence: Execute remote API data payload request vectors
        if (!SystemState.groqKey) {
            await new Promise(function(resolve) { setTimeout(resolve, 400); });
            currentThread.messages.push({
                sender: 'ai',
                text: '<div class="system-card-container"><div class="system-card-header"><div class="system-card-title"><span class="material-symbols-rounded">gated_sign_in</span> Gateway Key Required</div><div class="system-badge danger-variant">Hold</div></div><div class="system-text-block">Local knowledge pool returned negative parameters. Please configure your Groq Cloud Key credential matrices in the <b>System Workspace Console Screen</b> to unlock advanced cloud reasoning pipelines.</div></div>'
            });
            persistThreadsToStorage();
            renderActiveChatMessageStream();
            return;
        }

        // Build inference prompt structural contextual wrappers
        currentThread.messages.push({ sender: 'ai', text: '<div class="clinical-streaming-loader-placeholder">Analyzing clinical vectors...</div>' });
        renderActiveChatMessageStream();

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + SystemState.groqKey
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [
                        { role: 'system', content: 'You are Cortexa AI, an expert enterprise clinical system assistant tool. Output structured clear HTML cards using modern layouts with class "system-card-container" where relevant.' },
                        { role: 'user', content: query }
                    ],
                    temperature: 0.2
                })
            });

            const data = await response.json();
            currentThread.messages.pop(); // Remove loader object instance

            if (data.choices && data.choices[0]) {
                const rawOutputText = data.choices[0].message.content;
                currentThread.messages.push({ sender: 'ai', text: rawOutputText });
            } else {
                currentThread.messages.push({ sender: 'ai', text: '<p>System encountered an evaluation runtime parsing anomaly. Please check query structure variables.</p>' });
            }
        } catch (error) {
            console.error("Pipeline failure: ", error);
            currentThread.messages.pop();
            currentThread.messages.push({ sender: 'ai', text: '<p>Communication timeout configuration vector failure. Verify gateway connection paths.</p>' });
        }

        persistThreadsToStorage();
        renderActiveChatMessageStream();
    }

    /**
     * Converts structured schema object rows into beautiful standardized HTML blocks.
     */
    function compileClinicalEntityTemplateHTML(entity) {
        let titleBadge = entity.type.toUpperCase();
        let htmlBlock = '<div class="system-card-container">' +
            '<div class="system-card-header">' +
                '<div class="system-card-title"><span class="material-symbols-rounded">clinical_notes</span> ' + entity.title + '</div>' +
                '<div class="system-badge normal">' + titleBadge + '</div>' +
            '</div>' +
            '<div class="system-text-block">';

        if (entity.subtitle) {
            htmlBlock += '<p style="font-size:0.84rem; color:var(--text-secondary); margin-bottom:12px;">' + entity.subtitle + '</p>';
        }

        // Iterate securely over details structure parameters maps
        if (entity.details && Array.isArray(entity.details)) {
            entity.details.forEach(function(detail) {
                htmlBlock += '<p style="margin-bottom:8px;">' + detail + '</p>';
            });
        }

        // Inject functional layout matrix calculations dynamically if attached to the object frame
        if (entity.inputs && Array.isArray(entity.inputs)) {
            htmlBlock += '<div class="integrated-calculator-form-block" style="margin-top:16px; padding:14px; background-color:var(--bg-main); border-radius:12px; border:1px solid var(--border-color);">';
            htmlBlock += '<h6 style="font-size:0.85rem; font-weight:600; margin-bottom:10px; color:var(--accent-blue);">Interactive Assessment Form Matrix</h6>';
            
            entity.inputs.forEach(function(input, index) {
                htmlBlock += '<div class="calc-input-row-entry" style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">' +
                    '<label style="font-size:0.78rem; font-weight:500; color:var(--text-secondary);">' + input.label + '</label>' +
                    '<input type="number" class="calc-interactive-field-node" data-weight="' + (input.weight || 1) + '" value="0" aria-label="' + input.label + '" style="background-color:var(--bg-sidebar); border:1px solid var(--border-color); border-radius:8px; height:36px; padding:0 12px; color:var(--text-primary); outline:none; font-family:var(--font-stack); font-size:0.88rem;">' +
                '</div>';
            });

            htmlBlock += '<button class="execute-calculation-trigger-btn" style="width:100%; height:38px; background-color:var(--text-primary); color:var(--bg-main); border:none; border-radius:8px; font-family:var(--font-stack); font-size:0.85rem; font-weight:600; cursor:pointer; margin-top:6px;">Process Parameters Matrix</button>';
            htmlBlock += '<div class="calculation-output-display-layer hidden" style="margin-top:14px; padding-top:12px; border-top:1px dashed var(--border-color);"></div>';
            htmlBlock += '</div>';
        }

        htmlBlock += '</div></div>';
        return htmlBlock;
    }

    // ==========================================================================
    // 6. DOM RENDER CONSOLE INTERFACES (SIDEBAR HISTORY & VIEWS)
    // ==========================================================================
    function renderThreadSidebarHistory() {
        const container = document.getElementById('chatHistoryContainer');
        if (!container) return;
        container.innerHTML = '';

        const threadsArray = Object.values(SystemState.threads);
        if (threadsArray.length === 0) {
            container.innerHTML = '<div style="font-size:0.8rem; color:var(--text-secondary); text-align:center; padding:16px 8px;">No current logs recorded</div>';
            return;
        }

        // High-performance structural normalization sort: Pinned sessions bubble up
        threadsArray.sort(function(a, b) {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return 0;
        });

        threadsArray.forEach(function(thread) {
            const wrapper = document.createElement('div');
            wrapper.className = 'history-item-wrapper';
            if (thread.id === SystemState.activeThreadId) {
                wrapper.classList.add('active');
            }

            const itemBtn = document.createElement('button');
            itemBtn.className = 'history-item';
            
            let prefixIconStr = thread.pinned ? 'push_pin' : 'chat_bubble';
            itemBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:1.1rem; color:var(--text-secondary); flex-shrink:0;">' + prefixIconStr + '</span>' +
                                '<span class="history-item-text">' + thread.label + '</span>';

            itemBtn.addEventListener('click', function() {
                SystemState.activeThreadId = thread.id;
                renderThreadSidebarHistory();
                routeWorkspaceView('chatStreamingScreen');
                renderActiveChatMessageStream();
            });

            // Anchor dedicated listener vectors targeting Right Click and Touch Long Press configurations
            const handleContextMenuTrigger = function(e) {
                e.preventDefault();
                e.stopPropagation();
                SystemState.selectedContextMenuThreadId = thread.id;
                revealFloatingContextSheet(e.clientX, e.clientY);
            };

            wrapper.addEventListener('contextmenu', handleContextMenuTrigger);

            const optionsTriggerBtn = document.createElement('button');
            optionsTriggerBtn.className = 'item-action-trigger-btn';
            optionsTriggerBtn.innerHTML = '<span class="material-symbols-rounded">more_horiz</span>';
            optionsTriggerBtn.setAttribute('aria-label', 'Open Session Command List');
            
            optionsTriggerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                SystemState.selectedContextMenuThreadId = thread.id;
                const rect = optionsTriggerBtn.getBoundingClientRect();
                revealFloatingContextSheet(rect.left, rect.bottom + 6);
            });

            wrapper.appendChild(itemBtn);
            wrapper.appendChild(optionsTriggerBtn);
            container.appendChild(wrapper);
        });
    }

    function revealFloatingContextSheet(clientX, clientY) {
        const menu = document.getElementById('chatContextMenu');
        if (!menu) return;

        menu.classList.remove('hidden');
        
        // Edge safe bounding configuration check logic rules adjustments
        let adjustedX = clientX;
        let adjustedY = clientY;
        const width = 190;
        const height = 90;

        if (clientX + width > window.innerWidth) {
            adjustedX = window.innerWidth - width - 12;
        }
        if (clientY + height > window.innerHeight) {
            adjustedY = window.innerHeight - height - 12;
        }

        menu.style.left = adjustedX + 'px';
        menu.style.top = adjustedY + 'px';
    }

    function renderActiveChatMessageStream() {
        const target = document.getElementById('chatScrollContainerTarget');
        if (!target) return;
        target.innerHTML = '';

        if (!SystemState.activeThreadId || !SystemState.threads[SystemState.activeThreadId]) return;

        const messages = SystemState.threads[SystemState.activeThreadId].messages;
        messages.forEach(function(msg) {
            const row = document.createElement('div');
            const isUser = (msg.sender === 'user');
            
            row.className = isUser ? 'chat-message-bubble-wrapper user-alignment-node' : 'chat-message-bubble-wrapper ai-alignment-node';
            
            let labelIdentity = isUser ? 'Physician Entry' : 'Cortexa Clinical Engine';
            let messageContentHTML = '<div class="chat-sender-identity-row">' + labelIdentity + '</div>' +
                                     '<div class="chat-bubble-content-payload">' + msg.text + '</div>';
            
            row.innerHTML = messageContentHTML;
            target.appendChild(row);
        });

        // Safe continuous async rendering view alignment pipeline trigger
        setTimeout(scrollViewportToBottom, 30);
    }

    function scrollViewportToBottom() {
        const viewport = document.getElementById('contentViewport');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }

    function processHistorySearchQuery(searchTerm) {
        const container = document.getElementById('searchResultsContainer');
        if (!container) return;
        container.innerHTML = '';

        const term = searchTerm || '';
        let matchingCounter = 0;

        Object.values(SystemState.threads).forEach(function(thread) {
            let matchesThread = thread.label.toLowerCase().includes(term);
            let textExtractFound = "";

            if (!matchesThread) {
                for (let i = 0; i < thread.messages.length; i++) {
                    if (thread.messages[i].text.toLowerCase().includes(term)) {
                        matchesThread = true;
                        textExtractFound = thread.messages[i].text.replace(/<[^>]*>/g, '').substring(0, 70) + '...';
                        break;
                    }
                }
            } else if (thread.messages.length > 0) {
                textExtractFound = thread.messages[0].text.replace(/<[^>]*>/g, '').substring(0, 70) + '...';
            }

            if (matchesThread) {
                matchingCounter++;
                const card = document.createElement('div');
                card.className = 'search-match-card-row';
                card.innerHTML = '<div class="search-match-card-title">' + thread.label + '</div>' +
                                 '<div class="search-match-card-extract">' + (textExtractFound || "Access conversation log entries configuration matrix.") + '</div>';
                
                card.addEventListener('click', function() {
                    SystemState.activeThreadId = thread.id;
                    renderThreadSidebarHistory();
                    routeWorkspaceView('chatStreamingScreen');
                    renderActiveChatMessageStream();
                });
                
                container.appendChild(card);
            }
        });

        if (matchingCounter === 0) {
            container.innerHTML = '<div style="font-size:0.88rem; color:var(--text-secondary); padding:12px 4px;">No internal parameters matched your request filter lookup keys.</div>';
        }
    }

    function renderLibraryWorkspaceScreen(searchTerm) {
        const deck = document.getElementById('libraryContentMatrixDeck');
        if (!deck) return;
        deck.innerHTML = '';

        const filter = searchTerm || '';
        let matchCount = 0;

        SYSTEM_KNOWLEDGE_POOLS.forEach(function(item, index) {
            const matchesTitle = item.title.toLowerCase().includes(filter);
            const matchesSubtitle = item.subtitle && item.subtitle.toLowerCase().includes(filter);
            
            if (filter === '' || matchesTitle || matchesSubtitle) {
                matchCount++;
                const node = document.createElement('div');
                node.className = 'accordion-node-container';
                node.id = 'library_accordion_node_' + index;

                let iconType = 'menu_book';
                if (item.type === 'calc') iconType = 'calculate';
                if (item.type === 'emergency') iconType = 'clinical_alert';

                node.innerHTML = '<button class="accordion-interactive-trigger-row">' +
                    '<div class="accordion-trigger-meta-left">' +
                        '<span class="material-symbols-rounded catalog-icon">' + iconType + '</span>' +
                        '<h4>' + item.title + '</h4>' +
                    '</div>' +
                    '<span class="material-symbols-rounded accordion-node-chevron">expand_more</span>' +
                '</button>' +
                '<div class="accordion-body-expansion-layer">' +
                    '<div class="accordion-internal-padded-content">' +
                        compileClinicalEntityTemplateHTML(item) +
                    '</div>' +
                '</div>';

                // Setup interactive structural tracking configuration handlers
                const trigger = node.querySelector('.accordion-interactive-trigger-row');
                trigger.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const bodyLayer = node.querySelector('.accordion-body-expansion-layer');
                    const isExpanded = node.classList.contains('expanded');
                    
                    // Collapse all adjacent layers safely to keep focus maps tight
                    document.querySelectorAll('.accordion-node-container').forEach(function(otherNode) {
                        if (otherNode !== node) {
                            otherNode.classList.remove('expanded');
                            otherNode.querySelector('.accordion-body-expansion-layer').style.maxHeight = '0px';
                        }
                    });

                    if (isExpanded) {
                        node.classList.remove('expanded');
                        bodyLayer.style.maxHeight = '0px';
                    } else {
                        node.classList.add('expanded');
                        bodyLayer.style.maxHeight = (bodyLayer.scrollHeight + 120) + 'px';
                    }
                });

                // Attach contextual calculator form hooks if attached to active layer indices
                const calcBtn = node.querySelector('.execute-calculation-trigger-btn');
                if (calcBtn) {
                    calcBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        executeEmbeddedCalculatorMatrix(node.querySelector('.integrated-calculator-form-block'));
                    });
                }

                deck.appendChild(node);
            }
        });

        if (matchCount === 0) {
            deck.innerHTML = '<div style="font-size:0.88rem; color:var(--text-secondary); padding:12px 4px;">No static database indices matched your lookups.</div>';
        }
    }

    /**
     * Executes interactive dynamic math scoring matrices inside clinical database card layers.
     */
    function executeEmbeddedCalculatorMatrix(form) {
        if (!form) return;
        const outputNode = form.querySelector('.calculation-output-display-layer');
        const fields = form.querySelectorAll('.calc-interactive-field-node');
        
        let accumulatedMatrixValue = 0;
        let reportingHTML = '<div style="font-size:0.88rem; color:var(--text-primary); line-height:1.4;">' +
            '<p style="font-weight:600; margin-bottom:8px; color:var(--text-primary);">Evaluated Parameter Tracking Map Matrix:</p>';

        fields.forEach(function(input, idx) {
            const scoreLabel = input.getAttribute('aria-label') || 'Parameter Index ' + (idx + 1);
            const userEntryVal = parseFloat(input.value) || 0;
            const scoringWeight = parseFloat(input.getAttribute('data-weight')) || 1;
            const subtotal = userEntryVal * scoringWeight;
            
            accumulatedMatrixValue += subtotal;
            reportingHTML += '<p style="font-size:0.82rem; margin-bottom:4px; padding-left:8px;">• <b>' + scoreLabel + ':</b> ' + userEntryVal + ' (Weight Vector: ' + scoringWeight + ')</p>';
        });

        reportingHTML += '<div style="margin-top:12px; color:var(--accent-blue); font-weight:600; font-size:1rem;">Processing Execution Complete</div>' +
            '<p style="font-size:0.84rem; color:var(--text-secondary); margin-top:4px;">' +
                'Dynamic aggregate evaluation parameters mapped matrix total: <b style="color:var(--text-primary); font-size:1.05rem;">' + accumulatedMatrixValue + '</b>.' +
            '</p>' +
        '</div>';

        if (outputNode) {
            outputNode.innerHTML = reportingHTML;
            outputNode.classList.remove('hidden');
            scrollViewportToBottom();

            // Refresh parent expansion containers bounds measurements safely
            const parentAccordion = form.closest('.accordion-body-expansion-layer');
            if (parentAccordion) {
                parentAccordion.style.maxHeight = (parentAccordion.scrollHeight + 300) + 'px';
            }
        }
    }

    // Bind initialization processes to domestic structural load lifecycles
    window.addEventListener('DOMContentLoaded', initializeCortexaSystem);
})();
