# User Stories - SaaS Peternakan Lele

Daftar user stories yang dapat dipakai untuk backlog, PRD implementation, dan sprint planning.

## MS-001 - Tambah kolam baru

- **Feature:** Manajemen Kolam

- **Role:** Sebagai peternak

- **User story:** saya ingin menambahkan kolam baru dengan nama dan dimensi

- **Benefit:** agar saya bisa mencatat dan memantau setiap kolam secara terpisah

- **Acceptance criteria:**
  1) Ada tombol 'Tambah Kolam'. 2) Form input: nama, panjang, lebar, kedalaman, tanggal tebar. 3) Setelah submit, kolam tersimpan dan tampil di daftar.

- **Priority:** Must-have

- **Story points:** 3


---

## MS-002 - Edit & hapus kolam

- **Feature:** Manajemen Kolam

- **Role:** Sebagai peternak

- **User story:** saya ingin mengubah atau menghapus data kolam

- **Benefit:** agar data kolam tetap akurat dan rapi

- **Acceptance criteria:**
  1) Tersedia opsi edit & hapus pada tiap card/row kolam. 2) Edit menyimpan perubahan. 3) Hapus meminta konfirmasi.

- **Priority:** Must-have

- **Story points:** 2


---

## MS-003 - Lihat ringkasan kolam

- **Feature:** Manajemen Kolam

- **Role:** Sebagai peternak

- **User story:** saya ingin melihat ringkasan cepat (luas, volume, jumlah ikan, status) untuk tiap kolam

- **Benefit:** agar saya cepat tahu kondisi umum tanpa membuka detail

- **Acceptance criteria:**
  1) Daftar kolam menampilkan luas, volume, jumlah ikan, status. 2) Klik kolam membuka halaman detail.

- **Priority:** High

- **Story points:** 3


---

## VG-001 - Tampilkan grid sesuai dimensi kolam

- **Feature:** Visual Kolam Grid 2D

- **Role:** Sebagai peternak

- **User story:** saya ingin melihat kolam dalam grid 2D sesuai panjang & lebar yang diinput

- **Benefit:** agar representasi area kolam sama dengan kondisi nyata

- **Acceptance criteria:**
  1) Grid terbentuk sesuai panjang × lebar (misal 1 kotak = 1 m²). 2) Grid responsif di layar mobile.

- **Priority:** Must-have

- **Story points:** 5


---

## VG-002 - Warna grid berdasarkan kepadatan

- **Feature:** Visual Kolam Grid 2D

- **Role:** Sebagai peternak

- **User story:** saya ingin melihat warna grid yang mewakili tingkat kepadatan

- **Benefit:** agar saya mudah mendeteksi area padat/aman secara visual

- **Acceptance criteria:**
  1) Skema warna Hijau/Kuning/Merah terpasang sesuai threshold. 2) Perubahan warna realtime ketika data berubah.

- **Priority:** Must-have

- **Story points:** 3


---

## VG-003 - Sesuaikan skala grid (opsional)

- **Feature:** Visual Kolam Grid 2D

- **Role:** Sebagai peternak

- **User story:** saya ingin mengubah ukuran unit grid (misal 0.5 m² atau 1 m²)

- **Benefit:** agar representasi cocok untuk kolam kecil atau besar

- **Acceptance criteria:**
  1) Pengaturan unit grid tersedia di pengaturan kolam. 2) Grid merender ulang setelah perubahan.

- **Priority:** Medium

- **Story points:** 2


---

## TT-001 - Tampilkan tooltip saat hover/tap

- **Feature:** Tooltip Informasi Grid

- **Role:** Sebagai peternak

- **User story:** saat saya mengarahkan kursor (atau tap) pada grid, muncul tooltip informatif

- **Benefit:** agar saya bisa melihat detail kecil area tanpa membuka modal

- **Acceptance criteria:**
  1) Tooltip muncul di hover (desktop) dan tap (mobile). 2) Tooltip menutup saat klik luar atau geser.

- **Priority:** Must-have

- **Story points:** 3


---

## TT-002 - Isi tooltip berisi volume, ikan, status, rekomendasi

- **Feature:** Tooltip Informasi Grid

