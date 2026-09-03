---
title: encoding/xml Processing Guide
description: Complete guide to XML processing in Go using encoding/xml package, including parsing, marshaling, namespaces, and streaming
track: go
section: stdlib
difficulty: intermediate
tags:
  - Go
  - XML
  - Serialization
  - Parsing
  - encoding/xml
status: imported
origin: old/src/content/docs/go/encoding-xml.en.md
divergence: 0.24
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Go
  subcategory: ""
  order: 51
  lastUpdated: 2026-01-21
---

The `encoding/xml` package provides a powerful and flexible way to parse and generate XML documents in Go. It supports both struct-based marshaling/unmarshaling and streaming token-based processing for handling large documents efficiently.

## Concept Explanation

XML (eXtensible Markup Language) is a widely used format for data interchange, configuration files, and document storage. Go's `encoding/xml` package provides:

- **Struct-based encoding/decoding**: Map XML elements to Go struct fields using tags
- **Streaming API**: Process large XML documents without loading them entirely into memory
- **Namespace support**: Handle XML namespaces properly
- **Custom marshaling**: Implement custom XML serialization logic

```go
package main

import (
    "encoding/xml"
    "fmt"
)

type Person struct {
    XMLName xml.Name `xml:"person"`
    Name    string   `xml:"name"`
    Age     int      `xml:"age"`
    Email   string   `xml:"email,omitempty"`
}

func main() {
    person := Person{
        Name:  "Alice",
        Age:   30,
        Email: "alice@example.com",
    }

    // Marshal to XML
    data, err := xml.MarshalIndent(person, "", "  ")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println(string(data))

    // Unmarshal from XML
    xmlData := `<person><name>Bob</name><age>25</age></person>`
    var p2 Person
    xml.Unmarshal([]byte(xmlData), &p2)
    fmt.Printf("Parsed: %+v\n", p2)
}
```

## Core Principles

### XML Struct Tags

Go uses struct tags to control XML marshaling behavior. The tag format is:

```
`xml:"name,options"`
```

Available options:
- `,attr` - field is an XML attribute
- `,chardata` - field contains character data (text content)
- `,cdata` - field is wrapped in CDATA section
- `,innerxml` - field contains raw XML
- `,comment` - field is an XML comment
- `,omitempty` - omit field if empty
- `,any` - match any element not matched by other fields
- `-` - ignore field

```go
package main

import (
    "encoding/xml"
    "fmt"
)

type Book struct {
    XMLName     xml.Name `xml:"book"`
    ID          string   `xml:"id,attr"`
    Title       string   `xml:"title"`
    Author      string   `xml:"author"`
    Description string   `xml:"description,omitempty"`
    Content     string   `xml:",chardata"`
    RawSection  string   `xml:",innerxml"`
    Notes       string   `xml:",comment"`
    Ignored     string   `xml:"-"`
}

func main() {
    book := Book{
        ID:          "978-0-123456-78-9",
        Title:       "Go Programming",
        Author:      "John Doe",
        Description: "A comprehensive guide",
        Notes:       "This is a comment",
    }

    data, _ := xml.MarshalIndent(book, "", "  ")
    fmt.Println(string(data))
}
```

### Nested Elements

Handle nested XML structures by nesting structs or using paths in tags:

```go
package main

import (
    "encoding/xml"
    "fmt"
)

// Using nested structs
type Address struct {
    Street string `xml:"street"`
    City   string `xml:"city"`
    ZIP    string `xml:"zip"`
}

type Company struct {
    XMLName xml.Name `xml:"company"`
    Name    string   `xml:"name"`
    Address Address  `xml:"address"`
}

// Using path notation (>)
type Employee struct {
    XMLName xml.Name `xml:"employee"`
    Name    string   `xml:"name"`
    Street  string   `xml:"address>street"`
    City    string   `xml:"address>city"`
}

func main() {
    // Nested struct approach
    company := Company{
        Name: "TechCorp",
        Address: Address{
            Street: "123 Main St",
            City:   "San Francisco",
            ZIP:    "94102",
        },
    }

    data, _ := xml.MarshalIndent(company, "", "  ")
    fmt.Println("Company:")
    fmt.Println(string(data))

    // Path notation approach
    employee := Employee{
        Name:   "Jane",
        Street: "456 Oak Ave",
        City:   "Seattle",
    }

    data, _ = xml.MarshalIndent(employee, "", "  ")
    fmt.Println("\nEmployee:")
    fmt.Println(string(data))
}
```

