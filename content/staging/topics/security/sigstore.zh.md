---
title: Sigstore 软件签名
description: Sigstore 完全指南 - 软件制品的无密钥签名与验证
track: security
section: appsec
difficulty: intermediate
tags:
  - Sigstore
  - Cosign
  - Rekor
  - Fulcio
  - 软件签名
  - 供应链安全
status: imported
origin: old/src/content/docs/security/sigstore.zh.md
divergence: 0.221
issues: []
legacy:
  category: Security
  subcategory: Supply Chain
  order: 15
  lastUpdated: 2026-01-20
---

Sigstore 代表了软件签名和验证领域的范式转变。传统的代码签名需要管理长期存在的加密密钥，这带来了巨大的运维挑战和安全风险。Sigstore 通过提供基于临时证书和 OIDC 身份验证的无密钥签名，消除了这些痛点。在 Linux 基金会的支持下，Sigstore 已被 Kubernetes、npm 和 PyPI 等主要项目采用，正在迅速成为软件供应链安全的标准。

## 什么是 Sigstore？

### 传统代码签名的问题

传统代码签名依赖于长期存在的私钥，这带来了几个挑战：

```
┌─────────────────────────────────────────────────────────────────┐
│                    传统代码签名的挑战                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐│
│  │     密钥管理      │  │     密钥泄露      │  │     密钥轮换      ││
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤│
│  │ • 安全存储       │  │ • 长期暴露窗口   │  │ • 复杂的流程     ││
│  │ • 访问控制       │  │ • 吊销困难       │  │ • 协调开销       ││
│  │ • 备份/恢复      │  │                  │  │ • 信任链更新     ││
│  │ • HSM 成本       │  │                  │  │                  ││
│  └──────────────────┘  └──────────────────┘  └──────────────────┘│
│                                                                  │
│  传统流程：                                                       │
│  开发者 → 长期私钥 → 签名 → 分发                                   │
│              ↓                                                   │
│         密钥泄露 = 所有签名都被破坏                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Sigstore 的无密钥创新

Sigstore 引入了无密钥签名，开发者通过 OIDC（OpenID Connect）进行身份验证，获得有效期仅为几分钟的临时证书，所有签名事件都记录在不可变的透明日志中：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sigstore 无密钥签名                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  开发者                                                          │
│      │                                                           │
│      ▼                                                           │
│  ┌────────────────┐     OIDC 令牌        ┌────────────────┐      │
│  │ 身份提供商      │ ─────────────────▶  │    Fulcio      │      │
│  │ (GitHub/Google)│                     │   (证书颁发     │      │
│  │                │                     │     机构)       │      │
│  └────────────────┘                     └───────┬────────┘      │
│                                                  │               │
│                                       临时证书（有效期约10分钟）    │
│                                                  │               │
│                                                  ▼               │
│  ┌────────────────┐                     ┌────────────────┐      │
│  │     制品        │ ◀── 使用临时 ────── │    开发者      │      │
│  │  (容器镜像、    │     密钥签名        │                │      │
│  │   二进制等)     │                     └───────┬────────┘      │
│  └───────┬────────┘                             │               │
│          │                                      │               │
│          ▼                                      ▼               │
│  ┌────────────────┐                     ┌────────────────┐      │
│  │     Rekor      │ ◀─── 记录条目 ───── │   签名 + 证书   │      │
│  │   (透明日志)    │                     │                │      │
│  │                │                     └────────────────┘      │
│  └────────────────┘                                              │
│                                                                  │
│  优势：                                                          │
│  • 无需管理长期密钥                                               │
│  • 基于身份的签名（谁签名的，而不仅是什么密钥）                       │
│  • 不可变的审计追踪                                               │
│  • 自动密钥轮换（每次签名事件）                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Linux 基金会与行业采用

Sigstore 由 Red Hat、Google 和普渡大学于 2021 年创建，现在由 Linux 基金会下的开源安全基金会（OpenSSF）托管。主要采用者包括：

| 项目/组织 | 使用方式 |
|----------|---------|
| Kubernetes | 签名所有发布制品 |
| npm | 使用 Sigstore 进行包来源证明 |
| PyPI | 使用 Sigstore 的可信发布者 |
| GitHub Actions | 原生 Sigstore 集成 |
| Homebrew | Bottle 证明 |
| Arch Linux | 包签名 |

## 核心组件

Sigstore 由三个主要组件组成，它们协同工作以提供完整的签名和验证生态系统。

### Cosign - 容器和制品签名

Cosign 是用于签名和验证容器镜像及其他制品的主要客户端工具：

```bash
# 安装 Cosign
# 使用 Go
go install github.com/sigstore/cosign/v2/cmd/cosign@latest

# 使用 Homebrew
brew install cosign

# 使用 apt (Debian/Ubuntu)
wget https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64
sudo mv cosign-linux-amd64 /usr/local/bin/cosign
sudo chmod +x /usr/local/bin/cosign

