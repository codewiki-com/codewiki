---
title: Zero Trust Security Architecture Guide
description: Master Zero Trust model for modern security architecture
track: security
section: infra-security
difficulty: advanced
tags:
  - Zero Trust
  - Security Architecture
  - Identity
  - Microsegmentation
status: imported
origin: old/src/content/docs/security/zero-trust.en.md
divergence: 0.452
issues:
  - divergent
legacy:
  category: Security
  subcategory: Architecture
  order: 11
  lastUpdated: 2026-01-07
---

Zero Trust is a security framework that fundamentally changes how organizations approach cybersecurity. Built on the principle of "never trust, always verify," Zero Trust eliminates the concept of a trusted internal network and assumes that threats can originate from anywhere. This comprehensive guide explores the core principles, implementation strategies, and practical code examples for building a Zero Trust architecture in modern applications.

## Understanding Zero Trust

### The Evolution from Perimeter Security

Traditional security models operated on the "castle and moat" principle: strong perimeter defenses protecting a trusted internal network. Once inside the perimeter, users and devices were largely trusted. This approach is now inadequate due to:

- Cloud adoption dissolving traditional network boundaries
- Remote work expanding the attack surface
- Sophisticated attacks that breach perimeter defenses
- Lateral movement by attackers once inside the network
- Insider threats from compromised credentials

```
+------------------------------------------------------------------+
|              Traditional vs. Zero Trust Security                  |
+------------------------------------------------------------------+
|                                                                   |
|  Traditional (Perimeter-Based)      Zero Trust                    |
|  +-------------------------+        +-------------------------+   |
|  |    Trusted Network      |        |  No Implicit Trust      |   |
|  |  +------------------+   |        |                         |   |
|  |  |   Resources      |   |        |  [User] --> Verify -->  |   |
|  |  |   (trusted)      |   |        |         --> Verify -->  |   |
|  |  +------------------+   |        |         --> [Resource]  |   |
|  |         ^               |        |                         |   |
|  |         |               |        |  Every request verified |   |
|  +---------|---------------+        +-------------------------+   |
|            |                                                      |
|    [Firewall/VPN]                                                 |
|            |                                                      |
|     [External User]                                               |
|                                                                   |
+------------------------------------------------------------------+
```

### Core Principles of Zero Trust

Zero Trust is built upon several foundational principles that guide its implementation:

1. **Verify Explicitly**: Always authenticate and authorize based on all available data points, including user identity, location, device health, service or workload, data classification, and anomalies.

2. **Use Least Privilege Access**: Limit user access with just-in-time and just-enough-access (JIT/JEA), risk-based adaptive policies, and data protection to reduce exposure.

3. **Assume Breach**: Minimize blast radius and segment access. Verify end-to-end encryption and use analytics to detect threats and improve defenses.

```
+------------------------------------------------------------------+
|                    Zero Trust Pillars                             |
+------------------------------------------------------------------+
|                                                                   |
|  +------------+  +------------+  +------------+  +------------+   |
|  | Identities |  |  Devices   |  |   Apps     |  |    Data    |   |
|  +------------+  +------------+  +------------+  +------------+   |
|        |               |               |               |          |
|        v               v               v               v          |
|  +----------------------------------------------------------+    |
|  |              Policy Decision Point (PDP)                  |    |
|  |   - Context evaluation                                    |    |
|  |   - Risk assessment                                       |    |
|  |   - Access decision                                       |    |
|  +----------------------------------------------------------+    |
|                             |                                     |
|                             v                                     |
|  +----------------------------------------------------------+    |
|  |              Policy Enforcement Point (PEP)               |    |
|  |   - Grant/Deny access                                     |    |
|  |   - Session monitoring                                    |    |
|  |   - Continuous validation                                 |    |
|  +----------------------------------------------------------+    |
|                                                                   |
+------------------------------------------------------------------+
```

## Identity Verification

Identity is the cornerstone of Zero Trust architecture. Every access request must be authenticated and authorized based on a comprehensive evaluation of identity attributes and context.

### Multi-Factor Authentication Implementation

Strong authentication requires multiple verification factors. Here is a comprehensive MFA implementation:

