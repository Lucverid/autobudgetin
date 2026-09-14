# Scenario Flow policy

Mulai v26.0.9, Decision Lab mengikuti alur:

**Isi → Analisis → Simpan → Form bersih → Tekan skenario tersimpan untuk lihat/edit → Simpan perubahan.**

Skenario yang diedit mempertahankan ID aslinya. Ini penting karena modul Realisasi menyimpan `sourceId` yang menunjuk ke skenario Decision Lab.

Field Rupiah harus menggunakan input digits-only + tampilan pemisah ribuan. Pemisah visual tidak boleh diinterpretasikan sebagai desimal.
