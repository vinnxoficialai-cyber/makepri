import { supabase, testarConexao } from './lib/supabase';
import { ProductService, CustomerService, UserService } from './lib/database';

// =====================================================
// TESTE DE CONEXÃO COM SUPABASE
// =====================================================

export async function testarIntegracaoCompleta() {
    console.log('🔍 Iniciando testes de integração com Supabase...\n');

    try {
        // 1. Testar conexão básica
        console.log('1️⃣ Testando conexão básica...');
        await testarConexao();
        console.log('✅ Conexão estabelecida!\n');

        // 2. Testar busca de produtos
        console.log('2️⃣ Testando busca de produtos...');
        const products = await ProductService.getAll();
        console.log(`✅ ${products.length} produtos encontrados`);
        if (products.length > 0) {
            console.log(`   Exemplo: ${products[0].name} - R$ ${products[0].priceSale}`);
        }
        console.log('');

        // 3. Testar busca de clientes
        console.log('3️⃣ Testando busca de clientes...');
        const customers = await CustomerService.getAll();
        console.log(`✅ ${customers.length} clientes encontrados`);
        if (customers.length > 0) {
            console.log(`   Exemplo: ${customers[0].name} - ${customers[0].email}`);
        }
        console.log('');

        // 4. Testar busca de usuários
        console.log('4️⃣ Testando busca de usuários...');
        const users = await UserService.getAll();
        console.log(`✅ ${users.length} usuários encontrados`);
        if (users.length > 0) {
            console.log(`   Exemplo: ${users[0].name} - ${users[0].role}`);
        }
        console.log('');

        // 5. Resumo
        console.log('📊 RESUMO DOS TESTES:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Produtos: ${products.length}`);
        console.log(`✅ Clientes: ${customers.length}`);
        console.log(`✅ Usuários: ${users.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🎉 TODOS OS TESTES PASSARAM!\n');
        console.log('✅ Seu sistema está conectado ao Supabase!');
        console.log('✅ Você pode começar a usar os dados reais!\n');

        return {
            success: true,
            data: {
                products: products.length,
                customers: customers.length,
                users: users.length
            }
        };

    } catch (error: any) {
        console.error('\n❌ ERRO NOS TESTES:');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(error.message);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('💡 POSSÍVEIS SOLUÇÕES:');
        console.log('1. Verifique se executou os SQLs no Supabase');
        console.log('2. Verifique as variáveis de ambiente no .env.local');
        console.log('3. Verifique se o projeto Supabase está ativo\n');

        return {
            success: false,
            error: error.message
        };
    }
}

// Exportar para uso no console do navegador
if (typeof window !== 'undefined') {
    (window as any).testarSupabase = testarIntegracaoCompleta;
}
