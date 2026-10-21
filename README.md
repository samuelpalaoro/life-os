# Life OS — Sistema Pessoal Minimalista

> Um ambiente pessoal calmo, elegante e direto ao ponto que combina **Tarefas**, **Cronograma** e **Diário**.

---

## 🌿 Conceito & Filosofia

O **Life OS** foi refatorado para eliminar qualquer ruído visual, excesso de gráficos e dashboards administrativos. Agora, ao abrir o aplicativo, você compreende o seu dia em poucos segundos:

1. **Tarefas:** o que você precisa fazer.
2. **Cronograma:** quando você vai fazer.
3. **Diário:** o que aconteceu e o que você está pensando.

Tudo é executado diretamente no navegador através de uma Single Page Application com persistência automática no `localStorage`, pronta para publicação estática no **GitHub Pages**.

---

## 🧭 As 3 Páginas Principais

### 1. Hoje (`TodayView`)
- **Data atual** com formatação discreta em português.
- **Captura rápida de tarefas** com seletor direto de horário (`time`) sem navegação entre telas.
- **Prioridades de hoje**: destaque sutil de até 3 tarefas essenciais.
- **Próximos horários e compromissos** do dia com indicação de compromissos fixos.
- **Lista de tarefas do dia** com caixas de conclusão, marcação de foco e exclusão rápida.
- **Acesso direto com um clique** para escrever no Diário.

### 2. Cronograma (`ScheduleView`)
- Visualização cronológica da agenda **Diária** e **Semanal**.
- Criação simples de compromissos e blocos de tempo (*horário de início, fim e título*).
- Associação direta de tarefas a horários específicos.
- Conclusão rápida e edição de blocos.

### 3. Diário (`SimpleJournalView`)
- Editor de escrita confortável, limpo e com salvamento automático (*auto-save*).
- Campo de título e texto livre, sem obrigatoriedade de campos complexos.
- Histórico cronológico organizado por datas e busca por palavras-chave.
- Exportação de todas as reflexões em formato **Markdown (.md)** legível.

---

## ⚙️ Ajustes, Backup & Tema
- Acessível discretamente no rodapé da navegação e no topo mobile.
- **Modo Claro & Escuro** integrados com preservação no navegador.
- **Backup JSON**: exportação e importação de segurança com validação estrutural.

---

## 🧪 Testes e Build

- **Testes automatizados:** `npx vitest run` (10/10 testes passando).
- **Build de produção:** `npm run build` (geração de bundle estático compatível com GitHub Pages).
