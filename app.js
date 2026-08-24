let library = JSON.parse(localStorage.getItem('myKutuphane')) || [
    { id: 1, title: "Dune", author: "Frank Herbert", publisher: "İthaki", status: "okundu", year: 1965, lang: "tr", pages: 704, notes: "Bilimkurgu edebiyatının başyapıtı.", cover: "https://covers.openlibrary.org/b/id/10543665-M.jpg" }
];

function saveLibrary() {
    localStorage.setItem('myKutuphane', JSON.stringify(library));
}

const gridContainer = document.getElementById('library-grid');
let currentActiveBookId = null; 
let editingBookId = null; 

// --- BİRLEŞİK FİLTRE VE SIRALAMA SİSTEMİ ---
function applyFilters() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const statusVal = document.getElementById('statusFilter').value;
    const sortVal = document.getElementById('sortFilter').value;

    let filtered = library.filter(book => {
        const matchSearch = book.title.toLowerCase().includes(term) || (book.author && book.author.toLowerCase().includes(term));
        const matchStatus = statusVal === 'all' ? true : book.status === statusVal;
        return matchSearch && matchStatus;
    });

    if (sortVal === 'date-desc') {
        filtered.sort((a, b) => b.id - a.id);
    } else if (sortVal === 'pages-asc') {
        filtered.sort((a, b) => (parseInt(a.pages) || 0) - (parseInt(b.pages) || 0));
    } else if (sortVal === 'pages-desc') {
        filtered.sort((a, b) => (parseInt(b.pages) || 0) - (parseInt(a.pages) || 0));
    } else if (sortVal === 'year') {
        filtered.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
    }

    renderLibrary(filtered);
}

document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);
document.getElementById('sortFilter').addEventListener('change', applyFilters);

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
    document.getElementById('modalPages').innerText = book.pages || "-";
    document.getElementById('modalNotes').innerText = book.notes || "Not eklenmemiş.";
    
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
        applyFilters();
        bookModal.style.display = 'none';
    }
});

document.getElementById('deleteBookBtn').addEventListener('click', () => {
    if(confirm("Bu kitabı kütüphaneden silmek istediğine emin misin?")) {
        library = library.filter(b => b.id !== currentActiveBookId);
        saveLibrary(); 
        applyFilters();
        bookModal.style.display = 'none';
    }
});

// --- GELİŞMİŞ ARAMA VE DÜZENLEME ---
const searchModal = document.getElementById('searchModal');
const apiResultsDiv = document.getElementById('apiResults');
const loadingText = document.getElementById('loadingText');

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
    document.getElementById('sLang').value = book.lang || ""; 
    document.getElementById('sPages').value = book.pages || ""; 
    document.getElementById('sCoverUrl').value = book.cover || ""; 
    document.getElementById('sNotes').value = book.notes || ""; 
    
    apiResultsDiv.innerHTML = '';
    searchModal.style.display = 'block';
});

document.getElementById('closeSearchModal').addEventListener('click', () => searchModal.style.display = 'none');

document.getElementById('manualSaveBtn').addEventListener('click', () => {
    const titleVal = document.getElementById('sTitle').value.trim();
    if(!titleVal) { alert("Lütfen en azından kitap adını girin."); return; }

    const manualCover = document.getElementById('sCoverUrl').value.trim();

    if(editingBookId) {
        const bookIndex = library.findIndex(b => b.id === editingBookId);
        if(bookIndex !== -1) {
            library[bookIndex].title = titleVal;
            library[bookIndex].author = document.getElementById('sAuthor').value;
            library[bookIndex].publisher = document.getElementById('sPublisher').value;
            library[bookIndex].year = document.getElementById('sYear').value;
            library[bookIndex].lang = document.getElementById('sLang').value;
            library[bookIndex].pages = document.getElementById('sPages').value;
            library[bookIndex].notes = document.getElementById('sNotes').value;
            if (manualCover) library[bookIndex].cover = manualCover;
        }
    } else {
        library.unshift({
            id: Date.now(),
            title: titleVal,
            author: document.getElementById('sAuthor').value,
            publisher: document.getElementById('sPublisher').value,
            year: document.getElementById('sYear').value,
            lang: document.getElementById('sLang').value,
            pages: document.getElementById('sPages').value,
            notes: document.getElementById('sNotes').value,
            status: 'okunmadi',
            cover: manualCover
        });
    }
    saveLibrary(); 
    applyFilters();
    searchModal.style.display = 'none';
});