```python
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List
import hashlib
import secrets
import pyotp
import json


class AuthFactor(Enum):
    PASSWORD = "password"
    TOTP = "totp"
    HARDWARE_KEY = "hardware_key"
    BIOMETRIC = "biometric"
    PUSH_NOTIFICATION = "push_notification"


class RiskLevel(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class AuthContext:
    user_id: str
    ip_address: str
    device_id: str
    user_agent: str
    geolocation: Optional[dict]
    timestamp: datetime
    factors_completed: List[AuthFactor]


@dataclass
class AuthenticationResult:
    success: bool
    risk_level: RiskLevel
    required_factors: List[AuthFactor]
    session_token: Optional[str]
    message: str


class ZeroTrustAuthenticator:
    """
    Zero Trust Authentication System with adaptive MFA.
    Evaluates risk and requires appropriate authentication factors.
    """

    def __init__(self, policy_engine, risk_analyzer):
        self.policy_engine = policy_engine
        self.risk_analyzer = risk_analyzer
        self.session_store = {}

    def initiate_authentication(self, context: AuthContext) -> AuthenticationResult:
        """
        Begin authentication with risk-based factor requirements.
        """
        # Analyze risk based on context
        risk_assessment = self.risk_analyzer.assess(context)

        # Determine required factors based on risk
        required_factors = self._determine_required_factors(risk_assessment)

        # Check if user is attempting from known device
        if self._is_known_device(context.user_id, context.device_id):
            risk_assessment.risk_level = max(
                RiskLevel.LOW,
                RiskLevel(risk_assessment.risk_level.value - 1)
            )

        return AuthenticationResult(
            success=False,
            risk_level=risk_assessment.risk_level,
            required_factors=required_factors,
            session_token=None,
            message=f"Authentication requires: {[f.value for f in required_factors]}"
        )

    def _determine_required_factors(self, risk_assessment) -> List[AuthFactor]:
        """
        Determine authentication factors based on risk level.
        """
        base_factors = [AuthFactor.PASSWORD]

        if risk_assessment.risk_level == RiskLevel.LOW:
            return base_factors
        elif risk_assessment.risk_level == RiskLevel.MEDIUM:
            return base_factors + [AuthFactor.TOTP]
        elif risk_assessment.risk_level == RiskLevel.HIGH:
            return base_factors + [AuthFactor.TOTP, AuthFactor.PUSH_NOTIFICATION]
        else:  # CRITICAL
            return base_factors + [AuthFactor.HARDWARE_KEY, AuthFactor.BIOMETRIC]

    def verify_factor(
        self,
        context: AuthContext,
        factor: AuthFactor,
        credential: str
    ) -> bool:
        """
        Verify a specific authentication factor.
        """
        verifiers = {
            AuthFactor.PASSWORD: self._verify_password,
            AuthFactor.TOTP: self._verify_totp,
            AuthFactor.HARDWARE_KEY: self._verify_hardware_key,
            AuthFactor.BIOMETRIC: self._verify_biometric,
            AuthFactor.PUSH_NOTIFICATION: self._verify_push,
        }

        verifier = verifiers.get(factor)
        if verifier and verifier(context.user_id, credential):
            context.factors_completed.append(factor)
            return True
        return False

    def _verify_password(self, user_id: str, password: str) -> bool:
        """
        Verify password with secure hashing.
        """
        stored_hash = self._get_stored_password_hash(user_id)
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode(),
            self._get_salt(user_id),
            100000
        )
        return secrets.compare_digest(stored_hash, password_hash)

    def _verify_totp(self, user_id: str, token: str) -> bool:
        """
        Verify Time-based One-Time Password.
        """
        secret = self._get_totp_secret(user_id)
        totp = pyotp.TOTP(secret)
        # Allow 1 window before/after for clock skew
        return totp.verify(token, valid_window=1)

    def _verify_hardware_key(self, user_id: str, assertion: str) -> bool:
        """
        Verify FIDO2/WebAuthn hardware key assertion.
        """
        # Implementation would use python-fido2 library
        # Verify the cryptographic assertion from the hardware key
        return self._validate_fido2_assertion(user_id, assertion)

    def complete_authentication(self, context: AuthContext) -> AuthenticationResult:
        """
        Complete authentication after all factors verified.
        """
        risk_assessment = self.risk_analyzer.assess(context)
        required_factors = self._determine_required_factors(risk_assessment)

        # Check all required factors are completed
        if all(f in context.factors_completed for f in required_factors):
            session_token = self._create_session(context)
            return AuthenticationResult(
                success=True,
                risk_level=risk_assessment.risk_level,
                required_factors=required_factors,
                session_token=session_token,
                message="Authentication successful"
            )

        missing = [f for f in required_factors if f not in context.factors_completed]
        return AuthenticationResult(
            success=False,
            risk_level=risk_assessment.risk_level,
            required_factors=missing,
            session_token=None,
            message=f"Missing factors: {[f.value for f in missing]}"
        )


class RiskAnalyzer:
    """
    Analyzes authentication context to determine risk level.
    """

    def __init__(self):
        self.known_locations = {}
        self.known_devices = {}
        self.behavior_profiles = {}

    def assess(self, context: AuthContext) -> 'RiskAssessment':
        """
        Perform comprehensive risk assessment.
        """
        risk_score = 0
        risk_factors = []

        # Check for impossible travel
        if self._detect_impossible_travel(context):
            risk_score += 40
            risk_factors.append("impossible_travel")

        # Check device reputation
        device_risk = self._assess_device_risk(context)
        risk_score += device_risk
        if device_risk > 20:
            risk_factors.append("unknown_device")

        # Check IP reputation
        ip_risk = self._assess_ip_risk(context.ip_address)
        risk_score += ip_risk
        if ip_risk > 20:
            risk_factors.append("suspicious_ip")

        # Check time-based anomalies
        if self._is_unusual_time(context):
            risk_score += 15
            risk_factors.append("unusual_time")

        # Determine risk level
        if risk_score < 20:
            level = RiskLevel.LOW
        elif risk_score < 40:
            level = RiskLevel.MEDIUM
        elif risk_score < 70:
            level = RiskLevel.HIGH
        else:
            level = RiskLevel.CRITICAL

        return RiskAssessment(
            risk_level=level,
            risk_score=risk_score,
            risk_factors=risk_factors
        )

    def _detect_impossible_travel(self, context: AuthContext) -> bool:
        """
        Detect if user could not have physically traveled between locations.
        """
        last_location = self.known_locations.get(context.user_id)
        if not last_location or not context.geolocation:
            return False

        # Calculate distance and time between authentications
        distance = self._calculate_distance(
            last_location['coords'],
            context.geolocation
        )
        time_diff = (context.timestamp - last_location['timestamp']).total_seconds()

        # Assume max travel speed of 1000 km/h (fast plane)
        max_distance = (time_diff / 3600) * 1000

        return distance > max_distance


@dataclass
class RiskAssessment:
    risk_level: RiskLevel
    risk_score: int
    risk_factors: List[str]
```