## Key Concepts

### Handling Attributes

```go
package main

import (
    "encoding/xml"
    "fmt"
)

type Link struct {
    XMLName xml.Name `xml:"link"`
    Href    string   `xml:"href,attr"`
    Rel     string   `xml:"rel,attr,omitempty"`
    Type    string   `xml:"type,attr,omitempty"`
    Text    string   `xml:",chardata"`
}

type Head struct {
    XMLName xml.Name `xml:"head"`
    Title   string   `xml:"title"`
    Links   []Link   `xml:"link"`
}

func main() {
    head := Head{
        Title: "My Page",
        Links: []Link{
            {Href: "style.css", Rel: "stylesheet", Type: "text/css"},
            {Href: "favicon.ico", Rel: "icon"},
        },
    }

    data, _ := xml.MarshalIndent(head, "", "  ")
    fmt.Println(string(data))
}
```

### XML Namespaces

```go
package main

import (
    "encoding/xml"
    "fmt"
)

type Envelope struct {
    XMLName xml.Name `xml:"http://schemas.xmlsoap.org/soap/envelope/ Envelope"`
    Header  Header   `xml:"http://schemas.xmlsoap.org/soap/envelope/ Header"`
    Body    Body     `xml:"http://schemas.xmlsoap.org/soap/envelope/ Body"`
}

type Header struct {
    Content string `xml:",innerxml"`
}

type Body struct {
    Content string `xml:",innerxml"`
}

func main() {
    // Parsing namespaced XML
    xmlData := `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Header></soap:Header>
        <soap:Body>
            <GetUserRequest xmlns="http://example.com/api">
                <UserID>123</UserID>
            </GetUserRequest>
        </soap:Body>
    </soap:Envelope>`

    var env Envelope
    err := xml.Unmarshal([]byte(xmlData), &env)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Printf("Envelope: %+v\n", env)
    fmt.Printf("Body Content: %s\n", env.Body.Content)
}
```

### Slices and Arrays

```go
package main

import (
    "encoding/xml"
    "fmt"
)

type Item struct {
    Name  string  `xml:"name"`
    Price float64 `xml:"price"`
}

type Order struct {
    XMLName xml.Name `xml:"order"`
    ID      string   `xml:"id,attr"`
    Items   []Item   `xml:"item"`
}

// Alternative: wrap items in a container
type OrderWrapped struct {
    XMLName xml.Name `xml:"order"`
    ID      string   `xml:"id,attr"`
    Items   []Item   `xml:"items>item"`
}

func main() {
    order := Order{
        ID: "ORD-001",
        Items: []Item{
            {Name: "Widget", Price: 9.99},
            {Name: "Gadget", Price: 19.99},
            {Name: "Gizmo", Price: 14.99},
        },
    }

    data, _ := xml.MarshalIndent(order, "", "  ")
    fmt.Println("Order:")
    fmt.Println(string(data))

    // With wrapper element
    orderWrapped := OrderWrapped{
        ID: "ORD-002",
        Items: []Item{
            {Name: "Widget", Price: 9.99},
            {Name: "Gadget", Price: 19.99},
        },
    }

    data, _ = xml.MarshalIndent(orderWrapped, "", "  ")
    fmt.Println("\nOrder with wrapper:")
    fmt.Println(string(data))
}
```

## Code Examples

### Streaming XML Parser

For large XML files, use the streaming token-based API:

