---
title: Scala 后端开发
description: 使用 Scala 和 Akka/Play 构建高并发应用
track: backend
section: http-apis
difficulty: advanced
tags:
  - Scala
  - Akka
  - Play
  - functional programming
status: imported
origin: old/src/content/docs/backend/scala-backend.zh.md
divergence: 0.204
issues: []
legacy:
  category: Backend
  subcategory: Languages
  order: 28
  lastUpdated: 2026-01-07
---

## 什么是 Scala？

Scala 是一种强大的、静态类型的编程语言，无缝结合了面向对象和函数式编程范式。运行在 Java 虚拟机（JVM）上，Scala 提供与 Java 的完全互操作性，同时提供模式匹配、高阶函数和复杂类型系统等高级特性。

### 为什么选择 Scala 进行后端开发？

Scala 已成为构建可扩展后端系统的流行选择，特别是在高性能和数据密集型应用中：

- **并发性**：通过 Akka actors 和 Futures 原生支持并发编程
- **类型安全**：高级类型系统在编译时捕获错误
- **表达力**：简洁的语法减少样板代码
- **JVM 生态系统**：完全访问 Java 库和工具
- **函数式编程**：一流地支持不可变性和纯函数
- **可扩展性**：专为构建分布式、容错系统而设计

### Scala vs Java

```
Java:
- 冗长的语法
- 面向对象为主
- null 引用常见
- 检查型异常
- 默认可变

Scala:
- 简洁、富有表现力的语法
- 多范式（面向对象 + 函数式）
- Option 类型用于空值安全
- 无检查型异常
- 默认不可变（推荐）
```

## 入门

### 设置 Scala 项目

创建 Scala 项目最常见的方式是使用 sbt（Scala 构建工具）：

```bash
# 安装 sbt（macOS）
brew install sbt

# 安装 sbt（Linux）
echo "deb https://repo.scala-sbt.org/scalasbt/debian all main" | sudo tee /etc/apt/sources.list.d/sbt.list
curl -sL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x99E82A75642AC823" | sudo apt-key add
sudo apt-get update
sudo apt-get install sbt

# 创建新项目
sbt new scala/scala3.g8
```

### 项目结构

典型的 Scala 项目遵循以下结构：

```
my-project/
├── build.sbt
├── project/
│   ├── build.properties
│   └── plugins.sbt
├── src/
│   ├── main/
│   │   ├── scala/
│   │   │   └── com/example/
│   │   │       ├── Main.scala
│   │   │       ├── models/
│   │   │       ├── services/
│   │   │       ├── repositories/
│   │   │       └── controllers/
│   │   └── resources/
│   │       └── application.conf
│   └── test/
│       └── scala/
│           └── com/example/
└── README.md
```

### 构建配置（build.sbt）

```scala
ThisBuild / version := "0.1.0-SNAPSHOT"
ThisBuild / scalaVersion := "3.3.1"
ThisBuild / organization := "com.example"

lazy val root = (project in file("."))
  .settings(
    name := "my-scala-app",
    libraryDependencies ++= Seq(
      // 核心
      "com.typesafe" % "config" % "1.4.3",

      // JSON
      "io.circe" %% "circe-core" % "0.14.6",
      "io.circe" %% "circe-generic" % "0.14.6",
      "io.circe" %% "circe-parser" % "0.14.6",

      // HTTP
      "org.http4s" %% "http4s-ember-server" % "0.23.24",
      "org.http4s" %% "http4s-circe" % "0.23.24",
      "org.http4s" %% "http4s-dsl" % "0.23.24",

      // 数据库
      "org.tpolecat" %% "doobie-core" % "1.0.0-RC4",
      "org.tpolecat" %% "doobie-postgres" % "1.0.0-RC4",
      "org.tpolecat" %% "doobie-hikari" % "1.0.0-RC4",

      // 测试
      "org.scalatest" %% "scalatest" % "3.2.17" % Test,
      "org.scalatestplus" %% "mockito-4-11" % "3.2.17.0" % Test
    )
  )
```

## Scala 基础

### 变量和类型

```scala
// 不可变值（推荐）
val name: String = "John"
val age: Int = 30
val pi: Double = 3.14159

// 可变变量（谨慎使用）
var counter: Int = 0
counter += 1

// 类型推断
val message = "Hello, World!"  // 推断为 String
val numbers = List(1, 2, 3)    // 推断为 List[Int]

// 常见类型
val boolean: Boolean = true
val char: Char = 'A'
val long: Long = 1234567890L
val float: Float = 3.14f
val bigDecimal: BigDecimal = BigDecimal("999999999999.99")

// 集合
val list: List[Int] = List(1, 2, 3)
val set: Set[String] = Set("a", "b", "c")
val map: Map[String, Int] = Map("one" -> 1, "two" -> 2)
val vector: Vector[Double] = Vector(1.0, 2.0, 3.0)
```

### 函数

```scala
// 基本函数
def add(a: Int, b: Int): Int = a + b

// 多行函数
def greet(name: String): String = {
  val greeting = s"Hello, $name!"
  greeting.toUpperCase
}

// 默认参数
def createUser(name: String, role: String = "user"): User =
  User(name, role)

// 命名参数
createUser(name = "Alice", role = "admin")

// 可变参数
def sum(numbers: Int*): Int = numbers.sum

// 高阶函数
def applyTwice(f: Int => Int, x: Int): Int = f(f(x))
val double: Int => Int = x => x * 2
applyTwice(double, 5)  // 20

// 匿名函数（lambda）
val numbers = List(1, 2, 3, 4, 5)
numbers.map(x => x * 2)        // List(2, 4, 6, 8, 10)
numbers.map(_ * 2)             // 使用占位符语法
numbers.filter(_ > 2)          // List(3, 4, 5)
numbers.reduce(_ + _)          // 15

// 柯里化
def multiply(a: Int)(b: Int): Int = a * b
val double = multiply(2)_      // 部分应用函数
double(5)                      // 10
```

### 类和对象

```scala
// Case class（不可变数据容器）
case class User(
  id: Long,
  name: String,
  email: String,
  role: Role = Role.User
)

// 枚举（Scala 3）
enum Role:
  case Admin, User, Guest

// 带方法的普通类
class UserService(repository: UserRepository):
  def findById(id: Long): Option[User] =
    repository.findById(id)

  def create(name: String, email: String): User =
    val user = User(generateId(), name, email)
    repository.save(user)
    user

// 伴生对象（单例）
object UserService:
  def apply(repository: UserRepository): UserService =
    new UserService(repository)

  private def generateId(): Long =
    System.currentTimeMillis()

// Trait（带实现的接口）
trait Identifiable:
  def id: Long
  def idString: String = s"ID-$id"

trait Auditable:
  def createdAt: java.time.Instant
  def updatedAt: java.time.Instant

// 使用 trait 的多重继承
case class Document(
  id: Long,
  title: String,
  createdAt: java.time.Instant,
  updatedAt: java.time.Instant
) extends Identifiable with Auditable
```

### 模式匹配

