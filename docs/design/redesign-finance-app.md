Redesign Finance App — Diretrizes de Produto e UI

1. Objetivo

Modernizar a interface do app de finanças pessoais, mantendo a identidade visual atual e todas as funcionalidades existentes.

O app hoje já possui uma base visual em tema escuro, com uso de laranja/vermelho para ações e despesas, verde para receitas/saldos positivos e cards arredondados. O objetivo do redesign é deixar a interface com aparência mais profissional, premium, consistente e próxima de um produto real de fintech.

O redesign deve atuar principalmente na camada visual, experiência de uso, organização dos componentes, hierarquia de informação, responsividade e consistência entre telas.

Não alterar regras de negócio, fluxos principais, validações, integrações, persistência de dados ou navegação sem necessidade explícita.

⸻

2. Princípios do novo design

2.1 Visual premium e moderno

A interface deve parecer um app financeiro moderno, escuro, elegante e confiável. O visual precisa transmitir organização, clareza e controle financeiro.

Evitar aparência amadora, excesso de espaço vazio, cards gigantes, bordas muito marcadas, textos quebrados, componentes desalinhados ou botões visualmente pesados.

2.2 Manter identidade atual

Não trocar completamente o esquema de cores. A paleta atual deve ser preservada e refinada.

Cores principais:

* Fundo principal: preto ou cinza muito escuro.
* Cards: grafite escuro.
* Ação principal: laranja queimado/vermelho.
* Despesas: vermelho/laranja.
* Receitas e saldos positivos: verde.
* Texto principal: branco.
* Texto secundário: cinza claro.
* Bordas: cinza escuro sutil.

2.3 Clareza acima de decoração

O app deve priorizar leitura rápida de dados financeiros.

Valores importantes devem ter destaque. Informações secundárias devem ter menor contraste. Gráficos devem ser limpos e fáceis de interpretar.

2.4 Consistência entre telas

Todas as telas devem compartilhar a mesma linguagem visual:

* Mesmo padrão de header.
* Mesmo padrão de cards.
* Mesmo padrão de botões.
* Mesma navegação inferior.
* Mesma tipografia.
* Mesmos espaçamentos.
* Mesmos estados ativos/inativos.
* Mesmos estilos para receitas, despesas e valores neutros.

⸻

3. Design tokens sugeridos

Estes valores são uma referência. Adaptar para a estrutura real do projeto, framework e tema existente.

3.1 Cores

colors = {
  background: '#080C0E',
  backgroundElevated: '#0D1114',
  surface: '#121418',
  surfaceSoft: '#181B20',
  surfaceMuted: '#20242A',
  border: '#2A2F36',
  borderSoft: 'rgba(255,255,255,0.08)',
  textPrimary: '#F5F7FA',
  textSecondary: '#A7ADB5',
  textMuted: '#707780',
  primary: '#E75235',
  primaryPressed: '#C9432B',
  primarySoft: 'rgba(231,82,53,0.16)',
  income: '#2ECC71',
  incomeSoft: 'rgba(46,204,113,0.14)',
  expense: '#EF4D43',
  expenseSoft: 'rgba(239,77,67,0.14)',
  warning: '#F5B84B',
  warningSoft: 'rgba(245,184,75,0.14)',
  neutral: '#9CA3AF',
  white: '#FFFFFF',
  black: '#000000'
}

3.2 Radius

radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999
}

3.3 Espaçamento

spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
}

3.4 Tipografia

Usar a fonte já disponível no projeto. Caso exista flexibilidade, preferir algo próximo de Inter, SF Pro, Roboto ou system font.

Hierarquia sugerida:

typography = {
  screenTitle: {
    size: 32,
    lineHeight: 38,
    weight: '700'
  },
  sectionTitle: {
    size: 20,
    lineHeight: 26,
    weight: '600'
  },
  cardTitle: {
    size: 16,
    lineHeight: 22,
    weight: '600'
  },
  body: {
    size: 14,
    lineHeight: 20,
    weight: '400'
  },
  caption: {
    size: 12,
    lineHeight: 16,
    weight: '400'
  },
  amountLarge: {
    size: 34,
    lineHeight: 40,
    weight: '700'
  },
  amountMedium: {
    size: 24,
    lineHeight: 30,
    weight: '700'
  }
}

⸻

4. Componentes base

4.1 App screen

Toda tela deve ter:

* Fundo escuro consistente.
* Safe area respeitada.
* Padding horizontal consistente.
* Conteúdo com scroll quando necessário.
* Espaçamento inferior suficiente para não ficar escondido atrás da bottom navigation.
* Sem elementos importantes encobertos por FAB ou navegação inferior.

4.2 Header

O header deve ser compacto e consistente.

Elementos sugeridos:

* Avatar à esquerda.
* Saudação ou nome da tela.
* Ação secundária à direita, como ícone de notificação, configurações ou sair.
* O botão “Sair” deve ser menos dominante do que hoje. Pode virar item em Configs/Mais ou botão discreto.

Visual:

