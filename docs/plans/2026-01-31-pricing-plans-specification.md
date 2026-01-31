# Negócio em Dia - Especificação dos Planos

**Data:** 2026-01-31
**Status:** Definido para MVP

---

## Visão Geral

Negócio em Dia é uma ferramenta para vendedores de side hustles (comida, artesanato, serviços) acompanharem custos, margens de lucro e vendas reais.

**Público-alvo:** Pessoas que vendem produtos/serviços como side hustle (vendedores de condomínio, food trucks, confeiteiros, etc.)

---

## Planos de Assinatura

### 🆓 Plano 1: Em Dia (Gratuito)

**Descrição:** Comece a organizar seu negócio

**Recursos incluídos:**
- ✅ Criar até **3 produtos**
- ✅ Adicionar ingredientes/custos por produto
- ✅ Calcular custo por unidade automaticamente
- ✅ Ver margem de lucro (preço de venda - custo)
- ❌ Rastreamento de lotes de produção
- ❌ Registro de vendas
- ❌ Histórico de lucros

**Limites:**
- Máximo de 3 produtos simultâneos
- Sem persistência de histórico (apenas cálculo em tempo real)

**Preço:** R$ 0/mês

**Caso de uso:**
> Maria vende brigadeiros no condomínio. Ela cria o produto "Brigadeiro Gourmet", adiciona os ingredientes (leite condensado R$ 5, chocolate R$ 8, etc.), e o app calcula que cada brigadeiro custa R$ 0,80. Se ela vender a R$ 2,50, tem lucro de R$ 1,70 por unidade (68% de margem).

---

### 💰 Plano 2: Em Alta (Pago)

**Descrição:** Acompanhe suas vendas e lucros reais

**Recursos incluídos:**
- ✅ **Tudo do plano Em Dia**
- ✅ **Produtos ilimitados**
- ✅ **Rastreamento de lotes de produção**
  - Registrar quando comprou ingredientes (data, valor total gasto)
  - Registrar quantas unidades produziu
  - Ver custo real por unidade do lote
- ✅ **Registro de vendas por lote**
  - Quantas unidades vendeu
  - Por quanto vendeu cada uma
  - Lucro real do lote
- ✅ **Histórico completo**
  - Ver todos os lotes produzidos
  - Ver todas as vendas realizadas
  - Ver lucro total por período (semana/mês)

**Limites:**
- Nenhum (produtos, lotes e vendas ilimitados)

**Preços:**
- **Mensal:** R$ 29,90/mês
- **Anual:** R$ 299,00/ano (equivalente a R$ 24,92/mês — economiza ~17%)

**Caso de uso:**
> João vende burgers artesanais. Na segunda-feira ele compra R$ 85 em ingredientes e faz 10 burgers (custo: R$ 8,50/cada). Registra no app como "Lote 15/01". Durante a semana vende 8 burgers a R$ 18 cada (R$ 144 de receita - R$ 68 de custo = R$ 76 de lucro real). No fim do mês, ele vê que fez R$ 450 de lucro em 6 lotes.

---

### 🚀 Plano 3: Em Destaque (Em breve)

**Descrição:** Recursos avançados para negócios em crescimento

**Status:** Não será desenvolvido no MVP. Será lançado em versões futuras com base no feedback dos usuários.

**Recursos planejados (futuro):**
- 🔜 Relatórios e gráficos avançados (produto mais vendido, tendências de custo, etc.)
- 🔜 Múltiplos negócios na mesma conta
- 🔜 Acesso para equipe/sócios (compartilhar gestão)
- 🔜 Exportar dados (Excel/PDF)
- 🔜 Integração com WhatsApp para registro de vendas
- 🔜 Alertas de margem de lucro baixa

**Preço estimado:** R$ 49,90/mês (a definir)

---

## Configuração no Stripe

### Produto 1: Em Dia
- **Nome:** Em Dia
- **Descrição:** Comece a organizar seu negócio
- **Preço:** R$ 0
- **Tipo:** Gratuito (não requer criação no Stripe)

### Produto 2: Em Alta (Mensal)
- **Nome:** Em Alta - Mensal
- **Descrição:** Acompanhe suas vendas e lucros reais (cobrado mensalmente)
- **Preço:** R$ 29,90/mês
- **Intervalo de cobrança:** Mensal (recurring)
- **Moeda:** BRL

### Produto 3: Em Alta (Anual)
- **Nome:** Em Alta - Anual
- **Descrição:** Acompanhe suas vendas e lucros reais (cobrado anualmente com desconto)
- **Preço:** R$ 299,00/ano
- **Intervalo de cobrança:** Anual (recurring)
- **Moeda:** BRL
- **Economia:** ~17% comparado ao plano mensal

---

## Comparação com Concorrentes

| Produto | Preço Mensal | Preço Anual | Foco |
|---------|--------------|-------------|------|
| **Calcularte** | R$ 49,90 | R$ 359,76 (12x R$ 29,98) | Artesanato geral |
| **CUCA** | Grátis | Grátis | Restaurantes/bares |
| **Emulzint e-Você** | Grátis | Grátis | Confeitarias/padarias |
| **Negócio em Dia (Em Alta)** | **R$ 29,90** | **R$ 299,00** | **Side hustles/vendedores** |

**Diferencial:**
- Mais barato que Calcularte (~40% mais acessível)
- Foco em rastreamento de lotes e vendas reais (não só cálculo teórico)
- Interface simples voltada para vendedores que usam WhatsApp/Instagram

---

## Estratégia de Monetização

**Objetivo do plano gratuito:**
- Capturar usuários que querem "só calcular o preço" (baixa barreira de entrada)
- Demonstrar valor antes de pedir cartão de crédito
- Limite de 3 produtos força upgrade quando o negócio cresce

**Objetivo do plano pago:**
- Capturar usuários que vendem regularmente e precisam acompanhar lucro real
- Preço acessível (< R$ 30/mês) para público de side hustle
- Desconto anual incentiva comprometimento de longo prazo

**Objetivo do plano "Em Destaque":**
- Placeholder para mostrar roadmap e coletar feedback
- Será desenvolvido com base nas features mais pedidas pelos usuários

---

## Implementação Técnica (Resumo)

**Gating de features:**
- Frontend verifica `billing.product.name` para liberar/bloquear recursos
- Plano gratuito: sem billing record no DB, UI mostra limite de 3 produtos
- Plano pago: billing record com `status = 'active'`, UI libera todas as features

**Tabelas no banco:**
- `users` - Dados do usuário
- `products` (Stripe) - Planos de assinatura (Em Alta Mensal, Em Alta Anual)
- `billings` - Assinaturas ativas dos usuários
- `business_products` - Produtos que o usuário vende (burgers, brigadeiros, etc.)
- `batches` - Lotes de produção (data, custo, quantidade)
- `sales` - Vendas por lote (quantidade vendida, preço)

---

## Próximos Passos

1. ✅ Definir planos e preços
2. ⏳ Criar produtos no Stripe Dashboard (test mode)
3. ⏳ Popular tabela `products` no DB com IDs do Stripe
4. ⏳ Implementar feature gating no frontend
5. ⏳ Construir telas de criação de produtos/lotes/vendas
6. ⏳ Testar fluxo completo com Stripe CLI