// --- API ARAMA ---
document.getElementById('advancedSearchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const t = document.getElementById('sTitle').value.trim();
    const a = document.getElementById('sAuthor').value.trim();
    const p = document.getElementById('sPublisher').value.trim();
    const y = document.getElementById('sYear').value.trim();
    const l = document.getElementById('sLang').value; 
    
    // API sonuçları üzerinden kaydederken manuel girilen not, sayfa ve kapağı da dahil edeceğiz
    const manualCover = document.getElementById('sCoverUrl').value.trim();
    const manualPages = document.getElementById('sPages').value;
    const manualNotes = document.getElementById('sNotes').value;

    loadingText.style.display = 'block';
    apiResultsDiv.innerHTML = '';

    async function fetchResults(queryStr, langCode) {
        let boostedQuery = queryStr;
        if (langCode === 'tr') boostedQuery += " Türkçe";
        if (langCode === 'en') boostedQuery += " English";
        if (langCode === 'ja') boostedQuery += " Japonca";

        let googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(boostedQuery)}&maxResults=15`;
        let openLibUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(boostedQuery)}&limit=15`;
        
        const [googleRes, openLibRes] = await Promise.allSettled([ fetch(googleUrl), fetch(openLibUrl) ]);
        let results = [];

        if (googleRes.status === 'fulfilled' && googleRes.value.ok) {
            const gData = await googleRes.value.json();
            if (gData.items) {
                gData.items.forEach(item => {
                    const doc = item.volumeInfo;
                    if (langCode && doc.language && doc.language !== langCode) return;
                    
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
                    let docLang = doc.language ? doc.language[0] : "";
                    results.push({
                        title: doc.title,
                        author: doc.author_name ? doc.author_name[0] : "",
                        publisher: doc.publisher ? doc.publisher[0] : "",
                        year: doc.first_publish_year || "",
                        lang: docLang === 'tur' ? 'tr' : (docLang === 'eng' ? 'en' : (docLang === 'jpn' ? 'ja' : docLang)),
                        cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : ""
                    });
                });
            }
        }
        return results;
    }

    try {
        let exactQuery = t;
        if(a) exactQuery += " " + a;
        if(p) exactQuery += " " + p;
        if(y) exactQuery += " " + y;

        let results = await fetchResults(exactQuery, l);

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
                infoDiv.innerText = "⚠️ Yayınevi/Yıl eşleşmesi bulunamadı. Genel veritabanı sonuçları listeleniyor:";
                apiResultsDiv.appendChild(infoDiv);
            }
        }

        loadingText.style.display = 'none';

        if (results.length === 0) {
            apiResultsDiv.innerHTML = `
                <div style="background-color: #ff7675; color: #000; padding: 10px; border-radius: 8px; font-weight: bold; font-size: 13px;">
                    ⚠️ Aradığınız basım global veritabanlarında bulunamadı. <br><br>
                    Lütfen bilgileri doldurup yeşil "Sadece Yazdıklarımı Kaydet" butonuna basarak kütüphanenize ekleyin.
                </div>
            `;
            return;
        }

        results.slice(0, 15).forEach(doc => {
            const resultDiv = document.createElement('div');
            resultDiv.style.border = "1px solid var(--border-color)";
            resultDiv.style.padding = "10px";
            resultDiv.style.borderRadius = "8px";
            resultDiv.style.marginBottom = "10px";
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
                        library[bookIndex].lang = l ? l : doc.lang; 
                        library[bookIndex].pages = manualPages || library[bookIndex].pages;
                        library[bookIndex].notes = manualNotes || library[bookIndex].notes;
                        library[bookIndex].cover = manualCover ? manualCover : (doc.cover || library[bookIndex].cover);
                    }
                } else {
                    library.unshift({
                        id: Date.now(),
                        title: doc.title,
                        author: doc.author,
                        publisher: p ? p : doc.publisher,
                        year: y ? y : doc.year,
                        lang: l ? l : doc.lang, 
                        pages: manualPages,
                        notes: manualNotes,
                        status: 'okunmadi',
                        cover: manualCover ? manualCover : doc.cover
                    });
                }
                saveLibrary(); 
                applyFilters();
                searchModal.style.display = 'none';
            });
            apiResultsDiv.appendChild(resultDiv);
        });
    } catch (err) {
        loadingText.style.display = 'none';
        apiResultsDiv.innerHTML = '<p>Arama sırasında bir bağlantı hatası oluştu.</p>';
    }
});

// --- BARKOD VE PENCERE İŞLEMLERİ ---
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

window.addEventListener('click', (e) => {
    if (e.target === bookModal) bookModal.style.display = 'none';
    if (e.target === document.getElementById('addModal')) document.getElementById('addModal').style.display = 'none';
    if (e.target === searchModal) searchModal.style.display = 'none';
});

// İLK YÜKLEME
applyFilters();
