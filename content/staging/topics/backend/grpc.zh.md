---
title: gRPC 完全指南
description: 掌握gRPC高性能RPC框架，构建微服务间高效通信
track: backend
section: http-apis
difficulty: advanced
tags:
  - gRPC
  - RPC
  - Protocol Buffers
  - 微服务
status: imported
origin: old/src/content/docs/backend/grpc.zh.md
divergence: 0.202
issues: []
legacy:
  category: Backend
  subcategory: API
  order: 9
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 gRPC

gRPC（gRPC Remote Procedure Call）是 Google 开源的高性能、通用的远程过程调用（RPC）框架。它使用 HTTP/2 作为传输协议，Protocol Buffers（protobuf）作为接口定义语言和序列化格式，支持多种编程语言的跨平台通信。

gRPC 的设计目标是实现高效、可靠的服务间通信，特别适用于微服务架构、移动应用后端和分布式系统。它提供了双向流、流量控制、头部压缩、多路复用等特性，使其成为构建高性能分布式系统的理想选择。

### gRPC 的核心特性

1. **高性能**：基于 HTTP/2 和 Protocol Buffers，提供比 JSON/REST 更高的传输效率
2. **强类型契约**：通过 .proto 文件定义服务接口，自动生成客户端和服务端代码
3. **双向流**：支持客户端流、服务端流和双向流通信模式
4. **跨语言支持**：官方支持 10+ 种编程语言
5. **可插拔设计**：支持自定义认证、负载均衡、健康检查等
6. **截止时间/超时**：内置的截止时间传播机制

### gRPC 解决的问题

- **微服务通信效率**：二进制序列化比 JSON 更紧凑，HTTP/2 多路复用减少连接开销
- **接口一致性**：强类型 IDL 确保客户端和服务端接口一致
- **开发效率**：自动代码生成减少样板代码
- **复杂通信模式**：原生支持流式通信，简化实时数据传输

## gRPC vs REST vs GraphQL

### 技术对比

| 特性 | gRPC | REST | GraphQL |
|------|------|------|---------|
| 协议 | HTTP/2 | HTTP/1.1 或 HTTP/2 | HTTP |
| 数据格式 | Protocol Buffers（二进制） | JSON/XML（文本） | JSON（文本） |
| 类型安全 | 强类型 | 弱类型 | 强类型 |
| 代码生成 | 自动生成 | 手动或工具辅助 | 自动生成 |
| 流式支持 | 原生支持 | 需要 WebSocket | 通过订阅支持 |
| 浏览器支持 | 需要 gRPC-Web | 原生支持 | 原生支持 |
| 学习曲线 | 较陡 | 平缓 | 中等 |
| 适用场景 | 内部微服务 | 公共 API | 复杂查询需求 |

### 性能对比

```plaintext
序列化/反序列化性能（相对值，越小越好）：
Protocol Buffers: 1x
JSON:            3-5x
XML:             10-20x

消息大小（相对值，越小越好）：
Protocol Buffers: 1x
JSON:            2-3x
XML:             5-10x
```

### 选择建议

```plaintext
选择 gRPC 当：
- 微服务之间的内部通信
- 需要双向流式通信
- 对延迟和带宽敏感
- 多语言服务互操作
- 需要强类型契约

选择 REST 当：
- 公开的 Web API
- 浏览器直接调用
- 简单的 CRUD 操作
- 团队熟悉 HTTP/JSON
- 需要良好的可缓存性

选择 GraphQL 当：
- 客户端需要灵活查询
- 减少过度获取/获取不足
- 多种客户端有不同数据需求
- 快速迭代的前端应用
```

## Protocol Buffers（protobuf）

### 基础语法

Protocol Buffers 是 Google 开发的语言中立、平台中立的序列化结构数据的方法。它比 XML 和 JSON 更小、更快、更简单。

```protobuf
// user.proto
syntax = "proto3";

package user;

option go_package = "github.com/example/user";
option java_package = "com.example.user";

// 用户消息定义
message User {
  int64 id = 1;                    // 字段编号，不是默认值
  string username = 2;
  string email = 3;
  UserStatus status = 4;
  repeated string roles = 5;        // 数组类型
  optional string avatar = 6;       // 可选字段
  map<string, string> metadata = 7; // Map 类型
  google.protobuf.Timestamp created_at = 8;
}

// 枚举定义
enum UserStatus {
  USER_STATUS_UNSPECIFIED = 0;  // 枚举必须从 0 开始
  USER_STATUS_ACTIVE = 1;
  USER_STATUS_INACTIVE = 2;
  USER_STATUS_BANNED = 3;
}

// 嵌套消息
message Address {
  string street = 1;
  string city = 2;
  string country = 3;
  string postal_code = 4;
}

message UserProfile {
  User user = 1;
  Address address = 2;
  repeated string interests = 3;
}
```

### 字段编号规则

```protobuf
message Example {
  // 1-15: 使用 1 字节编码，用于高频字段
  string name = 1;
  int32 age = 2;

  // 16-2047: 使用 2 字节编码
  string description = 16;

  // 19000-19999: 保留给 Protocol Buffers 实现
  // 不要使用这个范围的编号

  // 字段编号一旦使用，不应更改或重用
  reserved 3, 4, 5;           // 保留编号
  reserved "old_field";       // 保留字段名
}
```

### 标量类型映射

```protobuf
// Proto 类型 -> 各语言类型映射
message ScalarTypes {
  double double_val = 1;      // float64 / double / float
  float float_val = 2;        // float32 / float / float
  int32 int32_val = 3;        // int32 / int / int
  int64 int64_val = 4;        // int64 / long / int
  uint32 uint32_val = 5;      // uint32 / int / int
  uint64 uint64_val = 6;      // uint64 / long / int
  sint32 sint32_val = 7;      // int32（负数优化）
  sint64 sint64_val = 8;      // int64（负数优化）
  fixed32 fixed32_val = 9;    // uint32（固定 4 字节）
  fixed64 fixed64_val = 10;   // uint64（固定 8 字节）
  sfixed32 sfixed32_val = 11; // int32（固定 4 字节）
  sfixed64 sfixed64_val = 12; // int64（固定 8 字节）
  bool bool_val = 13;         // bool
  string string_val = 14;     // string（UTF-8）
  bytes bytes_val = 15;       // []byte / ByteString
}
```

### 高级特性

