// =====================================================
// keranjang.js: fitur keranjang pemesanan (bagian Ega)
//
// Fitur:
//  1. Keranjang tersimpan otomatis (localStorage), tidak hilang saat refresh
//  2. Ubah jumlah (+/-), hapus item, dan kosongkan keranjang
//  3. Catatan per item (misal: "tanpa es")
//  4. Kode promo dengan rincian subtotal, diskon, dan total
//  5. Form data pemesan dengan validasi
//  6. Metode pembayaran: tunai, QRIS (simulasi), ShopeePay, GoPay, DANA
//  7. Nota pesanan (bisa dicetak / disimpan PDF) dan kirim ke WhatsApp
//  8. Riwayat pesanan (tersimpan di browser pembeli)
//  9. Panel keranjang yang naik dari bawah di tampilan HP
//
// Data menu ada di menu.js, tampilan kartu menu ada di script.js.
// =====================================================

const KUNCI_KERANJANG = 'wowok_keranjang';
const KUNCI_RIWAYAT = 'wowok_riwayat';
const MAKS_RIWAYAT = 10;

// GANTI dengan nomor WhatsApp toko: awali 62, tanpa tanda + dan tanpa 0.
// Contoh: '6281234567890'. Selama masih berisi X, tombol WhatsApp nonaktif.
const NOMOR_WA = '62882007659336';

// Daftar kode promo yang berlaku
const KODE_PROMO = {
    WOWOK10: { jenis: 'persen', nilai: 10, keterangan: 'Diskon 10%' },
    HEMAT5K: { jenis: 'nominal', nilai: 5000, minimal: 30000, keterangan: 'Potongan Rp5.000' },
};

// Jenis pesanan: wajib = apakah perlu isian tambahan (meja / alamat)
const JENIS_PESANAN = {
    makan: { nama: 'Makan di tempat', label: 'Nomor meja', awalan: 'Meja ', wajib: true },
    ambil: { nama: 'Ambil sendiri', label: '', awalan: '', wajib: false },
    antar: { nama: 'Diantar', label: 'Alamat pengantaran', awalan: '', wajib: true },
};

// Metode pembayaran. Kunci harus sama dengan value radio name="bayar" di index.html.
// nomor = tujuan transfer e-wallet (kosong untuk tunai dan QRIS).
const PEMBAYARAN = {
    tunai: { nama: 'Tunai (bayar di kasir)', nomor: '' },
    qris: { nama: 'QRIS', nomor: '' },
    shopeepay: { nama: 'ShopeePay', nomor: '083830991030' },
    gopay: { nama: 'GoPay', nomor: '083830991030' },
    dana: { nama: 'DANA', nomor: '08999218721' },
};

// Isi keranjang: { idMenu: { jumlah, catatan } }
let keranjang = {};
let promoAktif = '';
let pesananTerakhir = null;

// ---------- Fungsi bantu ----------

function rupiah(angka) {
    return 'Rp' + angka.toLocaleString('id-ID');
}

function cariMenu(id) {
    return menu.find((m) => m.id === id);
}

// Mengamankan teks dari pengguna sebelum dimasukkan ke HTML
function esc(teks) {
    const el = document.createElement('div');
    el.textContent = teks;
    return el.innerHTML;
}

function bukaDialog(dialog) {
    if (typeof dialog.showModal === 'function') {
        dialog.showModal();
    } else {
        dialog.setAttribute('open', '');
    }
}

function tutupDialog(dialog) {
    if (typeof dialog.close === 'function') {
        dialog.close();
    } else {
        dialog.removeAttribute('open');
    }
}

// ---------- Penyimpanan (localStorage) ----------

function simpan() {
    try {
        localStorage.setItem(KUNCI_KERANJANG, JSON.stringify({ items: keranjang, promo: promoAktif }));
    } catch (e) {
        // Jika penyimpanan diblokir browser, keranjang tetap jalan tanpa penyimpanan
    }
}

function muat() {
    try {
        const data = JSON.parse(localStorage.getItem(KUNCI_KERANJANG));
        if (data && data.items) {
            for (const id in data.items) {
                // Hanya ambil item yang menunya masih ada
                if (cariMenu(Number(id))) {
                    keranjang[id] = data.items[id];
                }
            }
            promoAktif = KODE_PROMO[data.promo] ? data.promo : '';
        }
    } catch (e) {
        keranjang = {};
        promoAktif = '';
    }
}

