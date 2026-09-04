---
title: Feature Flags
description: Learn feature flags for progressive releases
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - feature flags
  - feature toggles
  - release
  - gradual rollout
status: imported
origin: old/src/content/docs/architecture/feature-flags.en.md
divergence: 0.349
issues: []
legacy:
  category: Architecture
  subcategory: Patterns
  order: 27
  lastUpdated: 2026-01-07
---

## Introduction

Feature flags (also known as feature toggles, feature switches, or feature flippers) are a powerful software development technique that allows teams to modify system behavior without changing code. They enable the separation of code deployment from feature release, providing fine-grained control over which users see which features.

### Why Use Feature Flags?

Feature flags solve several critical challenges in modern software development:

1. **Continuous Deployment**: Deploy code to production without exposing incomplete features
2. **Risk Mitigation**: Roll out features gradually and roll back instantly if problems occur
3. **A/B Testing**: Test different variations of features with real users
4. **Operational Control**: Enable or disable features without code changes
5. **User Targeting**: Release features to specific user segments

The core idea is simple: wrap new functionality in conditional logic that can be controlled externally:

```java
if (featureFlags.isEnabled("new-checkout-flow")) {
    return newCheckoutService.process(cart);
} else {
    return legacyCheckoutService.process(cart);
}
```

---

## Types of Feature Flags

Feature flags serve different purposes and have different lifecycles. Understanding these types helps you manage them effectively.

### Release Flags

Release flags control the rollout of new features. They are typically short-lived and removed once a feature is fully released.

```java
public class ProductService {
    private final FeatureFlagService featureFlags;

    public ProductDetails getProductDetails(String productId) {
        Product product = productRepository.findById(productId);

        if (featureFlags.isEnabled("product-recommendations")) {
            // New feature: show personalized recommendations
            List<Product> recommendations = recommendationService
                .getRecommendations(product);
            return new ProductDetails(product, recommendations);
        }

        // Legacy behavior: no recommendations
        return new ProductDetails(product, Collections.emptyList());
    }
}
```

**Characteristics:**
- Short lifespan (days to weeks)
- Binary on/off state
- Should be removed after full rollout
- Low complexity

### Experiment Flags

Experiment flags enable A/B testing and multivariate experiments. They route users to different variations to measure outcomes.

```java
public class CheckoutPageController {
    private final FeatureFlagService featureFlags;
    private final AnalyticsService analytics;

    public CheckoutPage getCheckoutPage(User user) {
        String variant = featureFlags.getVariant("checkout-button-experiment", user);

        // Track which variant the user sees
        analytics.track("checkout_page_view", Map.of(
            "variant", variant,
            "userId", user.getId()
        ));

        return switch (variant) {
            case "control" -> new CheckoutPage("Proceed to Payment", "#007bff");
            case "variant_a" -> new CheckoutPage("Complete Purchase", "#28a745");
            case "variant_b" -> new CheckoutPage("Buy Now", "#dc3545");
            default -> new CheckoutPage("Proceed to Payment", "#007bff");
        };
    }
}
```

**Characteristics:**
- Medium lifespan (weeks to months)
- Multiple variants beyond binary
- Requires statistical analysis
- Should be removed after experiment concludes

### Operational Flags

Operational flags allow runtime control over system behavior, often used for managing load or handling incidents.

```java
public class NotificationService {
    private final FeatureFlagService featureFlags;

    public void sendNotification(Notification notification) {
        // Kill switch for email during incidents
        if (!featureFlags.isEnabled("email-notifications")) {
            log.info("Email notifications disabled, queueing for later");
            notificationQueue.enqueue(notification);
            return;
        }

        // Rate limiting during high load
        int maxRate = featureFlags.getNumber("email-rate-limit", 1000);
        rateLimiter.setRate(maxRate);

        if (rateLimiter.tryAcquire()) {
            emailService.send(notification);
        } else {
            notificationQueue.enqueue(notification);
        }
    }
}
```

**Characteristics:**
- Long lifespan (permanent)
- Controlled by operations team
- Provides runtime configurability
- Should have sensible defaults

### Permission Flags

Permission flags control access to features based on user attributes, subscription levels, or entitlements.

```java
public class FeatureAccessService {
    private final FeatureFlagService featureFlags;

    public boolean canAccessFeature(User user, String feature) {
        // Check if feature is enabled for user's plan
        FlagContext context = FlagContext.builder()
            .userId(user.getId())
            .attribute("plan", user.getSubscriptionPlan())
            .attribute("accountAge", user.getAccountAgeDays())
            .attribute("region", user.getRegion())
            .build();

        return featureFlags.isEnabled(feature, context);
    }

    public List<String> getEnabledFeatures(User user) {
        return List.of(
            "basic-analytics",
            "export-csv",
            "api-access",
            "advanced-reports",
            "custom-dashboards",
            "team-collaboration"
        ).stream()
            .filter(feature -> canAccessFeature(user, feature))
            .collect(Collectors.toList());
    }
}
```

**Characteristics:**
- Long lifespan (permanent)
- User-specific targeting
- Tied to business logic
- Part of product functionality

---

## Implementation Strategies

### Basic Implementation

A simple feature flag system can be implemented with configuration:

```java
// Simple configuration-based implementation
@Component
public class SimpleFeatureFlagService {

    private final Map<String, Boolean> flags;

    public SimpleFeatureFlagService(
            @Value("#{${feature.flags}}") Map<String, Boolean> flags) {
        this.flags = new ConcurrentHashMap<>(flags);
    }

    public boolean isEnabled(String flagName) {
        return flags.getOrDefault(flagName, false);
    }

    public void setFlag(String flagName, boolean enabled) {
        flags.put(flagName, enabled);
    }
}

// application.yml
// feature:
//   flags:
//     new-checkout: true
//     dark-mode: false
//     beta-features: true
```

### Context-Aware Implementation

For more sophisticated targeting, implement context-aware evaluation:

```java
public interface FeatureFlagService {
    boolean isEnabled(String flagName);
    boolean isEnabled(String flagName, FlagContext context);
    String getVariant(String flagName, FlagContext context);
    <T> T getValue(String flagName, FlagContext context, Class<T> type);
}

@Data
@Builder
public class FlagContext {
    private String userId;
    private String sessionId;
    private Map<String, Object> attributes;

    public static FlagContext anonymous() {
        return FlagContext.builder()
            .sessionId(UUID.randomUUID().toString())
            .attributes(new HashMap<>())
            .build();
    }

    public static FlagContext forUser(User user) {
        return FlagContext.builder()
            .userId(user.getId())
            .attributes(Map.of(
                "email", user.getEmail(),
                "plan", user.getPlan(),
                "country", user.getCountry(),
                "createdAt", user.getCreatedAt()
            ))
            .build();
    }
}

@Service
public class FeatureFlagServiceImpl implements FeatureFlagService {

    private final FlagRepository flagRepository;
    private final TargetingEngine targetingEngine;

    @Override
    public boolean isEnabled(String flagName, FlagContext context) {
        FeatureFlag flag = flagRepository.findByName(flagName)
            .orElse(FeatureFlag.disabled(flagName));

        if (!flag.isGloballyEnabled()) {
            return false;
        }

        // Evaluate targeting rules
        return targetingEngine.evaluate(flag.getRules(), context);
    }

    @Override
    public String getVariant(String flagName, FlagContext context) {
        FeatureFlag flag = flagRepository.findByName(flagName)
            .orElseThrow(() -> new FlagNotFoundException(flagName));

        // Determine variant based on targeting and distribution
        return targetingEngine.assignVariant(flag, context);
    }
}
```

### Targeting Engine

The targeting engine evaluates rules to determine flag state:

```java
@Component
public class TargetingEngine {

    public boolean evaluate(List<TargetingRule> rules, FlagContext context) {
        if (rules.isEmpty()) {
            return true; // No rules means enabled for all
        }

        for (TargetingRule rule : rules) {
            if (matchesRule(rule, context)) {
                return rule.isEnabled();
            }
        }

        return false; // Default to disabled if no rules match
    }

    private boolean matchesRule(TargetingRule rule, FlagContext context) {
        return rule.getConditions().stream()
            .allMatch(condition -> evaluateCondition(condition, context));
    }

    private boolean evaluateCondition(Condition condition, FlagContext context) {
        Object value = context.getAttributes().get(condition.getAttribute());

        return switch (condition.getOperator()) {
            case EQUALS -> Objects.equals(value, condition.getValue());
            case NOT_EQUALS -> !Objects.equals(value, condition.getValue());
            case CONTAINS -> value != null &&
                value.toString().contains(condition.getValue().toString());
            case IN -> condition.getValues().contains(value);
            case NOT_IN -> !condition.getValues().contains(value);
            case GREATER_THAN -> compareNumbers(value, condition.getValue()) > 0;
            case LESS_THAN -> compareNumbers(value, condition.getValue()) < 0;
            case REGEX -> value != null &&
                Pattern.matches(condition.getValue().toString(), value.toString());
            case PERCENTAGE -> evaluatePercentage(context, condition);
        };
    }

    private boolean evaluatePercentage(FlagContext context, Condition condition) {
        // Use consistent hashing for stable percentage bucketing
        String identifier = context.getUserId() != null
            ? context.getUserId()
            : context.getSessionId();

        int bucket = Math.abs(identifier.hashCode() % 100);
        int threshold = ((Number) condition.getValue()).intValue();

        return bucket < threshold;
    }

    public String assignVariant(FeatureFlag flag, FlagContext context) {
        // Check for targeted variant overrides
        for (VariantOverride override : flag.getVariantOverrides()) {
            if (matchesRule(override.getRule(), context)) {
                return override.getVariant();
            }
        }

        // Use percentage-based distribution
        String identifier = context.getUserId() != null
            ? context.getUserId()
            : context.getSessionId();

        int bucket = Math.abs((flag.getName() + identifier).hashCode() % 100);

        int cumulative = 0;
        for (VariantDistribution dist : flag.getDistributions()) {
            cumulative += dist.getPercentage();
            if (bucket < cumulative) {
                return dist.getVariant();
            }
        }

        return flag.getDefaultVariant();
    }
}
```

---

## LaunchDarkly Integration

LaunchDarkly is a leading feature management platform providing enterprise-grade feature flagging capabilities.

### Setup and Configuration

```java
// Add dependency
// implementation 'com.launchdarkly:launchdarkly-java-server-sdk:6.0.0'

@Configuration
public class LaunchDarklyConfig {

    @Value("${launchdarkly.sdk-key}")
    private String sdkKey;

    @Bean
    public LDClient launchDarklyClient() {
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
    public void closeLaunchDarklyClient() throws IOException {
        launchDarklyClient().close();
    }
}
```

### Service Integration

