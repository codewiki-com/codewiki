---
title: GDPR Data Protection
description: Understand GDPR requirements and developer practices
track: security
section: infra-security
difficulty: intermediate
tags:
  - GDPR
  - data protection
  - privacy
  - compliance
status: imported
origin: old/src/content/docs/security/gdpr.en.md
divergence: 0.31
issues: []
legacy:
  category: Security
  subcategory: Compliance
  order: 16
  lastUpdated: 2026-01-07
---

The General Data Protection Regulation (GDPR) is the European Union's comprehensive data protection law that came into effect on May 25, 2018. It represents the most significant change in data privacy regulation in decades and has become a global standard for data protection practices. For developers, understanding GDPR is not just about legal compliance but about building trust with users through privacy-respecting applications.

## Understanding GDPR

### What is GDPR

GDPR is a regulation that governs how personal data of individuals within the European Union (EU) and European Economic Area (EEA) must be collected, processed, stored, and protected. It applies to any organization worldwide that processes personal data of EU residents, regardless of where the organization is located.

### Key Terminology

| Term | Definition |
|------|------------|
| Personal Data | Any information relating to an identified or identifiable natural person |
| Data Subject | The individual whose personal data is being processed |
| Data Controller | The entity that determines the purposes and means of processing personal data |
| Data Processor | The entity that processes personal data on behalf of the controller |
| Processing | Any operation performed on personal data (collection, storage, use, deletion) |
| Consent | Freely given, specific, informed, and unambiguous indication of agreement |
| DPO | Data Protection Officer - responsible for overseeing data protection strategy |

### Scope and Applicability

GDPR applies when:

1. **Establishment in EU**: Organization has an establishment in the EU (regardless of where processing occurs)
2. **Offering Goods/Services**: Organization offers goods or services to EU residents (even if free)
3. **Monitoring Behavior**: Organization monitors the behavior of EU residents

```
+----------------------------------------------------------+
|                  GDPR Applicability                       |
+----------------------------------------------------------+
| Your organization is in the EU          -> GDPR applies  |
| You have EU customers                   -> GDPR applies  |
| You track EU website visitors           -> GDPR applies  |
| You process EU employee data            -> GDPR applies  |
| No connection to EU whatsoever          -> GDPR may not  |
|                                            apply         |
+----------------------------------------------------------+
```

## GDPR Principles

GDPR establishes seven fundamental principles that must guide all personal data processing activities. These principles form the foundation of privacy by design.

### Lawfulness, Fairness, and Transparency

Personal data must be processed lawfully, fairly, and in a transparent manner.

**Developer Implications**:
- Clearly communicate data collection practices
- Provide accessible privacy policies
- Use plain language to explain data usage

```javascript
// Example: Transparent data collection notification
const dataCollectionNotice = {
  purpose: "Account creation and service delivery",
  dataCollected: ["email", "name", "preferences"],
  retention: "Until account deletion or 3 years of inactivity",
  rights: ["access", "rectification", "erasure", "portability"],
  contact: "privacy@example.com"
};

function displayDataNotice(notice) {
  return `
    We collect your ${notice.dataCollected.join(", ")} for ${notice.purpose}.
    Data is retained: ${notice.retention}.
    You have the right to: ${notice.rights.join(", ")}.
    Contact: ${notice.contact}
  `;
}
```

### Purpose Limitation

Data must be collected for specified, explicit, and legitimate purposes and not further processed in a manner incompatible with those purposes.

**Developer Implications**:
- Document the purpose for each data field collected
- Implement purpose tracking in your data model
- Prevent unauthorized use of data for new purposes

```javascript
// Example: Purpose-bound data storage
const userDataSchema = {
  email: {
    value: null,
    purposes: ["authentication", "communication"],
    collectedAt: null,
    consentId: null
  },
  location: {
    value: null,
    purposes: ["delivery", "local_recommendations"],
    collectedAt: null,
    consentId: null
  }
};

function canUseDataForPurpose(field, requestedPurpose) {
  const fieldData = userDataSchema[field];
  if (!fieldData || !fieldData.purposes.includes(requestedPurpose)) {
    throw new Error(`Data field '${field}' cannot be used for '${requestedPurpose}'`);
  }
  return true;
}
```

### Data Minimization

Only collect data that is adequate, relevant, and limited to what is necessary for the purposes.

**Developer Implications**:
- Review forms and APIs to eliminate unnecessary fields
- Avoid collecting "nice to have" data
- Implement field-level necessity documentation

```javascript
// BAD: Collecting unnecessary data
const registrationFormBad = {
  requiredFields: [
    "fullName",
    "email",
    "password",
    "dateOfBirth",      // Not needed for basic registration
    "phoneNumber",      // Not needed for basic registration
    "homeAddress",      // Not needed for basic registration
    "occupation",       // Not needed for basic registration
    "maritalStatus"     // Definitely not needed
  ]
};

// GOOD: Minimal data collection
const registrationFormGood = {
  requiredFields: [
    "email",
    "password"
  ],
  optionalFields: [
    {
      field: "fullName",
      purpose: "personalized communication",
      requiredForFeature: "personalization"
    }
  ]
};
```

### Accuracy

Personal data must be accurate and kept up to date. Inaccurate data should be erased or rectified without delay.

**Developer Implications**:
- Provide self-service profile update mechanisms
- Implement data validation at input
- Create processes for data correction requests

```javascript
// Example: User data update with audit trail
class UserDataManager {
  async updateUserData(userId, field, newValue, source) {
    const user = await this.getUser(userId);
    const oldValue = user[field];

    // Validate the new value
    if (!this.validateField(field, newValue)) {
      throw new Error(`Invalid value for ${field}`);
    }

    // Update with audit trail
    await this.db.transaction(async (trx) => {
      // Update the field
      await trx('users')
        .where({ id: userId })
        .update({ [field]: newValue, updatedAt: new Date() });

      // Log the change for audit
      await trx('data_change_log').insert({
        userId,
        field,
        oldValue: JSON.stringify(oldValue),
        newValue: JSON.stringify(newValue),
        source, // 'user_request', 'admin_correction', 'automated_sync'
        timestamp: new Date()
      });
    });

    return { success: true, field, oldValue, newValue };
  }
}
```

### Storage Limitation

Personal data must not be kept longer than necessary for the purposes for which it is processed.

**Developer Implications**:
- Define retention periods for each data category
- Implement automated data deletion/anonymization
- Document retention policies