# 验证安装
cosign version
```

**主要功能：**

- 使用 OIDC 身份提供商进行无密钥签名
- 支持传统密钥对签名
- 容器镜像签名和验证
- Blob/制品签名
- SBOM 证明
- in-toto 证明支持

### Fulcio - 证书颁发机构

Fulcio 是一个免费的代码签名证书颁发机构，基于 OIDC 身份颁发短期证书：

```
┌─────────────────────────────────────────────────────────────────┐
│                     Fulcio 证书流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 认证请求                                                     │
│     客户端 ──────────────────────────▶ OIDC 提供商               │
│                                       (GitHub, Google 等)        │
│                                                                  │
│  2. OIDC 令牌响应                                                │
│     客户端 ◀────────────────────────── OIDC 提供商               │
│     (包含身份声明：                                               │
│      邮箱、仓库、工作流)                                          │
│                                                                  │
│  3. 证书请求                                                     │
│     客户端 ──────────────────────────▶ Fulcio                    │
│     (OIDC 令牌 + 公钥)                                           │
│                                                                  │
│  4. 证书响应                                                     │
│     客户端 ◀────────────────────────── Fulcio                    │
│     (X.509 证书包含：                                             │
│      - Subject/SAN 中的身份                                       │
│      - 约10分钟有效期                                             │
│      - CT 日志包含的 SCT)                                         │
│                                                                  │
│  证书扩展 (OIDs)：                                                │
│  • 1.3.6.1.4.1.57264.1.1 - OIDC 颁发者                          │
│  • 1.3.6.1.4.1.57264.1.2 - GitHub 工作流触发器                   │
│  • 1.3.6.1.4.1.57264.1.3 - GitHub 工作流 SHA                     │
│  • 1.3.6.1.4.1.57264.1.4 - GitHub 工作流名称                     │
│  • 1.3.6.1.4.1.57264.1.5 - GitHub 工作流仓库                     │
│  • 1.3.6.1.4.1.57264.1.6 - GitHub 工作流引用                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Rekor - 透明日志

Rekor 提供不可变的、仅追加的透明日志，用于记录签名事件：

```bash
# 查询 Rekor 条目
rekor-cli search --email user@example.com

# 获取特定条目
rekor-cli get --uuid <entry-uuid>

# 按制品哈希搜索
rekor-cli search --sha sha256:abc123...

# 验证包含证明
rekor-cli verify --artifact file.txt --signature file.txt.sig --public-key key.pub
```

**Rekor 条目结构：**

```json
{
  "apiVersion": "0.0.1",
  "kind": "hashedrekord",
  "spec": {
    "data": {
      "hash": {
        "algorithm": "sha256",
        "value": "abc123..."
      }
    },
    "signature": {
      "content": "MEUCIQDx...",
      "publicKey": {
        "content": "LS0tLS1C..."
      }
    }
  }
}
```

**透明日志属性：**

| 属性 | 描述 |
|-----|------|
| 仅追加 | 条目无法修改或删除 |
| Merkle 树 | 包含的加密证明 |
| 公开 | 任何人都可以验证条目 |
| 带时间戳 | 每个条目都有可信时间戳 |
| 可搜索 | 按哈希、邮箱或其他属性查询 |

## OIDC 身份验证

Sigstore 利用 OIDC（OpenID Connect）来建立签名者身份，无需管理密钥。

### 支持的身份提供商

```yaml
# 支持的无密钥签名 OIDC 提供商
identity_providers:
  # 面向个人开发者
  - name: Google
    issuer: https://accounts.google.com
    identity_claim: email

  - name: Microsoft
    issuer: https://login.microsoftonline.com
    identity_claim: email

  - name: GitHub
    issuer: https://github.com/login/oauth
    identity_claim: email

  # 面向 CI/CD 工作负载
  - name: GitHub Actions
    issuer: https://token.actions.githubusercontent.com
    identity_claims:
      - job_workflow_ref
      - repository
      - ref

  - name: GitLab CI
    issuer: https://gitlab.com
    identity_claims:
      - project_path
      - ref

  - name: Google Cloud Build
    issuer: https://accounts.google.com
    identity_claim: service_account_email
```

### CI/CD 中的工作负载身份

GitHub Actions 为 Sigstore 提供原生 OIDC 支持：

```yaml
# .github/workflows/sign.yml
name: Sign Container Image

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: read
  id-token: write  # OIDC 所需
  packages: write

jobs:
  sign:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push
        uses: docker/build-push-action@v5
        id: build
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.ref_name }}

      - name: Sign Image (Keyless)
        env:
          COSIGN_EXPERIMENTAL: "true"
        run: |
          cosign sign --yes \
            ghcr.io/${{ github.repository }}@${{ steps.build.outputs.digest }}
```

## 容器镜像签名

### 基本签名和验证

```bash
# 构建并推送镜像
docker build -t ghcr.io/myorg/myapp:v1.0.0 .
docker push ghcr.io/myorg/myapp:v1.0.0

# 签名镜像（无密钥模式 - 打开浏览器进行 OIDC 认证）
cosign sign ghcr.io/myorg/myapp:v1.0.0

# 使用 --yes 避免提示
cosign sign --yes ghcr.io/myorg/myapp:v1.0.0

# 验证签名
cosign verify ghcr.io/myorg/myapp:v1.0.0 \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com
```

### 带注解的签名

```bash
# 向签名添加自定义注解
cosign sign --yes \
  --annotations "version=1.0.0" \
  --annotations "commit=$(git rev-parse HEAD)" \
  --annotations "build-date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  ghcr.io/myorg/myapp:v1.0.0

# 验证时要求特定注解
cosign verify ghcr.io/myorg/myapp:v1.0.0 \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com \
  --annotations "version=1.0.0"
```

### 基于密钥的签名（替代方案）

对于需要传统密钥的场景：

```bash
# 生成新密钥对
cosign generate-key-pair

# 使用私钥签名
cosign sign --key cosign.key ghcr.io/myorg/myapp:v1.0.0

# 使用公钥验证
cosign verify --key cosign.pub ghcr.io/myorg/myapp:v1.0.0

# 使用云 KMS 密钥
# AWS KMS
cosign sign --key awskms:///alias/cosign-key ghcr.io/myorg/myapp:v1.0.0

# Google Cloud KMS
cosign sign --key gcpkms://projects/PROJECT/locations/LOCATION/keyRings/KEYRING/cryptoKeys/KEY ghcr.io/myorg/myapp:v1.0.0

# Azure Key Vault
cosign sign --key azurekms://VAULT_NAME.vault.azure.net/keys/KEY_NAME ghcr.io/myorg/myapp:v1.0.0

# HashiCorp Vault
cosign sign --key hashivault://transit/keys/cosign ghcr.io/myorg/myapp:v1.0.0
```

