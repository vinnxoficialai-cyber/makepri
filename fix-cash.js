const fs = require('fs');

// Ler o arquivo
const content = fs.readFileSync('c:\\Users\\User\\Documents\\Vinnx\\loja ecommerce\\pages\\Cash.tsx', 'utf8');
const lines = content.split('\n');

// Remover linhas 57-91 (índices 56-90, 0-indexed)
// Adicionar as linhas de substituição
const newLines = [
    ...lines.slice(0, 56),
    '    // --- CALCULATIONS (from hook) ---',
    '    const totals = calculateTotals();',
    '',
    ...lines.slice(91)
];

// Escrever de volta
fs.writeFileSync('c:\\Users\\User\\Documents\\Vinnx\\loja ecommerce\\pages\\Cash.tsx', newLines.join('\n'), 'utf8');

console.log('✅ Função calculateTotals duplicada removida!');