```javascript
// Example: Data retention policy implementation
const retentionPolicies = {
  activeUserData: {
    retention: null, // Keep while account active
    triggerEvent: 'account_deletion'
  },
  inactiveUserData: {
    retention: '3 years',
    triggerEvent: 'last_activity'
  },
  transactionRecords: {
    retention: '7 years',
    triggerEvent: 'transaction_date',
    reason: 'Legal requirement for financial records'
  },
  analyticsData: {
    retention: '26 months',
    triggerEvent: 'collection_date',
    action: 'anonymize' // Anonymize instead of delete
  },
  supportTickets: {
    retention: '2 years',
    triggerEvent: 'ticket_closed'
  }
};

async function enforceRetention() {
  for (const [dataType, policy] of Object.entries(retentionPolicies)) {
    if (!policy.retention) continue;

    const cutoffDate = calculateCutoffDate(policy.retention);

    if (policy.action === 'anonymize') {
      await anonymizeOldRecords(dataType, policy.triggerEvent, cutoffDate);
    } else {
      await deleteOldRecords(dataType, policy.triggerEvent, cutoffDate);
    }

    console.log(`Retention enforced for ${dataType}: records before ${cutoffDate}`);
  }
}
```

### Integrity and Confidentiality

Personal data must be processed in a manner that ensures appropriate security, including protection against unauthorized access, loss, or damage.

**Developer Implications**:
- Implement encryption at rest and in transit
- Use access controls and authentication
- Maintain security audit logs

```javascript
// Example: Secure data handling
const crypto = require('crypto');

class SecureDataHandler {
  constructor(encryptionKey) {
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(encryptionKey, 'hex');
  }

  // Encrypt sensitive personal data before storage
  encryptPII(data) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      iv: iv.toString('hex'),
      data: encrypted,
      tag: cipher.getAuthTag().toString('hex')
    };
  }

  // Decrypt personal data for authorized access
  decryptPII(encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  // Log access to personal data
  async logAccess(userId, dataType, accessor, purpose) {
    await this.auditLog.insert({
      timestamp: new Date(),
      userId,
      dataType,
      accessorId: accessor.id,
      accessorRole: accessor.role,
      purpose,
      ipAddress: accessor.ip
    });
  }
}
```

### Accountability

The data controller must be able to demonstrate compliance with all GDPR principles.

**Developer Implications**:
- Maintain comprehensive documentation
- Implement audit trails
- Conduct regular compliance reviews

```javascript
// Example: Accountability documentation
const gdprDocumentation = {
  processingActivities: {
    // Record of processing activities (Article 30)
    userRegistration: {
      purpose: "Create user accounts for service access",
      legalBasis: "Contract performance",
      dataCategories: ["identity", "contact"],
      recipients: ["internal_systems", "email_provider"],
      retention: "Until account deletion",
      securityMeasures: ["encryption", "access_control", "audit_logging"]
    }
  },

  dpiaSummaries: {
    // Data Protection Impact Assessments
    newFeatureAnalytics: {
      date: "2024-01-15",
      assessor: "DPO",
      risk: "medium",
      mitigations: ["pseudonymization", "data minimization"],
      outcome: "approved_with_conditions"
    }
  },

  consentRecords: {
    // Consent management records
    template: {
      userId: null,
      consentType: null,
      version: null,
      timestamp: null,
      method: null, // 'checkbox', 'explicit_action'
      withdrawnAt: null
    }
  }
};
```

## Data Subject Rights

GDPR grants individuals specific rights over their personal data. Developers must implement mechanisms to facilitate these rights.

### Right to Access (Article 15)

Data subjects have the right to obtain confirmation of whether their data is being processed and access to that data.

```javascript
// Example: Data access request handler
class SubjectAccessRequest {
  async handleAccessRequest(userId, requestId) {
    // Verify identity before providing data
    const verified = await this.verifyIdentity(userId, requestId);
    if (!verified) {
      throw new Error('Identity verification required');
    }

    // Collect all personal data
    const userData = await this.collectUserData(userId);

    return {
      requestId,
      processedAt: new Date(),
      data: {
        // Account information
        profile: userData.profile,

        // Activity data
        loginHistory: userData.logins.map(l => ({
          date: l.date,
          location: l.country,
          device: l.deviceType
        })),

        // Consent records
        consents: userData.consents,

        // Third-party sharing
        dataSharing: userData.thirdPartySharing,

        // Processing purposes
        processingPurposes: this.getProcessingPurposes(),

        // Retention periods
        retentionInfo: this.getRetentionInfo()
      },
      format: 'JSON', // Machine-readable format
      additionalFormats: ['PDF', 'CSV']
    };
  }

  async collectUserData(userId) {
    // Aggregate data from all systems
    const [profile, activity, consents, sharing] = await Promise.all([
      this.db.users.findById(userId),
      this.db.userActivity.findByUserId(userId),
      this.db.consents.findByUserId(userId),
      this.db.dataSharing.findByUserId(userId)
    ]);

    return { profile, logins: activity, consents, thirdPartySharing: sharing };
  }
}
```

### Right to Rectification (Article 16)

Data subjects have the right to have inaccurate personal data corrected.

```javascript
// Example: Data rectification handler
async function handleRectificationRequest(userId, corrections) {
  const results = [];

  for (const correction of corrections) {
    const { field, currentValue, correctedValue, evidence } = correction;

    // Validate the correction request
    const currentData = await db.users.findById(userId);

    if (currentData[field] !== currentValue) {
      results.push({
        field,
        status: 'failed',
        reason: 'Current value does not match records'
      });
      continue;
    }

    // Apply correction with audit trail
    await db.transaction(async (trx) => {
      await trx('users').where({ id: userId }).update({
        [field]: correctedValue,
        updatedAt: new Date()
      });

      await trx('rectification_log').insert({
        userId,
        field,
        oldValue: currentValue,
        newValue: correctedValue,
        evidence: evidence,
        processedAt: new Date()
      });
    });

    // Notify third parties who received the incorrect data
    await notifyDataRecipients(userId, field, correctedValue);

    results.push({
      field,
      status: 'corrected',
      newValue: correctedValue
    });
  }

  return results;
}
```

### Right to Erasure (Article 17)

Also known as the "right to be forgotten," data subjects can request deletion of their personal data under certain circumstances.

