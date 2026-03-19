# Group Bridge Bot - Plano de Desenvolvimento Modular por Prompts

## 🎯 Estratégia de Desenvolvimento por Contratos (Spec-Driven)

### Princípios Fundamentais:
1. **Módulos Independentes**: Cada prompt gera um módulo coeso com contratos bem definidos
2. **Interface First**: Primeiro definimos as interfaces, depois as implementações
3. **Testabilidade**: Cada módulo deve ser testável isoladamente
4. **Inversão de Dependência**: Depender de abstrações, não de implementações

---

## 📋 Plano de Prompts Sequenciais

### FASE 1: FUNDAÇÃO DO DOMÍNIO

#### **Prompt 1: Core Domain - Entidades e Value Objects**
**Objetivo**: Estabelecer os blocos fundamentais do domínio
```markdown
Crie as entidades e value objects do domínio para o Group Bridge Bot:
1. Message (entidade raiz)
2. GroupMapping (mapeamento entre grupos)
3. Media (value object para mídias)
4. Platform (enum: TELEGRAM, WHATSAPP)
5. MessageType (enum: TEXT, IMAGE, VIDEO, DOCUMENT)

Requisitos:
- Use TypeScript strict
- Implemente validações nos value objects
- Crie testes unitários para cada
- Siga o padrão Result para operações que podem falhar
```

#### **Prompt 2: Eventos de Domínio e Erros**
**Objetivo**: Definir os eventos e erros do sistema
```markdown
Crie os eventos de domínio e erros tipados:
1. MessageReceivedEvent
2. MessageProcessedEvent
3. MessageForwardedEvent
4. DomainError base class
5. Erros específicos: LoopPreventionError, InvalidPlatformError, etc.

Requisitos:
- Eventos devem ser imutáveis
- Erros devem ter códigos únicos e metadados
- Implemente pattern matching para tratamento de erros
```

---

### FASE 2: CAMADA DE APLICAÇÃO

#### **Prompt 3: Casos de Uso Principais**
**Objetivo**: Implementar os casos de uso de orquestração
```markdown
Implemente os casos de uso principais:
1. ProcessMessageUseCase (orquestra o fluxo completo)
2. MapGroupsUseCase (mapeia grupos entre plataformas)
3. ValidateMediaUseCase (valida e processa mídias)

Requisitos:
- Cada caso de uso deve implementar IUseCase<TInput, TOutput>
- Use dependency injection via construtor
- Retorne Result<T, DomainError>
- Implemente testes unitários
```

#### **Prompt 4: Portas (Interfaces) de Serviços**
**Objetivo**: Definir contratos para serviços externos
```markdown
Crie as interfaces (ports) para serviços externos:
1. IMessageBroker (RabbitMQ)
2. ICache (Redis)
3. IMediaStorage (armazenamento de mídia)
4. IGroupRepository (PostgreSQL)
5. ILogger (sistema de logs)

Requisitos:
- Interfaces devem ser agnósticas à implementação
- Documente o contrato com JSDoc
- Defina tipos de retorno e exceções esperadas
```

---

### FASE 3: INFRAESTRUTURA - ADAPTERS DE ENTRADA

#### **Prompt 5: Telegram Inbound Adapter**
**Objetivo**: Implementar entrada do Telegram
```markdown
Implemente o Telegram Inbound Adapter:
1. Usar Telegraf/MTProto
2. Mapear mensagens do Telegram para StandardMessage
3. Implementar download de mídias usando Streams
4. Emitir eventos MessageReceivedEvent

Requisitos:
- Use Node.js Streams para mídias
- Implemente circuit breaker
- Trate diferentes tipos de mensagem (texto, imagem, documento)
- Adicione métricas de performance
```

#### **Prompt 6: WhatsApp Inbound Adapter**
**Objetivo**: Implementar entrada do WhatsApp
```markdown
Implemente o WhatsApp Inbound Adapter:
1. Usar Baileys/WebSockets
2. Mapear mensagens do WhatsApp para StandardMessage
3. Processar mídias com streaming
4. Implementar reconexão automática

Requisitos:
- Gerencie estado da conexão WebSocket
- Implemente rate limiting
- Trate diferentes tipos de mensagem do WhatsApp
- Adicione health checks
```

---

### FASE 4: INFRAESTRUTURA - ADAPTERS DE SAÍDA

#### **Prompt 7: Telegram Outbound Adapter**
**Objetivo**: Implementar saída para Telegram
```markdown
Implemente o Telegram Outbound Adapter:
1. Consumir eventos do broker
2. Enviar mensagens para o Telegram
3. Upload de mídias com streaming
4. Implementar retry com exponential backoff

Requisitos:
- Use pipe() para streaming de mídias
- Implemente DLQ (Dead Letter Queue)
- Trate limites da API do Telegram
- Adicione métricas de entrega
```