```go
package main

import (
    "encoding/xml"
    "fmt"
    "io"
    "strings"
)

func parseStream(xmlData string) {
    decoder := xml.NewDecoder(strings.NewReader(xmlData))

    var depth int
    for {
        token, err := decoder.Token()
        if err == io.EOF {
            break
        }
        if err != nil {
            fmt.Println("Error:", err)
            return
        }

        switch t := token.(type) {
        case xml.StartElement:
            indent := strings.Repeat("  ", depth)
            fmt.Printf("%sStart: %s", indent, t.Name.Local)
            if len(t.Attr) > 0 {
                fmt.Printf(" (attrs: ")
                for i, attr := range t.Attr {
                    if i > 0 {
                        fmt.Print(", ")
                    }
                    fmt.Printf("%s=%q", attr.Name.Local, attr.Value)
                }
                fmt.Print(")")
            }
            fmt.Println()
            depth++

        case xml.EndElement:
            depth--
            indent := strings.Repeat("  ", depth)
            fmt.Printf("%sEnd: %s\n", indent, t.Name.Local)

        case xml.CharData:
            text := strings.TrimSpace(string(t))
            if text != "" {
                indent := strings.Repeat("  ", depth)
                fmt.Printf("%sText: %q\n", indent, text)
            }

        case xml.Comment:
            indent := strings.Repeat("  ", depth)
            fmt.Printf("%sComment: %s\n", indent, string(t))
        }
    }
}

func main() {
    xmlData := `
    <catalog>
        <book id="1">
            <title>Go Programming</title>
            <author>John Doe</author>
        </book>
        <!-- More books here -->
        <book id="2">
            <title>Advanced Go</title>
            <author>Jane Smith</author>
        </book>
    </catalog>`

    parseStream(xmlData)
}
```

### Selective Parsing with DecodeElement

```go
package main

import (
    "encoding/xml"
    "fmt"
    "io"
    "strings"
)

type Product struct {
    ID    string  `xml:"id,attr"`
    Name  string  `xml:"name"`
    Price float64 `xml:"price"`
}

func parseProducts(xmlData string) ([]Product, error) {
    decoder := xml.NewDecoder(strings.NewReader(xmlData))
    var products []Product

    for {
        token, err := decoder.Token()
        if err == io.EOF {
            break
        }
        if err != nil {
            return nil, err
        }

        // Look for <product> elements
        if start, ok := token.(xml.StartElement); ok {
            if start.Name.Local == "product" {
                var product Product
                if err := decoder.DecodeElement(&product, &start); err != nil {
                    return nil, err
                }
                products = append(products, product)
            }
        }
    }

    return products, nil
}

func main() {
    xmlData := `
    <inventory>
        <metadata>
            <lastUpdated>2024-01-01</lastUpdated>
        </metadata>
        <products>
            <product id="P001">
                <name>Widget</name>
                <price>9.99</price>
            </product>
            <product id="P002">
                <name>Gadget</name>
                <price>19.99</price>
            </product>
            <product id="P003">
                <name>Gizmo</name>
                <price>14.99</price>
            </product>
        </products>
    </inventory>`

    products, err := parseProducts(xmlData)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    for _, p := range products {
        fmt.Printf("Product: %s - %s ($%.2f)\n", p.ID, p.Name, p.Price)
    }
}
```

### Custom Marshaler/Unmarshaler

```go
package main

import (
    "encoding/xml"
    "fmt"
    "time"
)

type CustomTime struct {
    time.Time
}

const timeFormat = "2006-01-02T15:04:05"

func (ct CustomTime) MarshalXML(e *xml.Encoder, start xml.StartElement) error {
    formatted := ct.Format(timeFormat)
    return e.EncodeElement(formatted, start)
}

func (ct *CustomTime) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
    var s string
    if err := d.DecodeElement(&s, &start); err != nil {
        return err
    }
    parsed, err := time.Parse(timeFormat, s)
    if err != nil {
        return err
    }
    ct.Time = parsed
    return nil
}

type Event struct {
    XMLName   xml.Name   `xml:"event"`
    Name      string     `xml:"name"`
    StartTime CustomTime `xml:"startTime"`
    EndTime   CustomTime `xml:"endTime"`
}

func main() {
    event := Event{
        Name:      "Conference",
        StartTime: CustomTime{time.Date(2024, 6, 15, 9, 0, 0, 0, time.UTC)},
        EndTime:   CustomTime{time.Date(2024, 6, 15, 17, 0, 0, 0, time.UTC)},
    }

    // Marshal
    data, err := xml.MarshalIndent(event, "", "  ")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Marshaled:")
    fmt.Println(string(data))

    // Unmarshal
    xmlData := `<event>
        <name>Workshop</name>
        <startTime>2024-07-20T10:00:00</startTime>
        <endTime>2024-07-20T16:00:00</endTime>
    </event>`

    var e2 Event
    xml.Unmarshal([]byte(xmlData), &e2)
    fmt.Printf("\nUnmarshaled: %s from %v to %v\n",
        e2.Name, e2.StartTime.Format(time.RFC3339), e2.EndTime.Format(time.RFC3339))
}
```

