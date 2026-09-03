---
title: encoding/xml 处理指南
description: Go 语言 encoding/xml 包完全指南，涵盖 XML 解析、序列化、命名空间和流式处理
track: go
section: stdlib
difficulty: intermediate
tags:
  - Go
  - XML
  - 序列化
  - 解析
  - encoding/xml
status: imported
origin: old/src/content/docs/go/encoding-xml.zh.md
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

`encoding/xml` 包提供了在 Go 中解析和生成 XML 文档的强大而灵活的方式。它支持基于结构体的序列化/反序列化以及流式 token 处理，可以高效地处理大型文档。

## 概念解释

XML（可扩展标记语言）是一种广泛用于数据交换、配置文件和文档存储的格式。Go 的 `encoding/xml` 包提供：

- **基于结构体的编解码**：使用标签将 XML 元素映射到 Go 结构体字段
- **流式 API**：无需将整个文档加载到内存即可处理大型 XML 文档
- **命名空间支持**：正确处理 XML 命名空间
- **自定义序列化**：实现自定义的 XML 序列化逻辑

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

    // 序列化为 XML
    data, err := xml.MarshalIndent(person, "", "  ")
    if err != nil {
        fmt.Println("错误:", err)
        return
    }
    fmt.Println(string(data))

    // 从 XML 反序列化
    xmlData := `<person><name>Bob</name><age>25</age></person>`
    var p2 Person
    xml.Unmarshal([]byte(xmlData), &p2)
    fmt.Printf("解析结果: %+v\n", p2)
}
```

## 核心原理

### XML 结构体标签

Go 使用结构体标签来控制 XML 序列化行为。标签格式为：

```
`xml:"name,options"`
```

可用选项：
- `,attr` - 字段是 XML 属性
- `,chardata` - 字段包含字符数据（文本内容）
- `,cdata` - 字段包装在 CDATA 区段中
- `,innerxml` - 字段包含原始 XML
- `,comment` - 字段是 XML 注释
- `,omitempty` - 如果为空则省略字段
- `,any` - 匹配其他字段未匹配的任何元素
- `-` - 忽略字段

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
        Title:       "Go 编程",
        Author:      "张三",
        Description: "一本全面的指南",
        Notes:       "这是一个注释",
    }

    data, _ := xml.MarshalIndent(book, "", "  ")
    fmt.Println(string(data))
}
```

### 嵌套元素

通过嵌套结构体或在标签中使用路径来处理嵌套的 XML 结构：

```go
package main

import (
    "encoding/xml"
    "fmt"
)

// 使用嵌套结构体
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

// 使用路径表示法 (>)
type Employee struct {
    XMLName xml.Name `xml:"employee"`
    Name    string   `xml:"name"`
    Street  string   `xml:"address>street"`
    City    string   `xml:"address>city"`
}

func main() {
    // 嵌套结构体方式
    company := Company{
        Name: "科技公司",
        Address: Address{
            Street: "主街123号",
            City:   "上海",
            ZIP:    "200000",
        },
    }

    data, _ := xml.MarshalIndent(company, "", "  ")
    fmt.Println("公司:")
    fmt.Println(string(data))

    // 路径表示法方式
    employee := Employee{
        Name:   "小明",
        Street: "橡树大道456号",
        City:   "北京",
    }

    data, _ = xml.MarshalIndent(employee, "", "  ")
    fmt.Println("\n员工:")
    fmt.Println(string(data))
}
```

## 核心要点

### 处理属性

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
        Title: "我的页面",
        Links: []Link{
            {Href: "style.css", Rel: "stylesheet", Type: "text/css"},
            {Href: "favicon.ico", Rel: "icon"},
        },
    }

    data, _ := xml.MarshalIndent(head, "", "  ")
    fmt.Println(string(data))
}
```

### XML 命名空间

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
    // 解析带命名空间的 XML
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
        fmt.Println("错误:", err)
        return
    }

    fmt.Printf("Envelope: %+v\n", env)
    fmt.Printf("Body 内容: %s\n", env.Body.Content)
}
```