```javascript
// Example: Data erasure implementation
class DataErasureService {
  async processErasureRequest(userId, requestId) {
    // Check for legal grounds to refuse
    const exemptions = await this.checkExemptions(userId);
    if (exemptions.length > 0) {
      return {
        status: 'partially_completed',
        exemptions: exemptions,
        deletedData: [],
        retainedData: exemptions.map(e => e.dataType)
      };
    }

    const deletionTasks = [
      this.deleteUserProfile(userId),
      this.deleteUserActivity(userId),
      this.deleteUserContent(userId),
      this.deleteFromBackups(userId),
      this.deleteFromAnalytics(userId),
      this.notifyThirdParties(userId)
    ];

    const results = await Promise.allSettled(deletionTasks);

    // Log the erasure for accountability
    await this.logErasure(requestId, userId, results);

    return {
      status: 'completed',
      requestId,
      completedAt: new Date(),
      deletedCategories: [
        'profile', 'activity', 'content',
        'backups', 'analytics'
      ]
    };
  }

  async checkExemptions(userId) {
    const exemptions = [];

    // Check for legal holds
    const legalHolds = await this.db.legalHolds.findByUserId(userId);
    if (legalHolds.length > 0) {
      exemptions.push({
        dataType: 'legal_hold_data',
        reason: 'Legal proceedings',
        retentionUntil: legalHolds[0].expiresAt
      });
    }

    // Check for regulatory requirements
    const financialRecords = await this.db.transactions.findByUserId(userId);
    if (financialRecords.length > 0) {
      const oldestTransaction = financialRecords[0].date;
      const retentionEnd = addYears(oldestTransaction, 7);

      if (retentionEnd > new Date()) {
        exemptions.push({
          dataType: 'financial_records',
          reason: 'Legal obligation - financial record retention',
          retentionUntil: retentionEnd
        });
      }
    }

    return exemptions;
  }

  async deleteFromBackups(userId) {
    // Mark for deletion in next backup rotation
    await this.db.backupDeletionQueue.insert({
      userId,
      requestedAt: new Date(),
      status: 'pending'
    });

    // Note: Full backup deletion may take up to 30 days
    return { status: 'queued', estimatedCompletion: '30 days' };
  }
}
```

### Right to Data Portability (Article 20)

Data subjects have the right to receive their data in a structured, commonly used, and machine-readable format.

```javascript
// Example: Data portability implementation
class DataPortabilityService {
  async generatePortableData(userId, format = 'json') {
    const userData = await this.collectPortableData(userId);

    const portableData = {
      exportedAt: new Date().toISOString(),
      format: format,
      version: '1.0',
      controller: {
        name: 'Example Company',
        contact: 'privacy@example.com'
      },
      data: {
        profile: this.formatProfile(userData.profile),
        content: this.formatContent(userData.content),
        preferences: userData.preferences,
        connections: userData.connections
      }
    };

    switch (format) {
      case 'json':
        return {
          contentType: 'application/json',
          data: JSON.stringify(portableData, null, 2),
          filename: `data_export_${userId}_${Date.now()}.json`
        };
      case 'csv':
        return this.convertToCSV(portableData);
      case 'xml':
        return this.convertToXML(portableData);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  formatProfile(profile) {
    // Return only data provided by the user (not inferred data)
    return {
      name: profile.name,
      email: profile.email,
      dateOfBirth: profile.dateOfBirth,
      address: profile.address,
      phoneNumber: profile.phoneNumber,
      createdAt: profile.createdAt
    };
  }

  formatContent(content) {
    // User-generated content that can be transferred
    return content.map(item => ({
      type: item.type,
      content: item.content,
      createdAt: item.createdAt,
      metadata: item.metadata
    }));
  }
}
```

### Right to Object (Article 21)

Data subjects can object to processing based on legitimate interests or for direct marketing purposes.

```javascript
// Example: Processing objection handler
class ObjectionHandler {
  async handleObjection(userId, objectionDetails) {
    const { processingType, reason } = objectionDetails;

    switch (processingType) {
      case 'direct_marketing':
        // Must stop processing immediately
        await this.stopMarketingProcessing(userId);
        return { status: 'stopped', immediate: true };

      case 'profiling':
        // Stop automated decision-making
        await this.disableAutomatedDecisions(userId);
        return { status: 'stopped', immediate: true };

      case 'legitimate_interest':
        // Assess if compelling grounds exist
        const assessment = await this.assessCompellingGrounds(
          userId,
          processingType,
          reason
        );

        if (assessment.compellingGrounds) {
          return {
            status: 'continued',
            reason: assessment.justification,
            appealProcess: this.getAppealProcess()
          };
        } else {
          await this.stopProcessing(userId, processingType);
          return { status: 'stopped' };
        }

      default:
        throw new Error(`Unknown processing type: ${processingType}`);
    }
  }

  async stopMarketingProcessing(userId) {
    // Update marketing preferences
    await this.db.users.update(userId, {
      marketingOptOut: true,
      marketingOptOutDate: new Date()
    });

    // Remove from marketing lists
    await this.marketingService.unsubscribeAll(userId);

    // Stop any scheduled marketing
    await this.scheduledTasks.cancelMarketing(userId);
  }
}
```

### Right to Restriction of Processing (Article 18)

Data subjects can request that processing be restricted under certain conditions.

```javascript
// Example: Processing restriction implementation
async function restrictProcessing(userId, restrictionRequest) {
  const { reason, scope } = restrictionRequest;

  // Valid reasons for restriction
  const validReasons = [
    'accuracy_contested',    // User disputes accuracy
    'unlawful_processing',   // Processing is unlawful but user prefers restriction over deletion
    'no_longer_needed',      // Controller no longer needs data but user needs it for legal claims
    'objection_pending'      // Pending verification of objection
  ];

  if (!validReasons.includes(reason)) {
    throw new Error('Invalid restriction reason');
  }

  // Apply restriction
  await db.processingRestrictions.insert({
    userId,
    reason,
    scope: scope || 'all',
    startedAt: new Date(),
    status: 'active'
  });

  // Update processing systems
  await notifyProcessingSystems(userId, 'restrict', scope);

  // Mark data as restricted (storage only, no active processing)
  await db.users.update(userId, {
    processingRestricted: true,
    restrictionReason: reason
  });

  return {
    status: 'restricted',
    allowedOperations: ['storage', 'legal_claims', 'protection_of_rights'],
    restrictedOperations: ['analysis', 'sharing', 'marketing', 'profiling']
  };
}
```

## Legal Basis for Processing

GDPR requires a valid legal basis for processing personal data. There are six legal bases available.

### Overview of Legal Bases

| Legal Basis | Description | Typical Use Cases |
|-------------|-------------|-------------------|
| Consent | Data subject has given clear consent | Marketing emails, cookies, newsletter |
| Contract | Processing necessary for contract performance | Order fulfillment, account management |
| Legal Obligation | Required by law | Tax records, employment law compliance |
| Vital Interests | Protecting someone's life | Emergency medical situations |
| Public Task | Official authority or public interest | Government services |
| Legitimate Interests | Controller's legitimate business interests | Fraud prevention, network security |

### Implementing Legal Basis Tracking