### Continuous Authentication

Zero Trust requires ongoing verification throughout a session, not just at login:

```python
from typing import Callable
import threading
import time


class ContinuousAuthenticationMonitor:
    """
    Monitors user sessions for behavioral anomalies and risk changes.
    Implements continuous authentication for Zero Trust.
    """

    def __init__(self, risk_analyzer: RiskAnalyzer, session_manager):
        self.risk_analyzer = risk_analyzer
        self.session_manager = session_manager
        self.monitoring_threads = {}
        self.callbacks = {
            'step_up_auth': [],
            'session_terminate': [],
            'risk_change': []
        }

    def start_monitoring(self, session_id: str, context: AuthContext):
        """
        Begin continuous monitoring for a session.
        """
        def monitor_loop():
            while self._is_session_active(session_id):
                self._check_session_risk(session_id, context)
                time.sleep(30)  # Check every 30 seconds

        thread = threading.Thread(target=monitor_loop, daemon=True)
        self.monitoring_threads[session_id] = thread
        thread.start()

    def _check_session_risk(self, session_id: str, context: AuthContext):
        """
        Evaluate current session risk and take action if needed.
        """
        current_context = self._get_current_context(session_id)
        risk_assessment = self.risk_analyzer.assess(current_context)

        session = self.session_manager.get_session(session_id)
        original_risk = session.get('initial_risk_level')

        # Risk has increased significantly
        if risk_assessment.risk_level.value > original_risk.value + 1:
            self._trigger_step_up_auth(session_id, risk_assessment)

        # Critical risk detected - terminate session
        if risk_assessment.risk_level == RiskLevel.CRITICAL:
            self._terminate_session(session_id, "Critical risk detected")

    def _trigger_step_up_auth(self, session_id: str, risk_assessment):
        """
        Require additional authentication due to increased risk.
        """
        for callback in self.callbacks['step_up_auth']:
            callback(session_id, risk_assessment)

        # Reduce session permissions until step-up completed
        self.session_manager.reduce_permissions(session_id)

    def register_callback(self, event: str, callback: Callable):
        """
        Register callbacks for authentication events.
        """
        if event in self.callbacks:
            self.callbacks[event].append(callback)


class BehavioralAnalyzer:
    """
    Analyzes user behavior patterns for anomaly detection.
    """

    def __init__(self):
        self.behavior_models = {}

    def analyze_typing_pattern(self, user_id: str, keystroke_data: dict) -> float:
        """
        Analyze typing patterns for continuous authentication.
        Returns confidence score (0-1) that behavior matches user profile.
        """
        profile = self.behavior_models.get(user_id, {}).get('typing')
        if not profile:
            return 0.5  # No baseline, neutral confidence

        # Compare keystroke dynamics
        features = self._extract_typing_features(keystroke_data)
        similarity = self._calculate_similarity(features, profile)

        return similarity

    def analyze_mouse_movement(self, user_id: str, mouse_data: dict) -> float:
        """
        Analyze mouse movement patterns.
        """
        profile = self.behavior_models.get(user_id, {}).get('mouse')
        if not profile:
            return 0.5

        features = self._extract_mouse_features(mouse_data)
        return self._calculate_similarity(features, profile)

    def _extract_typing_features(self, keystroke_data: dict) -> dict:
        """
        Extract features from keystroke dynamics.
        """
        return {
            'mean_dwell_time': self._calculate_mean(keystroke_data.get('dwell_times', [])),
            'mean_flight_time': self._calculate_mean(keystroke_data.get('flight_times', [])),
            'typing_speed': keystroke_data.get('chars_per_minute', 0),
            'error_rate': keystroke_data.get('backspace_ratio', 0)
        }
```

## Microsegmentation

