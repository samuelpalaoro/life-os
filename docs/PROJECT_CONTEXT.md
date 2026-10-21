# Contexto do Projeto — Life OS

> Documento de referência sobre o propósito, escopo, funcionalidades reais e limitações verificadas do Life OS.

---

## 1. Propósito e Proposta de Valor

O **Life OS** é uma Single Page Application (SPA) para gestão pessoal e produtividade diária, desenhada para ser rápida, calma, privada e centrada em três pilares fundamentais da rotina:
1. **O que fazer** (Tarefas diárias, prioridades e subtarefas).
2. **Quando fazer** (Cronograma visual, blocos de tempo e compromissos).
3. **O que refletir e registrar** (Anotações e Diário com salvamento automático).

Diferente de suítes de produtividade pesadas ou corporativas, o Life OS prioriza atrito zero: não requer cadastro em servidores remotos, inicia instantaneamente, armazena tudo no dispositivo do usuário e pode ser instalado como Progressive Web App (PWA).

---

## 2. Público-Alvo e Problemas que Resolve

- **Público:** Profissionais, estudantes e indivíduos que buscam clareza mental e organização diária sem a sobrecarga visual ou burocrática de softwares de gestão de projetos corporativos.
- **Problemas Resolvidos:**
  - Sobrecarga de dados e dashboards complexos que paralisam a ação.
  - Dependência de conexão contínua com a internet para acessar anotações e tarefas diárias.
  - Risco de bloqueio de dados de fornecedores proprietários (vendor lock-in), oferecendo exportação total em JSON e Diário em Markdown.
  - Falta de conexão fluida entre a lista de tarefas e o calendário diário.

---

## 3. Tecnologias Confirmadas

| Camada | Tecnologia | Versão Confirmada (`package.json`) |
| :--- | :--- | :--- |
| **Framework Base** | React | `^19.3.1` |
| **Linguagem** | TypeScript | `~6.0.3` |
| **Build & Dev Server** | Vite | `^8.3.4` |
| **Estilização** | Tailwind CSS + PostCSS | `^3.4.17` |
| **Utilitários de Estilo** | `clsx`, `tailwind-merge` | `^2.1.1`, `^3.7.0` |
| **Manipulação de Datas** | `date-fns` | `^4.4.0` |
| **Ícones** | `lucide-react` | `^1.60.0` |
| **Efeitos Visuais** | `canvas-confetti` | `^1.9.4` |
| **Testes Automatizados** | Vitest + Testing Library | Vitest `^5.0.5`, `@testing-library/react ^16.3.3` |
| **Linter** | Oxlint | `^1.88.0` |
| **PWA & Offline** | Service Worker dedicado (`public/sw.js`) | Registrado via `src/lib/pwaManager.ts` |
| **Hospedagem & CI/CD** | GitHub Pages via GitHub Actions | Workflow em `.github/workflows/deploy.yml` |

---

## 4. Estado Atual das Funcionalidades

O Life OS passou por uma consolidação em torno de **3 visões centrais ativas** no fluxo principal de navegação (`AppContent.tsx`), mantendo outras estruturas no modelo de dados para evolução futura.

### A. Funcionalidades Totalmente Implementadas e Ativas na UI

1. **Visão "Hoje" (`TodayView`):**
   - Resumo dinâmico da data atual e saudação de contexto.
   - Captura rápida de tarefa com atribuição direta de horário e prioridade.
   - Painel "Foco do Dia" (destaque de até 3 tarefas essenciais).
   - Lista cronológica de compromissos imediatos do dia.
   - Lista interativa de tarefas com conclusão por checkbox, marcação de prioridade e exclusão.
   - Atalho de clique único para abrir o Diário.

2. **Visão "Cronograma" (`ScheduleView`):**
   - Três modos de visualização: **Dia**, **Semana** e **Mês**.
   - Navegação fluida entre períodos (hoje, anterior, próximo) e retorno rápido.
   - Criação e edição completa de blocos de tempo e compromissos fixos.
   - Suporte a recorrência de eventos: diária e semanal com data limite e gerenciamento de série.
   - Detecção de conflitos de horário com aviso visual elegante.
   - Drag & Drop nativo HTML5 para reagendamento rápido entre horários e dias.
   - Filtro para exibir ou ocultar compromissos já concluídos.
   - Diferenciação visual entre compromissos fixos e blocos flexíveis de trabalho.

3. **Visão "Anotações / Diário" (`SimpleJournalView`):**
   - Editor de escrita contínua com auto-save silencioso em tempo real.
   - Histórico lateral de entradas por data com busca instantânea por palavras-chave.
   - Exportação completa de todas as reflexões em arquivo legível `diario-life-os.md`.

4. **Gerenciamento de Sistema e Dados (`SettingsModal`):**
   - Alternância entre tema Claro (`light`) e Escuro (`dark`).
   - Exportação de estado completo em arquivo `life-os-backup.json`.
   - Importação de backup com validação estrutural profunda e opção de mescla (*merge*) ou substituição (*replace*).
   - Reinicialização de dados com confirmação dupla e recarga segura.

5. **PWA & Capacidade Offline:**
   - Detecção de rede com barra informativa de offline no mobile e sidebar no desktop.
   - Prompt de instalação de PWA customizado.
   - Notificação de nova versão pronta e aplicação de atualização com recarga silenciosa.

### B. Funcionalidades Incompletas ou Ocultas da Navegação Principal

- **Metas (`goals`), Áreas da Vida (`areas`), Projetos (`projects`), Hábitos (`habits`) e Revisões Periódicas (`dailyReviews`, `weeklyReviews`):**
  - **Situação no código:** As interfaces TypeScript correspondentes e as coleções existem no `AppStateData` e no `initialData.ts`. Os métodos CRUD básicos existem no `AppContext.tsx`. Há inclusive diretórios legados em `src/features/habits/`, `src/features/projects/`, `src/features/reviews/`, `src/features/tasks/`.
  - **Estado atual:** Não estão expostos nos menus de navegação principal (`Navigation.tsx`) para manter a interface limpa e focada no trio "Hoje - Cronograma - Anotações". Os dados são preservados integralmente nos backups e migrações.

### C. Funcionalidades Não Confirmadas / Pendentes de Verificação

- **Sincronização em Nuvem:** Não há backend, autenticação remota ou sincronização multiusuário implementada. O projeto é 100% local ao navegador.
- **OCR ou Análise de Imagem por IA:** Mencionada apenas em conversas conceituais; não há código nem dependências no repositório.

---

## 5. Restrições Técnicas do Projeto

1. **GitHub Pages é puramente estático:** Não há Node.js em produção. O Vite usa `base: './'` em `vite.config.ts` para garantir caminhos relativos de assets em subdiretórios de repositório.
2. **Armazenamento limitado ao browser:** A integridade dos dados depende do `localStorage` e do `IndexedDB` do navegador do usuário. A limpeza de dados do navegador pelo usuário limpa a base se não houver backup JSON salvo externamente.