```javascript
// Example: Legal basis management system
const legalBasisRegistry = {
  processingActivities: {
    userAuthentication: {
      legalBasis: 'contract',
      description: 'Processing login credentials to provide account access',
      dataCategories: ['credentials', 'session_data'],
      necessity: 'Essential for service delivery'
    },

    marketingEmails: {
      legalBasis: 'consent',
      description: 'Sending promotional content via email',
      dataCategories: ['email', 'preferences'],
      consentRequired: true,
      consentVersion: '2.0'
    },

    fraudPrevention: {
      legalBasis: 'legitimate_interest',
      description: 'Analyzing transaction patterns to detect fraud',
      dataCategories: ['transaction_data', 'device_info'],
      liaRequired: true, // Legitimate Interest Assessment
      liaDocumentId: 'LIA-2024-001'
    },

    taxReporting: {
      legalBasis: 'legal_obligation',
      description: 'Reporting transaction data to tax authorities',
      dataCategories: ['financial_records'],
      legalReference: 'Tax Reporting Act Section 12'
    }
  }
};

class LegalBasisValidator {
  validateProcessing(activityName, userId) {
    const activity = legalBasisRegistry.processingActivities[activityName];

    if (!activity) {
      throw new Error(`Unknown processing activity: ${activityName}`);
    }

    switch (activity.legalBasis) {
      case 'consent':
        return this.validateConsent(userId, activityName, activity.consentVersion);
      case 'contract':
        return this.validateContract(userId);
      case 'legitimate_interest':
        return this.validateLegitimateInterest(activity.liaDocumentId);
      case 'legal_obligation':
        return { valid: true, basis: 'legal_obligation' };
      default:
        throw new Error(`Unhandled legal basis: ${activity.legalBasis}`);
    }
  }

  async validateConsent(userId, purpose, requiredVersion) {
    const consent = await this.db.consents.findOne({
      userId,
      purpose,
      status: 'active'
    });

    if (!consent) {
      return { valid: false, reason: 'No consent record found' };
    }

    if (consent.version < requiredVersion) {
      return { valid: false, reason: 'Consent version outdated' };
    }

    return { valid: true, basis: 'consent', consentId: consent.id };
  }
}
```

## Consent Management

Consent under GDPR must be freely given, specific, informed, and unambiguous. It must be as easy to withdraw as to give.

### Consent Requirements

Valid consent requires:
- **Freely given**: No pressure or negative consequences for refusing
- **Specific**: Separate consent for each distinct purpose
- **Informed**: Clear explanation of what is being consented to
- **Unambiguous**: Clear affirmative action (no pre-ticked boxes)
- **Withdrawable**: Easy mechanism to withdraw consent

### Implementing Consent Collection

```javascript
// Example: GDPR-compliant consent collection
class ConsentManager {
  constructor() {
    this.consentTypes = {
      marketing_email: {
        title: 'Marketing Communications',
        description: 'Receive promotional emails about our products and services',
        purposes: ['marketing'],
        thirdParties: ['email_provider'],
        required: false
      },
      analytics: {
        title: 'Analytics Cookies',
        description: 'Help us understand how you use our website to improve it',
        purposes: ['analytics', 'improvement'],
        thirdParties: ['analytics_provider'],
        required: false
      },
      personalization: {
        title: 'Personalization',
        description: 'Customize your experience based on your preferences and behavior',
        purposes: ['personalization'],
        thirdParties: [],
        required: false
      }
    };
  }

  async collectConsent(userId, consentType, action) {
    if (!this.consentTypes[consentType]) {
      throw new Error(`Unknown consent type: ${consentType}`);
    }

    if (action !== 'grant' && action !== 'deny') {
      throw new Error('Consent action must be "grant" or "deny"');
    }

    const consentRecord = {
      id: generateUUID(),
      userId,
      consentType,
      action,
      version: this.getCurrentConsentVersion(consentType),
      timestamp: new Date(),
      source: 'user_interface',
      ipAddress: null, // Store separately for security
      userAgent: null  // Store separately for security
    };

    await this.db.consents.insert(consentRecord);

    // Update processing systems
    if (action === 'grant') {
      await this.enableProcessing(userId, consentType);
    } else {
      await this.disableProcessing(userId, consentType);
    }

    return consentRecord;
  }

  async withdrawConsent(userId, consentType) {
    // Find active consent
    const activeConsent = await this.db.consents.findOne({
      userId,
      consentType,
      action: 'grant',
      withdrawnAt: null
    });

    if (!activeConsent) {
      throw new Error('No active consent found to withdraw');
    }

    // Record withdrawal
    await this.db.consents.update(activeConsent.id, {
      withdrawnAt: new Date()
    });

    // Create withdrawal record
    await this.db.consents.insert({
      id: generateUUID(),
      userId,
      consentType,
      action: 'withdraw',
      previousConsentId: activeConsent.id,
      timestamp: new Date()
    });

    // Stop processing immediately
    await this.disableProcessing(userId, consentType);

    return { success: true, withdrawnAt: new Date() };
  }

  async getConsentStatus(userId) {
    const consents = await this.db.consents.findByUserId(userId);

    return Object.keys(this.consentTypes).map(type => {
      const latestConsent = consents
        .filter(c => c.consentType === type)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      return {
        type,
        ...this.consentTypes[type],
        status: latestConsent?.action === 'grant' && !latestConsent?.withdrawnAt
          ? 'granted'
          : 'not_granted',
        grantedAt: latestConsent?.action === 'grant' ? latestConsent.timestamp : null
      };
    });
  }
}
```

### Cookie Consent Implementation

```javascript
// Example: Cookie consent banner
class CookieConsentBanner {
  constructor() {
    this.cookieCategories = {
      necessary: {
        name: 'Necessary Cookies',
        description: 'Required for the website to function. Cannot be disabled.',
        required: true,
        cookies: ['session_id', 'csrf_token', 'consent_preferences']
      },
      functional: {
        name: 'Functional Cookies',
        description: 'Enable enhanced functionality and personalization.',
        required: false,
        cookies: ['language_preference', 'theme']
      },
      analytics: {
        name: 'Analytics Cookies',
        description: 'Help us understand how visitors interact with our website.',
        required: false,
        cookies: ['_ga', '_gid', '_gat']
      },
      marketing: {
        name: 'Marketing Cookies',
        description: 'Used to track visitors across websites for advertising.',
        required: false,
        cookies: ['_fbp', 'ads_prefs']
      }
    };
  }

  renderBanner() {
    return `
      <div id="cookie-consent-banner" role="dialog" aria-labelledby="cookie-title">
        <h2 id="cookie-title">Cookie Preferences</h2>
        <p>We use cookies to enhance your experience. You can customize your preferences below.</p>

        <div class="cookie-categories">
          ${Object.entries(this.cookieCategories).map(([key, category]) => `
            <div class="cookie-category">
              <label>
                <input
                  type="checkbox"
                  name="cookie_${key}"
                  ${category.required ? 'checked disabled' : ''}
                  data-category="${key}"
                >
                <strong>${category.name}</strong>
                ${category.required ? '<span class="required">(Required)</span>' : ''}
              </label>
              <p>${category.description}</p>
            </div>
          `).join('')}
        </div>

        <div class="consent-actions">
          <button onclick="acceptAllCookies()">Accept All</button>
          <button onclick="savePreferences()">Save Preferences</button>
          <button onclick="rejectNonEssential()">Reject Non-Essential</button>
        </div>

        <a href="/privacy-policy">Privacy Policy</a> |
        <a href="/cookie-policy">Cookie Policy</a>
      </div>
    `;
  }

  async saveConsent(preferences) {
    const consentRecord = {
      timestamp: new Date().toISOString(),
      preferences,
      version: '1.0'
    };

    // Store consent in cookie (not blocked)
    document.cookie = `cookie_consent=${JSON.stringify(consentRecord)}; max-age=31536000; path=/; SameSite=Strict`;

    // Send to server for record-keeping
    await fetch('/api/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consentRecord)
    });

    // Enable/disable cookies based on preferences
    this.applyCookiePreferences(preferences);
  }

  applyCookiePreferences(preferences) {
    // Load analytics only if consented
    if (preferences.analytics) {
      this.loadAnalytics();
    }

    // Load marketing pixels only if consented
    if (preferences.marketing) {
      this.loadMarketingPixels();
    }
  }
}
```

