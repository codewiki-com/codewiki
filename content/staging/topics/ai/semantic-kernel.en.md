---
title: Semantic Kernel AI Framework
description: Build AI applications with Semantic Kernel
track: ai
section: agents
difficulty: intermediate
tags:
  - Semantic Kernel
  - Microsoft
  - AI
  - enterprise
status: imported
origin: old/src/content/docs/ai/semantic-kernel.en.md
divergence: 0.354
issues:
  - divergent
legacy:
  category: AI
  subcategory: LLM
  order: 31
  lastUpdated: 2026-01-07
---

## Overview

Semantic Kernel is an open-source SDK developed by Microsoft that empowers developers to build, orchestrate, and deploy AI agents and multi-agent systems with enterprise-grade reliability and flexibility. It provides a lightweight, model-agnostic framework that integrates large language models (LLMs) with conventional programming languages like C#, Python, and Java.

### Why Choose Semantic Kernel?

| Feature | Description |
|---------|-------------|
| **Model Agnostic** | Works with OpenAI, Azure OpenAI, Hugging Face, and other LLM providers |
| **Enterprise Ready** | Built for production with security, scalability, and reliability in mind |
| **Plugin Architecture** | Extensible design allowing native code and AI functions to work together |
| **Multi-Language Support** | Available for .NET, Python, and Java ecosystems |
| **Microsoft Integration** | Seamless integration with Azure services and Microsoft 365 |
| **Function Calling** | Native support for automatic function invocation with modern LLMs |

### Installation and Setup

**.NET Installation:**

```bash
# Install core package
dotnet add package Microsoft.SemanticKernel

# Install additional connectors as needed
dotnet add package Microsoft.SemanticKernel.Connectors.OpenAI
dotnet add package Microsoft.SemanticKernel.Plugins.Memory
```

**Python Installation:**

```bash
# Install core package
pip install semantic-kernel

# Install with Azure OpenAI support
pip install semantic-kernel[azure]
```

**Basic Configuration:**

```csharp
// C# Configuration
using Microsoft.SemanticKernel;

var kernel = Kernel.CreateBuilder()
    .AddAzureOpenAIChatCompletion(
        deploymentName: "gpt-4",
        endpoint: "https://your-endpoint.openai.azure.com/",
        apiKey: "your-api-key"
    )
    .Build();
```

```python
# Python Configuration
import semantic_kernel as sk
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion

kernel = sk.Kernel()

chat_service = OpenAIChatCompletion(
    ai_model_id="gpt-4",
    api_key="your-api-key"
)
kernel.add_service(chat_service)
```

## Core Concepts

Semantic Kernel's architecture is built around several key concepts that work together to create intelligent applications.

### Architecture Overview

```
+------------------------------------------------------------------+
|                     Semantic Kernel Architecture                   |
+------------------------------------------------------------------+
|                                                                    |
|  +------------+    +------------+    +------------+               |
|  |  Plugins   |    |  Planners  |    |  Memory    |               |
|  | (Functions)|    |(Orchestrat)|    | (Context)  |               |
|  +-----+------+    +-----+------+    +-----+------+               |
|        |                 |                 |                       |
|  +-----v-----------------v-----------------v------+               |
|  |                    Kernel                       |               |
|  |  (Orchestration Engine)                        |               |
|  +---------------------+---------------------------+               |
|                        |                                          |
|  +---------------------v---------------------------+               |
|  |              AI Service Connectors              |               |
|  |  (OpenAI, Azure OpenAI, Hugging Face, etc.)   |               |
|  +------------------------------------------------+               |
|                                                                    |
+------------------------------------------------------------------+
```

### The Kernel

The Kernel is the central orchestration engine of Semantic Kernel. It manages plugins, services, and the execution of AI-powered workflows.

```csharp
// C# - Creating and configuring a Kernel
using Microsoft.SemanticKernel;

var builder = Kernel.CreateBuilder();

// Add AI services
builder.AddOpenAIChatCompletion("gpt-4", "api-key");

// Add plugins
builder.Plugins.AddFromType<TimePlugin>();
builder.Plugins.AddFromType<MathPlugin>();

var kernel = builder.Build();

// Invoke a prompt
var result = await kernel.InvokePromptAsync("What is 25 * 4?");
Console.WriteLine(result);
```