## Blob 和制品签名

Sigstore 可以签名任何制品，不仅限于容器镜像。

### 签名二进制文件

```bash
# 签名二进制发布文件
cosign sign-blob --yes \
  --output-signature myapp.sig \
  --output-certificate myapp.crt \
  myapp-linux-amd64

# 验证签名
cosign verify-blob \
  --signature myapp.sig \
  --certificate myapp.crt \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com \
  myapp-linux-amd64

# 将签名和证书打包在一起
cosign sign-blob --yes \
  --bundle myapp.bundle \
  myapp-linux-amd64

# 使用 bundle 验证
cosign verify-blob \
  --bundle myapp.bundle \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com \
  myapp-linux-amd64
```

### 签名软件物料清单（SBOM）

```bash
# 使用 Syft 生成 SBOM
syft ghcr.io/myorg/myapp:v1.0.0 -o spdx-json > sbom.spdx.json

# 将 SBOM 附加并签名到镜像
cosign attest --yes \
  --predicate sbom.spdx.json \
  --type spdxjson \
  ghcr.io/myorg/myapp:v1.0.0

# 验证 SBOM 证明
cosign verify-attestation \
  --type spdxjson \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com \
  ghcr.io/myorg/myapp:v1.0.0

# 下载并检查 SBOM
cosign download attestation ghcr.io/myorg/myapp:v1.0.0 | jq -r '.payload' | base64 -d | jq
```

### SLSA 来源证明

```bash
# 生成 SLSA 来源证明（通常在 CI 中完成）
# 使用 slsa-github-generator
- uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v1.9.0
  with:
    image: ghcr.io/myorg/myapp
    digest: ${{ steps.build.outputs.digest }}

# 验证 SLSA 来源证明
cosign verify-attestation \
  --type slsaprovenance \
  --certificate-identity-regexp '^https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@refs/tags/v[0-9]+.[0-9]+.[0-9]+$' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/myorg/myapp@sha256:abc123...
```

## 验证工作流

### 命令行验证

```bash
# 带身份检查的基本验证
cosign verify ghcr.io/myorg/myapp:v1.0.0 \
  --certificate-identity "user@example.com" \
  --certificate-oidc-issuer "https://accounts.google.com"

# 验证 GitHub Actions 签名的镜像
cosign verify ghcr.io/myorg/myapp:v1.0.0 \
  --certificate-identity-regexp "^https://github.com/myorg/myapp/.github/workflows/build.yml@.*" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"

# 使用证书链验证（自定义 CA）
cosign verify \
  --certificate-chain ca-chain.pem \
  --certificate-identity "user@example.com" \
  --certificate-oidc-issuer "https://accounts.google.com" \
  ghcr.io/myorg/myapp:v1.0.0

# 以 JSON 格式输出验证详情
cosign verify ghcr.io/myorg/myapp:v1.0.0 \
  --certificate-identity "user@example.com" \
  --certificate-oidc-issuer "https://accounts.google.com" \
  --output json | jq
```

### 编程验证（Go）

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/google/go-containerregistry/pkg/name"
    "github.com/sigstore/cosign/v2/cmd/cosign/cli/fulcio"
    "github.com/sigstore/cosign/v2/cmd/cosign/cli/options"
    "github.com/sigstore/cosign/v2/cmd/cosign/cli/rekor"
    "github.com/sigstore/cosign/v2/pkg/cosign"
    ociremote "github.com/sigstore/cosign/v2/pkg/oci/remote"
)

func VerifyImage(imageRef string, expectedIdentity string, expectedIssuer string) error {
    ctx := context.Background()

    // 解析镜像引用
    ref, err := name.ParseReference(imageRef)
    if err != nil {
        return fmt.Errorf("解析镜像引用失败: %w", err)
    }

    // 设置验证选项
    co := &cosign.CheckOpts{
        RekorClient:       rekor.NewClient(options.DefaultRekorURL),
        RootCerts:         fulcio.GetRoots(),
        IntermediateCerts: fulcio.GetIntermediates(),
        Identities: []cosign.Identity{
            {
                Issuer:  expectedIssuer,
                Subject: expectedIdentity,
            },
        },
    }

    // 验证签名
    signatures, bundleVerified, err := cosign.VerifyImageSignatures(ctx, ref, co)
    if err != nil {
        return fmt.Errorf("验证失败: %w", err)
    }

    fmt.Printf("验证了 %d 个签名\n", len(signatures))
    fmt.Printf("Bundle 已验证: %v\n", bundleVerified)

    for i, sig := range signatures {
        payload, err := sig.Payload()
        if err != nil {
            continue
        }
        fmt.Printf("签名 %d 载荷: %s\n", i+1, string(payload))
    }

    return nil
}

func main() {
    err := VerifyImage(
        "ghcr.io/myorg/myapp:v1.0.0",
        "user@example.com",
        "https://accounts.google.com",
    )
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("镜像验证成功！")
}
```

### 编程验证（Python）

```python
import subprocess
import json
import sys
from dataclasses import dataclass
from typing import Optional

@dataclass
class VerificationResult:
    verified: bool
    signatures: list
    error: Optional[str] = None

def verify_image(
    image: str,
    identity: str,
    issuer: str,
    identity_regexp: bool = False
) -> VerificationResult:
    """
    使用 Cosign 验证容器镜像签名。

    参数:
        image: 完整镜像引用 (例如 ghcr.io/org/image:tag)
        identity: 预期签名者身份（邮箱或主题）
        issuer: 预期 OIDC 颁发者 URL
        identity_regexp: 如果为 True，将 identity 视为正则表达式

    返回:
        包含验证状态和详情的 VerificationResult
    """
    cmd = [
        "cosign", "verify",
        "--output", "json"
    ]

    if identity_regexp:
        cmd.extend(["--certificate-identity-regexp", identity])
    else:
        cmd.extend(["--certificate-identity", identity])

    cmd.extend(["--certificate-oidc-issuer", issuer])
    cmd.append(image)

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )

        signatures = json.loads(result.stdout) if result.stdout else []
        return VerificationResult(
            verified=True,
            signatures=signatures
        )

    except subprocess.CalledProcessError as e:
        return VerificationResult(
            verified=False,
            signatures=[],
            error=e.stderr
        )