```scala
// 基本模式匹配
def describe(x: Any): String = x match
  case 0 => "零"
  case n: Int if n > 0 => s"正整数: $n"
  case n: Int => s"负整数: $n"
  case s: String => s"字符串: $s"
  case _ => "其他"

// Case class 模式匹配
def processUser(user: User): String = user match
  case User(_, name, _, Role.Admin) => s"管理员用户: $name"
  case User(id, name, email, _) if email.endsWith("@company.com") =>
    s"内部用户: $name (ID: $id)"
  case User(_, name, _, _) => s"普通用户: $name"

// Option 模式匹配
def greetUser(maybeUser: Option[User]): String = maybeUser match
  case Some(user) => s"你好, ${user.name}!"
  case None => "你好, 访客!"

// List 模式匹配
def describeList(list: List[Int]): String = list match
  case Nil => "空列表"
  case head :: Nil => s"单个元素: $head"
  case head :: tail => s"头部: $head, 尾部有 ${tail.length} 个元素"

// 密封 trait 用于穷尽匹配
sealed trait PaymentMethod
case class CreditCard(number: String, expiry: String) extends PaymentMethod
case class PayPal(email: String) extends PaymentMethod
case class BankTransfer(iban: String) extends PaymentMethod

def processPayment(method: PaymentMethod): String = method match
  case CreditCard(number, _) => s"信用卡扣款，卡号末四位 ${number.takeRight(4)}"
  case PayPal(email) => s"跳转到 PayPal 支付 $email"
  case BankTransfer(iban) => s"银行转账到 $iban"
  // 如果缺少 case，编译器会警告
```

### Option、Either 和 Try

```scala
import scala.util.{Try, Success, Failure}

// Option - 表示可选值
def findUser(id: Long): Option[User] =
  if id > 0 then Some(User(id, "John", "john@example.com"))
  else None

// 使用 Option
val user = findUser(1)
val name = user.map(_.name).getOrElse("未知")
val greeting = user.fold("无用户")(u => s"你好, ${u.name}")

// Option 链式操作
def findUserWithOrders(id: Long): Option[UserWithOrders] =
  for
    user <- findUser(id)
    orders <- findOrders(user.id)
  yield UserWithOrders(user, orders)

// Either - 表示成功或失败
def validateEmail(email: String): Either[String, String] =
  if email.contains("@") then Right(email)
  else Left("无效的邮箱格式")

def validateAge(age: Int): Either[String, Int] =
  if age >= 18 then Right(age)
  else Left("必须年满 18 岁")

// Either 链式操作
def validateUser(email: String, age: Int): Either[String, ValidatedUser] =
  for
    validEmail <- validateEmail(email)
    validAge <- validateAge(age)
  yield ValidatedUser(validEmail, validAge)

// Try - 用于异常处理
def parseJson(json: String): Try[User] = Try {
  // 可能抛出异常的解析逻辑
  Json.parse(json).as[User]
}

val result = parseJson(jsonString) match
  case Success(user) => s"解析用户: ${user.name}"
  case Failure(ex) => s"解析失败: ${ex.getMessage}"

// 类型转换
val optionFromTry: Option[User] = parseJson(json).toOption
val eitherFromTry: Either[Throwable, User] = parseJson(json).toEither
```

## Play 框架

Play 是一个用于 Scala 和 Java 的高速 Web 框架，专为构建可扩展的 Web 应用程序而设计，注重开发者生产力。

### 设置 Play

```scala
// build.sbt
name := "play-app"
version := "1.0-SNAPSHOT"

lazy val root = (project in file("."))
  .enablePlugins(PlayScala)

scalaVersion := "3.3.1"

libraryDependencies ++= Seq(
  guice,
  "org.scalatestplus.play" %% "scalatestplus-play" % "7.0.0" % Test,
  "org.playframework" %% "play-slick" % "6.1.0",
  "org.postgresql" % "postgresql" % "42.7.1"
)
```

### 控制器

```scala
package controllers

import javax.inject._
import play.api.mvc._
import play.api.libs.json._
import scala.concurrent.{ExecutionContext, Future}
import services.UserService
import models.{User, CreateUserRequest}

@Singleton
class UserController @Inject()(
  val controllerComponents: ControllerComponents,
  userService: UserService
)(implicit ec: ExecutionContext) extends BaseController:

  // GET /users
  def list(): Action[AnyContent] = Action.async {
    userService.findAll().map { users =>
      Ok(Json.toJson(users))
    }
  }

  // GET /users/:id
  def get(id: Long): Action[AnyContent] = Action.async {
    userService.findById(id).map {
      case Some(user) => Ok(Json.toJson(user))
      case None => NotFound(Json.obj("error" -> "用户未找到"))
    }
  }

  // POST /users
  def create(): Action[JsValue] = Action.async(parse.json) { request =>
    request.body.validate[CreateUserRequest] match
      case JsSuccess(createRequest, _) =>
        userService.create(createRequest).map { user =>
          Created(Json.toJson(user))
        }.recover {
          case e: DuplicateEmailException =>
            Conflict(Json.obj("error" -> e.getMessage))
        }
      case JsError(errors) =>
        Future.successful(BadRequest(Json.obj(
          "error" -> "无效请求",
          "details" -> JsError.toJson(errors)
        )))
  }

  // PUT /users/:id
  def update(id: Long): Action[JsValue] = Action.async(parse.json) { request =>
    request.body.validate[UpdateUserRequest] match
      case JsSuccess(updateRequest, _) =>
        userService.update(id, updateRequest).map {
          case Some(user) => Ok(Json.toJson(user))
          case None => NotFound(Json.obj("error" -> "用户未找到"))
        }
      case JsError(errors) =>
        Future.successful(BadRequest(Json.obj("error" -> "无效请求")))
  }

  // DELETE /users/:id
  def delete(id: Long): Action[AnyContent] = Action.async {
    userService.delete(id).map { deleted =>
      if deleted then NoContent
      else NotFound(Json.obj("error" -> "用户未找到"))
    }
  }
```

### 路由配置

```
# conf/routes

# 用户端点
GET     /users              controllers.UserController.list()
GET     /users/:id          controllers.UserController.get(id: Long)
POST    /users              controllers.UserController.create()
PUT     /users/:id          controllers.UserController.update(id: Long)
DELETE  /users/:id          controllers.UserController.delete(id: Long)

# 健康检查
GET     /health             controllers.HealthController.check()

# 静态文件
GET     /assets/*file       controllers.Assets.versioned(path="/public", file: Asset)
```

### 模型和 JSON

```scala
package models

import play.api.libs.json._
import java.time.Instant

case class User(
  id: Long,
  name: String,
  email: String,
  role: String,
  createdAt: Instant,
  updatedAt: Instant
)

object User:
  given Format[User] = Json.format[User]

case class CreateUserRequest(
  name: String,
  email: String,
  password: String,
  role: Option[String]
)

object CreateUserRequest:
  given Reads[CreateUserRequest] = Json.reads[CreateUserRequest]

case class UpdateUserRequest(
  name: Option[String],
  email: Option[String]
)

object UpdateUserRequest:
  given Reads[UpdateUserRequest] = Json.reads[UpdateUserRequest]

// 自定义 JSON 序列化
case class ApiResponse[T](
  success: Boolean,
  data: Option[T],
  error: Option[String]
)

object ApiResponse:
  def success[T](data: T): ApiResponse[T] =
    ApiResponse(true, Some(data), None)

  def error[T](message: String): ApiResponse[T] =
    ApiResponse(false, None, Some(message))

  given [T: Writes]: Writes[ApiResponse[T]] = Json.writes[ApiResponse[T]]
```