### 切片和数组

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

// 替代方案：将项目包装在容器中
type OrderWrapped struct {
    XMLName xml.Name `xml:"order"`
    ID      string   `xml:"id,attr"`
    Items   []Item   `xml:"items>item"`
}

func main() {
    order := Order{
        ID: "ORD-001",
        Items: []Item{
            {Name: "小部件", Price: 9.99},
            {Name: "小工具", Price: 19.99},
            {Name: "小装置", Price: 14.99},
        },
    }

    data, _ := xml.MarshalIndent(order, "", "  ")
    fmt.Println("订单:")
    fmt.Println(string(data))

    // 带包装元素的版本
    orderWrapped := OrderWrapped{
        ID: "ORD-002",
        Items: []Item{
            {Name: "小部件", Price: 9.99},
            {Name: "小工具", Price: 19.99},
        },
    }

    data, _ = xml.MarshalIndent(orderWrapped, "", "  ")
    fmt.Println("\n带包装的订单:")
    fmt.Println(string(data))
}
```

## 代码示例

### 流式 XML 解析器

对于大型 XML 文件，使用基于 token 的流式 API：

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
            fmt.Println("错误:", err)
            return
        }

        switch t := token.(type) {
        case xml.StartElement:
            indent := strings.Repeat("  ", depth)
            fmt.Printf("%s开始: %s", indent, t.Name.Local)
            if len(t.Attr) > 0 {
                fmt.Printf(" (属性: ")
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
            fmt.Printf("%s结束: %s\n", indent, t.Name.Local)

        case xml.CharData:
            text := strings.TrimSpace(string(t))
            if text != "" {
                indent := strings.Repeat("  ", depth)
                fmt.Printf("%s文本: %q\n", indent, text)
            }

        case xml.Comment:
            indent := strings.Repeat("  ", depth)
            fmt.Printf("%s注释: %s\n", indent, string(t))
        }
    }
}

func main() {
    xmlData := `
    <catalog>
        <book id="1">
            <title>Go 编程</title>
            <author>张三</author>
        </book>
        <!-- 更多书籍 -->
        <book id="2">
            <title>高级 Go</title>
            <author>李四</author>
        </book>
    </catalog>`

    parseStream(xmlData)
}
```

### 使用 DecodeElement 进行选择性解析

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

        // 查找 <product> 元素
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
                <name>小部件</name>
                <price>9.99</price>
            </product>
            <product id="P002">
                <name>小工具</name>
                <price>19.99</price>
            </product>
            <product id="P003">
                <name>小装置</name>
                <price>14.99</price>
            </product>
        </products>
    </inventory>`

    products, err := parseProducts(xmlData)
    if err != nil {
        fmt.Println("错误:", err)
        return
    }

    for _, p := range products {
        fmt.Printf("产品: %s - %s (￥%.2f)\n", p.ID, p.Name, p.Price)
    }
}
```

