# Pendências: Lojas (LOJ)

<a id="loj-002"></a>
### LOJ-002: Seletor de loja reutilizável para os outros módulos.

**P2 · FEATURE** · origem: 2026-11-24

Fora da Task 2.2; depende da tela e do uso nas contagens/requisições.

<a id="loj-003"></a>
### LOJ-003: Validar a tela /lojas no navegador com Supabase real e cobrir as ações com teste.

**P2 · TESTE** · origem: 2026-11-24

Páginas e ações (`src/app/(app)/lojas/`) passaram em lint, tipos e build, mas não foram abertas num ambiente real (criar, editar, nome duplicado, desativar/reativar, paginação). Só `interpretarPagina` tem teste automatizado; as ações de servidor não têm teste.
