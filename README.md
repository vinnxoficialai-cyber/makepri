# 🛍️ Sistema Vinnx - ERP/E-commerce

Sistema SaaS completo de gestão empresarial (ERP) e loja virtual desenvolvido com tecnologias modernas.

## 🚀 Tecnologias

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **Banco de Dados:** Supabase (PostgreSQL)
- **Hospedagem:** Vercel
- **UI/UX:** Lucide React Icons
- **Gráficos:** Recharts
- **IA:** Google Gemini AI
- **Leitor QR Code:** html5-qrcode

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Supabase
- Conta no GitHub
- Conta na Vercel

## 🔧 Instalação

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd "loja ecommerce"
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   
   Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Edite o arquivo `.env.local` e adicione suas credenciais:
   ```env
   GEMINI_API_KEY=sua_chave_gemini_aqui
   VITE_SUPABASE_URL=sua_url_supabase_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase_aqui
   ```

4. **Rode o projeto localmente:**
   ```bash
   npm run dev
   ```

   O projeto estará disponível em `http://localhost:5173`

## 🏗️ Build para Produção

```bash
npm run build
```

Para testar a build localmente:
```bash
npm run preview
```

## 🌐 Deploy na Vercel

### Deploy Automático (Recomendado)

1. Faça push do código para o GitHub
2. Conecte seu repositório na Vercel
3. Configure as variáveis de ambiente no painel da Vercel
4. Deploy automático a cada push! 🎉

### Deploy Manual

```bash
vercel
```

## 📚 Documentação

- **[GUIA_COMANDOS.md](./GUIA_COMANDOS.md)** - Guia completo de comandos para iniciantes
- **[.env.example](./.env.example)** - Exemplo de variáveis de ambiente necessárias

## 🗂️ Estrutura do Projeto

```
loja ecommerce/
├── components/        # Componentes React reutilizáveis
├── pages/            # Páginas da aplicação
├── lib/              # Bibliotecas e configurações (Supabase, etc)
├── App.tsx           # Componente principal
├── index.tsx         # Ponto de entrada
├── types.ts          # Definições de tipos TypeScript
├── constants.ts      # Constantes da aplicação
└── vite.config.ts    # Configuração do Vite
```

## 🔐 Segurança

- ✅ Variáveis sensíveis no `.env.local` (não versionado)
- ✅ `.gitignore` configurado corretamente
- ✅ Chaves de API protegidas
- ✅ Conexão segura com Supabase

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é privado e proprietário.

## 📞 Suporte

Para dúvidas ou problemas, consulte o [GUIA_COMANDOS.md](./GUIA_COMANDOS.md) ou abra uma issue.

---

**Desenvolvido com ❤️ usando Google AI Studio**

