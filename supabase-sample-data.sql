-- =====================================================
-- DADOS DE EXEMPLO - SISTEMA VINNX
-- =====================================================
-- Execute DEPOIS do supabase-schema.sql
-- =====================================================

-- =====================================================
-- 1. INSERIR USUÁRIOS DE EXEMPLO
-- =====================================================

INSERT INTO users (name, email, role, permissions, active) VALUES
('Admin Vinnx', 'admin@vinnx.com', 'Administrador', ARRAY['dashboard', 'inventory', 'pos', 'crm', 'finance', 'reports', 'cash', 'settings', 'ecommerce', 'tasks', 'bundles', 'ai', 'goals', 'delivery', 'team'], true),
('Maria Silva', 'maria@vinnx.com', 'Gerente', ARRAY['dashboard', 'inventory', 'pos', 'crm', 'reports', 'tasks', 'goals', 'delivery', 'team'], true),
('João Santos', 'joao@vinnx.com', 'Vendedor', ARRAY['dashboard', 'pos', 'crm', 'delivery'], true),
('Ana Costa', 'ana@vinnx.com', 'Vendedor', ARRAY['dashboard', 'pos', 'crm'], true),
('Carlos Motoboy', 'carlos@vinnx.com', 'Motoboy', ARRAY['delivery'], true),
('Paula Estoque', 'paula@vinnx.com', 'Estoquista', ARRAY['inventory', 'bundles'], true);

-- =====================================================
-- 2. INSERIR PRODUTOS DE EXEMPLO
-- =====================================================

-- Cosméticos
INSERT INTO products (sku, name, category, price_cost, price_sale, stock, min_stock, unit, brand, description, commission_rate) VALUES
('COSM-001', 'Batom Matte Vermelho', 'Cosmético', 15.00, 35.00, 50, 10, 'un', 'Vinnx Beauty', 'Batom matte de longa duração, cor vermelho intenso', 10.00),
('COSM-002', 'Base Líquida FPS 30', 'Cosmético', 25.00, 65.00, 30, 5, 'un', 'Vinnx Beauty', 'Base líquida com proteção solar, cobertura média', 12.00),
('COSM-003', 'Máscara de Cílios', 'Cosmético', 12.00, 32.00, 40, 8, 'un', 'Vinnx Beauty', 'Máscara de cílios à prova d''água', 10.00),
('COSM-004', 'Paleta de Sombras', 'Cosmético', 30.00, 80.00, 20, 5, 'un', 'Vinnx Beauty', 'Paleta com 12 cores vibrantes', 15.00),
('COSM-005', 'Hidratante Facial', 'Cosmético', 18.00, 45.00, 35, 10, 'un', 'Vinnx Skin', 'Hidratante facial para todos os tipos de pele', 10.00);

-- Roupas
INSERT INTO products (sku, name, category, price_cost, price_sale, stock, min_stock, unit, size, color, collection, description, commission_rate) VALUES
('ROUPA-001', 'Camiseta Básica', 'Roupa', 20.00, 49.90, 100, 20, 'un', 'M', 'Branca', 'Verão 2026', 'Camiseta 100% algodão', 8.00),
('ROUPA-002', 'Calça Jeans Skinny', 'Roupa', 45.00, 129.90, 60, 15, 'un', '38', 'Azul', 'Verão 2026', 'Calça jeans com elastano', 10.00),
('ROUPA-003', 'Vestido Floral', 'Roupa', 35.00, 99.90, 40, 10, 'un', 'P', 'Estampado', 'Primavera 2026', 'Vestido leve e confortável', 12.00),
('ROUPA-004', 'Jaqueta Jeans', 'Roupa', 60.00, 179.90, 25, 5, 'un', 'M', 'Azul', 'Inverno 2026', 'Jaqueta jeans clássica', 15.00);

