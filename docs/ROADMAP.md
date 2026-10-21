# Roteiro de Evolução e Dívidas Técnicas (Roadmap) — Life OS

> Planejamento estratégico, prioridades técnicas, débitos a sanar e ideias futuras para o Life OS.

---

## 1. Melhorias Prioritárias (Curto Prazo)

- [x] **Script de Testes no `package.json`:**
  - *Problema:* O comando `vitest` não estava registrado em `"scripts"` no `package.json`.
  - *Ação:* Adicionados `"test": "vitest run"` e `"test:watch": "vitest"` aos scripts do `package.json`.
- [ ] **Limpeza de Telas Órfãs / Legadas:**
  - *Problema:* Componentes como `CalendarView.tsx`, `TodayDashboard.tsx`, `JournalView.tsx` e pastas como `features/habits/`, `features/projects/`, `features/reviews/` estão inativos no fluxo principal de `AppContent.tsx`, gerando código morto potencial.
  - *Ação:* Avaliar se devem ser reintegrados de forma minimalista ou arquivados/removidos para simplificar a base.
- [x] **Cobertura de Testes de Recorrência de Eventos:**
  - *Problema:* A funcionalidade de recorrência e deleção de série (`deleteEventSeries`) em `ScheduleView` precisava de cobertura automatizada.
  - *Ação:* Criado `src/test/calendarRecurrence.test.ts` cobrindo detecção de sobreposição, conflitos e exclusão de série por `recurrenceGroupId`.

---

## 2. Melhorias Planejadas (Médio Prazo)

- [ ] **Notificações Locais no Navegador (Notification API):**
  - Notificar o usuário 10 minutos antes de um compromisso marcado no Cronograma.
  - Deve ser 100% local, solicitando permissão apenas quando o usuário ativar nas preferências.
- [ ] **Atalhos Rápidos de Teclado Globais:**
  - Implementar atalhos intuitivos:
    - `N` para nova tarefa rápida.
    - `T` para ir para "Hoje".
    - `C` para ir para "Cronograma".
    - `J` para ir para "Diário".
    - `?` para abrir ajuda de atalhos.
- [ ] **Estatísticas Semanais Minimalistas:**
  - Resumo discreto ao final da semana: total de horas de foco concluídas, tarefas finalizadas e dias com registro no diário.

---

## 3. Ideias Exploratórias (Longo Prazo / Sob Avaliação)

- [ ] **Sincronização P2P Criptografada ou via WebRTC / CRDTs:**
  - Permitir parear dois dispositivos (celular e notebook) via QR code para sincronizar o banco local sem servidor central.
- [ ] **Assistente Local de IA (WebLLM / Local Ollama Bridge):**
  - Permitir ao usuário conectar uma chave de API própria ou modelo no navegador para sintetizar tarefas da semana ou gerar resumos semanais do diário.
- [ ] **Exportação para PDF / iCal (.ics):**
  - Exportar os eventos do Cronograma para importação no Apple Calendar ou Google Calendar.

---

## 4. Dívidas Técnicas Conhecidas

| Item | Descrição | Impacto | Esforço |
| :--- | :--- | :--- | :--- |
| **Componentes de Grande Porte** | `ScheduleView.tsx` e `QuickAddModal.tsx` acumulam muita lógica de apresentação e formulários no mesmo arquivo. | Manutenção e legibilidade mais complexas. | Médio |
| **Mock de LocalStorage em Testes** | Os testes de storage dependem do mock do `setup.ts`. | É seguro, mas deve ser mantido sincronizado com a especificação do Storage API. | Baixo |
| **Chaves não utilizadas no `AppStateData`** | As chaves `habits`, `projects`, `goals`, `areas`, `dailyReviews`, `weeklyReviews` continuam no tipo e no seed `initialData.ts`. | Ocupa alguns bytes no estado local, mas garante retrocompatibilidade. | Baixo |