Microsegmentation divides the network into isolated segments, applying granular security policies to each. This limits lateral movement and contains breaches.

### Network Policy Implementation

```yaml
# Kubernetes Network Policy for Microsegmentation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-gateway-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-gateway
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Allow traffic only from load balancer
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-system
    - podSelector:
        matchLabels:
          app: nginx-ingress
    ports:
    - protocol: TCP
      port: 8080
  egress:
  # Allow only to specific backend services
  - to:
    - podSelector:
        matchLabels:
          app: user-service
    ports:
    - protocol: TCP
      port: 8081
  - to:
    - podSelector:
        matchLabels:
          app: order-service
    ports:
    - protocol: TCP
      port: 8082
  # Allow DNS resolution
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
---
# Service-to-service communication policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: user-service-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: user-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Only accept traffic from API gateway
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 8081
  egress:
  # Database access only
  - to:
    - podSelector:
        matchLabels:
          app: postgres
          tier: database
    ports:
    - protocol: TCP
      port: 5432
```

### Service Mesh for Zero Trust

Implementing Zero Trust with a service mesh provides mutual TLS, identity verification, and fine-grained access control:

```yaml
# Istio Authorization Policy for Zero Trust
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: user-service-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: user-service
  action: ALLOW
  rules:
  - from:
    - source:
        # Only allow requests from api-gateway service account
        principals: ["cluster.local/ns/production/sa/api-gateway"]
    to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/api/users/*"]
    when:
    - key: request.auth.claims[iss]
      values: ["https://auth.example.com"]
    - key: request.auth.claims[aud]
      values: ["user-service"]
---
# Peer Authentication - Require mTLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT
---
# Request Authentication - JWT validation
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: jwt-auth
  namespace: production
spec:
  selector:
    matchLabels:
      app: user-service
  jwtRules:
  - issuer: "https://auth.example.com"
    jwksUri: "https://auth.example.com/.well-known/jwks.json"
    audiences:
    - "user-service"
    forwardOriginalToken: true
```

### Application-Level Microsegmentation

```python
from functools import wraps
from typing import Set, Dict, List
from dataclasses import dataclass
import jwt


@dataclass
class ServiceIdentity:
    service_name: str
    namespace: str
    service_account: str
    allowed_operations: Set[str]
    allowed_resources: Set[str]


class MicrosegmentationEnforcer:
    """
    Enforces microsegmentation policies at the application level.
    """

    def __init__(self):
        self.policies: Dict[str, ServiceIdentity] = {}
        self.audit_log = []

    def register_service(self, identity: ServiceIdentity):
        """
        Register a service with its allowed operations.
        """
        key = f"{identity.namespace}/{identity.service_name}"
        self.policies[key] = identity

    def verify_service_identity(self, token: str) -> ServiceIdentity:
        """
        Verify the calling service identity from mTLS certificate or JWT.
        """
        try:
            # In production, verify against CA certificate
            claims = jwt.decode(
                token,
                options={"verify_signature": True},
                algorithms=["RS256"],
                audience="internal-services"
            )

            service_key = f"{claims['namespace']}/{claims['service']}"
            identity = self.policies.get(service_key)

            if not identity:
                raise SecurityException(f"Unknown service: {service_key}")

            return identity

        except jwt.InvalidTokenError as e:
            raise SecurityException(f"Invalid service token: {e}")

    def enforce_policy(self, operation: str, resource: str):
        """
        Decorator to enforce microsegmentation policies on endpoints.
        """
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Get service identity from request context
                identity = self._get_current_identity()

                # Verify operation is allowed
                if operation not in identity.allowed_operations:
                    self._log_violation(identity, operation, resource)
                    raise AccessDeniedException(
                        f"Service {identity.service_name} not authorized "
                        f"for operation: {operation}"
                    )

                # Verify resource access is allowed
                if not self._resource_matches(resource, identity.allowed_resources):
                    self._log_violation(identity, operation, resource)
                    raise AccessDeniedException(
                        f"Service {identity.service_name} not authorized "
                        f"for resource: {resource}"
                    )

                self._log_access(identity, operation, resource)
                return func(*args, **kwargs)

            return wrapper
        return decorator

    def _resource_matches(self, resource: str, allowed: Set[str]) -> bool:
        """
        Check if resource matches any allowed pattern.
        """
        for pattern in allowed:
            if pattern.endswith('*'):
                if resource.startswith(pattern[:-1]):
                    return True
            elif pattern == resource:
                return True
        return False


# Usage in Flask application
from flask import Flask, request, g

app = Flask(__name__)
enforcer = MicrosegmentationEnforcer()

# Register allowed services
enforcer.register_service(ServiceIdentity(
    service_name="api-gateway",
    namespace="production",
    service_account="api-gateway-sa",
    allowed_operations={"read_user", "create_user"},
    allowed_resources={"/users/*", "/profiles/*"}
))


@app.before_request
def verify_service():
    """
    Verify calling service on every request.
    """
    service_token = request.headers.get('X-Service-Token')
    if not service_token:
        return {"error": "Service authentication required"}, 401

    try:
        g.service_identity = enforcer.verify_service_identity(service_token)
    except SecurityException as e:
        return {"error": str(e)}, 403


@app.route('/api/users/<user_id>')
@enforcer.enforce_policy(operation="read_user", resource="/users/*")
def get_user(user_id):
    """
    Get user endpoint with microsegmentation enforcement.
    """
    return {"user_id": user_id, "name": "Example User"}
```

