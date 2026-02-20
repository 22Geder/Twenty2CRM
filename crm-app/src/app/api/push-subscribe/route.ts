import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🔔 Push Notifications API - הרשמה והתראות
// ===========================================

// VAPID keys - בייצור צריך ליצור מפתחות חדשים ולשמור ב-env
// npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

// שמירת subscription
export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Missing subscription data' },
        { status: 400 }
      );
    }
    
    console.log('🔔 New push subscription:', subscription.endpoint.slice(0, 50) + '...');
    
    // שמור את ה-subscription בדאטאבייס (אם יש userId)
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          pushSubscription: JSON.stringify(subscription),
          pushEnabled: true
        }
      }).catch(() => {
        // If user model doesn't have these fields, log and continue
        console.log('⚠️ User model does not have pushSubscription field');
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'נרשמת להתראות בהצלחה!',
      publicKey: VAPID_PUBLIC_KEY
    });
    
  } catch (error: any) {
    console.error('❌ Push subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בהרשמה להתראות' },
      { status: 500 }
    );
  }
}

// קבלת VAPID public key
export async function GET() {
  return NextResponse.json({
    publicKey: VAPID_PUBLIC_KEY
  });
}