// ---------- Aksi pada keranjang ----------

function ubahJumlah(id, perubahan) {
    const item = keranjang[id] || { jumlah: 0, catatan: '' };
    item.jumlah += perubahan;
    if (item.jumlah <= 0) {
        delete keranjang[id];
    } else {
        keranjang[id] = item;
    }
    perbarui();
}

function tambahKeKeranjang(id) {
    ubahJumlah(id, 1);
}

function hapusItem(id) {
    delete keranjang[id];
    perbarui();
}

function kosongkan() {
    keranjang = {};
    promoAktif = '';
    document.getElementById('kode-promo').value = '';
    perbarui();
}

// ---------- Perhitungan ----------

function hitungRingkasan() {
    let subtotal = 0;
    let jumlahItem = 0;
    for (const id in keranjang) {
        const m = cariMenu(Number(id));
        subtotal += m.harga * keranjang[id].jumlah;
        jumlahItem += keranjang[id].jumlah;
    }

    let diskon = 0;
    let promoBerlaku = false;
    const promo = KODE_PROMO[promoAktif];
    if (promo && jumlahItem > 0) {
        if (promo.minimal && subtotal < promo.minimal) {
            promoBerlaku = false; // belum memenuhi syarat belanja minimal
        } else {
            promoBerlaku = true;
            diskon = promo.jenis === 'persen'
                ? Math.round(subtotal * promo.nilai / 100)
                : Math.min(promo.nilai, subtotal);
        }
    }

    return { subtotal, jumlahItem, diskon, promoBerlaku, total: subtotal - diskon };
}

// ---------- Tampilan ----------

function tampilkanKeranjang() {
    const daftar = document.getElementById('isi-keranjang');
    daftar.innerHTML = '';

    for (const id in keranjang) {
        const m = cariMenu(Number(id));
        const item = keranjang[id];

        const li = document.createElement('li');
        li.innerHTML = `
            <div class="baris-item">
                <span class="nama-item">${m.nama}<br><small>${rupiah(m.harga * item.jumlah)}</small></span>
                <span class="jumlah">
                    <button type="button" class="kurang" aria-label="Kurangi ${m.nama}">-</button>
                    <span>${item.jumlah}</span>
                    <button type="button" class="tambah" aria-label="Tambah ${m.nama}">+</button>
                    <button type="button" class="hapus" aria-label="Hapus ${m.nama}">✕</button>
                </span>
            </div>
            <input type="text" class="catatan" placeholder="Catatan (misal: tanpa es)" maxlength="60">
        `;

        // Isi catatan lewat .value (bukan lewat HTML) supaya aman
        const kolomCatatan = li.querySelector('.catatan');
        kolomCatatan.value = item.catatan || '';
        kolomCatatan.addEventListener('input', () => {
            item.catatan = kolomCatatan.value;
            simpan(); // tidak perlu render ulang supaya kursor tidak hilang
        });

        li.querySelector('.kurang').addEventListener('click', () => ubahJumlah(m.id, -1));
        li.querySelector('.tambah').addEventListener('click', () => ubahJumlah(m.id, 1));
        li.querySelector('.hapus').addEventListener('click', () => hapusItem(m.id));
        daftar.appendChild(li);
    }
}

function tampilkanRingkasan(pesanError) {
    const r = hitungRingkasan();

    document.getElementById('subtotal').textContent = rupiah(r.subtotal);
    document.getElementById('baris-diskon').hidden = r.diskon === 0;
    document.getElementById('diskon').textContent = '-' + rupiah(r.diskon);
    document.getElementById('total').textContent = rupiah(r.total);

    // Pesan di bawah kolom kode promo
    const info = document.getElementById('info-promo');
    const promo = KODE_PROMO[promoAktif];
    if (pesanError) {
        info.textContent = pesanError;
        info.className = 'info-promo salah';
    } else if (promo && r.promoBerlaku) {
        info.textContent = promoAktif + ' dipakai: ' + promo.keterangan + '.';
        info.className = 'info-promo benar';
    } else if (promo) {
        info.textContent = 'Kode ' + promoAktif + ' butuh belanja minimal ' + rupiah(promo.minimal) + '.';
        info.className = 'info-promo salah';
    } else {
        info.textContent = '';
        info.className = 'info-promo';
    }

    document.getElementById('jumlah-item').textContent = r.jumlahItem;
    document.getElementById('bar-jumlah').textContent = r.jumlahItem;
    document.getElementById('bar-total').textContent = rupiah(r.total);
    document.getElementById('keranjang-kosong').hidden = r.jumlahItem > 0;
    document.getElementById('tombol-pesan').disabled = r.jumlahItem === 0;
    document.getElementById('tombol-kosongkan').hidden = r.jumlahItem === 0;
}

