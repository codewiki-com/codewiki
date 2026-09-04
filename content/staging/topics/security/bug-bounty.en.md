---
title: Bug Bounty Programs
description: Learn about bug bounty programs and how to participate
track: security
section: appsec
difficulty: intermediate
tags:
  - bug bounty
  - vulnerability research
  - security testing
  - HackerOne
status: imported
origin: old/src/content/docs/security/bug-bounty.en.md
divergence: 0.338
issues: []
legacy:
  category: Security
  subcategory: Offensive
  order: 17
  lastUpdated: 2026-01-07
---

Bug bounty programs are structured initiatives that reward security researchers for discovering and responsibly disclosing vulnerabilities in software systems. These programs create a collaborative relationship between organizations and the security community, enabling companies to leverage external expertise while providing researchers with legal authorization and financial incentives to find security flaws.

## What is a Bug Bounty Program

A bug bounty program is a crowdsourced security testing initiative where organizations invite ethical hackers to identify vulnerabilities in their systems in exchange for monetary rewards or recognition. Unlike traditional penetration testing, bug bounty programs provide continuous security assessment from a diverse pool of researchers with varied skills and perspectives.

### How Bug Bounties Work

The typical bug bounty workflow follows this pattern:

```
+------------+     +-------------+     +-----------+     +------------+
| Researcher | --> | Discovers   | --> | Reports   | --> | Receives   |
| joins      |     | vulnerability|     | to program|     | reward     |
| program    |     |             |     |           |     |            |
+------------+     +-------------+     +-----------+     +------------+
                                              |
                                              v
                                    +-------------------+
                                    | Organization      |
                                    | validates & fixes |
                                    +-------------------+
```

### Key Participants

| Role | Responsibility |
|------|----------------|
| Security Researcher | Finds and reports vulnerabilities following program rules |
| Program Owner | Defines scope, rules, and rewards; validates reports |
| Bug Bounty Platform | Facilitates communication, handles payments, manages disputes |
| Triage Team | Initial assessment and validation of submitted reports |

### Benefits of Bug Bounty Programs

**For Organizations**:
- Access to diverse security expertise
- Continuous security testing
- Cost-effective compared to maintaining large security teams
- Early vulnerability detection before malicious exploitation
- Positive security reputation

**For Researchers**:
- Legal authorization to test systems
- Financial rewards for discoveries
- Professional recognition and reputation building
- Skill development through real-world testing
- Community engagement and networking

## Bug Bounty Platforms

Several platforms facilitate bug bounty programs, providing infrastructure for vulnerability submission, triage, and payment processing.

### HackerOne

HackerOne is one of the largest bug bounty platforms, hosting programs for companies like Google, Microsoft, and the US Department of Defense.

**Key Features**:
- Extensive program catalog
- Reputation and ranking system
- Mediation for disputed reports
- Private and public programs
- Integration with security tools

**Reputation System**:
```
Signal:     Based on valid report ratio
Impact:     Based on severity of findings
Reputation: Combination of signal and impact

Reputation Levels:
0-99:     New hacker
100-499:  Regular
500-999:  Expert
1000+:    Elite
```

### Bugcrowd

Bugcrowd offers both managed bug bounty programs and vulnerability disclosure programs.

**Platform Features**:
- Crowdsourced penetration testing
- Vulnerability rating taxonomy
- Skill-based researcher matching
- Coordinated disclosure support
- Bug bash events

**Vulnerability Rating Taxonomy (VRT)**:
```
P1 (Critical): Remote code execution, authentication bypass
P2 (High):     SQL injection, significant data exposure
P3 (Medium):   XSS, CSRF with security impact
P4 (Low):      Information disclosure, low-impact issues
P5 (Info):     Best practice violations, minimal security impact
```

### Other Notable Platforms

| Platform | Focus Area | Notable Programs |
|----------|------------|------------------|
| Synack | Red team as a service | Fortune 500 companies |
| Intigriti | European market focus | Enterprise programs |
| YesWeHack | European platform | Government and enterprise |
| Cobalt | Pentest as a service | Technology companies |
| Open Bug Bounty | Non-profit, web focused | Community-driven |

