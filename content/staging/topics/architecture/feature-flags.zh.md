---
title: 功能开关
description: 学习功能开关实现渐进式发布
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - 功能开关
  - 特性标志
  - 发布
  - 灰度
status: imported
origin: old/src/content/docs/architecture/feature-flags.zh.md
divergence: 0.349
issues: []
legacy:
  category: Architecture
  subcategory: Patterns
  order: 27
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是功能开关

功能开关（Feature Flags），也称为特性标志（Feature Toggles）或功能切换，是一种软件开发技术，允许团队在不部署新代码的情况下动态地启用或禁用应用程序的功能。通过在代码中添加条件判断，开发团队可以控制哪些用户能够看到哪些功能。

```
┌─────────────────────────────────────────────────────────────┐
│                     功能开关工作原理                          │
│                                                             │
│   用户请求          功能开关服务          应用程序             │
│      │                  │                   │               │
│      │── 请求功能 ──→   │                   │               │
│      │                  │                   │               │
│      │                  │ ← 查询开关状态 ── │               │
│      │                  │                   │               │
│      │                  │ ── 返回状态 ──→   │               │
│      │                  │   (enabled/disabled)              │
│      │                  │                   │               │
│      │                  │                   │ 条件判断       │
│      │                  │                   │   │           │
│      │                  │                   │   ▼           │
│      │           ┌──────────────────────────────┐           │
│      │           │  if (featureEnabled) {       │           │
│      │           │    // 新功能代码              │           │
│      │           │  } else {                    │           │
│      │           │    // 旧功能代码              │           │
│      │           │  }                           │           │
│      │           └──────────────────────────────┘           │
│      │                                                      │
│      │ ← ─────────── 返回相应结果 ────────────────           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 为什么需要功能开关

在现代软件开发中，功能开关解决了多个关键问题：

1. **持续集成与持续部署**：允许未完成的功能代码合并到主分支，而不影响生产环境
2. **降低发布风险**：可以快速关闭有问题的功能，无需回滚部署
3. **渐进式发布**：逐步向用户群体推出新功能，控制爆炸半径
4. **A/B 测试**：为不同用户群体提供不同的功能版本，收集数据做出决策
5. **运维控制**：在系统负载过高时临时关闭非核心功能

```
┌─────────────────────────────────────────────────────────────┐
│                  传统发布 vs 功能开关发布                      │
│                                                             │
│  传统发布流程：                                               │
│  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐      │
│  │ 开发   │ ─→ │ 测试   │ ─→ │ 部署   │ ─→ │ 全量上线│      │
│  └────────┘    └────────┘    └────────┘    └────────┘      │
│       │                                         │           │
│       └──────── 出问题需要回滚部署 ──────────────┘           │
│                                                             │
│  功能开关发布流程：                                            │
│  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐      │
│  │ 开发   │ ─→ │ 测试   │ ─→ │ 部署   │ ─→ │灰度发布 │      │
│  └────────┘    └────────┘    └────────┘    └────────┘      │
│                                                   │          │
│                                            ┌──────▼──────┐   │
│                                            │ 1% → 10%    │   │
│                                            │ → 50% → 100%│   │
│                                            └─────────────┘   │
│       │                                          │           │
│       └──────── 出问题只需关闭开关 ───────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 功能开关的类型

根据使用场景和生命周期，功能开关可以分为以下几种类型：

### 发布开关（Release Toggles）

用于控制未完成或未经验证功能的可见性，通常是短期的。

```java
// 发布开关示例
@Service
public class CheckoutService {

    private final FeatureFlagService featureFlags;

    public CheckoutResult checkout(Cart cart) {
        if (featureFlags.isEnabled("new-payment-flow")) {
            // 新的支付流程（正在开发中）
            return newPaymentProcessor.process(cart);
        } else {
            // 当前稳定的支付流程
            return legacyPaymentProcessor.process(cart);
        }
    }
}
```

**特点**：
- 生命周期：短期（数天到数周）
- 动态性：通常静态配置
- 决策者：开发/运维团队
- 使用后应及时清理

### 实验开关（Experiment Toggles）

用于 A/B 测试，根据用户特征将用户分配到不同的实验组。

```java
// 实验开关示例
@Service
public class RecommendationService {

    private final ExperimentService experimentService;

    public List<Product> getRecommendations(User user) {
        String variant = experimentService.getVariant("recommendation-algorithm", user);

        switch (variant) {
            case "control":
                // 对照组：使用现有算法
                return classicRecommender.recommend(user);
            case "variant-a":
                // 实验组A：基于协同过滤
                return collaborativeFilteringRecommender.recommend(user);
            case "variant-b":
                // 实验组B：基于深度学习
                return deepLearningRecommender.recommend(user);
            default:
                return classicRecommender.recommend(user);
        }
    }
}
```

**特点**：
- 生命周期：中期（数周到数月）
- 动态性：高度动态，需要用户分流
- 决策者：产品/数据团队
- 需要数据收集和分析能力

### 运维开关（Ops Toggles）

用于控制系统运维相关的功能，如降级、限流等。

