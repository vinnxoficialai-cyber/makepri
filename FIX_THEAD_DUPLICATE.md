# 🚨 CORREÇÃO URGENTE - Linha 394

## ❌ ERRO: Tag </thead> duplicada

**Linhas 393-394 ATUAIS (ERRADO):**
```typescript
                                </thead>
                            </thead>
```

**CORRETO:**
```typescript
                                </thead>
```

## 📝 O QUE FAZER:

**DELETE a linha 394 inteira!**

A linha 393 já fecha o `</thead>` corretamente. A linha 394 é uma duplicata que está causando o erro.

---

## ✅ RESULTADO ESPERADO:

Depois de deletar a linha 394, deve ficar assim:

```typescript
                                    </tr>
                                </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
```

**É só deletar a linha 394!** 🎯