def verify_github_actions_image(image: str, repo: str, workflow: str) -> VerificationResult:
    """
    验证由 GitHub Actions 签名的镜像。

    参数:
        image: 完整镜像引用
        repo: GitHub 仓库 (例如 myorg/myapp)
        workflow: 工作流文件名 (例如 build.yml)
    """
    identity_pattern = f"^https://github.com/{repo}/.github/workflows/{workflow}@.*"

    return verify_image(
        image=image,
        identity=identity_pattern,
        issuer="https://token.actions.githubusercontent.com",
        identity_regexp=True
    )

# 使用示例
if __name__ == "__main__":
    result = verify_github_actions_image(
        image="ghcr.io/myorg/myapp:v1.0.0",
        repo="myorg/myapp",
        workflow="release.yml"
    )

    if result.verified:
        print("镜像签名验证成功！")
        print(f"找到 {len(result.signatures)} 个签名")
    else:
        print(f"验证失败: {result.error}")
        sys.exit(1)
```

## CI/CD 集成

### GitHub Actions 完整示例

```yaml
# .github/workflows/release.yml
name: Build, Sign, and Release

on:
  push:
    tags:
      - 'v*'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

permissions:
  contents: write
  packages: write
  id-token: write  # Sigstore 所需

jobs:
  build-and-sign:
    runs-on: ubuntu-latest
    outputs:
      digest: ${{ steps.build.outputs.digest }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      - name: Install Syft (for SBOM)
        uses: anchore/sbom-action/download-syft@v0

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and Push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Sign Container Image
        run: |
          cosign sign --yes \
            --annotations "repo=${{ github.repository }}" \
            --annotations "workflow=${{ github.workflow }}" \
            --annotations "sha=${{ github.sha }}" \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}

      - name: Generate SBOM
        run: |
          syft ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }} \
            -o spdx-json > sbom.spdx.json

      - name: Attest SBOM
        run: |
          cosign attest --yes \
            --predicate sbom.spdx.json \
            --type spdxjson \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}

      - name: Verify Signature
        run: |
          cosign verify \
            --certificate-identity-regexp '^https://github.com/${{ github.repository }}/.github/workflows/release.yml@.*' \
            --certificate-oidc-issuer https://token.actions.githubusercontent.com \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}

  # 可选：生成 SLSA 来源证明
  provenance:
    needs: build-and-sign
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v1.9.0
    with:
      image: ghcr.io/${{ github.repository }}
      digest: ${{ needs.build-and-sign.outputs.digest }}
    permissions:
      actions: read
      id-token: write
      packages: write
```

### GitLab CI 集成

```yaml
# .gitlab-ci.yml
stages:
  - build
  - sign
  - verify

variables:
  REGISTRY: registry.gitlab.com
  IMAGE_NAME: ${CI_PROJECT_PATH}

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker build -t ${REGISTRY}/${IMAGE_NAME}:${CI_COMMIT_TAG} .
    - docker push ${REGISTRY}/${IMAGE_NAME}:${CI_COMMIT_TAG}
    - |
      # 获取镜像摘要
      DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/${IMAGE_NAME}:${CI_COMMIT_TAG} | cut -d@ -f2)
      echo "DIGEST=${DIGEST}" >> build.env
  artifacts:
    reports:
      dotenv: build.env
  rules:
    - if: $CI_COMMIT_TAG

sign:
  stage: sign
  image: alpine:3.18
  id_tokens:
    SIGSTORE_ID_TOKEN:
      aud: sigstore
  before_script:
    - apk add --no-cache cosign
  script:
    - |
      cosign sign --yes \
        --identity-token=${SIGSTORE_ID_TOKEN} \
        ${REGISTRY}/${IMAGE_NAME}@${DIGEST}
  dependencies:
    - build
  rules:
    - if: $CI_COMMIT_TAG

verify:
  stage: verify
  image: alpine:3.18
  before_script:
    - apk add --no-cache cosign
  script:
    - |
      cosign verify \
        --certificate-identity-regexp "^https://gitlab.com/${CI_PROJECT_PATH}//.*" \
        --certificate-oidc-issuer https://gitlab.com \
        ${REGISTRY}/${IMAGE_NAME}@${DIGEST}
  dependencies:
    - build
  rules:
    - if: $CI_COMMIT_TAG
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        REGISTRY = 'ghcr.io'
        IMAGE_NAME = 'myorg/myapp'
        COSIGN_EXPERIMENTAL = '1'
    }

    stages {
        stage('Install Tools') {
            steps {
                sh '''
                    # 安装 Cosign
                    curl -sSL https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64 -o /usr/local/bin/cosign
                    chmod +x /usr/local/bin/cosign
                '''
            }
        }

        stage('Build') {
            steps {
                script {
                    docker.build("${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}")
                    docker.withRegistry("https://${REGISTRY}", 'registry-credentials') {
                        docker.image("${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}").push()
                    }
                }
            }
        }

        stage('Sign') {
            steps {
                withCredentials([file(credentialsId: 'cosign-key', variable: 'COSIGN_KEY')]) {
                    sh '''
                        # 获取摘要
                        DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} | cut -d@ -f2)

                        # 使用密钥签名
                        cosign sign --key ${COSIGN_KEY} \
                            --annotations "build=${BUILD_NUMBER}" \
                            ${REGISTRY}/${IMAGE_NAME}@${DIGEST}
                    '''
                }
            }
        }

        stage('Verify') {
            steps {
                withCredentials([file(credentialsId: 'cosign-pub', variable: 'COSIGN_PUB')]) {
                    sh '''
                        DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} | cut -d@ -f2)

                        cosign verify --key ${COSIGN_PUB} \
                            ${REGISTRY}/${IMAGE_NAME}@${DIGEST}
                    '''
                }
            }
        }
    }
}
```

## Kubernetes 准入控制

### 使用 Sigstore Policy Controller 进行策略执行

Sigstore Policy Controller 是一个 Kubernetes 准入控制器，用于执行签名验证策略。

```bash
# 安装 Policy Controller
helm repo add sigstore https://sigstore.github.io/helm-charts
helm repo update

