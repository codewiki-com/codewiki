---
title: Sigstore Software Signing
description: A comprehensive guide to Sigstore - keyless signing and verification for software artifacts
track: security
section: appsec
difficulty: intermediate
tags:
  - Sigstore
  - Cosign
  - Rekor
  - Fulcio
  - Software Signing
  - Supply Chain Security
status: imported
origin: old/src/content/docs/security/sigstore.en.md
divergence: 0.221
issues: []
legacy:
  category: Security
  subcategory: Supply Chain
  order: 15
  lastUpdated: 2026-01-20
---

Sigstore represents a paradigm shift in software signing and verification. Traditional code signing requires managing long-lived cryptographic keys, which presents significant operational challenges and security risks. Sigstore eliminates these pain points by providing keyless signing based on ephemeral certificates and OIDC identity verification. Backed by the Linux Foundation and adopted by major projects including Kubernetes, npm, and PyPI, Sigstore is rapidly becoming the standard for software supply chain security.

## What is Sigstore?

### The Problem with Traditional Code Signing

Traditional code signing relies on long-lived private keys, which creates several challenges:

```
┌─────────────────────────────────────────────────────────────────┐
│             Traditional Code Signing Challenges                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐│
│  │   Key Management  │  │  Key Compromise  │  │   Key Rotation   ││
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤│
│  │ • Secure storage │  │ • Long exposure  │  │ • Complex process││
│  │ • Access control │  │   window         │  │ • Coordination   ││
│  │ • Backup/recovery│  │ • Revocation     │  │   overhead       ││
│  │ • HSM costs      │  │   difficulties   │  │ • Trust chain    ││
│  └──────────────────┘  └──────────────────┘  │   updates        ││
│                                              └──────────────────┘│
│                                                                  │
│  Traditional Flow:                                               │
│  Developer → Long-lived Private Key → Sign → Distribute          │
│                    ↓                                             │
│              KEY COMPROMISE = ALL SIGNATURES COMPROMISED         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Sigstore's Keyless Innovation

Sigstore introduces keyless signing where developers authenticate via OIDC (OpenID Connect), receive ephemeral certificates valid for minutes, and all signing events are recorded in an immutable transparency log:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sigstore Keyless Signing                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Developer                                                       │
│      │                                                           │
│      ▼                                                           │
│  ┌────────────────┐     OIDC Token      ┌────────────────┐      │
│  │ Identity       │ ─────────────────▶  │    Fulcio      │      │
│  │ Provider       │                     │ (Certificate   │      │
│  │ (GitHub/Google)│                     │    Authority)  │      │
│  └────────────────┘                     └───────┬────────┘      │
│                                                  │               │
│                                    Ephemeral Certificate        │
│                                    (Valid ~10 minutes)          │
│                                                  │               │
│                                                  ▼               │
│  ┌────────────────┐                     ┌────────────────┐      │
│  │    Artifact    │ ◀── Sign with ───── │   Developer    │      │
│  │  (Container,   │     Ephemeral Key   │                │      │
│  │   Binary, etc) │                     └───────┬────────┘      │
│  └───────┬────────┘                             │               │
│          │                                      │               │
│          ▼                                      ▼               │
│  ┌────────────────┐                     ┌────────────────┐      │
│  │     Rekor      │ ◀─── Record ─────── │   Signature    │      │
│  │ (Transparency  │      Entry          │   + Cert       │      │
│  │     Log)       │                     └────────────────┘      │
│  └────────────────┘                                              │
│                                                                  │
│  Benefits:                                                       │
│  • No long-lived keys to manage                                  │
│  • Identity-based signing (who signed, not just what key)        │
│  • Immutable audit trail                                         │
│  • Automatic key rotation (every signing event)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Linux Foundation and Industry Adoption

Sigstore was created by Red Hat, Google, and Purdue University in 2021 and is now hosted by the Linux Foundation under the Open Source Security Foundation (OpenSSF). Major adopters include:

| Project/Organization | Usage |
|---------------------|-------|
| Kubernetes | Signs all release artifacts |
| npm | Package provenance with Sigstore |
| PyPI | Trusted Publishers with Sigstore |
| GitHub Actions | Native Sigstore integration |
| Homebrew | Bottle attestation |
| Arch Linux | Package signing |

## Core Components

Sigstore consists of three main components that work together to provide a complete signing and verification ecosystem.

### Cosign - Container and Artifact Signing

Cosign is the primary client tool for signing and verifying container images and other artifacts:

```bash
# Install Cosign
# Using Go
go install github.com/sigstore/cosign/v2/cmd/cosign@latest

