# Estratégia de Testes — Life OS

> Referência sobre o ambiente de testes, suítes existentes, cenários críticos de validação e prevenção de regressões no Life OS.

---

## 1. Ambiente e Ferramentas Confirmadas

- **Test Runner:** [Vitest](https://vitest.dev/) (`^5.0.5`)
- **Ambiente de Simulação de DOM:** `jsdom` (`^30.1.3`)
- **Extensões de Asserção:** `@testing-library/jest-dom` (`^7.0.1`)
- **Configuração Global:** `src/test/setup.ts` referenciado no `vite.config.ts`.
- **Comando de Execução:**
  ```bash
  npx vitest run
  ```

---

## 2. Suítes de Testes Existentes no Repositório

Atualmente, existem **4 arquivos de teste** que somam **15 testes automatizados**, todos cobrindo a camada de lógica pura, persistência e conflitos de eventos:

### A. Utilitários de Data (`src/test/dateUtils.test.ts`)
- Formatação de data em português brasileiro.
- Geração correta da chave de hoje no formato `YYYY-MM-DD`.
- Cálculo das datas da semana a partir de um referencial.
- Cálculo da próxima ocorrência de tarefas recorrentes (diária, semanal, mensal).

### B. Lógica de Blocos de Tempo (`src/test/planner.test.ts`)
- Conversão de string de horário (`HH:mm`) para total de minutos desde a meia-noite.
- Conversão inversa de minutos para string `HH:mm`.
- Formatação de duração amigável (ex: "1h 30m").
- Detecção e prevenção de sobreposição de blocos de tempo no cronograma.

### C. Persistência e Sanitização (`src/test/storage.test.ts`)
- Inicialização de estado limpo quando o armazenamento está vazio.
- Sanitização de objetos JSON mal formatados (garantindo que campos obrigatórios existam).
- Preenchimento automático de valores default para campos ausentes.
- Mesclagem sem duplicidade (`mergeAppStateData`).

### D. Recorrência e Conflitos do Calendário (`src/test/calendarRecurrence.test.ts`)
- Detecção de conflitos e sobreposição de horários no mesmo dia.
- Verificação de não sobreposição para blocos adjacentes ou em dias diferentes.
- Exclusão seletiva de séries recorrentes via `recurrenceGroupId`.

---

## 3. Cenários Críticos que Exigem Novos Testes

Qualquer nova funcionalidade nos módulos centrais deve ser acompanhada de cobertura de testes nos seguintes cenários:

1. **Recorrência de Eventos do Cronograma:**
   - Criação de séries repetidas e garantia de atribuição correta de `recurrenceGroupId`.
   - Exclusão de apenas um evento avulso vs. exclusão de toda a série recorrente (`deleteEventSeries`).
2. **Importação e Exportação de Backup:**
   - Validação de arquivos com dados incompletos ou chaves alteradas.
   - Proteção para que imports corrompidos nunca sobreponham dados válidos na memória.
3. **Persistência de Horários e Fuso Horário:**
   - Verificação de que strings `YYYY-MM-DD` não sofrem deslocamento de dia por conversão UTC no fuso de Brasília (`UTC-3`).
4. **Auto-save do Diário:**
   - Teste de debounce ou atualização contínua de conteúdo sem perda de caracteres.

---

## 4. Validação Manual e Testes de Responsividade

Como o Life OS é uma aplicação com forte apelo mobile e desktop:
- **Mobile Thumb-zone:** Testar se a barra inferior (`Navigation.tsx`) não sobrepõe o conteúdo principal da tela, respeitando o padding `pb-safe-nav` e `env(safe-area-inset-bottom)`.
- **Drag & Drop:** No Cronograma, testar tanto a alteração de horário quanto a alteração de dia ao arrastar cartões.
- **Modo Escuro:** Alternar entre temas claro e escuro e inspecionar visualmente o contraste de texto nas classes `text-ink-primary`, `dark:text-white`, `bg-canvas-light` e `dark:bg-night-base`.

---

## 5. Procedimento de Correção de Falhas

Se um teste falhar durante a validação:
1. Isole o teste falho executando `npx vitest run src/test/arquivo.test.ts`.
2. Verifique se a quebra ocorreu por alteração de contrato de tipo ou por regressão real na lógica.
3. Caso a mudança seja intencional (ex: evolução de um algoritmo de data), atualize os casos de teste correspondentes sem relaxar asserções essenciais.