```python
# Python - Creating and configuring a Kernel
import semantic_kernel as sk
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion

kernel = sk.Kernel()

# Add AI service
kernel.add_service(OpenAIChatCompletion(
    service_id="chat",
    ai_model_id="gpt-4",
    api_key="your-api-key"
))

# Invoke a prompt
result = await kernel.invoke_prompt("What is 25 * 4?")
print(result)
```

## Plugins

Plugins are the fundamental building blocks in Semantic Kernel. They group related functions that can be exposed to AI applications and orchestrated to accomplish user requests.

### Anatomy of a Plugin

A plugin consists of one or more functions that can be:
- **Native Functions**: Traditional code functions written in C#, Python, or Java
- **Prompt Functions**: AI-powered functions defined using prompt templates

### Creating Native Functions

```csharp
// C# - Native Function Plugin
using Microsoft.SemanticKernel;
using System.ComponentModel;

public class WeatherPlugin
{
    [KernelFunction]
    [Description("Gets the current weather for a specified city")]
    public string GetWeather(
        [Description("The city name")] string city)
    {
        // In production, this would call a weather API
        var weatherData = new Dictionary<string, string>
        {
            { "Seattle", "Rainy, 55F" },
            { "New York", "Sunny, 72F" },
            { "London", "Cloudy, 60F" }
        };

        return weatherData.GetValueOrDefault(city, "Weather data not available");
    }

    [KernelFunction]
    [Description("Gets the weather forecast for the next days")]
    public string GetForecast(
        [Description("The city name")] string city,
        [Description("Number of days")] int days = 3)
    {
        return $"Forecast for {city}: Next {days} days will be mild with occasional rain.";
    }
}

// Register the plugin
kernel.Plugins.AddFromType<WeatherPlugin>();
```

```python
# Python - Native Function Plugin
from semantic_kernel.functions import kernel_function
import random

class GenerateNamesPlugin:
    """Plugin for generating character names."""

    @kernel_function(
        description="Generate character names",
        name="generate_names"
    )
    def generate_names(self) -> str:
        """Generate two random names."""
        names = {"Hoagie", "Hamilton", "Bacon", "Pizza", "Boots", "Shorts", "Tuna"}
        first_name = random.choice(list(names))
        names.remove(first_name)
        second_name = random.choice(list(names))
        return f"{first_name}, {second_name}"

# Register the plugin
kernel.add_plugin(GenerateNamesPlugin(), plugin_name="GenerateNames")
```

### Creating Prompt Functions

```csharp
// C# - Prompt Function
using Microsoft.SemanticKernel;

var summarizeFunction = kernel.CreateFunctionFromPrompt(
    @"Summarize the following text in {{$style}} style:

    {{$input}}

    Summary:",
    new OpenAIPromptExecutionSettings
    {
        MaxTokens = 200,
        Temperature = 0.7
    }
);

var result = await kernel.InvokeAsync(summarizeFunction, new()
{
    ["input"] = "Long article text here...",
    ["style"] = "professional"
});
```

```python
# Python - Prompt Function with Template
prompt = """
Write a short story about two Corgis on an adventure.
The story must be:
- G rated
- Have a positive message
- No sexism, racism or other bias/bigotry
- Be exactly {{ $paragraph_count }} paragraphs long
- Be written in this language: {{ $language }}
- The two names of the corgis are {{GenerateNames.generate_names}}
"""

story_function = kernel.add_function(
    function_name="write_story",
    plugin_name="StoryWriter",
    prompt=prompt
)

result = await kernel.invoke(story_function,
    paragraph_count=3,
    language="English"
)
```

### Calling Functions from Prompts

Semantic Kernel allows calling native functions directly from prompt templates using the `{{plugin_name.function_name}}` syntax:

```python
# Define a prompt that calls a native function
prompt = """
Information about me, from previous conversations:
- {{recall 'budget by year'}} What is my budget for 2024?
- {{recall 'savings from previous year'}} What are my savings from 2023?
- {{recall 'investments'}} What are my investments?

Based on this information, {{$request}}
"""
```

## Function Calling and Auto-Invocation

Semantic Kernel provides powerful automatic function calling capabilities that allow the AI to decide when and how to use available functions.

### Automatic Function Calling