```java
@Service
public class LaunchDarklyFeatureService implements FeatureFlagService {

    private final LDClient ldClient;

    public LaunchDarklyFeatureService(LDClient ldClient) {
        this.ldClient = ldClient;
    }

    @Override
    public boolean isEnabled(String flagKey, FlagContext context) {
        LDContext ldContext = toLDContext(context);
        return ldClient.boolVariation(flagKey, ldContext, false);
    }

    @Override
    public String getVariant(String flagKey, FlagContext context) {
        LDContext ldContext = toLDContext(context);
        return ldClient.stringVariation(flagKey, ldContext, "control");
    }

    @Override
    public <T> T getValue(String flagKey, FlagContext context, Class<T> type) {
        LDContext ldContext = toLDContext(context);

        if (type == Boolean.class) {
            return type.cast(ldClient.boolVariation(flagKey, ldContext, false));
        } else if (type == String.class) {
            return type.cast(ldClient.stringVariation(flagKey, ldContext, ""));
        } else if (type == Integer.class) {
            return type.cast(ldClient.intVariation(flagKey, ldContext, 0));
        } else if (type == Double.class) {
            return type.cast(ldClient.doubleVariation(flagKey, ldContext, 0.0));
        }

        LDValue value = ldClient.jsonValueVariation(flagKey, ldContext, LDValue.ofNull());
        return parseJsonValue(value, type);
    }

    private LDContext toLDContext(FlagContext context) {
        if (context.getUserId() == null) {
            return LDContext.builder(ContextKind.DEFAULT, context.getSessionId())
                .anonymous(true)
                .build();
        }

        ContextBuilder builder = LDContext.builder(context.getUserId());

        context.getAttributes().forEach((key, value) -> {
            if (value instanceof String) {
                builder.set(key, (String) value);
            } else if (value instanceof Number) {
                builder.set(key, ((Number) value).doubleValue());
            } else if (value instanceof Boolean) {
                builder.set(key, (Boolean) value);
            }
        });

        return builder.build();
    }

    // Track feature flag evaluation for analytics
    public void track(String eventName, FlagContext context, Map<String, Object> data) {
        LDContext ldContext = toLDContext(context);
        LDValue ldData = LDValue.buildObject()
            .put("data", convertToLDValue(data))
            .build();

        ldClient.trackData(eventName, ldContext, ldData);
    }
}
```

### React/Frontend Integration

```typescript
// React SDK integration
import { LDProvider, useFlags, useLDClient } from 'launchdarkly-react-client-sdk';

// Provider setup
const App: React.FC = () => {
  const ldClientId = process.env.REACT_APP_LD_CLIENT_ID;

  const context = {
    kind: 'user',
    key: user?.id || 'anonymous',
    email: user?.email,
    custom: {
      plan: user?.plan,
      company: user?.company,
    },
  };

  return (
    <LDProvider clientSideID={ldClientId} context={context}>
      <AppContent />
    </LDProvider>
  );
};

// Using flags in components
const FeatureComponent: React.FC = () => {
  const { newDashboard, checkoutExperiment } = useFlags();
  const ldClient = useLDClient();

  useEffect(() => {
    // Track feature exposure
    ldClient?.track('feature_viewed', { feature: 'newDashboard' });
  }, []);

  if (newDashboard) {
    return <NewDashboard />;
  }

  return <LegacyDashboard />;
};

// Custom hook for feature flags
const useFeatureFlag = (flagKey: string, defaultValue: boolean = false) => {
  const flags = useFlags();
  const ldClient = useLDClient();

  useEffect(() => {
    // Log flag evaluation for debugging
    console.debug(`Flag ${flagKey}: ${flags[flagKey]}`);
  }, [flagKey, flags]);

  return flags[flagKey] ?? defaultValue;
};
```

---

## Unleash Integration

Unleash is an open-source feature management solution that can be self-hosted.

### Server Setup

```java
// Add dependency
// implementation 'io.getunleash:unleash-client-java:8.0.0'

@Configuration
public class UnleashConfig {

    @Value("${unleash.api-url}")
    private String apiUrl;

    @Value("${unleash.api-token}")
    private String apiToken;

    @Value("${spring.application.name}")
    private String appName;

    @Bean
    public Unleash unleash() {
        UnleashConfig config = UnleashConfig.builder()
            .appName(appName)
            .instanceId(getInstanceId())
            .unleashAPI(apiUrl)
            .apiKey(apiToken)
            .fetchTogglesInterval(10) // seconds
            .sendMetricsInterval(60)  // seconds
            .build();

        return new DefaultUnleash(config);
    }

    private String getInstanceId() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            return UUID.randomUUID().toString();
        }
    }
}
```

### Service Implementation

```java
@Service
public class UnleashFeatureService implements FeatureFlagService {

    private final Unleash unleash;

    public UnleashFeatureService(Unleash unleash) {
        this.unleash = unleash;
    }

    @Override
    public boolean isEnabled(String flagName) {
        return unleash.isEnabled(flagName);
    }

    @Override
    public boolean isEnabled(String flagName, FlagContext context) {
        UnleashContext unleashContext = toUnleashContext(context);
        return unleash.isEnabled(flagName, unleashContext);
    }

    @Override
    public String getVariant(String flagName, FlagContext context) {
        UnleashContext unleashContext = toUnleashContext(context);
        Variant variant = unleash.getVariant(flagName, unleashContext);
        return variant.getName();
    }

    @Override
    public <T> T getValue(String flagName, FlagContext context, Class<T> type) {
        UnleashContext unleashContext = toUnleashContext(context);
        Variant variant = unleash.getVariant(flagName, unleashContext);

        if (!variant.isEnabled() || variant.getPayload().isEmpty()) {
            return getDefaultValue(type);
        }

        String payload = variant.getPayload().get().getValue();
        return parsePayload(payload, type);
    }

    private UnleashContext toUnleashContext(FlagContext context) {
        UnleashContext.Builder builder = UnleashContext.builder();

        if (context.getUserId() != null) {
            builder.userId(context.getUserId());
        }

        if (context.getSessionId() != null) {
            builder.sessionId(context.getSessionId());
        }

        context.getAttributes().forEach((key, value) ->
            builder.addProperty(key, String.valueOf(value)));

        return builder.build();
    }
}
```

