---
title: Helm Kubernetes Package Manager
description: Master Helm for Kubernetes application management
track: devops
section: kubernetes
difficulty: intermediate
tags:
  - Helm
  - Kubernetes
  - Package Manager
  - Chart
status: imported
origin: old/src/content/docs/devops/helm.en.md
divergence: 0.191
issues: []
legacy:
  category: DevOps
  subcategory: Kubernetes
  order: 14
  lastUpdated: 2026-01-07
---

## Introduction

### What is Helm?

Helm is the package manager for Kubernetes, similar to apt for Debian/Ubuntu, yum for Red Hat, or Homebrew for macOS. It allows developers and operators to define, install, and upgrade complex Kubernetes applications with ease.

The name "Helm" comes from nautical terminology, meaning the wheel or tiller of a ship, complementing Kubernetes (which means "helmsman" in Greek). This naming reflects Helm's vision of helping users steer their Kubernetes deployments.

### Why Use Helm?

Deploying a typical microservices application without Helm might require managing dozens of YAML files: Deployments, Services, ConfigMaps, Secrets, Ingress resources, and more. Helm addresses several core challenges:

- **Simplified Complexity**: Bundle multiple Kubernetes resources into a single deployable unit
- **Version Management**: Track deployment history and support rollbacks
- **Configuration Management**: Use Values files to differentiate configurations across environments
- **Dependency Management**: Automatically handle dependencies between applications
- **Reusability**: Charts can be reused across different environments and projects
- **Standardization**: Provide a unified standard for packaging and distributing applications

### Helm Evolution

- **Helm 2**: Used a client-server architecture requiring Tiller deployment in the cluster
- **Helm 3** (current): Removed Tiller, authenticates directly via kubeconfig, making it more secure and simpler

---

## Core Concepts

### Chart

A Chart is Helm's packaging format, containing all the resource definitions needed to run a Kubernetes application. Think of it as an "installer package" for Kubernetes applications.

```
mychart/
  Chart.yaml          # Chart metadata
  LICENSE             # Optional: License file
  README.md           # Optional: Documentation
  values.yaml         # Default configuration values
  values.schema.json  # Optional: JSON Schema for values validation
  charts/             # Dependent charts
  crds/               # Custom Resource Definitions
  templates/          # Template files directory
    deployment.yaml
    service.yaml
    _helpers.tpl      # Template helper functions
    NOTES.txt         # Post-installation notes
  templates/tests/    # Test files
```

### Release

A Release is a running instance of a Chart in a Kubernetes cluster. The same Chart can be installed multiple times in the same cluster, with each installation creating a new Release.

```bash
# Install a Chart to create a Release
helm install my-release bitnami/nginx

# List all Releases
helm list

# Namespace isolation for Releases
helm install my-release bitnami/nginx -n production
helm install my-release bitnami/nginx -n staging
```

### Repository

A Repository is a place where Charts are stored and shared, similar to Docker Hub for Docker images.

```bash
# Add official repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add stable https://charts.helm.sh/stable

# Update repository index
helm repo update

# Search for Charts
helm search repo nginx
helm search hub wordpress  # Search Artifact Hub

# List repositories
helm repo list

# Remove a repository
helm repo remove stable
```

---

## Chart Structure and Development

### Creating a Chart

```bash
# Create a new Chart
helm create myapp

# Generated directory structure
myapp/
├── Chart.yaml
├── values.yaml
├── charts/
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── serviceaccount.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── _helpers.tpl
│   ├── NOTES.txt
│   └── tests/
│       └── test-connection.yaml
└── .helmignore
```

### Chart.yaml Explained

```yaml
# Chart.yaml - Chart metadata
apiVersion: v2                    # Helm 3 uses v2
name: myapp                       # Chart name
description: A Helm chart for MyApp
type: application                 # application or library
version: 1.0.0                    # Chart version (follows SemVer)
appVersion: "2.0.0"              # Application version

# Maintainer information
maintainers:
  - name: DevOps Team
    email: devops@example.com
    url: https://example.com

# Keywords for searchability
keywords:
  - myapp
  - web
  - microservice

# Project homepage
home: https://github.com/example/myapp

# Source repositories
sources:
  - https://github.com/example/myapp

# Dependency definitions
dependencies:
  - name: postgresql
    version: "12.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
    tags:
      - database
  - name: redis
    version: "17.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled

# Annotations
annotations:
  category: Database
  licenses: Apache-2.0
```

