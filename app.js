// Test için örnek veritabanı (İleride cihazın IndexedDB'sine bağlanacak)
let library = [
    { id: 1, title: "Dune", author: "Frank Herbert", status: "okundu", pages: 704, cover: "" },
    { id: 2, title: "1984", author: "George Orwell", status: "sirada", pages: 328, cover: "" },
    { id: 3, title: "Sineklerin Tanrısı", author: "William Golding", status: "okunmadi", pages: 262, cover: "" }
];

const gridContainer = document.getElementById('library-grid');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');

// Kütüphaneyi Ekrana Çizdirme Fonksiyonu
function renderLibrary(books) {
    gridContainer.innerHTML = '';
    
    books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        // Durum rengini belirle
        let badgeColor = `var(--badge-${book.status})`;
        let statusText = book.status.charAt(0).toUpperCase() + book.status.slice(1);
        if (book.status === 'okunmadi') statusText = 'Okunmadı';

        card.innerHTML = `
            <div class="book-cover"></div> <!-- İleride buraya Open Library kapak resmi gelecek -->
            <div class="book-title">${book.title}</div>
            <div class="book-author">${book.author}</div>
            <div class="status-badge" style="background-color: ${badgeColor}">${statusText}</div>
        `;
        
        gridContainer.appendChild(card);
    });
}

// Arama Motoru (Fuzzy Search Temeli)
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = library.filter(book => 
        book.title.toLowerCase().includes(term) || 
        book.author.toLowerCase().includes(term)
    );
    renderLibrary(filtered);
});

// İlk açılışta test kitaplarını göster
renderLibrary(library);
// Ekleme Butonu (FAB) ve Modal İşlemleri
const addBookBtn = document.getElementById('addBookBtn');
const addModal = document.getElementById('addModal');
const closeAddModal = document.getElementById('closeAddModal');

// + Butonuna tıklayınca menüyü aç
addBookBtn.addEventListener('click', () => {
    addModal.style.display = 'block';
});

// Çarpıya basınca kapat
closeAddModal.addEventListener('click', () => {
    addModal.style.display = 'none';
});

// Pencere dışına (boşluğa) tıklayınca kapat
window.addEventListener('click', (e) => {
    if (e.target === addModal) {
        addModal.style.display = 'none';
    }
});