### 服务

```scala
package services

import javax.inject._
import scala.concurrent.{ExecutionContext, Future}
import models._
import repositories.UserRepository

@Singleton
class UserService @Inject()(
  userRepository: UserRepository
)(implicit ec: ExecutionContext):

  def findAll(): Future[Seq[User]] =
    userRepository.findAll()

  def findById(id: Long): Future[Option[User]] =
    userRepository.findById(id)

  def create(request: CreateUserRequest): Future[User] =
    for
      _ <- validateEmailUnique(request.email)
      hashedPassword = hashPassword(request.password)
      user <- userRepository.create(
        request.name,
        request.email,
        hashedPassword,
        request.role.getOrElse("user")
      )
    yield user

  def update(id: Long, request: UpdateUserRequest): Future[Option[User]] =
    userRepository.findById(id).flatMap {
      case Some(existing) =>
        val updated = existing.copy(
          name = request.name.getOrElse(existing.name),
          email = request.email.getOrElse(existing.email)
        )
        userRepository.update(updated).map(Some(_))
      case None =>
        Future.successful(None)
    }

  def delete(id: Long): Future[Boolean] =
    userRepository.delete(id)

  private def validateEmailUnique(email: String): Future[Unit] =
    userRepository.findByEmail(email).flatMap {
      case Some(_) => Future.failed(DuplicateEmailException(email))
      case None => Future.successful(())
    }

  private def hashPassword(password: String): String =
    // 生产环境使用 BCrypt
    java.util.Base64.getEncoder.encodeToString(password.getBytes)
```

### Action 组合

```scala
package actions

import javax.inject._
import play.api.mvc._
import scala.concurrent.{ExecutionContext, Future}
import services.AuthService

class AuthenticatedRequest[A](
  val userId: Long,
  val userRole: String,
  request: Request[A]
) extends WrappedRequest[A](request)

@Singleton
class AuthenticatedAction @Inject()(
  val parser: BodyParsers.Default,
  authService: AuthService
)(implicit val executionContext: ExecutionContext)
  extends ActionBuilder[AuthenticatedRequest, AnyContent]:

  override def invokeBlock[A](
    request: Request[A],
    block: AuthenticatedRequest[A] => Future[Result]
  ): Future[Result] =
    request.headers.get("Authorization") match
      case Some(token) if token.startsWith("Bearer ") =>
        authService.validateToken(token.drop(7)).flatMap {
          case Some(claims) =>
            block(AuthenticatedRequest(claims.userId, claims.role, request))
          case None =>
            Future.successful(Results.Unauthorized("无效令牌"))
        }
      case _ =>
        Future.successful(Results.Unauthorized("缺少授权"))

// 在控制器中使用
@Singleton
class SecureController @Inject()(
  cc: ControllerComponents,
  authenticatedAction: AuthenticatedAction
) extends AbstractController(cc):

  def secureEndpoint(): Action[AnyContent] = authenticatedAction { request =>
    Ok(s"你好用户 ${request.userId}，角色 ${request.userRole}")
  }

  def adminOnly(): Action[AnyContent] = authenticatedAction { request =>
    if request.userRole == "admin" then
      Ok("管理员内容")
    else
      Forbidden("需要管理员权限")
  }
```

### 配置

```hocon
# conf/application.conf

play {
  http.secret.key = ${?APPLICATION_SECRET}

  filters {
    enabled += "play.filters.cors.CORSFilter"

    cors {
      allowedOrigins = ["http://localhost:3000"]
      allowedHttpMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      allowedHttpHeaders = ["Accept", "Content-Type", "Authorization"]
    }
  }

  modules {
    enabled += "modules.AppModule"
  }
}

# 数据库配置
slick.dbs.default {
  profile = "slick.jdbc.PostgresProfile$"
  db {
    driver = "org.postgresql.Driver"
    url = ${?DATABASE_URL}
    user = ${?DATABASE_USER}
    password = ${?DATABASE_PASSWORD}
    numThreads = 10
    maxConnections = 20
  }
}

# 应用设置
app {
  jwt {
    secret = ${?JWT_SECRET}
    expiration = 24 hours
  }
}
```

## Akka Actors

Akka 提供了一个强大的工具包，用于使用 Actor 模型构建并发、分布式和容错的应用程序。

### Actor 基础

```scala
import akka.actor.typed.{ActorRef, ActorSystem, Behavior}
import akka.actor.typed.scaladsl.{AbstractBehavior, ActorContext, Behaviors}

// 定义消息
object Counter:
  sealed trait Command
  case object Increment extends Command
  case object Decrement extends Command
  case class GetValue(replyTo: ActorRef[Value]) extends Command

  case class Value(count: Int)

  def apply(): Behavior[Command] =
    Behaviors.setup(context => Counter(context, 0))

  private def apply(context: ActorContext[Command], count: Int): Behavior[Command] =
    Behaviors.receiveMessage {
      case Increment =>
        context.log.info(s"从 $count 递增")
        Counter(context, count + 1)

      case Decrement =>
        context.log.info(s"从 $count 递减")
        Counter(context, count - 1)

      case GetValue(replyTo) =>
        replyTo ! Value(count)
        Behaviors.same
    }

// 使用
@main def runCounter(): Unit =
  val system = ActorSystem(Counter(), "counter-system")

  system ! Counter.Increment
  system ! Counter.Increment
  system ! Counter.Decrement

  // 对于请求-响应模式，使用 ask 模式
  import akka.actor.typed.scaladsl.AskPattern._
  import scala.concurrent.duration._

  given akka.util.Timeout = 3.seconds
  given scala.concurrent.ExecutionContext = system.executionContext

  val futureValue = system.ask(Counter.GetValue.apply)
  futureValue.foreach(v => println(s"计数: ${v.count}"))
```

### Actor 层次结构和监督

```scala
import akka.actor.typed.{SupervisorStrategy, Terminated}
import akka.actor.typed.scaladsl.Behaviors

object Guardian:
  sealed trait Command
  case class CreateWorker(name: String) extends Command
  case class SendToWorker(name: String, message: Worker.Command) extends Command

  def apply(): Behavior[Command] =
    Behaviors.setup { context =>
      var workers = Map.empty[String, ActorRef[Worker.Command]]

      Behaviors.receiveMessage {
        case CreateWorker(name) =>
          val worker = context.spawn(
            Behaviors.supervise(Worker())
              .onFailure[Exception](SupervisorStrategy.restart),
            name
          )
          context.watch(worker)
          workers = workers + (name -> worker)
          Behaviors.same

        case SendToWorker(name, message) =>
          workers.get(name).foreach(_ ! message)
          Behaviors.same
      }.receiveSignal {
        case (context, Terminated(ref)) =>
          context.log.warn(s"Worker ${ref.path.name} 终止")
          workers = workers.filterNot(_._2 == ref)
          Behaviors.same
      }
    }

object Worker:
  sealed trait Command
  case class Process(data: String, replyTo: ActorRef[Result]) extends Command
  case object Stop extends Command

  case class Result(processed: String)

  def apply(): Behavior[Command] =
    Behaviors.receive { (context, message) =>
      message match
        case Process(data, replyTo) =>
          context.log.info(s"处理: $data")
          // 模拟工作
          val result = data.toUpperCase
          replyTo ! Result(result)
          Behaviors.same

        case Stop =>
          Behaviors.stopped
    }
```

