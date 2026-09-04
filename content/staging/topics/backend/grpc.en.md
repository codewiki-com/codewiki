---
title: gRPC Complete Guide
description: Master gRPC for high-performance microservices communication
track: backend
section: http-apis
difficulty: advanced
tags:
  - gRPC
  - RPC
  - Protocol Buffers
  - Microservices
status: imported
origin: old/src/content/docs/backend/grpc.en.md
divergence: 0.202
issues: []
legacy:
  category: Backend
  subcategory: API
  order: 9
  lastUpdated: 2026-01-07
---

## Concept Overview

### What is gRPC

gRPC (gRPC Remote Procedure Call) is an open-source, high-performance Remote Procedure Call (RPC) framework originally developed by Google. It uses HTTP/2 as the transport protocol and Protocol Buffers (protobuf) as both the interface definition language (IDL) and serialization format. gRPC enables efficient cross-platform communication across multiple programming languages.

The framework is designed for efficient, reliable inter-service communication, making it particularly well-suited for microservices architectures, mobile application backends, and distributed systems. It provides features such as bidirectional streaming, flow control, header compression, and multiplexing, establishing it as an ideal choice for building high-performance distributed systems.

### Core Features of gRPC

1. **High Performance**: Built on HTTP/2 and Protocol Buffers, delivering significantly higher transmission efficiency than JSON/REST
2. **Strong Type Contracts**: Service interfaces defined through .proto files with automatic client and server code generation
3. **Bidirectional Streaming**: Native support for client streaming, server streaming, and bidirectional streaming communication patterns
4. **Cross-Language Support**: Official support for 10+ programming languages
5. **Pluggable Architecture**: Extensible authentication, load balancing, health checking, and more
6. **Deadline Propagation**: Built-in mechanism for deadline and timeout propagation across services

### Problems gRPC Solves

- **Microservice Communication Efficiency**: Binary serialization is more compact than JSON; HTTP/2 multiplexing reduces connection overhead
- **Interface Consistency**: Strongly-typed IDL ensures client-server interface consistency
- **Developer Productivity**: Automatic code generation eliminates boilerplate code
- **Complex Communication Patterns**: Native streaming support simplifies real-time data transmission

## gRPC vs REST vs GraphQL

### Technical Comparison

| Feature | gRPC | REST | GraphQL |
|---------|------|------|---------|
| Protocol | HTTP/2 | HTTP/1.1 or HTTP/2 | HTTP |
| Data Format | Protocol Buffers (binary) | JSON/XML (text) | JSON (text) |
| Type Safety | Strongly typed | Weakly typed | Strongly typed |
| Code Generation | Automatic | Manual or tool-assisted | Automatic |
| Streaming Support | Native | Requires WebSocket | Via subscriptions |
| Browser Support | Requires gRPC-Web | Native | Native |
| Learning Curve | Steep | Gentle | Moderate |
| Best Use Case | Internal microservices | Public APIs | Complex query requirements |

### Performance Comparison

```plaintext
Serialization/Deserialization Performance (relative values, lower is better):
Protocol Buffers: 1x
JSON:            3-5x
XML:             10-20x

Message Size (relative values, smaller is better):
Protocol Buffers: 1x
JSON:            2-3x
XML:             5-10x
```

### Selection Guidelines

```plaintext
Choose gRPC when:
- Internal microservice communication
- Bidirectional streaming is required
- Latency and bandwidth sensitivity
- Multi-language service interoperability
- Strong type contracts are essential

Choose REST when:
- Public-facing Web APIs
- Direct browser invocation
- Simple CRUD operations
- Team familiarity with HTTP/JSON
- Cacheability is important

Choose GraphQL when:
- Clients need flexible querying
- Reducing over-fetching/under-fetching
- Multiple clients with different data needs
- Rapidly iterating frontend applications
```

## Protocol Buffers (protobuf)

### Basic Syntax

Protocol Buffers is a language-neutral, platform-neutral method for serializing structured data developed by Google. It is smaller, faster, and simpler than XML and JSON.

