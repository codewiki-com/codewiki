---
title: Helm Kubernetes包管理器
description: 掌握Helm，简化Kubernetes应用的部署与管理
track: devops
section: kubernetes
difficulty: intermediate
tags:
  - Helm
  - Kubernetes
  - 包管理
  - Chart
status: imported
origin: old/src/content/docs/devops/helm.zh.md
divergence: 0.191
issues: []
legacy:
  category: DevOps
  subcategory: Kubernetes
  order: 14
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Helm

Helm 是 Kubernetes 的包管理器，类似于 Linux 系统中的 apt、yum 或 macOS 中的 Homebrew。它允许开发者和运维人员定义、安装和升级复杂的 Kubernetes 应用程序。

Helm 的名称来源于航海术语，意为"舵"，与 Kubernetes（希腊语中的"舵手"）相呼应。这个命名体现了 Helm 帮助用户掌控 Kubernetes 应用部署的愿景。

### 为什么需要 Helm

在没有 Helm 的情况下，部署一个典型的微服务应用可能需要管理数十个 YAML 文件：Deployment、Service、ConfigMap、Secret、Ingress 等。Helm 解决了以下核心问题：

- **简化部署复杂性**：将多个 Kubernetes 资源打包成一个单元
- **版本管理**：跟踪应用的部署历史，支持回滚
- **配置管理**：通过 Values 文件实现环境间的配置差异化
- **依赖管理**：自动处理应用间的依赖关系
- **可重用性**：Chart 可以在不同环境和项目中复用
- **标准化**：提供统一的应用打包和分发标准

### Helm 发展历程

- **Helm 2**：采用客户端-服务端架构，需要在集群中部署 Tiller 组件
- **Helm 3**（当前版本）：移除了 Tiller，直接使用 kubeconfig 认证，更加安全和简洁

---

## 核心概念

### Chart

Chart 是 Helm 的打包格式，包含了运行一个 Kubernetes 应用所需的全部资源定义。可以将其理解为 Kubernetes 应用的"安装包"。

```
mychart/
  Chart.yaml          # Chart 的元信息
  LICENSE             # 可选：许可证
  README.md           # 可选：说明文档
  values.yaml         # 默认配置值
  values.schema.json  # 可选：values 的 JSON Schema
  charts/             # 依赖的 Chart
  crds/               # 自定义资源定义
  templates/          # 模板文件目录
    deployment.yaml
    service.yaml
    _helpers.tpl      # 模板辅助函数
    NOTES.txt         # 安装后显示的说明
  templates/tests/    # 测试文件
```

### Release

Release 是 Chart 在 Kubernetes 集群中的一个运行实例。同一个 Chart 可以在同一集群中安装多次，每次安装都会创建一个新的 Release。

```bash
# 安装 Chart 创建 Release
helm install my-release bitnami/nginx

# 查看所有 Release
helm list

# Release 命名空间隔离
helm install my-release bitnami/nginx -n production
helm install my-release bitnami/nginx -n staging
```

### Repository

Repository 是存放和共享 Chart 的地方，类似于 Docker Hub 存放 Docker 镜像。

```bash
# 添加官方仓库
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add stable https://charts.helm.sh/stable

# 更新仓库索引
helm repo update

# 搜索 Chart
helm search repo nginx
helm search hub wordpress  # 搜索 Artifact Hub

# 查看仓库列表
helm repo list

# 移除仓库
helm repo remove stable
```

---

## Chart 结构与开发

### 创建 Chart

```bash
# 创建新 Chart
helm create myapp

# 生成的目录结构
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

### Chart.yaml 详解

```yaml
# Chart.yaml - Chart 元信息
apiVersion: v2                    # Helm 3 使用 v2
name: myapp                       # Chart 名称
description: A Helm chart for MyApp
type: application                 # application 或 library
version: 1.0.0                    # Chart 版本（遵循 SemVer）
appVersion: "2.0.0"              # 应用版本

# 维护者信息
maintainers:
  - name: DevOps Team
    email: devops@example.com
    url: https://example.com

# Chart 关键词，便于搜索
keywords:
  - myapp
  - web
  - microservice

