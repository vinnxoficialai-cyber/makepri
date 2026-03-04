# 🚀 Guia Passo a Passo - Configuração Completa

Este guia vai te ajudar a configurar **tudo** do zero, mesmo sem ser programador! Siga cada passo com calma.

---

## ✅ Passo 1: Verificar se está tudo funcionando

Primeiro, vamos garantir que o projeto está rodando localmente.

1. **Abra o PowerShell** (ou Terminal)

2. **Navegue até a pasta do projeto:**
   ```bash
   cd "c:\Users\User\Documents\Vinnx\loja ecommerce"
   ```

3. **Rode o projeto:**
   ```bash
   npm run dev
   ```

4. **Abra o navegador** em `http://localhost:5173`

5. **Veja se está funcionando!** ✅

6. **Para parar o servidor:** Pressione `Ctrl + C` no terminal

---

## 🗄️ Passo 2: Configurar Git (Controle de Versão)

O Git vai guardar todo histórico do seu código.

### 2.1 - Configurar seu nome e email (só precisa fazer uma vez)

```bash
git config --global user.name "Seu Nome Aqui"
git config --global user.email "seuemail@exemplo.com"
```

**Exemplo:**
```bash
git config --global user.name "João Silva"
git config --global user.email "joao@gmail.com"
```

### 2.2 - Inicializar o repositório Git

```bash
git init
```

### 2.3 - Adicionar todos os arquivos

```bash
git add .
```

### 2.4 - Fazer o primeiro commit

```bash
git commit -m "Primeiro commit - Projeto Vinnx configurado com Supabase"
```

✅ **Pronto! Seu projeto agora tem controle de versão!**

---

## 🌐 Passo 3: Conectar com GitHub

Agora vamos colocar seu código no GitHub (na nuvem).

### 3.1 - Criar repositório no GitHub

1. **Acesse:** https://github.com
2. **Faça login** na sua conta
3. **Clique no botão verde** "New" (ou "Novo repositório")
4. **Preencha:**
   - **Repository name:** `vinnx-erp` (ou o nome que preferir)
   - **Description:** "Sistema ERP/E-commerce Vinnx"
   - **Deixe como Private** (privado) ✅
   - **NÃO marque** "Initialize with README" (já temos um!)
5. **Clique em** "Create repository"

### 3.2 - Conectar seu projeto local com o GitHub

O GitHub vai te mostrar alguns comandos. Use estes:

```bash
git remote add origin https://github.com/SEU-USUARIO/vinnx-erp.git
git branch -M main
git push -u origin main
```

**⚠️ IMPORTANTE:** Substitua `SEU-USUARIO` pelo seu nome de usuário do GitHub!

**Exemplo:**
```bash
git remote add origin https://github.com/joaosilva/vinnx-erp.git
git branch -M main
git push -u origin main
```

Você vai precisar fazer login no GitHub (pode pedir senha ou token).

✅ **Pronto! Seu código está no GitHub!**

---

## 🚀 Passo 4: Deploy na Vercel

Agora vamos colocar seu sistema online!

### 4.1 - Acessar a Vercel

1. **Acesse:** https://vercel.com
2. **Faça login** (pode usar a mesma conta do GitHub)

### 4.2 - Importar Projeto

1. **Clique em** "Add New..." → "Project"
2. **Conecte sua conta do GitHub** (se ainda não conectou)
3. **Encontre o repositório** `vinnx-erp` na lista
4. **Clique em** "Import"

### 4.3 - Configurar o Projeto

Na tela de configuração:

1. **Framework Preset:** Vite (deve detectar automaticamente)
2. **Root Directory:** `./` (deixe como está)
3. **Build Command:** `npm run build` (já está configurado)
4. **Output Directory:** `dist` (já está configurado)

### 4.4 - Adicionar Variáveis de Ambiente

**⚠️ MUITO IMPORTANTE!** Clique em "Environment Variables" e adicione:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | (Cole sua chave do Gemini aqui) |
| `VITE_SUPABASE_URL` | `https://tuxgcqnuyomtyrnmnwzm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (Cole a chave anon do Supabase aqui) |

**Para adicionar cada variável:**
1. Digite o **Name** (nome)
2. Digite o **Value** (valor)
3. Clique em **Add**

### 4.5 - Fazer Deploy

1. **Clique em** "Deploy"
2. **Aguarde** (pode levar 1-2 minutos)
3. **Veja a mágica acontecer!** 🎉

Quando terminar, você vai ver:
- ✅ "Congratulations!"
- 🌐 Um link tipo: `https://vinnx-erp.vercel.app`

**Clique no link** para ver seu sistema online!

✅ **PARABÉNS! Seu sistema está no ar!** 🎉

---

## 🔄 Passo 5: Fluxo de Trabalho Diário

Agora que está tudo configurado, quando você fizer alterações no código:

### 5.1 - Salvar alterações no Git

```bash
git add .
git commit -m "Descrição do que você fez"
git push
```

**Exemplo:**
```bash
git add .
git commit -m "Adicionado nova página de produtos"
git push
```

### 5.2 - Deploy Automático

**A Vercel vai fazer deploy automaticamente!** 🚀

Sempre que você fizer `git push`, em 1-2 minutos seu site estará atualizado!

---

## 🆘 Problemas Comuns

### ❌ Erro: "git: command not found"
**Solução:** Instale o Git: https://git-scm.com/download/win

### ❌ Erro ao fazer push para GitHub
**Solução:** Você precisa autenticar. Use GitHub CLI ou Personal Access Token:
1. Vá em: https://github.com/settings/tokens
2. Gere um novo token
3. Use o token como senha quando o Git pedir

### ❌ Build falhou na Vercel
**Solução:** Verifique se:
1. Todas as variáveis de ambiente estão configuradas
2. O código está funcionando localmente (`npm run build`)
3. Veja os logs de erro na Vercel

### ❌ Página em branco após deploy
**Solução:** Provavelmente faltam variáveis de ambiente. Verifique no painel da Vercel.

---

## 📞 Próximos Passos

Agora que está tudo configurado, você pode:

1. ✅ **Desenvolver localmente** com `npm run dev`
2. ✅ **Salvar no Git** com `git add . && git commit -m "mensagem" && git push`
3. ✅ **Ver online automaticamente** na Vercel
4. ✅ **Usar o Supabase** para banco de dados

**Consulte o [GUIA_COMANDOS.md](./GUIA_COMANDOS.md) para mais comandos úteis!**

---

## 🎉 Parabéns!

Você configurou um sistema profissional com:
- ✅ Controle de versão (Git)
- ✅ Repositório na nuvem (GitHub)
- ✅ Banco de dados (Supabase)
- ✅ Deploy automático (Vercel)

**Agora você é um desenvolvedor profissional!** 🚀

---

**Dúvidas?** Releia este guia com calma ou consulte a documentação oficial de cada ferramenta.
