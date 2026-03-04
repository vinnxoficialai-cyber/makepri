# 🚨 CORREÇÃO URGENTE - Linha 81

## ❌ ERRO: Função não é async mas usa await

**Linha 81 ATUAL (ERRADO):**
```typescript
const handleCloseRegister = () => {
```

**Linha 81 CORRETO:**
```typescript
const handleCloseRegister = async () => {
```

## 📝 O QUE FAZER:

1. Vá para a **linha 81** do Cash.tsx
2. Adicione a palavra `async` antes de `() =>`
3. Salve o arquivo

**Resultado:** O erro "Unexpected reserved word 'await'" vai sumir!

---

## ✅ VERIFICAÇÃO:

Depois da correção, a linha 81 deve ficar assim:
```typescript
const handleCloseRegister = async () => {
    try {
        await closeRegister(
```

É só adicionar `async` na linha 81! 🎯