### Actor 模式

```scala
import akka.actor.typed.receptionist.{Receptionist, ServiceKey}
import akka.actor.typed.scaladsl.{Behaviors, Routers}
import akka.actor.typed.{ActorRef, Behavior, DispatcherSelector}

// 使用 Receptionist 进行服务发现
object DatabaseActor:
  val ServiceKey = ServiceKey[Command]("database")

  sealed trait Command
  case class Query(sql: String, replyTo: ActorRef[QueryResult]) extends Command

  case class QueryResult(rows: List[Map[String, Any]])

  def apply(): Behavior[Command] =
    Behaviors.setup { context =>
      context.system.receptionist ! Receptionist.Register(ServiceKey, context.self)

      Behaviors.receiveMessage {
        case Query(sql, replyTo) =>
          // 执行查询
          replyTo ! QueryResult(List.empty)
          Behaviors.same
      }
    }

// 发现服务的客户端
object DatabaseClient:
  sealed trait Command
  case class ExecuteQuery(sql: String) extends Command
  private case class ListingResponse(listing: Receptionist.Listing) extends Command

  def apply(): Behavior[Command] =
    Behaviors.setup { context =>
      val listingAdapter = context.messageAdapter[Receptionist.Listing](ListingResponse.apply)
      context.system.receptionist ! Receptionist.Subscribe(DatabaseActor.ServiceKey, listingAdapter)

      var databases = Set.empty[ActorRef[DatabaseActor.Command]]

      Behaviors.receiveMessage {
        case ListingResponse(DatabaseActor.ServiceKey.Listing(listings)) =>
          databases = listings
          Behaviors.same

        case ExecuteQuery(sql) =>
          databases.headOption.foreach { db =>
            db ! DatabaseActor.Query(sql, context.spawnAnonymous(queryResultHandler))
          }
          Behaviors.same
      }
    }

  private def queryResultHandler: Behavior[DatabaseActor.QueryResult] =
    Behaviors.receiveMessage { result =>
      println(s"查询返回 ${result.rows.size} 行")
      Behaviors.stopped
    }

// 用于负载均衡的路由器
object WorkerPool:
  def apply(poolSize: Int): Behavior[Worker.Command] =
    Routers.pool(poolSize)(Worker())
      .withRoundRobinRouting()
```

### Akka Streams

```scala
import akka.actor.typed.ActorSystem
import akka.stream.scaladsl._
import akka.stream.{Materializer, OverflowStrategy}
import akka.{Done, NotUsed}
import scala.concurrent.Future

object StreamExamples:
  given ActorSystem[Nothing] = ActorSystem(Behaviors.empty, "stream-system")
  given Materializer = Materializer(summon[ActorSystem[Nothing]])
  given scala.concurrent.ExecutionContext = summon[ActorSystem[Nothing]].executionContext

  // 基本流
  val source: Source[Int, NotUsed] = Source(1 to 100)
  val flow: Flow[Int, Int, NotUsed] = Flow[Int].map(_ * 2)
  val sink: Sink[Int, Future[Done]] = Sink.foreach(println)

  val result: Future[Done] = source.via(flow).runWith(sink)

  // 复杂处理管道
  def processOrders(orders: Source[Order, NotUsed]): Future[Seq[ProcessedOrder]] =
    orders
      .filter(_.amount > 0)
      .mapAsync(4)(validateOrder)           // 并行验证
      .mapAsync(2)(processPayment)          // 支付并行度较低
      .buffer(100, OverflowStrategy.backpressure)
      .map(enrichOrder)
      .recover {
        case ex: PaymentException =>
          ProcessedOrder.failed(ex.orderId, ex.getMessage)
      }
      .runWith(Sink.seq)

  // 背压处理
  val throttledSource = Source(1 to 1000)
    .throttle(100, 1.second)  // 每秒 100 个元素
    .buffer(50, OverflowStrategy.dropHead)

  // 合并流
  val source1 = Source(1 to 10)
  val source2 = Source(11 to 20)
  val merged = source1.merge(source2)

  // 广播到多个 sink
  val broadcastGraph = Source(1 to 100)
    .alsoTo(Sink.foreach(n => println(s"日志: $n")))
    .alsoTo(Sink.foreach(n => metrics.record(n)))
    .to(Sink.foreach(n => database.save(n)))

  // 自定义图
  import akka.stream.scaladsl.GraphDSL
  import akka.stream.{ClosedShape, FlowShape}

  val complexGraph = RunnableGraph.fromGraph(GraphDSL.create() { implicit builder =>
    import GraphDSL.Implicits._

    val source = builder.add(Source(1 to 100))
    val broadcast = builder.add(Broadcast[Int](2))
    val merge = builder.add(Merge[Int](2))
    val sink = builder.add(Sink.foreach(println))

    val evenFlow = Flow[Int].filter(_ % 2 == 0).map(_ * 10)
    val oddFlow = Flow[Int].filter(_ % 2 != 0).map(_ * 100)

    source ~> broadcast
              broadcast.out(0) ~> evenFlow ~> merge
              broadcast.out(1) ~> oddFlow ~> merge
                                              merge ~> sink

    ClosedShape
  })
```

## 函数式编程模式

### Monad 和 For 推导

```scala
import scala.concurrent.{ExecutionContext, Future}

// Option 的 for 推导
def getUserAddress(userId: Long): Option[String] =
  for
    user <- findUser(userId)
    address <- user.address
    city <- address.city
  yield s"${address.street}, $city"

// Future 的 for 推导
def createOrder(
  userId: Long,
  productId: Long
)(using ec: ExecutionContext): Future[Order] =
  for
    user <- userService.findById(userId)
    product <- productService.findById(productId)
    inventory <- inventoryService.check(productId)
    if inventory.available > 0
    order <- orderService.create(user, product)
    _ <- notificationService.sendConfirmation(user.email, order)
  yield order

// Either 的 for 推导
def validateAndProcess(request: Request): Either[ValidationError, Result] =
  for
    email <- validateEmail(request.email)
    age <- validateAge(request.age)
    address <- validateAddress(request.address)
    result <- process(email, age, address)
  yield result
```

### 类型类

```scala
// 定义类型类
trait JsonEncoder[A]:
  def encode(value: A): String

  extension (value: A)
    def toJson: String = encode(value)

// 类型类实例
object JsonEncoder:
  given JsonEncoder[String] with
    def encode(value: String): String = s""""$value""""

  given JsonEncoder[Int] with
    def encode(value: Int): String = value.toString

  given JsonEncoder[Boolean] with
    def encode(value: Boolean): String = value.toString

  given [A: JsonEncoder]: JsonEncoder[List[A]] with
    def encode(values: List[A]): String =
      values.map(_.toJson).mkString("[", ",", "]")

  given [A: JsonEncoder]: JsonEncoder[Option[A]] with
    def encode(value: Option[A]): String =
      value.map(_.toJson).getOrElse("null")

// 为 case class 派生实例
case class Person(name: String, age: Int)

given JsonEncoder[Person] with
  def encode(p: Person): String =
    s"""{"name":${p.name.toJson},"age":${p.age.toJson}}"""

// 使用
val person = Person("Alice", 30)
println(person.toJson)  // {"name":"Alice","age":30}
```

