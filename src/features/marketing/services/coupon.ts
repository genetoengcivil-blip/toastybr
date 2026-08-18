import { supabase } from '../../../lib/supabase/client'
import type { Coupon } from '../../../lib/supabase/types'
import type { CouponFormValues } from '../../customers/types'

export async function getCoupons(organizationId: string): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Coupon[]
}

export async function createCoupon(
  organizationId: string,
  values: CouponFormValues
): Promise<Coupon> {
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      organization_id: organizationId,
      code: values.code,
      type: values.type,
      value: values.value,
      min_order: values.min_order ?? 0,
      max_uses: values.max_uses ?? null,
      starts_at: values.starts_at || null,
      expires_at: values.expires_at || null,
      is_active: values.is_active ?? true,
    })
    .select()
    .single()

  if (error) throw error
  return data as Coupon
}

export async function updateCoupon(
  couponId: string,
  values: CouponFormValues
): Promise<Coupon> {
  const { data, error } = await supabase
    .from('coupons')
    .update({
      code: values.code,
      type: values.type,
      value: values.value,
      min_order: values.min_order ?? 0,
      max_uses: values.max_uses ?? null,
      starts_at: values.starts_at || null,
      expires_at: values.expires_at || null,
      is_active: values.is_active ?? true,
    })
    .eq('id', couponId)
    .select()
    .single()

  if (error) throw error
  return data as Coupon
}

export async function deleteCoupon(couponId: string): Promise<void> {
  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', couponId)

  if (error) throw error
}

export async function toggleCouponActive(couponId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('coupons')
    .update({ is_active: isActive })
    .eq('id', couponId)

  if (error) throw error
}