```protobuf
// user.proto
syntax = "proto3";

package user;

option go_package = "github.com/example/user";
option java_package = "com.example.user";

// User message definition
message User {
  int64 id = 1;                    // Field number, not default value
  string username = 2;
  string email = 3;
  UserStatus status = 4;
  repeated string roles = 5;        // Array type
  optional string avatar = 6;       // Optional field
  map<string, string> metadata = 7; // Map type
  google.protobuf.Timestamp created_at = 8;
}

// Enum definition
enum UserStatus {
  USER_STATUS_UNSPECIFIED = 0;  // Enums must start from 0
  USER_STATUS_ACTIVE = 1;
  USER_STATUS_INACTIVE = 2;
  USER_STATUS_BANNED = 3;
}

// Nested message
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

### Field Number Rules

```protobuf
message Example {
  // 1-15: Use 1-byte encoding, reserved for frequently used fields
  string name = 1;
  int32 age = 2;

  // 16-2047: Use 2-byte encoding
  string description = 16;

  // 19000-19999: Reserved for Protocol Buffers implementation
  // Do not use this range

  // Field numbers, once used, should never be changed or reused
  reserved 3, 4, 5;           // Reserved numbers
  reserved "old_field";       // Reserved field names
}
```

### Scalar Type Mapping

```protobuf
// Proto Type -> Language Type Mapping
message ScalarTypes {
  double double_val = 1;      // float64 / double / float
  float float_val = 2;        // float32 / float / float
  int32 int32_val = 3;        // int32 / int / int
  int64 int64_val = 4;        // int64 / long / int
  uint32 uint32_val = 5;      // uint32 / int / int
  uint64 uint64_val = 6;      // uint64 / long / int
  sint32 sint32_val = 7;      // int32 (optimized for negative numbers)
  sint64 sint64_val = 8;      // int64 (optimized for negative numbers)
  fixed32 fixed32_val = 9;    // uint32 (fixed 4 bytes)
  fixed64 fixed64_val = 10;   // uint64 (fixed 8 bytes)
  sfixed32 sfixed32_val = 11; // int32 (fixed 4 bytes)
  sfixed64 sfixed64_val = 12; // int64 (fixed 8 bytes)
  bool bool_val = 13;         // bool
  string string_val = 14;     // string (UTF-8)
  bytes bytes_val = 15;       // []byte / ByteString
}
```

### Advanced Features

```protobuf
syntax = "proto3";

import "google/protobuf/any.proto";
import "google/protobuf/timestamp.proto";
import "google/protobuf/duration.proto";
import "google/protobuf/wrappers.proto";

// oneof - Mutually exclusive fields
message NotificationTarget {
  oneof target {
    string email = 1;
    string phone = 2;
    string user_id = 3;
  }
}

// Any - Dynamic types
message DynamicMessage {
  string type = 1;
  google.protobuf.Any payload = 2;
}

// Wrapper Types - Distinguish between zero values and unset
message OptionalFields {
  google.protobuf.StringValue nullable_string = 1;
  google.protobuf.Int32Value nullable_int = 2;
  google.protobuf.BoolValue nullable_bool = 3;
}

// Time types
message TimeExample {
  google.protobuf.Timestamp created_at = 1;
  google.protobuf.Duration timeout = 2;
}
```

## Service Definition and Code Generation

### Service Definition

```protobuf
// service.proto
syntax = "proto3";

package order;

option go_package = "github.com/example/order/proto";

import "google/protobuf/empty.proto";
import "google/protobuf/timestamp.proto";

// Order service definition
service OrderService {
  // Unary RPC - Create order
  rpc CreateOrder(CreateOrderRequest) returns (Order);

  // Unary RPC - Get order
  rpc GetOrder(GetOrderRequest) returns (Order);

  // Server streaming - Get order history
  rpc GetOrderHistory(GetOrderHistoryRequest) returns (stream Order);

  // Client streaming - Batch create orders
  rpc BatchCreateOrders(stream CreateOrderRequest) returns (BatchCreateResponse);

  // Bidirectional streaming - Real-time order updates
  rpc OrderUpdates(stream OrderUpdateRequest) returns (stream OrderUpdateResponse);

  // Delete order
  rpc DeleteOrder(DeleteOrderRequest) returns (google.protobuf.Empty);
}

// Request and response messages
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
  string currency = 1;  // ISO 4217 currency code
  int64 units = 2;      // Integer part
  int32 nanos = 3;      // Fractional part (nanosecond precision)
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