```csharp
// C# - Auto Function Calling
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;

var kernel = Kernel.CreateBuilder()
    .AddOpenAIChatCompletion("gpt-4", apiKey)
    .Build();

// Add plugins
kernel.Plugins.AddFromType<WeatherPlugin>();
kernel.Plugins.AddFromType<TimePlugin>();

// Configure auto function calling
OpenAIPromptExecutionSettings settings = new()
{
    FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
};

// The AI will automatically call functions as needed
var result = await kernel.InvokePromptAsync(
    "Check the current UTC time and return the current weather in Seattle.",
    new(settings)
);

Console.WriteLine(result);
```

```python
# Python - Custom Plugin with Function Calling
import semantic_kernel as sk
from semantic_kernel.functions import kernel_function
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion
from datetime import datetime

class MyCustomPlugin:
    @kernel_function(
        description="Gets the current date and time.",
        name="getCurrentDateTime"
    )
    def get_current_datetime(self) -> str:
        return datetime.now().isoformat()

async def function_calling_example():
    kernel = sk.Kernel()

    # Configure AI service
    kernel.add_service(OpenAIChatCompletion(
        ai_model_id="gpt-4",
        api_key="your-api-key"
    ))

    # Add custom plugin
    kernel.add_plugin(MyCustomPlugin(), "MyCustomPlugin")

    # The kernel will use available functions to answer
    result = await kernel.invoke_prompt(
        "What is the current date and time? Please use the available tools."
    )
    print(result)
```

### Function Choice Behaviors

Semantic Kernel supports different function calling modes:

| Mode | Description |
|------|-------------|
| `Auto()` | AI decides when to call functions automatically |
| `Required()` | AI must call at least one function |
| `None()` | Disable function calling |

```csharp
// Different function choice behaviors
OpenAIPromptExecutionSettings autoSettings = new()
{
    FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
};

OpenAIPromptExecutionSettings requiredSettings = new()
{
    FunctionChoiceBehavior = FunctionChoiceBehavior.Required()
};

OpenAIPromptExecutionSettings noFunctions = new()
{
    FunctionChoiceBehavior = FunctionChoiceBehavior.None()
};
```

## Memory and Semantic Storage

Semantic Kernel provides memory capabilities that allow applications to store and retrieve information based on semantic meaning, enabling context-aware AI interactions.

### Setting Up Memory

```csharp
// C# - Memory with ChromaDB
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Memory;
using Microsoft.SemanticKernel.Plugins.Memory;

var kernel = Kernel.CreateBuilder()
    .AddOpenAIChatCompletion("gpt-4", "api-key")
    .Build();

// Build memory with vector store
var memory = new MemoryBuilder()
    .WithChromaMemoryStore("https://chroma-endpoint")
    .WithOpenAITextEmbeddingGeneration("text-embedding-ada-002", "api-key")
    .Build();

// Add TextMemoryPlugin to kernel
kernel.ImportPluginFromObject(new TextMemoryPlugin(memory));

// Use memory in prompts
var result = await kernel.InvokePromptAsync(
    "{{recall 'Company budget by year'}} What is my budget for 2024?"
);
```

```python
# Python - Memory Setup
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion, OpenAITextEmbedding
from semantic_kernel.core_plugins.text_memory_plugin import TextMemoryPlugin
from semantic_kernel.kernel import Kernel
from semantic_kernel.memory.semantic_text_memory import SemanticTextMemory
from semantic_kernel.memory.volatile_memory_store import VolatileMemoryStore

kernel = Kernel()

# Add services
chat_service = OpenAIChatCompletion(
    service_id="chat",
    ai_model_id="gpt-4"
)
embedding_gen = OpenAITextEmbedding(ai_model_id="text-embedding-ada-002")

kernel.add_service(chat_service)
kernel.add_service(embedding_gen)

# Setup memory
memory = SemanticTextMemory(
    storage=VolatileMemoryStore(),
    embeddings_generator=embedding_gen
)

# Add TextMemoryPlugin
kernel.add_plugin(TextMemoryPlugin(memory), "TextMemoryPlugin")
```

### Saving and Retrieving Memories

