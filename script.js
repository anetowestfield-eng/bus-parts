let allParts = [];
let filteredParts = []; 
let currentCategory = 'All';
let currentSort = { column: 'partNumber', direction: 'asc' };
let displayLimit = 100;
let zoomLevel = Number(localStorage.getItem('zoomLevel'));
if (isNaN(zoomLevel)) zoomLevel = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('#btnTheme i').classList.replace('fa-sun', 'fa-moon');
    }
    applyZoom();

    fetch('parts.json')
        .then(res => res.json())
        .then(data => {
            allParts = data;
            // Simple Counter Update
            document.getElementById('total-count').innerText = allParts.length.toLocaleString();
            applyFiltersAndSort();
        });

    setupEventListeners();
});

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
    const emptyState = document.getElementById('noResults');
    const tableEl = document.querySelector('.parts-table');
    
    // Empty State Logic
    if (filteredParts.length === 0) {
        tableEl.style.display = 'none';
        emptyState.style.display = 'block';
        loadBtn.style.display = 'none';
        document.getElementById('showing-count').innerText = "0";
        return;
    } else {
        tableEl.style.display = 'table';
        emptyState.style.display = 'none';
    }

    const dataToShow = filteredParts.slice(0, displayLimit);
    document.getElementById('showing-count').innerText = `${dataToShow.length} of ${filteredParts.length}`;
    tbody.innerHTML = '';

    dataToShow.forEach(p => {
        const googleUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(p.description + ' ' + p.partNumber)}`;
        
        const row = `
            <tr>
                <td class="col-img" data-label="Image">
                    <a href="${googleUrl}" target="_blank" class="img-link" title="Search Image on Google">
                        <i class="fa-solid fa-image"></i>
                    </a>
                </td>
                
                <td data-label="Category"><span class="badge-cat ${p.category.replace(' ', '-').toLowerCase()}">${p.category}</span></td>
                
                <td data-label="Short Desc" style="font-weight:600; color:var(--text-primary);">${p.shortDescription}</td>
                
                <td data-label="Full Desc" class="col-desc" style="color:var(--text-secondary); font-size:0.85rem;">${p.description}</td>
                
                <td data-label="Part Number">
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
        th.querySelector('i').className = 'fa-solid fa-sort';
    });
    const activeHeader = document.querySelector(`.sortable[data-sort="${currentSort.column}"]`);
    if (activeHeader) {
        const icon = activeHeader.querySelector('i');
        if (currentSort.direction === 'asc') {
            activeHeader.classList.add('active-asc');
            icon.classList.remove('fa-sort');
            icon.classList.add('fa-sort-up');
        } else {
            activeHeader.classList.add('active-desc');
            icon.classList.remove('fa-sort');
            icon.classList.add('fa-sort-down');
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