## Descrição das Alterações

<!-- Descreva de forma clara e objetiva o que esta alteração faz e por quê. -->

## Tipo de Mudança

- [ ] Nova funcionalidade (`feat`)
- [ ] Correção de bug (`fix`)
- [ ] Refatoração de código sem impacto visual ou funcional (`refactor`)
- [ ] Atualização ou criação de documentação (`docs`)
- [ ] Ajustes em testes ou ferramentas de build (`test` / `chore`)

## Lista de Verificação (Checklist)

- [ ] Os testes automatizados foram executados e passaram (`npx vitest run`).
- [ ] O build de produção foi gerado sem erros de compilação TypeScript (`npm run build`).
- [ ] A compatibilidade com GitHub Pages foi preservada (caminhos relativos e ausência de servidor Node).
- [ ] Os dados locais do usuário estão protegidos (sem quebras no `storageService` ou deleção forçada de `localStorage`/`IndexedDB`).
- [ ] A documentação pertinente em `docs/` foi atualizada, se aplicável.