```csharp
// C# - Working with Memory
// Save information to memory
await memory.SaveInformationAsync(
    collection: "company-info",
    id: "budget-2024",
    text: "The company budget for 2024 is $5 million, allocated across engineering, marketing, and operations."
);

await memory.SaveInformationAsync(
    collection: "company-info",
    id: "team-size",
    text: "The engineering team consists of 50 developers across frontend, backend, and DevOps."
);

// Search memory semantically
var searchResults = await memory.SearchAsync(
    collection: "company-info",
    query: "How many engineers do we have?",
    limit: 3
);

foreach (var result in searchResults)
{
    Console.WriteLine($"Relevance: {result.Relevance:F2}");
    Console.WriteLine($"Text: {result.Metadata.Text}");
}
```

### Chat with Memory

```python
# Python - Chat Function with Memory
from semantic_kernel.functions import KernelFunction
from semantic_kernel.prompt_template import PromptTemplateConfig

async def setup_chat_with_memory(kernel, service_id):
    prompt = """
    ChatBot can have a conversation with you about any topic.
    It can give explicit instructions or say 'I don't know' if
    it does not have an answer.

    Information about me, from previous conversations:
    - {{recall 'budget by year'}} What is my budget for 2024?
    - {{recall 'savings from previous year'}} What are my savings from 2023?
    - {{recall 'investments'}} What are my investments?

    {{$request}}
    """.strip()

    prompt_config = PromptTemplateConfig(
        template=prompt,
        execution_settings={
            service_id: kernel.get_service(service_id)
                .get_prompt_execution_settings_class()(service_id=service_id)
        }
    )

    return kernel.add_function(
        function_name="chat_with_memory",
        plugin_name="chat",
        prompt_template_config=prompt_config
    )
```

## AI Service Connectors

Semantic Kernel provides connectors for various AI services, making it easy to switch between providers or use multiple services together.

### Supported Connectors

| Provider | Chat Completion | Embeddings | Image Generation |
|----------|-----------------|------------|------------------|
| OpenAI | Yes | Yes | Yes |
| Azure OpenAI | Yes | Yes | Yes |
| Hugging Face | Yes | Yes | - |
| Google AI | Yes | Yes | - |
| ONNX | Yes | Yes | - |
| Local Models | Yes | Yes | - |

### Configuring Multiple Services

```csharp
// C# - Multiple AI Services
using Microsoft.SemanticKernel;

var kernel = Kernel.CreateBuilder()
    // Primary chat service
    .AddAzureOpenAIChatCompletion(
        deploymentName: "gpt-4",
        endpoint: "https://your-azure-endpoint.openai.azure.com/",
        apiKey: "azure-api-key",
        serviceId: "azure-gpt4"
    )
    // Backup/alternative service
    .AddOpenAIChatCompletion(
        modelId: "gpt-3.5-turbo",
        apiKey: "openai-api-key",
        serviceId: "openai-gpt35"
    )
    // Embedding service
    .AddAzureOpenAITextEmbeddingGeneration(
        deploymentName: "text-embedding-ada-002",
        endpoint: "https://your-azure-endpoint.openai.azure.com/",
        apiKey: "azure-api-key"
    )
    .Build();

// Use specific service
var settings = new OpenAIPromptExecutionSettings { ServiceId = "azure-gpt4" };
var result = await kernel.InvokePromptAsync("Hello!", new(settings));
```

### ONNX Connector for Local Models

```csharp
// C# - Using ONNX for Local Models (RAG Example)
// Semantic Kernel features used:
// - Chat Completion Service (Onnx Connector)
// - Text Embeddings Generation Service (Onnx Connector)
// - Vector Store (InMemoryVectorStore)
// - Semantic Text Memory
// - Text Memory Plugin (Recall function)

var kernel = Kernel.CreateBuilder()
    .AddOnnxRuntimeGenAIChatCompletion(
        modelPath: "./models/phi-3",
        serviceId: "local-chat"
    )
    .AddOnnxRuntimeGenAITextEmbeddingGeneration(
        modelPath: "./models/embeddings",
        serviceId: "local-embeddings"
    )
    .Build();
```

## Building Enterprise AI Applications

Semantic Kernel is designed for building production-ready enterprise applications. Here are patterns and practices for building robust AI systems.

### RAG (Retrieval-Augmented Generation) Pattern

