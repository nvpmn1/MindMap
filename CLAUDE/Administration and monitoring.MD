# Admin API overview

---

<Tip>
**The Admin API is unavailable for individual accounts.** To collaborate with teammates and add members, set up your organization in **Console → Settings → Organization**.
</Tip>

The [Admin API](/docs/en/api/admin) allows you to programmatically manage your organization's resources, including organization members, workspaces, and API keys. This provides programmatic control over administrative tasks that would otherwise require manual configuration in the [Claude Console](/).

<Check>
  **The Admin API requires special access**

  The Admin API requires a special Admin API key (starting with `sk-ant-admin...`) that differs from standard API keys. Only organization members with the admin role can provision Admin API keys through the Claude Console.
</Check>

## How the Admin API works

When you use the Admin API:

1. You make requests using your Admin API key in the `x-api-key` header
2. The API allows you to manage:
   - Organization members and their roles
   - Organization member invites
   - Workspaces and their members
   - API keys

This is useful for:
- Automating user onboarding/offboarding
- Programmatically managing workspace access
- Monitoring and managing API key usage

## Organization roles and permissions

There are five organization-level roles. See more details [here](https://support.claude.com/en/articles/10186004-api-console-roles-and-permissions).

| Role | Permissions |
|------|-------------|
| user | Can use Workbench |
| claude_code_user | Can use Workbench and [Claude Code](https://code.claude.com/docs/en/overview) |
| developer | Can use Workbench and manage API keys |
| billing | Can use Workbench and manage billing details |
| admin | Can do all of the above, plus manage users |

## Key concepts

### Organization Members

You can list [organization members](/docs/en/api/admin-api/users/get-user), update member roles, and remove members.

<CodeGroup>
```bash Shell
# List organization members
curl "https://api.anthropic.com/v1/organizations/users?limit=10" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"

# Update member role
curl "https://api.anthropic.com/v1/organizations/users/{user_id}" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{"role": "developer"}'

# Remove member
curl --request DELETE "https://api.anthropic.com/v1/organizations/users/{user_id}" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"
```

</CodeGroup>

### Organization Invites

You can invite users to organizations and manage those [invites](/docs/en/api/admin-api/invites/get-invite).

<CodeGroup>

```bash Shell
# Create invite
curl --request POST "https://api.anthropic.com/v1/organizations/invites" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{
    "email": "newuser@domain.com",
    "role": "developer"
  }'

# List invites
curl "https://api.anthropic.com/v1/organizations/invites?limit=10" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"

# Delete invite
curl --request DELETE "https://api.anthropic.com/v1/organizations/invites/{invite_id}" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"
```

</CodeGroup>

### Workspaces

For a comprehensive guide to workspaces, see [Workspaces](/docs/en/build-with-claude/workspaces).

Create and manage [workspaces](/docs/en/api/admin-api/workspaces/get-workspace) ([console](/settings/workspaces)) to organize your resources:

<CodeGroup>

```bash Shell
# Create workspace
curl --request POST "https://api.anthropic.com/v1/organizations/workspaces" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{"name": "Production"}'

# List workspaces
curl "https://api.anthropic.com/v1/organizations/workspaces?limit=10&include_archived=false" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"

# Archive workspace
curl --request POST "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}/archive" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"
```

</CodeGroup>

### Workspace Members

Manage [user access to specific workspaces](/docs/en/api/admin-api/workspace_members/get-workspace-member):

<CodeGroup>

```bash Shell
# Add member to workspace
curl --request POST "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}/members" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{
    "user_id": "user_xxx",
    "workspace_role": "workspace_developer"
  }'

# List workspace members
curl "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}/members?limit=10" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"

# Update member role
curl --request POST "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}/members/{user_id}" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{
    "workspace_role": "workspace_admin"
  }'

# Remove member from workspace
curl --request DELETE "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}/members/{user_id}" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"
```

</CodeGroup>

### API Keys

Monitor and manage [API keys](/docs/en/api/admin-api/apikeys/get-api-key):

<CodeGroup>

```bash Shell
# List API keys
curl "https://api.anthropic.com/v1/organizations/api_keys?limit=10&status=active&workspace_id=wrkspc_xxx" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"

# Update API key
curl --request POST "https://api.anthropic.com/v1/organizations/api_keys/{api_key_id}" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{
    "status": "inactive",
    "name": "New Key Name"
  }'
```

</CodeGroup>

## Accessing organization info

Get information about your organization programmatically with the `/v1/organizations/me` endpoint.

For example:

```bash
curl "https://api.anthropic.com/v1/organizations/me" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

```json
{
  "id": "12345678-1234-5678-1234-567812345678",
  "type": "organization",
  "name": "Organization Name"
}
```

This endpoint is useful for programmatically determining which organization an Admin API key belongs to.

For complete parameter details and response schemas, see the [Organization Info API reference](/docs/en/api/admin-api/organization/get-me).

## Accessing usage and cost reports

To access usage and cost reports for your organization, use the Usage and Cost API endpoints:

- The [**Usage endpoint**](/docs/en/build-with-claude/usage-cost-api#usage-api) (`/v1/organizations/usage_report/messages`) provides detailed usage data, including token counts and request metrics, grouped by various dimensions such as workspace, user, and model.
- The [**Cost endpoint**](/docs/en/build-with-claude/usage-cost-api#cost-api) (`/v1/organizations/cost_report`) provides cost data associated with your organization's usage, allowing you to track expenses and allocate costs by workspace or description.

These endpoints provide detailed insights into your organization's usage and associated costs.

## Accessing Claude Code analytics

For organizations using Claude Code, the [**Claude Code Analytics API**](/docs/en/build-with-claude/claude-code-analytics-api) provides detailed productivity metrics and usage insights:

- The [**Claude Code Analytics endpoint**](/docs/en/build-with-claude/claude-code-analytics-api) (`/v1/organizations/usage_report/claude_code`) provides daily aggregated metrics for Claude Code usage, including sessions, lines of code, commits, pull requests, tool usage statistics, and cost data broken down by user and model.

This API enables you to track developer productivity, analyze Claude Code adoption, and build custom dashboards for your organization.

## Best practices

To effectively use the Admin API:

- Use meaningful names and descriptions for workspaces and API keys
- Implement proper error handling for failed operations
- Regularly audit member roles and permissions
- Clean up unused workspaces and expired invites
- Monitor API key usage and rotate keys periodically

## FAQ

<section title="What permissions are needed to use the Admin API?">

Only organization members with the admin role can use the Admin API. They must also have a special Admin API key (starting with `sk-ant-admin`).

</section>

<section title="Can I create new API keys through the Admin API?">

No, new API keys can only be created through the Claude Console for security reasons. The Admin API can only manage existing API keys.

</section>

<section title="What happens to API keys when removing a user?">

API keys persist in their current state as they are scoped to the Organization, not to individual users.

</section>

<section title="Can organization admins be removed via the API?">

No, organization members with the admin role cannot be removed via the API for security reasons.

</section>

<section title="How long do organization invites last?">

Organization invites expire after 21 days. There is currently no way to modify this expiration period.

</section>

<section title="Are there limits on workspaces?">

Yes, you can have a maximum of 100 workspaces per Organization. Archived workspaces do not count towards this limit.

</section>

<section title="What's the Default Workspace?">

Every Organization has a "Default Workspace" that cannot be edited or removed, and has no ID. This Workspace does not appear in workspace list endpoints.

</section>

<section title="How do organization roles affect Workspace access?">

Organization admins automatically get the `workspace_admin` role to all workspaces. Organization billing members automatically get the `workspace_billing` role. Organization users and developers must be manually added to each workspace.

</section>

<section title="Which roles can be assigned in workspaces?">

Organization users and developers can be assigned `workspace_admin`, `workspace_developer`, or `workspace_user` roles. The `workspace_billing` role can't be manually assigned - it's inherited from having the organization `billing` role.

</section>

<section title="Can organization admin or billing members' workspace roles be changed?">

Only organization billing members can have their workspace role upgraded to an admin role. Otherwise, organization admins and billing members can't have their workspace roles changed or be removed from workspaces while they hold those organization roles. Their workspace access must be modified by changing their organization role first.

</section>

<section title="What happens to workspace access when organization roles change?">

If an organization admin or billing member is demoted to user or developer, they lose access to all workspaces except ones where they were manually assigned roles. When users are promoted to admin or billing roles, they gain automatic access to all workspaces.

</section>





# Data residency

Manage where model inference runs and where data is stored with geographic controls.

---

Data residency controls let you manage where your data is processed and stored. Two independent settings govern this:

- **Inference geo**: Controls where model inference runs, on a per-request basis. Set via the `inference_geo` API parameter or as a workspace default.
- **Workspace geo**: Controls where data is stored at rest and where endpoint processing (image transcoding, code execution, etc.) happens. Configured at the workspace level in the [Console](https://platform.claude.com).

## Inference geo

The `inference_geo` parameter controls where model inference runs for a specific API request. Add it to any `POST /v1/messages` call.

| Value | Description |
|:------|:------------|
| `"global"` | Default. Inference may run in any available geography for optimal performance and availability. |
| `"us"` | Inference runs only in US-based infrastructure. |

### API usage

<CodeGroup>
```bash Shell
curl https://api.anthropic.com/v1/messages \
    --header "x-api-key: $ANTHROPIC_API_KEY" \
    --header "anthropic-version: 2023-06-01" \
    --header "content-type: application/json" \
    --data '{
        "model": "claude-opus-4-6",
        "max_tokens": 1024,
        "inference_geo": "us",
        "messages": [{
            "role": "user",
            "content": "Summarize the key points of this document."
        }]
    }'
```

```python Python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    inference_geo="us",
    messages=[{
        "role": "user",
        "content": "Summarize the key points of this document."
    }]
)