* Altura reduzida.
* Avatar circular.
* Texto secundário em cinza.
* Ícones minimalistas.
* Evitar ocupar espaço excessivo.

4.3 Screen title

Cada tela deve ter título forte, porém controlado.

Evitar títulos que quebrem em muitas linhas sem necessidade.

Exemplos:

* Início
* Análise financeira
* Movimentações
* Planejamento
* Contas
* Categorias
* Configurações

Subtítulos devem ser curtos e só aparecer quando ajudarem o usuário.

4.4 Cards

Cards devem ter aparência premium e consistente.

Regras:

* Fundo grafite escuro.
* Border sutil.
* Radius entre 20 e 28.
* Padding interno entre 16 e 20.
* Sombra discreta, se suportado.
* Sem bordas muito claras ou grossas.
* Evitar altura exagerada.
* Evitar conteúdo centralizado sem necessidade.
* Alinhamento à esquerda para leitura financeira.

4.5 Botões

Botões principais:

* Fundo laranja/vermelho.
* Formato pill.
* Texto branco.
* Altura confortável.
* Ícone opcional à esquerda.
* Estado pressionado mais escuro.

Botões secundários:

* Fundo transparente ou surfaceSoft.
* Border sutil.
* Texto branco/cinza.
* Formato pill.

Botões pequenos de ação:

* Usar ícones minimalistas.
* Evitar botões grandes demais dentro de cards.
* Usar menu ou ícones quando a ação for secundária.

4.6 Inputs

Inputs devem ser compactos e modernos.

* Fundo surface.
* Border sutil.
* Radius md/lg.
* Label acima do campo.
* Texto principal branco.
* Placeholder cinza.
* Estado focado com borda primary.
* Evitar inputs muito altos.

4.7 Pills / filtros

Filtros devem ser pills compactas.

Estados:

* Ativo: fundo primary, texto branco.
* Inativo: fundo transparente ou surface, border sutil, texto secundário.

Usar em telas de movimentações, análise e seleção de período/categoria.

4.8 Bottom navigation

Redesenhar a navegação inferior para parecer moderna.

Abas:

* Início
* Análise
* Plano
* Contas
* Mais

Observação: se o app já possui “Configs”, considerar mover para “Mais” ou manter “Configs” caso seja a estrutura atual. A decisão deve respeitar o projeto existente.

Visual:

* Fundo escuro elevado.
* Ícone + label.
* Item ativo com destaque laranja.
* Pode usar cápsula escura com texto/ícone em laranja.
* Reduzir altura visual.
* Respeitar área segura inferior.
* Não sobrepor conteúdo.

4.9 FAB

O FAB deve ser usado para ação principal, como nova transação.

Visual:

* Circular ou pill flutuante.
* Cor primary.
* Ícone de “+”.
* Sombra suave.
* Posicionado sem cobrir cards importantes.
* Considerar label “Nova” em telas de lista.

⸻

5. Telas

5.1 Início / Dashboard

A Home deve ser o resumo financeiro principal.

Deve conter

* Saldo total.
* Receitas do mês.
* Despesas do mês.
* Quantidade de contas ativas.
* Planejamento financeiro.
* Últimas Transações.
* Ação para adicionar nova movimentação.

Estrutura sugerida

1. Header compacto.
2. Card hero de saldo total.
3. Cards menores de receitas e despesas.
4. Card de planejamento financeiro.
5. Seção “Últimas Transações”.
6. FAB ou botão para nova transação.

Card hero de saldo

Deve exibir:

* Label: “Saldo total”.
* Valor principal em verde quando positivo.
* Quantidade de contas ativas.
* Pequeno ícone ou indicador visual.
* Pode conter um mini resumo de receitas/despesas.

Últimas Transações

Adicionar uma seção de últimas transações na Home.

Cada item deve exibir:

* Ícone circular ou símbolo da categoria.
* Nome da transação.
* Categoria.
* Data ou horário.
* Valor à direita.
* Status opcional.

Exemplo de layout:

Últimas Transações        Ver todas
[ícone] Mercado
       Despesa · Hoje                    -R$ 150,00
[ícone] Salário
       Receita · Ontem                  +R$ 3.000,00
[ícone] Combustível
       Despesa · 14 Jun                  -R$ 80,00

Valores de despesa devem usar expense. Valores de receita devem usar income.

⸻

5.2 Análise

A tela de análise deve funcionar como dashboard visual do mês.

Deve conter

* Seletor de mês.
* Resumo mensal.
* Receita vs despesa.
* Gráfico mensal.
* Gastos por categoria.
* Gráfico de rosca ou lista categorizada.
* Legendas claras.

Melhorias esperadas

* Gráficos com barras arredondadas.
* Menos bordas e mais clareza visual.
* Valores bem posicionados.
* Legendas consistentes.
* Não cortar textos no centro da rosca.
* Não deixar gráficos muito escuros a ponto de sumirem.

Cards sugeridos

* Resumo mensal.
* Receita vs despesa.
* Evolução mensal.
* Gastos por categoria.

⸻

