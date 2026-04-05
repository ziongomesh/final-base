
ALTER TABLE public.sub_recharge_plans 
  ADD COLUMN qr_code_image TEXT DEFAULT '',
  ADD COLUMN pix_copy_paste TEXT DEFAULT '',
  ADD COLUMN whatsapp_number TEXT DEFAULT '';