-- Acessórios
INSERT INTO products (sku, name, category, price_cost, price_sale, stock, min_stock, unit, description, commission_rate) VALUES
('ACESS-001', 'Bolsa Transversal', 'Acessório', 40.00, 99.90, 30, 8, 'un', 'Bolsa em couro sintético com alça ajustável', 10.00),
('ACESS-002', 'Óculos de Sol', 'Acessório', 25.00, 79.90, 45, 10, 'un', 'Óculos com proteção UV400', 12.00),
('ACESS-003', 'Relógio Digital', 'Acessório', 35.00, 89.90, 20, 5, 'un', 'Relógio digital à prova d''água', 10.00),
('ACESS-004', 'Colar Dourado', 'Acessório', 15.00, 45.00, 50, 15, 'un', 'Colar folheado a ouro', 8.00);

-- Eletrônicos
INSERT INTO products (sku, name, category, price_cost, price_sale, stock, min_stock, unit, brand, description, commission_rate) VALUES
('ELET-001', 'Fone de Ouvido Bluetooth', 'Eletrônico', 50.00, 149.90, 35, 10, 'un', 'TechVinnx', 'Fone bluetooth com cancelamento de ruído', 15.00),
('ELET-002', 'Carregador Portátil 10000mAh', 'Eletrônico', 30.00, 89.90, 40, 10, 'un', 'TechVinnx', 'Power bank com 2 portas USB', 12.00),
('ELET-003', 'Smartwatch', 'Eletrônico', 120.00, 349.90, 15, 5, 'un', 'TechVinnx', 'Relógio inteligente com monitor cardíaco', 20.00);

-- Kit/Combo
INSERT INTO products (sku, name, category, price_cost, price_sale, stock, min_stock, unit, type, description, commission_rate) VALUES
('KIT-001', 'Kit Maquiagem Completo', 'Kit / Combo', 0, 180.00, 10, 2, 'un', 'bundle', 'Kit com batom, base e máscara de cílios', 15.00),
('KIT-002', 'Combo Verão', 'Kit / Combo', 0, 120.00, 15, 3, 'un', 'bundle', 'Camiseta + Óculos de Sol', 12.00);

-- =====================================================
-- 3. INSERIR COMPONENTES DOS KITS
-- =====================================================

-- Kit Maquiagem Completo (usando os IDs dos produtos criados acima)
-- Nota: Você precisará ajustar os UUIDs após inserir os produtos
-- Por enquanto, vamos usar uma abordagem com subqueries

INSERT INTO bundle_components (bundle_id, product_id, quantity)
SELECT 
    (SELECT id FROM products WHERE sku = 'KIT-001'),
    (SELECT id FROM products WHERE sku = 'COSM-001'),
    1
UNION ALL
SELECT 
    (SELECT id FROM products WHERE sku = 'KIT-001'),
    (SELECT id FROM products WHERE sku = 'COSM-002'),
    1
UNION ALL
SELECT 
    (SELECT id FROM products WHERE sku = 'KIT-001'),
    (SELECT id FROM products WHERE sku = 'COSM-003'),
    1;

-- Combo Verão
INSERT INTO bundle_components (bundle_id, product_id, quantity)
SELECT 
    (SELECT id FROM products WHERE sku = 'KIT-002'),
    (SELECT id FROM products WHERE sku = 'ROUPA-001'),
    1
UNION ALL
SELECT 
    (SELECT id FROM products WHERE sku = 'KIT-002'),
    (SELECT id FROM products WHERE sku = 'ACESS-002'),
    1;

-- =====================================================
-- 4. INSERIR CLIENTES DE EXEMPLO
-- =====================================================