#### **Prompt 8: WhatsApp Outbound Adapter**
**Objetivo**: Implementar saída para WhatsApp
```markdown
Implemente o WhatsApp Outbound Adapter:
1. Consumir eventos do broker
2. Enviar mensagens para o WhatsApp
3. Upload de mídias otimizado
4. Gerenciar múltiplas sessões

Requisitos:
- Implemente reconnection strategy
- Trate diferentes tipos de chat (grupo, individual)
- Adicione compression para mídias grandes
- Implemente circuit breaker
```

---

### FASE 5: INFRAESTRUTURA - SERVIÇOS

#### **Prompt 9: Message Broker (RabbitMQ)**
**Objetivo**: Implementar broker de mensagens
```markdown
Implemente o Message Broker com RabbitMQ:
1. EventPublisher (publica eventos)
2. EventSubscriber (consome eventos)
3. Implemente Exchange/Fila/DLX
4. Configure políticas de retry

Requisitos:
- Use amqplib com TypeScript
- Implemente persistent messages
- Configure TTL para mensagens
- Adicione métricas de fila
```

#### **Prompt 10: Cache e Lock (Redis)**
**Objetivo**: Implementar cache e sistema de lock
```markdown
Implemente o sistema de cache e lock com Redis:
1. Cache para deduplicação de mensagens
2. Distributed lock para prevenção de loops
3. Rate limiting por grupo/usuário
4. Session management para WhatsApp

Requisitos:
- Use ioredis com TypeScript
- Implemente atomic operations
- Configure TTL automático
- Adicione fallback para falhas
```

---

### FASE 6: PERSISTÊNCIA

#### **Prompt 11: PostgreSQL Repository**
**Objetivo**: Implementar repositório PostgreSQL
```markdown
Implemente o repositório PostgreSQL:
1. GroupMappingRepository
2. MessageLogRepository
3. UserRepository
4. Use migrations com TypeORM/Prisma

Requisitos:
- Implemente Unit of Work pattern
- Use connection pooling
- Adicente índices otimizados
- Implemente queries eficientes
```

---

### FASE 7: WORKERS E ORQUESTRAÇÃO

#### **Prompt 12: Message Processing Workers**
**Objetivo**: Implementar workers que consomem do broker
```markdown
Implemente os workers de processamento:
1. MessageRouterWorker (rota mensagens entre plataformas)
2. MediaProcessorWorker (processa mídias)
3. RetryWorker (processa retentativas)

Requisitos:
- Implemente consumer groups
- Use graceful shutdown
- Adicione health checks
- Implemente load balancing
```

---

### FASE 8: API E CLI

#### **Prompt 13: Management API**
**Objetivo**: Implementar API de gestão
```markdown
Implemente a API REST de gestão:
1. CRUD de Group Mappings
2. Health check endpoints
3. Métricas e status
4. Logs e auditoria

Requisitos:
- Use Fastify com TypeScript
- Implemente autenticação JWT
- Adicione OpenAPI/Swagger
- Implemente rate limiting
```

#### **Prompt 14: CLI Tools**
**Objetivo**: Implementar ferramentas CLI
```markdown
Implemente ferramentas CLI:
1. Inicialização do sistema
2. Migrations do banco
3. Monitoramento e debugging
4. Backup e restore

Requisitos:
- Use commander.js
- Implemente comandos interativos
- Adicione logging colorido
- Crie scripts de utilidade
```

---

### FASE 9: INFRAESTRUTURA DEVOPS

#### **Prompt 15: Docker e Kubernetes**
**Objetivo**: Configurar containers e orquestração
```markdown
Crie configurações Docker e Kubernetes:
1. Dockerfile otimizado multi-stage
2. Docker Compose para desenvolvimento
3. Kubernetes manifests (Deployments, Services, Ingress)
4. ConfigMaps e Secrets

Requisitos:
- Use Node.js alpine images
- Configure health probes
- Implemente resource limits
- Configure autoscaling
```

#### **Prompt 16: Terraform IaC**
**Objetivo**: Implementar Infraestrutura como Código
```markdown
Crie scripts Terraform para a infraestrutura:
1. VPC e networking
2. ECS/Fargate ou EKS
3. RDS PostgreSQL
4. Elasticache Redis
5. S3 para mídias

Requisitos:
- Use modules reutilizáveis
- Configure variáveis de ambiente
- Implemente state remoto
- Adicione outputs úteis
```

---

### FASE 10: MONITORAMENTO E OBSERVABILIDADE

#### **Prompt 17: Métricas e Alertas**
**Objetivo**: Implementar sistema de métricas
```markdown
Implemente sistema de métricas:
1. Prometheus exporters
2. Grafana dashboards
3. Alertas (latência, erro rate, disponibilidade)
4. Distributed tracing

Requisitos:
- Use OpenTelemetry
- Configure alertas no Prometheus
- Crie dashboards por componente
- Implemente log aggregation
```