### Writing XML with Encoder

```go
package main

import (
    "bytes"
    "encoding/xml"
    "fmt"
)

type RSS struct {
    XMLName xml.Name `xml:"rss"`
    Version string   `xml:"version,attr"`
    Channel Channel  `xml:"channel"`
}

type Channel struct {
    Title       string `xml:"title"`
    Link        string `xml:"link"`
    Description string `xml:"description"`
    Items       []Item `xml:"item"`
}

type Item struct {
    Title       string `xml:"title"`
    Link        string `xml:"link"`
    Description string `xml:"description"`
    PubDate     string `xml:"pubDate"`
}

func generateRSS() ([]byte, error) {
    var buf bytes.Buffer

    // Write XML declaration
    buf.WriteString(xml.Header)

    encoder := xml.NewEncoder(&buf)
    encoder.Indent("", "  ")

    rss := RSS{
        Version: "2.0",
        Channel: Channel{
            Title:       "Tech News",
            Link:        "https://example.com",
            Description: "Latest technology news",
            Items: []Item{
                {
                    Title:       "Go 1.22 Released",
                    Link:        "https://example.com/go-122",
                    Description: "New features in Go 1.22",
                    PubDate:     "Mon, 15 Jan 2024 10:00:00 GMT",
                },
                {
                    Title:       "Cloud Computing Trends",
                    Link:        "https://example.com/cloud-trends",
                    Description: "Top cloud computing trends for 2024",
                    PubDate:     "Tue, 16 Jan 2024 14:30:00 GMT",
                },
            },
        },
    }

    if err := encoder.Encode(rss); err != nil {
        return nil, err
    }

    return buf.Bytes(), nil
}

func main() {
    data, err := generateRSS()
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println(string(data))
}
```

## Best Practices

### 1. Use Pointers for Optional Elements

```go
package main

import (
    "encoding/xml"
    "fmt"
)

type Config struct {
    XMLName  xml.Name `xml:"config"`
    Host     string   `xml:"host"`
    Port     int      `xml:"port"`
    Timeout  *int     `xml:"timeout,omitempty"` // Optional
    SSL      *bool    `xml:"ssl,omitempty"`     // Optional
}

func main() {
    // With optional fields
    timeout := 30
    ssl := true
    c1 := Config{Host: "localhost", Port: 8080, Timeout: &timeout, SSL: &ssl}

    // Without optional fields
    c2 := Config{Host: "localhost", Port: 8080}

    data1, _ := xml.MarshalIndent(c1, "", "  ")
    data2, _ := xml.MarshalIndent(c2, "", "  ")

    fmt.Println("With optional fields:")
    fmt.Println(string(data1))
    fmt.Println("\nWithout optional fields:")
    fmt.Println(string(data2))
}
```

### 2. Validate Input Before Unmarshaling

```go
package main

import (
    "encoding/xml"
    "fmt"
    "strings"
)

func validateXML(data []byte) error {
    decoder := xml.NewDecoder(strings.NewReader(string(data)))
    for {
        _, err := decoder.Token()
        if err != nil {
            if err.Error() == "EOF" {
                return nil
            }
            return err
        }
    }
}

type Data struct {
    Value string `xml:"value"`
}

func safeUnmarshal(data []byte, v interface{}) error {
    if err := validateXML(data); err != nil {
        return fmt.Errorf("invalid XML: %w", err)
    }
    return xml.Unmarshal(data, v)
}

func main() {
    validXML := `<data><value>test</value></data>`
    invalidXML := `<data><value>test</data>` // Missing closing tag

    var d Data

    if err := safeUnmarshal([]byte(validXML), &d); err != nil {
        fmt.Println("Valid XML error:", err)
    } else {
        fmt.Println("Valid XML parsed:", d.Value)
    }

    if err := safeUnmarshal([]byte(invalidXML), &d); err != nil {
        fmt.Println("Invalid XML error:", err)
    }
}
```