### Choosing a Platform

Consider these factors when selecting a platform:

1. **Program Availability**: Range of companies and industries
2. **Payout Reliability**: Payment methods and timing
3. **Community Support**: Forums, documentation, mentorship
4. **Reputation Value**: Industry recognition of platform credentials
5. **Geographic Restrictions**: Availability in your region

## Types of Bug Bounty Programs

### Public Programs

Open to all researchers without invitation requirements.

**Characteristics**:
- Anyone can participate
- Scope and rules publicly available
- Higher competition among researchers
- Often lower individual payouts
- Good for beginners to build reputation

### Private Programs

Invitation-only programs requiring platform reputation or specific qualifications.

**Characteristics**:
- Requires invitation or high reputation
- Less competition
- Often higher payouts
- May involve sensitive systems
- Background checks may be required

### Vulnerability Disclosure Programs (VDP)

Programs that accept vulnerability reports but may not offer monetary rewards.

**Characteristics**:
- Recognition-based rewards
- Safe harbor for researchers
- Lower barrier to entry
- Good for building portfolio
- Often stepping stone to paid programs

## Scope and Rules

Understanding program scope and rules is critical for successful and legal participation.

### Typical Scope Elements

```yaml
# Example Bug Bounty Scope

in_scope:
  domains:
    - "*.example.com"
    - "api.example.com"
    - "mobile.example.com"

  applications:
    - "iOS application (latest version)"
    - "Android application (latest version)"
    - "Web application"

  vulnerability_types:
    - "Remote code execution"
    - "SQL injection"
    - "Authentication bypass"
    - "Cross-site scripting (XSS)"
    - "Cross-site request forgery (CSRF)"
    - "Server-side request forgery (SSRF)"
    - "Insecure direct object reference (IDOR)"

out_of_scope:
  domains:
    - "blog.example.com"
    - "careers.example.com"
    - "third-party services"

  vulnerability_types:
    - "Self-XSS"
    - "Missing security headers without impact"
    - "Clickjacking without sensitive action"
    - "Rate limiting issues"
    - "Denial of service attacks"
    - "Social engineering attacks"
    - "Physical security attacks"
```

### Common Rules and Restrictions

| Rule Category | Description |
|---------------|-------------|
| Testing Boundaries | Only test systems explicitly in scope |
| Data Access | Do not access, modify, or delete user data |
| Disclosure | No public disclosure without authorization |
| Automation | Respect rate limits and avoid DoS conditions |
| Account Testing | Only test accounts you own or are authorized to use |
| Report Quality | Provide clear reproduction steps and impact assessment |

### Safe Harbor

Most programs include safe harbor provisions protecting researchers from legal action when following program rules:

```
Safe Harbor Conditions:
1. Follow program scope and rules
2. Report vulnerabilities through proper channels
3. Do not exploit vulnerabilities beyond proof of concept
4. Maintain confidentiality until authorized disclosure
5. Act in good faith without malicious intent
```

## Finding Vulnerabilities

### Reconnaissance Phase

Effective bug bounty hunting begins with thorough reconnaissance.

**Subdomain Enumeration**:
```bash
# Using subfinder
subfinder -d example.com -o subdomains.txt

# Using amass
amass enum -d example.com -o amass_results.txt

# Using assetfinder
assetfinder --subs-only example.com > assetfinder_results.txt

# Combine and deduplicate
cat subdomains.txt amass_results.txt assetfinder_results.txt | sort -u > all_subdomains.txt
```

**Technology Detection**:
```bash
# Using whatweb
whatweb -i all_subdomains.txt -o tech_detection.txt

# Using wappalyzer (browser extension or CLI)
wappalyzer https://example.com

# Using builtwith
curl "https://api.builtwith.com/v1/api.json?key=API_KEY&lookup=example.com"
```

**Directory and File Discovery**:
```bash
# Using gobuster
gobuster dir -u https://example.com -w /path/to/wordlist.txt -o gobuster_results.txt

# Using ffuf
ffuf -u https://example.com/FUZZ -w /path/to/wordlist.txt -o ffuf_results.txt

# Using dirsearch
dirsearch -u https://example.com -e php,asp,aspx,jsp,html,js
```

