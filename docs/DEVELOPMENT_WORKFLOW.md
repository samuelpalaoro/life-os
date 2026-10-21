# Fluxo de Desenvolvimento — Life OS

> Guia prático de comandos, convenções de branches, ciclo de vida de alterações e deploy no Life OS.

---

## 1. Comandos Verificados do Projeto

Todos os scripts abaixo foram auditados diretamente no `package.json`:

```bash
# 1. Instalar dependências (modo determinístico para CI ou local)
npm install
# ou
npm ci

# 2. Executar servidor de desenvolvimento local (porta padrão 5173 com HMR)
npm run dev

# 3. Executar validação de linter de alto desempenho (Oxlint)
npm run lint

# 4. Executar os testes automatizados com Vitest
npx vitest run

# 5. Executar os testes com watcher durante o desenvolvimento
npx vitest

# 6. Gerar o build de produção (TypeScript compile + Vite build)
npm run build

# 7. Pré-visualizar o build localmente
npm run preview
```

---

## 2. Fluxo Recomendado de Trabalho com Git

Para manter o repositório organizado e seguro contra conflitos ou perdas acidentais de código:

### Passo 1: Verificar e Atualizar a Base
```bash
git status
git switch main
git pull origin main
```

### Passo 2: Criar uma Branch de Funcionalidade ou Correção
Utilize o padrão semântico de branches:
- `feat/nome-da-funcionalidade`
- `fix/nome-da-correcao`
- `docs/nome-da-documentacao`

Exemplo:
```bash
git switch -c feat/notificacoes-locais
```

### Passo 3: Implementar e Validar Localmente
Antes de preparar o commit, garanta que o código compila e passa nos testes:
```bash
npm run lint
npx vitest run
npm run build
```

### Passo 4: Registrar Commits Semânticos
Crie mensagens de commit objetivas em português ou inglês:
```bash
git add .
git commit -m "feat(calendar): adicionar suporte a recorrência semanal de eventos"
```

### Passo 5: Enviar a Branch e Abrir Integração
```bash
git push -u origin feat/notificacoes-locais
```

> [!WARNING]
> **Comandos Proibidos para Agentes de IA:**
> - Nunca execute `git reset --hard` ou `git clean -fd` sem ordem explícita do usuário.
> - Nunca utilize `--force` em operações de `git push`.
> - Não faça commits nem pushes automatizados se a tarefa tiver como escopo apenas auditoria ou planejamento.

---

## 3. Pipeline de Integração e Deploy (GitHub Actions)

A publicação do Life OS é totalmente automatizada via workflow do GitHub Actions em `.github/workflows/deploy.yml`:

1. **Gatilhos (`on`):**
   - Push nas branches `main` ou `master`.
   - Disparo manual via `workflow_dispatch`.
2. **Etapas executadas no runner `ubuntu-latest`:**
   - Checkout do código com `actions/checkout@v4`.
   - Configuração do Node.js 22 com cache de npm (`actions/setup-node@v4`).
   - Instalação limpa via `npm ci`.
   - **Execução obrigatória dos testes:** `npx vitest run`.
   - **Geração do build estático:** `npm run build` (saída gerada em `./dist`).
   - Configuração do Pages com `actions/configure-pages@v5`.
   - Upload do artefato `./dist` via `actions/upload-pages-artifact@v3`.
   - Deploy automático no ambiente GitHub Pages com `actions/deploy-pages@v4`.
3. **Resolução de Caminhos:**
   - O `vite.config.ts` possui `base: './'`, permitindo que o bundle funcione corretamente em qualquer subdiretório de URL fornecido pelo GitHub Pages (ex: `https://usuario.github.io/lista/`).