### 3. Handle Unknown Elements Gracefully

```go
package main

import (
    "encoding/xml"
    "fmt"
)

type FlexibleConfig struct {
    XMLName    xml.Name     `xml:"config"`
    Known      string       `xml:"known"`
    ExtraAttrs []xml.Attr   `xml:",any,attr"`
    Extra      []ExtraField `xml:",any"`
}

type ExtraField struct {
    XMLName xml.Name
    Content string `xml:",chardata"`
}

func main() {
    xmlData := `
    <config version="1.0" custom="yes">
        <known>Expected Value</known>
        <unknown1>Surprise Field 1</unknown1>
        <unknown2>Surprise Field 2</unknown2>
    </config>`

    var config FlexibleConfig
    xml.Unmarshal([]byte(xmlData), &config)

    fmt.Printf("Known: %s\n", config.Known)
    fmt.Println("Extra attributes:")
    for _, attr := range config.ExtraAttrs {
        fmt.Printf("  %s = %s\n", attr.Name.Local, attr.Value)
    }
    fmt.Println("Extra elements:")
    for _, field := range config.Extra {
        fmt.Printf("  %s = %s\n", field.XMLName.Local, field.Content)
    }
}
```

### 4. Use Strict Mode for Validation

```go
package main

import (
    "encoding/xml"
    "fmt"
    "strings"
)

type StrictData struct {
    XMLName xml.Name `xml:"data"`
    Field1  string   `xml:"field1"`
    Field2  int      `xml:"field2"`
}

func strictUnmarshal(data []byte, v interface{}) error {
    decoder := xml.NewDecoder(strings.NewReader(string(data)))
    decoder.Strict = true
    return decoder.Decode(v)
}

func main() {
    // Well-formed XML
    goodXML := `<data><field1>test</field1><field2>42</field2></data>`

    var d StrictData
    if err := strictUnmarshal([]byte(goodXML), &d); err != nil {
        fmt.Println("Error:", err)
    } else {
        fmt.Printf("Parsed: %+v\n", d)
    }
}
```

## Common Pitfalls

### 1. Forgetting XMLName for Root Element Control

```go
package main

import (
    "encoding/xml"
    "fmt"
)

// BAD: No control over root element name
type BadPerson struct {
    Name string `xml:"name"`
    Age  int    `xml:"age"`
}

// GOOD: Explicit control over root element
type GoodPerson struct {
    XMLName xml.Name `xml:"person"`
    Name    string   `xml:"name"`
    Age     int      `xml:"age"`
}

func main() {
    bad := BadPerson{Name: "Alice", Age: 30}
    good := GoodPerson{Name: "Alice", Age: 30}

    badData, _ := xml.Marshal(bad)
    goodData, _ := xml.Marshal(good)

    fmt.Println("Bad (uses struct name):", string(badData))
    fmt.Println("Good (uses XMLName):", string(goodData))
}
```

### 2. Namespace Handling Errors

```go
package main

import (
    "encoding/xml"
    "fmt"
)

// BAD: Ignoring namespaces
type BadItem struct {
    Name string `xml:"name"`
}

// GOOD: Properly handling namespaces
type GoodItem struct {
    Name string `xml:"http://example.com/ns name"`
}

func main() {
    xmlData := `<item xmlns="http://example.com/ns"><name>Widget</name></item>`

    var bad BadItem
    var good GoodItem

    xml.Unmarshal([]byte(xmlData), &bad)
    xml.Unmarshal([]byte(xmlData), &good)

    fmt.Printf("Bad (empty): %q\n", bad.Name)
    fmt.Printf("Good (parsed): %q\n", good.Name)
}
```

