# Client SDKs

Official SDKs for building with the Claude API in Python, TypeScript, Java, Go, Ruby, C#, and PHP.

---

Anthropic provides official client SDKs in multiple languages to make it easier to work with the Claude API. Each SDK provides idiomatic interfaces, type safety, and built-in support for features like streaming, retries, and error handling.

<CardGroup cols={3}>
  <Card title="Python" href="/docs/en/api/sdks/python">
    Sync and async clients, Pydantic models
  </Card>
  <Card title="TypeScript" href="/docs/en/api/sdks/typescript">
    Node.js, Deno, Bun, and browser support
  </Card>
  <Card title="Java" href="/docs/en/api/sdks/java">
    Builder pattern, CompletableFuture async
  </Card>
  <Card title="Go" href="/docs/en/api/sdks/go">
    Context-based cancellation, functional options
  </Card>
  <Card title="Ruby" href="/docs/en/api/sdks/ruby">
    Sorbet types, streaming helpers
  </Card>
  <Card title="C#" href="/docs/en/api/sdks/csharp">
    .NET Standard 2.0+, IChatClient integration
  </Card>
  <Card title="PHP" href="/docs/en/api/sdks/php">
    Value objects, builder pattern
  </Card>
</CardGroup>

## Quick installation

<Tabs>
<Tab title="Python">
```bash
pip install anthropic
```
</Tab>
<Tab title="TypeScript">
```bash
npm install @anthropic-ai/sdk
```
</Tab>
<Tab title="Java">
<CodeGroup>
```groovy Gradle
implementation("com.anthropic:anthropic-java:2.11.1")
```

```xml Maven
<dependency>
    <groupId>com.anthropic</groupId>
    <artifactId>anthropic-java</artifactId>
    <version>2.11.1</version>
</dependency>
```
</CodeGroup>
</Tab>
<Tab title="Go">
```bash
go get github.com/anthropics/anthropic-sdk-go
```
</Tab>
<Tab title="Ruby">
```bash
bundler add anthropic
```
</Tab>
<Tab title="C#">
```bash
dotnet add package Anthropic
```
</Tab>
<Tab title="PHP">
```bash
composer require anthropic-ai/sdk
```
</Tab>
</Tabs>

## Quick start

<CodeGroup>
```python Python
import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ]
)
print(message.content)
```

```typescript TypeScript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const message = await client.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "Hello, Claude" }
  ],
});
console.log(message.content);
```

```java Java
AnthropicClient client = AnthropicOkHttpClient.fromEnv();

MessageCreateParams params = MessageCreateParams.builder()
    .model(Model.CLAUDE_OPUS_4_6)
    .maxTokens(1024L)
    .addUserMessage("Hello, Claude")
    .build();

Message message = client.messages().create(params);
System.out.println(message.content());
```

```go Go
client := anthropic.NewClient()

message, _ := client.Messages.New(context.Background(), anthropic.MessageNewParams{
    Model:     anthropic.ModelClaudeOpus4_6,
    MaxTokens: 1024,
    Messages: []anthropic.MessageParam{
        anthropic.NewUserMessage(anthropic.NewTextBlock("Hello, Claude")),
    },
})
fmt.Println(message.Content)
```

```ruby Ruby
client = Anthropic::Client.new

message = client.messages.create(
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "Hello, Claude" }
  ]
)
puts message.content
```

```csharp C#
using Anthropic;

var client = new AnthropicClient();

var message = await client.Messages.Create(new MessageCreateParams
{
    Model = "claude-opus-4-6",
    MaxTokens = 1024,
    Messages = [new() { Role = Role.User, Content = "Hello, Claude" }]
});
Console.WriteLine(message.Content);
```

```php PHP
use Anthropic\Client;

$client = new Client(apiKey: getenv('ANTHROPIC_API_KEY'));

$message = $client->messages->create(
    model: 'claude-opus-4-6',
    maxTokens: 1024,
    messages: [
        ['role' => 'user', 'content' => 'Hello, Claude']
    ],
);
echo $message->content[0]->text;
```
</CodeGroup>

## Platform support

All SDKs support multiple deployment options:

| Platform | Description |
|----------|-------------|
| Claude API | Connect directly to Claude API endpoints |
| [Amazon Bedrock](/docs/en/build-with-claude/claude-on-amazon-bedrock) | Use Claude through AWS |
| [Google Vertex AI](/docs/en/build-with-claude/claude-on-vertex-ai) | Use Claude through Google Cloud |
| [Microsoft Foundry](/docs/en/build-with-claude/claude-in-microsoft-foundry) | Use Claude through Microsoft Azure |

See individual SDK pages for platform-specific setup instructions.

## Beta features

Access beta features using the `beta` namespace in any SDK:

<CodeGroup>
```python Python
message = client.beta.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
    betas=["feature-name"]
)
```

```typescript TypeScript
const message = await client.beta.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
  betas: ["feature-name"],
});
```

```java Java
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.anthropic.models.messages.Model;

MessageCreateParams params = MessageCreateParams.builder()
    .model(Model.CLAUDE_OPUS_4_6)
    .maxTokens(1024L)
    .addUserMessage("Hello")
    .addBeta("feature-name")
    .build();

client.beta().messages().create(params);
```

```go Go
message, _ := client.Beta.Messages.New(context.Background(), anthropic.BetaMessageNewParams{
    Model:     anthropic.ModelClaudeOpus4_6,
    MaxTokens: 1024,
    Messages: []anthropic.BetaMessageParam{
        anthropic.NewBetaUserMessage(anthropic.NewBetaTextBlock("Hello")),
    },
    Betas: []anthropic.AnthropicBeta{anthropic.AnthropicBeta("feature-name")},
})
```

```ruby Ruby
message = anthropic.beta.messages.create(
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
  betas: ["feature-name"]
)
```

```csharp C#
var message = await client.Beta.Messages.Create(new MessageCreateParams
{
    Model = "claude-opus-4-6",
    MaxTokens = 1024,
    Messages = [new() { Role = Role.User, Content = "Hello" }],
    Betas = ["feature-name"],
});
```

```php PHP
$message = $client->beta->messages->create(
    model: 'claude-opus-4-6',
    maxTokens: 1024,
    messages: [['role' => 'user', 'content' => 'Hello']],
    betas: ['feature-name'],
);
```
</CodeGroup>

See [Beta headers](/docs/en/api/beta-headers) for available beta features.

## Requirements

| SDK | Minimum Version |
|-----|-----------------|
| Python | 3.9+ |
| TypeScript | 4.9+ (Node.js 20+) |
| Java | 8+ |
| Go | 1.22+ |
| Ruby | 3.2.0+ |
| C# | .NET Standard 2.0 |
| PHP | 8.1.0+ |

## GitHub repositories

