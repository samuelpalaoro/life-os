# Segurança e Privacidade — Life OS

> Políticas, boas práticas de segurança em aplicações cliente e recomendações de privacidade para o Life OS.

---

## 1. Modelo de Ameaça e Premissas de Arquitetura

O Life OS é uma aplicação cliente estática (Client-Side Only SPA). Isso molda fundamentalmente sua postura de segurança:

1. **Sem Servidor de Backend:** Não há banco de dados relacional remoto gerenciado, não há endpoints REST com credenciais de banco e não há sessão de usuário em servidor mantida pelo projeto.
2. **Armazenamento 100% Local:** Os dados do usuário (tarefas, notas íntimas do diário, compromissos pessoais) residem estritamente no armazenamento local do navegador (`localStorage` e `IndexedDB`).
3. **Ausência de Criptografia At-Rest no Código:**
   > [!IMPORTANT]
   > Os dados salvos no `localStorage` e no `IndexedDB` **NÃO estão criptografados** a nível de aplicação. Eles são gravados em texto plano JSON gerenciado pela sandbox do navegador. A segurança física e lógica dos dados depende diretamente da segurança do dispositivo e do perfil do sistema operacional do usuário.

---

## 2. Boas Práticas para Agentes de Programação

### A. Proibição Absoluta de Segredos e Chaves no Código
- Nunca insira tokens de API, chaves secretas ou credenciais hardcoded em nenhum arquivo (`.ts`, `.tsx`, `.json`, `.yml`).
- Como a aplicação é compilada para arquivos estáticos distribuídos publicamente no GitHub Pages, qualquer segredo incluído no código torna-se imediatamente público e comprometido.

### B. Proteção contra Cross-Site Scripting (XSS)
- O React escapa automaticamente variáveis renderizadas no JSX.
- **Proibição estrita:** É proibido utilizar `dangerouslySetInnerHTML` para renderizar anotações ou conteúdos do usuário sem sanitização explícita via biblioteca confiável (como DOMPurify).
- Mantenha a renderização de texto do diário e títulos utilizando elementos JSX nativos (`<p>`, `<span>`, `<textarea>`).

### C. Higienização e Validação de Backups
- O Life OS permite que o usuário importe arquivos `.json` externos.
- Nunca execute código através de `eval()` ou construtores dinâmicos de funções.
- Toda importação deve passar obrigatoriamente pela validação estrutural de `validateAppStateData()`, descartando propriedades suspeitas e assegurando integridade tipada.

---

## 3. Privacidade do Usuário

- **Sem Telemetria ou Rastreamento Invasivo:** O Life OS não possui scripts de rastreamento de terceiros (Google Analytics, Mixpanel, Meta Pixel, etc.).
- **Isolamento de Dados Sensíveis:** O conteúdo das anotações no Diário é estritamente pessoal. Nenhuma rotina deve enviar textos ou reflexões para APIs de LLM externas sem a autorização explícita e consciente do usuário.

---

## 4. Cuidados com a Hospedagem no GitHub Pages

- O repositório e o branch `gh-pages` (ou artefato do Actions) expõem apenas o código transpilado em `./dist`.
- Verifique periodicamente se nenhum arquivo pessoal ou dump de testes contendo dados reais foi acidentalmente commitado na pasta `public/` ou na raiz do repositório.
