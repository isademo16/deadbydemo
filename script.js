// Global variables
let players = [];
let filteredPlayers = [];
let currentPage = 1;
let sortBySacrificed = false; // Default to most recent (false)
const rowsPerPage = 20;

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const mainApp = document.getElementById('main-app');
const searchInput = document.getElementById('search-input');
const sortButton = document.getElementById('sort-button');
const sortText = document.getElementById('sort-text');
const sortIcon = document.getElementById('sort-icon');
const resultsGrid = document.getElementById('results-grid');
const pagination = document.getElementById('pagination');
const noResults = document.getElementById('no-results');
const searchTerm = document.getElementById('search-term');
const totalKillsEl = document.getElementById('total-kills');
const uniqueSurvivorsEl = document.getElementById('unique-survivors');
const mostSacrificedEl = document.getElementById('most-sacrificed');

// Initialize the app
async function init() {
    try {
        await loadNamesFromFile();
        updateStats();
        filterAndRender();
        
        // Hide loading screen and show main app
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
        }, 1000);
    } catch (error) {
        console.error('Error initializing app:', error);
        // Show main app even if names can't be loaded
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
        }, 1000);
    }
}

// Load names from names.txt file
async function loadNamesFromFile() {
    try {
        const response = await fetch('./names.txt');
        const text = await response.text();
        const names = text.split('\n').filter(name => name.trim() !== '');
        
        // Count occurrences of each name
        const nameCount = {};
        names.forEach(name => {
            const trimmedName = name.trim();
            if (trimmedName) {
                nameCount[trimmedName] = (nameCount[trimmedName] || 0) + 1;
            }
        });

        // Convert to Player array
        players = Object.entries(nameCount).map(([name, count]) => ({
            name,
            count
        }));

        console.log('Loaded players:', players);
    } catch (error) {
        console.error('Error loading names from file:', error);
        players = [];
    }
}

// Update statistics
function updateStats() {
    const totalKills = players.reduce((sum, player) => sum + player.count, 0);
    const uniqueSurvivors = players.length;
    const topPlayer = players.length > 0 ? [...players].sort((a, b) => b.count - a.count)[0] : null;
    
    totalKillsEl.textContent = totalKills;
    uniqueSurvivorsEl.textContent = uniqueSurvivors;
    mostSacrificedEl.textContent = topPlayer ? topPlayer.count : 0;
}

// Filter and render players
function filterAndRender() {
    const searchQuery = searchInput.value.toLowerCase();
    
    // Filter players
    filteredPlayers = players.filter(player =>
        player.name.toLowerCase().includes(searchQuery)
    );

    // Sort players - default to most recent (original order), or by most sacrificed
    if (sortBySacrificed) {
        filteredPlayers.sort((a, b) => b.count - a.count);
    } else {
        filteredPlayers = filteredPlayers.slice(); // preserve original order
    }

    // Reset to first page when filtering
    if (searchQuery !== searchInput.dataset.lastQuery) {
        currentPage = 1;
        searchInput.dataset.lastQuery = searchQuery;
    }

    renderPlayers();
    renderPagination();
    updateNoResults(searchQuery);
}

// Render players
function renderPlayers() {
    const start = (currentPage - 1) * rowsPerPage;
    const paginatedPlayers = filteredPlayers.slice(start, start + rowsPerPage);

    resultsGrid.innerHTML = '';

    paginatedPlayers.forEach((player) => {
        const playerCard = createPlayerCard(player);
        resultsGrid.appendChild(playerCard);
    });
}

