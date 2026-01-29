# 📚 Guia de Comandos - Sistema Vinnx

Este guia contém todos os comandos que você precisa para trabalhar com o projeto. **Copie e cole** os comandos no terminal (PowerShell).

---

## 🚀 Comandos Básicos

### 1️⃣ Instalar Dependências
Execute este comando sempre que baixar o projeto ou adicionar novas bibliotecas:
```bash
npm install
```

### 2️⃣ Rodar o Projeto Localmente
Para ver o projeto funcionando no navegador (geralmente em `http://localhost:5173`):
```bash
npm run dev
```

### 3️⃣ Parar o Servidor
Pressione `Ctrl + C` no terminal onde o servidor está rodando.

### 4️⃣ Criar Build de Produção
Para criar a versão otimizada para deploy:
```bash
npm run build
```

### 5️⃣ Testar Build Localmente
Para testar a versão de produção antes de fazer deploy:
```bash
npm run preview
```

---

## 📦 Git - Controle de Versão

### Verificar Status dos Arquivos
Ver quais arquivos foram modificados:
```bash
git status
```

### Adicionar Arquivos para Commit
Adicionar todos os arquivos modificados:
```bash
git add .
```

Ou adicionar arquivo específico:
```bash
git add nome-do-arquivo.ts
```

### Fazer Commit (Salvar Alterações)
```bash
git commit -m "Descrição do que você fez"
```

Exemplos:
```bash
git commit -m "Adicionado conexão com Supabase"
git commit -m "Corrigido bug na página de produtos"
git commit -m "Atualizado README"
```

### Enviar para GitHub
```bash
git push
```

Ou na primeira vez:
```bash
git push -u origin main
```

### Baixar Atualizações do GitHub
```bash
git pull
```

---

## 🗄️ Supabase - Banco de Dados

### Testar Conexão com Supabase
Você pode adicionar este código temporariamente no `App.tsx` para testar:

```typescript
import { testarConexao } from './lib/supabase';

// Dentro de um useEffect ou função
testarConexao();
```

---

## 🌐 Vercel - Deploy

### Deploy Manual (se necessário)
Se você tiver o Vercel CLI instalado:
```bash
vercel
```

Para deploy de produção:
```bash
vercel --prod
```

**Nota:** Normalmente o deploy é automático quando você faz `git push` para o GitHub!

---

## 🆘 Comandos de Emergência

### Limpar Cache do npm
Se algo estiver dando erro estranho:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Ver Versões Instaladas
```bash
node --version
npm --version
git --version
```

### Ver Logs de Erro Detalhados
```bash
npm run dev --verbose
```

---

## 📝 Fluxo de Trabalho Diário

1. **Abrir o projeto:**
   ```bash
   cd "c:\Users\User\Documents\Vinnx\loja ecommerce"
   ```

2. **Baixar atualizações (se trabalhar em equipe):**
   ```bash
   git pull
   ```

3. **Rodar o projeto:**
   ```bash
   npm run dev
   ```

4. **Fazer suas alterações no código**

5. **Salvar no Git:**
   ```bash
   git add .
   git commit -m "Descrição das alterações"
   git push
   ```

6. **Deploy automático na Vercel** 🎉

---

## 🔐 Variáveis de Ambiente

As variáveis secretas ficam no arquivo `.env.local` (que **NÃO** vai para o GitHub).

Para adicionar novas variáveis:
1. Abra o arquivo `.env.local`
2. Adicione no formato: `VITE_NOME_VARIAVEL=valor`
3. Reinicie o servidor (`Ctrl + C` e depois `npm run dev`)

**Importante:** Na Vercel, você precisa adicionar as mesmas variáveis manualmente no painel de configurações!

---

## 💡 Dicas

- ✅ Sempre faça `git commit` com mensagens descritivas
- ✅ Faça `git push` regularmente para não perder trabalho
- ✅ Teste localmente antes de fazer deploy
- ✅ Nunca compartilhe o arquivo `.env.local`
- ✅ Use `git status` frequentemente para ver o que mudou

---

## 📞 Precisa de Ajuda?

Se algo der errado:
1. Leia a mensagem de erro com calma
2. Copie a mensagem de erro completa
3. Pesquise no Google ou peça ajuda
4. Verifique se todas as variáveis de ambiente estão configuradas