## Policy Decision and Enforcement

Zero Trust requires a centralized policy engine that makes access decisions based on multiple signals.

### Policy Decision Point (PDP)

```python
from dataclasses import dataclass
from typing import Dict, Any, List, Optional
from enum import Enum
import json


class Decision(Enum):
    ALLOW = "allow"
    DENY = "deny"
    REQUIRE_MFA = "require_mfa"
    REQUIRE_APPROVAL = "require_approval"


@dataclass
class PolicyContext:
    subject: Dict[str, Any]      # Who is requesting
    resource: Dict[str, Any]     # What is being requested
    action: str                   # What action is being performed
    environment: Dict[str, Any]  # Contextual information


@dataclass
class PolicyDecision:
    decision: Decision
    reasons: List[str]
    obligations: List[Dict[str, Any]]
    expires_at: Optional[int]


class ZeroTrustPolicyEngine:
    """
    Centralized policy decision point for Zero Trust architecture.
    Evaluates access requests against defined policies.
    """

    def __init__(self):
        self.policies = []
        self.risk_engine = RiskEngine()
        self.compliance_checker = ComplianceChecker()

    def evaluate(self, context: PolicyContext) -> PolicyDecision:
        """
        Evaluate access request against all applicable policies.
        """
        applicable_policies = self._find_applicable_policies(context)

        if not applicable_policies:
            return PolicyDecision(
                decision=Decision.DENY,
                reasons=["No applicable policies found - default deny"],
                obligations=[],
                expires_at=None
            )

        # Evaluate each policy
        decisions = []
        for policy in applicable_policies:
            decision = self._evaluate_policy(policy, context)
            decisions.append(decision)

        # Combine decisions (deny takes precedence)
        return self._combine_decisions(decisions)

    def _evaluate_policy(
        self,
        policy: 'Policy',
        context: PolicyContext
    ) -> PolicyDecision:
        """
        Evaluate a single policy against the context.
        """
        # Check subject conditions
        if not self._match_conditions(policy.subject_conditions, context.subject):
            return PolicyDecision(
                decision=Decision.DENY,
                reasons=[f"Subject conditions not met for policy: {policy.name}"],
                obligations=[],
                expires_at=None
            )

        # Check resource conditions
        if not self._match_conditions(policy.resource_conditions, context.resource):
            return PolicyDecision(
                decision=Decision.DENY,
                reasons=[f"Resource conditions not met for policy: {policy.name}"],
                obligations=[],
                expires_at=None
            )

        # Check action is allowed
        if context.action not in policy.allowed_actions:
            return PolicyDecision(
                decision=Decision.DENY,
                reasons=[f"Action {context.action} not permitted by policy: {policy.name}"],
                obligations=[],
                expires_at=None
            )

        # Check environmental conditions
        env_check = self._check_environmental_conditions(
            policy.environment_conditions,
            context.environment
        )
        if not env_check.passed:
            return PolicyDecision(
                decision=env_check.required_action,
                reasons=env_check.reasons,
                obligations=env_check.obligations,
                expires_at=None
            )

        # Risk-based evaluation
        risk_decision = self.risk_engine.evaluate(context)
        if risk_decision.requires_additional_auth:
            return PolicyDecision(
                decision=Decision.REQUIRE_MFA,
                reasons=["Elevated risk detected"],
                obligations=[{"type": "mfa", "factors": risk_decision.required_factors}],
                expires_at=None
            )

        return PolicyDecision(
            decision=Decision.ALLOW,
            reasons=[f"Access granted by policy: {policy.name}"],
            obligations=policy.obligations,
            expires_at=self._calculate_expiry(policy)
        )

    def _combine_decisions(self, decisions: List[PolicyDecision]) -> PolicyDecision:
        """
        Combine multiple policy decisions.
        Deny takes precedence, then require_mfa, then allow.
        """
        all_reasons = []
        all_obligations = []

        for decision in decisions:
            all_reasons.extend(decision.reasons)
            all_obligations.extend(decision.obligations)

            if decision.decision == Decision.DENY:
                return PolicyDecision(
                    decision=Decision.DENY,
                    reasons=all_reasons,
                    obligations=[],
                    expires_at=None
                )

        # Check for step-up auth requirements
        for decision in decisions:
            if decision.decision in [Decision.REQUIRE_MFA, Decision.REQUIRE_APPROVAL]:
                return PolicyDecision(
                    decision=decision.decision,
                    reasons=all_reasons,
                    obligations=all_obligations,
                    expires_at=None
                )

        # All policies allow
        min_expiry = min(
            (d.expires_at for d in decisions if d.expires_at),
            default=None
        )

        return PolicyDecision(
            decision=Decision.ALLOW,
            reasons=all_reasons,
            obligations=all_obligations,
            expires_at=min_expiry
        )


@dataclass
class Policy:
    name: str
    description: str
    subject_conditions: Dict[str, Any]
    resource_conditions: Dict[str, Any]
    allowed_actions: List[str]
    environment_conditions: Dict[str, Any]
    obligations: List[Dict[str, Any]]
    priority: int


# Example policy definitions
ZERO_TRUST_POLICIES = [
    Policy(
        name="production-database-access",
        description="Controls access to production databases",
        subject_conditions={
            "roles": ["database_admin", "senior_developer"],
            "mfa_verified": True,
            "device_compliance": True
        },
        resource_conditions={
            "type": "database",
            "environment": "production"
        },
        allowed_actions=["read", "write"],
        environment_conditions={
            "time_window": {"start": "09:00", "end": "18:00"},
            "source_network": ["corporate", "vpn"],
            "max_risk_score": 50
        },
        obligations=[
            {"type": "audit_log", "level": "detailed"},
            {"type": "session_recording", "enabled": True}
        ],
        priority=1
    ),
    Policy(
        name="sensitive-data-access",
        description="Controls access to sensitive data",
        subject_conditions={
            "clearance_level": ["confidential", "secret"],
            "training_completed": ["data_handling", "security_awareness"]
        },
        resource_conditions={
            "classification": ["confidential", "secret"]
        },
        allowed_actions=["read"],
        environment_conditions={
            "device_type": ["managed"],
            "network_zone": ["secure"]
        },
        obligations=[
            {"type": "watermark", "enabled": True},
            {"type": "prevent_download", "enabled": True}
        ],
        priority=1
    )
]
```

