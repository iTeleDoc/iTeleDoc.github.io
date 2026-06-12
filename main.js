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

        // Allow the stylesheet layout matrix to govern viewport adjustments.
        const desktopView = window.matchMedia('(min-width: 1025px)');
        if (desktopView.matches) {
            document.getElementById('sidebar')?.classList.add('collapsed');
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
            
            // Extra Safety Check: If the parsed object has no active keys, build a seed
            if (Object.keys(SystemState.threads).length === 0) {
                generateSeedConversation();
            }
        } else {
            // If local cache is totally blank, run your explicit seed creator
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
        
        // Hide all structural workspace screens instantly
        document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById('sidebarSearchNavBtn').classList.remove('active');
        document.getElementById('libraryNavBtn').classList.remove('active');
        document.getElementById('settingsToggleBtn').classList.remove('active');

        const activePanel = document.getElementById(panelId);
        if (activePanel) activePanel.classList.remove('hidden');

        // Manage standard global chat text input tray visibility matrix
        const deck = document.getElementById('globalInputDeck');
        if (panelId === 'searchWorkspaceScreen' || panelId === 'libraryWorkspaceScreen' || panelId === 'settingsWorkspaceScreen') {
            deck.classList.add('hidden');
        } else {
            deck.classList.remove('hidden');
        }

        // Fire rendering triggers or update navigation layouts
        if (panelId === 'searchWorkspaceScreen') {
            document.getElementById('sidebarSearchNavBtn').classList.add('active');
            processHistorySearchQuery();
        } else if (panelId === 'libraryWorkspaceScreen') {
            document.getElementById('libraryNavBtn').classList.add('active');
            renderLibraryWorkspaceScreen();
        } else if (panelId === 'settingsWorkspaceScreen') {
            document.getElementById('settingsToggleBtn').classList.add('active');
            // Seed current runtime key into target field element
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
    
        // Helper tool function to cleanly hide the mobile drawer
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
    
        // Safe execution wrapper prevents layout crashes if HTML changes
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
            if (confirm('Are you sure you want to permanently wipe all sessions?')) {
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
    
        // Setup direct integrated page workspace router layout
        document.getElementById('settingsToggleBtn').addEventListener('click', () => {
            routeWorkspaceView('settingsWorkspaceScreen');
            closeMobileSidebarIfOpen(); 
        });
    
        // Auto-save gateway credential strings asynchronously on keyup/change input updates
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
    
        // Core DOM Triggers hoisted to top to prevent runtime reference errors
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
                    
                    // Sync up: if the sidebar closes via history clicks, remove .is-open to show 2 lines again
                    if (collapseSidebarBtn) collapseSidebarBtn.classList.remove('is-open');
                    if (menuToggleBtn) menuToggleBtn.classList.remove('is-open');
                }
            });
        }
        
        // Sidebar toggle click logic
        if (collapseSidebarBtn) {
            collapseSidebarBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                collapseSidebarBtn.classList.toggle('is-open'); // Toggles open state (merges into 1 line)
            });
        }

        // Drawer Menu toggle click logic (Synchronized feature match)
        if (menuToggleBtn) {
            menuToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                menuToggleBtn.classList.toggle('is-open'); // Toggles open state (merges into 1 line)
            });
        }

        // ==========================================================================
        // NATIVE TOUCH GESTURE SLIDE DISPATCH ENGINE
        // ==========================================================================
        (function initSidebarSwipeMechanics() {
            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;

            const SWIPE_THRESHOLD_X = 50;  // Minimum swipe distance in pixels
            const SWIPE_CONSTRAINT_Y = 40; // Max allowed vertical shift (prevents conflict with scrolling)
            const EDGE_BOUNDARY_X = 50;    // Swipe right must start within 50px of left screen edge

            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');

            if (!sidebar || !overlay) return;

            document.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].clientX;
                touchStartY = e.changedTouches[0].clientY;
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].clientX;
                touchEndY = e.changedTouches[0].clientY;
                handleSwipeResolution();
            }, { passive: true });

            function handleSwipeResolution() {
                const deltaX = touchEndX - touchStartX;
                const deltaY = Math.abs(touchEndY - touchStartY);

                // If vertical scrolling is prominent, cancel sidebar actions
                if (deltaY > SWIPE_CONSTRAINT_Y) return;

                if (!window.matchMedia('(max-width: 1024px)').matches) return;

                const isOpen = sidebar.classList.contains('mobile-open');

                // SWIPE RIGHT: Opens the sidebar if swipe initiated near the left margin
                if (deltaX > SWIPE_THRESHOLD_X && !isOpen) {
                    if (touchStartX <= EDGE_BOUNDARY_X) {
                        openDrawer();
                    }
                } 
                // SWIPE LEFT: Closes the sidebar if swiped anywhere on screen while open
                else if (deltaX < -SWIPE_THRESHOLD_X && isOpen) {
                    closeDrawer();
                }
            }

            function openDrawer() {
                sidebar.classList.add('mobile-open');
                overlay.classList.add('active');
                
                // Keep the structural action buttons synchronized with open state geometries
                const collapseBtn = document.getElementById('collapseSidebarBtn');
                const menuBtn = document.getElementById('menuToggleBtn');
                if (collapseBtn) collapseBtn.classList.add('is-open');
                if (menuBtn) menuBtn.classList.add('is-open');
            }

            function closeDrawer() {
                sidebar.classList.remove('mobile-open');
                overlay.classList.remove('active');
                
                const collapseBtn = document.getElementById('collapseSidebarBtn');
                const menuBtn = document.getElementById('menuToggleBtn');
                if (collapseBtn) collapseBtn.classList.remove('is-open');
                if (menuBtn) menuBtn.classList.remove('is-open');
            }
        })();

    }

    function verifySendBufferCapacity() {
        const area = document.getElementById('chatInputPayload');
        if (!area) return;
        const val = area.value.trim();
        const submitBtn = document.getElementById('submitPromptBtn');
        if (submitBtn) submitBtn.disabled = (val.length === 0);
    }

    // ==========================================
    // 5. INTUATIVE INFERENCE MATCHING ENGINE
    // ==========================================
    async function dispatchInferenceSequence() {
        const area = document.getElementById('chatInputPayload');
        if (!area) return;
        const query = area.value.trim();
        if (!query) return;

        area.value = ''; area.style.height = 'auto'; verifySendBufferCapacity();

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
        persistThreadsToStorage(); renderThreadSidebarHistory();
        routeWorkspaceView('chatFeedScreen'); renderActiveChatMessageStreams();

        const stream = document.getElementById('messageStreamTarget');
        const loader = document.createElement('div');
        loader.className = 'chat-row';
        loader.innerHTML = `
            <div class="avatar-container ai"><span class="material-symbols-rounded">network_intelligence</span></div>
            <div class="bubble-content">
                <div class="typing-pulse-container">
                    <div class="pulse-dot"></div><div class="pulse-dot"></div><div class="pulse-dot"></div>
                </div>
            </div>
        `;
        stream.appendChild(loader); scrollViewportToBottom();

        try {
            const systemResolutionOutput = await processClinicalInferenceResolution(query);
            if (stream.contains(loader)) stream.removeChild(loader);

            SystemState.threads[SystemState.activeThreadId].messages.push({ sender: 'ai', text: systemResolutionOutput });
            persistThreadsToStorage(); renderActiveChatMessageStreams();
        } catch (err) {
            if (stream.contains(loader)) stream.removeChild(loader);
            SystemState.threads[SystemState.activeThreadId].messages.push({ 
                sender: 'ai', 
                text: `<div class="clinical-card-container"><h4 style="color:var(--clinical-alert)">Gateway Endpoint Failure</h4><p style="margin-top:8px;">${err.message}</p></div>` 
            });
            persistThreadsToStorage(); renderActiveChatMessageStreams();
        }
    }

    async function processClinicalInferenceResolution(promptInput) {
        const cleanQuery = promptInput.toLowerCase();

        // Structural matching pass over comprehensive file objects
        const match = SYSTEM_KNOWLEDGE_POOLS.find(item => {
            const titleMatch = item.title && cleanQuery.includes(item.title.toLowerCase());
            const idMatch = item.id && cleanQuery.includes(item.id.toLowerCase());
            const catMatch = item.category && cleanQuery.includes(item.category.toLowerCase());
            return titleMatch || idMatch || catMatch;
        });

        if (match) {
            if (match.type === 'calc') {
                return renderInteractiveCalculationFormCard(match, `chat_${match.id || 'gen'}`);
            } else {
                return renderFormattedStaticCard(match);
            }
        }

        // Contextual Fallbacks for structural algorithms
        if (cleanQuery.includes('apgar') || cleanQuery.includes('neonatal')) {
            const apgarModel = SYSTEM_KNOWLEDGE_POOLS.find(x => x.id === 'calc_apgar') || window.CALCULATORS_DB?.[0];
            if (apgarModel) return renderInteractiveCalculationFormCard(apgarModel, 'chat_apgar_fallback');
        }
        if (cleanQuery.includes('parkland') || cleanQuery.includes('burn')) {
            const parklandModel = window.FLUIDS_DB?.[0] || { id: 'calc_parkland', title: 'Parkland Engine', category: 'Resuscitation', fields: [{id:'weight', label:'Weight', type:'number'}, {id:'tbsa', label:'% TBSA', type:'number'}] };
            return renderInteractiveCalculationFormCard(parklandModel, 'chat_parkland_fallback');
        }

        if (!SystemState.groqKey) {
            return `<div class="clinical-card-container">
                <div class="clinical-card-header"><div class="clinical-card-title"><span class="material-symbols-rounded" style="color:var(--clinical-warning)">cloud_off</span><span>Groq API Not Integrated</span></div></div>
                <p class="clinical-text-block">No entry exists in local database. Link your custom Groq API keys inside <a href="#" onclick="document.getElementById('settingsToggleBtn').click(); return false;" style="color: #5c6bc0; text-decoration: none;"><b>Settings</b></a> to initialize your search.</p>
            </div>`;
        }

        return await dispatchGroqCloudQuery(promptInput);
    }

    async function dispatchGroqCloudQuery(prompt) {
        const systemDirectives = `You are the core expert intelligence pipeline of Cortexa AI.
You must analyze user inputs and output highly detailed clinical guidance formatted exclusively inside structured HTML blocks using our UI design tokens.

If the prompt describes or requests a clinical calculation, score, index tracking metrics, or parameter calculation:
You MUST construct a dynamic frontend card component using this exact inline structure blueprint directly:
<div class="clinical-card-container">
    <div class="clinical-card-header">
        <div class="clinical-card-title"><span class="material-symbols-rounded">calculate</span> \${CALCULATOR_TITLE}</div>
        <div class="clinical-badge warning">Dynamic Core Engine</div>
    </div>
    <p style="margin-bottom:12px; font-size:0.88rem; color:var(--text-secondary);">\${CALCULATOR_DESCRIPTION_OR_FORMULA}</p>
    <div class="inline-calc-form">
        <div class="inline-form-row">
            <label>\${INPUT_LABEL}</label>
            <input type="number" class="dynamic-custom-field" data-label="\${INPUT_LABEL}" placeholder="Enter values...">
        </div>
        <button class="inline-calc-submit-btn" onclick="evaluateDynamicCloudCalculator(this)">Execute Calculation Matrix</button>
        <div class="dynamic-calc-result-target hidden" style="margin-top:14px; border-top:1px solid var(--border-color); padding-top:12px;"></div>
    </div>
</div>

For clinical data lookups, return data utilizing our classic high-grade structured visual blueprint layout:
<div class="clinical-card-container">
    <div class="clinical-card-header">
        <div class="clinical-card-title"><span class="material-symbols-rounded">clinical_notes</span> \${TOPIC_HEADING}</div>
        <div class="clinical-badge normal">Cloud Response</div>
    </div>
    <div class="clinical-section-block">
        <div class="clinical-section-label">Clinical Synthesis Response Matrix</div>
        <div class="clinical-text-block">\${DETAILED_HTML_MARKUP_CONTENT}</div>
    </div>
</div>`;

        const serverResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SystemState.groqKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemDirectives },
                    { role: "user", content: prompt }
                ],
                temperature: 0.15
            })
        });

        if (!serverResponse.ok) {
            const errorPayload = await serverResponse.json();
            throw new Error(errorPayload.error?.message || "Server operational rejection.");
        }

        const completionResult = await serverResponse.json();
        return completionResult.choices[0].message.content;
    }

    // ==========================================
    // 6. ADAPTIVE DOM CARD RENDERING BLOCKS
    // ==========================================
    function renderFormattedStaticCard(node) {
        let title = node.title || "Clinical Protocol Module";
        let category = node.category || "Database Log";
        let coreContent = '';

        if (node.desc) coreContent += `<p style="font-weight:500; margin-bottom:12px;">${node.desc}</p>`;
        
        if (node.steps && Array.isArray(node.steps)) {
            coreContent += `<div style="margin-bottom:10px; font-weight:600; font-size:0.8rem; text-transform:uppercase; color:var(--text-secondary);">Procedural Sequence Steps</div>`;
            coreContent += `<ol style="padding-left:20px; margin-bottom:14px; display:flex; flex-direction:column; gap:6px;">`;
            node.steps.forEach(st => { coreContent += `<li>${st}</li>`; });
            coreContent += `</ol>`;
        }

        if (node.pearls) {
            coreContent += `<div style="background:rgba(66,133,244,0.08); border-left:3px solid var(--accent-blue); padding:12px; border-radius:0 8px 8px 0; font-size:0.9rem;">
                <b>Clinical Pearl Tracking Vector:</b> ${node.pearls}
            </div>`;
        }

        if (node.data) {
            if(node.data.indication) coreContent += `<p style="margin-bottom:8px;"><b>Indication Profile:</b> ${node.data.indication}</p>`;
            if(node.data.dose) coreContent += `<p style="margin-bottom:8px;"><b>Dosing Guidelines Matrix:</b> ${node.data.dose}</p>`;
            if(node.data.mechanism) coreContent += `<p style="margin-bottom:8px;"><b>Mechanism Of Action:</b> ${node.data.mechanism}</p>`;
            if(node.data.clinicalTip) coreContent += `<p style="margin-top:10px; padding:10px; background:rgba(242,139,130,0.08); border-radius:6px;"><b>High-Alert Warning Rule:</b> ${node.data.clinicalTip}</p>`;
        }

        if (!coreContent && node.content) coreContent = node.content;

        const isDrug = node.id?.startsWith('drug_') || node.origin === 'drugs.js';
        const uniquePrefixId = `static_${node.id || 'gen'}_${Date.now()}`;

        // Single implementation of the multi-factor calculator engine
        window[`recalc_drug_${uniquePrefixId}`] = function() {
            const w = parseFloat(document.getElementById(`${uniquePrefixId}_metric_weight`)?.value) || 0;
            const liveResultBox = document.getElementById(`${uniquePrefixId}_live_calculation_target`);
            const counterBadge = document.getElementById(`${uniquePrefixId}_counter_badge`);
            if (!liveResultBox) return;

            if (w <= 0) {
                liveResultBox.innerHTML = '';
                liveResultBox.classList.add('hidden');
                return;
            }

            const checkedBoxes = document.querySelectorAll(`.${uniquePrefixId}_risk_cb:checked`);
            const activeCount = checkedBoxes.length;
            
            if (counterBadge) {
                counterBadge.textContent = `${activeCount} Active`;
                if(activeCount === 0) { counterBadge.classList.add('zero'); } 
                else { counterBadge.classList.remove('zero'); }
            }

            let doseMultiplier = 1.0;
            let riskAlertsHTML = "";

            checkedBoxes.forEach(cb => {
                if (cb.value === 'renal') {
                    doseMultiplier *= 0.50;
                    riskAlertsHTML += `<div style="color:#ea4335; margin-top:4px;"><b>⚠ Severe Renal Impairment:</b> Clearances diminished. Reduce dose or prolong administration intervals.</div>`;
                }
                if (cb.value === 'hepatic') {
                    doseMultiplier *= 0.75;
                    riskAlertsHTML += `<div style="color:#ea4335; margin-top:4px;"><b>⚠ Hepatic Insufficiency:</b> High threat of structural compound accumulation. Monitor function panels.</div>`;
                }
                if (cb.value === 'shock') {
                    riskAlertsHTML += `<div style="color:#ea4335; margin-top:4px;"><b>⚠ Decompensated Shock:</b> Restricted systemic perfusion. Central access line optimization recommended.</div>`;
                }
                if (cb.value === 'geriatric') {
                    doseMultiplier *= 0.80;
                    riskAlertsHTML += `<div style="color:#fbbc04; margin-top:4px;"><b>⚠ Geriatric Fragility:</b> High baseline neurological/organ sensitivity. Initiate low titration boundaries.</div>`;
                }
            });

            let computedText = "";

            if (node.id === 'drug_hrig') {
                let adjustedDose = (20 * w) * doseMultiplier;
                computedText = `• <b>Live HRIG Target Dose:</b> <b>${adjustedDose.toLocaleString(undefined, {maximumFractionDigits: 1})} IU</b> total volume calculated. ${(doseMultiplier < 1) ? `<span style="color:#ea4335;">(Mathematically downscaled for chosen metabolic risks by ${((1 - doseMultiplier) * 100).toFixed(0)}%)</span>` : ''}`;
            } else if (node.id === 'drug_epinephrine') {
                let lowBound = Array.from(checkedBoxes).some(c => c.value === 'shock') ? 0.15 * w * doseMultiplier : 0.05 * w * doseMultiplier;
                let highBound = 2.0 * w * doseMultiplier;
                computedText = `• <b>Live Epinephrine Infusion:</b> <b>${lowBound.toFixed(2)} to ${highBound.toFixed(2)} mcg/min</b> operational limits.`;
            } else {
                computedText = `• <b>Live Parameters Mapped:</b> Mass vector calculated at ${w} kg. Current systemic dose modification parameter: <b>x${doseMultiplier.toFixed(2)}</b>.`;
            }

            liveResultBox.innerHTML = `
                <div style="background: rgba(52, 168, 83, 0.08); border-left: 3px solid var(--clinical-success); padding: 12px; border-radius: 6px; font-size: 0.88rem; color: var(--text-primary); line-height: 1.4;">
                    <div style="font-weight:700; color:var(--clinical-success); margin-bottom:4px; text-transform:uppercase; font-size:0.75rem;">Risk-Adjusted Target Output</div>
                    <div style="margin-bottom:4px;">${computedText}</div>
                    ${riskAlertsHTML ? `<div style="margin-top:8px; padding-top:6px; border-top:1px dashed rgba(234,67,53,0.15); font-size:0.82rem;">${riskAlertsHTML}</div>` : ''}
                </div>
            `;
            liveResultBox.classList.remove('hidden');

            const parentAccordionLayer = liveResultBox.closest('.accordion-body-expansion-layer');
            if (parentAccordionLayer) {
                parentAccordionLayer.style.maxHeight = (parentAccordionLayer.scrollHeight + 100) + 'px';
            }
        };

        return `
            <div class="clinical-card-container">
                <div class="clinical-card-header">
                    <div class="clinical-card-title"><span class="material-symbols-rounded" style="color:var(--accent-blue)">verified_user</span> <span>${escapeHTMLString(title)}</span></div>
                    <div class="clinical-badge normal">${escapeHTMLString(category)}</div>
                </div>
                ${isDrug ? `
                <div class="patient-metrics-engine-block">
                    <div class="inline-form-row">
                        <label>Patient Gender</label>
                        <select id="${uniquePrefixId}_metric_gender">
                            <option value="unspecified">Unspecified</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div class="inline-form-row">
                        <label>Patient Age (yrs)</label>
                        <input type="number" id="${uniquePrefixId}_metric_age" placeholder="e.g., 45">
                    </div>
                    <div class="inline-form-row">
                        <label>Patient Weight (kg)</label>
                        <input type="number" id="${uniquePrefixId}_metric_weight" placeholder="e.g., 70" oninput="window['recalc_drug_${uniquePrefixId}']()">
                    </div>
                </div>
                
                <div class="risk-engine-dropdown-container">
                    <div class="risk-engine-summary-header" onclick="const contentPanel = this.nextElementSibling; contentPanel.style.display = (contentPanel.style.display === 'none' || !contentPanel.style.display) ? 'grid' : 'none'; const ly = this.closest('.accordion-body-expansion-layer'); if(ly){ly.style.maxHeight = (ly.scrollHeight + 200)+'px';}">
                        <div class="risk-engine-title-group">
                            <span class="material-symbols-rounded" style="font-size:1.1rem;">shield_with_heart</span>
                            <span>Physiological Risk Profile</span>
                        </div>
                        <div id="${uniquePrefixId}_counter_badge" class="risk-active-counter-badge zero">0 Active</div>
                    </div>
                    <div class="risk-engine-dropdown-content" style="display:none;">
                        <label class="risk-matrix-option">
                            <input type="checkbox" class="${uniquePrefixId}_risk_cb" value="renal" onchange="window['recalc_drug_${uniquePrefixId}']()">
                            <div>Severe Renal Impairment<span class="risk-factor-coefficient-tag">Modifies clearing kinetics (Dose x0.50)</span></div>
                        </label>
                        <label class="risk-matrix-option">
                            <input type="checkbox" class="${uniquePrefixId}_risk_cb" value="hepatic" onchange="window['recalc_drug_${uniquePrefixId}']()">
                            <div>Hepatic Insufficiency<span class="risk-factor-coefficient-tag">Compromised liver paths (Dose x0.75)</span></div>
                        </label>
                        <label class="risk-checkbox-wrapper risk-matrix-option">
                            <input type="checkbox" class="${uniquePrefixId}_risk_cb" value="shock" onchange="window['recalc_drug_${uniquePrefixId}']()">
                            <div>Decompensated Shock State<span class="risk-factor-coefficient-tag">Restructures alpha titration floor</span></div>
                        </label>
                        <label class="risk-matrix-option">
                            <input type="checkbox" class="${uniquePrefixId}_risk_cb" value="geriatric" onchange="window['recalc_drug_${uniquePrefixId}']()">
                            <div>Geriatric Fragility Profile<span class="risk-factor-coefficient-tag">Tissue hyper-sensitivity (Dose x0.80)</span></div>
                        </label>
                    </div>
                </div>
                <div id="${uniquePrefixId}_live_calculation_target" class="hidden" style="margin-bottom:12px;"></div>
                ` : ''}
                <div class="clinical-text-block">${coreContent}</div>
            </div>
        `;
    }

    function renderInteractiveCalculationFormCard(model, uniquePrefixId) {
        if (!model || !model.fields) return `<div class="error-card">Calculator configuration breakdown.</div>`;

        let fieldsHTML = '';
        
        const isDrugOrFluid = model.id?.startsWith('drug_') || 
                                model.id?.startsWith('calc_') ||
                                model.origin === 'drugs.js' || 
                                model.origin === 'fluids.js' ||
                                model.type === 'calculator';

        // Local live runtime updates to handle inner counter interactions safely
        window[`update_interactive_counter_${uniquePrefixId}`] = function() {
            const countBadge = document.getElementById(`${uniquePrefixId}_counter_badge`);
            if(countBadge) {
                const totalActive = document.querySelectorAll(`.${uniquePrefixId}_risk_cb:checked`).length;
                countBadge.textContent = `${totalActive} Active`;
                if(totalActive === 0) { countBadge.classList.add('zero'); }
                else { countBadge.classList.remove('zero'); }
            }
        };

        if (isDrugOrFluid) {
            fieldsHTML += `
                <div class="patient-metrics-engine-block">
                    <div class="inline-form-row">
                        <label>Patient Gender</label>
                        <select id="${uniquePrefixId}_metric_gender">
                            <option value="unspecified">Unspecified</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div class="inline-form-row">
                        <label>Patient Age (yrs)</label>
                        <input type="number" id="${uniquePrefixId}_metric_age" placeholder="e.g., 45" min="0" max="125">
                    </div>
                    <div class="inline-form-row">
                        <label>Patient Weight (kg)</label>
                        <input type="number" id="${uniquePrefixId}_metric_weight" placeholder="e.g., 70" min="0" max="400" 
                        oninput="const targetFld = document.getElementById('${uniquePrefixId}_field_weight'); if(targetFld) { targetFld.value = this.value; }">
                    </div>
                </div>
                
                <div class="risk-engine-dropdown-container">
                    <div class="risk-engine-summary-header" onclick="const contentPanel = this.nextElementSibling; contentPanel.style.display = (contentPanel.style.display === 'none' || !contentPanel.style.display) ? 'grid' : 'none'; const ly = this.closest('.accordion-body-expansion-layer'); if(ly){ly.style.maxHeight = (ly.scrollHeight + 200)+'px';}">
                        <div class="risk-engine-title-group">
                            <span class="material-symbols-rounded" style="font-size:1.1rem;">shield_with_heart</span>
                            <span>Physiological Risk Profile</span>
                        </div>
                        <div id="${uniquePrefixId}_counter_badge" class="risk-active-counter-badge zero">0 Active</div>
                    </div>
                    <div class="risk-engine-dropdown-content" style="display:none;">
                        <label class="risk-matrix-option">
                            <input type="checkbox" class="${uniquePrefixId}_risk_cb" value="renal" onchange="window['update_interactive_counter_${uniquePrefixId}']()">
                            <div>Severe Renal Impairment<span class="risk-factor-coefficient-tag">Modifies clearing kinetics (Dose x0.50)</span></div>
                        </label>
                        <label class="risk-matrix-option">
                            <input type="checkbox" class="${uniquePrefixId}_risk_cb" value="hepatic" onchange="window['update_interactive_counter_${uniquePrefixId}']()">
                            <div>Hepatic Insufficiency<span class="risk-factor-coefficient-tag">Compromised liver paths (Dose x0.75)</span></div>
                        </label>
                        <label class="risk-matrix-option">
                            <input type="checkbox" class="${uniquePrefixId}_risk_cb" value="shock" onchange="window['update_interactive_counter_${uniquePrefixId}']()">
                            <div>Decompensated Shock State<span class="risk-factor-coefficient-tag">Modifies target fluid rates (Rate x1.25)</span></div>
                        </label>
                        <label class="risk-matrix-option">
                            <input type="checkbox" class="${uniquePrefixId}_risk_cb" value="geriatric" onchange="window['update_interactive_counter_${uniquePrefixId}']()">
                            <div>Geriatric Fragility Profile<span class="risk-factor-coefficient-tag">Tissue hyper-sensitivity (Dose x0.80)</span></div>
                        </label>
                    </div>
                </div>
            `;
        }

        model.fields.forEach((f, idx) => {
            const inputId = `${uniquePrefixId}_field_${f.id || idx}`;
            if (f.type === 'select') {
                let opts = '';
                const baseOptions = f.options || [];
                baseOptions.forEach(o => {
                    if (typeof o === 'object' && o.v !== undefined) {
                        opts += `<option value="${o.v}">${o.l}</option>`;
                    } else {
                        opts += `<option value="${o}">${o}</option>`;
                    }
                });
                fieldsHTML += `
                    <div class="inline-form-row">
                        <label>${f.label}</label>
                        <select id="${inputId}" data-param="${f.id || idx}">${opts}</select>
                    </div>
                `;
            } else {
                const isWeightField = f.id === 'weight';
                fieldsHTML += `
                    <div class="inline-form-row">
                        <label>${f.label}</label>
                        <input type="number" id="${inputId}" data-param="${f.id || idx}" placeholder="${f.placeholder || 'Enter value...'}" 
                        ${(isDrugOrFluid && isWeightField) ? `oninput="document.getElementById('${uniquePrefixId}_metric_weight').value = this.value"` : ''}>
                    </div>
                `;
            }
        });

        const callbackStorageKey = `cb_${uniquePrefixId}`;
        window[callbackStorageKey] = function(btnElement) {
            const params = {};
            const parentForm = btnElement.parentElement;
            parentForm.querySelectorAll('input[data-param], select[data-param]').forEach(element => {
                const paramKey = element.getAttribute('data-param');
                if (paramKey) params[paramKey] = element.value;
            });

            if (isDrugOrFluid) {
                const activeRisks = [];
                document.querySelectorAll(`.${uniquePrefixId}_risk_cb:checked`).forEach(cb => {
                    activeRisks.push(cb.value);
                });

                params.patientMetrics = {
                    gender: document.getElementById(`${uniquePrefixId}_metric_gender`)?.value,
                    age: parseFloat(document.getElementById(`${uniquePrefixId}_metric_age`)?.value) || null,
                    weight: parseFloat(document.getElementById(`${uniquePrefixId}_metric_weight`)?.value) || null,
                    riskFactors: activeRisks
                };
                
                if (params.weight === undefined && params.patientMetrics.weight) {
                    params.weight = params.patientMetrics.weight;
                }
            }

            let finalReportMarkup = '';
            
            // Execute interactive calculation calculations with math modifiers baked in
            if (typeof model.execute === 'function') {
                // Intercept execution payload parameters and scale dynamically depending on risks
                let calculationCoefficient = 1.0;
                let fluidCoefficient = 1.0;
                
                if (params.patientMetrics?.riskFactors) {
                    if (params.patientMetrics.riskFactors.includes('renal')) calculationCoefficient *= 0.50;
                    if (params.patientMetrics.riskFactors.includes('hepatic')) calculationCoefficient *= 0.75;
                    if (params.patientMetrics.riskFactors.includes('geriatric')) calculationCoefficient *= 0.80;
                    if (params.patientMetrics.riskFactors.includes('shock')) fluidCoefficient *= 1.25; // Accelerate fluids in shock profiles
                }

                const res = model.execute(params);
                
                // If model returns a plain number string value, slice it and recalculate parameters dynamically
                let valueStringToPrint = res.value;
                if (isDrugOrFluid && calculationCoefficient !== 1.0 && !isNaN(parseFloat(valueStringToPrint))) {
                    const alteredNumericValue = parseFloat(valueStringToPrint) * calculationCoefficient;
                    valueStringToPrint = `${alteredNumericValue.toFixed(1)} <span style="font-size:0.85rem; color:#ea4335;">(Risk-Adjusted from ${parseFloat(res.value).toFixed(1)})</span>`;
                } else if (model.id?.includes('parkland') && fluidCoefficient !== 1.0 && !isNaN(parseFloat(valueStringToPrint))) {
                    const alteredFluidValue = parseFloat(valueStringToPrint) * fluidCoefficient;
                    valueStringToPrint = `${alteredFluidValue.toFixed(0)} mL <span style="font-size:0.85rem; color:#ea4335;">(Shock Titration Adjusted)</span>`;
                }

                finalReportMarkup = `
                    <div style="margin-top:12px; border-top:1px solid var(--border-color); padding-top:12px;">
                        <div class="clinical-section-label">Computed Result Metric</div>
                        <div class="clinical-section-value" style="color:var(--accent-blue); font-size:1.5rem; font-weight:600; margin-bottom:8px;">${valueStringToPrint}</div>
                        <p style="font-size:0.9rem; margin-bottom:6px;"><b>Interpretation:</b> ${res.interpretation}</p>
                        <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:4px;"><b>Management Tracking:</b> ${res.management}</p>
                    </div>
                `;
            } else if (typeof model.evaluate === 'function') {
                finalReportMarkup = `<div style="margin-top:12px; border-top:1px solid var(--border-color); padding-top:12px;">${model.evaluate(params)}</div>`;
            } else {
                finalReportMarkup = `<div style="color:var(--clinical-warning); font-size:0.88rem; margin-top:10px;">Calculator compilation logic error. Vector routine mapping failure.</div>`;
            }

            const outContainer = parentForm.parentElement.querySelector('.calc-results-render-output');
            if (outContainer) {
                outContainer.innerHTML = finalReportMarkup;
                outContainer.classList.remove('hidden');
                scrollViewportToBottom();

                // Dynamic fix: Track Knowledge Base parent accordion layers and recalculate absolute container dimensions dynamically
                const parentAccordionLayer = parentForm.closest('.accordion-body-expansion-layer');
                if (parentAccordionLayer) {
                    parentAccordionLayer.style.maxHeight = (parentAccordionLayer.scrollHeight + 350) + 'px';
                }
            }
        };

        return `
            <div class="clinical-card-container">
                <div class="clinical-card-header">
                    <div class="clinical-card-title"><span class="material-symbols-rounded" style="color:var(--clinical-warning)">calculate</span> <span>${escapeHTMLString(model.title || 'Calculator Engine')}</span></div>
                    <div class="clinical-badge warning">${escapeHTMLString(model.category || 'Metric Evaluation')}</div>
                </div>
                <div class="inline-calc-form">
                    ${fieldsHTML}
                    <button class="inline-calc-submit-btn" onclick="window['${callbackStorageKey}'](this)">Execute Calculation Matrix</button>
                </div>
                <div class="calc-results-render-output hidden"></div>
            </div>
        `;
    }

    function renderActiveChatMessageStreams() {
        const stream = document.getElementById('messageStreamTarget');
        if (!stream || !SystemState.activeThreadId || !SystemState.threads[SystemState.activeThreadId] || !SystemState.threads[SystemState.activeThreadId].messages.length) return;
    
        let trackingHTML = '';
        const messages = SystemState.threads[SystemState.activeThreadId].messages;
    
        // Identify the last user message so we only enable 'Edit' for the final prompt
        let lastUserIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender === 'user') {
                lastUserIndex = i;
                break;
                }
            }
    
        messages.forEach((msg, idx) => {
            if (msg.sender === 'user') {
                const isLastUserMsg = (idx === lastUserIndex);
                const editedIndicator = msg.isEdited ? `<span class="edited-tag"></span>` : '';
                
                trackingHTML += `
                    <div class="chat-row user-row" id="msg-row-${idx}" data-idx="${idx}">
                        <div class="user-message-wrapper">
                            <div class="bubble-content touch-target-bubble">${escapeHTMLString(msg.text)} ${editedIndicator}</div>
                            <div class="message-actions">
                              <button class="msg-action-btn copy-btn" onclick="window.copyMessageText(${idx}, this)" title="Copy"><span class="material-symbols-rounded">content_copy</span></button>
                                ${isLastUserMsg ? `<button class="msg-action-btn" onclick="window.enableMessageEditMode(${idx})" title="Edit"><span class="material-symbols-rounded">edit</span></button>` : ''}
                            </div>
                        </div>
                    </div>`;
            } else {
                // REMOVED: The avatar-container div wrapper entirely
                // UPDATED: Added an inline style width property override to let the bubble-content span the full width
                trackingHTML += `
                    <div class="chat-row ai-row" id="msg-row-${idx}">
                        <div class="bubble-content" style="width: 100%; max-width: 100%; margin-left: 0;">${msg.text}</div>
                    </div>
                `;
            }
        });
    
        // 1. Flush and render the HTML markup content straight to the DOM
        stream.innerHTML = trackingHTML;
        
        // 2. Exact Pixel Viewport Scroll Engine
        const view = document.getElementById('contentViewport');
        const lastIndex = messages.length - 1;
        
        if (lastIndex >= 0 && view) {
            const lastMsg = messages[lastIndex];
            
            if (lastMsg.sender === 'ai') {
                const targetCard = document.getElementById(`msg-row-${lastIndex}`);
                if (targetCard) {
                    // Calculate exactly how far down the card is inside the stream wrapper container
                    const targetTopPosition = targetCard.offsetTop;
                    
                    // Force the parent viewport container to scroll precisely to the card's start coordinate
                    view.scrollTo({
                        top: targetTopPosition,
                        behavior: 'smooth'
                    });
                } else {
                    view.scrollTop = view.scrollHeight;
                }
            } else {
                // If it is a user text prompt entry, push scroll to the bottom normally
                view.scrollTop = view.scrollHeight;
            }
        }
    }

    // ==========================================
    // MESSAGE ACTION UTILITIES (EDIT / COPY)
    // ==========================================

    window.copyMessageText = function(idx, btnElement) {
        if (!SystemState.activeThreadId || !SystemState.threads[SystemState.activeThreadId]) return;
        const msg = SystemState.threads[SystemState.activeThreadId].messages[idx];
        if (!msg) return;

        navigator.clipboard.writeText(msg.text).then(() => {
            const icon = btnElement.querySelector('span');
            if (icon) icon.textContent = 'check';
            btnElement.classList.add('action-success'); // Flashes white
            
            setTimeout(() => {
                if (icon) icon.textContent = 'content_copy';
                btnElement.classList.remove('action-success');
            }, 2000);
        });
    };

    window.enableMessageEditMode = function(idx) {
        if (!SystemState.activeThreadId || !SystemState.threads[SystemState.activeThreadId]) return;
        const msg = SystemState.threads[SystemState.activeThreadId].messages[idx];
        if (!msg) return;

        const row = document.getElementById(`msg-row-${idx}`);
        if (!row) return;
        const wrapper = row.querySelector('.user-message-wrapper');
        if (!wrapper) return;

        // Swap out the bubble for the transparent edit UI block
        wrapper.innerHTML = `
            <div class="edit-mode-container">
                <textarea class="edit-textarea" id="edit-textarea-${idx}">${msg.text}</textarea>
                <div class="edit-actions-row">
                    <button class="edit-btn cancel" onclick="window.cancelMessageEditMode()">Cancel</button>
                    <button class="edit-btn update" onclick="window.commitMessageEdit(${idx})">Update</button>
                </div>
            </div>
        `;
        
        const textarea = document.getElementById(`edit-textarea-${idx}`);
        if (textarea) {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = textarea.value.length; // Move cursor to end
        }
    };

    window.cancelMessageEditMode = function() {
        renderActiveChatMessageStreams(); // Flushes the edit UI and restores the original bubble
    };

    window.commitMessageEdit = async function(idx) {
        const textarea = document.getElementById(`edit-textarea-${idx}`);
        if (!textarea) return window.cancelMessageEditMode();
        const newText = textarea.value.trim();
        if (!newText) return window.cancelMessageEditMode();

        const activeThread = SystemState.threads[SystemState.activeThreadId];
        if (!activeThread) return;
        
        // 1. Array Truncation: Delete the old AI response (and anything after this prompt)
        activeThread.messages.length = idx + 1;
        
        // 2. Update prompt data
        activeThread.messages[idx].text = newText;
        activeThread.messages[idx].isEdited = true;

        persistThreadsToStorage();
        renderActiveChatMessageStreams(); // Re-renders showing the updated user prompt

        // 3. Trigger new inference based on the updated text
        const stream = document.getElementById('messageStreamTarget');
        const loader = document.createElement('div');
        loader.className = 'chat-row';
        loader.innerHTML = `
            <div class="avatar-container ai"><span class="material-symbols-rounded">clinical_notes</span></div>
            <div class="bubble-content">
                <div class="typing-pulse-container">
                    <div class="pulse-dot"></div><div class="pulse-dot"></div><div class="pulse-dot"></div>
                </div>
            </div>
        `;
        if (stream) {
            stream.appendChild(loader);
            scrollViewportToBottom();
        }

        try {
            const systemResolutionOutput = await processClinicalInferenceResolution(newText);
            if (stream && stream.contains(loader)) stream.removeChild(loader);

            activeThread.messages.push({ sender: 'ai', text: systemResolutionOutput });
            persistThreadsToStorage(); 
            renderActiveChatMessageStreams();
        } catch (err) {
            if (stream && stream.contains(loader)) stream.removeChild(loader);
            activeThread.messages.push({ 
                sender: 'ai', 
                text: `<div class="clinical-card-container"><h4 style="color:var(--clinical-alert)">Gateway Endpoint Failure</h4><p style="margin-top:8px;">${err.message}</p></div>` 
            });
            persistThreadsToStorage(); 
            renderActiveChatMessageStreams();
        }
    };

    function renderThreadSidebarHistory() {
        const box = document.getElementById('chatHistoryContainer');
        if (!box) return;

        let records = Object.keys(SystemState.threads).map(k => SystemState.threads[k]);
        records.sort((a, b) => (b.pinned === a.pinned) ? 0 : (a.pinned ? -1 : 1));

        let html = '';
        records.forEach(t => {
            const isActive = (t.id === SystemState.activeThreadId && SystemState.activeViewPanelId === 'chatFeedScreen') ? 'active' : '';
            html += `
<div class="history-item-wrapper ${isActive}" data-id="${t.id}" data-pinned="${t.pinned}">
    <button class="history-item">
        <svg class="history-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="history-item-text">${escapeHTMLString(t.label)}</span>
    </button>
    <button class="item-action-trigger-btn" title="Options">
        <span class="material-symbols-rounded pin-icon">keep</span>
        <span class="material-symbols-rounded dots-icon">more_vert</span>
    </button>
</div>
            `;
        });
        box.innerHTML = html;

        box.querySelectorAll('.history-item-wrapper').forEach(row => {
            const id = row.getAttribute('data-id');
            const historyItem = row.querySelector('.history-item');
            if (historyItem) {
                historyItem.addEventListener('click', () => {
                    SystemState.activeThreadId = id;
                    renderThreadSidebarHistory();
                    routeWorkspaceView('chatFeedScreen');
                    renderActiveChatMessageStreams();
                });
            }
            const actionTrigger = row.querySelector('.item-action-trigger-btn');
            if (actionTrigger) {
                actionTrigger.addEventListener('click', (e) => {
                    e.stopPropagation(); e.preventDefault();
                    SystemState.selectedContextMenuThreadId = id;
                    triggerFloatingActionContextMenu(e);
                });
            }
        });
    }

    function processHistorySearchQuery(filterString = '') {
        const grid = document.getElementById('searchResultsTargetGrid');
        if (!grid) return;

        let matchedItems = Object.keys(SystemState.threads).map(k => SystemState.threads[k]);
        if (filterString) {
            matchedItems = matchedItems.filter(x => x.label.toLowerCase().includes(filterString));
        }

        if (!matchedItems.length) {
            grid.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-secondary); font-size:0.9rem;">No record coordinates found.</div>`;
            return;
        }

        let html = '';
        matchedItems.forEach(item => {
            html += `
                <div class="search-result-row-card" data-id="${item.id}">
                    <div class="src-meta-block">
                        <span class="material-symbols-rounded">chat_bubble_outline</span>
                        <div class="src-title">${escapeHTMLString(item.label)}</div>
                    </div>
                    <span class="material-symbols-rounded" style="color:var(--text-secondary); font-size:1.1rem;">arrow_forward_ios</span>
                </div>
            `;
        });
        grid.innerHTML = html;

        grid.querySelectorAll('.search-result-row-card').forEach(card => {
            card.addEventListener('click', () => {
                SystemState.activeThreadId = card.getAttribute('data-id');
                renderThreadSidebarHistory();
                routeWorkspaceView('chatFeedScreen');
                renderActiveChatMessageStreams();
            });
        });
    }

    function renderLibraryWorkspaceScreen(filterString = '') {
        const stack = document.getElementById('libraryWorkspaceAccordionContainer');
        if (!stack) return;

        let arrayData = SYSTEM_KNOWLEDGE_POOLS;
        if (filterString) {
            arrayData = arrayData.filter(x => 
                (x.title && x.title.toLowerCase().includes(filterString)) || 
                (x.category && x.category.toLowerCase().includes(filterString))
            );
        }

        if (!arrayData.length) {
            stack.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-secondary); font-size:0.9rem;">No database entries match current query bounds.</div>`;
            return;
        }

        let html = '';
        arrayData.forEach((node, index) => {
            html += `
                <div class="accordion-element-node" id="library_node_${index}">
                    <button class="accordion-header-trigger" data-index="${index}">
                        <div class="accordion-header-text-group">
                            <div class="node-cat">${escapeHTMLString(node.category || node.origin || "General Protocol Module")}</div>
                            <div class="node-title">${escapeHTMLString(node.title || "Untitled Matrix Record")}</div>
                        </div>
                        <span class="material-symbols-rounded chevron-icon">expand_more</span>
                    </button>
                    <div class="accordion-body-expansion-layer">
                        <div class="accordion-expansion-content">
                            </div>
                    </div>
                </div>
            `;
        });
        stack.innerHTML = html;

        stack.querySelectorAll('.accordion-header-trigger').forEach(triggerBtn => {
            triggerBtn.addEventListener('click', () => {
                const itemIdx = parseInt(triggerBtn.getAttribute('data-index'));
                const targetNodeModel = arrayData[itemIdx];
                const parentElementNode = triggerBtn.parentElement;
                if (!parentElementNode) return;
                const bodyLayer = parentElementNode.querySelector('.accordion-body-expansion-layer');
                const contentContainer = parentElementNode.querySelector('.accordion-expansion-content');
                
                const standsExpanded = parentElementNode.classList.contains('expanded');
                
                // Collapse all open alternative elements to conserve performance allocations
                stack.querySelectorAll('.accordion-element-node').forEach(el => {
                    el.classList.remove('expanded');
                    const expansionLayer = el.querySelector('.accordion-body-expansion-layer');
                    if (expansionLayer) expansionLayer.style.maxHeight = null;
                });

                if (!standsExpanded && bodyLayer && contentContainer) {
                    // Inject and compile content directly when requested by user intent layout actions
                    if (targetNodeModel.type === 'calc') {
                        contentContainer.innerHTML = renderInteractiveCalculationFormCard(targetNodeModel, `lib_matrix_${itemIdx}`);
                    } else {
                        contentContainer.innerHTML = renderFormattedStaticCard(targetNodeModel);
                    }
                    
                    parentElementNode.classList.add('expanded');
                    bodyLayer.style.maxHeight = (bodyLayer.scrollHeight + 150) + "px";
                }
            });
        });
    }

    // ==========================================
    // 7. SYSTEM UTILITIES AND CLOUD RUNTIMES
    // ==========================================
    function triggerFloatingActionContextMenu(event) {
        const el = document.getElementById('chatContextMenu');
        if (!el) return;

        const dataRef = SystemState.threads[SystemState.selectedContextMenuThreadId];
        const labelNode = el.querySelector('[data-action="pin"] span:last-child');
        if (dataRef && dataRef.pinned) {
            if (labelNode) labelNode.textContent = "Unpin";
        } else {
            if (labelNode) labelNode.textContent = "Pin";
        }

        el.classList.remove('hidden');
        let lx = event.clientX; let ty = event.clientY;
        if (lx + 180 > window.innerWidth) lx = window.innerWidth - 190;
        if (ty + 160 > window.innerHeight) ty = window.innerHeight - 170;

        el.style.left = lx + 'px'; el.style.top = ty + 'px';

        el.querySelectorAll('.context-action-item').forEach(button => {
            const clone = button.cloneNode(true);
            if (button.parentNode) {
                button.parentNode.replaceChild(clone, button);
                clone.addEventListener('click', (ev) => {
                    ev.stopPropagation(); el.classList.add('hidden');
                    executeContextActionSequence(clone.getAttribute('data-action'));
                });
            }
        });
    }

    function executeContextActionSequence(actionType) {
        const id = SystemState.selectedContextMenuThreadId;
        if (!id || !SystemState.threads[id]) return;

        if (actionType === 'pin') {
            SystemState.threads[id].pinned = !SystemState.threads[id].pinned;
            persistThreadsToStorage(); renderThreadSidebarHistory();
        } else if (actionType === 'rename') {
            const val = prompt("Rename this thread:", SystemState.threads[id].label);
            if (val && val.trim().length > 0) {
                SystemState.threads[id].label = val.trim();
                persistThreadsToStorage(); renderThreadSidebarHistory();
            }
        } else if (actionType === 'delete') {
            if (confirm("Are you sure you want to drop this clinical thread?")) {
                delete SystemState.threads[id];
                if (SystemState.activeThreadId === id) SystemState.activeThreadId = null;
                persistThreadsToStorage(); renderThreadSidebarHistory();
                if (!SystemState.activeThreadId) routeWorkspaceView('zeroStateScreen');
                else renderActiveChatMessageStreams();
            }
        }
    }

    function scrollViewportToBottom() {
        const view = document.getElementById('contentViewport');
        if (view) view.scrollTop = view.scrollHeight;
    }

    function escapeHTMLString(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char));
    }

    // Dynamic execution parser route for streaming responses compiled on-the-fly by Groq
    window.evaluateDynamicCloudCalculator = function(button) {
        const form = button.parentElement;
        if (!form) return;
        const out = form.querySelector('.dynamic-calc-result-target');
        const fields = form.querySelectorAll('.dynamic-custom-field');
        
        let reportHTML = `<div>`;
        let computedSum = 0;
        
        fields.forEach((input, index) => {
            const fieldLabel = input.getAttribute('data-label') || `Parameter ${index+1}`;
            const inputVal = parseFloat(input.value) || 0;
            computedSum += inputVal;
            reportHTML += `<p style="font-size:0.88rem; margin-bottom:4px;">• <b>${fieldLabel}:</b> ${inputVal}</p>`;
        });
        
        reportHTML += `
            <div style="margin-top:10px; color:var(--accent-blue); font-weight:600; font-size:1.15rem;">Processing Execution Complete</div>
            <p style="font-size:0.86rem; color:var(--text-secondary); margin-top:2px;">
                Dynamic aggregate evaluation parameters mapped matrix total: <b>${computedSum}</b>.
            </p>
        </div>`;
        
        if (out) {
            out.innerHTML = reportHTML;
            out.classList.remove('hidden');
            scrollViewportToBottom();
            
            // Adjust accordion container wrapper parameters to accommodate the calculated content safely
            const parentAccordionLayer = form.closest('.accordion-body-expansion-layer');
            if (parentAccordionLayer) {
                parentAccordionLayer.style.maxHeight = (parentAccordionLayer.scrollHeight + 300) + 'px';
            }
        }
    };

    const toggleBtn = document.getElementById('themeQuickToggleBtn');

