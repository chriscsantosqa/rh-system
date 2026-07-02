# Guia simples para executar o Sistema RH

Este guia foi escrito para usuario nao tecnico executar o sistema localmente no Windows.

## 1. O que precisa estar instalado

Antes de abrir o sistema, o computador precisa ter:

- **Node.js LTS**, preferencialmente versao 20 ou superior.
- **Google Chrome**, Microsoft Edge ou outro navegador atual.
- Internet apenas na primeira execucao, para baixar as dependencias do projeto.

Para instalar o Node.js:

1. Acesse o site oficial do Node.js.
2. Baixe a versao **LTS**.
3. Execute o instalador.
4. Avance ate o final mantendo as opcoes padrao.
5. Feche e abra novamente qualquer janela de terminal, se estiver usando uma.

## 2. Como baixar o projeto pelo GitHub

1. Abra o repositorio no GitHub.
2. Clique no botao verde **Code**.
3. Clique em **Download ZIP**.
4. Extraia o arquivo ZIP em uma pasta simples, por exemplo:

```text
C:\Sistemas\rh-system
```

Nao execute o sistema direto de dentro do arquivo ZIP. A pasta precisa estar extraida.

## 3. Como abrir o sistema com dois cliques

1. Abra a pasta extraida do projeto.
2. Procure o arquivo:

```text
INICIAR_SISTEMA.bat
```

3. Dê dois cliques nesse arquivo.
4. Uma janela preta do Windows sera aberta.
5. Na primeira execucao, o sistema instala as dependencias. Isso pode levar alguns minutos.
6. Depois disso, o navegador sera aberto automaticamente em:

```text
http://localhost:3000
```

Enquanto essa janela preta estiver aberta, o sistema continua rodando.

## 4. Como parar o sistema

Na janela preta onde o sistema esta rodando:

1. Pressione `CTRL + C`.
2. Quando perguntar se deseja finalizar, digite `S`.
3. Pressione `Enter`.

Tambem funciona fechar a janela, mas o encerramento com `CTRL + C` e mais seguro.

## 5. Como abrir novamente depois da primeira vez

Depois que as dependencias ja foram instaladas, basta dar dois cliques novamente em:

```text
INICIAR_SISTEMA.bat
```

A abertura sera mais rapida, porque a pasta `node_modules` ja existira.

## 6. Login de demonstracao

Na tela de login, escolha um dos perfis disponiveis. O sistema usa autenticacao local de demonstracao, sem senha real.

Perfil recomendado para testar tudo:

```text
Administrador
```

Esse perfil possui acesso total aos cadastros, configuracoes, backup e auditoria.

## 7. Onde os dados ficam salvos

O banco local do sistema fica neste arquivo:

```text
database\db.json
```

Arquivos enviados no sistema ficam em:

```text
public\uploads
```

Para preservar dados reais, faca backup desses dois locais antes de apagar, mover ou substituir a pasta do projeto.

## 8. Problemas comuns

### Erro: Node.js nao encontrado

Instale o Node.js LTS e execute novamente o arquivo `INICIAR_SISTEMA.bat`.

### A janela fecha ou aparece erro na instalacao

Verifique se o computador esta com internet. Depois execute novamente o arquivo `INICIAR_SISTEMA.bat`.

Se continuar falhando:

1. Apague a pasta `node_modules`, se ela existir.
2. Execute novamente `INICIAR_SISTEMA.bat`.

### O navegador nao abriu sozinho

Abra manualmente no navegador:

```text
http://localhost:3000
```

### Porta 3000 em uso

Feche outras janelas de terminal ou sistemas Next.js abertos. Depois execute novamente `INICIAR_SISTEMA.bat`.

### O sistema nao salva dados

Confirme que o projeto foi extraido do ZIP para uma pasta normal. Nao execute o sistema dentro do arquivo ZIP.

## 9. Execucao manual para usuario tecnico

Tambem e possivel executar pelo terminal:

```bash
npm install
npm run dev:local
```

Depois abra:

```text
http://localhost:3000
```
