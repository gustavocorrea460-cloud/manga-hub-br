# Descoberta: Token GitHub embutido na URL do remote (vazamento)

**Data:** 2026-06-01
**Sessão:** 21
**Tipo:** Segurança / Lição aprendida

## Problema

O remote `origin` do git estava configurado com token embutido na URL:
```
https://gustavocorrea460-cloud:ghp_XXXX@github.com/gustavocorrea460-cloud/manga-hub-br.git
```

**Consequências:**
1. Token exposto para qualquer pessoa que veja `git remote -v` (ou o histórico do shell)
2. Push falha silenciosamente quando o token expira ("Invalid username or token")
3. Token vazado não pode ser "desembutido" — precisa ser REVOGADO no GitHub

## Solução (aplicada)

1. **Autenticação segura**: `gh auth login` (device flow) → `gh auth setup-git`
   - O gh CLI vira o credential helper padrão (token `gho_*` guardado em `~/.config/gh/hosts.yml`)
2. **Remote limpo**: `git remote set-url origin https://github.com/<user>/<repo>.git`
3. **Pendência (ação do usuário)**: revogar o token antigo `ghp_*` no GitHub → Settings → Developer settings → Personal access tokens

## Gotchas

- ⚠️ **Nunca** configurar remote com credenciais na URL — usar `gh auth` ou SSH (`git remote set-url origin git@github.com:user/repo.git`)
- ⚠️ Se um push falhar com "Invalid username or token", o problema NUNCA é a senha — é token expirado/inválido (GitHub descontinuou auth por senha)
- ⚠️ Verifique o remote periodicamente: `git remote -v` (se aparecer `ghp_` ou `gho_` na URL → problema)

## Referências

- `gh auth setup-git` — docs: https://cli.github.com/manual/gh_auth_setup-git
- Revogação de tokens: https://github.com/settings/tokens
