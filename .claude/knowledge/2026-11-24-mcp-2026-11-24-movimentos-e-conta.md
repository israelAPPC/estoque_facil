---
agent: mcp
data: 2026-11-24
origem: nota
---

## decisao
2026-11-24: movimentos e contagens guardam timestamp (data e hora); calcularSaldo considera só movimentos com instante estritamente posterior ao da contagem-base. compararContagens lista produto presente só na anterior como "omitido", sem delta, até o usuário escolher manter ou zerar.
