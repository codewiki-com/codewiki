---
title: Scala Backend Development
description: Build high-concurrency applications with Scala and Akka/Play
track: backend
section: http-apis
difficulty: advanced
tags:
  - Scala
  - Akka
  - Play
  - functional programming
status: imported
origin: old/src/content/docs/backend/scala-backend.en.md
divergence: 0.204
issues: []
legacy:
  category: Backend
  subcategory: Languages
  order: 28
  lastUpdated: 2026-01-07
---

## What is Scala?

Scala is a powerful, statically-typed programming language that seamlessly combines object-oriented and functional programming paradigms. Running on the Java Virtual Machine (JVM), Scala offers full interoperability with Java while providing advanced features like pattern matching, higher-order functions, and a sophisticated type system.

### Why Scala for Backend Development?

Scala has become a popular choice for building scalable backend systems, particularly in high-performance and data-intensive applications:

- **Concurrency**: Native support for concurrent programming through Akka actors and Futures
- **Type Safety**: Advanced type system catches errors at compile time
- **Expressiveness**: Concise syntax reduces boilerplate code
- **JVM Ecosystem**: Full access to Java libraries and tools
- **Functional Programming**: First-class support for immutability and pure functions
- **Scalability**: Designed for building distributed, fault-tolerant systems

### Scala vs Java

```
Java:
- Verbose syntax
- Object-oriented focus
- Null references common
- Checked exceptions
- Mutable by default

Scala:
- Concise, expressive syntax
- Multi-paradigm (OO + FP)
- Option type for null safety
- No checked exceptions
- Immutable by default (encouraged)
```

## Getting Started

### Setting Up a Scala Project

The most common way to create a Scala project is using sbt (Scala Build Tool):

```bash
# Install sbt (macOS)
brew install sbt

# Install sbt (Linux)
echo "deb https://repo.scala-sbt.org/scalasbt/debian all main" | sudo tee /etc/apt/sources.list.d/sbt.list
curl -sL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x99E82A75642AC823" | sudo apt-key add
sudo apt-get update
sudo apt-get install sbt

# Create a new project
sbt new scala/scala3.g8
```

### Project Structure

A typical Scala project follows this structure:

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

### Build Configuration (build.sbt)

```scala
ThisBuild / version := "0.1.0-SNAPSHOT"
ThisBuild / scalaVersion := "3.3.1"
ThisBuild / organization := "com.example"

lazy val root = (project in file("."))
  .settings(
    name := "my-scala-app",
    libraryDependencies ++= Seq(
      // Core
      "com.typesafe" % "config" % "1.4.3",

      // JSON
      "io.circe" %% "circe-core" % "0.14.6",
      "io.circe" %% "circe-generic" % "0.14.6",
      "io.circe" %% "circe-parser" % "0.14.6",

      // HTTP
      "org.http4s" %% "http4s-ember-server" % "0.23.24",
      "org.http4s" %% "http4s-circe" % "0.23.24",
      "org.http4s" %% "http4s-dsl" % "0.23.24",

      // Database
      "org.tpolecat" %% "doobie-core" % "1.0.0-RC4",
      "org.tpolecat" %% "doobie-postgres" % "1.0.0-RC4",
      "org.tpolecat" %% "doobie-hikari" % "1.0.0-RC4",

      // Testing
      "org.scalatest" %% "scalatest" % "3.2.17" % Test,
      "org.scalatestplus" %% "mockito-4-11" % "3.2.17.0" % Test
    )
  )
```

## Scala Basics

### Variables and Types

```scala
// Immutable values (preferred)
val name: String = "John"
val age: Int = 30
val pi: Double = 3.14159

// Mutable variables (use sparingly)
var counter: Int = 0
counter += 1

// Type inference
val message = "Hello, World!"  // String inferred
val numbers = List(1, 2, 3)    // List[Int] inferred

// Common types
val boolean: Boolean = true
val char: Char = 'A'
val long: Long = 1234567890L
val float: Float = 3.14f
val bigDecimal: BigDecimal = BigDecimal("999999999999.99")

// Collections
val list: List[Int] = List(1, 2, 3)
val set: Set[String] = Set("a", "b", "c")
val map: Map[String, Int] = Map("one" -> 1, "two" -> 2)
val vector: Vector[Double] = Vector(1.0, 2.0, 3.0)
```

### Functions

```scala
// Basic function
def add(a: Int, b: Int): Int = a + b

// Multi-line function
def greet(name: String): String = {
  val greeting = s"Hello, $name!"
  greeting.toUpperCase
}

// Default parameters
def createUser(name: String, role: String = "user"): User =
  User(name, role)

// Named parameters
createUser(name = "Alice", role = "admin")

// Varargs
def sum(numbers: Int*): Int = numbers.sum

// Higher-order functions
def applyTwice(f: Int => Int, x: Int): Int = f(f(x))
val double: Int => Int = x => x * 2
applyTwice(double, 5)  // 20

// Anonymous functions (lambdas)
val numbers = List(1, 2, 3, 4, 5)
numbers.map(x => x * 2)        // List(2, 4, 6, 8, 10)
numbers.map(_ * 2)             // Same with placeholder syntax
numbers.filter(_ > 2)          // List(3, 4, 5)
numbers.reduce(_ + _)          // 15

// Currying
def multiply(a: Int)(b: Int): Int = a * b
val double = multiply(2)_      // Partially applied function
double(5)                      // 10
```

