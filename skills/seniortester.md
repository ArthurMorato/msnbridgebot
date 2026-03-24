# Skill: Testador Sênior de Softwares (Node.js + TypeScript)

## Descrição
Capacita o agente a planejar, implementar e executar testes automatizados em aplicações Node.js com TypeScript, seguindo as melhores práticas de qualidade de software, cobertura de testes e integração contínua.

---

## 1. Configuração do Ambiente

### Pré-requisitos
- Node.js (versão LTS recomendada)
- npm ou yarn
- TypeScript
- Git

### Dependências Essenciais
```bash
npm install --save-dev jest @types/jest ts-jest @types/node typescript eslint prettier

Configuração Inicial

Criar arquivo tsconfig.json para TypeScript
Configurar jest.config.js para suporte a TypeScript
Adicionar scripts no package.json:
json
Copiar

"scripts": {
  "test": "jest",
  "test\:watch": "jest --watch",
  "test\:coverage": "jest --coverage"
}



2. Tipos de Testes
2.1. Testes Unitários

Foco: Funções e módulos isolados
Ferramentas: Jest, Mocha, Chai
Exemplo:
typescript
Copiar

// soma.ts
export function soma(a: number, b: number): number {
  return a + b;
}

// soma.test.ts
import { soma } from './soma';
test('Deve somar dois números', () => {
  expect(soma(2, 3)).toBe(5);
});


2.2. Testes de Integração

Foco: Interação entre módulos e serviços externos
Ferramentas: Jest, Supertest (para APIs)
Exemplo:
typescript
Copiar

// api.test.ts
import request from 'supertest';
import app from './app';
describe('GET /api/usuarios', () => {
  it('Deve retornar lista de usuários', async () => {
    const res = await request(app).get('/api/usuarios');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });
});


2.3. Testes E2E

Foco: Fluxo completo da aplicação
Ferramentas: Cypress, Playwright, Puppeteer
Exemplo:
typescript
Copiar

// cypress/integration/usuario.spec.ts
describe('Cadastro de Usuário', () => {
  it('Deve cadastrar um novo usuário', () => {
    cy.visit('/cadastro');
    cy.get('#nome').type('Arthur Silva');
    cy.get('#email').type('arthur@example.com');
    cy.get('button[type="submit"]').click();
    cy.contains('Usuário cadastrado com sucesso!');
  });
});



3. Boas Práticas
3.1. Organização de Testes

Padrão de Pastas:
Copiar

/src
  /modules
    /usuario
      usuario.service.ts
      usuario.service.test.ts


Nomenclatura: Arquivos de teste devem terminar com .test.ts ou .spec.ts
3.2. Cobertura de Testes

Meta: 80%+ de cobertura
Ferramenta: Istanbul (integrado ao Jest)
Comando:
bash
Copiar

npm run test\:coverage


3.3. Mocks e Stubs

Ferramenta: Jest Mock Functions
Exemplo:
typescript
Copiar

jest.mock('./api', () => ({
  buscarUsuario: jest.fn().mockResolvedValue({ id: 1, nome: 'Arthur' })
}));



4. Integração Contínua (CI)

Ferramentas: GitHub Actions, GitLab CI, CircleCI
Exemplo de Workflow:
yaml
Copiar

# .github/workflows/test.yml
name: Testes
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test



5. Ferramentas Avançadas

Testes de Performance: k6, Artillery
Testes de Segurança: OWASP ZAP, Snyk
Testes de Contrato: Pact

6. Checklist para Revisão

 Todos os módulos possuem testes unitários
 APIs possuem testes de integração
 Fluxos críticos possuem testes E2E
 Cobertura de testes >= 80%
 Testes rodam em ambiente de CI
 Mocks estão realistas e documentados