```java
// 运维开关示例
@Service
public class OrderService {

    private final FeatureFlagService featureFlags;
    private final OrderRepository orderRepository;
    private final OrderCache orderCache;

    public Order getOrder(String orderId) {
        // 数据库压力大时启用缓存优先模式
        if (featureFlags.isEnabled("cache-first-mode")) {
            Order cached = orderCache.get(orderId);
            if (cached != null) {
                return cached;
            }
            // 缓存未命中时，检查是否允许查询数据库
            if (featureFlags.isEnabled("allow-db-fallback")) {
                return orderRepository.findById(orderId);
            }
            throw new ServiceDegradedException("服务降级中，请稍后重试");
        }

        return orderRepository.findById(orderId);
    }

    // 高负载时关闭非核心功能
    public OrderDetails getOrderDetails(String orderId) {
        Order order = getOrder(orderId);
        OrderDetails details = new OrderDetails(order);

        // 非核心功能：订单推荐
        if (featureFlags.isEnabled("order-recommendations")) {
            details.setRecommendations(getRecommendations(order));
        }

        // 非核心功能：物流追踪
        if (featureFlags.isEnabled("logistics-tracking")) {
            details.setLogisticsInfo(getLogisticsInfo(order));
        }

        return details;
    }
}
```

**特点**：
- 生命周期：长期存在
- 动态性：需要快速响应，毫秒级切换
- 决策者：运维/SRE 团队
- 通常需要与监控告警联动

### 权限开关（Permission Toggles）

用于控制特定用户或用户群体对功能的访问权限。

```java
// 权限开关示例
@Service
public class FeatureAccessService {

    private final FeatureFlagService featureFlags;

    public boolean canAccessFeature(User user, String featureName) {
        // 检查用户是否在 Beta 测试名单中
        if (featureFlags.isEnabledForUser("beta-features", user.getId())) {
            return true;
        }

        // 检查用户的订阅等级
        if (user.getSubscriptionTier() == SubscriptionTier.PREMIUM) {
            return featureFlags.isEnabledForTier(featureName, "premium");
        }

        // 检查用户所属组织是否有权限
        if (user.getOrganization() != null) {
            return featureFlags.isEnabledForOrg(featureName,
                user.getOrganization().getId());
        }

        return featureFlags.isEnabled(featureName);
    }
}
```

**特点**：
- 生命周期：长期或永久
- 动态性：基于用户属性动态判断
- 决策者：产品/商务团队
- 通常与用户订阅或权限系统集成

### 功能开关类型对比

```
┌─────────────────────────────────────────────────────────────┐
│                    功能开关类型对比                           │
│                                                             │
│  类型        生命周期    动态性    主要用途                    │
│  ─────────────────────────────────────────────────────────  │
│  发布开关    短期        低        控制功能发布               │
│  实验开关    中期        高        A/B 测试                  │
│  运维开关    长期        高        系统降级/限流              │
│  权限开关    长期        中        功能访问控制               │
│                                                             │
│                  复杂度和维护成本                             │
│                                                             │
│       发布开关 ──────────────────────────→ 运维开关          │
│           │                                   │             │
│           │         实验开关                   │             │
│           │             │                     │             │
│           ▼             ▼                     ▼             │
│         简单          中等                   复杂            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 实现策略

### 简单实现：配置文件

最基础的实现方式，适合小型项目或简单场景。

```java
// 基于配置文件的简单实现
@Configuration
@ConfigurationProperties(prefix = "features")
public class FeatureProperties {

    private Map<String, Boolean> flags = new HashMap<>();

    public Map<String, Boolean> getFlags() {
        return flags;
    }

    public void setFlags(Map<String, Boolean> flags) {
        this.flags = flags;
    }
}

@Service
public class SimpleFeatureFlagService {

    private final FeatureProperties properties;

    public boolean isEnabled(String featureName) {
        return properties.getFlags().getOrDefault(featureName, false);
    }
}
```

```yaml
# application.yml
features:
  flags:
    new-checkout: true
    dark-mode: false
    beta-dashboard: true
```

**优点**：
- 实现简单，无额外依赖
- 适合静态配置

**缺点**：
- 修改需要重启应用
- 不支持动态更新
- 不支持用户级别的控制

### 进阶实现：数据库存储

支持动态更新，适合需要运行时修改的场景。

```java
// 数据库存储实现
@Entity
@Table(name = "feature_flags")
public class FeatureFlag {

    @Id
    private String name;

    private boolean enabled;

    private String description;

    @Column(name = "enabled_percentage")
    private int enabledPercentage;  // 0-100

    @Column(name = "user_whitelist")
    private String userWhitelist;  // 逗号分隔的用户ID

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // getters and setters
}

@Repository
public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, String> {

    @Query("SELECT f FROM FeatureFlag f WHERE f.name = :name")
    Optional<FeatureFlag> findByName(@Param("name") String name);
}

@Service
public class DatabaseFeatureFlagService {

    private final FeatureFlagRepository repository;
    private final Cache<String, FeatureFlag> cache;

    public boolean isEnabled(String featureName) {
        FeatureFlag flag = getFlag(featureName);
        return flag != null && flag.isEnabled();
    }

    public boolean isEnabledForUser(String featureName, String userId) {
        FeatureFlag flag = getFlag(featureName);
        if (flag == null || !flag.isEnabled()) {
            return false;
        }

        // 检查白名单
        if (flag.getUserWhitelist() != null) {
            Set<String> whitelist = Set.of(flag.getUserWhitelist().split(","));
            if (whitelist.contains(userId)) {
                return true;
            }
        }

        // 基于百分比的灰度
        if (flag.getEnabledPercentage() > 0) {
            int hash = Math.abs(userId.hashCode() % 100);
            return hash < flag.getEnabledPercentage();
        }

        return true;
    }