- **Role:** Sebagai peternak

- **User story:** tooltip menampilkan luas area, volume air, estimasi jumlah ikan, status kepadatan, dan rekomendasi singkat

- **Benefit:** agar saya dapat keputusan cepat dari setiap area

- **Acceptance criteria:**
  1) Tooltip menampilkan lima field: Luas, Volume, Ikan, Status, Rekomendasi. 2) Nilai diambil dari data terbaru.

- **Priority:** Must-have

- **Story points:** 3


---

## TT-003 - Pin tooltip untuk perbandingan

- **Feature:** Tooltip Informasi Grid

- **Role:** Sebagai peternak

- **User story:** saya ingin men-pin tooltip untuk membandingkan beberapa area

- **Benefit:** agar saya bisa membandingkan area tanpa harus terus hover

- **Acceptance criteria:**
  1) Klik ganda/tombol pin mem-persist tooltip. 2) Maks 3 tooltip yang bisa dipin sekaligus.

- **Priority:** Medium

- **Story points:** 2


---

## KD-001 - Hitung kepadatan otomatis

- **Feature:** Perhitungan Kepadatan Ikan

- **Role:** Sebagai peternak

- **User story:** sistem menghitung kepadatan ikan berdasarkan jumlah ikan dan volume air

- **Benefit:** agar saya tahu tingkat kepadatan tanpa perhitungan manual

- **Acceptance criteria:**
  1) Kepadatan = jumlah ikan / volume air (m³) dihitung otomatis. 2) Tampilkan nilai kepadatan di halaman kolam dan tiap tooltip.

- **Priority:** Must-have

- **Story points:** 3


---

## KD-002 - Threshold kepadatan default & dapat disesuaikan

- **Feature:** Perhitungan Kepadatan Ikan

- **Role:** Sebagai peternak

- **User story:** ada ambang aman/padat/berisiko yang bisa diubah

- **Benefit:** agar peternak bisa gunakan standar mereka sendiri

- **Acceptance criteria:**
  1) Default threshold ditentukan (misal: Aman <= X ekor/m³, Padat <= Y, Risiko > Y). 2) Pengguna premium bisa mengubah threshold.

- **Priority:** High

- **Story points:** 2


---

## KD-003 - Visualisasi kepadatan rata-rata

- **Feature:** Perhitungan Kepadatan Ikan

- **Role:** Sebagai peternak

- **User story:** saya ingin melihat kepadatan rata-rata kolam dalam bentuk angka & indikator ringkas

- **Benefit:** mempermudah monitoring cepat kondisi keseluruhan kolam

- **Acceptance criteria:**
  1) Tampilkan kepadatan rata-rata di header kolam. 2) Warna indikator sesuai threshold.

- **Priority:** High

- **Story points:** 2


---

## PA-001 - Input pakan harian

- **Feature:** Pencatatan Pakan & FCR

- **Role:** Sebagai peternak

- **User story:** saya ingin mencatat jumlah pakan yang diberikan setiap hari per kolam

- **Benefit:** agar tercatat riwayat pakan untuk analisis FCR dan biaya

- **Acceptance criteria:**
  1) Form input tanggal, jumlah (kg), jenis pakan. 2) Data tersimpan dan dapat ditampilkan dalam riwayat.

- **Priority:** Must-have

- **Story points:** 3


---

## PA-002 - Hitung FCR otomatis

- **Feature:** Pencatatan Pakan & FCR

- **Role:** Sebagai peternak

- **User story:** sistem menghitung FCR berdasarkan total pakan dan kenaikan bobot (estimasi atau aktual)

- **Benefit:** agar saya tahu efisiensi pakan

- **Acceptance criteria:**
  1) FCR = total pakan (kg) / total kenaikan bobot (kg). 2) FCR tampil dengan label normal/waspada jika di luar rentang ideal.

- **Priority:** Must-have

- **Story points:** 3


---

## PA-003 - Lihat riwayat pakan & FCR

- **Feature:** Pencatatan Pakan & FCR

- **Role:** Sebagai peternak

- **User story:** saya ingin melihat ringkasan riwayat pakan dan FCR per periode