### Applicative 验证

```scala
// 用于累积错误的 Validated 类型
enum Validated[+E, +A]:
  case Valid(value: A)
  case Invalid(errors: List[E])

  def map[B](f: A => B): Validated[E, B] = this match
    case Valid(a) => Valid(f(a))
    case Invalid(e) => Invalid(e)

  def flatMap[EE >: E, B](f: A => Validated[EE, B]): Validated[EE, B] = this match
    case Valid(a) => f(a)
    case Invalid(e) => Invalid(e)

object Validated:
  def valid[A](a: A): Validated[Nothing, A] = Valid(a)
  def invalid[E](e: E): Validated[E, Nothing] = Invalid(List(e))

  // Applicative 组合 - 累积所有错误
  def mapN[E, A, B, C](
    va: Validated[E, A],
    vb: Validated[E, B]
  )(f: (A, B) => C): Validated[E, C] = (va, vb) match
    case (Valid(a), Valid(b)) => Valid(f(a, b))
    case (Invalid(e1), Invalid(e2)) => Invalid(e1 ++ e2)
    case (Invalid(e), _) => Invalid(e)
    case (_, Invalid(e)) => Invalid(e)

// 使用
case class Registration(email: String, age: Int, username: String)

def validateEmail(email: String): Validated[String, String] =
  if email.contains("@") then Validated.valid(email)
  else Validated.invalid("无效的邮箱格式")

def validateAge(age: Int): Validated[String, Int] =
  if age >= 18 then Validated.valid(age)
  else Validated.invalid("必须年满 18 岁")

def validateUsername(name: String): Validated[String, String] =
  if name.length >= 3 then Validated.valid(name)
  else Validated.invalid("用户名太短")

def validateRegistration(
  email: String,
  age: Int,
  username: String
): Validated[String, Registration] =
  val vEmail = validateEmail(email)
  val vAge = validateAge(age)
  val vUsername = validateUsername(username)

  // 这将累积所有验证错误
  Validated.mapN(vEmail, Validated.mapN(vAge, vUsername)((a, u) => (a, u))) {
    case (e, (a, u)) => Registration(e, a, u)
  }
```

## Cats Effect

Cats Effect 是 Scala 的纯函数式运行时，为副作用提供强大的抽象。

### IO 基础

```scala
import cats.effect._
import cats.effect.std.Console
import cats.syntax.all._
import scala.concurrent.duration._

object CatsEffectBasics extends IOApp.Simple:

  // 包装在 IO 中的纯值
  val pureIO: IO[Int] = IO.pure(42)

  // 挂起的副作用
  val suspendedIO: IO[Unit] = IO.println("Hello, World!")

  // 组合 IO
  val combinedIO: IO[Unit] = for
    _ <- IO.println("你叫什么名字?")
    name <- IO.readLine
    _ <- IO.println(s"你好, $name!")
  yield ()

  // 错误处理
  val failingIO: IO[Int] = IO.raiseError(new RuntimeException("出错了!"))

  val recoveredIO: IO[Int] = failingIO.handleErrorWith { error =>
    IO.println(s"错误: ${error.getMessage}") *> IO.pure(-1)
  }

  // 时间和延迟
  val delayedIO: IO[Unit] = IO.sleep(1.second) *> IO.println("延迟了!")

  // 资源安全
  def readFile(path: String): IO[String] =
    Resource
      .fromAutoCloseable(IO(scala.io.Source.fromFile(path)))
      .use(source => IO(source.mkString))

  def run: IO[Unit] = combinedIO
```

### 并发编程

```scala
import cats.effect._
import cats.effect.std.{Queue, Semaphore, Supervisor}
import cats.syntax.all._
import scala.concurrent.duration._

object ConcurrencyExamples extends IOApp.Simple:

  // 并行执行
  def fetchData: IO[(User, Orders, Recommendations)] =
    (fetchUser, fetchOrders, fetchRecommendations).parTupled

  // 竞争计算
  def fetchWithTimeout[A](io: IO[A], timeout: FiniteDuration): IO[A] =
    IO.race(io, IO.sleep(timeout)).flatMap {
      case Left(result) => IO.pure(result)
      case Right(_) => IO.raiseError(new TimeoutException)
    }

  // 基于 Fiber 的并发
  def backgroundProcess: IO[Unit] =
    for
      fiber <- longRunningTask.start
      _ <- IO.println("任务在后台启动")
      _ <- IO.sleep(5.seconds)
      _ <- fiber.cancel
    yield ()

  // 使用 Queue 的生产者-消费者
  def producerConsumer: IO[Unit] =
    for
      queue <- Queue.bounded[IO, Int](100)
      producer = Stream.iterate(0)(_ + 1)
        .through(n => queue.offer(n) *> IO.sleep(100.millis))
        .compile.drain
      consumer = Stream.repeatAction(queue.take)
        .through(n => IO.println(s"消费: $n"))
        .compile.drain
      _ <- (producer, consumer).parTupled.void
    yield ()

  // 使用 Semaphore 进行限流
  def rateLimitedRequests(urls: List[String]): IO[List[Response]] =
    for
      semaphore <- Semaphore[IO](10)  // 最大 10 个并发请求
      results <- urls.parTraverse { url =>
        semaphore.permit.use(_ => fetchUrl(url))
      }
    yield results

  def run: IO[Unit] = producerConsumer
```

### 资源管理

```scala
import cats.effect._
import cats.effect.std.Dispatcher
import cats.syntax.all._

object ResourceManagement:

  // 基本资源
  def databaseConnection(config: DbConfig): Resource[IO, Connection] =
    Resource.make(
      acquire = IO.println("打开连接") *> openConnection(config)
    )(
      release = conn => IO.println("关闭连接") *> conn.close
    )

  // 组合资源
  def appResources(config: AppConfig): Resource[IO, AppResources] =
    for
      db <- databaseConnection(config.database)
      redis <- redisConnection(config.redis)
      http <- httpClient
      _ <- Resource.unit[IO].onFinalize(IO.println("所有资源已获取"))
    yield AppResources(db, redis, http)

  // 使用资源
  def runApp(config: AppConfig): IO[Unit] =
    appResources(config).use { resources =>
      // 资源在这里可用
      val server = HttpServer(resources)
      server.run
    }

  // 带有成功和错误终结器的资源
  def transactional[A](conn: Connection)(action: IO[A]): IO[A] =
    Resource.make(
      conn.beginTransaction
    )(_ =>
      conn.rollback.handleError(_ => ())
    ).use { _ =>
      action.flatTap(_ => conn.commit)
    }
```

## ZIO

ZIO 是另一个强大的 Scala 效果系统，以出色的错误处理和依赖注入著称。

### ZIO 基础