### .helmignore File

```plaintext
# Similar to .gitignore, defines files to ignore during packaging
.git/
.gitignore
.helmignore
*.swp
*.bak
*.tmp
*.orig
*~
.idea/
*.tmproj
.vscode/
```

---

## Values and Templates

### Designing values.yaml

```yaml
# values.yaml - Default configuration values
# Basic settings
replicaCount: 3
nameOverride: ""
fullnameOverride: ""

# Image configuration
image:
  repository: myapp/backend
  pullPolicy: IfNotPresent
  tag: ""  # Defaults to appVersion

imagePullSecrets: []

# Service account
serviceAccount:
  create: true
  annotations: {}
  name: ""

# Pod security context
podSecurityContext:
  fsGroup: 1000

securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false

# Service configuration
service:
  type: ClusterIP
  port: 80
  targetPort: 8080
  annotations: {}

# Ingress configuration
ingress:
  enabled: false
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: myapp-tls
      hosts:
        - myapp.example.com

# Resource configuration
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

# Autoscaling
autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80

# Health checks
livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5

# Node scheduling
nodeSelector: {}
tolerations: []
affinity: {}

# Application configuration
config:
  logLevel: info
  database:
    host: postgresql
    port: 5432
    name: myapp
  cache:
    enabled: true
    host: redis
    port: 6379

# Environment variables
env: []
  # - name: CUSTOM_VAR
  #   value: "custom-value"

# Secret references
envFrom: []
  # - secretRef:
  #     name: myapp-secrets

# Dependency toggles
postgresql:
  enabled: true
  auth:
    database: myapp
    username: myapp

redis:
  enabled: false
```

