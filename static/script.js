document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const fileInput = document.getElementById('csvFileInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const placeholderState = document.getElementById('placeholderState');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const resultsContainer = document.getElementById('resultsContainer');
    const fileLabel = document.querySelector('label[for="csvFileInput"]');
    
    // View Containers
    const dashboardView = document.getElementById('mainDashboardView');
    const libraryView = document.getElementById('datasetLibraryView');
    const auditView = document.getElementById('detailedAuditView');
    const historyView = document.getElementById('predictionHistoryView');
    const notificationView = document.getElementById('notificationCenterView');
    
    // Confirmation Modal Elements
    const confirmModal = document.getElementById('confirmModal');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmCancel = document.getElementById('confirmCancel');
    const confirmProceed = document.getElementById('confirmProceed');

    // Buttons
    const openLibraryBtn = document.getElementById('openLibraryBtn');
    const navLibraryBtn = document.getElementById('navLibraryBtn');
    const navHistoryBtn = document.getElementById('navHistoryBtn');
    const demoBtn = document.getElementById('demoBtn');
    const generateMoreBtn = document.getElementById('generateMoreBtn');
    const openFolderBtn = document.getElementById('openFolderBtn');
    const copyPathBtn = document.getElementById('copyPathBtn');
    
    const datasetList = document.getElementById('datasetList');
    const historyList = document.getElementById('historyList');
    const fullNotiList = document.getElementById('fullNotiList');
    let selectedFile = null;

    // --- Custom Confirmation System ---
    let pendingConfirmAction = null;

    window.showConfirmModal = function(title, message, onConfirm) {
        if (!confirmModal) return;
        confirmTitle.innerText = title;
        confirmMessage.innerText = message;
        pendingConfirmAction = onConfirm;
        confirmModal.classList.remove('hidden');
    };

    if (confirmCancel) {
        confirmCancel.addEventListener('click', () => {
            confirmModal.classList.add('hidden');
            pendingConfirmAction = null;
        });
    }

    if (confirmProceed) {
        confirmProceed.addEventListener('click', () => {
            if (pendingConfirmAction) pendingConfirmAction();
            confirmModal.classList.add('hidden');
            pendingConfirmAction = null;
        });
    }

    // --- Persistent Notification System ---
    let notifications = JSON.parse(localStorage.getItem('turbine_notifications')) || [];
    const notiBell = document.getElementById('notiBell');
    const notiDropdown = document.getElementById('notiDropdown');
    const notiList = document.getElementById('notiList');
    const notiBadge = document.getElementById('notiBadge');

    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    window.addNotification = function(message, type = 'info', targetView = null) {
        const id = Date.now();
        notifications.unshift({ id, message, type, time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString(), targetView });
        if (notifications.length > 50) notifications.pop();
        saveNotifications();
        updateNotificationUI();
        showToast(message, type);
    };

    function saveNotifications() {
        localStorage.setItem('turbine_notifications', JSON.stringify(notifications));
    }

    function updateNotificationUI() {
        if (notifications.length > 0) {
            notiBadge.classList.remove('hidden');
            notiList.innerHTML = notifications.slice(0, 5).map(n => `
                <div class="noti-item" onclick="handleNotiClick('${n.targetView}')" style="cursor: ${n.targetView ? 'pointer' : 'default'}">
                    <div class="noti-icon ${n.type}"><i class="fas ${n.type === 'success' ? 'fa-check-circle' : (n.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle')}"></i></div>
                    <div class="noti-content">
                        <p>${n.message}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <span>${n.time}</span>
                            ${n.targetView ? '<span style="color: var(--primary); font-size: 0.65rem; font-weight: 700;">CLICK TO VIEW</span>' : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            notiBadge.classList.add('hidden');
            notiList.innerHTML = '<div class="noti-empty">No new activities</div>';
        }

        if (fullNotiList) {
            if (notifications.length > 0) {
                fullNotiList.innerHTML = notifications.map(n => `
                    <div class="card" style="display: flex; align-items: center; gap: 2rem; padding: 1.5rem; margin-bottom: 1rem; cursor: ${n.targetView ? 'pointer' : 'default'}" onclick="handleNotiClick('${n.targetView}')">
                        <div class="noti-icon ${n.type}" style="width: 50px; height: 50px; font-size: 1.5rem;"><i class="fas ${n.type === 'success' ? 'fa-check-circle' : (n.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle')}"></i></div>
                        <div style="flex: 1;">
                            <h4 style="color: var(--text-main); font-size: 1.1rem; margin-bottom: 5px;">${n.message}</h4>
                            <p style="color: var(--text-muted); font-size: 0.85rem;"><i class="far fa-calendar-alt" style="margin-right: 8px;"></i>${n.date} at ${n.time}</p>
                        </div>
                        ${n.targetView ? '<div class="btn-secondary" style="font-size: 0.75rem;">View Transition <i class="fas fa-chevron-right" style="margin-left: 8px;"></i></div>' : ''}
                    </div>
                `).join('');
            } else {
                fullNotiList.innerHTML = '<div class="card" style="text-align: center; padding: 4rem; color: var(--text-muted);">No activity history found.</div>';
            }
        }
    }

    window.handleNotiClick = function(targetView) {
        if (!targetView || targetView === 'null') return;
        
        console.log("Navigating to:", targetView);
        
        // Hide all secondary views
        libraryView.classList.add('hidden');
        historyView.classList.add('hidden');
        notificationView.classList.add('hidden');
        auditView.classList.add('hidden');
        dashboardView.classList.add('hidden'); // Hide dashboard too initially
        
        let destinationName = "Dashboard";

        if (targetView === 'dashboard') {
            dashboardView.classList.remove('hidden');
            document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
            const dashPill = document.querySelector('a[href="/"].nav-pill');
            if (dashPill) dashPill.classList.add('active');
            destinationName = "Main Dashboard";
        } else if (targetView === 'library') {
            showLibrary();
            destinationName = "Dataset Library";
        } else if (targetView === 'history') {
            showHistory();
            destinationName = "Analysis History";
        }
        
        if (notiDropdown) notiDropdown.classList.add('hidden');
        showToast(`Navigated to ${destinationName}`, "success");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.clearNotifications = function() {
        notifications = [];
        saveNotifications();
        updateNotificationUI();
    };

    if (notiBell) {
        notiBell.addEventListener('click', (e) => {
            e.stopPropagation();
            notiDropdown.classList.toggle('hidden');
            if (profileDropdown) profileDropdown.classList.add('hidden');
            notiBadge.classList.add('hidden');
        });
    }

    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
            if (notiDropdown) notiDropdown.classList.add('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        if (notiDropdown && !notiDropdown.contains(e.target)) notiDropdown.classList.add('hidden');
        if (profileDropdown && !profileDropdown.contains(e.target)) profileDropdown.classList.add('hidden');
    });

    updateNotificationUI();

    // --- Welcome Notification Trigger ---
    const welcomeData = document.getElementById('welcomeData');
    if (welcomeData && welcomeData.getAttribute('data-show') === 'true') {
        const isNew = welcomeData.getAttribute('data-new') === 'true';
        const user = welcomeData.getAttribute('data-user');
        
        if (isNew) {
            addNotification(`Welcome to TurbineGuard AI, ${user}! Thank you for joining us.`, "success", "dashboard");
        } else {
            addNotification(`Welcome back, ${user}! System online and ready.`, "info", "dashboard");
        }
    }

    // --- View Switching Logic ---

    window.showLibrary = function() {
        dashboardView.classList.add('hidden'); auditView.classList.add('hidden'); historyView.classList.add('hidden'); notificationView.classList.add('hidden');
        libraryView.classList.remove('hidden');
        document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
        if (navLibraryBtn) navLibraryBtn.classList.add('active');
        loadDatasets();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.hideLibrary = function() {
        libraryView.classList.add('hidden'); dashboardView.classList.remove('hidden');
        document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
        const dashPill = document.querySelector('a[href="/"].nav-pill');
        if (dashPill) dashPill.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.showHistory = function() {
        dashboardView.classList.add('hidden'); auditView.classList.add('hidden'); libraryView.classList.add('hidden'); notificationView.classList.add('hidden');
        historyView.classList.remove('hidden');
        document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
        if (navHistoryBtn) navHistoryBtn.classList.add('active');
        loadHistory();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.hideHistory = function() {
        historyView.classList.add('hidden'); dashboardView.classList.remove('hidden');
        document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
        const dashPill = document.querySelector('a[href="/"].nav-pill');
        if (dashPill) dashPill.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.showNotifications = function() {
        dashboardView.classList.add('hidden'); auditView.classList.add('hidden'); libraryView.classList.add('hidden'); historyView.classList.add('hidden');
        notificationView.classList.remove('hidden');
        if (notiDropdown) notiDropdown.classList.add('hidden');
        updateNotificationUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.hideNotifications = function() {
        notificationView.classList.add('hidden'); dashboardView.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.showExplanation = function(type) {
        if (!window.currentInsights) { showToast("Bhai, pehle data analyze kijiye tabhi toh report khulegi!", "error"); return; }
        const title = document.getElementById('auditTitle');
        const body = document.getElementById('auditBody');
        const content = {
            smote: { title: "Data Balancing (SMOTE) Audit Report", theory: "SMOTE solves Class Imbalance by creating synthetic examples of failures.", insight: window.currentInsights.smote, impact: "High Impact" },
            xgboost: { title: "XGBoost Technical Performance Audit", theory: "XGBoost uses Gradient Boosting with sequential decision trees.", insight: window.currentInsights.xgboost, impact: "Critical Decision Maker" },
            dbscan: { title: "DBSCAN Anomaly Clustering Audit", theory: "DBSCAN identifies unknown outliers based on spatial density.", insight: window.currentInsights.dbscan, impact: "Safety Layer" }
        };
        const report = content[type];
        title.innerText = report.title;
        body.innerHTML = `<div class="report-layout"><section class="report-section"><h4>Methodology</h4><p>${report.theory}</p></section><div class="report-grid"><section class="report-section highlight-box"><h4>AI Insights</h4><p>${report.insight}</p></section><section class="report-section"><h4>Impact</h4><p>${report.impact}</p></section></div></div>`;
        dashboardView.classList.add('hidden'); libraryView.classList.add('hidden'); historyView.classList.add('hidden'); notificationView.classList.add('hidden');
        auditView.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.hideExplanation = function() { auditView.classList.add('hidden'); dashboardView.classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    // --- Event Listeners ---
    if (openLibraryBtn) openLibraryBtn.addEventListener('click', (e) => { e.preventDefault(); showLibrary(); });
    if (navLibraryBtn) navLibraryBtn.addEventListener('click', (e) => { e.preventDefault(); showLibrary(); });
    if (navHistoryBtn) navHistoryBtn.addEventListener('click', (e) => { e.preventDefault(); showHistory(); });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            fileLabel.innerHTML = `<i class="fas fa-file-csv"></i> ${selectedFile.name}`;
            analyzeBtn.disabled = false;
        }
    });

    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        addNotification("Pipeline Started: Processing sensor data...", "info", "dashboard");
        placeholderState.classList.add('hidden'); resultsContainer.classList.add('hidden');
        loadingOverlay.classList.remove('hidden'); analyzeBtn.disabled = true;
        const formData = new FormData(); formData.append('file', selectedFile);
        try {
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await response.json();
            populateDashboard(data.results);
            addNotification("Success! ML Pipeline execution completed. Record saved to history.", "success", "history");
            setTimeout(() => { loadingOverlay.classList.add('hidden'); resultsContainer.classList.remove('hidden'); analyzeBtn.disabled = false; }, 500);
        } catch (error) { loadingOverlay.classList.add('hidden'); placeholderState.classList.remove('hidden'); analyzeBtn.disabled = false; }
    });

    if (demoBtn) {
        demoBtn.addEventListener('click', async () => {
            addNotification("Running Instant Demo with pre-loaded dataset.", "info", "dashboard");
            placeholderState.classList.add('hidden'); 
            dashboardView.classList.remove('hidden');
            loadingOverlay.classList.remove('hidden');
            try {
                const response = await fetch('/api/run_dummy', { method: 'POST' });
                const data = await response.json();
                populateDashboard(data.results);
                addNotification("Demo Results: Fault detection logic applied. Check history.", "success", "history");
                setTimeout(() => { loadingOverlay.classList.add('hidden'); resultsContainer.classList.remove('hidden'); }, 500);
            } catch (error) { loadingOverlay.classList.add('hidden'); placeholderState.classList.remove('hidden'); }
        });
    }

    if (generateMoreBtn) {
        generateMoreBtn.addEventListener('click', async () => {
            generateMoreBtn.disabled = true;
            try {
                const response = await fetch('/api/generate_more', { method: 'POST' });
                const data = await response.json();
                if (data.success) { await loadDatasets(); addNotification(`New Dataset Generated: ${data.message}`, "success", "library"); }
            } catch (error) { } finally { generateMoreBtn.disabled = false; }
        });
    }

    if (openFolderBtn) openFolderBtn.addEventListener('click', () => fetch('/api/open_folder'));
    if (copyPathBtn) copyPathBtn.addEventListener('click', () => { navigator.clipboard.writeText("c:\\Users\\ps671\\Downloads\\Ankit Project\\datasets"); copyPathBtn.innerHTML = 'Path Copied!'; setTimeout(() => copyPathBtn.innerHTML = 'Copy Path', 2000); });

    // --- Helper Functions ---
    async function loadDatasets() {
        try {
            const response = await fetch('/api/datasets');
            const files = await response.json();
            datasetList.innerHTML = files.map(file => `
                <div class="dataset-item">
                    <div style="margin-bottom: 0.8rem; font-weight: 600; font-size: 0.85rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        <i class="fas fa-file-csv" style="color: var(--primary); margin-right: 0.5rem;"></i>${file}
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: auto;">
                        <button class="btn-download run-lib-btn" data-filename="${file}" style="background: var(--primary); flex: 2; font-size: 0.75rem; padding: 0.5rem;"><i class="fas fa-play"></i> Run AI</button>
                        <button class="btn-download get-file-btn" data-filename="${file}" style="background: rgba(255,255,255,0.05); flex: 1; font-size: 0.75rem; padding: 0.5rem;"><i class="fas fa-download"></i></button>
                    </div>
                </div>
            `).join('');
            document.querySelectorAll('.run-lib-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const filename = btn.getAttribute('data-filename');
                    addNotification(`Running Library Pipeline: ${filename}`, "info", "dashboard");
                    libraryView.classList.add('hidden'); 
                    dashboardView.classList.remove('hidden');
                    loadingOverlay.classList.remove('hidden');
                    placeholderState.classList.add('hidden');
                    try {
                        const response = await fetch(`/api/run_dataset/${filename}`, { method: 'POST' });
                        const data = await response.json();
                        
                        if (data.results) {
                            populateDashboard(data.results);
                            addNotification(`Success! ${filename} processed. View in History.`, "success", "history");
                            setTimeout(() => {
                                loadingOverlay.classList.add('hidden'); 
                                resultsContainer.classList.remove('hidden'); 
                                dashboardView.classList.remove('hidden');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 300);
                        } else {
                            throw new Error("Invalid results format");
                        }
                    } catch (error) { 
                        console.error("Library run error:", error);
                        loadingOverlay.classList.add('hidden'); 
                        placeholderState.classList.remove('hidden');
                        dashboardView.classList.remove('hidden'); 
                        addNotification("Error processing library dataset. Check file format.", "danger");
                    }
                });
            });
            document.querySelectorAll('.get-file-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const filename = btn.getAttribute('data-filename');
                    const response = await fetch(`/api/download_dataset/${filename}`);
                    const blob = await response.blob(); const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
                });
            });
        } catch (error) {}
    }

    async function loadHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            historyList.innerHTML = data.map(record => `
                <tr id="history-row-${record.id}" onclick="${record.has_details ? `viewHistoryRecord(${record.id})` : ''}" style="cursor: ${record.has_details ? 'pointer' : 'default'};">
                    <td><span style="color: var(--text-muted); font-size: 0.8rem;">#${record.id}</span></td>
                    <td>
                        <div style="font-weight: 600; color: var(--primary);">
                            <i class="fas fa-file-csv" style="margin-right: 8px; opacity: 0.8;"></i>${record.filename}
                        </div>
                        ${record.has_details ? 
                            '<span style="font-size: 0.65rem; color: var(--success); font-weight: 700; text-transform: uppercase;"><i class="fas fa-magic"></i> Interactive Dashboard Ready</span>' : 
                            '<span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600;"><i class="fas fa-history"></i> Summary Report (Legacy)</span>'}
                    </td>
                    <td><span class="history-accuracy">${(record.accuracy * 100).toFixed(2)}% Accuracy</span></td>
                    <td><span class="history-anomalies">${record.anomalies} Anomaly Clusters</span></td>
                    <td><span class="history-timestamp"><i class="far fa-clock" style="margin-right: 5px;"></i>${record.timestamp}</span></td>
                    <td style="text-align: center;">
                        <button onclick="deleteHistoryItem(${record.id}, event)" class="btn-secondary" style="padding: 0.4rem 0.8rem; border-color: rgba(244, 63, 94, 0.2); color: var(--danger);">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) { historyList.innerHTML = '<tr><td colspan="6">Error loading history.</td></tr>'; }
    }

    window.viewHistoryRecord = async function(id) {
        console.log("Viewing history record:", id);
        loadingOverlay.classList.remove('hidden');
        try {
            const response = await fetch(`/api/history/${id}`);
            const data = await response.json();
            if (data.success) {
                populateDashboard(data.results);
                hideHistory();
                showToast(`Restored analysis for record #${id}`, "success");
            } else {
                showToast("Bhai, ye purana record hai. Ismein detailed data nahi hai. Naye analysis try kijiye!", "warning");
            }
        } catch (error) { showToast("Could not load record", "error"); }
        finally { loadingOverlay.classList.add('hidden'); }
    };

    window.deleteHistoryItem = function(id, event) {
        if (event) event.stopPropagation();
        window.showConfirmModal("Confirm Deletion", `Bhai, kya aap sach mein record #${id} delete karna chahte hain?`, async () => {
            try {
                const response = await fetch(`/api/delete_history/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
                const data = await response.json();
                if (data.success) { showToast(`Record #${id} deleted!`, "success"); addNotification(`History Deleted: Record #${id} removed.`, "warning", "history"); loadHistory(); }
            } catch (error) { showToast("Deletion failed", "error"); }
        });
    };

    window.clearAllHistory = function() {
        window.showConfirmModal("Clear All History", "Bhai, kya aap sach mein POORI history delete karna chahte hain? Ye wapis nahi aayegi!", async () => {
            try {
                const response = await fetch('/api/clear_all_history', { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
                const data = await response.json();
                if (data.success) { showToast("History cleared!", "success"); addNotification("Database Cleared: All records removed.", "danger", "history"); loadHistory(); }
            } catch (error) { showToast("Action failed", "error"); }
        });
    };

    window.currentInsights = null;
    function populateDashboard(results) {
        if (!results) return;
        window.currentInsights = results.insights || {};
        
        if (placeholderState) placeholderState.classList.add('hidden');
        if (resultsContainer) resultsContainer.classList.remove('hidden');
        
        // Safety checks for all stats
        if (results.dataset_stats && document.getElementById('smoteStat')) {
            document.getElementById('smoteStat').innerHTML = `${results.dataset_stats.size_after_smote || 0} <span>samples (Up from ${results.dataset_stats.original_size || 0})</span>`;
        }
        
        if (results.model_performance) {
            if (document.getElementById('xgbStat')) document.getElementById('xgbStat').innerText = `${((results.model_performance.xgboost || 0) * 100).toFixed(2)}%`;
            if (document.getElementById('barXgb')) document.getElementById('barXgb').style.width = `${(results.model_performance.xgboost || 0) * 100}%`;
            if (document.getElementById('valXgb')) document.getElementById('valXgb').innerText = `${((results.model_performance.xgboost || 0) * 100).toFixed(2)}%`;
            
            if (document.getElementById('barRidge')) document.getElementById('barRidge').style.width = `${(results.model_performance.ridge_regression || 0) * 100}%`;
            if (document.getElementById('valRidge')) document.getElementById('valRidge').innerText = `${((results.model_performance.ridge_regression || 0) * 100).toFixed(2)}%`;
            
            if (document.getElementById('barPerceptron')) document.getElementById('barPerceptron').style.width = `${(results.model_performance.perceptron || 0) * 100}%`;
            if (document.getElementById('valPerceptron')) document.getElementById('valPerceptron').innerText = `${((results.model_performance.perceptron || 0) * 100).toFixed(2)}%`;
        }
        
        if (document.getElementById('dbscanStat')) {
            document.getElementById('dbscanStat').innerText = `${results.dbscan_anomalies || 0} Anomalies Detected`;
        }
        
        if (results.time_series_data) renderVibrationChart(results.time_series_data); 
        if (results.tree_features) renderFeatureChart(results.tree_features);
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div'); toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}" style="margin-right: 10px;"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 5000);
    }

    let vibChartInstance = null;
    function renderVibrationChart(timeSeriesData) {
        const ctx = document.getElementById('vibrationChart').getContext('2d');
        if (vibChartInstance) vibChartInstance.destroy();
        vibChartInstance = new Chart(ctx, { type: 'line', data: { labels: timeSeriesData.map(d => d.time), datasets: [{ label: 'Vibration Amplitude (mm/s)', data: timeSeriesData.map(d => d.vibration), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', pointBackgroundColor: timeSeriesData.map(d => d.anomaly ? '#ef4444' : '#3b82f6'), pointRadius: timeSeriesData.map(d => d.anomaly ? 6 : 3), fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } } } } });
    }

    let featChartInstance = null;
    function renderFeatureChart(features) {
        const ctx = document.getElementById('featureChart').getContext('2d');
        if (featChartInstance) featChartInstance.destroy();
        features.sort((a, b) => b.importance - a.importance);
        featChartInstance = new Chart(ctx, { type: 'bar', data: { labels: features.map(f => f.name), datasets: [{ label: 'Feature Importance (%)', data: features.map(f => f.importance * 100), backgroundColor: 'rgba(59, 130, 246, 0.8)', borderRadius: 4 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }, y: { grid: { display: false }, ticks: { color: '#94a3b8' } } } } });
    }
});
