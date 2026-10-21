# Diretrizes de UI/UX e Design System — Life OS

> Padrões visuais, paleta de cores, tipografia, estados interativos e filosofia de experiência de uso do Life OS.

---

## 1. Filosofia Visual: Minimalismo Funcional e "Dark Premium"

O Life OS foi concebido para transmitir calma, sofisticação e clareza cognitiva. Ele rejeita a estética de dashboards empresariais saturados, gráficos desnecessários ou interfaces infantis.

### Princípios de Design:
- **Calma e Clareza:** Menos é mais. O espaço em branco (ou espaço escuro) é um elemento ativo de design para evitar fadiga visual.
- **Aparência Adulta e Profissional:** Tipografia refinada, bordas sutis com baixa opacidade e sombras suaves substituem gradientes chamativos e cores saturadas.
- **Destaque Semanal/Diário Funcional:** A cor de destaque deve guiar os olhos para a ação prioritária, sem poluir a visão do usuário.

---

## 2. Paleta de Cores e Tokens do Tailwind

As cores do Life OS estão configuradas em `tailwind.config.js` e em variáveis CSS no `src/index.css`:

### A. Tema Claro (*Warm Cream Paper*)
- Fundo Principal (`bg-canvas-light`): `#F8F7F4` (papel creme sutil e suave aos olhos).
- Superfícies Elevadas (`bg-white` / `bg-canvas-subtle`): `#FFFFFF` e `#F0EFEA`.
- Bordas Sutis (`border-canvas-subtle` / `--border-subtle`): `#EBE9E1`.
- Tipografia Principal (`text-ink-primary`): `#181824` (grafite meia-noite profundo).
- Tipografia Secundária (`text-ink-secondary` / `text-ink-muted`): `#555466` e `#8B8A99`.

### B. Tema Escuro (*Dark Premium Midnight*)
- Fundo Principal (`night-base` / `--bg-main`): `#0D0E15` (ardósia meia-noite ultra-profunda com toque violeta).
- Superfícies e Menus (`night-surface`): `#141622`.
- Cartões Elevados (`night-card`): `#1B1E2E`.
- Bordas e Divisórias (`night-border`): `#272B40`.
- Hover em Elementos Escuros (`night-hover`): `#22263A`.
- Texto Principal (`dark:text-white` / `--text-primary`): `#F4F4F8`.
- Texto Secundário (`dark:text-ink-muted` / `--text-secondary`): `#A6A5B8`.

### C. Cores Semânticas de Destaque
- **Brand (Violeta Profundo / Lavanda):** Usado para navegação ativa, foco e badges (`#754DF6` - `brand-500`, `#6031EB` - `brand-600`).
- **Coral / Sunset (Laranja Queimado / Coral Vibrante):** Usado para chamadas de ação primárias, botões de alta prioridade e tags de alerta (`#F6533C` - `coral-500`, `#E13720` - `coral-600`).
- **Mint (Sucesso e Conclusão):** `#10B981` (`mint-500`).
- **Honey (Alerta e Avisos de Offline):** `#F59E0B` (`honey-500`).

---

## 3. Tipografia

Definida em `tailwind.config.js`:
- **Sans-serif (Padrão):** `'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
  - Excelente legibilidade em telas móveis e monitores de alta densidade.
- **Monospaced (Horários, Datas e Badges):** `'JetBrains Mono', monospace`.
- **Serif (Leitura Reflexiva no Diário):** `'Newsreader', Lora, Georgia, serif`.

---

## 4. Padrões de Microinteração e Acessibilidade

- **Feedback Tátil (`.interactive-tap`):**
  - Definido no `src/index.css`:
    ```css
    .interactive-tap {
      transition: transform 0.12s ease, box-shadow 0.12s ease;
      touch-action: manipulation;
    }
    .interactive-tap:active {
      transform: scale(0.97);
    }
    ```
- **Áreas Seguras Móveis (Safe Area Insets):**
  - Use sempre as classes utilitárias `.pb-safe` e `.pb-safe-nav` para garantir que botões de ação e listas não fiquem ocultos atrás da barra de navegação dos iPhones e aparelhos Android modernos.
- **Scrollbar Discreta:**
  - Barra de rolagem estilizada ultra-fina (5px) com acabamento arredondado e cor lavanda translúcida.
- **Acessibilidade:**
  - Todos os botões sem texto visível devem conter `aria-label` (ex: botões de fechar, alternar tema, excluir e editar).

---

## 5. Diretrizes para Criação de Novos Componentes

1. Sempre suporte nativamente tanto o modo claro quanto o modo escuro (`dark:`).
2. Utilize bordas sutis com cantos arredondados (`rounded-xl` ou `rounded-2xl`).
3. Mantenha os formulários e modais compactos e autoexplicativos.
4. Evite modais intrusivos quando uma edição inline ou popover resolver o problema.
