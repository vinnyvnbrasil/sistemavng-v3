# Login de Administrador - Sistema VNG v3

## Acesso de Demonstração

Para testar o sistema, foi implementado um login de administrador de demonstração que permite acesso completo a todas as funcionalidades.

### Credenciais de Admin

- **Email:** `admin@sistemavng.com`
- **Senha:** `admin123`

### Como Acessar

1. Acesse a aplicação em: `http://localhost:5173`
2. Na página de login, você verá um card azul com as informações de demonstração
3. Use as credenciais acima para fazer login
4. Você será redirecionado para o dashboard com acesso completo ao sistema

### Funcionalidades Disponíveis

Após o login, você terá acesso a:

- **Dashboard:** Visão geral do sistema
- **Empresas:** Gestão de empresas cadastradas
- **Integração Bling:** Configurações de integração com a API do Bling
- **Documentos:** Sistema de gerenciamento de documentos
- **Tickets:** Sistema de suporte e tickets
- **Pedidos:** Gestão e sincronização de pedidos
- **Perfil:** Configurações pessoais e preferências

### Observações

- Este é um login de demonstração criado especificamente para testes
- Não requer conexão com banco de dados real
- Todas as funcionalidades estão disponíveis para exploração
- O sistema mantém o estado de login durante a sessão

### Desenvolvimento

O login de demonstração está implementado no arquivo `src/contexts/AuthContext.tsx` e pode ser facilmente removido ou modificado quando o sistema for para produção.