# Using Homebrew
brew install cosign

# Using apt (Debian/Ubuntu)
wget https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64
sudo mv cosign-linux-amd64 /usr/local/bin/cosign
sudo chmod +x /usr/local/bin/cosign

# Verify installation
cosign version
```

**Key Features:**

- Keyless signing with OIDC identity providers
- Traditional key-pair signing support
- Container image signing and verification
- Blob/artifact signing
- SBOM attestation
- In-toto attestation support

### Fulcio - Certificate Authority

Fulcio is a free code-signing certificate authority that issues short-lived certificates based on OIDC identity:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Fulcio Certificate Flow                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Authentication Request                                       │
│     Client ──────────────────────────▶ OIDC Provider             │
│                                       (GitHub, Google, etc)      │
│                                                                  │
│  2. OIDC Token Response                                          │
│     Client ◀────────────────────────── OIDC Provider             │
│     (Contains identity claims:                                   │
│      email, repository, workflow)                                │
│                                                                  │
│  3. Certificate Request                                          │
│     Client ──────────────────────────▶ Fulcio                    │
│     (OIDC Token + Public Key)                                    │
│                                                                  │
│  4. Certificate Response                                         │
│     Client ◀────────────────────────── Fulcio                    │
│     (X.509 Certificate with:                                     │
│      - Identity in Subject/SAN                                   │
│      - ~10 minute validity                                       │
│      - SCT for CT log inclusion)                                 │
│                                                                  │
│  Certificate Extensions (OIDs):                                  │
│  • 1.3.6.1.4.1.57264.1.1 - OIDC Issuer                          │
│  • 1.3.6.1.4.1.57264.1.2 - GitHub Workflow Trigger               │
│  • 1.3.6.1.4.1.57264.1.3 - GitHub Workflow SHA                   │
│  • 1.3.6.1.4.1.57264.1.4 - GitHub Workflow Name                  │
│  • 1.3.6.1.4.1.57264.1.5 - GitHub Workflow Repository            │
│  • 1.3.6.1.4.1.57264.1.6 - GitHub Workflow Ref                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Rekor - Transparency Log

Rekor provides an immutable, append-only transparency log for recording signing events:

```bash
# Query Rekor for entries
rekor-cli search --email user@example.com

# Get a specific entry
rekor-cli get --uuid <entry-uuid>

# Search by artifact hash
rekor-cli search --sha sha256:abc123...

# Verify inclusion proof
rekor-cli verify --artifact file.txt --signature file.txt.sig --public-key key.pub
```

**Rekor Entry Structure:**

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

**Transparency Log Properties:**

| Property | Description |
|----------|-------------|
| Append-only | Entries cannot be modified or deleted |
| Merkle Tree | Cryptographic proof of inclusion |
| Public | Anyone can verify entries |
| Timestamped | Each entry has a trusted timestamp |
| Searchable | Query by hash, email, or other attributes |

## OIDC Identity Verification

Sigstore leverages OIDC (OpenID Connect) to establish signer identity without managing keys.

### Supported Identity Providers

```yaml
# Supported OIDC Providers for Keyless Signing
identity_providers:
  # For individual developers
  - name: Google
    issuer: https://accounts.google.com
    identity_claim: email

  - name: Microsoft
    issuer: https://login.microsoftonline.com
    identity_claim: email

  - name: GitHub
    issuer: https://github.com/login/oauth
    identity_claim: email

  # For CI/CD workloads
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

