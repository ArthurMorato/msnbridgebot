# Group Bridge Bot - Padrões Técnicos

## 📋 Visão Geral do Projeto

**Group Bridge Bot** é um middleware reativo de alta performance para sincronização bidirecional de mensagens e mídia entre Telegram e WhatsApp, baseado em **Arquitetura Hexagonal** e **Design Orientado a Eventos**.

---

## 🏗️ Princípios Arquiteturais

### 1. Arquitetura Hexagonal
- **Core (Domínio)**: Entidades, Value Objects e regras de negócio puros
- **Application**: Casos de uso e portas (interfaces)
- **Infrastructure**: Implementações concretas (adapters, repositórios)

### 2. Princípios SOLID
- Single Responsibility: Uma classe, uma responsabilidade
- Open/Closed: Aberto para extensão, fechado para modificação
- Liskov Substitution: Substituibilidade de tipos
- Interface Segregation: Interfaces específicas
- Dependency Inversion: Dependa de abstrações

### 3. Desacoplamento Total
- Domínio agnóstico a protocolos
- Inbound/Outbound Adapters para integrações
- Eventos normalizados via `StandardMessage`

---

## 📁 Estrutura de Diretórios Padrão

```text
src/
├── core/
│   ├── domain/
│   │   ├── entities/          # Entidades de domínio
│   │   ├── value-objects/     # Value Objects
│   │   ├── errors/           # Erros específicos do domínio
│   │   └── repository.ts     # Interfaces de repositório
│   └── events/               # Eventos de domínio
│
├── application/
│   ├── use-cases/            # Casos de uso
│   ├── ports/                # Interfaces (Ports)
│   └── services/             # Serviços de aplicação
│
├── infrastructure/
│   ├── adapters/
│   │   ├── inbound/          # Telegram, WhatsApp (entrada)
│   │   └── outbound/         # Telegram, WhatsApp (saída)
│   ├── messaging/            # RabbitMQ, Event Bus
│   ├── persistence/          # PostgreSQL, Redis
│   └── shared/               # Utilitários compartilhados
│
└── presentation/
    ├── workers/              # Consumers do broker
    ├── api/                  # API de gestão
    └── cli/                  # Comandos CLI

infra/
├── terraform/               # IaC
├── docker/                  # Dockerfiles
├── kubernetes/              # Manifests K8s
└── monitoring/              # Prometheus, Grafana
```

---

## 🎨 Padrões de Codificação

### 1. Nomenclatura

| Elemento | Padrão | Exemplo |
|----------|---------|----------|
| Arquivos/Pastas | kebab-case | `telegram-adapter.ts` |
| Classes/Interfaces | PascalCase | `StandardMessage` |
| Métodos/Variáveis | camelCase | `execute()`, `isValid` |
| Constantes/Enums | UPPER_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |
| Booleanos | Verbo + Estado | `hasMedia`, `canProcess` |
| Interfaces | I + PascalCase | `IMessageBroker` |
| Tipos/Genéricos | T + PascalCase | `TMessage`, `TResult` |

### 2. Estrutura e Escopo

#### Princípios Essenciais:
- **Single Responsibility**: Máximo 20 linhas por método
- **Imutabilidade**: Preferir `readonly` e `const`
- **Encapsulamento**: Privatize tudo que não for API pública
- **Dependency Injection**: Injetar dependências via construtor

#### TypeScript Strict:
```typescript
// ❌ PROIBIDO
const data: any = await response.json();

// ✅ OBRIGATÓRIO
const data: ApiResponse = await response.json();
```

### 3. Value Objects
Dados com regras de validação devem ser Value Objects:

```typescript
// ✅ CORRETO - Value Object
export class MessageId {
  private constructor(private readonly value: string) {}
  
  static create(id: string): Result<MessageId> {
    if (!isValidUuid(id)) {
      return Result.fail(new InvalidMessageIdError(id));
    }
    return Result.ok(new MessageId(id));
  }
  
  getValue(): string {
    return this.value;
  }
}
```

### 4. Documentação e Comentários

#### Filosofia Clean Code:
- **Código > Comentários**: O código deve ser autoexplicativo
- **Comente o "Porquê"**: Nunca o "O quê"
- **JSDoc apenas em interfaces públicas**

```typescript
// ❌ REDUNDANTE
// Salva a mensagem no banco de dados
await repository.save(message);

// ✅ INFORMATIVO
// Usamos Redis para atomicidade no lock e prevenir loops
// devido à natureza eventualmente consistente do broker
await this.cache.setWithLock(key, value, ttl);
```

### 5. Tratamento de Erros

#### Erros Tipados:
```typescript
// core/domain/errors/
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class MessageProcessingError extends DomainError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'MESSAGE_PROCESSING_ERROR', metadata);
  }
}
```

#### Pattern Result:
```typescript
export type Result<T, E = DomainError> = 
  | { success: true; value: T }
  | { success: false; error: E };
```

---

## 🤖 Protocolo de Geração via IA

### Regras de Conduta:

1. **Fidelidade ao Escopo**: Não adicionar funcionalidades não solicitadas
2. **Consistência Arquitetural**: Respeitar as camadas (Core → Application → Infrastructure)
3. **Abordagem Defensiva**: Perguntar antes de alterar assinaturas existentes
4. **Validação de Dependências**: Verificar compatibilidade antes de sugerir novas libs

### Fluxo de Validação:
```
1. Entender requisito → 2. Verificar arquitetura → 
3. Validar contra padrões → 4. Gerar código alinhado
```

---

## 📝 Exemplos de Implementação

### Caso de Uso Padrão:
```typescript
// application/use-cases/process-message.use-case.ts
export class ProcessMessageUseCase implements IUseCase<StandardMessage, Result<void>> {
  constructor(
    private readonly messageBroker: IMessageBroker,
    private readonly cache: ICache,
    private readonly logger: ILogger
  ) {}

  async execute(message: StandardMessage): Promise<Result<void>> {
    try {
      const messageId = MessageId.create(message.originId);
      
      if (messageId.isFailure) {
        return Result.fail(messageId.error);
      }

      const isDuplicate = await this.cache.has(messageId.value.getValue());
      
      if (isDuplicate) {
        this.logger.warn('Message already processed', { id: message.originId });
        return Result.fail(new LoopPreventionError(message.originId));
      }

      await this.messageBroker.publish(message);
      await this.cache.set(messageId.value.getValue(), true, { ttl: 300 });

      return Result.ok();
    } catch (error) {
      this.logger.error('Failed to process message', { error, message });
      return Result.fail(new MessageProcessingError('Failed to process message'));
    }
  }
}
```

### Adapter de Entrada:
```typescript
// infrastructure/adapters/inbound/telegram-adapter.ts
export class TelegramAdapter implements IInboundAdapter {
  constructor(
    private readonly bot: Telegraf,
    private readonly eventEmitter: IEventEmitter,
    private readonly logger: ILogger
  ) {}

  async initialize(): Promise<void> {
    this.bot.on('message', this.handleMessage.bind(this));
    await this.bot.launch();
    this.logger.info('Telegram adapter initialized');
  }

  private async handleMessage(ctx: Context): Promise<void> {
    const standardMessage = this.mapToStandardMessage(ctx.message);
    await this.eventEmitter.emit('message.received', standardMessage);
  }

  private mapToStandardMessage(message: Message): StandardMessage {
    return StandardMessage.create({
      originId: message.message_id.toString(),
      platform: 'telegram',
      content: message.text,
      sender: message.from?.id.toString(),
      timestamp: new Date(message.date * 1000),
      metadata: {
        chatId: message.chat.id,
        messageType: this.getMessageType(message)
      }
    });
  }
}
```

---

## ✅ Checklist de Revisão (Definition of Done)

### Estrutura e Organização
- [ ] Segue a estrutura de pastas definida
- [ ] Respeita os limites das camadas arquiteturais
- [ ] Nenhuma importação cruzada entre camadas

### Nomenclatura
- [ ] Nomes descritivos e autoexplicativos
- [ ] Convenções de nomenclatura aplicadas corretamente
- [ ] Booleanos começam com verbo de estado

### Tipagem e Qualidade
- [ ] 100% tipado sem uso de `any`
- [ ] Tratamento de erros específico e tipado
- [ ] Validações encapsuladas em Value Objects
- [ ] Imutabilidade aplicada onde possível

### Documentação
- [ ] Comentários apenas para explicar "porquê"
- [ ] JSDoc apenas em interfaces públicas
- [ ] Nenhum comentário redundante

### Performance e Resiliência
- [ ] Tratamento de falhas com circuit breaker
- [ ] Implementado exponential backoff onde aplicável
- [ ] Mecanismo de idempotência
- [ ] Prevenção de loops via Redis lock

### Testabilidade
- [ ] Dependências injetadas via construtor
- [ ] Interfaces em vez de implementações concretas
- [ ] Funções puras onde possível

---

## 🔧 Configurações Técnicas

### TypeScript Config (tsconfig.json):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### ESLint Config (.eslintrc.json):
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "complexity": ["warn", 10],
    "max-lines-per-function": ["warn", { "max": 30 }]
  }
}
```

---

## 📊 Métricas de Qualidade

### Alvos de Cobertura:
- **Testes Unitários**: ≥ 90% (Core e Application)
- **Complexidade Ciclomática**: ≤ 10 por função
- **Linhas por Função**: ≤ 30
- **Débito Técnico**: Mantido abaixo de 5%

### Ferramentas de Qualidade:
```bash
# Linting
npm run lint

# Type Checking
npm run type-check

# Test Coverage
npm run test:coverage

# Complexity Analysis
npm run complexity
```

---

## 🚀 Git Workflow

### Convenções de Commit:
```
feat: Nova funcionalidade
fix: Correção de bug
docs: Documentação
style: Formatação (não afeta código)
refactor: Refatoração
test: Testes
chore: Manutenção
```

### Branch Strategy:
```
main (protected)
├── develop
│   ├── feat/feature-name
│   ├── fix/bug-description
│   └── refactor/component-name
└── release/v1.0.0
```