```protobuf
syntax = "proto3";

import "google/protobuf/any.proto";
import "google/protobuf/timestamp.proto";
import "google/protobuf/duration.proto";
import "google/protobuf/wrappers.proto";

// oneof - 多选一字段
message NotificationTarget {
  oneof target {
    string email = 1;
    string phone = 2;
    string user_id = 3;
  }
}

// Any - 动态类型
message DynamicMessage {
  string type = 1;
  google.protobuf.Any payload = 2;
}

// Wrapper Types - 可区分零值和未设置
message OptionalFields {
  google.protobuf.StringValue nullable_string = 1;
  google.protobuf.Int32Value nullable_int = 2;
  google.protobuf.BoolValue nullable_bool = 3;
}

// 时间类型
message TimeExample {
  google.protobuf.Timestamp created_at = 1;
  google.protobuf.Duration timeout = 2;
}
```

## 服务定义与代码生成

### 服务定义

```protobuf
// service.proto
syntax = "proto3";

package order;

option go_package = "github.com/example/order/proto";

import "google/protobuf/empty.proto";
import "google/protobuf/timestamp.proto";

// 订单服务定义
service OrderService {
  // 一元 RPC - 创建订单
  rpc CreateOrder(CreateOrderRequest) returns (Order);

  // 一元 RPC - 获取订单
  rpc GetOrder(GetOrderRequest) returns (Order);

  // 服务端流 - 获取订单历史
  rpc GetOrderHistory(GetOrderHistoryRequest) returns (stream Order);

  // 客户端流 - 批量创建订单
  rpc BatchCreateOrders(stream CreateOrderRequest) returns (BatchCreateResponse);

  // 双向流 - 实时订单更新
  rpc OrderUpdates(stream OrderUpdateRequest) returns (stream OrderUpdateResponse);

  // 删除订单
  rpc DeleteOrder(DeleteOrderRequest) returns (google.protobuf.Empty);
}

// 请求和响应消息
message CreateOrderRequest {
  string customer_id = 1;
  repeated OrderItem items = 2;
  Address shipping_address = 3;
  PaymentMethod payment_method = 4;
}

message Order {
  string id = 1;
  string customer_id = 2;
  repeated OrderItem items = 3;
  OrderStatus status = 4;
  Money total_amount = 5;
  google.protobuf.Timestamp created_at = 6;
  google.protobuf.Timestamp updated_at = 7;
}

message OrderItem {
  string product_id = 1;
  string name = 2;
  int32 quantity = 3;
  Money unit_price = 4;
}

message Money {
  string currency = 1;  // ISO 4217 货币代码
  int64 units = 2;      // 整数部分
  int32 nanos = 3;      // 小数部分（纳秒精度）
}

message Address {
  string street = 1;
  string city = 2;
  string state = 3;
  string country = 4;
  string postal_code = 5;
}

enum PaymentMethod {
  PAYMENT_METHOD_UNSPECIFIED = 0;
  PAYMENT_METHOD_CREDIT_CARD = 1;
  PAYMENT_METHOD_DEBIT_CARD = 2;
  PAYMENT_METHOD_PAYPAL = 3;
  PAYMENT_METHOD_BANK_TRANSFER = 4;
}

enum OrderStatus {
  ORDER_STATUS_UNSPECIFIED = 0;
  ORDER_STATUS_PENDING = 1;
  ORDER_STATUS_CONFIRMED = 2;
  ORDER_STATUS_PROCESSING = 3;
  ORDER_STATUS_SHIPPED = 4;
  ORDER_STATUS_DELIVERED = 5;
  ORDER_STATUS_CANCELLED = 6;
}

message GetOrderRequest {
  string order_id = 1;
}

message GetOrderHistoryRequest {
  string customer_id = 1;
  int32 page_size = 2;
  string page_token = 3;
}

message BatchCreateResponse {
  repeated Order orders = 1;
  int32 success_count = 2;
  int32 failure_count = 3;
}

message OrderUpdateRequest {
  string order_id = 1;
  oneof update {
    OrderStatus new_status = 2;
    Address new_shipping_address = 3;
  }
}

message OrderUpdateResponse {
  string order_id = 1;
  bool success = 2;
  string message = 3;
  Order updated_order = 4;
}

message DeleteOrderRequest {
  string order_id = 1;
}
```

### 代码生成

```bash
# 安装 protoc 编译器
# macOS
brew install protobuf

# Ubuntu/Debian
sudo apt-get install -y protobuf-compiler

# 安装语言特定插件

# Go
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Node.js
npm install -g grpc-tools

# Python
pip install grpcio-tools

# 生成代码

# Go
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
       proto/service.proto

# Node.js
grpc_tools_node_protoc --js_out=import_style=commonjs,binary:./generated \
                       --grpc_out=grpc_js:./generated \
                       --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` \
                       proto/service.proto

# Python
python -m grpc_tools.protoc -I. --python_out=./generated \
                            --grpc_python_out=./generated \
                            proto/service.proto
```

### 使用 Buf 工具

```yaml
# buf.yaml - 项目配置
version: v1
breaking:
  use:
    - FILE
lint:
  use:
    - DEFAULT
  except:
    - ENUM_VALUE_PREFIX
    - ENUM_ZERO_VALUE_SUFFIX

# buf.gen.yaml - 代码生成配置
version: v1
plugins:
  - plugin: go
    out: gen/go
    opt: paths=source_relative
  - plugin: go-grpc
    out: gen/go
    opt: paths=source_relative
  - plugin: grpc-web
    out: gen/web
    opt: import_style=typescript,mode=grpcwebtext
```

```bash
# 使用 buf 生成代码
buf generate

# 检查破坏性变更
buf breaking --against '.git#branch=main'

# lint 检查
buf lint
```

## 四种通信模式

### 一元 RPC（Unary RPC）

最简单的 RPC 模式，客户端发送单个请求，服务端返回单个响应。

```go
// Go 服务端实现
package main

import (
    "context"
    "log"
    "net"

    "google.golang.org/grpc"
    pb "github.com/example/order/proto"
)

type orderServer struct {
    pb.UnimplementedOrderServiceServer
}

func (s *orderServer) GetOrder(ctx context.Context, req *pb.GetOrderRequest) (*pb.Order, error) {
    log.Printf("Received GetOrder request for order: %s", req.OrderId)

    // 模拟从数据库获取订单
    order := &pb.Order{
        Id:         req.OrderId,
        CustomerId: "customer-123",
        Status:     pb.OrderStatus_ORDER_STATUS_CONFIRMED,
        TotalAmount: &pb.Money{
            Currency: "USD",
            Units:    99,
            Nanos:    990000000,
        },
    }

    return order, nil
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }

    s := grpc.NewServer()
    pb.RegisterOrderServiceServer(s, &orderServer{})

    log.Println("Server listening on :50051")
    if err := s.Serve(lis); err != nil {
        log.Fatalf("failed to serve: %v", err)
    }
}
```

```go
// Go 客户端调用
package main