    private FeatureFlag getFlag(String featureName) {
        // 先查缓存
        FeatureFlag cached = cache.getIfPresent(featureName);
        if (cached != null) {
            return cached;
        }

        // 缓存未命中，查数据库
        FeatureFlag flag = repository.findByName(featureName).orElse(null);
        if (flag != null) {
            cache.put(featureName, flag);
        }
        return flag;
    }

    // 刷新缓存
    @CacheEvict(value = "featureFlags", allEntries = true)
    public void refreshCache() {
        cache.invalidateAll();
    }
}
```

### 分布式实现：Redis 存储

适合分布式系统，支持快速读取和实时更新。

```java
// Redis 实现
@Service
public class RedisFeatureFlagService {

    private static final String FLAG_PREFIX = "feature:flag:";
    private static final String FLAG_RULES_PREFIX = "feature:rules:";

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public boolean isEnabled(String featureName) {
        String key = FLAG_PREFIX + featureName;
        Object value = redisTemplate.opsForValue().get(key);
        return Boolean.TRUE.equals(value);
    }

    public boolean isEnabledForUser(String featureName, User user) {
        // 检查全局开关
        if (!isEnabled(featureName)) {
            return false;
        }

        // 获取规则
        String rulesKey = FLAG_RULES_PREFIX + featureName;
        String rulesJson = (String) redisTemplate.opsForValue().get(rulesKey);

        if (rulesJson == null) {
            return true;  // 无规则时，全局开关决定
        }

        try {
            FeatureRules rules = objectMapper.readValue(rulesJson, FeatureRules.class);
            return evaluateRules(rules, user);
        } catch (JsonProcessingException e) {
            log.error("解析功能规则失败: {}", featureName, e);
            return false;
        }
    }

    private boolean evaluateRules(FeatureRules rules, User user) {
        // 白名单检查
        if (rules.getWhitelist() != null &&
            rules.getWhitelist().contains(user.getId())) {
            return true;
        }

        // 黑名单检查
        if (rules.getBlacklist() != null &&
            rules.getBlacklist().contains(user.getId())) {
            return false;
        }

        // 百分比灰度
        if (rules.getPercentage() != null) {
            int hash = Math.abs((user.getId() + rules.getSalt()).hashCode() % 100);
            return hash < rules.getPercentage();
        }

        // 属性匹配
        if (rules.getAttributes() != null) {
            return matchAttributes(rules.getAttributes(), user);
        }

        return true;
    }

    private boolean matchAttributes(Map<String, Object> attributes, User user) {
        for (Map.Entry<String, Object> entry : attributes.entrySet()) {
            String attr = entry.getKey();
            Object expected = entry.getValue();
            Object actual = getUserAttribute(user, attr);

            if (!Objects.equals(expected, actual)) {
                return false;
            }
        }
        return true;
    }

    // 设置功能开关
    public void setFlag(String featureName, boolean enabled) {
        String key = FLAG_PREFIX + featureName;
        redisTemplate.opsForValue().set(key, enabled);
    }

    // 设置规则
    public void setRules(String featureName, FeatureRules rules) {
        String key = FLAG_RULES_PREFIX + featureName;
        try {
            String json = objectMapper.writeValueAsString(rules);
            redisTemplate.opsForValue().set(key, json);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("序列化规则失败", e);
        }
    }
}

@Data
public class FeatureRules {
    private Set<String> whitelist;
    private Set<String> blacklist;
    private Integer percentage;
    private String salt;
    private Map<String, Object> attributes;
}
```

## LaunchDarkly 集成

LaunchDarkly 是业界领先的功能开关管理平台，提供企业级的功能开关服务。

### 基本配置

```xml
<!-- Maven 依赖 -->
<dependency>
    <groupId>com.launchdarkly</groupId>
    <artifactId>launchdarkly-java-server-sdk</artifactId>
    <version>7.0.0</version>
</dependency>
```

```java
// LaunchDarkly 客户端配置
@Configuration
public class LaunchDarklyConfig {

    @Value("${launchdarkly.sdk-key}")
    private String sdkKey;

    @Bean
    public LDClient ldClient() {
        LDConfig config = new LDConfig.Builder()
            .events(
                Components.sendEvents()
                    .flushInterval(Duration.ofSeconds(5))
            )
            .dataSource(
                Components.streamingDataSource()
                    .initialReconnectDelay(Duration.ofSeconds(1))
            )
            .build();

        return new LDClient(sdkKey, config);
    }

    @PreDestroy
    public void closeLdClient() throws IOException {
        ldClient().close();
    }
}
```

### 使用示例

```java
@Service
public class LaunchDarklyFeatureService {

    private final LDClient ldClient;

    // 简单布尔开关
    public boolean isEnabled(String featureKey, User user) {
        LDContext context = LDContext.builder(user.getId())
            .name(user.getName())
            .set("email", user.getEmail())
            .set("country", user.getCountry())
            .set("plan", user.getSubscriptionPlan())
            .build();

        return ldClient.boolVariation(featureKey, context, false);
    }

    // 多变体开关（用于 A/B 测试）
    public String getVariant(String featureKey, User user) {
        LDContext context = LDContext.builder(user.getId())
            .name(user.getName())
            .build();

        return ldClient.stringVariation(featureKey, context, "control");
    }