### Classes and Objects

```scala
// Case class (immutable data containers)
case class User(
  id: Long,
  name: String,
  email: String,
  role: Role = Role.User
)

// Enum (Scala 3)
enum Role:
  case Admin, User, Guest

// Regular class with methods
class UserService(repository: UserRepository):
  def findById(id: Long): Option[User] =
    repository.findById(id)

  def create(name: String, email: String): User =
    val user = User(generateId(), name, email)
    repository.save(user)
    user

// Companion object (singleton)
object UserService:
  def apply(repository: UserRepository): UserService =
    new UserService(repository)

  private def generateId(): Long =
    System.currentTimeMillis()

// Trait (interface with implementation)
trait Identifiable:
  def id: Long
  def idString: String = s"ID-$id"

trait Auditable:
  def createdAt: java.time.Instant
  def updatedAt: java.time.Instant

// Multiple inheritance with traits
case class Document(
  id: Long,
  title: String,
  createdAt: java.time.Instant,
  updatedAt: java.time.Instant
) extends Identifiable with Auditable
```

### Pattern Matching

```scala
// Basic pattern matching
def describe(x: Any): String = x match
  case 0 => "zero"
  case n: Int if n > 0 => s"positive integer: $n"
  case n: Int => s"negative integer: $n"
  case s: String => s"string: $s"
  case _ => "something else"

// Case class pattern matching
def processUser(user: User): String = user match
  case User(_, name, _, Role.Admin) => s"Admin user: $name"
  case User(id, name, email, _) if email.endsWith("@company.com") =>
    s"Internal user: $name (ID: $id)"
  case User(_, name, _, _) => s"Regular user: $name"

// Option pattern matching
def greetUser(maybeUser: Option[User]): String = maybeUser match
  case Some(user) => s"Hello, ${user.name}!"
  case None => "Hello, Guest!"

// List pattern matching
def describeList(list: List[Int]): String = list match
  case Nil => "empty list"
  case head :: Nil => s"single element: $head"
  case head :: tail => s"head: $head, tail has ${tail.length} elements"

// Sealed traits for exhaustive matching
sealed trait PaymentMethod
case class CreditCard(number: String, expiry: String) extends PaymentMethod
case class PayPal(email: String) extends PaymentMethod
case class BankTransfer(iban: String) extends PaymentMethod

def processPayment(method: PaymentMethod): String = method match
  case CreditCard(number, _) => s"Charging card ending in ${number.takeRight(4)}"
  case PayPal(email) => s"Redirecting to PayPal for $email"
  case BankTransfer(iban) => s"Bank transfer to $iban"
  // Compiler warns if a case is missing
```

### Option, Either, and Try

```scala
import scala.util.{Try, Success, Failure}

// Option - represents optional values
def findUser(id: Long): Option[User] =
  if id > 0 then Some(User(id, "John", "john@example.com"))
  else None

// Working with Option
val user = findUser(1)
val name = user.map(_.name).getOrElse("Unknown")
val greeting = user.fold("No user")(u => s"Hello, ${u.name}")

// Option chaining
def findUserWithOrders(id: Long): Option[UserWithOrders] =
  for
    user <- findUser(id)
    orders <- findOrders(user.id)
  yield UserWithOrders(user, orders)

// Either - represents success or failure
def validateEmail(email: String): Either[String, String] =
  if email.contains("@") then Right(email)
  else Left("Invalid email format")

def validateAge(age: Int): Either[String, Int] =
  if age >= 18 then Right(age)
  else Left("Must be 18 or older")

// Chaining Either
def validateUser(email: String, age: Int): Either[String, ValidatedUser] =
  for
    validEmail <- validateEmail(email)
    validAge <- validateAge(age)
  yield ValidatedUser(validEmail, validAge)

// Try - for exception handling
def parseJson(json: String): Try[User] = Try {
  // Parsing logic that might throw
  Json.parse(json).as[User]
}

val result = parseJson(jsonString) match
  case Success(user) => s"Parsed user: ${user.name}"
  case Failure(ex) => s"Parse failed: ${ex.getMessage}"

// Converting between types
val optionFromTry: Option[User] = parseJson(json).toOption
val eitherFromTry: Either[Throwable, User] = parseJson(json).toEither
```

## Play Framework

Play is a high-velocity web framework for Scala and Java, designed for building scalable web applications with a focus on developer productivity.

### Setting Up Play

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