```scala
import zio._
import zio.Console._
import zio.Duration._

object ZIOBasics extends ZIOAppDefault:

  // ZIO[R, E, A] - 需要 R，可能失败为 E，成功为 A
  val greet: ZIO[Any, Nothing, Unit] =
    Console.printLine("Hello, ZIO!").orDie

  // 错误处理
  val failing: ZIO[Any, String, Int] = ZIO.fail("出错了")

  val recovered: ZIO[Any, Nothing, Int] = failing.catchAll { error =>
    Console.printLine(s"错误: $error").orDie *> ZIO.succeed(-1)
  }

  // For 推导
  val program: ZIO[Any, java.io.IOException, Unit] =
    for
      _ <- Console.printLine("你叫什么名字?")
      name <- Console.readLine
      _ <- Console.printLine(s"你好, $name!")
    yield ()

  // 并行执行
  def fetchAll: ZIO[Any, Throwable, (User, Orders)] =
    fetchUser.zipPar(fetchOrders)

  // 竞争
  def raceWithTimeout[R, E, A](
    zio: ZIO[R, E, A],
    timeout: Duration
  ): ZIO[R, Option[E], A] =
    zio.mapError(Some(_)).race(ZIO.sleep(timeout) *> ZIO.fail(None))

  def run = program.exitCode
```

### ZIO Layers（依赖注入）

```scala
import zio._

// 服务定义
trait UserRepository:
  def findById(id: Long): Task[Option[User]]
  def save(user: User): Task[User]

object UserRepository:
  // 访问方法
  def findById(id: Long): ZIO[UserRepository, Throwable, Option[User]] =
    ZIO.serviceWithZIO(_.findById(id))

  def save(user: User): ZIO[UserRepository, Throwable, User] =
    ZIO.serviceWithZIO(_.save(user))

// 实现
case class UserRepositoryLive(db: Database) extends UserRepository:
  def findById(id: Long): Task[Option[User]] =
    db.query(s"SELECT * FROM users WHERE id = $id").map(_.headOption)

  def save(user: User): Task[User] =
    db.execute(s"INSERT INTO users ...").as(user)

object UserRepositoryLive:
  val layer: ZLayer[Database, Nothing, UserRepository] =
    ZLayer.fromFunction(UserRepositoryLive.apply)

// 依赖 UserRepository 的服务
trait UserService:
  def getUser(id: Long): Task[User]
  def createUser(request: CreateUserRequest): Task[User]

case class UserServiceLive(repo: UserRepository) extends UserService:
  def getUser(id: Long): Task[User] =
    repo.findById(id).someOrFail(new NoSuchElementException)

  def createUser(request: CreateUserRequest): Task[User] =
    val user = User(0, request.name, request.email)
    repo.save(user)

object UserServiceLive:
  val layer: ZLayer[UserRepository, Nothing, UserService] =
    ZLayer.fromFunction(UserServiceLive.apply)

// 组合 layers
object MainApp extends ZIOAppDefault:
  val appLayer: ZLayer[Any, Throwable, UserService] =
    Database.live >>> UserRepositoryLive.layer >>> UserServiceLive.layer

  val program: ZIO[UserService, Throwable, Unit] =
    for
      user <- ZIO.serviceWithZIO[UserService](_.getUser(1))
      _ <- Console.printLine(s"找到用户: ${user.name}")
    yield ()

  def run = program.provide(appLayer)
```

### ZIO Streams

```scala
import zio._
import zio.stream._

object ZIOStreams:

  // 创建流
  val numbers: ZStream[Any, Nothing, Int] = ZStream.fromIterable(1 to 100)
  val infinite: ZStream[Any, Nothing, Int] = ZStream.iterate(0)(_ + 1)

  // 转换流
  val doubled: ZStream[Any, Nothing, Int] =
    numbers.map(_ * 2)

  val filtered: ZStream[Any, Nothing, Int] =
    numbers.filter(_ % 2 == 0)

  // 带效果的流
  def fetchPages(urls: List[String]): ZStream[Any, Throwable, Page] =
    ZStream.fromIterable(urls)
      .mapZIOPar(4)(url => fetchPage(url))

  // 分块处理
  val batched: ZStream[Any, Nothing, Chunk[Int]] =
    numbers.grouped(10)

  // 用于收集结果的 Sink
  val sumSink: ZSink[Any, Nothing, Int, Nothing, Int] =
    ZSink.sum[Int]

  // 运行流
  val runStream: ZIO[Any, Nothing, Int] =
    numbers.run(sumSink)

  // 带资源管理的流
  def processFile(path: String): ZStream[Any, Throwable, String] =
    ZStream.fromFile(java.nio.file.Path.of(path))
      .via(ZPipeline.utf8Decode >>> ZPipeline.splitLines)

  // 合并流
  val merged: ZStream[Any, Nothing, Int] =
    ZStream(1, 2, 3).merge(ZStream(4, 5, 6))
```

## 构建响应式系统

### 使用 Akka Persistence 的事件溯源

```scala
import akka.actor.typed.{ActorRef, Behavior}
import akka.actor.typed.scaladsl.Behaviors
import akka.persistence.typed.PersistenceId
import akka.persistence.typed.scaladsl.{Effect, EventSourcedBehavior}

object BankAccount:
  // 命令
  sealed trait Command
  case class Deposit(amount: BigDecimal, replyTo: ActorRef[Response]) extends Command
  case class Withdraw(amount: BigDecimal, replyTo: ActorRef[Response]) extends Command
  case class GetBalance(replyTo: ActorRef[Balance]) extends Command

  // 事件
  sealed trait Event
  case class Deposited(amount: BigDecimal) extends Event
  case class Withdrawn(amount: BigDecimal) extends Event

  // 状态
  case class State(balance: BigDecimal):
    def deposit(amount: BigDecimal): State = copy(balance = balance + amount)
    def withdraw(amount: BigDecimal): State = copy(balance = balance - amount)
    def canWithdraw(amount: BigDecimal): Boolean = balance >= amount

  // 响应
  sealed trait Response
  case class Balance(amount: BigDecimal) extends Response
  case object Success extends Response
  case class Failure(reason: String) extends Response

  def apply(accountId: String): Behavior[Command] =
    EventSourcedBehavior[Command, Event, State](
      persistenceId = PersistenceId.ofUniqueId(accountId),
      emptyState = State(BigDecimal(0)),
      commandHandler = commandHandler,
      eventHandler = eventHandler
    )

  private val commandHandler: (State, Command) => Effect[Event, State] =
    (state, command) => command match
      case Deposit(amount, replyTo) =>
        Effect.persist(Deposited(amount))
          .thenReply(replyTo)(_ => Success)

      case Withdraw(amount, replyTo) =>
        if state.canWithdraw(amount) then
          Effect.persist(Withdrawn(amount))
            .thenReply(replyTo)(_ => Success)
        else
          Effect.reply(replyTo)(Failure("余额不足"))

      case GetBalance(replyTo) =>
        Effect.reply(replyTo)(Balance(state.balance))

  private val eventHandler: (State, Event) => State =
    (state, event) => event match
      case Deposited(amount) => state.deposit(amount)
      case Withdrawn(amount) => state.withdraw(amount)
```

### CQRS 模式

