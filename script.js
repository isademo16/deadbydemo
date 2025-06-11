// Configuration
const pageSize = 20;

let allNames = [];
let filteredNames = [];
let currentPage = 1;
let sortDescending = true;

// Elements
const resultsGrid = document.getElementById("results-grid");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("search-input");
const sortButton = document.getElementById("sort-button");
const sortText = document.getElementById("sort-text");
const sortIcon = document.getElementById("sort-icon");
const searchTerm = document.getElementById("search-term");
const noResults = document.getElementById("no-results");
const loadingScreen = document.getElementById("loading-screen");
const mainApp = document.getElementById("main-app");

// Load names.txt
async function loadNames() {
    try {
        const response = await fetch("names.txt");
        const text = await response.text();
        allNames = text.split('\n').map(name => name.trim()).filter(Boolean);
        filteredNames = [...allNames];

        render();
        loadingScreen.classList.add("hidden");
        mainApp.classList.remove("hidden");
    } catch (err) {
        console.error("Error loading names.txt:", err);
    }
}

// Render names
function render() {
    // Sort
    filteredNames.sort((a, b) => sortDescending ? b.localeCompare(a) : a.localeCompare(b));

    // Pagination
    const start = (currentPage - 1) * pageSize;
    const paginated = filteredNames.slice(start, start + pageSize);

    // Clear
    resultsGrid.innerHTML = "";

    // Show/hide no results
    if (filteredNames.length === 0) {
        noResults.classList.remove("hidden");
        searchTerm.textContent = searchInput.value;
        pagination.classList.add("hidden");
    } else {
        noResults.classList.add("hidden");
        pagination.classList.remove("hidden");

        // Render cards
        paginated.forEach(name => {
            const div = document.createElement("div");
            div.className = "bg-gray-900/50 border border-purple-800/40 p-4 rounded-lg";
            div.innerHTML = `<div class="font-semibold text-purple-300 truncate">${name}</div>`;
            resultsGrid.appendChild(div);
        });
    }

    updatePagination();
    updateStats();
}

// Update pagination controls
function updatePagination() {
    pagination.innerHTML = "";
    const totalPages = Math.ceil(filteredNames.length / pageSize);

    if (totalPages <= 1) {
        pagination.classList.add("hidden");
        return;
    }

    pagination.classList.remove("hidden");

    const createBtn = (text, page, disabled = false) => {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.className = `px-3 py-1 rounded-md border border-purple-600/30 text-purple-300 bg-gray-800/40 hover:bg-purple-800/30 transition ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
        }`;
        if (!disabled) btn.onclick = () => {
            currentPage = page;
            render();
        };
        pagination.appendChild(btn);
    };

    createBtn("← Prev", currentPage - 1, currentPage === 1);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = `px-3 py-1 rounded-md border ${
            i === currentPage
                ? "bg-purple-700 text-white border-purple-600"
                : "border-purple-600/30 text-purple-300 hover:bg-purple-800/30"
        }`;
        btn.onclick = () => {
            currentPage = i;
            render();
        };
        pagination.appendChild(btn);
    }

    createBtn("Next →", currentPage + 1, currentPage === totalPages);
}

// Update stats
function updateStats() {
    document.getElementById("total-kills").textContent = allNames.length;
    document.getElementById("unique-survivors").textContent = new Set(allNames).size;

    const freq = {};
    allNames.forEach(name => freq[name] = (freq[name] || 0) + 1);
    const max = Math.max(...Object.values(freq));
    document.getElementById("most-sacrificed").textContent = max;
}

// Search
searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    filteredNames = allNames.filter(name => name.toLowerCase().includes(query));
    currentPage = 1;
    render();
});

// Sort toggle
sortButton.addEventListener("click", () => {
    sortDescending = !sortDescending;
    sortText.textContent = sortDescending ? "Most Recent" : "Alphabetical";
    render();
});

// Start
loadNames();
