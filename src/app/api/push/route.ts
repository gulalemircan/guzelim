import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const { senderName, text, targetName } = await req.json();

    // Veritabanından hedefin (Efsun veya Emircan) telefon adresini bul
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_name', targetName);

    if (!subs || subs.length === 0) {
      return NextResponse.json({ success: true, message: 'Kullanıcının bildirimi henüz açık değil.' });
    }

    // Telefonun ana ekranına düşecek yazı ve başlık
    const payload = JSON.stringify({
      title: `${senderName} sana bir mesaj gönderdi 💬`,
      body: text,
    });

    // Bulunan tüm cihazlara bildirimi ateşle
    const sendPromises = subs.map((sub) =>
      webpush.sendNotification(sub.subscription, payload).catch(err => console.error("Push hatası:", err))
    );

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Hatası:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}