### 3. Empty vs Nil Slices

```go
package main

import (
    "encoding/xml"
    "fmt"
)

type Container struct {
    XMLName xml.Name `xml:"container"`
    Items   []string `xml:"item"`
}

func main() {
    // nil slice - no items element at all
    c1 := Container{}

    // Empty slice - same result
    c2 := Container{Items: []string{}}

    // With items
    c3 := Container{Items: []string{"a", "b"}}

    data1, _ := xml.MarshalIndent(c1, "", "  ")
    data2, _ := xml.MarshalIndent(c2, "", "  ")
    data3, _ := xml.MarshalIndent(c3, "", "  ")

    fmt.Println("nil slice:")
    fmt.Println(string(data1))
    fmt.Println("\nEmpty slice:")
    fmt.Println(string(data2))
    fmt.Println("\nWith items:")
    fmt.Println(string(data3))
}
```

### 4. Mixed Content Handling

```go
package main

import (
    "encoding/xml"
    "fmt"
)

// Challenge: <p>Hello <b>world</b>!</p>

// Simple approach loses structure
type SimpleParagraph struct {
    XMLName xml.Name `xml:"p"`
    Content string   `xml:",chardata"`
}

// Better: capture raw XML
type RawParagraph struct {
    XMLName xml.Name `xml:"p"`
    Content string   `xml:",innerxml"`
}

func main() {
    xmlData := `<p>Hello <b>world</b>!</p>`

    var simple SimpleParagraph
    var raw RawParagraph

    xml.Unmarshal([]byte(xmlData), &simple)
    xml.Unmarshal([]byte(xmlData), &raw)

    fmt.Printf("Simple (loses tags): %q\n", simple.Content)
    fmt.Printf("Raw (preserves): %q\n", raw.Content)
}
```

## Performance Considerations

### Streaming vs Full Parse

```go
package main

import (
    "bytes"
    "encoding/xml"
    "fmt"
    "io"
    "time"
)

type Record struct {
    ID   int    `xml:"id"`
    Data string `xml:"data"`
}

type Records struct {
    Items []Record `xml:"record"`
}

func generateLargeXML(count int) []byte {
    var buf bytes.Buffer
    buf.WriteString("<records>")
    for i := 0; i < count; i++ {
        fmt.Fprintf(&buf, "<record><id>%d</id><data>Data %d</data></record>", i, i)
    }
    buf.WriteString("</records>")
    return buf.Bytes()
}

func fullParse(data []byte) int {
    var records Records
    xml.Unmarshal(data, &records)
    return len(records.Items)
}

func streamParse(data []byte) int {
    decoder := xml.NewDecoder(bytes.NewReader(data))
    count := 0

    for {
        token, err := decoder.Token()
        if err == io.EOF {
            break
        }
        if err != nil {
            break
        }

        if start, ok := token.(xml.StartElement); ok && start.Name.Local == "record" {
            var r Record
            decoder.DecodeElement(&r, &start)
            count++
        }
    }
    return count
}

func main() {
    data := generateLargeXML(10000)
    fmt.Printf("XML size: %.2f KB\n", float64(len(data))/1024)

    // Benchmark full parse
    start := time.Now()
    count1 := fullParse(data)
    fullTime := time.Since(start)

    // Benchmark stream parse
    start = time.Now()
    count2 := streamParse(data)
    streamTime := time.Since(start)

    fmt.Printf("Full parse: %d records in %v\n", count1, fullTime)
    fmt.Printf("Stream parse: %d records in %v\n", count2, streamTime)
}
```

### Buffer Reuse with Encoder

```go
package main

import (
    "bytes"
    "encoding/xml"
    "fmt"
    "sync"
)

var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

type Message struct {
    XMLName xml.Name `xml:"message"`
    ID      int      `xml:"id"`
    Content string   `xml:"content"`
}

func marshalWithPool(v interface{}) ([]byte, error) {
    buf := bufferPool.Get().(*bytes.Buffer)
    buf.Reset()
    defer bufferPool.Put(buf)

    encoder := xml.NewEncoder(buf)
    if err := encoder.Encode(v); err != nil {
        return nil, err
    }

    // Copy result since we're returning buffer to pool
    result := make([]byte, buf.Len())
    copy(result, buf.Bytes())
    return result, nil
}

func main() {
    msg := Message{ID: 1, Content: "Hello, World!"}

    data, err := marshalWithPool(msg)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println(string(data))
}
```

