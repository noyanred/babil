let library = [
    { id: 1, title: "Dune", author: "Frank Herbert", publisher: "İthaki", status: "okundu", year: 1965, lang: "tur", cover: "https://covers.openlibrary.org/b/id/10543665-M.jpg" }
];

const gridContainer = document.getElementById('library-grid');
let currentActiveBookId = null; 
let editingBookId = null; // Düzenleme modunda mıyız kontrolü

function renderLibrary(books) {
    gridContainer.innerHTML = '';
    books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        let badgeColor = `var(--badge-${book.status})`;
        let statusText = book.status === 'okunmadi' ? 'Okunmadı' : book.status.charAt(0).toUpperCase() + book.status.slice(1);
        
        let coverImg = book.cover ? `<img src="${book.cover}" class="book-cover">` : `<div class="book-cover" style="display:flex; align-items:center; justify-content:center; font-size:10px;">Görsel Yok</div>`;

        card.innerHTML = `
            ${coverImg}
            <div class="book-title">${book.title}</div>
            <div class="book-author">${book.author}</div>
            <div class="status-badge" style="background-color: ${badgeColor}">${statusText}</div>
        `;
        card.addEventListener('click', () => openBookDetails(book));
        gridContainer.appendChild(card);
    });
}

// --- KİTAP DETAY, DURUM VE SİL ---
const bookModal = document.getElementById('bookModal');
function openBookDetails(book) {
    currentActiveBookId = book.id;
    document.getElementById('modalTitle').innerText = book.title;
    document.getElementById('modalAuthor').innerText = book.author || "Bilinmiyor";
    document.getElementById('modalPublisher').innerText = book.publisher || "Bilinmiyor";
    document.getElementById('modalYear').innerText = book.year || "Bilinmiyor";
    document.getElementById('modalLang').innerText = book.lang ? book.lang.toUpperCase() : "Bilinmiyor";
    document.getElementById('modalCover').src = book.cover || "";
    
    let badgeColor = `var(--badge-${book.status})`;
    let statusText = book.status === 'okunmadi' ? 'Okunmadı' : book.status.charAt(0).toUpperCase() + book.status.slice(1);
    const statusBadge = document.getElementById('modalStatus');
    statusBadge.innerText = statusText;
    statusBadge.style.backgroundColor = badgeColor;

    document.getElementById('editStatusSelect').value = book.status;
    bookModal.style.display = 'block';
}

document.getElementById('closeModal').addEventListener('click', () => bookModal.style.display = 'none');

document.getElementById('updateStatusBtn').addEventListener('click', () => {
    const newStatus = document.getElementById('editStatusSelect').value;
    const bookIndex = library.findIndex(b => b.id === currentActiveBookId);
    if(bookIndex !== -1) {
        library[bookIndex].status = newStatus;
        renderLibrary(library);
        bookModal.style.display = 'none';
    }
});

document.getElementById('deleteBookBtn').addEventListener('click', () => {
    library = library.filter(b => b.id !== currentActiveBookId);
    renderLibrary(library);
    bookModal.style.display = 'none';
});

// --- GELİŞMİŞ ARAMA VE DÜZENLEME (API) ---
const searchModal = document.getElementById('searchModal');
const apiResultsDiv = document.getElementById('apiResults');
const loadingText = document.getElementById('loadingText');
const manualSaveBtn = document.getElementById('manualSaveBtn');

// Yeni Ekleme Modunda Aç
document.getElementById('manualAddBtn').addEventListener('click', () => {
    document.getElementById('addModal').style.display = 'none';
    editingBookId = null; 
    document.getElementById('searchModalTitle').innerText = "Yeni Kitap Ara / Ekle";
    document.getElementById('advancedSearchForm').reset();
    manualSaveBtn.style.display = 'none';
    document.getElementById('searchApiBtn').innerText = "Dünya Veritabanında Ara";
    apiResultsDiv.innerHTML = '';
    searchModal.style.display = 'block';
});

// Düzenleme Modunda Aç
document.getElementById('editBookBtn').addEventListener('click', () => {
    bookModal.style.display = 'none';
    editingBookId = currentActiveBookId;
    const book = library.find(b => b.id === currentActiveBookId);
    
    document.getElementById('searchModalTitle').innerText = "Kitap Bilgilerini Düzenle";
    document.getElementById('sTitle').value = book.title;
    document.getElementById('sAuthor').value = book.author || "";
    document.getElementById('sPublisher').value = book.publisher || "";
    document.getElementById('sYear').value = book.year || "";
    
    manualSaveBtn.style.display = 'block';
    document.getElementById('searchApiBtn').innerText = "Bu Bilgilerle API'den Doğrusunu Bul";
    apiResultsDiv.innerHTML = '';
    searchModal.style.display = 'block';
});

document.getElementById('closeSearchModal').addEventListener('click', () => searchModal.style.display = 'none');

// Manuel Olarak Formdaki Bilgileri Kaydet (API'siz)
manualSaveBtn.addEventListener('click', () => {
    if(editingBookId) {
        const bookIndex = library.findIndex(b => b.id === editingBookId);
        if(bookIndex !== -1) {
            library[bookIndex].title = document.getElementById('sTitle').value;
            library[bookIndex].author = document.getElementById('sAuthor').value;
            library[bookIndex].publisher = document.getElementById('sPublisher').value;
            library[bookIndex].year = document.getElementById('sYear').value;
            renderLibrary(library);
            searchModal.style.display = 'none';
        }
    }
});