    // 获取 JSON 配置
    public JsonNode getFeatureConfig(String featureKey, User user) {
        LDContext context = LDContext.builder(user.getId()).build();

        LDValue value = ldClient.jsonValueVariation(featureKey, context,
            LDValue.ofNull());

        return convertToJsonNode(value);
    }

    // 数值变体（用于动态配置）
    public int getIntConfig(String featureKey, User user, int defaultValue) {
        LDContext context = LDContext.builder(user.getId()).build();
        return ldClient.intVariation(featureKey, context, defaultValue);
    }
}
```

### 高级用法：多上下文

```java
// 多上下文支持（用户 + 组织 + 设备）
public boolean isEnabledWithContext(String featureKey, User user,
        Organization org, Device device) {

    LDContext userContext = LDContext.builder(ContextKind.of("user"), user.getId())
        .name(user.getName())
        .set("email", user.getEmail())
        .set("plan", user.getSubscriptionPlan())
        .build();

    LDContext orgContext = LDContext.builder(ContextKind.of("organization"), org.getId())
        .name(org.getName())
        .set("industry", org.getIndustry())
        .set("size", org.getSize())
        .build();

    LDContext deviceContext = LDContext.builder(ContextKind.of("device"), device.getId())
        .set("platform", device.getPlatform())
        .set("version", device.getAppVersion())
        .build();

    LDContext multiContext = LDContext.createMulti(userContext, orgContext, deviceContext);

    return ldClient.boolVariation(featureKey, multiContext, false);
}
```

### 事件追踪

```java
// 追踪功能使用情况
@Service
public class FeatureTrackingService {

    private final LDClient ldClient;

    public void trackFeatureUsage(String featureKey, User user,
            Map<String, Object> metadata) {
        LDContext context = LDContext.builder(user.getId()).build();

        // 追踪自定义事件
        ldClient.track(featureKey + "-used", context,
            LDValue.buildObject()
                .put("timestamp", System.currentTimeMillis())
                .put("metadata", LDValue.parse(toJson(metadata)))
                .build()
        );
    }

    // 追踪转化事件
    public void trackConversion(String featureKey, User user, double value) {
        LDContext context = LDContext.builder(user.getId()).build();
        ldClient.track(featureKey + "-conversion", context, LDValue.of(value));
    }
}
```

## Unleash 集成

Unleash 是一个开源的功能开关管理平台，可以自托管部署。

### 基本配置

```xml
<!-- Maven 依赖 -->
<dependency>
    <groupId>io.getunleash</groupId>
    <artifactId>unleash-client-java</artifactId>
    <version>9.0.0</version>
</dependency>
```

```java
// Unleash 客户端配置
@Configuration
public class UnleashConfig {

    @Value("${unleash.api-url}")
    private String apiUrl;

    @Value("${unleash.api-key}")
    private String apiKey;

    @Value("${spring.application.name}")
    private String appName;

    @Bean
    public Unleash unleash() {
        UnleashConfig config = UnleashConfig.builder()
            .appName(appName)
            .instanceId(getInstanceId())
            .unleashAPI(apiUrl)
            .apiKey(apiKey)
            .synchronousFetchOnInitialisation(true)
            .fetchTogglesInterval(10)  // 每10秒同步一次
            .sendMetricsInterval(60)   // 每60秒发送指标
            .build();

        return new DefaultUnleash(config);
    }

    private String getInstanceId() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }
}
```

### 使用示例

```java
@Service
public class UnleashFeatureService {

    private final Unleash unleash;

    // 简单检查
    public boolean isEnabled(String featureName) {
        return unleash.isEnabled(featureName);
    }

    // 带上下文的检查
    public boolean isEnabledForUser(String featureName, User user) {
        UnleashContext context = UnleashContext.builder()
            .userId(user.getId())
            .sessionId(user.getSessionId())
            .remoteAddress(user.getIpAddress())
            .addProperty("email", user.getEmail())
            .addProperty("country", user.getCountry())
            .addProperty("plan", user.getSubscriptionPlan())
            .build();

        return unleash.isEnabled(featureName, context);
    }

    // 获取变体
    public Variant getVariant(String featureName, User user) {
        UnleashContext context = UnleashContext.builder()
            .userId(user.getId())
            .build();

        return unleash.getVariant(featureName, context);
    }
}
```

### 自定义策略

```java
// 自定义激活策略
public class SubscriptionStrategy implements Strategy {

    @Override
    public String getName() {
        return "subscription";
    }

    @Override
    public boolean isEnabled(Map<String, String> parameters,
            UnleashContext context, List<Constraint> constraints) {

        String requiredPlans = parameters.get("plans");
        if (requiredPlans == null) {
            return false;
        }

        String userPlan = context.getProperties().get("plan");
        if (userPlan == null) {
            return false;
        }

        Set<String> allowedPlans = Set.of(requiredPlans.split(","));
        return allowedPlans.contains(userPlan);
    }
}

// 注册自定义策略
@Bean
public Unleash unleash() {
    UnleashConfig config = UnleashConfig.builder()
        .appName(appName)
        .unleashAPI(apiUrl)
        .apiKey(apiKey)
        .build();

    return new DefaultUnleash(
        config,
        new SubscriptionStrategy(),
        new GeoLocationStrategy(),
        new TimeBasedStrategy()
    );
}
```

## 渐进式发布

### 金丝雀发布

```java
// 金丝雀发布实现
@Service
public class CanaryReleaseService {

    private final FeatureFlagService featureFlags;
    private final MetricsService metricsService;