### 自定义 Marshaler/Unmarshaler

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
        Name:      "技术大会",
        StartTime: CustomTime{time.Date(2024, 6, 15, 9, 0, 0, 0, time.UTC)},
        EndTime:   CustomTime{time.Date(2024, 6, 15, 17, 0, 0, 0, time.UTC)},
    }

    // 序列化
    data, err := xml.MarshalIndent(event, "", "  ")
    if err != nil {
        fmt.Println("错误:", err)
        return
    }
    fmt.Println("序列化结果:")
    fmt.Println(string(data))

    // 反序列化
    xmlData := `<event>
        <name>工作坊</name>
        <startTime>2024-07-20T10:00:00</startTime>
        <endTime>2024-07-20T16:00:00</endTime>
    </event>`

    var e2 Event
    xml.Unmarshal([]byte(xmlData), &e2)
    fmt.Printf("\n反序列化结果: %s 从 %v 到 %v\n",
        e2.Name, e2.StartTime.Format(time.RFC3339), e2.EndTime.Format(time.RFC3339))
}
```

### 使用 Encoder 写入 XML

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

    // 写入 XML 声明
    buf.WriteString(xml.Header)

    encoder := xml.NewEncoder(&buf)
    encoder.Indent("", "  ")

    rss := RSS{
        Version: "2.0",
        Channel: Channel{
            Title:       "技术新闻",
            Link:        "https://example.com",
            Description: "最新技术资讯",
            Items: []Item{
                {
                    Title:       "Go 1.22 发布",
                    Link:        "https://example.com/go-122",
                    Description: "Go 1.22 的新特性",
                    PubDate:     "Mon, 15 Jan 2024 10:00:00 GMT",
                },
                {
                    Title:       "云计算趋势",
                    Link:        "https://example.com/cloud-trends",
                    Description: "2024 年云计算热门趋势",
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
        fmt.Println("错误:", err)
        return
    }
    fmt.Println(string(data))
}
```

## 最佳实践

### 1. 对可选元素使用指针

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
    Timeout  *int     `xml:"timeout,omitempty"` // 可选
    SSL      *bool    `xml:"ssl,omitempty"`     // 可选
}

func main() {
    // 包含可选字段
    timeout := 30
    ssl := true
    c1 := Config{Host: "localhost", Port: 8080, Timeout: &timeout, SSL: &ssl}

    // 不包含可选字段
    c2 := Config{Host: "localhost", Port: 8080}

    data1, _ := xml.MarshalIndent(c1, "", "  ")
    data2, _ := xml.MarshalIndent(c2, "", "  ")

    fmt.Println("包含可选字段:")
    fmt.Println(string(data1))
    fmt.Println("\n不包含可选字段:")
    fmt.Println(string(data2))
}
```

### 2. 反序列化前验证输入

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
        return fmt.Errorf("无效的 XML: %w", err)
    }
    return xml.Unmarshal(data, v)
}

func main() {
    validXML := `<data><value>test</value></data>`
    invalidXML := `<data><value>test</data>` // 缺少闭合标签

    var d Data

    if err := safeUnmarshal([]byte(validXML), &d); err != nil {
        fmt.Println("有效 XML 错误:", err)
    } else {
        fmt.Println("有效 XML 解析成功:", d.Value)
    }

    if err := safeUnmarshal([]byte(invalidXML), &d); err != nil {
        fmt.Println("无效 XML 错误:", err)
    }
}
```

### 3. 优雅处理未知元素

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
        <known>预期值</known>
        <unknown1>意外字段1</unknown1>
        <unknown2>意外字段2</unknown2>
    </config>`

    var config FlexibleConfig
    xml.Unmarshal([]byte(xmlData), &config)

    fmt.Printf("已知字段: %s\n", config.Known)
    fmt.Println("额外属性:")
    for _, attr := range config.ExtraAttrs {
        fmt.Printf("  %s = %s\n", attr.Name.Local, attr.Value)
    }
    fmt.Println("额外元素:")
    for _, field := range config.Extra {
        fmt.Printf("  %s = %s\n", field.XMLName.Local, field.Content)
    }
}
```

### 4. 使用严格模式进行验证

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
    // 格式良好的 XML
    goodXML := `<data><field1>test</field1><field2>42</field2></data>`

    var d StrictData
    if err := strictUnmarshal([]byte(goodXML), &d); err != nil {
        fmt.Println("错误:", err)
    } else {
        fmt.Printf("解析结果: %+v\n", d)
    }
}
```

## 常见陷阱

### 1. 忘记使用 XMLName 控制根元素

```go
package main

import (
    "encoding/xml"
    "fmt"
)