toggleBtn.addEventListener('click', () => {
    // This flips between the sun and moon instantly via CSS
    toggleBtn.classList.toggle('dark-mode'); 
});

    window.addEventListener('DOMContentLoaded', initializeCortexaSystem);
})();





























/**
 * ============================================================================
 * CORTEXA AI - MAIN APPLICATION LOGIC
 * Business Integration Architecture Matrix
 * Native App Multi-Service Provisioning, Search Ecosystem, & Consumption Optimization Engine
 * ============================================================================
 */

/* ============================================================================
   GLOBAL APPLICATION STATE
   ============================================================================ */
let appState = {
    conversations: JSON.parse(localStorage.getItem('cortexa_chats')) || {},
    activityLog: JSON.parse(localStorage.getItem('cortexa_activity')) || [],
    activeChatId: null,
    activeTheme: localStorage.getItem('cortexa_theme') || 'dark',
    apiKeys: JSON.parse(localStorage.getItem('cortexa_apikeys')) || { groq: '' },
    usageLimits: JSON.parse(localStorage.getItem('cortexa_usage_limits')) || { daily: 100, weekly: 500, monthly: 2000 },
    usageMetrics: JSON.parse(localStorage.getItem('cortexa_usage_metrics')) || { dailyCount: 0, lastResetTimestamp: Date.now() }
};

