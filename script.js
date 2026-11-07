// =====================================================
// script.js: menampilkan kartu menu
// File ini milik Wildan. Data menu ada di menu.js,
// logika keranjang ada di keranjang.js (milik Ega).
// Fungsi rupiah() dan tambahKeKeranjang() berasal dari keranjang.js.
// =====================================================

document.title = 'Pesan Online · ' + NAMA_TOKO;
document.querySelector('.merek').textContent = NAMA_TOKO;

function tampilkanMenu() {
    const wadah = document.getElementById('daftar-menu');
    wadah.innerHTML = '';
    for (const m of menu) {
        const kartu = document.createElement('article');
        kartu.className = 'kartu';
        kartu.innerHTML = `
            <h3>${m.nama}</h3>
            <p class="harga">${rupiah(m.harga)}</p>
            <button type="button">Tambah</button>
        `;
        kartu.querySelector('button').addEventListener('click', () => tambahKeKeranjang(m.id));
        wadah.appendChild(kartu);
    }
}

tampilkanMenu();