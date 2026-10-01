// Reusable Razorpay checkout — test-mode by default (backend's
// RAZORPAY_KEY_ID defaults to a non-functional placeholder until real
// test keys are set in the backend's .env, per core/config.py). Any
// screen with a payable order (Store, Events) opens the same widget
// through this one helper instead of each page re-implementing it.
import { PaymentsAPI, TokenStore } from './api'

// Razorpay wants digits with an optional leading "+country" and no
// spaces/dashes/brackets; anything too short to be a real number is
// dropped so a junk value doesn't override what the customer can type.
export function normalizeContact(raw?: string | null): string | undefined {
  if (!raw) return undefined
  const cleaned = String(raw).trim().replace(/[^\d+]/g, '')
  return cleaned.replace(/\D/g, '').length >= 8 ? cleaned : undefined
}

let scriptPromise: Promise<void> | null = null

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Not in browser'))
  if ((window as any).Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Razorpay checkout — check your connection'))
    document.body.appendChild(script)
  })
  return scriptPromise
}

export interface PayableOrder {
  payment_id: string
  gateway_order_id: string
  amount: number
  currency: string
  key: string
}

export async function openRazorpayCheckout(opts: {
  order: PayableOrder
  description: string
  memberName?: string
  memberEmail?: string
  memberPhone?: string
  onSuccess: (verifyResult: any) => void
  onFailure: (err: Error) => void
}) {
  const { order, description, onSuccess, onFailure } = opts
  try {
    await loadRazorpayScript()
  } catch (e: any) {
    onFailure(e)
    return
  }

  // Razorpay asks the customer for any contact detail we don't prefill.
  // Callers historically passed only name+email, so the phone was always
  // re-asked — fill gaps from the signed-in user, and if even the cached
  // copy has no phone (it predates that field), ask the server once.
  let memberName = opts.memberName
  let memberEmail = opts.memberEmail
  let memberPhone = opts.memberPhone
  if (!normalizeContact(memberPhone)) {
    const cached = TokenStore.getUser()
    memberPhone = cached?.phone
    memberName = memberName || cached?.name
    memberEmail = memberEmail || cached?.email
    if (!normalizeContact(memberPhone)) {
      const fresh = await TokenStore.refreshUser()
      memberPhone = fresh?.phone
      memberName = memberName || fresh?.name
      memberEmail = memberEmail || fresh?.email
    }
  }

  const Razorpay = (window as any).Razorpay
  const rzp = new Razorpay({
    key: order.key,
    amount: Math.round(order.amount * 100), // paise
    currency: order.currency || 'INR',
    name: 'NetworkX',
    description,
    order_id: order.gateway_order_id,
    prefill: { name: memberName, email: memberEmail, contact: normalizeContact(memberPhone) },
    theme: { color: '#ff4b0a' },
    handler: async (response: any) => {
      try {
        const result = await PaymentsAPI.verify({
          payment_id: order.payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
        onSuccess(result)
      } catch (e: any) {
        onFailure(e)
      }
    },
    modal: {
      ondismiss: () => onFailure(new Error('Payment cancelled')),
    },
  })
  rzp.on('payment.failed', (resp: any) => onFailure(new Error(resp?.error?.description || 'Payment failed')))
  rzp.open()
}