helm install policy-controller sigstore/policy-controller \
  --namespace sigstore-system \
  --create-namespace
```

### 定义集群镜像策略

```yaml
# cluster-image-policy.yaml
apiVersion: policy.sigstore.dev/v1beta1
kind: ClusterImagePolicy
metadata:
  name: require-signed-images
spec:
  images:
    # 匹配我们仓库中的所有镜像
    - glob: "ghcr.io/myorg/**"

  authorities:
    # 要求来自 GitHub Actions 的无密钥签名
    - keyless:
        identities:
          - issuer: https://token.actions.githubusercontent.com
            subjectRegExp: "^https://github.com/myorg/.*/.github/workflows/.*@.*$"
        ctlog:
          url: https://rekor.sigstore.dev

---
apiVersion: policy.sigstore.dev/v1beta1
kind: ClusterImagePolicy
metadata:
  name: production-images
spec:
  images:
    - glob: "ghcr.io/myorg/production/**"

  authorities:
    # 要求来自特定工作流的签名
    - keyless:
        identities:
          - issuer: https://token.actions.githubusercontent.com
            subject: "https://github.com/myorg/platform/.github/workflows/release.yml@refs/heads/main"

    # 还要求 SBOM 证明
    - attestations:
        - name: sbom
          predicateType: https://spdx.dev/Document
          policy:
            type: cue
            data: |
              predicateType: "https://spdx.dev/Document"
```

### 命名空间级别执行

```yaml
# 为命名空间启用执行
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    policy.sigstore.dev/include: "true"

---
# 创建命名空间特定策略
apiVersion: policy.sigstore.dev/v1beta1
kind: ClusterImagePolicy
metadata:
  name: production-namespace-policy
spec:
  images:
    - glob: "**"
  match:
    - namespaceSelector:
        matchLabels:
          environment: production

  authorities:
    - keyless:
        identities:
          - issuer: https://token.actions.githubusercontent.com
            subjectRegExp: "^https://github.com/myorg/.*$"
```

### Kyverno 集成

```yaml
# kyverno-policy.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signatures
spec:
  validationFailureAction: Enforce
  background: false
  rules:
    - name: verify-signature
      match:
        any:
          - resources:
              kinds:
                - Pod
      verifyImages:
        - imageReferences:
            - "ghcr.io/myorg/*"
          attestors:
            - entries:
                - keyless:
                    subject: "https://github.com/myorg/*/.github/workflows/*@*"
                    issuer: "https://token.actions.githubusercontent.com"
                    rekor:
                      url: https://rekor.sigstore.dev

    - name: require-sbom
      match:
        any:
          - resources:
              kinds:
                - Pod
      verifyImages:
        - imageReferences:
            - "ghcr.io/myorg/*"
          attestations:
            - predicateType: https://spdx.dev/Document
              attestors:
                - entries:
                    - keyless:
                        subject: "https://github.com/myorg/*/.github/workflows/*@*"
                        issuer: "https://token.actions.githubusercontent.com"
```

### Connaisseur 集成

```yaml
# connaisseur-values.yaml
validators:
  - name: sigstore-keyless
    type: cosign
    trustRoots:
      - name: default
        keyless:
          identities:
            - issuer: https://token.actions.githubusercontent.com
              subjectRegExp: ^https://github.com/myorg/.*$
          rekorURL: https://rekor.sigstore.dev

policy:
  - pattern: "ghcr.io/myorg/*"
    validator: sigstore-keyless

  - pattern: "*"
    validator: deny
```

## 最佳实践

### 签名策略指南

```yaml
# 组织签名策略示例
signing_policy:
  # 身份要求
  identity:
    # 生产发布必须由发布工作流签名
    production:
      issuer: https://token.actions.githubusercontent.com
      subject_pattern: "^https://github.com/myorg/.*/.github/workflows/release.yml@refs/tags/v.*$"

    # 开发镜像可以由任何工作流签名
    development:
      issuer: https://token.actions.githubusercontent.com
      subject_pattern: "^https://github.com/myorg/.*$"

  # 必需的证明
  attestations:
    production:
      - type: spdx  # SBOM
      - type: slsaprovenance  # 构建来源
      - type: vuln  # 漏洞扫描结果
    development:
      - type: spdx  # 最低要求 SBOM

  # 验证要求
  verification:
    # 部署前始终验证
    pre_deploy: required
    # 在生产环境中定期重新验证
    periodic_check: enabled
    check_interval: 24h
```

### 密钥管理最佳实践

使用传统基于密钥的签名时：

```bash
# 使用强参数生成密钥
cosign generate-key-pair --kms awskms:///alias/cosign-signing-key

# 密钥轮换脚本
#!/bin/bash
set -e

OLD_KEY_ALIAS="cosign-key-$(date -d 'yesterday' +%Y%m)"
NEW_KEY_ALIAS="cosign-key-$(date +%Y%m)"

# 创建新密钥
aws kms create-alias \
  --alias-name "alias/${NEW_KEY_ALIAS}" \
  --target-key-id "$(aws kms create-key --query 'KeyMetadata.KeyId' --output text)"

# 导出新公钥
cosign public-key --key "awskms:///alias/${NEW_KEY_ALIAS}" > "cosign-${NEW_KEY_ALIAS}.pub"

