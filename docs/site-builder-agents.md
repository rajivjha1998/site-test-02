# Site builder: agents and HIL setup sheet

Everything needed to wire BBPlatform workflows to customer site repos. No BBPlatform backend changes: only API agents, HIL steps and the GitHub Actions already in this template.

Values used below:
- **Owner:** `rajivjha1998` (the GitHub account that holds `site-template`; later, the org name).
- `{repo}`: the customer's repo name, typed in the "New Project" HIL step, e.g. `site-acme-robotics` (lowercase, dashes, starts with `site-`).
- `{request_id}`: any unique value per run, e.g. the workflow run or task id.

**Two platform rules:** a step fails on any 4xx answer (e.g. 404), and also when a 200 answer contains an `errors` section. So there's **no separate name check**: Repository Creator does it (422 "name already exists" stops the run with a clear reason). "Is the new repo ready?" uses GraphQL (**Wait for Repo**), which answers 200 with no `errors` while the repo is still being filled.

---

## 1. One-time setup

1. Push this template to GitHub as `rajivjha1998/site-template` and tick **Settings → General → Template repository**.
2. In the template, set **Settings → Actions → General → Workflow permissions** to **Read and write permissions**.
3. Create a **fine-grained token** (GitHub → Settings → Developer settings → Fine-grained tokens):
   - Resource owner: `rajivjha1998`
   - Repository access: **All repositories**
   - Permissions: **Administration** read/write, **Contents** read/write, **Actions** read, **Metadata** read
4. In BBPlatform **API Auth**, save it as **Bearer**, base URL `https://api.github.com`. GraphQL uses the same token.
5. Every REST agent sends these headers (static values on the agent, not HIL fields):
   ```
   Accept: application/vnd.github+json
   X-GitHub-Api-Version: 2022-11-28
   ```

---

## 2. GitHub agents

### Repository Creator
`POST /repos/rajivjha1998/site-template/generate`
```json
{
  "owner": "rajivjha1998",
  "name": "{repo}",
  "description": "{brand_name} website",
  "private": true,
  "include_all_branches": false
}
```
- **201**: created. Keep `html_url`.
- **422**: the name is taken. This is the name check: the run stops with that reason and the user starts again with another name.
- **404**: the template isn't marked as a template, or the token can't see it.

### Wait for Repo *(GraphQL, always 200; do-until loop, max 10)*
`POST /graphql`
```json
{
  "query": "query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { ref(qualifiedName: \"refs/heads/main\") { target { oid } } } }",
  "variables": { "owner": "rajivjha1998", "name": "{repo}" }
}
```
- **Not ready yet:** `{"data":{"repository":{"ref":null}}}`, with no `errors` section, so the step passes and the loop continues. GitHub is still copying the template.
- **Ready:** `{"data":{"repository":{"ref":{"target":{"oid":"aa218f56..."}}}}}`. Keep the `oid`: it's the sha of `main`.

### Create Draft Branch
`POST /repos/rajivjha1998/{repo}/git/refs`
```json
{ "ref": "refs/heads/draft", "sha": "{oid from Wait for Repo}" }
```
- **201**: created. **422**: it already exists, which is fine.

### Send Settings
`POST /repos/rajivjha1998/{repo}/dispatches`
```json
{
  "event_type": "update-settings",
  "client_payload": {
    "request_id": "{request_id}",
    "settings": {
      "brand_name": "{brand_name}",
      "brand_tagline": "{brand_tagline}",
      "brand_description": "{brand_description}",
      "color_primary": "{color_primary}",
      "color_secondary": "{color_secondary}",
      "color_tertiary": "{color_tertiary}",
      "hero_title": "{hero_title}",
      "hero_title_accent": "{hero_title_accent}",
      "hero_lede": "{hero_lede}",
      "button1_label": "{button1_label}",
      "button1_link": "{button1_link}",
      "button2_label": "{button2_label}",
      "button2_link": "{button2_link}"
    }
  }
}
```
- **204**: accepted (no body). The `Update site settings` Action then applies the answers, validates, builds and commits `site.json` to `draft`.
- Send only the fields a step collects. Empty values mean "leave as is". Unknown keys are ignored and listed in the run log.

### Build Watcher *(do-until loop, max 30)*
`GET /repos/rajivjha1998/{repo}/actions/runs?event=repository_dispatch&per_page=1`
- GitHub lists the newest run first, so check `workflow_runs[0]`.
- Loop until `workflow_runs[0].display_title` is `update-settings {request_id}` **and** `workflow_runs[0].status` is `completed`.
- Success when `conclusion` is `success`. If it's `failure`, nothing was committed, and the run's `html_url` shows which field is wrong.
- `head_branch` always shows `main` for these runs (GitHub runs them from the default branch); the commit still goes to `draft`.

### Settings Reader *(pre-fills HIL forms when editing)*
`GET /repos/rajivjha1998/{repo}/contents/site.json?ref=draft`
with header `Accept: application/vnd.github.raw+json`. This returns plain JSON, not base64.