### Workload Identity in CI/CD

GitHub Actions provides native OIDC support for Sigstore:

```yaml
# .github/workflows/sign.yml
name: Sign Container Image

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: read
  id-token: write  # Required for OIDC
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

## Container Image Signing

### Basic Signing and Verification

```bash
# Build and push your image
docker build -t ghcr.io/myorg/myapp:v1.0.0 .
docker push ghcr.io/myorg/myapp:v1.0.0

# Sign the image (keyless mode - opens browser for OIDC)
cosign sign ghcr.io/myorg/myapp:v1.0.0

# Sign with explicit yes to avoid prompts
cosign sign --yes ghcr.io/myorg/myapp:v1.0.0

# Verify the signature
cosign verify ghcr.io/myorg/myapp:v1.0.0 \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com
```

### Signing with Annotations

```bash
# Add custom annotations to signatures
cosign sign --yes \
  --annotations "version=1.0.0" \
  --annotations "commit=$(git rev-parse HEAD)" \
  --annotations "build-date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  ghcr.io/myorg/myapp:v1.0.0

# Verify with annotation requirements
cosign verify ghcr.io/myorg/myapp:v1.0.0 \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com \
  --annotations "version=1.0.0"
```

### Key-Based Signing (Alternative)

For scenarios requiring traditional keys:

```bash
# Generate a new key pair
cosign generate-key-pair

# Sign with private key
cosign sign --key cosign.key ghcr.io/myorg/myapp:v1.0.0

# Verify with public key
cosign verify --key cosign.pub ghcr.io/myorg/myapp:v1.0.0

# Use cloud KMS keys
# AWS KMS
cosign sign --key awskms:///alias/cosign-key ghcr.io/myorg/myapp:v1.0.0

# Google Cloud KMS
cosign sign --key gcpkms://projects/PROJECT/locations/LOCATION/keyRings/KEYRING/cryptoKeys/KEY ghcr.io/myorg/myapp:v1.0.0

# Azure Key Vault
cosign sign --key azurekms://VAULT_NAME.vault.azure.net/keys/KEY_NAME ghcr.io/myorg/myapp:v1.0.0

# HashiCorp Vault
cosign sign --key hashivault://transit/keys/cosign ghcr.io/myorg/myapp:v1.0.0
```

## Blob and Artifact Signing

Sigstore can sign any artifact, not just container images.

### Signing Binary Files

```bash
# Sign a binary release
cosign sign-blob --yes \
  --output-signature myapp.sig \
  --output-certificate myapp.crt \
  myapp-linux-amd64

# Verify the signature
cosign verify-blob \
  --signature myapp.sig \
  --certificate myapp.crt \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com \
  myapp-linux-amd64

# Bundle signature and certificate together
cosign sign-blob --yes \
  --bundle myapp.bundle \
  myapp-linux-amd64

# Verify using bundle
cosign verify-blob \
  --bundle myapp.bundle \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com \
  myapp-linux-amd64
```

### Signing Software Bill of Materials (SBOM)

```bash
# Generate SBOM with Syft
syft ghcr.io/myorg/myapp:v1.0.0 -o spdx-json > sbom.spdx.json

# Attach and sign SBOM to image
cosign attest --yes \
  --predicate sbom.spdx.json \
  --type spdxjson \
  ghcr.io/myorg/myapp:v1.0.0

# Verify SBOM attestation
cosign verify-attestation \
  --type spdxjson \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com \
  ghcr.io/myorg/myapp:v1.0.0

# Download and inspect SBOM
cosign download attestation ghcr.io/myorg/myapp:v1.0.0 | jq -r '.payload' | base64 -d | jq
```

### SLSA Provenance Attestation

```bash
# Generate SLSA provenance (typically done in CI)
# Using slsa-github-generator
- uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v1.9.0
  with:
    image: ghcr.io/myorg/myapp
    digest: ${{ steps.build.outputs.digest }}

