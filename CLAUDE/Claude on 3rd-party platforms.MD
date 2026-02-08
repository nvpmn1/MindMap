# Claude on Amazon Bedrock

Anthropic's Claude models are now generally available through Amazon Bedrock.

---

Calling Claude through Bedrock slightly differs from how you would call Claude when using Anthropic's client SDK's. This guide will walk you through the process of completing an API call to Claude on Bedrock in either Python or TypeScript.

Note that this guide assumes you have already signed up for an [AWS account](https://portal.aws.amazon.com/billing/signup) and configured programmatic access.

## Install and configure the AWS CLI

1. [Install a version of the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html) at or newer than version `2.13.23`
2. Configure your AWS credentials using the AWS configure command (see [Configure the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)) or find your credentials by navigating to "Command line or programmatic access" within your AWS dashboard and following the directions in the popup modal.
3. Verify that your credentials are working:

```bash Shell
aws sts get-caller-identity
```

## Install an SDK for accessing Bedrock

Anthropic's [client SDKs](/docs/en/api/client-sdks) support Bedrock. You can also use an AWS SDK like `boto3` directly.

<Tabs>
<Tab title="Python">
```bash
pip install -U "anthropic[bedrock]"
```
</Tab>

<Tab title="TypeScript">
```bash
npm install @anthropic-ai/bedrock-sdk
```
</Tab>

<Tab title="Java">
<CodeGroup>
```groovy Gradle
implementation("com.anthropic:anthropic-java-bedrock:2.+")
```

```xml Maven
<dependency>
    <groupId>com.anthropic</groupId>
    <artifactId>anthropic-java-bedrock</artifactId>
    <version>2.13.0</version>
</dependency>
```
</CodeGroup>
</Tab>

<Tab title="Go">
```bash
go get github.com/anthropics/anthropic-sdk-go/bedrock
```
</Tab>

<Tab title="Boto3 (Python)">
```bash
pip install boto3>=1.28.59
```
</Tab>
</Tabs>

## Accessing Bedrock

### Subscribe to Anthropic models

Go to the [AWS Console > Bedrock > Model Access](https://console.aws.amazon.com/bedrock/home?region=us-west-2#/modelaccess) and request access to Anthropic models. Note that Anthropic model availability varies by region. See [AWS documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html) for latest information.

#### API model IDs

| Model | Base Bedrock model ID | `global` | `us` | `eu` | `jp` | `apac` |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Claude Opus 4.6 | anthropic.claude-opus-4-6-v1 | Yes | Yes | Yes | Yes | Yes |
| Claude Sonnet 4.5 | anthropic.claude-sonnet-4-5-20250929-v1:0 | Yes | Yes | Yes | Yes | No |
| Claude Sonnet 4 | anthropic.claude-sonnet-4-20250514-v1:0 | Yes | Yes | Yes | No | Yes |
| Claude Sonnet 3.7 <Tooltip tooltipContent="Deprecated as of October 28, 2025.">⚠️</Tooltip> | anthropic.claude-3-7-sonnet-20250219-v1:0 | No | Yes | Yes | No | Yes |
| Claude Opus 4.5 | anthropic.claude-opus-4-5-20251101-v1:0 | Yes | Yes | Yes | No | No |
| Claude Opus 4.1 | anthropic.claude-opus-4-1-20250805-v1:0 | No | Yes | No | No | No |
| Claude Opus 4 | anthropic.claude-opus-4-20250514-v1:0 | No | Yes | No | No | No |
| Claude Haiku 4.5 | anthropic.claude-haiku-4-5-20251001-v1:0 | Yes | Yes | Yes | No | No |
| Claude Haiku 3.5 <Tooltip tooltipContent="Deprecated as of December 19, 2025.">⚠️</Tooltip> | anthropic.claude-3-5-haiku-20241022-v1:0 | No | Yes | No | No | No |
| Claude Haiku 3 | anthropic.claude-3-haiku-20240307-v1:0 | No | Yes | Yes | No | Yes |

For more information about regional vs global model IDs, see the [Global vs regional endpoints](#global-vs-regional-endpoints) section below.

### List available models

The following examples show how to print a list of all the Claude models available through Bedrock:

<CodeGroup>
  ```bash AWS CLI
  aws bedrock list-foundation-models --region=us-west-2 --by-provider anthropic --query "modelSummaries[*].modelId"
  ```

  ```python Boto3 (Python)
  import boto3

  bedrock = boto3.client(service_name="bedrock")
  response = bedrock.list_foundation_models(byProvider="anthropic")

  for summary in response["modelSummaries"]:
      print(summary["modelId"])
  ```
</CodeGroup>

### Making requests

The following examples show how to generate text from Claude on Bedrock:

<CodeGroup>
  ```python Python
  from anthropic import AnthropicBedrock

  client = AnthropicBedrock(
      # Authenticate by either providing the keys below or use the default AWS credential providers, such as
      # using ~/.aws/credentials or the "AWS_SECRET_ACCESS_KEY" and "AWS_ACCESS_KEY_ID" environment variables.
      aws_access_key="<access key>",
      aws_secret_key="<secret key>",
      # Temporary credentials can be used with aws_session_token.
      # Read more at https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html.
      aws_session_token="<session_token>",
      # aws_region changes the aws region to which the request is made. By default, we read AWS_REGION,
      # and if that's not present, we default to us-east-1. Note that we do not read ~/.aws/config for the region.
      aws_region="us-west-2",
  )

  message = client.messages.create(
      model="global.anthropic.claude-opus-4-6-v1",
      max_tokens=256,
      messages=[{"role": "user", "content": "Hello, world"}]
  )
  print(message.content)
  ```

  ```typescript TypeScript
  import AnthropicBedrock from '@anthropic-ai/bedrock-sdk';

  const client = new AnthropicBedrock({
    // Authenticate by either providing the keys below or use the default AWS credential providers, such as
    // using ~/.aws/credentials or the "AWS_SECRET_ACCESS_KEY" and "AWS_ACCESS_KEY_ID" environment variables.
    awsAccessKey: '<access key>',
    awsSecretKey: '<secret key>',

    // Temporary credentials can be used with awsSessionToken.
    // Read more at https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html.
    awsSessionToken: '<session_token>',

    // awsRegion changes the aws region to which the request is made. By default, we read AWS_REGION,
    // and if that's not present, we default to us-east-1. Note that we do not read ~/.aws/config for the region.
    awsRegion: 'us-west-2',
  });

  async function main() {
    const message = await client.messages.create({
      model: 'global.anthropic.claude-opus-4-6-v1',
      max_tokens: 256,
      messages: [{"role": "user", "content": "Hello, world"}]
    });
    console.log(message);
  }
  main().catch(console.error);
  ```

  ```java Java
  import com.anthropic.client.AnthropicClient;
  import com.anthropic.client.okhttp.AnthropicOkHttpClient;
  import com.anthropic.bedrock.backends.BedrockBackend;
  import com.anthropic.models.messages.Message;
  import com.anthropic.models.messages.MessageCreateParams;

  public class BedrockExample {
      public static void main(String[] args) {
          // Uses default AWS credential provider chain
          AnthropicClient client = AnthropicOkHttpClient.builder()
              .backend(BedrockBackend.fromEnv())
              .build();

          Message message = client.messages().create(MessageCreateParams.builder()
              .model("global.anthropic.claude-opus-4-6-v1")
              .maxTokens(256)
              .addUserMessage("Hello, world")
              .build());

          System.out.println(message.content());
      }
  }
  ```

  ```go Go
  package main

  import (
      "context"
      "fmt"

      "github.com/anthropics/anthropic-sdk-go"
      "github.com/anthropics/anthropic-sdk-go/bedrock"
  )

  func main() {
      // Uses default AWS credential provider chain
      client := anthropic.NewClient(
          bedrock.WithLoadDefaultConfig(context.Background()),
      )

      message, err := client.Messages.New(context.Background(), anthropic.MessageNewParams{
          Model:     "global.anthropic.claude-opus-4-6-v1",
          MaxTokens: 256,
          Messages: []anthropic.MessageParam{
              anthropic.NewUserMessage(anthropic.NewTextBlock("Hello, world")),
          },
      })
      if err != nil {
          panic(err)
      }
      fmt.Printf("%+v\n", message.Content)
  }
  ```

  ```python Boto3 (Python)
  import boto3
  import json

  bedrock = boto3.client(service_name="bedrock-runtime")
  body = json.dumps({
    "max_tokens": 256,
    "messages": [{"role": "user", "content": "Hello, world"}],
    "anthropic_version": "bedrock-2023-05-31"
  })

  response = bedrock.invoke_model(body=body, modelId="global.anthropic.claude-opus-4-6-v1")

  response_body = json.loads(response.get("body").read())
  print(response_body.get("content"))
  ```
</CodeGroup>

See our [client SDKs](/docs/en/api/client-sdks) for more details, and the official Bedrock docs [here](https://docs.aws.amazon.com/bedrock/).

## Activity logging

Bedrock provides an [invocation logging service](https://docs.aws.amazon.com/bedrock/latest/userguide/model-invocation-logging.html) that allows customers to log the prompts and completions associated with your usage. 

Anthropic recommends that you log your activity on at least a 30-day rolling basis in order to understand your activity and investigate any potential misuse. 

<Note>
Turning on this service does not give AWS or Anthropic any access to your content.
</Note>

## Feature support
You can find all the features currently supported on Bedrock [here](/docs/en/api/overview).

### PDF Support on Bedrock

PDF support is available on Amazon Bedrock through both the Converse API and InvokeModel API. For detailed information about PDF processing capabilities and limitations, see the [PDF support documentation](/docs/en/build-with-claude/pdf-support#amazon-bedrock-pdf-support).

**Important considerations for Converse API users:**
- Visual PDF analysis (charts, images, layouts) requires citations to be enabled
- Without citations, only basic text extraction is available
- For full control without forced citations, use the InvokeModel API

For more details on the two document processing modes and their limitations, refer to the [PDF support guide](/docs/en/build-with-claude/pdf-support#amazon-bedrock-pdf-support).

### 1M token context window

Claude Opus 4.6, Sonnet 4.5, and Sonnet 4 support the [1M token context window](/docs/en/build-with-claude/context-windows#1m-token-context-window) on Amazon Bedrock.

<Note>
The 1M token context window is currently in beta. To use the extended context window, include the `context-1m-2025-08-07` beta header in your [Bedrock API requests](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-request-response.html).
</Note>

## Global vs regional endpoints

Starting with **Claude Sonnet 4.5 and all future models**, Amazon Bedrock offers two endpoint types:

- **Global endpoints**: Dynamic routing for maximum availability
- **Regional endpoints**: Guaranteed data routing through specific geographic regions

Regional endpoints include a 10% pricing premium over global endpoints.

<Note>
This applies to Claude Sonnet 4.5 and future models only. Older models (Claude Sonnet 4, Opus 4, and earlier) maintain their existing pricing structures.
</Note>

### When to use each option

**Global endpoints (recommended):**
- Provide maximum availability and uptime
- Dynamically route requests to regions with available capacity
- No pricing premium
- Best for applications where data residency is flexible

**Regional endpoints (CRIS):**
- Route traffic through specific geographic regions
- Required for data residency and compliance requirements
- Available for US, EU, Japan, and Australia
- 10% pricing premium reflects infrastructure costs for dedicated regional capacity

### Implementation

**Using global endpoints (default for Opus 4.6, Sonnet 4.5, and Sonnet 4):**

The model IDs for Claude Sonnet 4.5 and 4 already include the `global.` prefix:

<CodeGroup>
```python Python
from anthropic import AnthropicBedrock

client = AnthropicBedrock(aws_region="us-west-2")

message = client.messages.create(
    model="global.anthropic.claude-opus-4-6-v1",
    max_tokens=256,
    messages=[{"role": "user", "content": "Hello, world"}]
)
```

```typescript TypeScript
import AnthropicBedrock from '@anthropic-ai/bedrock-sdk';

const client = new AnthropicBedrock({
  awsRegion: 'us-west-2',
});

const message = await client.messages.create({
  model: 'global.anthropic.claude-opus-4-6-v1',
  max_tokens: 256,
  messages: [{role: "user", content: "Hello, world"}]
});
```

```java Java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.bedrock.backends.BedrockBackend;
import com.anthropic.models.messages.MessageCreateParams;

// Uses default AWS credential provider chain
AnthropicClient client = AnthropicOkHttpClient.builder()
    .backend(BedrockBackend.fromEnv())
    .build();

var message = client.messages().create(MessageCreateParams.builder()
    .model("global.anthropic.claude-opus-4-6-v1")
    .maxTokens(256)
    .addUserMessage("Hello, world")
    .build());
```

```go Go
import (
    "context"

    "github.com/anthropics/anthropic-sdk-go"
    "github.com/anthropics/anthropic-sdk-go/bedrock"
)

// Uses default AWS credential provider chain
client := anthropic.NewClient(
    bedrock.WithLoadDefaultConfig(context.Background()),
)

message, _ := client.Messages.New(context.Background(), anthropic.MessageNewParams{
    Model:     "global.anthropic.claude-opus-4-6-v1",
    MaxTokens: 256,
    Messages: []anthropic.MessageParam{
        anthropic.NewUserMessage(anthropic.NewTextBlock("Hello, world")),
    },
})
```
</CodeGroup>

**Using regional endpoints (CRIS):**

To use regional endpoints, remove the `global.` prefix from the model ID:

<CodeGroup>
```python Python
from anthropic import AnthropicBedrock

client = AnthropicBedrock(aws_region="us-west-2")

# Using US regional endpoint (CRIS)
message = client.messages.create(
    model="anthropic.claude-opus-4-6-v1",  # No global. prefix
    max_tokens=256,
    messages=[{"role": "user", "content": "Hello, world"}]
)
```

```typescript TypeScript
import AnthropicBedrock from '@anthropic-ai/bedrock-sdk';

const client = new AnthropicBedrock({
  awsRegion: 'us-west-2',
});

// Using US regional endpoint (CRIS)
const message = await client.messages.create({
  model: 'anthropic.claude-opus-4-6-v1',  // No global. prefix
  max_tokens: 256,
  messages: [{role: "user", content: "Hello, world"}]
});
```

```java Java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.bedrock.backends.BedrockBackend;
import com.anthropic.models.messages.MessageCreateParams;

// Uses default AWS credential provider chain
AnthropicClient client = AnthropicOkHttpClient.builder()
    .backend(BedrockBackend.fromEnv())
    .build();

// Using US regional endpoint (CRIS)
var message = client.messages().create(MessageCreateParams.builder()
    .model("us.anthropic.claude-opus-4-6-v1")  // Regional prefix
    .maxTokens(256)
    .addUserMessage("Hello, world")
    .build());
```

```go Go
import (
    "context"

    "github.com/anthropics/anthropic-sdk-go"
    "github.com/anthropics/anthropic-sdk-go/bedrock"
)

// Uses default AWS credential provider chain
client := anthropic.NewClient(
    bedrock.WithLoadDefaultConfig(context.Background()),
)

// Using US regional endpoint (CRIS)
message, _ := client.Messages.New(context.Background(), anthropic.MessageNewParams{
    Model:     "us.anthropic.claude-opus-4-6-v1",  // Regional prefix
    MaxTokens: 256,
    Messages: []anthropic.MessageParam{
        anthropic.NewUserMessage(anthropic.NewTextBlock("Hello, world")),
    },
})
```
</CodeGroup>

### Additional resources

- **AWS Bedrock pricing:** [aws.amazon.com/bedrock/pricing](https://aws.amazon.com/bedrock/pricing/)
- **AWS pricing documentation:** [Bedrock pricing guide](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-pricing.html)
- **AWS blog post:** [Introducing Claude Sonnet 4.5 in Amazon Bedrock](https://aws.amazon.com/blogs/aws/introducing-claude-sonnet-4-5-in-amazon-bedrock-anthropics-most-intelligent-model-best-for-coding-and-complex-agents/)
- **Anthropic pricing details:** [Pricing documentation](/docs/en/about-claude/pricing#third-party-platform-pricing)









# Claude in Microsoft Foundry

Access Claude models through Microsoft Foundry with Azure-native endpoints and authentication.

---

This guide will walk you through the process of setting up and making API calls to Claude in Foundry in Python, TypeScript, or using direct HTTP requests. When you can access Claude in Foundry, you will be billed for Claude usage in the Microsoft Marketplace with your Azure subscription, allowing you to access Claude's latest capabilities while managing costs through your Azure subscription.

Regional availability: At launch, Claude is available as a Global Standard deployment type in Foundry resources (US DataZone coming soon). Pricing for Claude in the Microsoft Marketplace uses Anthropic's standard API pricing. Visit the [pricing page](https://claude.com/pricing#api) for details.

## Preview

In this preview platform integration, Claude models run on Anthropic's infrastructure. This is a commercial integration for billing and access through Azure. As an independent processor for Microsoft, customers using Claude through Microsoft Foundry are subject to Anthropic's data use terms. Anthropic continues to provide its industry-leading safety and data commitments, including zero data retention availability.

## Prerequisites

Before you begin, ensure you have:

- An active Azure subscription
- Access to [Foundry](https://ai.azure.com/)
- The [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed (optional, for resource management)

## Install an SDK

Anthropic's [client SDKs](/docs/en/api/client-sdks) support Foundry through platform-specific packages.

<Tabs>
<Tab title="Python">
```bash
pip install -U "anthropic"
```
</Tab>

<Tab title="TypeScript">
```bash
npm install @anthropic-ai/foundry-sdk
```
</Tab>

<Tab title="C#">
```bash
dotnet add package Anthropic.Foundry
```
</Tab>
</Tabs>

## Provisioning

Foundry uses a two-level hierarchy: **resources** contain your security and billing configuration, while **deployments** are the model instances you call via API. You'll first create a Foundry resource, then create one or more Claude deployments within it.

### Provisioning Foundry resources

Create a Foundry resource, which is required to use and manage services in Azure. You can follow these instructions to create a [Foundry resource](https://learn.microsoft.com/en-us/azure/ai-services/multi-service-resource?pivots=azportal#create-a-new-azure-ai-foundry-resource). Alternatively, you can start by creating a [Foundry project](https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/create-projects?tabs=ai-foundry), which involves creating a Foundry resource.

To provision your resource:

1. Navigate to the [Foundry portal](https://ai.azure.com/)
2. Create a new Foundry resource or select an existing one
3. Configure access management using Azure-issued API keys or Entra ID for role-based access control
4. Optionally configure the resource to be part of a private network (Azure Virtual Network) for enhanced security
5. Note your resource name—you'll use this as `{resource}` in API endpoints (e.g., `https://{resource}.services.ai.azure.com/anthropic/v1/*`)

### Creating Foundry deployments

After creating your resource, deploy a Claude model to make it available for API calls:

1. In the Foundry portal, navigate to your resource
2. Go to **Models + endpoints** and select **+ Deploy model** > **Deploy base model**
3. Search for and select a Claude model (e.g., `claude-sonnet-4-5`)
4. Configure deployment settings:
   - **Deployment name**: Defaults to the model ID, but you can customize it (e.g., `my-claude-deployment`). The deployment name cannot be changed after it has been created.
   - **Deployment type**: Select Global Standard (recommended for Claude)
5. Select **Deploy** and wait for provisioning to complete
6. Once deployed, you can find your endpoint URL and keys under **Keys and Endpoint**

<Note>
  The deployment name you choose becomes the value you pass in the `model` parameter of your API requests. You can create multiple deployments of the same model with different names to manage separate configurations or rate limits.
</Note>

## Authentication

Claude on Foundry supports two authentication methods: API keys and Entra ID tokens. Both methods use Azure-hosted endpoints in the format `https://{resource}.services.ai.azure.com/anthropic/v1/*`.

### API key authentication

After provisioning your Foundry Claude resource, you can obtain an API key from the Foundry portal:

1. Navigate to your resource in the Foundry portal
2. Go to **Keys and Endpoint** section
3. Copy one of the provided API keys
4. Use either the `api-key` or `x-api-key` header in your requests, or provide it to the SDK

The Python and TypeScript SDKs require an API key and either a resource name or base URL. The SDKs will automatically read these from the following environment variables if they are defined:

- `ANTHROPIC_FOUNDRY_API_KEY` - Your API key
- `ANTHROPIC_FOUNDRY_RESOURCE` - Your resource name (e.g., `example-resource`)
- `ANTHROPIC_FOUNDRY_BASE_URL` - Alternative to resource name; the full base URL (e.g., `https://example-resource.services.ai.azure.com/anthropic/`)

<Note>
The `resource` and `base_url` parameters are mutually exclusive. Provide either the resource name (which the SDK uses to construct the URL as `https://{resource}.services.ai.azure.com/anthropic/`) or the full base URL directly.
</Note>

**Example using API key:**

<CodeGroup>
```python Python
import os
from anthropic import AnthropicFoundry

client = AnthropicFoundry(
    api_key=os.environ.get("ANTHROPIC_FOUNDRY_API_KEY"),
    resource='example-resource', # your resource name
)

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)
print(message.content)
```

```typescript TypeScript
import AnthropicFoundry from "@anthropic-ai/foundry-sdk";

const client = new AnthropicFoundry({
  apiKey: process.env.ANTHROPIC_FOUNDRY_API_KEY,
  resource: 'example-resource', // your resource name
});

const message = await client.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(message.content);
```

```bash Shell
curl https://{resource}.services.ai.azure.com/anthropic/v1/messages \
  -H "content-type: application/json" \
  -H "api-key: YOUR_AZURE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-opus-4-6",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```
</CodeGroup>

<Warning>
Keep your API keys secure. Never commit them to version control or share them publicly. Anyone with access to your API key can make requests to Claude through your Foundry resource.
</Warning>

## Microsoft Entra authentication

For enhanced security and centralized access management, you can use Entra ID (formerly Azure Active Directory) tokens:

1. Enable Entra authentication for your Foundry resource
2. Obtain an access token from Entra ID
3. Use the token in the `Authorization: Bearer {TOKEN}` header

**Example using Entra ID:**

<CodeGroup>
```python Python
import os
from anthropic import AnthropicFoundry
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

# Get Azure Entra ID token using token provider pattern
token_provider = get_bearer_token_provider(
    DefaultAzureCredential(),
    "https://cognitiveservices.azure.com/.default"
)

# Create client with Entra ID authentication
client = AnthropicFoundry(
    resource='example-resource', # your resource name
    azure_ad_token_provider=token_provider  # Use token provider for Entra ID auth
)

# Make request
message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)
print(message.content)
```

```typescript TypeScript
import AnthropicFoundry from "@anthropic-ai/foundry-sdk";
import {
  DefaultAzureCredential,
  getBearerTokenProvider,
} from "@azure/identity";

// Get Entra ID token using token provider pattern
const credential = new DefaultAzureCredential();
const tokenProvider = getBearerTokenProvider(
  credential,
  "https://cognitiveservices.azure.com/.default"
);

// Create client with Entra ID authentication
const client = new AnthropicFoundry({
  resource: 'example-resource', // your resource name
  azureADTokenProvider: tokenProvider, // Use token provider for Entra ID auth
});

// Make request
const message = await client.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(message.content);
```

```bash Shell
# Get Azure Entra ID token
ACCESS_TOKEN=$(az account get-access-token --resource https://cognitiveservices.azure.com --query accessToken -o tsv)

# Make request with token. Replace {resource} with your resource name
curl https://{resource}.services.ai.azure.com/anthropic/v1/messages \
  -H "content-type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-opus-4-6",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```
</CodeGroup>

<Note>
Azure Entra ID authentication allows you to manage access using Azure RBAC, integrate with your organization's identity management, and avoid managing API keys manually.
</Note>

## Correlation request IDs

Foundry includes request identifiers in HTTP response headers for debugging and tracing. When contacting support, provide both the `request-id` and `apim-request-id` values to help teams quickly locate and investigate your request across both Anthropic and Azure systems.

## Supported features

Claude on Foundry supports most of Claude's powerful features. You can find all the features currently supported in the [overview documentation](/docs/en/build-with-claude/overview).

### Features not supported

- Admin API (`/v1/organizations/*` endpoints)
- Models API (`/v1/models`)
- Message Batch API (`/v1/messages/batches`)

## API responses

API responses from Claude on Foundry follow the standard [Claude API response format](/docs/en/api/messages). This includes the `usage` object in response bodies, which provides detailed token consumption information for your requests. The `usage` object is consistent across all platforms (first-party API, Foundry, Amazon Bedrock, and Google Vertex AI).

For details on response headers specific to Foundry, see the [correlation request IDs section](#correlation-request-ids).

## API model IDs and deployments

The following Claude models are available through Foundry. The latest generation models (Opus 4.6, Sonnet 4.5, and Haiku 4.5) offer the most advanced capabilities:

| Model             | Default Deployment Name     |
| :---------------- | :-------------------------- |
| Claude Opus 4.6     | `claude-opus-4-6`             |
| Claude Opus 4.5   | `claude-opus-4-5`           |
| Claude Sonnet 4.5 | `claude-sonnet-4-5`         |
| Claude Opus 4.1   | `claude-opus-4-1`           |
| Claude Haiku 4.5  | `claude-haiku-4-5`          |

By default, deployment names match the model IDs shown above. However, you can create custom deployments with different names in the Foundry portal to manage different configurations, versions, or rate limits. Use the deployment name (not necessarily the model ID) in your API requests.

## Monitoring and logging

Azure provides comprehensive monitoring and logging capabilities for your Claude usage through standard Azure patterns:

- **Azure Monitor**: Track API usage, latency, and error rates
- **Azure Log Analytics**: Query and analyze request/response logs
- **Cost Management**: Monitor and forecast costs associated with Claude usage

Anthropic recommends logging your activity on at least a 30-day rolling basis to understand usage patterns and investigate any potential issues.

<Note>
Azure's logging services are configured within your Azure subscription. Enabling logging does not provide Microsoft or Anthropic access to your content beyond what's necessary for billing and service operation.
</Note>

## Troubleshooting

### Authentication errors

**Error**: `401 Unauthorized` or `Invalid API key`

- **Solution**: Verify your API key is correct. You can obtain a new API key from the Azure portal under **Keys and Endpoint** for your Claude resource.
- **Solution**: If using Azure Entra ID, ensure your access token is valid and hasn't expired. Tokens typically expire after 1 hour.

**Error**: `403 Forbidden`

- **Solution**: Your Azure account may lack the necessary permissions. Ensure you have the appropriate Azure RBAC role assigned (e.g., "Cognitive Services OpenAI User").

### Rate limiting

**Error**: `429 Too Many Requests`

- **Solution**: You've exceeded your rate limit. Implement exponential backoff and retry logic in your application.
- **Solution**: Consider requesting rate limit increases through the Azure portal or Azure support.

#### Rate limit headers

Foundry does not include Anthropic's standard rate limit headers (`anthropic-ratelimit-tokens-limit`, `anthropic-ratelimit-tokens-remaining`, `anthropic-ratelimit-tokens-reset`, `anthropic-ratelimit-input-tokens-limit`, `anthropic-ratelimit-input-tokens-remaining`, `anthropic-ratelimit-input-tokens-reset`, `anthropic-ratelimit-output-tokens-limit`, `anthropic-ratelimit-output-tokens-remaining`, and `anthropic-ratelimit-output-tokens-reset`) in responses. Manage rate limiting through Azure's monitoring tools instead.

### Model and deployment errors

**Error**: `Model not found` or `Deployment not found`

- **Solution**: Verify you're using the correct deployment name. If you haven't created a custom deployment, use the default model ID (e.g., `claude-sonnet-4-5`).
- **Solution**: Ensure the model/deployment is available in your Azure region.

**Error**: `Invalid model parameter`

- **Solution**: The model parameter should contain your deployment name, which can be customized in the Foundry portal. Verify the deployment exists and is properly configured.

## Additional resources

- **Foundry documentation**: [ai.azure.com/catalog](https://ai.azure.com/catalog/publishers/anthropic)
- **Azure pricing**: [azure.microsoft.com/en-us/pricing](https://azure.microsoft.com/en-us/pricing/)
- **Anthropic pricing details**: [Pricing documentation](/docs/en/about-claude/pricing#third-party-platform-pricing)
- **Authentication guide**: See the [authentication section](#authentication) above
- **Azure portal**: [portal.azure.com](https://portal.azure.com/)








# Claude on Vertex AI

Anthropic's Claude models are now generally available through [Vertex AI](https://cloud.google.com/vertex-ai).

---

The Vertex API for accessing Claude is nearly-identical to the [Messages API](/docs/en/api/messages) and supports all of the same options, with two key differences:

* In Vertex, `model` is not passed in the request body. Instead, it is specified in the Google Cloud endpoint URL.
* In Vertex, `anthropic_version` is passed in the request body (rather than as a header), and must be set to the value `vertex-2023-10-16`.

Vertex is also supported by Anthropic's official [client SDKs](/docs/en/api/client-sdks). This guide will walk you through the process of making a request to Claude on Vertex AI in either Python or TypeScript.

Note that this guide assumes you have already have a GCP project that is able to use Vertex AI. See [using the Claude 3 models from Anthropic](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude) for more information on the setup required, as well as a full walkthrough.

## Install an SDK for accessing Vertex AI

First, install Anthropic's [client SDK](/docs/en/api/client-sdks) for your language of choice.

<Tabs>
<Tab title="Python">
```bash
pip install -U google-cloud-aiplatform "anthropic[vertex]"
```
</Tab>

<Tab title="TypeScript">
```bash
npm install @anthropic-ai/vertex-sdk
```
</Tab>

<Tab title="Java">
<CodeGroup>
```groovy Gradle
implementation("com.anthropic:anthropic-java-vertex:2.+")
```

```xml Maven
<dependency>
    <groupId>com.anthropic</groupId>
    <artifactId>anthropic-java-vertex</artifactId>
    <version>2.13.0</version>
</dependency>
```
</CodeGroup>
</Tab>

<Tab title="Go">
```bash
go get github.com/anthropics/anthropic-sdk-go
```
</Tab>
</Tabs>

## Accessing Vertex AI

### Model Availability

Note that Anthropic model availability varies by region. Search for "Claude" in the [Vertex AI Model Garden](https://cloud.google.com/model-garden) or go to [Use Claude 3](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude) for the latest information.

#### API model IDs

| Model                          | Vertex AI API model ID |
| ------------------------------ | ------------------------ |
| Claude Opus 4.6                  | claude-opus-4-6 |
| Claude Sonnet 4.5              | claude-sonnet-4-5@20250929 |
| Claude Sonnet 4                | claude-sonnet-4@20250514 |
| Claude Sonnet 3.7 <Tooltip tooltipContent="Deprecated as of October 28, 2025.">⚠️</Tooltip> | claude-3-7-sonnet@20250219 |
| Claude Opus 4.5                | claude-opus-4-5@20251101 |
| Claude Opus 4.1                | claude-opus-4-1@20250805 |
| Claude Opus 4                  | claude-opus-4@20250514   |
| Claude Haiku 4.5               | claude-haiku-4-5@20251001 |
| Claude Haiku 3.5 <Tooltip tooltipContent="Deprecated as of December 19, 2025.">⚠️</Tooltip> | claude-3-5-haiku@20241022 |
| Claude Haiku 3                 | claude-3-haiku@20240307  |

### Making requests

Before running requests you may need to run `gcloud auth application-default login` to authenticate with GCP.

The following examples shows how to generate text from Claude on Vertex AI:
<CodeGroup>

  ```python Python
  from anthropic import AnthropicVertex

  project_id = "MY_PROJECT_ID"
  region = "global"

  client = AnthropicVertex(project_id=project_id, region=region)

  message = client.messages.create(
      model="claude-opus-4-6",
      max_tokens=100,
      messages=[
          {
              "role": "user",
              "content": "Hey Claude!",
          }
      ],
  )
  print(message)
  ```

  ```typescript TypeScript
  import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';

  const projectId = 'MY_PROJECT_ID';
  const region = 'global';

  // Goes through the standard `google-auth-library` flow.
  const client = new AnthropicVertex({
    projectId,
    region,
  });

  async function main() {
    const result = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Hey Claude!',
        },
      ],
    });
    console.log(JSON.stringify(result, null, 2));
  }

  main();
  ```

  ```java Java
  import com.anthropic.client.AnthropicClient;
  import com.anthropic.client.okhttp.AnthropicOkHttpClient;
  import com.anthropic.vertex.backends.VertexBackend;
  import com.anthropic.models.messages.Message;
  import com.anthropic.models.messages.MessageCreateParams;

  public class VertexExample {
      public static void main(String[] args) {
          // Uses default Google Cloud credentials
          AnthropicClient client = AnthropicOkHttpClient.builder()
              .backend(VertexBackend.fromEnv())
              .build();

          Message message = client.messages().create(MessageCreateParams.builder()
              .model("claude-opus-4-6")
              .maxTokens(100)
              .addUserMessage("Hey Claude!")
              .build());

          System.out.println(message);
      }
  }
  ```

  ```go Go
  package main

  import (
      "context"
      "fmt"

      "github.com/anthropics/anthropic-sdk-go"
      "github.com/anthropics/anthropic-sdk-go/vertex"
  )

  func main() {
      // Uses default Google Cloud credentials
      client := anthropic.NewClient(
          vertex.WithGoogleAuth(context.Background(), "global", "MY_PROJECT_ID"),
      )

      message, err := client.Messages.New(context.Background(), anthropic.MessageNewParams{
          Model:     "claude-opus-4-6",
          MaxTokens: 100,
          Messages: []anthropic.MessageParam{
              anthropic.NewUserMessage(anthropic.NewTextBlock("Hey Claude!")),
          },
      })
      if err != nil {
          panic(err)
      }
      fmt.Printf("%+v\n", message)
  }
  ```

  ```bash Shell
  MODEL_ID=claude-opus-4-6
  LOCATION=global
  PROJECT_ID=MY_PROJECT_ID

  curl \
  -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://$LOCATION-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/anthropic/models/${MODEL_ID}:streamRawPredict -d \
  '{
    "anthropic_version": "vertex-2023-10-16",
    "messages": [{
      "role": "user",
      "content": "Hey Claude!"
    }],
    "max_tokens": 100,
  }'
  ```
</CodeGroup>

See our [client SDKs](/docs/en/api/client-sdks) and the official [Vertex AI docs](https://cloud.google.com/vertex-ai/docs) for more details.

Claude is also available through [Amazon Bedrock](/docs/en/build-with-claude/claude-on-amazon-bedrock) and [Microsoft Foundry](/docs/en/build-with-claude/claude-in-microsoft-foundry).

## Activity logging

Vertex provides a [request-response logging service](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/request-response-logging) that allows customers to log the prompts and completions associated with your usage. 

Anthropic recommends that you log your activity on at least a 30-day rolling basis in order to understand your activity and investigate any potential misuse. 

<Note>
Turning on this service does not give Google or Anthropic any access to your content.
</Note>

## Feature support
You can find all the features currently supported on Vertex [here](/docs/en/api/overview).

## Global vs regional endpoints

Starting with **Claude Sonnet 4.5 and all future models**, Google Vertex AI offers two endpoint types:

- **Global endpoints**: Dynamic routing for maximum availability
- **Regional endpoints**: Guaranteed data routing through specific geographic regions

Regional endpoints include a 10% pricing premium over global endpoints.

<Note>
This applies to Claude Sonnet 4.5 and future models only. Older models (Claude Sonnet 4, Opus 4, and earlier) maintain their existing pricing structures.
</Note>

### When to use each option

**Global endpoints (recommended):**
- Provide maximum availability and uptime
- Dynamically route requests to regions with available capacity
- No pricing premium
- Best for applications where data residency is flexible
- Only supports pay-as-you-go traffic (provisioned throughput requires regional endpoints)

**Regional endpoints:**
- Route traffic through specific geographic regions
- Required for data residency and compliance requirements
- Support both pay-as-you-go and provisioned throughput
- 10% pricing premium reflects infrastructure costs for dedicated regional capacity

### Implementation

**Using global endpoints (recommended):**

Set the `region` parameter to `"global"` when initializing the client:

<CodeGroup>
```python Python
from anthropic import AnthropicVertex

project_id = "MY_PROJECT_ID"
region = "global"

client = AnthropicVertex(project_id=project_id, region=region)

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=100,
    messages=[
        {
            "role": "user",
            "content": "Hey Claude!",
        }
    ],
)
print(message)
```

```typescript TypeScript
import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';

const projectId = 'MY_PROJECT_ID';
const region = 'global';

const client = new AnthropicVertex({
  projectId,
  region,
});

const result = await client.messages.create({
  model: 'claude-opus-4-6',
  max_tokens: 100,
  messages: [
    {
      role: 'user',
      content: 'Hey Claude!',
    },
  ],
});
```

```java Java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.vertex.backends.VertexBackend;
import com.anthropic.models.messages.MessageCreateParams;

// Uses default Google Cloud credentials
AnthropicClient client = AnthropicOkHttpClient.builder()
    .backend(VertexBackend.fromEnv())
    .build();

var message = client.messages().create(MessageCreateParams.builder()
    .model("claude-opus-4-6")
    .maxTokens(100)
    .addUserMessage("Hey Claude!")
    .build());
```

```go Go
import (
    "context"

    "github.com/anthropics/anthropic-sdk-go"
    "github.com/anthropics/anthropic-sdk-go/vertex"
)

// Uses default Google Cloud credentials
client := anthropic.NewClient(
    vertex.WithGoogleAuth(context.Background(), "global", "MY_PROJECT_ID"),
)

message, _ := client.Messages.New(context.Background(), anthropic.MessageNewParams{
    Model:     "claude-opus-4-6",
    MaxTokens: 100,
    Messages: []anthropic.MessageParam{
        anthropic.NewUserMessage(anthropic.NewTextBlock("Hey Claude!")),
    },
})
```
</CodeGroup>

**Using regional endpoints:**

Specify a specific region like `"us-east1"` or `"europe-west1"`:

<CodeGroup>
```python Python
from anthropic import AnthropicVertex

project_id = "MY_PROJECT_ID"
region = "us-east1"  # Specify a specific region

client = AnthropicVertex(project_id=project_id, region=region)

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=100,
    messages=[
        {
            "role": "user",
            "content": "Hey Claude!",
        }
    ],
)
print(message)
```

```typescript TypeScript
import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';

const projectId = 'MY_PROJECT_ID';
const region = 'us-east1';  // Specify a specific region

const client = new AnthropicVertex({
  projectId,
  region,
});

const result = await client.messages.create({
  model: 'claude-opus-4-6',
  max_tokens: 100,
  messages: [
    {
      role: 'user',
      content: 'Hey Claude!',
    },
  ],
});
```

```java Java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.vertex.backends.VertexBackend;
import com.anthropic.models.messages.MessageCreateParams;

// Uses default Google Cloud credentials with specific region
AnthropicClient client = AnthropicOkHttpClient.builder()
    .backend(VertexBackend.builder()
        .region("us-east1")  // Specify a specific region
        .project("MY_PROJECT_ID")
        .build())
    .build();

var message = client.messages().create(MessageCreateParams.builder()
    .model("claude-opus-4-6")
    .maxTokens(100)
    .addUserMessage("Hey Claude!")
    .build());
```

```go Go
import (
    "context"

    "github.com/anthropics/anthropic-sdk-go"
    "github.com/anthropics/anthropic-sdk-go/vertex"
)

// Specify a specific region
client := anthropic.NewClient(
    vertex.WithGoogleAuth(context.Background(), "us-east1", "MY_PROJECT_ID"),
)

message, _ := client.Messages.New(context.Background(), anthropic.MessageNewParams{
    Model:     "claude-opus-4-6",
    MaxTokens: 100,
    Messages: []anthropic.MessageParam{
        anthropic.NewUserMessage(anthropic.NewTextBlock("Hey Claude!")),
    },
})
```
</CodeGroup>

### Additional resources

- **Google Vertex AI pricing:** [cloud.google.com/vertex-ai/generative-ai/pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
- **Claude models documentation:** [Claude on Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude)
- **Google blog post:** [Global endpoint for Claude models](https://cloud.google.com/blog/products/ai-machine-learning/global-endpoint-for-claude-models-generally-available-on-vertex-ai)
- **Anthropic pricing details:** [Pricing documentation](/docs/en/about-claude/pricing#third-party-platform-pricing)







