import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Server-only connection probes. These never write data.
export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider');
  try {
    if (provider === 'mongodb') {
      const { db_mongodb } = await import('@/DB/db/db_services/db_mongodb');
      await db_mongodb.getAll('usa_health_check');
    } else if (provider === 'firebase') {
      const { db_firebase } = await import('@/DB/db/db_services/db_firebase');
      await db_firebase.getAll('usa_health_check');
    } else if (provider === 'supabase') {
      const { checkSupabaseConnection } = await import('@/DB/db/db_services/db_supabase');
      await checkSupabaseConnection();
    } else if (provider === 'appwrite') {
      const { db_appwrite } = await import('@/DB/db/db_services/db_appwrite');
      await db_appwrite.getAll('usa_health_check');
    } else {
      return NextResponse.json({ ok: false, error: 'Unknown or unsupported provider.' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, provider, status: 'connected' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database connection error.';
    return NextResponse.json({ ok: false, provider, error: message }, { status: 503 });
  }
}