# 项目主页
home: https://github.com/example/myapp

# 源码仓库
sources:
  - https://github.com/example/myapp

# 依赖定义
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

# 注解
annotations:
  category: Database
  licenses: Apache-2.0
```

### .helmignore 文件

```plaintext
# 类似 .gitignore，定义打包时忽略的文件
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

## Values 与模板

### values.yaml 设计

```yaml
# values.yaml - 默认配置值
# 基本信息
replicaCount: 3
nameOverride: ""
fullnameOverride: ""

# 镜像配置
image:
  repository: myapp/backend
  pullPolicy: IfNotPresent
  tag: ""  # 默认使用 appVersion

imagePullSecrets: []

# 服务账户
serviceAccount:
  create: true
  annotations: {}
  name: ""

# Pod 安全上下文
podSecurityContext:
  fsGroup: 1000

securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false

# 服务配置
service:
  type: ClusterIP
  port: 80
  targetPort: 8080
  annotations: {}

# Ingress 配置
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

# 资源配置
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

# 自动扩缩容
autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80

# 健康检查
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

# 节点调度
nodeSelector: {}
tolerations: []
affinity: {}

# 应用配置
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

# 环境变量
env: []
  # - name: CUSTOM_VAR
  #   value: "custom-value"

# 密钥引用
envFrom: []
  # - secretRef:
  #     name: myapp-secrets

# 依赖开关
postgresql:
  enabled: true
  auth:
    database: myapp
    username: myapp

redis:
  enabled: false
```

### 模板基础

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

### _helpers.tpl 辅助模板

```yaml
# templates/_helpers.tpl
{{/*
展开 Chart 名称
*/}}
{{- define "myapp.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
创建完整名称，优先使用 fullnameOverride，否则组合 release 名称和 chart 名称
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
创建 Chart 标签
*/}}
{{- define "myapp.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
通用标签
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
选择器标签
*/}}
{{- define "myapp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "myapp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
服务账户名称
*/}}
{{- define "myapp.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "myapp.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
数据库连接字符串
*/}}
{{- define "myapp.databaseUrl" -}}
{{- $host := .Values.config.database.host -}}
{{- $port := .Values.config.database.port -}}
{{- $name := .Values.config.database.name -}}
{{- printf "postgresql://%s:%v/%s" $host $port $name -}}
{{- end }}
```

---

## 模板函数与管道

### 内置函数

