# 📸 Guia de Upload de Imagens no Supabase

## 🎯 Problema Identificado

1. ❌ **F5 volta para login** - Sem persistência de sessão
2. ❌ **Imagens não salvam** - Não estão indo para o banco

## ✅ Solução Completa

---

## Passo 1: Criar Bucket no Supabase (INTERFACE)

### 1.1 - Acessar Storage

1. Acesse: https://supabase.com/dashboard/project/tuxgcqnuyomtyrnmnwzm
2. No menu lateral, clique em **"Storage"**
3. Clique em **"Create a new bucket"**

### 1.2 - Configurar Bucket

- **Name:** `images`
- **Public bucket:** ✅ **Marque como público** (para logos e produtos)
- Clique em **"Create bucket"**

---

## Passo 2: Configurar Políticas (SQL)

### 2.1 - Executar SQL

1. Vá em **SQL Editor**
2. Abra o arquivo [supabase-storage-setup.sql](file:///c:/Users/User/Documents/Vinnx/loja%20ecommerce/supabase-storage-setup.sql)
3. **Copie todo o conteúdo**
4. **Cole no SQL Editor**
5. **Clique em "Run"**

Isso vai permitir que você faça upload de imagens!

---

## Passo 3: Usar no Código

### 3.1 - Importar o Serviço

```typescript
import { useImageUpload } from '../lib/images';
```

### 3.2 - Usar no Componente

```typescript
function ConfiguracoesLogo() {
  const { uploadImage, uploading, error } = useImageUpload();
  const { settings, updateSettings } = useSettings();

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Fazer upload da imagem
      const imageUrl = await uploadImage(file, 'logos');
      
      if (imageUrl) {
        // Salvar URL no banco de dados
        await updateSettings({
          logoUrl: imageUrl
        });
        
        alert('Logo atualizado com sucesso!');
      }
    } catch (err) {
      alert('Erro ao fazer upload');
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={handleLogoChange}
        disabled={uploading}
      />
      {uploading && <p>Fazendo upload...</p>}
      {error && <p>Erro: {error}</p>}
      
      {settings?.logoUrl && (
        <img src={settings.logoUrl} alt="Logo" />
      )}
    </div>
  );
}
```

---

## Passo 4: Resolver Problema do F5 (Persistência)

### 4.1 - Salvar Login no LocalStorage

Adicione no `App.tsx`:

```typescript
// Ao fazer login
const handleLogin = (user: User) => {
  setCurrentUser(user);
  setRealUser(user);
  setIsAuthenticated(true);
  
  // SALVAR NO LOCALSTORAGE
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('isAuthenticated', 'true');
  
  setActiveTab(user.permissions[0] || 'dashboard');
};

// Ao carregar o app (useEffect)
useEffect(() => {
  const savedUser = localStorage.getItem('currentUser');
  const savedAuth = localStorage.getItem('isAuthenticated');
  
  if (savedUser && savedAuth === 'true') {
    const user = JSON.parse(savedUser);
    setCurrentUser(user);
    setRealUser(user);
    setIsAuthenticated(true);
  }
}, []);

// Ao fazer logout
const handleLogout = () => {
  setIsAuthenticated(false);
  setRealUser(null);
  
  // LIMPAR LOCALSTORAGE
  localStorage.removeItem('currentUser');
  localStorage.removeItem('isAuthenticated');
};
```

---

## 📊 Funções Disponíveis

### ImageService

```typescript
// Upload de imagem
const url = await ImageService.upload(file, 'logos');

// Deletar imagem
await ImageService.delete(imageUrl);

// Atualizar imagem (deleta antiga e faz upload da nova)
const newUrl = await ImageService.update(oldUrl, newFile, 'logos');

// Validar imagem
ImageService.validateImage(file, 5); // 5MB máximo
```

### Hook useImageUpload

```typescript
const { uploadImage, updateImage, uploading, error } = useImageUpload();

// Upload simples
const url = await uploadImage(file, 'logos');

// Atualizar (deleta antiga)
const newUrl = await updateImage(oldImageUrl, newFile, 'logos');
```

---

## 🗂️ Estrutura de Pastas Sugerida

```
images/
├── logos/          # Logos da empresa
├── products/       # Fotos de produtos
├── avatars/        # Fotos de usuários
└── general/        # Outras imagens
```

---

## ✅ Checklist de Configuração

- [ ] Criar bucket "images" no Supabase Storage
- [ ] Marcar bucket como público
- [ ] Executar SQL de políticas
- [ ] Testar upload de uma imagem
- [ ] Adicionar persistência de login (localStorage)
- [ ] Testar F5 (não deve voltar para login)

---

## 🆘 Problemas Comuns

### ❌ Erro: "new row violates row-level security policy"
**Solução:** Execute o SQL de políticas (supabase-storage-setup.sql)

### ❌ Erro: "Bucket not found"
**Solução:** Crie o bucket "images" pela interface do Supabase

### ❌ Imagem não aparece
**Solução:** Verifique se o bucket está marcado como público

### ❌ F5 ainda volta para login
**Solução:** Adicione o código de localStorage no App.tsx

---

## 🎯 Próximos Passos

1. ✅ **Criar bucket** no Supabase Storage
2. ✅ **Executar SQL** de políticas
3. ✅ **Testar upload** de logo
4. ✅ **Adicionar persistência** de login
5. ✅ **Testar F5** (deve manter logado)

---

**Quer que eu integre isso automaticamente na página de Settings?** 😊