## Data Protection by Design

Data Protection by Design (also called Privacy by Design) requires incorporating data protection principles into the design of systems from the outset.

### Privacy by Design Principles

```
+----------------------------------------------------------+
|              Privacy by Design Principles                  |
+----------------------------------------------------------+
| 1. Proactive not Reactive           | Anticipate risks   |
| 2. Privacy as the Default           | Maximum protection |
| 3. Privacy Embedded into Design     | Not an add-on      |
| 4. Full Functionality               | No trade-offs      |
| 5. End-to-End Security              | Full lifecycle     |
| 6. Visibility and Transparency      | Keep it open       |
| 7. Respect for User Privacy         | User-centric       |
+----------------------------------------------------------+
```

### Implementing Privacy by Design

```javascript
// Example: Privacy-first architecture
class PrivacyByDesignService {
  // Principle: Data Minimization by Default
  createUserProfile(userData) {
    // Only accept necessary fields
    const allowedFields = ['email', 'passwordHash'];
    const profile = {};

    for (const field of allowedFields) {
      if (userData[field]) {
        profile[field] = userData[field];
      }
    }

    // Add metadata
    profile.createdAt = new Date();
    profile.privacyVersion = '2.0';

    return profile;
  }

  // Principle: Pseudonymization by Default
  async storeAnalyticsEvent(userId, event) {
    // Create pseudonymous identifier
    const pseudoId = await this.createPseudoId(userId);

    return {
      pseudoId, // Not directly linked to user
      event: event.type,
      timestamp: this.truncateTimestamp(event.timestamp), // Reduce precision
      metadata: this.minimizeMetadata(event.metadata)
    };
  }

  createPseudoId(userId) {
    // One-way hash with salt, rotated periodically
    const salt = this.getCurrentSalt(); // Rotated monthly
    return crypto
      .createHmac('sha256', salt)
      .update(userId)
      .digest('hex');
  }

  truncateTimestamp(timestamp) {
    // Reduce to hour precision for analytics
    const date = new Date(timestamp);
    date.setMinutes(0, 0, 0);
    return date;
  }

  minimizeMetadata(metadata) {
    // Only keep essential, non-identifying metadata
    const safeFields = ['category', 'action', 'label'];
    const minimized = {};

    for (const field of safeFields) {
      if (metadata[field]) {
        minimized[field] = metadata[field];
      }
    }

    return minimized;
  }

  // Principle: Access Control by Default
  async getUserData(requesterId, targetUserId, purpose) {
    // Check if requester has access
    const accessAllowed = await this.checkAccess(requesterId, targetUserId, purpose);

    if (!accessAllowed) {
      await this.logUnauthorizedAccess(requesterId, targetUserId, purpose);
      throw new Error('Access denied');
    }

    // Get only data necessary for the purpose
    const allowedFields = this.getFieldsForPurpose(purpose);
    const userData = await this.db.users.findById(targetUserId, allowedFields);

    // Log access for audit
    await this.logDataAccess(requesterId, targetUserId, purpose, allowedFields);

    return userData;
  }
}
```

### Data Protection Impact Assessment (DPIA)

A DPIA is required for high-risk processing activities.

```javascript
// Example: DPIA framework
const dpiaTemplate = {
  projectInfo: {
    name: '',
    description: '',
    owner: '',
    date: '',
    status: 'draft' // draft, in_review, approved, rejected
  },

  processingDescription: {
    nature: '', // What will you do with the data?
    scope: '', // What data, how much, how often?
    context: '', // Internal/external factors
    purposes: [] // Why are you processing?
  },

  necessity: {
    lawfulBasis: '',
    proportionality: '', // Is processing proportionate to purpose?
    alternatives: [], // Less intrusive alternatives considered
    dataMininimization: '' // How is data minimized?
  },

  risks: [
    {
      description: '',
      likelihood: '', // low, medium, high
      severity: '', // low, medium, high
      affectedParties: [], // data subjects, organization, third parties
      mitigations: [],
      residualRisk: ''
    }
  ],

  consultation: {
    dpoConsulted: false,
    dpoOpinion: '',
    dataSubjectsConsulted: false,
    dataSubjectsFeedback: '',
    supervisoryAuthorityConsulted: false
  },

  decision: {
    approved: false,
    conditions: [],
    reviewDate: '',
    approver: ''
  }
};

class DPIAManager {
  async assessRiskLevel(processingActivity) {
    let riskScore = 0;

    // High-risk indicators (Article 35)
    if (processingActivity.involvesAutomatedDecisions) riskScore += 3;
    if (processingActivity.processesSpecialCategories) riskScore += 3;
    if (processingActivity.isLargeScale) riskScore += 2;
    if (processingActivity.combinesDatasets) riskScore += 2;
    if (processingActivity.involvesVulnerableSubjects) riskScore += 3;
    if (processingActivity.usesNewTechnologies) riskScore += 2;
    if (processingActivity.preventsExercisingRights) riskScore += 3;
    if (processingActivity.involvesSystematicMonitoring) riskScore += 2;

    if (riskScore >= 6) return { required: true, level: 'high' };
    if (riskScore >= 4) return { required: true, level: 'medium' };
    return { required: false, level: 'low' };
  }
}
```

## Technical Implementation

### Building a GDPR-Compliant Data Layer