| HIL field | Read from |
|---|---|
| brand_name / brand_tagline / brand_description | `brand.name` / `brand.tagline` / `brand.description` |
| color_primary / color_secondary / color_tertiary | `theme.primary` / `theme.secondary` / `theme.tertiary` |
| hero_title / hero_title_accent / hero_lede | `pages["/"].sections[0].title` / `.titleAccent` / `.lede` |
| button1_label / button1_link | `pages["/"].sections[0].ctas[0].label` / `.href` |
| button2_label / button2_link | `pages["/"].sections[0].ctas[1].label` / `.href` |

### Publisher *(publishes draft to live)*
`POST /repos/rajivjha1998/{repo}/merges`
```json
{ "base": "main", "head": "draft", "commit_message": "Publish ({request_id})" }
```
- **201**: published. **204**: nothing new to publish. **409**: conflict (someone edited `main` directly).

### Discard Draft *(optional)*
1. **Get Branch SHA:** `GET /repos/rajivjha1998/{repo}/git/ref/heads/main`, then read `object.sha`. This REST call is fine here because the repo already exists.
2. `PATCH /repos/rajivjha1998/{repo}/git/refs/heads/draft` with `{ "sha": "<main sha>", "force": true }`.

### Version History *(Undo)*
1. **List Versions:** `GET /repos/rajivjha1998/{repo}/commits?sha=main&path=site.json&per_page=20`. Show `commit.message` and `commit.committer.date`; keep `sha`.
2. **Restore Version:** `POST /repos/rajivjha1998/{repo}/dispatches`
   ```json
   { "event_type": "restore-version", "client_payload": { "request_id": "{request_id}", "sha": "{sha}" } }
   ```
   The Action copies `site.json` from that version into `draft` (validated and built first). Then Build Watcher (title `restore-version {request_id}`) → Review → Publisher.

---

## 3. Hosting agent (Cloudflare Pages)

One-time setup:
- Create a Cloudflare account and install the **Cloudflare Pages GitHub app** with access to your repos.
- Create an API token with **Pages: Edit**.
- Save it in BBPlatform API Auth as Bearer, base URL `https://api.cloudflare.com/client/v4`.

### Site Host Creator *(once per site, after Create Draft Branch)*
`POST /accounts/{account_id}/pages/projects`
```json
{
  "name": "{repo}",
  "production_branch": "main",
  "build_config": { "build_command": "pnpm build", "destination_dir": "apps/website/dist" },
  "source": {
    "type": "github",
    "config": {
      "owner": "rajivjha1998",
      "repo_name": "{repo}",
      "production_branch": "main",
      "deployments_enabled": true,
      "production_deployments_enabled": true,
      "preview_deployment_setting": "custom",
      "preview_branch_includes": ["draft"],
      "pr_comments_enabled": false
    }
  },
  "deployment_configs": {
    "production": { "env_vars": { "NODE_VERSION": { "type": "plain_text", "value": "22" } } },
    "preview": { "env_vars": { "NODE_VERSION": { "type": "plain_text", "value": "22" } } }
  }
}
```
After that, every push builds automatically. No secrets are needed in GitHub.
- Preview (draft): `https://draft.{repo}.pages.dev`
- Live (main): `https://{repo}.pages.dev`

**To verify on the first test:** that Cloudflare's build image runs pnpm 12 from `packageManager`. If it doesn't, set the build command to `npx pnpm@12.10.1 install && npx pnpm@12.10.1 build`.

---

## 4. HIL steps

All fields are existing field types (`text`), so no backend change is needed. Use these exact field keys: the Action maps them by name.

**New Project**
| Key | Label | Required |
|---|---|---|
| `repo` | Site name (lowercase and dashes, starting with `site-`, e.g. `site-acme-robotics`) | yes |
| `brand_name` | Company name | yes |

**Brand & Buttons**
| Key | Label | Notes |
|---|---|---|
| `brand_tagline` | Tagline | max 120 |
| `brand_description` | One-sentence description | max 155 |
| `color_primary` | Primary colour | hex, e.g. `#2563eb` |
| `color_secondary` | Secondary colour | hex |
| `color_tertiary` | Tertiary colour | hex |
| `hero_title` | Headline | max 34 |
| `hero_title_accent` | Headline second part (coloured) | max 24, optional |
| `hero_lede` | Sub-headline | max 100 |
| `button1_label` | Main button text | also used in the header |
| `button1_link` | Main button link | `/page`, `#section`, `www.site.com` or an email |
| `button2_label` | Second button text | optional |
| `button2_link` | Second button link | optional |

Typed values are cleaned up automatically:
- `/pricing` → `/pricing/`
- `www.x.com` → `https://www.x.com`
- `hello@x.com` → `mailto:hello@x.com`
- `2563EB` → `#2563eb`

**Review**: `preview_only`, showing the preview link, plus a dropdown `decision` (`approve` / `reject`).

---

## 5. Workflows

**Build Website**
```
HIL New Project → Repository Creator → [loop] Wait for Repo → Create Draft Branch
→ Site Host Creator → HIL Brand & Buttons → Send Settings → [loop] Build Watcher
→ IF conclusion = success → HIL Review → IF decision = approve → Publisher → notify
```

**Edit Website**
```
HIL Which site? (repo) → Settings Reader → HIL Brand & Buttons (defaults from Settings Reader)
→ Send Settings → [loop] Build Watcher → IF success → HIL Review → IF approve → Publisher
```

Node-by-node bindings: see `site-builder-group-agent.md`.