print(response.content[0].text)
# Check where inference actually ran
print(f"Inference geo: {response.usage.inference_geo}")
```

```typescript TypeScript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 1024,
  inference_geo: "us",
  messages: [{
    role: "user",
    content: "Summarize the key points of this document."
  }]
});

console.log(response.content[0].text);
// Check where inference actually ran
console.log(`Inference geo: ${response.usage.inference_geo}`);
```
</CodeGroup>

### Response

The response `usage` object includes an `inference_geo` field indicating where inference ran:

```json
{
  "usage": {
    "input_tokens": 25,
    "output_tokens": 150,
    "inference_geo": "us"
  }
}
```

### Model availability

The `inference_geo` parameter is supported on Claude Opus 4.6 and all subsequent models. Older models released before Opus 4.6 do not support the parameter. Requests with `inference_geo` on legacy models return a 400 error.

<Note>
The `inference_geo` parameter is only available on the Claude API (1P). On third-party platforms (AWS Bedrock, Google Vertex AI), the inference region is determined by the endpoint URL or inference profile, so `inference_geo` is not applicable. The `inference_geo` parameter is also not available via the [OpenAI SDK compatibility endpoint](/docs/en/api/openai-sdk).
</Note>

### Workspace-level restrictions

Workspace settings also support restricting which inference geos are available:

- **`allowed_inference_geos`**: Restricts which geos a workspace can use. If a request specifies an `inference_geo` not in this list, the API returns an error.
- **`default_inference_geo`**: Sets the fallback geo when `inference_geo` is omitted from a request. Individual requests can override this by setting `inference_geo` explicitly.

These settings can be configured through the Console or the [Admin API](/docs/en/build-with-claude/administration-api) under the `data_residency` field.

## Workspace geo

Workspace geo is set when you create a workspace and can't be changed afterwards. Currently, `"us"` is the only available workspace geo.

To set workspace geo, create a new workspace in the [Console](https://platform.claude.com):

1. Go to **Settings** > **Workspaces**.
2. Create a new workspace.
3. Select the workspace geo.

## Pricing

Data residency pricing varies by model generation:

- **Claude Opus 4.6 and newer**: US-only inference (`inference_geo: "us"`) is priced at 1.1x the standard rate across all token pricing categories (input tokens, output tokens, cache writes, and cache reads).
- **Global routing** (`inference_geo: "global"` or omitted): Standard pricing applies.
- **Older models**: Existing pricing is unchanged regardless of `inference_geo` settings.

This pricing applies to the Claude API (1P) only. Third-party platforms (AWS Bedrock, Google Vertex AI, Microsoft Foundry) have their own regional pricing. See the [pricing page](/docs/en/about-claude/pricing#data-residency-pricing) for details.

<Note>
If you use [Priority Tier](/docs/en/api/service-tiers), the 1.1x multiplier for US-only inference also affects how tokens are counted against your Priority Tier capacity. Each token consumed with `inference_geo: "us"` draws down 1.1 tokens from your committed TPM, consistent with how other pricing multipliers (prompt caching, long context) affect burndown rates.
</Note>

## Batch API support

The `inference_geo` parameter is supported on the [Batch API](/docs/en/build-with-claude/batch-processing). Each request in a batch can specify its own `inference_geo` value.

## Migration from legacy opt-outs

If your organization previously opted out of global routing to keep inference in the US, your workspace has been automatically configured with `allowed_inference_geos: ["us"]` and `default_inference_geo: "us"`. No code changes are required. Your existing data residency requirements continue to be enforced through the new geo controls.

### What changed

The legacy opt-out was an organization-level setting that restricted all requests to US-based infrastructure. The new data residency controls replace this with two mechanisms:

- **Per-request control**: The `inference_geo` parameter lets you specify `"us"` or `"global"` on each API call, giving you request-level flexibility.
- **Workspace controls**: The `default_inference_geo` and `allowed_inference_geos` settings in the Console let you enforce geo policies across all keys in a workspace.

### What happened to your workspace

Your workspace was migrated automatically:

| Legacy setting | New equivalent |
|:---------------|:---------------|
| Global routing opt-out (US only) | `allowed_inference_geos: ["us"]`, `default_inference_geo: "us"` |

All API requests using keys from your workspace continue to run on US-based infrastructure. No action is needed to maintain your current behavior.

### If you want to use global routing

If your data residency requirements have changed and you want to take advantage of global routing for better performance and availability, update your workspace's inference geo settings to include `"global"` in the allowed geos and set `default_inference_geo` to `"global"`. See [Workspace-level restrictions](#workspace-level-restrictions) for details.

### Pricing impact

Legacy models are unaffected by this migration. For current pricing on newer models, see [Pricing](#pricing).

## Current limitations

- **Shared rate limits**: Rate limits are shared across all geos.
- **Inference geo**: Only `"us"` and `"global"` are available at launch. Additional regions will be added over time.
- **Workspace geo**: Only `"us"` is currently available. Workspace geo can't be changed after workspace creation.

## Next steps

<CardGroup>
  <Card title="Pricing" icon="dollar-sign" href="/docs/en/about-claude/pricing#data-residency-pricing">
    View data residency pricing details.
  </Card>
  <Card title="Workspaces" icon="building" href="/docs/en/build-with-claude/workspaces">
    Learn about workspace configuration.
  </Card>
  <Card title="Usage and Cost API" icon="chart" href="/docs/en/build-with-claude/usage-cost-api">
    Track usage and costs by data residency.
  </Card>
</CardGroup>






# Workspaces

Organize API keys, manage team access, and control costs with workspaces.

---

Workspaces provide a way to organize your API usage within an organization. Use workspaces to separate different projects, environments, or teams while maintaining centralized billing and administration.

## How workspaces work

Every organization has a **Default Workspace** that cannot be renamed, archived, or deleted. When you create additional workspaces, you can assign API keys, members, and resource limits to each one.

Key characteristics:
- **Workspace identifiers** use the `wrkspc_` prefix (e.g., `wrkspc_01JwQvzr7rXLA5AGx3HKfFUJ`)
- **Maximum 100 workspaces** per organization (archived workspaces don't count)
- **Default Workspace** has no ID and doesn't appear in list endpoints
- **API keys** are scoped to a single workspace and can only access resources within that workspace

## Workspace roles and permissions

Members can have different roles in each workspace, allowing fine-grained access control.

| Role | Permissions |
|------|-------------|
| Workspace User | Use the Workbench only |
| Workspace Developer | Create and manage API keys, use the API |
| Workspace Admin | Full control over workspace settings and members |
| Workspace Billing | View workspace billing information (inherited from organization billing role) |

### Role inheritance

- **Organization admins** automatically receive Workspace Admin access to all workspaces
- **Organization billing members** automatically receive Workspace Billing access to all workspaces
- **Organization users and developers** must be explicitly added to each workspace

<Note>
The Workspace Billing role cannot be manually assigned. It's inherited from having the organization billing role.
</Note>

## Managing workspaces

<Note>
Only organization admins can create workspaces. Organization users and developers must be added to workspaces by an admin.
</Note>

### Via the Console

Create and manage workspaces in the [Claude Console](/settings/workspaces).

#### Create a workspace

<Steps>
  <Step title="Open workspace settings">
    In the Claude Console, go to **Settings > Workspaces**.
  </Step>
  <Step title="Add a new workspace">
    Click **Add Workspace**.
  </Step>
  <Step title="Configure the workspace">
    Enter a workspace name and select a color for visual identification.
  </Step>
  <Step title="Create the workspace">
    Click **Create** to finalize.
  </Step>
</Steps>

<Tip>
To switch between workspaces in the Console, use the **Workspaces** selector in the top-left corner.
</Tip>

#### Edit workspace details

To modify a workspace's name or color:

1. Select the workspace from the list
2. Click the ellipsis menu (**...**) and choose **Edit details**
3. Update the name or color and save your changes

<Note>
The Default Workspace cannot be renamed or deleted.
</Note>

#### Add members to a workspace

1. Navigate to the workspace's **Members** tab
2. Click **Add to Workspace**
3. Select an organization member and assign them a [workspace role](#workspace-roles-and-permissions)
4. Confirm the addition

To remove a member, click the trash icon next to their name.

<Note>
Organization admins and billing members cannot be removed from workspaces while they hold those organization roles.
</Note>

#### Set workspace limits

In the **Limits** tab, you can configure:

- **Rate limits**: Set limits per model tier for requests per minute, input tokens, or output tokens
- **Spend notifications**: Configure alerts when spending reaches certain thresholds

#### Archive a workspace

To archive a workspace, click the ellipsis menu (**...**) and select **Archive**. Archiving:

- Preserves historical data for reporting
- Deactivates the workspace and all associated API keys
- Cannot be undone

<Warning>
Archiving a workspace immediately revokes all API keys in that workspace. This action cannot be undone.
</Warning>

### Via the Admin API

Programmatically manage workspaces using the [Admin API](/docs/en/build-with-claude/administration-api).

<Note>
Admin API endpoints require an Admin API key (starting with `sk-ant-admin...`) that differs from standard API keys. Only organization members with the admin role can provision Admin API keys through the [Claude Console](/settings/admin-keys).
</Note>

```bash
# Create a workspace
curl --request POST "https://api.anthropic.com/v1/organizations/workspaces" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{"name": "Production"}'