// 错误：无法控制根元素名称
type BadPerson struct {
    Name string `xml:"name"`
    Age  int    `xml:"age"`
}

// 正确：明确控制根元素
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

    fmt.Println("错误（使用结构体名）:", string(badData))
    fmt.Println("正确（使用 XMLName）:", string(goodData))
}
```

### 2. 命名空间处理错误

```go
package main

import (
    "encoding/xml"
    "fmt"
)

// 错误：忽略命名空间
type BadItem struct {
    Name string `xml:"name"`
}

// 正确：正确处理命名空间
type GoodItem struct {
    Name string `xml:"http://example.com/ns name"`
}

func main() {
    xmlData := `<item xmlns="http://example.com/ns"><name>小部件</name></item>`

    var bad BadItem
    var good GoodItem

    xml.Unmarshal([]byte(xmlData), &bad)
    xml.Unmarshal([]byte(xmlData), &good)

    fmt.Printf("错误（为空）: %q\n", bad.Name)
    fmt.Printf("正确（已解析）: %q\n", good.Name)
}
```

### 3. 空切片与 nil 切片

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
    // nil 切片 - 根本没有 items 元素
    c1 := Container{}

    // 空切片 - 相同结果
    c2 := Container{Items: []string{}}

    // 有元素
    c3 := Container{Items: []string{"a", "b"}}

    data1, _ := xml.MarshalIndent(c1, "", "  ")
    data2, _ := xml.MarshalIndent(c2, "", "  ")
    data3, _ := xml.MarshalIndent(c3, "", "  ")

    fmt.Println("nil 切片:")
    fmt.Println(string(data1))
    fmt.Println("\n空切片:")
    fmt.Println(string(data2))
    fmt.Println("\n有元素:")
    fmt.Println(string(data3))
}
```

### 4. 混合内容处理

```go
package main

import (
    "encoding/xml"
    "fmt"
)

// 挑战：<p>你好 <b>世界</b>！</p>

// 简单方法会丢失结构
type SimpleParagraph struct {
    XMLName xml.Name `xml:"p"`
    Content string   `xml:",chardata"`
}

// 更好的方法：捕获原始 XML
type RawParagraph struct {
    XMLName xml.Name `xml:"p"`
    Content string   `xml:",innerxml"`
}

func main() {
    xmlData := `<p>你好 <b>世界</b>！</p>`

    var simple SimpleParagraph
    var raw RawParagraph

    xml.Unmarshal([]byte(xmlData), &simple)
    xml.Unmarshal([]byte(xmlData), &raw)

    fmt.Printf("简单方法（丢失标签）: %q\n", simple.Content)
    fmt.Printf("原始方法（保留）: %q\n", raw.Content)
}
```

## 性能考量

### 流式解析与完整解析

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
        fmt.Fprintf(&buf, "<record><id>%d</id><data>数据 %d</data></record>", i, i)
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
    fmt.Printf("XML 大小: %.2f KB\n", float64(len(data))/1024)

    // 基准测试完整解析
    start := time.Now()
    count1 := fullParse(data)
    fullTime := time.Since(start)

    // 基准测试流式解析
    start = time.Now()
    count2 := streamParse(data)
    streamTime := time.Since(start)

    fmt.Printf("完整解析: %d 条记录用时 %v\n", count1, fullTime)
    fmt.Printf("流式解析: %d 条记录用时 %v\n", count2, streamTime)
}
```

### 使用 Encoder 复用缓冲区

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

    // 复制结果，因为我们要将缓冲区归还池中
    result := make([]byte, buf.Len())
    copy(result, buf.Bytes())
    return result, nil
}

func main() {
    msg := Message{ID: 1, Content: "你好，世界！"}

    data, err := marshalWithPool(msg)
    if err != nil {
        fmt.Println("错误:", err)
        return
    }

    fmt.Println(string(data))
}
```

### 禁用实体展开以提高安全性