```yaml
# 字符串函数
{{ .Values.name | upper }}              # 转大写
{{ .Values.name | lower }}              # 转小写
{{ .Values.name | title }}              # 首字母大写
{{ .Values.name | quote }}              # 添加双引号
{{ .Values.name | squote }}             # 添加单引号
{{ .Values.name | trim }}               # 去除首尾空格
{{ .Values.name | trimPrefix "v" }}     # 去除前缀
{{ .Values.name | trimSuffix "-" }}     # 去除后缀
{{ .Values.name | trunc 63 }}           # 截断字符串
{{ .Values.name | replace "-" "_" }}    # 替换字符
{{ .Values.name | contains "foo" }}     # 包含检查
{{ .Values.name | hasPrefix "v" }}      # 前缀检查
{{ .Values.name | hasSuffix "-" }}      # 后缀检查
{{ .Values.name | indent 4 }}           # 添加缩进
{{ .Values.name | nindent 4 }}          # 换行并缩进

# 默认值
{{ .Values.name | default "myapp" }}
{{ coalesce .Values.name .Values.fallback "default" }}

# 类型转换
{{ .Values.port | int }}
{{ .Values.enabled | toString }}
{{ .Values.data | toJson }}
{{ .Values.data | toYaml }}
{{ .Values.data | toPrettyJson }}

# 列表函数
{{ list "a" "b" "c" }}                  # 创建列表
{{ .Values.list | first }}             # 第一个元素
{{ .Values.list | last }}              # 最后一个元素
{{ .Values.list | rest }}              # 除第一个外的所有元素
{{ .Values.list | initial }}           # 除最后一个外的所有元素
{{ .Values.list | reverse }}           # 反转列表
{{ .Values.list | uniq }}              # 去重
{{ .Values.list | sortAlpha }}         # 字母排序
{{ append .Values.list "d" }}          # 追加元素
{{ concat .Values.list1 .Values.list2 }}  # 合并列表
{{ has "item" .Values.list }}          # 检查是否包含

# 字典函数
{{ dict "key1" "value1" "key2" "value2" }}
{{ .Values.map | keys }}               # 获取所有键
{{ .Values.map | values }}             # 获取所有值
{{ merge .Values.map1 .Values.map2 }}  # 合并字典
{{ hasKey .Values.map "key" }}         # 检查键是否存在
{{ get .Values.map "key" }}            # 获取值
{{ set .Values.map "key" "value" }}    # 设置值
{{ unset .Values.map "key" }}          # 删除键
{{ omit .Values.map "key1" "key2" }}   # 排除指定键
{{ pick .Values.map "key1" "key2" }}   # 只保留指定键

# 数学函数
{{ add 1 2 }}                          # 加法
{{ sub 5 3 }}                          # 减法
{{ mul 2 3 }}                          # 乘法
{{ div 6 2 }}                          # 除法
{{ mod 7 3 }}                          # 取模
{{ max 1 2 3 }}                        # 最大值
{{ min 1 2 3 }}                        # 最小值
{{ floor 1.5 }}                        # 向下取整
{{ ceil 1.5 }}                         # 向上取整
{{ round 1.5 }}                        # 四舍五入

# 日期函数
{{ now }}                              # 当前时间
{{ now | date "2006-01-02" }}          # 格式化日期
{{ now | dateModify "+1h" }}           # 修改时间
{{ now | unixEpoch }}                  # Unix 时间戳

# 编码函数
{{ .Values.data | b64enc }}            # Base64 编码
{{ .Values.data | b64dec }}            # Base64 解码
{{ .Values.data | sha256sum }}         # SHA256 哈希

# 路径函数
{{ .Values.path | base }}              # 基础名称
{{ .Values.path | dir }}               # 目录部分
{{ .Values.path | ext }}               # 扩展名
{{ .Values.path | clean }}             # 清理路径
```

### 流程控制

```yaml
# 条件判断
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

# 比较运算符
{{ if eq .Values.a .Values.b }}        # 相等
{{ if ne .Values.a .Values.b }}        # 不等
{{ if lt .Values.a .Values.b }}        # 小于
{{ if le .Values.a .Values.b }}        # 小于等于
{{ if gt .Values.a .Values.b }}        # 大于
{{ if ge .Values.a .Values.b }}        # 大于等于

# 逻辑运算符
{{ if and .Values.a .Values.b }}       # 与
{{ if or .Values.a .Values.b }}        # 或
{{ if not .Values.a }}                 # 非

# 空值检查
{{ if .Values.name }}                  # 非空检查
{{ if empty .Values.name }}            # 空值检查

# with 语句（设置当前作用域）
{{- with .Values.nodeSelector }}
nodeSelector:
  {{- toYaml . | nindent 8 }}
{{- end }}

# range 循环
{{- range .Values.hosts }}
- host: {{ .host | quote }}
  paths:
    {{- range .paths }}
    - path: {{ .path }}
      pathType: {{ .pathType }}
    {{- end }}
{{- end }}

# range 带索引
{{- range $index, $host := .Values.hosts }}
# Host {{ $index }}: {{ $host.host }}
{{- end }}

# range 遍历字典
{{- range $key, $value := .Values.labels }}
{{ $key }}: {{ $value | quote }}
{{- end }}
```

### 管道与高级用法