import (
    "context"
    "log"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
    pb "github.com/example/order/proto"
)

func main() {
    conn, err := grpc.Dial("localhost:50051",
        grpc.WithTransportCredentials(insecure.NewCredentials()))
    if err != nil {
        log.Fatalf("did not connect: %v", err)
    }
    defer conn.Close()

    client := pb.NewOrderServiceClient(conn)

    ctx, cancel := context.WithTimeout(context.Background(), time.Second)
    defer cancel()

    order, err := client.GetOrder(ctx, &pb.GetOrderRequest{
        OrderId: "order-456",
    })
    if err != nil {
        log.Fatalf("could not get order: %v", err)
    }

    log.Printf("Order: %+v", order)
}
```

### 服务端流 RPC（Server Streaming RPC）

客户端发送单个请求，服务端返回消息流。

```go
// 服务端流实现
func (s *orderServer) GetOrderHistory(req *pb.GetOrderHistoryRequest,
    stream pb.OrderService_GetOrderHistoryServer) error {

    log.Printf("Streaming order history for customer: %s", req.CustomerId)

    // 模拟从数据库分批获取订单
    orders := []pb.Order{
        {Id: "order-1", CustomerId: req.CustomerId, Status: pb.OrderStatus_ORDER_STATUS_DELIVERED},
        {Id: "order-2", CustomerId: req.CustomerId, Status: pb.OrderStatus_ORDER_STATUS_SHIPPED},
        {Id: "order-3", CustomerId: req.CustomerId, Status: pb.OrderStatus_ORDER_STATUS_PROCESSING},
    }

    for _, order := range orders {
        // 检查客户端是否取消
        if err := stream.Context().Err(); err != nil {
            return err
        }

        if err := stream.Send(&order); err != nil {
            return err
        }

        // 模拟处理延迟
        time.Sleep(500 * time.Millisecond)
    }

    return nil
}

// 客户端接收流
func receiveOrderHistory(client pb.OrderServiceClient) error {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    stream, err := client.GetOrderHistory(ctx, &pb.GetOrderHistoryRequest{
        CustomerId: "customer-123",
        PageSize:   10,
    })
    if err != nil {
        return err
    }

    for {
        order, err := stream.Recv()
        if err == io.EOF {
            break
        }
        if err != nil {
            return err
        }
        log.Printf("Received order: %s", order.Id)
    }

    return nil
}
```

### 客户端流 RPC（Client Streaming RPC）

客户端发送消息流，服务端返回单个响应。

```go
// 服务端接收流
func (s *orderServer) BatchCreateOrders(
    stream pb.OrderService_BatchCreateOrdersServer) error {

    var orders []*pb.Order
    var successCount, failureCount int32

    for {
        req, err := stream.Recv()
        if err == io.EOF {
            // 客户端完成发送，返回响应
            return stream.SendAndClose(&pb.BatchCreateResponse{
                Orders:       orders,
                SuccessCount: successCount,
                FailureCount: failureCount,
            })
        }
        if err != nil {
            return err
        }

        // 处理每个订单创建请求
        order, err := createOrder(req)
        if err != nil {
            failureCount++
            log.Printf("Failed to create order: %v", err)
            continue
        }

        orders = append(orders, order)
        successCount++
    }
}

// 客户端发送流
func batchCreateOrders(client pb.OrderServiceClient) error {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    stream, err := client.BatchCreateOrders(ctx)
    if err != nil {
        return err
    }

    requests := []*pb.CreateOrderRequest{
        {CustomerId: "c1", Items: []*pb.OrderItem{{ProductId: "p1", Quantity: 2}}},
        {CustomerId: "c2", Items: []*pb.OrderItem{{ProductId: "p2", Quantity: 1}}},
        {CustomerId: "c3", Items: []*pb.OrderItem{{ProductId: "p3", Quantity: 5}}},
    }

    for _, req := range requests {
        if err := stream.Send(req); err != nil {
            return err
        }
    }

    response, err := stream.CloseAndRecv()
    if err != nil {
        return err
    }

    log.Printf("Batch create result: %d success, %d failure",
        response.SuccessCount, response.FailureCount)
    return nil
}
```

### 双向流 RPC（Bidirectional Streaming RPC）

客户端和服务端同时发送消息流，双方独立读写。

```go
// 服务端双向流实现
func (s *orderServer) OrderUpdates(
    stream pb.OrderService_OrderUpdatesServer) error {

    for {
        req, err := stream.Recv()
        if err == io.EOF {
            return nil
        }
        if err != nil {
            return err
        }

        log.Printf("Received update for order: %s", req.OrderId)

        // 处理更新请求
        var response pb.OrderUpdateResponse
        switch update := req.Update.(type) {
        case *pb.OrderUpdateRequest_NewStatus:
            response = pb.OrderUpdateResponse{
                OrderId: req.OrderId,
                Success: true,
                Message: fmt.Sprintf("Status updated to %s", update.NewStatus),
            }
        case *pb.OrderUpdateRequest_NewShippingAddress:
            response = pb.OrderUpdateResponse{
                OrderId: req.OrderId,
                Success: true,
                Message: "Shipping address updated",
            }
        }

        if err := stream.Send(&response); err != nil {
            return err
        }
    }
}

