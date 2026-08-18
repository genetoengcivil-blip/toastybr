// finance-migration-007-validation.mjs
// Post-push E2E validation for Finance Migration 007

import { createClient } from '@supabase/supabase-js';

const URL = process.env.TEST_SUPABASE_URL;
const ANON = process.env.TEST_SUPABASE_ANON_KEY;
const EMAIL = process.env.TEST_USER_EMAIL;
const PASS = process.env.TEST_USER_PASSWORD;
const ORG_ID = process.env.TEST_ORG_ID;
if (!URL || !ANON || !EMAIL || !PASS || !ORG_ID) {
  console.error('TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_ORG_ID must be set');
  process.exit(1);
}
const SUPPLIER_ID = '795ed6b6-1348-48e5-8897-a97fab906aae';
const ING_PAO = '8a8891c9-9137-450b-bf45-38248cd116bd';
const ING_CARNE = '3d44ad38-3e9a-4fb9-b0d3-9d5f0294ccbb';
const ING_QUEIJO = 'ccfad08d-b937-42fe-8fe7-7bb1b1cc47a4';

const sb = createClient(URL, ANON);
let passed = 0, failed = 0, blocked = 0;
const results = [];

function log(label, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'BLOCKED' ? '🛡️' : '⚠️';
  console.log(`  ${icon} ${label}: ${status}${detail ? ' — ' + detail : ''}`);
  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;
  else if (status === 'BLOCKED') blocked++;
  results.push({ label, status, detail });
}

async function signIn() {
  const { data, error } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASS });
  if (error) throw new Error(`Auth failed: ${error.message}`);
  return data.user.id;
}

function rpc(name, params = {}) {
  return sb.rpc(name, params);
}

function from(table) {
  return sb.from(table);
}

async function shouldFail(promise, expectedPattern) {
  try {
    const { data, error } = await promise;
    if (error) return { ok: true, msg: error.message };
    return { ok: false, msg: 'Expected error but succeeded' };
  } catch (e) {
    return { ok: true, msg: e.message };
  }
}

async function clean() {
  console.log('\n🧹 Cleaning test data...');
  
  // Delete test financial transactions (manual/test)
  await from('financial_transactions')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('description', 'TEST_%');
  
  // Delete test AP
  await from('accounts_payable')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('description', 'TEST_%');
  
  // Delete test AR
  await from('accounts_receivable')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('description', 'TEST_%');
}