```yaml
# 管道链式调用
{{ .Values.name | lower | quote }}
{{ .Values.data | toYaml | indent 4 }}

# 模板引用
{{ include "myapp.labels" . | nindent 4 }}

# 必需值验证
{{ required "A valid .Values.database.host is required!" .Values.database.host }}

# 失败处理
{{ fail "Please provide a valid configuration" }}

# printf 格式化
{{ printf "%s-%s" .Release.Name .Chart.Name }}

# 正则表达式
{{ regexMatch "^[a-z]+$" .Values.name }}
{{ regexFind "[0-9]+" .Values.version }}
{{ regexReplaceAll "[^a-zA-Z0-9]" .Values.name "-" }}

# 类型检查
{{ kindOf .Values.data }}              # 返回类型
{{ kindIs "map" .Values.data }}        # 类型判断
{{ typeOf .Values.data }}              # 详细类型

# 生成随机值
{{ randAlphaNum 10 }}                  # 随机字母数字
{{ randAlpha 10 }}                     # 随机字母
{{ randNumeric 10 }}                   # 随机数字
{{ randAscii 10 }}                     # 随机 ASCII
{{ uuidv4 }}                           # 生成 UUID

# 密钥生成
{{ genPrivateKey "rsa" }}              # 生成私钥
{{ derivePassword 1 "long" "password" "user" "example.com" }}
```

---

## 依赖管理

### 定义依赖

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

  # 本地依赖
  - name: mylib
    version: "1.0.0"
    repository: file://../mylib
```

### 依赖操作命令

```bash
# 下载依赖
helm dependency update ./mychart

# 构建依赖（更新 Chart.lock）
helm dependency build ./mychart

# 列出依赖
helm dependency list ./mychart

# 依赖存放位置
mychart/
  charts/
    postgresql-12.1.0.tgz
    redis-17.3.0.tgz
```

### 依赖配置覆盖

```yaml
# values.yaml
# 启用/禁用依赖
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

# 使用别名配置
cache:  # redis 的别名
  enabled: true
  architecture: standalone
  auth:
    enabled: false
```

### 导入依赖 Values

```yaml
# Chart.yaml
dependencies:
  - name: postgresql
    version: "12.1.0"
    repository: https://charts.bitnami.com/bitnami
    import-values:
      - child: primary.service
        parent: database

# 效果：postgresql 的 primary.service 会被导入到 .Values.database
```

---

## Hooks 生命周期

### Hook 类型

Helm 提供了多种 Hook，允许在 Release 生命周期的不同阶段执行操作：

| Hook | 描述 |
|------|------|
| pre-install | 在模板渲染后、资源创建前执行 |
| post-install | 在所有资源创建后执行 |
| pre-delete | 在删除任何资源前执行 |
| post-delete | 在所有资源删除后执行 |
| pre-upgrade | 在模板渲染后、资源更新前执行 |
| post-upgrade | 在所有资源更新后执行 |
| pre-rollback | 在回滚前执行 |
| post-rollback | 在回滚后执行 |
| test | 执行 helm test 时运行 |

### Hook 示例

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

### 数据库迁移 Hook

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

### Hook 删除策略

```yaml
annotations:
  # 删除策略选项：
  "helm.sh/hook-delete-policy": before-hook-creation  # 创建新 Hook 前删除旧的
  "helm.sh/hook-delete-policy": hook-succeeded        # Hook 成功后删除
  "helm.sh/hook-delete-policy": hook-failed           # Hook 失败后删除

  # 可以组合多个策略
  "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
```

---

## Chart 测试

### 测试资源定义

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

          # 测试健康检查端点
          echo "Testing health endpoint..."
          curl -f http://{{ include "myapp.fullname" . }}:{{ .Values.service.port }}/health

          # 测试 API 端点
          echo "Testing API endpoint..."
          response=$(curl -s http://{{ include "myapp.fullname" . }}:{{ .Values.service.port }}/api/v1/status)

          # 验证响应
          if echo "$response" | grep -q "ok"; then
            echo "API test passed!"
            exit 0
          else
            echo "API test failed!"
            exit 1
          fi
```

### 运行测试

```bash
# 安装后运行测试
helm test my-release

# 查看测试日志
helm test my-release --logs

# 设置超时
helm test my-release --timeout 5m

# 测试失败后保留 Pod 以便调试
helm test my-release --logs 2>&1 || kubectl logs my-release-test-api
```

### Chart 验证

```bash
# 语法检查
helm lint ./mychart

# 带 values 文件检查
helm lint ./mychart -f production-values.yaml

# 严格模式
helm lint ./mychart --strict

# 模板渲染测试
helm template my-release ./mychart

# 渲染特定模板
helm template my-release ./mychart -s templates/deployment.yaml

# 模拟安装（干运行）
helm install my-release ./mychart --dry-run --debug

# 验证 Kubernetes 资源
helm install my-release ./mychart --dry-run --debug | kubectl apply --dry-run=client -f -
```