```csharp
// C# - Complete RAG Implementation
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Memory;
using Microsoft.SemanticKernel.Plugins.Memory;

public class EnterpriseRAGService
{
    private readonly Kernel _kernel;
    private readonly ISemanticTextMemory _memory;

    public EnterpriseRAGService(string azureEndpoint, string apiKey)
    {
        _kernel = Kernel.CreateBuilder()
            .AddAzureOpenAIChatCompletion("gpt-4", azureEndpoint, apiKey)
            .Build();

        _memory = new MemoryBuilder()
            .WithAzureOpenAITextEmbeddingGeneration(
                "text-embedding-ada-002",
                azureEndpoint,
                apiKey
            )
            .WithMemoryStore(new VolatileMemoryStore())
            .Build();

        _kernel.ImportPluginFromObject(new TextMemoryPlugin(_memory));
    }

    public async Task IndexDocumentAsync(string collection, string docId, string content)
    {
        // Chunk the document for better retrieval
        var chunks = ChunkDocument(content, maxChunkSize: 500);

        for (int i = 0; i < chunks.Count; i++)
        {
            await _memory.SaveInformationAsync(
                collection: collection,
                id: $"{docId}-chunk-{i}",
                text: chunks[i],
                description: $"Chunk {i} of document {docId}"
            );
        }
    }

    public async Task<string> QueryAsync(string collection, string question)
    {
        // Retrieve relevant context
        var searchResults = await _memory.SearchAsync(collection, question, limit: 5);
        var context = string.Join("\n\n", searchResults.Select(r => r.Metadata.Text));

        // Generate response with context
        var prompt = $@"
            Answer the question based on the following context.
            If the context doesn't contain relevant information, say so.

            Context:
            {context}

            Question: {question}

            Answer:";

        var result = await _kernel.InvokePromptAsync(prompt);
        return result.ToString();
    }

    private List<string> ChunkDocument(string content, int maxChunkSize)
    {
        // Implementation of document chunking
        var chunks = new List<string>();
        var paragraphs = content.Split("\n\n");
        var currentChunk = "";

        foreach (var para in paragraphs)
        {
            if (currentChunk.Length + para.Length > maxChunkSize)
            {
                if (!string.IsNullOrEmpty(currentChunk))
                    chunks.Add(currentChunk);
                currentChunk = para;
            }
            else
            {
                currentChunk += (string.IsNullOrEmpty(currentChunk) ? "" : "\n\n") + para;
            }
        }

        if (!string.IsNullOrEmpty(currentChunk))
            chunks.Add(currentChunk);

        return chunks;
    }
}
```

### Multi-Agent Systems

```csharp
// C# - Multi-Agent Pattern
using Microsoft.SemanticKernel;

public class MultiAgentOrchestrator
{
    private readonly Kernel _researcherKernel;
    private readonly Kernel _writerKernel;
    private readonly Kernel _reviewerKernel;

    public MultiAgentOrchestrator(string apiKey)
    {
        // Researcher agent - focuses on gathering information
        _researcherKernel = CreateKernel(apiKey, "researcher");
        _researcherKernel.Plugins.AddFromType<WebSearchPlugin>();
        _researcherKernel.Plugins.AddFromType<DocumentPlugin>();

        // Writer agent - focuses on content creation
        _writerKernel = CreateKernel(apiKey, "writer");

        // Reviewer agent - focuses on quality assurance
        _reviewerKernel = CreateKernel(apiKey, "reviewer");
    }

    public async Task<string> CreateContentAsync(string topic)
    {
        // Step 1: Research
        var researchPrompt = $@"
            Research the topic: {topic}
            Gather key facts, statistics, and expert opinions.
            Return a structured summary of findings.";

        var research = await _researcherKernel.InvokePromptAsync(researchPrompt);

        // Step 2: Write
        var writePrompt = $@"
            Write a comprehensive article about: {topic}

            Use these research findings:
            {research}

            Create engaging, well-structured content.";

        var draft = await _writerKernel.InvokePromptAsync(writePrompt);

        // Step 3: Review and improve
        var reviewPrompt = $@"
            Review and improve this article:
            {draft}

            Check for:
            - Accuracy
            - Clarity
            - Engagement
            - Grammar

            Return the improved version.";

        var finalContent = await _reviewerKernel.InvokePromptAsync(reviewPrompt);

        return finalContent.ToString();
    }

    private Kernel CreateKernel(string apiKey, string role)
    {
        return Kernel.CreateBuilder()
            .AddOpenAIChatCompletion("gpt-4", apiKey)
            .Build();
    }
}
```

