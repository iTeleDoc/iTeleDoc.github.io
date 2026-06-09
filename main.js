/**
 * Cortexa AI — Gemini UI Performance Orchestrator
 * System Core Architecture
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
        historyCollapsed: false,
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
    }

    function loadLocalStorageCache() {
        const cachedTheme = localStorage.getItem('ctx_theme');
        if (cachedTheme) SystemState.theme = cachedTheme;
    
        const cachedKey = localStorage.getItem('ctx_api_gateway_key');
        if (cachedKey) SystemState.groqKey = cachedKey;
    
        const cachedThreads = localStorage.getItem('ctx_saved_threads');
        if (cachedThreads) {
            SystemState.threads = JSON.parse(cachedThreads);
        } else {
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
        localStorage.setItem('ctx_saved_threads', JSON.stringify(SystemState.threads));
    }

    // ==========================================
    // 3. UI VIEWPORT ROUTER MATRIX
    // ==========================================
    function routeWorkspaceView(panelId) {
        SystemState.activeViewPanelId = panelId;
        
        document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById('sidebarSearchNavBtn').classList.remove('active');
        document.getElementById('libraryNavBtn').classList.remove('active');

        const activePanel = document.getElementById(panelId);
        if (activePanel) activePanel.classList.remove('hidden');

        const deck = document.getElementById('globalInputDeck');
        if (panelId === 'searchWorkspaceScreen' || panelId === 'libraryWorkspaceScreen') {
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
            document.getElementById('settingsModal').classList.add('hidden');
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
    
        document.getElementById('settingsToggleBtn').addEventListener('click', () => {
            document.getElementById('groqKeyField').value = SystemState.groqKey;
            document.getElementById('settingsModal').classList.remove('hidden');
            document.getElementById('sidebarOverlay').classList.add('active');
            closeMobileSidebarIfOpen(); 
        });
    
        document.getElementById('closeSettingsModalBtn').addEventListener('click', () => {
            SystemState.groqKey = document.getElementById('groqKeyField').value.trim();
            localStorage.setItem('ctx_api_gateway_key', SystemState.groqKey);
            document.getElementById('settingsModal').classList.add('hidden');
            document.getElementById('sidebarOverlay').classList.remove('active');
        });
    
        document.getElementById('flushMemoryBtn').addEventListener('click', () => {
            localStorage.clear(); location.reload();
        });
    
        document.addEventListener('click', () => document.getElementById('chatContextMenu').classList.add('hidden'));
    
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
        const val = document.getElementById('chatInputPayload').value.trim();
        document.getElementById('submitPromptBtn').disabled = (val.length === 0);
    }

    // ==========================================
    // 5. INTUATIVE INFERENCE MATCHING ENGINE
    // ==========================================
    async function dispatchInferenceSequence() {
        const area = document.getElementById('chatInputPayload');
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
            <div class="avatar-container ai"><span class="material-symbols-rounded">clinical_notes</span></div>
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
                <div class="clinical-card-header"><div class="clinical-card-title"><span class="material-symbols-rounded" style="color:var(--clinical-warning)">cloud_off</span><span>Groq Pipeline Gateway Unbound</span></div></div>
                <p class="clinical-text-block">No entry exists in localized local data files. Link your custom Groq API infrastructure authorization parameter keys inside standard <b>Settings</b> panel sheets to initialize downstream LLM inference layers mapping this layout.</p>
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
                              model.id?.startsWith('calc_parkland') || 
                              model.origin === 'drugs.js' || 
                              model.origin === 'fluids.js';

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
        if (!SystemState.activeThreadId || !SystemState.threads[SystemState.activeThreadId].messages.length) return;
    
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
                trackingHTML += `
                    <div class="chat-row">
                        <div class="avatar-container ai"><span class="material-symbols-rounded">clinical_notes</span></div>
                        <div class="bubble-content">${msg.text}</div>
                    </div>
                `;
            }
        });
    
        stream.innerHTML = trackingHTML;
        scrollViewportToBottom();
    }

    // ==========================================
    // MESSAGE ACTION UTILITIES (EDIT / COPY)
    // ==========================================

    window.copyMessageText = function(idx, btnElement) {
        const msg = SystemState.threads[SystemState.activeThreadId].messages[idx];
        if (!msg) return;

        navigator.clipboard.writeText(msg.text).then(() => {
            const icon = btnElement.querySelector('span');
            icon.textContent = 'check';
            btnElement.classList.add('action-success'); // Flashes white
            
            setTimeout(() => {
                icon.textContent = 'content_copy';
                btnElement.classList.remove('action-success');
            }, 2000);
        });
    };

    window.enableMessageEditMode = function(idx) {
        const msg = SystemState.threads[SystemState.activeThreadId].messages[idx];
        if (!msg) return;

        const row = document.getElementById(`msg-row-${idx}`);
        const wrapper = row.querySelector('.user-message-wrapper');

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
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length; // Move cursor to end
    };

    window.cancelMessageEditMode = function() {
        renderActiveChatMessageStreams(); // Flushes the edit UI and restores the original bubble
    };

    window.commitMessageEdit = async function(idx) {
        const newText = document.getElementById(`edit-textarea-${idx}`).value.trim();
        if (!newText) return window.cancelMessageEditMode();

        const activeThread = SystemState.threads[SystemState.activeThreadId];
        
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
        stream.appendChild(loader);
        scrollViewportToBottom();

        try {
            const systemResolutionOutput = await processClinicalInferenceResolution(newText);
            if (stream.contains(loader)) stream.removeChild(loader);

            activeThread.messages.push({ sender: 'ai', text: systemResolutionOutput });
            persistThreadsToStorage(); 
            renderActiveChatMessageStreams();
        } catch (err) {
            if (stream.contains(loader)) stream.removeChild(loader);
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
        <!-- Matching SVG to your New Chat button -->
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
            row.querySelector('.history-item').addEventListener('click', () => {
                SystemState.activeThreadId = id;
                renderThreadSidebarHistory();
                routeWorkspaceView('chatFeedScreen');
                renderActiveChatMessageStreams();
            });
            row.querySelector('.item-action-trigger-btn').addEventListener('click', (e) => {
                e.stopPropagation(); e.preventDefault();
                SystemState.selectedContextMenuThreadId = id;
                triggerFloatingActionContextMenu(e);
            });
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
                const bodyLayer = parentElementNode.querySelector('.accordion-body-expansion-layer');
                const contentContainer = parentElementNode.querySelector('.accordion-expansion-content');
                
                const standsExpanded = parentElementNode.classList.contains('expanded');
                
                // Collapse all open alternative elements to conserve performance allocations
                stack.querySelectorAll('.accordion-element-node').forEach(el => {
                    el.classList.remove('expanded');
                    el.querySelector('.accordion-body-expansion-layer').style.maxHeight = null;
                });

                if (!standsExpanded) {
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
        const iconNode = el.querySelector('[data-action="pin"] span:first-child');
        
        if (dataRef && labelNode) {
            // Update the context menu option to match the thread's pin state
            if (dataRef.pinned) {
                labelNode.textContent = 'Unpin';
                if (iconNode) iconNode.textContent = 'keep_off';
            } else {
                labelNode.textContent = 'Pin';
                if (iconNode) iconNode.textContent = 'push_pin';
            }
        }

        // Position the floating menu correctly next to the click location
        el.style.left = `${event.clientX}px`;
        el.style.top = `${event.clientY}px`;
        el.classList.remove('hidden');

        // Setup the option action listeners inside the popup
        el.querySelectorAll('.context-action-item').forEach(btn => {
            // Clone the button to remove any old click listeners safely
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = newBtn.getAttribute('data-action');
                executeContextMenuAction(action);
                el.classList.add('hidden');
            });
        });
    }

    function executeContextMenuAction(action) {
        const id = SystemState.selectedContextMenuThreadId;
        if (!id || !SystemState.threads[id]) return;

        if (action === 'pin') {
            SystemState.threads[id].pinned = !SystemState.threads[id].pinned;
            persistThreadsToStorage();
            renderThreadSidebarHistory();
        } else if (action === 'rename') {
            const currentLabel = SystemState.threads[id].label;
            const newLabel = prompt("Enter a new title for this conversation:", currentLabel);
            if (newLabel && newLabel.trim()) {
                SystemState.threads[id].label = newLabel.trim();
                persistThreadsToStorage();
                renderThreadSidebarHistory();
            }
        } else if (action === 'delete') {
            if (confirm("Are you sure you want to delete this chat thread?")) {
                delete SystemState.threads[id];
                if (SystemState.activeThreadId === id) {
                    SystemState.activeThreadId = null;
                    routeWorkspaceView('zeroStateScreen');
                }
                persistThreadsToStorage();
                renderThreadSidebarHistory();
            }
        }
    }

    function scrollViewportToBottom() {
        const viewport = document.getElementById('contentViewport');
        if (viewport) {
            // Smoothly push layout calculations to the bottom of the feed frame
            setTimeout(() => {
                viewport.scrollTo({
                    top: viewport.scrollHeight,
                    behavior: 'smooth'
                });
            }, 50);
        }
    }

    function escapeHTMLString(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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

    window.addEventListener('DOMContentLoaded', initializeCortexaSystem);
})();
