import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { kode_akun, kode_unit, data_realisasi_12_bulan_terakhir } = await req.json();

    if (!kode_akun || !kode_unit || !data_realisasi_12_bulan_terakhir) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const systemPrompt = `Kamu adalah analis anggaran korporat Indonesia.
Berdasarkan data realisasi 12 bulan terakhir untuk akun "${kode_akun}" di unit "${kode_unit}" berikut,
usulkan angka RKAP (rencana anggaran) untuk 12 bulan ke depan. Pertimbangkan tren naik/turun dan pola musiman
kalau terlihat. JAWAB HANYA dalam format JSON murni tanpa markdown, persis seperti ini:
{"prediksi_bulanan":[angka1,angka2,angka3,angka4,angka5,angka6,angka7,angka8,angka9,angka10,angka11,angka12],"alasan":"penjelasan singkat 1-2 kalimat"}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nData realisasi (JSON):\n${JSON.stringify(data_realisasi_12_bulan_terakhir)}` }] }],
        }),
      }
    );

    if (!res.ok) {
      console.error(await res.text());
      return NextResponse.json({ error: 'Gagal memanggil AI' }, { status: 500 });
    }

    const result = await res.json();
    let teks = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    // AI kadang membungkus JSON dengan ```json — bersihkan dulu sebelum parse
    teks = teks.replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(teks);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ error: 'Format respons AI tidak valid, coba lagi' }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