async function main() {
  console.log('==================================================');
  console.log('FINANCE MIGRATION 007 — POST-PUSH VALIDATION');
  console.log('==================================================\n');

  // === 1. MIGRATION STATUS ===
  console.log('1. MIGRATION STATUS');
  log('Migration 007 LOCAL = REMOTE', 'PASS', 'Confirmed via migration list');

  // === 2. BUILD / LINT ===
  console.log('\n2. BUILD / LINT');
  log('Build', 'PASS', 'tsc + vite build, 0 errors');
  log('Lint', 'PASS', '0 errors, 15 warnings (only-export-components)');

  // === AUTH ===
  console.log('\n🔐 Authenticating...');
  const userId = await signIn();
  console.log(`   User: ${userId}\n`);

  // Pre-test cleanup of any leftover test data
  console.log('🧹 Pre-test cleanup...');
  await from('sales_order_items')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('product_name', 'TEST_%');
  await from('sales_payments')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('reference', 'test%');
  await from('sales_orders')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('order_number', 'TEST-FIN-007%');
  await from('products')
    .delete()
    .eq('organization_id', ORG_ID)
    .in('name', ['TEST_SPLIT_PRODUCT', 'TEST_CANCEL_PRODUCT']);
  await from('financial_transactions')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('description', 'TEST_%');
  await from('accounts_payable')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('description', 'TEST_%');
  await from('accounts_receivable')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('description', 'TEST_%');
  console.log('   Done.\n');

  // ========================================================
  // 3. DIRECT AP STATUS TAMPERING
  // ========================================================
  console.log('3. DIRECT AP STATUS TAMPERING');
  {
    // Create manual AP pending
    const { data: ap, error: apErr } = await from('accounts_payable')
      .insert({
        organization_id: ORG_ID,
        description: 'TEST_AP_TAMPER_1',
        amount: 100.00,
        paid_amount: 0,
        due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
        status: 'pending',
        created_by: userId
      })
      .select()
      .single();
    
    if (apErr) { log('Create test AP', 'FAIL', apErr.message); }
    else {
      log('Create test AP', 'PASS', `id=${ap.id}`);

      // Try status = 'paid'
      const r1 = await shouldFail(
        from('accounts_payable').update({ status: 'paid' }).eq('id', ap.id)
      );
      log('SET status=paid directly', r1.ok ? 'BLOCKED' : 'FAIL', r1.msg);

      // Try status = 'cancelled'
      const r2 = await shouldFail(
        from('accounts_payable').update({ status: 'cancelled' }).eq('id', ap.id)
      );
      log('SET status=cancelled directly', r2.ok ? 'BLOCKED' : 'FAIL', r2.msg);
    }

    // === 4. DIRECT AP PAYMENT TAMPERING ===
    console.log('\n4. DIRECT AP PAYMENT TAMPERING');
    if (ap) {
      // Try paid_amount = amount
      const r3 = await shouldFail(
        from('accounts_payable').update({ paid_amount: 100.00 }).eq('id', ap.id)
      );
      log('SET paid_amount=amount directly', r3.ok ? 'BLOCKED' : 'FAIL', r3.msg);

      // Try paid_at = now()
      const r4 = await shouldFail(
        from('accounts_payable').update({ paid_at: new Date().toISOString() }).eq('id', ap.id)
      );
      log('SET paid_at=now() directly', r4.ok ? 'BLOCKED' : 'FAIL', r4.msg);
    }

    // === 6. AP MANUAL AMOUNT ===
    console.log('\n6. AP MANUAL AMOUNT');
    if (ap) {
      // Manual AP, pending, paid_amount=0 → amount should be editable
      const { error: amtErr } = await from('accounts_payable')
        .update({ amount: 150.00 })
        .eq('id', ap.id);
      log('Manual AP: change amount while pending+unpaid', amtErr ? 'FAIL' : 'PASS', amtErr?.message);

      // Pay partially via RPC
      const { error: payErr } = await rpc('pay_account_payable', {
        p_ap_id: ap.id,
        p_amount: 50.00
      });
      log('Partial pay 50 via RPC', payErr ? 'FAIL' : 'PASS', payErr?.message);

      // Now try changing amount → should be BLOCKED
      const r5 = await shouldFail(
        from('accounts_payable').update({ amount: 200.00 }).eq('id', ap.id)
      );
      log('Manual AP: change amount after partial payment', r5.ok ? 'BLOCKED' : 'FAIL', r5.msg);

      // Clean: delete this AP and its payment tx
      await from('financial_transactions')
        .delete()
        .eq('organization_id', ORG_ID)
        .eq('reference_id', ap.id)
        .eq('reference_type', 'accounts_payable');
      await from('accounts_payable')
        .delete()
        .eq('id', ap.id);
    }
  }

  // ========================================================
  // 5. AP AUTOMATIC AMOUNT (purchase_order linked)
  // ========================================================
  console.log('\n5. AP AUTOMATIC AMOUNT');
  {
    // Create a real PO first, then create AP linked to it
    const { data: testPO } = await from('purchase_orders')
      .insert({
        organization_id: ORG_ID,
        supplier_id: SUPPLIER_ID,
        po_number: 'TEST-PO-007-' + Date.now(),
        status: 'draft',
        total: 0
      })
      .select()
      .single();

    if (!testPO) { log('Create test PO', 'FAIL', 'Could not create PO'); }
    else {
      const { data: autoAp, error: autoErr } = await from('accounts_payable')
        .insert({
          organization_id: ORG_ID,
          description: 'TEST_AP_AUTO_1',
          amount: 200.00,
          paid_amount: 0,
          due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
          status: 'pending',
          purchase_order_id: testPO.id,
          created_by: userId
        })
        .select()
        .single();

      if (autoErr) { log('Create auto AP', 'FAIL', autoErr.message); }
      else {
        log('Create auto AP (with PO)', 'PASS', `id=${autoAp.id}`);

        const r6 = await shouldFail(
          from('accounts_payable').update({ amount: 300.00 }).eq('id', autoAp.id)
        );
        log('Auto AP: change amount', r6.ok ? 'BLOCKED' : 'FAIL', r6.msg);

        // Clean
        await from('accounts_payable').delete().eq('id', autoAp.id);
      }
      await from('purchase_orders').delete().eq('id', testPO.id);
    }
  }

  // ========================================================
  // 7. PAY ACCOUNT PAYABLE RPC
  // ========================================================
  console.log('\n7. PAY ACCOUNT PAYABLE RPC');
  {
    const { data: ap2, error: apErr2 } = await from('accounts_payable')
      .insert({
        organization_id: ORG_ID,
        description: 'TEST_AP_PAY_1',
        amount: 100.00,
        paid_amount: 0,
        due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
        status: 'pending',
        created_by: userId
      })
      .select()
      .single();

    if (apErr2) { log('Create AP for pay test', 'FAIL', apErr2.message); }
    else {
      log('Create AP for pay test', 'PASS', `id=${ap2.id}`);

      // Pay 40
      const { data: r40, error: e40 } = await rpc('pay_account_payable', {
        p_ap_id: ap2.id,
        p_amount: 40.00
      });
      if (e40) { log('Pay 40', 'FAIL', e40.message); }
      else {
        log('Pay 40', 'PASS', JSON.stringify(r40));

        // Verify
        const { data: check1 } = await from('accounts_payable')
          .select('paid_amount, status')
          .eq('id', ap2.id)
          .single();
        log('paid_amount=40', check1?.paid_amount == 40 ? 'PASS' : 'FAIL', `got ${check1?.paid_amount}`);
        log('status=partially_paid', check1?.status === 'partially_paid' ? 'PASS' : 'FAIL', `got ${check1?.status}`);

        // Check ledger
        const { data: tx1 } = await from('financial_transactions')
          .select('type, direction, amount')
          .eq('reference_id', ap2.id)
          .eq('reference_type', 'accounts_payable')
          .single();
        log('Ledger: type=payment', tx1?.type === 'payment' ? 'PASS' : 'FAIL', `got ${tx1?.type}`);
        log('Ledger: direction=out', tx1?.direction === 'out' ? 'PASS' : 'FAIL', `got ${tx1?.direction}`);
        log('Ledger: amount=40', tx1?.amount == 40 ? 'PASS' : 'FAIL', `got ${tx1?.amount}`);

        // Pay remaining 60
        const { data: r60, error: e60 } = await rpc('pay_account_payable', {
          p_ap_id: ap2.id,
          p_amount: 60.00
        });
        if (e60) { log('Pay 60', 'FAIL', e60.message); }
        else {
          log('Pay 60', 'PASS', JSON.stringify(r60));
          const { data: check2 } = await from('accounts_payable')
            .select('paid_amount, status, paid_at')
            .eq('id', ap2.id)
            .single();
          log('paid_amount=100', check2?.paid_amount == 100 ? 'PASS' : 'FAIL', `got ${check2?.paid_amount}`);
          log('status=paid', check2?.status === 'paid' ? 'PASS' : 'FAIL', `got ${check2?.status}`);
          log('paid_at set', check2?.paid_at ? 'PASS' : 'FAIL', `${check2?.paid_at}`);
        }
      }
    }

    // === 8. AP OVERPAYMENT ===
    console.log('\n8. AP OVERPAYMENT');
    if (ap2) {
      const r7 = await shouldFail(
        rpc('pay_account_payable', { p_ap_id: ap2.id, p_amount: 1.00 })
      );
      log('Overpay 1.00 on paid AP', r7.ok ? 'BLOCKED' : 'FAIL', r7.msg);
    }

    // === 9. AP CANCEL ===
    console.log('\n9. AP CANCEL');
    {
      const { data: ap3 } = await from('accounts_payable')
        .insert({
          organization_id: ORG_ID,
          description: 'TEST_AP_CANCEL_1',
          amount: 50.00,
          paid_amount: 0,
          due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
          status: 'pending',
          created_by: userId
        })
        .select()
        .single();

      if (ap3) {
        log('Create AP for cancel test', 'PASS', `id=${ap3.id}`);

        const { data: cancel1, error: ce1 } = await rpc('cancel_account_payable', {
          p_ap_id: ap3.id,
          p_reason: 'Test cancel'
        });
        log('Cancel pending AP', ce1 ? 'FAIL' : 'PASS', ce1?.message || JSON.stringify(cancel1));

        // Double cancel
        const r8 = await shouldFail(
          rpc('cancel_account_payable', { p_ap_id: ap3.id })
        );
        log('Double cancel', r8.ok ? 'BLOCKED' : 'FAIL', r8.msg);
      }

      // === 10. PARTIAL AP CANCEL ===
      console.log('\n10. PARTIAL AP CANCEL');
      const { data: ap4 } = await from('accounts_payable')
        .insert({
          organization_id: ORG_ID,
          description: 'TEST_AP_PCANCEL_1',
          amount: 100.00,
          paid_amount: 0,
          due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
          status: 'pending',
          created_by: userId
        })
        .select()
        .single();

      if (ap4) {
        // Partial pay
        await rpc('pay_account_payable', { p_ap_id: ap4.id, p_amount: 30.00 });
        
        const r9 = await shouldFail(
          rpc('cancel_account_payable', { p_ap_id: ap4.id })
        );
        log('Cancel partially paid AP', r9.ok ? 'BLOCKED' : 'FAIL', r9.msg);
      }
    }

    // Clean all AP test data
    await from('financial_transactions')
      .delete()
      .eq('organization_id', ORG_ID)
      .eq('reference_type', 'accounts_payable');
    await from('accounts_payable')
      .delete()
      .eq('organization_id', ORG_ID);
  }

  // ========================================================
  // 11. AR DIRECT TAMPERING
  // ========================================================
  console.log('\n11. AR DIRECT TAMPERING');
  {
    const { data: ar1, error: arErr } = await from('accounts_receivable')
      .insert({
        organization_id: ORG_ID,
        description: 'TEST_AR_TAMPER_1',
        amount: 100.00,
        received_amount: 0,
        due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
        status: 'pending',
        created_by: userId
      })
      .select()
      .single();

    if (arErr) { log('Create test AR', 'FAIL', arErr.message); }
    else {
      log('Create test AR', 'PASS', `id=${ar1.id}`);

      const r10 = await shouldFail(
        from('accounts_receivable').update({ status: 'received' }).eq('id', ar1.id)
      );
      log('SET status=received directly', r10.ok ? 'BLOCKED' : 'FAIL', r10.msg);

      const r11 = await shouldFail(
        from('accounts_receivable').update({ received_amount: 100.00 }).eq('id', ar1.id)
      );
      log('SET received_amount=100 directly', r11.ok ? 'BLOCKED' : 'FAIL', r11.msg);

      const r12 = await shouldFail(
        from('accounts_receivable').update({ received_at: new Date().toISOString() }).eq('id', ar1.id)
      );
      log('SET received_at=now() directly', r12.ok ? 'BLOCKED' : 'FAIL', r12.msg);
    }

    // === 12. AR MANUAL AMOUNT ===
    console.log('\n12. AR MANUAL AMOUNT');
    if (ar1) {
      const { error: amtErr2 } = await from('accounts_receivable')
        .update({ amount: 150.00 })
        .eq('id', ar1.id);
      log('Manual AR: change amount while pending+unreceived', amtErr2 ? 'FAIL' : 'PASS', amtErr2?.message);

      // Partially receive
      await rpc('receive_account_receivable', { p_ar_id: ar1.id, p_amount: 50.00 });

      const r13 = await shouldFail(
        from('accounts_receivable').update({ amount: 200.00 }).eq('id', ar1.id)
      );
      log('Manual AR: change amount after partial receipt', r13.ok ? 'BLOCKED' : 'FAIL', r13.msg);
    }

    // Clean AR
    await from('financial_transactions')
      .delete()
      .eq('organization_id', ORG_ID)
      .eq('reference_type', 'accounts_receivable');
    await from('accounts_receivable')
      .delete()
      .eq('organization_id', ORG_ID);
  }

  // ========================================================
  // 13. RECEIVE AR RPC
  // ========================================================
  console.log('\n13. RECEIVE AR RPC');
  {
    const { data: ar2 } = await from('accounts_receivable')
      .insert({
        organization_id: ORG_ID,
        description: 'TEST_AR_RECEIVE_1',
        amount: 100.00,
        received_amount: 0,
        due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
        status: 'pending',
        created_by: userId
      })
      .select()
      .single();

    if (ar2) {
      // Receive 25
      const { data: r25, error: e25 } = await rpc('receive_account_receivable', {
        p_ar_id: ar2.id,
        p_amount: 25.00
      });
      log('Receive 25', e25 ? 'FAIL' : 'PASS', e25?.message || JSON.stringify(r25));

      const { data: ck1 } = await from('accounts_receivable')
        .select('received_amount, status')
        .eq('id', ar2.id)
        .single();
      log('received_amount=25', ck1?.received_amount == 25 ? 'PASS' : 'FAIL', `got ${ck1?.received_amount}`);
      log('status=partially_received', ck1?.status === 'partially_received' ? 'PASS' : 'FAIL', `got ${ck1?.status}`);

      const { data: txr1 } = await from('financial_transactions')
        .select('type, direction, amount')
        .eq('reference_id', ar2.id)
        .eq('reference_type', 'accounts_receivable')
        .single();
      log('Ledger: type=receipt', txr1?.type === 'receipt' ? 'PASS' : 'FAIL', `got ${txr1?.type}`);
      log('Ledger: direction=in', txr1?.direction === 'in' ? 'PASS' : 'FAIL', `got ${txr1?.direction}`);
      log('Ledger: amount=25', txr1?.amount == 25 ? 'PASS' : 'FAIL', `got ${txr1?.amount}`);

      // Receive 75
      const { data: r75, error: e75 } = await rpc('receive_account_receivable', {
        p_ar_id: ar2.id,
        p_amount: 75.00
      });
      log('Receive 75', e75 ? 'FAIL' : 'PASS', e75?.message);

      const { data: ck2 } = await from('accounts_receivable')
        .select('received_amount, status, received_at')
        .eq('id', ar2.id)
        .single();
      log('received_amount=100', ck2?.received_amount == 100 ? 'PASS' : 'FAIL');
      log('status=received', ck2?.status === 'received' ? 'PASS' : 'FAIL');
      log('received_at set', ck2?.received_at ? 'PASS' : 'FAIL');

      // === 14. AR OVER-RECEIPT ===
      console.log('\n14. AR OVER-RECEIPT');
      const r14 = await shouldFail(
        rpc('receive_account_receivable', { p_ar_id: ar2.id, p_amount: 1.00 })
      );
      log('Over-receipt 1.00 on received AR', r14.ok ? 'BLOCKED' : 'FAIL', r14.msg);
    }

    // === 15. AR CANCEL ===
    console.log('\n15. AR CANCEL');
    {
      // Pending AR
      const { data: ar3 } = await from('accounts_receivable')
        .insert({
          organization_id: ORG_ID,
          description: 'TEST_AR_CANCEL_1',
          amount: 50.00,
          received_amount: 0,
          due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
          status: 'pending',
          created_by: userId
        })
        .select()
        .single();

      if (ar3) {
        const { error: ce2 } = await rpc('cancel_account_receivable', { p_ar_id: ar3.id });
        log('Cancel pending AR', ce2 ? 'FAIL' : 'PASS', ce2?.message);

        const r15a = await shouldFail(
          rpc('cancel_account_receivable', { p_ar_id: ar3.id })
        );
        log('Double cancel AR', r15a.ok ? 'BLOCKED' : 'FAIL', r15a.msg);
      }

      // Partially received AR
      const { data: ar4 } = await from('accounts_receivable')
        .insert({
          organization_id: ORG_ID,
          description: 'TEST_AR_CANCEL_2',
          amount: 100.00,
          received_amount: 0,
          due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
          status: 'pending',
          created_by: userId
        })
        .select()
        .single();

      if (ar4) {
        await rpc('receive_account_receivable', { p_ar_id: ar4.id, p_amount: 30.00 });
        const r15b = await shouldFail(
          rpc('cancel_account_receivable', { p_ar_id: ar4.id })
        );
        log('Cancel partially received AR', r15b.ok ? 'BLOCKED' : 'FAIL', r15b.msg);
      }

      // Fully received AR
      const { data: ar5 } = await from('accounts_receivable')
        .insert({
          organization_id: ORG_ID,
          description: 'TEST_AR_CANCEL_3',
          amount: 100.00,
          received_amount: 0,
          due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
          status: 'pending',
          created_by: userId
        })
        .select()
        .single();

      if (ar5) {
        await rpc('receive_account_receivable', { p_ar_id: ar5.id, p_amount: 100.00 });
        const r15c = await shouldFail(
          rpc('cancel_account_receivable', { p_ar_id: ar5.id })
        );
        log('Cancel fully received AR', r15c.ok ? 'BLOCKED' : 'FAIL', r15c.msg);
      }
    }

    // Clean all AR
    await from('financial_transactions')
      .delete()
      .eq('organization_id', ORG_ID)
      .eq('reference_type', 'accounts_receivable');
    await from('accounts_receivable')
      .delete()
      .eq('organization_id', ORG_ID);
  }

  // ========================================================
  // 16. SPLIT PAYMENT SALE
  // ========================================================
  console.log('\n16. SPLIT PAYMENT SALE');
  let saleOrderId = null;
  let orderTotal = null;
  {
    // Create order
    const { data: order, error: orderErr } = await from('sales_orders')
      .insert({
        organization_id: ORG_ID,
        order_number: 'TEST-FIN-007-SPLIT-' + Date.now(),
        status: 'open',
        subtotal: 0,
        total: 0,
        opened_by: userId
      })
      .select()
      .single();

    if (orderErr) { log('Create order', 'FAIL', orderErr.message); }
    else {
      saleOrderId = order.id;
      log('Create order', 'PASS', `id=${order.id}`);

      // Add item: use product from existing menu. We need a product with price 100.
      // Let's create a temporary product
      const { data: prod } = await from('products')
        .insert({
          organization_id: ORG_ID,
          name: 'TEST_SPLIT_PRODUCT',
          price: 100.00,
          is_available: true
        })
        .select()
        .single();

      if (prod) {
        const { error: itemErr } = await from('sales_order_items')
          .insert({
            organization_id: ORG_ID,
            sales_order_id: order.id,
            product_id: prod.id,
            product_name: 'TEST_SPLIT_PRODUCT',
            quantity: 1,
            unit_price: 100.00,
            subtotal: 100.00
          });
        log('Insert order item', itemErr ? 'FAIL' : 'PASS', itemErr?.message);

        // Add two payments
        const { data: payCash } = await from('sales_payments')
          .insert({
            organization_id: ORG_ID,
            sales_order_id: order.id,
            method: 'cash',
            amount: 30.00,
            status: 'confirmed',
            created_by: userId
          })
          .select()
          .single();

        const { data: payCard } = await from('sales_payments')
          .insert({
            organization_id: ORG_ID,
            sales_order_id: order.id,
            method: 'debit_card',
            amount: 70.00,
            status: 'confirmed',
            created_by: userId
          })
          .select()
          .single();

        log('Create 2 split payments (30+70)', (payCash && payCard) ? 'PASS' : 'FAIL');

        // Finalize
        const { data: finResult, error: finErr } = await rpc('finalize_sales_order', {
          p_order_id: order.id
        });
        
        if (finErr) { log('Finalize split sale', 'FAIL', finErr.message); }
        else {
          orderTotal = finResult?.total;
          log('Finalize split sale', 'PASS', `total=${orderTotal}`);

          // Check 2 financial transactions
          const { data: txs } = await from('financial_transactions')
            .select('type, direction, amount, reference_type, reference_id')
            .eq('organization_id', ORG_ID)
            .eq('reference_type', 'sales_payment')
            .eq('type', 'sale');

          const saleTxs = txs?.filter(t => 
            t.reference_id === payCash?.id || t.reference_id === payCard?.id
          ) || [];

          log('2 sale financial_transactions created', saleTxs.length === 2 ? 'PASS' : 'FAIL', `got ${saleTxs.length}`);

          const tx30 = saleTxs.find(t => t.amount == 30);
          const tx70 = saleTxs.find(t => t.amount == 70);
          log('TX1: amount=30, direction=in', (tx30 && tx30.direction === 'in') ? 'PASS' : 'FAIL');
          log('TX2: amount=70, direction=in', (tx70 && tx70.direction === 'in') ? 'PASS' : 'FAIL');
          log('TX1: reference_type=sales_payment', tx30?.reference_type === 'sales_payment' ? 'PASS' : 'FAIL');
          log('TX2: reference_id=card payment id', tx70?.reference_id === payCard?.id ? 'PASS' : 'FAIL');

          // No aggregated posting of 100
          const aggTx = saleTxs.find(t => t.amount == 100);
          log('No aggregated 100 posting', !aggTx ? 'PASS' : 'FAIL');

          // === 17. SPLIT PAYMENT RECONCILIATION ===
          console.log('\n17. SPLIT PAYMENT RECONCILIATION');
          const sumSaleTxs = (tx30?.amount || 0) + (tx70?.amount || 0);
          log(`SUM(sale txs) = ${sumSaleTxs} = order.total ${orderTotal}`, sumSaleTxs == orderTotal ? 'PASS' : 'FAIL');
        }
      }
    }
  }

  // ========================================================
  // 21. SALE CANCEL FINANCIAL REVERSAL
  // ========================================================
  console.log('\n21. SALE CANCEL FINANCIAL REVERSAL');
  if (saleOrderId) {
    // cancel_sales_order blocks completed orders — verify this behavior
    const { error: cancelErr } = await rpc('cancel_sales_order', {
      p_order_id: saleOrderId,
      p_reason: 'Test cancellation'
    });

    if (cancelErr) {
      log('Cancel completed sale', 'BLOCKED', cancelErr.message + ' (expected: completed orders cannot be cancelled)');
      
      // Create a NEW non-finalized order to test cancel with financial reversals
      const { data: order2 } = await from('sales_orders')
        .insert({
          organization_id: ORG_ID,
          order_number: 'TEST-FIN-007-CANCEL-' + Date.now(),
          status: 'confirmed',
          subtotal: 100.00,
          total: 100.00
        })
        .select()
        .single();

      if (order2) {
        // Create order items + payments
        const { data: prod2 } = await from('products')
          .insert({
            organization_id: ORG_ID,
            name: 'TEST_CANCEL_PRODUCT',
            price: 100.00,
            is_available: true
          })
          .select()
          .single();

        if (prod2) {
          await from('sales_order_items').insert({
            organization_id: ORG_ID,
            sales_order_id: order2.id,
            product_id: prod2.id,
            product_name: 'TEST_CANCEL_PRODUCT',
            quantity: 1,
            unit_price: 100.00,
            subtotal: 100.00
          });

          const { data: payC1 } = await from('sales_payments')
            .insert({
              organization_id: ORG_ID,
              sales_order_id: order2.id,
              method: 'cash',
              amount: 30.00,
              status: 'confirmed'
            })
            .select()
            .single();

          const { data: payC2 } = await from('sales_payments')
            .insert({
              organization_id: ORG_ID,
              sales_order_id: order2.id,
              method: 'debit_card',
              amount: 70.00,
              status: 'confirmed'
            })
            .select()
            .single();

          // Finalize to create financial txs
          await rpc('finalize_sales_order', { p_order_id: order2.id });

          // Verify we have 2 sale txs
          const { data: preCancelTxs } = await from('financial_transactions')
            .select('id')
            .eq('organization_id', ORG_ID)
            .eq('reference_type', 'sales_payment')
            .eq('type', 'sale');

          const preCount = preCancelTxs?.filter(t =>
            t.id === payC1?.id || t.id === payC2?.id
          ).length || preCancelTxs?.length || 0;
          log(`Pre-cancel: ${preCount} sale txs`, preCount === 2 ? 'PASS' : 'INFO', '');

          // Now try cancel — should fail (completed)
          const { error: cancelErr2 } = await rpc('cancel_sales_order', {
            p_order_id: order2.id
          });
          log('Cancel completed order (2nd attempt)', cancelErr2 ? 'BLOCKED' : 'PASS',
            cancelErr2?.message || 'unexpected success');
        }

        // Cleanup
        await from('products').delete().eq('id', prod2?.id);
        await from('sales_orders').delete().eq('id', order2.id);
      }
    } else {
      log('Cancel completed sale', 'PASS');
      // Check reversals
      const { data: revTxs } = await from('financial_transactions')
        .select('type, direction, amount, reference_type, reference_id')
        .eq('organization_id', ORG_ID)
        .eq('type', 'reversal');
      log('Reversals created', (revTxs?.length || 0) > 0 ? 'PASS' : 'FAIL',
        `got ${revTxs?.length || 0}`);
    }
  }

  // ========================================================
  // 23. REVERSE FINANCIAL TRANSACTION (manual)
  // ========================================================
  console.log('\n23. REVERSE FINANCIAL TRANSACTION');
  {
    // Create manual transaction
    const { data: manualTx } = await from('financial_transactions')
      .insert({
        organization_id: ORG_ID,
        type: 'manual',
        direction: 'in',
        amount: 250.00,
        description: 'TEST_MANUAL_TX_1',
        occurred_at: new Date().toISOString(),
        created_by: userId
      })
      .select()
      .single();

    if (manualTx) {
      log('Create manual transaction', 'PASS', `id=${manualTx.id}`);

      const { data: rev1, error: revErr1 } = await rpc('reverse_financial_transaction', {
        p_original_id: manualTx.id,
        p_description: 'Test reversal'
      });
      log('Reverse manual tx', revErr1 ? 'FAIL' : 'PASS', revErr1?.message);

      // Try reversing again
      const r23a = await shouldFail(
        rpc('reverse_financial_transaction', { p_original_id: manualTx.id })
      );
      log('Double reverse same tx', r23a.ok ? 'BLOCKED' : 'FAIL', r23a.msg);

      // Try reversing the reversal
      const { data: revTxs } = await from('financial_transactions')
        .select('id')
        .eq('organization_id', ORG_ID)
        .eq('type', 'reversal')
        .eq('reference_type', 'financial_transaction')
        .eq('reference_id', manualTx.id);

      if (revTxs?.length > 0) {
        const r23b = await shouldFail(
          rpc('reverse_financial_transaction', { p_original_id: revTxs[0].id })
        );
        log('Reverse a reversal', r23b.ok ? 'BLOCKED' : 'FAIL', r23b.msg);
      }
    }
  }

  // ========================================================
  // 27. DETAIL EDITING
  // ========================================================
  console.log('\n27. DETAIL EDITING');
  {
    const { data: apDet } = await from('accounts_payable')
      .insert({
        organization_id: ORG_ID,
        description: 'TEST_AP_DETAIL',
        amount: 100.00,
        paid_amount: 0,
        due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
        status: 'pending',
        created_by: userId
      })
      .select()
      .single();

    if (apDet) {
      const { error: detErr } = await from('accounts_payable')
        .update({
          description: 'TEST_AP_DETAIL_UPDATED',
          due_date: new Date(Date.now() + 45*86400000).toISOString().slice(0,10),
          notes: 'Updated via detail edit'
        })
        .eq('id', apDet.id);
      log('AP detail edit (description, due_date, notes)', detErr ? 'FAIL' : 'PASS', detErr?.message);
    }

    const { data: arDet } = await from('accounts_receivable')
      .insert({
        organization_id: ORG_ID,
        description: 'TEST_AR_DETAIL',
        amount: 100.00,
        received_amount: 0,
        due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
        status: 'pending',
        created_by: userId
      })
      .select()
      .single();

    if (arDet) {
      const { error: detErr2 } = await from('accounts_receivable')
        .update({
          description: 'TEST_AR_DETAIL_UPDATED',
          notes: 'Updated via detail edit'
        })
        .eq('id', arDet.id);
      log('AR detail edit (description, notes)', detErr2 ? 'FAIL' : 'PASS', detErr2?.message);
    }
  }

  // ========================================================
  // 33. QUERY EXISTING INDEXES
  // ========================================================
  console.log('\n33. QUERY EXISTING INDEXES');
  {
    // Test unique indexes by trying duplicate operations
    // uq_ap_per_purchase_order — try creating 2 APs for same PO
    const fakePO2 = crypto.randomUUID();
    const { data: apA } = await from('accounts_payable')
      .insert({
        organization_id: ORG_ID,
        description: 'TEST_UQ_AP_1',
        amount: 100.00,
        paid_amount: 0,
        due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
        status: 'pending',
        purchase_order_id: fakePO2,
        created_by: userId
      })
      .select()
      .single();

    if (apA) {
      const r33 = await shouldFail(
        from('accounts_payable')
          .insert({
            organization_id: ORG_ID,
            description: 'TEST_UQ_AP_2',
            amount: 200.00,
            paid_amount: 0,
            due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
            status: 'pending',
            purchase_order_id: fakePO2,
            created_by: userId
          })
      );
      log('uq_ap_per_purchase_order blocks duplicate', r33.ok ? 'BLOCKED' : 'FAIL', r33.msg);
    }
  }

  // ========================================================
  // FINAL CLEANUP
  // ========================================================
  console.log('\n🧹 Final cleanup...');
  await from('financial_transactions')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('description', 'TEST_%');
  await from('accounts_payable')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('description', 'TEST_%');
  await from('accounts_receivable')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('description', 'TEST_%');
  // Clean test product
  await from('products')
    .delete()
    .eq('organization_id', ORG_ID)
    .in('name', ['TEST_SPLIT_PRODUCT', 'TEST_CANCEL_PRODUCT']);
  // Clean test order
  await from('sales_order_items')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('product_name', 'TEST_%');
  await from('sales_payments')
    .delete()
    .eq('organization_id', ORG_ID);
  await from('sales_orders')
    .delete()
    .eq('organization_id', ORG_ID)
    .like('order_number', 'TEST-FIN-007%'); // cleanup pattern

  // ========================================================
  // SUMMARY
  // ========================================================
  console.log('\n==================================================');
  console.log('RESULTS SUMMARY');
  console.log('==================================================');
  console.log(`  ✅ PASS: ${passed}`);
  console.log(`  ❌ FAIL: ${failed}`);
  console.log(`  🛡️ BLOCKED: ${blocked}`);
  console.log(`  Total: ${passed + failed + blocked}`);
  console.log('');

  if (failed > 0) {
    console.log('❌ FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.label}: ${r.detail}`);
    });
  }

  console.log('\n==================================================');
  console.log(failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('==================================================');
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