    public <T> T executeWithCanary(String featureName, User user,
            Supplier<T> canaryVersion, Supplier<T> stableVersion) {

        // 检查是否在金丝雀组
        if (featureFlags.isEnabledForUser(featureName, user.getId())) {
            long startTime = System.currentTimeMillis();
            try {
                T result = canaryVersion.get();
                recordMetrics(featureName, "canary", "success",
                    System.currentTimeMillis() - startTime);
                return result;
            } catch (Exception e) {
                recordMetrics(featureName, "canary", "error",
                    System.currentTimeMillis() - startTime);
                log.error("金丝雀版本执行失败，回退到稳定版本", e);
                // 可选：自动关闭金丝雀
                // featureFlags.disable(featureName);
                return stableVersion.get();
            }
        } else {
            long startTime = System.currentTimeMillis();
            T result = stableVersion.get();
            recordMetrics(featureName, "stable", "success",
                System.currentTimeMillis() - startTime);
            return result;
        }
    }

    private void recordMetrics(String feature, String version,
            String outcome, long duration) {
        metricsService.recordTimer(
            "canary.execution",
            duration,
            "feature", feature,
            "version", version,
            "outcome", outcome
        );
    }
}
```

### 蓝绿部署配合

```java
// 蓝绿部署与功能开关结合
@Service
public class BlueGreenFeatureService {

    private final FeatureFlagService featureFlags;
    private final LoadBalancer loadBalancer;

    @Scheduled(fixedRate = 5000)
    public void checkAndSwitch() {
        // 检查功能开关状态，动态切换流量
        int bluePercentage = featureFlags.getIntValue("blue-green-ratio", 100);

        loadBalancer.setWeights(
            "blue", bluePercentage,
            "green", 100 - bluePercentage
        );

        log.info("流量分配更新: blue={}%, green={}%",
            bluePercentage, 100 - bluePercentage);
    }

    // 紧急回滚
    public void emergencyRollback() {
        featureFlags.setValue("blue-green-ratio", 100);
        loadBalancer.setWeights("blue", 100, "green", 0);
        log.warn("执行紧急回滚，所有流量切换到 blue 环境");
    }
}
```

### 环形发布

```java
// 环形发布策略
@Service
public class RingDeploymentService {

    private final FeatureFlagService featureFlags;

    public enum Ring {
        INTERNAL(0),     // 内部员工
        CANARY(1),       // 早期采用者
        EARLY_ADOPTER(2), // 10% 用户
        GENERAL(3);      // 所有用户

        private final int level;

        Ring(int level) {
            this.level = level;
        }
    }

    public boolean isEnabledForRing(String featureName, User user) {
        int currentRing = featureFlags.getIntValue(featureName + "-ring", 0);
        int userRing = getUserRing(user);

        return userRing <= currentRing;
    }

    private int getUserRing(User user) {
        // 内部员工
        if (user.isEmployee()) {
            return Ring.INTERNAL.level;
        }

        // 早期采用者（基于注册时间或标记）
        if (user.isEarlyAdopter()) {
            return Ring.CANARY.level;
        }

        // 基于用户ID哈希分配
        int hash = Math.abs(user.getId().hashCode() % 100);
        if (hash < 10) {
            return Ring.EARLY_ADOPTER.level;
        }

        return Ring.GENERAL.level;
    }

    // 推进到下一环
    public void advanceRing(String featureName) {
        int currentRing = featureFlags.getIntValue(featureName + "-ring", 0);
        if (currentRing < Ring.GENERAL.level) {
            featureFlags.setValue(featureName + "-ring", currentRing + 1);
            log.info("功能 {} 推进到环 {}", featureName, currentRing + 1);
        }
    }
}
```

## A/B 测试

### 实验框架

```java
// A/B 测试实验框架
@Service
public class ExperimentService {

    private final FeatureFlagService featureFlags;
    private final ExperimentRepository experimentRepository;
    private final AnalyticsService analyticsService;

    public ExperimentVariant assignVariant(String experimentId, User user) {
        Experiment experiment = experimentRepository.findById(experimentId)
            .orElseThrow(() -> new ExperimentNotFoundException(experimentId));

        if (!experiment.isActive()) {
            return experiment.getControlVariant();
        }

        // 检查用户是否已分配变体
        Optional<ExperimentAssignment> existingAssignment =
            experimentRepository.findAssignment(experimentId, user.getId());

        if (existingAssignment.isPresent()) {
            return existingAssignment.get().getVariant();
        }

        // 分配新变体
        ExperimentVariant variant = assignNewVariant(experiment, user);

        // 记录分配
        experimentRepository.saveAssignment(new ExperimentAssignment(
            experimentId, user.getId(), variant, Instant.now()
        ));

        // 发送分析事件
        analyticsService.trackExperimentAssignment(experimentId, user, variant);

        return variant;
    }

    private ExperimentVariant assignNewVariant(Experiment experiment, User user) {
        // 使用一致性哈希确保同一用户始终得到相同变体
        String hashKey = experiment.getId() + ":" + user.getId() + ":" +
            experiment.getSalt();
        int hash = Math.abs(hashKey.hashCode() % 100);

        int cumulative = 0;
        for (ExperimentVariant variant : experiment.getVariants()) {
            cumulative += variant.getPercentage();
            if (hash < cumulative) {
                return variant;
            }
        }

        return experiment.getControlVariant();
    }