### Code Generation

```bash
# Install protoc compiler
# macOS
brew install protobuf

# Ubuntu/Debian
sudo apt-get install -y protobuf-compiler

# Install language-specific plugins

# Go
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Node.js
npm install -g grpc-tools

# Python
pip install grpcio-tools

# Generate code

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

### Using Buf Tool

```yaml
# buf.yaml - Project configuration
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

# buf.gen.yaml - Code generation configuration
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
# Generate code with buf
buf generate

# Check for breaking changes
buf breaking --against '.git#branch=main'

# Lint check
buf lint
```

## Four Communication Patterns

### Unary RPC

The simplest RPC pattern where the client sends a single request and the server returns a single response.

```go
// Go server implementation
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

    // Simulate fetching order from database
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
// Go client invocation
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

### Server Streaming RPC

The client sends a single request and the server returns a stream of messages.

```go
// Server streaming implementation
func (s *orderServer) GetOrderHistory(req *pb.GetOrderHistoryRequest,
    stream pb.OrderService_GetOrderHistoryServer) error {

    log.Printf("Streaming order history for customer: %s", req.CustomerId)

    // Simulate fetching orders from database in batches
    orders := []pb.Order{
        {Id: "order-1", CustomerId: req.CustomerId, Status: pb.OrderStatus_ORDER_STATUS_DELIVERED},
        {Id: "order-2", CustomerId: req.CustomerId, Status: pb.OrderStatus_ORDER_STATUS_SHIPPED},
        {Id: "order-3", CustomerId: req.CustomerId, Status: pb.OrderStatus_ORDER_STATUS_PROCESSING},
    }

    for _, order := range orders {
        // Check if client has cancelled
        if err := stream.Context().Err(); err != nil {
            return err
        }

        if err := stream.Send(&order); err != nil {
            return err
        }

        // Simulate processing delay
        time.Sleep(500 * time.Millisecond)
    }

    return nil
}

// Client receiving stream
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

### Client Streaming RPC

The client sends a stream of messages and the server returns a single response.

```go
// Server receiving stream
func (s *orderServer) BatchCreateOrders(
    stream pb.OrderService_BatchCreateOrdersServer) error {

    var orders []*pb.Order
    var successCount, failureCount int32

    for {
        req, err := stream.Recv()
        if err == io.EOF {
            // Client finished sending, return response
            return stream.SendAndClose(&pb.BatchCreateResponse{
                Orders:       orders,
                SuccessCount: successCount,
                FailureCount: failureCount,
            })
        }
        if err != nil {
            return err
        }

        // Process each order creation request
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

// Client sending stream
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

### Bidirectional Streaming RPC

Both client and server send streams of messages simultaneously, reading and writing independently.

```go
// Server bidirectional streaming implementation
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

        // Process update request
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

// Client bidirectional streaming
func orderUpdates(client pb.OrderServiceClient) error {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    stream, err := client.OrderUpdates(ctx)
    if err != nil {
        return err
    }

    // Start goroutine to receive responses
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

    // Send update requests
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

## Error Handling and Status Codes

### gRPC Status Codes

```go
import (
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

// gRPC standard status codes
const (
    codes.OK                 = 0   // Success
    codes.Cancelled          = 1   // Operation cancelled
    codes.Unknown            = 2   // Unknown error
    codes.InvalidArgument    = 3   // Invalid argument
    codes.DeadlineExceeded   = 4   // Timeout
    codes.NotFound           = 5   // Resource not found
    codes.AlreadyExists      = 6   // Resource already exists
    codes.PermissionDenied   = 7   // Permission denied
    codes.ResourceExhausted  = 8   // Resource exhausted (rate limiting)
    codes.FailedPrecondition = 9   // Precondition failed
    codes.Aborted            = 10  // Operation aborted
    codes.OutOfRange         = 11  // Out of range
    codes.Unimplemented      = 12  // Not implemented
    codes.Internal           = 13  // Internal error
    codes.Unavailable        = 14  // Service unavailable
    codes.DataLoss           = 15  // Data loss
    codes.Unauthenticated    = 16  // Not authenticated
)
```

### Error Handling Implementation

```go
// Server-side error handling
import (
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
    "google.golang.org/genproto/googleapis/rpc/errdetails"
)

func (s *orderServer) GetOrder(ctx context.Context, req *pb.GetOrderRequest) (*pb.Order, error) {
    // Parameter validation
    if req.OrderId == "" {
        return nil, status.Error(codes.InvalidArgument, "order_id is required")
    }

    // Find order
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

// Error with detailed information
func (s *orderServer) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.Order, error) {
    // Validate request
    violations := validateCreateOrderRequest(req)
    if len(violations) > 0 {
        st := status.New(codes.InvalidArgument, "invalid request")

        // Add field violation details
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

    // Create order...
    return order, nil
}

// Retry information
func (s *orderServer) ProcessPayment(ctx context.Context, req *pb.PaymentRequest) (*pb.PaymentResponse, error) {
    if s.isOverloaded() {
        st := status.New(codes.ResourceExhausted, "service overloaded")

        // Add retry information
        ri := &errdetails.RetryInfo{
            RetryDelay: durationpb.New(5 * time.Second),
        }
        st, _ = st.WithDetails(ri)

        return nil, st.Err()
    }
    // Process payment...
}
```

```go
// Client-side error handling
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

    // Handle specific error codes
    switch st.Code() {
    case codes.NotFound:
        log.Println("Resource not found")
    case codes.InvalidArgument:
        // Extract detailed information
        for _, detail := range st.Details() {
            switch t := detail.(type) {
            case *errdetails.BadRequest:
                for _, v := range t.GetFieldViolations() {
                    log.Printf("Field %s: %s", v.GetField(), v.GetDescription())
                }
            }
        }
    case codes.ResourceExhausted:
        // Extract retry information
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

### HTTP Status Code Mapping

```plaintext
gRPC Code              HTTP Status    Description
-------------------------------------------------------
OK                     200            Success
Cancelled              499            Client Closed Request
Unknown                500            Internal Server Error
InvalidArgument        400            Bad Request
DeadlineExceeded       504            Gateway Timeout
NotFound               404            Not Found
AlreadyExists          409            Conflict
PermissionDenied       403            Forbidden
ResourceExhausted      429            Too Many Requests
FailedPrecondition     400            Bad Request
Aborted                409            Conflict
OutOfRange             400            Bad Request
Unimplemented          501            Not Implemented
Internal               500            Internal Server Error
Unavailable            503            Service Unavailable
DataLoss               500            Internal Server Error
Unauthenticated        401            Unauthorized
```

## Authentication and Security

### TLS Encryption

```go
// Server TLS configuration
import (
    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials"
)

func createTLSServer() (*grpc.Server, error) {
    // Load certificates
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

// Mutual TLS (mTLS)
func createMTLSServer() (*grpc.Server, error) {
    cert, err := tls.LoadX509KeyPair("server.crt", "server.key")
    if err != nil {
        return nil, err
    }

    // Load CA certificate for client verification
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

// Client TLS
func createTLSClient() (*grpc.ClientConn, error) {
    creds, err := credentials.NewClientTLSFromFile(
        "server.crt",
        "server.example.com", // Server name
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

### Token Authentication

```go
// Custom credentials
type tokenAuth struct {
    token string
}

func (t tokenAuth) GetRequestMetadata(ctx context.Context, uri ...string) (map[string]string, error) {
    return map[string]string{
        "authorization": "Bearer " + t.token,
    }, nil
}

func (t tokenAuth) RequireTransportSecurity() bool {
    return true // Require TLS
}

// Client using Token
func createAuthenticatedClient(token string) (*grpc.ClientConn, error) {
    creds, _ := credentials.NewClientTLSFromFile("server.crt", "")

    conn, err := grpc.Dial(
        "localhost:50051",
        grpc.WithTransportCredentials(creds),
        grpc.WithPerRPCCredentials(tokenAuth{token: token}),
    )
    return conn, err
}

// Server token validation - using interceptor
func authInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    // Skip methods that don't require authentication
    if info.FullMethod == "/health.HealthService/Check" {
        return handler(ctx, req)
    }

    // Get token from metadata
    md, ok := metadata.FromIncomingContext(ctx)
    if !ok {
        return nil, status.Error(codes.Unauthenticated, "missing metadata")
    }

    values := md.Get("authorization")
    if len(values) == 0 {
        return nil, status.Error(codes.Unauthenticated, "missing authorization header")
    }

    token := strings.TrimPrefix(values[0], "Bearer ")

    // Validate token
    claims, err := validateToken(token)
    if err != nil {
        return nil, status.Error(codes.Unauthenticated, "invalid token")
    }

    // Add user information to context
    ctx = context.WithValue(ctx, "user_id", claims.UserID)
    ctx = context.WithValue(ctx, "roles", claims.Roles)

    return handler(ctx, req)
}

// Register interceptor
func main() {
    s := grpc.NewServer(
        grpc.UnaryInterceptor(authInterceptor),
        grpc.StreamInterceptor(streamAuthInterceptor),
    )
    // ...
}
```

### API Key Authentication

```go
// Using Metadata to pass API Key
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

## Load Balancing and Service Discovery

### Client-Side Load Balancing

```go
import (
    "google.golang.org/grpc"
    "google.golang.org/grpc/resolver"
    _ "google.golang.org/grpc/balancer/roundrobin"
)

// Using DNS resolution and round-robin load balancing
func createLoadBalancedClient() (*grpc.ClientConn, error) {
    conn, err := grpc.Dial(
        "dns:///my-service.example.com:50051",
        grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    return conn, err
}

// Custom service discovery Resolver
type consulResolver struct {
    cc           resolver.ClientConn
    consulAddr   string
    serviceName  string
    ctx          context.Context
    cancel       context.CancelFunc
}

func (r *consulResolver) ResolveNow(opts resolver.ResolveNowOptions) {
    // Get service instances from Consul
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

// Register Resolver Builder
func init() {
    resolver.Register(&consulResolverBuilder{})
}

// Using custom Resolver
func createConsulClient() (*grpc.ClientConn, error) {
    conn, err := grpc.Dial(
        "consul://localhost:8500/order-service",
        grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    return conn, err
}
```

### Service Health Checking

```protobuf
// health.proto - Standard health check protocol
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
// Server health check
import (
    "google.golang.org/grpc/health"
    healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func main() {
    s := grpc.NewServer()

    // Register health check service
    healthServer := health.NewServer()
    healthpb.RegisterHealthServer(s, healthServer)

    // Set service status
    healthServer.SetServingStatus("order.OrderService", healthpb.HealthCheckResponse_SERVING)

    // Business service
    pb.RegisterOrderServiceServer(s, &orderServer{})

    // Start server...
}

// Client health check
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

### Connection Management

```go
// Connection pool and retry configuration
func createRobustClient() (*grpc.ClientConn, error) {
    // Service configuration JSON
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
            Time:                10 * time.Second, // Interval for keepalive ping
            Timeout:             3 * time.Second,  // Timeout for ping ack
            PermitWithoutStream: true,             // Allow ping without active streams
        }),
    )
    return conn, err
}
```

## gRPC-Web and Browser Support

### gRPC-Web Overview

Since browsers do not support HTTP/2 trailers (a feature gRPC depends on), the gRPC-Web protocol is required. gRPC-Web needs a proxy layer to translate gRPC-Web requests into standard gRPC requests.

### Envoy Proxy Configuration

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

### TypeScript Client

```typescript
// Generate TypeScript code using protoc
// protoc --grpc-web_out=import_style=typescript,mode=grpcwebtext:./src/proto service.proto

import { OrderServiceClient } from './proto/ServiceServiceClientPb';
import {
  GetOrderRequest,
  CreateOrderRequest,
  Order
} from './proto/service_pb';

// Create client
const client = new OrderServiceClient('http://localhost:8080', null, null);

// Unary call
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

// Server streaming
function getOrderHistory(customerId: string): void {
  const request = new GetOrderHistoryRequest();
  request.setCustomerId(customerId);
  request.setPageSize(10);

  const stream = client.getOrderHistory(request, {
    'authorization': `Bearer ${getToken()}`
  });

  stream.on('data', (order: Order) => {
    console.log('Received order:', order.toObject());
    // Update UI
    appendOrderToList(order);
  });

  stream.on('error', (err) => {
    console.error('Stream error:', err);
  });

  stream.on('end', () => {
    console.log('Stream ended');
  });
}

// Using async/await style (requires wrapper)
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

### React Integration Example

```tsx
// useGrpcQuery.ts - Custom Hook
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

## Best Practices

### Proto File Organization

```plaintext
proto/
├── buf.yaml
├── buf.gen.yaml
├── common/
│   ├── money.proto        # Common currency type
│   ├── pagination.proto   # Pagination parameters
│   └── timestamp.proto    # Timestamp extensions
├── order/
│   └── v1/
│       ├── order.proto    # Order domain model
│       └── service.proto  # Order service definition
├── user/
│   └── v1/
│       ├── user.proto
│       └── service.proto
└── inventory/
    └── v1/
        ├── inventory.proto
        └── service.proto
```

### API Versioning

```protobuf
// Version control using package names
syntax = "proto3";

package order.v1;

option go_package = "github.com/example/api/order/v1;orderv1";

// v1 version of service
service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (Order);
}