# List workspaces
curl "https://api.anthropic.com/v1/organizations/workspaces?limit=10&include_archived=false" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"

# Archive a workspace
curl --request POST "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}/archive" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"
```

For complete parameter details and response schemas, see the [Workspaces API reference](/docs/en/api/admin-api/workspaces/get-workspace).

### Managing workspace members

Add, update, or remove members from a workspace:

```bash
# Add a member to a workspace
curl --request POST "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}/members" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{
    "user_id": "user_xxx",
    "workspace_role": "workspace_developer"
  }'

# Update a member's role
curl --request POST "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}/members/{user_id}" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{"workspace_role": "workspace_admin"}'

# Remove a member from a workspace
curl --request DELETE "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}/members/{user_id}" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"
```

For complete parameter details, see the [Workspace Members API reference](/docs/en/api/admin-api/workspace_members/get-workspace-member).

## API keys and resource scoping

API keys are scoped to a specific workspace. When you create an API key in a workspace, it can only access resources within that workspace.

Resources scoped to workspaces include:
- **Files** created via the [Files API](/docs/en/build-with-claude/files)
- **Message Batches** created via the [Batch API](/docs/en/build-with-claude/batch-processing)
- **Skills** created via the [Skills API](/docs/en/build-with-claude/skills-guide)

<Note>
Starting February 5, 2026, [prompt caches](/docs/en/build-with-claude/prompt-caching) will also be isolated per workspace (applies to the Claude API and Azure only).
</Note>

<Tip>
To retrieve your organization's workspace IDs, use the [List Workspaces](/docs/en/api/admin-api/workspaces/list-workspaces) endpoint, or find them in the [Claude Console](/settings/workspaces).
</Tip>

## Workspace limits

You can set custom spend and rate limits for each workspace to protect against overuse and ensure fair resource distribution.

### Setting workspace limits

Workspace limits can be set lower than (but not higher than) your organization's limits:

- **Spend limits**: Cap monthly spending for a workspace
- **Rate limits**: Limit requests per minute, input tokens per minute, or output tokens per minute

<Note>
- You cannot set limits on the Default Workspace
- If not set, workspace limits match the organization's limits
- Organization-wide limits always apply, even if workspace limits add up to more
</Note>

For detailed information on rate limits and how they work, see [Rate limits](/docs/en/api/rate-limits).

## Usage and cost tracking

Track usage and costs by workspace using the [Usage and Cost API](/docs/en/build-with-claude/usage-cost-api):

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2025-01-01T00:00:00Z&\
ending_at=2025-01-08T00:00:00Z&\
workspace_ids[]=wrkspc_01JwQvzr7rXLA5AGx3HKfFUJ&\
group_by[]=workspace_id&\
bucket_width=1d" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

Usage and costs attributed to the Default Workspace have a `null` value for `workspace_id`.

## Common use cases

### Environment separation

Create separate workspaces for development, staging, and production:

| Workspace | Purpose |
|-----------|---------|
| Development | Testing and experimentation with lower rate limits |
| Staging | Pre-production testing with production-like limits |
| Production | Live traffic with full rate limits and monitoring |

### Team or department isolation

Assign workspaces to different teams for cost allocation and access control:

- **Engineering team** with developer access
- **Data science team** with their own API keys
- **Support team** with limited access for customer tools

### Project-based organization

Create workspaces for specific projects or products to track usage and costs separately.

## Best practices

<Steps>
  <Step title="Plan your workspace structure">
    Consider how you'll organize workspaces before creating them. Think about billing, access control, and usage tracking needs.
  </Step>
  <Step title="Use meaningful names">
    Name workspaces clearly to indicate their purpose (e.g., "Production - Customer Chatbot", "Dev - Internal Tools").
  </Step>
  <Step title="Set appropriate limits">
    Configure spend and rate limits to prevent unexpected costs and ensure fair resource distribution.
  </Step>
  <Step title="Audit access regularly">
    Review workspace membership periodically to ensure only appropriate users have access.
  </Step>
  <Step title="Monitor usage">
    Use the [Usage and Cost API](/docs/en/build-with-claude/usage-cost-api) to track workspace-level consumption.
  </Step>
</Steps>

## FAQ

<section title="What's the Default Workspace?">

Every organization has a "Default Workspace" that cannot be edited, renamed, or removed. This workspace has no ID and doesn't appear in workspace list endpoints. Usage attributed to the Default Workspace shows a `null` value for `workspace_id` in API responses.

</section>

<section title="Are there limits on workspaces?">

Yes, you can have a maximum of 100 workspaces per organization. Archived workspaces do not count towards this limit.

</section>

<section title="How do organization roles affect workspace access?">

Organization admins automatically get the Workspace Admin role in all workspaces. Organization billing members automatically get the Workspace Billing role. Organization users and developers must be manually added to each workspace.

</section>

<section title="Which roles can be assigned in workspaces?">

Organization users and developers can be assigned Workspace Admin, Workspace Developer, or Workspace User roles. The Workspace Billing role cannot be manually assigned; it's inherited from having the organization `billing` role.

</section>

<section title="Can organization admin or billing members' workspace roles be changed?">

Only organization billing members can have their workspace role upgraded to an admin role. Otherwise, organization admins and billing members cannot have their workspace roles changed or be removed from workspaces while they hold those organization roles. Their workspace access must be modified by changing their organization role first.

</section>

<section title="What happens to workspace access when organization roles change?">

If an organization admin or billing member is demoted to user or developer, they lose access to all workspaces except ones where they were manually assigned roles. When users are promoted to admin or billing roles, they gain automatic access to all workspaces.

</section>

<section title="What happens to API keys when a user is removed from a workspace?">

API keys persist in their current state as they are scoped to the organization and workspace, not to individual users.

</section>

## See also

- [Admin API overview](/docs/en/build-with-claude/administration-api)
- [Admin API reference](/docs/en/api/admin)
- [Rate limits](/docs/en/api/rate-limits)
- [Usage and Cost API](/docs/en/build-with-claude/usage-cost-api)










# Usage and Cost API

Programmatically access your organization's API usage and cost data with the Usage & Cost Admin API.

---

<Tip>
**The Admin API is unavailable for individual accounts.** To collaborate with teammates and add members, set up your organization in **Console → Settings → Organization**.
</Tip>

The Usage & Cost Admin API provides programmatic and granular access to historical API usage and cost data for your organization. This data is similar to the information available in the [Usage](/usage) and [Cost](/cost) pages of the Claude Console.

This API enables you to better monitor, analyze, and optimize your Claude implementations:

* **Accurate Usage Tracking:** Get precise token counts and usage patterns instead of relying solely on response token counting
* **Cost Reconciliation:** Match internal records with Anthropic billing for finance and accounting teams
* **Product performance and improvement:** Monitor product performance while measuring if changes to the system have improved it, or setup alerting
* **[Rate limit](/docs/en/api/rate-limits) and [Priority Tier](/docs/en/api/service-tiers#get-started-with-priority-tier) optimization:** Optimize features like [prompt caching](/docs/en/build-with-claude/prompt-caching) or specific prompts to make the most of one’s allocated capacity, or purchase dedicated capacity.
* **Advanced Analysis:** Perform deeper data analysis than what's available in Console

<Check>
  **Admin API key required**
  
  This API is part of the [Admin API](/docs/en/build-with-claude/administration-api). These endpoints require an Admin API key (starting with `sk-ant-admin...`) that differs from standard API keys. Only organization members with the admin role can provision Admin API keys through the [Claude Console](/settings/admin-keys).
</Check>

## Partner solutions

Leading observability platforms offer ready-to-use integrations for monitoring your Claude API usage and cost, without writing custom code. These integrations provide dashboards, alerting, and analytics to help you manage your API usage effectively.

<CardGroup cols={3}>
  <Card title="CloudZero" icon="chart" href="https://docs.cloudzero.com/docs/connections-anthropic">
    Cloud intelligence platform for tracking and forecasting costs
  </Card>
  <Card title="Datadog" icon="chart" href="https://docs.datadoghq.com/integrations/anthropic/">
    LLM Observability with automatic tracing and monitoring
  </Card>
  <Card title="Grafana Cloud" icon="chart" href="https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/integration-reference/integration-anthropic/">
    Agentless integration for easy LLM observability with out-of-the-box dashboards and alerts
  </Card>
  <Card title="Honeycomb" icon="polygon" href="https://docs.honeycomb.io/integrations/anthropic-usage-monitoring/">
    Advanced querying and visualization through OpenTelemetry
  </Card>
  <Card title="Vantage" icon="chart" href="https://docs.vantage.sh/connecting_anthropic">
    FinOps platform for LLM cost & usage observability
  </Card>
</CardGroup>

## Quick start

Get your organization's daily usage for the last 7 days:

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2025-01-08T00:00:00Z&\
ending_at=2025-01-15T00:00:00Z&\
bucket_width=1d" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

<Tip>
  **Set a User-Agent header for integrations**
  
  If you're building an integration, set your User-Agent header to help us understand usage patterns:
  ```
  User-Agent: YourApp/1.0.0 (https://yourapp.com)
  ```
</Tip>

## Usage API

Track token consumption across your organization with detailed breakdowns by model, workspace, and service tier with the `/v1/organizations/usage_report/messages` endpoint.

### Key concepts

- **Time buckets**: Aggregate usage data in fixed intervals (`1m`, `1h`, or `1d`)
- **Token tracking**: Measure uncached input, cached input, cache creation, and output tokens
- **Filtering & grouping**: Filter by API key, workspace, model, service tier, context window, [data residency](/docs/en/build-with-claude/data-residency), or speed (beta), and group results by these dimensions
- **Server tool usage**: Track usage of server-side tools like web search

For complete parameter details and response schemas, see the [Usage API reference](/docs/en/api/admin-api/usage-cost/get-messages-usage-report).

### Basic examples

#### Daily usage by model

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2025-01-01T00:00:00Z&\
ending_at=2025-01-08T00:00:00Z&\
group_by[]=model&\
bucket_width=1d" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

#### Hourly usage with filtering

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2025-01-15T00:00:00Z&\
ending_at=2025-01-15T23:59:59Z&\
models[]=claude-opus-4-6&\
service_tiers[]=batch&\
context_window[]=0-200k&\
bucket_width=1h" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

#### Filter usage by API keys and workspaces

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2025-01-01T00:00:00Z&\
ending_at=2025-01-08T00:00:00Z&\
api_key_ids[]=apikey_01Rj2N8SVvo6BePZj99NhmiT&\
api_key_ids[]=apikey_01ABC123DEF456GHI789JKL&\
workspace_ids[]=wrkspc_01JwQvzr7rXLA5AGx3HKfFUJ&\
workspace_ids[]=wrkspc_01XYZ789ABC123DEF456MNO&\
bucket_width=1d" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

<Tip>
To retrieve your organization's API key IDs, use the [List API Keys](/docs/en/api/admin-api/apikeys/list-api-keys) endpoint.

To retrieve your organization's workspace IDs, use the [List Workspaces](/docs/en/api/admin-api/workspaces/list-workspaces) endpoint, or find your organization's workspace IDs in the Anthropic Console.
</Tip>

#### Data residency

Track your [data residency controls](/docs/en/build-with-claude/data-residency) by grouping and filtering usage with the `inference_geo` dimension. This is useful for verifying geographic routing across your organization.

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2026-02-01T00:00:00Z&\
ending_at=2026-02-08T00:00:00Z&\
group_by[]=inference_geo&\
group_by[]=model&\
bucket_width=1d" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

You can also filter to a specific geo. Valid values are `global`, `us`, and `not_available`:

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2026-02-01T00:00:00Z&\
ending_at=2026-02-08T00:00:00Z&\
inference_geos[]=us&\
group_by[]=model&\
bucket_width=1d" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

<Note>
Models released before February 2026 (prior to Claude Opus 4.6) don't support the `inference_geo` request parameter, so their usage reports return `"not_available"` for this dimension. You can use `not_available` as a filter value in `inference_geos[]` to target those models.
</Note>

#### Fast mode (research preview)

Track [fast mode](/docs/en/build-with-claude/fast-mode) usage by grouping and filtering with the `speed` dimension. This is useful for monitoring standard vs. fast mode usage.

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2026-02-01T00:00:00Z&\
ending_at=2026-02-08T00:00:00Z&\
group_by[]=speed&\
group_by[]=model&\
bucket_width=1d" \
  --header "anthropic-version: 2023-06-01" \
  --header "anthropic-beta: fast-mode-2026-02-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

You can also filter to a specific speed. Valid values are `standard` and `fast`:

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2026-02-01T00:00:00Z&\
ending_at=2026-02-08T00:00:00Z&\
speeds[]=fast&\
group_by[]=model&\
bucket_width=1d" \
  --header "anthropic-version: 2023-06-01" \
  --header "anthropic-beta: fast-mode-2026-02-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

<Note>
Both the `speeds[]` filter and the `speed` group_by value require the `fast-mode-2026-02-01` beta header.
</Note>

### Time granularity limits

| Granularity | Default Limit | Maximum Limit | Use Case |
|-------------|---------------|---------------|----------|
| `1m` | 60 buckets | 1440 buckets | Real-time monitoring |
| `1h` | 24 buckets | 168 buckets | Daily patterns |
| `1d` | 7 buckets | 31 buckets | Weekly/monthly reports |

## Cost API

Retrieve service-level cost breakdowns in USD with the `/v1/organizations/cost_report` endpoint.

### Key concepts

- **Currency**: All costs in USD, reported as decimal strings in lowest units (cents)
- **Cost types**: Track token usage, web search, and code execution costs
- **Grouping**: Group costs by workspace or description for detailed breakdowns. When grouping by `description`, responses include parsed fields like `model` and `inference_geo`
- **Time buckets**: Daily granularity only (`1d`)

For complete parameter details and response schemas, see the [Cost API reference](/docs/en/api/admin-api/usage-cost/get-cost-report).

<Warning>
  Priority Tier costs use a different billing model and are not included in the cost endpoint. Track Priority Tier usage through the usage endpoint instead.
</Warning>

### Basic example

```bash
curl "https://api.anthropic.com/v1/organizations/cost_report?\
starting_at=2025-01-01T00:00:00Z&\
ending_at=2025-01-31T00:00:00Z&\
group_by[]=workspace_id&\
group_by[]=description" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

## Pagination

Both endpoints support pagination for large datasets:

1. Make your initial request
2. If `has_more` is `true`, use the `next_page` value in your next request
3. Continue until `has_more` is `false`

```bash
# First request
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2025-01-01T00:00:00Z&\
ending_at=2025-01-31T00:00:00Z&\
limit=7" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"

# Response includes: "has_more": true, "next_page": "page_xyz..."

# Next request with pagination
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2025-01-01T00:00:00Z&\
ending_at=2025-01-31T00:00:00Z&\
limit=7&\
page=page_xyz..." \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

## Common use cases

Explore detailed implementations in [Claude Cookbook](https://platform.claude.com/cookbooks):

- **Daily usage reports**: Track token consumption trends
- **Cost attribution**: Allocate expenses by workspace for chargebacks
- **Cache efficiency**: Measure and optimize prompt caching
- **Budget monitoring**: Set up alerts for spending thresholds
- **CSV export**: Generate reports for finance teams

## Frequently asked questions

### How fresh is the data?
Usage and cost data typically appears within 5 minutes of API request completion, though delays may occasionally be longer.

### What's the recommended polling frequency?
The API supports polling once per minute for sustained use. For short bursts (e.g., downloading paginated data), more frequent polling is acceptable. Cache results for dashboards that need frequent updates.

### How do I track code execution usage?
Code execution costs appear in the cost endpoint grouped under `Code Execution Usage` in the description field. Code execution is not included in the usage endpoint.

### How do I track Priority Tier usage?
Filter or group by `service_tier` in the usage endpoint and look for the `priority` value. Priority Tier costs are not available in the cost endpoint.

### What happens with Workbench usage?
API usage from the Workbench is not associated with an API key, so `api_key_id` will be `null` even when grouping by that dimension.

### How is the default workspace represented?
Usage and costs attributed to the default workspace have a `null` value for `workspace_id`.

### How do I get per-user cost breakdowns for Claude Code?

Use the [Claude Code Analytics API](/docs/en/build-with-claude/claude-code-analytics-api), which provides per-user estimated costs and productivity metrics without the performance limitations of breaking down costs by many API keys. For general API usage with many keys, use the [Usage API](#usage-api) to track token consumption as a cost proxy.

## See also
The Usage and Cost APIs can be used to help you deliver a better experience for your users, help you manage costs, and preserve your rate limit. Learn more about some of these other features:

- [Admin API overview](/docs/en/build-with-claude/administration-api)
- [Admin API reference](/docs/en/api/admin)
- [Pricing](/docs/en/about-claude/pricing)
- [Prompt caching](/docs/en/build-with-claude/prompt-caching) - Optimize costs with caching
- [Batch processing](/docs/en/build-with-claude/batch-processing) - 50% discount on batch requests
- [Rate limits](/docs/en/api/rate-limits) - Understand usage tiers
- [Data residency](/docs/en/build-with-claude/data-residency) - Control inference geography








# Claude Code Analytics API

Programmatically access your organization's Claude Code usage analytics and productivity metrics with the Claude Code Analytics Admin API.

---

<Tip>
**The Admin API is unavailable for individual accounts.** To collaborate with teammates and add members, set up your organization in **Console → Settings → Organization**.
</Tip>

The Claude Code Analytics Admin API provides programmatic access to daily aggregated usage metrics for Claude Code users, enabling organizations to analyze developer productivity and build custom dashboards. This API bridges the gap between our basic [Analytics dashboard](/claude-code) and the complex OpenTelemetry integration.

This API enables you to better monitor, analyze, and optimize your Claude Code adoption:

* **Developer Productivity Analysis:** Track sessions, lines of code added/removed, commits, and pull requests created using Claude Code
* **Tool Usage Metrics:** Monitor acceptance and rejection rates for different Claude Code tools (Edit, Write, NotebookEdit)
* **Cost Analysis:** View estimated costs and token usage broken down by Claude model
* **Custom Reporting:** Export data to build executive dashboards and reports for management teams
* **Usage Justification:** Provide metrics to justify and expand Claude Code adoption internally

<Check>
  **Admin API key required**
  
  This API is part of the [Admin API](/docs/en/build-with-claude/administration-api). These endpoints require an Admin API key (starting with `sk-ant-admin...`) that differs from standard API keys. Only organization members with the admin role can provision Admin API keys through the [Claude Console](/settings/admin-keys).
</Check>

## Quick start

Get your organization's Claude Code analytics for a specific day:

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/claude_code?\
starting_at=2025-09-08&\
limit=20" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

<Tip>
  **Set a User-Agent header for integrations**
  
  If you're building an integration, set your User-Agent header to help us understand usage patterns:
  ```
  User-Agent: YourApp/1.0.0 (https://yourapp.com)
  ```
</Tip>

## Claude Code Analytics API

Track Claude Code usage, productivity metrics, and developer activity across your organization with the `/v1/organizations/usage_report/claude_code` endpoint.

### Key concepts

- **Daily aggregation**: Returns metrics for a single day specified by the `starting_at` parameter
- **User-level data**: Each record represents one user's activity for the specified day
- **Productivity metrics**: Track sessions, lines of code, commits, pull requests, and tool usage
- **Token and cost data**: Monitor usage and estimated costs broken down by Claude model
- **Cursor-based pagination**: Handle large datasets with stable pagination using opaque cursors
- **Data freshness**: Metrics are available with up to 1-hour delay for consistency

For complete parameter details and response schemas, see the [Claude Code Analytics API reference](/docs/en/api/admin-api/claude-code/get-claude-code-usage-report).

### Basic examples

#### Get analytics for a specific day

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/claude_code?\
starting_at=2025-09-08" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

#### Get analytics with pagination

```bash
# First request
curl "https://api.anthropic.com/v1/organizations/usage_report/claude_code?\
starting_at=2025-09-08&\
limit=20" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"

# Subsequent request using cursor from response
curl "https://api.anthropic.com/v1/organizations/usage_report/claude_code?\
starting_at=2025-09-08&\
page=page_MjAyNS0wNS0xNFQwMDowMDowMFo=" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

### Request parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `starting_at` | string | Yes | UTC date in YYYY-MM-DD format. Returns metrics for this single day only |
| `limit` | integer | No | Number of records per page (default: 20, max: 1000) |
| `page` | string | No | Opaque cursor token from previous response's `next_page` field |

### Available metrics

Each response record contains the following metrics for a single user on a single day:

#### Dimensions
- **date**: Date in RFC 3339 format (UTC timestamp)
- **actor**: The user or API key that performed the Claude Code actions (either `user_actor` with `email_address` or `api_actor` with `api_key_name`)
- **organization_id**: Organization UUID
- **customer_type**: Type of customer account (`api` for API customers, `subscription` for Pro/Team customers)
- **terminal_type**: Type of terminal or environment where Claude Code was used (e.g., `vscode`, `iTerm.app`, `tmux`)

#### Core metrics
- **num_sessions**: Number of distinct Claude Code sessions initiated by this actor
- **lines_of_code.added**: Total number of lines of code added across all files by Claude Code
- **lines_of_code.removed**: Total number of lines of code removed across all files by Claude Code
- **commits_by_claude_code**: Number of git commits created through Claude Code's commit functionality
- **pull_requests_by_claude_code**: Number of pull requests created through Claude Code's PR functionality

#### Tool action metrics
Breakdown of tool action acceptance and rejection rates by tool type:
- **edit_tool.accepted/rejected**: Number of Edit tool proposals that the user accepted/rejected
- **write_tool.accepted/rejected**: Number of Write tool proposals that the user accepted/rejected
- **notebook_edit_tool.accepted/rejected**: Number of NotebookEdit tool proposals that the user accepted/rejected

#### Model breakdown
For each Claude model used:
- **model**: Claude model identifier (e.g., `claude-opus-4-6`)
- **tokens.input/output**: Input and output token counts for this model
- **tokens.cache_read/cache_creation**: Cache-related token usage for this model
- **estimated_cost.amount**: Estimated cost in cents USD for this model
- **estimated_cost.currency**: Currency code for the cost amount (currently always `USD`)

### Response structure

The API returns data in the following format:

```json
{
  "data": [
    {
      "date": "2025-09-01T00:00:00Z",
      "actor": {
        "type": "user_actor",
        "email_address": "developer@company.com"
      },
      "organization_id": "dc9f6c26-b22c-4831-8d01-0446bada88f1",
      "customer_type": "api",
      "terminal_type": "vscode",
      "core_metrics": {
        "num_sessions": 5,
        "lines_of_code": {
          "added": 1543,
          "removed": 892
        },
        "commits_by_claude_code": 12,
        "pull_requests_by_claude_code": 2
      },
      "tool_actions": {
        "edit_tool": {
          "accepted": 45,
          "rejected": 5
        },
        "multi_edit_tool": {
          "accepted": 12,
          "rejected": 2
        },
        "write_tool": {
          "accepted": 8,
          "rejected": 1
        },
        "notebook_edit_tool": {
          "accepted": 3,
          "rejected": 0
        }
      },
      "model_breakdown": [
        {
          "model": "claude-opus-4-6",
          "tokens": {
            "input": 100000,
            "output": 35000,
            "cache_read": 10000,
            "cache_creation": 5000
          },
          "estimated_cost": {
            "currency": "USD",
            "amount": 1025
          }
        }
      ]
    }
  ],
  "has_more": false,
  "next_page": null
}
```

## Pagination

The API supports cursor-based pagination for organizations with large numbers of users:

1. Make your initial request with optional `limit` parameter
2. If `has_more` is `true` in the response, use the `next_page` value in your next request
3. Continue until `has_more` is `false`

The cursor encodes the position of the last record and ensures stable pagination even as new data arrives. Each pagination session maintains a consistent data boundary to ensure you don't miss or duplicate records.

## Common use cases

- **Executive dashboards**: Create high-level reports showing Claude Code impact on development velocity
- **AI tool comparison**: Export metrics to compare Claude Code with other AI coding tools like Copilot and Cursor
- **Developer productivity analysis**: Track individual and team productivity metrics over time
- **Cost tracking and allocation**: Monitor spending patterns and allocate costs by team or project
- **Adoption monitoring**: Identify which teams and users are getting the most value from Claude Code
- **ROI justification**: Provide concrete metrics to justify and expand Claude Code adoption internally

## Frequently asked questions

### How fresh is the analytics data?
Claude Code analytics data typically appears within 1 hour of user activity completion. To ensure consistent pagination results, only data older than 1 hour is included in responses.

### Can I get real-time metrics?
No, this API provides daily aggregated metrics only. For real-time monitoring, consider using the [OpenTelemetry integration](https://code.claude.com/docs/en/monitoring-usage).

### How are users identified in the data?
Users are identified through the `actor` field in two ways:
- **`user_actor`**: Contains `email_address` for users who authenticate via OAuth (most common)
- **`api_actor`**: Contains `api_key_name` for users who authenticate via API key

The `customer_type` field indicates whether the usage is from `api` customers (API PAYG) or `subscription` customers (Pro/Team plans).

### What's the data retention period?
Historical Claude Code analytics data is retained and accessible through the API. There is no specified deletion period for this data.

### Which Claude Code deployments are supported?
This API only tracks Claude Code usage on the Claude API (1st party). Usage on Amazon Bedrock, Google Vertex AI, or other third-party platforms is not included.

### What does it cost to use this API?
The Claude Code Analytics API is free to use for all organizations with access to the Admin API.

### How do I calculate tool acceptance rates?
Tool acceptance rate = `accepted / (accepted + rejected)` for each tool type. For example, if the edit tool shows 45 accepted and 5 rejected, the acceptance rate is 90%.

### What time zone is used for the date parameter?
All dates are in UTC. The `starting_at` parameter should be in YYYY-MM-DD format and represents UTC midnight for that day.

## See also

The Claude Code Analytics API helps you understand and optimize your team's development workflow. Learn more about related features:

- [Admin API overview](/docs/en/build-with-claude/administration-api)
- [Admin API reference](/docs/en/api/admin)
- [Claude Code Analytics dashboard](/claude-code)
- [Usage and Cost API](/docs/en/build-with-claude/usage-cost-api) - Track API usage across all Anthropic services
- [Identity and access management](https://code.claude.com/docs/en/iam)
- [Monitoring usage with OpenTelemetry](https://code.claude.com/docs/en/monitoring-usage) for custom metrics and alerting






# Zero Data Retention (ZDR)

Learn about Anthropic's Zero Data Retention (ZDR) policy, including which API endpoints and features are ZDR-eligible.

---

This page provides a list of which API endpoints and features are ZDR-eligible and which are not.

<Note>
Information about Anthropic's standard retention policies are set out in [Anthropic's commercial data retention policy](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data) and [consumer data retention policy](https://privacy.claude.com/en/articles/10023548-how-long-do-you-store-my-data). 

Zero Data Retention (ZDR) is Anthropic's commitment to ensuring that customer data submitted through certain API endpoints is not stored after the API response is returned except where needed to comply with law or combat misuse, as outlined in a customer's arrangements with Anthropic. Subject to these exceptions, when using ZDR-enabled endpoints, your data is processed in real-time and immediately discarded, with no logging or storage of prompts or outputs.
</Note>

## Important limitations

**What ZDR covers**

- **Certain Claude APIs**: ZDR applies to the Claude Messages and Token Counting APIs
- **Claude Code**: ZDR applies when used with your enterprise API credentials

**What ZDR does NOT cover**

- **Beta products and features**: Products and features in beta unless specified otherwise
- **Console and Workbench**: Any usage on Console or Workbench
- **Claude consumer products**: Claude Free, Pro, or Max plans, including when customers on those plans use Claude's web, desktop, or mobile apps or Claude Code
- **Claude for Work and Claude for Enterprise**: Claude for Work and Claude for Enterprise product interfaces are not covered by ZDR; only Commercial organization API keys are eligible
- **Third-party integrations**: Data processed by third-party websites, tools, or other integrations is not covered by ZDR, though some may offer similar offerings. When using external services in conjunction with the Claude API, make sure to review those services' data handling practices.

<Note>
For the most up-to-date information on what products and features are ZDR-eligible, please refer to your contract terms or contact your Anthropic account representative.
</Note>

## ZDR eligibility by product/feature

### Fully ZDR-eligible

These API endpoints process data in real-time:

| Feature | Endpoint | Description |
| ------- | -------- | ----------- |
| Messages API | `/v1/messages` | Standard API calls for generating Claude responses. |
| Token Counting | `/v1/messages/count_tokens` | Count tokens before sending requests. |

### Not ZDR-eligible

The following is a non-exhaustive list of endpoints and features that store data beyond when the API response is generated and are **not covered by ZDR arrangements**:

| Feature | Endpoint | Data Retention Policy | Why It's Not ZDR-Eligible |
| ------- | -------- | -------------------- | -------------------------- |
| Batch API | `/v1/messages/batches` | Standard policy: 29-day retention. Use the `/v1/messages/batches` DELETE endpoint to delete message batches at any time after processing. | Batch processing requires asynchronous storage of responses. |
| Files API | `/v1/files` | Files retained until explicitly deleted. | Beta features are excluded from ZDR. Files uploaded via the Files API are retained for future API requests. |
| Skills (Code Executor) | `/v1/skills` | Data retained for skill execution. | Beta features are excluded from ZDR. Skills use server-side code execution, which stores execution data and uploaded files beyond the immediate API response. |
| Context Management | `/v1/messages` (with `context_management`) | Files stored on Anthropic servers. | Beta features are excluded from ZDR. |

### Special cases

These features have nuanced data retention characteristics:

#### Prompt caching

**Status**: Prompt caching is a beta feature that stores KV cache representations and cryptographic hashes of cached content. Cached entries have at least a 5 or 60-minute lifetime and are isolated between organizations. Because Anthropic does not store the raw text of prompts or responses, this feature may be suitable for customers who require ZDR-type data retention commitments.

See [Prompt Caching documentation](/docs/en/build-with-claude/prompt-caching#what-is-the-cache-lifetime) for details.

#### Structured Outputs

**Status**: When using Structured Outputs with a JSON schema, prompts and responses are processed with ZDR. However, the JSON schema itself is temporarily cached for up to 24 hours for optimization purposes. No prompt or response data is retained.

## Additional limitations and exclusions

### CORS not supported

**Cross-Origin Resource Sharing (CORS)** is not supported for organizations with ZDR arrangements. If you need to make API calls from browser-based applications, you must:

- Use a backend proxy server to make API calls on behalf of your frontend
- Implement your own CORS handling on the proxy server
- Never expose API keys directly in browser JavaScript

### Data retention for policy violations and where required by law

Even with ZDR arrangements in place, Anthropic may retain data where required by law or to combat Usage Policy violations and malicious uses of Anthropic's platform. As a result, if a chat or session is flagged for such a violation, Anthropic may retain inputs and outputs for up to 2 years.

## Frequently asked questions

**How do I know if my organization has ZDR arrangements?**

Check your contract terms or contact your Anthropic account representative to confirm if your organization has ZDR arrangements in place.

**What happens if I use a feature that isn't ZDR-eligible when my organization has ZDR arrangements?**

Data will be retained according to the feature's standard retention policy. Ensure you understand the retention characteristics of each feature before use.

**Can I request deletion of data from features that are not ZDR-eligible?**

Contact your Anthropic account representative to discuss deletion options for non-ZDR features.

**Does ZDR apply to all Claude models?**

ZDR applies to ZDR-eligible endpoints regardless of which Claude model you use.

**Does this apply to Claude on AWS Bedrock or Google Vertex AI?**

No, only the Claude API is eligible for ZDR. For Claude deployments on AWS Bedrock or Google Vertex AI, refer to those platforms' data retention policies.

**Is Claude Code eligible for ZDR?**

Claude Code ZDR eligibility depends on how you authenticate:

- **Eligible**: Claude Code used with pay-as-you-go API keys from a Commercial organization
- **Not eligible**: Claude Code used via OAuth (premium seats through Claude for Enterprise)

Additionally, if you have metrics logging enabled in Claude Code, productivity data (such as usage statistics) is exempted from ZDR and may be retained.

**Does Claude for Excel support ZDR?**

No, Claude for Excel is not currently ZDR-eligible.

**How do I request ZDR?**

To request a ZDR arrangement, contact the [Anthropic sales team](https://claude.com/contact-sales).

## Related resources

- [Privacy Policy](https://www.anthropic.com/legal/privacy)
- [Batch Processing](/docs/en/build-with-claude/batch-processing)
- [Files API](/docs/en/api/files-create)
- [Agent SDK Sessions](/docs/en/agent-sdk/sessions)
- [Prompt Caching](/docs/en/build-with-claude/prompt-caching)