### Policy Enforcement Point (PEP)

```python
from abc import ABC, abstractmethod
import aiohttp
import asyncio


class PolicyEnforcementPoint(ABC):
    """
    Abstract base class for Policy Enforcement Points.
    """

    @abstractmethod
    async def enforce(self, request: 'AccessRequest') -> 'EnforcementResult':
        pass

    @abstractmethod
    async def apply_obligations(self, obligations: List[Dict]):
        pass


class APIGatewayPEP(PolicyEnforcementPoint):
    """
    Policy Enforcement Point implemented as an API Gateway.
    """

    def __init__(self, pdp_url: str, config: Dict):
        self.pdp_url = pdp_url
        self.config = config
        self.session = None
        self.decision_cache = {}

    async def enforce(self, request: 'AccessRequest') -> 'EnforcementResult':
        """
        Enforce access policy for incoming request.
        """
        # Build policy context from request
        context = self._build_context(request)

        # Check cache for recent identical requests
        cache_key = self._get_cache_key(context)
        cached_decision = self._check_cache(cache_key)

        if cached_decision:
            return self._apply_decision(cached_decision, request)

        # Query PDP for decision
        decision = await self._query_pdp(context)

        # Cache the decision
        if decision.decision == Decision.ALLOW:
            self._cache_decision(cache_key, decision)

        return await self._apply_decision(decision, request)

    async def _query_pdp(self, context: PolicyContext) -> PolicyDecision:
        """
        Query the Policy Decision Point for access decision.
        """
        if not self.session:
            self.session = aiohttp.ClientSession()

        async with self.session.post(
            f"{self.pdp_url}/evaluate",
            json={
                "subject": context.subject,
                "resource": context.resource,
                "action": context.action,
                "environment": context.environment
            },
            headers={"Authorization": f"Bearer {self._get_pdp_token()}"}
        ) as response:
            if response.status != 200:
                # Fail closed - deny on PDP error
                return PolicyDecision(
                    decision=Decision.DENY,
                    reasons=["PDP unavailable - fail closed"],
                    obligations=[],
                    expires_at=None
                )

            data = await response.json()
            return PolicyDecision(**data)

    async def _apply_decision(
        self,
        decision: PolicyDecision,
        request: 'AccessRequest'
    ) -> 'EnforcementResult':
        """
        Apply the policy decision to the request.
        """
        if decision.decision == Decision.DENY:
            return EnforcementResult(
                allowed=False,
                status_code=403,
                message="Access denied",
                headers={"X-Denial-Reason": "; ".join(decision.reasons)}
            )

        if decision.decision == Decision.REQUIRE_MFA:
            return EnforcementResult(
                allowed=False,
                status_code=401,
                message="Additional authentication required",
                headers={
                    "X-Auth-Required": "mfa",
                    "X-Auth-Methods": ",".join(
                        o.get('factors', [])
                        for o in decision.obligations
                        if o.get('type') == 'mfa'
                    )
                }
            )

        # Apply obligations
        await self.apply_obligations(decision.obligations)

        return EnforcementResult(
            allowed=True,
            status_code=200,
            message="Access granted",
            headers=self._build_security_headers(decision),
            modified_request=self._apply_request_modifications(request, decision)
        )

    async def apply_obligations(self, obligations: List[Dict]):
        """
        Apply policy obligations (audit logging, session recording, etc.)
        """
        for obligation in obligations:
            if obligation['type'] == 'audit_log':
                await self._create_audit_log(obligation)
            elif obligation['type'] == 'session_recording':
                await self._enable_session_recording()
            elif obligation['type'] == 'watermark':
                await self._enable_watermarking()
            elif obligation['type'] == 'rate_limit':
                await self._apply_rate_limit(obligation)
```