// When breaking changes are needed, create new version
// order/v2/service.proto
package order.v2;

service OrderService {
  // v2 version can have different API signatures
  rpc CreateOrder(CreateOrderRequestV2) returns (OrderV2);
}
```

### Timeout and Deadline Management

```go
// Server timeout propagation
func (s *orderServer) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.Order, error) {
    // Check if context has timed out
    if ctx.Err() != nil {
        return nil, status.FromContextError(ctx.Err()).Err()
    }

    // Get remaining time
    deadline, ok := ctx.Deadline()
    if ok {
        remaining := time.Until(deadline)
        log.Printf("Remaining time: %v", remaining)

        // Allocate reasonable timeout for downstream calls
        childCtx, cancel := context.WithTimeout(ctx, remaining/2)
        defer cancel()

        // Call downstream service
        _, err := s.inventoryClient.ReserveStock(childCtx, &inventorypb.ReserveRequest{})
        if err != nil {
            return nil, err
        }
    }

    // Process order creation...
    return &pb.Order{}, nil
}

// Client setting timeout
func createOrderWithTimeout(client pb.OrderServiceClient) error {
    // Method 1: context.WithTimeout
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    _, err := client.CreateOrder(ctx, &pb.CreateOrderRequest{})
    return err
}
```

### Interceptor Chain

```go
// Multiple interceptor combination
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
            grpc_prometheus.UnaryServerInterceptor,                    // Metrics collection
            grpc_zap.UnaryServerInterceptor(logger),                   // Logging
            grpc_recovery.UnaryServerInterceptor(),                    // Panic recovery
            authInterceptor,                                           // Authentication
            rateLimitInterceptor,                                      // Rate limiting
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

