/**
 * Cortexa AI — Platform Controller Module Engine
 */

(function() {
    'use strict';

    // ==========================================================================
    // 1. STATE MANAGEMENT REGISTRY MATRIX
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

    // ==========================================================================
    // 2. EMBEDDED FALLBACK INTERNAL LOCAL DATABASE (REPLACES EXTERNAL SCHEMAS)
    // ==========================================================================
    const MOCK_PROTOCOLS_DB = [
        { id: "p1", title: "Anaphylaxis Emergency Treatment Sequence", description: "First line tracking configuration criteria for severe hypersensitivity tracking events.", keyword: "anaphylaxis", category: "protocol", content: "Administer Intramuscular Epinephrine immediately (1:1000 dilution) at 0.01mg/kg up to a maximum single dose of 0.5mg in adults or 0.3mg in pediatrics. Establish oxygen routing. Repeat delivery intervals every 5-15 minutes if clinical resolution fails." },
        { id: "p2", title: "Acute Stroke Interventions Index Matrix", description: "Neurological monitoring parameters, tracking bounds, and timeframes.", keyword: "stroke", category: "protocol", content: "Verify last known well time parameter window. Maintain systemic pressure below 185/110 mmHg if tissue plasminogen activator (tPA) delivery criteria match. Initiate continuous neurological scale monitoring arrays." }
    ];

    const MOCK_EMERGENCIES_DB = [
        { id: "e1", title: "Cardiac Tamponade Needle Access Parameters", description: "Critical structural points and margins for subxiphoid decompression vectors.", keyword: "tamponade", category: "emergency", content: "Insert long decompression spinal gauge needle immediately at the left subxiphoid structural border margin junction. Advance path angle at 30-45 degrees heading directly toward the left scapula node, maintaining continuous aspiration parameters." },
        { id: "e2", title: "Tension Pneumothorax Needle Thoracocentesis", description: "Anatomical site definitions and thoracic margin metrics.", keyword: "pneumothorax", category: "emergency", content: "Deploy 14-gauge over-the-needle catheter vector at the second intercostal space intersection right along the midclavicular horizontal reference lane or alternatively the fifth intercostal space midaxillary point boundary." }
    ];

    const MOCK_PROCEDURES_DB = [
        { id: "pr1", title: "Rapid Sequence Intubation Optimization Path", description: "Airway processing parameters, sequential validation stages, and protocols.", keyword: "intubation", category: "procedure", content: "Pre-oxygenate for 3 minutes using maximum high-flow volume pathways. Deliver induction agent followed immediately by neuromuscular blockades. Apply cricoid visualization matrices as required by structural shifts." }
    ];

    const MOCK_DRUGS_DB = [
        { id: "d1", title: "Pediatric Medication Administration Error Profiling", description: "Bypassing systemic conversion errors and infusion calculation failures.", keyword: "pediatric", category: "condition", content: "Implement explicit dual-verification checking layers for all weight-indexed medication delivery equations. Restrict multi-concentration options within pediatric workspace zones to eliminate mathematical conversion errors." }
    ];

    const MOCK_CALCULATORS_DB = [
        {
            id: "c1",
            title: "Dynamic Fluid Volume Calculation Engine",
            description: "Automated aggregate parameter mapping evaluation form matrix.",
            keyword: "calculate",
            category: "calc",
            isInteractiveForm: true,
            formFields: [
                { id: "f_weight", label: "Patient Baseline Mass Metric (kg)", defaultValue: 70 },
                { id: "f_multiplier", label: "Volumetric Rate Constant Scalar Factor (mL/kg/hr)", defaultValue: 4 }
            ]
        }
    ];

    let SYSTEM_KNOWLEDGE_POOLS = [];

    // Combine individual database sheets into primary local lookup knowledge array
    function compileMasterKnowledgeBase() {
        const pool = [];
        MOCK_PROTOCOLS_DB.forEach(x => pool.push({ ...x, type: 'protocol', origin: 'protocols.js' }));
        MOCK_EMERGENCIES_DB.forEach(x => pool.push({ ...x, type: 'emergency', origin: 'emergencies.js' }));
        MOCK_PROCEDURES_DB.forEach(x => pool.push({ ...x, type: 'procedure', origin: 'procedures.js' }));
        MOCK_DRUGS_DB.forEach(x => pool.push({ ...x, type: 'condition', origin: 'drugs.js' }));
        MOCK_CALCULATORS_DB.forEach(x => pool.push({ ...x, type: 'calc', origin: 'calculators.js' }));
        return pool;
    }

    // ==========================================================================
    // 3. APPLICATION LIFE-CYCLE ROUTINES
    // ==========================================================================
    function initializeCortexaSystem() {
        SYSTEM_KNOWLEDGE_POOLS = compileMasterKnowledgeBase();
        loadLocalStorageCache();
        applyInterfaceThemeEngine();
        registerOperationalDOMEvents();
        renderThreadSidebarHistory();
        renderLibraryWorkspaceScreen();
        verifySendBufferCapacity();

        // Collapse sidebar on large desktop targets by default layout guidelines
        const isMobileOrTablet = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024;
        if (!isMobileOrTablet) {
            const sidebarElement = document.getElementById('sidebar');
            if (sidebarElement) sidebarElement.classList.add('collapsed');
        }
    }

    function loadLocalStorageCache() {
        const cachedTheme = localStorage.getItem('ctx_theme');
        if (cachedTheme) SystemState.theme = cachedTheme;
    
        const cachedKey = localStorage.getItem('ctx_api_gateway_key');
        if (cachedKey) SystemState.groqKey = cachedKey;
    
        const cachedThreads = localStorage.getItem('ctx_saved_threads');
        if (cachedThreads) {
            SystemState.threads = JSON.parse(cachedThreads);
            if (Object.keys(SystemState.threads).length === 0) generateSeedConversation();
        } else {
            generateSeedConversation();
        }
    }

    function generateSeedConversation() {
        const initialId = 'thread_seed_' + Date.now();
        SystemState.threads = {
            [initialId]: { 
                id: initialId, 
                label: "Welcome Session Overview", 
                pinned: false, 
                messages: [
                    { 
                        sender: 'ai', 
                        text: `<div class="system-card-container">
                            <div class="system-card-header">
                                <div class="system-card-title">
                                    <span class="material-symbols-rounded">forum</span> Welcome to Cortexa Intelligence Platform
                                </div>
                                <div class="system-badge normal">Sandbox Active</div>
                            </div>
                            <div class="system-text-block">
                                Hello! How can I assist you with your clinical database analysis, emergency protocol tracking, or dynamic aggregate calculations today?
                            </div>
                         </div>` 
                    }
                ]
            }
        };
        persistThreadsToStorage();
    }

    function applyInterfaceThemeEngine() {
        const list = document.body.classList;
        const themeIcon = document.querySelector('#themeQuickToggleBtn span');
        if (SystemState.theme === 'dark') {
            list.replace('theme-light', 'theme-dark');
            if (themeIcon) themeIcon.textContent = 'light_mode';
        } else {
            list.replace('theme-dark', 'theme-light');
            if (themeIcon) themeIcon.textContent = 'dark_mode';
        }
    }

    function persistThreadsToStorage() {
        try {
            localStorage.setItem('ctx_saved_threads', JSON.stringify(SystemState.threads));
        } catch (e) {
            console.error("Failed to write conversations to storage:", e);
        }
    }

    // ==========================================================================
    // 4. UI STRUCTURAL VIEWPORT ROUTER MATRIX
    // ==========================================================================
    function routeWorkspaceView(panelId) {
        SystemState.activeViewPanelId = panelId;
        
        document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById('sidebarSearchNavBtn').classList.remove('active');
        document.getElementById('libraryNavBtn').classList.remove('active');
        document.getElementById('settingsToggleBtn').classList.remove('active');

        const activePanel = document.getElementById(panelId);
        if (activePanel) activePanel.classList.remove('hidden');

        // Toggle input bar deck display context matrix visibility rule
        const deck = document.getElementById('globalInputDeck');
        if (panelId === 'searchWorkspaceScreen' || panelId === 'libraryWorkspaceScreen' || panelId === 'settingsWorkspaceScreen') {
            deck.classList.add('hidden');
        } else {
            deck.classList.remove('hidden');
        }

        // Initialize views
        if (panelId === 'searchWorkspaceScreen') {
            document.getElementById('sidebarSearchNavBtn').classList.add('active');
            processHistorySearchQuery();
        } else if (panelId === 'libraryWorkspaceScreen') {
            document.getElementById('libraryNavBtn').classList.add('active');
            renderLibraryWorkspaceScreen();
        } else if (panelId === 'settingsWorkspaceScreen') {
            document.getElementById('settingsToggleBtn').classList.add('active');
            const keyField = document.getElementById('groqKeyField');
            if (keyField) keyField.value = SystemState.groqKey;
        }
    }

    // ==========================================================================
    // 5. DOM EVENTS INTERFACE REGISTRY HANDLERS
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
                    document.getElementById('sidebarOverlay').classList.remove('active');
                }
            }
        }
    
        document.getElementById('brandHomeLink').addEventListener('click', () => {
            SystemState.activeThreadId = null;
            renderThreadSidebarHistory();
            routeWorkspaceView('zeroStateScreen');
            closeMobileSidebarIfOpen();
        });

        document.getElementById('topNavHomeBtn').addEventListener('click', () => {
            SystemState.activeThreadId = null;
            renderThreadSidebarHistory();
            routeWorkspaceView('zeroStateScreen');
        });
    
        document.getElementById('newChatBtn').addEventListener('click', () => {
            SystemState.activeThreadId = null;
            renderThreadSidebarHistory();
            routeWorkspaceView('zeroStateScreen');
            if (area) { area.value = ''; area.style.height = 'auto'; }
            verifySendBufferCapacity();
            closeMobileSidebarIfOpen();
        });
    
        document.getElementById('sidebarSearchNavBtn').addEventListener('click', () => {
            routeWorkspaceView('searchWorkspaceScreen');
            closeMobileSidebarIfOpen();
        });
        
        document.getElementById('libraryNavBtn').addEventListener('click', () => {
            routeWorkspaceView('libraryWorkspaceScreen');
            closeMobileSidebarIfOpen();
        });
    
        document.getElementById('collapseSidebarBtn').addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const isTouchTarget = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024;
            if (isTouchTarget) {
                sidebar.classList.remove('mobile-open');
                document.getElementById('sidebarOverlay').classList.remove('active');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
        
        document.getElementById('menuToggleBtn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('mobile-open');
            document.getElementById('sidebarOverlay').classList.add('active');
        });
    
        document.getElementById('sidebarOverlay').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('mobile-open');
            document.getElementById('sidebarOverlay').classList.remove('active');
        });
    
        if (area) {
            area.addEventListener('input', () => {
                area.style.height = 'auto';
                area.style.height = area.scrollHeight + 'px';
                verifySendBufferCapacity();
            });
            area.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !submit.disabled) {
                    e.preventDefault();
                    dispatchInferenceSequence();
                }
            });
        }
    
        const clearInputBtn = document.getElementById('clearInputBtn');
        if (clearInputBtn) {
            clearInputBtn.addEventListener('click', () => {
                if (area) { area.value = ''; area.style.height = 'auto'; }
                verifySendBufferCapacity();
            });
        }
    
        if (submit) submit.addEventListener('click', dispatchInferenceSequence);
    
        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                if (area) {
                    area.value = card.getAttribute('data-prompt');
                    area.style.height = 'auto';
                    area.style.height = area.scrollHeight + 'px';
                    verifySendBufferCapacity();
                    dispatchInferenceSequence();
                }
            });
        });
    
        document.getElementById('internalSearchField').addEventListener('input', (e) => {
            processHistorySearchQuery(e.target.value.toLowerCase().trim());
        });
    
        document.getElementById('libraryWorkspaceSearchField').addEventListener('input', (e) => {
            renderLibraryWorkspaceScreen(e.target.value.toLowerCase().trim());
        });
    
        document.getElementById('toggleCollapseAllChatsBtn').addEventListener('click', () => {
            SystemState.historyCollapsed = !SystemState.historyCollapsed;
            const container = document.getElementById('chatHistoryContainer');
            const icon = document.getElementById('collapseListIcon');
            if (SystemState.historyCollapsed) {
                container.classList.add('list-collapsed'); icon.textContent = 'unfold_more';
            } else {
                container.classList.remove('list-collapsed'); icon.textContent = 'unfold_less';
            }
        });
    
        document.getElementById('deleteAllChatsBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to permanently wipe all local sessions?')) {
                SystemState.threads = {}; SystemState.activeThreadId = null;
                persistThreadsToStorage(); renderThreadSidebarHistory();
                routeWorkspaceView('zeroStateScreen');
                closeMobileSidebarIfOpen();
            }
        });
    
        document.getElementById('themeQuickToggleBtn').addEventListener('click', () => {
            SystemState.theme = SystemState.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('ctx_theme', SystemState.theme);
            applyInterfaceThemeEngine();
        });
    
        document.getElementById('settingsToggleBtn').addEventListener('click', () => {
            routeWorkspaceView('settingsWorkspaceScreen');
            closeMobileSidebarIfOpen(); 
        });
    
        const keyField = document.getElementById('groqKeyField');
        if (keyField) {
            const saveCredentials = () => {
                SystemState.groqKey = keyField.value.trim();
                localStorage.setItem('ctx_api_gateway_key', SystemState.groqKey);
            };
            keyField.addEventListener('input', saveCredentials);
            keyField.addEventListener('change', saveCredentials);
        }
    
        document.getElementById('flushMemoryBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to completely clear the local cache? This will restore configurations.')) {
                localStorage.removeItem('ctx_theme');
                localStorage.removeItem('ctx_api_gateway_key');
                localStorage.removeItem('ctx_saved_threads');
                location.reload();
            }
        });
    
        const collapseSidebarBtn = document.getElementById('collapseSidebarBtn');
        const menuToggleBtn = document.getElementById('menuToggleBtn');

        document.addEventListener('click', () => {
            const contextMenu = document.getElementById('chatContextMenu');
            if (contextMenu) contextMenu.classList.add('hidden');
        });
        
        const historyContainer = document.getElementById('chatHistoryContainer');
        if (historyContainer) {
            historyContainer.addEventListener('click', (e) => {
                if (e.target.closest('.history-item') || e.target.closest('.sidebar-action-pill-btn')) {
                    closeMobileSidebarIfOpen();
                    if (collapseSidebarBtn) collapseSidebarBtn.classList.remove('is-open');
                    if (menuToggleBtn) menuToggleBtn.classList.remove('is-open');
                }
            });
        }
        
        if (collapseSidebarBtn) {
            collapseSidebarBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                collapseSidebarBtn.classList.toggle('is-open');
            });
        }

        if (menuToggleBtn) {
            menuToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                menuToggleBtn.classList.toggle('is-open');
            });
        }

        // Pin and Delete operation endpoints attached inside custom floating context layouts
        document.getElementById('contextPinThreadBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            const tId = SystemState.selectedContextMenuThreadId;
            if (tId && SystemState.threads[tId]) {
                SystemState.threads[tId].pinned = !SystemState.threads[tId].pinned;
                persistThreadsToStorage(); renderThreadSidebarHistory();
            }
            document.getElementById('chatContextMenu').classList.add('hidden');
        });

        document.getElementById('contextDeleteThreadBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            const tId = SystemState.selectedContextMenuThreadId;
            if (tId && SystemState.threads[tId]) {
                delete SystemState.threads[tId];
                if (SystemState.activeThreadId === tId) {
                    SystemState.activeThreadId = null;
                    routeWorkspaceView('zeroStateScreen');
                }
                persistThreadsToStorage(); renderThreadSidebarHistory();
            }
            document.getElementById('chatContextMenu').classList.add('hidden');
        });

        // ==========================================================================
        // TOUCH GESTURE SLIDE DISPATCH SYSTEM MECHANICAL WRAPPER
        // ==========================================================================
        (function initSidebarSwipeMechanics() {
            let touchStartX = 0; let touchStartY = 0;
            let touchEndX = 0; let touchEndY = 0;
            const SWIPE_THRESHOLD_X = 50; const SWIPE_CONSTRAINT_Y = 40; const EDGE_BOUNDARY_X = 50;
            const sidebar = document.getElementById('sidebar'); const overlay = document.getElementById('sidebarOverlay');
            if (!sidebar || !overlay) return;

            document.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].clientX; touchStartY = e.changedTouches[0].clientY;
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].clientX; touchEndY = e.changedTouches[0].clientY;
                handleSwipeResolution();
            }, { passive: true });

            function handleSwipeResolution() {
                const deltaX = touchEndX - touchStartX; const deltaY = Math.abs(touchEndY - touchStartY);
                if (deltaY > SWIPE_CONSTRAINT_Y) return;
                const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024;
                if (!isTouchDevice) return;
                const isOpen = sidebar.classList.contains('mobile-open');
                if (deltaX > SWIPE_THRESHOLD_X && !isOpen) {
                    if (touchStartX <= EDGE_BOUNDARY_X) openDrawer();
                } else if (deltaX < -SWIPE_THRESHOLD_X && isOpen) {
                    closeDrawer();
                }
            }

            function openDrawer() { sidebar.classList.add('mobile-open'); overlay.classList.add('active'); }
            function closeDrawer() { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); }
        })();
    }

    function verifySendBufferCapacity() {
        const area = document.getElementById('chatInputPayload');
        if (!area) return;
        const val = area.value.trim();
        const submitBtn = document.getElementById('submitPromptBtn');
        if (submitBtn) submitBtn.disabled = (val.length === 0);
    }

    // ==========================================================================
    // 6. INTELLIGENT ROUTING & MOCK INFERENCE MATRIX
    // ==========================================================================
    async function dispatchInferenceSequence() {
        const area = document.getElementById('chatInputPayload');
        if (!area) return;
        const query = area.value.trim();
        if (!query) return;

        area.value = '';
        area.style.height = 'auto';
        verifySendBufferCapacity();

        // Instantiate thread structure if missing on execution payload pass
        if (!SystemState.activeThreadId) {
            const newId = 'case_log_' + Date.now();
            SystemState.activeThreadId = newId;
            SystemState.threads[newId] = {
                id: newId,
                label: query.substring(0, 26) + (query.length > 26 ? '...' : ''),
                pinned: false,
                messages: []
            };
        }

        SystemState.threads[SystemState.activeThreadId].messages.push({ sender: 'user', text: query });
        persistThreadsToStorage();
        renderThreadSidebarHistory();
        routeWorkspaceView('chatWorkspaceScreen');
        scrollViewportToBottom();

        // Trigger typing processing block telemetry animation view layout instantly
        const messagesFeed = document.getElementById('chatThreadMessagesFeed');
        const loaderNode = document.createElement('div');
        loaderNode.className = 'message-row ai-alignment';
        loaderNode.id = 'inferenceFeedbackLoader';
        loaderNode.innerHTML = `<div class="chat-bubble">Evaluating environment telemetry streams...</div>`;
        messagesFeed.appendChild(loaderNode);
        scrollViewportToBottom();

        // Local knowledge analysis match check routine logic pass
        setTimeout(() => {
            const loader = document.getElementById('inferenceFeedbackLoader');
            if (loader) loader.remove();

            let targetMatch = null;
            const normQuery = query.toLowerCase();
            for (let item of SYSTEM_KNOWLEDGE_POOLS) {
                if (normQuery.includes(item.keyword) || normQuery.includes(item.title.toLowerCase())) {
                    targetMatch = item;
                    break;
                }
            }

            let aiPayloadText = '';
            if (targetMatch) {
                if (targetMatch.isInteractiveForm) {
                    aiPayloadText = generateEmbeddedFormCardHTML(targetMatch);
                } else {
                    aiPayloadText = `<div class="system-card-container">
                        <div class="system-card-header">
                            <div class="system-card-title">
                                <span class="material-symbols-rounded">clinical_notes</span> Knowledge Layer: ${targetMatch.title}
                            </div>
                            <div class="system-badge normal">${targetMatch.type}</div>
                        </div>
                        <div class="system-text-block">${targetMatch.content}</div>
                        <div class="system-data-grid">
                            <div class="data-grid-item">
                                <div class="data-grid-item-label">Source Module Tag</div>
                                <div class="data-grid-item-value">${targetMatch.origin}</div>
                            </div>
                        </div>
                    </div>`;
                }
            } else {
                // Endpoint credential integration check pass modifier sequence validation
                if (SystemState.groqKey.startsWith('gsk_')) {
                    aiPayloadText = `<div class="system-card-container">
                        <div class="system-card-header">
                            <div class="system-card-title"><span class="material-symbols-rounded">cloud_done</span> Cloud Streaming Signal</div>
                            <div class="system-badge normal">Live Node</div>
                        </div>
                        <div class="system-text-block">API authorization signature identified. Cortexa would stream real-time insights from your external endpoint endpoint here. Query tracked: "<i>${escapeHTML(query)}</i>".</div>
                    </div>`;
                } else {
                    aiPayloadText = `<div class="system-card-container">
                        <div class="system-card-header">
                            <div class="system-card-title"><span class="material-symbols-rounded">database_off</span> Sandbox Registry Match Missed</div>
                            <div class="system-badge danger">Offline</div>
                        </div>
                        <div class="system-text-block">Terms not mapped inside the sandbox library. Connect your cloud inferencing access key within system settings cards to activate cross-database synthesis modules.</div>
                    </div>`;
                }
            }

            SystemState.threads[SystemState.activeThreadId].messages.push({ sender: 'ai', text: aiPayloadText });
            persistThreadsToStorage();
            appendSingleMessageBubble(SystemState.threads[SystemState.activeThreadId].messages.slice(-1)[0]);
            attachCalculationFormRuntimeListeners();
        }, 850);
    }

    // ==========================================================================
    // 7. COMPONENT HTML VIEW LAYOUT RENDERING PIPELINES
    // ==========================================================================
    function renderThreadSidebarHistory() {
        const container = document.getElementById('chatHistoryContainer');
        if (!container) return;
        container.innerHTML = '';

        const items = Object.values(SystemState.threads).sort((a,b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.id.localeCompare(a.id);
        });

        if (items.length === 0) {
            container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-secondary); text-align:center; padding:16px;">No active sessions stored</div>`;
            return;
        }

        items.forEach(t => {
            const wrapper = document.createElement('div');
            wrapper.className = 'history-item-wrapper' + (SystemState.activeThreadId === t.id ? ' active' : '');
            wrapper.setAttribute('data-thread-id', t.id);

            let pinBadgeHTML = t.pinned ? `<div class="pinned-indicator-badge"><span class="material-symbols-rounded">keep</span></div>` : '';

            wrapper.innerHTML = `
                <button class="history-item">
                    <span class="material-symbols-rounded" style="font-size:1.15rem; color:var(--text-secondary); flex-shrink:0;">forum</span>
                    <span class="history-item-text">${escapeHTML(t.label)}</span>
                </button>
                ${pinBadgeHTML}
                <button class="item-action-trigger-btn" title="Actions menu">
                    <span class="material-symbols-rounded" style="font-size:1.1rem;">more_vert</span>
                </button>
            `;

            wrapper.querySelector('.history-item').addEventListener('click', () => {
                SystemState.activeThreadId = t.id;
                renderThreadSidebarHistory();
                routeWorkspaceView('chatWorkspaceScreen');
                renderActiveThreadMessagesFeed();
            });

            const actionBtn = wrapper.querySelector('.item-action-trigger-btn');
            actionBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                triggerContextActionMenuPopup(e, t.id);
            });

            wrapper.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                triggerContextActionMenuPopup(e, t.id);
            });

            container.appendChild(wrapper);
        });
    }

    function renderActiveThreadMessagesFeed() {
        const feed = document.getElementById('chatThreadMessagesFeed');
        if (!feed) return;
        feed.innerHTML = '';

        if (!SystemState.activeThreadId || !SystemState.threads[SystemState.activeThreadId]) return;

        SystemState.threads[SystemState.activeThreadId].messages.forEach(msg => {
            appendSingleMessageBubble(msg);
        });
        attachCalculationFormRuntimeListeners();
        scrollViewportToBottom();
    }

    function appendSingleMessageBubble(msg) {
        const feed = document.getElementById('chatThreadMessagesFeed');
        if (!feed) return;

        const row = document.createElement('div');
        row.className = 'message-row ' + (msg.sender === 'user' ? 'user-alignment' : 'ai-alignment');
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';

        if (msg.sender === 'ai') {
            bubble.innerHTML = msg.text;
        } else {
            bubble.textContent = msg.text;
        }

        row.appendChild(bubble);
        feed.appendChild(row);
        scrollViewportToBottom();
    }

    function triggerContextActionMenuPopup(e, threadId) {
        SystemState.selectedContextMenuThreadId = threadId;
        const menu = document.getElementById('chatContextMenu');
        if (!menu) return;

        const isPinned = SystemState.threads[threadId].pinned;
        document.getElementById('contextPinText').textContent = isPinned ? 'Unpin Session' : 'Pin Session';
        document.querySelector('#contextPinThreadBtn span.context-icon').textContent = isPinned ? 'keep_off' : 'keep';

        menu.classList.remove('hidden');
        
        let targetX = e.clientX;
        let targetY = e.clientY;

        // Position custom absolute coordinates bounds safely inside screen limits
        if (targetX + menu.offsetWidth > window.innerWidth) targetX = window.innerWidth - menu.offsetWidth - 10;
        if (targetY + menu.offsetHeight > window.innerHeight) targetY = window.innerHeight - menu.offsetHeight - 10;

        menu.style.left = targetX + 'px';
        menu.style.top = targetY + 'px';
    }

    function processHistorySearchQuery(filterTerm = '') {
        const resultsZone = document.getElementById('searchResultsZone');
        if (!resultsZone) return;
        resultsZone.innerHTML = '';

        const threadsPool = Object.values(SystemState.threads);
        const filtered = threadsPool.filter(t => {
            if (!filterTerm) return true;
            if (t.label.toLowerCase().includes(filterTerm)) return true;
            return t.messages.some(m => m.text.toLowerCase().includes(filterTerm));
        });

        if (filtered.length === 0) {
            resultsZone.innerHTML = `<p style="font-size:0.88rem; color:var(--text-secondary); text-align:center; padding:32px;">No logged sessions match search metrics.</p>`;
            return;
        }

        filtered.forEach(t => {
            const card = document.createElement('div');
            card.className = 'search-result-row-card';
            
            let sliceText = t.messages[0] ? t.messages[0].text.replace(/<[^>]*>/g, '').substring(0, 70) + '...' : 'Empty chat thread profile';
            
            card.innerHTML = `
                <div class="search-result-meta-block">
                    <div class="search-result-title">${escapeHTML(t.label)}</div>
                    <div class="search-result-snippet">${escapeHTML(sliceText)}</div>
                </div>
                <span class="material-symbols-rounded" style="color:var(--accent-blue);">arrow_forward_ios</span>
            `;

            card.addEventListener('click', () => {
                SystemState.activeThreadId = t.id;
                renderThreadSidebarHistory();
                routeWorkspaceView('chatWorkspaceScreen');
                renderActiveThreadMessagesFeed();
            });

            resultsZone.appendChild(card);
        });
    }

    function renderLibraryWorkspaceScreen(filterTerm = '') {
        const container = document.getElementById('libraryItemsContainer');
        if (!container) return;
        container.innerHTML = '';

        const matched = SYSTEM_KNOWLEDGE_POOLS.filter(x => {
            if (!filterTerm) return true;
            return x.title.toLowerCase().includes(filterTerm) || x.description.toLowerCase().includes(filterTerm) || x.keyword.toLowerCase().includes(filterTerm);
        });

        if (matched.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-secondary); font-size:0.9rem;">No libraries identified matching conditions.</div>`;
            return;
        }

        matched.forEach(item => {
            const node = document.createElement('div');
            node.className = 'library-component-card';

            node.innerHTML = `
                <div class="library-card-top-row">
                    <div class="library-meta-title-group">
                        <div class="library-item-headline">${escapeHTML(item.title)}</div>
                        <div class="library-item-origin-tag">${escapeHTML(item.origin)}</div>
                    </div>
                    <div class="library-badge type-${item.category}">${escapeHTML(item.category)}</div>
                </div>
                <p class="library-item-description">${escapeHTML(item.description)}</p>
                <div class="library-action-row">
                    <button class="library-launch-action-btn">
                        <span>Deploy Model</span><span class="material-symbols-rounded">arrow_right_alt</span>
                    </button>
                </div>
            `;

            node.querySelector('.library-launch-action-btn').addEventListener('click', () => {
                const generatedId = 'thread_lib_' + Date.now();
                SystemState.threads[generatedId] = {
                    id: generatedId,
                    label: item.title.substring(0,24),
                    pinned: false,
                    messages: [
                        { sender: 'user', text: `Access and instantiate reference layer: ${item.title}` }
                    ]
                };

                let responsePayload = '';
                if (item.isInteractiveForm) {
                    responsePayload = generateEmbeddedFormCardHTML(item);
                } else {
                    responsePayload = `<div class="system-card-container">
                        <div class="system-card-header">
                            <div class="system-card-title"><span class="material-symbols-rounded">folder_open</span> ${item.title}</div>
                            <div class="system-badge normal">Loaded</div>
                        </div>
                        <div class="system-text-block">${item.content}</div>
                    </div>`;
                }

                SystemState.threads[generatedId].messages.push({ sender: 'ai', text: responsePayload });
                SystemState.activeThreadId = generatedId;
                persistThreadsToStorage();
                renderThreadSidebarHistory();
                routeWorkspaceView('chatWorkspaceScreen');
                renderActiveThreadMessagesFeed();
            });

            container.appendChild(node);
        });
    }

    function generateEmbeddedFormCardHTML(item) {
        let fieldsHTML = '';
        item.formFields.forEach(f => {
            fieldsHTML += `
                <div class="calculator-input-field-group">
                    <label for="${f.id}">${f.label}</label>
                    <input type="number" id="${f.id}" value="${f.defaultValue}" data-label="${f.label}">
                </div>
            `;
        });

        return `<div class="system-card-container">
            <div class="system-card-header">
                <div class="system-card-title"><span class="material-symbols-rounded">calculate</span> ${item.title}</div>
                <div class="system-badge normal">Equation Form</div>
            </div>
            <div class="system-text-block">${item.description}</div>
            
            <div class="accordion-container-card">
                <button class="accordion-toggle-trigger-bar">
                    <span>Toggle Evaluation Inputs Panel Matrix</span>
                    <span class="material-symbols-rounded transition-icon">expand_more</span>
                </button>
                <div class="accordion-body-expansion-layer open">
                    <div class="accordion-content-padded-box">
                        <form class="calculation-form-matrix" onsubmit="return false;">
                            ${fieldsHTML}
                            <button class="execute-calc-action-btn">Evaluate Matrix Transformations</button>
                        </form>
                        <div class="calculator-output-block hidden" style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:14px;"></div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // ==========================================================================
    // 8. FORM EVENT REGISTRATION & COMPUTATION PIPELINES
    // ==========================================================================
    function attachCalculationFormRuntimeListeners() {
        document.querySelectorAll('.accordion-toggle-trigger-bar').forEach(bar => {
            bar.onclick = (e) => {
                e.stopPropagation();
                const layer = bar.nextElementSibling;
                const icon = bar.querySelector('.transition-icon');
                if (layer.classList.contains('open')) {
                    layer.classList.remove('open');
                    layer.style.maxHeight = '0px';
                    if (icon) icon.style.transform = 'rotate(0deg)';
                } else {
                    layer.classList.add('open');
                    layer.style.maxHeight = '1200px';
                    if (icon) icon.style.transform = 'rotate(180deg)';
                }
            };
        });

        document.querySelectorAll('.execute-calc-action-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                executeLocalFormCalculation(btn.closest('.calculation-form-matrix'), btn.closest('.accordion-content-padded-box').querySelector('.calculator-output-block'));
            };
        });
    }

    function executeLocalFormCalculation(form, out) {
        if (!form) return;
        const inputs = form.querySelectorAll('input');
        let computedSum = 0;
        let reportHTML = `<div style="background:rgba(0,0,0,0.2); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
            <h5 style="margin-bottom:6px; font-size:0.9rem; color:var(--text-primary);">Matrix Analysis Variables Ledger</h5>`;
        
        inputs.forEach((input, index) => {
            const fieldLabel = input.getAttribute('data-label') || `Parameter ${index+1}`;
            const inputVal = parseFloat(input.value) || 0;
            computedSum += inputVal;
            reportHTML += `<p style="font-size:0.88rem; margin-bottom:4px;">• <b>${fieldLabel}:</b> ${inputVal}</p>`;
        });
        
        reportHTML += `
            <div style="margin-top:10px; color:var(--accent-blue); font-weight:600; font-size:1.15rem;">Processing Execution Complete</div>
            <p style="font-size:0.86rem; color:var(--text-secondary); margin-top:2px;">
                Dynamic aggregate evaluation parameters mapped matrix total sum: <b>${computedSum}</b>.
            </p>
        </div>`;
        
        if (out) {
            out.innerHTML = reportHTML;
            out.classList.remove('hidden');
            scrollViewportToBottom();
            
            const parentAccordionLayer = form.closest('.accordion-body-expansion-layer');
            if (parentAccordionLayer) parentAccordionLayer.style.maxHeight = (parentAccordionLayer.scrollHeight + 300) + 'px';
        }
    }

    // ==========================================================================
    // 9. UTILITY UTILS CORE INFRASTRUCTURE FUNCTIONS
    // ==========================================================================
    function scrollViewportToBottom() {
        const viewport = document.getElementById('contentViewport');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    window.addEventListener('DOMContentLoaded', initializeCortexaSystem);
})();
