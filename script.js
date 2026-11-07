// =====================================================
// script.js: menampilkan kartu menu
// File ini milik Wildan. Data menu ada di menu.js,
// logika keranjang ada di keranjang.js (milik Ega).
// Fungsi rupiah() dan tambahKeKeranjang() berasal dari keranjang.js.
// =====================================================

document.title = 'Pesan Online · ' + NAMA_TOKO;
document.querySelector('.merek').textContent = NAMA_TOKO;

let kategoriAktif = 'Semua';
let kataCari = '';

const wadahMenu = document.getElementById('daftar-menu');

// ---------- Kolom pencarian dan filter (dibuat lewat JavaScript) ----------

const alat = document.createElement('div');
alat.className = 'alat-menu';
alat.innerHTML = `
    <input type="search" id="cari-menu" placeholder="Cari menu, misalnya es teh" aria-label="Cari menu" autocomplete="off">
    <div id="filter-kategori" class="filter" role="group" aria-label="Filter kategori"></div>
`;
wadahMenu.before(alat);

const pesanKosong = document.createElement('p');
pesanKosong.className = 'redup';
pesanKosong.textContent = 'Menu tidak ditemukan. Coba kata kunci lain.';
pesanKosong.hidden = true;
wadahMenu.after(pesanKosong);

function tampilkanFilter() {
    const wadah = document.getElementById('filter-kategori');
    const daftarKategori = ['Semua', ...new Set(menu.map((m) => m.kategori))];

    for (const k of daftarKategori) {
        const tombol = document.createElement('button');
        tombol.type = 'button';
        tombol.className = 'chip';
        tombol.textContent = k;
        tombol.setAttribute('aria-pressed', String(k === kategoriAktif));
        tombol.addEventListener('click', () => {
            kategoriAktif = k;
            for (const t of wadah.children) {
                t.setAttribute('aria-pressed', String(t === tombol));
            }
            tampilkanMenu();
        });
        wadah.appendChild(tombol);
    }
}

document.getElementById('cari-menu').addEventListener('input', (e) => {
    kataCari = e.target.value.trim().toLowerCase();
    tampilkanMenu();
});

// ---------- Kartu menu ----------

// Foto jika ada; bila tidak ada atau gagal dimuat, diganti emoji
function buatGambar(m) {
    const emoji = m.emoji || '🍽️';
    if (m.gambar) {
        return `<img src="${m.gambar}" alt="${m.nama}" loading="lazy">`;
    }
    return `<span aria-hidden="true">${emoji}</span>`;
}

function tampilkanMenu() {
    const hasil = menu.filter((m) => {
        const cocokKategori = kategoriAktif === 'Semua' || m.kategori === kategoriAktif;
        const teks = (m.nama + ' ' + (m.deskripsi || '')).toLowerCase();
        return cocokKategori && teks.includes(kataCari);
    });

    wadahMenu.innerHTML = '';
    for (const m of hasil) {
        const kartu = document.createElement('article');
        kartu.className = 'kartu kartu-menu';
        kartu.innerHTML = `
            <div class="gambar-menu">
                ${buatGambar(m)}
                <span class="badge">${m.kategori}</span>
            </div>
            <div class="isi-menu">
                <h3>${m.nama}</h3>
                <p class="deskripsi">${m.deskripsi || ''}</p>
                <p class="harga">${rupiah(m.harga)}</p>
                <button type="button" aria-label="Tambah ${m.nama} ke keranjang">Tambah</button>
            </div>
        `;

        // Jika foto gagal dimuat, ganti dengan emoji cadangan
        const foto = kartu.querySelector('.gambar-menu img');
        if (foto) {
            foto.addEventListener('error', () => {
                const pengganti = document.createElement('span');
                pengganti.setAttribute('aria-hidden', 'true');
                pengganti.textContent = m.emoji || '🍽️';
                foto.replaceWith(pengganti);
            });
        }

        const tombol = kartu.querySelector('.isi-menu button');
        tombol.addEventListener('click', () => {
            tambahKeKeranjang(m.id);
            tombol.textContent = 'Ditambahkan ✓';
            setTimeout(() => { tombol.textContent = 'Tambah'; }, 800);
        });
        wadahMenu.appendChild(kartu);
    }

    pesanKosong.hidden = hasil.length > 0;
}

tampilkanFilter();
tampilkanMenu();