### Disable Entity Expansion for Security

```go
package main

import (
    "encoding/xml"
    "fmt"
    "strings"
)

func safeDecoder(data string) *xml.Decoder {
    decoder := xml.NewDecoder(strings.NewReader(data))
    // Disable automatic entity expansion (helps prevent XXE attacks)
    decoder.Entity = make(map[string]string)
    return decoder
}

type SafeData struct {
    Content string `xml:",chardata"`
}

func main() {
    // Potentially dangerous XML with entity reference
    xmlData := `<data>&custom;</data>`

    decoder := safeDecoder(xmlData)
    var d SafeData
    err := decoder.Decode(&d)
    if err != nil {
        fmt.Println("Error (expected):", err)
    } else {
        fmt.Println("Content:", d.Content)
    }
}
```

## Real-World Scenarios

### Configuration File Parser

```go
package main

import (
    "encoding/xml"
    "fmt"
    "os"
)

type AppConfig struct {
    XMLName  xml.Name       `xml:"configuration"`
    Server   ServerConfig   `xml:"server"`
    Database DatabaseConfig `xml:"database"`
    Logging  LoggingConfig  `xml:"logging"`
    Features []Feature      `xml:"features>feature"`
}

type ServerConfig struct {
    Host    string `xml:"host"`
    Port    int    `xml:"port"`
    Timeout int    `xml:"timeout,attr"`
}

type DatabaseConfig struct {
    Driver   string `xml:"driver,attr"`
    Host     string `xml:"host"`
    Port     int    `xml:"port"`
    Name     string `xml:"name"`
    User     string `xml:"user"`
    Password string `xml:"password"`
    PoolSize int    `xml:"poolSize"`
}

type LoggingConfig struct {
    Level  string `xml:"level,attr"`
    File   string `xml:"file"`
    Format string `xml:"format"`
}

type Feature struct {
    Name    string `xml:"name,attr"`
    Enabled bool   `xml:"enabled,attr"`
}

func loadConfig(filename string) (*AppConfig, error) {
    data, err := os.ReadFile(filename)
    if err != nil {
        return nil, err
    }

    var config AppConfig
    if err := xml.Unmarshal(data, &config); err != nil {
        return nil, err
    }

    return &config, nil
}

func main() {
    // Example config XML
    configXML := `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <server timeout="30">
        <host>localhost</host>
        <port>8080</port>
    </server>
    <database driver="postgres">
        <host>db.example.com</host>
        <port>5432</port>
        <name>myapp</name>
        <user>admin</user>
        <password>secret</password>
        <poolSize>10</poolSize>
    </database>
    <logging level="info">
        <file>/var/log/app.log</file>
        <format>json</format>
    </logging>
    <features>
        <feature name="caching" enabled="true"/>
        <feature name="metrics" enabled="true"/>
        <feature name="experimental" enabled="false"/>
    </features>
</configuration>`

    var config AppConfig
    xml.Unmarshal([]byte(configXML), &config)

    fmt.Printf("Server: %s:%d (timeout: %ds)\n",
        config.Server.Host, config.Server.Port, config.Server.Timeout)
    fmt.Printf("Database: %s@%s:%d/%s\n",
        config.Database.User, config.Database.Host,
        config.Database.Port, config.Database.Name)
    fmt.Printf("Logging: %s level to %s\n",
        config.Logging.Level, config.Logging.File)
    fmt.Println("Features:")
    for _, f := range config.Features {
        fmt.Printf("  - %s: %v\n", f.Name, f.Enabled)
    }
}
```

### SOAP Client