---

## Helm 仓库管理

### 创建私有仓库

```bash
# 使用 ChartMuseum
docker run -d \
  -p 8080:8080 \
  -e STORAGE=local \
  -e STORAGE_LOCAL_ROOTDIR=/charts \
  -v $(pwd)/charts:/charts \
  ghcr.io/helm/chartmuseum:v0.16.0

# 添加私有仓库
helm repo add myrepo http://localhost:8080

# 推送 Chart
helm cm-push mychart-0.1.0.tgz myrepo
```

### OCI 仓库支持

```bash
# Helm 3.8+ 原生支持 OCI 仓库
# 登录 OCI 仓库
helm registry login registry.example.com

# 推送 Chart 到 OCI 仓库
helm push mychart-1.0.0.tgz oci://registry.example.com/charts

# 从 OCI 仓库安装
helm install my-release oci://registry.example.com/charts/mychart --version 1.0.0

# 拉取 Chart
helm pull oci://registry.example.com/charts/mychart --version 1.0.0
```

### GitHub Pages 作为仓库

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

### 仓库索引管理

```bash
# 生成仓库索引
helm repo index ./charts --url https://example.com/charts

# 合并已有索引
helm repo index ./charts --url https://example.com/charts --merge index.yaml

# index.yaml 结构
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

## CI/CD 集成

### GitLab CI 集成

```yaml
# .gitlab-ci.yml
stages:
  - lint
  - build
  - deploy

variables:
  HELM_VERSION: "3.14.0"
  CHART_PATH: "./charts/myapp"

.helm-base:
  image: alpine/helm:${HELM_VERSION}
  before_script:
    - helm repo add bitnami https://charts.bitnami.com/bitnami
    - helm dependency update ${CHART_PATH}

lint:
  extends: .helm-base
  stage: lint
  script:
    - helm lint ${CHART_PATH}
    - helm template test ${CHART_PATH} --dry-run

build:
  extends: .helm-base
  stage: build
  script:
    - helm package ${CHART_PATH}
  artifacts:
    paths:
      - "*.tgz"
    expire_in: 1 week
  only:
    - tags

deploy-staging:
  extends: .helm-base
  stage: deploy
  script:
    - helm upgrade --install myapp ${CHART_PATH}
      --namespace staging
      --create-namespace
      -f ${CHART_PATH}/values-staging.yaml
      --set image.tag=${CI_COMMIT_SHORT_SHA}
      --wait
      --timeout 5m
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - main

deploy-production:
  extends: .helm-base
  stage: deploy
  script:
    - helm upgrade --install myapp ${CHART_PATH}
      --namespace production
      -f ${CHART_PATH}/values-production.yaml
      --set image.tag=${CI_COMMIT_TAG}
      --wait
      --timeout 10m
      --atomic
  environment:
    name: production
    url: https://example.com
  only:
    - tags
  when: manual
```

### GitHub Actions 集成

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

### ArgoCD 集成

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

## 最佳实践

### Chart 开发最佳实践

```yaml
# 使用 values.schema.json 验证输入
# values.schema.json
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

# 提供有意义的 NOTES.txt
# templates/NOTES.txt
{{- $fullName := include "myapp.fullname" . -}}

=======================================================
  {{ .Chart.Name }} has been installed!
=======================================================

1. Get the application URL by running these commands:
{{- if .Values.ingress.enabled }}
  http{{ if $.Values.ingress.tls }}s{{ end }}://{{ .Values.ingress.hosts | first | default "localhost" }}
{{- else if contains "NodePort" .Values.service.type }}
  export NODE_PORT=$(kubectl get --namespace {{ .Release.Namespace }} -o jsonpath="{.spec.ports[0].nodePort}" services {{ $fullName }})
  export NODE_IP=$(kubectl get nodes --namespace {{ .Release.Namespace }} -o jsonpath="{.items[0].status.addresses[0].address}")
  echo http://$NODE_IP:$NODE_PORT
{{- else if contains "LoadBalancer" .Values.service.type }}
  NOTE: It may take a few minutes for the LoadBalancer IP to be available.
  You can watch the status by running:
    kubectl get svc -n {{ .Release.Namespace }} -w {{ $fullName }}
{{- else if contains "ClusterIP" .Values.service.type }}
  kubectl --namespace {{ .Release.Namespace }} port-forward svc/{{ $fullName }} 8080:{{ .Values.service.port }}
  Then visit http://127.0.0.1:8080
{{- end }}