```scala
import cats.effect._
import cats.syntax.all._

// 命令
sealed trait OrderCommand
case class CreateOrder(customerId: Long, items: List[OrderItem]) extends OrderCommand
case class AddItem(orderId: Long, item: OrderItem) extends OrderCommand
case class SubmitOrder(orderId: Long) extends OrderCommand

// 事件
sealed trait OrderEvent
case class OrderCreated(orderId: Long, customerId: Long, items: List[OrderItem]) extends OrderEvent
case class ItemAdded(orderId: Long, item: OrderItem) extends OrderEvent
case class OrderSubmitted(orderId: Long, submittedAt: java.time.Instant) extends OrderEvent

// 命令处理器（写端）
class OrderCommandHandler(
  eventStore: EventStore[OrderEvent],
  eventPublisher: EventPublisher[OrderEvent]
):
  def handle(command: OrderCommand): IO[Unit] = command match
    case CreateOrder(customerId, items) =>
      val orderId = generateOrderId()
      val event = OrderCreated(orderId, customerId, items)
      eventStore.append(event) *> eventPublisher.publish(event)

    case AddItem(orderId, item) =>
      val event = ItemAdded(orderId, item)
      eventStore.append(event) *> eventPublisher.publish(event)

    case SubmitOrder(orderId) =>
      val event = OrderSubmitted(orderId, java.time.Instant.now)
      eventStore.append(event) *> eventPublisher.publish(event)

// 查询模型（读端）
class OrderProjection(orderRepository: OrderReadRepository):
  def handle(event: OrderEvent): IO[Unit] = event match
    case OrderCreated(orderId, customerId, items) =>
      orderRepository.insert(OrderView(orderId, customerId, items, "DRAFT"))

    case ItemAdded(orderId, item) =>
      orderRepository.addItem(orderId, item)

    case OrderSubmitted(orderId, submittedAt) =>
      orderRepository.updateStatus(orderId, "SUBMITTED", submittedAt)

// 查询服务
class OrderQueryService(orderRepository: OrderReadRepository):
  def getOrder(orderId: Long): IO[Option[OrderView]] =
    orderRepository.findById(orderId)

  def getOrdersByCustomer(customerId: Long): IO[List[OrderView]] =
    orderRepository.findByCustomer(customerId)

  def getPendingOrders(): IO[List[OrderView]] =
    orderRepository.findByStatus("DRAFT")
```

### 使用 http4s 的响应式 HTTP

```scala
import cats.effect._
import cats.syntax.all._
import org.http4s._
import org.http4s.dsl.io._
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.circe._
import org.http4s.circe.CirceEntityCodec._
import io.circe.generic.auto._
import com.comcast.ip4s._

object Http4sServer extends IOApp.Simple:

  case class User(id: Long, name: String, email: String)
  case class CreateUserRequest(name: String, email: String)

  class UserRoutes(userService: UserService):
    val routes: HttpRoutes[IO] = HttpRoutes.of[IO] {

      case GET -> Root / "users" =>
        userService.findAll().flatMap(users => Ok(users))

      case GET -> Root / "users" / LongVar(id) =>
        userService.findById(id).flatMap {
          case Some(user) => Ok(user)
          case None => NotFound()
        }

      case req @ POST -> Root / "users" =>
        for
          request <- req.as[CreateUserRequest]
          user <- userService.create(request)
          response <- Created(user)
        yield response

      case DELETE -> Root / "users" / LongVar(id) =>
        userService.delete(id).flatMap {
          case true => NoContent()
          case false => NotFound()
        }
    }

  // 中间件
  def loggingMiddleware(routes: HttpRoutes[IO]): HttpRoutes[IO] =
    HttpRoutes { req =>
      for
        _ <- OptionT.liftF(IO.println(s"请求: ${req.method} ${req.uri}"))
        start <- OptionT.liftF(IO.realTime)
        response <- routes(req)
        end <- OptionT.liftF(IO.realTime)
        _ <- OptionT.liftF(IO.println(s"响应: ${response.status} (${(end - start).toMillis}ms)"))
      yield response
    }

  def run: IO[Unit] =
    val userService = new UserServiceImpl()
    val userRoutes = new UserRoutes(userService)
    val httpApp = loggingMiddleware(userRoutes.routes).orNotFound

    EmberServerBuilder
      .default[IO]
      .withHost(ipv4"0.0.0.0")
      .withPort(port"8080")
      .withHttpApp(httpApp)
      .build
      .use(_ => IO.never)
```

## 测试

### ScalaTest

```scala
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.time.{Millis, Seconds, Span}

class UserServiceSpec extends AnyFlatSpec with Matchers with ScalaFutures:

  implicit val patience: PatienceConfig =
    PatienceConfig(timeout = Span(5, Seconds), interval = Span(100, Millis))

  "UserService" should "创建新用户" in {
    val repository = new InMemoryUserRepository()
    val service = new UserService(repository)

    val request = CreateUserRequest("John", "john@example.com", "password")
    val result = service.create(request).futureValue

    result.name shouldBe "John"
    result.email shouldBe "john@example.com"
    result.id should be > 0L
  }

  it should "按 id 查找用户" in {
    val repository = new InMemoryUserRepository()
    val service = new UserService(repository)

    val created = service.create(CreateUserRequest("Jane", "jane@example.com", "pass")).futureValue
    val found = service.findById(created.id).futureValue

    found shouldBe defined
    found.get.name shouldBe "Jane"
  }

  it should "对不存在的用户返回 None" in {
    val repository = new InMemoryUserRepository()
    val service = new UserService(repository)

    val result = service.findById(999L).futureValue

    result shouldBe None
  }

  it should "创建重复邮箱的用户时失败" in {
    val repository = new InMemoryUserRepository()
    val service = new UserService(repository)

    service.create(CreateUserRequest("User1", "same@example.com", "pass")).futureValue

    val result = service.create(CreateUserRequest("User2", "same@example.com", "pass"))

    whenReady(result.failed) { ex =>
      ex shouldBe a[DuplicateEmailException]
    }
  }
```

### 使用 ScalaCheck 的属性测试

```scala
import org.scalacheck.{Gen, Prop, Properties}
import org.scalacheck.Prop.forAll

object UserValidationSpec extends Properties("UserValidation"):

  val emailGen: Gen[String] = for
    user <- Gen.alphaNumStr.suchThat(_.nonEmpty)
    domain <- Gen.alphaNumStr.suchThat(_.nonEmpty)
    tld <- Gen.oneOf("com", "org", "net", "io")
  yield s"$user@$domain.$tld"

  val invalidEmailGen: Gen[String] = Gen.oneOf(
    Gen.alphaNumStr,                    // 无 @
    Gen.const(""),                       // 空
    Gen.alphaNumStr.map(_ + "@"),       // 无域名
    Gen.alphaNumStr.map("@" + _)        // 无用户名
  )

  property("有效邮箱通过验证") = forAll(emailGen) { email =>
    validateEmail(email).isRight
  }

  property("无效邮箱验证失败") = forAll(invalidEmailGen) { email =>
    validateEmail(email).isLeft
  }

  val positiveInt: Gen[Int] = Gen.posNum[Int]
  val negativeInt: Gen[Int] = Gen.negNum[Int]

  property("正年龄通过验证") = forAll(positiveInt.suchThat(_ >= 18)) { age =>
    validateAge(age).isRight
  }

  property("18 岁以下验证失败") = forAll(Gen.choose(0, 17)) { age =>
    validateAge(age).isLeft
  }

  property("用户创建对于相同输入是幂等的") = forAll(emailGen, Gen.alphaStr) {
    (email, name) =>
      val result1 = User.create(name, email)
      val result2 = User.create(name, email)
      (result1, result2) match
        case (Right(u1), Right(u2)) => u1.name == u2.name && u1.email == u2.email
        case (Left(_), Left(_)) => true
        case _ => false
  }
```