/* ============================================================================
   DOM ELEMENT REFERENCES
   ============================================================================ */
const nodes = {
    body: document.body,
    sidebar: document.getElementById('sidebar'),
    menuToggle: document.getElementById('menuToggle'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    chatInput: document.getElementById('chatInput'),
    sendBtn: document.getElementById('sendBtn'),
    micBtn: document.getElementById('micBtn'),
    addFileBtn: document.getElementById('addFileBtn'),
    fileUploader: document.getElementById('fileUploader'),
    zeroState: document.getElementById('zeroState'),
    messageFeed: document.getElementById('messageFeed'),
    chatStage: document.getElementById('chatStage'),
    pinnedContainer: document.getElementById('pinnedContainer'),
    recentContainer: document.getElementById('recentContainer'),
    pinnedLabel: document.getElementById('pinnedLabel'),
    clearRecentBtn: document.getElementById('clearRecentBtn'),
    newChatTop: document.getElementById('newChatTop'),
    newChatSidebar: document.getElementById('newChatSidebar'),
    chatOptionsBtn: document.getElementById('chatOptionsBtn'),
    tabHistoryBtn: document.getElementById('tabHistoryBtn'),
    tabSearchBtn: document.getElementById('tabSearchBtn'),
    viewHistory: document.getElementById('viewHistory'),
    viewSearch: document.getElementById('viewSearch'),
    sidebarSearch: document.getElementById('sidebarSearch'),
    searchResultsContainer: document.getElementById('searchResultsContainer'),
    btnSettings: document.getElementById('btnSettings'),
    settingsSheet: document.getElementById('settingsSheet'),
    closeSettings: document.getElementById('closeSettings'),
    btnActivity: document.getElementById('btnActivity'),
    activitySheet: document.getElementById('activitySheet'),
    closeActivity: document.getElementById('closeActivity'),
    activityLogContainer: document.getElementById('activityLogContainer'),
    clearActivityLogBtn: document.getElementById('clearActivityLogBtn'),
    themeSelect: document.getElementById('themeSelect'),
    clearDataBtn: document.getElementById('clearDataBtn'),
    apiKeyGroq: document.getElementById('apiKeyGroq'),
    limitDaily: document.getElementById('limitDaily'),
    limitWeekly: document.getElementById('limitWeekly'),
    limitMonthly: document.getElementById('limitMonthly'),
    dailyProgress: document.getElementById('dailyProgress'),
    dailyProgressText: document.getElementById('dailyProgressText')
};

/* ============================================================================
   WEB SPEECH RECOGNITION (DICTATION)
   ============================================================================ */
let speechRecognition = null;
let isRecording = false;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRec();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = true;
    
    speechRecognition.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            transcript += e.results[i][0].transcript;
        }
        nodes.chatInput.value = transcript;
        nodes.chatInput.dispatchEvent(new Event('input')); 
    };

    speechRecognition.onerror = (e) => stopRecording();
    speechRecognition.onend = () => stopRecording();
}