// Create player card
function createPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'bg-gray-800/30 border border-gray-700/50 hover:border-purple-600/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 rounded-lg p-4';
    
    let badgeColor;
    if (player.count >= 8) {
        badgeColor = 'bg-red-950/50 text-red-300 border-red-800/50';
    } else if (player.count >= 4) {
        badgeColor = 'bg-orange-950/50 text-orange-300 border-orange-800/50';
    } else {
        badgeColor = 'bg-gray-700/50 text-gray-300 border-gray-600/50';
    }

    card.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-white truncate">${escapeHtml(player.name)}</h3>
                <div class="h-4"></div> <!-- empty line for spacing -->
            </div>
            <span class="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${badgeColor}">
                ${player.count}x
            </span>
        </div>
    `;

    return card;
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredPlayers.length / rowsPerPage);
    
    if (totalPages <= 1) {
        pagination.classList.add('hidden');
        return;
    }

    pagination.classList.remove('hidden');
    pagination.innerHTML = '';

    // Previous 10 button
    const prev10Btn = createPaginationButton('<< 10', currentPage > 10, () => changePage(currentPage - 10));
    pagination.appendChild(prev10Btn);

    // Previous button
    const prevBtn = createPaginationButton('Previous', currentPage > 1, () => changePage(currentPage - 1));
    pagination.appendChild(prevBtn);

    // Page info (clickable)
    const pageInfo = document.createElement('button');
    pageInfo.className = 'px-4 py-2 text-purple-300 font-medium hover:text-purple-200 transition-colors';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pageInfo.onclick = () => showPageInput(totalPages);
    pagination.appendChild(pageInfo);

    // Next button
    const nextBtn = createPaginationButton('Next', currentPage < totalPages, () => changePage(currentPage + 1));
    pagination.appendChild(nextBtn);

    // Next 10 button
    const next10Btn = createPaginationButton('10 >>', currentPage + 10 <= totalPages, () => changePage(currentPage + 10));
    pagination.appendChild(next10Btn);
}

// Create pagination button
function createPaginationButton(text, enabled, onClick) {
    const button = document.createElement('button');
    button.className = `bg-gray-800/50 border border-gray-600/50 text-gray-300 hover:bg-gray-700/50 px-3 py-1 text-sm rounded transition-colors ${!enabled ? 'opacity-50 cursor-not-allowed' : ''}`;
    button.textContent = text;
    button.disabled = !enabled;
    if (enabled) {
        button.onclick = onClick;
    }
    return button;
}

// Show page input
function showPageInput(totalPages) {
    const pageInfo = pagination.children[2];
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = totalPages;
    input.value = currentPage;
    input.className = 'page-input';
    
    const originalText = pageInfo.textContent;
    pageInfo.textContent = '';
    pageInfo.appendChild(input);
    
    input.focus();
    input.select();
    
    const handleSubmit = () => {
        const newPage = parseInt(input.value);
        if (newPage >= 1 && newPage <= totalPages) {
            changePage(newPage);
        } else {
            pageInfo.textContent = originalText;
        }
    };
    
    const handleCancel = () => {
        pageInfo.textContent = originalText;
    };
    
    input.onblur = handleCancel;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredPlayers.length / rowsPerPage);
    currentPage = Math.max(1, Math.min(page, totalPages));
    renderPlayers();
    renderPagination();
}

// Update no results display
function updateNoResults(searchQuery) {
    if (filteredPlayers.length === 0 && searchQuery) {
        searchTerm.textContent = searchQuery;
        noResults.classList.remove('hidden');
        resultsGrid.classList.add('hidden');
        pagination.classList.add('hidden');
    } else {
        noResults.classList.add('hidden');
        resultsGrid.classList.remove('hidden');
    }
}

// Toggle sort
function toggleSort() {
    sortBySacrificed = !sortBySacrificed;
    
    if (sortBySacrificed) {
        sortText.textContent = 'Most Sacrificed';
        sortIcon.innerHTML = '<polyline points="6,9 12,15 18,9"></polyline>';
    } else {
        sortText.textContent = 'Most Recent';
        sortIcon.innerHTML = '<polyline points="18,15 12,9 6,15"></polyline>';
    }
    
    filterAndRender();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listeners
searchInput.addEventListener('input', filterAndRender);
sortButton.addEventListener('click', toggleSort);

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', init);