INSERT INTO customers (name, email, phone, cpf, address, city, state, total_spent, last_purchase, status) VALUES
('Fernanda Lima', 'fernanda@email.com', '(11) 98765-4321', '123.456.789-00', 'Rua das Flores, 123', 'São Paulo', 'SP', 450.00, NOW() - INTERVAL '2 days', 'Active'),
('Ricardo Alves', 'ricardo@email.com', '(11) 97654-3210', '987.654.321-00', 'Av. Paulista, 1000', 'São Paulo', 'SP', 890.00, NOW() - INTERVAL '5 days', 'Active'),
('Juliana Costa', 'juliana@email.com', '(11) 96543-2109', '456.789.123-00', 'Rua Augusta, 500', 'São Paulo', 'SP', 320.00, NOW() - INTERVAL '10 days', 'Active'),
('Pedro Santos', 'pedro@email.com', '(11) 95432-1098', '321.654.987-00', 'Rua Oscar Freire, 200', 'São Paulo', 'SP', 150.00, NOW() - INTERVAL '15 days', 'Active'),
('Camila Rodrigues', 'camila@email.com', '(11) 94321-0987', '654.321.987-00', 'Rua Haddock Lobo, 300', 'São Paulo', 'SP', 0, NULL, 'Active');

-- =====================================================
-- 5. INSERIR TRANSAÇÕES DE EXEMPLO
-- =====================================================

-- Transação 1
INSERT INTO transactions (customer_id, customer_name, total, status, type, payment_method, installments, sub_total, discount_value, delivery_fee, seller_id, seller_name, date)
SELECT 
    (SELECT id FROM customers WHERE email = 'fernanda@email.com'),
    'Fernanda Lima',
    450.00,
    'Completed',
    'Sale',
    'Cartão de Crédito',
    3,
    430.00,
    0,
    20.00,
    (SELECT id FROM users WHERE email = 'joao@vinnx.com'),
    'João Santos',
    NOW() - INTERVAL '2 days';

-- Itens da Transação 1
INSERT INTO transaction_items (transaction_id, product_id, product_name, product_sku, product_category, quantity, unit_price, total_price)
SELECT 
    (SELECT id FROM transactions WHERE customer_name = 'Fernanda Lima' ORDER BY date DESC LIMIT 1),
    (SELECT id FROM products WHERE sku = 'KIT-001'),
    'Kit Maquiagem Completo',
    'KIT-001',
    'Kit / Combo',
    2,
    180.00,
    360.00
UNION ALL
SELECT 
    (SELECT id FROM transactions WHERE customer_name = 'Fernanda Lima' ORDER BY date DESC LIMIT 1),
    (SELECT id FROM products WHERE sku = 'ACESS-001'),
    'Bolsa Transversal',
    'ACESS-001',
    'Acessório',
    1,
    99.90,
    99.90;

-- Transação 2
INSERT INTO transactions (customer_id, customer_name, total, status, type, payment_method, installments, sub_total, seller_id, seller_name, date)
SELECT 
    (SELECT id FROM customers WHERE email = 'ricardo@email.com'),
    'Ricardo Alves',
    349.90,
    'Completed',
    'Sale',
    'PIX',
    1,
    349.90,
    (SELECT id FROM users WHERE email = 'ana@vinnx.com'),
    'Ana Costa',
    NOW() - INTERVAL '5 days';

-- Itens da Transação 2
INSERT INTO transaction_items (transaction_id, product_id, product_name, product_sku, product_category, quantity, unit_price, total_price)
SELECT 
    (SELECT id FROM transactions WHERE customer_name = 'Ricardo Alves' ORDER BY date DESC LIMIT 1),
    (SELECT id FROM products WHERE sku = 'ELET-003'),
    'Smartwatch',
    'ELET-003',
    'Eletrônico',
    1,
    349.90,
    349.90;

-- =====================================================
-- 6. INSERIR ENTREGAS DE EXEMPLO
-- =====================================================

INSERT INTO deliveries (customer_name, phone, address, city, source, method, status, total_value, fee, motoboy_name, items_summary, date)
VALUES
('Fernanda Lima', '(11) 98765-4321', 'Rua das Flores, 123', 'São Paulo', 'E-commerce', 'Motoboy', 'Entregue', 450.00, 20.00, 'Carlos Motoboy', '2x Kit Maquiagem, 1x Bolsa', NOW() - INTERVAL '2 days'),
('Juliana Costa', '(11) 96543-2109', 'Rua Augusta, 500', 'São Paulo', 'WhatsApp', 'Motoboy', 'Em Rota', 320.00, 15.00, 'Carlos Motoboy', '1x Vestido Floral, 1x Colar', NOW() - INTERVAL '1 hour');

