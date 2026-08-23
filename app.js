// --- HAFIZA SİSTEMİ (Local Storage) ---
let library = JSON.parse(localStorage.getItem('myKutuphane')) || [
    { id: 1, title: "Dune", author: "Frank Herbert", publisher: "İthaki", status: "okundu", year: 1965, lang: "tr", cover: "https://covers.openlibrary.org/b/id/10543665-M.jpg" }
];

function saveLibrary() {
    localStorage.setItem('myKutuphane', JSON.stringify(library));
}

const gridContainer = document.getElementById('library-grid');
let currentActiveBookId = null; 
let editingBookId = null; 

// --- KÜTÜPHANEYİ ÇİZ ---
function renderLibrary(books) {
    gridContainer.innerHTML = '';
    books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        let badgeColor = `var(--badge-${book.status})`;
        let statusText = book.status === 'okunmadi' ? 'Okunmadı' : book.status.charAt(0).toUpperCase() + book.status.slice(1);
        
        let coverImg = book.cover ? `<img src="${book.cover}" class="book-cover">` : `<div class="book-cover" style="display:flex; align-items:center; justify-content:center; font-size:10px; background:#404040; border-radius:6px;">Görsel Yok</div>`;

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
    
    // Dil kodlarını okunur isme çevirme (Opsiyonel görsel iyileştirme)
    let displayLang = book.lang ? book.lang.toUpperCase() : "Bilinmiyor";
    if(book.lang === 'tr') displayLang = "Türkçe";
    if(book.lang === 'en') displayLang = "İngilizce";
    if(book.lang === 'ja') displayLang = "Japonca";
    
    document.getElementById('modalLang').innerText = displayLang;
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
        saveLibrary(); 
        renderLibrary(library);
        bookModal.style.display = 'none';
    }
});

document.getElementById('deleteBookBtn').addEventListener('click', () => {
    if(confirm("Bu kitabı kütüphaneden silmek istediğine emin misin?")) {
        library = library.filter(b => b.id !== currentActiveBookId);
        saveLibrary(); 
        renderLibrary(library);
        bookModal.style.display = 'none';
    }
});

// --- GELİŞMİŞ ARAMA VE DÜZENLEME ---
const searchModal = document.getElementById('searchModal');
const apiResultsDiv = document.getElementById('apiResults');
const loadingText = document.getElementById('loadingText');
const manualSaveBtn = document.getElementById('manualSaveBtn');

document.getElementById('manualAddBtn').addEventListener('click', () => {
    document.getElementById('addModal').style.display = 'none';
    editingBookId = null; 
    document.getElementById('searchModalTitle').innerText = "Yeni Kitap Ara / Ekle";
    document.getElementById('advancedSearchForm').reset();
    apiResultsDiv.innerHTML = '';
    searchModal.style.display = 'block';
});

document.getElementById('editBookBtn').addEventListener('click', () => {
    bookModal.style.display = 'none';
    editingBookId = currentActiveBookId;
    const book = library.find(b => b.id === currentActiveBookId);
    
    document.getElementById('searchModalTitle').innerText = "Kitap Bilgilerini Düzenle";
    document.getElementById('sTitle').value = book.title;
    document.getElementById('sAuthor').value = book.author || "";
    document.getElementById('sPublisher').value = book.publisher || "";
    document.getElementById('sYear').value = book.year || "";
    document.getElementById('sLang').value = book.lang || ""; // Dili de formda göster
    
    apiResultsDiv.innerHTML = '';
    searchModal.style.display = 'block';
});

document.getElementById('closeSearchModal').addEventListener('click', () => searchModal.style.display = 'none');