function perbarui() {
    simpan();
    tampilkanKeranjang();
    tampilkanRingkasan();
}

// ---------- Kode promo ----------

function terapkanPromo() {
    const kolom = document.getElementById('kode-promo');
    const kode = kolom.value.trim().toUpperCase();

    if (kode === '') {
        promoAktif = '';
        perbarui();
        return;
    }
    if (!KODE_PROMO[kode]) {
        tampilkanRingkasan('Kode promo tidak ditemukan.');
        return;
    }
    promoAktif = kode;
    kolom.value = kode;
    perbarui();
}

// ---------- Panel keranjang di HP ----------

function bukaPanel() {
    document.getElementById('panel-keranjang').classList.add('terbuka');
}

function tutupPanel() {
    document.getElementById('panel-keranjang').classList.remove('terbuka');
}

// ---------- Checkout ----------

function aturDetail() {
    const kode = document.querySelector('input[name="tipe"]:checked').value;
    const jenis = JENIS_PESANAN[kode];
    document.getElementById('baris-detail').hidden = !jenis.wajib;
    document.getElementById('label-detail').textContent = jenis.label;
}

function bukaCheckout() {
    document.getElementById('error-checkout').textContent = '';
    tutupPanel();
    bukaDialog(document.getElementById('dialog-checkout'));
}

function kirimForm(event) {
    event.preventDefault();

    const nama = document.getElementById('nama').value.trim();
    const hp = document.getElementById('hp').value.replace(/[\s-]/g, '');
    const jenis = JENIS_PESANAN[document.querySelector('input[name="tipe"]:checked').value];
    const detail = document.getElementById('detail').value.trim();
    const kodeBayar = document.querySelector('input[name="bayar"]:checked').value;
    const bayar = PEMBAYARAN[kodeBayar];

    // Validasi
    const daftarError = [];
    if (nama === '') {
        daftarError.push('Nama tidak boleh kosong.');
    }
    if (!/^(0|62)\d{8,13}$/.test(hp)) {
        daftarError.push('Nomor HP tidak valid (contoh: 081234567890).');
    }
    if (jenis.wajib && detail === '') {
        daftarError.push(jenis.label + ' wajib diisi.');
    }

    const elError = document.getElementById('error-checkout');
    if (daftarError.length > 0) {
        elError.textContent = daftarError.join(' ');
        return;
    }
    elError.textContent = '';

    // Salin isi keranjang menjadi data pesanan
    const r = hitungRingkasan();
    const items = [];
    for (const id in keranjang) {
        const m = cariMenu(Number(id));
        items.push({
            nama: m.nama,
            jumlah: keranjang[id].jumlah,
            catatan: keranjang[id].catatan || '',
            subtotal: m.harga * keranjang[id].jumlah,
        });
    }

    pesananTerakhir = {
        nomor: 'WOW-' + String(Date.now()).slice(-5),
        waktu: new Date().toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }),
        nama: nama,
        hp: hp,
        jenis: jenis.nama,
        detail: jenis.wajib ? jenis.awalan + detail : '',
        bayarKode: kodeBayar,
        bayar: bayar.nama,
        bayarNomor: bayar.nomor,
        items: items,
        subtotal: r.subtotal,
        diskon: r.diskon,
        kodePromo: r.diskon > 0 ? promoAktif : '',
        total: r.total,
    };

    simpanRiwayat(pesananTerakhir);

    tutupDialog(document.getElementById('dialog-checkout'));
    tampilkanNota(pesananTerakhir);
    bukaDialog(document.getElementById('dialog-nota'));
}

// ---------- Nota dan WhatsApp ----------