# 更新验证配置
kubectl create configmap signing-keys \
  --from-file="current.pub=cosign-${NEW_KEY_ALIAS}.pub" \
  --from-file="previous.pub=cosign-${OLD_KEY_ALIAS}.pub" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "密钥轮换完成。旧密钥保留用于验证。"
```

### 审计日志配置

```yaml
# Rekor 审计配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: sigstore-audit-config
data:
  audit-policy.yaml: |
    # 记录所有签名验证尝试
    rules:
      - level: Metadata
        resources:
          - group: ""
            resources: ["pods"]
        verbs: ["create", "update"]

    # 生产命名空间的详细日志
    rules:
      - level: RequestResponse
        namespaces: ["production"]
        resources:
          - group: ""
            resources: ["pods"]
        verbs: ["create"]
```

```python
# 审计日志分析器
import json
from datetime import datetime, timedelta
from collections import defaultdict

def analyze_signing_audit(log_file: str, days: int = 7):
    """分析 Sigstore 签名/验证审计日志。"""

    stats = defaultdict(lambda: {
        "total_verifications": 0,
        "successful": 0,
        "failed": 0,
        "identities": set(),
        "images": set()
    })

    cutoff = datetime.now() - timedelta(days=days)

    with open(log_file) as f:
        for line in f:
            entry = json.loads(line)
            timestamp = datetime.fromisoformat(entry["timestamp"])

            if timestamp < cutoff:
                continue

            date_key = timestamp.strftime("%Y-%m-%d")
            stats[date_key]["total_verifications"] += 1

            if entry.get("verified"):
                stats[date_key]["successful"] += 1
                stats[date_key]["identities"].add(entry.get("identity", "unknown"))
                stats[date_key]["images"].add(entry.get("image", "unknown"))
            else:
                stats[date_key]["failed"] += 1

    # 生成报告
    print(f"Sigstore 审计报告（最近 {days} 天）")
    print("=" * 60)

    for date in sorted(stats.keys()):
        data = stats[date]
        success_rate = (data["successful"] / data["total_verifications"] * 100
                       if data["total_verifications"] > 0 else 0)
        print(f"\n{date}:")
        print(f"  总验证次数: {data['total_verifications']}")
        print(f"  成功率: {success_rate:.1f}%")
        print(f"  唯一身份: {len(data['identities'])}")
        print(f"  唯一镜像: {len(data['images'])}")

        if data["failed"] > 0:
            print(f"  警告: {data['failed']} 次验证失败！")
```

## 常见陷阱

### 证书过期处理

Sigstore 证书是临时的（通常有效期约10分钟）。只要签名在证书有效期内被记录在 Rekor 中，签名就保持有效。

```bash
# 带时间戳验证（默认行为）
cosign verify ghcr.io/myorg/myapp:v1.0.0 \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com

# 验证检查：
# 1. 签名有效
# 2. 证书在签名时有效
# 3. 签名事件存在于 Rekor 中
# 4. Rekor 条目时间戳在证书有效期内

# 排查证书过期错误
# 错误："certificate has expired"
# 解决方案：确保使用 Rekor 进行时间戳验证
cosign verify \
  --insecure-ignore-tlog=false \  # 确保使用 Rekor（默认）
  ...
```

### 离线验证挑战

```bash
# 对于隔离网络环境，使用 bundle 验证
# 签名时（在线）：
cosign sign --yes \
  --bundle myimage.bundle \
  ghcr.io/myorg/myapp:v1.0.0

# 将 bundle 传输到离线环境

# 验证时（离线）：
# 首先，下载信任根
cosign initialize  # 下载根证书

# 然后使用本地 bundle 验证
cosign verify-blob \
  --bundle myimage.bundle \
  --offline \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com \
  artifact.tar.gz
```

### 私有部署注意事项

```yaml
# 私有 Sigstore 部署（sigstore-scaffolding）
# 私有实例的 Helm 值
fulcio:
  server:
    ingress:
      hosts:
        - fulcio.internal.company.com
    config:
      OIDCIssuers:
        https://auth.company.com:
          IssuerURL: https://auth.company.com
          ClientID: sigstore
          Type: email

rekor:
  server:
    ingress:
      hosts:
        - rekor.internal.company.com

ctlog:
  server:
    ingress:
      hosts:
        - ctlog.internal.company.com

# 私有实例的客户端配置
export COSIGN_REKOR_URL=https://rekor.internal.company.com
export COSIGN_FULCIO_URL=https://fulcio.internal.company.com
export COSIGN_MIRROR=https://tuf.internal.company.com

cosign initialize --mirror=$COSIGN_MIRROR --root=root.json
```

### 常见错误信息及解决方案

| 错误 | 原因 | 解决方案 |
|-----|------|---------|
| `no matching signatures` | 未找到签名或身份不匹配 | 检查身份/颁发者值，验证镜像是否已签名 |
| `certificate has expired` | 时钟偏差或未使用 Rekor | 启用 Rekor 验证，检查系统时间 |
| `could not find a valid trust root` | 缺少根证书 | 运行 `cosign initialize` |
| `OIDC token expired` | 签名期间令牌超时 | 重试签名，检查网络延迟 |
| `registry auth failed` | 无效的仓库凭据 | 重新认证仓库 |

## 性能考量

### 签名延迟

```
┌─────────────────────────────────────────────────────────────────┐
│                      签名延迟分解                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  操作                                 典型延迟                    │
│  ─────────────────────────────────────────────────────           │
│  OIDC 认证                            500ms - 2s                 │
│  Fulcio 证书请求                      200ms - 500ms              │
│  签名生成                             10ms - 50ms                │
│  Rekor 日志条目                       200ms - 500ms              │
│  仓库推送（签名）                      100ms - 300ms              │
│  ─────────────────────────────────────────────────────           │
│  无密钥签名总计                       ~1s - 3.5s                  │
│                                                                  │
│  基于密钥的签名（无 OIDC/Fulcio）：                               │
│  ─────────────────────────────────────────────────────           │
│  签名生成                             10ms - 50ms                │
│  Rekor 日志条目                       200ms - 500ms              │
│  仓库推送                             100ms - 300ms              │
│  ─────────────────────────────────────────────────────           │
│  基于密钥签名总计                     ~300ms - 850ms              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 验证延迟