// Custom logging interceptor
func loggingInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    start := time.Now()

    // Call actual handler
    resp, err := handler(ctx, req)

    // Log request information
    duration := time.Since(start)
    code := status.Code(err)

    log.Printf("method=%s duration=%v code=%s",
        info.FullMethod, duration, code)

    return resp, err
}
```

### Graceful Shutdown

```go
func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }

    s := grpc.NewServer()
    pb.RegisterOrderServiceServer(s, &orderServer{})

    // Start server
    go func() {
        if err := s.Serve(lis); err != nil {
            log.Fatalf("failed to serve: %v", err)
        }
    }()

    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Shutting down server...")

    // Graceful shutdown: stop accepting new connections, wait for existing requests
    s.GracefulStop()

    log.Println("Server stopped")
}
```

### Testing Strategy

```go
// Unit testing with mocks
import (
    "testing"
    "github.com/golang/mock/gomock"
)

func TestCreateOrder(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()

    // Create mock dependencies
    mockInventory := mock_inventory.NewMockInventoryServiceClient(ctrl)
    mockInventory.EXPECT().
        ReserveStock(gomock.Any(), gomock.Any()).
        Return(&inventorypb.ReserveResponse{Success: true}, nil)

    // Create service instance
    server := &orderServer{
        inventoryClient: mockInventory,
    }

    // Test
    resp, err := server.CreateOrder(context.Background(), &pb.CreateOrderRequest{
        CustomerId: "c1",
    })

    assert.NoError(t, err)
    assert.NotNil(t, resp)
}