### Custom Activation Strategies

```java
// Custom strategy for enterprise customers
public class EnterpriseCustomerStrategy implements Strategy {

    private final CustomerRepository customerRepository;

    @Override
    public String getName() {
        return "enterpriseCustomer";
    }

    @Override
    public boolean isEnabled(Map<String, String> parameters, UnleashContext context) {
        return context.getUserId()
            .map(customerRepository::findById)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .map(Customer::isEnterprise)
            .orElse(false);
    }
}

// Custom strategy for geographic targeting
public class GeoTargetingStrategy implements Strategy {

    private final GeoLocationService geoService;

    @Override
    public String getName() {
        return "geoTargeting";
    }

    @Override
    public boolean isEnabled(Map<String, String> parameters, UnleashContext context) {
        String allowedCountries = parameters.getOrDefault("countries", "");
        Set<String> countries = Set.of(allowedCountries.split(","));

        return context.getProperties().get("country")
            .map(countries::contains)
            .orElse(false);
    }
}

// Register custom strategies
@Bean
public Unleash unleash() {
    UnleashConfig config = UnleashConfig.builder()
        .appName(appName)
        .unleashAPI(apiUrl)
        .apiKey(apiToken)
        .build();

    return new DefaultUnleash(
        config,
        new EnterpriseCustomerStrategy(customerRepository),
        new GeoTargetingStrategy(geoService)
    );
}
```

---

## Gradual Rollout

Gradual rollout allows you to incrementally release features to larger percentages of users while monitoring for issues.

### Percentage-Based Rollout

```java
@Service
public class GradualRolloutService {

    private final FeatureFlagService featureFlags;
    private final MetricsService metrics;

    public void executeWithGradualRollout(
            String flagName,
            FlagContext context,
            Runnable newBehavior,
            Runnable oldBehavior) {

        boolean enabled = featureFlags.isEnabled(flagName, context);

        Instant start = Instant.now();
        try {
            if (enabled) {
                newBehavior.run();
                metrics.recordSuccess(flagName, "new");
            } else {
                oldBehavior.run();
                metrics.recordSuccess(flagName, "old");
            }
        } catch (Exception e) {
            metrics.recordFailure(flagName, enabled ? "new" : "old");
            throw e;
        } finally {
            Duration duration = Duration.between(start, Instant.now());
            metrics.recordDuration(flagName, enabled ? "new" : "old", duration);
        }
    }
}
```

### Canary Release Strategy

```java
@Service
public class CanaryReleaseService {

    private final FeatureFlagService featureFlags;
    private final LoadBalancer loadBalancer;

    // Start with internal users only
    public static final String PHASE_INTERNAL = "internal";
    // Expand to 5% of production traffic
    public static final String PHASE_CANARY = "canary";
    // Expand to 25% of production traffic
    public static final String PHASE_EARLY_ADOPTERS = "early_adopters";
    // Full rollout
    public static final String PHASE_GENERAL = "general";

    public String routeRequest(String featureName, FlagContext context) {
        String phase = featureFlags.getVariant(featureName + "-rollout", context);

        return switch (phase) {
            case PHASE_INTERNAL -> {
                if (isInternalUser(context)) {
                    yield "new-service";
                }
                yield "stable-service";
            }
            case PHASE_CANARY -> {
                if (isInternalUser(context) || isInCanaryGroup(context, 5)) {
                    yield "new-service";
                }
                yield "stable-service";
            }
            case PHASE_EARLY_ADOPTERS -> {
                if (isInternalUser(context) || isInCanaryGroup(context, 25)) {
                    yield "new-service";
                }
                yield "stable-service";
            }
            case PHASE_GENERAL -> "new-service";
            default -> "stable-service";
        };
    }

    private boolean isInternalUser(FlagContext context) {
        String email = (String) context.getAttributes().get("email");
        return email != null && email.endsWith("@company.com");
    }

    private boolean isInCanaryGroup(FlagContext context, int percentage) {
        int bucket = Math.abs(context.getUserId().hashCode() % 100);
        return bucket < percentage;
    }
}
```

### Automated Rollout with Health Checks