// API Üzerinden Arama
document.getElementById('advancedSearchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const t = document.getElementById('sTitle').value.trim();
    const a = document.getElementById('sAuthor').value.trim();
    const p = document.getElementById('sPublisher').value.trim();
    const y = document.getElementById('sYear').value.trim();

    loadingText.style.display = 'block';
    apiResultsDiv.innerHTML = '';

    let queryUrl = `https://openlibrary.org/search.json?`;
    let params = [];
    if(t) params.push(`title=${encodeURIComponent(t)}`);
    if(a) params.push(`author=${encodeURIComponent(a)}`);
    if(p) params.push(`publisher=${encodeURIComponent(p)}`);
    if(y) params.push(`first_publish_year=${encodeURIComponent(y)}`);

    // Sadece başlık girildiyse geniş arama yap (barkod okumalarında daha iyi sonuç verir)
    if (params.length === 1 && t) {
        queryUrl += `q=${encodeURIComponent(t)}&limit=10`;
    } else {
        queryUrl += params.join('&') + `&limit=10`;
    }

    try {
        const response = await fetch(queryUrl);
        const data = await response.json();
        loadingText.style.display = 'none';

        if(data.docs.length === 0) {
            apiResultsDiv.innerHTML = '<p>Sonuç bulunamadı. Lütfen filtreleri azaltarak veya yazar adıyla aramayı deneyin.</p>';
            return;
        }

        data.docs.forEach(doc => {
            const title = doc.title;
            const author = doc.author_name ? doc.author_name[0] : "";
            const publisher = doc.publisher ? doc.publisher[0] : "";
            const year = doc.first_publish_year || "";
            const lang = doc.language ? doc.language[0] : "";
            const coverId = doc.cover_i;
            const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "";

            const resultDiv = document.createElement('div');
            resultDiv.style.border = "1px solid var(--border-color)";
            resultDiv.style.padding = "10px";
            resultDiv.style.borderRadius = "8px";
            resultDiv.innerHTML = `
                <div style="font-weight:bold; font-size:14px;">${title}</div>
                <div style="font-size:12px; opacity:0.8; margin-bottom:5px;">Yazar: ${author} | Yayınevi: ${publisher} | Yıl: ${year} | Dil: ${lang.toUpperCase()}</div>
                <button class="action-btn" style="padding:8px; font-size:14px;">${editingBookId ? "Bununla Güncelle" : "Bunu Kütüphaneye Ekle"}</button>
            `;
            
            resultDiv.querySelector('button').addEventListener('click', () => {
                if (editingBookId) {
                    // Mevcut kitabı güncelle
                    const bookIndex = library.findIndex(b => b.id === editingBookId);
                    if(bookIndex !== -1) {
                        library[bookIndex].title = title;
                        library[bookIndex].author = author;
                        library[bookIndex].publisher = publisher;
                        library[bookIndex].year = year;
                        if(lang) library[bookIndex].lang = lang;
                        if(coverUrl) library[bookIndex].cover = coverUrl;
                    }
                } else {
                    // Yeni kitap ekle
                    library.unshift({
                        id: Date.now(),
                        title: title,
                        author: author,
                        publisher: publisher,
                        year: year,
                        lang: lang,
                        status: 'okunmadi',
                        cover: coverUrl
                    });
                }
                renderLibrary(library);
                searchModal.style.display = 'none';
            });
            apiResultsDiv.appendChild(resultDiv);
        });
    } catch (err) {
        loadingText.style.display = 'none';
        apiResultsDiv.innerHTML = '<p>Arama sırasında bir bağlantı hatası oluştu.</p>';
    }
});

// --- MENÜ AÇMA VE BARKOD OKUYUCU ---
document.getElementById('addBookBtn').addEventListener('click', () => document.getElementById('addModal').style.display = 'block');
document.getElementById('closeAddModal').addEventListener('click', () => document.getElementById('addModal').style.display = 'none');

let html5QrCode;
document.getElementById('scanBarcodeBtn').addEventListener('click', () => {
    const readerDiv = document.getElementById('reader');
    readerDiv.style.display = 'block'; 
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 100 } },
        (decodedText) => {
            html5QrCode.stop().then(() => {
                readerDiv.style.display = 'none';
                document.getElementById('addModal').style.display = 'none';
                
                // Okunan barkodu arama çubuğuna gönder ve otomatik API taraması başlat
                editingBookId = null; 
                document.getElementById('searchModalTitle').innerText = "Barkod Sonucu Aranıyor";
                document.getElementById('advancedSearchForm').reset();
                document.getElementById('sTitle').value = decodedText;
                manualSaveBtn.style.display = 'none';
                searchModal.style.display = 'block';
                document.getElementById('searchApiBtn').click();
            });
        },
        () => {}
    ).catch(() => alert("Kamera başlatılamadı."));
});

// --- PENCERE DIŞINA TIKLAYINCA KAPATMA ---
window.addEventListener('click', (e) => {
    if (e.target === bookModal) bookModal.style.display = 'none';
    if (e.target === document.getElementById('addModal')) document.getElementById('addModal').style.display = 'none';
    if (e.target === searchModal) searchModal.style.display = 'none';
});

// İlk Yükleme
renderLibrary(library);