// 客户端双向流
func orderUpdates(client pb.OrderServiceClient) error {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    stream, err := client.OrderUpdates(ctx)
    if err != nil {
        return err
    }

    // 启动 goroutine 接收响应
    waitc := make(chan struct{})
    go func() {
        for {
            response, err := stream.Recv()
            if err == io.EOF {
                close(waitc)
                return
            }
            if err != nil {
                log.Printf("Receive error: %v", err)
                close(waitc)
                return
            }
            log.Printf("Update response: %+v", response)
        }
    }()

    // 发送更新请求
    updates := []*pb.OrderUpdateRequest{
        {OrderId: "o1", Update: &pb.OrderUpdateRequest_NewStatus{
            NewStatus: pb.OrderStatus_ORDER_STATUS_SHIPPED,
        }},
        {OrderId: "o2", Update: &pb.OrderUpdateRequest_NewStatus{
            NewStatus: pb.OrderStatus_ORDER_STATUS_DELIVERED,
        }},
    }

    for _, update := range updates {
        if err := stream.Send(update); err != nil {
            return err
        }
    }

    stream.CloseSend()
    <-waitc

    return nil
}
```

## 错误处理与状态码

### gRPC 状态码

```go
import (
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

// gRPC 标准状态码
const (
    codes.OK                 = 0   // 成功
    codes.Cancelled          = 1   // 操作被取消
    codes.Unknown            = 2   // 未知错误
    codes.InvalidArgument    = 3   // 无效参数
    codes.DeadlineExceeded   = 4   // 超时
    codes.NotFound           = 5   // 资源不存在
    codes.AlreadyExists      = 6   // 资源已存在
    codes.PermissionDenied   = 7   // 权限被拒绝
    codes.ResourceExhausted  = 8   // 资源耗尽（限流）
    codes.FailedPrecondition = 9   // 前置条件失败
    codes.Aborted            = 10  // 操作被中止
    codes.OutOfRange         = 11  // 超出范围
    codes.Unimplemented      = 12  // 未实现
    codes.Internal           = 13  // 内部错误
    codes.Unavailable        = 14  // 服务不可用
    codes.DataLoss           = 15  // 数据丢失
    codes.Unauthenticated    = 16  // 未认证
)
```

### 错误处理实现

```go
// 服务端错误处理
import (
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
    "google.golang.org/genproto/googleapis/rpc/errdetails"
)

func (s *orderServer) GetOrder(ctx context.Context, req *pb.GetOrderRequest) (*pb.Order, error) {
    // 参数验证
    if req.OrderId == "" {
        return nil, status.Error(codes.InvalidArgument, "order_id is required")
    }

    // 查找订单
    order, err := s.repo.FindOrder(ctx, req.OrderId)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            return nil, status.Errorf(codes.NotFound,
                "order %s not found", req.OrderId)
        }
        return nil, status.Error(codes.Internal, "failed to fetch order")
    }

    return order, nil
}

// 带详细信息的错误
func (s *orderServer) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.Order, error) {
    // 验证请求
    violations := validateCreateOrderRequest(req)
    if len(violations) > 0 {
        st := status.New(codes.InvalidArgument, "invalid request")

        // 添加字段违规详情
        br := &errdetails.BadRequest{}
        for _, v := range violations {
            br.FieldViolations = append(br.FieldViolations,
                &errdetails.BadRequest_FieldViolation{
                    Field:       v.Field,
                    Description: v.Description,
                })
        }

        st, _ = st.WithDetails(br)
        return nil, st.Err()
    }

    // 创建订单...
    return order, nil
}

// 重试信息
func (s *orderServer) ProcessPayment(ctx context.Context, req *pb.PaymentRequest) (*pb.PaymentResponse, error) {
    if s.isOverloaded() {
        st := status.New(codes.ResourceExhausted, "service overloaded")

        // 添加重试信息
        ri := &errdetails.RetryInfo{
            RetryDelay: durationpb.New(5 * time.Second),
        }
        st, _ = st.WithDetails(ri)

        return nil, st.Err()
    }
    // 处理支付...
}
```

```go
// 客户端错误处理
func handleError(err error) {
    if err == nil {
        return
    }

    st, ok := status.FromError(err)
    if !ok {
        log.Printf("Unknown error: %v", err)
        return
    }

    log.Printf("gRPC error: code=%s, message=%s", st.Code(), st.Message())

    // 处理特定错误码
    switch st.Code() {
    case codes.NotFound:
        log.Println("Resource not found")
    case codes.InvalidArgument:
        // 提取详细信息
        for _, detail := range st.Details() {
            switch t := detail.(type) {
            case *errdetails.BadRequest:
                for _, v := range t.GetFieldViolations() {
                    log.Printf("Field %s: %s", v.GetField(), v.GetDescription())
                }
            }
        }
    case codes.ResourceExhausted:
        // 提取重试信息
        for _, detail := range st.Details() {
            switch t := detail.(type) {
            case *errdetails.RetryInfo:
                log.Printf("Retry after: %v", t.GetRetryDelay().AsDuration())
            }
        }
    case codes.Unavailable:
        log.Println("Service unavailable, will retry")
    default:
        log.Printf("Unhandled error code: %s", st.Code())
    }
}
```

### HTTP 状态码映射

```plaintext
gRPC Code              HTTP Status    说明
-------------------------------------------------------
OK                     200            成功
Cancelled              499            客户端取消
Unknown                500            内部服务器错误
InvalidArgument        400            错误请求
DeadlineExceeded       504            网关超时
NotFound               404            未找到
AlreadyExists          409            冲突
PermissionDenied       403            禁止访问
ResourceExhausted      429            请求过多
FailedPrecondition     400            错误请求
Aborted                409            冲突
OutOfRange             400            错误请求
Unimplemented          501            未实现
Internal               500            内部服务器错误
Unavailable            503            服务不可用
DataLoss               500            内部服务器错误
Unauthenticated        401            未授权
```

## 认证与安全

### TLS 加密

```go
// 服务端 TLS 配置
import (
    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials"
)

func createTLSServer() (*grpc.Server, error) {
    // 加载证书
    creds, err := credentials.NewServerTLSFromFile(
        "server.crt",
        "server.key",
    )
    if err != nil {
        return nil, err
    }

    s := grpc.NewServer(grpc.Creds(creds))
    return s, nil
}

// 双向 TLS (mTLS)
func createMTLSServer() (*grpc.Server, error) {
    cert, err := tls.LoadX509KeyPair("server.crt", "server.key")
    if err != nil {
        return nil, err
    }

    // 加载 CA 证书用于验证客户端
    caCert, err := os.ReadFile("ca.crt")
    if err != nil {
        return nil, err
    }

    caCertPool := x509.NewCertPool()
    caCertPool.AppendCertsFromPEM(caCert)

    tlsConfig := &tls.Config{
        Certificates: []tls.Certificate{cert},
        ClientCAs:    caCertPool,
        ClientAuth:   tls.RequireAndVerifyClientCert,
    }

    creds := credentials.NewTLS(tlsConfig)
    s := grpc.NewServer(grpc.Creds(creds))
    return s, nil
}

