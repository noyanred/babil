let library = [
    { id: 1, title: "Dune", author: "Frank Herbert", status: "okundu", year: 1965, lang: "tur", cover: "https://covers.openlibrary.org/b/id/10543665-M.jpg" }
];

const gridContainer = document.getElementById('library-grid');
let currentActiveBookId = null; 

// --- 1. KÜTÜPHANEYİ ÇİZ VE TIKLAMA OLAYLARINI EKLE ---
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

// --- 2. KİTAP DETAY, DÜZENLE VE SİL ---
const bookModal = document.getElementById('bookModal');
function openBookDetails(book) {
    currentActiveBookId = book.id;
    document.getElementById('modalTitle').innerText = book.title;
    document.getElementById('modalAuthor').innerText = book.author;
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

// --- 3. AKILLI ARAMA (OPEN LIBRARY API) ---
const manualAddBtn = document.getElementById('manualAddBtn');
const manualAddModal = document.getElementById('manualAddModal');
const apiResultsDiv = document.getElementById('apiResults');
const loadingText = document.getElementById('loadingText');

manualAddBtn.addEventListener('click', () => {
    document.getElementById('addModal').style.display = 'none';
    manualAddModal.style.display = 'block';
    apiResultsDiv.innerHTML = ''; // Eski sonuçları temizle
});

document.getElementById('closeManualAddModal').addEventListener('click', () => manualAddModal.style.display = 'none');

document.getElementById('manualSearchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = document.getElementById('searchQueryInput').value;
    loadingText.style.display = 'block';
    apiResultsDiv.innerHTML = '';

    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=7`);
        const data = await response.json();
        loadingText.style.display = 'none';

        if(data.docs.length === 0) {
            apiResultsDiv.innerHTML = '<p>Sonuç bulunamadı. Lütfen İngilizce adıyla veya yazarla aramayı deneyin.</p>';
            return;
        }

        data.docs.forEach(doc => {
            const title = doc.title;
            const author = doc.author_name ? doc.author_name[0] : "Bilinmeyen Yazar";
            const year = doc.first_publish_year || "Bilinmiyor";
            const lang = doc.language ? doc.language[0] : "Bilinmiyor";
            const coverId = doc.cover_i;
            const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "";

            const resultDiv = document.createElement('div');
            resultDiv.style.border = "1px solid var(--border-color)";
            resultDiv.style.padding = "10px";
            resultDiv.style.borderRadius = "8px";
            resultDiv.innerHTML = `
                <div style="font-weight:bold; font-size:14px;">${title}</div>
                <div style="font-size:12px; opacity:0.8;">Yazar: ${author} | Yıl: ${year} | Dil: ${lang.toUpperCase()}</div>
                <button class="action-btn" style="padding:8px; margin-top:5px; font-size:14px;">Bunu Ekle</button>
            `;
            
            resultDiv.querySelector('button').addEventListener('click', () => {
                const newBook = {
                    id: Date.now(),
                    title: title,
                    author: author,
                    year: year,
                    lang: lang,
                    status: 'okunmadi',
                    cover: coverUrl
                };
                library.unshift(newBook);
                renderLibrary(library);
                manualAddModal.style.display = 'none';
            });
            apiResultsDiv.appendChild(resultDiv);
        });
    } catch (err) {
        loadingText.style.display = 'none';
        apiResultsDiv.innerHTML = '<p>Arama sırasında bir hata oluştu.</p>';
    }
});

// --- MENÜ AÇMA/KAPAMA ---
document.getElementById('addBookBtn').addEventListener('click', () => document.getElementById('addModal').style.display = 'block');
document.getElementById('closeAddModal').addEventListener('click', () => document.getElementById('addModal').style.display = 'none');

// --- BARKOD OKUYUCU (KAMERA) ---
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
                // Okunan barkodu doğrudan arama çubuğuna yaz ve aramayı tetikle
                document.getElementById('searchQueryInput').value = decodedText;
                manualAddModal.style.display = 'block';
                document.getElementById('searchApiBtn').click();
            });
        },
        () => {}
    ).catch(() => alert("Kamera başlatılamadı."));
});

// İlk Yükleme
renderLibrary(library);