document.getElementById('manualSaveBtn').addEventListener('click', () => {
    const titleVal = document.getElementById('sTitle').value.trim();
    if(!titleVal) { alert("Lütfen en azından kitap adını girin."); return; }

    if(editingBookId) {
        const bookIndex = library.findIndex(b => b.id === editingBookId);
        if(bookIndex !== -1) {
            library[bookIndex].title = titleVal;
            library[bookIndex].author = document.getElementById('sAuthor').value;
            library[bookIndex].publisher = document.getElementById('sPublisher').value;
            library[bookIndex].year = document.getElementById('sYear').value;
            library[bookIndex].lang = document.getElementById('sLang').value;
        }
    } else {
        library.unshift({
            id: Date.now(),
            title: titleVal,
            author: document.getElementById('sAuthor').value,
            publisher: document.getElementById('sPublisher').value,
            year: document.getElementById('sYear').value,
            lang: document.getElementById('sLang').value,
            status: 'okunmadi',
            cover: ""
        });
    }
    saveLibrary(); 
    renderLibrary(library);
    searchModal.style.display = 'none';
});

// --- ÇİFT MOTORLU VE KADEMELİ ARAMA (Fallback Search) ---
document.getElementById('advancedSearchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const t = document.getElementById('sTitle').value.trim();
    const a = document.getElementById('sAuthor').value.trim();
    const p = document.getElementById('sPublisher').value.trim();
    const y = document.getElementById('sYear').value.trim();
    const l = document.getElementById('sLang').value; // Seçilen dil kodu
    
    loadingText.style.display = 'block';
    apiResultsDiv.innerHTML = '';

    // API'leri çağıran yardımcı fonksiyon
    async function fetchResults(queryStr, langCode) {
        let googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(queryStr)}&maxResults=15`;
        // Eğer dil seçildiyse Google Books aramasına dil filtresi ekle
        if (langCode) googleUrl += `&langRestrict=${langCode}`;
        
        let openLibUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(queryStr)}&limit=15`;
        
        const [googleRes, openLibRes] = await Promise.allSettled([ fetch(googleUrl), fetch(openLibUrl) ]);
        let results = [];

        if (googleRes.status === 'fulfilled' && googleRes.value.ok) {
            const gData = await googleRes.value.json();
            if (gData.items) {
                gData.items.forEach(item => {
                    const doc = item.volumeInfo;
                    results.push({
                        title: doc.title || "İsimsiz",
                        author: doc.authors ? doc.authors.join(", ") : "",
                        publisher: doc.publisher || "",
                        year: doc.publishedDate ? doc.publishedDate.substring(0, 4) : "",
                        lang: doc.language || "",
                        cover: doc.imageLinks ? (doc.imageLinks.thumbnail || doc.imageLinks.smallThumbnail).replace("http:", "https:") : ""
                    });
                });
            }
        }

        if (openLibRes.status === 'fulfilled' && openLibRes.value.ok) {
            const oData = await openLibRes.value.json();
            if (oData.docs) {
                oData.docs.forEach(doc => {
                    results.push({
                        title: doc.title,
                        author: doc.author_name ? doc.author_name[0] : "",
                        publisher: doc.publisher ? doc.publisher[0] : "",
                        year: doc.first_publish_year || "",
                        lang: doc.language ? doc.language[0] : "",
                        cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : ""
                    });
                });
            }
        }
        return results;
    }

    try {
        // 1. Aşama: Senin yazdığın tüm detaylarla (Yayınevi, Yıl vs.) tam arama
        let exactQuery = t;
        if(a) exactQuery += " " + a;
        if(p) exactQuery += " " + p;
        if(y) exactQuery += " " + y;

        let results = await fetchResults(exactQuery, l);

        // 2. Aşama (Fallback): Detaylı arama sıfır çekerse, SADECE kitap adıyla geniş arama yap
        if (results.length === 0 && (a || p || y)) {
            results = await fetchResults(t, l);
            if (results.length > 0) {
                const infoDiv = document.createElement('div');
                infoDiv.style.backgroundColor = "var(--badge-sirada)";
                infoDiv.style.color = "#000";
                infoDiv.style.padding = "8px";
                infoDiv.style.borderRadius = "6px";
                infoDiv.style.fontSize = "12px";
                infoDiv.style.fontWeight = "bold";
                infoDiv.style.marginBottom = "10px";
                infoDiv.innerText = "⚠️ Yayınevi/Yıl eşleşmesi bulunamadı. Seçtiğin dilde kitap adıyla bulunan kapaklar listeleniyor:";
                apiResultsDiv.appendChild(infoDiv);
            }
        }

        loadingText.style.display = 'none';

        if (results.length === 0) {
            apiResultsDiv.innerHTML = '<p>Hiçbir sonuç bulunamadı. Lütfen "Sadece Yazdıklarımı Kaydet" butonunu kullanın.</p>';
            return;
        }

        // Sonuçları Ekrana Bas
        results.slice(0, 20).forEach(doc => {
            const resultDiv = document.createElement('div');
            resultDiv.style.border = "1px solid var(--border-color)";
            resultDiv.style.padding = "10px";
            resultDiv.style.borderRadius = "8px";
            resultDiv.innerHTML = `
                <div style="display:flex; gap:10px;">
                    ${doc.cover ? `<img src="${doc.cover}" style="width:50px; height:75px; object-fit:cover; border-radius:4px;">` : `<div style="width:50px; height:75px; background:#404040; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:9px;">Yok</div>`}
                    <div style="flex:1;">
                        <div style="font-weight:bold; font-size:14px;">${doc.title}</div>
                        <div style="font-size:12px; opacity:0.8; margin-bottom:5px;">Yazar: ${doc.author} | Yayınevi: ${doc.publisher} | Yıl: ${doc.year}</div>
                        <button class="action-btn" style="padding:6px; font-size:12px; margin:0;">${editingBookId ? "Bununla Güncelle" : "Bunu Kütüphaneye Ekle"}</button>
                    </div>
                </div>
            `;
            
            resultDiv.querySelector('button').addEventListener('click', () => {
                if (editingBookId) {
                    const bookIndex = library.findIndex(b => b.id === editingBookId);
                    if(bookIndex !== -1) {
                        library[bookIndex].title = doc.title;
                        library[bookIndex].author = doc.author;
                        library[bookIndex].publisher = p ? p : doc.publisher; 
                        library[bookIndex].year = y ? y : doc.year;
                        library[bookIndex].lang = l ? l : doc.lang; // Kullanıcı dil seçtiyse onu, seçmediyse API'den geleni kullan
                        if(doc.cover) library[bookIndex].cover = doc.cover;
                    }
                } else {
                    library.unshift({
                        id: Date.now(),
                        title: doc.title,
                        author: doc.author,
                        publisher: p ? p : doc.publisher,
                        year: y ? y : doc.year,
                        lang: l ? l : doc.lang, // Kullanıcı dil seçtiyse onu, seçmediyse API'den geleni kullan
                        status: 'okunmadi',
                        cover: doc.cover
                    });
                }
                saveLibrary(); 
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
                
                editingBookId = null; 
                document.getElementById('searchModalTitle').innerText = "Barkod Sonucu Aranıyor";
                document.getElementById('advancedSearchForm').reset();
                document.getElementById('sTitle').value = decodedText;
                searchModal.style.display = 'block';
                document.getElementById('advancedSearchForm').dispatchEvent(new Event('submit'));
            });
        },
        () => {}
    ).catch(() => alert("Kamera başlatılamadı."));
});

// Arama Çubuğu
document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = library.filter(book => 
        book.title.toLowerCase().includes(term) || 
        (book.author && book.author.toLowerCase().includes(term))
    );
    renderLibrary(filtered);
});

// Filtreler
document.getElementById('statusFilter').addEventListener('change', (e) => {
    const val = e.target.value;
    if(val === 'all') renderLibrary(library);
    else renderLibrary(library.filter(book => book.status === val));
});

// PENCERE DIŞINA TIKLAYINCA KAPATMA
window.addEventListener('click', (e) => {
    if (e.target === bookModal) bookModal.style.display = 'none';
    if (e.target === document.getElementById('addModal')) document.getElementById('addModal').style.display = 'none';
    if (e.target === searchModal) searchModal.style.display = 'none';
});

// İLK YÜKLEME
renderLibrary(library);