// 客户端 TLS
func createTLSClient() (*grpc.ClientConn, error) {
    creds, err := credentials.NewClientTLSFromFile(
        "server.crt",
        "server.example.com", // 服务器名称
    )
    if err != nil {
        return nil, err
    }

    conn, err := grpc.Dial(
        "server.example.com:50051",
        grpc.WithTransportCredentials(creds),
    )
    return conn, err
}
```

### Token 认证

```go
// 自定义凭据
type tokenAuth struct {
    token string
}

func (t tokenAuth) GetRequestMetadata(ctx context.Context, uri ...string) (map[string]string, error) {
    return map[string]string{
        "authorization": "Bearer " + t.token,
    }, nil
}

func (t tokenAuth) RequireTransportSecurity() bool {
    return true // 要求 TLS
}

// 客户端使用 Token
func createAuthenticatedClient(token string) (*grpc.ClientConn, error) {
    creds, _ := credentials.NewClientTLSFromFile("server.crt", "")

    conn, err := grpc.Dial(
        "localhost:50051",
        grpc.WithTransportCredentials(creds),
        grpc.WithPerRPCCredentials(tokenAuth{token: token}),
    )
    return conn, err
}

// 服务端验证 Token - 使用拦截器
func authInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    // 跳过不需要认证的方法
    if info.FullMethod == "/health.HealthService/Check" {
        return handler(ctx, req)
    }

    // 从 metadata 获取 token
    md, ok := metadata.FromIncomingContext(ctx)
    if !ok {
        return nil, status.Error(codes.Unauthenticated, "missing metadata")
    }

    values := md.Get("authorization")
    if len(values) == 0 {
        return nil, status.Error(codes.Unauthenticated, "missing authorization header")
    }

    token := strings.TrimPrefix(values[0], "Bearer ")

    // 验证 token
    claims, err := validateToken(token)
    if err != nil {
        return nil, status.Error(codes.Unauthenticated, "invalid token")
    }

    // 将用户信息添加到 context
    ctx = context.WithValue(ctx, "user_id", claims.UserID)
    ctx = context.WithValue(ctx, "roles", claims.Roles)

    return handler(ctx, req)
}

// 注册拦截器
func main() {
    s := grpc.NewServer(
        grpc.UnaryInterceptor(authInterceptor),
        grpc.StreamInterceptor(streamAuthInterceptor),
    )
    // ...
}
```

### API Key 认证

```go
// 使用 Metadata 传递 API Key
func createAPIKeyClient(apiKey string) (*grpc.ClientConn, error) {
    conn, err := grpc.Dial(
        "localhost:50051",
        grpc.WithTransportCredentials(insecure.NewCredentials()),
        grpc.WithUnaryInterceptor(func(
            ctx context.Context,
            method string,
            req, reply interface{},
            cc *grpc.ClientConn,
            invoker grpc.UnaryInvoker,
            opts ...grpc.CallOption,
        ) error {
            ctx = metadata.AppendToOutgoingContext(ctx, "x-api-key", apiKey)
            return invoker(ctx, method, req, reply, cc, opts...)
        }),
    )
    return conn, err
}
```

## 负载均衡与服务发现

### 客户端负载均衡

```go
import (
    "google.golang.org/grpc"
    "google.golang.org/grpc/resolver"
    _ "google.golang.org/grpc/balancer/roundrobin"
)