## Device Trust and Compliance

Zero Trust requires verification of device health and compliance before granting access.

```python
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime


@dataclass
class DevicePosture:
    device_id: str
    os_type: str
    os_version: str
    is_managed: bool
    encryption_enabled: bool
    antivirus_active: bool
    antivirus_updated: bool
    firewall_enabled: bool
    last_patch_date: datetime
    compliance_policies: List[str]
    risk_score: int


class DeviceTrustEvaluator:
    """
    Evaluates device trust level for Zero Trust access decisions.
    """

    def __init__(self, compliance_policies: Dict):
        self.compliance_policies = compliance_policies
        self.device_registry = {}

    def evaluate_device(self, posture: DevicePosture) -> 'DeviceTrustResult':
        """
        Evaluate device posture against compliance requirements.
        """
        violations = []
        trust_score = 100

        # Check encryption
        if not posture.encryption_enabled:
            violations.append("Disk encryption not enabled")
            trust_score -= 30

        # Check antivirus
        if not posture.antivirus_active:
            violations.append("Antivirus not active")
            trust_score -= 25
        elif not posture.antivirus_updated:
            violations.append("Antivirus definitions outdated")
            trust_score -= 10

        # Check firewall
        if not posture.firewall_enabled:
            violations.append("Firewall not enabled")
            trust_score -= 15

        # Check patch status
        days_since_patch = (datetime.now() - posture.last_patch_date).days
        if days_since_patch > 30:
            violations.append(f"System not patched in {days_since_patch} days")
            trust_score -= min(20, days_since_patch - 30)

        # Check OS version
        os_check = self._check_os_version(posture.os_type, posture.os_version)
        if not os_check.supported:
            violations.append(f"Unsupported OS version: {posture.os_version}")
            trust_score -= 40

        # Determine trust level
        if trust_score >= 80 and len(violations) == 0:
            trust_level = "high"
        elif trust_score >= 60:
            trust_level = "medium"
        elif trust_score >= 40:
            trust_level = "low"
        else:
            trust_level = "untrusted"

        return DeviceTrustResult(
            device_id=posture.device_id,
            trust_level=trust_level,
            trust_score=trust_score,
            violations=violations,
            remediation_required=trust_level in ["low", "untrusted"],
            allowed_resources=self._get_allowed_resources(trust_level)
        )

    def _get_allowed_resources(self, trust_level: str) -> List[str]:
        """
        Determine allowed resources based on device trust level.
        """
        resource_tiers = {
            "high": ["sensitive", "internal", "public"],
            "medium": ["internal", "public"],
            "low": ["public"],
            "untrusted": []
        }
        return resource_tiers.get(trust_level, [])


@dataclass
class DeviceTrustResult:
    device_id: str
    trust_level: str
    trust_score: int
    violations: List[str]
    remediation_required: bool
    allowed_resources: List[str]
```

## Implementing Zero Trust in Practice

### Complete Zero Trust Gateway