// Integration testing with bufconn
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

## Interview Key Points

### Core Concept Questions

**Q1: What are the main differences between gRPC and REST? When should you choose gRPC?**

```plaintext
A: Main differences:
1. Protocol: gRPC uses HTTP/2, REST typically uses HTTP/1.1
2. Data format: gRPC uses Protocol Buffers (binary), REST uses JSON (text)
3. Type safety: gRPC is strongly typed, REST is weakly typed
4. Communication patterns: gRPC supports streaming, REST is request-response
5. Code generation: gRPC automatically generates client code

Choose gRPC when:
- Internal microservice communication
- Bidirectional streaming required (real-time communication)
- High performance requirements (low latency, high throughput)
- Multi-language service interoperability
- Strong type contracts needed for interface consistency
```

**Q2: Explain the advantages of Protocol Buffers and the purpose of field numbers**

```plaintext
A: Protocol Buffers advantages:
1. Compact size: Binary encoding is 3-10x smaller than JSON
2. Fast: Serialization/deserialization is 3-5x faster
3. Strong typing: Compile-time type checking
4. Backward compatible: Achieved through field numbers

Purpose of field numbers:
- Uniquely identify each field
- 1-15 use single-byte encoding (for frequently used fields)
- 16-2047 use two-byte encoding
- Once used, field numbers should never be changed or reused
- Support adding new fields without breaking compatibility
- Use 'reserved' to mark deleted field numbers
```