// 使用 DNS 解析和轮询负载均衡
func createLoadBalancedClient() (*grpc.ClientConn, error) {
    conn, err := grpc.Dial(
        "dns:///my-service.example.com:50051",
        grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    return conn, err
}

// 自定义服务发现 Resolver
type consulResolver struct {
    cc           resolver.ClientConn
    consulAddr   string
    serviceName  string
    ctx          context.Context
    cancel       context.CancelFunc
}

func (r *consulResolver) ResolveNow(opts resolver.ResolveNowOptions) {
    // 从 Consul 获取服务实例
    instances, err := r.getServiceInstances()
    if err != nil {
        log.Printf("Failed to get instances: %v", err)
        return
    }

    var addrs []resolver.Address
    for _, inst := range instances {
        addrs = append(addrs, resolver.Address{
            Addr: fmt.Sprintf("%s:%d", inst.Host, inst.Port),
            ServerName: inst.ID,
        })
    }

    r.cc.UpdateState(resolver.State{Addresses: addrs})
}

// 注册 Resolver Builder
func init() {
    resolver.Register(&consulResolverBuilder{})
}

// 使用自定义 Resolver
func createConsulClient() (*grpc.ClientConn, error) {
    conn, err := grpc.Dial(
        "consul://localhost:8500/order-service",
        grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    return conn, err
}
```

### 服务健康检查

```protobuf
// health.proto - 标准健康检查协议
syntax = "proto3";

package grpc.health.v1;

service Health {
  rpc Check(HealthCheckRequest) returns (HealthCheckResponse);
  rpc Watch(HealthCheckRequest) returns (stream HealthCheckResponse);
}

message HealthCheckRequest {
  string service = 1;
}

message HealthCheckResponse {
  enum ServingStatus {
    UNKNOWN = 0;
    SERVING = 1;
    NOT_SERVING = 2;
    SERVICE_UNKNOWN = 3;
  }
  ServingStatus status = 1;
}
```

```go
// 服务端健康检查
import (
    "google.golang.org/grpc/health"
    healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func main() {
    s := grpc.NewServer()

    // 注册健康检查服务
    healthServer := health.NewServer()
    healthpb.RegisterHealthServer(s, healthServer)

    // 设置服务状态
    healthServer.SetServingStatus("order.OrderService", healthpb.HealthCheckResponse_SERVING)

    // 业务服务
    pb.RegisterOrderServiceServer(s, &orderServer{})

    // 启动服务...
}

// 客户端健康检查
func checkHealth(conn *grpc.ClientConn) error {
    client := healthpb.NewHealthClient(conn)

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    resp, err := client.Check(ctx, &healthpb.HealthCheckRequest{
        Service: "order.OrderService",
    })
    if err != nil {
        return err
    }

    if resp.Status != healthpb.HealthCheckResponse_SERVING {
        return fmt.Errorf("service not serving: %s", resp.Status)
    }

    return nil
}
```

### 连接管理

```go
// 连接池和重试配置
func createRobustClient() (*grpc.ClientConn, error) {
    // 服务配置 JSON
    serviceConfig := `{
        "loadBalancingPolicy": "round_robin",
        "healthCheckConfig": {
            "serviceName": "order.OrderService"
        },
        "methodConfig": [{
            "name": [{"service": "order.OrderService"}],
            "waitForReady": true,
            "timeout": "10s",
            "retryPolicy": {
                "maxAttempts": 5,
                "initialBackoff": "0.1s",
                "maxBackoff": "1s",
                "backoffMultiplier": 2,
                "retryableStatusCodes": ["UNAVAILABLE", "RESOURCE_EXHAUSTED"]
            }
        }]
    }`

    conn, err := grpc.Dial(
        "dns:///order-service:50051",
        grpc.WithDefaultServiceConfig(serviceConfig),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
        grpc.WithKeepaliveParams(keepalive.ClientParameters{
            Time:                10 * time.Second, // 发送 keepalive ping 的间隔
            Timeout:             3 * time.Second,  // 等待 ping ack 的超时
            PermitWithoutStream: true,             // 允许没有活跃 stream 时发送 ping
        }),
    )
    return conn, err
}
```

## gRPC-Web 与浏览器支持

### gRPC-Web 概述

由于浏览器不支持 HTTP/2 trailers（gRPC 依赖的特性），需要使用 gRPC-Web 协议。gRPC-Web 需要一个代理层将 gRPC-Web 请求转换为标准 gRPC 请求。

### Envoy 代理配置

```yaml
# envoy.yaml
admin:
  address:
    socket_address: { address: 0.0.0.0, port_value: 9901 }

static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address: { address: 0.0.0.0, port_value: 8080 }
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                codec_type: auto
                stat_prefix: ingress_http
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: local_service
                      domains: ["*"]
                      routes:
                        - match: { prefix: "/" }
                          route:
                            cluster: grpc_service
                            timeout: 0s
                            max_stream_duration:
                              grpc_timeout_header_max: 0s
                      cors:
                        allow_origin_string_match:
                          - prefix: "*"
                        allow_methods: GET, PUT, DELETE, POST, OPTIONS
                        allow_headers: keep-alive,user-agent,cache-control,content-type,content-transfer-encoding,x-accept-content-transfer-encoding,x-accept-response-streaming,x-user-agent,x-grpc-web,grpc-timeout,authorization
                        max_age: "1728000"
                        expose_headers: grpc-status,grpc-message
                http_filters:
                  - name: envoy.filters.http.grpc_web
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.grpc_web.v3.GrpcWeb
                  - name: envoy.filters.http.cors
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.cors.v3.Cors
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

  clusters:
    - name: grpc_service
      connect_timeout: 0.25s
      type: logical_dns
      http2_protocol_options: {}
      lb_policy: round_robin
      load_assignment:
        cluster_name: grpc_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: grpc-server
                      port_value: 50051
```

### TypeScript 客户端

```typescript
// 使用 protoc 生成 TypeScript 代码
// protoc --grpc-web_out=import_style=typescript,mode=grpcwebtext:./src/proto service.proto

import { OrderServiceClient } from './proto/ServiceServiceClientPb';
import {
  GetOrderRequest,
  CreateOrderRequest,
  Order
} from './proto/service_pb';

// 创建客户端
const client = new OrderServiceClient('http://localhost:8080', null, null);

// 一元调用
async function getOrder(orderId: string): Promise<Order> {
  const request = new GetOrderRequest();
  request.setOrderId(orderId);

  return new Promise((resolve, reject) => {
    client.getOrder(request, {
      'authorization': `Bearer ${getToken()}`
    }, (err, response) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(response);
    });
  });
}

// 服务端流
function getOrderHistory(customerId: string): void {
  const request = new GetOrderHistoryRequest();
  request.setCustomerId(customerId);
  request.setPageSize(10);

  const stream = client.getOrderHistory(request, {
    'authorization': `Bearer ${getToken()}`
  });

  stream.on('data', (order: Order) => {
    console.log('Received order:', order.toObject());
    // 更新 UI
    appendOrderToList(order);
  });

  stream.on('error', (err) => {
    console.error('Stream error:', err);
  });

  stream.on('end', () => {
    console.log('Stream ended');
  });
}

// 使用 async/await 风格（需要封装）
class OrderServiceClientWrapper {
  private client: OrderServiceClient;

  constructor(baseUrl: string) {
    this.client = new OrderServiceClient(baseUrl, null, null);
  }

  async getOrder(orderId: string): Promise<Order.AsObject> {
    const request = new GetOrderRequest();
    request.setOrderId(orderId);

    const response = await this.unaryCall(
      (callback) => this.client.getOrder(request, this.getMetadata(), callback)
    );

    return response.toObject();
  }

  private unaryCall<T>(
    call: (callback: (err: any, response: T) => void) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      call((err, response) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  private getMetadata(): { [key: string]: string } {
    return {
      'authorization': `Bearer ${getToken()}`
    };
  }
}
```

### React 集成示例

```tsx
// useGrpcQuery.ts - 自定义 Hook
import { useState, useEffect, useCallback } from 'react';
import { OrderServiceClient } from './proto/ServiceServiceClientPb';
import { GetOrderRequest, Order } from './proto/service_pb';

const client = new OrderServiceClient('http://localhost:8080', null, null);

export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order.AsObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    const request = new GetOrderRequest();
    request.setOrderId(orderId);

    client.getOrder(request, {}, (err, response) => {
      setLoading(false);
      if (err) {
        setError(new Error(err.message));
      } else {
        setOrder(response.toObject());
      }
    });
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
}

// OrderDetail.tsx
function OrderDetail({ orderId }: { orderId: string }) {
  const { order, loading, error } = useOrder(orderId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div>
      <h1>Order #{order.id}</h1>
      <p>Status: {order.status}</p>
      <p>Total: {order.totalAmount?.units}.{order.totalAmount?.nanos}</p>
    </div>
  );
}
```

## 最佳实践

### Proto 文件组织

```plaintext
proto/
├── buf.yaml
├── buf.gen.yaml
├── common/
│   ├── money.proto        # 通用货币类型
│   ├── pagination.proto   # 分页参数
│   └── timestamp.proto    # 时间戳扩展
├── order/
│   └── v1/
│       ├── order.proto    # 订单领域模型
│       └── service.proto  # 订单服务定义
├── user/
│   └── v1/
│       ├── user.proto
│       └── service.proto
└── inventory/
    └── v1/
        ├── inventory.proto
        └── service.proto
```

### API 版本控制

```protobuf
// 使用包名进行版本控制
syntax = "proto3";

package order.v1;

option go_package = "github.com/example/api/order/v1;orderv1";

// v1 版本的服务
service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (Order);
}

// 当需要破坏性变更时，创建新版本
// order/v2/service.proto
package order.v2;

service OrderService {
  // v2 版本可以有不同的 API 签名
  rpc CreateOrder(CreateOrderRequestV2) returns (OrderV2);
}
```

### 超时和截止时间

```go
// 服务端超时传播
func (s *orderServer) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.Order, error) {
    // 检查上下文是否已超时
    if ctx.Err() != nil {
        return nil, status.FromContextError(ctx.Err()).Err()
    }

    // 获取剩余时间
    deadline, ok := ctx.Deadline()
    if ok {
        remaining := time.Until(deadline)
        log.Printf("Remaining time: %v", remaining)

        // 为下游调用分配合理的超时
        childCtx, cancel := context.WithTimeout(ctx, remaining/2)
        defer cancel()

        // 调用下游服务
        _, err := s.inventoryClient.ReserveStock(childCtx, &inventorypb.ReserveRequest{})
        if err != nil {
            return nil, err
        }
    }

    // 处理订单创建...
    return &pb.Order{}, nil
}

// 客户端设置超时
func createOrderWithTimeout(client pb.OrderServiceClient) error {
    // 方式 1: context.WithTimeout
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    _, err := client.CreateOrder(ctx, &pb.CreateOrderRequest{})
    return err
}
```

### 拦截器链

```go
// 多个拦截器组合
import (
    "google.golang.org/grpc"
    grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware"
    grpc_recovery "github.com/grpc-ecosystem/go-grpc-middleware/recovery"
    grpc_zap "github.com/grpc-ecosystem/go-grpc-middleware/logging/zap"
    grpc_prometheus "github.com/grpc-ecosystem/go-grpc-prometheus"
)

func createServerWithMiddleware() *grpc.Server {
    logger, _ := zap.NewProduction()

    s := grpc.NewServer(
        grpc.ChainUnaryInterceptor(
            grpc_prometheus.UnaryServerInterceptor,                    // 指标收集
            grpc_zap.UnaryServerInterceptor(logger),                   // 日志记录
            grpc_recovery.UnaryServerInterceptor(),                    // panic 恢复
            authInterceptor,                                           // 认证
            rateLimitInterceptor,                                      // 限流
        ),
        grpc.ChainStreamInterceptor(
            grpc_prometheus.StreamServerInterceptor,
            grpc_zap.StreamServerInterceptor(logger),
            grpc_recovery.StreamServerInterceptor(),
            streamAuthInterceptor,
        ),
    )

    return s
}

// 自定义日志拦截器
func loggingInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    start := time.Now()

    // 调用实际处理器
    resp, err := handler(ctx, req)

    // 记录请求信息
    duration := time.Since(start)
    code := status.Code(err)

    log.Printf("method=%s duration=%v code=%s",
        info.FullMethod, duration, code)

    return resp, err
}
```

### 优雅关闭

```go
func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }

    s := grpc.NewServer()
    pb.RegisterOrderServiceServer(s, &orderServer{})

    // 启动服务
    go func() {
        if err := s.Serve(lis); err != nil {
            log.Fatalf("failed to serve: %v", err)
        }
    }()

    // 等待中断信号
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Shutting down server...")

    // 优雅关闭：停止接受新连接，等待现有请求完成
    s.GracefulStop()

    log.Println("Server stopped")
}
```

### 测试策略

```go
// 单元测试使用 mock
import (
    "testing"
    "github.com/golang/mock/gomock"
)