2. Check the deployment status:
  kubectl rollout status deployment/{{ $fullName }} -n {{ .Release.Namespace }}

3. View logs:
  kubectl logs -f deployment/{{ $fullName }} -n {{ .Release.Namespace }}
```

### 安全最佳实践

```yaml
# 使用 Secret 存储敏感信息
# templates/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}-secret
type: Opaque
data:
  {{- if .Values.existingSecret }}
  # 使用已存在的 Secret
  {{- else }}
  database-password: {{ .Values.database.password | b64enc | quote }}
  api-key: {{ .Values.apiKey | b64enc | quote }}
  {{- end }}

# Pod 安全设置
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
  seccompProfile:
    type: RuntimeDefault

containerSecurityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL

# 网络策略
# templates/networkpolicy.yaml
{{- if .Values.networkPolicy.enabled }}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  podSelector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: ingress-nginx
      ports:
        - protocol: TCP
          port: {{ .Values.service.targetPort }}
  egress:
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: postgresql
      ports:
        - protocol: TCP
          port: 5432
{{- end }}
```

---

## 常用命令速查

```bash
# 安装与管理
helm install <release> <chart>              # 安装 Chart
helm install <release> <chart> -f values.yaml  # 使用自定义 values
helm install <release> <chart> --set key=value  # 命令行设置值
helm install <release> <chart> --namespace <ns> --create-namespace
helm install <release> <chart> --dry-run --debug  # 模拟安装
helm install <release> <chart> --wait --timeout 5m  # 等待就绪
helm install <release> <chart> --atomic       # 失败时自动回滚

helm upgrade <release> <chart>              # 升级 Release
helm upgrade --install <release> <chart>    # 安装或升级
helm upgrade <release> <chart> --reuse-values  # 复用现有 values

helm rollback <release> <revision>          # 回滚到指定版本
helm rollback <release> 0                   # 回滚到上一版本

helm uninstall <release>                    # 卸载 Release
helm uninstall <release> --keep-history     # 保留历史记录

# 查询
helm list                                   # 列出所有 Release
helm list -A                                # 所有命名空间
helm list -a                                # 包括失败的
helm status <release>                       # 查看状态
helm history <release>                      # 查看历史
helm get values <release>                   # 获取 values
helm get manifest <release>                 # 获取清单
helm get all <release>                      # 获取所有信息

# 仓库
helm repo add <name> <url>                  # 添加仓库
helm repo update                            # 更新仓库
helm repo list                              # 列出仓库
helm search repo <keyword>                  # 搜索 Chart
helm search hub <keyword>                   # 搜索 Artifact Hub

# Chart 开发
helm create <name>                          # 创建 Chart
helm lint <chart>                           # 语法检查
helm template <release> <chart>             # 渲染模板
helm package <chart>                        # 打包 Chart
helm dependency update <chart>              # 更新依赖
helm test <release>                         # 运行测试