```java
@Service
public class AutomatedRolloutService {

    private final FeatureFlagClient flagClient;
    private final HealthMonitor healthMonitor;
    private final AlertService alertService;

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void checkAndProgressRollouts() {
        List<ActiveRollout> rollouts = flagClient.getActiveRollouts();

        for (ActiveRollout rollout : rollouts) {
            RolloutHealth health = healthMonitor.checkHealth(rollout.getFlagName());

            if (health.hasIssues()) {
                handleRolloutIssues(rollout, health);
            } else if (shouldProgressRollout(rollout, health)) {
                progressRollout(rollout);
            }
        }
    }

    private void handleRolloutIssues(ActiveRollout rollout, RolloutHealth health) {
        if (health.isCritical()) {
            // Automatic rollback
            flagClient.rollback(rollout.getFlagName());
            alertService.sendCriticalAlert(
                String.format("Auto-rollback: %s due to %s",
                    rollout.getFlagName(),
                    health.getIssues())
            );
        } else {
            // Pause rollout and notify
            flagClient.pauseRollout(rollout.getFlagName());
            alertService.sendWarning(
                String.format("Rollout paused: %s - %s",
                    rollout.getFlagName(),
                    health.getIssues())
            );
        }
    }

    private boolean shouldProgressRollout(ActiveRollout rollout, RolloutHealth health) {
        // Check if enough time has passed at current percentage
        Duration timeAtCurrentLevel = Duration.between(
            rollout.getLastProgressedAt(),
            Instant.now()
        );

        Duration requiredBakeTime = rollout.getBakeTime();

        return timeAtCurrentLevel.compareTo(requiredBakeTime) > 0
            && health.getErrorRate() < rollout.getErrorThreshold()
            && health.getLatencyP99() < rollout.getLatencyThreshold();
    }

    private void progressRollout(ActiveRollout rollout) {
        int currentPercentage = rollout.getCurrentPercentage();
        int nextPercentage = calculateNextPercentage(currentPercentage);

        flagClient.setRolloutPercentage(rollout.getFlagName(), nextPercentage);

        log.info("Progressed rollout {} from {}% to {}%",
            rollout.getFlagName(),
            currentPercentage,
            nextPercentage);
    }

    private int calculateNextPercentage(int current) {
        // Exponential rollout: 1% -> 5% -> 10% -> 25% -> 50% -> 100%
        if (current < 1) return 1;
        if (current < 5) return 5;
        if (current < 10) return 10;
        if (current < 25) return 25;
        if (current < 50) return 50;
        return 100;
    }
}
```

---

## A/B Testing

Feature flags enable robust A/B testing frameworks for data-driven decision making.

### Experiment Framework

```java
@Service
public class ExperimentService {

    private final FeatureFlagService featureFlags;
    private final AnalyticsService analytics;
    private final ExperimentRepository experimentRepository;

    public <T> T runExperiment(
            String experimentName,
            FlagContext context,
            Map<String, Supplier<T>> variants) {

        // Get assigned variant
        String variant = featureFlags.getVariant(experimentName, context);

        // Track exposure
        trackExposure(experimentName, variant, context);

        // Execute variant
        Supplier<T> variantSupplier = variants.getOrDefault(
            variant,
            variants.get("control")
        );

        return variantSupplier.get();
    }

    private void trackExposure(String experiment, String variant, FlagContext context) {
        ExposureEvent event = ExposureEvent.builder()
            .experimentName(experiment)
            .variant(variant)
            .userId(context.getUserId())
            .sessionId(context.getSessionId())
            .timestamp(Instant.now())
            .attributes(context.getAttributes())
            .build();

        analytics.trackExposure(event);
    }

    public void trackConversion(
            String experimentName,
            String conversionEvent,
            FlagContext context,
            Map<String, Object> properties) {

        ConversionEvent event = ConversionEvent.builder()
            .experimentName(experimentName)
            .conversionEvent(conversionEvent)
            .userId(context.getUserId())
            .timestamp(Instant.now())
            .properties(properties)
            .build();

        analytics.trackConversion(event);
    }
}
```

### Statistical Analysis

```java
@Service
public class ExperimentAnalysisService {

    private final ExperimentRepository experimentRepository;

    public ExperimentResults analyzeExperiment(String experimentName) {
        Experiment experiment = experimentRepository.findByName(experimentName);

        Map<String, VariantMetrics> variantMetrics = new HashMap<>();

        for (String variant : experiment.getVariants()) {
            VariantMetrics metrics = calculateMetrics(experimentName, variant);
            variantMetrics.put(variant, metrics);
        }

        // Calculate statistical significance
        VariantMetrics control = variantMetrics.get("control");
        Map<String, StatisticalResult> results = new HashMap<>();

        for (Map.Entry<String, VariantMetrics> entry : variantMetrics.entrySet()) {
            if (!entry.getKey().equals("control")) {
                StatisticalResult result = calculateSignificance(
                    control,
                    entry.getValue()
                );
                results.put(entry.getKey(), result);
            }
        }

        return ExperimentResults.builder()
            .experimentName(experimentName)
            .variantMetrics(variantMetrics)
            .statisticalResults(results)
            .recommendation(generateRecommendation(results))
            .build();
    }

    private VariantMetrics calculateMetrics(String experiment, String variant) {
        List<ExposureEvent> exposures = experimentRepository
            .getExposures(experiment, variant);
        List<ConversionEvent> conversions = experimentRepository
            .getConversions(experiment, variant);

        long sampleSize = exposures.size();
        long conversionCount = conversions.size();
        double conversionRate = sampleSize > 0
            ? (double) conversionCount / sampleSize
            : 0;

        DoubleSummaryStatistics revenueStats = conversions.stream()
            .mapToDouble(c -> (Double) c.getProperties().getOrDefault("revenue", 0.0))
            .summaryStatistics();

        return VariantMetrics.builder()
            .sampleSize(sampleSize)
            .conversionCount(conversionCount)
            .conversionRate(conversionRate)
            .averageRevenue(revenueStats.getAverage())
            .totalRevenue(revenueStats.getSum())
            .build();
    }

    private StatisticalResult calculateSignificance(
            VariantMetrics control,
            VariantMetrics treatment) {

        // Two-proportion z-test
        double p1 = control.getConversionRate();
        double p2 = treatment.getConversionRate();
        long n1 = control.getSampleSize();
        long n2 = treatment.getSampleSize();

        double pooledProportion = (double) (control.getConversionCount() +
            treatment.getConversionCount()) / (n1 + n2);

        double standardError = Math.sqrt(
            pooledProportion * (1 - pooledProportion) * (1.0/n1 + 1.0/n2)
        );

        double zScore = (p2 - p1) / standardError;
        double pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

        double relativeUplift = p1 > 0 ? (p2 - p1) / p1 : 0;

        return StatisticalResult.builder()
            .zScore(zScore)
            .pValue(pValue)
            .isSignificant(pValue < 0.05)
            .relativeUplift(relativeUplift)
            .confidenceInterval(calculateConfidenceInterval(p1, p2, n1, n2))
            .build();
    }

    private String generateRecommendation(Map<String, StatisticalResult> results) {
        Optional<Map.Entry<String, StatisticalResult>> winner = results.entrySet()
            .stream()
            .filter(e -> e.getValue().isSignificant())
            .filter(e -> e.getValue().getRelativeUplift() > 0)
            .max(Comparator.comparing(e -> e.getValue().getRelativeUplift()));

        if (winner.isPresent()) {
            return String.format(
                "Recommend rolling out '%s' with %.1f%% uplift (p=%.4f)",
                winner.get().getKey(),
                winner.get().getValue().getRelativeUplift() * 100,
                winner.get().getValue().getPValue()
            );
        }

        return "No statistically significant winner. Consider extending the experiment.";
    }
}
```