### Common Vulnerability Types

**1. Cross-Site Scripting (XSS)**

Test all input vectors for script injection:

```javascript
// Basic XSS payloads
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>

// Context-specific payloads
" onclick=alert('XSS')//
'-alert('XSS')-'
</script><script>alert('XSS')</script>

// Filter bypass techniques
<scr<script>ipt>alert('XSS')</scr</script>ipt>
<img src=x onerror=\u0061lert('XSS')>
```

**2. SQL Injection**

Test database queries for injection points:

```sql
-- Basic detection
' OR '1'='1
" OR "1"="1
' OR 1=1--
" OR 1=1--

-- Error-based detection
'
"
`

-- Union-based detection
' UNION SELECT NULL--
' UNION SELECT NULL,NULL--
' UNION SELECT 1,2,3--

-- Time-based blind detection
'; WAITFOR DELAY '0:0:5'--
' AND SLEEP(5)--
```

**3. Server-Side Request Forgery (SSRF)**

Test URL parameters for internal resource access:

```
# Internal IP addresses
http://127.0.0.1
http://localhost
http://169.254.169.254 (cloud metadata)
http://[::1]

# Bypass techniques
http://127.0.0.1.nip.io
http://0x7f000001
http://2130706433
http://127.1
```

**4. Insecure Direct Object Reference (IDOR)**

Test for authorization bypass on object references:

```
# Numeric ID manipulation
/api/users/123 -> /api/users/124
/api/orders/1000 -> /api/orders/1001

# UUID guessing/enumeration
/api/documents/abc123 -> /api/documents/abc124

# Parameter pollution
/api/users?id=123&id=124
```

**5. Authentication Vulnerabilities**

```
# Password reset flaws
- Token predictability
- Host header injection
- Rate limiting bypass

# Session management
- Session fixation
- Token leakage in logs
- Insufficient session expiration

# Multi-factor bypass
- Backup code brute force
- Response manipulation
- Race conditions
```

### Testing Methodology

**Systematic Approach**:

```
1. Reconnaissance
   - Subdomain enumeration
   - Technology fingerprinting
   - Content discovery
   - JavaScript analysis

2. Mapping
   - Application functionality
   - Entry points (forms, APIs)
   - User roles and permissions
   - Data flows

3. Vulnerability Discovery
   - Input validation testing
   - Authentication/authorization
   - Business logic flaws
   - Configuration issues

4. Exploitation
   - Proof of concept development
   - Impact demonstration
   - Chain vulnerabilities for higher impact

5. Reporting
   - Document findings clearly
   - Include reproduction steps
   - Assess impact and severity
```

## Writing Effective Reports

The quality of your vulnerability report significantly impacts reward decisions and triage speed.

### Report Structure

```markdown
## Title
[Vulnerability Type] - [Affected Component] - [Brief Impact Description]

## Summary
Brief description of the vulnerability and its security impact.

## Severity
[Critical/High/Medium/Low] based on CVSS or program-specific rating.

## Affected Component
- URL/Endpoint: https://example.com/vulnerable/endpoint
- Parameter: user_input
- Application: Web Application v2.3.1

## Steps to Reproduce
1. Navigate to https://example.com/login
2. Enter username: admin' OR '1'='1'--
3. Enter any password
4. Click "Login"
5. Observe successful authentication bypass

## Proof of Concept
[Screenshots, video, or code demonstrating the vulnerability]

## Impact
- What can an attacker achieve?
- What data is at risk?
- How many users could be affected?

## Remediation Recommendation
Suggested fix or mitigation strategy.