- [anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python)
- [anthropic-sdk-typescript](https://github.com/anthropics/anthropic-sdk-typescript)
- [anthropic-sdk-java](https://github.com/anthropics/anthropic-sdk-java)
- [anthropic-sdk-go](https://github.com/anthropics/anthropic-sdk-go)
- [anthropic-sdk-ruby](https://github.com/anthropics/anthropic-sdk-ruby)
- [anthropic-sdk-csharp](https://github.com/anthropics/anthropic-sdk-csharp)
- [anthropic-sdk-php](https://github.com/anthropics/anthropic-sdk-php)







# Python SDK

Install and configure the Anthropic Python SDK with sync and async client support

---

The Anthropic Python SDK provides convenient access to the Anthropic REST API from Python applications. It supports both synchronous and asynchronous operations, streaming, and integrations with AWS Bedrock and Google Vertex AI.

<Info>
For API feature documentation with code examples, see the [API reference](/docs/en/api/overview). This page covers Python-specific SDK features and configuration.
</Info>

## Installation

```bash
pip install anthropic
```

For platform-specific integrations, install with extras:

```bash
# For AWS Bedrock support
pip install anthropic[bedrock]

# For Google Vertex AI support
pip install anthropic[vertex]

# For improved async performance with aiohttp
pip install anthropic[aiohttp]
```

## Requirements

Python 3.9 or later is required.

## Usage

```python
import os
from anthropic import Anthropic

client = Anthropic(
    # This is the default and can be omitted
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
)

message = client.messages.create(
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Hello, Claude",
        }
    ],
    model="claude-opus-4-6",
)
print(message.content)
```

## Async usage

```python
import os
import asyncio
from anthropic import AsyncAnthropic

client = AsyncAnthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
)

async def main() -> None:
    message = await client.messages.create(
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": "Hello, Claude",
            }
        ],
        model="claude-opus-4-6",
    )
    print(message.content)

asyncio.run(main())
```

### Using aiohttp for better concurrency

For improved async performance, you can use the `aiohttp` HTTP backend instead of the default `httpx`:

```python
import os
import asyncio
from anthropic import AsyncAnthropic, DefaultAioHttpClient

async def main() -> None:
    async with AsyncAnthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        http_client=DefaultAioHttpClient(),
    ) as client:
        message = await client.messages.create(
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": "Hello, Claude",
                }
            ],
            model="claude-opus-4-6",
        )
        print(message.content)

asyncio.run(main())
```

## Streaming responses

We provide support for streaming responses using Server-Sent Events (SSE).

```python
from anthropic import Anthropic

client = Anthropic()

stream = client.messages.create(
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Hello, Claude",
        }
    ],
    model="claude-opus-4-6",
    stream=True,
)
for event in stream:
    print(event.type)
```

### Streaming helpers

The SDK also provides streaming helpers that use context managers and provide access to the accumulated text and the final message:

```python
import asyncio
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

async def main() -> None:
    async with client.messages.stream(
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": "Say hello there!",
            }
        ],
        model="claude-opus-4-6",
    ) as stream:
        async for text in stream.text_stream:
            print(text, end="", flush=True)
        print()

        message = await stream.get_final_message()
        print(message.to_json())

asyncio.run(main())
```

Streaming with `client.messages.stream(...)` exposes various helpers including event handlers and accumulation.

Alternatively, you can use `client.messages.create({ ..., stream=True })` which only returns an iterator of the events in the stream and uses less memory (it does not build up a final message object for you).

## Token counting

You can see the exact usage for a given request through the `usage` response property:

```python
message = client.messages.create(...)
print(message.usage)
# Usage(input_tokens=25, output_tokens=13)
```

You can also count tokens before making a request:

```python
count = client.messages.count_tokens(
    model="claude-opus-4-6",
    messages=[
        {"role": "user", "content": "Hello, world"}
    ]
)
print(count.input_tokens)  # 10
```

## Tool use

This SDK provides support for tool use, also known as function calling. More details can be found in the [tool use overview](/docs/en/agents-and-tools/tool-use/overview).

### Tool helpers

The SDK also provides helpers for easily defining and running tools as Python functions:

```python
import json
from anthropic import Anthropic

client = Anthropic()

def get_weather(location: str) -> str:
    """Get the weather for a given location.

    Args:
        location: The city and state, e.g. San Francisco, CA
    """
    return json.dumps({
        "location": location,
        "temperature": "68°F",
        "condition": "Sunny",
    })

# Use the tool_runner to automatically handle tool calls
runner = client.beta.messages.tool_runner(
    max_tokens=1024,
    model="claude-opus-4-6",
    tools=[get_weather],
    messages=[
        {"role": "user", "content": "What is the weather in SF?"},
    ],
)
for message in runner:
    print(message)
```

## Message Batches

This SDK provides support for the [Message Batches API](/docs/en/build-with-claude/batch-processing) under `client.messages.batches`.

### Creating a batch

Message Batches takes an array of requests, where each object has a `custom_id` identifier and the same request `params` as the standard Messages API:

```python
client.messages.batches.create(
    requests=[
        {
            "custom_id": "my-first-request",
            "params": {
                "model": "claude-opus-4-6",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": "Hello, world"}],
            },
        },
        {
            "custom_id": "my-second-request",
            "params": {
                "model": "claude-opus-4-6",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": "Hi again, friend"}],
            },
        },
    ]
)
```

### Getting results from a batch

Once a Message Batch has been processed, indicated by `.processing_status == 'ended'`, you can access the results with `.batches.results()`:

```python
result_stream = client.messages.batches.results(batch_id)
for entry in result_stream:
    if entry.result.type == "succeeded":
        print(entry.result.message.content)
```

## File uploads

Request parameters that correspond to file uploads can be passed in many different forms:

- A `PathLike` object (e.g., `pathlib.Path`)
- A tuple of `(filename, content, content_type)`
- A `BinaryIO` file-like object
- The return value of the `toFile` helper

```python
from pathlib import Path
from anthropic import Anthropic

client = Anthropic()

# Upload using a file path
client.beta.files.upload(
    file=Path("/path/to/file"),
    betas=["files-api-2025-04-14"],
)

# Upload using bytes
client.beta.files.upload(
    file=("file.txt", b"my bytes", "text/plain"),
    betas=["files-api-2025-04-14"],
)
```

## Handling errors

When the library is unable to connect to the API, or if the API returns a non-success status code (i.e., 4xx or 5xx response), a subclass of `APIError` will be raised:

```python
import anthropic
from anthropic import Anthropic

client = Anthropic()

try:
    message = client.messages.create(
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": "Hello, Claude",
            }
        ],
        model="claude-opus-4-6",
    )
except anthropic.APIConnectionError as e:
    print("The server could not be reached")
    print(e.__cause__)  # an underlying Exception, likely raised within httpx
except anthropic.RateLimitError as e:
    print("A 429 status code was received; we should back off a bit.")
except anthropic.APIStatusError as e:
    print("Another non-200-range status code was received")
    print(e.status_code)
    print(e.response)
```

Error codes are as follows:

| Status Code | Error Type |
|-------------|-----------|
| 400 | `BadRequestError` |
| 401 | `AuthenticationError` |
| 403 | `PermissionDeniedError` |
| 404 | `NotFoundError` |
| 422 | `UnprocessableEntityError` |
| 429 | `RateLimitError` |
| >=500 | `InternalServerError` |
| N/A | `APIConnectionError` |

## Request IDs

> For more information on debugging requests, see the [errors documentation](/docs/en/api/errors#request-id).

All object responses in the SDK provide a `_request_id` property which is added from the `request-id` response header so that you can quickly log failing requests and report them back to Anthropic.

```python
message = client.messages.create(
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ],
    model="claude-opus-4-6",
)
print(message._request_id)  # e.g., req_018EeWyXxfu5pfWkrYcMdjWG
```

## Retries

Certain errors will be automatically retried 2 times by default, with a short exponential backoff. Connection errors (for example, due to a network connectivity problem), 408 Request Timeout, 409 Conflict, 429 Rate Limit, and >=500 Internal errors will all be retried by default.

You can use the `max_retries` option to configure or disable this:

```python
from anthropic import Anthropic

# Configure the default for all requests:
client = Anthropic(
    max_retries=0,  # default is 2
)

# Or, configure per-request:
client.with_options(max_retries=5).messages.create(
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ],
    model="claude-opus-4-6",
)
```

## Timeouts

By default requests time out after 10 minutes. You can configure this with a `timeout` option, which accepts a float or an `httpx.Timeout` object:

```python
import httpx
from anthropic import Anthropic

# Configure the default for all requests:
client = Anthropic(
    timeout=20.0,  # 20 seconds (default is 10 minutes)
)

# More granular control:
client = Anthropic(
    timeout=httpx.Timeout(60.0, read=5.0, write=10.0, connect=2.0),
)

# Override per-request:
client.with_options(timeout=5.0).messages.create(
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ],
    model="claude-opus-4-6",
)
```

On timeout, an `APITimeoutError` is thrown.

Note that requests which time out will be [retried twice by default](#retries).

## Long requests

<Warning>
We highly encourage you to use the streaming [Messages API](#streaming-responses) for longer running requests.
</Warning>

We do not recommend setting a large `max_tokens` value without using streaming. Some networks may drop idle connections after a certain period of time, which can cause the request to fail or [timeout](#timeouts) without receiving a response from Anthropic.

The SDK will throw an error if a non-streaming request is expected to take longer than approximately 10 minutes. Passing `stream=True` or overriding the `timeout` option at the client or request level disables this error.

An expected request latency longer than the [timeout](#timeouts) for a non-streaming request will result in the client terminating the connection and retrying without receiving a response.

## Auto-pagination

List methods in the Claude API are paginated. You can use the `for` syntax to iterate through items across all pages:

```python
from anthropic import Anthropic

client = Anthropic()

all_batches = []
# Automatically fetches more pages as needed.
for batch in client.messages.batches.list(limit=20):
    all_batches.append(batch)
print(all_batches)
```

For async iteration:

```python
import asyncio
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

async def main() -> None:
    all_batches = []
    async for batch in client.messages.batches.list(limit=20):
        all_batches.append(batch)
    print(all_batches)

asyncio.run(main())
```

Alternatively, you can request a single page at a time:

```python
first_page = await client.messages.batches.list(limit=20)

if first_page.has_next_page():
    print(f"will fetch next page using these details: {first_page.next_page_info()}")
    next_page = await first_page.get_next_page()
    print(f"number of items we just fetched: {len(next_page.data)}")
```

## Default Headers

We automatically send the `anthropic-version` header set to `2023-06-01`.

If you need to, you can override it by setting default headers on a per-request basis.

Be aware that doing so may result in incorrect types and other unexpected or undefined behavior in the SDK.

```python
from anthropic import Anthropic

client = Anthropic()

client.messages.with_raw_response.create(
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ],
    model="claude-opus-4-6",
    extra_headers={"anthropic-version": "My-Custom-Value"},
)
```

## Type system

### Request parameters

Nested request parameters are [TypedDicts](https://docs.python.org/3/library/typing.html#typing.TypedDict). Responses are [Pydantic models](https://docs.pydantic.dev) which also have helper methods for things like serializing back into JSON ([`v1`](https://docs.pydantic.dev/1.10/usage/models/), [`v2`](https://docs.pydantic.dev/latest/concepts/serialization/)).

### Response models

To convert a Pydantic model to a dictionary, use the helper methods:

```python
message = client.messages.create(...)

# Convert to JSON string
json_str = message.to_json()

# Convert to dictionary
data = message.to_dict()
```

### Handling null vs missing fields

In responses, you can distinguish between fields that are explicitly `null` versus fields that were not returned (missing):

```python
if response.my_field is None:
    if "my_field" not in response.model_fields_set:
        print("field was not in the response")
    else:
        print("field was null")
```

## Advanced usage

### Accessing raw response data (e.g., headers)

The "raw" `Response` returned by `httpx` can be accessed via the `.with_raw_response` property on the client. This is useful for accessing response headers or other metadata:

```python
from anthropic import Anthropic

client = Anthropic()

response = client.messages.with_raw_response.create(
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ],
    model="claude-opus-4-6",
)

print(response.headers.get("x-request-id"))
message = response.parse()  # get the object that `messages.create()` would have returned
print(message.content)
```

These methods return an `APIResponse` object.

### Logging

The SDK uses the standard library `logging` module.

You can enable logging by setting the environment variable `ANTHROPIC_LOG` to one of `debug`, `info`, `warn`, or `off`:

```bash
export ANTHROPIC_LOG=debug
```

### Making custom/undocumented requests

This library is typed for convenient access to the documented API. If you need to access undocumented endpoints, params, or response properties, the library can still be used.

#### Undocumented endpoints

To make requests to undocumented endpoints, you can use `client.get`, `client.post`, and other HTTP verbs. Options on the client, such as retries, will be respected when making these requests.

```python
import httpx

response = client.post(
    "/foo",
    cast_to=httpx.Response,
    body={"my_param": True},
)

print(response.json())
```

#### Undocumented request params

If you want to explicitly send an extra param, you can do so with the `extra_query`, `extra_body`, and `extra_headers` request options.

#### Undocumented response properties

To access undocumented response properties, you can access the extra fields like `response.unknown_prop`. You can also get all extra fields on the Pydantic model as a dict with `response.model_extra`.

### Configuring the HTTP client

You can directly override the [httpx client](https://www.python-httpx.org/api/#client) to customize it for your use case, including support for proxies and transports:

```python
import httpx
from anthropic import Anthropic, DefaultHttpxClient

client = Anthropic(
    http_client=DefaultHttpxClient(
        proxy="http://my.test.proxy.example.com",
        transport=httpx.HTTPTransport(local_address="0.0.0.0"),
    ),
)
```

<Note>
Use `DefaultHttpxClient` and `DefaultAsyncHttpxClient` instead of raw `httpx.Client` and `httpx.AsyncClient` to ensure the SDK's default configuration (timeouts, connection limits, etc.) is preserved.
</Note>

### Managing HTTP resources

By default the library closes underlying HTTP connections whenever the client is [garbage collected](https://docs.python.org/3/reference/datamodel.html#object.__del__). You can manually close the client using the `.close()` method if desired, or with a context manager that closes when exiting.

```python
from anthropic import Anthropic

with Anthropic() as client:
    message = client.messages.create(...)

# HTTP client is automatically closed
```

## Beta features

We introduce beta features before they are generally available to get early feedback and test new functionality. You can check the availability of all of Claude's capabilities and tools in the [build with Claude overview](/docs/en/build-with-claude/overview).

You can access most beta API features through the `beta` property of the client. To enable a particular beta feature, you need to add the appropriate [beta header](/docs/en/api/beta-headers) to the `betas` field when creating a message.

For example, to use code execution:

```python
from anthropic import Anthropic

client = Anthropic()

response = client.beta.messages.create(
    max_tokens=1024,
    model="claude-opus-4-6",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What's 4242424242 * 4242424242?",
                },
            ],
        },
    ],
    tools=[
        {
            "name": "code_execution",
            "type": "code_execution_20250522",
        },
    ],
    betas=["code-execution-2025-05-22"],
)
```

## Platform integrations

<Note>
For detailed platform setup guides, see:
- [Amazon Bedrock](/docs/en/build-with-claude/claude-on-amazon-bedrock)
- [Google Vertex AI](/docs/en/build-with-claude/claude-on-vertex-ai)
</Note>

### Amazon Bedrock

```python
from anthropic import AnthropicBedrock

client = AnthropicBedrock()

message = client.messages.create(
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Hello!",
        }
    ],
    model="anthropic.claude-opus-4-6-v1",
)
print(message)
```

For a full list of available Bedrock models, see the [Amazon Bedrock documentation](/docs/en/build-with-claude/claude-on-amazon-bedrock).

You can also configure AWS credentials explicitly:

```python
client = AnthropicBedrock(
    aws_region="us-east-1",
    aws_access_key="...",
    aws_secret_key="...",
    # Optional
    aws_session_token="...",
    aws_profile="my-profile",
)
```

### Google Vertex AI

```python
from anthropic import AnthropicVertex

client = AnthropicVertex()

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Hello!",
        }
    ],
)
print(message)
```

For a full list of available Vertex models, see the [Google Vertex AI documentation](/docs/en/build-with-claude/claude-on-vertex-ai).

## Additional resources

- [GitHub repository](https://github.com/anthropics/anthropic-sdk-python)
- [API reference](/docs/en/api/overview)
- [Streaming guide](/docs/en/build-with-claude/streaming)
- [Tool use guide](/docs/en/agents-and-tools/tool-use/overview)








# TypeScript SDK

Install and configure the Anthropic TypeScript SDK for Node.js, Deno, Bun, and browser environments

---

This library provides convenient access to the Anthropic REST API from server-side TypeScript or JavaScript.

<Info>
For API feature documentation with code examples, see the [API reference](/docs/en/api/overview). This page covers TypeScript-specific SDK features and configuration.
</Info>

## Installation

```bash
npm install @anthropic-ai/sdk
```

## Requirements

TypeScript >= 4.9 is supported.

The following runtimes are supported:

- Node.js 20 LTS or later ([non-EOL](https://endoflife.date/nodejs)) versions.
- Deno v1.28.0 or higher.
- Bun 1.0 or later.
- Cloudflare Workers.
- Vercel Edge Runtime.
- Jest 28 or greater with the `"node"` environment (`"jsdom"` is not supported at this time).
- Nitro v2.6 or greater.
- Web browsers: disabled by default to avoid exposing your secret API credentials (see [API key best practices](https://support.anthropic.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure)). Enable browser support by explicitly setting `dangerouslyAllowBrowser` to `true`.

Note that React Native is not supported at this time.

If you are interested in other runtime environments, please open or upvote an issue on [GitHub](https://github.com/anthropics/anthropic-sdk-typescript).

## Usage

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

const message = await client.messages.create({
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello, Claude' }],
  model: 'claude-opus-4-6',
});

console.log(message.content);
```

## Request & Response types

This library includes TypeScript definitions for all request params and response fields. You may import and use them like so:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

const params: Anthropic.MessageCreateParams = {
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello, Claude' }],
  model: 'claude-opus-4-6',
};
const message: Anthropic.Message = await client.messages.create(params);
```

Documentation for each method, request param, and response field are available in docstrings and will appear on hover in most modern editors.

## Counting Tokens

You can see the exact usage for a given request through the `usage` response property, e.g.

```typescript
const message = await client.messages.create(...)
console.log(message.usage)
// { input_tokens: 25, output_tokens: 13 }
```

## Streaming responses

We provide support for streaming responses using Server Sent Events (SSE).

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const stream = await client.messages.create({
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello, Claude' }],
  model: 'claude-opus-4-6',
  stream: true,
});
for await (const messageStreamEvent of stream) {
  console.log(messageStreamEvent.type);
}
```

Or `break` inside the iteration loop to cancel.

## Streaming Helpers

This library provides several conveniences for streaming messages, for example:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function main() {
  const stream = anthropic.messages
    .stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: 'Say hello there!',
        },
      ],
    })
    .on('text', (text) => {
      console.log(text);
    });

  const message = await stream.finalMessage();
  console.log(message);
}

main();
```

Streaming with `client.messages.stream(...)` exposes various helpers for your convenience including event handlers and accumulation.

Alternatively, you can use `client.messages.create({ ..., stream: true })` which only returns an async iterable of the events in the stream and thus uses less memory (it does not build up a final message object for you).

## Tool Helpers

This SDK provides helpers for making it easy to create and run tools in the Messages API. You can use Zod schemas or JSON Schemas to describe the input to a tool. You can then run those tools using the `client.messages.toolRunner()` method. This method will handle passing the inputs generated by the chosen model into the right tool and passing the result back to the model.

For more details on tool use, see the [tool use overview](/docs/en/agents-and-tools/tool-use/overview).

```typescript
import Anthropic from '@anthropic-ai/sdk';

import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

const anthropic = new Anthropic();

const weatherTool = betaZodTool({
  name: 'get_weather',
  inputSchema: z.object({
    location: z.string(),
  }),
  description: 'Get the current weather in a given location',
  run: (input) => {
    return `The weather in ${input.location} is foggy and 60°F`;
  },
});

const finalMessage = await anthropic.beta.messages.toolRunner({
  model: 'claude-opus-4-6',
  max_tokens: 1000,
  messages: [{ role: 'user', content: 'What is the weather in San Francisco?' }],
  tools: [weatherTool],
});
```

## Tool use

This SDK provides support for tool use, aka function calling. More details can be found in the [tool use overview](/docs/en/agents-and-tools/tool-use/overview).

## Message Batches

This SDK provides support for the [Message Batches API](/docs/en/build-with-claude/batch-processing) under the `client.messages.batches` namespace.

### Creating a batch

Message Batches takes an array of requests, where each object has a `custom_id` identifier, and the exact same request `params` as the standard Messages API:

```typescript
await anthropic.messages.batches.create({
  requests: [
    {
      custom_id: 'my-first-request',
      params: {
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: 'Hello, world' }],
      },
    },
    {
      custom_id: 'my-second-request',
      params: {
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: 'Hi again, friend' }],
      },
    },
  ],
});
```

### Getting results from a batch

Once a Message Batch has been processed, indicated by `.processing_status === 'ended'`, you can access the results with `.batches.results()`

```typescript
const results = await anthropic.messages.batches.results(batch_id);
for await (const entry of results) {
  if (entry.result.type === 'succeeded') {
    console.log(entry.result.message.content);
  }
}
```

## File uploads

Request parameters that correspond to file uploads can be passed in many different forms:

- `File` (or an object with the same structure)
- a `fetch` `Response` (or an object with the same structure)
- an `fs.ReadStream`
- the return value of our `toFile` helper

Note that we recommend you set the content-type explicitly as the files API will not infer it for you:

```typescript
import fs from 'fs';
import Anthropic, { toFile } from '@anthropic-ai/sdk';

const client = new Anthropic();

// If you have access to Node `fs` we recommend using `fs.createReadStream()`:
await client.beta.files.upload({
  file: await toFile(fs.createReadStream('/path/to/file'), undefined, { type: 'application/json' }),
  betas: ['files-api-2025-04-14'],
});

// Or if you have the web `File` API you can pass a `File` instance:
await client.beta.files.upload({
  file: new File(['my bytes'], 'file.txt', { type: 'text/plain' }),
  betas: ['files-api-2025-04-14'],
});
// You can also pass a `fetch` `Response`:
await client.beta.files.upload({
  file: await fetch('https://somesite/file'),
  betas: ['files-api-2025-04-14'],
});

// Or a `Buffer` / `Uint8Array`
await client.beta.files.upload({
  file: await toFile(Buffer.from('my bytes'), 'file', { type: 'text/plain' }),
  betas: ['files-api-2025-04-14'],
});
await client.beta.files.upload({
  file: await toFile(new Uint8Array([0, 1, 2]), 'file', { type: 'text/plain' }),
  betas: ['files-api-2025-04-14'],
});
```

## Handling errors

When the library is unable to connect to the API,
or if the API returns a non-success status code (i.e., 4xx or 5xx response),
a subclass of `APIError` will be thrown:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const message = await client.messages
  .create({
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude' }],
    model: 'claude-opus-4-6',
  })
  .catch(async (err) => {
    if (err instanceof Anthropic.APIError) {
      console.log(err.status); // 400
      console.log(err.name); // BadRequestError
      console.log(err.headers); // {server: 'nginx', ...}
    } else {
      throw err;
    }
  });
```

Error codes are as follows:

| Status Code | Error Type                 |
| ----------- | -------------------------- |
| 400         | `BadRequestError`          |
| 401         | `AuthenticationError`      |
| 403         | `PermissionDeniedError`    |
| 404         | `NotFoundError`            |
| 422         | `UnprocessableEntityError` |
| 429         | `RateLimitError`           |
| >=500       | `InternalServerError`      |
| N/A         | `APIConnectionError`       |

## Request IDs

> For more information on debugging requests, see [these docs](/docs/en/api/errors#request-id)

All object responses in the SDK provide a `_request_id` property which is added from the `request-id` response header so that you can quickly log failing requests and report them back to Anthropic.

```typescript
const message = await client.messages.create({
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello, Claude' }],
  model: 'claude-opus-4-6',
});
console.log(message._request_id); // req_018EeWyXxfu5pfWkrYcMdjWG
```

## Retries

Certain errors will be automatically retried 2 times by default, with a short exponential backoff.
Connection errors (for example, due to a network connectivity problem), 408 Request Timeout, 409 Conflict,
429 Rate Limit, and >=500 Internal errors will all be retried by default.

You can use the `maxRetries` option to configure or disable this:

```typescript
// Configure the default for all requests:
const client = new Anthropic({
  maxRetries: 0, // default is 2
});

// Or, configure per-request:
await client.messages.create({ max_tokens: 1024, messages: [{ role: 'user', content: 'Hello, Claude' }], model: 'claude-opus-4-6' }, {
  maxRetries: 5,
});
```

## Timeouts

By default requests time out after 10 minutes. However if you have specified a large `max_tokens` value and are
_not_ streaming, the default timeout will be calculated dynamically using the formula:

```typescript
const minimum = 10 * 60;
const calculated = (60 * 60 * maxTokens) / 128_000;
return calculated < minimum ? minimum * 1000 : calculated * 1000;
```

which will result in a timeout up to 60 minutes, scaled by the `max_tokens` parameter, unless overridden at the request or client level.

You can configure this with a `timeout` option:

```typescript
// Configure the default for all requests:
const client = new Anthropic({
  timeout: 20 * 1000, // 20 seconds (default is 10 minutes)
});

// Override per-request:
await client.messages.create({ max_tokens: 1024, messages: [{ role: 'user', content: 'Hello, Claude' }], model: 'claude-opus-4-6' }, {
  timeout: 5 * 1000,
});
```

On timeout, an `APIConnectionTimeoutError` is thrown.

Note that requests which time out will be [retried twice by default](#retries).

## Long Requests

<Warning>
We highly encourage you use the streaming [Messages API](#streaming-responses) for longer running requests.
</Warning>

We do not recommend setting a large `max_tokens` values without using streaming.
Some networks may drop idle connections after a certain period of time, which
can cause the request to fail or [timeout](#timeouts) without receiving a response from Anthropic.

This SDK will also throw an error if a non-streaming request is expected to be above roughly 10 minutes long.
Passing `stream: true` or [overriding](#timeouts) the `timeout` option at the client or request level disables this error.

An expected request latency longer than the [timeout](#timeouts) for a non-streaming request
will result in the client terminating the connection and retrying without receiving a response.

When supported by the `fetch` implementation, we set a [TCP socket keep-alive](https://tldp.org/HOWTO/TCP-Keepalive-HOWTO/overview.html) option in order
to reduce the impact of idle connection timeouts on some networks.
This can be [overridden](#configuring-proxies) by configuring a custom proxy.

## Auto-pagination

List methods in the Claude API are paginated.
You can use the `for await ... of` syntax to iterate through items across all pages:

```typescript
async function fetchAllMessageBatches(params) {
  const allMessageBatches = [];
  // Automatically fetches more pages as needed.
  for await (const messageBatch of client.messages.batches.list({ limit: 20 })) {
    allMessageBatches.push(messageBatch);
  }
  return allMessageBatches;
}
```

Alternatively, you can request a single page at a time:

```typescript
let page = await client.messages.batches.list({ limit: 20 });
for (const messageBatch of page.data) {
  console.log(messageBatch);
}

// Convenience methods are provided for manually paginating:
while (page.hasNextPage()) {
  page = await page.getNextPage();
  // ...
}
```

## Default Headers

We automatically send the `anthropic-version` header set to `2023-06-01`.

If you need to, you can override it by setting default headers on a per-request basis.

Be aware that doing so may result in incorrect types and other unexpected or undefined behavior in the SDK.

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const message = await client.messages.create(
  {
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude' }],
    model: 'claude-opus-4-6',
  },
  { headers: { 'anthropic-version': 'My-Custom-Value' } },
);
```

## Advanced Usage

### Accessing raw Response data (e.g., headers)

The "raw" `Response` returned by `fetch()` can be accessed through the `.asResponse()` method on the `APIPromise` type that all methods return.
This method returns as soon as the headers for a successful response are received and does not consume the response body, so you are free to write custom parsing or streaming logic.

You can also use the `.withResponse()` method to get the raw `Response` along with the parsed data.
Unlike `.asResponse()` this method consumes the body, returning once it is parsed.

```typescript
const client = new Anthropic();

const response = await client.messages
  .create({
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude' }],
    model: 'claude-opus-4-6',
  })
  .asResponse();
console.log(response.headers.get('X-My-Header'));
console.log(response.statusText); // access the underlying Response object

const { data: message, response: raw } = await client.messages
  .create({
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude' }],
    model: 'claude-opus-4-6',
  })
  .withResponse();
console.log(raw.headers.get('X-My-Header'));
console.log(message.content);
```

### Logging

<Warning>
All log messages are intended for debugging only. The format and content of log messages
may change between releases.
</Warning>

#### Log levels

The log level can be configured in two ways:

1. Via the `ANTHROPIC_LOG` environment variable
2. Using the `logLevel` client option (overrides the environment variable if set)

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  logLevel: 'debug', // Show all log messages
});
```

Available log levels, from most to least verbose:

- `'debug'` - Show debug messages, info, warnings, and errors
- `'info'` - Show info messages, warnings, and errors
- `'warn'` - Show warnings and errors (default)
- `'error'` - Show only errors
- `'off'` - Disable all logging

At the `'debug'` level, all HTTP requests and responses are logged, including headers and bodies.
Some authentication-related headers are redacted, but sensitive data in request and response bodies
may still be visible.

#### Custom logger

By default, this library logs to `globalThis.console`. You can also provide a custom logger.
Most logging libraries are supported, including [pino](https://www.npmjs.com/package/pino), [winston](https://www.npmjs.com/package/winston), [bunyan](https://www.npmjs.com/package/bunyan), [consola](https://www.npmjs.com/package/consola), [signale](https://www.npmjs.com/package/signale), and [@std/log](https://jsr.io/@std/log). If your logger doesn't work, please open an issue.

When providing a custom logger, the `logLevel` option still controls which messages are emitted, messages
below the configured level will not be sent to your logger.

```typescript
import Anthropic from '@anthropic-ai/sdk';
import pino from 'pino';

const logger = pino();

const client = new Anthropic({
  logger: logger.child({ name: 'Anthropic' }),
  logLevel: 'debug', // Send all messages to pino, allowing it to filter
});
```

### Making custom/undocumented requests

This library is typed for convenient access to the documented API. If you need to access undocumented
endpoints, params, or response properties, the library can still be used.

#### Undocumented endpoints

To make requests to undocumented endpoints, you can use `client.get`, `client.post`, and other HTTP verbs.
Options on the client, such as retries, will be respected when making these requests.

```typescript
await client.post('/some/path', {
  body: { some_prop: 'foo' },
  query: { some_query_arg: 'bar' },
});
```

#### Undocumented request params

To make requests using undocumented parameters, you may use `// @ts-expect-error` on the undocumented
parameter. This library doesn't validate at runtime that the request matches the type, so any extra values you
send will be sent as-is.

```typescript
client.messages.create({
  // ...
  // @ts-expect-error baz is not yet public
  baz: 'undocumented option',
});
```

For requests with the `GET` verb, any extra params will be in the query, all other requests will send the
extra param in the body.

If you want to explicitly send an extra argument, you can do so with the `query`, `body`, and `headers` request
options.

#### Undocumented response properties

To access undocumented response properties, you may access the response object with `// @ts-expect-error` on
the response object, or cast the response object to the requisite type. Like the request params, we do not
validate or strip extra properties from the response from the API.

### Customizing the fetch client

By default, this library expects a global `fetch` function is defined.

If you want to use a different `fetch` function, you can either polyfill the global:

```typescript
import fetch from 'my-fetch';

globalThis.fetch = fetch;
```

Or pass it to the client:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'my-fetch';

const client = new Anthropic({ fetch });
```

### Fetch options

If you want to set custom `fetch` options without overriding the `fetch` function, you can provide a `fetchOptions` object when instantiating the client or making a request. (Request-specific options override client options.)

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  fetchOptions: {
    // `RequestInit` options
  },
});
```

### Configuring proxies

To modify proxy behavior, you can provide custom `fetchOptions` that add runtime-specific proxy
options to requests:

<Tabs>
<Tab title="Node.js">
```typescript
import Anthropic from '@anthropic-ai/sdk';
import * as undici from 'undici';

const proxyAgent = new undici.ProxyAgent('http://localhost:8888');
const client = new Anthropic({
  fetchOptions: {
    dispatcher: proxyAgent,
  },
});
```
</Tab>
<Tab title="Bun">
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  fetchOptions: {
    proxy: 'http://localhost:8888',
  },
});
```
</Tab>
<Tab title="Deno">
```typescript
import Anthropic from 'npm:@anthropic-ai/sdk';

const httpClient = Deno.createHttpClient({ proxy: { url: 'http://localhost:8888' } });
const client = new Anthropic({
  fetchOptions: {
    client: httpClient,
  },
});
```
</Tab>
</Tabs>

## Beta Features

We introduce beta features before they are generally available to get early feedback and test new functionality. You can check the availability of all of Claude's capabilities and tools in the [build with Claude overview](/docs/en/build-with-claude/overview).

You can access most beta API features through the beta property of the client. To enable a particular beta feature, you need to add the appropriate [beta header](/docs/en/api/beta-headers) to the `betas` field when creating a message.

For example, to use code execution:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();
const response = await client.beta.messages.create({
  max_tokens: 1024,
  model: 'claude-opus-4-6',
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: "What's 4242424242 * 4242424242?.",
        },
      ],
    },
  ],
  tools: [
    {
      name: 'code_execution',
      type: 'code_execution_20250522',
    },
  ],
  betas: ['code-execution-2025-05-22'],
});
```

## Runtime support

<section title="Browser usage">

Enabling the `dangerouslyAllowBrowser` option can be dangerous because it exposes your secret API credentials in the client-side code. Web browsers are inherently less secure than server environments, any user with access to the browser can potentially inspect, extract, and misuse these credentials. This could lead to unauthorized access using your credentials and potentially compromise sensitive data or functionality.

**When might this not be dangerous?**

In certain scenarios where enabling browser support might not pose significant risks:

- **Internal Tools:** If the application is used solely within a controlled internal environment where the users are trusted, the risk of credential exposure can be mitigated.
- **Development or debugging purpose:** Enabling this feature temporarily might be acceptable, provided the credentials are short-lived, aren't also used in production environments, or are frequently rotated.

</section>

## Platform integrations

<Note>
For detailed platform setup guides, see:
- [Amazon Bedrock](/docs/en/build-with-claude/claude-on-amazon-bedrock)
- [Google Vertex AI](/docs/en/build-with-claude/claude-on-vertex-ai)
- [Microsoft Azure / Foundry](/docs/en/build-with-claude/claude-in-microsoft-foundry)
</Note>

### Amazon Bedrock

We provide support for the [Anthropic Bedrock API](https://aws.amazon.com/bedrock/claude/) through a separate package.

```bash
npm install @anthropic-ai/bedrock-sdk
```

```typescript
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';

const client = new AnthropicBedrock();

const message = await client.messages.create({
  model: 'anthropic.claude-opus-4-6-v1',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello, Claude' }],
});
```

### Google Vertex AI

We provide support for the [Anthropic Vertex AI API](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude) through a separate package.

```bash
npm install @anthropic-ai/vertex-sdk
```

```typescript
import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';

const client = new AnthropicVertex();

const message = await client.messages.create({
  model: 'claude-opus-4-6',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello, Claude' }],
});
```

### Microsoft Azure / Foundry

For information on using Claude through Microsoft Azure and Azure AI Foundry, see [Claude in Microsoft Foundry](/docs/en/build-with-claude/claude-in-microsoft-foundry).

## Frequently Asked Questions

See the [GitHub repository](https://github.com/anthropics/anthropic-sdk-typescript) for FAQs, issues, and community support.

## Additional resources

- [GitHub repository](https://github.com/anthropics/anthropic-sdk-typescript)
- [API reference](/docs/en/api/overview)
- [Streaming guide](/docs/en/build-with-claude/streaming)
- [Tool use guide](/docs/en/agents-and-tools/tool-use/overview)





# Java SDK

Install and configure the Anthropic Java SDK with builder patterns and async support

---

The Anthropic Java SDK provides convenient access to the Anthropic REST API from applications written in Java. It uses the builder pattern for creating requests and supports both synchronous and asynchronous operations.

<Info>
For API feature documentation with code examples, see the [API reference](/docs/en/api/overview). This page covers Java-specific SDK features and configuration.
</Info>

## Installation

<Tabs>
<Tab title="Gradle">
```kotlin
implementation("com.anthropic:anthropic-java:2.11.1")
```
</Tab>
<Tab title="Maven">
```xml
<dependency>
    <groupId>com.anthropic</groupId>
    <artifactId>anthropic-java</artifactId>
    <version>2.11.1</version>
</dependency>
```
</Tab>
</Tabs>

## Requirements

This library requires Java 8 or later.

## Quick start

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Model;

// Configures using the `ANTHROPIC_API_KEY` environment variable
AnthropicClient client = AnthropicOkHttpClient.fromEnv();

MessageCreateParams params = MessageCreateParams.builder()
    .maxTokens(1024L)
    .addUserMessage("Hello, Claude")
    .model(Model.CLAUDE_OPUS_4_6)
    .build();
Message message = client.messages().create(params);
```

## Client configuration

### API key setup

Configure the client using system properties or environment variables:

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;

// Configures using the `anthropic.apiKey`, `anthropic.authToken` and `anthropic.baseUrl` system properties
// Or configures using the `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_BASE_URL` environment variables
AnthropicClient client = AnthropicOkHttpClient.fromEnv();
```

Or configure manually:

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;

AnthropicClient client = AnthropicOkHttpClient.builder()
    .apiKey("my-anthropic-api-key")
    .build();
```

Or use a combination of both approaches:

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;

AnthropicClient client = AnthropicOkHttpClient.builder()
    // Configures using system properties or environment variables
    .fromEnv()
    .apiKey("my-anthropic-api-key")
    .build();
```

### Configuration options

| Setter      | System property       | Environment variable   | Required | Default value                 |
| ----------- | --------------------- | ---------------------- | -------- | ----------------------------- |
| `apiKey`    | `anthropic.apiKey`    | `ANTHROPIC_API_KEY`    | false    | -                             |
| `authToken` | `anthropic.authToken` | `ANTHROPIC_AUTH_TOKEN` | false    | -                             |
| `baseUrl`   | `anthropic.baseUrl`   | `ANTHROPIC_BASE_URL`   | true     | `"https://api.anthropic.com"` |

System properties take precedence over environment variables.

<Tip>
Don't create more than one client in the same application. Each client has a connection pool and thread pools, which are more efficient to share between requests.
</Tip>

### Modifying configuration

To temporarily use a modified client configuration while reusing the same connection and thread pools, call `withOptions()` on any client or service:

```java
import com.anthropic.client.AnthropicClient;

AnthropicClient clientWithOptions = client.withOptions(optionsBuilder -> {
    optionsBuilder.baseUrl("https://example.com");
    optionsBuilder.maxRetries(42);
});
```

The `withOptions()` method does not affect the original client or service.

## Async usage

The default client is synchronous. To switch to asynchronous execution, call the `async()` method:

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Model;
import java.util.concurrent.CompletableFuture;

AnthropicClient client = AnthropicOkHttpClient.fromEnv();

MessageCreateParams params = MessageCreateParams.builder()
    .maxTokens(1024L)
    .addUserMessage("Hello, Claude")
    .model(Model.CLAUDE_OPUS_4_6)
    .build();
CompletableFuture<Message> message = client.async().messages().create(params);
```

Or create an asynchronous client from the beginning:

```java
import com.anthropic.client.AnthropicClientAsync;
import com.anthropic.client.okhttp.AnthropicOkHttpClientAsync;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Model;
import java.util.concurrent.CompletableFuture;

AnthropicClientAsync client = AnthropicOkHttpClientAsync.fromEnv();

MessageCreateParams params = MessageCreateParams.builder()
    .maxTokens(1024L)
    .addUserMessage("Hello, Claude")
    .model(Model.CLAUDE_OPUS_4_6)
    .build();
CompletableFuture<Message> message = client.messages().create(params);
```

The asynchronous client supports the same options as the synchronous one, except most methods return `CompletableFuture`s.

## Streaming

The SDK defines methods that return response "chunk" streams, where each chunk can be individually processed as soon as it arrives instead of waiting on the full response.

### Synchronous streaming

These streaming methods return `StreamResponse` for synchronous clients:

```java
import com.anthropic.core.http.StreamResponse;
import com.anthropic.models.messages.RawMessageStreamEvent;

try (StreamResponse<RawMessageStreamEvent> streamResponse = client.messages().createStreaming(params)) {
    streamResponse.stream().forEach(chunk -> {
        System.out.println(chunk);
    });
    System.out.println("No more chunks!");
}
```

### Asynchronous streaming

For asynchronous clients, the method returns `AsyncStreamResponse`:

```java
import com.anthropic.core.http.AsyncStreamResponse;
import com.anthropic.models.messages.RawMessageStreamEvent;
import java.util.Optional;

client.async().messages().createStreaming(params).subscribe(chunk -> {
    System.out.println(chunk);
});

// If you need to handle errors or completion of the stream
client.async().messages().createStreaming(params).subscribe(new AsyncStreamResponse.Handler<>() {
    @Override
    public void onNext(RawMessageStreamEvent chunk) {
        System.out.println(chunk);
    }

    @Override
    public void onComplete(Optional<Throwable> error) {
        if (error.isPresent()) {
            System.out.println("Something went wrong!");
            throw new RuntimeException(error.get());
        } else {
            System.out.println("No more chunks!");
        }
    }
});

// Or use futures
client.async().messages().createStreaming(params)
    .subscribe(chunk -> {
        System.out.println(chunk);
    })
    .onCompleteFuture()
    .whenComplete((unused, error) -> {
        if (error != null) {
            System.out.println("Something went wrong!");
            throw new RuntimeException(error);
        } else {
            System.out.println("No more chunks!");
        }
    });
```

Async streaming uses a dedicated per-client cached thread pool `Executor` to stream without blocking the current thread. To use a different `Executor`:

```java
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

Executor executor = Executors.newFixedThreadPool(4);
client.async().messages().createStreaming(params).subscribe(
    chunk -> System.out.println(chunk), executor
);
```

Or configure the client globally using the `streamHandlerExecutor` method:

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import java.util.concurrent.Executors;

AnthropicClient client = AnthropicOkHttpClient.builder()
    .fromEnv()
    .streamHandlerExecutor(Executors.newFixedThreadPool(4))
    .build();
```

### Streaming with message accumulator

A `MessageAccumulator` can record the stream of events in the response as they are processed and accumulate a `Message` object similar to what would have been returned by the non-streaming API.

For a synchronous response, add a `Stream.peek()` call to the stream pipeline to accumulate each event:

```java
import com.anthropic.core.http.StreamResponse;
import com.anthropic.helpers.MessageAccumulator;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.RawMessageStreamEvent;

MessageAccumulator messageAccumulator = MessageAccumulator.create();

try (StreamResponse<RawMessageStreamEvent> streamResponse =
         client.messages().createStreaming(createParams)) {
    streamResponse.stream()
            .peek(messageAccumulator::accumulate)
            .flatMap(event -> event.contentBlockDelta().stream())
            .flatMap(deltaEvent -> deltaEvent.delta().text().stream())
            .forEach(textDelta -> System.out.print(textDelta.text()));
}

Message message = messageAccumulator.message();
```

For an asynchronous response, add the `MessageAccumulator` to the `subscribe()` call:

```java
import com.anthropic.helpers.MessageAccumulator;
import com.anthropic.models.messages.Message;

MessageAccumulator messageAccumulator = MessageAccumulator.create();

client.messages()
        .createStreaming(createParams)
        .subscribe(event -> messageAccumulator.accumulate(event).contentBlockDelta().stream()
                .flatMap(deltaEvent -> deltaEvent.delta().text().stream())
                .forEach(textDelta -> System.out.print(textDelta.text())))
        .onCompleteFuture()
        .join();

Message message = messageAccumulator.message();
```

A `BetaMessageAccumulator` is also available for the accumulation of a `BetaMessage` object. It is used in the same manner as the `MessageAccumulator`.

## Structured outputs

[Structured Outputs](/docs/en/build-with-claude/structured-outputs) (beta) ensures that the model generates responses that adhere to a supplied JSON schema.

A JSON schema can be derived automatically from the structure of an arbitrary Java class. The JSON content from the response will then be converted automatically to an instance of that class.

### Defining classes

Java classes can contain fields declared to be instances of other classes and can use collections:

```java
class Person {
    public String name;
    public int birthYear;
}

class Book {
    public String title;
    public Person author;
    public int publicationYear;
}

class BookList {
    public List<Book> books;
}
```

### Using structured outputs

Pass the top-level class to `outputConfig(Class<T>)` when building the parameters and then access an instance from the generated message content in the response:

```java
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.anthropic.models.beta.messages.StructuredMessageCreateParams;
import com.anthropic.models.messages.Model;

StructuredMessageCreateParams<BookList> createParams = MessageCreateParams.builder()
        .model(Model.CLAUDE_OPUS_4_6)
        .maxTokens(2048)
        .outputConfig(BookList.class)
        .addUserMessage("List some famous late twentieth century novels.")
        .build();

client.beta().messages().create(createParams).content().stream()
        .flatMap(contentBlock -> contentBlock.text().stream())
        .flatMap(textBlock -> textBlock.text().books.stream())
        .forEach(book -> System.out.println(book.title + " by " + book.author.name));
```

### Optional fields

If a field is optional and does not require a defined value, you can represent this using `java.util.Optional`. It is up to the AI model to decide whether to provide a value for that field or leave it empty.

```java
import java.util.Optional;

class Book {
    public String title;
    public Person author;
    public int publicationYear;
    public Optional<String> isbn;
}
```

<Warning>
Generic type information for fields is retained in the class's metadata, but generic type erasure applies in other scopes. While a JSON schema can be derived from a `BookList.books` field with type `List<Book>`, a valid JSON schema cannot be derived from a local variable of that same type.
</Warning>

If an error occurs while converting a JSON response to a Java class instance, the error message will include the JSON response to assist in diagnosis. If your JSON response may contain sensitive information, avoid logging it directly, or ensure that you redact any sensitive details from the error message.

### Local JSON schema validation

Structured Outputs supports a [subset of the JSON Schema language](/docs/en/build-with-claude/structured-outputs#json-schema-limitations). Schemas are generated automatically from classes to align with this subset. The method `outputConfig(Class<T>)` performs a validation check on the schema derived from the specified class.

Key points:

- **Local validation**: The validation process occurs locally, meaning no requests are sent to the remote AI model.
- **Remote validation**: The remote AI model will conduct its own validation upon receiving the JSON schema in the request.
- **Version compatibility**: There may be instances where local validation fails while remote validation succeeds if the SDK version is outdated.
- **Disabling local validation**: If you encounter compatibility issues, you can disable local validation by passing `JsonSchemaLocalValidation.NO`:

```java
import com.anthropic.core.JsonSchemaLocalValidation;
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.anthropic.models.beta.messages.StructuredMessageCreateParams;
import com.anthropic.models.messages.Model;

StructuredMessageCreateParams<BookList> createParams = MessageCreateParams.builder()
        .model(Model.CLAUDE_OPUS_4_6)
        .maxTokens(2048)
        .outputConfig(BookList.class, JsonSchemaLocalValidation.NO)
        .addUserMessage("List some famous late twentieth century novels.")
        .build();
```

### Structured outputs with streaming

Structured outputs can also be used with streaming. As responses are returned in "stream events", the full response must first be accumulated to concatenate the JSON strings that can then be converted into instances of the arbitrary Java class.

Use the `BetaMessageAccumulator` as described in [Streaming with message accumulator](#streaming-with-message-accumulator) to accumulate the JSON strings. Once accumulated, use `BetaMessageAccumulator.message(Class<T>)` to convert the accumulated `BetaMessage` into a `StructuredMessage`, which can then automatically deserialize the JSON strings into instances of your Java class.

### Defining JSON schema properties

When a JSON schema is derived from your Java classes, all properties represented by `public` fields or `public` getter methods are included in the schema by default. Non-`public` fields and getter methods are not included by default.

You can exclude `public`, or include non-`public` fields or getter methods, by using the `@JsonIgnore` or `@JsonProperty` annotations respectively.

If you do not want to define `public` fields, you can define `private` fields and corresponding `public` getter methods. For example, a `private` field `myValue` with a `public` getter method `getMyValue()` will result in a `"myValue"` property being included in the JSON schema.

Each of your classes must define at least one property to be included in the JSON schema. A validation error will occur if any class contains no fields or getter methods from which schema properties can be derived.

### Annotating classes and JSON schemas

You can use annotations to add further information to the JSON schema derived from your Java classes. The SDK supports the use of Jackson Databind annotations:

```java
import com.fasterxml.jackson.annotation.JsonClassDescription;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;

class Person {
    @JsonPropertyDescription("The first name and surname of the person")
    public String name;
    public int birthYear;
    @JsonPropertyDescription("The year the person died, or 'present' if the person is living.")
    public String deathYear;
}

@JsonClassDescription("The details of one published book")
class Book {
    public String title;
    public Person author;
    @JsonPropertyDescription("The year in which the book was first published.")
    public int publicationYear;
    @JsonIgnore public String genre;
}

class BookList {
    public List<Book> books;
}
```

Annotation summary:

- `@JsonClassDescription` - Add a detailed description to a class.
- `@JsonPropertyDescription` - Add a detailed description to a field or getter method.
- `@JsonIgnore` - Exclude a `public` field or getter method from the generated JSON schema.
- `@JsonProperty` - Include a non-`public` field or getter method in the generated JSON schema.

If you use `@JsonProperty(required = false)`, the `false` value will be ignored. Anthropic JSON schemas must mark all properties as required.

You can also use OpenAPI Swagger 2 `@Schema` and `@ArraySchema` annotations for type-specific constraints:

```java
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.ArraySchema;

class Article {
    @ArraySchema(minItems = 1)
    public List<String> authors;

    public String title;

    @Schema(format = "date")
    public String publicationDate;

    @Schema(minimum = "1")
    public int pageCount;
}
```

If you use both Jackson and Swagger annotations to set the same schema field, the Jackson annotation will take precedence.

## Tool use

[Tool Use](/docs/en/agents-and-tools/tool-use/overview) lets you integrate external tools and functions directly into the AI model's responses. You define JSON schemas for tools, and the model uses the schemas to decide when and how to use these tools.

The SDK can derive a tool and its parameters automatically from the structure of an arbitrary Java class: the class's name (converted to snake case) provides the tool name, and the class's fields define the tool's parameters.

### Defining tools with annotations

```java
import com.fasterxml.jackson.annotation.JsonClassDescription;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;

enum Unit {
  CELSIUS, FAHRENHEIT;

  public String toString() {
    switch (this) {
      case CELSIUS: return "C";
      case FAHRENHEIT: default: return "F";
    }
  }

  public double fromKelvin(double temperatureK) {
    switch (this) {
      case CELSIUS: return temperatureK - 273.15;
      case FAHRENHEIT: default: return (temperatureK - 273.15) * 1.8 + 32.0;
    }
  }
}

@JsonClassDescription("Get the weather in a given location")
static class GetWeather {
  @JsonPropertyDescription("The city and state, e.g. San Francisco, CA")
  public String location;

  @JsonPropertyDescription("The unit of temperature")
  public Unit unit;

  public Weather execute() {
    double temperatureK;
    switch (location) {
      case "San Francisco, CA": temperatureK = 300.0; break;
      case "New York, NY": temperatureK = 310.0; break;
      case "Dallas, TX": temperatureK = 305.0; break;
      default: temperatureK = 295; break;
    }
    return new Weather(String.format("%.0f%s", unit.fromKelvin(temperatureK), unit));
  }
}

static class Weather {
  public String temperature;

  public Weather(String temperature) {
    this.temperature = temperature;
  }
}
```

### Calling tools

When your tool classes are defined, add them to the message parameters using `MessageCreateParams.addTool(Class<T>)` and then call them if requested to do so in the AI model's response. `BetaToolUseBlock.input(Class<T>)` can be used to parse a tool's parameters in JSON form to an instance of your tool-defining class.

After invoking the tool, use `BetaToolResultBlockParam.Builder.contentAsJson(Object)` to pass the tool's result back to the AI model:

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.beta.messages.*;
import com.anthropic.models.messages.Model;
import java.util.List;

AnthropicClient client = AnthropicOkHttpClient.fromEnv();

MessageCreateParams.Builder createParamsBuilder = MessageCreateParams.builder()
        .model(Model.CLAUDE_OPUS_4_6)
        .maxTokens(2048)
        .addTool(GetWeather.class)
        .addUserMessage("What's the temperature in New York?");

client.beta().messages().create(createParamsBuilder.build()).content().stream()
        .flatMap(contentBlock -> contentBlock.toolUse().stream())
        .forEach(toolUseBlock -> createParamsBuilder
              // Add a message indicating that the tool use was requested.
              .addAssistantMessageOfBetaContentBlockParams(
                      List.of(BetaContentBlockParam.ofToolUse(BetaToolUseBlockParam.builder()
                              .name(toolUseBlock.name())
                              .id(toolUseBlock.id())
                              .input(toolUseBlock._input())
                              .build())))
              // Add a message with the result of the requested tool use.
              .addUserMessageOfBetaContentBlockParams(
                      List.of(BetaContentBlockParam.ofToolResult(BetaToolResultBlockParam.builder()
                              .toolUseId(toolUseBlock.id())
                              .contentAsJson(callTool(toolUseBlock))
                              .build()))));

client.beta().messages().create(createParamsBuilder.build()).content().stream()
        .flatMap(contentBlock -> contentBlock.text().stream())
        .forEach(textBlock -> System.out.println(textBlock.text()));

private static Object callTool(BetaToolUseBlock toolUseBlock) {
  if (!"get_weather".equals(toolUseBlock.name())) {
    throw new IllegalArgumentException("Unknown tool: " + toolUseBlock.name());
  }

  GetWeather tool = toolUseBlock.input(GetWeather.class);
  return tool != null ? tool.execute() : new Weather("unknown");
}
```

### Tool name conversion

Tool names are derived from the camel case tool class names (e.g., `GetWeather`) and converted to snake case (e.g., `get_weather`). Word boundaries begin where the current character is not the first character, is upper-case, and either the preceding character is lower-case, or the following character is lower-case. For example, `MyJSONParser` becomes `my_json_parser` and `ParseJSON` becomes `parse_json`. This conversion can be overridden using the `@JsonTypeName` annotation.

### Local tool JSON schema validation

Like for structured outputs, you can perform local validation to check that the JSON schema derived from your tool class respects Anthropic's restrictions. Local validation is enabled by default, but it can be disabled:

```java
MessageCreateParams.Builder createParamsBuilder = MessageCreateParams.builder()
        .model(Model.CLAUDE_OPUS_4_6)
        .maxTokens(2048)
        .addTool(GetWeather.class, JsonSchemaLocalValidation.NO)
        .addUserMessage("What's the temperature in New York?");
```

### Annotating tool classes

You can use annotations to add further information about tools to the JSON schemas:

- `@JsonClassDescription` - Add a description to a tool class detailing when and how to use that tool.
- `@JsonTypeName` - Set the tool name to something other than the simple name of the class converted to snake case.
- `@JsonPropertyDescription` - Add a detailed description to a tool parameter.
- `@JsonIgnore` - Exclude a `public` field or getter method from the generated JSON schema for a tool's parameters.
- `@JsonProperty` - Include a non-`public` field or getter method in the generated JSON schema for a tool's parameters.

## Message batches

The SDK provides support for the [Message Batches API](/docs/en/build-with-claude/batch-processing) under the `client.messages().batches()` namespace. See the [pagination section](#pagination) for how to iterate through batch results.

## File uploads

The SDK defines methods that accept files through the `MultipartField` interface:

```java
import com.anthropic.core.MultipartField;
import com.anthropic.models.beta.files.FileMetadata;
import com.anthropic.models.beta.files.FileUploadParams;
import com.anthropic.models.beta.AnthropicBeta;
import java.io.InputStream;
import java.nio.file.Paths;

FileUploadParams params = FileUploadParams.builder()
    .file(MultipartField.<InputStream>builder()
        .value(Files.newInputStream(Paths.get("/path/to/file.pdf")))
        .contentType("application/pdf")
        .build())
    .addBeta(AnthropicBeta.FILES_API_2025_04_14)
    .build();
FileMetadata fileMetadata = client.beta().files().upload(params);
```

Or from an `InputStream`:

```java
import com.anthropic.core.MultipartField;
import com.anthropic.models.beta.files.FileMetadata;
import com.anthropic.models.beta.files.FileUploadParams;
import com.anthropic.models.beta.AnthropicBeta;
import java.io.InputStream;
import java.net.URL;

FileUploadParams params = FileUploadParams.builder()
    .file(MultipartField.<InputStream>builder()
        .value(new URL("https://example.com/path/to/file").openStream())
        .filename("document.pdf")
        .contentType("application/pdf")
        .build())
    .addBeta(AnthropicBeta.FILES_API_2025_04_14)
    .build();
FileMetadata fileMetadata = client.beta().files().upload(params);
```

Or a `byte[]` array:

```java
import com.anthropic.core.MultipartField;
import com.anthropic.models.beta.files.FileMetadata;
import com.anthropic.models.beta.files.FileUploadParams;
import com.anthropic.models.beta.AnthropicBeta;

FileUploadParams params = FileUploadParams.builder()
    .file(MultipartField.<byte[]>builder()
        .value("content".getBytes())
        .filename("document.txt")
        .contentType("text/plain")
        .build())
    .addBeta(AnthropicBeta.FILES_API_2025_04_14)
    .build();
FileMetadata fileMetadata = client.beta().files().upload(params);
```

### Binary responses

The SDK defines methods that return binary responses for API responses that aren't necessarily parsed as JSON:

```java
import com.anthropic.core.http.HttpResponse;
import com.anthropic.models.beta.files.FileDownloadParams;

HttpResponse response = client.beta().files().download("file_id");
```

To save the response content to a file:

```java
import com.anthropic.core.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

try (HttpResponse response = client.beta().files().download(params)) {
    Files.copy(
        response.body(),
        Paths.get(path),
        StandardCopyOption.REPLACE_EXISTING
    );
} catch (Exception e) {
    System.out.println("Something went wrong!");
    throw new RuntimeException(e);
}
```

Or transfer the response content to any `OutputStream`:

```java
import com.anthropic.core.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Paths;

try (HttpResponse response = client.beta().files().download(params)) {
    response.body().transferTo(Files.newOutputStream(Paths.get(path)));
} catch (Exception e) {
    System.out.println("Something went wrong!");
    throw new RuntimeException(e);
}
```

## Error handling

The SDK throws custom unchecked exception types:

- `AnthropicServiceException` - Base class for HTTP errors.
- `AnthropicIoException` - I/O networking errors.
- `AnthropicRetryableException` - Generic error indicating a failure that could be retried.
- `AnthropicInvalidDataException` - Failure to interpret successfully parsed data (e.g., when accessing a property that's supposed to be required, but the API unexpectedly omitted it).
- `AnthropicException` - Base class for all exceptions.

### Status code mapping

| Status | Exception |
| ------ | --------- |
| 400    | `BadRequestException` |
| 401    | `UnauthorizedException` |
| 403    | `PermissionDeniedException` |
| 404    | `NotFoundException` |
| 422    | `UnprocessableEntityException` |
| 429    | `RateLimitException` |
| 5xx    | `InternalServerException` |
| others | `UnexpectedStatusCodeException` |

`SseException` is thrown for errors encountered during SSE streaming after a successful initial HTTP response.

```java
import com.anthropic.errors.*;

try {
    Message message = client.messages().create(params);
} catch (RateLimitException e) {
    System.out.println("Rate limited, retry after: " + e.headers());
} catch (UnauthorizedException e) {
    System.out.println("Invalid API key");
} catch (AnthropicServiceException e) {
    System.out.println("API error: " + e.statusCode());
} catch (AnthropicIoException e) {
    System.out.println("Network error: " + e.getMessage());
}
```

## Request IDs

When using raw responses, you can access the `request-id` response header using the `requestId()` method:

```java
import com.anthropic.core.http.HttpResponseFor;
import com.anthropic.models.messages.Message;
import java.util.Optional;

HttpResponseFor<Message> message = client.messages().withRawResponse().create(params);
Optional<String> requestId = message.requestId();
```

This can be used to quickly log failing requests and report them back to Anthropic. For more information on debugging requests, see the [API error documentation](/docs/en/api/errors#request-id).

## Retries

The SDK automatically retries 2 times by default, with a short exponential backoff between requests.

Only the following error types are retried:

- Connection errors (for example, due to a network connectivity problem)
- 408 Request Timeout
- 409 Conflict
- 429 Rate Limit
- 5xx Internal

The API may also explicitly instruct the SDK to retry or not retry a request.

To set a custom number of retries, configure the client using the `maxRetries` method:

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;

AnthropicClient client = AnthropicOkHttpClient.builder()
    .fromEnv()
    .maxRetries(4)
    .build();
```

## Timeouts

Requests time out after 10 minutes by default.

However, for methods that accept `maxTokens`, if you specify a large `maxTokens` value and are not streaming, then the default timeout will be calculated dynamically using this formula:

```java
Duration.ofSeconds(
    Math.min(
        60 * 60, // 1 hour max
        Math.max(
            10 * 60, // 10 minute minimum
            60 * 60 * maxTokens / 128_000
        )
    )
)
```

This results in a timeout of up to 60 minutes, scaled by the `maxTokens` parameter, unless overridden.

To set a custom timeout per-request:

```java
import com.anthropic.models.messages.Message;

Message message = client.messages().create(
  params, RequestOptions.builder().timeout(Duration.ofSeconds(30)).build()
);
```

Or configure the default for all method calls at the client level:

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import java.time.Duration;

AnthropicClient client = AnthropicOkHttpClient.builder()
    .fromEnv()
    .timeout(Duration.ofSeconds(30))
    .build();
```

## Long requests

<Warning>
We highly encourage you to use [streaming](#streaming) for longer running requests.
</Warning>

We do not recommend setting a large `maxTokens` value without using streaming. Some networks may drop idle connections after a certain period of time, which can cause the request to fail or [timeout](#timeouts) without receiving a response from Anthropic. The SDK periodically pings the API to keep the connection alive and reduce the impact of these networks.

The SDK throws an error if a non-streaming request is expected to take longer than 10 minutes. Using a [streaming method](#streaming) or [overriding the timeout](#timeouts) at the client or request level disables the error.

## Pagination

The SDK provides convenient ways to access paginated results either one page at a time or item-by-item across all pages.

### Auto-pagination

To iterate through all results across all pages, use the `autoPager()` method, which automatically fetches more pages as needed.

```java
import com.anthropic.models.messages.batches.BatchListPage;
import com.anthropic.models.messages.batches.MessageBatch;

BatchListPage page = client.messages().batches().list();

// Process as an Iterable
for (MessageBatch batch : page.autoPager()) {
    System.out.println(batch);
}

// Process as a Stream
page.autoPager()
    .stream()
    .limit(50)
    .forEach(batch -> System.out.println(batch));
```

When using the asynchronous client, the method returns an `AsyncStreamResponse`:

```java
import com.anthropic.core.http.AsyncStreamResponse;
import com.anthropic.models.messages.batches.BatchListPageAsync;
import com.anthropic.models.messages.batches.MessageBatch;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

CompletableFuture<BatchListPageAsync> pageFuture = client.async().messages().batches().list();

pageFuture.thenAccept(page -> page.autoPager().subscribe(batch -> {
    System.out.println(batch);
}));
```

### Manual pagination

To access individual page items and manually request the next page:

```java
import com.anthropic.models.messages.batches.BatchListPage;
import com.anthropic.models.messages.batches.MessageBatch;

BatchListPage page = client.messages().batches().list();
while (true) {
    for (MessageBatch batch : page.items()) {
        System.out.println(batch);
    }

    if (!page.hasNextPage()) {
        break;
    }

    page = page.nextPage();
}
```

## Type system

### Immutability and builders

Each class in the SDK has an associated builder for constructing it. Each class is immutable once constructed. If the class has an associated builder, then it has a `toBuilder()` method, which can be used to convert it back to a builder for making a modified copy.

```java
MessageCreateParams params = MessageCreateParams.builder()
    .maxTokens(1024L)
    .addUserMessage("Hello, Claude")
    .model(Model.CLAUDE_OPUS_4_6)
    .build();

// Create a modified copy using toBuilder()
MessageCreateParams modified = params.toBuilder()
    .maxTokens(2048L)
    .build();
```

Because each class is immutable, builder modification will never affect already built class instances.

### Requests and responses

To send a request to the Claude API, build an instance of some `Params` class and pass it to the corresponding client method. When the response is received, it will be deserialized into an instance of a Java class.

For example, `client.messages().create(...)` should be called with an instance of `MessageCreateParams`, and it will return an instance of `Message`.

### Undocumented parameters

To set undocumented parameters, call the `putAdditionalHeader`, `putAdditionalQueryParam`, or `putAdditionalBodyProperty` methods on any `Params` class:

```java
import com.anthropic.core.JsonValue;
import com.anthropic.models.messages.MessageCreateParams;

MessageCreateParams params = MessageCreateParams.builder()
    .putAdditionalHeader("Secret-Header", "42")
    .putAdditionalQueryParam("secret_query_param", "42")
    .putAdditionalBodyProperty("secretProperty", JsonValue.from("42"))
    .build();
```

<Warning>
The values passed to these methods overwrite values passed to earlier methods. For security reasons, ensure these methods are only used with trusted input data.
</Warning>

To set undocumented parameters on nested headers, query params, or body classes:

```java
import com.anthropic.core.JsonValue;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Metadata;

MessageCreateParams params = MessageCreateParams.builder()
    .metadata(Metadata.builder()
        .putAdditionalProperty("secretProperty", JsonValue.from("42"))
        .build())
    .build();
```

To set a documented parameter or property to an undocumented or not yet supported value, pass a `JsonValue` object to its setter:

```java
import com.anthropic.core.JsonValue;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Model;

MessageCreateParams params = MessageCreateParams.builder()
    .maxTokens(JsonValue.from(3.14))
    .addUserMessage("Hello, Claude")
    .model(Model.CLAUDE_OPUS_4_6)
    .build();
```

### JsonValue creation

The most straightforward way to create a `JsonValue` is using its `from(...)` method:

```java
import com.anthropic.core.JsonValue;
import java.util.List;
import java.util.Map;

// Create primitive JSON values
JsonValue nullValue = JsonValue.from(null);
JsonValue booleanValue = JsonValue.from(true);
JsonValue numberValue = JsonValue.from(42);
JsonValue stringValue = JsonValue.from("Hello World!");

// Create a JSON array value equivalent to `["Hello", "World"]`
JsonValue arrayValue = JsonValue.from(List.of(
  "Hello", "World"
));

// Create a JSON object value equivalent to `{ "a": 1, "b": 2 }`
JsonValue objectValue = JsonValue.from(Map.of(
  "a", 1,
  "b", 2
));

// Create an arbitrarily nested JSON equivalent to:
// { "a": [1, 2], "b": [3, 4] }
JsonValue complexValue = JsonValue.from(Map.of(
  "a", List.of(1, 2),
  "b", List.of(3, 4)
));
```

### Forcibly omitting required parameters

Normally a `Builder` class's `build` method will throw `IllegalStateException` if any required parameter or property is unset. To forcibly omit a required parameter or property, pass `JsonMissing`:

```java
import com.anthropic.core.JsonMissing;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Model;

MessageCreateParams params = MessageCreateParams.builder()
    .addUserMessage("Hello, world")
    .model(Model.CLAUDE_OPUS_4_6)
    .maxTokens(JsonMissing.of())
    .build();
```

### Response properties

To access undocumented response properties, call the `_additionalProperties()` method:

```java
import com.anthropic.core.JsonValue;
import java.util.Map;

Map<String, JsonValue> additionalProperties = client.messages().create(params)._additionalProperties();
JsonValue secretPropertyValue = additionalProperties.get("secretProperty");
```

To access a property's raw JSON value, call its `_` prefixed method:

```java
import com.anthropic.core.JsonField;
import java.util.Optional;

JsonField<Long> maxTokens = client.messages().create(params)._maxTokens();

if (maxTokens.isMissing()) {
  // The property is absent from the JSON response
} else if (maxTokens.isNull()) {
  // The property was set to literal null
} else {
  // Check if value was provided as a string
  Optional<String> jsonString = maxTokens.asString();

  // Try to deserialize into a custom type
  MyClass myObject = maxTokens.asUnknown().orElseThrow().convert(MyClass.class);
}
```

### Response validation

By default, the SDK will not throw an exception when the API returns a response that doesn't match the expected type. It will throw `AnthropicInvalidDataException` only if you directly access the property.

To check that the response is completely well-typed upfront, call `validate()`:

```java
import com.anthropic.models.messages.Message;

Message message = client.messages().create(params).validate();
```

Or configure per-request:

```java
import com.anthropic.models.messages.Message;

Message message = client.messages().create(
  params, RequestOptions.builder().responseValidation(true).build()
);
```

Or configure the default for all method calls at the client level:

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;

AnthropicClient client = AnthropicOkHttpClient.builder()
    .fromEnv()
    .responseValidation(true)
    .build();
```

## HTTP client customization

### Proxy configuration

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import java.net.InetSocketAddress;
import java.net.Proxy;

AnthropicClient client = AnthropicOkHttpClient.builder()
    .fromEnv()
    .proxy(new Proxy(
      Proxy.Type.HTTP, new InetSocketAddress(
        "https://example.com", 8080
      )
    ))
    .build();
```

### HTTPS / SSL configuration

<Note>
Most applications should not call these methods, and instead use the system defaults. The defaults include special optimizations that can be lost if the implementations are modified.
</Note>

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;

AnthropicClient client = AnthropicOkHttpClient.builder()
    .fromEnv()
    .sslSocketFactory(yourSSLSocketFactory)
    .trustManager(yourTrustManager)
    .hostnameVerifier(yourHostnameVerifier)
    .build();
```

### Custom HTTP client

The SDK consists of three artifacts:

- `anthropic-java-core` - Contains core SDK logic, does not depend on OkHttp. Exposes `AnthropicClient`, `AnthropicClientAsync`, and their implementation classes, all of which can work with any HTTP client.
- `anthropic-java-client-okhttp` - Depends on OkHttp. Exposes `AnthropicOkHttpClient` and `AnthropicOkHttpClientAsync`.
- `anthropic-java` - Depends on and exposes the APIs of both `anthropic-java-core` and `anthropic-java-client-okhttp`. Does not have its own logic.

This structure allows replacing the SDK's default HTTP client without pulling in unnecessary dependencies.

#### Customized OkHttpClient

<Tip>
Try the available [network options](#retries) before replacing the default client.
</Tip>

To use a customized `OkHttpClient`:

1. Replace your `anthropic-java` dependency with `anthropic-java-core`.
2. Copy `anthropic-java-client-okhttp`'s `OkHttpClient` class into your code and customize it.
3. Construct `AnthropicClientImpl` or `AnthropicClientAsyncImpl` using your customized client.

#### Completely custom HTTP client

To use a completely custom HTTP client:

1. Replace your `anthropic-java` dependency with `anthropic-java-core`.
2. Write a class that implements the `HttpClient` interface.
3. Construct `AnthropicClientImpl` or `AnthropicClientAsyncImpl` using your new client class.

## Platform integrations

<Note>
For detailed platform setup guides, see:
- [Amazon Bedrock](/docs/en/build-with-claude/claude-on-amazon-bedrock)
- [Google Vertex AI](/docs/en/build-with-claude/claude-on-vertex-ai)
</Note>

### Amazon Bedrock

This SDK provides support for the Anthropic Bedrock API. This support requires the `anthropic-java-bedrock` library dependency.

<Tabs>
<Tab title="Gradle">
```kotlin
implementation("com.anthropic:anthropic-java-bedrock:2.11.1")
```
</Tab>
<Tab title="Maven">
```xml
<dependency>
    <groupId>com.anthropic</groupId>
    <artifactId>anthropic-java-bedrock</artifactId>
    <version>2.11.1</version>
</dependency>
```
</Tab>
</Tabs>

Create the Anthropic client with the `BedrockBackend`. Usage of the API is otherwise the same.

```java
import com.anthropic.bedrock.backends.BedrockBackend;
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;

AnthropicClient client = AnthropicOkHttpClient.builder()
        .backend(BedrockBackend.fromEnv())
        .build();
```

`BedrockBackend.fromEnv()` automatically resolves the AWS credentials using the AWS default credentials provider chain and resolves the AWS region using the AWS default region provider chain.

With explicit credentials:

```java
import com.anthropic.bedrock.backends.BedrockBackend;
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentials;
import software.amazon.awssdk.regions.Region;

AwsCredentials awsCredentials = AwsBasicCredentials.create(
        System.getenv("AWS_ACCESS_KEY_ID"),
        System.getenv("AWS_SECRET_ACCESS_KEY"));

AnthropicClient client = AnthropicOkHttpClient.builder()
        .backend(BedrockBackend.builder()
                .awsCredentials(awsCredentials)
                .region(Region.US_EAST_1)
                .build())
        .build();
```

You can also create and configure your own AWS credentials provider:

```java
import com.anthropic.bedrock.backends.BedrockBackend;
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;

AwsCredentialsProvider awsCredentialsProvider =
        DefaultCredentialsProvider.builder()
                .asyncCredentialUpdateEnabled(true)
                .build();

AnthropicClient client = AnthropicOkHttpClient.builder()
        .backend(BedrockBackend.builder()
                .fromEnv(awsCredentialsProvider)
                .build())
        .build();
```

The AWS classes used above are included automatically as transitive dependencies of the `anthropic-java-bedrock` library dependency.

Currently, the Bedrock backend does not support the following:

- Anthropic Batch API
- Anthropic Token Counting API

#### Bedrock usage with an API key

The `BedrockBackend` can also use an API key instead of AWS credentials for request authorization. You can set the `AWS_BEARER_TOKEN_BEDROCK` environment variable to the value of your API key and call `BedrockBackend.fromEnv()` to authorize requests using that API key. An API key will be used in preference to AWS credentials if both are set in the environment.

The API key can also be passed directly to the backend:

```java
AnthropicClient client = AnthropicOkHttpClient.builder()
        .backend(BedrockBackend.builder()
                .apiKey(myApiKey)
                .region(Region.US_EAST_1)
                .build())
        .build();
```

An error will occur if you set both an API key and an AWS credentials provider.

### Google Vertex AI

This SDK provides support for Anthropic models on the Google Cloud Vertex AI platform. This support requires the `anthropic-java-vertex` library dependency.

<Tabs>
<Tab title="Gradle">
```kotlin
implementation("com.anthropic:anthropic-java-vertex:2.11.1")
```
</Tab>
<Tab title="Maven">
```xml
<dependency>
    <groupId>com.anthropic</groupId>
    <artifactId>anthropic-java-vertex</artifactId>
    <version>2.11.1</version>
</dependency>
```
</Tab>
</Tabs>

Create the Anthropic client with the `VertexBackend`. Usage of the API is otherwise the same.

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.vertex.backends.VertexBackend;

AnthropicClient client = AnthropicOkHttpClient.builder()
        .backend(VertexBackend.fromEnv())
        .build();
```

`VertexBackend.fromEnv()` automatically resolves the Google OAuth2 credentials from your configured Google Cloud Application Default Credentials (ADC), the Google Cloud region from the `CLOUD_ML_REGION` environment variable, and the Google Cloud project ID from `ANTHROPIC_VERTEX_PROJECT_ID` environment variable.

With explicit credentials:

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.vertex.backends.VertexBackend;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;

String accessToken = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
String project = System.getenv("ANTHROPIC_VERTEX_PROJECT_ID");

GoogleCredentials googleCredentials = GoogleCredentials.create(
        AccessToken.newBuilder().setTokenValue(accessToken).build());

AnthropicClient client = AnthropicOkHttpClient.builder()
        .backend(VertexBackend.builder()
                .googleCredentials(googleCredentials)
                .region("us-central1")
                .project(project)
                .build())
        .build();
```

The Google Cloud classes used above are included automatically as transitive dependencies of the `anthropic-java-vertex` library dependency.

Currently, the Vertex backend does not support the following:

- Anthropic Batch API

## Advanced usage

### Raw response access

To access HTTP headers, status codes, and the raw response body, prefix any HTTP method call with `withRawResponse()`:

```java
import com.anthropic.core.http.Headers;
import com.anthropic.core.http.HttpResponseFor;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Model;

MessageCreateParams params = MessageCreateParams.builder()
    .maxTokens(1024L)
    .addUserMessage("Hello, Claude")
    .model(Model.CLAUDE_OPUS_4_6)
    .build();
HttpResponseFor<Message> message = client.messages().withRawResponse().create(params);

int statusCode = message.statusCode();
Headers headers = message.headers();
```

You can still deserialize the response into an instance of a Java class if needed:

```java
import com.anthropic.models.messages.Message;

Message parsedMessage = message.parse();
```

### Logging

The SDK uses the standard OkHttp logging interceptor.

Enable logging by setting the `ANTHROPIC_LOG` environment variable to `info`:

```bash
export ANTHROPIC_LOG=info
```

Or to `debug` for more verbose logging:

```bash
export ANTHROPIC_LOG=debug
```

<section title="Jackson compatibility">

The SDK depends on Jackson for JSON serialization/deserialization. It is compatible with version 2.13.4 or higher, but depends on version 2.18.2 by default.

The SDK throws an exception if it detects an incompatible Jackson version at runtime (e.g. if the default version was overridden in your Maven or Gradle config).

If the SDK threw an exception, but you're certain the version is compatible, then disable the version check using `checkJacksonVersionCompatibility` on `AnthropicOkHttpClient` or `AnthropicOkHttpClientAsync`.

<Warning>
There is no guarantee that the SDK works correctly when the Jackson version check is disabled.
</Warning>

</section>

<section title="ProGuard/R8 configuration">

Although the SDK uses reflection, it is still usable with ProGuard and R8 because `anthropic-java-core` is published with a configuration file containing keep rules.

ProGuard and R8 should automatically detect and use the published rules, but you can also manually copy the keep rules if necessary.

</section>

### Undocumented API functionality

The SDK is typed for convenient usage of the documented API. However, it also supports working with undocumented or not yet supported parts of the API.

#### Undocumented endpoints

To make requests to undocumented endpoints, you can use the `putAdditionalHeader`, `putAdditionalQueryParam`, or `putAdditionalBodyProperty` methods as described in [Undocumented parameters](#undocumented-parameters).

#### Undocumented response properties

To access undocumented response properties, use the `_additionalProperties()` method as described in [Response properties](#response-properties).

## Beta features

You can access most beta API features through the `beta()` method on the client. To check the availability of all of Claude's capabilities and tools, see the [build with Claude overview](/docs/en/build-with-claude/overview).

For example, to use structured outputs:

```java
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.anthropic.models.beta.messages.StructuredMessageCreateParams;
import com.anthropic.models.messages.Model;

StructuredMessageCreateParams<BookList> createParams = MessageCreateParams.builder()
        .model(Model.CLAUDE_OPUS_4_6)
        .maxTokens(2048)
        .outputConfig(BookList.class)
        .addUserMessage("List some famous late twentieth century novels.")
        .build();

client.beta().messages().create(createParams);
```

## Frequently asked questions

<section title="Why doesn't the SDK use plain enum classes?">

Java `enum` classes are not trivially forwards compatible. Using them in the SDK could cause runtime exceptions if the API is updated to respond with a new enum value.

</section>

<section title="Why are fields represented using JsonField<T> instead of just plain T?">

Using `JsonField<T>` enables a few features:

- Allowing usage of undocumented API functionality
- Lazily validating the API response against the expected shape
- Representing absent vs explicitly null values

</section>

<section title="Why doesn't the SDK use data classes?">

It is not backwards compatible to add new fields to a data class, and we don't want to introduce a breaking change every time we add a field to a class.

</section>

<section title="Why doesn't the SDK use checked exceptions?">

Checked exceptions are widely considered a mistake in the Java programming language. In fact, they were omitted from Kotlin for this reason.

Checked exceptions:

- Are verbose to handle
- Encourage error handling at the wrong level of abstraction, where nothing can be done about the error
- Are tedious to propagate due to the function coloring problem
- Don't play well with lambdas (also due to the function coloring problem)

</section>

## Additional resources

- [GitHub repository](https://github.com/anthropics/anthropic-sdk-java)
- [Javadocs](https://javadoc.io/doc/com.anthropic/anthropic-java)
- [API reference](/docs/en/api/overview)
- [Streaming guide](/docs/en/build-with-claude/streaming)
- [Tool use guide](/docs/en/agents-and-tools/tool-use/overview)








# Go SDK

Install and configure the Anthropic Go SDK with context-based cancellation and functional options

---

The Anthropic Go library provides convenient access to the Anthropic REST API from applications written in Go.

<Info>
For API feature documentation with code examples, see the [API reference](/docs/en/api/overview). This page covers Go-specific SDK features and configuration.
</Info>

## Installation

```go
import (
	"github.com/anthropics/anthropic-sdk-go" // imported as anthropic
)
```

Or to pin the version:

```bash
go get -u 'github.com/anthropics/anthropic-sdk-go@v1.19.0'
```

## Requirements

This library requires Go 1.22+.

## Usage

```go
package main

import (
	"context"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

func main() {
	client := anthropic.NewClient(
		option.WithAPIKey("my-anthropic-api-key"), // defaults to os.LookupEnv("ANTHROPIC_API_KEY")
	)
	message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
		MaxTokens: 1024,
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock("What is a quaternion?")),
		},
		Model: anthropic.ModelClaudeOpus4_6,
	})
	if err != nil {
		panic(err.Error())
	}
	fmt.Printf("%+v\n", message.Content)
}
```

<section title="Conversations">

```go
messages := []anthropic.MessageParam{
    anthropic.NewUserMessage(anthropic.NewTextBlock("What is my first name?")),
}

message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
    Model:     anthropic.ModelClaudeOpus4_6,
    Messages:  messages,
    MaxTokens: 1024,
})
if err != nil {
    panic(err)
}

fmt.Printf("%+v\n", message.Content)

messages = append(messages, message.ToParam())
messages = append(messages, anthropic.NewUserMessage(
    anthropic.NewTextBlock("My full name is John Doe"),
))

message, err = client.Messages.New(context.TODO(), anthropic.MessageNewParams{
    Model:     anthropic.ModelClaudeOpus4_6,
    Messages:  messages,
    MaxTokens: 1024,
})

fmt.Printf("%+v\n", message.Content)
```

</section>
<section title="System prompts">

```go
message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
    Model:     anthropic.ModelClaudeOpus4_6,
    MaxTokens: 1024,
    System: []anthropic.TextBlockParam{
        {Text: "Be very serious at all times."},
    },
    Messages: messages,
})
```

</section>
<section title="Streaming">

```go
content := "What is a quaternion?"

stream := client.Messages.NewStreaming(context.TODO(), anthropic.MessageNewParams{
    Model:     anthropic.ModelClaudeOpus4_6,
    MaxTokens: 1024,
    Messages: []anthropic.MessageParam{
        anthropic.NewUserMessage(anthropic.NewTextBlock(content)),
    },
})

message := anthropic.Message{}
for stream.Next() {
    event := stream.Current()
    err := message.Accumulate(event)
    if err != nil {
        panic(err)
    }

    switch eventVariant := event.AsAny().(type) {
        case anthropic.ContentBlockDeltaEvent:
        switch deltaVariant := eventVariant.Delta.AsAny().(type) {
        case anthropic.TextDelta:
            print(deltaVariant.Text)
        }

    }
}

if stream.Err() != nil {
    panic(stream.Err())
}
```

</section>
<section title="Tool calling">

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/invopop/jsonschema"
)

func main() {
	client := anthropic.NewClient()

	content := "Where is San Francisco?"

	println("[user]: " + content)

	messages := []anthropic.MessageParam{
		anthropic.NewUserMessage(anthropic.NewTextBlock(content)),
	}

	toolParams := []anthropic.ToolParam{
		{
			Name:        "get_coordinates",
			Description: anthropic.String("Accepts a place as an address, then returns the latitude and longitude coordinates."),
			InputSchema: GetCoordinatesInputSchema,
		},
	}
	tools := make([]anthropic.ToolUnionParam, len(toolParams))
	for i, toolParam := range toolParams {
		tools[i] = anthropic.ToolUnionParam{OfTool: &toolParam}
	}

	for {
		message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
			Model:     anthropic.ModelClaudeOpus4_6,
			MaxTokens: 1024,
			Messages:  messages,
			Tools:     tools,
		})

		if err != nil {
			panic(err)
		}

		print(color("[assistant]: "))
		for _, block := range message.Content {
			switch block := block.AsAny().(type) {
			case anthropic.TextBlock:
				println(block.Text)
				println()
			case anthropic.ToolUseBlock:
				inputJSON, _ := json.Marshal(block.Input)
				println(block.Name + ": " + string(inputJSON))
				println()
			}
		}

		messages = append(messages, message.ToParam())
		toolResults := []anthropic.ContentBlockParamUnion{}

		for _, block := range message.Content {
			switch variant := block.AsAny().(type) {
			case anthropic.ToolUseBlock:
				print(color("[user (" + block.Name + ")]: "))

				var response interface{}
				switch block.Name {
				case "get_coordinates":
					var input struct {
						Location string `json:"location"`
					}

					err := json.Unmarshal([]byte(variant.JSON.Input.Raw()), &input)
					if err != nil {
						panic(err)
					}

					response = GetCoordinates(input.Location)
				}

				b, err := json.Marshal(response)
				if err != nil {
					panic(err)
				}

				println(string(b))

				toolResults = append(toolResults, anthropic.NewToolResultBlock(block.ID, string(b), false))
			}

		}
		if len(toolResults) == 0 {
			break
		}
		messages = append(messages, anthropic.NewUserMessage(toolResults...))
	}
}

type GetCoordinatesInput struct {
	Location string `json:"location" jsonschema_description:"The location to look up."`
}

var GetCoordinatesInputSchema = GenerateSchema[GetCoordinatesInput]()

type GetCoordinateResponse struct {
	Long float64 `json:"long"`
	Lat  float64 `json:"lat"`
}

func GetCoordinates(location string) GetCoordinateResponse {
	return GetCoordinateResponse{
		Long: -122.4194,
		Lat:  37.7749,
	}
}

func GenerateSchema[T any]() anthropic.ToolInputSchemaParam {
	reflector := jsonschema.Reflector{
		AllowAdditionalProperties: false,
		DoNotReference:            true,
	}
	var v T

	schema := reflector.Reflect(v)

	return anthropic.ToolInputSchemaParam{
		Properties: schema.Properties,
	}
}

func color(s string) string {
	return fmt.Sprintf("\033[1;%sm%s\033[0m", "33", s)
}
```

</section>

## Request fields

The anthropic library uses the [`omitzero`](https://tip.golang.org/doc/go1.24#encodingjsonpkgencodingjson)
semantics from the Go 1.24+ `encoding/json` release for request fields.

Required primitive fields (`int64`, `string`, etc.) feature the tag `` `json:"...,required"` ``. These
fields are always serialized, even their zero values.

Optional primitive types are wrapped in a `param.Opt[T]`. These fields can be set with the provided constructors, `anthropic.String(string)`, `anthropic.Int(int64)`, etc.

Any `param.Opt[T]`, map, slice, struct or string enum uses the
tag `` `json:"...,omitzero"` ``. Its zero value is considered omitted.

The `param.IsOmitted(any)` function can confirm the presence of any `omitzero` field.

```go
p := anthropic.ExampleParams{
	ID:   "id_xxx",                // required property
	Name: anthropic.String("..."), // optional property

	Point: anthropic.Point{
		X: 0,                // required field will serialize as 0
		Y: anthropic.Int(1), // optional field will serialize as 1
		// ... omitted non-required fields will not be serialized
	},

	Origin: anthropic.Origin{}, // the zero value of [Origin] is considered omitted
}
```

To send `null` instead of a `param.Opt[T]`, use `param.Null[T]()`.
To send `null` instead of a struct `T`, use `param.NullStruct[T]()`.

```go
p.Name = param.Null[string]()       // 'null' instead of string
p.Point = param.NullStruct[Point]() // 'null' instead of struct

param.IsNull(p.Name)  // true
param.IsNull(p.Point) // true
```

Request structs contain a `.SetExtraFields(map[string]any)` method which can send non-conforming
fields in the request body. Extra fields overwrite any struct fields with a matching
key.

<Warning>
For security reasons, only use `SetExtraFields` with trusted data.
</Warning>

To send a custom value instead of a struct, use `param.Override[T](value)`.

```go
// In cases where the API specifies a given type,
// but you want to send something else, use [SetExtraFields]:
p.SetExtraFields(map[string]any{
	"x": 0.01, // send "x" as a float instead of int
})

// Send a number instead of an object
custom := param.Override[anthropic.FooParams](12)
```

### Request unions

Unions are represented as a struct with fields prefixed by "Of" for each of its variants,
only one field can be non-zero. The non-zero field will be serialized.

Sub-properties of the union can be accessed via methods on the union struct.
These methods return a mutable pointer to the underlying data, if present.

```go
// Only one field can be non-zero, use param.IsOmitted() to check if a field is set
type AnimalUnionParam struct {
	OfCat *Cat `json:",omitzero,inline`
	OfDog *Dog `json:",omitzero,inline`
}

animal := AnimalUnionParam{
	OfCat: &Cat{
		Name: "Whiskers",
		Owner: PersonParam{
			Address: AddressParam{Street: "3333 Coyote Hill Rd", Zip: 0},
		},
	},
}

// Mutating a field
if address := animal.GetOwner().GetAddress(); address != nil {
	address.ZipCode = 94304
}
```

## Response objects

All fields in response structs are ordinary value types (not pointers or wrappers).
Response structs also include a special `JSON` field containing metadata about
each property.

```go
type Animal struct {
	Name   string `json:"name,nullable"`
	Owners int    `json:"owners"`
	Age    int    `json:"age"`
	JSON   struct {
		Name        respjson.Field
		Owner       respjson.Field
		Age         respjson.Field
		ExtraFields map[string]respjson.Field
	} `json:"-"`
}
```

To handle optional data, use the `.Valid()` method on the JSON field.
`.Valid()` returns true if a field is not `null`, not present, or couldn't be marshaled.

If `.Valid()` is false, the corresponding field will simply be its zero value.

```go
raw := `{"owners": 1, "name": null}`

var res Animal
json.Unmarshal([]byte(raw), &res)

// Accessing regular fields

res.Owners // 1
res.Name   // ""
res.Age    // 0

// Optional field checks

res.JSON.Owners.Valid() // true
res.JSON.Name.Valid()   // false
res.JSON.Age.Valid()    // false

// Raw JSON values

res.JSON.Owners.Raw()                  // "1"
res.JSON.Name.Raw() == "null"          // true
res.JSON.Name.Raw() == respjson.Null   // true
res.JSON.Age.Raw() == ""               // true
res.JSON.Age.Raw() == respjson.Omitted // true
```

These `.JSON` structs also include an `ExtraFields` map containing
any properties in the json response that were not specified
in the struct. This can be useful for API features not yet
present in the SDK.

```go
body := res.JSON.ExtraFields["my_unexpected_field"].Raw()
```

### Response unions

In responses, unions are represented by a flattened struct containing all possible fields from each of the
object variants.
To convert it to a variant use the `.AsFooVariant()` method or the `.AsAny()` method if present.

If a response value union contains primitive values, primitive fields will be alongside
the properties but prefixed with `Of` and feature the tag `json:"...,inline"`.

```go
type AnimalUnion struct {
	// From variants [Dog], [Cat]
	Owner Person `json:"owner"`
	// From variant [Dog]
	DogBreed string `json:"dog_breed"`
	// From variant [Cat]
	CatBreed string `json:"cat_breed"`
	// ...

	JSON struct {
		Owner respjson.Field
		// ...
	} `json:"-"`
}

// If animal variant
if animal.Owner.Address.ZipCode == "" {
	panic("missing zip code")
}

// Switch on the variant
switch variant := animal.AsAny().(type) {
case Dog:
case Cat:
default:
	panic("unexpected type")
}
```

## Streaming

Use the streaming API for real-time responses:

```go
stream := client.Messages.NewStreaming(context.TODO(), anthropic.MessageNewParams{
    Model:     anthropic.ModelClaudeOpus4_6,
    MaxTokens: 1024,
    Messages: []anthropic.MessageParam{
        anthropic.NewUserMessage(anthropic.NewTextBlock("What is a quaternion?")),
    },
})

message := anthropic.Message{}
for stream.Next() {
    event := stream.Current()
    err := message.Accumulate(event)
    if err != nil {
        panic(err)
    }

    switch eventVariant := event.AsAny().(type) {
        case anthropic.ContentBlockDeltaEvent:
        switch deltaVariant := eventVariant.Delta.AsAny().(type) {
        case anthropic.TextDelta:
            print(deltaVariant.Text)
        }

    }
}

if stream.Err() != nil {
    panic(stream.Err())
}
```

## Error handling

When the API returns a non-success status code, we return an error with type
`*anthropic.Error`. This contains the `StatusCode`, `*http.Request`, and
`*http.Response` values of the request, as well as the JSON of the error body
(much like other response objects in the SDK). The error also includes the `RequestID`
from the response headers, which is useful for troubleshooting with Anthropic support.

To handle errors, we recommend that you use the `errors.As` pattern:

```go
_, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
	MaxTokens: 1024,
	Messages: []anthropic.MessageParam{{
		Content: []anthropic.ContentBlockParamUnion{{
			OfText: &anthropic.TextBlockParam{Text: "What is a quaternion?", CacheControl: anthropic.CacheControlEphemeralParam{TTL: anthropic.CacheControlEphemeralTTLTTL5m}, Citations: []anthropic.TextCitationParamUnion{{
				OfCharLocation: &anthropic.CitationCharLocationParam{CitedText: "cited_text", DocumentIndex: 0, DocumentTitle: anthropic.String("x"), EndCharIndex: 0, StartCharIndex: 0},
			}}},
		}},
		Role: anthropic.MessageParamRoleUser,
	}},
	Model: anthropic.ModelClaudeOpus4_6,
})
if err != nil {
	var apierr *anthropic.Error
	if errors.As(err, &apierr) {
		println("Request ID:", apierr.RequestID)
		println(string(apierr.DumpRequest(true)))  // Prints the serialized HTTP request
		println(string(apierr.DumpResponse(true))) // Prints the serialized HTTP response
	}
	panic(err.Error()) // GET "/v1/messages": 400 Bad Request (Request-ID: req_xxx) { ... }
}
```

When other errors occur, they are returned unwrapped; for example,
if HTTP transport fails, you might receive `*url.Error` wrapping `*net.OpError`.

## Retries

Certain errors will be automatically retried 2 times by default, with a short exponential backoff.
We retry by default all connection errors, 408 Request Timeout, 409 Conflict, 429 Rate Limit,
and >=500 Internal errors.

You can use the `WithMaxRetries` option to configure or disable this:

```go
// Configure the default for all requests:
client := anthropic.NewClient(
	option.WithMaxRetries(0), // default is 2
)

// Override per-request:
client.Messages.New(
	context.TODO(),
	anthropic.MessageNewParams{
		MaxTokens: 1024,
		Messages: []anthropic.MessageParam{{
			Content: []anthropic.ContentBlockParamUnion{{
				OfRequestTextBlock: &anthropic.TextBlockParam{Text: "What is a quaternion?"},
			}},
			Role: anthropic.MessageParamRoleUser,
		}},
		Model: anthropic.ModelClaudeOpus4_6,
	},
	option.WithMaxRetries(5),
)
```

## Timeouts

Requests do not time out by default; use context to configure a timeout for a request lifecycle.

Note that if a request is [retried](#retries), the context timeout does not start over.
To set a per-retry timeout, use `option.WithRequestTimeout()`.

```go
// This sets the timeout for the request, including all the retries.
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
defer cancel()
client.Messages.New(
	ctx,
	anthropic.MessageNewParams{
		MaxTokens: 1024,
		Messages: []anthropic.MessageParam{{
			Content: []anthropic.ContentBlockParamUnion{{
				OfRequestTextBlock: &anthropic.TextBlockParam{Text: "What is a quaternion?"},
			}},
			Role: anthropic.MessageParamRoleUser,
		}},
		Model: anthropic.ModelClaudeOpus4_6,
	},
	// This sets the per-retry timeout
	option.WithRequestTimeout(20*time.Second),
)
```

## Long requests

<Warning>
We highly encourage you use the streaming Messages API for longer running requests.
</Warning>

We do not recommend setting a large `MaxTokens` value without using streaming as some networks may drop idle connections after a certain period of time, which
can cause the request to fail or [timeout](#timeouts) without receiving a response from Anthropic.

This SDK will also return an error if a non-streaming request is expected to be above roughly 10 minutes long.
Calling `.Messages.NewStreaming()` or [setting a custom timeout](#timeouts) disables this error.

## File uploads

Request parameters that correspond to file uploads in multipart requests are typed as
`io.Reader`. The contents of the `io.Reader` will by default be sent as a multipart form
part with the file name of "anonymous_file" and content-type of "application/octet-stream", so we
recommend always specifying a custom content-type with the `anthropic.File(reader io.Reader, filename string, contentType string)`
helper we provide to easily wrap any `io.Reader` with the appropriate file name and content type.

```go
// A file from the file system
file, err := os.Open("/path/to/file.json")
anthropic.BetaFileUploadParams{
	File: anthropic.File(file, "custom-name.json", "application/json"),
	Betas: []anthropic.AnthropicBeta{anthropic.AnthropicBetaFilesAPI2025_04_14},
}

// A file from a string
anthropic.BetaFileUploadParams{
	File: anthropic.File(strings.NewReader("my file contents"), "custom-name.json", "application/json"),
	Betas: []anthropic.AnthropicBeta{anthropic.AnthropicBetaFilesAPI2025_04_14},
}
```

The file name and content-type can also be customized by implementing `Name() string` or `ContentType()
string` on the run-time type of `io.Reader`. Note that `os.File` implements `Name() string`, so a
file returned by `os.Open` will be sent with the file name on disk.

## Pagination

This library provides some conveniences for working with paginated list endpoints.

You can use `.ListAutoPaging()` methods to iterate through items across all pages:

```go
iter := client.Messages.Batches.ListAutoPaging(context.TODO(), anthropic.MessageBatchListParams{
	Limit: anthropic.Int(20),
})
// Automatically fetches more pages as needed.
for iter.Next() {
	messageBatch := iter.Current()
	fmt.Printf("%+v\n", messageBatch)
}
if err := iter.Err(); err != nil {
	panic(err.Error())
}
```

Or you can use simple `.List()` methods to fetch a single page and receive a standard response object
with additional helper methods like `.GetNextPage()`:

```go
page, err := client.Messages.Batches.List(context.TODO(), anthropic.MessageBatchListParams{
	Limit: anthropic.Int(20),
})
for page != nil {
	for _, batch := range page.Data {
		fmt.Printf("%+v\n", batch)
	}
	page, err = page.GetNextPage()
}
if err != nil {
	panic(err.Error())
}
```

## RequestOptions

This library uses the functional options pattern. Functions defined in the
`option` package return a `RequestOption`, which is a closure that mutates a
`RequestConfig`. These options can be supplied to the client or at individual
requests. For example:

```go
client := anthropic.NewClient(
	// Adds a header to every request made by the client
	option.WithHeader("X-Some-Header", "custom_header_info"),
)

client.Messages.New(context.TODO(), ...,
	// Override the header
	option.WithHeader("X-Some-Header", "some_other_custom_header_info"),
	// Add an undocumented field to the request body, using sjson syntax
	option.WithJSONSet("some.json.path", map[string]string{"my": "object"}),
)
```

The request option `option.WithDebugLog(nil)` may be helpful while debugging.

See the [full list of request options](https://pkg.go.dev/github.com/anthropics/anthropic-sdk-go/option).

## HTTP client customization

### Middleware

We provide `option.WithMiddleware` which applies the given
middleware to requests.

```go
func Logger(req *http.Request, next option.MiddlewareNext) (res *http.Response, err error) {
	// Before the request
	start := time.Now()
	LogReq(req)

	// Forward the request to the next handler
	res, err = next(req)

	// Handle stuff after the request
	LogRes(res, err, time.Since(start))

    return res, err
}

client := anthropic.NewClient(
	option.WithMiddleware(Logger),
)
```

When multiple middlewares are provided as variadic arguments, the middlewares
are applied left to right. If `option.WithMiddleware` is given
multiple times, for example first in the client then the method, the
middleware in the client will run first and the middleware given in the method
will run next.

You may also replace the default `http.Client` with
`option.WithHTTPClient(client)`. Only one http client is
accepted (this overwrites any previous client) and receives requests after any
middleware has been applied.

## Platform integrations

<Note>
For detailed platform setup guides, see:
- [Amazon Bedrock](/docs/en/build-with-claude/claude-on-amazon-bedrock)
- [Google Vertex AI](/docs/en/build-with-claude/claude-on-vertex-ai)
</Note>

### Amazon Bedrock

To use this library with [Amazon Bedrock](https://aws.amazon.com/bedrock/claude/),
use the bedrock request option `bedrock.WithLoadDefaultConfig(...)` which reads the
[default config](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html).

Importing the `bedrock` library also globally registers a decoder for `application/vnd.amazon.eventstream` for
streaming.

```go
package main

import (
	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/bedrock"
)

func main() {
	client := anthropic.NewClient(
		bedrock.WithLoadDefaultConfig(context.Background()),
	)
}
```

If you already have an `aws.Config`, you can also use it directly with `bedrock.WithConfig(cfg)`.

Read more about Anthropic and Amazon Bedrock in [Claude on Amazon Bedrock](/docs/en/build-with-claude/claude-on-amazon-bedrock).

### Google Vertex AI

To use this library with [Google Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude),
use the request option `vertex.WithGoogleAuth(...)` which reads the
[Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials).

```go
package main

import (
	"context"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/vertex"
)

func main() {
	client := anthropic.NewClient(
		vertex.WithGoogleAuth(context.Background(), "us-central1", "id-xxx"),
	)
}
```

If you already have `*google.Credentials`, you can also use it directly with
`vertex.WithCredentials(ctx, region, projectId, creds)`.

Read more about Anthropic and Google Vertex AI in [Claude on Google Vertex AI](/docs/en/build-with-claude/claude-on-vertex-ai).

## Advanced usage

### Accessing raw response data (e.g. response headers)

You can access the raw HTTP response data by using the `option.WithResponseInto()` request option. This is useful when
you need to examine response headers, status codes, or other details.

```go
// Create a variable to store the HTTP response
var response *http.Response
message, err := client.Messages.New(
	context.TODO(),
	anthropic.MessageNewParams{
		MaxTokens: 1024,
		Messages: []anthropic.MessageParam{{
			Content: []anthropic.ContentBlockParamUnion{{
				OfText: &anthropic.TextBlockParam{Text: "What is a quaternion?", CacheControl: anthropic.CacheControlEphemeralParam{TTL: anthropic.CacheControlEphemeralTTLTTL5m}, Citations: []anthropic.TextCitationParamUnion{{
					OfCharLocation: &anthropic.CitationCharLocationParam{CitedText: "cited_text", DocumentIndex: 0, DocumentTitle: anthropic.String("x"), EndCharIndex: 0, StartCharIndex: 0},
				}}},
			}},
			Role: anthropic.MessageParamRoleUser,
		}},
		Model: anthropic.ModelClaudeOpus4_6,
	},
	option.WithResponseInto(&response),
)
if err != nil {
	// handle error
}
fmt.Printf("%+v\n", message)

fmt.Printf("Status Code: %d\n", response.StatusCode)
fmt.Printf("Headers: %+#v\n", response.Header)
```

### Making custom/undocumented requests

This library is typed for convenient access to the documented API. If you need to access undocumented
endpoints, params, or response properties, the library can still be used.

#### Undocumented endpoints

To make requests to undocumented endpoints, you can use `client.Get`, `client.Post`, and other HTTP verbs.
`RequestOptions` on the client, such as retries, will be respected when making these requests.

```go
var (
    // params can be an io.Reader, a []byte, an encoding/json serializable object,
    // or a "...Params" struct defined in this library.
    params map[string]any

    // result can be an []byte, *http.Response, a encoding/json deserializable object,
    // or a model defined in this library.
    result *http.Response
)
err := client.Post(context.Background(), "/unspecified", params, &result)
if err != nil {
    ...
}
```

#### Undocumented request params

To make requests using undocumented parameters, you may use either the `option.WithQuerySet()`
or the `option.WithJSONSet()` methods.

```go
params := FooNewParams{
    ID:   "id_xxxx",
    Data: FooNewParamsData{
        FirstName: anthropic.String("John"),
    },
}
client.Foo.New(context.Background(), params, option.WithJSONSet("data.last_name", "Doe"))
```

#### Undocumented response properties

To access undocumented response properties, you may either access the raw JSON of the response as a string
with `result.JSON.RawJSON()`, or get the raw JSON of a particular field on the result with
`result.JSON.Foo.Raw()`.

Any fields that are not present on the response struct will be saved and can be accessed by `result.JSON.ExtraFields()` which returns the extra fields as a `map[string]Field`.

## Additional resources

- [GitHub repository](https://github.com/anthropics/anthropic-sdk-go)
- [Go package documentation](https://pkg.go.dev/github.com/anthropics/anthropic-sdk-go)
- [API reference](/docs/en/api/overview)
- [Streaming guide](/docs/en/build-with-claude/streaming)








# Ruby SDK

Install and configure the Anthropic Ruby SDK with Sorbet types, streaming helpers, and connection pooling

---

The Anthropic Ruby library provides convenient access to the Anthropic REST API from any Ruby 3.2.0+ application. It ships with comprehensive types and docstrings in Yard, RBS, and RBI. The standard library's `net/http` is used as the HTTP transport, with connection pooling via the `connection_pool` gem.

<Info>
For API feature documentation with code examples, see the [API reference](/docs/en/api/overview). This page covers Ruby-specific SDK features and configuration.
</Info>

## Installation

To use this gem, install via Bundler by adding the following to your application's `Gemfile`:

```ruby
gem "anthropic", "~> 1.16.3"
```

## Requirements

Ruby 3.2.0 or higher.

## Usage

```ruby
require "anthropic"

anthropic = Anthropic::Client.new(
  api_key: ENV["ANTHROPIC_API_KEY"] # This is the default and can be omitted
)

message = anthropic.messages.create(
  max_tokens: 1024,
  messages: [{role: "user", content: "Hello, Claude"}],
  model: :"claude-opus-4-6"
)

puts(message.content)
```

## Streaming

We provide support for streaming responses using Server-Sent Events (SSE).

```ruby
stream = anthropic.messages.stream(
  max_tokens: 1024,
  messages: [{role: "user", content: "Hello, Claude"}],
  model: :"claude-opus-4-6"
)

stream.each do |message|
  puts(message.type)
end
```

### Streaming helpers

This library provides several conveniences for streaming messages, for example:

```ruby
stream = anthropic.messages.stream(
  max_tokens: 1024,
  messages: [{role: :user, content: "Say hello there!"}],
  model: :"claude-opus-4-6"
)

stream.text.each do |text|
  print(text)
end
```

Streaming with `anthropic.messages.stream(...)` exposes various helpers including accumulation and SDK-specific events.

## Input Schema and Tool Calling

The SDK provides helper mechanisms to define structured data classes for tools and let Claude automatically execute them. For detailed documentation on tool use patterns including the tool runner, see [Implementing Tool Use](/docs/en/agents-and-tools/tool-use/implement-tool-use).

```ruby
class CalculatorInput < Anthropic::BaseModel
  required :lhs, Float
  required :rhs, Float
  required :operator, Anthropic::InputSchema::EnumOf[:+, :-, :*, :/]
end

class Calculator < Anthropic::BaseTool
  input_schema CalculatorInput

  def call(expr)
    expr.lhs.public_send(expr.operator, expr.rhs)
  end
end

# Automatically handles tool execution loop
client.beta.messages.tool_runner(
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [{role: "user", content: "What's 15 * 7?"}],
  tools: [Calculator.new]
).each_message { puts _1.content }
```

## Handling errors

When the library is unable to connect to the API, or if the API returns a non-success status code (i.e., 4xx or 5xx response), a subclass of `Anthropic::Errors::APIError` will be thrown:

```ruby
begin
  message = anthropic.messages.create(
    max_tokens: 1024,
    messages: [{role: "user", content: "Hello, Claude"}],
    model: :"claude-opus-4-6"
  )
rescue Anthropic::Errors::APIConnectionError => e
  puts("The server could not be reached")
  puts(e.cause)  # an underlying Exception, likely raised within `net/http`
rescue Anthropic::Errors::RateLimitError => e
  puts("A 429 status code was received; we should back off a bit.")
rescue Anthropic::Errors::APIStatusError => e
  puts("Another non-200-range status code was received")
  puts(e.status)
end
```

Error codes are as follows:

| Cause            | Error Type                 |
| ---------------- | -------------------------- |
| HTTP 400         | `BadRequestError`          |
| HTTP 401         | `AuthenticationError`      |
| HTTP 403         | `PermissionDeniedError`    |
| HTTP 404         | `NotFoundError`            |
| HTTP 409         | `ConflictError`            |
| HTTP 422         | `UnprocessableEntityError` |
| HTTP 429         | `RateLimitError`           |
| HTTP >= 500      | `InternalServerError`      |
| Other HTTP error | `APIStatusError`           |
| Timeout          | `APITimeoutError`          |
| Network error    | `APIConnectionError`       |

## Retries

Certain errors will be automatically retried 2 times by default, with a short exponential backoff.

Connection errors (for example, due to a network connectivity problem), 408 Request Timeout, 409 Conflict, 429 Rate Limit, >=500 Internal errors, and timeouts will all be retried by default.

You can use the `max_retries` option to configure or disable this:

```ruby
# Configure the default for all requests:
anthropic = Anthropic::Client.new(
  max_retries: 0 # default is 2
)

# Or, configure per-request:
anthropic.messages.create(
  max_tokens: 1024,
  messages: [{role: "user", content: "Hello, Claude"}],
  model: :"claude-opus-4-6",
  request_options: {max_retries: 5}
)
```

## Timeouts

By default, requests will time out after 600 seconds. You can use the timeout option to configure or disable this:

```ruby
# Configure the default for all requests:
anthropic = Anthropic::Client.new(
  timeout: nil # default is 600
)

# Or, configure per-request:
anthropic.messages.create(
  max_tokens: 1024,
  messages: [{role: "user", content: "Hello, Claude"}],
  model: :"claude-opus-4-6",
  request_options: {timeout: 5}
)
```

On timeout, `Anthropic::Errors::APITimeoutError` is raised.

Note that requests that time out are retried by default.

## Pagination

List methods in the Claude API are paginated.

This library provides auto-paginating iterators with each list response, so you do not have to request successive pages manually:

```ruby
page = anthropic.messages.batches.list(limit: 20)

# Fetch single item from page.
batch = page.data[0]
puts(batch.id)

# Automatically fetches more pages as needed.
page.auto_paging_each do |batch|
  puts(batch.id)
end
```

Alternatively, you can use the `#next_page?` and `#next_page` methods for more granular control working with pages.

```ruby
if page.next_page?
  new_page = page.next_page
  puts(new_page.data[0].id)
end
```

## File uploads

Request parameters that correspond to file uploads can be passed as raw contents, a [`Pathname`](https://rubyapi.org/3.2/o/pathname) instance, [`StringIO`](https://rubyapi.org/3.2/o/stringio), or more.

```ruby
require "pathname"

# Use `Pathname` to send the filename and/or avoid paging a large file into memory:
file_metadata = anthropic.beta.files.upload(file: Pathname("/path/to/file"))

# Alternatively, pass file contents or a `StringIO` directly:
file_metadata = anthropic.beta.files.upload(file: File.read("/path/to/file"))

# Or, to control the filename and/or content type:
file = Anthropic::FilePart.new(File.read("/path/to/file"), filename: "/path/to/file", content_type: "...")
file_metadata = anthropic.beta.files.upload(file: file)

puts(file_metadata.id)
```

Note that you can also pass a raw `IO` descriptor, but this disables retries, as the library can't be sure if the descriptor is a file or pipe (which cannot be rewound).

## Sorbet

This library provides comprehensive [RBI](https://sorbet.org/docs/rbi) definitions, and has no dependency on sorbet-runtime.

You can provide typesafe request parameters like so:

```ruby
anthropic.messages.create(
  max_tokens: 1024,
  messages: [Anthropic::MessageParam.new(role: "user", content: "Hello, Claude")],
  model: :"claude-opus-4-6"
)
```

Or, equivalently:

```ruby
# Hashes work, but are not typesafe:
anthropic.messages.create(
  max_tokens: 1024,
  messages: [{role: "user", content: "Hello, Claude"}],
  model: :"claude-opus-4-6"
)

# You can also splat a full Params class:
params = Anthropic::MessageCreateParams.new(
  max_tokens: 1024,
  messages: [Anthropic::MessageParam.new(role: "user", content: "Hello, Claude")],
  model: :"claude-opus-4-6"
)
anthropic.messages.create(**params)
```

### Enums

Since this library does not depend on `sorbet-runtime`, it cannot provide [`T::Enum`](https://sorbet.org/docs/tenum) instances. Instead, we provide "tagged symbols" instead, which is always a primitive at runtime:

```ruby
# :auto
puts(Anthropic::MessageCreateParams::ServiceTier::AUTO)

# Revealed type: `T.all(Anthropic::MessageCreateParams::ServiceTier, Symbol)`
T.reveal_type(Anthropic::MessageCreateParams::ServiceTier::AUTO)
```

Enum parameters have a "relaxed" type, so you can either pass in enum constants or their literal value:

```ruby
# Using the enum constants preserves the tagged type information:
anthropic.messages.create(
  service_tier: Anthropic::MessageCreateParams::ServiceTier::AUTO,
  # ...
)

# Literal values are also permissible:
anthropic.messages.create(
  service_tier: :auto,
  # ...
)
```

## BaseModel

All parameter and response objects inherit from `Anthropic::Internal::Type::BaseModel`, which provides several conveniences, including:

1. All fields, including unknown ones, are accessible with `obj[:prop]` syntax, and can be destructured with `obj => {prop: prop}` or pattern-matching syntax.

2. Structural equivalence for equality; if two API calls return the same values, comparing the responses with == will return true.

3. Both instances and the classes themselves can be pretty-printed.

4. Helpers such as `#to_h`, `#deep_to_h`, `#to_json`, and `#to_yaml`.

## Concurrency and connection pooling

The `Anthropic::Client` instances are threadsafe, but are only fork-safe when there are no in-flight HTTP requests.

Each instance of `Anthropic::Client` has its own HTTP connection pool with a default size of 99. As such, we recommend instantiating the client once per application in most settings.

When all available connections from the pool are checked out, requests wait for a new connection to become available, with queue time counting towards the request timeout.

Unless otherwise specified, other classes in the SDK do not have locks protecting their underlying data structure.

## Making custom or undocumented requests

### Undocumented properties

You can send undocumented parameters to any endpoint, and read undocumented response properties, like so:

<Warning>
The `extra_` parameters of the same name overrides the documented parameters. For security reasons, ensure these methods are only used with trusted input data.
</Warning>

```ruby
message =
  anthropic.messages.create(
    max_tokens: 1024,
    messages: [{role: "user", content: "Hello, Claude"}],
    model: :"claude-opus-4-6",
    request_options: {
      extra_query: {my_query_parameter: value},
      extra_body: {my_body_parameter: value},
      extra_headers: {"my-header": value}
    }
  )

puts(message[:my_undocumented_property])
```

### Undocumented request params

If you want to explicitly send an extra param, you can do so with the `extra_query`, `extra_body`, and `extra_headers` under the `request_options:` parameter when making a request, as seen in the examples above.

### Undocumented endpoints

To make requests to undocumented endpoints while retaining the benefit of auth, retries, and so on, you can make requests using `client.request`, like so:

```ruby
response = client.request(
  method: :post,
  path: '/undocumented/endpoint',
  query: {"dog": "woof"},
  headers: {"useful-header": "interesting-value"},
  body: {"hello": "world"}
)
```

## Platform integrations

<Note>
For detailed platform setup guides, see:
- [Amazon Bedrock](/docs/en/build-with-claude/claude-on-amazon-bedrock)
- [Google Vertex AI](/docs/en/build-with-claude/claude-on-vertex-ai)
</Note>

### Amazon Bedrock

This library also provides support for the [Anthropic Bedrock API](https://aws.amazon.com/bedrock/claude/) if you install this library with the `aws-sdk-bedrockruntime` gem.

You can then instantiate a separate `Anthropic::BedrockClient` class, and use AWS's standard guide for configuring credentials. It has the same API as the base `Anthropic::Client` class.

Note that the model ID required is different for Bedrock models, and, depending on the model you want to use, you will need to use either AWS's model ID for Anthropic models -- which can be found in [AWS's Bedrock model catalog](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html) -- or an inference profile id (e.g. `us.anthropic.claude-3-5-haiku-20241022-v1:0` for Claude 3.5 Haiku).

```ruby
require "anthropic"

anthropic = Anthropic::BedrockClient.new

message = anthropic.messages.create(
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: "Hello, Claude"
    }
  ],
  model: "anthropic.claude-opus-4-6-v1"
)

puts(message)
```

### Google Vertex AI

This library also provides support for the [Anthropic Vertex API](https://cloud.google.com/vertex-ai?hl=en) if you install this library with the `googleauth` gem.

You can then import and instantiate a separate `Anthropic::VertexClient` class, and use Google's guide for configuring [Application Default Credentials](https://cloud.google.com/docs/authentication/provide-credentials-adc). It has the same API as the base `Anthropic::Client` class.

```ruby
require "anthropic"

anthropic = Anthropic::VertexClient.new(region: "us-east5", project_id: "my-project-id")

message = anthropic.messages.create(
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: "Hello, Claude"
    }
  ],
  model: "claude-opus-4-6"
)

puts(message)
```

## Additional resources

- [GitHub repository](https://github.com/anthropics/anthropic-sdk-ruby)
- [RubyDoc documentation](https://gemdocs.org/gems/anthropic)
- [API reference](/docs/en/api/overview)
- [Streaming guide](/docs/en/build-with-claude/streaming)






# C# SDK

Install and configure the Anthropic C# SDK for .NET applications with IChatClient integration

---

The Anthropic C# SDK provides convenient access to the Anthropic REST API from applications written in C#.

<Info>
The C# SDK is currently in beta. APIs may change between versions.
</Info>

<Info>
For API feature documentation with code examples, see the [API reference](/docs/en/api/overview). This page covers C#-specific SDK features and configuration.
</Info>

<Warning>
As of version 10+, the `Anthropic` package is now the official Anthropic SDK for C#. Package versions 3.X and below were previously used for the tryAGI community-built SDK, which has moved to [`tryAGI.Anthropic`](https://www.nuget.org/packages/tryagi.Anthropic/). If you need to continue using the former client in your project, update your package reference to `tryAGI.Anthropic`.
</Warning>

## Installation

Install the package from [NuGet](https://www.nuget.org/packages/Anthropic):

```bash
dotnet add package Anthropic
```

## Requirements

This library requires .NET Standard 2.0 or later.

## Usage

```csharp
using System;
using Anthropic;
using Anthropic.Models.Messages;

AnthropicClient client = new();

MessageCreateParams parameters = new()
{
    MaxTokens = 1024,
    Messages =
    [
        new()
        {
            Role = Role.User,
            Content = "Hello, Claude",
        },
    ],
    Model = "claude-opus-4-6",
};

var message = await client.Messages.Create(parameters);

Console.WriteLine(message);
```

## Client configuration

Configure the client using environment variables:

```csharp
using Anthropic;

// Configured using the ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN and ANTHROPIC_BASE_URL environment variables
AnthropicClient client = new();
```

Or manually:

```csharp
using Anthropic;

AnthropicClient client = new() { ApiKey = "my-anthropic-api-key" };
```

Or using a combination of the two approaches.

See this table for the available options:

| Property    | Environment variable   | Required | Default value                 |
| ----------- | ---------------------- | -------- | ----------------------------- |
| `ApiKey`    | `ANTHROPIC_API_KEY`    | false    | -                             |
| `AuthToken` | `ANTHROPIC_AUTH_TOKEN` | false    | -                             |
| `BaseUrl`   | `ANTHROPIC_BASE_URL`   | true     | `"https://api.anthropic.com"` |

### Modifying configuration

To temporarily use a modified client configuration, while reusing the same connection and thread pools, call `WithOptions` on any client or service:

```csharp
using System;

var message = await client
    .WithOptions(options =>
        options with
        {
            BaseUrl = "https://example.com",
            Timeout = TimeSpan.FromSeconds(42),
        }
    )
    .Messages.Create(parameters);

Console.WriteLine(message);
```

Using a [`with` expression](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/with-expression) makes it easy to construct the modified options.

The `WithOptions` method does not affect the original client or service.

## Streaming

The SDK defines methods that return response "chunk" streams, where each chunk can be individually processed as soon as it arrives instead of waiting on the full response. Streaming methods return [`IAsyncEnumerable`](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.iasyncenumerable-1):

```csharp
using System;
using Anthropic.Models.Messages;

MessageCreateParams parameters = new()
{
    MaxTokens = 1024,
    Messages =
    [
        new()
        {
            Role = Role.User,
            Content = "Hello, Claude",
        },
    ],
    Model = "claude-opus-4-6",
};

await foreach (var message in client.Messages.CreateStreaming(parameters))
{
    Console.WriteLine(message);
}
```

## Error handling

The SDK throws custom unchecked exception types:

- `AnthropicApiException`: Base class for API errors. See this table for which exception subclass is thrown for each HTTP status code:

| Status | Exception                                |
| ------ | ---------------------------------------- |
| 400    | `AnthropicBadRequestException`           |
| 401    | `AnthropicUnauthorizedException`         |
| 403    | `AnthropicForbiddenException`            |
| 404    | `AnthropicNotFoundException`             |
| 422    | `AnthropicUnprocessableEntityException`  |
| 429    | `AnthropicRateLimitException`            |
| 5xx    | `Anthropic5xxException`                  |
| others | `AnthropicUnexpectedStatusCodeException` |

Additionally, all 4xx errors inherit from `Anthropic4xxException`.

- `AnthropicSseException`: thrown for errors encountered during SSE streaming after a successful initial HTTP response.

- `AnthropicIOException`: I/O networking errors.

- `AnthropicInvalidDataException`: Failure to interpret successfully parsed data. For example, when accessing a property that's supposed to be required, but the API unexpectedly omitted it from the response.

- `AnthropicException`: Base class for all exceptions.

## Retries

The SDK automatically retries 2 times by default, with a short exponential backoff between requests.

Only the following error types are retried:

- Connection errors (for example, due to a network connectivity problem)
- 408 Request Timeout
- 409 Conflict
- 429 Rate Limit
- 5xx Internal

The API may also explicitly instruct the SDK to retry or not retry a request.

To set a custom number of retries, configure the client using the `MaxRetries` property:

```csharp
using Anthropic;

AnthropicClient client = new() { MaxRetries = 3 };
```

Or configure a single method call using `WithOptions`:

```csharp
using System;

var message = await client
    .WithOptions(options =>
        options with { MaxRetries = 3 }
    )
    .Messages.Create(parameters);

Console.WriteLine(message);
```

## Timeouts

Requests time out after 10 minutes by default.

To set a custom timeout, configure the client using the `Timeout` option:

```csharp
using System;
using Anthropic;

AnthropicClient client = new() { Timeout = TimeSpan.FromSeconds(42) };
```

Or configure a single method call using `WithOptions`:

```csharp
using System;

var message = await client
    .WithOptions(options =>
        options with { Timeout = TimeSpan.FromSeconds(42) }
    )
    .Messages.Create(parameters);

Console.WriteLine(message);
```

## Pagination

### Auto-pagination

To iterate through all results across all pages, use the `Paginate` method, which automatically fetches more pages as needed. The method returns an [`IAsyncEnumerable`](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.iasyncenumerable-1):

```csharp
using System;

var page = await client.Beta.Messages.Batches.List(parameters);
await foreach (var item in page.Paginate())
{
    Console.WriteLine(item);
}
```

### Manual pagination

To access individual page items and manually request the next page, use the `Items` property, and `HasNext` and `Next` methods:

```csharp
using System;

var page = await client.Beta.Messages.Batches.List();
while (true)
{
    foreach (var item in page.Items)
    {
        Console.WriteLine(item);
    }
    if (!page.HasNext())
    {
        break;
    }
    page = await page.Next();
}
```

## Response validation

In rare cases, the API may return a response that doesn't match the expected type. By default, the SDK will not throw an exception in this case. It will throw `AnthropicInvalidDataException` only if you directly access the property.

If you would prefer to check that the response is completely well-typed upfront, then either call `Validate`:

```csharp
var message = await client.Messages.Create(parameters);
message.Validate();
```

Or configure the client using the `ResponseValidation` option:

```csharp
using Anthropic;

AnthropicClient client = new() { ResponseValidation = true };
```

Or configure a single method call using `WithOptions`:

```csharp
using System;

var message = await client
    .WithOptions(options =>
        options with { ResponseValidation = true }
    )
    .Messages.Create(parameters);

Console.WriteLine(message);
```

## IChatClient integration

The SDK provides an implementation of the `IChatClient` interface from the `Microsoft.Extensions.AI.Abstractions` library. This enables `AnthropicClient` to be used with other libraries that integrate with these core abstractions. For example, tools in the MCP C# SDK (`ModelContextProtocol`) library can be used directly with an `AnthropicClient` exposed via `IChatClient`.

```csharp
using Anthropic;
using Microsoft.Extensions.AI;
using ModelContextProtocol.Client;

// Configured using the ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN and ANTHROPIC_BASE_URL environment variables
IChatClient chatClient = client.AsIChatClient("claude-opus-4-6")
    .AsBuilder()
    .UseFunctionInvocation()
    .Build();

// Using McpClient from the MCP C# SDK
McpClient learningServer = await McpClient.CreateAsync(
    new HttpClientTransport(new() { Endpoint = new("https://learn.microsoft.com/api/mcp") }));

ChatOptions options = new() { Tools = [.. await learningServer.ListToolsAsync()] };

Console.WriteLine(await chatClient.GetResponseAsync("Tell me about IChatClient", options));
```

## HTTP client customization

To send a request to the Claude API, build an instance of some `Params` class and pass it to the corresponding client method. When the response is received, it will be deserialized into an instance of a C# class.

For example, `client.Messages.Create` should be called with an instance of `MessageCreateParams`, and it will return an instance of `Task<Message>`.

## Advanced usage

### Binary responses

The SDK defines methods that return binary responses, which are used for API responses that shouldn't necessarily be parsed, like non-JSON data.

These methods return `HttpResponse`:

```csharp
using System;
using Anthropic.Models.Beta.Files;

FileDownloadParams parameters = new() { FileID = "file_id" };

var response = await client.Beta.Files.Download(parameters);

Console.WriteLine(response);
```

To save the response content to a file:

```csharp
using System.IO;

using var response = await client.Beta.Files.Download(parameters);
using var contentStream = await response.ReadAsStream();
using var fileStream = File.Open(path, FileMode.OpenOrCreate);
await contentStream.CopyToAsync(fileStream);
```

### Raw responses

The SDK defines methods that deserialize responses into instances of C# classes. To access response headers, status code, or the raw response body, prefix any HTTP method call on a client or service with `WithRawResponse`:

```csharp
var response = await client.WithRawResponse.Messages.Create(parameters);
var statusCode = response.StatusCode;
var headers = response.Headers;
```

The raw `HttpResponseMessage` can also be accessed through the `RawMessage` property.

For non-streaming responses, you can deserialize the response into an instance of a C# class if needed:

```csharp
using System;
using Anthropic.Models.Messages;

var response = await client.WithRawResponse.Messages.Create(parameters);
Message deserialized = await response.Deserialize();
Console.WriteLine(deserialized);
```

For streaming responses, you can deserialize the response to an `IAsyncEnumerable` if needed:

```csharp
using System;

var response = await client.WithRawResponse.Messages.CreateStreaming(parameters);
await foreach (var item in response.Enumerate())
{
    Console.WriteLine(item);
}
```

### Logging

Enable debug logging via environment variable:

```bash
export ANTHROPIC_LOG=debug
```

### Undocumented API functionality

The SDK is typed for convenient usage of the documented API. However, it also supports working with undocumented or not yet supported parts of the API.

## Beta features

<Warning>
While this package is versioned as 10+, it is currently in beta. During the beta period, breaking changes may occur in minor or patch releases. Once the library reaches stable release, SemVer conventions will be followed more strictly. Share feedback by [filing an issue](https://www.github.com/anthropics/anthropic-sdk-csharp/issues/new).
</Warning>

## Additional resources

- [GitHub repository](https://github.com/anthropics/anthropic-sdk-csharp)
- [NuGet package](https://www.nuget.org/packages/Anthropic)
- [API reference](/docs/en/api/overview)
- [Streaming guide](/docs/en/build-with-claude/streaming)





# PHP SDK

Install and configure the Anthropic PHP SDK with value objects and builder patterns

---

The Anthropic PHP library provides convenient access to the Anthropic REST API from any PHP 8.1.0+ application.

<Info>
The PHP SDK is currently in beta. APIs may change between versions.
</Info>

<Info>
For API feature documentation with code examples, see the [API reference](/docs/en/api/overview). This page covers PHP-specific SDK features and configuration.
</Info>

## Installation

```bash
composer require "anthropic-ai/sdk"
```

## Requirements

PHP 8.1.0 or higher.

## Usage

This library uses named parameters to specify optional arguments. Parameters with a default value must be set by name.

```php
<?php

use Anthropic\Client;

$client = new Client(
  apiKey: getenv("ANTHROPIC_API_KEY") ?: "my-anthropic-api-key"
);

$message = $client->messages->create(
  maxTokens: 1024,
  messages: [['role' => 'user', 'content' => 'Hello, Claude']],
  model: 'claude-opus-4-6',
);

var_dump($message->content);
```

## Value objects

It is recommended to use the static `with` constructor `Base64ImageSource::with(data: "U3RhaW5sZXNzIHJvY2tz", ...)` and named parameters to initialize value objects.

However, builders are also provided `(new Base64ImageSource)->withData("U3RhaW5sZXNzIHJvY2tz")`.

## Streaming

The SDK provides support for streaming responses using Server-Sent Events (SSE).

```php
<?php

use Anthropic\Client;

$client = new Client(
  apiKey: getenv("ANTHROPIC_API_KEY") ?: "my-anthropic-api-key"
);

$stream = $client->messages->createStream(
  maxTokens: 1024,
  messages: [['role' => 'user', 'content' => 'Hello, Claude']],
  model: 'claude-opus-4-6',
);

foreach ($stream as $message) {
  var_dump($message);
}
```

## Error handling

When the library is unable to connect to the API, or if the API returns a non-success status code (i.e., 4xx or 5xx response), a subclass of `Anthropic\Core\Exceptions\APIException` will be thrown:

```php
<?php

use Anthropic\Core\Exceptions\APIConnectionException;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\RateLimitException;

try {
  $message = $client->messages->create(
    maxTokens: 1024,
    messages: [['role' => 'user', 'content' => 'Hello, Claude']],
    model: 'claude-opus-4-6',
  );
} catch (APIConnectionException $e) {
  echo "The server could not be reached", PHP_EOL;
  var_dump($e->getPrevious());
} catch (RateLimitException $_) {
  echo "A 429 status code was received; we should back off a bit.", PHP_EOL;
} catch (APIStatusException $e) {
  echo "Another non-200-range status code was received", PHP_EOL;
  echo $e->getMessage();
}
```

Error codes are as follows:

| Cause            | Error Type                     |
| ---------------- | ------------------------------ |
| HTTP 400         | `BadRequestException`          |
| HTTP 401         | `AuthenticationException`      |
| HTTP 403         | `PermissionDeniedException`    |
| HTTP 404         | `NotFoundException`            |
| HTTP 409         | `ConflictException`            |
| HTTP 422         | `UnprocessableEntityException` |
| HTTP 429         | `RateLimitException`           |
| HTTP >= 500      | `InternalServerException`      |
| Other HTTP error | `APIStatusException`           |
| Timeout          | `APITimeoutException`          |
| Network error    | `APIConnectionException`       |

## Retries

Certain errors are automatically retried 2 times by default, with a short exponential backoff.

Connection errors (for example, due to a network connectivity problem), 408 Request Timeout, 409 Conflict, 429 Rate Limit, >=500 Internal errors, and timeouts are all retried by default.

You can use the `maxRetries` option to configure or disable this:

```php
<?php

use Anthropic\Client;
use Anthropic\RequestOptions;

// Configure the default for all requests:
$client = new Client(maxRetries: 0);

// Or, configure per-request:
$result = $client->messages->create(
  maxTokens: 1024,
  messages: [['role' => 'user', 'content' => 'Hello, Claude']],
  model: 'claude-opus-4-6',
  requestOptions: RequestOptions::with(maxRetries: 5),
);
```

## Pagination

List methods in the Claude API are paginated.

This library provides auto-paginating iterators with each list response, so you do not have to request successive pages manually:

```php
<?php

use Anthropic\Client;

$client = new Client(
  apiKey: getenv("ANTHROPIC_API_KEY") ?: "my-anthropic-api-key"
);

$page = $client->beta->messages->batches->list();

var_dump($page);

// fetch items from the current page
foreach ($page->getItems() as $item) {
  var_dump($item->id);
}
// make additional network requests to fetch items from all pages, including and after the current page
foreach ($page->pagingEachItem() as $item) {
  var_dump($item->id);
}
```

## Advanced usage

### Undocumented properties

You can send undocumented parameters to any endpoint, and read undocumented response properties, like so:

<Note>
The `extra*` parameters of the same name override the documented parameters.
</Note>

```php
<?php

use Anthropic\RequestOptions;

$message = $client->messages->create(
  maxTokens: 1024,
  messages: [['role' => 'user', 'content' => 'Hello, Claude']],
  model: 'claude-opus-4-6',
  requestOptions: RequestOptions::with(
    extraQueryParams: ['my_query_parameter' => 'value'],
    extraBodyParams: ['my_body_parameter' => 'value'],
    extraHeaders: ['my-header' => 'value'],
  ),
);
```

### Undocumented request params

If you want to explicitly send an extra param, you can do so with the `extraQueryParams`, `extraBodyParams`, and `extraHeaders` options under `RequestOptions::with()` when making a request, as seen in the example above.

### Undocumented endpoints

To make requests to undocumented endpoints while retaining the benefit of auth, retries, and so on, you can make requests using `client->request`, like so:

```php
<?php

$response = $client->request(
  method: "post",
  path: '/undocumented/endpoint',
  query: ['dog' => 'woof'],
  headers: ['useful-header' => 'interesting-value'],
  body: ['hello' => 'world']
);
```

## Additional resources

- [GitHub repository](https://github.com/anthropics/anthropic-sdk-php)
- [Packagist](https://packagist.org/packages/anthropic-ai/sdk)
- [API reference](/docs/en/api/overview)
- [Streaming guide](/docs/en/build-with-claude/streaming)






