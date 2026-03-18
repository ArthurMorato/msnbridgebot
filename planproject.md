# Bridge Bot - System Architecture & Technical Specification
**Version:** 1.0.0 | **Status:** Draft/Planning

## 1. System Overview
Serviço de espelhamento bidirecional em tempo real entre plataformas de mensageria (Telegram e WhatsApp). O sistema atua como um *middleware* reativo, roteando mensagens de texto e fluxos de mídia (*streams*) de forma assíncrona, garantindo a entrega mesmo sob indisponibilidade temporária de uma das pontas.

## 2. Architectural Drivers & Stack
Padrões adotados para garantir desacoplamento, testabilidade e escalabilidade horizontal:
* **Padrões de Design:** Domain-Driven Design (DDD), Arquitetura Hexagonal (Ports & Adapters), Event-Driven Architecture (EDA).

| Camada / Função | Tecnologia Definida | Justificativa / Uso Específico |
| :--- | :--- | :--- |
| **Linguagem** | Node.js + TypeScript (Strict) | Tipagem forte e I/O assíncrono otimizado para *streams*. |
| **Message Broker** | RabbitMQ | Roteamento de eventos (Exchanges/Queues) e garantia de entrega (ACKs). |
| **Cache & Locks** | Redis | Rate limiting e prevenção de *loops* de espelhamento. |
| **Database** | PostgreSQL | Persistência dos mapeamentos de grupos (`GroupMapping`) e logs de auditoria. |
| **Plataforma WA** | `baileys` (ou similar WebSockets) | Conexão headless com o WhatsApp via WebSockets. |
| **Plataforma TG** | `telegraf` (ou `gramjs`) | Consumo da API Bot ou MTProto do Telegram. |
| **Infra/DevOps** | Docker + GitHub Actions + Terraform | Containers *stateless*, CI/CD automatizado e IaC para provisionamento (AWS/DigitalOcean). |
| **Observabilidade**| Prometheus + Grafana | Coleta de métricas (latência, mensagens/min) e health checks. |

---

## 3. Core Business & Technical Rules (Constraints)

1. **Prevenção de Loop Infinito (Circuit Breaker):**
   * Uma mensagem originada no Telegram e enviada ao WhatsApp **não pode** ser lida pelo *listener* do WhatsApp e enviada de volta ao Telegram. O sistema deve assinar/marcar as mensagens processadas (via Redis ou metadados da mensagem) e descartar o eco.
2. **Gerenciamento de Memória (Media Streaming):**
   * Limite de *payload* definido via variável de ambiente (ex: `MAX_MEDIA_SIZE=50MB`).
   * Arquivos multimídia **nunca** devem ser carregados integralmente na RAM (`Buffer`). O tráfego deve usar `Node.js Streams` (`Platform A -> Node -> Platform B`).
3. **Resiliência e Retentativas (Retry Policy):**
   * Falhas de rede (ex: WhatsApp desconectado) enviam a mensagem para uma fila de retentativa no RabbitMQ (Dead Letter Exchange) com *Exponential Backoff* (ex: tenta em 1m, 5m, 15m).
4. **Idempotência:**
   * O processamento de um evento `MessageReceivedEvent` deve ser idempotente. O reprocessamento acidental do mesmo ID não deve gerar mensagens duplicadas no destino.

---

## 4. Domain Data Structures

### 4.1. `StandardMessage` (Core Payload)
Contrato padrão imposto sobre todas as plataformas de entrada.

| Field | Type | Constraint / Note |
| :--- | :--- | :--- |
| `id` | `UUIDv4` | PK interna do sistema. |
| `originMessageId` | `String` | ID da mensagem nativa (necessário para *Replies*/Respostas). |
| `originPlatform` | `Enum` | `TELEGRAM` \| `WHATSAPP`. |
| `sourceGroupId` | `String` | ID do chat de origem para buscar o mapeamento. |
| `authorName` | `String` | Nome/Telefone extraído do emissor original. |
| `textContent` | `String` | Corpo do texto ou legenda (pode ser `null` se for apenas mídia). |
| `hasMedia` | `Boolean` | Flag para acionar o fluxo de *Stream*. |
| `timestamp` | `ISO 8601` | Data/hora de entrada no *Message Broker*. |

### 4.2. `GroupMapping` (Routing Rule)
Regra armazenada no PostgreSQL.

| Field | Type | Constraint / Note |
| :--- | :--- | :--- |
| `id` | `UUIDv4` | PK. |
| `telegramGroupId` | `String` | Indexado (Unique). |
| `whatsappGroupId` | `String` | Indexado (Unique). |
| `status` | `Enum` | `ACTIVE`, `PAUSED`, `ERROR`. |

---

## 5. System Events (Spec-Driven Contracts)
Os *workers* se comunicam estritamente via RabbitMQ usando os eventos abaixo (formato JSON):

* **`MessageReceivedEvent`**: Publicado pelos Adapters de Entrada.
* **`RouteResolvedEvent`**: Publicado pelo *Core* após consultar o BD e encontrar um `GroupMapping` válido. Contém a mensagem e o ID do grupo de destino.
* **`DeliveryFailedEvent`**: Publicado pelos Adapters de Saída caso ocorra erro (Gatilho para *Retry*).

---

## 6. Directory Structure (Lifelong Pattern)
Isolamento rigoroso de responsabilidades. A pasta `core` não possui dependências de NPM externas (exceto tipagens).

```text
/
├── infra/                  # Terraform, Kubernetes/Docker configs, Grafana Dashboards
├── .github/workflows/      # CI (Testes, Lints) e CD (Deploy no GHCR/Servidor)
├── src/
│   ├── core/               # 🔴 Domain Entities, Value Objects e Custom Errors
│   ├── application/        # 🟡 Use Cases (ex: ProcessMessageUseCase) e Interfaces/Ports
│   ├── infrastructure/     # 🟢 Implementações das Interfaces (Postgres, RabbitMQ, WA, TG)
│   └── presentation/       # 🔵 Consumers do RabbitMQ, API RESTful para config interna
└── docker-compose.yml      # Ambiente completo de desenvolvimento (App + BD + Broker)
