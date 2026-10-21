# Dados e Persistência — Life OS

> Documento normativo sobre armazenamento local, modelos de dados, mitigação de riscos de corrupção e regras de proteção dos registros no Life OS.

---

## 1. Mecanismos de Armazenamento Utilizados

O Life OS adota uma **camada dupla e híbrida de persistência local no navegador**:

| Mecanismo | Chave / Identificador | Finalidade | Comportamento no Boot |
| :--- | :--- | :--- | :--- |
| **`localStorage`** | `life_os_state_v1` | Acesso síncrono ultra-rápido para montagem inicial sem flash de conteúdo vazio. | Lido no construtor do estado do `AppContext`. |
| **`IndexedDB`** | Banco: `life_os_database`<br>Store: `app_state`<br>Chave: `root_state` | Armazenamento assíncrono para bases maiores e redundância contra cotas reduzidas de string. | Lido assincronamente em `initAsync()` para sincronizar caso contenha versão mais recente. |

---

## 2. Versão do Esquema e Identificadores

- **Versão Atual do Esquema (`CURRENT_SCHEMA_VERSION`):** `2` (definida em `src/storage/storageService.ts`).
- **Geração de Identificadores (`id`):**
  - Entidades são identificadas por strings únicas geradas em tempo de criação, usando prefixos semânticos e timestamps:
    - Tarefas: `task-${Date.now()}` ou `task-${Date.now()}-${random}`
    - Eventos: `evt-${Date.now()}`
    - Entradas do Diário: `journal-${Date.now()}`
    - Séries de Recorrência de Eventos: `rec-series-${Date.now()}` (`recurrenceGroupId`)

---

## 3. Estrutura Canônica dos Registros (`AppStateData`)

O objeto raiz persistido possui a seguinte estrutura:

```typescript
interface AppStateData {
  version: number;                        // Versão do esquema (atualmente 2)
  lastUpdated: string;                    // ISO timestamp da última gravação
  tasks: Task[];                          // Lista de tarefas e subtarefas
  events: CalendarEvent[];                // Compromissos e blocos de tempo da agenda
  journal: JournalEntry[];                // Anotações e reflexões
  habits: Habit[];                        // Hábitos e histórico de conclusões
  projects: Project[];                    // Projetos cadastrados
  goals: Goal[];                          // Metas de curto, médio e longo prazo
  areas: LifeArea[];                      // Áreas de vida (Trabalho, Saúde, etc.)
  dailyReviews: Record<string, DailyReview>;   // Revisões indexadas por YYYY-MM-DD
  weeklyReviews: Record<string, WeeklyReview>; // Revisões indexadas por YYYY-Www
  preferences: UserPreferences;           // Nome, tema, horários de trabalho, foco do dia
}
```

---

## 4. Sanitização e Retrocompatibilidade

Qualquer dado lido do `localStorage`, do `IndexedDB` ou importado via arquivo `.json` passa pela função `validateAppStateData(raw: unknown)`:

1. **Proteção contra Falhas:** O validador nunca lança exceções não tratadas (`never throws`). Se o dado for corrompido ou nulo, retorna `{ valid: false, error: '...' }` e utiliza `INITIAL_DEMO_DATA` seguro.
2. **Preenchimento de Defaults:**
   - Se uma tarefa antiga não possuir `subtasks`, `tags` ou `recurrence`, o validador preenche automaticamente `[]` ou `'none'`.
   - Se um evento antigo não possuir os campos de recorrência (`recurrence`, `recurrenceEndDate`, `recurrenceGroupId`), o validador atribui `'none'` e `undefined` sem quebrar a renderização.
   - Entradas de diário sem contagem de palavras calculam o `wordCount` dinamicamente.

---

## 5. Estratégia de Backup e Exportação

A aplicação oferece dois mecanismos de saída de dados no `SettingsModal.tsx`:

1. **Backup JSON Completo (`exportDataJSON`):**
   - Exporta o snapshot integral do `AppStateData` em formato JSON formatado.
   - Permite que o usuário transfira seus dados para outro dispositivo ou guarde cópias periódicas.
2. **Exportação de Diário em Markdown (`exportJournalMD`):**
   - Gera um arquivo legível `.md` estruturado com títulos, datas e texto integral de todas as anotações, garantindo que o usuário possa ler suas reflexões em qualquer editor de texto sem depender do Life OS.
3. **Importação com Modos de Operação:**
   - **Substituir (`replace`):** Substitui todo o estado local pelo backup validado.
   - **Mesclar (`merge` via `mergeAppStateData`):** Combina os dados sem duplicar tarefas, eventos ou notas que possuam o mesmo `id`, preservando os dados já existentes no navegador.

---

## 6. Regra Fundamental de Proteção de Dados para Agentes

> [!CAUTION]
> **REGRA DE OURO PARA AGENTES DE IA:**
> Nenhuma alteração de código poderá limpar, substituir ou migrar destrutivamente os dados do usuário.
> - É proibido renomear a chave `STORAGE_KEY` (`life_os_state_v1`) sem implementar um leitor de migração da chave antiga.
> - É proibido remover campos do modelo de dados (`AppStateData`) sem manter suporte de sanitização para versões legadas.
> - Qualquer novo campo adicionado a entidades deve ser opcional (`?`) ou possuir valor default preenchido em `validateAppStateData()`.
> - O botão "Redefinir Dados" existente na interface deve continuar exigindo confirmação explícita do usuário via modal e prompt nativo de segurança.

---

## 7. Riscos Conhecidos e Limitações

- **Isolamento por Navegador/Dispositivo:** Os dados não sincronizam automaticamente entre o celular e o computador do usuário porque não há banco em nuvem. A sincronização deve ser feita manualmente pelo usuário exportando e importando o arquivo JSON.
- **Limpeza de Cache do Navegador:** Se o usuário acionar "Limpar dados de navegação e cookies" nas configurações do Chrome/Safari/Firefox, o `localStorage` e o `IndexedDB` são apagados pelo navegador. A documentação da interface recomenda explicitamente a realização periódica de backups JSON.