function stopRecording() {
    isRecording = false;
    nodes.micBtn.classList.remove('mic-recording');
}

/* ============================================================================
   INITIALIZATION & TELEMETRY
   ============================================================================ */
function initializeApp() {
    if(appState.activeTheme === 'oled') appState.activeTheme = 'dark';
    nodes.themeSelect.value = appState.activeTheme;
    applyThemeState(appState.activeTheme);
    
    provisionSystemTelemetryFields();
    cronClearUsageMetricsCheck();
    renderLedgerStack();
    bindEventInterceptors();
}

function provisionSystemTelemetryFields() {
    nodes.apiKeyGroq.value = appState.apiKeys.groq || '';
    nodes.limitDaily.value = appState.usageLimits.daily;
    nodes.limitWeekly.value = appState.usageLimits.weekly;
    nodes.limitMonthly.value = appState.usageLimits.monthly;
    refreshMetricTelemetryTrackers();
}

function refreshMetricTelemetryTrackers() {
    const consumptionPercent = Math.min((appState.usageMetrics.dailyCount / appState.usageLimits.daily) * 100, 100);
    nodes.dailyProgress.style.width = `${consumptionPercent}%`;
    nodes.dailyProgressText.textContent = `${appState.usageMetrics.dailyCount} / ${appState.usageLimits.daily} calls consumed`;
}