### Dependency Injection Integration

```csharp
// C# - ASP.NET Core Integration
using Microsoft.SemanticKernel;
using Microsoft.Extensions.DependencyInjection;

public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        // Register Semantic Kernel
        services.AddKernel()
            .AddAzureOpenAIChatCompletion(
                deploymentName: Configuration["AzureOpenAI:DeploymentName"],
                endpoint: Configuration["AzureOpenAI:Endpoint"],
                apiKey: Configuration["AzureOpenAI:ApiKey"]
            );

        // Register plugins
        services.AddSingleton<WeatherPlugin>();
        services.AddSingleton<DatabasePlugin>();

        // Configure kernel with plugins
        services.Configure<KernelPluginCollection>(plugins =>
        {
            plugins.AddFromType<WeatherPlugin>();
            plugins.AddFromType<DatabasePlugin>();
        });

        // Register AI services
        services.AddScoped<IAIAssistantService, AIAssistantService>();
    }
}

// Controller using Semantic Kernel
[ApiController]
[Route("api/[controller]")]
public class AssistantController : ControllerBase
{
    private readonly Kernel _kernel;

    public AssistantController(Kernel kernel)
    {
        _kernel = kernel;
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequest request)
    {
        var settings = new OpenAIPromptExecutionSettings
        {
            FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
        };

        var result = await _kernel.InvokePromptAsync(request.Message, new(settings));

        return Ok(new { response = result.ToString() });
    }
}
```

### Error Handling and Resilience

```csharp
// C# - Robust Error Handling
using Microsoft.SemanticKernel;
using Polly;

public class ResilientAIService
{
    private readonly Kernel _kernel;
    private readonly IAsyncPolicy _retryPolicy;

    public ResilientAIService(Kernel kernel)
    {
        _kernel = kernel;

        // Configure retry policy with exponential backoff
        _retryPolicy = Policy
            .Handle<HttpRequestException>()
            .Or<TaskCanceledException>()
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)),
                onRetry: (exception, timeSpan, retryCount, context) =>
                {
                    Console.WriteLine($"Retry {retryCount} after {timeSpan.TotalSeconds}s due to: {exception.Message}");
                }
            );
    }

    public async Task<string> SafeInvokeAsync(string prompt, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _retryPolicy.ExecuteAsync(async () =>
            {
                var settings = new OpenAIPromptExecutionSettings
                {
                    MaxTokens = 1000,
                    Temperature = 0.7
                };

                return await _kernel.InvokePromptAsync(prompt, new(settings), cancellationToken);
            });

            return result.ToString();
        }
        catch (Exception ex)
        {
            // Log the error
            Console.WriteLine($"AI invocation failed: {ex.Message}");

            // Return a fallback response
            return "I apologize, but I'm currently unable to process your request. Please try again later.";
        }
    }
}
```

## Best Practices

### Plugin Design

1. **Single Responsibility**: Each plugin should focus on one domain
2. **Clear Descriptions**: Provide detailed descriptions for functions and parameters
3. **Input Validation**: Validate inputs within your native functions
4. **Error Messages**: Return helpful error messages that the AI can interpret

```csharp
public class BestPracticePlugin
{
    [KernelFunction]
    [Description("Calculates the total price including tax for a given amount and tax rate")]
    public string CalculateTotalWithTax(
        [Description("The base price in dollars (must be positive)")] decimal price,
        [Description("The tax rate as a percentage (e.g., 8.5 for 8.5%)")] decimal taxRate)
    {
        // Input validation
        if (price < 0)
            return "Error: Price must be a positive number";

        if (taxRate < 0 || taxRate > 100)
            return "Error: Tax rate must be between 0 and 100";

        var total = price * (1 + taxRate / 100);
        return $"Total price including {taxRate}% tax: ${total:F2}";
    }
}
```

### Memory Management

1. **Collection Organization**: Use meaningful collection names
2. **Chunking Strategy**: Break large documents into semantic chunks
3. **Metadata**: Include relevant metadata for filtering
4. **Cleanup**: Implement memory cleanup for stale data

### Security Considerations

1. **API Key Management**: Use secure configuration for API keys
2. **Input Sanitization**: Sanitize user inputs before processing
3. **Output Filtering**: Filter sensitive information from responses
4. **Rate Limiting**: Implement rate limiting for production applications

