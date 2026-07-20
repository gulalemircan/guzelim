import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabaseClient'; // Yeniden oluşturmak yerine projede olanı kullanıyoruz

export async function POST(req: Request) {
  try {
    // Şifreleri dışarıda değil, içeri alıyoruz ki Vercel kurulumda (build) çökmesin
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      console.error("VAPID şifreleri eksik!");
      return NextResponse.json({ success: false, message: "Şifre eksik" }, { status: 500 });
    }

    webpush.setVapidDetails(
      'mailto:admin@efsunundunyasi.com',
      publicKey,
      privateKey
    );

    const { senderName, text, targetName } = await req.json();

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_name', targetName);

    if (!subs || subs.length === 0) {
      return NextResponse.json({ success: true, message: 'Kullanıcının bildirimi henüz açık değil.' });
    }

    const payload = JSON.stringify({
      title: `${senderName} sana bir mesaj gönderdi 💬`,
      body: text,
    });

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