function cronClearUsageMetricsCheck() {
    const currentTimestamp = Date.now();
    if ((currentTimestamp - appState.usageMetrics.lastResetTimestamp) >= 86400000) {
        appState.usageMetrics.dailyCount = 0;
        appState.usageMetrics.lastResetTimestamp = currentTimestamp;
        localStorage.setItem('cortexa_usage_metrics', JSON.stringify(appState.usageMetrics));
    }
}

/* ============================================================================
   SIDEBAR SEARCH VIEW
   ============================================================================ */
function populateSearchView() {
    const queryTerm = nodes.sidebarSearch.value.trim().toLowerCase();
    nodes.searchResultsContainer.innerHTML = '';
    
    const resultsLabel = document.getElementById('searchResultsLabel');
    if (resultsLabel) {
        resultsLabel.classList.toggle('hidden', queryTerm.length === 0);
    }

    Object.values(appState.conversations)
        .sort((a, b) => b.id.localeCompare(a.id))
        .forEach(chat => {
            const hasTitleMatch = chat.title.toLowerCase().includes(queryTerm);
            const hasLogsMatch = chat.logs.some(log => log.content.toLowerCase().includes(queryTerm));
            
            if (!queryTerm || hasTitleMatch || hasLogsMatch) {
                const row = document.createElement('div');
                row.className = `history-item ${chat.id === appState.activeChatId ? 'active' : ''}`;
                row.innerHTML = `
                    <div class="history-item-meta">
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${chat.title}</span>
                    </div>
                `;
                row.addEventListener('click', () => {
                    executeActiveChatRetrievalRoute(chat.id);
                    if (window.innerWidth < 900) {
                        nodes.sidebar.classList.remove('open');
                        nodes.sidebarOverlay.classList.remove('active');
                    }
                });
                nodes.searchResultsContainer.appendChild(row);
            }
        });
}

/* ============================================================================
   EVENT LISTENERS & INTERCEPTORS
   ============================================================================ */
