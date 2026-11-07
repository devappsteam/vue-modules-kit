# Vue Modules Kit

O Vue Modules Kit é uma ferramenta de linha de comando que cria módulos CRUD reutilizáveis para aplicações Vue 3. Ele oferece dois modos de apresentação e compartilha entre eles os mesmos tipos, store Pinia, serviço de API, listagem e modal de confirmação de exclusão.

## Recursos

- Geração de módulos com Vue 3 Composition API e TypeScript.
- Modo modal como padrão ou formulário de criação/edição em uma página dedicada.
- Criação automática de diretórios organizacionais aninhados.
- Convenções centralizadas de nomes no singular e plural: PascalCase, camelCase, kebab-case e snake_case.
- Geração segura: caminhos com tentativa de travessia são rejeitados e módulos existentes nunca são sobrescritos.
- Modelos dos modos modal e página incluídos no pacote do CLI.

## Requisitos

- Node.js 20 ou superior.
- pnpm na aplicação de destino.
- Uma aplicação Vue 3 com Pinia, Vue Router e os componentes compartilhados de API, notificações, paginação e modal esperados pelos arquivos gerados.

## Instalação

Instale diretamente do GitHub na aplicação Vue. O script `prepare` do pacote compila o CLI e inclui os modelos durante a instalação a partir do repositório:

```sh
pnpm add -D github:devappsteam/vue-modules-kit
```

Adicione o script abaixo ao `package.json` da aplicação:

```json
{
  "scripts": {
    "create:module": "vue-modules-kit create"
  }
}
```

## Uso

```sh
pnpm create:module Product
pnpm create:module Product --page
pnpm create:module Customer --modal

pnpm create:module RH/Employee
pnpm create:module RH/Employee --page

pnpm create:module Sales/Order
pnpm create:module Sales/OrderItem --page
pnpm create:module RH/Recruitment/Job
```

O diretório padrão de destino é `src/modules`. Em caminhos aninhados, todos os segmentos anteriores ao último são tratados como diretórios organizacionais e preservados como foram informados. Diretórios pais inexistentes são criados automaticamente; diretórios existentes são reutilizados.

### Opções

| Opção     | Descrição                                            |
| --------- | ---------------------------------------------------- |
| `--modal` | Gera o formulário em um modal (padrão).              |
| `--page`  | Gera o formulário de criação e edição em uma página. |

As opções `--modal` e `--page` não podem ser usadas juntas. Se nenhuma for informada, o CLI utiliza o modo modal.

## Estruturas geradas

### Modo modal

```text
src/modules/products/
├── router.ts
├── views/ProductsView.vue
├── types/products.types.ts
├── stores/products.store.ts
├── services/products.service.ts
└── components/
    ├── ProductsDeleteModal.vue
    ├── ProductsFormModal.vue
    └── ProductsList.vue
```

### Modo página

```text
src/modules/products/
├── router.ts
├── views/
│   ├── ProductsView.vue
│   └── ProductsFormView.vue
├── types/products.types.ts
├── stores/products.store.ts
├── services/products.service.ts
└── components/
    ├── ProductsDeleteModal.vue
    └── ProductsList.vue
```

No modo página, a listagem, o formulário de criação e o formulário de edição usam rotas distintas. A exclusão continua usando `ProductsDeleteModal.vue`, e os dois modos compartilham a mesma store, o mesmo serviço e os mesmos tipos.

## Convenções de nomes

Somente o último segmento do caminho é usado como nome do módulo. Os nomes dos diretórios organizacionais permanecem inalterados.

| Entrada       | Diretório do módulo | PascalCase     | camelCase      | snake_case      |
| ------------- | ------------------- | -------------- | -------------- | --------------- |
| `Product`     | `products`          | `Products`     | `products`     | `products`      |
| `Customer`    | `customers`         | `Customers`    | `customers`    | `customers`     |
| `SalesOrder`  | `sales-orders`      | `SalesOrders`  | `salesOrders`  | `sales_orders`  |
| `UserProfile` | `user-profiles`     | `UserProfiles` | `userProfiles` | `user_profiles` |
| `OrderItem`   | `order-items`       | `OrderItems`   | `orderItems`   | `order_items`   |

Por exemplo, `RH/Employee` gera `src/modules/RH/employees`. O nome `RH` não é pluralizado nem incluído nos identificadores do módulo.

## Modelo CRUD inicial

Os módulos gerados usam uma entidade inicial genérica com os campos `uuid`, `name`, `description`, `is_active` e timestamps. Os formulários de criação e edição, a listagem com busca e paginação, a indicação de status e a confirmação de exclusão são pontos de partida funcionais que podem ser estendidos com os campos específicos do domínio.

O serviço de API usa endpoints REST baseados no nome do módulo em kebab-case (por exemplo, `/products`, `/products/{uuid}` e `/products/all`). Os arquivos esperam encontrar utilitários compartilhados na aplicação em `@/services/api.service`, `@/types/api.types` e `@/composables/useToast`. O modal e a listagem também utilizam `@/components/ui/BaseModal.vue` e o componente global `Pagination`. Ajuste esses imports caso a aplicação use outros utilitários compartilhados.

Registre o array de rotas exportado pelo `router.ts` gerado no Vue Router da aplicação.

Todos os modelos estão incluídos no pacote. Portanto, a geração não depende de outro repositório ou de arquivos de referência disponíveis em tempo de execução.

## Configuração

O diretório padrão dos módulos é `src/modules`, e o modo padrão é `modal`. Um arquivo como o exemplo abaixo está previsto como ponto de extensão futuro; o carregamento de configuração ainda não foi implementado:

```ts
export default {
  modulesDirectory: 'src/modules',
  defaultMode: 'modal',
}
```

## Desenvolvimento local

```sh
corepack pnpm install
corepack pnpm build
corepack pnpm test
corepack pnpm lint
corepack pnpm format:check
```

Para testar o CLI compilado neste pacote:

```sh
corepack pnpm create:module Product --page
```

O comando cria o módulo em `src/modules`, relativo ao diretório de trabalho atual. Os arquivos gerados estão ignorados pelo Git.

As mensagens, a ajuda e os erros do CLI são exibidos em português.

## Testes

O Vitest usa diretórios temporários para testar as convenções de nomes, a geração nos modos modal e página, caminhos aninhados, substituição de marcadores, prevenção de sobrescrita, rejeição de travessia de diretórios e proteção contra escape por links simbólicos. Os testes do CLI também verificam argumentos posicionais, opções padrão e conflitos entre modos.

## Contribuição

1. Instale as dependências com `corepack pnpm install`.
2. Faça as alterações no código TypeScript e/ou nos modelos incluídos no pacote.
3. Execute `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint` e `corepack pnpm format:check`.
4. Mantenha os modelos gerados e a documentação alinhados com o comportamento do CLI.

## Licença

MIT