```go
package main

import (
    "encoding/xml"
    "fmt"
    "strings"
)

func safeDecoder(data string) *xml.Decoder {
    decoder := xml.NewDecoder(strings.NewReader(data))
    // 禁用自动实体展开（有助于防止 XXE 攻击）
    decoder.Entity = make(map[string]string)
    return decoder
}

type SafeData struct {
    Content string `xml:",chardata"`
}

func main() {
    // 带实体引用的潜在危险 XML
    xmlData := `<data>&custom;</data>`

    decoder := safeDecoder(xmlData)
    var d SafeData
    err := decoder.Decode(&d)
    if err != nil {
        fmt.Println("错误（预期内）:", err)
    } else {
        fmt.Println("内容:", d.Content)
    }
}
```

## 实战场景

### 配置文件解析器

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
    // 示例配置 XML
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

    fmt.Printf("服务器: %s:%d（超时: %d秒）\n",
        config.Server.Host, config.Server.Port, config.Server.Timeout)
    fmt.Printf("数据库: %s@%s:%d/%s\n",
        config.Database.User, config.Database.Host,
        config.Database.Port, config.Database.Name)
    fmt.Printf("日志: %s 级别输出到 %s\n",
        config.Logging.Level, config.Logging.File)
    fmt.Println("功能特性:")
    for _, f := range config.Features {
        fmt.Printf("  - %s: %v\n", f.Name, f.Enabled)
    }
}
```

### SOAP 客户端

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

// 请求类型
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
        fmt.Println("错误:", err)
        return
    }

    fmt.Println("SOAP 请求:")
    fmt.Println(string(soapXML))

    // 解析 SOAP 响应
    responseXML := `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <GetUserResponse xmlns="http://example.com/api">
                <User>
                    <ID>123</ID>
                    <Name>张三</Name>
                    <Email>zhangsan@example.com</Email>
                </User>
            </GetUserResponse>
        </soap:Body>
    </soap:Envelope>`

    var env SOAPEnvelope
    xml.Unmarshal([]byte(responseXML), &env)

    var resp GetUserResponse
    xml.Unmarshal(env.Body.Content, &resp)

    fmt.Printf("\n解析后的响应:\n")
    fmt.Printf("用户 ID: %d\n", resp.User.ID)
    fmt.Printf("姓名: %s\n", resp.User.Name)
    fmt.Printf("邮箱: %s\n", resp.User.Email)
}
```

## 面试要点

1. **结构体标签语法**：
   - `xml:"name"` - 元素名称
   - `xml:"name,attr"` - 属性
   - `xml:",chardata"` - 文本内容
   - `xml:",innerxml"` - 原始 XML
   - `xml:"-"` - 忽略字段

2. **流式解析与完整解析**：
   - 小文档使用 `Unmarshal`
   - 大文档使用 `Decoder.Token()`
   - 选择性解析使用 `DecodeElement`

3. **命名空间处理**：
   - 在标签中使用完整命名空间 URI：`xml:"http://ns.example.com name"`
   - XMLName 字段用于命名空间感知的序列化

4. **常用接口**：
   - `xml.Marshaler` 用于自定义序列化
   - `xml.Unmarshaler` 用于自定义反序列化
   - `xml.MarshalerAttr` 用于自定义属性序列化

5. **安全注意事项**：
   - 禁用实体展开以防止 XXE 攻击
   - 处理前验证输入
   - 需要时使用 `Strict` 模式

## 延伸阅读

- [Go 文档：encoding/xml](https://pkg.go.dev/encoding/xml)
- [Go 中的 XML 处理](https://blog.golang.org/json-and-go)（概念同样适用于 XML）
- [Effective Go：数据](https://golang.org/doc/effective_go#data)
- [W3C XML 规范](https://www.w3.org/XML/)
- [XML 安全最佳实践](https://cheatsheetseries.owasp.org/cheatsheets/XML_Security_Cheat_Sheet.html)