- **Benefit:** agar saya bisa menilai efisiensi dari waktu ke waktu

- **Acceptance criteria:**
  1) Tabel riwayat pakan per hari. 2) Grafik FCR per minggu/bulan (opsional).

- **Priority:** High

- **Story points:** 3


---

## KA-001 - Input kondisi air manual

- **Feature:** Monitoring Kualitas Air (Manual)

- **Role:** Sebagai peternak

- **User story:** saya ingin memasukkan kondisi air (warna, bau, tinggi) secara manual

- **Benefit:** agar ada catatan kondisi air walau tanpa sensor

- **Acceptance criteria:**
  1) Form input: warna, bau, ketinggian, optional pH & suhu. 2) Data tersimpan per tanggal.

- **Priority:** Must-have

- **Story points:** 2


---

## KA-002 - Saran tindakan berdasarkan kondisi

- **Feature:** Monitoring Kualitas Air (Manual)

- **Role:** Sebagai peternak

- **User story:** saya ingin mendapat rekomendasi tindakan (misal ganti air, puasa pakan) berdasarkan input kondisi air

- **Benefit:** agar saya tahu langkah praktis ketika kondisi air buruk

- **Acceptance criteria:**
  1) Rules mapping kondisi->rekomendasi tersedia. 2) Rekomendasi muncul setelah simpan input kondisi air.

- **Priority:** High

- **Story points:** 3


---

## KA-003 - Lihat riwayat kondisi air

- **Feature:** Monitoring Kualitas Air (Manual)

- **Role:** Sebagai peternak

- **User story:** saya ingin melihat histori entri kondisi air untuk diagnosa kejadian sebelumnya

- **Benefit:** membantu tracking masalah berkepanjangan

- **Acceptance criteria:**
  1) Tabel histori per kolam menampilkan tanggal & nilai input. 2) Bisa filter periode.

- **Priority:** Medium

- **Story points:** 2


---

## PP-001 - Estimasi waktu panen berdasarkan ukuran bibit & growth rate

- **Feature:** Prediksi Panen

- **Role:** Sebagai peternak

- **User story:** sistem memberikan estimasi kapan ikan siap panen

- **Benefit:** agar saya bisa merencanakan panen untuk optimalisasi harga & logistik

- **Acceptance criteria:**
  1) Input ukuran bibit dan growth rate default/estimasi. 2) Sistem menampilkan estimasi hari panen dan berat rata-rata.

- **Priority:** Must-have

- **Story points:** 3


---

## PP-002 - Simulasi panen berdasarkan tanggal

- **Feature:** Prediksi Panen

- **Role:** Sebagai peternak

- **User story:** saya ingin mensimulasikan panen bila memanen pada tanggal tertentu untuk melihat hasil & omzet

- **Benefit:** membantu mengambil keputusan kapan terbaik memanen

- **Acceptance criteria:**
  1) User input tanggal panen simulasi. 2) Output: estimasi total berat, estimasi omzet (dengan harga pasar default).

- **Priority:** High

- **Story points:** 3


---

## LR-001 - Laporan ringkas per kolam

- **Feature:** Laporan Sederhana

- **Role:** Sebagai peternak

- **User story:** saya ingin melihat laporan ringkas yang menunjukkan total pakan, FCR, kematian, dan estimasi untung/rugi

- **Benefit:** agar saya tahu performa ekonomi tiap kolam

- **Acceptance criteria:**
  1) Laporan menampilkan metrik core: total pakan, FCR, jumlah kematian, estimasi pendapatan & biaya. 2) Bisa di-export CSV.

- **Priority:** Must-have

- **Story points:** 3


---

## LR-002 - Export laporan periode

- **Feature:** Laporan Sederhana

- **Role:** Sebagai peternak

- **User story:** saya ingin mengekspor laporan bulanan/periodik sebagai file CSV

- **Benefit:** agar bisa dibagikan atau dianalisis lebih lanjut

- **Acceptance criteria:**
  1) Pilih periode. 2) Generate CSV berisi ringkasan per kolam dan metrik. 3) File tersedia untuk download.

- **Priority:** High

- **Story points:** 2


---