-- =====================================================
-- 7. INSERIR TAREFAS DE EXEMPLO
-- =====================================================

INSERT INTO tasks (title, description, assigned_to, created_by, due_date, priority, status)
SELECT 
    'Repor estoque de batons',
    'Verificar fornecedores e fazer pedido de reposição',
    (SELECT id FROM users WHERE email = 'paula@vinnx.com'),
    (SELECT id FROM users WHERE email = 'maria@vinnx.com'),
    CURRENT_DATE + INTERVAL '3 days',
    'high',
    'pending'
UNION ALL
SELECT 
    'Atualizar fotos dos produtos',
    'Tirar novas fotos dos produtos da coleção verão',
    (SELECT id FROM users WHERE email = 'joao@vinnx.com'),
    (SELECT id FROM users WHERE email = 'admin@vinnx.com'),
    CURRENT_DATE + INTERVAL '7 days',
    'medium',
    'pending'
UNION ALL
SELECT 
    'Organizar vitrine',
    'Reorganizar vitrine com produtos da nova coleção',
    (SELECT id FROM users WHERE email = 'ana@vinnx.com'),
    (SELECT id FROM users WHERE email = 'maria@vinnx.com'),
    CURRENT_DATE + INTERVAL '1 day',
    'high',
    'completed';

-- =====================================================
-- 8. INSERIR REGISTROS FINANCEIROS DE EXEMPLO
-- =====================================================

INSERT INTO financial_records (description, amount, type, date, category, status) VALUES
('Venda - Fernanda Lima', 450.00, 'Income', CURRENT_DATE - INTERVAL '2 days', 'Vendas', 'Paid'),
('Venda - Ricardo Alves', 349.90, 'Income', CURRENT_DATE - INTERVAL '5 days', 'Vendas', 'Paid'),
('Aluguel da Loja', 3500.00, 'Expense', CURRENT_DATE - INTERVAL '1 day', 'Aluguel', 'Paid'),
('Conta de Luz', 450.00, 'Expense', CURRENT_DATE - INTERVAL '3 days', 'Utilidades', 'Paid'),
('Compra de Estoque', 5000.00, 'Expense', CURRENT_DATE - INTERVAL '7 days', 'Estoque', 'Paid'),
('Salários', 8500.00, 'Expense', CURRENT_DATE - INTERVAL '10 days', 'Folha de Pagamento', 'Paid');

-- =====================================================
-- 9. INSERIR METAS DE VENDAS DE EXEMPLO
-- =====================================================

-- Meta da loja
INSERT INTO store_sales_goal (goal_amount, goal_type, period_start, period_end) VALUES
(50000.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day');

-- Metas individuais
INSERT INTO sales_goals (user_id, goal_amount, goal_type, period_start, period_end)
SELECT 
    (SELECT id FROM users WHERE email = 'joao@vinnx.com'),
    15000.00,
    'monthly',
    DATE_TRUNC('month', CURRENT_DATE),
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
UNION ALL
SELECT 
    (SELECT id FROM users WHERE email = 'ana@vinnx.com'),
    12000.00,
    'monthly',
    DATE_TRUNC('month', CURRENT_DATE),
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';

-- =====================================================
-- FIM DOS DADOS DE EXEMPLO
-- =====================================================

-- Verificar dados inseridos
SELECT 'Produtos inseridos:' as info, COUNT(*) as total FROM products
UNION ALL
SELECT 'Clientes inseridos:', COUNT(*) FROM customers
UNION ALL
SELECT 'Usuários inseridos:', COUNT(*) FROM users
UNION ALL
SELECT 'Transações inseridas:', COUNT(*) FROM transactions
UNION ALL
SELECT 'Entregas inseridas:', COUNT(*) FROM deliveries
UNION ALL
SELECT 'Tarefas inseridas:', COUNT(*) FROM tasks
UNION ALL
SELECT 'Registros financeiros:', COUNT(*) FROM financial_records;