### Experiment Configuration

```yaml
# experiment-config.yml
experiments:
  checkout-flow-v2:
    description: "Test new streamlined checkout flow"
    hypothesis: "Reducing checkout steps will increase conversion rate"
    primaryMetric: "checkout_completed"
    secondaryMetrics:
      - "cart_abandonment_rate"
      - "average_order_value"
    variants:
      control:
        description: "Current 5-step checkout"
        weight: 50
      treatment:
        description: "New 3-step checkout"
        weight: 50
    targeting:
      includeUserIds: []
      excludeUserIds: []
      attributes:
        - key: "device_type"
          operator: "in"
          values: ["desktop", "tablet"]
    minimumSampleSize: 10000
    minimumRuntime: "7d"
    maximumRuntime: "30d"
    stopConditions:
      - type: "significance"
        threshold: 0.95
      - type: "harm"
        threshold: -0.10  # Stop if conversion drops more than 10%
```

---

## Technical Debt Management

Feature flags can become technical debt if not properly managed. Implement strategies to keep your flag inventory healthy.

### Flag Lifecycle Management

```java
@Entity
public class FeatureFlag {

    @Id
    private String name;

    @Enumerated(EnumType.STRING)
    private FlagType type;

    @Enumerated(EnumType.STRING)
    private FlagStatus status;

    private String description;
    private String owner;
    private String jiraTicket;

    private LocalDate createdAt;
    private LocalDate expectedRemovalDate;
    private LocalDate lastEvaluatedAt;

    @ElementCollection
    private Set<String> codeLocations;

    // Flag types determine expected lifecycle
    public enum FlagType {
        RELEASE(Duration.ofDays(30)),      // Should be removed within 30 days
        EXPERIMENT(Duration.ofDays(90)),   // Should conclude within 90 days
        OPERATIONAL(null),                  // Permanent, no removal expected
        PERMISSION(null);                   // Permanent, tied to business logic

        private final Duration maxLifespan;

        FlagType(Duration maxLifespan) {
            this.maxLifespan = maxLifespan;
        }
    }

    public boolean isStale() {
        if (type.maxLifespan == null) {
            return false; // Permanent flags are never stale
        }

        Duration age = Duration.between(
            createdAt.atStartOfDay(),
            LocalDate.now().atStartOfDay()
        );

        return age.compareTo(type.maxLifespan) > 0;
    }
}
```

### Stale Flag Detection

```java
@Service
public class FlagMaintenanceService {

    private final FlagRepository flagRepository;
    private final CodeSearchService codeSearch;
    private final NotificationService notifications;

    @Scheduled(cron = "0 0 9 * * MON") // Every Monday at 9 AM
    public void detectStaleFlagsWeekly() {
        List<FeatureFlag> staleFlags = flagRepository.findAll().stream()
            .filter(FeatureFlag::isStale)
            .collect(Collectors.toList());

        if (!staleFlags.isEmpty()) {
            sendStaleReport(staleFlags);
        }
    }

    @Scheduled(cron = "0 0 0 1 * *") // First day of each month
    public void generateMonthlyFlagReport() {
        FlagReport report = FlagReport.builder()
            .totalFlags(flagRepository.count())
            .flagsByType(countByType())
            .flagsByStatus(countByStatus())
            .staleFlags(findStaleFlags())
            .unusedFlags(findUnusedFlags())
            .flagsWithoutOwner(findFlagsWithoutOwner())
            .recommendations(generateRecommendations())
            .build();

        notifications.sendToEngineering(report);
    }

    private List<FeatureFlag> findUnusedFlags() {
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);

        return flagRepository.findAll().stream()
            .filter(flag -> flag.getLastEvaluatedAt() != null)
            .filter(flag -> flag.getLastEvaluatedAt().isBefore(thirtyDaysAgo))
            .collect(Collectors.toList());
    }

    private List<String> generateRecommendations() {
        List<String> recommendations = new ArrayList<>();

        // Check for flags that are 100% rolled out
        flagRepository.findByStatus(FlagStatus.ENABLED).stream()
            .filter(flag -> flag.getType() == FlagType.RELEASE)
            .filter(flag -> flag.getRolloutPercentage() == 100)
            .forEach(flag -> recommendations.add(
                String.format("Flag '%s' is fully rolled out. Consider removing it. Owner: %s",
                    flag.getName(), flag.getOwner())
            ));

        // Check for old experiment flags
        flagRepository.findByType(FlagType.EXPERIMENT).stream()
            .filter(flag -> flag.getCreatedAt().isBefore(LocalDate.now().minusDays(60)))
            .forEach(flag -> recommendations.add(
                String.format("Experiment '%s' has been running for 60+ days. Review results. Owner: %s",
                    flag.getName(), flag.getOwner())
            ));

        return recommendations;
    }
}
```