    // 记录实验指标
    public void trackMetric(String experimentId, User user,
            String metricName, double value) {
        ExperimentVariant variant = getAssignedVariant(experimentId, user);

        analyticsService.trackExperimentMetric(
            experimentId,
            variant.getName(),
            metricName,
            value,
            user.getId()
        );
    }
}

@Data
public class Experiment {
    private String id;
    private String name;
    private String description;
    private boolean active;
    private String salt;
    private List<ExperimentVariant> variants;
    private ExperimentVariant controlVariant;
    private Instant startTime;
    private Instant endTime;
}

@Data
public class ExperimentVariant {
    private String name;
    private int percentage;
    private Map<String, Object> config;
}
```

### 统计分析

```java
// 实验结果分析
@Service
public class ExperimentAnalysisService {

    private final AnalyticsRepository analyticsRepository;

    public ExperimentResults analyzeExperiment(String experimentId) {
        Experiment experiment = getExperiment(experimentId);

        Map<String, VariantMetrics> variantMetrics = new HashMap<>();

        for (ExperimentVariant variant : experiment.getVariants()) {
            List<MetricData> data = analyticsRepository
                .getMetrics(experimentId, variant.getName());

            VariantMetrics metrics = calculateMetrics(data);
            variantMetrics.put(variant.getName(), metrics);
        }

        // 计算统计显著性
        StatisticalSignificance significance = calculateSignificance(
            variantMetrics.get("control"),
            variantMetrics
        );

        return ExperimentResults.builder()
            .experimentId(experimentId)
            .variantMetrics(variantMetrics)
            .significance(significance)
            .recommendation(generateRecommendation(variantMetrics, significance))
            .build();
    }

    private VariantMetrics calculateMetrics(List<MetricData> data) {
        double conversionRate = calculateConversionRate(data);
        double averageValue = calculateAverageValue(data);
        int sampleSize = data.size();
        double standardError = calculateStandardError(data);

        return VariantMetrics.builder()
            .conversionRate(conversionRate)
            .averageValue(averageValue)
            .sampleSize(sampleSize)
            .standardError(standardError)
            .confidenceInterval(calculateConfidenceInterval(
                conversionRate, standardError, sampleSize))
            .build();
    }

    private StatisticalSignificance calculateSignificance(
            VariantMetrics control, Map<String, VariantMetrics> variants) {
        // 使用卡方检验或 t 检验计算 p 值
        // 简化示例
        for (Map.Entry<String, VariantMetrics> entry : variants.entrySet()) {
            if (entry.getKey().equals("control")) continue;

            double pValue = calculatePValue(control, entry.getValue());
            if (pValue < 0.05) {
                return new StatisticalSignificance(
                    true, pValue, entry.getKey(),
                    "实验组 " + entry.getKey() + " 显著优于对照组"
                );
            }
        }

        return new StatisticalSignificance(false, 1.0, null,
            "没有发现统计显著差异，需要更多样本");
    }
}
```

## 技术债务管理

功能开关如果管理不当，会累积成为技术债务。以下是管理策略：

### 开关生命周期管理

```java
// 功能开关生命周期管理
@Entity
@Table(name = "feature_flag_lifecycle")
public class FeatureFlagLifecycle {

    @Id
    private String flagName;

    @Enumerated(EnumType.STRING)
    private FlagType type;

    @Enumerated(EnumType.STRING)
    private FlagStatus status;

    private String owner;

    private LocalDate createdDate;

    private LocalDate expectedRemovalDate;

    private LocalDate actualRemovalDate;

    private String jiraTicket;

    private String removalPullRequest;
}

public enum FlagStatus {
    ACTIVE,           // 正在使用
    DEPRECATED,       // 已废弃，待移除
    REMOVED,          // 已移除
    PERMANENT         // 永久保留（运维开关）
}

@Service
public class FeatureFlagLifecycleService {

    private final FeatureFlagLifecycleRepository lifecycleRepository;
    private final NotificationService notificationService;

    // 创建新功能开关时注册生命周期
    public void registerFlag(String flagName, FlagType type,
            String owner, int expectedDaysToLive) {
        FeatureFlagLifecycle lifecycle = new FeatureFlagLifecycle();
        lifecycle.setFlagName(flagName);
        lifecycle.setType(type);
        lifecycle.setStatus(FlagStatus.ACTIVE);
        lifecycle.setOwner(owner);
        lifecycle.setCreatedDate(LocalDate.now());
        lifecycle.setExpectedRemovalDate(
            LocalDate.now().plusDays(expectedDaysToLive));

        lifecycleRepository.save(lifecycle);
    }

    // 定期检查过期的功能开关
    @Scheduled(cron = "0 0 9 * * MON")  // 每周一早上9点
    public void checkExpiredFlags() {
        List<FeatureFlagLifecycle> expiredFlags = lifecycleRepository
            .findByStatusAndExpectedRemovalDateBefore(
                FlagStatus.ACTIVE, LocalDate.now());

        for (FeatureFlagLifecycle flag : expiredFlags) {
            // 发送提醒给负责人
            notificationService.sendFlagExpirationReminder(
                flag.getOwner(),
                flag.getFlagName(),
                flag.getExpectedRemovalDate()
            );

            // 更新状态为已废弃
            flag.setStatus(FlagStatus.DEPRECATED);
            lifecycleRepository.save(flag);
        }
    }

