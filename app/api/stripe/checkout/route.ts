import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromRequest, newUserId, setUserIdCookie } from '@/app/lib/identity';
import { logEvent } from '@/app/lib/events';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const paymentLinkUrl = process.env.STRIPE_PAYMENT_LINK_URL;
  if (!paymentLinkUrl) {
    return NextResponse.json(
      { error: 'STRIPE_PAYMENT_LINK_URL is not set' },
      { status: 500 }
    );
  }

  const existingUid = getUserIdFromRequest(req);
  const uid = existingUid ?? newUserId();
  const now = Date.now();

  await logEvent({ ts: now, uid, type: 'checkout_started', meta: { provider: 'stripe_payment_link' } });

  const res = NextResponse.json({ url: paymentLinkUrl });
  if (!existingUid) setUserIdCookie(res, uid);
  return res;
}