### Code Reference Tracking

```java
@Service
public class FlagCodeReferenceService {

    private final GitService gitService;
    private final FlagRepository flagRepository;

    public void scanCodebaseForFlagReferences() {
        List<FeatureFlag> flags = flagRepository.findAll();

        for (FeatureFlag flag : flags) {
            Set<String> references = findCodeReferences(flag.getName());
            flag.setCodeLocations(references);

            if (references.isEmpty() && flag.getStatus() == FlagStatus.ENABLED) {
                log.warn("Flag '{}' is enabled but has no code references",
                    flag.getName());
            }
        }

        flagRepository.saveAll(flags);
    }

    private Set<String> findCodeReferences(String flagName) {
        Set<String> references = new HashSet<>();

        // Search in Java files
        List<SearchResult> javaResults = gitService.search(
            String.format("isEnabled(\"%s\")", flagName),
            "*.java"
        );
        references.addAll(toLocations(javaResults));

        // Search in TypeScript/JavaScript files
        List<SearchResult> tsResults = gitService.search(
            String.format("useFlag('%s')", flagName),
            "*.ts,*.tsx,*.js,*.jsx"
        );
        references.addAll(toLocations(tsResults));

        // Search in configuration files
        List<SearchResult> configResults = gitService.search(
            flagName,
            "*.yml,*.yaml,*.json"
        );
        references.addAll(toLocations(configResults));

        return references;
    }

    private Set<String> toLocations(List<SearchResult> results) {
        return results.stream()
            .map(r -> String.format("%s:%d", r.getFile(), r.getLineNumber()))
            .collect(Collectors.toSet());
    }
}
```

### Flag Removal Automation

```java
@Service
public class FlagRemovalService {

    private final FlagRepository flagRepository;
    private final JiraService jiraService;
    private final SlackService slackService;

    public void initiateRemoval(String flagName) {
        FeatureFlag flag = flagRepository.findByName(flagName)
            .orElseThrow(() -> new FlagNotFoundException(flagName));

        // Create removal checklist
        RemovalChecklist checklist = RemovalChecklist.builder()
            .flagName(flagName)
            .codeLocations(flag.getCodeLocations())
            .steps(List.of(
                new ChecklistItem("Remove flag checks from code"),
                new ChecklistItem("Remove flag from configuration"),
                new ChecklistItem("Update tests"),
                new ChecklistItem("Deploy changes"),
                new ChecklistItem("Delete flag from flag service"),
                new ChecklistItem("Update documentation")
            ))
            .build();

        // Create Jira ticket
        String ticketId = jiraService.createTicket(
            String.format("Remove feature flag: %s", flagName),
            generateRemovalDescription(flag, checklist),
            flag.getOwner()
        );

        // Notify owner
        slackService.sendDirectMessage(
            flag.getOwner(),
            String.format(
                "Feature flag '%s' is ready for removal. " +
                "Jira ticket: %s\nCode locations: %s",
                flagName,
                ticketId,
                String.join(", ", flag.getCodeLocations())
            )
        );

        flag.setStatus(FlagStatus.PENDING_REMOVAL);
        flag.setJiraTicket(ticketId);
        flagRepository.save(flag);
    }

    private String generateRemovalDescription(
            FeatureFlag flag,
            RemovalChecklist checklist) {
        StringBuilder sb = new StringBuilder();

        sb.append("## Flag Details\n");
        sb.append(String.format("- Name: %s\n", flag.getName()));
        sb.append(String.format("- Type: %s\n", flag.getType()));
        sb.append(String.format("- Created: %s\n", flag.getCreatedAt()));
        sb.append(String.format("- Description: %s\n\n", flag.getDescription()));

        sb.append("## Code Locations\n");
        for (String location : flag.getCodeLocations()) {
            sb.append(String.format("- `%s`\n", location));
        }

        sb.append("\n## Removal Checklist\n");
        for (ChecklistItem item : checklist.getSteps()) {
            sb.append(String.format("- [ ] %s\n", item.getDescription()));
        }

        return sb.toString();
    }
}
```

---

## Best Practices

### Naming Conventions