    // 生成技术债务报告
    public TechDebtReport generateReport() {
        List<FeatureFlagLifecycle> allFlags = lifecycleRepository.findAll();

        int activeCount = 0;
        int deprecatedCount = 0;
        int overdueCount = 0;
        List<FeatureFlagLifecycle> overdueFlags = new ArrayList<>();

        for (FeatureFlagLifecycle flag : allFlags) {
            switch (flag.getStatus()) {
                case ACTIVE:
                    activeCount++;
                    if (flag.getExpectedRemovalDate().isBefore(LocalDate.now())) {
                        overdueCount++;
                        overdueFlags.add(flag);
                    }
                    break;
                case DEPRECATED:
                    deprecatedCount++;
                    overdueCount++;
                    overdueFlags.add(flag);
                    break;
            }
        }

        return TechDebtReport.builder()
            .totalActiveFlags(activeCount)
            .deprecatedFlags(deprecatedCount)
            .overdueFlags(overdueCount)
            .overdueDetails(overdueFlags)
            .debtScore(calculateDebtScore(activeCount, overdueCount))
            .build();
    }
}
```

### 代码清理工具

```java
// 功能开关代码扫描器
public class FeatureFlagScanner {

    private final Pattern flagPattern = Pattern.compile(
        "featureFlags?\\.isEnabled\\([\"']([^\"']+)[\"']\\)"
    );

    public List<FlagUsage> scanDirectory(Path directory) throws IOException {
        List<FlagUsage> usages = new ArrayList<>();

        Files.walk(directory)
            .filter(path -> path.toString().endsWith(".java"))
            .forEach(path -> {
                try {
                    List<FlagUsage> fileUsages = scanFile(path);
                    usages.addAll(fileUsages);
                } catch (IOException e) {
                    log.error("扫描文件失败: {}", path, e);
                }
            });

        return usages;
    }

    private List<FlagUsage> scanFile(Path file) throws IOException {
        List<FlagUsage> usages = new ArrayList<>();
        List<String> lines = Files.readAllLines(file);

        for (int i = 0; i < lines.size(); i++) {
            Matcher matcher = flagPattern.matcher(lines.get(i));
            while (matcher.find()) {
                usages.add(new FlagUsage(
                    matcher.group(1),
                    file.toString(),
                    i + 1,
                    lines.get(i).trim()
                ));
            }
        }

        return usages;
    }

    // 生成清理报告
    public CleanupReport generateCleanupReport(
            List<FlagUsage> codeUsages,
            Set<String> activeFlags) {

        Map<String, List<FlagUsage>> usagesByFlag = codeUsages.stream()
            .collect(Collectors.groupingBy(FlagUsage::getFlagName));

        List<FlagUsage> staleFlagUsages = new ArrayList<>();
        List<String> unusedFlags = new ArrayList<>();

        // 找出代码中使用但已不存在的开关
        for (String flagInCode : usagesByFlag.keySet()) {
            if (!activeFlags.contains(flagInCode)) {
                staleFlagUsages.addAll(usagesByFlag.get(flagInCode));
            }
        }

        // 找出存在但代码中未使用的开关
        for (String activeFlag : activeFlags) {
            if (!usagesByFlag.containsKey(activeFlag)) {
                unusedFlags.add(activeFlag);
            }
        }

        return CleanupReport.builder()
            .staleFlagUsages(staleFlagUsages)
            .unusedFlags(unusedFlags)
            .estimatedCleanupEffort(estimateCleanupEffort(staleFlagUsages))
            .build();
    }
}

@Data
@AllArgsConstructor
public class FlagUsage {
    private String flagName;
    private String filePath;
    private int lineNumber;
    private String codeSnippet;
}
```

### 自动化清理

```java
// 功能开关自动清理（谨慎使用）
@Service
public class FeatureFlagCleanupService {

    private final FeatureFlagService featureFlags;
    private final FeatureFlagLifecycleRepository lifecycleRepository;
    private final GitService gitService;

    // 生成清理 PR
    public void generateCleanupPullRequest(String flagName) {
        FeatureFlagLifecycle lifecycle = lifecycleRepository
            .findById(flagName)
            .orElseThrow(() -> new FlagNotFoundException(flagName));

        // 确保开关已完全启用一段时间
        if (!isFullyRolledOut(flagName)) {
            throw new IllegalStateException(
                "功能开关尚未完全启用，无法清理");
        }

        // 创建清理分支
        String branchName = "cleanup/remove-flag-" + flagName;
        gitService.createBranch(branchName);

        try {
            // 扫描并修改代码
            List<FlagUsage> usages = new FeatureFlagScanner()
                .scanDirectory(Path.of("."));

            List<FlagUsage> flagUsages = usages.stream()
                .filter(u -> u.getFlagName().equals(flagName))
                .collect(Collectors.toList());

            for (FlagUsage usage : flagUsages) {
                // 这里需要谨慎处理，最好是生成报告而非自动修改
                // removeFeatureFlag(usage);
            }

            // 提交并创建 PR
            gitService.commit("移除功能开关: " + flagName);
            String prUrl = gitService.createPullRequest(
                branchName,
                "main",
                "清理功能开关: " + flagName,
                generatePrDescription(flagName, flagUsages)
            );

            // 更新生命周期记录
            lifecycle.setRemovalPullRequest(prUrl);
            lifecycleRepository.save(lifecycle);

        } catch (Exception e) {
            gitService.deleteBranch(branchName);
            throw new CleanupException("清理失败", e);
        }
    }