### Template Basics

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "myapp.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.targetPort }}
              protocol: TCP
          livenessProbe:
            {{- toYaml .Values.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.readinessProbe | nindent 12 }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          env:
            - name: LOG_LEVEL
              value: {{ .Values.config.logLevel | quote }}
            - name: DB_HOST
              value: {{ .Values.config.database.host | quote }}
            - name: DB_PORT
              value: {{ .Values.config.database.port | quote }}
            {{- with .Values.env }}
            {{- toYaml . | nindent 12 }}
            {{- end }}
          {{- with .Values.envFrom }}
          envFrom:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          volumeMounts:
            - name: config
              mountPath: /etc/myapp
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: {{ include "myapp.fullname" . }}-config
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

### _helpers.tpl Helper Templates

```yaml
# templates/_helpers.tpl
{{/*
Expand the chart name
*/}}
{{- define "myapp.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a fully qualified name, prioritizing fullnameOverride,
otherwise combining release name and chart name
*/}}
{{- define "myapp.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart label
*/}}
{{- define "myapp.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "myapp.labels" -}}
helm.sh/chart: {{ include "myapp.chart" . }}
{{ include "myapp.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "myapp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "myapp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Service account name
*/}}
{{- define "myapp.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "myapp.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Database connection string
*/}}
{{- define "myapp.databaseUrl" -}}
{{- $host := .Values.config.database.host -}}
{{- $port := .Values.config.database.port -}}
{{- $name := .Values.config.database.name -}}
{{- printf "postgresql://%s:%v/%s" $host $port $name -}}
{{- end }}
```

---

## Template Functions

Helm uses Go templates enhanced with the Sprig library, providing a rich set of functions for data manipulation.

### String Functions

```yaml
# String manipulation
{{ .Values.name | upper }}              # Convert to uppercase
{{ .Values.name | lower }}              # Convert to lowercase
{{ .Values.name | title }}              # Capitalize first letter
{{ .Values.name | quote }}              # Add double quotes
{{ .Values.name | squote }}             # Add single quotes
{{ .Values.name | trim }}               # Remove leading/trailing whitespace
{{ .Values.name | trimPrefix "v" }}     # Remove prefix
{{ .Values.name | trimSuffix "-" }}     # Remove suffix
{{ .Values.name | trunc 63 }}           # Truncate string
{{ .Values.name | replace "-" "_" }}    # Replace characters
{{ .Values.name | contains "foo" }}     # Check if contains
{{ .Values.name | hasPrefix "v" }}      # Check prefix
{{ .Values.name | hasSuffix "-" }}      # Check suffix
{{ .Values.name | indent 4 }}           # Add indentation
{{ .Values.name | nindent 4 }}          # Newline and indent

# Default values
{{ .Values.name | default "myapp" }}
{{ coalesce .Values.name .Values.fallback "default" }}
```

### Type Conversion Functions

```yaml
# Type conversions
{{ .Values.port | int }}
{{ .Values.enabled | toString }}
{{ .Values.data | toJson }}
{{ .Values.data | toYaml }}
{{ .Values.data | toPrettyJson }}
```

### List Functions

```yaml
# List operations
{{ list "a" "b" "c" }}                  # Create list
{{ .Values.list | first }}             # First element
{{ .Values.list | last }}              # Last element
{{ .Values.list | rest }}              # All except first
{{ .Values.list | initial }}           # All except last
{{ .Values.list | reverse }}           # Reverse list
{{ .Values.list | uniq }}              # Remove duplicates
{{ .Values.list | sortAlpha }}         # Alphabetical sort
{{ append .Values.list "d" }}          # Append element
{{ concat .Values.list1 .Values.list2 }}  # Merge lists
{{ has "item" .Values.list }}          # Check if contains
```

### Dictionary Functions

```yaml
# Dictionary operations
{{ dict "key1" "value1" "key2" "value2" }}
{{ .Values.map | keys }}               # Get all keys
{{ .Values.map | values }}             # Get all values
{{ merge .Values.map1 .Values.map2 }}  # Merge dictionaries
{{ hasKey .Values.map "key" }}         # Check if key exists
{{ get .Values.map "key" }}            # Get value
{{ set .Values.map "key" "value" }}    # Set value
{{ unset .Values.map "key" }}          # Delete key
{{ omit .Values.map "key1" "key2" }}   # Exclude specified keys
{{ pick .Values.map "key1" "key2" }}   # Keep only specified keys
```

### Math Functions

```yaml
# Math operations
{{ add 1 2 }}                          # Addition
{{ sub 5 3 }}                          # Subtraction
{{ mul 2 3 }}                          # Multiplication
{{ div 6 2 }}                          # Division
{{ mod 7 3 }}                          # Modulo
{{ max 1 2 3 }}                        # Maximum value
{{ min 1 2 3 }}                        # Minimum value
{{ floor 1.5 }}                        # Floor
{{ ceil 1.5 }}                         # Ceiling
{{ round 1.5 }}                        # Round
```

### Date and Encoding Functions

```yaml
# Date functions
{{ now }}                              # Current time
{{ now | date "2006-01-02" }}          # Format date
{{ now | dateModify "+1h" }}           # Modify time
{{ now | unixEpoch }}                  # Unix timestamp

# Encoding functions
{{ .Values.data | b64enc }}            # Base64 encode
{{ .Values.data | b64dec }}            # Base64 decode
{{ .Values.data | sha256sum }}         # SHA256 hash
```

### Flow Control

```yaml
# Conditional statements
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
...
{{- end }}

# if-else
{{- if eq .Values.env "production" }}
replicas: 5
{{- else if eq .Values.env "staging" }}
replicas: 2
{{- else }}
replicas: 1
{{- end }}

# Comparison operators
{{ if eq .Values.a .Values.b }}        # Equal
{{ if ne .Values.a .Values.b }}        # Not equal
{{ if lt .Values.a .Values.b }}        # Less than
{{ if le .Values.a .Values.b }}        # Less than or equal
{{ if gt .Values.a .Values.b }}        # Greater than
{{ if ge .Values.a .Values.b }}        # Greater than or equal

# Logical operators
{{ if and .Values.a .Values.b }}       # And
{{ if or .Values.a .Values.b }}        # Or
{{ if not .Values.a }}                 # Not

# Empty checks
{{ if .Values.name }}                  # Non-empty check
{{ if empty .Values.name }}            # Empty check

# with statement (sets current scope)
{{- with .Values.nodeSelector }}
nodeSelector:
  {{- toYaml . | nindent 8 }}
{{- end }}

# range loops
{{- range .Values.hosts }}
- host: {{ .host | quote }}
  paths:
    {{- range .paths }}
    - path: {{ .path }}
      pathType: {{ .pathType }}
    {{- end }}
{{- end }}

# range with index
{{- range $index, $host := .Values.hosts }}
# Host {{ $index }}: {{ $host.host }}
{{- end }}

# range over dictionary
{{- range $key, $value := .Values.labels }}
{{ $key }}: {{ $value | quote }}
{{- end }}
```

### Advanced Template Usage

```yaml
# Pipeline chaining
{{ .Values.name | lower | quote }}
{{ .Values.data | toYaml | indent 4 }}

# Template references
{{ include "myapp.labels" . | nindent 4 }}

# Required value validation
{{ required "A valid .Values.database.host is required!" .Values.database.host }}

# Fail processing
{{ fail "Please provide a valid configuration" }}

# printf formatting
{{ printf "%s-%s" .Release.Name .Chart.Name }}

# Regular expressions
{{ regexMatch "^[a-z]+$" .Values.name }}
{{ regexFind "[0-9]+" .Values.version }}
{{ regexReplaceAll "[^a-zA-Z0-9]" .Values.name "-" }}

# Type checking
{{ kindOf .Values.data }}              # Return type
{{ kindIs "map" .Values.data }}        # Type check
{{ typeOf .Values.data }}              # Detailed type

# Generate random values
{{ randAlphaNum 10 }}                  # Random alphanumeric
{{ randAlpha 10 }}                     # Random letters
{{ randNumeric 10 }}                   # Random numbers
{{ uuidv4 }}                           # Generate UUID

# The tpl function - evaluate strings as templates
# values.yaml
# template: "{{ .Values.name }}"
# name: "Tom"

# In template:
{{ tpl .Values.template . }}
# Output: Tom
```

---

## Dependencies

### Defining Dependencies

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: "12.1.0"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
    tags:
      - database
    import-values:
      - data

  - name: redis
    version: "17.3.0"
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
    alias: cache

  - name: common
    version: "2.x.x"
    repository: https://charts.bitnami.com/bitnami

  # Local dependency
  - name: mylib
    version: "1.0.0"
    repository: file://../mylib
```

### Dependency Commands

```bash
# Download dependencies
helm dependency update ./mychart

# Build dependencies (update Chart.lock)
helm dependency build ./mychart

# List dependencies
helm dependency list ./mychart

# Dependencies are stored in:
mychart/
  charts/
    postgresql-12.1.0.tgz
    redis-17.3.0.tgz
```

### Overriding Dependency Configuration

```yaml
# values.yaml
# Enable/disable dependencies
postgresql:
  enabled: true
  auth:
    username: myapp
    password: secret
    database: myapp
  primary:
    persistence:
      enabled: true
      size: 10Gi

# Configure using alias
cache:  # Alias for redis
  enabled: true
  architecture: standalone
  auth:
    enabled: false
```

### Importing Dependency Values

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: "12.1.0"
    repository: https://charts.bitnami.com/bitnami
    import-values:
      - child: primary.service
        parent: database

# Effect: postgresql's primary.service is imported to .Values.database
```

---

## Hooks

Helm provides several hooks that allow you to execute operations at different stages of a Release lifecycle.

### Hook Types

| Hook | Description |
|------|-------------|
| pre-install | Executes after templates are rendered but before resources are created |
| post-install | Executes after all resources are created |
| pre-delete | Executes before any resources are deleted |
| post-delete | Executes after all resources are deleted |
| pre-upgrade | Executes after templates are rendered but before resources are updated |
| post-upgrade | Executes after all resources are updated |
| pre-rollback | Executes before rollback |
| post-rollback | Executes after rollback |
| test | Runs when `helm test` is executed |

### Hook Examples

```yaml
# templates/hooks/pre-install-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-pre-install
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: pre-install
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          command: ['sh', '-c', 'echo Pre-install hook running...']
---
# templates/hooks/post-install-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-post-install
  annotations:
    "helm.sh/hook": post-install,post-upgrade
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: post-install
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          command:
            - sh
            - -c
            - |
              echo "Running database migrations..."
              /app/migrate up
              echo "Migrations completed successfully"
```

### Database Migration Hook

```yaml
# templates/hooks/db-migrate.yaml
{{- if .Values.migrations.enabled }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-db-migrate
  annotations:
    "helm.sh/hook": pre-upgrade,pre-install
    "helm.sh/hook-weight": "-1"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: 3
  activeDeadlineSeconds: 300
  template:
    metadata:
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      restartPolicy: Never
      initContainers:
        - name: wait-for-db
          image: busybox:1.35
          command:
            - sh
            - -c
            - |
              until nc -z {{ .Values.config.database.host }} {{ .Values.config.database.port }}; do
                echo "Waiting for database..."
                sleep 2
              done
      containers:
        - name: migrate
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          command: ["/app/migrate", "up"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-secret
                  key: database-url
          resources:
            limits:
              cpu: 200m
              memory: 256Mi
            requests:
              cpu: 100m
              memory: 128Mi
{{- end }}
```

### Hook Deletion Policies

```yaml
annotations:
  # Deletion policy options:
  "helm.sh/hook-delete-policy": before-hook-creation  # Delete old hook before creating new
  "helm.sh/hook-delete-policy": hook-succeeded        # Delete after hook succeeds
  "helm.sh/hook-delete-policy": hook-failed           # Delete after hook fails

  # Multiple policies can be combined
  "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
```

### Hook Execution Order

Hooks execute in a specific order:

1. Sorted by `helm.sh/hook-weight` from lowest to highest
2. Same weight hooks sorted by resource type and name
3. Each hook waits for completion before the next executes
4. Hook failure blocks subsequent operations (unless deletion policy is set)

```yaml
# Execution order example
annotations:
  "helm.sh/hook": pre-install
  "helm.sh/hook-weight": "-5"  # Executes first

annotations:
  "helm.sh/hook": pre-install
  "helm.sh/hook-weight": "5"   # Executes second
```

---

## Chart Testing

### Defining Test Resources

```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "myapp.fullname" . }}-test-connection"
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: wget
      image: busybox:1.35
      command: ['wget']
      args: ['{{ include "myapp.fullname" . }}:{{ .Values.service.port }}']
---
# templates/tests/test-api.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "myapp.fullname" . }}-test-api"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-weight": "1"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: curl
      image: curlimages/curl:8.1.0
      command:
        - sh
        - -c
        - |
          set -e

          # Test health endpoint
          echo "Testing health endpoint..."
          curl -f http://{{ include "myapp.fullname" . }}:{{ .Values.service.port }}/health

          # Test API endpoint
          echo "Testing API endpoint..."
          response=$(curl -s http://{{ include "myapp.fullname" . }}:{{ .Values.service.port }}/api/v1/status)

          # Validate response
          if echo "$response" | grep -q "ok"; then
            echo "API test passed!"
            exit 0
          else
            echo "API test failed!"
            exit 1
          fi
```

### Running Tests

```bash
# Run tests after installation
helm test my-release

# View test logs
helm test my-release --logs

# Set timeout
helm test my-release --timeout 5m

# Keep Pod for debugging after failure
helm test my-release --logs 2>&1 || kubectl logs my-release-test-api
```

### Chart Validation

```bash
# Syntax check
helm lint ./mychart

# Lint with values file
helm lint ./mychart -f production-values.yaml

# Strict mode
helm lint ./mychart --strict

# Template rendering test
helm template my-release ./mychart

# Render specific template
helm template my-release ./mychart -s templates/deployment.yaml

# Dry run installation
helm install my-release ./mychart --dry-run --debug

# Validate Kubernetes resources
helm install my-release ./mychart --dry-run --debug | kubectl apply --dry-run=client -f -
```

---

## Repository Management

### Creating a Private Repository

```bash
# Using ChartMuseum
docker run -d \
  -p 8080:8080 \
  -e STORAGE=local \
  -e STORAGE_LOCAL_ROOTDIR=/charts \
  -v $(pwd)/charts:/charts \
  ghcr.io/helm/chartmuseum:v0.16.0

# Add private repository
helm repo add myrepo http://localhost:8080

# Push Chart
helm cm-push mychart-0.1.0.tgz myrepo
```

### OCI Registry Support

```bash
# Helm 3.8+ natively supports OCI registries
# Login to OCI registry
helm registry login registry.example.com

# Push Chart to OCI registry
helm push mychart-1.0.0.tgz oci://registry.example.com/charts

# Install from OCI registry
helm install my-release oci://registry.example.com/charts/mychart --version 1.0.0

# Pull Chart
helm pull oci://registry.example.com/charts/mychart --version 1.0.0
```

### GitHub Pages as Repository

```yaml
# .github/workflows/release.yaml
name: Release Charts

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Configure Git
        run: |
          git config user.name "$GITHUB_ACTOR"
          git config user.email "$GITHUB_ACTOR@users.noreply.github.com"

      - name: Install Helm
        uses: azure/setup-helm@v3

      - name: Run chart-releaser
        uses: helm/chart-releaser-action@v1.6.0
        env:
          CR_TOKEN: "${{ secrets.GITHUB_TOKEN }}"
```

### Repository Index Management

```bash
# Generate repository index
helm repo index ./charts --url https://example.com/charts

# Merge with existing index
helm repo index ./charts --url https://example.com/charts --merge index.yaml
```

The `index.yaml` structure:

```yaml
apiVersion: v1
entries:
  mychart:
    - apiVersion: v2
      appVersion: "1.0.0"
      created: "2024-01-15T10:00:00Z"
      description: My application chart
      digest: sha256:abc123...
      name: mychart
      type: application
      urls:
        - https://example.com/charts/mychart-1.0.0.tgz
      version: 1.0.0
generated: "2024-01-15T10:00:00Z"
```

---

## CI/CD Integration

### GitHub Actions Integration

```yaml
# .github/workflows/helm-deploy.yaml
name: Helm Deploy

on:
  push:
    branches: [main]
  release:
    types: [published]

env:
  CHART_PATH: ./charts/myapp
  HELM_VERSION: '3.14.0'

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Helm
        uses: azure/setup-helm@v3
        with:
          version: ${{ env.HELM_VERSION }}

      - name: Lint Chart
        run: helm lint ${{ env.CHART_PATH }}

      - name: Template Chart
        run: helm template test ${{ env.CHART_PATH }} --debug

      - name: Set up chart-testing
        uses: helm/chart-testing-action@v2.6.1

      - name: Run chart-testing (lint)
        run: ct lint --target-branch main --charts ${{ env.CHART_PATH }}

  deploy-staging:
    needs: lint-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Set up Helm
        uses: azure/setup-helm@v3
        with:
          version: ${{ env.HELM_VERSION }}

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}

      - name: Deploy to staging
        run: |
          helm upgrade --install myapp ${{ env.CHART_PATH }} \
            --namespace staging \
            --create-namespace \
            -f ${{ env.CHART_PATH }}/values-staging.yaml \
            --set image.tag=${{ github.sha }} \
            --wait \
            --timeout 5m

      - name: Run tests
        run: helm test myapp -n staging --logs

  deploy-production:
    needs: lint-test
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Set up Helm
        uses: azure/setup-helm@v3
        with:
          version: ${{ env.HELM_VERSION }}

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}

      - name: Deploy to production
        run: |
          helm upgrade --install myapp ${{ env.CHART_PATH }} \
            --namespace production \
            -f ${{ env.CHART_PATH }}/values-production.yaml \
            --set image.tag=${{ github.event.release.tag_name }} \
            --wait \
            --timeout 10m \
            --atomic
```

### ArgoCD Integration

```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/example/helm-charts
    targetRevision: HEAD
    path: charts/myapp
    helm:
      releaseName: myapp
      valueFiles:
        - values.yaml
        - values-production.yaml
      parameters:
        - name: image.tag
          value: "v1.2.3"
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

---

## Command Reference

```bash
# Installation and Management
helm install <release> <chart>              # Install Chart
helm install <release> <chart> -f values.yaml  # Use custom values
helm install <release> <chart> --set key=value  # Set values via CLI
helm install <release> <chart> --namespace <ns> --create-namespace
helm install <release> <chart> --dry-run --debug  # Simulate installation
helm install <release> <chart> --wait --timeout 5m  # Wait for ready
helm install <release> <chart> --atomic       # Auto-rollback on failure

helm upgrade <release> <chart>              # Upgrade Release
helm upgrade --install <release> <chart>    # Install or upgrade
helm upgrade <release> <chart> --reuse-values  # Reuse existing values

helm rollback <release> <revision>          # Rollback to specific version
helm rollback <release> 0                   # Rollback to previous version

helm uninstall <release>                    # Uninstall Release
helm uninstall <release> --keep-history     # Keep history records

# Querying
helm list                                   # List all Releases
helm list -A                                # All namespaces
helm list -a                                # Include failed
helm status <release>                       # View status
helm history <release>                      # View history
helm get values <release>                   # Get values
helm get manifest <release>                 # Get manifest
helm get all <release>                      # Get all information

# Repository
helm repo add <name> <url>                  # Add repository
helm repo update                            # Update repositories
helm repo list                              # List repositories
helm search repo <keyword>                  # Search Chart
helm search hub <keyword>                   # Search Artifact Hub

# Chart Development
helm create <name>                          # Create Chart
helm lint <chart>                           # Syntax check
helm template <release> <chart>             # Render templates
helm package <chart>                        # Package Chart
helm dependency update <chart>              # Update dependencies
helm test <release>                         # Run tests

# Plugins
helm plugin list                            # List plugins
helm plugin install <url>                   # Install plugin
helm plugin uninstall <name>                # Uninstall plugin
```

---

## Interview Key Points

### Basic Concepts

**Q1: Explain the relationship between Chart, Release, and Repository in Helm.**

A:
- **Chart** is Helm's packaging format, containing all resource definitions needed to run a Kubernetes application, similar to rpm/deb packages in Linux
- **Release** is a running instance of a Chart in a cluster. The same Chart can be installed multiple times, each creating a new Release
- **Repository** is a server for storing and sharing Charts, similar to Docker Hub

Relationship: Download Charts from Repository, install Chart to create Release.

**Q2: What are the main differences between Helm 2 and Helm 3?**

A:
1. **Removed Tiller**: Helm 3 no longer requires server-side components, authenticates directly via kubeconfig
2. **Release Storage**: Changed from ConfigMap to Secret, stored in the Release's namespace
3. **Three-way Merge Upgrades**: Compares live state, old Chart, and new Chart for merging
4. **JSON Schema Validation**: Supports values.schema.json for input validation
5. **OCI Support**: Native support for OCI registry storage of Charts
6. **Namespace Isolation**: Release names are unique within namespace, not globally

### Practical Applications

**Q3: How do you implement configuration management in Helm Charts?**

A:
```yaml
# Multi-environment values files
helm upgrade myapp ./chart \
  -f values.yaml \
  -f values-production.yaml \
  --set image.tag=v1.2.3

# Use lookup function to get existing cluster resources
{{- $secret := lookup "v1" "Secret" .Release.Namespace "existing-secret" }}
{{- if $secret }}
  existingSecretName: existing-secret
{{- end }}

# Configuration changes trigger restart
annotations:
  checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
```

**Q4: How do you handle Helm upgrade failures?**

A:
```bash
# Check Release status
helm status myapp
helm history myapp

# Rollback to previous version
helm rollback myapp 0

# Use --atomic for automatic rollback
helm upgrade myapp ./chart --atomic --timeout 5m

# Force resource replacement
helm upgrade myapp ./chart --force

# Clean up failed Release
helm uninstall myapp
helm install myapp ./chart
```

**Q5: Explain the Hook execution order in Helm.**

A:
1. Sorted by `helm.sh/hook-weight` from lowest to highest
2. Same weight sorted by resource type and name
3. Synchronously waits for each Hook to complete before executing the next
4. Hook failure blocks subsequent operations (unless `hook-delete-policy` is set)

### Architecture Design

**Q6: How do you design a reusable Helm Library Chart?**

A:
```yaml
# Chart.yaml
apiVersion: v2
name: mylib
type: library  # Declare as library type
version: 1.0.0

# templates/_helpers.tpl
{{- define "mylib.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

{{- define "mylib.deployment" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mylib.fullname" . }}
  labels:
    {{- include "mylib.labels" . | nindent 4 }}
spec:
  # Common Deployment template
{{- end }}

# Usage in other Charts
dependencies:
  - name: mylib
    version: "1.x.x"
    repository: file://../mylib

# templates/deployment.yaml
{{- include "mylib.deployment" . }}
```

**Q7: How do you securely manage Helm Secrets in CI/CD?**

A:
```bash
# Use helm-secrets plugin
helm plugin install https://github.com/jkroepke/helm-secrets

# Encrypt secrets file
helm secrets enc values-secrets.yaml

# Decrypt during installation
helm secrets install myapp ./chart -f values-secrets.yaml

# Use external secret management
# Reference ExternalSecret in templates
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: {{ include "myapp.fullname" . }}-secret
  data:
    - secretKey: password
      remoteRef:
        key: myapp/database
        property: password

# Inject in CI/CD
helm upgrade myapp ./chart \
  --set database.password=$DB_PASSWORD
```

---

## Best Practices

### Chart Development Best Practices

1. **Use values.schema.json for Input Validation**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["image", "service"],
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": {
        "repository": {
          "type": "string",
          "pattern": "^[a-z0-9][a-z0-9/._-]*$"
        },
        "tag": {
          "type": "string"
        }
      }
    }
  }
}
```

2. **Provide Meaningful NOTES.txt**

```text
# templates/NOTES.txt
{{- $fullName := include "myapp.fullname" . -}}

=======================================================
  {{ .Chart.Name }} has been installed!
=======================================================

1. Get the application URL by running these commands:
{{- if .Values.ingress.enabled }}
  http{{ if $.Values.ingress.tls }}s{{ end }}://{{ .Values.ingress.hosts | first | default "localhost" }}
{{- else if contains "ClusterIP" .Values.service.type }}
  kubectl --namespace {{ .Release.Namespace }} port-forward svc/{{ $fullName }} 8080:{{ .Values.service.port }}
  Then visit http://127.0.0.1:8080
{{- end }}

2. Check the deployment status:
  kubectl rollout status deployment/{{ $fullName }} -n {{ .Release.Namespace }}
```

### Security Best Practices

1. **Use Secrets for Sensitive Information**
2. **Apply Pod Security Contexts**
3. **Implement Network Policies**
4. **Run as Non-Root User**
5. **Use Read-Only Root Filesystem**

---

## Further Reading

### Official Resources

- [Helm Official Documentation](https://helm.sh/docs/)
- [Helm GitHub Repository](https://github.com/helm/helm)
- [Artifact Hub](https://artifacthub.io/) - Public repository for Helm Charts

### Advanced Topics

- **Chart Testing**: [helm/chart-testing](https://github.com/helm/chart-testing)
- **Helmfile**: Declarative spec for deploying helm charts
- **helm-secrets**: Plugin for managing secrets
- **helm-diff**: Preview helm upgrade changes

### Related Tools

- **Kustomize**: Template-free configuration customization
- **ArgoCD**: GitOps continuous delivery for Kubernetes
- **Flux**: GitOps toolkit for Kubernetes
- **Skaffold**: Easy and repeatable Kubernetes development

### Recommended Books and Courses

- "Learning Helm" by Matt Butcher, Matt Farina, and Josh Dolitsky
- "Kubernetes Patterns" by Bilgin Ibryam and Roland Huss
- CNCF Kubernetes and Cloud Native Associate (KCNA) certification

---

## Summary

Helm, as the most popular package manager in the Kubernetes ecosystem, greatly simplifies the deployment and management of cloud-native applications. We have explored:

1. **Core Concepts**: Chart, Release, and Repository form the foundation of Helm's architecture
2. **Template System**: Go templates with rich function libraries enable flexible resource generation
3. **Dependency Management**: Declare dependencies in Chart.yaml for modular complex applications
4. **Lifecycle Management**: Hooks mechanism supports custom operations at various deployment stages
5. **Testing and Validation**: Built-in testing framework ensures Chart quality
6. **CI/CD Integration**: Seamless integration with mainstream CI/CD tools for automated deployment

Mastering Helm is an essential skill for Kubernetes operations and DevOps practices. We recommend practicing extensively in real projects, fully understanding its templating mechanism and best practices, to efficiently manage complex Kubernetes applications.