# Verify SLSA provenance
cosign verify-attestation \
  --type slsaprovenance \
  --certificate-identity-regexp '^https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@refs/tags/v[0-9]+.[0-9]+.[0-9]+$' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/myorg/myapp@sha256:abc123...
```

## Verification Workflows

### Command-Line Verification

```bash
# Basic verification with identity checks
cosign verify ghcr.io/myorg/myapp:v1.0.0 \
  --certificate-identity "user@example.com" \
  --certificate-oidc-issuer "https://accounts.google.com"

# Verify GitHub Actions signed image
cosign verify ghcr.io/myorg/myapp:v1.0.0 \
  --certificate-identity-regexp "^https://github.com/myorg/myapp/.github/workflows/build.yml@.*" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"

# Verify with certificate chain (custom CA)
cosign verify \
  --certificate-chain ca-chain.pem \
  --certificate-identity "user@example.com" \
  --certificate-oidc-issuer "https://accounts.google.com" \
  ghcr.io/myorg/myapp:v1.0.0

# Output verification details as JSON
cosign verify ghcr.io/myorg/myapp:v1.0.0 \
  --certificate-identity "user@example.com" \
  --certificate-oidc-issuer "https://accounts.google.com" \
  --output json | jq
```

### Programmatic Verification (Go)

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

    // Parse image reference
    ref, err := name.ParseReference(imageRef)
    if err != nil {
        return fmt.Errorf("parsing image reference: %w", err)
    }

    // Set up verification options
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

    // Verify signatures
    signatures, bundleVerified, err := cosign.VerifyImageSignatures(ctx, ref, co)
    if err != nil {
        return fmt.Errorf("verification failed: %w", err)
    }

    fmt.Printf("Verified %d signature(s)\n", len(signatures))
    fmt.Printf("Bundle verified: %v\n", bundleVerified)

    for i, sig := range signatures {
        payload, err := sig.Payload()
        if err != nil {
            continue
        }
        fmt.Printf("Signature %d payload: %s\n", i+1, string(payload))
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
    fmt.Println("Image verification successful!")
}
```