func TestCreateOrder(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()

    // 创建 mock 依赖
    mockInventory := mock_inventory.NewMockInventoryServiceClient(ctrl)
    mockInventory.EXPECT().
        ReserveStock(gomock.Any(), gomock.Any()).
        Return(&inventorypb.ReserveResponse{Success: true}, nil)

    // 创建服务实例
    server := &orderServer{
        inventoryClient: mockInventory,
    }

    // 测试
    resp, err := server.CreateOrder(context.Background(), &pb.CreateOrderRequest{
        CustomerId: "c1",
    })

    assert.NoError(t, err)
    assert.NotNil(t, resp)
}

// 集成测试使用 bufconn
import (
    "google.golang.org/grpc"
    "google.golang.org/grpc/test/bufconn"
)

const bufSize = 1024 * 1024

var lis *bufconn.Listener

func init() {
    lis = bufconn.Listen(bufSize)
    s := grpc.NewServer()
    pb.RegisterOrderServiceServer(s, &orderServer{})
    go func() {
        if err := s.Serve(lis); err != nil {
            log.Fatalf("Server exited with error: %v", err)
        }
    }()
}

func bufDialer(context.Context, string) (net.Conn, error) {
    return lis.Dial()
}

func TestIntegration(t *testing.T) {
    ctx := context.Background()
    conn, err := grpc.DialContext(ctx, "bufnet",
        grpc.WithContextDialer(bufDialer),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    if err != nil {
        t.Fatalf("Failed to dial bufnet: %v", err)
    }
    defer conn.Close()

    client := pb.NewOrderServiceClient(conn)

    resp, err := client.GetOrder(ctx, &pb.GetOrderRequest{
        OrderId: "test-order",
    })

    assert.NoError(t, err)
    assert.Equal(t, "test-order", resp.Id)
}
```

## 面试要点

### 核心概念题

**Q1: gRPC 与 REST 的主要区别是什么？什么场景选择 gRPC？**

```plaintext
A: 主要区别：
1. 协议：gRPC 使用 HTTP/2，REST 通常使用 HTTP/1.1
2. 数据格式：gRPC 使用 Protocol Buffers（二进制），REST 使用 JSON（文本）
3. 类型安全：gRPC 强类型，REST 弱类型
4. 通信模式：gRPC 支持流式通信，REST 是请求-响应模式
5. 代码生成：gRPC 自动生成客户端代码

选择 gRPC 的场景：
- 微服务间的内部通信
- 需要双向流（如实时通信）
- 对性能要求高（低延迟、高吞吐）
- 多语言服务互操作
- 需要强类型契约保证接口一致性
```

**Q2: 解释 Protocol Buffers 的优势和字段编号的作用**

```plaintext
A: Protocol Buffers 优势：
1. 体积小：二进制编码比 JSON 小 3-10 倍
2. 速度快：序列化/反序列化速度快 3-5 倍
3. 强类型：编译时类型检查
4. 向后兼容：通过字段编号实现

字段编号的作用：
- 唯一标识每个字段
- 1-15 使用单字节编码（用于高频字段）
- 16-2047 使用双字节编码
- 字段编号一旦使用，不能更改或重用
- 支持添加新字段而不破坏兼容性
- 删除字段时应使用 reserved 保留编号
```

**Q3: gRPC 的四种通信模式分别适用什么场景？**

```plaintext
A:
1. 一元 RPC (Unary)：
   - 场景：简单的请求-响应，如获取单个资源
   - 例子：GetUser、CreateOrder

2. 服务端流 (Server Streaming)：
   - 场景：服务端需要返回大量数据或持续推送
   - 例子：文件下载、实时股票报价、日志流

3. 客户端流 (Client Streaming)：
   - 场景：客户端需要上传大量数据
   - 例子：文件上传、批量数据导入

4. 双向流 (Bidirectional Streaming)：
   - 场景：实时双向通信
   - 例子：聊天应用、在线游戏、实时协作编辑
```

### 实践问题

**Q4: 如何实现 gRPC 服务的认证和授权？**

```go
// 答案要点：
// 1. TLS/mTLS 用于传输层安全
// 2. Token (JWT) 用于身份认证
// 3. 使用拦截器实现

func authInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    // 1. 从 metadata 获取 token
    md, ok := metadata.FromIncomingContext(ctx)
    if !ok {
        return nil, status.Error(codes.Unauthenticated, "missing metadata")
    }

    // 2. 验证 token
    token := md.Get("authorization")[0]
    claims, err := validateToken(token)
    if err != nil {
        return nil, status.Error(codes.Unauthenticated, "invalid token")
    }

    // 3. 检查权限（授权）
    if !hasPermission(claims.Roles, info.FullMethod) {
        return nil, status.Error(codes.PermissionDenied, "insufficient permissions")
    }

    // 4. 传递用户信息
    ctx = context.WithValue(ctx, "user", claims)
    return handler(ctx, req)
}
```

**Q5: gRPC 如何处理错误？如何返回详细的错误信息？**

```go
// 答案要点：
// 1. 使用 status 包创建带状态码的错误
// 2. 使用 errdetails 添加详细信息