**Q3: What are the four gRPC communication patterns and their use cases?**

```plaintext
A:
1. Unary RPC:
   - Use case: Simple request-response, like fetching a single resource
   - Examples: GetUser, CreateOrder

2. Server Streaming:
   - Use case: Server needs to return large amounts of data or continuous pushes
   - Examples: File downloads, real-time stock quotes, log streams

3. Client Streaming:
   - Use case: Client needs to upload large amounts of data
   - Examples: File uploads, batch data imports

4. Bidirectional Streaming:
   - Use case: Real-time bidirectional communication
   - Examples: Chat applications, online gaming, real-time collaborative editing
```

### Practical Questions

**Q4: How do you implement authentication and authorization in gRPC services?**

```go
// Key points:
// 1. TLS/mTLS for transport layer security
// 2. Token (JWT) for identity authentication
// 3. Implementation using interceptors

func authInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    // 1. Get token from metadata
    md, ok := metadata.FromIncomingContext(ctx)
    if !ok {
        return nil, status.Error(codes.Unauthenticated, "missing metadata")
    }

    // 2. Validate token
    token := md.Get("authorization")[0]
    claims, err := validateToken(token)
    if err != nil {
        return nil, status.Error(codes.Unauthenticated, "invalid token")
    }

    // 3. Check permissions (authorization)
    if !hasPermission(claims.Roles, info.FullMethod) {
        return nil, status.Error(codes.PermissionDenied, "insufficient permissions")
    }

    // 4. Pass user information
    ctx = context.WithValue(ctx, "user", claims)
    return handler(ctx, req)
}
```

**Q5: How does gRPC handle errors? How do you return detailed error information?**

```go
// Key points:
// 1. Use status package to create errors with status codes
// 2. Use errdetails to add detailed information

func (s *server) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.Order, error) {
    // Return detailed error on validation failure
    if req.CustomerId == "" {
        st := status.New(codes.InvalidArgument, "validation failed")
        st, _ = st.WithDetails(&errdetails.BadRequest{
            FieldViolations: []*errdetails.BadRequest_FieldViolation{
                {Field: "customer_id", Description: "cannot be empty"},
            },
        })
        return nil, st.Err()
    }

    // Resource not found
    if customer == nil {
        return nil, status.Errorf(codes.NotFound, "customer %s not found", req.CustomerId)
    }

    // Internal error (don't expose sensitive information)
    if err := db.Save(order); err != nil {
        log.Printf("Database error: %v", err) // Log detailed error
        return nil, status.Error(codes.Internal, "failed to save order")
    }

    return order, nil
}
```

**Q6: How do you implement load balancing and service discovery in gRPC?**