```python
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.security import HTTPBearer
from typing import Optional
import httpx


app = FastAPI(title="Zero Trust Gateway")
security = HTTPBearer()


class ZeroTrustGateway:
    """
    Complete Zero Trust gateway implementation.
    """

    def __init__(self):
        self.authenticator = ZeroTrustAuthenticator(
            policy_engine=ZeroTrustPolicyEngine(),
            risk_analyzer=RiskAnalyzer()
        )
        self.device_evaluator = DeviceTrustEvaluator({})
        self.policy_engine = ZeroTrustPolicyEngine()
        self.pep = APIGatewayPEP(
            pdp_url="http://pdp-service:8080",
            config={}
        )

    async def process_request(
        self,
        request: Request,
        token: str,
        target_service: str
    ):
        """
        Process incoming request through Zero Trust pipeline.
        """
        # Step 1: Verify identity
        identity = await self._verify_identity(token)
        if not identity.verified:
            raise HTTPException(status_code=401, detail="Identity verification failed")

        # Step 2: Evaluate device posture
        device_posture = await self._get_device_posture(request)
        device_trust = self.device_evaluator.evaluate_device(device_posture)

        if device_trust.trust_level == "untrusted":
            raise HTTPException(
                status_code=403,
                detail=f"Device not trusted: {device_trust.violations}"
            )

        # Step 3: Build policy context
        context = PolicyContext(
            subject={
                "user_id": identity.user_id,
                "roles": identity.roles,
                "mfa_verified": identity.mfa_verified,
                "device_trust": device_trust.trust_level
            },
            resource={
                "service": target_service,
                "path": request.url.path,
                "method": request.method
            },
            action=self._map_method_to_action(request.method),
            environment={
                "ip_address": request.client.host,
                "timestamp": datetime.now().isoformat(),
                "device_id": device_posture.device_id
            }
        )

        # Step 4: Get policy decision
        decision = self.policy_engine.evaluate(context)

        if decision.decision == Decision.DENY:
            raise HTTPException(status_code=403, detail=decision.reasons)

        if decision.decision == Decision.REQUIRE_MFA:
            raise HTTPException(
                status_code=401,
                detail="Additional authentication required",
                headers={"X-MFA-Required": "true"}
            )

        # Step 5: Forward request with security context
        return await self._forward_request(
            request,
            target_service,
            identity,
            decision.obligations
        )

    async def _forward_request(
        self,
        request: Request,
        target_service: str,
        identity: 'Identity',
        obligations: List[Dict]
    ):
        """
        Forward request to target service with security context.
        """
        async with httpx.AsyncClient() as client:
            # Build headers with verified identity
            headers = {
                "X-Verified-User-Id": identity.user_id,
                "X-User-Roles": ",".join(identity.roles),
                "X-Device-Trust-Level": identity.device_trust_level,
                "X-Request-Id": self._generate_request_id(),
            }

            # Apply any request modifications from obligations
            for obligation in obligations:
                if obligation['type'] == 'add_header':
                    headers[obligation['name']] = obligation['value']

            response = await client.request(
                method=request.method,
                url=f"http://{target_service}{request.url.path}",
                headers=headers,
                content=await request.body()
            )

            return response


gateway = ZeroTrustGateway()


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy(request: Request, path: str, token: str = Depends(security)):
    """
    Zero Trust proxy endpoint.
    """
    target_service = request.headers.get("X-Target-Service")
    if not target_service:
        raise HTTPException(status_code=400, detail="Target service not specified")

    return await gateway.process_request(request, token.credentials, target_service)
```

## Best Practices and Recommendations

### Zero Trust Implementation Checklist

1. **Identity Foundation**
   - Implement strong authentication (MFA for all users)
   - Use identity providers with modern protocols (OIDC, SAML 2.0)
   - Establish service identities for machine-to-machine communication
   - Implement continuous authentication and session monitoring

2. **Device Trust**
   - Deploy endpoint detection and response (EDR) solutions
   - Require device compliance checks before granting access
   - Implement device certificates for managed devices
   - Monitor device posture continuously

3. **Network Segmentation**
   - Implement microsegmentation at the application layer
   - Use software-defined perimeters (SDP)
   - Deploy network policies in container environments
   - Encrypt all traffic (mTLS for service-to-service)

4. **Data Protection**
   - Classify data by sensitivity
   - Implement data loss prevention (DLP)
   - Encrypt data at rest and in transit
   - Apply access controls at the data layer

5. **Visibility and Analytics**
   - Log all access attempts and decisions
   - Implement real-time monitoring and alerting
   - Use behavioral analytics for anomaly detection
   - Regular access reviews and certification

### Common Pitfalls to Avoid

```
+------------------------------------------------------------------+
|                 Zero Trust Anti-Patterns                          |
+------------------------------------------------------------------+
|  Anti-Pattern              |  Better Approach                     |
+------------------------------------------------------------------+
|  VPN = Zero Trust          |  VPN is transport, not access control|
|  One-time authentication   |  Continuous verification required    |
|  Network location trust    |  Identity and context-based trust    |
|  Implicit trust for        |  Explicit verification for all       |
|  internal services         |  service-to-service communication    |
|  Static policies           |  Dynamic, risk-adaptive policies     |
|  All-or-nothing access     |  Granular, least-privilege access    |
+------------------------------------------------------------------+
```

## Conclusion

Zero Trust Security Architecture represents a fundamental shift in how organizations approach security. By eliminating implicit trust and continuously verifying every access request based on identity, device health, and context, organizations can better protect their assets in an environment where traditional perimeters no longer exist.

Key takeaways for implementing Zero Trust:

1. **Start with identity**: Strong authentication and identity management form the foundation of Zero Trust.

2. **Embrace microsegmentation**: Divide your network and applications into isolated segments with strict access controls.

3. **Implement continuous verification**: Do not rely solely on initial authentication; verify throughout the session.

4. **Adopt least privilege**: Grant only the minimum access necessary for each user and service.

5. **Assume breach**: Design systems as if attackers are already inside, limiting lateral movement and blast radius.

6. **Invest in visibility**: You cannot protect what you cannot see; comprehensive logging and monitoring are essential.

Zero Trust is not a single product but a comprehensive security strategy that requires ongoing commitment and continuous improvement. The code examples and patterns in this guide provide a foundation for building Zero Trust capabilities into your applications and infrastructure.