// Membuat QR di nota. QR berisi nomor pesanan dan total (simulasi, bukan QRIS sungguhan).
function buatQR(p) {
    const el = document.getElementById('qr-nota');
    if (!el) {
        return;
    }
    if (typeof QRCode === 'undefined') {
        el.textContent = 'QR gagal dimuat. Periksa koneksi internet.';
        return;
    }
    new QRCode(el, {
        text: 'WOWOK|' + p.nomor + '|' + p.total,
        width: 160,
        height: 160,
    });
}

function blokPembayaran(p) {
    if (p.bayarKode === 'qris') {
        return `
        <div class="blok-bayar">
            <p><strong>Scan untuk membayar ${rupiah(p.total)}</strong></p>
            <div id="qr-nota" class="qr"></div>
            <p class="redup"><small>QRIS simulasi untuk demo, bukan QRIS sungguhan.</small></p>
        </div>`;
    }
    if (p.bayarNomor) {
        return `
        <div class="blok-bayar">
            <p>Kirim <strong>${rupiah(p.total)}</strong> ke ${esc(p.bayar)}<br>
            <span class="nomor-bayar">${esc(p.bayarNomor)}</span></p>
            <p class="redup"><small>Tunjukkan bukti transfer ke penjual.</small></p>
        </div>`;
    }
    return `
        <div class="blok-bayar">
            <p>Bayar tunai di kasir sebesar <strong>${rupiah(p.total)}</strong>.</p>
        </div>`;
}

function tampilkanNota(p) {
    const baris = p.items.map((i) => `
        <tr>
            <td>${i.jumlah}x ${esc(i.nama)}${i.catatan ? '<br><small>Catatan: ' + esc(i.catatan) + '</small>' : ''}</td>
            <td class="kanan">${rupiah(i.subtotal)}</td>
        </tr>`).join('');

    document.getElementById('isi-nota').innerHTML = `
        <h3>Nota Pesanan ${esc(NAMA_TOKO)}</h3>
        <p class="redup">No. ${p.nomor} · ${p.waktu}</p>
        <p>Atas nama <strong>${esc(p.nama)}</strong> (${esc(p.hp)})<br>
        ${esc(p.jenis)}${p.detail ? ' · ' + esc(p.detail) : ''}<br>
        Pembayaran: ${esc(p.bayar || '-')}</p>
        <table class="tabel-nota">
            ${baris}
            <tr><td>Subtotal</td><td class="kanan">${rupiah(p.subtotal)}</td></tr>
            ${p.diskon > 0 ? `<tr><td>Diskon (${esc(p.kodePromo)})</td><td class="kanan">-${rupiah(p.diskon)}</td></tr>` : ''}
            <tr class="total-nota"><td>Total</td><td class="kanan">${rupiah(p.total)}</td></tr>
        </table>
        ${blokPembayaran(p)}
    `;

    buatQR(p);

    // Tombol WhatsApp
    const tombolWA = document.getElementById('tombol-wa');
    if (NOMOR_WA.indexOf('X') !== -1) {
        tombolWA.removeAttribute('href');
        tombolWA.textContent = 'Atur NOMOR_WA di keranjang.js';
        tombolWA.classList.add('nonaktif');
    } else {
        tombolWA.href = 'https://wa.me/' + NOMOR_WA + '?text=' + encodeURIComponent(buatPesanWA(p));
        tombolWA.textContent = 'Kirim ke WhatsApp';
        tombolWA.classList.remove('nonaktif');
    }
}

function buatPesanWA(p) {
    const baris = [];
    baris.push('*Pesanan ' + NAMA_TOKO + '* (' + p.nomor + ')');
    baris.push('Waktu: ' + p.waktu);
    baris.push('Nama: ' + p.nama);
    baris.push('HP: ' + p.hp);
    baris.push('Jenis: ' + p.jenis + (p.detail ? ' (' + p.detail + ')' : ''));
    baris.push('Pembayaran: ' + p.bayar + (p.bayarNomor ? ' (' + p.bayarNomor + ')' : ''));
    baris.push('');
    for (const i of p.items) {
        baris.push(i.jumlah + 'x ' + i.nama + ' - ' + rupiah(i.subtotal));
        if (i.catatan) {
            baris.push('   Catatan: ' + i.catatan);
        }
    }
    baris.push('');
    baris.push('Subtotal: ' + rupiah(p.subtotal));
    if (p.diskon > 0) {
        baris.push('Diskon (' + p.kodePromo + '): -' + rupiah(p.diskon));
    }
    baris.push('*Total: ' + rupiah(p.total) + '*');
    return baris.join('\n');
}