```javascript
// Example: GDPR-compliant data access layer
class GDPRDataLayer {
  constructor(db, auditLogger) {
    this.db = db;
    this.auditLogger = auditLogger;
  }

  // Wrapper for all data access with automatic logging
  async query(operation, table, conditions, fields, context) {
    const { userId, purpose, accessorId } = context;

    // Validate purpose
    await this.validatePurpose(table, fields, purpose);

    // Execute query
    const startTime = Date.now();
    const result = await this.db[operation](table, conditions, fields);
    const duration = Date.now() - startTime;

    // Audit log
    await this.auditLogger.log({
      timestamp: new Date(),
      operation,
      table,
      conditions: this.sanitizeConditions(conditions),
      fieldsAccessed: fields,
      rowsAffected: result.length || result.affectedRows,
      purpose,
      accessorId,
      targetUserId: userId,
      duration
    });

    return result;
  }

  // Automatic data masking for sensitive fields
  async queryWithMasking(table, conditions, context) {
    const result = await this.query('select', table, conditions, '*', context);

    const sensitiveFields = this.getSensitiveFields(table);

    return result.map(row => {
      const masked = { ...row };
      for (const field of sensitiveFields) {
        if (masked[field]) {
          masked[field] = this.maskValue(field, masked[field]);
        }
      }
      return masked;
    });
  }

  maskValue(fieldType, value) {
    const maskingRules = {
      email: (v) => v.replace(/(.{2}).*(@.*)/, '$1***$2'),
      phone: (v) => v.replace(/(\d{3})\d+(\d{2})/, '$1****$2'),
      creditCard: (v) => '*'.repeat(12) + v.slice(-4),
      ssn: (v) => '***-**-' + v.slice(-4),
      name: (v) => v[0] + '*'.repeat(v.length - 1)
    };

    return maskingRules[fieldType] ? maskingRules[fieldType](value) : '***';
  }

  // Automatic retention enforcement
  async enforceRetention() {
    const retentionRules = await this.db.select('retention_rules');

    for (const rule of retentionRules) {
      const cutoffDate = this.calculateCutoff(rule.retention_period);

      if (rule.action === 'delete') {
        await this.db.delete(rule.table_name, {
          [rule.date_column]: { $lt: cutoffDate }
        });
      } else if (rule.action === 'anonymize') {
        await this.anonymizeOldRecords(rule, cutoffDate);
      }
    }
  }

  async anonymizeOldRecords(rule, cutoffDate) {
    const fieldsToAnonymize = rule.fields_to_anonymize.split(',');

    const records = await this.db.select(rule.table_name, {
      [rule.date_column]: { $lt: cutoffDate },
      anonymized: false
    });

    for (const record of records) {
      const anonymized = {};
      for (const field of fieldsToAnonymize) {
        anonymized[field] = this.anonymizeField(field, record[field]);
      }
      anonymized.anonymized = true;
      anonymized.anonymizedAt = new Date();

      await this.db.update(rule.table_name, { id: record.id }, anonymized);
    }
  }

  anonymizeField(fieldName, value) {
    // Irreversible anonymization
    if (!value) return null;

    const anonymizationRules = {
      email: () => `anon_${crypto.randomBytes(8).toString('hex')}@anonymized.local`,
      name: () => 'ANONYMIZED',
      phone: () => null,
      address: () => null,
      ip_address: () => this.anonymizeIP(value),
      date_of_birth: (v) => new Date(v).getFullYear().toString() // Keep only year
    };

    return anonymizationRules[fieldName]
      ? anonymizationRules[fieldName](value)
      : 'ANONYMIZED';
  }

  anonymizeIP(ip) {
    // Zero out last octet for IPv4, last 80 bits for IPv6
    if (ip.includes('.')) {
      return ip.split('.').slice(0, 3).join('.') + '.0';
    }
    return ip.split(':').slice(0, 4).join(':') + ':0:0:0:0';
  }
}
```

### API Security for Personal Data

```javascript
// Example: GDPR-compliant API endpoints
const express = require('express');
const router = express.Router();

// Middleware: Validate legal basis before processing
const validateLegalBasis = (requiredBasis) => async (req, res, next) => {
  const userId = req.params.userId || req.user.id;

  const validator = new LegalBasisValidator();
  const result = await validator.validateProcessing(req.route.path, userId);

  if (!result.valid) {
    return res.status(403).json({
      error: 'Processing not permitted',
      reason: result.reason,
      remedy: result.remedy
    });
  }

  req.legalBasis = result;
  next();
};

// Middleware: Rate limiting for data subject requests
const dsrRateLimiter = rateLimit({
  windowMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  max: 5, // 5 requests per 30 days per user
  message: 'Too many data subject requests. GDPR allows reasonable limits.',
  keyGenerator: (req) => req.user.id
});

// Data Subject Access Request
router.get('/user/:userId/data',
  authenticate,
  authorizeOwnerOrAdmin,
  dsrRateLimiter,
  async (req, res) => {
    try {
      const sarService = new SubjectAccessRequest();
      const data = await sarService.handleAccessRequest(
        req.params.userId,
        req.requestId
      );

      // Response must be provided within 30 days
      res.json({
        requestId: req.requestId,
        requestedAt: new Date(),
        responseDeadline: addDays(new Date(), 30),
        data
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Data Portability Request
router.get('/user/:userId/export',
  authenticate,
  authorizeOwner,
  dsrRateLimiter,
  async (req, res) => {
    const format = req.query.format || 'json';

    const portabilityService = new DataPortabilityService();
    const exportData = await portabilityService.generatePortableData(
      req.params.userId,
      format
    );

    res.setHeader('Content-Type', exportData.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.data);
  }
);

// Erasure Request
router.delete('/user/:userId',
  authenticate,
  authorizeOwner,
  dsrRateLimiter,
  async (req, res) => {
    const erasureService = new DataErasureService();

    // Identity verification for deletion
    const verified = await erasureService.verifyIdentity(
      req.params.userId,
      req.body.verificationCode
    );

    if (!verified) {
      return res.status(401).json({
        error: 'Identity verification required',
        verificationMethod: 'email_code'
      });
    }

    const result = await erasureService.processErasureRequest(
      req.params.userId,
      req.requestId
    );

    res.json(result);
  }
);

// Consent Management
router.post('/user/:userId/consent',
  authenticate,
  authorizeOwner,
  async (req, res) => {
    const { consentType, action } = req.body;

    const consentManager = new ConsentManager();
    const result = await consentManager.collectConsent(
      req.params.userId,
      consentType,
      action
    );

    res.json(result);
  }
);

router.delete('/user/:userId/consent/:consentType',
  authenticate,
  authorizeOwner,
  async (req, res) => {
    const consentManager = new ConsentManager();
    const result = await consentManager.withdrawConsent(
      req.params.userId,
      req.params.consentType
    );

    res.json(result);
  }
);
```

### Database Schema for GDPR Compliance