function bindEventInterceptors() {
    const preserveApiKeysState = () => {
        appState.apiKeys.groq = nodes.apiKeyGroq.value.trim();
        localStorage.setItem('cortexa_apikeys', JSON.stringify(appState.apiKeys));
    };
    nodes.apiKeyGroq.addEventListener('input', preserveApiKeysState);

    const preserveLimitsState = () => {
        appState.usageLimits.daily = parseInt(nodes.limitDaily.value) || 100;
        appState.usageLimits.weekly = parseInt(nodes.limitWeekly.value) || 500;
        appState.usageLimits.monthly = parseInt(nodes.limitMonthly.value) || 2000;
        localStorage.setItem('cortexa_usage_limits', JSON.stringify(appState.usageLimits));
        refreshMetricTelemetryTrackers();
    };
    nodes.limitDaily.addEventListener('change', preserveLimitsState);
    nodes.limitWeekly.addEventListener('change', preserveLimitsState);
    nodes.limitMonthly.addEventListener('change', preserveLimitsState);

    nodes.tabHistoryBtn.addEventListener('click', () => {
        nodes.tabHistoryBtn.classList.add('active');
        nodes.tabSearchBtn.classList.remove('active');
        nodes.viewHistory.classList.remove('hidden');
        nodes.viewSearch.classList.add('hidden');
        nodes.newChatSidebar.classList.remove('hidden'); 
    });

    nodes.tabSearchBtn.addEventListener('click', () => {
        nodes.tabSearchBtn.classList.add('active');
        nodes.tabHistoryBtn.classList.remove('active');
        nodes.viewSearch.classList.remove('hidden');
        nodes.viewHistory.classList.add('hidden');
        nodes.newChatSidebar.classList.add('hidden'); 
        populateSearchView(); 
        nodes.sidebarSearch.focus();
    });

    nodes.sidebarSearch.addEventListener('input', populateSearchView);

    nodes.chatInput.addEventListener('input', () => {
        nodes.chatInput.style.height = 'auto';
        nodes.chatInput.style.height = (nodes.chatInput.scrollHeight) + 'px';
        const hasText = nodes.chatInput.value.trim().length > 0;
        nodes.sendBtn.classList.toggle('hidden', !hasText);
        nodes.micBtn.classList.toggle('hidden', hasText);
    });

    nodes.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            dispatchActiveInput();
        }
    });
    nodes.sendBtn.addEventListener('click', dispatchActiveInput);
    
    nodes.addFileBtn.addEventListener('click', () => nodes.fileUploader.click());
    nodes.fileUploader.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const fileNames = Array.from(e.target.files).map(f => f.name).join(', ');
            nodes.chatInput.value += `[Attached File: ${fileNames}] `;
            nodes.chatInput.dispatchEvent(new Event('input'));
        }
        nodes.fileUploader.value = '';
    });

    nodes.micBtn.addEventListener('click', () => {
        if (!speechRecognition) return alert("Your browser does not support Speech Recognition.");
        if (isRecording) {
            speechRecognition.stop();
        } else {
            speechRecognition.start();
            isRecording = true;
            nodes.micBtn.classList.add('mic-recording');
        }
    });

    const toggleSidebar = () => {
        if (window.innerWidth >= 900) {
            nodes.sidebar.classList.toggle('collapsed');
        } else {
            nodes.sidebar.classList.toggle('open');
            nodes.sidebarOverlay.classList.toggle('active');
        }
    };
    nodes.menuToggle.addEventListener('click', toggleSidebar);
    nodes.sidebarOverlay.addEventListener('click', toggleSidebar);

    const clearCanvasToNewChat = () => {
        appState.activeChatId = null;
        nodes.messageFeed.innerHTML = '';
        nodes.messageFeed.classList.add('hidden');
        nodes.zeroState.classList.remove('hidden');
        nodes.chatInput.value = '';
        nodes.chatInput.style.height = 'auto';
        nodes.sendBtn.classList.add('hidden');
        nodes.micBtn.classList.remove('hidden');
        document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
    };
    nodes.newChatTop.addEventListener('click', clearCanvasToNewChat);
    nodes.newChatSidebar.addEventListener('click', () => {
        clearCanvasToNewChat();
        if (window.innerWidth < 900) toggleSidebar();
    });

    nodes.chatOptionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!appState.activeChatId) return alert("Select an active conversation thread first.");
        launchContextMenu(appState.conversations[appState.activeChatId], nodes.chatOptionsBtn);
    });

    nodes.btnSettings.addEventListener('click', () => {
        nodes.settingsSheet.classList.remove('hidden');
        if (window.innerWidth < 900) toggleSidebar();
    });
    nodes.closeSettings.addEventListener('click', () => nodes.settingsSheet.classList.add('hidden'));

    nodes.btnActivity.addEventListener('click', () => {
        populateActivityLog();
        nodes.activitySheet.classList.remove('hidden');
        if (window.innerWidth < 900) toggleSidebar();
    });
    nodes.closeActivity.addEventListener('click', () => nodes.activitySheet.classList.add('hidden'));

    nodes.clearActivityLogBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear your local activity history?")) {
            appState.activityLog = [];
            localStorage.setItem('cortexa_activity', JSON.stringify(appState.activityLog));
            populateActivityLog();
        }
    });

    nodes.themeSelect.addEventListener('change', (e) => {
        appState.activeTheme = e.target.value;
        localStorage.setItem('cortexa_theme', appState.activeTheme);
        applyThemeState(appState.activeTheme);
    });

    nodes.clearRecentBtn.addEventListener('click', () => {
        const unpinnedExists = Object.values(appState.conversations).some(chat => !chat.pinned);
        if (!unpinnedExists) return;
        
        if (confirm("Are you sure you want to clear all unpinned recent chats?")) {
            let activeDeleted = false;
            Object.keys(appState.conversations).forEach(id => {
                if (!appState.conversations[id].pinned) {
                    if (appState.activeChatId === id) activeDeleted = true;
                    delete appState.conversations[id];
                }
            });
            
            if (activeDeleted) {
                clearCanvasToNewChat();
            } else {
                commitState();
            }
        }
    });

    nodes.clearDataBtn.addEventListener('click', () => {
        if(confirm("Permanently erase all local history, configuration keys and activity data logs?")) {
            localStorage.clear();
            appState.conversations = {};
            appState.activityLog = [];
            appState.apiKeys = { groq: '' };
            appState.usageMetrics = { dailyCount: 0, lastResetTimestamp: Date.now() };
            appState.usageLimits = { daily: 100, weekly: 500, monthly: 2000 };
            provisionSystemTelemetryFields();
            clearCanvasToNewChat();
            renderLedgerStack();
            nodes.settingsSheet.classList.add('hidden');
        }
    });

    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            nodes.chatInput.value = card.getAttribute('data-query');
            dispatchActiveInput();
        });
    });

    window.addEventListener('click', (e) => {
        if (!e.target.closest('#chatOptionsBtn') && !e.target.closest('.context-menu') && !e.target.closest('.inline-action-btn')) {
            document.querySelectorAll('.context-menu').forEach(m => m.remove());
        }
    });
}

function applyThemeState(theme) {
    nodes.body.className = '';
    nodes.body.classList.add(`theme-${theme}`);
}

/* ============================================================================
   CHAT ROUTING & MESSAGE HANDLING
   ============================================================================ */
function executeActiveChatRetrievalRoute(id) {
    const chat = appState.conversations[id];
    if (!chat) return;
    appState.activeChatId = id;
    nodes.zeroState.classList.add('hidden');
    nodes.messageFeed.innerHTML = '';
    nodes.messageFeed.classList.remove('hidden');
    
    chat.logs.forEach((log, index) => appendMessageNode(log.role, log.content, null, index));
    
    renderLedgerStack();
    populateSearchView(); 
}

async function executeMessageEdit(logIndex, newContent) {
    const chat = appState.conversations[appState.activeChatId];
    chat.logs[logIndex].content = newContent;
    chat.logs = chat.logs.slice(0, logIndex + 1);
    
    nodes.messageFeed.innerHTML = '';
    chat.logs.forEach((log, idx) => appendMessageNode(log.role, log.content, null, idx));
    
    const hapticEnabled = document.getElementById('hapticToggle').checked;
    const messageId = `msg_${Date.now()}`;
    const loaderHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    appendMessageNode('cortexa', loaderHTML, messageId);

    const responseText = await fetchRealAPIResponse(chat.logs);

    const targetBubble = document.getElementById(messageId);
    if (targetBubble) {
        if (hapticEnabled && navigator.vibrate) navigator.vibrate(50);
        targetBubble.innerHTML = responseText;
        chat.logs.push({ role: 'cortexa', content: responseText });
        commitState();
    }
}

/* ============================================================================
   LOCAL DATABASE SEARCH & MULTIPLE CHOICE HANDLER
   ============================================================================ */
function searchLocalDatabase(query) {
    const q = query.toLowerCase().trim();
    if (!q) return null;

    let matches = [];

    // 1. Gather all potential Calculators across datasets
    const allCalculators = [
        ...(window.CALCULATORS || []),
        ...(window.FLUIDS || []),
        ...(window.LABS || [])
    ].flatMap(category => category.items || []);

    allCalculators.forEach(c => {
        if (c.title && c.title.toLowerCase().includes(q)) {
            matches.push({ ...c, type: 'calculator', sourceFile: c.id.startsWith('c_lab') ? 'Labs' : 'Calculators' });
        }
    });

    // 2. Gather Protocols/Emergencies/Procedures
    const clinicalContent = [
        ...(window.PROTOCOLS || []),
        ...(window.EMERGENCIES || []),
        ...(window.PROCEDURES || [])
    ];

    clinicalContent.forEach(p => {
        if (p.title && p.title.toLowerCase().includes(q)) {
            matches.push({ ...p, type: 'protocol', sourceFile: 'Protocols Matrix' });
        }
    });

    // 3. Gather Drugs
    const allDrugs = window.DRUGS || [];
    allDrugs.forEach(d => {
        if ((d.title && d.title.toLowerCase().includes(q)) || (d.keywords && d.keywords.some(k => k.toLowerCase().includes(q)))) {
            matches.push({ ...d, type: 'drug', sourceFile: 'Pharmacology Core' });
        }
    });

    // --- EVALUATE MULTIPLE CHOICE PROFILE ---
    if (matches.length > 1) {
        // Return a customized special multiple choice command packet
        return {
            type: 'multiple_choice_selector',
            queryTerm: query,
            options: matches
        };
    }

    // Fall back to returning single element or null
    return matches.length === 1 ? matches[0] : null;
}

/* ============================================================================
   MULTIPLE CHOICE INTERACTIVE RENDERER
   ============================================================================ */
function renderMultipleChoiceBox(payload) {
    const selectorUniqueId = 'choice_' + Date.now();
    
    let optionsMarkup = payload.options.map((option, index) => {
        // Determine icons or category badges for clinical context clarity
        let iconType = 'calculate';
        if (option.type === 'drug') iconType = 'pill';
        if (option.type === 'protocol') iconType = 'clinical_notes';
        
        return `
            <div class="choice-item-row" 
                 data-target-id="${option.id}" 
                 data-target-type="${option.type}"
                 style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 14px; padding: 14px 16px; margin-bottom: 10px; cursor: pointer; transition: all var(--transition-timing); display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
                    <span class="material-symbols-rounded" style="color: var(--accent-blue); font-size: 22px;">${iconType}</span>
                    <div>
                        <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 500;">${option.title}</div>
                        <div style="color: var(--text-secondary); font-size: 0.76rem; opacity: 0.8; margin-top: 2px;">Database Source: <b>${option.sourceFile}</b></div>
                    </div>
                </div>
                <span class="material-symbols-rounded" style="color: var(--text-secondary); font-size: 18px;">arrow_forward_ios</span>
            </div>
        `;
    }).join('');

    // Attach immediate event hook up script using macro-task tracking loops
    setTimeout(() => {
        const container = document.getElementById(selectorUniqueId);
        if (!container) return;

        container.querySelectorAll('.choice-item-row').forEach(row => {
            row.addEventListener('mouseover', () => {
                row.style.borderColor = 'var(--accent-blue)';
                row.style.background = 'var(--bg-hover)';
            });
            row.addEventListener('mouseout', () => {
                row.style.borderColor = 'var(--border-color)';
                row.style.background = 'var(--bg-main)';
            });
            
            row.addEventListener('click', () => {
                const targetId = row.dataset.targetId;
                const targetType = row.dataset.targetType;
                
                // Re-find target instance to extract complete config rules
                let resolvedTarget = null;
                if (targetType === 'calculator') {
                    resolvedTarget = [
                        ...(window.CALCULATORS || []),
                        ...(window.FLUIDS || []),
                        ...(window.LABS || [])
                    ].flatMap(cat => cat.items || []).find(i => i.id === targetId);
                } else if (targetType === 'drug') {
                    resolvedTarget = (window.DRUGS || []).find(i => i.id === targetId);
                } else {
                    resolvedTarget = [
                        ...(window.PROTOCOLS || []),
                        ...(window.EMERGENCIES || []),
                        ...(window.PROCEDURES || [])
                    ].find(i => i.id === targetId);
                }

                if (resolvedTarget) {
                    // Re-route and swap layout inside chat window dynamically
                    let finalizedUI = '';
                    if (targetType === 'calculator') finalizedUI = renderCalculatorUI(resolvedTarget);
                    else if (targetType === 'drug') finalizedUI = renderDrugCard(resolvedTarget);
                    else finalizedUI = renderProtocolUI(resolvedTarget);
                    
                    container.innerHTML = finalizedUI;
                    
                    // Re-bind click event cycles to standard input arrays if it was a calculator
                    if (targetType === 'calculator') {
                        const formElement = container.querySelector('form');
                        if (formElement) {
                            // Automatically triggers initial form attachment systems in main engine setup
                            const formId = formElement.getAttribute('id');
                            const evaluateButton = container.querySelector(`button[onclick*="${formId}"]`);
                            if (!evaluateButton) {
                                // Manual safety fallback layout binder mapping
                                formElement.addEventListener('submit', (e) => e.preventDefault());
                            }
                        }
                    }
                }
            });
        });
    }, 50);

    return `
    <div id="${selectorUniqueId}" class="duplicate-resolver-container" style="background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 20px; padding: 18px; margin-top: 10px; width: 100%; box-shadow: 0 4px 16px rgba(0,0,0,0.2); font-family: var(--font-stack);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
            <span class="material-symbols-rounded" style="color: #fbbc04; font-size: 20px;">clinical_notes</span>
            <h4 style="margin: 0; font-size: 1.05rem; color: var(--text-primary); font-weight: 600; text-align: left;">Clinical Entity Ambiguity Detected</h4>
        </div>
        <p style="margin: 0 0 16px 0; font-size: 0.88rem; color: var(--text-secondary); text-align: left; line-height: 1.5;">
            The search term "<b>${payload.queryTerm}</b>" correlates with multiple distinct entries across clinical frameworks and diagnostic indexes. Please select the appropriate clinical asset below to proceed:
        </p>
        <div class="choices-stack-wrapper">
            ${optionsMarkup}
        </div>
    </div>
`;
}