```java
public class FlagNamingConventions {

    // Good: Clear, descriptive names with consistent format
    public static final String EXAMPLE_RELEASE = "release-new-checkout-flow";
    public static final String EXAMPLE_EXPERIMENT = "exp-checkout-button-color";
    public static final String EXAMPLE_OPERATIONAL = "ops-email-rate-limit";
    public static final String EXAMPLE_PERMISSION = "perm-advanced-analytics";

    // Bad: Ambiguous or inconsistent names
    public static final String BAD_NAME_1 = "flag1";
    public static final String BAD_NAME_2 = "newFeature";
    public static final String BAD_NAME_3 = "test_thing";

    public static String createFlagName(FlagType type, String description) {
        String prefix = switch (type) {
            case RELEASE -> "release";
            case EXPERIMENT -> "exp";
            case OPERATIONAL -> "ops";
            case PERMISSION -> "perm";
        };

        String normalized = description.toLowerCase()
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-|-$", "");

        return prefix + "-" + normalized;
    }
}
```

### Default Values Strategy

```java
@Service
public class SafeFeatureFlagService {

    private final FeatureFlagService delegate;

    // Always provide sensible defaults
    public boolean isEnabled(String flagName) {
        try {
            return delegate.isEnabled(flagName);
        } catch (Exception e) {
            log.error("Error evaluating flag {}, using default", flagName, e);
            return getDefaultValue(flagName);
        }
    }

    private boolean getDefaultValue(String flagName) {
        // Release flags default to OFF (safe)
        if (flagName.startsWith("release-")) {
            return false;
        }
        // Operational flags default to ON (keep functionality)
        if (flagName.startsWith("ops-")) {
            return true;
        }
        // Default to OFF for unknown flags
        return false;
    }
}
```

### Testing with Feature Flags

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private FeatureFlagService featureFlags;

    @InjectMocks
    private OrderService orderService;

    @Test
    void shouldUseNewCheckoutWhenFlagEnabled() {
        // Given
        when(featureFlags.isEnabled("release-new-checkout-flow"))
            .thenReturn(true);

        // When
        OrderResult result = orderService.processOrder(testOrder);

        // Then
        assertThat(result.getCheckoutVersion()).isEqualTo("v2");
    }

    @Test
    void shouldUseLegacyCheckoutWhenFlagDisabled() {
        // Given
        when(featureFlags.isEnabled("release-new-checkout-flow"))
            .thenReturn(false);

        // When
        OrderResult result = orderService.processOrder(testOrder);

        // Then
        assertThat(result.getCheckoutVersion()).isEqualTo("v1");
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void shouldHandleBothFlagStates(boolean flagEnabled) {
        // Given
        when(featureFlags.isEnabled(anyString())).thenReturn(flagEnabled);

        // When/Then - should not throw
        assertDoesNotThrow(() -> orderService.processOrder(testOrder));
    }
}

// Test utility for controlling flags in integration tests
@Component
@Profile("test")
public class TestFeatureFlagService implements FeatureFlagService {

    private final Map<String, Boolean> overrides = new ConcurrentHashMap<>();

    public void enable(String flagName) {
        overrides.put(flagName, true);
    }

    public void disable(String flagName) {
        overrides.put(flagName, false);
    }

    public void reset() {
        overrides.clear();
    }

    @Override
    public boolean isEnabled(String flagName) {
        return overrides.getOrDefault(flagName, false);
    }
}
```

### Documentation

```java
/**
 * Feature flag for the new recommendation algorithm.
 *
 * <p>Flag name: release-ml-recommendations-v2</p>
 * <p>Owner: ML Team (ml-team@company.com)</p>
 * <p>Created: 2024-01-10</p>
 * <p>Expected removal: 2024-02-15</p>
 *
 * <h3>Description</h3>
 * Controls rollout of the new ML-based recommendation algorithm that uses
 * collaborative filtering instead of rule-based recommendations.
 *
 * <h3>Behavior when enabled</h3>
 * <ul>
 *   <li>Product recommendations use ML model v2</li>
 *   <li>Personalization based on user behavior history</li>
 *   <li>Response time may increase by ~50ms</li>
 * </ul>
 *
 * <h3>Behavior when disabled</h3>
 * <ul>
 *   <li>Uses rule-based recommendations (current production behavior)</li>
 * </ul>
 *
 * <h3>Rollout plan</h3>
 * <ol>
 *   <li>Week 1: Internal users (100%)</li>
 *   <li>Week 2: 5% of production traffic</li>
 *   <li>Week 3: 25% of production traffic</li>
 *   <li>Week 4: 100% rollout</li>
 * </ol>
 *
 * @see <a href="https://jira.company.com/ML-123">Jira ticket</a>
 * @see <a href="https://docs.company.com/ml-recs-v2">Technical design</a>
 */
public static final String ML_RECOMMENDATIONS_V2 = "release-ml-recommendations-v2";
```

---

## Summary

Feature flags are a powerful technique for managing software releases and enabling experimentation. Key takeaways:

1. **Types Matter**: Understand the different types of flags (release, experiment, operational, permission) and their lifecycles
2. **Choose the Right Tool**: Use platforms like LaunchDarkly or Unleash for enterprise needs, or build simple solutions for basic requirements
3. **Gradual Rollout**: Release features incrementally to reduce risk and enable quick rollback
4. **A/B Testing**: Use feature flags to run experiments and make data-driven decisions
5. **Manage Technical Debt**: Implement processes to track, review, and remove stale flags
6. **Best Practices**: Follow naming conventions, provide sensible defaults, test both flag states, and document thoroughly

When implemented correctly, feature flags enable teams to ship faster, reduce risk, and make better product decisions based on real user data.