    private String generatePrDescription(String flagName,
            List<FlagUsage> usages) {
        StringBuilder sb = new StringBuilder();
        sb.append("## 清理功能开关: ").append(flagName).append("\n\n");
        sb.append("### 影响的文件:\n");

        usages.stream()
            .collect(Collectors.groupingBy(FlagUsage::getFilePath))
            .forEach((file, fileUsages) -> {
                sb.append("- `").append(file).append("` (")
                    .append(fileUsages.size()).append(" 处)\n");
            });

        sb.append("\n### 检查清单:\n");
        sb.append("- [ ] 确认功能已完全启用\n");
        sb.append("- [ ] 确认所有测试通过\n");
        sb.append("- [ ] 确认没有遗漏的代码分支\n");

        return sb.toString();
    }
}
```

## 最佳实践

### 命名规范

```java
// 好的命名
"enable-new-checkout-flow"
"experiment-recommendation-v2"
"ops-cache-fallback"
"permission-premium-analytics"

// 不好的命名
"flag1"
"new-feature"
"test"
"temp"
```

### 开关粒度

```java
// 好的实践：细粒度开关
featureFlags.isEnabled("checkout-express-payment");
featureFlags.isEnabled("checkout-gift-wrapping");
featureFlags.isEnabled("checkout-loyalty-points");

// 避免：过于粗粒度
featureFlags.isEnabled("new-checkout");  // 包含太多功能
```

### 避免嵌套开关

```java
// 避免嵌套
if (featureFlags.isEnabled("feature-a")) {
    if (featureFlags.isEnabled("feature-b")) {
        // 难以理解和测试
    }
}

// 更好的方式
if (featureFlags.isEnabled("feature-a-with-b")) {
    // 明确的组合功能
}
```

### 测试策略

```java
@ExtendWith(MockitoExtension.class)
class FeatureServiceTest {

    @Mock
    private FeatureFlagService featureFlags;

    @InjectMocks
    private CheckoutService checkoutService;

    @Test
    void shouldUseNewPaymentFlowWhenEnabled() {
        // Given
        when(featureFlags.isEnabled("new-payment-flow")).thenReturn(true);
        Cart cart = createTestCart();

        // When
        CheckoutResult result = checkoutService.checkout(cart);

        // Then
        assertThat(result.getPaymentProvider()).isEqualTo("new-provider");
    }

    @Test
    void shouldUseLegacyPaymentFlowWhenDisabled() {
        // Given
        when(featureFlags.isEnabled("new-payment-flow")).thenReturn(false);
        Cart cart = createTestCart();

        // When
        CheckoutResult result = checkoutService.checkout(cart);

        // Then
        assertThat(result.getPaymentProvider()).isEqualTo("legacy-provider");
    }

    // 测试所有开关组合
    @ParameterizedTest
    @CsvSource({
        "true, true, expected-result-1",
        "true, false, expected-result-2",
        "false, true, expected-result-3",
        "false, false, expected-result-4"
    })
    void shouldHandleAllFlagCombinations(boolean flag1, boolean flag2,
            String expectedResult) {
        when(featureFlags.isEnabled("flag-1")).thenReturn(flag1);
        when(featureFlags.isEnabled("flag-2")).thenReturn(flag2);

        String result = service.process();

        assertThat(result).isEqualTo(expectedResult);
    }
}
```

### 文档化

```java
/**
 * 功能开关配置文档
 *
 * | 开关名称 | 类型 | 描述 | 负责人 | 预计移除日期 |
 * |---------|------|------|--------|------------|
 * | new-checkout | Release | 新结账流程 | @张三 | 2024-03-01 |
 * | experiment-ui-v2 | Experiment | UI改版实验 | @李四 | 2024-04-15 |
 * | ops-read-replica | Ops | 读写分离开关 | @运维组 | 永久 |
 */
@Configuration
public class FeatureFlagDocumentation {
    // 建议在代码中维护开关文档
}
```

## 常见问题与解决方案

### 问题1：功能开关过多难以管理

**原因**：缺乏生命周期管理，废弃的开关未及时清理

**解决方案**：
- 实施强制的过期日期
- 定期审查和清理
- 设置开关数量告警阈值

### 问题2：开关状态不一致

**原因**：分布式系统中缓存同步延迟

**解决方案**：
```java
// 使用一致性哈希确保同一用户体验一致
public boolean isEnabled(String flag, String userId) {
    int hash = Math.abs((flag + userId).hashCode() % 100);
    return hash < getPercentage(flag);
}
```

### 问题3：测试覆盖不完整

**原因**：功能开关组合导致测试路径爆炸

**解决方案**：
- 限制同时启用的开关数量
- 使用参数化测试覆盖主要组合
- 在预发布环境进行全面测试

## 总结

功能开关是现代软件开发中实现持续交付和降低发布风险的关键技术。通过本文，我们学习了：

1. **基本概念**：功能开关的定义、类型和使用场景
2. **实现策略**：从简单配置到分布式存储的多种实现方式
3. **平台集成**：LaunchDarkly 和 Unleash 的详细使用方法
4. **渐进式发布**：金丝雀发布、蓝绿部署和环形发布策略
5. **A/B 测试**：实验框架设计和统计分析
6. **技术债务管理**：生命周期管理和代码清理策略

合理使用功能开关可以显著提升团队的发布效率和系统稳定性，但同时需要建立完善的管理机制，避免功能开关本身成为技术债务。建议团队在引入功能开关时，同步建立清晰的命名规范、生命周期管理流程和清理机制。
