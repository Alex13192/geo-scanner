export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, domain, score } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // 记录线索数据 (日志打印/可扩展存储至 KV / Supabase / Resend API)
    console.log(`[GEO Lead Captured] Email: ${email} | Domain: ${domain} | Score: ${score} | Time: ${new Date().toISOString()}`);

    // 这里未来可以无缝对接 Resend 发送欢迎邮件/PDF 或存入数据库
    
    return NextResponse.json({
      success: true,
      message: 'Subscription successful! GEO alerts activated.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}