```sql
-- Example: GDPR-compliant database schema

-- User table with privacy fields
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    email_encrypted BYTEA, -- Encrypted version for sensitive operations
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Privacy metadata
    privacy_version VARCHAR(10) DEFAULT '1.0',
    processing_restricted BOOLEAN DEFAULT FALSE,
    restriction_reason TEXT,
    anonymized BOOLEAN DEFAULT FALSE,
    anonymized_at TIMESTAMP,

    -- Deletion tracking
    deletion_requested_at TIMESTAMP,
    deletion_scheduled_for TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Consent records
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    consent_type VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'grant', 'deny', 'withdraw'
    version VARCHAR(10) NOT NULL,
    granted_at TIMESTAMP,
    withdrawn_at TIMESTAMP,

    -- Proof of consent
    ip_address_hash VARCHAR(64), -- Hashed, not plain
    user_agent_hash VARCHAR(64),
    consent_text_version VARCHAR(10),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consent_user_type ON consent_records(user_id, consent_type);

-- Data access audit log
CREATE TABLE data_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accessor_id UUID,
    accessor_role VARCHAR(50),
    target_user_id UUID,
    operation VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    fields_accessed TEXT[],
    purpose VARCHAR(255),
    legal_basis VARCHAR(50),
    rows_affected INTEGER,
    query_duration_ms INTEGER
);

CREATE INDEX idx_access_log_user ON data_access_log(target_user_id);
CREATE INDEX idx_access_log_time ON data_access_log(timestamp);

-- Data subject requests
CREATE TABLE dsr_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    request_type VARCHAR(50) NOT NULL, -- 'access', 'rectification', 'erasure', 'portability', 'objection'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'rejected'

    request_details JSONB,
    response_details JSONB,

    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP, -- 30 days from request
    completed_at TIMESTAMP,

    processor_id UUID,
    notes TEXT
);

-- Retention policies
CREATE TABLE retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_category VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    retention_period INTERVAL NOT NULL,
    date_column VARCHAR(100) NOT NULL,
    action VARCHAR(50) DEFAULT 'delete', -- 'delete' or 'anonymize'
    fields_to_anonymize TEXT[],
    legal_basis TEXT,
    last_executed TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Processing activities register (Article 30)
CREATE TABLE processing_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_name VARCHAR(255) NOT NULL,
    description TEXT,
    purposes TEXT[],
    legal_basis VARCHAR(100),
    data_categories TEXT[],
    data_subjects TEXT[],
    recipients TEXT[],
    third_country_transfers BOOLEAN DEFAULT FALSE,
    transfer_safeguards TEXT,
    retention_period TEXT,
    security_measures TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewer_id UUID
);
```

## Breach Notification

GDPR requires notification of personal data breaches to supervisory authorities within 72 hours.

### Breach Response Process

```javascript
// Example: Data breach management
class BreachResponseManager {
  constructor() {
    this.severityLevels = {
      low: { notifyAuthority: false, notifySubjects: false },
      medium: { notifyAuthority: true, notifySubjects: false },
      high: { notifyAuthority: true, notifySubjects: true },
      critical: { notifyAuthority: true, notifySubjects: true }
    };
  }

  async reportBreach(breachDetails) {
    const {
      discoveredAt,
      description,
      affectedDataTypes,
      affectedSubjectsCount,
      isOngoing,
      containmentActions
    } = breachDetails;

    // Assess severity
    const severity = this.assessSeverity(breachDetails);
    const requirements = this.severityLevels[severity];

    const breachRecord = {
      id: generateUUID(),
      discoveredAt,
      reportedInternallyAt: new Date(),
      description,
      severity,
      affectedDataTypes,
      affectedSubjectsCount,
      isOngoing,
      containmentActions,
      status: 'investigating'
    };

    await this.db.breaches.insert(breachRecord);

    // Start 72-hour countdown for authority notification
    if (requirements.notifyAuthority) {
      const deadline = addHours(new Date(), 72);
      await this.scheduleAuthorityNotification(breachRecord.id, deadline);
    }

    return breachRecord;
  }

  assessSeverity(breach) {
    let score = 0;

    // Sensitivity of data
    const sensitiveTypes = ['health', 'financial', 'credentials', 'biometric'];
    const hasSensitiveData = breach.affectedDataTypes.some(
      type => sensitiveTypes.includes(type)
    );
    if (hasSensitiveData) score += 3;

    // Scale of breach
    if (breach.affectedSubjectsCount > 10000) score += 3;
    else if (breach.affectedSubjectsCount > 1000) score += 2;
    else if (breach.affectedSubjectsCount > 100) score += 1;

    // Data exposed or encrypted
    if (breach.dataExposed) score += 2;
    if (!breach.dataWasEncrypted) score += 2;

    // Ongoing breach
    if (breach.isOngoing) score += 2;

    if (score >= 8) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  async notifySupervisoryAuthority(breachId) {
    const breach = await this.db.breaches.findById(breachId);

    const notification = {
      // Required information for Article 33
      natureOfBreach: breach.description,
      categoriesOfData: breach.affectedDataTypes,
      approximateNumberOfSubjects: breach.affectedSubjectsCount,
      approximateNumberOfRecords: breach.affectedRecordsCount,
      nameAndContactOfDPO: this.getDPOContact(),
      likelyConsequences: this.assessConsequences(breach),
      measuresTaken: breach.containmentActions,
      measuresProposed: breach.remediationPlan
    };

    // Submit to supervisory authority
    const response = await this.submitToAuthority(notification);

    await this.db.breaches.update(breachId, {
      authorityNotifiedAt: new Date(),
      authorityReference: response.referenceNumber,
      status: 'authority_notified'
    });

    return response;
  }

  async notifyAffectedSubjects(breachId) {
    const breach = await this.db.breaches.findById(breachId);

    // Get affected users
    const affectedUsers = await this.getAffectedUsers(breach);

    const notification = {
      subject: 'Important: Security Incident Notification',
      body: this.generateSubjectNotification(breach)
    };

    // Send notifications
    for (const user of affectedUsers) {
      await this.sendNotification(user.email, notification);
    }

    await this.db.breaches.update(breachId, {
      subjectsNotifiedAt: new Date(),
      subjectsNotifiedCount: affectedUsers.length,
      status: 'subjects_notified'
    });
  }

  generateSubjectNotification(breach) {
    return `
Dear User,

We are writing to inform you of a security incident that may have affected your personal data.

What Happened:
${breach.description}

What Data Was Affected:
${breach.affectedDataTypes.join(', ')}

What We Are Doing:
${breach.containmentActions.join('\n')}

What You Can Do:
- Change your password immediately
- Monitor your accounts for suspicious activity
- Be cautious of phishing attempts

Contact Information:
If you have questions, please contact our Data Protection Officer at dpo@example.com

We sincerely apologize for any concern this may cause.
    `;
  }
}
```

## Penalties and Compliance

### GDPR Penalty Structure

| Violation Type | Maximum Fine |
|---------------|--------------|
| Lower tier violations | Up to 10 million EUR or 2% of annual global turnover |
| Higher tier violations | Up to 20 million EUR or 4% of annual global turnover |

Higher tier violations include:
- Processing without valid legal basis
- Violating data subject rights
- Transferring data to third countries without safeguards
- Non-compliance with supervisory authority orders

### Compliance Checklist