```plaintext
A: gRPC supports two load balancing modes:

1. Proxy Mode (Server-side load balancing):
   - Use Nginx, Envoy, HAProxy, etc.
   - Clients only connect to proxy, proxy distributes requests
   - Pros: Simple client, centralized management
   - Cons: Added latency, single point of failure

2. Client-side Load Balancing:
   - Clients connect directly to multiple servers
   - Use DNS or service discovery to get instance list
   - Built-in strategies: pick_first, round_robin
   - Pros: Lower latency, no single point
   - Cons: Increased client complexity

Service Discovery implementation:
- DNS-based: Use dns:/// scheme
- Custom Resolver: Integrate with Consul, etcd, Kubernetes
- Combined with Health Check for dynamic instance list updates
```

### Architecture Design Questions

**Q7: Design a highly available gRPC microservice architecture**

```plaintext
A: Key components:

1. Service Registration and Discovery:
   - Services register with Consul/etcd on startup
   - Clients get instance list through service discovery
   - Health checks automatically remove failed instances

2. Load Balancing:
   - Client-side load balancing (round_robin)
   - Or use Envoy service mesh

3. Circuit Breaking and Rate Limiting:
   - Client-side circuit breaker (e.g., hystrix)
   - Server-side rate limiting interceptor
   - Fallback strategies

4. Timeout and Retry:
   - Set reasonable deadlines
   - Configure retry policies (for idempotent operations only)
   - Propagate deadlines to downstream services

5. Observability:
   - Distributed tracing (Jaeger, Zipkin)
   - Metrics collection (Prometheus)
   - Structured logging

6. Security:
   - mTLS for inter-service communication
   - JWT authentication
   - RBAC authorization
```

**Q8: How do you handle scenarios where gRPC and REST clients coexist?**

```plaintext
A: Solutions:

1. gRPC-Gateway:
   - Automatically converts REST requests to gRPC
   - Define HTTP mappings through proto annotations
   - Unified API definition using proto

2. Architecture Design:
   ┌─────────────┐    ┌─────────────┐
   │  Web Client │    │  Mobile/Microservices │
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

3. Implementation Example (proto annotations):
   service OrderService {
     rpc GetOrder(GetOrderRequest) returns (Order) {
       option (google.api.http) = {
         get: "/v1/orders/{order_id}"
       };
     }
   }
```

## Further Reading

### Official Documentation

- [gRPC Official Documentation](https://grpc.io/docs/) - Comprehensive guides and tutorials
- [Protocol Buffers Documentation](https://developers.google.com/protocol-buffers) - Complete protobuf reference
- [gRPC-Web GitHub](https://github.com/grpc/grpc-web) - Browser support for gRPC

### Tools and Libraries

- [Buf](https://buf.build/) - Modern Protocol Buffer tooling
- [grpc-ecosystem](https://github.com/grpc-ecosystem) - Community-maintained gRPC middleware
- [grpcurl](https://github.com/fullstorydev/grpcurl) - Command-line tool for interacting with gRPC servers
- [Evans](https://github.com/ktr0731/evans) - More expressive universal gRPC client
- [BloomRPC](https://github.com/bloomrpc/bloomrpc) - GUI Client for gRPC services

### Books and Courses

- "gRPC: Up and Running" by Kasun Indrasiri and Danesh Kuruppu
- "Microservices with gRPC" - Various online courses on Udemy and Pluralsight

### Related Technologies

- [Envoy Proxy](https://www.envoyproxy.io/) - High-performance proxy for service mesh
- [Istio](https://istio.io/) - Service mesh platform with gRPC support
- [Connect](https://connect.build/) - Simpler gRPC alternative from Buf

## Summary

gRPC is a powerful tool for building high-performance microservice architectures. Master these core concepts:

1. **Protocol Buffers**: Understand proto syntax, field numbers, and type system
2. **Four Communication Patterns**: Choose the appropriate pattern based on requirements
3. **Error Handling**: Use status codes and error details correctly
4. **Authentication Security**: TLS, Token, Interceptors
5. **Load Balancing**: Client vs Proxy mode
6. **Observability**: Logging, metrics, tracing
7. **Best Practices**: Version control, timeouts, graceful shutdown, testing

gRPC is particularly well-suited for internal microservice communication, performance-sensitive systems, and multi-language environments requiring strong type contracts. When designing systems, choose the appropriate communication protocol based on actual requirements - gRPC and REST can coexist and complement each other.