## Additional Information
- Browser/environment details
- Related vulnerabilities
- References to similar issues
```

### CVSS Scoring

The Common Vulnerability Scoring System helps quantify severity:

| Metric | Options |
|--------|---------|
| Attack Vector | Network, Adjacent, Local, Physical |
| Attack Complexity | Low, High |
| Privileges Required | None, Low, High |
| User Interaction | None, Required |
| Scope | Unchanged, Changed |
| Impact (C/I/A) | None, Low, High |

**Severity Ratings**:
```
0.0:       None
0.1-3.9:   Low
4.0-6.9:   Medium
7.0-8.9:   High
9.0-10.0:  Critical
```

### Report Quality Factors

| Factor | Impact on Report |
|--------|------------------|
| Clarity | Clear, concise descriptions aid quick understanding |
| Reproducibility | Detailed steps ensure validation success |
| Impact Assessment | Demonstrates real-world consequences |
| Professionalism | Proper formatting and communication |
| Completeness | All necessary information included |

### Common Report Mistakes

1. **Vague Descriptions**: Not explaining the actual security impact
2. **Missing Steps**: Incomplete reproduction instructions
3. **Overstated Severity**: Claiming higher impact than justified
4. **Duplicate Submissions**: Not checking for existing reports
5. **Out-of-Scope Testing**: Reporting issues outside program scope
6. **Poor Communication**: Unprofessional or demanding tone

## Reward Structures

### Typical Payout Ranges

| Severity | Typical Range | Example Vulnerabilities |
|----------|---------------|------------------------|
| Critical | $5,000-$100,000+ | RCE, authentication bypass, mass data breach |
| High | $1,000-$15,000 | SQL injection, significant SSRF, privilege escalation |
| Medium | $250-$2,500 | Stored XSS, CSRF, information disclosure |
| Low | $50-$500 | Reflected XSS, minor misconfigurations |
| Informational | $0-$100 | Best practice violations |

### Factors Affecting Rewards

```
Reward = Base Amount x Multipliers

Multipliers:
- Severity: Critical findings receive highest base
- Impact: Real-world exploitability and consequences
- Quality: Report completeness and clarity
- Novelty: New attack vectors or techniques
- Scope: Affected user base size
- Chain: Combining vulnerabilities for greater impact
```

### Payment Methods

| Method | Processing Time | Considerations |
|--------|-----------------|----------------|
| PayPal | 1-3 days | Widely available, fees apply |
| Bank Transfer | 3-7 days | Higher amounts, identity verification |
| Cryptocurrency | Hours to days | Privacy benefits, volatility |
| Payoneer | 2-5 days | International transfers |
| Platform Credits | Instant | Can be used for swag or donations |

## Tips for Bug Bounty Success

### Getting Started

1. **Learn the Fundamentals**: Master web security basics before hunting
2. **Start with VDPs**: Build skills without competitive pressure
3. **Read Reports**: Study disclosed vulnerabilities for patterns
4. **Pick Your Focus**: Specialize in specific vulnerability types
5. **Set Up Your Environment**: Configure proper testing tools

### Improving Your Skills

**Recommended Learning Resources**:

| Resource | Focus Area |
|----------|------------|
| PortSwigger Web Security Academy | Web vulnerabilities |
| HackTheBox | Practical exploitation |
| TryHackMe | Guided learning paths |
| PentesterLab | Real-world scenarios |
| OWASP Testing Guide | Comprehensive methodology |

**Practice Platforms**:
```
- OWASP WebGoat
- DVWA (Damn Vulnerable Web Application)
- bWAPP
- HackTheBox
- VulnHub
```

### Efficiency Tips

**Time Management**:
```
1. Focus on programs with good response times
2. Avoid programs with many duplicate reports
3. Test during off-peak hours for fewer duplicates
4. Use automation for reconnaissance, manual testing for exploitation
5. Set time limits per target to avoid rabbit holes
```

**Tool Automation**:
```bash
#!/bin/bash
# Basic recon automation script

TARGET=$1

echo "[*] Starting reconnaissance for $TARGET"

# Subdomain enumeration
echo "[*] Finding subdomains..."
subfinder -d $TARGET -silent | tee -a subdomains.txt
amass enum -passive -d $TARGET | tee -a subdomains.txt
sort -u subdomains.txt -o subdomains.txt

# Alive check
echo "[*] Checking live hosts..."
cat subdomains.txt | httpx -silent | tee alive.txt

