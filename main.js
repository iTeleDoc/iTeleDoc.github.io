/**
 * Cortexa AI — Medical Intelligence Platform
 */

(function() {
    'use strict';

    // ==========================================
    // 1. ENGINE RUNTIME STATE MATRIX
    // ==========================================
    let SystemState = {
        theme: 'dark',
        groqKey: '',
        activeThreadId: null,
        historyCollapsed: true,
        selectedContextMenuThreadId: null,
        activeViewPanelId: 'zeroStateScreen',
        threads: {}
    };

    // Safe Global Database Registry Access Layer
    function compileMasterKnowledgeBase() {
        const pool = [];
        
        // Mapped to correct window global array handles
        if (window.PROTOCOLS_DB && Array.isArray(window.PROTOCOLS_DB)) {
            window.PROTOCOLS_DB.forEach(x => pool.push({ ...x, type: 'protocol', origin: 'protocols.js' }));
        }
        if (window.EMERGENCIES_DB && Array.isArray(window.EMERGENCIES_DB)) {
            window.EMERGENCIES_DB.forEach(x => pool.push({ ...x, type: 'emergency', origin: 'emergencies.js' }));
        }
        if (window.PROCEDURES_DB && Array.isArray(window.PROCEDURES_DB)) {
            window.PROCEDURES_DB.forEach(x => pool.push({ ...x, type: 'procedure', origin: 'procedures.js' }));
        }
        if (window.DRUGS_DB && Array.isArray(window.DRUGS_DB)) {
            window.DRUGS_DB.forEach(x => pool.push({ ...x, type: 'condition', origin: 'drugs.js' }));
        }
        
        // Map dynamic calculations from specialized files safely
        if (window.CALCULATORS_DB && Array.isArray(window.CALCULATORS_DB)) {
            window.CALCULATORS_DB.forEach(x => pool.push({ ...x, type: 'calc', origin: 'calculators.js' }));
        }
        if (window.FLUIDS_DB && Array.isArray(window.FLUIDS_DB)) {
            window.FLUIDS_DB.forEach(x => pool.push({ ...x, type: 'calc', origin: 'fluids.js' }));
        }
        if (window.LABS_DB && Array.isArray(window.LABS_DB)) {
            window.LABS_DB.forEach(x => pool.push({ ...x, type: 'calc', origin: 'labs.js' }));
        }

        return pool;
    }

    let SYSTEM_KNOWLEDGE_POOLS = [];

    // ==========================================
    // 2. LIFECYCLE CONTROLLER INIT
    // ==========================================
    function initializeCortexaSystem() {
        SYSTEM_KNOWLEDGE_POOLS = compileMasterKnowledgeBase();
        loadLocalStorageCache();
        applyInterfaceThemeEngine();
        registerOperationalDOMEvents();
        renderThreadSidebarHistory();
        renderLibraryWorkspaceScreen();
        verifySendBufferCapacity();

        // Safely collapse the desktop view on load without touching mobile panels
        const isMobileOrTablet = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024;
        if (!isMobileOrTablet) {
            const sidebarElement = document.getElementById('sidebar');
            if (sidebarElement) {
                sidebarElement.classList.add('collapsed');
            }
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
            if (Object.keys(SystemState.threads).length === 0) {
                generateSeedConversation();
            }
        } else {
            generateSeedConversation();
        }
    }

    function generateSeedConversation() {
        const initialId = 'thread_seed_' + Date.now();
        SystemState.threads = {
            [initialId]: { 
                id: initialId, 
                label: "New Conversation", 
                pinned: false, 
                messages: [
                    { 
                        sender: 'ai', 
                        text: `<div class="system-card-container">
                            <div class="system-card-header">
                                <div class="system-card-title">
                                    <span class="material-symbols-rounded">forum</span> Welcome to Cortexa AI
                                </div>
                                <div class="system-badge normal">Ready</div>
                            </div>
                            <div class="system-text-block">
                                Hello! How can I assist you with your clinical database analysis or data processing today?
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

    // ==========================================
    // 3. UI VIEWPORT ROUTER MATRIX
    // ==========================================
    function routeWorkspaceView(panelId) {
        SystemState.activeViewPanelId = panelId;
        
        document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById('sidebarSearchNavBtn').classList.remove('active');
        document.getElementById('libraryNavBtn').classList.remove('active');
        document.getElementById('settingsToggleBtn').classList.remove('active');

        const activePanel = document.getElementById(panelId);
        if (activePanel) activePanel.classList.remove('hidden');

        const deck = document.getElementById('globalInputDeck');
        if (panelId === 'searchWorkspaceScreen' || panelId === 'libraryWorkspaceScreen' || panelId === 'settingsWorkspaceScreen') {
            deck.classList.add('hidden');
        } else {
            deck.classList.remove('hidden');
        }

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

    // ==========================================
    // 4. CORE CONTROLS AND INTERFACES
    // ==========================================
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
                container.classList.add('list-collapsed');
                icon.textContent = 'unfold_more';
            } else {
                container.classList.remove('list-collapsed');
                icon.textContent = 'unfold_less';
            }
        });
    
        document.getElementById('deleteAllChatsBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to permanently wipe all sessions?')) {
                SystemState.threads = {};
                SystemState.activeThreadId = null;
                persistThreadsToStorage();
                renderThreadSidebarHistory();
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
            if (confirm('Are you sure you want to completely clear the local cache? This will reset the system.')) {
                localStorage.removeItem('ctx_theme');
                localStorage.removeItem('ctx_api_gateway_key');
                localStorage.removeItem('ctx_saved_threads');
                location.reload();
            }
        });
    
        document.addEventListener('click', () => {
            const contextMenu = document.getElementById('chatContextMenu');
            if (contextMenu) contextMenu.classList.add('hidden');
        });
    
        const historyContainer = document.getElementById('chatHistoryContainer');
        if (historyContainer) {
            historyContainer.addEventListener('click', (e) => {
                if (e.target.closest('.history-item') || e.target.closest('.sidebar-action-pill-btn')) {
                    closeMobileSidebarIfOpen();
                }
            });
        }
    }

    function verifySendBufferCapacity() {
        const area = document.getElementById('chatInputPayload');
        const submit = document.getElementById('submitPromptBtn');
        if (!area || !submit) return;
        
        if (area.value.trim().length > 0) {
            submit.disabled = false;
        } else {
            submit.disabled = true;
        }
    }

    // ==========================================
    // 5. SIDEBAR HISTORICAL THREAD LAYOUT RENDERING
    // ==========================================
    function renderThreadSidebarHistory() {
        const container = document.getElementById('chatHistoryContainer');
        if (!container) return;
        container.innerHTML = '';

        const activeList = Object.values(SystemState.threads);
        if (activeList.length === 0) {
            container.innerHTML = `<div class="sidebar-empty-state">No past sessions active.</div>`;
            return;
        }

        // Sort: Pinned elements ascend to top index maps automatically
        activeList.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

        activeList.forEach(thread => {
            const item = document.createElement('div');
            item.className = `history-item${SystemState.activeThreadId === thread.id ? ' active' : ''}`;
            item.setAttribute('data-id', thread.id);
            
            // Standard click routing loop handler interface
            item.addEventListener('click', (e) => {
                if (e.target.closest('.history-context-trigger')) return;
                loadThreadSessionIntoFeed(thread.id);
            });

            // Trigger the context menu layer securely
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                displayThreadContextMenu(e, thread.id);
            });

            const leadingIcon = thread.pinned ? 'keep' : 'chat_bubble';
            
            item.innerHTML = `
                <span class="material-symbols-rounded item-prefix">${leadingIcon}</span>
                <span class="item-label">${escapeHtml(thread.label)}</span>
                <button class="history-context-trigger">
                    <span class="material-symbols-rounded">more_vert</span>
                </button>
            `;

            const menuTrigger = item.querySelector('.history-context-trigger');
            menuTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                displayThreadContextMenu(e, thread.id);
            });

            container.appendChild(item);
        });
    }

    function displayThreadContextMenu(event, threadId) {
        SystemState.selectedContextMenuThreadId = threadId;
        const menu = document.getElementById('chatContextMenu');
        if (!menu) return;

        menu.classList.remove('hidden');
        
        // Context properties mapping toggle tracking variables safely
        const isPinned = SystemState.threads[threadId]?.pinned || false;
        const pinText = menu.querySelector('#contextPinOption span:not(.material-symbols-rounded)');
        const pinIcon = menu.querySelector('#contextPinOption .material-symbols-rounded');
        
        if (pinText && pinIcon) {
            pinText.textContent = isPinned ? 'Unpin' : 'Pin';
            pinIcon.textContent = isPinned ? 'keep_off' : 'keep';
        }

        // Compute coordinate anchor offsets relative to viewport metrics
        let posX = event.clientX;
        let posY = event.clientY;
        const safetyMargin = 15;

        menu.style.opacity = '0';
        menu.style.left = '0px';
        menu.style.top = '0px';

        setTimeout(() => {
            const menuWidth = menu.offsetWidth;
            const menuHeight = menu.offsetHeight;

            if (posX + menuWidth > window.innerWidth) {
                posX = window.innerWidth - menuWidth - safetyMargin;
            }
            if (posY + menuHeight > window.innerHeight) {
                posY = window.innerHeight - menuHeight - safetyMargin;
            }

            menu.style.left = `${posX}px`;
            menu.style.top = `${posY}px`;
            menu.style.opacity = '1';
        }, 1);

        // Bind contextual analytical manipulation updates exactly once
        if (!menu.getAttribute('data-events-bound')) {
            menu.setAttribute('data-events-bound', 'true');
            
            document.getElementById('contextPinOption').addEventListener('click', () => {
                const tid = SystemState.selectedContextMenuThreadId;
                if (tid && SystemState.threads[tid]) {
                    SystemState.threads[tid].pinned = !SystemState.threads[tid].pinned;
                    persistThreadsToStorage();
                    renderThreadSidebarHistory();
                }
            });

            document.getElementById('contextDeleteOption').addEventListener('click', () => {
                const tid = SystemState.selectedContextMenuThreadId;
                if (tid && SystemState.threads[tid]) {
                    delete SystemState.threads[tid];
                    if (SystemState.activeThreadId === tid) {
                        SystemState.activeThreadId = null;
                        routeWorkspaceView('zeroStateScreen');
                    }
                    persistThreadsToStorage();
                    renderThreadSidebarHistory();
                }
            });
        }
    }

    // ==========================================
    // 6. THREAD FEED POPULATION SEQUENCE
    // ==========================================
    function loadThreadSessionIntoFeed(threadId) {
        SystemState.activeThreadId = threadId;
        renderThreadSidebarHistory();
        routeWorkspaceView('activeChatWorkspaceScreen');

        const feed = document.getElementById('chatMessagesFeedContainer');
        if (!feed) return;
        feed.innerHTML = '';

        const conversation = SystemState.threads[threadId];
        if (!conversation || !conversation.messages) return;

        conversation.messages.forEach(msg => {
            const wrapper = document.createElement('div');
            wrapper.className = `message-row ${msg.sender === 'user' ? 'user-alignment' : 'ai-alignment'}`;
            
            const isUser = msg.sender === 'user';
            const nodeIcon = isUser ? 'person' : 'clinical_notes';
            const nodeTitle = isUser ? 'You' : 'Cortexa AI';
            
            wrapper.innerHTML = `
                <div class="message-bubble-block">
                    <div class="message-meta-header">
                        <span class="material-symbols-rounded system-avatar-icon">${nodeIcon}</span>
                        <div class="sender-identity-label">${nodeTitle}</div>
                    </div>
                    <div class="message-body-payload">${msg.text}</div>
                </div>
            `;
            feed.appendChild(wrapper);
        });

        // Auto attach interactive callbacks inside dynamically calculated layers instantly
        initializeDynamicEmbeddedCalculators(feed);
        scrollViewportToBottom();
    }

    function scrollViewportToBottom() {
        const scroller = document.getElementById('activeChatWorkspaceScreen');
        if (scroller) {
            scroller.scrollTop = scroller.scrollHeight;
        }
    }

    // ==========================================
    // 7. INFERENCE DISPATCH ENGINE (LOCAL KNOWLEDGE OR GROQ)
    // ==========================================
    function dispatchInferenceSequence() {
        const area = document.getElementById('chatInputPayload');
        if (!area || !area.value.trim()) return;

        const rawPrompt = area.value.trim();
        area.value = '';
        area.style.height = 'auto';
        verifySendBufferCapacity();

        // Initialize active thread container matrix securely if blank
        if (!SystemState.activeThreadId) {
            const generatedId = 'thread_live_' + Date.now();
            SystemState.threads[generatedId] = {
                id: generatedId,
                label: rawPrompt.length > 26 ? rawPrompt.substring(0, 24) + '...' : rawPrompt,
                pinned: false,
                messages: []
            };
            SystemState.activeThreadId = generatedId;
        }

        // Push immediate User response query securely
        SystemState.threads[SystemState.activeThreadId].messages.push({
            sender: 'user',
            text: escapeHtml(rawPrompt)
        });

        persistThreadsToStorage();
        loadThreadSessionIntoFeed(SystemState.activeThreadId);

        // Render transient procedural processing indicator layer
        const feed = document.getElementById('chatMessagesFeedContainer');
        const indicator = document.createElement('div');
        indicator.id = 'transientProcessingIndicator';
        indicator.className = 'message-row ai-alignment';
        indicator.innerHTML = `
            <div class="message-bubble-block">
                <div class="message-meta-header">
                    <span class="material-symbols-rounded system-avatar-icon animated-pulse">clinical_notes</span>
                    <div class="sender-identity-label">Cortexa AI</div>
                </div>
                <div class="message-body-payload">
                    <div class="procedural-loading-wrapper">
                        <div class="loading-dot"></div>
                        <div class="loading-dot"></div>
                        <div class="loading-dot"></div>
                    </div>
                </div>
            </div>
        `;
        if (feed) {
            feed.appendChild(indicator);
            scrollViewportToBottom();
        }

        // Parallel resolution logic path routing engine
        setTimeout(() => {
            executeAnalysisPipeline(rawPrompt);
        }, 350);
    }

    function executeAnalysisPipeline(prompt) {
        const cleanQuery = prompt.toLowerCase().trim();
        
        // Remove active rendering spinner element layer instantly
        const indicator = document.getElementById('transientProcessingIndicator');
        if (indicator) indicator.remove();

        // Primary Local Integrated Knowledge Vector Search
        let exactHit = null;
        for (const record of SYSTEM_KNOWLEDGE_POOLS) {
            if (record.title && cleanQuery.includes(record.title.toLowerCase())) {
                exactHit = record;
                break;
            }
            if (record.keywords && Array.isArray(record.keywords)) {
                if (record.keywords.some(k => cleanQuery.includes(k.toLowerCase()))) {
                    exactHit = record;
                    break;
                }
            }
        }

        let finalResponseHTML = "";

        if (exactHit) {
            // High-probability precision asset routing strategy
            if (exactHit.type === 'calc') {
                finalResponseHTML = GroqRenderInterfaceBridge.renderIncomingCalculator(exactHit);
            } else if (exactHit.type === 'condition' || exactHit.type === 'protocol' || exactHit.type === 'emergency' || exactHit.type === 'procedure') {
                finalResponseHTML = GroqRenderInterfaceBridge.renderDynamicMedicalCard(exactHit);
            }
        } else {
            // Secondary Strategy: Attempt fallback Groq Gateway if key matches parameter standards
            if (SystemState.groqKey && SystemState.groqKey.startsWith('gsk_')) {
                executeCloudInferenceRequest(prompt);
                return;
            } else {
                // Generative Fallback Database Aggregator Interface
                finalResponseHTML = compileAlgorithmicSearchFallbackCard(prompt);
            }
        }

        // Commit generated message token array into current session memory matrix
        if (SystemState.activeThreadId && SystemState.threads[SystemState.activeThreadId]) {
            SystemState.threads[SystemState.activeThreadId].messages.push({
                sender: 'ai',
                text: finalResponseHTML
            });
            persistThreadsToStorage();
            loadThreadSessionIntoFeed(SystemState.activeThreadId);
        }
    }

    function compileAlgorithmicSearchFallbackCard(prompt) {
        const queryTerms = prompt.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        const candidates = [];

        SYSTEM_KNOWLEDGE_POOLS.forEach(record => {
            let score = 0;
            const titleStr = (record.title || "").toLowerCase();
            const descStr = (record.description || "").toLowerCase();

            queryTerms.forEach(term => {
                if (titleStr.includes(term)) score += 10;
                if (descStr.includes(term)) score += 3;
                if (record.keywords && Array.isArray(record.keywords)) {
                    record.keywords.forEach(kw => {
                        if (kw.toLowerCase().includes(term)) score += 5;
                    });
                }
            });

            if (score > 0) {
                candidates.push({ record, score });
            }
        });

        // Sorting ranked score matrices descending
        candidates.sort((a, b) => b.score - a.score);

        if (candidates.length > 0) {
            let matchesHTML = `<div class="fallback-aggregated-title">Database cross-reference returned historical insights matching query parameters:</div>`;
            candidates.slice(0, 3).forEach(c => {
                const originLabel = c.record.origin ? c.record.origin.replace('.js', '').toUpperCase() : 'DATABASE';
                matchesHTML += `
                    <div class="library-data-card searchable-asset" data-asset-title="${escapeHtml(c.record.title || '')}">
                        <div class="card-meta-header-row">
                            <div class="asset-identity-title">${escapeHtml(c.record.title || 'Untitled Asset')}</div>
                            <div class="system-badge normal">${originLabel}</div>
                        </div>
                        <p class="asset-description-paragraph">${escapeHtml(c.record.description || 'No descriptive indexing matrix context saved.')}</p>
                        <div class="card-action-footer-panel">
                            <span class="action-link-label">Initialize Asset Reference Protocol</span>
                            <span class="material-symbols-rounded action-arrow-icon">arrow_forward</span>
                        </div>
                    </div>
                `;
            });
            return `<div class="system-card-container">${matchesHTML}</div>`;
        }

        // Hard baseline zero state card return matrix
        return `
            <div class="system-card-container">
                <div class="system-card-header">
                    <div class="system-card-title">
                        <span class="material-symbols-rounded">gavel</span> Zero-State Matrix Query Alert
                    </div>
                    <div class="system-badge critical">Unresolved</div>
                </div>
                <div class="system-text-block">
                    Cortexa was unable to resolve an integrated asset mapping formula for your query. Provide a Groq Cloud Gateway API token inside **Settings** to unlock unstructured natural language data synthesis.
                </div>
            </div>
        `;
    }

    async function executeCloudInferenceRequest(userPrompt) {
        const targetThreadId = SystemState.activeThreadId;
        
        try {
            // Build rich schema context from loaded reference catalogs
            const contextExcerpt = SYSTEM_KNOWLEDGE_POOLS.slice(0, 25).map(x => {
                return `- ASSET: ${x.title || 'Untitled'}. TYPE: ${x.type || 'Standard'}. DETAILS: ${x.description || ''}`;
            }).join('\n');

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SystemState.groqKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "system",
                            content: `You are Cortexa AI, a high-efficiency clinical processing interface. Synthesize data clearly and concisely. Format response with professional, beautiful clean HTML wrappers using existing UI tokens: use '<div class="system-card-container">' for layout wrappers, '<div class="system-card-header">' for sub-headers, and clean formatting tags. Avoid raw markdown headings. Contextual Database Maps Available:\n${contextExcerpt}`
                        },
                        {
                            role: "user",
                            content: userPrompt
                        }
                    ],
                    temperature: 0.2,
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                throw new Error(`Gateway Endpoint HTTP Status Fault: ${response.status}`);
            }

            const payload = await response.json();
            const aiGeneratedText = payload.choices[0]?.message?.content || "No return parameters found inside streaming gateway layer array matrices.";

            if (targetThreadId === SystemState.activeThreadId && SystemState.threads[targetThreadId]) {
                SystemState.threads[targetThreadId].messages.push({
                    sender: 'ai',
                    text: aiGeneratedText
                });
                persistThreadsToStorage();
                loadThreadSessionIntoFeed(targetThreadId);
            }

        } catch (error) {
            console.error("Cloud Inference Stream Error Failure:", error);
            if (targetThreadId === SystemState.activeThreadId && SystemState.threads[targetThreadId]) {
                SystemState.threads[targetThreadId].messages.push({
                    sender: 'ai',
                    text: `<div class="system-card-container">
                        <div class="system-card-header">
                            <div class="system-card-title">
                                <span class="material-symbols-rounded">warning</span> Cloud Integration Failure
                            </div>
                            <div class="system-badge critical">Fault</div>
                        </div>
                        <div class="system-text-block">
                            Failed to complete processing operations via Groq Cloud Bridge. Network response log: <b>${escapeHtml(error.message)}</b>.
                        </div>
                     </div>`
                });
                persistThreadsToStorage();
                loadThreadSessionIntoFeed(targetThreadId);
            }
        }
    }

    // ==========================================
    // 8. LIVE WORKSPACE INDEX SEARCH MATRIX FILTERING
    // ==========================================
    function processHistorySearchQuery(token = "") {
        const targetContainer = document.getElementById('searchWorkspaceResultsGrid');
        if (!targetContainer) return;
        targetContainer.innerHTML = '';

        if (!token) {
            targetContainer.innerHTML = `<div class="library-empty-state-card">Enter terms above to sweep indexed clinical database assets instantly.</div>`;
            return;
        }

        const hits = SYSTEM_KNOWLEDGE_POOLS.filter(item => {
            return (item.title && item.title.toLowerCase().includes(token)) ||
                   (item.description && item.description.toLowerCase().includes(token)) ||
                   (item.keywords && item.keywords.some(kw => kw.toLowerCase().includes(token)));
        });

        if (hits.length === 0) {
            targetContainer.innerHTML = `<div class="library-empty-state-card">No records found matching tracking constraints: "${escapeHtml(token)}"</div>`;
            return;
        }

        hits.forEach(record => {
            const originTag = record.origin ? record.origin.replace('.js', '').toUpperCase() : 'ASSET';
            const card = document.createElement('div');
            card.className = 'library-data-card clickable-asset';
            card.innerHTML = `
                <div class="card-meta-header-row">
                    <div class="asset-identity-title">${escapeHtml(record.title || 'Untitled Asset')}</div>
                    <div class="system-badge normal">${originTag}</div>
                </div>
                <p class="asset-description-paragraph">${escapeHtml(record.description || 'No descriptive index matrix values declared.')}</p>
                <div class="card-action-footer-panel">
                    <span class="action-link-label">Initialize Target Application UI</span>
                    <span class="material-symbols-rounded action-arrow-icon">arrow_forward</span>
                </div>
            `;
            
            card.addEventListener('click', () => {
                executeDirectAssetInjection(record);
            });

            targetContainer.appendChild(card);
        });
    }

    function renderLibraryWorkspaceScreen(token = "") {
        const targetContainer = document.getElementById('libraryWorkspaceGrid');
        if (!targetContainer) return;
        targetContainer.innerHTML = '';

        const subset = SYSTEM_KNOWLEDGE_POOLS.filter(item => {
            if (!token) return true;
            return (item.title && item.title.toLowerCase().includes(token)) ||
                   (item.description && item.description.toLowerCase().includes(token));
        });

        if (subset.length === 0) {
            targetContainer.innerHTML = `<div class="library-empty-state-card">No workspace repository parameters found matching: "${escapeHtml(token)}"</div>`;
            return;
        }

        subset.forEach(record => {
            const originTag = record.origin ? record.origin.replace('.js', '').toUpperCase() : 'CATALOG';
            const card = document.createElement('div');
            card.className = 'library-data-card clickable-asset';
            card.innerHTML = `
                <div class="card-meta-header-row">
                    <div class="asset-identity-title">${escapeHtml(record.title || 'Untitled Asset')}</div>
                    <div class="system-badge normal">${originTag}</div>
                </div>
                <p class="asset-description-paragraph">${escapeHtml(record.description || 'No indexed descriptor values assigned.')}</p>
                <div class="card-action-footer-panel">
                    <span class="action-link-label">Launch Application Interface</span>
                    <span class="material-symbols-rounded action-arrow-icon">arrow_forward</span>
                </div>
            `;

            card.addEventListener('click', () => {
                executeDirectAssetInjection(record);
            });

            targetContainer.appendChild(card);
        });
    }

    function executeDirectAssetInjection(record) {
        if (!SystemState.activeThreadId) {
            const seedId = 'thread_live_' + Date.now();
            SystemState.threads[seedId] = {
                id: seedId,
                label: record.title || "Asset Deployment",
                pinned: false,
                messages: []
            };
            SystemState.activeThreadId = seedId;
        }

        let dynamicHTML = "";
        if (record.type === 'calc') {
            dynamicHTML = GroqRenderInterfaceBridge.renderIncomingCalculator(record);
        } else {
            dynamicHTML = GroqRenderInterfaceBridge.renderDynamicMedicalCard(record);
        }

        SystemState.threads[SystemState.activeThreadId].messages.push({
            sender: 'user',
            text: `Manual deployment requested for asset system handle: "${escapeHtml(record.title)}"`
        });

        SystemState.threads[SystemState.activeThreadId].messages.push({
            sender: 'ai',
            text: dynamicHTML
        });

        persistThreadsToStorage();
        loadThreadSessionIntoFeed(SystemState.activeThreadId);
    }

    // ==========================================
    // 9. REUSABLE SYSTEM CARD COMPILER INTERFACE BRIDGE
    // ==========================================
    window.GroqRenderInterfaceBridge = {
        renderDynamicMedicalCard: function(payload) {
            const labelStr = payload.origin ? payload.origin.replace('.js', '').toUpperCase() : 'INSIGHT';
            
            let dataFieldsHTML = "";
            if (payload.dosage) dataFieldsHTML += `<p class="clinical-attribute-sentence"><b>Standard Dosage Matrix:</b> ${escapeHtml(payload.dosage)}</p>`;
            if (payload.indications) dataFieldsHTML += `<p class="clinical-attribute-sentence"><b>Primary Diagnostic Indications:</b> ${escapeHtml(payload.indications)}</p>`;
            if (payload.contraindications) dataFieldsHTML += `<p class="clinical-attribute-sentence"><b>Absolute Contraindications:</b> ${escapeHtml(payload.contraindications)}</p>`;
            if (payload.steps) {
                dataFieldsHTML += `<div class="procedural-steps-header">Clinical Execution Sequence Mapping:</div><ol class="procedural-ordered-list">`;
                payload.steps.forEach(s => { dataFieldsHTML += `<li>${escapeHtml(s)}</li>`; });
                dataFieldsHTML += `</ol>`;
            }

            return `
                <div class="system-card-container">
                    <div class="system-card-header">
                        <div class="system-card-title">
                            <span class="material-symbols-rounded">medical_information</span> ${escapeHtml(payload.title || 'Integrated Asset Protocol')}
                        </div>
                        <div class="system-badge normal">${labelStr}</div>
                    </div>
                    <div class="system-text-block">
                        <p class="asset-core-summary" style="margin-bottom:12px;">${escapeHtml(payload.description || '')}</p>
                        ${dataFieldsHTML}
                    </div>
                </div>
            `;
        },

        renderIncomingCalculator: function(parsedPayload) {
            try {
                if (!parsedPayload.id) parsedPayload.id = 'calc_ext_' + Date.now();

                if (!window.fluidCalcStates) window.fluidCalcStates = {};
                if (!window.fluidCalcStates[parsedPayload.id]) {
                    window.fluidCalcStates[parsedPayload.id] = {
                        history: [],
                        inputs: {}
                    };
                }

                if (typeof window.renderFluidCalculator === 'function') {
                    return window.renderFluidCalculator(parsedPayload);
                }
                
                // Native Standard Parametric Processing Card Layout Matrix Engine Fallback
                let interactionFieldsHTML = "";
                if (parsedPayload.params && Array.isArray(parsedPayload.params)) {
                    parsedPayload.params.forEach((p, idx) => {
                        interactionFieldsHTML += `
                            <div class="calc-input-group-row">
                                <label class="calc-input-label-element">${escapeHtml(p.name)} (${escapeHtml(p.unit)})</label>
                                <input type="number" 
                                       class="calc-parametric-input-field manual-calc-hook" 
                                       data-param-index="${idx}"
                                       data-param-name="${escapeHtml(p.name)}"
                                       placeholder="${p.default || 0}" 
                                       value="${p.default || ''}">
                            </div>
                        `;
                    });
                }

                return `
                    <div class="system-card-container generic-calculator-asset" data-calc-id="${parsedPayload.id}">
                        <div class="system-card-header">
                            <div class="system-card-title">
                                <span class="material-symbols-rounded">calculate</span> ${escapeHtml(parsedPayload.title || 'Parametric Calculator Evaluation')}
                            </div>
                            <div class="system-badge evaluation">Calculation</div>
                        </div>
                        <div class="system-text-block">
                            <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:14px;">${escapeHtml(parsedPayload.description || '')}</p>
                            <form class="parametric-calculation-form-container" onsubmit="return false;">
                                ${interactionFieldsHTML}
                                <button type="button" class="execute-calculation-submit-btn native-calc-trigger-action-btn" style="margin-top:4px; width:100%;">
                                    Execute Evaluation Matrix Sequence
                                </button>
                            </form>
                            <div class="calculation-runtime-output-displayhidden hidden" style="margin-top:14px; padding-top:12px; border-top:1px dashed var(--border-color);"></div>
                        </div>
                    </div>
                `;
            } catch (e) {
                console.error("Groq Calculator Rendering Error Exception:", e);
                return `<div class="error-card">Failed to initialize dynamic calculation engine.</div>`;
            }
        }
    };

    // ==========================================
    // 10. INTERACTIVE EMBEDDED EVALUATORS ROUTING
    // ==========================================
    function initializeDynamicEmbeddedCalculators(parentScopeContainer) {
        parentScopeContainer.querySelectorAll('.generic-calculator-asset').forEach(calcContainer => {
            const triggerButton = calcContainer.querySelector('.native-calc-trigger-action-btn');
            const outputTerminal = calcContainer.querySelector('.calculation-runtime-output-displayhidden');
            const calculationForm = calcContainer.querySelector('.parametric-calculation-form-container');

            if (!triggerButton || !calculationForm) return;

            triggerButton.addEventListener('click', () => {
                let reportLinesHTML = `<div class="calculated-output-matrix-layer" style="background-color:var(--bg-main); padding:12px; border-radius:10px; border:1px solid var(--border-color);">
                    <div style="font-weight:600; color:var(--text-primary); font-size:0.92rem; margin-bottom:8px;">Evaluation Matrix Aggregation Report:</div>`;
                
                let aggregateSumTotal = 0;
                const activeInputs = calculationForm.querySelectorAll('.manual-calc-hook');

                activeInputs.forEach(inputField => {
                    const fieldLabel = inputField.getAttribute('data-param-name') || 'Variable Parameter';
                    const numericValue = parseFloat(inputField.value) || 0;
                    aggregateSumTotal += numericValue;

                    reportLinesHTML += `<p style="font-size:0.86rem; margin-bottom:4px; color:var(--text-secondary);">• <b>${escapeHtml(fieldLabel)}:</b> ${numericValue}</p>`;
                });

                reportLinesHTML += `
                    <div style="margin-top:10px; color:var(--accent-blue); font-weight:600; font-size:1.05rem;">Processing Execution Complete</div>
                    <p style="font-size:0.86rem; color:var(--text-secondary); margin-top:2px;">
                        Dynamic aggregate metric parameter evaluation matrix total value: <b>${aggregateSumTotal}</b>
                    </p>
                </div>`;

                if (outputTerminal) {
                    outputTerminal.innerHTML = reportLinesHTML;
                    outputTerminal.classList.remove('hidden');
                    scrollViewportToBottom();
                }
            });
        });

        // Loop execution hooks for fallback match handling links inside search arrays
        parentScopeContainer.querySelectorAll('.fallback-aggregated-title + .library-data-card').forEach(searchCard => {
            searchCard.addEventListener('click', () => {
                const targetAssetTitle = searchCard.getAttribute('data-asset-title');
                if (!targetAssetTitle) return;

                const coreAssetRecord = SYSTEM_KNOWLEDGE_POOLS.find(x => x.title === targetAssetTitle);
                if (coreAssetRecord) {
                    executeDirectAssetInjection(coreAssetRecord);
                }
            });
        });
    }

    // Utility text encoder block prevents HTML manipulation attacks inside user strings
    function escapeHtml(string) {
        if (!string) return '';
        return String(string)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Professional iOS PWA Keyboard Redraw Realignment Fix
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isStandalone = window.navigator.standalone === true;

            if (isIOS && isStandalone) {
                if (window.visualViewport.height >= window.innerHeight) {
                    setTimeout(() => {
                        window.scrollTo(0, 0);
                        document.body.style.display = 'none';
                        document.body.offsetHeight; // Forces engine layout flush recalculation
                        document.body.style.display = '';
                    }, 30);
                }
            }
        });
    }

    window.addEventListener('DOMContentLoaded', initializeCortexaSystem);
})();