### Controllers

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
      case None => NotFound(Json.obj("error" -> "User not found"))
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
          "error" -> "Invalid request",
          "details" -> JsError.toJson(errors)
        )))
  }

  // PUT /users/:id
  def update(id: Long): Action[JsValue] = Action.async(parse.json) { request =>
    request.body.validate[UpdateUserRequest] match
      case JsSuccess(updateRequest, _) =>
        userService.update(id, updateRequest).map {
          case Some(user) => Ok(Json.toJson(user))
          case None => NotFound(Json.obj("error" -> "User not found"))
        }
      case JsError(errors) =>
        Future.successful(BadRequest(Json.obj("error" -> "Invalid request")))
  }

  // DELETE /users/:id
  def delete(id: Long): Action[AnyContent] = Action.async {
    userService.delete(id).map { deleted =>
      if deleted then NoContent
      else NotFound(Json.obj("error" -> "User not found"))
    }
  }
```

### Routes Configuration

```
# conf/routes

# User endpoints
GET     /users              controllers.UserController.list()
GET     /users/:id          controllers.UserController.get(id: Long)
POST    /users              controllers.UserController.create()
PUT     /users/:id          controllers.UserController.update(id: Long)
DELETE  /users/:id          controllers.UserController.delete(id: Long)

# Health check
GET     /health             controllers.HealthController.check()

