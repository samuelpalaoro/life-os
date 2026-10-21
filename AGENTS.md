# Instruções para Agentes de IA — Life OS

Este documento estabelece as diretrizes obrigatórias de desenvolvimento, arquitetura, persistência e governança técnica para qualquer agente de IA que atue no repositório **Life OS**.

O objetivo primordial é permitir a evolução contínua da aplicação com máxima estabilidade, prevenindo regressões, protegendo dados locais do usuário e garantindo compatibilidade estrita com a hospedagem estática no GitHub Pages.

---

## 1. Princípios Fundamentais

1. **Evidência sobre Suposição:** Nunca invente arquivos, funções, rotas, dependências ou resultados de testes. Tudo o que for afirmado ou implementado deve ter correspondência direta com o código do projeto.
2. **Soluções Simples e Diretas:** Prefira código legível, modular e com o menor número possível de dependências externas. Evite complexidade acidental e abstrações prematuras.
3. **Preservação Sagrada de Dados:** O Life OS é um aplicativo centrado em dados locais (Single-User Personal OS). Nenhuma alteração pode apagar, sobrescrever ou alterar a estrutura de dados sem proteção de fallback e migração retrocompatível.
4. **Hospedagem Estática (GitHub Pages):** A aplicação é puramente client-side (SPA). Não introduza dependências de backend em Node.js em tempo de execução nem APIs que dependam de servidores dedicados locais ou remotos.

---

## 2. Inspeção Antes da Edição

Antes de modificar qualquer linha de código:
1. **Verificar Git Status e Branch:** Execute `git status` para assegurar que a árvore de trabalho está limpa e identificar a branch atual. Nunca execute comandos destrutivos (`git reset --hard`, `git clean -fd`, force push).
2. **Checar Dependências e Scripts:** Examine `package.json` para conhecer as versões de bibliotecas e ferramentas disponíveis.
3. **Compreender o Módulo:** Leia os arquivos associados ao fluxo que será alterado (`src/types/index.ts`, `src/context/AppContext.tsx`, `src/storage/storageService.ts` ou a respectiva feature em `src/features/`).

---

## 3. Arquitetura e Organização de Código

- **Linguagem & Tipagem:** TypeScript em modo estrito. Todos os novos tipos devem ser integrados ou referenciados em `src/types/index.ts`. Proibido o uso descuidado de `any`.
- **Gerenciamento de Estado:** Estado global centralizado no `src/context/AppContext.tsx` através de React Context + Hooks. Ações de modificação expostas via funções semânticas (`addTask`, `updateEvent`, etc.).
- **Persistência Híbrida Dupla:** Camada síncrona primária via `localStorage` (chave `life_os_state_v1`) combinada com persistência assíncrona robusta via `IndexedDB` (`life_os_database` / `root_state`). Qualquer alteração estrutural no modelo exige sanitização retrocompatível em `storageService.ts`.
- **Estilização:** Tailwind CSS v3 com extensão de tokens customizados definida em `tailwind.config.js` (`canvas-*`, `ink-*`, `brand-*`, `coral-*`, `night-*`). Respeite o design system estabelecido.
- **Roteamento:** Roteamento por chave de estado (`currentView`) no `AppContext` e renderização condicional em `AppContent.tsx`. Não adicione `react-router` a menos que explicitamente solicitado.

---

## 4. Regras de Dependências

- Não instale pacotes npm sem necessidade estrita.
- Antes de adicionar qualquer pacote, verifique se a funcionalidade já é fornecida por dependências existentes:
  - Datas e manipulação temporal: `date-fns` (v4).
  - Ícones: `lucide-react`.
  - Estilização condicional: `clsx` e `tailwind-merge`.
  - Efeitos de celebração: `canvas-confetti`.
- Instalações não planejadas aumentam o bundle e quebram a compatibilidade no GitHub Pages.

---

## 5. Regras de Validação, Testes e Build

Toda alteração que modifique código funcional deve ser validada obrigatoriamente pelos seguintes comandos:

```bash
# Execução dos testes automatizados (12 testes existentes)
npx vitest run

# Validação do bundle de produção e checagem de tipos
npm run build

# Validação de regras de linting rápido
npm run lint
```

Se algum teste falhar ou o build acusar erro de tipagem (`tsc -b`), corrija o problema antes de considerar a tarefa finalizada.

---

## 6. Documentação e Rastreabilidade

- Sempre que alterar tipos, estruturas de armazenamento, contratos de funções públicas ou comportamentos visuais, atualize a documentação em `docs/`.
- Ao concluir a tarefa, apresente um relatório conciso contendo:
  1. Arquivos criados, alterados ou removidos.
  2. Resumo das decisões técnicas adotadas.
  3. Status da validação (`vitest` e `npm run build`).
  4. Riscos residuais ou pendências de verificação, se houver.