```bash
# 基准测试验证性能
time for i in {1..10}; do
  cosign verify ghcr.io/myorg/myapp:v1.0.0 \
    --certificate-identity user@example.com \
    --certificate-oidc-issuer https://accounts.google.com \
    2>/dev/null
done

# 典型验证延迟：
# - 带 Rekor 检查：200ms - 500ms
# - 缓存（TUF root）：100ms - 200ms
```

### 批量操作

```bash
#!/bin/bash
# 带并行执行的批量签名脚本

IMAGES=(
  "ghcr.io/myorg/app1:v1.0.0"
  "ghcr.io/myorg/app2:v1.0.0"
  "ghcr.io/myorg/app3:v1.0.0"
)

# 并行签名镜像（限制并发）
printf '%s\n' "${IMAGES[@]}" | xargs -P 3 -I {} \
  cosign sign --yes {}

# 批量验证
verify_batch() {
  local failed=0
  for image in "${IMAGES[@]}"; do
    if ! cosign verify "$image" \
      --certificate-identity user@example.com \
      --certificate-oidc-issuer https://accounts.google.com \
      2>/dev/null; then
      echo "失败: $image"
      ((failed++))
    fi
  done
  return $failed
}

verify_batch
```

### 缓存策略

```go
// 验证缓存实现
package verification

import (
    "crypto/sha256"
    "encoding/hex"
    "sync"
    "time"
)

type VerificationCache struct {
    mu      sync.RWMutex
    cache   map[string]cacheEntry
    ttl     time.Duration
}

type cacheEntry struct {
    verified  bool
    timestamp time.Time
}

func NewVerificationCache(ttl time.Duration) *VerificationCache {
    return &VerificationCache{
        cache: make(map[string]cacheEntry),
        ttl:   ttl,
    }
}

func (c *VerificationCache) cacheKey(imageRef, identity, issuer string) string {
    h := sha256.New()
    h.Write([]byte(imageRef + identity + issuer))
    return hex.EncodeToString(h.Sum(nil))
}

func (c *VerificationCache) Get(imageRef, identity, issuer string) (bool, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()

    key := c.cacheKey(imageRef, identity, issuer)
    entry, exists := c.cache[key]

    if !exists || time.Since(entry.timestamp) > c.ttl {
        return false, false
    }

    return entry.verified, true
}

func (c *VerificationCache) Set(imageRef, identity, issuer string, verified bool) {
    c.mu.Lock()
    defer c.mu.Unlock()

    key := c.cacheKey(imageRef, identity, issuer)
    c.cache[key] = cacheEntry{
        verified:  verified,
        timestamp: time.Now(),
    }
}
```

## 实战场景

### 完整供应链安全流水线

```yaml
# .github/workflows/secure-pipeline.yml
name: Secure Build Pipeline

on:
  push:
    tags:
      - 'v*'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

permissions:
  contents: write
  packages: write
  id-token: write
  security-events: write

jobs:
  # 阶段1：安全扫描
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  # 阶段2：构建和签名
  build-sign:
    needs: security-scan
    runs-on: ubuntu-latest
    outputs:
      digest: ${{ steps.build.outputs.digest }}

    steps:
      - uses: actions/checkout@v4

      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      - name: Install Syft
        uses: anchore/sbom-action/download-syft@v0

      - name: Install Grype
        run: |
          curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.ref_name }}

      - name: Sign Image
        run: |
          cosign sign --yes \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}

      - name: Generate SBOM
        run: |
          syft ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }} \
            -o spdx-json > sbom.spdx.json

      - name: Attest SBOM
        run: |
          cosign attest --yes \
            --predicate sbom.spdx.json \
            --type spdxjson \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}

      - name: Scan Image for Vulnerabilities
        run: |
          grype ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }} \
            -o json > vuln-scan.json

      - name: Attest Vulnerability Scan
        run: |
          cosign attest --yes \
            --predicate vuln-scan.json \
            --type vuln \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}

  # 阶段3：生成 SLSA 来源证明
  provenance:
    needs: build-sign
    permissions:
      actions: read
      id-token: write
      packages: write
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v1.9.0
    with:
      image: ghcr.io/${{ github.repository }}
      digest: ${{ needs.build-sign.outputs.digest }}

  # 阶段4：验证门控
  verify:
    needs: [build-sign, provenance]
    runs-on: ubuntu-latest
    steps:
      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      - name: Verify All Attestations
        run: |
          IMAGE="${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build-sign.outputs.digest }}"

          echo "验证镜像签名..."
          cosign verify "$IMAGE" \
            --certificate-identity-regexp '^https://github.com/${{ github.repository }}/.github/workflows/.*@.*' \
            --certificate-oidc-issuer https://token.actions.githubusercontent.com

          echo "验证 SBOM 证明..."
          cosign verify-attestation "$IMAGE" \
            --type spdxjson \
            --certificate-identity-regexp '^https://github.com/${{ github.repository }}/.github/workflows/.*@.*' \
            --certificate-oidc-issuer https://token.actions.githubusercontent.com

          echo "验证漏洞扫描证明..."
          cosign verify-attestation "$IMAGE" \
            --type vuln \
            --certificate-identity-regexp '^https://github.com/${{ github.repository }}/.github/workflows/.*@.*' \
            --certificate-oidc-issuer https://token.actions.githubusercontent.com

          echo "验证 SLSA 来源证明..."
          cosign verify-attestation "$IMAGE" \
            --type slsaprovenance \
            --certificate-identity-regexp '^https://github.com/slsa-framework/slsa-github-generator/.github/workflows/.*@.*' \
            --certificate-oidc-issuer https://token.actions.githubusercontent.com

          echo "所有验证通过！"
```

