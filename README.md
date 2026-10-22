# WKORA NOTIFY — V1

Aplicação web PWA com Web Push, API server-side, Supabase e agendamento por Vercel Cron. O envio manual está implementado no painel; o processamento automático lê `scheduled_notifications` a cada cinco minutos. Para automatizações baseadas em eventos, conecte a API do evento do seu sistema à criação de registros nessa tabela, com autenticação e validação próprias.

## Requisitos
- Conta GitHub
- Conta Vercel
- Projeto Supabase
- Navegador com Web Push e HTTPS

## 1. Criar o banco
1. No Supabase, crie um projeto.
2. Abra SQL Editor.
3. Cole e execute `sql/schema.sql`.
4. Em Project Settings > API, copie Project URL e `service_role` key. A chave service role é secreta e só pode existir no servidor.

## 2. Gerar chaves Web Push
No computador com Node.js, ou em ambiente online que permita terminal:
```bash
npx web-push generate-vapid-keys
```
Copie a public key para `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e a private key para `VAPID_PRIVATE_KEY`. Defina `VAPID_SUBJECT` como um endereço de contato válido, por exemplo `mailto:seu-email@dominio.com`.

## 3. Publicar pelo celular
1. Baixe e extraia o ZIP.
2. No GitHub, crie um repositório chamado `wkora-notify`.
3. Envie os arquivos e pastas mantendo a estrutura. Se o site móvel não permitir enviar pastas, use a opção de upload de arquivos do navegador em modo desktop ou envie os arquivos em lotes.
4. Na Vercel, importe o repositório e faça Deploy.
5. Em Project > Settings > Environment Variables, cadastre todas as variáveis de `.env.example`, preenchendo os valores reais. Não envie `.env` ao GitHub.
6. Faça Redeploy após cadastrar as variáveis.
7. No plano Vercel, confirme se Cron Jobs está disponível para seu projeto. A frequência configurada é a cada 5 minutos; limites de cron podem variar por plano. Se não estiver disponível, configure um agendador externo para chamar `GET https://SEU-DOMINIO/api/cron` com `Authorization: Bearer SEU_CRON_SECRET`.

## 4. Testar push real
1. Abra o domínio HTTPS da Vercel no Chrome Android.
2. Toque em **Ativar notificações** e aceite a permissão.
3. Cadastre `ADMIN_API_KEY` na caixa do painel.
4. Preencha título e mensagem e toque em **Enviar para inscritos**.
5. O navegador deve exibir a notificação. Teste também com o site em segundo plano.
6. Para testar agendamento, insira uma linha na tabela `scheduled_notifications` via Supabase SQL Editor, com `send_at` no passado e status `pending`. Aguarde o Cron ou chame a rota manualmente com o cabeçalho de autorização.

Exemplo SQL para agendar um aviso de teste (substitua data/hora por ISO futuro):
```sql
insert into public.scheduled_notifications (title, body, send_at)
values ('Teste agendado', 'Este aviso foi processado pelo agendador.', now() + interval '2 minutes');
```
Para testar imediatamente, use `now() - interval '1 minute'`.

## 5. Limitações e segurança
- Não é possível enviar push para quem não se inscreveu e não concedeu permissão.
- Alguns navegadores limitam push quando o dispositivo está em economia de bateria, sem rede ou com notificações do sistema desativadas.
- A interface atual protege o painel com uma chave administrativa compartilhada; para uso público real, implemente autenticação individual, rate limiting, auditoria e rotação de segredos antes de abrir acesso a uma equipe.
- A rota de inscrição é pública e limitada a validações básicas; adicione proteção contra abuso e quotas antes de uma campanha em grande escala.
- O cron processa no máximo 10 agendamentos por execução. Revise concorrência, retries e idempotência antes de tráfego alto.
- Para alertas automáticos de um sistema externo, chame uma API autenticada que insira um registro em `scheduled_notifications`; não exponha a service role key no cliente.
- O suporte a notificações web no iOS exige versão compatível do iOS e, em geral, que o web app seja adicionado à tela inicial. Android Chrome em HTTPS é o primeiro alvo de teste.
- Esta versão ainda não foi implantada nem testada com credenciais reais. O envio só poderá ser validado depois de configurar Supabase, VAPID e Vercel.

## Estrutura
- `app/page.tsx` — interface responsiva
- `public/sw.js` — recebe e exibe notificações push
- `app/api/push/*` — chave pública e inscrição
- `app/api/admin/*` — envio manual e histórico
- `app/api/cron` — processamento automático de avisos agendados
- `sql/schema.sql` — tabelas do Supabase
