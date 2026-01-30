import sys

# Ler o arquivo
with open(r'c:\Users\User\Documents\Vinnx\loja ecommerce\pages\Cash.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remover linhas 57-91 (índices 56-90 em Python, 0-indexed)
# Essas linhas contêm a função calculateTotals duplicada
new_lines = lines[:56] + ['    // --- CALCULATIONS (from hook) ---\n', '    const totals = calculateTotals();\n', '\n'] + lines[91:]

# Escrever de volta
with open(r'c:\Users\User\Documents\Vinnx\loja ecommerce\pages\Cash.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Função calculateTotals duplicada removida!")