```javascript
// Example: GDPR compliance audit checklist
const gdprComplianceChecklist = {
  legalBasis: {
    items: [
      { id: 'lb1', text: 'Legal basis documented for each processing activity', status: null },
      { id: 'lb2', text: 'Consent mechanisms meet GDPR requirements', status: null },
      { id: 'lb3', text: 'Legitimate interest assessments conducted where applicable', status: null }
    ]
  },

  dataSubjectRights: {
    items: [
      { id: 'dsr1', text: 'Access request process implemented', status: null },
      { id: 'dsr2', text: 'Rectification process implemented', status: null },
      { id: 'dsr3', text: 'Erasure process implemented', status: null },
      { id: 'dsr4', text: 'Data portability export available', status: null },
      { id: 'dsr5', text: 'Objection handling process in place', status: null },
      { id: 'dsr6', text: 'Restriction of processing capability', status: null },
      { id: 'dsr7', text: 'Response time within 30 days', status: null }
    ]
  },

  transparency: {
    items: [
      { id: 't1', text: 'Privacy policy published and accessible', status: null },
      { id: 't2', text: 'Privacy policy written in plain language', status: null },
      { id: 't3', text: 'Data collection notices at point of collection', status: null },
      { id: 't4', text: 'Cookie consent banner implemented', status: null }
    ]
  },

  security: {
    items: [
      { id: 's1', text: 'Personal data encrypted at rest', status: null },
      { id: 's2', text: 'Personal data encrypted in transit', status: null },
      { id: 's3', text: 'Access controls implemented', status: null },
      { id: 's4', text: 'Audit logging in place', status: null },
      { id: 's5', text: 'Regular security assessments conducted', status: null },
      { id: 's6', text: 'Incident response plan documented', status: null }
    ]
  },

  dataManagement: {
    items: [
      { id: 'dm1', text: 'Data inventory/mapping completed', status: null },
      { id: 'dm2', text: 'Retention periods defined', status: null },
      { id: 'dm3', text: 'Automated retention enforcement', status: null },
      { id: 'dm4', text: 'Data minimization reviewed', status: null }
    ]
  },

  governance: {
    items: [
      { id: 'g1', text: 'DPO appointed (if required)', status: null },
      { id: 'g2', text: 'Record of processing activities maintained', status: null },
      { id: 'g3', text: 'DPIA process established', status: null },
      { id: 'g4', text: 'Staff training on GDPR completed', status: null },
      { id: 'g5', text: 'Third-party processor agreements in place', status: null },
      { id: 'g6', text: 'Breach notification process documented', status: null }
    ]
  }
};
```

## Interview Key Points

### Common Interview Questions

**Q1: What are the key principles of GDPR?**

The seven principles are: (1) Lawfulness, fairness, and transparency, (2) Purpose limitation, (3) Data minimization, (4) Accuracy, (5) Storage limitation, (6) Integrity and confidentiality, and (7) Accountability. These principles must guide all processing activities.

**Q2: What is the difference between a Data Controller and Data Processor?**

A Data Controller determines the purposes and means of processing (decides what data to collect and why). A Data Processor processes data on behalf of the controller (follows controller's instructions). A company can be both for different processing activities.

**Q3: When is consent required as a legal basis?**

Consent is one of six legal bases, typically used for marketing, analytics cookies, or optional features. It must be freely given, specific, informed, and unambiguous. Contract performance, legal obligation, or legitimate interests may be more appropriate for core service delivery.

**Q4: What are the data subject rights under GDPR?**

Eight rights: (1) Right to be informed, (2) Right of access, (3) Right to rectification, (4) Right to erasure, (5) Right to restrict processing, (6) Right to data portability, (7) Right to object, (8) Rights related to automated decision-making and profiling.

**Q5: What is Privacy by Design?**

Privacy by Design means incorporating data protection into system design from the start, not as an afterthought. Key aspects include data minimization by default, pseudonymization, access controls, and encryption. It's now a legal requirement under GDPR Article 25.

**Q6: When is a Data Protection Impact Assessment (DPIA) required?**

A DPIA is required when processing is likely to result in high risk to individuals. Examples include: systematic profiling, large-scale special category data processing, systematic monitoring of public areas, using new technologies, or automated decision-making with legal effects.

**Q7: How should personal data breaches be handled?**

Notify the supervisory authority within 72 hours if the breach poses a risk to individuals. Notify affected individuals without undue delay if there's a high risk. Document all breaches regardless of notification. Have incident response procedures in place.

**Q8: What is the lawful basis for processing employee data?**

Typically a combination of: (1) Contract performance for employment relationship, (2) Legal obligation for tax and employment law, (3) Legitimate interests for business operations. Consent is rarely appropriate due to power imbalance in employment relationships.

### Core Knowledge Summary

```
+----------------------------------------------------------+
|              GDPR Compliance Framework                     |
+----------------------------------------------------------+
| Legal Basis                                                |
| - Document basis for each processing activity             |
| - Consent, Contract, Legal Obligation, Vital Interests,   |
|   Public Task, Legitimate Interests                       |
+----------------------------------------------------------+
| Data Subject Rights                                        |
| - Access, Rectification, Erasure, Portability             |
| - Objection, Restriction, Automated Decisions             |
| - Respond within 30 days                                   |
+----------------------------------------------------------+
| Technical Measures                                         |
| - Encryption at rest and in transit                       |
| - Access controls and audit logging                       |
| - Data minimization and pseudonymization                  |
| - Retention automation                                     |
+----------------------------------------------------------+
| Organizational Measures                                    |
| - Privacy policy and notices                               |
| - DPO appointment (if required)                            |
| - Staff training                                           |
| - Processor agreements                                     |
+----------------------------------------------------------+
| Documentation                                              |
| - Records of processing activities                         |
| - DPIAs for high-risk processing                          |
| - Consent records                                          |
| - Breach register                                          |
+----------------------------------------------------------+
```

## Further Reading

### Official Resources

- [GDPR Full Text](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [EDPB Guidelines](https://edpb.europa.eu/our-work-tools/general-guidance/gdpr-guidelines-recommendations-best-practices_en)
- [ICO Guidance (UK)](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/)
- [CNIL Guidance (France)](https://www.cnil.fr/en/gdpr-developers-guide)

### Technical Resources

- [OWASP Privacy Guidelines](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/12-Testing_Browser_Storage)
- [NIST Privacy Framework](https://www.nist.gov/privacy-framework)
- [Privacy Patterns](https://privacypatterns.org/)

### Implementation Tools

- [OneTrust](https://www.onetrust.com/) - Privacy management platform
- [Cookiebot](https://www.cookiebot.com/) - Cookie consent management
- [DataGrail](https://www.datagrail.io/) - DSR automation
- [BigID](https://bigid.com/) - Data discovery and classification

### Books and Courses

- "GDPR: A Practical Guide" - IT Governance Publishing
- "Data Privacy and GDPR Handbook" - Sanjay Sharma
- "European Data Protection Law and Practice" - Eduardo Ustaran
- [IAPP CIPP/E Certification](https://iapp.org/certify/cippe/)
