-- Seed Owner (You must update the auth_id after creating the user in Auth > Users)
-- For now, we insert a placeholder. The user needs to sign up, then update this record.
insert into public.profiles (full_name, role, monthly_fee, phone_number, phone_last4, contract_start_month, contract_end_month)
values 
('Owner', 'owner', 0, null, null, null, null)
on conflict (full_name) do nothing;

-- Seed Test Contractors (Japanese names with phone numbers)
insert into public.profiles (full_name, role, monthly_fee, phone_number, phone_last4, contract_start_month, contract_end_month)
values 
('田中', 'contractor', 12000, '090-1234-5678', '5678', '2025-12', null),
('鈴木', 'contractor', 10000, '080-9876-5432', '5432', '2025-12', null),
('佐々木', 'contractor', 3000, '070-1111-2222', '2222', '2025-12', null)
on conflict (full_name) do nothing;