# Technology detection
echo "[*] Detecting technologies..."
cat alive.txt | httpx -tech-detect -silent | tee tech.txt

# Screenshot capture
echo "[*] Taking screenshots..."
cat alive.txt | gowitness file -f - -P screenshots/

echo "[+] Reconnaissance complete!"
```

### Building Reputation

```
Reputation Growth Strategy:
1. Quality over quantity (valid reports)
2. Clear, professional communication
3. Consistent participation
4. Help triage teams with additional info
5. Engage with community
6. Specialize in niche areas
```

### Avoiding Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Testing out of scope | Always verify scope before testing |
| Aggressive scanning | Use rate limiting and respect robots.txt |
| Poor time management | Set boundaries and diversify targets |
| Burnout | Take breaks, vary activities |
| Duplicate reports | Search existing reports before submitting |
| Unrealistic expectations | Focus on learning, not just earnings |

## Legal and Ethical Considerations

### Legal Protections

Bug bounty programs provide legal authorization, but researchers must:

1. **Stay Within Scope**: Only test explicitly authorized systems
2. **Follow Rules**: Adhere to all program guidelines
3. **Document Authorization**: Keep records of program terms
4. **Avoid Harm**: Never cause service disruption or data loss
5. **Report Properly**: Use designated channels for disclosure

### Ethical Guidelines

```
Bug Bounty Ethics:

DO:
- Act in good faith
- Minimize data access
- Report promptly
- Maintain confidentiality
- Respect user privacy

DON'T:
- Access user data unnecessarily
- Exploit vulnerabilities for personal gain
- Threaten or extort organizations
- Publicly disclose without permission
- Test systems without authorization
```

### Geographic Considerations

Some regions have specific laws affecting bug bounty participation:

| Region | Consideration |
|--------|---------------|
| United States | CFAA compliance, safe harbor importance |
| European Union | GDPR data handling requirements |
| China | Restrictions on vulnerability disclosure |
| Russia | Complex legal landscape for security research |
| Middle East | Varying regulations by country |

## Tools of the Trade

### Essential Tools

| Category | Tools |
|----------|-------|
| Proxy | Burp Suite, OWASP ZAP, mitmproxy |
| Reconnaissance | Amass, Subfinder, Nmap, Shodan |
| Directory Bruteforce | Gobuster, ffuf, dirsearch |
| Web Scanning | Nuclei, Nikto, WPScan |
| Exploitation | SQLmap, XSSHunter, BeEF |
| Automation | Custom scripts, workflow tools |

### Burp Suite Configuration

```
Recommended Burp Suite Setup:

1. Scope Configuration
   - Define target scope
   - Enable advanced scope control

2. Scanner Settings
   - Configure scan speed
   - Set issue handling preferences

3. Extensions
   - Install Active Scan++
   - Add Autorize for IDOR testing
   - Enable Logger++ for logging
   - Use Param Miner for discovery

4. Macros
   - Set up session handling
   - Configure auto-login