### Programmatic Verification (Python)

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
    Verify a container image signature using Cosign.

    Args:
        image: Full image reference (e.g., ghcr.io/org/image:tag)
        identity: Expected signer identity (email or subject)
        issuer: Expected OIDC issuer URL
        identity_regexp: If True, treat identity as a regex pattern

    Returns:
        VerificationResult with verification status and details
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
    Verify an image signed by GitHub Actions.

    Args:
        image: Full image reference
        repo: GitHub repository (e.g., myorg/myapp)
        workflow: Workflow filename (e.g., build.yml)
    """
    identity_pattern = f"^https://github.com/{repo}/.github/workflows/{workflow}@.*"

    return verify_image(
        image=image,
        identity=identity_pattern,
        issuer="https://token.actions.githubusercontent.com",
        identity_regexp=True
    )

# Usage example
if __name__ == "__main__":
    result = verify_github_actions_image(
        image="ghcr.io/myorg/myapp:v1.0.0",
        repo="myorg/myapp",
        workflow="release.yml"
    )

    if result.verified:
        print("Image signature verified successfully!")
        print(f"Found {len(result.signatures)} signature(s)")
    else:
        print(f"Verification failed: {result.error}")
        sys.exit(1)
```

## CI/CD Integration

### GitHub Actions Complete Example

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
  id-token: write  # Required for Sigstore

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

  # Optional: Generate SLSA provenance
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

### GitLab CI Integration

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
      # Get the image digest
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
                    # Install Cosign
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
                        # Get digest
                        DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} | cut -d@ -f2)

                        # Sign with key
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

## Kubernetes Admission Control

### Policy Enforcement with Sigstore Policy Controller

The Sigstore Policy Controller is a Kubernetes admission controller that enforces signature verification policies.

```bash
# Install Policy Controller
helm repo add sigstore https://sigstore.github.io/helm-charts
helm repo update

helm install policy-controller sigstore/policy-controller \
  --namespace sigstore-system \
  --create-namespace
```

### Defining Cluster Image Policies

```yaml
# cluster-image-policy.yaml
apiVersion: policy.sigstore.dev/v1beta1
kind: ClusterImagePolicy
metadata:
  name: require-signed-images
spec:
  images:
    # Match all images from our registry
    - glob: "ghcr.io/myorg/**"

  authorities:
    # Require keyless signature from GitHub Actions
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
    # Require signature from specific workflow
    - keyless:
        identities:
          - issuer: https://token.actions.githubusercontent.com
            subject: "https://github.com/myorg/platform/.github/workflows/release.yml@refs/heads/main"

    # Also require SBOM attestation
    - attestations:
        - name: sbom
          predicateType: https://spdx.dev/Document
          policy:
            type: cue
            data: |
              predicateType: "https://spdx.dev/Document"
```

### Namespace-Level Enforcement

```yaml
# Enable enforcement for a namespace
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    policy.sigstore.dev/include: "true"

---
# Create namespace-specific policy
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

### Kyverno Integration

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

### Connaisseur Integration

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

## Best Practices

### Signing Policy Guidelines

```yaml
# Organizational Signing Policy Example
signing_policy:
  # Identity requirements
  identity:
    # Production releases must be signed by release workflow
    production:
      issuer: https://token.actions.githubusercontent.com
      subject_pattern: "^https://github.com/myorg/.*/.github/workflows/release.yml@refs/tags/v.*$"

    # Development images can be signed by any workflow
    development:
      issuer: https://token.actions.githubusercontent.com
      subject_pattern: "^https://github.com/myorg/.*$"

  # Required attestations
  attestations:
    production:
      - type: spdx  # SBOM
      - type: slsaprovenance  # Build provenance
      - type: vuln  # Vulnerability scan results
    development:
      - type: spdx  # At minimum, require SBOM

  # Verification requirements
  verification:
    # Always verify before deployment
    pre_deploy: required
    # Re-verify periodically in production
    periodic_check: enabled
    check_interval: 24h
```

### Key Management Best Practices

When using traditional key-based signing:

```bash
# Generate keys with strong parameters
cosign generate-key-pair --kms awskms:///alias/cosign-signing-key

# Key rotation script
#!/bin/bash
set -e

OLD_KEY_ALIAS="cosign-key-$(date -d 'yesterday' +%Y%m)"
NEW_KEY_ALIAS="cosign-key-$(date +%Y%m)"

# Create new key
aws kms create-alias \
  --alias-name "alias/${NEW_KEY_ALIAS}" \
  --target-key-id "$(aws kms create-key --query 'KeyMetadata.KeyId' --output text)"

# Export new public key
cosign public-key --key "awskms:///alias/${NEW_KEY_ALIAS}" > "cosign-${NEW_KEY_ALIAS}.pub"

# Update verification configurations
kubectl create configmap signing-keys \
  --from-file="current.pub=cosign-${NEW_KEY_ALIAS}.pub" \
  --from-file="previous.pub=cosign-${OLD_KEY_ALIAS}.pub" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Key rotation complete. Old key retained for verification."
```

### Audit Logging Configuration

```yaml
# Rekor audit configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: sigstore-audit-config
data:
  audit-policy.yaml: |
    # Log all signature verification attempts
    rules:
      - level: Metadata
        resources:
          - group: ""
            resources: ["pods"]
        verbs: ["create", "update"]

    # Detailed logging for production namespace
    rules:
      - level: RequestResponse
        namespaces: ["production"]
        resources:
          - group: ""
            resources: ["pods"]
        verbs: ["create"]
```

```python
# Audit log analyzer
import json
from datetime import datetime, timedelta
from collections import defaultdict

def analyze_signing_audit(log_file: str, days: int = 7):
    """Analyze Sigstore signing/verification audit logs."""

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

    # Generate report
    print(f"Sigstore Audit Report (Last {days} days)")
    print("=" * 60)

    for date in sorted(stats.keys()):
        data = stats[date]
        success_rate = (data["successful"] / data["total_verifications"] * 100
                       if data["total_verifications"] > 0 else 0)
        print(f"\n{date}:")
        print(f"  Total verifications: {data['total_verifications']}")
        print(f"  Success rate: {success_rate:.1f}%")
        print(f"  Unique identities: {len(data['identities'])}")
        print(f"  Unique images: {len(data['images'])}")

        if data["failed"] > 0:
            print(f"  WARNING: {data['failed']} failed verifications!")
```

## Common Pitfalls

### Certificate Expiration Handling

Sigstore certificates are ephemeral (typically valid for ~10 minutes). The signature remains valid as long as it was recorded in Rekor during the certificate's validity period.

```bash
# Verify with timestamp validation (default behavior)
cosign verify ghcr.io/myorg/myapp:v1.0.0 \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com

# The verification checks:
# 1. Signature is valid
# 2. Certificate was valid at signing time
# 3. Signing event exists in Rekor
# 4. Rekor entry timestamp is within certificate validity

# Troubleshooting expired certificate errors
# Error: "certificate has expired"
# Solution: Ensure you're using Rekor for timestamp verification
cosign verify \
  --insecure-ignore-tlog=false \  # Ensure Rekor is used (default)
  ...
```

### Offline Verification Challenges

```bash
# For air-gapped environments, use bundled verification
# During signing (online):
cosign sign --yes \
  --bundle myimage.bundle \
  ghcr.io/myorg/myapp:v1.0.0

# Transfer bundle to offline environment

# During verification (offline):
# First, download the trust root
cosign initialize  # Downloads root certificates

# Then verify with local bundle
cosign verify-blob \
  --bundle myimage.bundle \
  --offline \
  --certificate-identity user@example.com \
  --certificate-oidc-issuer https://accounts.google.com \
  artifact.tar.gz
```

### Private Deployment Considerations

```yaml
# Private Sigstore deployment (sigstore-scaffolding)
# Helm values for private instance
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

# Client configuration for private instance
export COSIGN_REKOR_URL=https://rekor.internal.company.com
export COSIGN_FULCIO_URL=https://fulcio.internal.company.com
export COSIGN_MIRROR=https://tuf.internal.company.com

cosign initialize --mirror=$COSIGN_MIRROR --root=root.json
```

### Common Error Messages and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `no matching signatures` | No signature found or identity mismatch | Check identity/issuer values, verify image was signed |
| `certificate has expired` | Clock skew or Rekor not used | Enable Rekor verification, check system time |
| `could not find a valid trust root` | Missing root certificates | Run `cosign initialize` |
| `OIDC token expired` | Token timeout during signing | Retry signing, check network latency |
| `registry auth failed` | Invalid registry credentials | Re-authenticate with registry |

## Performance Considerations

### Signing Latency

```
┌─────────────────────────────────────────────────────────────────┐
│                   Signing Latency Breakdown                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Operation                          Typical Latency              │
│  ─────────────────────────────────────────────────────           │
│  OIDC Authentication                 500ms - 2s                  │
│  Fulcio Certificate Request          200ms - 500ms               │
│  Signature Generation                10ms - 50ms                 │
│  Rekor Log Entry                     200ms - 500ms               │
│  Registry Push (signature)           100ms - 300ms               │
│  ─────────────────────────────────────────────────────           │
│  Total Keyless Signing              ~1s - 3.5s                   │
│                                                                  │
│  Key-based Signing (no OIDC/Fulcio):                             │
│  ─────────────────────────────────────────────────────           │
│  Signature Generation                10ms - 50ms                 │
│  Rekor Log Entry                     200ms - 500ms               │
│  Registry Push                       100ms - 300ms               │
│  ─────────────────────────────────────────────────────           │
│  Total Key-based Signing            ~300ms - 850ms               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Verification Latency

```bash
# Benchmark verification performance
time for i in {1..10}; do
  cosign verify ghcr.io/myorg/myapp:v1.0.0 \
    --certificate-identity user@example.com \
    --certificate-oidc-issuer https://accounts.google.com \
    2>/dev/null
done

# Typical verification latency:
# - With Rekor check: 200ms - 500ms
# - Cached (TUF root): 100ms - 200ms
```

### Batch Operations

```bash
#!/bin/bash
# Batch signing script with parallel execution

IMAGES=(
  "ghcr.io/myorg/app1:v1.0.0"
  "ghcr.io/myorg/app2:v1.0.0"
  "ghcr.io/myorg/app3:v1.0.0"
)

# Sign images in parallel (limit concurrency)
printf '%s\n' "${IMAGES[@]}" | xargs -P 3 -I {} \
  cosign sign --yes {}

# Batch verification
verify_batch() {
  local failed=0
  for image in "${IMAGES[@]}"; do
    if ! cosign verify "$image" \
      --certificate-identity user@example.com \
      --certificate-oidc-issuer https://accounts.google.com \
      2>/dev/null; then
      echo "FAILED: $image"
      ((failed++))
    fi
  done
  return $failed
}

verify_batch
```

### Caching Strategies

```go
// Verification cache implementation
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

## Real-World Scenarios

### Complete Supply Chain Security Pipeline

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
  # Stage 1: Security Scanning
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

  # Stage 2: Build and Sign
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

  # Stage 3: Generate SLSA Provenance
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

  # Stage 4: Verification Gate
  verify:
    needs: [build-sign, provenance]
    runs-on: ubuntu-latest
    steps:
      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      - name: Verify All Attestations
        run: |
          IMAGE="${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build-sign.outputs.digest }}"

          echo "Verifying image signature..."
          cosign verify "$IMAGE" \
            --certificate-identity-regexp '^https://github.com/${{ github.repository }}/.github/workflows/.*@.*' \
            --certificate-oidc-issuer https://token.actions.githubusercontent.com

          echo "Verifying SBOM attestation..."
          cosign verify-attestation "$IMAGE" \
            --type spdxjson \
            --certificate-identity-regexp '^https://github.com/${{ github.repository }}/.github/workflows/.*@.*' \
            --certificate-oidc-issuer https://token.actions.githubusercontent.com

          echo "Verifying vulnerability scan attestation..."
          cosign verify-attestation "$IMAGE" \
            --type vuln \
            --certificate-identity-regexp '^https://github.com/${{ github.repository }}/.github/workflows/.*@.*' \
            --certificate-oidc-issuer https://token.actions.githubusercontent.com

          echo "Verifying SLSA provenance..."
          cosign verify-attestation "$IMAGE" \
            --type slsaprovenance \
            --certificate-identity-regexp '^https://github.com/slsa-framework/slsa-github-generator/.github/workflows/.*@.*' \
            --certificate-oidc-issuer https://token.actions.githubusercontent.com

          echo "All verifications passed!"
```

### npm Package Signing with Sigstore

```json
// package.json with provenance
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

### Python Package Signing (PyPI Trusted Publishers)

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
        # No credentials needed - uses OIDC
```

## Interview Preparation

### Common Interview Questions

**Q1: What is keyless signing and how does Sigstore implement it?**

Keyless signing eliminates the need for long-lived cryptographic keys. Sigstore implements this through:
1. OIDC identity verification - developers authenticate via identity providers (GitHub, Google)
2. Ephemeral certificates from Fulcio - valid only for minutes
3. Transparency log (Rekor) - records all signing events with timestamps
4. The combination allows verification that a specific identity signed an artifact at a specific time, without needing permanent key storage

**Q2: Explain the role of each Sigstore component.**

- **Cosign**: Client tool for signing and verifying containers and artifacts
- **Fulcio**: Certificate authority that issues short-lived certificates based on OIDC tokens
- **Rekor**: Immutable transparency log that records all signing events, enabling verification even after certificates expire

**Q3: How does Sigstore differ from traditional GPG signing?**

| Aspect | Traditional GPG | Sigstore |
|--------|-----------------|----------|
| Key management | Long-lived keys requiring secure storage | No keys to manage (keyless mode) |
| Identity | Key-based (who owns the key?) | Identity-based (verified via OIDC) |
| Revocation | Complex CRL/OCSP infrastructure | Not needed - certificates are ephemeral |
| Audit trail | Depends on implementation | Built-in via Rekor transparency log |
| Verification | Requires trust in key distribution | Verifies identity + timestamp + log inclusion |

**Q4: What is the security model of Sigstore?**

Sigstore's security relies on:
1. Trust in OIDC providers for identity verification
2. Trust in Fulcio CA for certificate issuance
3. Trust in Rekor's append-only nature
4. Cryptographic proofs (Merkle trees) for log integrity
5. The combination ensures that even if one component is compromised, attacks are detectable

**Q5: How would you enforce Sigstore verification in a Kubernetes cluster?**

```yaml
# Using Sigstore Policy Controller
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

**Q6: What are the limitations of Sigstore?**

- Requires internet connectivity for signing (OIDC, Fulcio, Rekor)
- Depends on external services (single points of failure)
- Identity tied to OIDC provider trust
- Not suitable for all compliance scenarios (some require traditional PKI)
- Verification requires Rekor access or pre-bundled proofs for offline use

**Q7: How does SLSA provenance complement Sigstore signing?**

While Sigstore signing proves WHO signed an artifact, SLSA provenance proves HOW the artifact was built:
- Build platform attestation
- Source code reference
- Build configuration
- Reproducibility claims

Together they provide comprehensive supply chain security:
- Sigstore: "This was signed by the release workflow"
- SLSA: "This was built from commit X using config Y on platform Z"

## Further Reading

### Official Documentation

- [Sigstore Documentation](https://docs.sigstore.dev)
- [Cosign GitHub Repository](https://github.com/sigstore/cosign)
- [Fulcio Documentation](https://github.com/sigstore/fulcio)
- [Rekor Documentation](https://github.com/sigstore/rekor)
- [Sigstore Policy Controller](https://docs.sigstore.dev/policy-controller/overview/)

### Related Security Frameworks

- [SLSA Framework](https://slsa.dev) - Supply chain Levels for Software Artifacts
- [OpenSSF Scorecard](https://securityscorecards.dev) - Security health metrics for open source
- [in-toto](https://in-toto.io) - Software supply chain integrity framework
- [The Update Framework (TUF)](https://theupdateframework.io) - Secure software updates

### Tutorials and Guides

- [Kubernetes Signing Documentation](https://kubernetes.io/docs/tasks/administer-cluster/verify-signed-artifacts/)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [PyPI Trusted Publishers](https://docs.pypi.org/trusted-publishers/)
- [GitHub Blog: Sigstore for npm](https://github.blog/2023-04-19-introducing-npm-package-provenance/)

### Community Resources

- [Sigstore Slack](https://sigstore.slack.com)
- [OpenSSF Community](https://openssf.org/community/)
- [CNCF Supply Chain Security TAG](https://github.com/cncf/tag-security)

Sigstore represents a fundamental shift in how we approach software signing and verification. By eliminating the burden of key management while providing strong identity-based signing and immutable audit trails, it makes secure software supply chains accessible to projects of all sizes. As adoption grows across major package registries and container ecosystems, understanding Sigstore becomes essential knowledge for anyone involved in software development and security.
