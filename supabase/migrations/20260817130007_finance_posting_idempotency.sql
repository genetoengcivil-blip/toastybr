-- =============================================================
-- Toasty OS — Finance Architecture Fix
-- Migration: 20260817130007_finance_posting_idempotency.sql
-- =============================================================
-- Corrective migration implementing:
-- 1. Per-sales-payment posting model
-- 2. Structural idempotency (unique indexes)
-- 3. Reversal model pointing to original tx
-- 4. AP/AR mutation security (before update triggers)
-- 5. AP structural idempotency per PO
-- 6. Amount authority (auto AP/AR immutable, manual gated)
-- 7. Cancel RPCs for AP/AR (pending only, paid/received blocked)

-- =============================================================
-- 1. STRUCTURAL IDEMPOTENCY — UNIQUE INDEXES
-- =============================================================

-- 1a. One sale posting per sales_payment
-- Prevents double-posting if finalize_sales_order is retried
CREATE UNIQUE INDEX uq_ft_sale_per_payment
  ON public.financial_transactions (organization_id, reference_id)
  WHERE reference_type = 'sales_payment'
    AND type = 'sale';

-- 1b. One reversal per original financial_transaction
-- Prevents double-reverse via reverse_financial_transaction or cancel
CREATE UNIQUE INDEX uq_ft_reversal_per_original
  ON public.financial_transactions (organization_id, reference_id)
  WHERE type = 'reversal'
    AND reference_type = 'financial_transaction';

-- 1c. One AP per purchase_order per organization
-- Structural idempotency for receive_purchase_order
CREATE UNIQUE INDEX uq_ap_per_purchase_order
  ON public.accounts_payable (organization_id, purchase_order_id)
  WHERE purchase_order_id IS NOT NULL;

-- =============================================================
-- 2. AP/AR MUTATION SECURITY — BEFORE UPDATE TRIGGERS
-- =============================================================
-- Protects: paid_amount, received_amount, status (terminal),
--           paid_at, received_at
-- Allows: description, due_date, category_id, cost_center_id, notes, amount

CREATE OR REPLACE FUNCTION public.prevent_ap_sensitive_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('app.allow_sensitive_update', true) IS DISTINCT FROM 'true' THEN
    IF NEW.paid_amount IS DISTINCT FROM OLD.paid_amount THEN
      RAISE EXCEPTION 'paid_amount não pode ser alterado diretamente';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'status não pode ser alterado diretamente';
    END IF;

    IF NEW.paid_at IS DISTINCT FROM OLD.paid_at THEN
      RAISE EXCEPTION 'paid_at não pode ser alterado diretamente';
    END IF;

    IF NEW.amount IS DISTINCT FROM OLD.amount THEN
      IF OLD.purchase_order_id IS NOT NULL THEN
        RAISE EXCEPTION 'amount de conta a pagar originada de compra é imutável';
      END IF;

      IF OLD.paid_amount > 0 OR OLD.status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'amount só pode ser alterado em conta pendente sem pagamentos';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_ap_sensitive_mutation
  BEFORE UPDATE ON public.accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ap_sensitive_mutation();

CREATE OR REPLACE FUNCTION public.prevent_ar_sensitive_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('app.allow_sensitive_update', true) IS DISTINCT FROM 'true' THEN
    IF NEW.received_amount IS DISTINCT FROM OLD.received_amount THEN
      RAISE EXCEPTION 'received_amount não pode ser alterado diretamente';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'status não pode ser alterado diretamente';
    END IF;

    IF NEW.received_at IS DISTINCT FROM OLD.received_at THEN
      RAISE EXCEPTION 'received_at não pode ser alterado diretamente';
    END IF;

    IF NEW.amount IS DISTINCT FROM OLD.amount THEN
      IF OLD.sales_order_id IS NOT NULL THEN
        RAISE EXCEPTION 'amount de conta a receber originada de venda é imutável';
      END IF;

      IF OLD.received_amount > 0 OR OLD.status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'amount só pode ser alterado em conta pendente sem recebimentos';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_ar_sensitive_mutation
  BEFORE UPDATE ON public.accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ar_sensitive_mutation();

-- =============================================================
-- 3. REPLACE pay_account_payable — add GUC for trigger bypass
-- =============================================================