# 插件
helm plugin list                            # 列出插件
helm plugin install <url>                   # 安装插件
helm plugin uninstall <name>                # 卸载插件
```

---

## 面试要点

### 基础概念题

**Q1: 解释 Helm 中 Chart、Release 和 Repository 的关系？**

A:
- **Chart** 是 Helm 的打包格式，包含运行 Kubernetes 应用所需的全部资源定义，类似于 Linux 的 rpm/deb 包
- **Release** 是 Chart 在集群中的运行实例。同一 Chart 可多次安装，每次创建新 Release
- **Repository** 是存放和共享 Chart 的服务器，类似于 Docker Hub

三者关系：从 Repository 下载 Chart，安装 Chart 创建 Release。

**Q2: Helm 2 和 Helm 3 的主要区别？**

A:
1. **移除 Tiller**：Helm 3 不再需要服务端组件，直接使用 kubeconfig 认证
2. **Release 存储**：从 ConfigMap 改为 Secret，且存储在 Release 所在的命名空间
3. **三方合并升级**：对比 live 状态、旧 Chart、新 Chart 进行合并
4. **JSON Schema 验证**：支持 values.schema.json 验证输入
5. **OCI 支持**：原生支持 OCI 仓库存储 Chart
6. **命名空间隔离**：Release 名称在命名空间内唯一，而非全局唯一

### 实践应用题

**Q3: 如何实现 Helm Chart 的配置管理？**

A:
```yaml
# 多环境 values 文件
helm upgrade myapp ./chart \
  -f values.yaml \
  -f values-production.yaml \
  --set image.tag=v1.2.3

# 使用 lookup 函数获取集群现有资源
{{- $secret := lookup "v1" "Secret" .Release.Namespace "existing-secret" }}
{{- if $secret }}
  existingSecretName: existing-secret
{{- end }}

# 配置变更触发重启
annotations:
  checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
```

**Q4: 如何处理 Helm 升级失败的情况？**

A:
```bash
# 查看 Release 状态
helm status myapp
helm history myapp

# 回滚到上一个版本
helm rollback myapp 0

# 使用 --atomic 自动回滚
helm upgrade myapp ./chart --atomic --timeout 5m

# 强制替换资源
helm upgrade myapp ./chart --force

# 清理失败的 Release
helm uninstall myapp
helm install myapp ./chart
```

**Q5: 解释 Helm Hook 的执行顺序？**

A:
1. 按 `helm.sh/hook-weight` 从小到大排序
2. 相同权重按资源类型和名称排序
3. 同步等待每个 Hook 完成后再执行下一个
4. Hook 失败会阻止后续操作（除非设置了 `hook-delete-policy`）

```yaml
# 执行顺序示例
annotations:
  "helm.sh/hook": pre-install
  "helm.sh/hook-weight": "-5"  # 先执行

annotations:
  "helm.sh/hook": pre-install
  "helm.sh/hook-weight": "5"   # 后执行
```

### 架构设计题

**Q6: 如何设计一个可复用的 Helm Library Chart？**

A:
```yaml
# Chart.yaml
apiVersion: v2
name: mylib
type: library  # 声明为 library 类型
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
  # 通用 Deployment 模板
{{- end }}

# 在其他 Chart 中使用
dependencies:
  - name: mylib
    version: "1.x.x"
    repository: file://../mylib

# templates/deployment.yaml
{{- include "mylib.deployment" . }}
```

**Q7: 如何在 CI/CD 中安全地管理 Helm Secrets？**

A:
```bash
# 使用 helm-secrets 插件
helm plugin install https://github.com/jkroepke/helm-secrets

# 加密 secrets 文件
helm secrets enc values-secrets.yaml

# 安装时解密
helm secrets install myapp ./chart -f values-secrets.yaml

# 使用外部密钥管理
# 在模板中引用 ExternalSecret
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

# CI/CD 中注入
helm upgrade myapp ./chart \
  --set database.password=$DB_PASSWORD
```

---

## 总结

Helm 作为 Kubernetes 生态系统中最流行的包管理器，极大地简化了云原生应用的部署和管理。通过本文，我们深入了解了：

1. **核心概念**：Chart、Release、Repository 构成了 Helm 的基础架构
2. **模板系统**：Go 模板语言配合丰富的函数库，实现灵活的资源生成
3. **依赖管理**：通过 Chart.yaml 声明依赖，实现复杂应用的模块化
4. **生命周期管理**：Hooks 机制支持在部署各阶段执行自定义操作
5. **测试与验证**：内置测试框架确保 Chart 质量
6. **CI/CD 集成**：与主流 CI/CD 工具无缝集成，实现自动化部署

掌握 Helm 是 Kubernetes 运维和 DevOps 实践的必备技能。建议在实际项目中多加练习，深入理解其模板机制和最佳实践，以便高效地管理复杂的 Kubernetes 应用。