#### **Prompt 18: CI/CD Pipeline**
**Objetivo**: Configurar pipeline de entrega contínua
```markdown
Crie pipelines CI/CD com GitHub Actions:
1. Linting e type checking
2. Testes unitários e de integração
3. Build e push de containers
4. Deployment automático
5. Rollback automático

Requisitos:
- Use matriz de testes
- Implemente cache de dependências
- Configure approval para produção
- Adicione security scanning
```

---

### FASE 11: DOCUMENTAÇÃO E QUALIDADE

#### **Prompt 19: Testes e Qualidade**
**Objetivo**: Implementar testes abrangentes
```markdown
Crie suíte de testes completa:
1. Testes unitários para Core e Application
2. Testes de integração para Infrastructure
3. Testes E2E para fluxos completos
4. Load testing e stress testing

Requisitos:
- Use Jest com TypeScript
- Implemente fixtures e factories
- Use mocks para dependências externas
- Configure cobertura de código
```

#### **Prompt 20: Documentação Técnica**
**Objetivo**: Criar documentação completa
```markdown
Crie documentação técnica:
1. Arquitetura de decisões (ADR)
2. Guia de desenvolvimento
3. API documentation
4. Troubleshooting guide
5. Runbook de operação

Requisitos:
- Use Markdown com exemplos
- Inclua diagramas de sequência
- Documente cenários de erro
- Crie playbooks de recuperação
```

---

## 🎯 Protocolo de Comunicação entre Prompts

### Contratos de Interface (Arquivos de Spec):
```typescript
// Exemplo: message-broker.contract.ts
export interface IMessageBroker {
  publish(event: DomainEvent): Promise<Result<void>>;
  subscribe(
    eventType: string, 
    handler: EventHandler
  ): Promise<Result<void>>;
}

// Compartilhe este arquivo entre prompts 9, 12, etc.
```

### Regras de Comunicação:
1. **Versionamento**: Cada interface tem versão semântica
2. **Backward Compatibility**: Novos métodos são opcionais
3. **Documentação**: Cada contrato tem JSDoc completo
4. **Testes de Contrato**: Testes validam implementações

---

## 🔄 Fluxo de Validação entre Prompts

### Para cada prompt concluído:
```typescript
// 1. Verificar conformidade com contratos existentes
// 2. Executar testes de integração
// 3. Validar métricas de qualidade
// 4. Atualizar documentação de dependências
```

### Checklist de Validação Cruzada:
- [ ] Interfaces compatíveis
- [ ] Tipos compartilhados consistentes
- [ ] Tratamento de erros uniforme
- [ ] Performance dentro dos limites
- [ ] Observabilidade configurada

---

## 📈 Cronograma Sugerido

### Semana 1-2: Fase 1-2 (Domínio e Aplicação)
- Prompts 1-4: Fundação sólida do domínio

### Semana 3-4: Fase 3-4 (Adapters)
- Prompts 5-8: Integrações com plataformas

### Semana 5: Fase 5-6 (Serviços e Persistência)
- Prompts 9-11: Infraestrutura básica

### Semana 6: Fase 7-8 (Workers e API)
- Prompts 12-14: Camada de apresentação

### Semana 7: Fase 9-10 (DevOps)
- Prompts 15-18: Infraestrutura de produção

### Semana 8: Fase 11 (Qualidade)
- Prompts 19-20: Testes e documentação

---

## 🛡️ Garantia de Consistência

### Táticas de Sincronização:
1. **Interface Registry**: Registro central de contratos
2. **Dependency Graph**: Mapa de dependências entre módulos
3. **Integration Tests**: Testes que validam comunicação
4. **Schema Validation**: Validação de tipos em runtime

### Ferramentas Recomendadas:
- **TypeScript Path Alias**: Para imports absolutos
- **Jest Global Setup**: Para ambiente de testes
- **Husky Git Hooks**: Para validação pré-commit
- **Dependabot**: Para atualização de dependências

---

## 📊 Métricas de Progresso

### Por Prompt Concluído:
- ✅ Cobertura de testes > 90%
- ✅ Complexidade ciclomática < 10
- ✅ Dependências injetadas corretamente
- ✅ Documentação de interfaces

### Por Fase Concluída:
- ✅ Integração entre módulos funcionando
- ✅ Performance dentro dos limites
- ✅ Observabilidade implementada
- ✅ Deployment pipeline funcional

---

## 🚨 Protocolo de Resolução de Conflitos

### Quando interfaces precisarem mudar:
1. **Criar nova versão** da interface (v2)
2. **Manter backward compatibility** quando possível
3. **Atualizar todos os consumidores** simultaneamente
4. **Depreciar versão antiga** após transição

### Exemplo de migração:
```typescript
// interface v1.0.0
interface IMessageBroker {
  publish(event: any): Promise<void>;
}

// interface v2.0.0 (com backward compat)
interface IMessageBroker {
  publish(event: DomainEvent): Promise<Result<void>>;
  publishLegacy?(event: any): Promise<void>; // deprecated
}
```