## Interview Topics

### Basic Concepts

**Q1: What is Semantic Kernel and how does it differ from LangChain?**

```
Answer: Semantic Kernel is Microsoft's open-source SDK for building AI applications.

Key differences from LangChain:
1. Language Focus: SK emphasizes C#/.NET, while LangChain is Python-first
2. Enterprise Integration: SK has deeper Microsoft/Azure integration
3. Architecture: SK uses a plugin-based architecture vs LangChain's chain-based
4. Type Safety: SK leverages strong typing in C# for better IDE support
5. Design Philosophy: SK focuses on minimal boilerplate with maximum flexibility
```

**Q2: Explain the plugin architecture in Semantic Kernel**

```
Answer: Plugins in Semantic Kernel are groups of functions exposed to AI applications.

Key aspects:
1. Native Functions: Traditional code decorated with [KernelFunction]
2. Prompt Functions: AI functions defined via prompt templates
3. Automatic Discovery: Functions are auto-discovered via reflection
4. Description Metadata: Rich descriptions enable AI function selection
5. Function Calling: AI can automatically invoke plugin functions
```

### Architecture Questions

**Q3: How does automatic function calling work in Semantic Kernel?**

```
Answer: Automatic function calling allows the AI to decide when to use available functions.

Process:
1. Developer defines plugins with kernel functions
2. Functions are registered with the kernel
3. FunctionChoiceBehavior is set to Auto()
4. AI receives the prompt along with function schemas
5. AI decides which functions to call based on the task
6. Kernel executes the functions and returns results to AI
7. AI formulates final response using function outputs
```

**Q4: Describe the memory system in Semantic Kernel**

```
Answer: Semantic Kernel's memory system enables context-aware AI applications.

Components:
1. Memory Store: Backend storage (volatile, Redis, ChromaDB, etc.)
2. Embedding Generator: Converts text to vector representations
3. SemanticTextMemory: Orchestrates storage and retrieval
4. TextMemoryPlugin: Exposes memory functions to prompts

Features:
- Semantic search using vector similarity
- Collection-based organization
- Metadata support for filtering
- Integration with prompt templates via {{recall}} function
```

### Practical Scenarios

**Q5: How would you implement a RAG system with Semantic Kernel?**

```
Answer: Implementation steps:

1. Document Processing:
   - Load documents using appropriate loaders
   - Chunk documents into manageable pieces
   - Generate embeddings for each chunk

2. Vector Storage:
   - Choose appropriate vector store (ChromaDB, Azure AI Search)
   - Index chunks with metadata

3. Retrieval:
   - Accept user query
   - Generate query embedding
   - Perform similarity search
   - Return top-k relevant chunks

4. Generation:
   - Construct prompt with retrieved context
   - Use chat completion to generate response
   - Include source attribution

5. Optimization:
   - Implement hybrid search (keyword + semantic)
   - Add reranking for better relevance
   - Cache frequently accessed content
```

## Summary

Semantic Kernel is a powerful, production-ready SDK for building AI-powered applications. Its key strengths include:

1. **Model Agnostic**: Switch between AI providers without code changes
2. **Plugin Architecture**: Clean separation of AI and traditional code
3. **Enterprise Ready**: Built for production with Microsoft/Azure integration
4. **Multi-Language**: Support for C#, Python, and Java
5. **Function Calling**: Native support for automatic AI-driven function invocation
6. **Memory System**: Built-in semantic memory for context-aware applications

Learning recommendations:

1. Start with the Kernel basics and simple prompts
2. Learn to create and register plugins
3. Understand function calling and auto-invocation
4. Master the memory system for RAG applications
5. Explore multi-agent patterns for complex scenarios
6. Study enterprise patterns for production deployment

## Resources

- [Semantic Kernel Documentation](https://learn.microsoft.com/semantic-kernel/)
- [Semantic Kernel GitHub](https://github.com/microsoft/semantic-kernel)
- [Semantic Kernel Cookbook](https://github.com/microsoft/SemanticKernelCookbook)
- [Azure OpenAI Service](https://azure.microsoft.com/products/ai-services/openai-service)
- [Semantic Kernel Discord Community](https://discord.gg/semantic-kernel)