/* ============================================================================
   EXTERNAL API ENGINE (GROQ) & LOCAL FALLBACK ROUTER
   ============================================================================ */
async function fetchRealAPIResponse(chatLogs) {
    const latestQuery = chatLogs[chatLogs.length - 1].content;
const localMatch = searchLocalDatabase(latestQuery);

// --- STAGE 1: LOCAL DATABASE RENDERER ---
if (localMatch) {
    if (localMatch.type === 'multiple_choice_selector') {
        return renderMultipleChoiceBox(localMatch); // Intercept and return choice interface box
    }
    if (localMatch.type === 'calculator') return renderCalculatorUI(localMatch);
    if (localMatch.type === 'drug') return renderDrugCard(localMatch);
    return renderProtocolUI(localMatch);
}

    // --- STAGE 2: STRUCTURED AI ENGINE + DESIGN ROUTER ---
    const key = appState.apiKeys.groq?.trim();
    if (!key) return `<span style="color:var(--clinical-alert)">Configuration Error:</span> Please provision a GROQ API key.`;

    try {
        const systemPrompt = `You are Cortexa, an elite clinical database engine. You must process medical queries and respond using one of two structured JSON formats based on the operational domain context. 

If the user is querying about a drug/medication/pharmacological agent, you MUST return a valid JSON object matching this structural Drug blueprint schema:
{ 
  "isDrug": true, 
  "id": "d_slugname", 
  "title": "Generic Name (Brand Name)", 
  "category": "Pharmacological Class", 
  "data": { 
    "indication": "Clinical indications here", 
    "mechanism": "Mechanism of action", 
    "dose": "0.1 – 2 mcg/kg/min IV or matching weight-based rules", 
    "clinicalTip": "Critical critical alert tips here" 
  } 
}

If the user is querying about general medical conditions, diagnostics, or procedures, respond using this standard Protocol blueprint schema:
{ 
  "isDrug": false, 
  "title": "Protocol Title", 
  "category": "Medical Specialty", 
  "desc": "Short description", 
  "steps": ["Step 1", "Step 2"], 
  "pearls": "Clinical pearls" 
}

If a query is NOT healthcare related (e.g., politics, coding, general trivia), use this non-medical security rejection standard:
{ 
  "isDrug": false, 
  "title": "Query Out of Scope", 
  "category": "Security & Confinement", 
  "desc": "As a specialized medical AI, I am strictly restricted to medical and healthcare inquiries.", 
  "steps": ["Please refine your query to focus on clinical, medical, or pharmacological topics."], 
  "pearls": "Cortexa AI maintains strict confinement to healthcare domains to ensure operational focus." 
}

CRITICAL: Output ONLY valid raw JSON. Do not write text before or after the JSON schema.`;
        
        const messages = [
            { role: "system", content: systemPrompt },
            ...chatLogs.map(log => ({ role: log.role === 'cortexa' ? 'assistant' : 'user', content: log.content }))
        ];

        // --- HARDENED API CALL TO GROQ ENGINE ---
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                temperature: 0.1, // Forces deterministic output logic
                response_format: { type: "json_object" } // NATIVE EXTRACTION FORCE FOR GROQ
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error Status: ${response.status}`);
        }

        const result = await response.json();
        let rawText = result.choices[0].message.content.trim();

        // Defensive Cleaning Patch if Markdown escapes despite the API parameters
        if (rawText.startsWith("```")) {
            rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }

        // --- PARSE AND DISPATCH MATRIX ---
        const parsedPayload = JSON.parse(rawText);
        
        // Formatted Medical Safety Ribbon UI Module
        const externalDisclaimer = `<div style="font-size: 0.72rem; color: var(--text-secondary); opacity: 0.6; text-align: left; margin-top: 14px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.03); display: flex; align-items: center; gap: 6px;">
            <span class="material-symbols-rounded" style="font-size: 14px; color: var(--clinical-alert); vertical-align: middle;">health_and_safety</span>
            <span style="line-height: 14px;">Generated by Cortexa AI. Verify all clinical data before application.</span>
        </div>`;

        if (parsedPayload.isDrug || (parsedPayload.data && parsedPayload.data.dose)) {
            return window.GroqAdapter.renderIncomingDrug(parsedPayload) + externalDisclaimer;
        } else if (parsedPayload.type === 'calculator' || parsedPayload.fields) {
            return window.GroqAdapter.renderIncomingFluid(parsedPayload) + externalDisclaimer;
        } else {
            return renderProtocolUI(parsedPayload) + externalDisclaimer;
        }

    } catch (error) {
        console.error("External Parser Core Interruption:", error);
        return `<div class="error-card" style="padding: 14px; border: 1px solid var(--clinical-alert); background: rgba(242,139,130,0.05); border-radius: 12px; color: var(--text-primary); font-size: 0.85rem; text-align: left;">
            <strong style="color: var(--clinical-alert);">External Database Connection Blocked:</strong><br>
            <span style="font-size:0.78rem; opacity:0.8;">${error.message || 'Structured protocol breakdown.'}</span><br>
            <div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary);">Verify your API Token availability status and query profile semantics.</div>
        </div>`;
    }
}

/* ============================================================================
   PROTOCOL UI RENDERER
   ============================================================================ */
function renderProtocolUI(match) {
    const isOutOfScope = match.category === "Security & Confinement";
    
    if (isOutOfScope) {
        return `
            <div style="border: 1px solid var(--clinical-alert); border-radius: 12px; padding: 18px; background-color: rgba(242, 139, 130, 0.05);">
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--clinical-alert); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                    ${match.category}
                </div>
                <h3 style="margin-bottom: 12px; font-weight: 600; font-size: 1.15rem; color: var(--text-primary);">
                    ${match.title}
                </h3>
                <p style="font-size: 0.95rem; line-height: 1.5; color: var(--text-secondary);">
                    ${match.desc}
                </p>
            </div>`;
    }

    const stepsHtml = (match.steps || []).map(s => `<li style="margin-bottom:8px;">${s}</li>`).join('');
    
    return `
        <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 18px; background-color: var(--bg-sidebar);">
            <div style="font-size: 0.8rem; font-weight: 600; color: var(--accent-blue); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                ${match.category || 'Protocol'}
            </div>
            <h3 style="margin-bottom: 12px; font-weight: 600; font-size: 1.15rem;">${match.title}</h3>
            <p style="font-size: 0.95rem; line-height: 1.5; color: var(--text-secondary); margin-bottom: 16px;">${match.desc}</p>
            
            <h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 10px;">Protocol Matrix Steps:</h4>
            <ol style="margin-bottom: 18px; padding-left: 20px; font-size: 0.95rem; line-height: 1.5;">${stepsHtml}</ol>
            
            <div style="background-color: var(--bg-main); padding: 14px; border-radius: 10px; border-left: 3px solid var(--accent-blue); font-size: 0.9rem; line-height: 1.4;">
                <strong>Clinical Pearls:</strong> ${match.pearls}
            </div>
        </div>`;
}

function getClinicalDisclaimer() {
    return `
        <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 14px; border-top: 1px solid var(--border-color); padding-top: 10px; display: flex; align-items: center; gap: 6px;">
            <span class="material-symbols-rounded" style="font-size: 14px; color: #fff; opacity: 0.8; vertical-align: middle;">health_and_safety</span>
            <span style="line-height: 14px;">Generated by Cortexa AI. Verify all clinical data before application.</span>
        </div>`;
}

/* ============================================================================
   USER INPUT DISPATCHER (QUERY SUBMISSION)
   ============================================================================ */
async function dispatchActiveInput() {
    const query = nodes.chatInput.value.trim();
    if (!query) return;

    if (appState.usageMetrics.dailyCount >= appState.usageLimits.daily) {
        alert("Daily API Processing usage ceiling encountered. Please adjust configuration parameters inside Settings panel.");
        return;
    }

    nodes.chatInput.value = '';
    nodes.chatInput.style.height = 'auto';
    nodes.sendBtn.classList.add('hidden');
    nodes.micBtn.classList.remove('hidden');

    if (!appState.activeChatId) {
        const newId = 'chat_' + Date.now();
        appState.conversations[newId] = {
            id: newId,
            title: query.length > 28 ? query.substring(0, 28) + '...' : query,
            pinned: false,
            logs: []
        };
        appState.activeChatId = newId;
    }

    nodes.zeroState.classList.add('hidden');
    nodes.messageFeed.classList.remove('hidden');
    
    const newLogIndex = appState.conversations[appState.activeChatId].logs.length;
    appendMessageNode('user', query, null, newLogIndex);
    appState.conversations[appState.activeChatId].logs.push({ role: 'user', content: query });

    appState.activityLog.unshift({ date: new Date().toLocaleString(), query: query });
    if(appState.activityLog.length > 50) appState.activityLog.pop();

    appState.usageMetrics.dailyCount += 1;
    localStorage.setItem('cortexa_usage_metrics', JSON.stringify(appState.usageMetrics));
    refreshMetricTelemetryTrackers();

    const hapticEnabled = document.getElementById('hapticToggle').checked;
    
    const messageId = `msg_${Date.now()}`;
    const loaderHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    appendMessageNode('cortexa', loaderHTML, messageId);

    const responseText = await fetchRealAPIResponse(appState.conversations[appState.activeChatId].logs);

    const targetBubble = document.getElementById(messageId);
    if (targetBubble) {
        if (hapticEnabled && navigator.vibrate) navigator.vibrate(50);
        targetBubble.innerHTML = responseText;
        appState.conversations[appState.activeChatId].logs.push({ role: 'cortexa', content: responseText });
        commitState();
    }
}

/* ============================================================================
   MESSAGE APPEND (USER / CORTEXA) WITH EDIT FEATURES
   ============================================================================ */