function selesaiPesanan() {
    tutupDialog(document.getElementById('dialog-nota'));
    document.getElementById('form-checkout').reset();
    aturDetail();
    kosongkan();
    tutupPanel();
}

// ---------- Riwayat pesanan ----------

function muatRiwayat() {
    try {
        const data = JSON.parse(localStorage.getItem(KUNCI_RIWAYAT));
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function simpanRiwayat(pesanan) {
    const daftar = muatRiwayat();
    daftar.unshift(pesanan); // pesanan terbaru di paling atas
    try {
        localStorage.setItem(KUNCI_RIWAYAT, JSON.stringify(daftar.slice(0, MAKS_RIWAYAT)));
    } catch (e) {
        // Abaikan jika penyimpanan diblokir
    }
}

function tampilkanRiwayat() {
    const daftar = muatRiwayat();
    const wadah = document.getElementById('isi-riwayat');

    if (daftar.length === 0) {
        wadah.innerHTML = '<p class="redup">Belum ada pesanan.</p>';
        return;
    }

    wadah.innerHTML = daftar.map((p) => `
        <details class="item-riwayat">
            <summary>
                <strong>${esc(p.nomor)}</strong> · ${rupiah(p.total)}<br>
                <small>${esc(p.waktu)} · ${esc(p.jenis)}</small>
            </summary>
            <ul>
                ${p.items.map((i) => `<li>${i.jumlah}x ${esc(i.nama)} (${rupiah(i.subtotal)})${i.catatan ? '<br><small>Catatan: ' + esc(i.catatan) + '</small>' : ''}</li>`).join('')}
            </ul>
            <p><small>${esc(p.nama)}${p.detail ? ' · ' + esc(p.detail) : ''}${p.bayar ? ' · ' + esc(p.bayar) : ''}</small></p>
        </details>
    `).join('');
}

// ---------- Menghubungkan tombol ----------

function pasangEvent() {
    document.getElementById('tombol-promo').addEventListener('click', terapkanPromo);
    document.getElementById('kode-promo').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            terapkanPromo();
        }
    });

    document.getElementById('tombol-kosongkan').addEventListener('click', () => {
        if (confirm('Kosongkan seluruh isi keranjang?')) {
            kosongkan();
        }
    });

    document.getElementById('tombol-buka-keranjang').addEventListener('click', bukaPanel);
    document.getElementById('tombol-tutup-keranjang').addEventListener('click', tutupPanel);

    document.getElementById('tombol-pesan').addEventListener('click', bukaCheckout);
    document.getElementById('form-checkout').addEventListener('submit', kirimForm);
    document.getElementById('tombol-batal').addEventListener('click', () => {
        tutupDialog(document.getElementById('dialog-checkout'));
    });
    document.querySelectorAll('input[name="tipe"]').forEach((radio) => {
        radio.addEventListener('change', aturDetail);
    });

    document.getElementById('tombol-cetak').addEventListener('click', () => window.print());
    document.getElementById('tombol-selesai').addEventListener('click', selesaiPesanan);

    // Riwayat
    document.getElementById('tombol-riwayat').addEventListener('click', () => {
        tampilkanRiwayat();
        bukaDialog(document.getElementById('dialog-riwayat'));
    });
    document.getElementById('tutup-riwayat').addEventListener('click', () => {
        tutupDialog(document.getElementById('dialog-riwayat'));
    });
    document.getElementById('hapus-riwayat').addEventListener('click', () => {
        if (confirm('Hapus seluruh riwayat pesanan?')) {
            try {
                localStorage.removeItem(KUNCI_RIWAYAT);
            } catch (e) {
                // Abaikan
            }
            tampilkanRiwayat();
        }
    });
}

// ---------- Mulai ----------

muat();
pasangEvent();
aturDetail();
if (promoAktif) {
    document.getElementById('kode-promo').value = promoAktif;
}
perbarui();