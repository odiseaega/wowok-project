// TODO: ganti dengan menu toko kalian. id harus unik.
const menu = [
    { id: 1, nama: 'Nasi goreng', harga: 15000 },
    { id: 2, nama: 'Mie goreng', harga: 14000 },
    { id: 3, nama: 'Es teh', harga: 4000 },
    { id: 4, nama: 'Es jeruk', harga: 6000 },
];

// Isi keranjang: { id menu: jumlah }, misalnya { 1: 2, 3: 1 }
const keranjang = {};

function rupiah(angka) {
    return 'Rp' + angka.toLocaleString('id-ID');
}

function cariMenu(id) {
    return menu.find((m) => m.id === id);
}

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
        kartu.querySelector('button').addEventListener('click', () => ubahJumlah(m.id, 1));
        wadah.appendChild(kartu);
    }
}

function ubahJumlah(id, perubahan) {
    keranjang[id] = (keranjang[id] || 0) + perubahan;
    if (keranjang[id] <= 0) {
        delete keranjang[id];
    }
    tampilkanKeranjang();
}

function tampilkanKeranjang() {
    const daftar = document.getElementById('isi-keranjang');
    daftar.innerHTML = '';
    let total = 0;
    let jumlahItem = 0;

    for (const id in keranjang) {
        const m = cariMenu(Number(id));
        const jumlah = keranjang[id];
        total += m.harga * jumlah;
        jumlahItem += jumlah;

        const li = document.createElement('li');
        li.innerHTML = `
            <span>${m.nama}<br><small>${rupiah(m.harga * jumlah)}</small></span>
            <span class="jumlah">
                <button type="button" class="kurang">-</button>
                ${jumlah}
                <button type="button" class="tambah">+</button>
            </span>
        `;
        li.querySelector('.kurang').addEventListener('click', () => ubahJumlah(m.id, -1));
        li.querySelector('.tambah').addEventListener('click', () => ubahJumlah(m.id, 1));
        daftar.appendChild(li);
    }

    document.getElementById('total').textContent = rupiah(total);
    document.getElementById('jumlah-item').textContent = jumlahItem;
    document.getElementById('keranjang-kosong').hidden = jumlahItem > 0;
    document.getElementById('tombol-pesan').disabled = jumlahItem === 0;
}

// TODO: ganti alert dengan form nama dan alamat pemesan,
// atau kirim ringkasan pesanan ke WhatsApp lewat https://wa.me/62...?text=...
document.getElementById('tombol-pesan').addEventListener('click', () => {
    alert('Pesanan dikirim. Total ' + document.getElementById('total').textContent);
});

tampilkanMenu();
tampilkanKeranjang();
