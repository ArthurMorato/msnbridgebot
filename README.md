# 🌉 Group Bridge Bot
**Event-Driven Messaging Middleware | Telegram ↔ WhatsApp**

[![Architecture: Hexagonal](https://img.shields.io/badge/Architecture-Hexagonal/DDD-green?style=flat-square)](#)
[![Engine: Node.js/TS](https://img.shields.io/badge/Engine-Node.js/TS-blue?style=flat-square)](#)
[![DevOps: Ready](https://img.shields.io/badge/DevOps-IaC/CI/CD-orange?style=flat-square)](#)

O **Group Bridge Bot** é um middleware reativo de alta performance projetado para sincronização bidirecional de mensagens e mídia entre Telegram e WhatsApp. O sistema foi concebido sob os princípios de **Clean Architecture** e **Event-Driven Design (EDD)** para garantir desacoplamento total entre as APIs de mensageria e a lógica de negócio.

---

## 🏗️ Arquitetura e Decisões de Engenharia

### 1. Desacoplamento via Arquitetura Hexagonal
O "Core" da aplicação (Domínio) é agnóstico a protocolos externos. As integrações com Telegram (via MTProto/Telegraf) e WhatsApp (via WebSockets/Baileys) são tratadas como **Inbound/Outbound Adapters**, permitindo a substituição ou adição de novas plataformas (ex: Discord, Slack) sem alteração na lógica de roteamento.

### 2. Fluxo de Dados Orientado a Eventos (EDD)
Para garantir a integridade das mensagens em cenários de instabilidade de API, o sistema utiliza um **Message Broker (RabbitMQ)**:
* **Producer:** O adapter de entrada capta a mensagem e a normaliza para um `StandardMessage`.
* **Exchange:** O broker roteia o evento para as filas de processamento baseando-se em chaves de roteamento.
* **Consumer:** Os workers de saída consomem a fila de forma assíncrona, garantindo a entrega com suporte a **Dead Letter Exchanges (DLX)** para tratamento de falhas.

### 3. Gerenciamento de Mídia e Performance
* **Bufferless Streaming:** O processamento de mídias (fotos, vídeos e documentos) utiliza **Node.js Streams**. O dado flui da origem para o destino via *pipe*, evitando o carregamento integral no Heap e mantendo o consumo de RAM estável e reduzido.
* **Deduplicação e Loop Prevention:** Implementação de um mecanismo de trava (*locking*) via **Redis** para evitar o "eco" — mensagens replicadas em loop infinito entre as plataformas.

---

## 🛠️ Tech Stack & Infrastructure

| Camada | Tecnologia | Motivação |
| :--- | :--- | :--- |
| **Runtime** | Node.js (TypeScript) | Non-blocking I/O e tipagem estritamente definida para segurança em tempo de compilação. |
| **Broker** | RabbitMQ | Persistência de mensagens, garantia de entrega e controle de vazão (*Backpressure*). |
| **Cache/Lock** | Redis | Operações atômicas para prevenção de loops e controle de Rate Limiting. |
| **Persistence** | PostgreSQL | Armazenamento relacional de mapeamentos de grupos e logs de auditoria. |
| **IaC** | Terraform | Provisionamento declarativo e replicável da infraestrutura cloud. |
| **CI/CD** | GitHub Actions | Automação total de pipelines de linting, testes unitários e deployment. |
| **Observability** | Prometheus & Grafana | Coleta de métricas críticas (latência fim-a-fim, taxa de sucesso de entrega). |

---

## 🚦 Business Rules & Resilience

* **Idempotência:** Cada mensagem possui um hash único baseado no conteúdo e metadados de origem, garantindo que o reprocessamento de um evento não gere mensagens duplicadas.
* **Exponential Backoff:** Falhas transientes nas APIs das plataformas acionam uma política de retentativa com atraso exponencial (1m, 5m, 15m).
* **Circuit Breaker:** Proteção contra degradação em cascata. Se uma das APIs externas apresentar instabilidade persistente, o sistema interrompe as tentativas temporariamente para preservar recursos.

---

## 📂 Estrutura de Diretórios (Lifecycle Ready)

```text
bridge-bot/
├── infra/
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── docker/
│   │   ├── prometheus.yml
│   │   └── grafana-dashboard.json
│   └── kubernetes/
│       ├── deployment.yml
│       └── service.yml
├── .github/workflows/
│   ├── ci.yml
│   └── cd.yml
├── src/
│   ├── core/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── StandardMessage.ts
│   │   │   │   ├── GroupMapping.ts
│   │   │   │   └── MessageEvent.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── Platform.ts
│   │   │   │   └── MessageId.ts
│   │   │   └── errors/
│   │   │       ├── DomainError.ts
│   │   │       ├── LoopPreventionError.ts
│   │   │       └── MediaSizeError.ts
│   │   └── ports/
│   │       ├── MessageBrokerPort.ts
│   │       ├── CachePort.ts
│   │       ├── DatabasePort.ts
│   │       └── PlatformAdapterPort.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── ProcessMessageUseCase.ts
│   │   │   ├── MapGroupsUseCase.ts
│   │   │   └── RetryFailedMessageUseCase.ts
│   │   ├── services/
│   │   │   ├── MessageRouterService.ts
│   │   │   ├── LoopPreventionService.ts
│   │   │   └── MediaStreamService.ts
│   │   └── interfaces/
│   │       ├── IMessageBroker.ts
│   │       ├── ICache.ts
│   │       └── IDatabase.ts
│   ├── infrastructure/
│   │   ├── message-broker/
│   │   │   ├── RabbitMQBroker.ts
│   │   │   ├── EventPublisher.ts
│   │   │   └── EventConsumer.ts
│   │   ├── cache/
│   │   │   └── RedisCache.ts
│   │   ├── database/
│   │   │   ├── PostgresRepository.ts
│   │   │   ├── models/
│   │   │   │   └── GroupMappingModel.ts
│   │   │   └── migrations/
│   │   │       └── 001_create_group_mappings.sql
│   │   ├── platforms/
│   │   │   ├── telegram/
│   │   │   │   ├── TelegramAdapter.ts
│   │   │   │   ├── TelegramListener.ts
│   │   │   │   └── TelegramSender.ts
│   │   │   └── whatsapp/
│   │   │       ├── WhatsAppAdapter.ts
│   │   │       ├── WhatsAppListener.ts
│   │   │       └── WhatsAppSender.ts
│   │   └── config/
│   │       ├── env.ts
│   │       ├── logger.ts
│   │       └── metrics.ts
│   └── presentation/
│       ├── consumers/
│       │   ├── MessageReceivedConsumer.ts
│       │   ├── RouteResolvedConsumer.ts
│       │   └── DeliveryFailedConsumer.ts
│       ├── api/
│       │   ├── controllers/
│       │   │   ├── GroupMappingController.ts
│       │   │   └── HealthController.ts
│       │   ├── routes/
│       │   │   └── index.ts
│       │   └── server.ts
│       └── workers/
│           ├── TelegramWorker.ts
│           └── WhatsAppWorker.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env.example
└── README.md

```

## 🚀 Setup de Desenvolvimento

    Requisitos: Docker e Node.js 20+.

    Ambiente: ```bash
    cp .env.example .env
    docker-compose up -d  # Provisiona RabbitMQ, Redis, Postgres e Grafana
    npm install && npm run dev

    Métricas: Acesse localhost:3000 para visualizar o dashboard de performance no Grafana.

👤 Autor

[Arthur Morato](arthurmorato.com) - [LinkedIn](https://www.linkedin.com/in/arthur-morato-a71629339/) 