function appendMessageNode(sender, content, overrideId = null, logIndex = null) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${sender}`;

    if (sender === 'cortexa') {
        wrapper.innerHTML = `
            <div class="cortexa-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" fill="url(#gemini-gradient)"/>
                </svg>
            </div>
            <div class="cortexa-content">
                <div class="message-bubble" ${overrideId ? `id="${overrideId}"` : ''}>${content}</div>
            </div>
        `;
        nodes.messageFeed.appendChild(wrapper);
    } else {
        const isTouchScreen = window.matchMedia("(hover: none)").matches;
        const startOpacity = isTouchScreen ? '1' : '0';

        wrapper.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:flex-end; width:100%;">
                <div class="message-bubble" style="position:relative; display:flex; flex-direction:column; align-items:flex-end; width:auto; max-width:85%;">
                    <div class="user-text-content" style="width:100%;">${content}</div>
                    
                    <div class="user-edit-container hidden" style="width:100%; min-width:280px; margin-top:8px;">
                        <textarea class="edit-textarea" style="width:100%; background:var(--bg-main); color:var(--text-primary); border:1px solid var(--border-color); border-radius:12px; padding:10px; font-family:inherit; font-size:1rem; resize:vertical; min-height:100px; margin-bottom:8px; outline:none;"></textarea>
                        <div style="display:flex; justify-content:flex-end; gap:8px;">
                            <button class="cancel-edit-btn control-btn" style="width:auto; padding:0 16px; border-radius:12px; font-size:0.9rem;">Cancel</button>
                            <button class="save-edit-btn" style="background:var(--accent-blue); color:#000; border:none; padding:8px 16px; border-radius:12px; font-weight:600; cursor:pointer; font-size:0.9rem;">Update</button>
                        </div>
                    </div>
                </div>
                ${logIndex !== null ? `
                <div class="message-actions" style="display:flex; gap:4px; margin-top:4px; opacity:${startOpacity}; transition:opacity 0.2s;">
                    <button class="inline-action-btn edit-trigger-btn" title="Edit Message" style="width:32px; height:32px;"><span class="material-symbols-rounded" style="font-size:18px;">edit</span></button>
                    <button class="inline-action-btn copy-trigger-btn" title="Copy Message" style="width:32px; height:32px;"><span class="material-symbols-rounded" style="font-size:18px;">content_copy</span></button>
                </div>` : ''}
            </div>
        `;

        nodes.messageFeed.appendChild(wrapper);

        if (logIndex !== null) {
            const textContent = wrapper.querySelector('.user-text-content');
            const editContainer = wrapper.querySelector('.user-edit-container');
            const textarea = wrapper.querySelector('.edit-textarea');
            const actionsContainer = wrapper.querySelector('.message-actions');
            const editBtn = wrapper.querySelector('.edit-trigger-btn');
            const copyBtn = wrapper.querySelector('.copy-trigger-btn');
            const cancelBtn = wrapper.querySelector('.cancel-edit-btn');
            const saveBtn = wrapper.querySelector('.save-edit-btn');

            if (!isTouchScreen) {
                wrapper.addEventListener('mouseenter', () => actionsContainer.style.opacity = '1');
                wrapper.addEventListener('mouseleave', () => actionsContainer.style.opacity = '0');
            }

            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(appState.conversations[appState.activeChatId].logs[logIndex].content);
                const icon = copyBtn.querySelector('.material-symbols-rounded');
                icon.textContent = 'check';
                setTimeout(() => icon.textContent = 'content_copy', 2000);
            });

            editBtn.addEventListener('click', () => {
                textContent.classList.add('hidden');
                editBtn.style.display = 'none';
                editContainer.classList.remove('hidden');
                textarea.value = appState.conversations[appState.activeChatId].logs[logIndex].content;
                textarea.focus();
            });

            cancelBtn.addEventListener('click', () => {
                editContainer.classList.add('hidden');
                textContent.classList.remove('hidden');
                editBtn.style.display = 'flex';
            });

            saveBtn.addEventListener('click', () => {
                const newText = textarea.value.trim();
                if (!newText) return;
                executeMessageEdit(logIndex, newText);
            });
        }
    }
    
    setTimeout(() => {
        nodes.chatStage.scrollTo({ top: nodes.chatStage.scrollHeight, behavior: 'smooth' });
    }, 10);
}

/* ============================================================================
   HISTORY LEDGER RENDERER (PINNED & RECENT CONVERSATIONS)
   ============================================================================ */
function renderLedgerStack() {
    nodes.pinnedContainer.innerHTML = '';
    nodes.recentContainer.innerHTML = '';
    let pinnedCount = 0;

    Object.values(appState.conversations).sort((a,b) => b.id.localeCompare(a.id)).forEach(chat => {
        const item = document.createElement('div');
        item.className = `history-item ${chat.id === appState.activeChatId ? 'active' : ''}`;
        
        item.innerHTML = `
            <div class="history-item-meta">
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${chat.title}</span>
            </div>
            <div class="history-inline-actions">
                <button class="inline-action-btn action-pin-trigger" title="Pin / Unpin">
                    <span class="material-symbols-rounded">${chat.pinned ? 'keep_off' : 'keep'}</span>
                </button>
                <button class="inline-action-btn action-menu-trigger" title="Context Actions">
                    <span class="material-symbols-rounded">more_horiz</span>
                </button>
            </div>
        `;
        
        item.querySelector('.history-item-meta').addEventListener('click', () => {
            executeActiveChatRetrievalRoute(chat.id);
            if (window.innerWidth < 900) {
                nodes.sidebar.classList.remove('open');
                nodes.sidebarOverlay.classList.remove('active');
            }
        });

        item.querySelector('.action-pin-trigger').addEventListener('click', (e) => {
            e.stopPropagation();
            chat.pinned = !chat.pinned;
            commitState();
        });

        item.querySelector('.action-menu-trigger').addEventListener('click', (e) => {
            e.stopPropagation();
            launchContextMenu(chat, e.currentTarget);
        });

        if (chat.pinned) {
            nodes.pinnedContainer.appendChild(item);
            pinnedCount++;
        } else {
            nodes.recentContainer.appendChild(item);
        }
    });
    nodes.pinnedLabel.classList.toggle('hidden', pinnedCount === 0);
}

/* ============================================================================
   CONTEXT MENU (CHAT ACTIONS: PIN, RENAME, SHARE, DELETE)
   ============================================================================ */
function launchContextMenu(chat, anchor) {
    document.querySelectorAll('.context-menu').forEach(m => m.remove());
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    
    const rect = anchor.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 6}px`;
    menu.style.left = `${Math.min(rect.left, window.innerWidth - 200)}px`;

    menu.innerHTML = `
        <button class="context-menu-item" data-action="pin">
            <span class="material-symbols-rounded">${chat.pinned ? 'keep_off' : 'keep'}</span>
            <span>${chat.pinned ? 'Unpin' : 'Pin'}</span>
        </button>
        <button class="context-menu-item" data-action="rename">
            <span class="material-symbols-rounded">edit</span>
            <span>Rename</span>
        </button>
        <button class="context-menu-item" data-action="share">
            <span class="material-symbols-rounded">share</span>
            <span>Share</span>
        </button>
        <button class="context-menu-item" data-action="delete" style="color:var(--clinical-alert)">
            <span class="material-symbols-rounded">delete</span>
            <span>Delete</span>
        </button>
    `;

    menu.querySelectorAll('.context-menu-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const chosenAction = btn.dataset.action;

            if (chosenAction === 'pin') {
                appState.conversations[chat.id].pinned = !appState.conversations[chat.id].pinned;
                commitState();
            } 
            else if (chosenAction === 'rename') {
                const updatedTitle = prompt("Update chat title tracking index:", chat.title);
                if (updatedTitle && updatedTitle.trim().length > 0) {
                    appState.conversations[chat.id].title = updatedTitle.trim();
                    commitState();
                }
            } 
            else if (chosenAction === 'share') {
                const aggregatedTranscript = chat.logs.map(l => `[${l.role.toUpperCase()}] ${l.content.replace(/<[^>]*>/g, '')}`).join('\n');
                navigator.clipboard.writeText(aggregatedTranscript)
                    .then(() => alert("Structured diagnostic chat logs copied to clipboard system layer."))
                    .catch(() => alert("Clipboard system permissions error encountered."));
            } 
            else if (chosenAction === 'delete') {
                if (confirm(`Permanently remove track "${chat.title}"?`)) {
                    delete appState.conversations[chat.id];
                    if (appState.activeChatId === chat.id) {
                        nodes.newChatTop.click();
                    } else {
                        commitState();
                    }
                }
            }
            menu.remove();
        });
    });

    document.body.appendChild(menu);
}

/* ============================================================================
   ACTIVITY LOG PANEL
   ============================================================================ */
function populateActivityLog() {
    nodes.activityLogContainer.innerHTML = '';
    if(appState.activityLog.length === 0) {
        nodes.activityLogContainer.innerHTML = `<p style="text-align:center; color:var(--text-secondary); padding-top:24px;">No records available.</p>`;
        return;
    }
    appState.activityLog.forEach((log, index) => {
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.innerHTML = `
            <div class="log-date">${log.date}</div>
            <div class="log-query">"${log.query}"</div>
            <div class="activity-actions" style="display:flex; justify-content:flex-end; margin-top:8px;">
                <button class="inline-action-btn copy-activity-btn" data-index="${index}" title="Copy" style="width:32px; height:32px;">
                    <span class="material-symbols-rounded" style="font-size:18px;">content_copy</span>
                </button>
            </div>
        `;
        nodes.activityLogContainer.appendChild(div);
    });

    nodes.activityLogContainer.querySelectorAll('.copy-activity-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            navigator.clipboard.writeText(appState.activityLog[index].query);
            
            const icon = e.currentTarget.querySelector('.material-symbols-rounded');
            icon.textContent = 'check';
            setTimeout(() => icon.textContent = 'content_copy', 2000);
        });
    });
}

/* ============================================================================
   STATE PERSISTENCE (LOCAL STORAGE)
   ============================================================================ */
function commitState() {
    localStorage.setItem('cortexa_chats', JSON.stringify(appState.conversations));
    localStorage.setItem('cortexa_activity', JSON.stringify(appState.activityLog));
    renderLedgerStack();
}

/* ============================================================================
   DOM CONTENT LOADED INITIALIZER
   ============================================================================ */
document.addEventListener('DOMContentLoaded', initializeApp);

/* ============================================================================
   GLOBAL CALCULATOR EXECUTION HELPER
   ============================================================================ */
window.runCalculator = function(calcId) {
    const allCalcs = [...(window.CALCULATORS || []), ...(window.FLUIDS || []), ...(window.LABS || [])].flatMap(c => c.items);
    const calc = allCalcs.find(c => c.id === calcId);
    if (!calc) return;

    let values = {};
    calc.fields.forEach(f => {
        const el = document.getElementById(`${f.id}_${calc.id}`);
        if (el) values[f.id] = el.value;
    });

    const result = calc.evaluate(values);
    const targetEl = document.getElementById(`calc_result_${calcId}`);
    if (targetEl) targetEl.innerHTML = result;
};

/* ============================================================================
   GROQ EXTERNAL DATA STATE REGISTRATION ADAPTER
   ============================================================================ */
window.GroqAdapter = {
    renderIncomingDrug: function(parsedPayload) {
        try {
            if (!parsedPayload.id) parsedPayload.id = 'd_ext_' + Date.now();
            
            // Register state tracking context so drugs.js can read interactively
            if (!window.drugCardStates) window.drugCardStates = {};
            if (!window.drugCardStates[parsedPayload.id]) {
                window.drugCardStates[parsedPayload.id] = {
                    history: [...(window.GLOBAL_RISK_HISTORY || [])],
                    selectedIndication: parsedPayload.indications?.[0]?.name || parsedPayload.data?.indication || '',
                    customWeight: 70
                };
            }
            
            return window.renderDrugCard(parsedPayload);
        } catch (e) {
            console.error("Groq Drug Rendering Error:", e);
            return `<div class="error-card">Failed to initialize Groq Drug UI instance.</div>`;
        }
    },

    renderIncomingCalculator: function(parsedPayload) {
        try {
            if (!parsedPayload.id) parsedPayload.id = 'calc_ext_' + Date.now();

            // Universal calculation storage initialization tracking
            if (!window.fluidCalcStates) window.fluidCalcStates = {};
            if (!window.fluidCalcStates[parsedPayload.id]) {
                window.fluidCalcStates[parsedPayload.id] = {
                    history: [...(window.GLOBAL_RISK_HISTORY || [])],
                    inputs: {}
                };
            }

            // Route execution loop securely based on available engines
            if (typeof window.renderFluidCalculator === 'function' && (parsedPayload.burnFormula || parsedPayload.type === 'fluid_management' || parsedPayload.id.startsWith('f_'))) {
                return window.renderFluidCalculator(parsedPayload);
            } else if (typeof window.renderFluidCalculator === 'function') {
                // Falls back to using the modular rendering layout matrix engine for standard calculators
                return window.renderFluidCalculator(parsedPayload);
            }
            
            return `<div class="error-card">No calculation compiler engine available.</div>`;
        } catch (e) {
            console.error("Groq Calculator Rendering Error:", e);
            return `<div class="error-card">Failed to initialize dynamic calculation engine.</div>`;
        }
    }
};