```

### Browser Extensions

```
Essential Browser Extensions:
- Wappalyzer (technology detection)
- Cookie Editor (cookie manipulation)
- FoxyProxy (proxy switching)
- HackTools (payload generation)
- User-Agent Switcher (device emulation)
```

## Interview Key Points

### Common Interview Questions

**Q1: What is a bug bounty program?**

A bug bounty program is a crowdsourced security initiative where organizations invite ethical hackers to find and report vulnerabilities in exchange for rewards. It provides continuous security assessment from diverse researchers while giving them legal authorization and financial incentives to discover security flaws.

**Q2: What is the difference between a bug bounty and penetration testing?**

Bug bounties are ongoing, crowdsourced programs with many researchers testing simultaneously over extended periods, paying per valid finding. Penetration testing involves dedicated testers for a defined scope and timeframe, with fixed costs regardless of findings. Bug bounties offer broader coverage while penetration tests provide deeper, more structured analysis.

**Q3: How do you write a good vulnerability report?**

A good report includes: a clear title describing the vulnerability and impact, a summary of the security issue, severity rating with justification, detailed reproduction steps, proof of concept (screenshots/video), impact assessment explaining real-world consequences, and remediation recommendations. Clarity, completeness, and professionalism are key factors.

**Q4: What is the difference between in-scope and out-of-scope?**

In-scope defines systems, applications, and vulnerability types that researchers are authorized to test and can receive rewards for. Out-of-scope explicitly excludes certain assets, attack types, or issues from the program. Testing out-of-scope targets may violate program rules and could have legal consequences.

**Q5: How do you prioritize which programs to participate in?**

Consider: response time and triager quality, reward amounts relative to effort, scope breadth and attack surface, competition level, program maturity and rules clarity, your skill alignment with the target technology, and historical payout consistency. New programs often offer less competition.

**Q6: What are common vulnerability types found in bug bounties?**

Common findings include: XSS (reflected and stored), SQL injection, SSRF, IDOR/authorization bypass, authentication flaws, CSRF, information disclosure, business logic vulnerabilities, and misconfiguration issues. Severity ranges from informational to critical depending on impact.

**Q7: What is responsible disclosure?**

Responsible disclosure means reporting vulnerabilities through proper channels, giving the organization time to fix issues before public disclosure, maintaining confidentiality during the remediation period, and coordinating any eventual public disclosure with the affected party. It balances security research with protecting users.

**Q8: How do you avoid duplicate reports?**

Search existing disclosed reports for similar issues, test less common functionality rather than obvious entry points, focus on newer features or recently deployed code, develop unique testing methodologies, and consider time zones for submission timing. Building reputation for private programs also reduces duplicate competition.

### Core Knowledge Summary

```
+------------------------------------------------------------+
|              Bug Bounty Core Concepts                        |
+------------------------------------------------------------+
| Platform Types                                               |
| - HackerOne: Largest platform, reputation-based             |
| - Bugcrowd: VRT taxonomy, crowdsourced pentests             |
| - Synack: Red team as a service, vetted researchers         |
+------------------------------------------------------------+
| Program Types                                                |
| - Public: Open to all, higher competition                   |
| - Private: Invitation-only, better rewards                  |
| - VDP: No monetary reward, recognition-based                |
+------------------------------------------------------------+
| Testing Methodology                                          |
| 1. Reconnaissance: Subdomain enum, tech detection           |
| 2. Mapping: Functionality, entry points, roles              |
| 3. Discovery: Input validation, auth, business logic        |
| 4. Exploitation: PoC development, impact demo               |
| 5. Reporting: Clear documentation, reproduction steps       |
+------------------------------------------------------------+
| Report Quality                                               |
| - Clear title and summary                                   |
| - Detailed reproduction steps                               |
| - Proof of concept evidence                                 |
| - Impact assessment                                         |
| - Remediation recommendations                               |
+------------------------------------------------------------+
| Success Factors                                              |
| - Continuous learning and skill development                 |
| - Quality reports over quantity                             |
| - Professional communication                                |
| - Ethical and legal compliance                              |
| - Proper tool configuration and automation                  |
+------------------------------------------------------------+
```

## Further Reading

### Official Resources

- [HackerOne Documentation](https://docs.hackerone.com/)
- [Bugcrowd University](https://www.bugcrowd.com/hackers/bugcrowd-university/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)

### Books

- "The Web Application Hacker's Handbook" - Dafydd Stuttard
- "Bug Bounty Bootcamp" - Vickie Li
- "Real-World Bug Hunting" - Peter Yaworski
- "Hacking APIs" - Corey Ball

### Community Resources

- [HackerOne Hacktivity](https://hackerone.com/hacktivity)
- [Bugcrowd Bug Bash](https://www.bugcrowd.com/bug-bash/)
- [Reddit r/bugbounty](https://www.reddit.com/r/bugbounty/)
- [Bug Bounty Forum](https://bugbountyforum.com/)

### Video Channels

- [InsiderPhD](https://www.youtube.com/c/InsiderPhD)
- [STOK](https://www.youtube.com/c/STOKfredrik)
- [NahamSec](https://www.youtube.com/c/Nahamsec)
- [LiveOverflow](https://www.youtube.com/c/LiveOverflow)
