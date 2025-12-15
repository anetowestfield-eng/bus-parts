let allParts = [];
let filteredParts = []; 
let currentCategory = 'All';
let currentSort = { column: 'partNumber', direction: 'asc' };
let displayLimit = 100;
let zoomLevel = Number(localStorage.getItem('zoomLevel'));
if (isNaN(zoomLevel)) zoomLevel = 0;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('#btnTheme i').classList.replace('fa-sun', 'fa-moon');
    }
    
    // 2. Apply Initial Zoom
    applyZoom();

    // 3. Fetch Data
    fetch('parts.json')
        .then(res => res.json())
        .then(data => {
            allParts = data;
            // Removed the line updating total-count
            applyFiltersAndSort();
        });

    setupEventListeners();
});

// --- CORE FUNCTIONS ---

function applyFiltersAndSort() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    filteredParts = allParts.filter(p => {
        const matchesSearch = (
            p.partNumber.toLowerCase().includes(search) || 
            p.description.toLowerCase().includes(search) ||
            p.shortDescription.toLowerCase().includes(search)
        );
        const matchesCat = currentCategory === 'All' || p.category === currentCategory;
        return matchesSearch && matchesCat;
    });

    filteredParts.sort((a, b) => {
        let valA = a[currentSort.column].toString().toLowerCase();
        let valB = b[currentSort.column].toString().toLowerCase();
        
        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    const loadBtn = document.getElementById('btnLoadMore');
    
    const dataToShow = filteredParts.slice(0, displayLimit);
    
    document.getElementById('showing-count').innerText = `${dataToShow.length} of ${filteredParts.length}`;
    tbody.innerHTML = '';

    dataToShow.forEach(p => {
        const googleUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(p.description + ' ' + p.partNumber)}`;
        
        const row = `
            <tr>
                <td class="col-img">
                    <a href="${googleUrl}" target="_blank" class="img-link" title="Search Image on Google">
                        <i class="fa-solid fa-image"></i>
                    </a>
                </td>
                
                <td><span class="badge-cat ${p.category.replace(' ', '-').toLowerCase()}">${p.category}</span></td>
                
                <td style="font-weight:600; color:var(--text-primary); white-space:nowrap;">${p.shortDescription}</td>
                
                <td class="col-desc" style="color:var(--text-secondary); font-size:0.85rem;">${p.description}</td>
                
                <td>
                    <span class="part-btn" onclick="copyToClipboard('${p.partNumber}')" title="Click to Copy">
                        ${p.partNumber}
                    </span>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    if (displayLimit >= filteredParts.length) {
        loadBtn.style.display = 'none';
    } else {
        loadBtn.style.display = 'inline-block';
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById("copyToast");
        toast.className = "show";
        setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 2000);
    });
}

function updateSortIcons() {
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('active-asc', 'active-desc');
        th.querySelector('i').className = 'fa-solid fa-sort sort-icon';
    });

    const activeHeader = document.querySelector(`.sortable[data-sort="${currentSort.column}"]`);
    if (activeHeader) {
        if (currentSort.direction === 'asc') {
            activeHeader.classList.add('active-asc');
            activeHeader.querySelector('i').className = 'fa-solid fa-sort-up sort-icon';
        } else {
            activeHeader.classList.add('active-desc');
            activeHeader.querySelector('i').className = 'fa-solid fa-sort-down sort-icon';
        }
    }
}

function applyZoom() {
    const htmlRoot = document.documentElement;
    htmlRoot.classList.remove('zoom-medium', 'zoom-large');
    
    if (zoomLevel === 1) htmlRoot.classList.add('zoom-medium');
    if (zoomLevel === 2) htmlRoot.classList.add('zoom-large');
    
    localStorage.setItem('zoomLevel', zoomLevel);
}

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('keyup', () => {
        displayLimit = 100;
        applyFiltersAndSort();
    });

    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }
            displayLimit = 100;
            updateSortIcons();
            applyFiltersAndSort();
        });
    });

    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.getAttribute('data-cat');
            displayLimit = 100;
            applyFiltersAndSort();
        });
    });

    document.getElementById('btnLoadMore').addEventListener('click', () => {
        displayLimit += 100;
        renderTable();
    });

    document.getElementById('btnZoom').addEventListener('click', () => {
        zoomLevel = (zoomLevel + 1) % 3; 
        applyZoom();
    });

    document.getElementById('btnTheme').addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        const icon = document.querySelector('#btnTheme i');
        if (isDark) {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'light');
        }
    });
}