# Static files
GET     /assets/*file       controllers.Assets.versioned(path="/public", file: Asset)
```

### Models and JSON

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

// Custom JSON serialization
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

### Services

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
    // Use BCrypt in production
    java.util.Base64.getEncoder.encodeToString(password.getBytes)
```

### Action Composition

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
            Future.successful(Results.Unauthorized("Invalid token"))
        }
      case _ =>
        Future.successful(Results.Unauthorized("Missing authorization"))

// Usage in controller
@Singleton
class SecureController @Inject()(
  cc: ControllerComponents,
  authenticatedAction: AuthenticatedAction
) extends AbstractController(cc):

  def secureEndpoint(): Action[AnyContent] = authenticatedAction { request =>
    Ok(s"Hello user ${request.userId} with role ${request.userRole}")
  }

  def adminOnly(): Action[AnyContent] = authenticatedAction { request =>
    if request.userRole == "admin" then
      Ok("Admin content")
    else
      Forbidden("Admin access required")
  }
```

### Configuration

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

# Database configuration
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

# Application settings
app {
  jwt {
    secret = ${?JWT_SECRET}
    expiration = 24 hours
  }
}
```

## Akka Actors

Akka provides a powerful toolkit for building concurrent, distributed, and fault-tolerant applications using the Actor model.

### Actor Basics

```scala
import akka.actor.typed.{ActorRef, ActorSystem, Behavior}
import akka.actor.typed.scaladsl.{AbstractBehavior, ActorContext, Behaviors}

// Define messages
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
        context.log.info(s"Incrementing from $count")
        Counter(context, count + 1)

      case Decrement =>
        context.log.info(s"Decrementing from $count")
        Counter(context, count - 1)

      case GetValue(replyTo) =>
        replyTo ! Value(count)
        Behaviors.same
    }

// Usage
@main def runCounter(): Unit =
  val system = ActorSystem(Counter(), "counter-system")

  system ! Counter.Increment
  system ! Counter.Increment
  system ! Counter.Decrement

  // For request-response pattern, use ask pattern
  import akka.actor.typed.scaladsl.AskPattern._
  import scala.concurrent.duration._

  given akka.util.Timeout = 3.seconds
  given scala.concurrent.ExecutionContext = system.executionContext

  val futureValue = system.ask(Counter.GetValue.apply)
  futureValue.foreach(v => println(s"Count: ${v.count}"))
```

### Actor Hierarchy and Supervision

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
          context.log.warn(s"Worker ${ref.path.name} terminated")
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
          context.log.info(s"Processing: $data")
          // Simulate work
          val result = data.toUpperCase
          replyTo ! Result(result)
          Behaviors.same

        case Stop =>
          Behaviors.stopped
    }
```

### Actor Patterns

```scala
import akka.actor.typed.receptionist.{Receptionist, ServiceKey}
import akka.actor.typed.scaladsl.{Behaviors, Routers}
import akka.actor.typed.{ActorRef, Behavior, DispatcherSelector}

// Service discovery with Receptionist
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
          // Execute query
          replyTo ! QueryResult(List.empty)
          Behaviors.same
      }
    }

// Client discovering the service
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
      println(s"Query returned ${result.rows.size} rows")
      Behaviors.stopped
    }

// Router for load balancing
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

  // Basic stream
  val source: Source[Int, NotUsed] = Source(1 to 100)
  val flow: Flow[Int, Int, NotUsed] = Flow[Int].map(_ * 2)
  val sink: Sink[Int, Future[Done]] = Sink.foreach(println)

  val result: Future[Done] = source.via(flow).runWith(sink)

  // Complex processing pipeline
  def processOrders(orders: Source[Order, NotUsed]): Future[Seq[ProcessedOrder]] =
    orders
      .filter(_.amount > 0)
      .mapAsync(4)(validateOrder)           // Parallel validation
      .mapAsync(2)(processPayment)          // Less parallelism for payments
      .buffer(100, OverflowStrategy.backpressure)
      .map(enrichOrder)
      .recover {
        case ex: PaymentException =>
          ProcessedOrder.failed(ex.orderId, ex.getMessage)
      }
      .runWith(Sink.seq)

  // Backpressure handling
  val throttledSource = Source(1 to 1000)
    .throttle(100, 1.second)  // 100 elements per second
    .buffer(50, OverflowStrategy.dropHead)

  // Merging streams
  val source1 = Source(1 to 10)
  val source2 = Source(11 to 20)
  val merged = source1.merge(source2)

  // Broadcast to multiple sinks
  val broadcastGraph = Source(1 to 100)
    .alsoTo(Sink.foreach(n => println(s"Logger: $n")))
    .alsoTo(Sink.foreach(n => metrics.record(n)))
    .to(Sink.foreach(n => database.save(n)))

  // Custom graph
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

## Functional Programming Patterns

### Monads and For-Comprehensions

```scala
import scala.concurrent.{ExecutionContext, Future}

// For-comprehension with Option
def getUserAddress(userId: Long): Option[String] =
  for
    user <- findUser(userId)
    address <- user.address
    city <- address.city
  yield s"${address.street}, $city"

// For-comprehension with Future
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

// For-comprehension with Either
def validateAndProcess(request: Request): Either[ValidationError, Result] =
  for
    email <- validateEmail(request.email)
    age <- validateAge(request.age)
    address <- validateAddress(request.address)
    result <- process(email, age, address)
  yield result
```

### Type Classes

```scala
// Define a type class
trait JsonEncoder[A]:
  def encode(value: A): String

  extension (value: A)
    def toJson: String = encode(value)

// Type class instances
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

// Derive instances for case classes
case class Person(name: String, age: Int)

given JsonEncoder[Person] with
  def encode(p: Person): String =
    s"""{"name":${p.name.toJson},"age":${p.age.toJson}}"""

// Usage
val person = Person("Alice", 30)
println(person.toJson)  // {"name":"Alice","age":30}
```

### Applicative Validation

```scala
// Validated type for accumulating errors
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

  // Applicative combination - accumulates all errors
  def mapN[E, A, B, C](
    va: Validated[E, A],
    vb: Validated[E, B]
  )(f: (A, B) => C): Validated[E, C] = (va, vb) match
    case (Valid(a), Valid(b)) => Valid(f(a, b))
    case (Invalid(e1), Invalid(e2)) => Invalid(e1 ++ e2)
    case (Invalid(e), _) => Invalid(e)
    case (_, Invalid(e)) => Invalid(e)

// Usage
case class Registration(email: String, age: Int, username: String)

def validateEmail(email: String): Validated[String, String] =
  if email.contains("@") then Validated.valid(email)
  else Validated.invalid("Invalid email format")

def validateAge(age: Int): Validated[String, Int] =
  if age >= 18 then Validated.valid(age)
  else Validated.invalid("Must be at least 18")

def validateUsername(name: String): Validated[String, String] =
  if name.length >= 3 then Validated.valid(name)
  else Validated.invalid("Username too short")

def validateRegistration(
  email: String,
  age: Int,
  username: String
): Validated[String, Registration] =
  val vEmail = validateEmail(email)
  val vAge = validateAge(age)
  val vUsername = validateUsername(username)

  // This would accumulate all validation errors
  Validated.mapN(vEmail, Validated.mapN(vAge, vUsername)((a, u) => (a, u))) {
    case (e, (a, u)) => Registration(e, a, u)
  }
```

## Cats Effect

Cats Effect is a pure functional runtime for Scala, providing powerful abstractions for side effects.

### IO Basics

```scala
import cats.effect._
import cats.effect.std.Console
import cats.syntax.all._
import scala.concurrent.duration._

object CatsEffectBasics extends IOApp.Simple:

  // Pure values wrapped in IO
  val pureIO: IO[Int] = IO.pure(42)

  // Suspended side effects
  val suspendedIO: IO[Unit] = IO.println("Hello, World!")

  // Combining IOs
  val combinedIO: IO[Unit] = for
    _ <- IO.println("What's your name?")
    name <- IO.readLine
    _ <- IO.println(s"Hello, $name!")
  yield ()

  // Error handling
  val failingIO: IO[Int] = IO.raiseError(new RuntimeException("Oops!"))

  val recoveredIO: IO[Int] = failingIO.handleErrorWith { error =>
    IO.println(s"Error: ${error.getMessage}") *> IO.pure(-1)
  }

  // Timing and delays
  val delayedIO: IO[Unit] = IO.sleep(1.second) *> IO.println("Delayed!")

  // Resource safety
  def readFile(path: String): IO[String] =
    Resource
      .fromAutoCloseable(IO(scala.io.Source.fromFile(path)))
      .use(source => IO(source.mkString))

  def run: IO[Unit] = combinedIO
```

### Concurrent Programming

```scala
import cats.effect._
import cats.effect.std.{Queue, Semaphore, Supervisor}
import cats.syntax.all._
import scala.concurrent.duration._

object ConcurrencyExamples extends IOApp.Simple:

  // Parallel execution
  def fetchData: IO[(User, Orders, Recommendations)] =
    (fetchUser, fetchOrders, fetchRecommendations).parTupled

  // Racing computations
  def fetchWithTimeout[A](io: IO[A], timeout: FiniteDuration): IO[A] =
    IO.race(io, IO.sleep(timeout)).flatMap {
      case Left(result) => IO.pure(result)
      case Right(_) => IO.raiseError(new TimeoutException)
    }

  // Fiber-based concurrency
  def backgroundProcess: IO[Unit] =
    for
      fiber <- longRunningTask.start
      _ <- IO.println("Task started in background")
      _ <- IO.sleep(5.seconds)
      _ <- fiber.cancel
    yield ()

  // Producer-consumer with Queue
  def producerConsumer: IO[Unit] =
    for
      queue <- Queue.bounded[IO, Int](100)
      producer = Stream.iterate(0)(_ + 1)
        .through(n => queue.offer(n) *> IO.sleep(100.millis))
        .compile.drain
      consumer = Stream.repeatAction(queue.take)
        .through(n => IO.println(s"Consumed: $n"))
        .compile.drain
      _ <- (producer, consumer).parTupled.void
    yield ()

  // Rate limiting with Semaphore
  def rateLimitedRequests(urls: List[String]): IO[List[Response]] =
    for
      semaphore <- Semaphore[IO](10)  // Max 10 concurrent requests
      results <- urls.parTraverse { url =>
        semaphore.permit.use(_ => fetchUrl(url))
      }
    yield results

  def run: IO[Unit] = producerConsumer
```

### Resource Management

```scala
import cats.effect._
import cats.effect.std.Dispatcher
import cats.syntax.all._

object ResourceManagement:

  // Basic resource
  def databaseConnection(config: DbConfig): Resource[IO, Connection] =
    Resource.make(
      acquire = IO.println("Opening connection") *> openConnection(config)
    )(
      release = conn => IO.println("Closing connection") *> conn.close
    )

  // Combining resources
  def appResources(config: AppConfig): Resource[IO, AppResources] =
    for
      db <- databaseConnection(config.database)
      redis <- redisConnection(config.redis)
      http <- httpClient
      _ <- Resource.unit[IO].onFinalize(IO.println("All resources acquired"))
    yield AppResources(db, redis, http)

  // Using resources
  def runApp(config: AppConfig): IO[Unit] =
    appResources(config).use { resources =>
      // Resources are available here
      val server = HttpServer(resources)
      server.run
    }

  // Resource with finalizer for both success and error
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

ZIO is another powerful effect system for Scala, known for its excellent error handling and dependency injection.

### ZIO Basics

```scala
import zio._
import zio.Console._
import zio.Duration._

object ZIOBasics extends ZIOAppDefault:

  // ZIO[R, E, A] - requires R, may fail with E, succeeds with A
  val greet: ZIO[Any, Nothing, Unit] =
    Console.printLine("Hello, ZIO!").orDie

  // Error handling
  val failing: ZIO[Any, String, Int] = ZIO.fail("Something went wrong")

  val recovered: ZIO[Any, Nothing, Int] = failing.catchAll { error =>
    Console.printLine(s"Error: $error").orDie *> ZIO.succeed(-1)
  }

  // For-comprehension
  val program: ZIO[Any, java.io.IOException, Unit] =
    for
      _ <- Console.printLine("What's your name?")
      name <- Console.readLine
      _ <- Console.printLine(s"Hello, $name!")
    yield ()

  // Parallel execution
  def fetchAll: ZIO[Any, Throwable, (User, Orders)] =
    fetchUser.zipPar(fetchOrders)

  // Racing
  def raceWithTimeout[R, E, A](
    zio: ZIO[R, E, A],
    timeout: Duration
  ): ZIO[R, Option[E], A] =
    zio.mapError(Some(_)).race(ZIO.sleep(timeout) *> ZIO.fail(None))

  def run = program.exitCode
```

### ZIO Layers (Dependency Injection)

```scala
import zio._

// Service definition
trait UserRepository:
  def findById(id: Long): Task[Option[User]]
  def save(user: User): Task[User]

object UserRepository:
  // Accessor methods
  def findById(id: Long): ZIO[UserRepository, Throwable, Option[User]] =
    ZIO.serviceWithZIO(_.findById(id))

  def save(user: User): ZIO[UserRepository, Throwable, User] =
    ZIO.serviceWithZIO(_.save(user))

// Implementation
case class UserRepositoryLive(db: Database) extends UserRepository:
  def findById(id: Long): Task[Option[User]] =
    db.query(s"SELECT * FROM users WHERE id = $id").map(_.headOption)

  def save(user: User): Task[User] =
    db.execute(s"INSERT INTO users ...").as(user)

object UserRepositoryLive:
  val layer: ZLayer[Database, Nothing, UserRepository] =
    ZLayer.fromFunction(UserRepositoryLive.apply)

// Service that depends on UserRepository
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

// Composing layers
object MainApp extends ZIOAppDefault:
  val appLayer: ZLayer[Any, Throwable, UserService] =
    Database.live >>> UserRepositoryLive.layer >>> UserServiceLive.layer

  val program: ZIO[UserService, Throwable, Unit] =
    for
      user <- ZIO.serviceWithZIO[UserService](_.getUser(1))
      _ <- Console.printLine(s"Found user: ${user.name}")
    yield ()

  def run = program.provide(appLayer)
```

### ZIO Streams

```scala
import zio._
import zio.stream._

object ZIOStreams:

  // Creating streams
  val numbers: ZStream[Any, Nothing, Int] = ZStream.fromIterable(1 to 100)
  val infinite: ZStream[Any, Nothing, Int] = ZStream.iterate(0)(_ + 1)

  // Transforming streams
  val doubled: ZStream[Any, Nothing, Int] =
    numbers.map(_ * 2)

  val filtered: ZStream[Any, Nothing, Int] =
    numbers.filter(_ % 2 == 0)

  // Effectful streams
  def fetchPages(urls: List[String]): ZStream[Any, Throwable, Page] =
    ZStream.fromIterable(urls)
      .mapZIOPar(4)(url => fetchPage(url))

  // Chunked processing
  val batched: ZStream[Any, Nothing, Chunk[Int]] =
    numbers.grouped(10)

  // Sink for collecting results
  val sumSink: ZSink[Any, Nothing, Int, Nothing, Int] =
    ZSink.sum[Int]

  // Running streams
  val runStream: ZIO[Any, Nothing, Int] =
    numbers.run(sumSink)

  // Stream with resource management
  def processFile(path: String): ZStream[Any, Throwable, String] =
    ZStream.fromFile(java.nio.file.Path.of(path))
      .via(ZPipeline.utf8Decode >>> ZPipeline.splitLines)

  // Merge streams
  val merged: ZStream[Any, Nothing, Int] =
    ZStream(1, 2, 3).merge(ZStream(4, 5, 6))
```

## Building Reactive Systems

### Event Sourcing with Akka Persistence

```scala
import akka.actor.typed.{ActorRef, Behavior}
import akka.actor.typed.scaladsl.Behaviors
import akka.persistence.typed.PersistenceId
import akka.persistence.typed.scaladsl.{Effect, EventSourcedBehavior}

object BankAccount:
  // Commands
  sealed trait Command
  case class Deposit(amount: BigDecimal, replyTo: ActorRef[Response]) extends Command
  case class Withdraw(amount: BigDecimal, replyTo: ActorRef[Response]) extends Command
  case class GetBalance(replyTo: ActorRef[Balance]) extends Command

  // Events
  sealed trait Event
  case class Deposited(amount: BigDecimal) extends Event
  case class Withdrawn(amount: BigDecimal) extends Event

  // State
  case class State(balance: BigDecimal):
    def deposit(amount: BigDecimal): State = copy(balance = balance + amount)
    def withdraw(amount: BigDecimal): State = copy(balance = balance - amount)
    def canWithdraw(amount: BigDecimal): Boolean = balance >= amount

  // Responses
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
          Effect.reply(replyTo)(Failure("Insufficient funds"))

      case GetBalance(replyTo) =>
        Effect.reply(replyTo)(Balance(state.balance))

  private val eventHandler: (State, Event) => State =
    (state, event) => event match
      case Deposited(amount) => state.deposit(amount)
      case Withdrawn(amount) => state.withdraw(amount)
```

### CQRS Pattern

```scala
import cats.effect._
import cats.syntax.all._

// Commands
sealed trait OrderCommand
case class CreateOrder(customerId: Long, items: List[OrderItem]) extends OrderCommand
case class AddItem(orderId: Long, item: OrderItem) extends OrderCommand
case class SubmitOrder(orderId: Long) extends OrderCommand

// Events
sealed trait OrderEvent
case class OrderCreated(orderId: Long, customerId: Long, items: List[OrderItem]) extends OrderEvent
case class ItemAdded(orderId: Long, item: OrderItem) extends OrderEvent
case class OrderSubmitted(orderId: Long, submittedAt: java.time.Instant) extends OrderEvent

// Command Handler (Write Side)
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

// Query Model (Read Side)
class OrderProjection(orderRepository: OrderReadRepository):
  def handle(event: OrderEvent): IO[Unit] = event match
    case OrderCreated(orderId, customerId, items) =>
      orderRepository.insert(OrderView(orderId, customerId, items, "DRAFT"))

    case ItemAdded(orderId, item) =>
      orderRepository.addItem(orderId, item)

    case OrderSubmitted(orderId, submittedAt) =>
      orderRepository.updateStatus(orderId, "SUBMITTED", submittedAt)

// Query Service
class OrderQueryService(orderRepository: OrderReadRepository):
  def getOrder(orderId: Long): IO[Option[OrderView]] =
    orderRepository.findById(orderId)

  def getOrdersByCustomer(customerId: Long): IO[List[OrderView]] =
    orderRepository.findByCustomer(customerId)

  def getPendingOrders(): IO[List[OrderView]] =
    orderRepository.findByStatus("DRAFT")
```

### Reactive HTTP with http4s

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

  // Middleware
  def loggingMiddleware(routes: HttpRoutes[IO]): HttpRoutes[IO] =
    HttpRoutes { req =>
      for
        _ <- OptionT.liftF(IO.println(s"Request: ${req.method} ${req.uri}"))
        start <- OptionT.liftF(IO.realTime)
        response <- routes(req)
        end <- OptionT.liftF(IO.realTime)
        _ <- OptionT.liftF(IO.println(s"Response: ${response.status} (${(end - start).toMillis}ms)"))
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

## Testing

### ScalaTest

```scala
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.time.{Millis, Seconds, Span}

class UserServiceSpec extends AnyFlatSpec with Matchers with ScalaFutures:

  implicit val patience: PatienceConfig =
    PatienceConfig(timeout = Span(5, Seconds), interval = Span(100, Millis))

  "UserService" should "create a new user" in {
    val repository = new InMemoryUserRepository()
    val service = new UserService(repository)

    val request = CreateUserRequest("John", "john@example.com", "password")
    val result = service.create(request).futureValue

    result.name shouldBe "John"
    result.email shouldBe "john@example.com"
    result.id should be > 0L
  }

  it should "find user by id" in {
    val repository = new InMemoryUserRepository()
    val service = new UserService(repository)

    val created = service.create(CreateUserRequest("Jane", "jane@example.com", "pass")).futureValue
    val found = service.findById(created.id).futureValue

    found shouldBe defined
    found.get.name shouldBe "Jane"
  }

  it should "return None for non-existent user" in {
    val repository = new InMemoryUserRepository()
    val service = new UserService(repository)

    val result = service.findById(999L).futureValue

    result shouldBe None
  }

  it should "fail when creating user with duplicate email" in {
    val repository = new InMemoryUserRepository()
    val service = new UserService(repository)

    service.create(CreateUserRequest("User1", "same@example.com", "pass")).futureValue

    val result = service.create(CreateUserRequest("User2", "same@example.com", "pass"))

    whenReady(result.failed) { ex =>
      ex shouldBe a[DuplicateEmailException]
    }
  }
```

### Property-Based Testing with ScalaCheck

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
    Gen.alphaNumStr,                    // No @
    Gen.const(""),                       // Empty
    Gen.alphaNumStr.map(_ + "@"),       // No domain
    Gen.alphaNumStr.map("@" + _)        // No user
  )

  property("valid emails pass validation") = forAll(emailGen) { email =>
    validateEmail(email).isRight
  }

  property("invalid emails fail validation") = forAll(invalidEmailGen) { email =>
    validateEmail(email).isLeft
  }

  val positiveInt: Gen[Int] = Gen.posNum[Int]
  val negativeInt: Gen[Int] = Gen.negNum[Int]

  property("positive ages pass validation") = forAll(positiveInt.suchThat(_ >= 18)) { age =>
    validateAge(age).isRight
  }

  property("ages under 18 fail validation") = forAll(Gen.choose(0, 17)) { age =>
    validateAge(age).isLeft
  }

  property("user creation is idempotent for same input") = forAll(emailGen, Gen.alphaStr) {
    (email, name) =>
      val result1 = User.create(name, email)
      val result2 = User.create(name, email)
      (result1, result2) match
        case (Right(u1), Right(u2)) => u1.name == u2.name && u1.email == u2.email
        case (Left(_), Left(_)) => true
        case _ => false
  }
```

### Testing with Cats Effect

```scala
import cats.effect._
import cats.effect.testing.scalatest.AsyncIOSpec
import org.scalatest.freespec.AsyncFreeSpec
import org.scalatest.matchers.should.Matchers

class UserServiceIOSpec extends AsyncFreeSpec with AsyncIOSpec with Matchers:

  "UserService" - {
    "should create a user" in {
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

    "should handle concurrent creates safely" in {
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

// Test helpers
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

## Best Practices

### Code Organization

```
src/main/scala/com/example/
├── domain/           # Domain models and business logic
│   ├── models/       # Case classes, enums
│   ├── services/     # Domain services
│   └── errors/       # Domain errors
├── application/      # Application services
│   ├── commands/     # Command handlers
│   └── queries/      # Query handlers
├── infrastructure/   # External integrations
│   ├── persistence/  # Database repositories
│   ├── http/         # HTTP clients
│   └── messaging/    # Message queue clients
├── api/              # API layer
│   ├── routes/       # HTTP routes
│   ├── dto/          # Request/response DTOs
│   └── middleware/   # HTTP middleware
└── config/           # Configuration
```

### Error Handling Guidelines

```scala
// Define domain errors as sealed traits
sealed trait DomainError extends Throwable
case class UserNotFound(id: Long) extends DomainError
case class InvalidEmail(email: String) extends DomainError
case class DuplicateEmail(email: String) extends DomainError

// Use Either for recoverable errors
def validateUser(request: CreateUserRequest): Either[DomainError, ValidatedUser] =
  for
    email <- validateEmail(request.email).leftMap(_ => InvalidEmail(request.email))
    name <- validateName(request.name)
  yield ValidatedUser(name, email)

// Convert to HTTP responses
def handleError(error: DomainError): Response = error match
  case UserNotFound(id) => Response.notFound(s"User $id not found")
  case InvalidEmail(email) => Response.badRequest(s"Invalid email: $email")
  case DuplicateEmail(email) => Response.conflict(s"Email already exists: $email")
```

### Performance Tips

1. **Use immutable collections wisely**:
```scala
// Use Vector for random access
val vector = Vector(1, 2, 3, 4, 5)

// Use List for prepend-heavy operations
val list = 1 :: 2 :: 3 :: Nil

// Use Set for membership testing
val set = Set("a", "b", "c")
```

2. **Lazy computation for expensive operations**:
```scala
lazy val expensiveValue = computeExpensively()

// LazyList for infinite sequences
val naturals = LazyList.from(0)
```

3. **Parallel collections for CPU-bound work**:
```scala
import scala.collection.parallel.CollectionConverters._

val results = data.par.map(heavyComputation).toList
```

4. **Use streaming for large data**:
```scala
// fs2 Stream for memory-efficient processing
fs2.Stream.emits(largeData)
  .chunkN(1000)
  .parEvalMapUnordered(4)(processChunk)
  .compile.toList
```

## Interview Questions

### Common Questions

**1. What is the difference between val, var, and def?**

- `val`: Immutable value, computed once at definition
- `var`: Mutable variable, can be reassigned
- `def`: Method, computed each time it is called

**2. Explain pattern matching in Scala.**

Pattern matching is a mechanism for checking values against patterns. It is more powerful than switch statements, supporting destructuring, guards, type matching, and exhaustiveness checking with sealed traits.

**3. What are case classes and why use them?**

Case classes are special classes that:
- Generate equals, hashCode, and toString automatically
- Support pattern matching
- Are immutable by default
- Have a copy method for creating modified copies
- Do not require `new` keyword for instantiation

**4. What is a monad? Give examples in Scala.**

A monad is a type constructor with `flatMap` and `pure` operations that follow certain laws (left identity, right identity, associativity). Examples: Option, Either, Future, List, IO.

**5. Explain the Actor model in Akka.**

The Actor model is a concurrency paradigm where actors are isolated units that communicate only through asynchronous messages. Each actor has a mailbox, processes one message at a time, and can create child actors, creating a supervision hierarchy.

**6. What is referential transparency?**

An expression is referentially transparent if it can be replaced with its value without changing program behavior. This is fundamental to functional programming and enables equational reasoning.

## Further Reading

### Official Resources

- [Scala Documentation](https://docs.scala-lang.org/)
- [Play Framework Documentation](https://www.playframework.com/documentation)
- [Akka Documentation](https://doc.akka.io/)
- [Cats Effect Documentation](https://typelevel.org/cats-effect/)
- [ZIO Documentation](https://zio.dev/)

### Recommended Learning Path

1. **Basics**: Scala syntax, collections, pattern matching, case classes
2. **Intermediate**: Type classes, implicits/givens, higher-order functions
3. **Advanced**: Cats/Cats Effect, Akka actors, effect systems
4. **Expert**: Category theory concepts, advanced type system features

### Related Technologies

- **Apache Spark**: Distributed data processing
- **Apache Kafka**: Event streaming platform
- **Slick**: Functional-relational mapping
- **Doobie**: Pure functional JDBC layer
- **http4s**: Typeful HTTP on Scala

---

Scala's combination of object-oriented and functional programming paradigms, along with its powerful type system and ecosystem of libraries, makes it an excellent choice for building robust, scalable backend systems. Whether you are building microservices with Play Framework, implementing event-driven systems with Akka, or leveraging pure functional programming with Cats Effect or ZIO, Scala provides the tools and abstractions needed to tackle complex backend challenges while maintaining code quality and type safety.