func (s *server) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.Order, error) {
    // 验证失败时返回详细错误
    if req.CustomerId == "" {
        st := status.New(codes.InvalidArgument, "validation failed")
        st, _ = st.WithDetails(&errdetails.BadRequest{
            FieldViolations: []*errdetails.BadRequest_FieldViolation{
                {Field: "customer_id", Description: "cannot be empty"},
            },
        })
        return nil, st.Err()
    }

    // 资源不存在
    if customer == nil {
        return nil, status.Errorf(codes.NotFound, "customer %s not found", req.CustomerId)
    }

    // 内部错误（不要暴露敏感信息）
    if err := db.Save(order); err != nil {
        log.Printf("Database error: %v", err) // 记录详细错误
        return nil, status.Error(codes.Internal, "failed to save order")
    }

    return order, nil
}
```

**Q6: 如何实现 gRPC 的负载均衡和服务发现？**

```plaintext
A: gRPC 支持两种负载均衡模式：

1. 代理模式（服务端负载均衡）：
   - 使用 Nginx、Envoy、HAProxy 等
   - 客户端只连接代理，由代理分发请求
   - 优点：客户端简单，集中管理
   - 缺点：增加延迟，单点风险

2. 客户端负载均衡：
   - 客户端直接连接多个服务端
   - 使用 DNS 或服务发现获取实例列表
   - 内置策略：pick_first、round_robin
   - 优点：更低延迟，无单点
   - 缺点：客户端复杂度增加

服务发现实现：
- DNS-based：使用 dns:/// scheme
- 自定义 Resolver：集成 Consul、etcd、Kubernetes
- 配合 Health Check 动态更新实例列表
```

### 架构设计题

**Q7: 设计一个高可用的 gRPC 微服务架构**

```plaintext
A: 关键组件：

1. 服务注册与发现：
   - 服务启动时注册到 Consul/etcd
   - 客户端通过服务发现获取实例列表
   - 健康检查自动剔除故障实例

2. 负载均衡：
   - 客户端负载均衡（round_robin）
   - 或使用 Envoy 服务网格

3. 熔断与限流：
   - 客户端熔断器（如 hystrix）
   - 服务端限流拦截器
   - 降级策略

4. 超时与重试：
   - 设置合理的截止时间
   - 配置重试策略（仅对幂等操作）
   - 截止时间传播到下游

5. 可观测性：
   - 分布式追踪（Jaeger、Zipkin）
   - 指标收集（Prometheus）
   - 结构化日志

6. 安全：
   - mTLS 服务间通信
   - JWT 身份认证
   - RBAC 授权
```

**Q8: 如何处理 gRPC 和 REST 客户端共存的场景？**

```plaintext
A: 解决方案：

1. gRPC-Gateway：
   - 自动将 REST 请求转换为 gRPC
   - 通过 proto 注解定义 HTTP 映射
   - 统一使用 proto 定义 API

2. 架构设计：
   ┌─────────────┐    ┌─────────────┐
   │  Web 客户端  │    │  移动端/微服务 │
   └──────┬──────┘    └──────┬──────┘
          │                  │
      HTTP/REST           gRPC
          │                  │
          ▼                  │
   ┌──────────────┐         │
   │ gRPC-Gateway │         │
   └──────┬───────┘         │
          │ gRPC            │
          ▼                 ▼
   ┌──────────────────────────┐
   │      gRPC Server         │
   └──────────────────────────┘

3. 实现示例（proto 注解）：
   service OrderService {
     rpc GetOrder(GetOrderRequest) returns (Order) {
       option (google.api.http) = {
         get: "/v1/orders/{order_id}"
       };
     }
   }
```

## 总结

gRPC 是构建高性能微服务架构的强大工具，掌握以下核心要点：

1. **Protocol Buffers**：理解 proto 语法、字段编号、类型系统
2. **四种通信模式**：根据场景选择合适的通信模式
3. **错误处理**：正确使用状态码和错误详情
4. **认证安全**：TLS、Token、拦截器
5. **负载均衡**：客户端 vs 代理模式
6. **可观测性**：日志、指标、追踪
7. **最佳实践**：版本控制、超时、优雅关闭、测试

gRPC 特别适合内部微服务通信、对性能敏感的系统、以及需要强类型契约的多语言环境。在设计系统时，应根据实际需求选择合适的通信协议，gRPC 和 REST 可以共存互补。
