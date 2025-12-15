let allParts = [];
let currentCategory = 'All';
let currentSort = { column: 'partNumber', direction: 'asc' };

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('#btnTheme i').classList.replace('fa-sun', 'fa-moon');
    }
    if (localStorage.getItem('zoom') === 'active') document.body.classList.add('zoomed');

    fetch('parts.json')
        .then(res => res.json())
        .then(data => {
            allParts = data;
            document.getElementById('total-count').innerText = allParts.length.toLocaleString();
            renderTable(getFilteredAndSortedData());
        });

    setupEventListeners();
});

function getFilteredAndSortedData() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = allParts.filter(p => {
        const matchesSearch = (
            p.partNumber.toLowerCase().includes(search) || 
            p.description.toLowerCase().includes(search) ||
            p.shortDescription.toLowerCase().includes(search)
        );
        const matchesCat = currentCategory === 'All' || p.category === currentCategory;
        return matchesSearch && matchesCat;
    });

    filtered.sort((a, b) => {
        let valA = a[currentSort.column].toString().toLowerCase();
        let valB = b[currentSort.column].toString().toLowerCase();
        
        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return filtered;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById("copyToast");
        toast.className = "show";
        setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 2000);
    });
}

function renderTable(parts) {
    const tbody = document.getElementById('tableBody');
    document.getElementById('showing-count').innerText = parts.length.toLocaleString();
    tbody.innerHTML = '';

    parts.slice(0, 100).forEach(p => {
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

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('keyup', () => {
        renderTable(getFilteredAndSortedData());
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
            updateSortIcons();
            renderTable(getFilteredAndSortedData());
        });
    });

    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.getAttribute('data-cat');
            renderTable(getFilteredAndSortedData());
        });
    });

    document.getElementById('btnZoom').addEventListener('click', () => {
        const isZoomed = document.body.classList.toggle('zoomed');
        localStorage.setItem('zoom', isZoomed ? 'active' : 'inactive');
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