CREATE OR REPLACE FUNCTION public.pay_account_payable(
  p_ap_id        uuid,
  p_amount       numeric(14,2),
  p_category_id  uuid default null,
  p_cost_center_id uuid default null,
  p_notes        text default null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id     uuid;
  v_ap         record;
  v_new_paid   numeric(14,2);
  v_new_status text;
  v_user_id    uuid;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_ap
  FROM accounts_payable
  WHERE id = p_ap_id
  FOR UPDATE;

  IF NOT found THEN
    RAISE EXCEPTION 'Conta a pagar não encontrada';
  END IF;

  v_org_id := v_ap.organization_id;

  IF NOT is_member_of(v_org_id) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF NOT (
    has_org_role(v_org_id, 'owner')
    OR has_org_role(v_org_id, 'admin')
    OR has_org_role(v_org_id, 'manager')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para pagar contas';
  END IF;

  IF v_ap.status IN ('paid', 'cancelled') THEN
    RAISE EXCEPTION 'Conta já % — impossível pagar', v_ap.status;
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser maior que zero';
  END IF;

  PERFORM set_config('app.allow_sensitive_update', 'true', true);

  v_new_paid := v_ap.paid_amount + p_amount;
  IF v_new_paid > v_ap.amount THEN
    RAISE EXCEPTION 'Valor excede saldo pendente (R$ %)',
      to_char(v_ap.amount - v_ap.paid_amount, 'FM999G990D99');
  END IF;

  IF v_new_paid >= v_ap.amount THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partially_paid';
  END IF;

  UPDATE accounts_payable
  SET paid_amount = v_new_paid,
      status      = v_new_status,
      paid_at     = CASE WHEN v_new_status = 'paid' THEN now() ELSE paid_at END,
      notes       = CASE WHEN p_notes IS NOT NULL THEN p_notes ELSE notes END,
      updated_at  = now()
  WHERE id = p_ap_id;

  INSERT INTO financial_transactions (
    organization_id, type, direction, amount, category_id, cost_center_id,
    reference_type, reference_id, description, occurred_at, created_by
  ) VALUES (
    v_org_id, 'payment', 'out', p_amount,
    coalesce(p_category_id, v_ap.category_id),
    coalesce(p_cost_center_id, v_ap.cost_center_id),
    'accounts_payable', p_ap_id,
    'Pagamento: ' || v_ap.description,
    now(), v_user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'paid_amount', v_new_paid,
    'status', v_new_status
  );
END;
$$;

-- =============================================================
-- 4. REPLACE receive_account_receivable — add GUC for trigger bypass
-- =============================================================

CREATE OR REPLACE FUNCTION public.receive_account_receivable(
  p_ar_id          uuid,
  p_amount         numeric(14,2),
  p_category_id    uuid default null,
  p_cost_center_id uuid default null,
  p_notes          text default null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id       uuid;
  v_ar           record;
  v_new_received numeric(14,2);
  v_new_status   text;
  v_user_id      uuid;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_ar
  FROM accounts_receivable
  WHERE id = p_ar_id
  FOR UPDATE;

  IF NOT found THEN
    RAISE EXCEPTION 'Conta a receber não encontrada';
  END IF;

  v_org_id := v_ar.organization_id;

  IF NOT is_member_of(v_org_id) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF NOT (
    has_org_role(v_org_id, 'owner')
    OR has_org_role(v_org_id, 'admin')
    OR has_org_role(v_org_id, 'manager')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para receber contas';
  END IF;

  IF v_ar.status IN ('received', 'cancelled') THEN
    RAISE EXCEPTION 'Conta já % — impossível receber', v_ar.status;
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser maior que zero';
  END IF;

  PERFORM set_config('app.allow_sensitive_update', 'true', true);

  v_new_received := v_ar.received_amount + p_amount;
  IF v_new_received > v_ar.amount THEN
    RAISE EXCEPTION 'Valor excede saldo pendente (R$ %)',
      to_char(v_ar.amount - v_ar.received_amount, 'FM999G990D99');
  END IF;

  IF v_new_received >= v_ar.amount THEN
    v_new_status := 'received';
  ELSE
    v_new_status := 'partially_received';
  END IF;

  UPDATE accounts_receivable
  SET received_amount = v_new_received,
      status          = v_new_status,
      received_at     = CASE WHEN v_new_status = 'received' THEN now() ELSE received_at END,
      notes           = CASE WHEN p_notes IS NOT NULL THEN p_notes ELSE notes END,
      updated_at      = now()
  WHERE id = p_ar_id;

  INSERT INTO financial_transactions (
    organization_id, type, direction, amount, category_id, cost_center_id,
    reference_type, reference_id, description, occurred_at, created_by
  ) VALUES (
    v_org_id, 'receipt', 'in', p_amount,
    coalesce(p_category_id, v_ar.category_id),
    coalesce(p_cost_center_id, v_ar.cost_center_id),
    'accounts_receivable', p_ar_id,
    'Recebimento: ' || v_ar.description,
    now(), v_user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'received_amount', v_new_received,
    'status', v_new_status
  );
END;
$$;

-- =============================================================
-- 5. NEW cancel_account_payable
-- =============================================================
-- Only cancellable when pending (paid_amount = 0).
-- Partially paid or fully paid AP cannot be cancelled.

CREATE OR REPLACE FUNCTION public.cancel_account_payable(
  p_ap_id   uuid,
  p_reason  text DEFAULT null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id  uuid;
  v_ap      record;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_ap
  FROM accounts_payable
  WHERE id = p_ap_id
  FOR UPDATE;

  IF NOT found THEN
    RAISE EXCEPTION 'Conta a pagar não encontrada';
  END IF;

  v_org_id := v_ap.organization_id;

  IF NOT is_member_of(v_org_id) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF NOT (
    has_org_role(v_org_id, 'owner')
    OR has_org_role(v_org_id, 'admin')
    OR has_org_role(v_org_id, 'manager')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para cancelar contas';
  END IF;

  IF v_ap.status = 'cancelled' THEN
    RAISE EXCEPTION 'Conta já está cancelada';
  END IF;

  IF v_ap.status = 'paid' THEN
    RAISE EXCEPTION 'Conta paga não pode ser cancelada diretamente. Use estorno financeiro.';
  END IF;

  IF v_ap.paid_amount > 0 THEN
    RAISE EXCEPTION 'Conta com pagamento parcial não pode ser cancelada diretamente. Use estorno financeiro.';
  END IF;

  IF v_ap.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Conta com status % não pode ser cancelada', v_ap.status;
  END IF;

  PERFORM set_config('app.allow_sensitive_update', 'true', true);

  UPDATE accounts_payable
  SET status     = 'cancelled',
      notes      = CASE WHEN p_reason IS NOT NULL
                    THEN coalesce(notes || E'\n', '') || 'Cancelamento: ' || p_reason
                    ELSE notes
                   END,
      updated_at = now()
  WHERE id = p_ap_id;

  RETURN jsonb_build_object('success', true, 'status', 'cancelled');
END;
$$;

-- =============================================================
-- 6. NEW cancel_account_receivable
-- =============================================================
-- Only cancellable when pending (received_amount = 0).

CREATE OR REPLACE FUNCTION public.cancel_account_receivable(
  p_ar_id   uuid,
  p_reason  text DEFAULT null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id  uuid;
  v_ar      record;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_ar
  FROM accounts_receivable
  WHERE id = p_ar_id
  FOR UPDATE;

  IF NOT found THEN
    RAISE EXCEPTION 'Conta a receber não encontrada';
  END IF;

  v_org_id := v_ar.organization_id;

  IF NOT is_member_of(v_org_id) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF NOT (
    has_org_role(v_org_id, 'owner')
    OR has_org_role(v_org_id, 'admin')
    OR has_org_role(v_org_id, 'manager')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para cancelar contas';
  END IF;

  IF v_ar.status = 'cancelled' THEN
    RAISE EXCEPTION 'Conta já está cancelada';
  END IF;

  IF v_ar.status = 'received' THEN
    RAISE EXCEPTION 'Conta recebida não pode ser cancelada diretamente. Use estorno financeiro.';
  END IF;

  IF v_ar.received_amount > 0 THEN
    RAISE EXCEPTION 'Conta com recebimento parcial não pode ser cancelada diretamente. Use estorno financeiro.';
  END IF;

  IF v_ar.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Conta com status % não pode ser cancelada', v_ar.status;
  END IF;

  PERFORM set_config('app.allow_sensitive_update', 'true', true);

  UPDATE accounts_receivable
  SET status     = 'cancelled',
      notes      = CASE WHEN p_reason IS NOT NULL
                    THEN coalesce(notes || E'\n', '') || 'Cancelamento: ' || p_reason
                    ELSE notes
                   END,
      updated_at = now()
  WHERE id = p_ar_id;

  RETURN jsonb_build_object('success', true, 'status', 'cancelled');
END;
$$;

-- =============================================================
-- 7. REPLACE reverse_financial_transaction — new reference model
-- =============================================================
-- Reversal now references the original tx via:
--   reference_type = 'financial_transaction'
--   reference_id   = original.id
-- Unique index prevents double-reverse.

CREATE OR REPLACE FUNCTION public.reverse_financial_transaction(
  p_original_id   uuid,
  p_description   text DEFAULT null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orig         record;
  v_user_id      uuid;
  v_reversal_desc text;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_orig
  FROM financial_transactions
  WHERE id = p_original_id;

  IF NOT found THEN
    RAISE EXCEPTION 'Transação não encontrada';
  END IF;

  IF NOT is_member_of(v_orig.organization_id) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF NOT (
    has_org_role(v_orig.organization_id, 'owner')
    OR has_org_role(v_orig.organization_id, 'admin')
    OR has_org_role(v_orig.organization_id, 'manager')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para estornar transações';
  END IF;

  IF v_orig.type = 'reversal' THEN
    RAISE EXCEPTION 'Não é possível estornar um estorno';
  END IF;

  v_reversal_desc := coalesce(p_description, 'Estorno: ' || v_orig.description);

  INSERT INTO financial_transactions (
    organization_id, type, direction, amount, category_id, cost_center_id,
    reference_type, reference_id, description, occurred_at, created_by
  ) VALUES (
    v_orig.organization_id, 'reversal',
    CASE WHEN v_orig.direction = 'in' THEN 'out' ELSE 'in' END,
    v_orig.amount,
    v_orig.category_id, v_orig.cost_center_id,
    'financial_transaction', v_orig.id,
    v_reversal_desc, now(), v_user_id
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- =============================================================
-- 8. REPLACE finalize_sales_order — per-payment posting
-- =============================================================
-- Preserves ALL original logic.
-- Financial integration: 1 financial_transaction per confirmed sales_payment.

CREATE OR REPLACE FUNCTION public.finalize_sales_order(
  p_order_id uuid,
  p_customer_id uuid DEFAULT null,
  p_coupon_id uuid DEFAULT null,
  p_coupon_code text DEFAULT null,
  p_coupon_discount numeric DEFAULT 0,
  p_discount numeric DEFAULT 0,
  p_service_fee numeric DEFAULT 0,
  p_delivery_fee numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_user_role public.org_role;
  v_order record;
  v_item record;
  v_official_price numeric;
  v_item_calculated_subtotal numeric;
  v_new_subtotal numeric := 0;
  v_new_total numeric;
  v_coupon record;
  v_effective_discount numeric := 0;
  v_payments_total numeric := 0;
  v_payment record;
  v_recipe_item record;
  v_ingredient_agg numeric;
  v_balance record;
  v_new_qty numeric;
  v_movement_id uuid;
  v_loyalty_settings record;
  v_points_to_earn integer := 0;
  v_loyalty_account record;
  v_new_points_balance integer;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT so.* INTO v_order
  FROM public.sales_orders so
  WHERE so.id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  v_org_id := v_order.organization_id;

  SELECT om.role INTO v_user_role
  FROM public.organization_members om
  WHERE om.organization_id = v_org_id
    AND om.user_id = auth.uid();

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Sem acesso a esta organização';
  END IF;

  IF v_user_role NOT IN ('owner', 'admin', 'manager', 'staff') THEN
    RAISE EXCEPTION 'Sem permissão para finalizar pedido';
  END IF;

  IF v_order.status <> 'open' THEN
    RAISE EXCEPTION 'Pedido não está aberto. Status atual: %', v_order.status;
  END IF;

  FOR v_item IN
    SELECT soi.*, p.price AS official_price
    FROM public.sales_order_items soi
    LEFT JOIN public.products p ON p.id = soi.product_id
    WHERE soi.sales_order_id = p_order_id
      AND soi.organization_id = v_org_id
  LOOP
    v_official_price := coalesce(v_item.official_price, v_item.unit_price);
    v_item_calculated_subtotal := v_item.quantity * v_official_price;
    v_new_subtotal := v_new_subtotal + v_item_calculated_subtotal;
  END LOOP;

  IF v_new_subtotal = 0 THEN
    RAISE EXCEPTION 'Pedido sem itens';
  END IF;

  IF p_coupon_id IS NOT NULL THEN
    SELECT c.* INTO v_coupon
    FROM public.coupons c
    WHERE c.id = p_coupon_id
      AND c.organization_id = v_org_id
    FOR UPDATE;

    IF v_coupon IS NULL THEN
      RAISE EXCEPTION 'Cupom não encontrado';
    END IF;

    IF NOT v_coupon.is_active THEN
      RAISE EXCEPTION 'Cupom inativo';
    END IF;

    IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > now() THEN
      RAISE EXCEPTION 'Cupom ainda não está ativo';
    END IF;

    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
      RAISE EXCEPTION 'Cupom expirado';
    END IF;

    IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'Cupom atingiu limite de uso';
    END IF;

    IF v_new_subtotal < v_coupon.min_order THEN
      RAISE EXCEPTION 'Pedido abaixo do valor mínimo. Mínimo: R$ %', v_coupon.min_order;
    END IF;

    IF v_coupon.type = 'percentage' THEN
      v_effective_discount := round(v_new_subtotal * v_coupon.value / 100, 2);
    ELSE
      v_effective_discount := v_coupon.value;
    END IF;

    IF v_effective_discount > v_new_subtotal THEN
      v_effective_discount := v_new_subtotal;
    END IF;

    UPDATE public.coupons
    SET current_uses = current_uses + 1,
        updated_at = now()
    WHERE id = p_coupon_id;
  END IF;

  SELECT coalesce(sum(sp.amount), 0) INTO v_payments_total
  FROM public.sales_payments sp
  WHERE sp.sales_order_id = p_order_id
    AND sp.status = 'confirmed';

  v_new_total := v_new_subtotal - v_effective_discount + p_service_fee + p_delivery_fee;

  IF v_new_total < 0 THEN
    v_new_total := 0;
  END IF;

  IF v_payments_total < v_new_total THEN
    RAISE EXCEPTION 'Pagamento insuficiente. Total: R$ %, Pago: R$ %',
      v_new_total, v_payments_total;
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS tmp_ingredient_consumption (
    ingredient_id uuid PRIMARY KEY,
    total_consumption numeric NOT NULL
  ) ON COMMIT DROP;

  TRUNCATE tmp_ingredient_consumption;

  FOR v_item IN
    SELECT soi.product_id, soi.quantity AS sold_qty
    FROM public.sales_order_items soi
    WHERE soi.sales_order_id = p_order_id
      AND soi.organization_id = v_org_id
      AND soi.product_id IS NOT NULL
  LOOP
    FOR v_recipe_item IN
      SELECT pri.ingredient_id, pri.quantity AS recipe_qty
      FROM public.product_recipe_items pri
      WHERE pri.product_id = v_item.product_id
        AND pri.organization_id = v_org_id
    LOOP
      v_ingredient_agg := v_item.sold_qty * v_recipe_item.recipe_qty;

      INSERT INTO tmp_ingredient_consumption (ingredient_id, total_consumption)
      VALUES (v_recipe_item.ingredient_id, v_ingredient_agg)
      ON CONFLICT (ingredient_id)
      DO UPDATE SET total_consumption = tmp_ingredient_consumption.total_consumption
                    + excluded.total_consumption;
    END LOOP;
  END LOOP;

  FOR v_balance IN
    SELECT ib.id, ib.ingredient_id, ib.quantity,
           tc.total_consumption
    FROM tmp_ingredient_consumption tc
    JOIN public.inventory_balances ib
      ON ib.ingredient_id = tc.ingredient_id
      AND ib.organization_id = v_org_id
    ORDER BY tc.ingredient_id
  LOOP
    IF v_balance.quantity < v_balance.total_consumption THEN
      RAISE EXCEPTION 'Estoque insuficiente para ingrediente. Disponível: %, Necessário: %',
        v_balance.quantity, v_balance.total_consumption;
    END IF;

    v_new_qty := v_balance.quantity - v_balance.total_consumption;

    UPDATE public.inventory_balances
    SET quantity = v_new_qty,
        updated_at = now()
    WHERE id = v_balance.id;

    INSERT INTO public.inventory_movements (
      organization_id, ingredient_id, type, quantity,
      previous_quantity, new_quantity,
      reason, reference_type, reference_id, created_by
    ) VALUES (
      v_org_id, v_balance.ingredient_id, 'exit', v_balance.total_consumption,
      v_balance.quantity, v_new_qty,
      'Venda ' || v_order.order_number,
      'sales_order', p_order_id, auth.uid()
    )
    RETURNING id INTO v_movement_id;
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    INSERT INTO public.coupon_redemptions (
      organization_id, coupon_id, customer_id, sales_order_id, discount_amount
    ) VALUES (
      v_org_id, p_coupon_id, p_customer_id, p_order_id, v_effective_discount
    );
  END IF;

  IF p_customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET total_orders = total_orders + 1,
        total_spent = total_spent + v_new_total,
        last_order_at = now(),
        updated_at = now()
    WHERE id = p_customer_id
      AND organization_id = v_org_id;
  END IF;

  IF p_customer_id IS NOT NULL THEN
    SELECT ls.* INTO v_loyalty_settings
    FROM public.loyalty_settings ls
    WHERE ls.organization_id = v_org_id
      AND ls.is_active = true;

    IF v_loyalty_settings IS NOT NULL AND v_loyalty_settings.points_per_real > 0 THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.loyalty_transactions lt
        WHERE lt.organization_id = v_org_id
          AND lt.customer_id = p_customer_id
          AND lt.reference_type = 'sales_order'
          AND lt.reference_id = p_order_id
          AND lt.type = 'earn'
      ) THEN
        v_points_to_earn := floor(v_new_total * v_loyalty_settings.points_per_real)::integer;

        IF v_points_to_earn > 0 THEN
          SELECT la.id, la.points_balance INTO v_loyalty_account
          FROM public.loyalty_accounts la
          WHERE la.organization_id = v_org_id
            AND la.customer_id = p_customer_id
          FOR UPDATE;

          IF v_loyalty_account IS NULL THEN
            INSERT INTO public.loyalty_accounts (organization_id, customer_id, points_balance, lifetime_points)
            VALUES (v_org_id, p_customer_id, 0, 0)
            RETURNING id, points_balance INTO v_loyalty_account;
          END IF;

          v_new_points_balance := v_loyalty_account.points_balance + v_points_to_earn;

          UPDATE public.loyalty_accounts
          SET points_balance = v_new_points_balance,
              lifetime_points = lifetime_points + v_points_to_earn,
              updated_at = now()
          WHERE id = v_loyalty_account.id;

          INSERT INTO public.loyalty_transactions (
            organization_id, customer_id, loyalty_account_id,
            type, points, balance_before, balance_after,
            reference_type, reference_id, description, created_by
          ) VALUES (
            v_org_id, p_customer_id, v_loyalty_account.id,
            'earn', v_points_to_earn, v_loyalty_account.points_balance, v_new_points_balance,
            'sales_order', p_order_id, 'Pontos da venda ' || v_order.order_number, auth.uid()
          );
        END IF;
      END IF;
    END IF;
  END IF;

  UPDATE public.sales_orders
  SET status = 'completed',
      subtotal = v_new_subtotal,
      discount = p_discount,
      service_fee = p_service_fee,
      delivery_fee = p_delivery_fee,
      total = v_new_total,
      coupon_id = p_coupon_id,
      coupon_code = p_coupon_code,
      coupon_discount = v_effective_discount,
      customer_id = p_customer_id,
      confirmed_at = coalesce(confirmed_at, now()),
      completed_at = now(),
      closed_by = auth.uid(),
      updated_at = now()
  WHERE id = p_order_id
    AND organization_id = v_org_id;

  -- ====== FINANCE INTEGRATION ======
  -- 1 financial_transaction per confirmed sales_payment
  FOR v_payment IN
    SELECT sp.*
    FROM public.sales_payments sp
    WHERE sp.sales_order_id = p_order_id
      AND sp.status = 'confirmed'
  LOOP
    INSERT INTO public.financial_transactions (
      organization_id, type, direction, amount,
      category_id, cost_center_id,
      reference_type, reference_id, description,
      occurred_at, created_by
    ) VALUES (
      v_org_id, 'sale', 'in', v_payment.amount,
      null, null,
      'sales_payment', v_payment.id,
      'Venda #' || v_order.order_number || ' (' || v_payment.method || ')',
      now(), auth.uid()
    );
  END LOOP;

  v_result := jsonb_build_object(
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'subtotal', v_new_subtotal,
    'discount', v_effective_discount,
    'total', v_new_total,
    'payments_total', v_payments_total,
    'change', v_payments_total - v_new_total,
    'points_earned', v_points_to_earn
  );

  RETURN v_result;
END;
$$;

-- =============================================================
-- 9. REPLACE cancel_sales_order — per-original reversal
-- =============================================================
-- Preserves ALL original logic.
-- Financial reversal: one reversal per original financial_transaction,
-- referenced via reference_type = 'financial_transaction'.

CREATE OR REPLACE FUNCTION public.cancel_sales_order(
  p_order_id uuid,
  p_reason text DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_user_role public.org_role;
  v_order record;
  v_movement record;
  v_reversal_movement_id uuid;
  v_redemption record;
  v_loyalty_tx record;
  v_ft record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT so.* INTO v_order
  FROM public.sales_orders so
  WHERE so.id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  v_org_id := v_order.organization_id;

  SELECT om.role INTO v_user_role
  FROM public.organization_members om
  WHERE om.organization_id = v_org_id
    AND om.user_id = auth.uid();

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Sem acesso a esta organização';
  END IF;

  IF v_user_role NOT IN ('owner', 'admin', 'manager', 'staff') THEN
    RAISE EXCEPTION 'Sem permissão para cancelar pedido';
  END IF;

  IF v_order.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Pedido já % — não pode cancelar', v_order.status;
  END IF;

  IF v_order.status IN ('confirmed', 'preparing', 'ready') THEN
    FOR v_movement IN
      SELECT im.*
      FROM public.inventory_movements im
      WHERE im.reference_type = 'sales_order'
        AND im.reference_id = p_order_id
        AND im.organization_id = v_org_id
        AND im.type = 'exit'
    LOOP
      INSERT INTO public.inventory_movements (
        organization_id, ingredient_id, type, quantity,
        previous_quantity, new_quantity,
        reason, reference_type, reference_id, created_by
      ) VALUES (
        v_org_id, v_movement.ingredient_id, 'entry', v_movement.quantity,
        v_movement.new_quantity,
        v_movement.previous_quantity,
        'Cancelamento ' || v_order.order_number || coalesce(' - ' || p_reason, ''),
        'sales_order_cancellation', p_order_id, auth.uid()
      )
      RETURNING id INTO v_reversal_movement_id;

      UPDATE public.inventory_balances
      SET quantity = quantity + v_movement.quantity,
          updated_at = now()
      WHERE organization_id = v_org_id
        AND ingredient_id = v_movement.ingredient_id;
    END LOOP;
  END IF;

  FOR v_loyalty_tx IN
    SELECT lt.*
    FROM public.loyalty_transactions lt
    WHERE lt.organization_id = v_org_id
      AND lt.customer_id = v_order.customer_id
      AND lt.reference_type = 'sales_order'
      AND lt.reference_id = p_order_id
      AND lt.type = 'earn'
  LOOP
    PERFORM public.apply_loyalty_transaction(
      v_loyalty_tx.customer_id,
      'reversal',
      v_loyalty_tx.points,
      'sales_order_cancellation',
      p_order_id,
      'Reversão do cancelamento ' || v_order.order_number
    );
  END LOOP;

  FOR v_redemption IN
    SELECT cr.*
    FROM public.coupon_redemptions cr
    WHERE cr.sales_order_id = p_order_id
      AND cr.organization_id = v_org_id
      AND cr.reversed_at IS NULL
  LOOP
    UPDATE public.coupon_redemptions
    SET reversed_at = now()
    WHERE id = v_redemption.id;

    UPDATE public.coupons
    SET current_uses = greatest(current_uses - 1, 0),
        updated_at = now()
    WHERE id = v_redemption.coupon_id
      AND organization_id = v_org_id;
  END LOOP;

  IF v_order.customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET total_orders = greatest(total_orders - 1, 0),
        total_spent = greatest(total_spent - v_order.total, 0),
        last_order_at = (
          SELECT max(so.completed_at)
          FROM public.sales_orders so
          WHERE so.customer_id = v_order.customer_id
            AND so.organization_id = v_org_id
            AND so.status = 'completed'
            AND so.id <> p_order_id
        ),
        updated_at = now()
    WHERE id = v_order.customer_id
      AND organization_id = v_org_id;
  END IF;

  UPDATE public.sales_orders
  SET status = 'cancelled',
      cancelled_at = now(),
      closed_by = auth.uid(),
      notes = CASE WHEN p_reason IS NOT NULL
        THEN coalesce(notes || E'\n', '') || 'Cancelamento: ' || p_reason
        ELSE notes
      END,
      updated_at = now()
  WHERE id = p_order_id
    AND organization_id = v_org_id;

  -- ====== FINANCE INTEGRATION ======
  -- Reverse each sale financial_transaction for this order's payments.
  -- New model: reference_type = 'sales_payment', reference_id = payment.id
  FOR v_ft IN
    SELECT ft.*
    FROM public.financial_transactions ft
    WHERE ft.reference_type = 'sales_payment'
      AND ft.type = 'sale'
      AND ft.reference_id IN (
        SELECT sp.id FROM public.sales_payments sp
        WHERE sp.sales_order_id = p_order_id
          AND sp.organization_id = v_org_id
      )
      AND ft.organization_id = v_org_id
  LOOP
    INSERT INTO public.financial_transactions (
      organization_id, type, direction, amount,
      category_id, cost_center_id,
      reference_type, reference_id, description,
      occurred_at, created_by
    ) VALUES (
      v_org_id, 'reversal',
      CASE WHEN v_ft.direction = 'in' THEN 'out' ELSE 'in' END,
      v_ft.amount,
      v_ft.category_id, v_ft.cost_center_id,
      'financial_transaction', v_ft.id,
      'Estorno: ' || v_ft.description,
      now(), auth.uid()
    );
  END LOOP;

  -- Legacy safety net: reverse old model transactions (reference_type = 'sales_order')
  FOR v_ft IN
    SELECT ft.*
    FROM public.financial_transactions ft
    WHERE ft.reference_type = 'sales_order'
      AND ft.reference_id = p_order_id
      AND ft.type = 'sale'
      AND ft.organization_id = v_org_id
  LOOP
    INSERT INTO public.financial_transactions (
      organization_id, type, direction, amount,
      category_id, cost_center_id,
      reference_type, reference_id, description,
      occurred_at, created_by
    ) VALUES (
      v_org_id, 'reversal',
      CASE WHEN v_ft.direction = 'in' THEN 'out' ELSE 'in' END,
      v_ft.amount,
      v_ft.category_id, v_ft.cost_center_id,
      'financial_transaction', v_ft.id,
      'Estorno: ' || v_ft.description,
      now(), auth.uid()
    );
  END LOOP;
END;
$$;

-- =============================================================
-- 10. REPLACE receive_purchase_order — remove amount overwrite
-- =============================================================
-- Preserves ALL original logic.
-- Finance: AP amount set on creation, not overwritten on subsequent receipts.
-- This prevents silent mutation of AP amount via receipt re-processing.

CREATE OR REPLACE FUNCTION public.receive_purchase_order(
  p_po_id uuid,
  p_items jsonb,
  p_notes text DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_user_role public.org_role;
  v_po record;
  v_item jsonb;
  v_po_item record;
  v_receipt_id uuid;
  v_total_received numeric;
  v_new_status text;
  v_received_now numeric := 0;
  v_ap_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_po
  FROM public.purchase_orders
  WHERE id = p_po_id
  FOR UPDATE;

  IF v_po IS NULL THEN
    RAISE EXCEPTION 'Pedido de compra não encontrado';
  END IF;

  v_org_id := v_po.organization_id;

  SELECT om.role INTO v_user_role
  FROM public.organization_members om
  WHERE om.organization_id = v_org_id
    AND om.user_id = auth.uid();

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Sem acesso a esta organização';
  END IF;

  IF v_user_role NOT IN ('owner', 'admin', 'manager') THEN
    RAISE EXCEPTION 'Sem permissão para receber pedidos';
  END IF;

  IF v_po.status NOT IN ('draft', 'sent', 'partially_received') THEN
    RAISE EXCEPTION 'Não é possível receber pedido com status: %', v_po.status;
  END IF;

  INSERT INTO public.purchase_receipts (organization_id, po_id, notes, created_by)
  VALUES (v_org_id, p_po_id, p_notes, auth.uid())
  RETURNING id INTO v_receipt_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_po_item := NULL;

    SELECT * INTO v_po_item
    FROM public.purchase_order_items
    WHERE id = (v_item->>'po_item_id')::uuid
      AND organization_id = v_org_id
    FOR UPDATE;

    IF v_po_item IS NULL THEN
      RAISE EXCEPTION 'Item do pedido não encontrado: %', v_item->>'po_item_id';
    END IF;

    IF (v_item->>'quantity')::numeric <= 0 THEN
      RAISE EXCEPTION 'Quantidade recebida deve ser maior que zero';
    END IF;

    v_total_received := v_po_item.quantity_received + (v_item->>'quantity')::numeric;

    IF v_total_received > v_po_item.quantity_ordered THEN
      RAISE EXCEPTION 'Quantidade recebida (%) excede a solicitada (%) para ingrediente %',
        v_total_received, v_po_item.quantity_ordered, v_po_item.ingredient_id;
    END IF;

    INSERT INTO public.purchase_receipt_items (organization_id, receipt_id, po_item_id, quantity)
    VALUES (v_org_id, v_receipt_id, v_po_item.id, (v_item->>'quantity')::numeric);

    UPDATE public.purchase_order_items
    SET quantity_received = v_total_received,
        updated_at = now()
    WHERE id = v_po_item.id;

    INSERT INTO public.inventory_balances (organization_id, ingredient_id, quantity)
    VALUES (v_org_id, v_po_item.ingredient_id, 0)
    ON CONFLICT (organization_id, ingredient_id) DO NOTHING;

    DECLARE
      v_balance_id uuid;
      v_current_qty numeric;
      v_new_qty numeric;
      v_prev_qty numeric;
    BEGIN
      SELECT ib.id, ib.quantity INTO v_balance_id, v_current_qty
      FROM public.inventory_balances ib
      WHERE ib.organization_id = v_org_id
        AND ib.ingredient_id = v_po_item.ingredient_id
      FOR UPDATE;

      v_prev_qty := v_current_qty;
      v_new_qty := v_current_qty + (v_item->>'quantity')::numeric;

      UPDATE public.inventory_balances
      SET quantity = v_new_qty,
          updated_at = now()
      WHERE id = v_balance_id;

      INSERT INTO public.inventory_movements (
        organization_id, ingredient_id, type, quantity,
        previous_quantity, new_quantity, reason, reference_type, reference_id, created_by
      ) VALUES (
        v_org_id, v_po_item.ingredient_id, 'entry', (v_item->>'quantity')::numeric,
        v_prev_qty, v_new_qty, 'Recebimento de compra ' || v_po.po_number,
        'purchase_order', p_po_id, auth.uid()
      );
    END;

    UPDATE public.ingredients
    SET cost_per_unit = v_po_item.unit_cost,
        updated_at = now()
    WHERE id = v_po_item.ingredient_id
      AND organization_id = v_org_id;

    v_received_now := v_received_now + (v_item->>'quantity')::numeric * v_po_item.unit_cost;
  END LOOP;

  DECLARE
    v_subtotal numeric;
  BEGIN
    SELECT coalesce(sum(quantity_ordered * unit_cost), 0) INTO v_subtotal
    FROM public.purchase_order_items
    WHERE po_id = p_po_id;

    UPDATE public.purchase_orders
    SET total = v_subtotal - coalesce(v_po.discount, 0) + coalesce(v_po.shipping, 0),
        updated_at = now()
    WHERE id = p_po_id;
  END;

  DECLARE
    v_any_ordered boolean;
    v_all_received boolean;
  BEGIN
    SELECT exists(SELECT 1 FROM public.purchase_order_items WHERE po_id = p_po_id)
      AND (SELECT count(*) FROM public.purchase_order_items WHERE po_id = p_po_id) > 0
    INTO v_any_ordered;

    SELECT coalesce(
      (SELECT bool_and(quantity_received >= quantity_ordered)
       FROM public.purchase_order_items WHERE po_id = p_po_id), false
    ) INTO v_all_received;

    IF v_all_received THEN
      v_new_status := 'received';
    ELSIF v_any_ordered THEN
      v_new_status := 'partially_received';
    ELSE
      v_new_status := v_po.status;
    END IF;

    UPDATE public.purchase_orders
    SET status = v_new_status,
        updated_at = now()
    WHERE id = p_po_id;
  END;

  -- ====== FINANCE INTEGRATION ======
  -- Calculate total PO value for AP amount
  DECLARE
    v_total_po_value numeric;
  BEGIN
    SELECT coalesce(sum(quantity_ordered * unit_cost), 0)
    INTO v_total_po_value
    FROM public.purchase_order_items
    WHERE po_id = p_po_id
      AND organization_id = v_org_id;

    -- Idempotent: one AP per PO (enforced by unique index)
    SELECT id INTO v_ap_id
    FROM public.accounts_payable
    WHERE purchase_order_id = p_po_id
      AND organization_id = v_org_id
    LIMIT 1;

    IF v_ap_id IS NOT NULL THEN
      -- Update description only — amount is set on creation and protected
      UPDATE public.accounts_payable
      SET description = 'Compra #' || v_po.po_number,
          updated_at = now()
      WHERE id = v_ap_id;
    ELSE
      INSERT INTO public.accounts_payable (
        organization_id, description, amount, paid_amount,
        due_date, supplier_id, status,
        purchase_order_id, created_by
      ) VALUES (
        v_org_id,
        'Compra #' || v_po.po_number,
        v_total_po_value,
        0,
        (current_date + interval '30 days')::date,
        v_po.supplier_id,
        'pending',
        p_po_id,
        auth.uid()
      )
      RETURNING id INTO v_ap_id;
    END IF;
  END;

  RETURN v_receipt_id;
END;
$$;

-- =============================================================
-- 11. EXECUTE GRANTS — NEW CANCEL RPCs
-- =============================================================

REVOKE EXECUTE ON FUNCTION public.cancel_account_payable(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_account_payable(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cancel_account_receivable(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_account_receivable(uuid, text) TO authenticated;