### npm 包 Sigstore 签名

```json
// package.json 带来源证明
{
  "name": "@myorg/mypackage",
  "version": "1.0.0",
  "publishConfig": {
    "provenance": true
  }
}
```

```yaml
# .github/workflows/npm-publish.yml
name: Publish to npm

on:
  release:
    types: [published]

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Python 包签名（PyPI 可信发布者）

```yaml
# .github/workflows/pypi-publish.yml
name: Publish to PyPI

on:
  release:
    types: [published]

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: pypi

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Build
        run: |
          pip install build
          python -m build

      - name: Publish to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        # 无需凭据 - 使用 OIDC
```

## 面试要点

### 常见面试问题

**问题1：什么是无密钥签名，Sigstore 如何实现它？**

无密钥签名消除了对长期加密密钥的需求。Sigstore 通过以下方式实现：
1. OIDC 身份验证 - 开发者通过身份提供商（GitHub、Google）进行认证
2. Fulcio 临时证书 - 有效期仅为几分钟
3. 透明日志（Rekor）- 记录所有签名事件及时间戳
4. 这种组合允许验证特定身份在特定时间签署了制品，无需永久密钥存储

**问题2：解释每个 Sigstore 组件的作用。**

- **Cosign**：用于签名和验证容器及制品的客户端工具
- **Fulcio**：基于 OIDC 令牌颁发短期证书的证书颁发机构
- **Rekor**：记录所有签名事件的不可变透明日志，即使证书过期后也能进行验证

**问题3：Sigstore 与传统 GPG 签名有何不同？**

| 方面 | 传统 GPG | Sigstore |
|-----|---------|----------|
| 密钥管理 | 需要安全存储的长期密钥 | 无需管理密钥（无密钥模式） |
| 身份 | 基于密钥（谁拥有密钥？） | 基于身份（通过 OIDC 验证） |
| 吊销 | 复杂的 CRL/OCSP 基础设施 | 不需要 - 证书是临时的 |
| 审计追踪 | 取决于实现 | 通过 Rekor 透明日志内置 |
| 验证 | 需要信任密钥分发 | 验证身份 + 时间戳 + 日志包含 |

**问题4：Sigstore 的安全模型是什么？**

Sigstore 的安全性依赖于：
1. 信任 OIDC 提供商进行身份验证
2. 信任 Fulcio CA 进行证书颁发
3. 信任 Rekor 的仅追加特性
4. 加密证明（Merkle 树）确保日志完整性
5. 这种组合确保即使一个组件被攻破，攻击也是可检测的

**问题5：如何在 Kubernetes 集群中执行 Sigstore 验证？**

```yaml
# 使用 Sigstore Policy Controller
apiVersion: policy.sigstore.dev/v1beta1
kind: ClusterImagePolicy
metadata:
  name: enforce-signatures
spec:
  images:
    - glob: "ghcr.io/myorg/**"
  authorities:
    - keyless:
        identities:
          - issuer: https://token.actions.githubusercontent.com
            subjectRegExp: "^https://github.com/myorg/.*$"
```

**问题6：Sigstore 的局限性是什么？**

- 签名需要网络连接（OIDC、Fulcio、Rekor）
- 依赖外部服务（单点故障）
- 身份与 OIDC 提供商信任绑定
- 不适合所有合规场景（某些需要传统 PKI）
- 验证需要 Rekor 访问或预打包证明用于离线使用

**问题7：SLSA 来源证明如何补充 Sigstore 签名？**

Sigstore 签名证明谁签署了制品，而 SLSA 来源证明证明制品是如何构建的：
- 构建平台证明
- 源代码引用
- 构建配置
- 可重现性声明

它们共同提供全面的供应链安全：
- Sigstore："这是由发布工作流签名的"
- SLSA："这是在平台 Z 上使用配置 Y 从提交 X 构建的"

## 延伸阅读

### 官方文档

- [Sigstore 文档](https://docs.sigstore.dev)
- [Cosign GitHub 仓库](https://github.com/sigstore/cosign)
- [Fulcio 文档](https://github.com/sigstore/fulcio)
- [Rekor 文档](https://github.com/sigstore/rekor)
- [Sigstore Policy Controller](https://docs.sigstore.dev/policy-controller/overview/)

### 相关安全框架

- [SLSA 框架](https://slsa.dev) - 软件制品的供应链级别
- [OpenSSF Scorecard](https://securityscorecards.dev) - 开源项目的安全健康度指标
- [in-toto](https://in-toto.io) - 软件供应链完整性框架
- [The Update Framework (TUF)](https://theupdateframework.io) - 安全软件更新

### 教程和指南

- [Kubernetes 签名文档](https://kubernetes.io/docs/tasks/administer-cluster/verify-signed-artifacts/)
- [npm 来源证明](https://docs.npmjs.com/generating-provenance-statements)
- [PyPI 可信发布者](https://docs.pypi.org/trusted-publishers/)
- [GitHub 博客：npm 的 Sigstore](https://github.blog/2023-04-19-introducing-npm-package-provenance/)

### 社区资源

- [Sigstore Slack](https://sigstore.slack.com)
- [OpenSSF 社区](https://openssf.org/community/)
- [CNCF 供应链安全 TAG](https://github.com/cncf/tag-security)

Sigstore 代表了我们处理软件签名和验证方式的根本性转变。通过消除密钥管理的负担，同时提供强大的基于身份的签名和不可变的审计追踪，它使各种规模的项目都能实现安全的软件供应链。随着主要包注册表和容器生态系统的采用不断增长，理解 Sigstore 对于参与软件开发和安全的任何人来说都变得必不可少。