### 使用 Cats Effect 测试

```scala
import cats.effect._
import cats.effect.testing.scalatest.AsyncIOSpec
import org.scalatest.freespec.AsyncFreeSpec
import org.scalatest.matchers.should.Matchers

class UserServiceIOSpec extends AsyncFreeSpec with AsyncIOSpec with Matchers:

  "UserService" - {
    "应该创建用户" in {
      val test = for
        repo <- Ref.of[IO, Map[Long, User]](Map.empty).map(InMemoryUserRepo(_))
        service = UserServiceIO(repo)
        user <- service.create("John", "john@example.com")
      yield user

      test.asserting { user =>
        user.name shouldBe "John"
        user.email shouldBe "john@example.com"
      }
    }

    "应该安全处理并发创建" in {
      val test = for
        repo <- Ref.of[IO, Map[Long, User]](Map.empty).map(InMemoryUserRepo(_))
        service = UserServiceIO(repo)
        users <- (1 to 100).toList.parTraverse { i =>
          service.create(s"User$i", s"user$i@example.com")
        }
        all <- repo.findAll
      yield (users, all)

      test.asserting { case (created, stored) =>
        created.size shouldBe 100
        stored.size shouldBe 100
      }
    }
  }

// 测试辅助
class InMemoryUserRepo(ref: Ref[IO, Map[Long, User]]) extends UserRepository[IO]:
  private val counter = new java.util.concurrent.atomic.AtomicLong(0)

  def findById(id: Long): IO[Option[User]] =
    ref.get.map(_.get(id))

  def save(user: User): IO[User] =
    val newUser = if user.id == 0 then user.copy(id = counter.incrementAndGet()) else user
    ref.update(_ + (newUser.id -> newUser)).as(newUser)

  def findAll: IO[List[User]] =
    ref.get.map(_.values.toList)
```

## 最佳实践

### 代码组织

```
src/main/scala/com/example/
├── domain/           # 领域模型和业务逻辑
│   ├── models/       # Case classes、枚举
│   ├── services/     # 领域服务
│   └── errors/       # 领域错误
├── application/      # 应用服务
│   ├── commands/     # 命令处理器
│   └── queries/      # 查询处理器
├── infrastructure/   # 外部集成
│   ├── persistence/  # 数据库仓储
│   ├── http/         # HTTP 客户端
│   └── messaging/    # 消息队列客户端
├── api/              # API 层
│   ├── routes/       # HTTP 路由
│   ├── dto/          # 请求/响应 DTO
│   └── middleware/   # HTTP 中间件
└── config/           # 配置
```

### 错误处理指南

```scala
// 将领域错误定义为密封 trait
sealed trait DomainError extends Throwable
case class UserNotFound(id: Long) extends DomainError
case class InvalidEmail(email: String) extends DomainError
case class DuplicateEmail(email: String) extends DomainError

// 对可恢复错误使用 Either
def validateUser(request: CreateUserRequest): Either[DomainError, ValidatedUser] =
  for
    email <- validateEmail(request.email).leftMap(_ => InvalidEmail(request.email))
    name <- validateName(request.name)
  yield ValidatedUser(name, email)

// 转换为 HTTP 响应
def handleError(error: DomainError): Response = error match
  case UserNotFound(id) => Response.notFound(s"用户 $id 未找到")
  case InvalidEmail(email) => Response.badRequest(s"无效邮箱: $email")
  case DuplicateEmail(email) => Response.conflict(s"邮箱已存在: $email")
```

### 性能技巧

1. **明智使用不可变集合**：
```scala
// 对随机访问使用 Vector
val vector = Vector(1, 2, 3, 4, 5)

// 对前置操作密集的情况使用 List
val list = 1 :: 2 :: 3 :: Nil

// 对成员测试使用 Set
val set = Set("a", "b", "c")
```

2. **对昂贵操作使用惰性计算**：
```scala
lazy val expensiveValue = computeExpensively()

// LazyList 用于无限序列
val naturals = LazyList.from(0)
```

3. **对 CPU 密集型工作使用并行集合**：
```scala
import scala.collection.parallel.CollectionConverters._

val results = data.par.map(heavyComputation).toList
```

4. **对大数据使用流式处理**：
```scala
// fs2 Stream 用于内存效率处理
fs2.Stream.emits(largeData)
  .chunkN(1000)
  .parEvalMapUnordered(4)(processChunk)
  .compile.toList
```

## 面试问题

### 常见问题

**1. val、var 和 def 有什么区别？**

- `val`：不可变值，定义时计算一次
- `var`：可变变量，可以重新赋值
- `def`：方法，每次调用时计算

**2. 解释 Scala 中的模式匹配。**

模式匹配是一种检查值与模式匹配的机制。它比 switch 语句更强大，支持解构、守卫、类型匹配以及使用密封 trait 的穷尽检查。

**3. 什么是 case class，为什么使用它们？**

Case class 是特殊的类：
- 自动生成 equals、hashCode 和 toString
- 支持模式匹配
- 默认不可变
- 有 copy 方法用于创建修改后的副本
- 实例化不需要 `new` 关键字

**4. 什么是 monad？举出 Scala 中的例子。**

Monad 是一个具有 `flatMap` 和 `pure` 操作的类型构造器，遵循某些法则（左单位元、右单位元、结合律）。例如：Option、Either、Future、List、IO。

**5. 解释 Akka 中的 Actor 模型。**

Actor 模型是一种并发范式，其中 actor 是隔离的单元，只通过异步消息通信。每个 actor 有一个邮箱，一次处理一条消息，可以创建子 actor，形成监督层次结构。

**6. 什么是引用透明性？**

如果一个表达式可以用其值替换而不改变程序行为，则该表达式是引用透明的。这是函数式编程的基础，支持等式推理。

## 延伸阅读

### 官方资源

- [Scala 文档](https://docs.scala-lang.org/)
- [Play Framework 文档](https://www.playframework.com/documentation)
- [Akka 文档](https://doc.akka.io/)
- [Cats Effect 文档](https://typelevel.org/cats-effect/)
- [ZIO 文档](https://zio.dev/)

### 推荐学习路径

1. **基础**：Scala 语法、集合、模式匹配、case class
2. **中级**：类型类、implicit/given、高阶函数
3. **高级**：Cats/Cats Effect、Akka actors、效果系统
4. **专家**：范畴论概念、高级类型系统特性

### 相关技术

- **Apache Spark**：分布式数据处理
- **Apache Kafka**：事件流平台
- **Slick**：函数式关系映射
- **Doobie**：纯函数式 JDBC 层
- **http4s**：Scala 上的类型化 HTTP

---

Scala 结合了面向对象和函数式编程范式，加上其强大的类型系统和库生态系统，使其成为构建健壮、可扩展后端系统的优秀选择。无论你是使用 Play Framework 构建微服务、使用 Akka 实现事件驱动系统，还是利用 Cats Effect 或 ZIO 进行纯函数式编程，Scala 都提供了应对复杂后端挑战所需的工具和抽象，同时保持代码质量和类型安全。