5.3 Movimentações / Transações

A tela de movimentações deve ser objetiva e focada em listagem.

Deve conter

* Título.
* Filtros por tipo.
* Filtro por categoria.
* Filtro por período.
* Lista agrupada por data.
* Botão para nova movimentação.

Filtros

Pills sugeridas:

* Todas
* Receitas
* Despesas
* Categoria
* Período
* Status

Item de movimentação

Cada movimentação deve conter:

* Nome.
* Categoria.
* Conta, se existir.
* Horário ou data.
* Valor.
* Status, se existir.
* Cor conforme tipo.

Evitar cards muito altos. A listagem deve ser fácil de escanear.

⸻

5.4 Planejamento financeiro

A tela de planejamento deve manter a funcionalidade atual de distribuição percentual.

Deve conter

* Equilíbrio atual.
* Total percentual.
* Barra segmentada.
* Essencial.
* Não essencial.
* Reserva.
* Inputs de percentuais.
* Botão salvar.

Melhorias esperadas

* Evitar quebra de palavras como “Essenc ial” ou “Reserv a”.
* Mini cards devem ter largura suficiente ou layout alternativo.
* Barra segmentada deve ser clara.
* Mensagem de validação deve indicar se fecha 100%.
* Inputs mais compactos.
* Botão salvar moderno.

Labels

Usar:

* Essencial
* Não essencial
* Reserva

⸻

5.5 Contas

A tela de contas deve manter o gerenciamento de contas.

Deve conter

* Total de contas ativas.
* Saldo total.
* Lista de contas.
* Ação para criar nova conta.
* Ação de editar conta.

Card de conta

Cada card deve exibir:

* Ícone ou sigla da conta.
* Nome da conta.
* Tipo da conta.
* Saldo atual.
* Saldo inicial.
* Ações secundárias.

O botão editar deve ser discreto.

⸻

5.6 Categorias e subcategorias

A tela deve manter criação, edição e organização de categorias e subcategorias.

Deve conter

* Título.
* Descrição curta.
* Botão nova categoria.
* Lista de categorias.
* Ação editar.
* Ação adicionar subcategoria.

Card de categoria

Cada card deve exibir:

* Ícone ou sigla.
* Nome da categoria.
* Tipo: Receita ou Despesa.
* Quantidade de subcategorias, caso disponível.
* Botão editar.
* Botão adicionar subcategoria.

Evitar botões grandes demais dentro do card.

⸻

5.7 Configurações / Mais

Caso exista uma tela de configurações, ela deve ser organizada como lista de preferências.

Sugestão de grupos

* Perfil
* Notificações
* Segurança
* Backup e dados
* Sobre o app
* Sair

O logout pode ser movido para esta tela para deixar o header mais limpo.

⸻

6. Estados vazios

Todas as listas devem ter estado vazio visualmente agradável.

Exemplos:

Sem transações

Nenhuma transação ainda
Adicione sua primeira movimentação para acompanhar seu mês.
[+ Nova transação]

Sem categorias

Nenhuma categoria criada
Crie categorias para organizar suas receitas e despesas.
[+ Nova categoria]

Sem contas

Nenhuma conta cadastrada
Cadastre sua primeira conta para acompanhar seu saldo.
[+ Nova conta]

⸻

7. Regras de responsividade e legibilidade

* Não permitir texto quebrado de forma estranha.
* Não cortar labels importantes.
* Cards devem adaptar conteúdo.
* Listas devem rolar sem esconder conteúdo atrás da bottom navigation.
* FAB não deve cobrir informações importantes.
* Valores grandes devem caber sem quebrar layout.
* Usar number formatting brasileiro, como R$ 1.250,00.
* Datas devem seguir padrão pt-BR.

⸻

8. Acessibilidade

* Garantir contraste suficiente entre texto e fundo.
* Área de toque mínima confortável.
* Não depender apenas de cor para indicar status.
* Usar textos ou ícones junto com cores quando possível.
* Manter labels claros em inputs.
* Garantir leitura de valores financeiros.

⸻

9. O que não fazer

* Não mudar o esquema de cores para azul/roxo/claro.
* Não transformar o app em outro produto.
* Não remover funcionalidades existentes.
* Não alterar regras de negócio sem necessidade.
* Não refatorar toda a arquitetura sem motivo.
* Não criar componentes duplicados se já existirem componentes base reaproveitáveis.
* Não deixar textos quebrados.
* Não deixar botões sobrepostos ao conteúdo.
* Não esconder dados importantes.
* Não implementar mock fixo se já existem dados reais no app.

⸻

10. Referência visual

Usar a imagem /docs/design/referencia-novo-design.png apenas como referência visual de estilo.

A imagem não precisa ser copiada literalmente. Ela serve para orientar:

* Densidade visual.
* Cards premium.
* Bottom navigation moderna.
* Gráficos mais limpos.
* Hierarquia de valores.
* Componentes compactos.
* Aparência geral de fintech dark.

O documento redesign-finance-app.md é a fonte principal de verdade. A imagem é apoio visual.