import { createClient } from '@supabase/supabase-js';

// Pegando as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação para garantir que as variáveis existem
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltam variáveis de ambiente do Supabase! Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas no arquivo .env.local'
  );
}

// Criando o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função auxiliar para testar a conexão
export async function testarConexao() {
  try {
    const { data, error } = await supabase.from('_test_').select('*').limit(1);
    
    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      // Isso é esperado se a tabela não existe, mas significa que a conexão funcionou!
      console.log('✅ Conexão com Supabase estabelecida com sucesso!');
      return true;
    }
    
    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar conexão:', err);
    return false;
  }
}