```go
package main

import (
    "bytes"
    "encoding/xml"
    "fmt"
)

type SOAPEnvelope struct {
    XMLName xml.Name `xml:"http://schemas.xmlsoap.org/soap/envelope/ Envelope"`
    Header  *SOAPHeader
    Body    SOAPBody
}

type SOAPHeader struct {
    XMLName xml.Name `xml:"http://schemas.xmlsoap.org/soap/envelope/ Header"`
    Content []byte   `xml:",innerxml"`
}

type SOAPBody struct {
    XMLName xml.Name `xml:"http://schemas.xmlsoap.org/soap/envelope/ Body"`
    Content []byte   `xml:",innerxml"`
    Fault   *SOAPFault
}

type SOAPFault struct {
    XMLName xml.Name `xml:"http://schemas.xmlsoap.org/soap/envelope/ Fault"`
    Code    string   `xml:"faultcode"`
    String  string   `xml:"faultstring"`
    Detail  string   `xml:"detail"`
}

// Request types
type GetUserRequest struct {
    XMLName xml.Name `xml:"http://example.com/api GetUser"`
    UserID  int      `xml:"UserID"`
}

type GetUserResponse struct {
    XMLName xml.Name `xml:"http://example.com/api GetUserResponse"`
    User    User     `xml:"User"`
}

type User struct {
    ID    int    `xml:"ID"`
    Name  string `xml:"Name"`
    Email string `xml:"Email"`
}

func createSOAPRequest(body interface{}) ([]byte, error) {
    bodyContent, err := xml.Marshal(body)
    if err != nil {
        return nil, err
    }

    envelope := SOAPEnvelope{
        Body: SOAPBody{
            Content: bodyContent,
        },
    }

    var buf bytes.Buffer
    buf.WriteString(xml.Header)

    encoder := xml.NewEncoder(&buf)
    encoder.Indent("", "  ")
    if err := encoder.Encode(envelope); err != nil {
        return nil, err
    }

    return buf.Bytes(), nil
}

func main() {
    request := GetUserRequest{UserID: 123}
    soapXML, err := createSOAPRequest(request)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println("SOAP Request:")
    fmt.Println(string(soapXML))

    // Parse SOAP response
    responseXML := `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <GetUserResponse xmlns="http://example.com/api">
                <User>
                    <ID>123</ID>
                    <Name>John Doe</Name>
                    <Email>john@example.com</Email>
                </User>
            </GetUserResponse>
        </soap:Body>
    </soap:Envelope>`

    var env SOAPEnvelope
    xml.Unmarshal([]byte(responseXML), &env)

    var resp GetUserResponse
    xml.Unmarshal(env.Body.Content, &resp)

    fmt.Printf("\nParsed Response:\n")
    fmt.Printf("User ID: %d\n", resp.User.ID)
    fmt.Printf("Name: %s\n", resp.User.Name)
    fmt.Printf("Email: %s\n", resp.User.Email)
}
```

## Interview Key Points

1. **Struct tags syntax**:
   - `xml:"name"` - element name
   - `xml:"name,attr"` - attribute
   - `xml:",chardata"` - text content
   - `xml:",innerxml"` - raw XML
   - `xml:"-"` - ignore field

2. **Streaming vs full parse**:
   - Use `Unmarshal` for small documents
   - Use `Decoder.Token()` for large documents
   - `DecodeElement` for selective parsing

3. **Namespace handling**:
   - Full namespace URI in tag: `xml:"http://ns.example.com name"`
   - XMLName field for namespace-aware marshaling

4. **Common interfaces**:
   - `xml.Marshaler` for custom marshaling
   - `xml.Unmarshaler` for custom unmarshaling
   - `xml.MarshalerAttr` for custom attribute marshaling

5. **Security considerations**:
   - Disable entity expansion to prevent XXE attacks
   - Validate input before processing
   - Use `Strict` mode when needed

## Further Reading

- [Go Documentation: encoding/xml](https://pkg.go.dev/encoding/xml)
- [XML Processing in Go](https://blog.golang.org/json-and-go) (concepts apply to XML)
- [Effective Go: Data](https://golang.org/doc/effective_go#data)
- [W3C XML Specification](https://www.w3.org/XML/)
- [XML Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/XML_Security_Cheat_Sheet.html)
