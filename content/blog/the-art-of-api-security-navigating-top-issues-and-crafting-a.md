---
title: "API Security in Practice: Defending Against the OWASP Top 10 with Code"
slug: the-art-of-api-security-navigating-top-issues-and-crafting-a
description: A practical guide to securing APIs against OWASP Top 10
  vulnerabilities with working code examples for JWT validation, OAuth 2.0, rate
  limiting, and injection prevention.
date: 2024-04-30
updated: 2026-01-07
category: Application Security
tags:
  - API Security
  - OWASP
  - OAuth
  - JWT
  - REST API
  - Web Security
  - Authentication
  - Application Security
image: https://images.seanfraser.io/API_Main.jpg
featured: false
draft: false
---

## The API Attack Surface

APIs now carry more than 70% of internet traffic. They're how your mobile app talks to your backend, how your microservices communicate, and how third parties integrate with your platform. They're also the target of 91% of web application attacks, according to Akamai's 2024 State of the Internet report.

The numbers paint a concerning picture:

| Metric | Value | Source |
|--------|-------|--------|
| API-related breaches in 2024 | 27% of all data breaches | IBM Cost of a Data Breach 2024 |
| Average cost of API breach | $4.88M | IBM Cost of a Data Breach 2024 |
| API attacks increase YoY | 109% | Salt Security State of API Security 2024 |
| Organizations experiencing API incidents | 94% | Salt Security State of API Security 2024 |
| APIs with critical vulnerabilities | 1 in 4 | Traceable AI API Security Report |

The API security market has responded accordingly—valued at approximately $1.2 billion in 2024 and projected to reach $5.1 billion by 2030. But market growth doesn't protect your endpoints. Let's examine what actually does.

## OWASP API Security Top 10 (2023)

The OWASP API Security Top 10 provides a framework for understanding API-specific vulnerabilities. Unlike the general OWASP Top 10, these risks address the unique attack surface that APIs present.

### API1:2023 - Broken Object Level Authorization (BOLA)

BOLA occurs when an API exposes object references (like user IDs or document IDs) without verifying that the requesting user has permission to access them. It's the most common API vulnerability, appearing in roughly 40% of API security assessments.

**Vulnerable code:**

```javascript
// Vulnerable: No authorization check
app.get('/api/users/:userId/profile', async (req, res) => {
  const profile = await db.getUserProfile(req.params.userId);
  res.json(profile);
});
```

**Secure implementation:**

```javascript
// Secure: Verify the requesting user owns this resource
app.get('/api/users/:userId/profile', authMiddleware, async (req, res) => {
  // req.user.id comes from validated JWT
  if (req.params.userId !== req.user.id && !req.user.roles.includes('admin')) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const profile = await db.getUserProfile(req.params.userId);
  res.json(profile);
});
```

### API2:2023 - Broken Authentication

Authentication vulnerabilities expose APIs to credential stuffing, brute force attacks, and session hijacking. Weak token handling amplifies these risks.

**JWT validation done right (Node.js):**

```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// JWKS client for key rotation support
const client = jwksClient({
  jwksUri: 'https://your-auth-server/.well-known/jwks.json',
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

async function validateToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      algorithms: ['RS256'],
      issuer: 'https://your-auth-server',
      audience: 'your-api-identifier',
      clockTolerance: 30, // 30 seconds clock skew tolerance
    }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

// Express middleware
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const token = authHeader.substring(7);
    req.user = await validateToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token', details: err.message });
  }
};
```

**Python equivalent with PyJWT:**

```python
import jwt
from jwt import PyJWKClient
from functools import wraps
from flask import request, jsonify

jwks_client = PyJWKClient("https://your-auth-server/.well-known/jwks.json")

def validate_token(token: str) -> dict:
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        issuer="https://your-auth-server",
        audience="your-api-identifier",
        options={"require": ["exp", "iss", "aud"]}
    )

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing authorization"}), 401

        try:
            token = auth_header[7:]
            request.user = validate_token(token)
            return f(*args, **kwargs)
        except jwt.exceptions.PyJWTError as e:
            return jsonify({"error": "Invalid token", "details": str(e)}), 401
    return decorated
```

### API3:2023 - Broken Object Property Level Authorization

This vulnerability occurs when an API allows users to modify object properties they shouldn't have access to, or returns sensitive properties that should be filtered.

**Vulnerable code:**

```javascript
// Vulnerable: Returns all user fields, including sensitive ones
app.get('/api/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id);
  res.json(user); // Exposes passwordHash, ssn, internalNotes, etc.
});

// Vulnerable: Accepts any field in update
app.patch('/api/users/:id', async (req, res) => {
  await db.updateUser(req.params.id, req.body); // User can set isAdmin: true
});
```

**Secure implementation:**

```javascript
// Define allowed fields explicitly
const PUBLIC_FIELDS = ['id', 'name', 'email', 'avatar', 'createdAt'];
const USER_UPDATABLE_FIELDS = ['name', 'avatar', 'preferences'];
const ADMIN_UPDATABLE_FIELDS = [...USER_UPDATABLE_FIELDS, 'role', 'isActive'];

function filterFields(obj, allowedFields) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => allowedFields.includes(key))
  );
}

app.get('/api/users/:id', authMiddleware, async (req, res) => {
  const user = await db.getUser(req.params.id);
  res.json(filterFields(user, PUBLIC_FIELDS));
});

app.patch('/api/users/:id', authMiddleware, async (req, res) => {
  const allowedFields = req.user.isAdmin ? ADMIN_UPDATABLE_FIELDS : USER_UPDATABLE_FIELDS;
  const sanitizedUpdate = filterFields(req.body, allowedFields);
  await db.updateUser(req.params.id, sanitizedUpdate);
  res.json({ success: true });
});
```

### API4:2023 - Unrestricted Resource Consumption

APIs without rate limiting invite abuse—from credential stuffing to resource exhaustion to cost overruns on cloud infrastructure.

**nginx rate limiting:**

```nginx
# /etc/nginx/nginx.conf
http {
    # Define rate limit zones
    limit_req_zone $binary_remote_addr zone=api_general:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=api_auth:10m rate=5r/s;
    limit_req_zone $binary_remote_addr zone=api_sensitive:10m rate=10r/m;

    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    server {
        location /api/ {
            limit_req zone=api_general burst=50 nodelay;
            limit_conn conn_limit 20;
            proxy_pass http://backend;
        }

        location /api/auth/ {
            limit_req zone=api_auth burst=10 nodelay;
            limit_req_status 429;
            proxy_pass http://backend;
        }

        location /api/exports/ {
            limit_req zone=api_sensitive burst=2;
            proxy_pass http://backend;
        }
    }
}
```

**AWS API Gateway throttling (CloudFormation):**

```yaml
Resources:
  ApiGatewayUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: StandardPlan
      Description: Standard rate limits for API consumers
      Throttle:
        BurstLimit: 200
        RateLimit: 100
      Quota:
        Limit: 10000
        Period: DAY
      ApiStages:
        - ApiId: !Ref MyApi
          Stage: prod

  ApiGatewayMethodSettings:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: prod
      RestApiId: !Ref MyApi
      MethodSettings:
        - HttpMethod: "*"
          ResourcePath: "/*"
          ThrottlingBurstLimit: 100
          ThrottlingRateLimit: 50
        - HttpMethod: POST
          ResourcePath: "/auth/login"
          ThrottlingBurstLimit: 10
          ThrottlingRateLimit: 5
```

**Express.js rate limiting middleware:**

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redisClient = new Redis(process.env.REDIS_URL);

// General API rate limit
const generalLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded', retryAfter: 60 },
});

// Strict limit for authentication endpoints
const authLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessfulRequests: true, // Only count failed attempts
  message: { error: 'Too many login attempts', retryAfter: 900 },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

### API5:2023 - Broken Function Level Authorization

This occurs when users can access administrative functions or privileged operations they shouldn't have access to—often due to inadequate role checking.

```javascript
// Role-based access control middleware
const ROLE_HIERARCHY = {
  admin: ['admin', 'manager', 'user'],
  manager: ['manager', 'user'],
  user: ['user'],
};

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const hasPermission = allowedRoles.some(role =>
      ROLE_HIERARCHY[userRole]?.includes(role)
    );

    if (!hasPermission) {
      // Log the access attempt
      console.warn(`Unauthorized access attempt: user=${req.user.id}, role=${userRole}, required=${allowedRoles}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Usage
app.get('/api/users', authMiddleware, requireRole('admin', 'manager'), listUsers);
app.delete('/api/users/:id', authMiddleware, requireRole('admin'), deleteUser);
app.get('/api/reports/financial', authMiddleware, requireRole('admin'), getFinancialReports);
```

### API6:2023 - Unrestricted Access to Sensitive Business Flows

Attackers automate legitimate business flows to cause harm—purchasing limited inventory, mass creating accounts, or scraping data at scale.

**Bot detection and flow protection:**

```javascript
const crypto = require('crypto');

// Generate proof-of-work challenge
function generateChallenge() {
  const challenge = crypto.randomBytes(32).toString('hex');
  const difficulty = 4; // Number of leading zeros required
  return { challenge, difficulty, timestamp: Date.now() };
}

// Verify proof-of-work solution
function verifyProofOfWork(challenge, solution, difficulty) {
  const hash = crypto.createHash('sha256')
    .update(challenge + solution)
    .digest('hex');
  return hash.startsWith('0'.repeat(difficulty));
}

// Flow protection middleware for sensitive operations
app.post('/api/checkout', authMiddleware, async (req, res) => {
  const { powChallenge, powSolution, items } = req.body;

  // Verify proof-of-work for bot resistance
  if (!verifyProofOfWork(powChallenge, powSolution, 4)) {
    return res.status(400).json({ error: 'Invalid proof of work' });
  }

  // Check for velocity abuse
  const recentPurchases = await db.countRecentPurchases(req.user.id, '1 hour');
  if (recentPurchases >= 5) {
    return res.status(429).json({ error: 'Purchase limit reached' });
  }

  // Process legitimate checkout
  const order = await processCheckout(req.user.id, items);
  res.json(order);
});
```

### API7:2023 - Server Side Request Forgery (SSRF)

SSRF vulnerabilities allow attackers to make the server send requests to internal resources or arbitrary external systems.

```javascript
const { URL } = require('url');
const dns = require('dns').promises;
const ipaddr = require('ipaddr.js');

// Allowlist of permitted domains
const ALLOWED_DOMAINS = ['api.trusted-service.com', 'cdn.example.com'];

async function validateUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Protocol check
  if (!['https:', 'http:'].includes(url.protocol)) {
    throw new Error('Invalid protocol');
  }

  // Domain allowlist check
  if (!ALLOWED_DOMAINS.includes(url.hostname)) {
    throw new Error('Domain not in allowlist');
  }

  // Resolve DNS and check for internal IPs
  const addresses = await dns.resolve4(url.hostname);
  for (const addr of addresses) {
    const parsed = ipaddr.parse(addr);
    if (parsed.range() !== 'unicast') {
      throw new Error('Resolved to non-public IP address');
    }
    // Block common internal ranges
    if (addr.startsWith('10.') || addr.startsWith('192.168.') ||
        addr.startsWith('172.16.') || addr === '127.0.0.1') {
      throw new Error('Resolved to internal IP address');
    }
  }

  return url;
}

app.post('/api/fetch-preview', authMiddleware, async (req, res) => {
  try {
    const validatedUrl = await validateUrl(req.body.url);
    const response = await fetch(validatedUrl.toString(), {
      timeout: 5000,
      headers: { 'User-Agent': 'MyApp-Preview/1.0' }
    });
    const content = await response.text();
    res.json({ preview: content.substring(0, 1000) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

### API8:2023 - Security Misconfiguration

Misconfigurations range from verbose error messages to missing security headers to exposed debug endpoints.

**Security headers middleware:**

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.yourservice.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // Enable if not embedding third-party content
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.removeHeader('X-Powered-By');
  next();
});

// Disable stack traces in production
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  console.error(`Error: ${err.message}`, { stack: err.stack, requestId: req.id });

  res.status(statusCode).json({
    error: message,
    requestId: req.id // For support correlation, not debugging info
  });
});
```

### API9:2023 - Improper Inventory Management

Organizations often lose track of API endpoints—shadow APIs, deprecated versions, and undocumented endpoints create blind spots.

**OpenAPI specification enforcement:**

```yaml
# openapi.yaml
openapi: 3.1.0
info:
  title: My API
  version: 2.0.0
  description: Production API specification

servers:
  - url: https://api.example.com/v2
    description: Production

paths:
  /users:
    get:
      operationId: listUsers
      security:
        - bearerAuth: []
      x-rate-limit: 100/minute
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

**Runtime validation against spec:**

```javascript
const OpenApiValidator = require('express-openapi-validator');

app.use(
  OpenApiValidator.middleware({
    apiSpec: './openapi.yaml',
    validateRequests: true,
    validateResponses: process.env.NODE_ENV !== 'production',
    validateSecurity: {
      handlers: {
        bearerAuth: async (req, scopes) => {
          const token = req.headers.authorization?.split(' ')[1];
          if (!token) return false;
          try {
            req.user = await validateToken(token);
            return true;
          } catch {
            return false;
          }
        },
      },
    },
  })
);
```

### API10:2023 - Unsafe Consumption of APIs

When your API consumes third-party APIs, their vulnerabilities become your vulnerabilities. Validate everything coming from external sources.

```javascript
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

// Schema for expected third-party response
const thirdPartyUserSchema = {
  type: 'object',
  required: ['id', 'email'],
  properties: {
    id: { type: 'string', pattern: '^[a-zA-Z0-9-]+$', maxLength: 50 },
    email: { type: 'string', format: 'email', maxLength: 254 },
    name: { type: 'string', maxLength: 100 },
    metadata: { type: 'object', additionalProperties: false }
  },
  additionalProperties: false
};

const validateThirdPartyUser = ajv.compile(thirdPartyUserSchema);

async function fetchUserFromThirdParty(userId) {
  const response = await fetch(`https://api.third-party.com/users/${encodeURIComponent(userId)}`, {
    headers: { 'Authorization': `Bearer ${process.env.THIRD_PARTY_API_KEY}` },
    timeout: 5000,
  });

  if (!response.ok) {
    throw new Error(`Third-party API error: ${response.status}`);
  }

  const data = await response.json();

  // Validate the response matches expected schema
  if (!validateThirdPartyUser(data)) {
    console.error('Invalid third-party response', validateThirdPartyUser.errors);
    throw new Error('Third-party response validation failed');
  }

  return data;
}
```

## OAuth 2.0 Implementation

OAuth 2.0 remains the standard for API authorization. The Authorization Code flow with PKCE (Proof Key for Code Exchange) is now required for all public clients and recommended for confidential clients.

**Authorization Code with PKCE (client-side):**

```javascript
// Generate PKCE challenge
async function generatePKCE() {
  const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { codeVerifier, codeChallenge };
}

// Initiate OAuth flow
async function startOAuthFlow() {
  const { codeVerifier, codeChallenge } = await generatePKCE();
  const state = crypto.randomUUID();

  // Store for later verification
  sessionStorage.setItem('pkce_verifier', codeVerifier);
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: 'your-client-id',
    redirect_uri: 'https://yourapp.com/callback',
    scope: 'openid profile email',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `https://auth.provider.com/authorize?${params}`;
}

// Handle callback
async function handleOAuthCallback(callbackUrl) {
  const params = new URL(callbackUrl).searchParams;
  const code = params.get('code');
  const state = params.get('state');

  // Verify state to prevent CSRF
  if (state !== sessionStorage.getItem('oauth_state')) {
    throw new Error('State mismatch - possible CSRF attack');
  }

  const codeVerifier = sessionStorage.getItem('pkce_verifier');

  // Exchange code for tokens
  const response = await fetch('https://auth.provider.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: 'your-client-id',
      code: code,
      redirect_uri: 'https://yourapp.com/callback',
      code_verifier: codeVerifier,
    }),
  });

  return response.json();
}
```

## Input Validation and Injection Prevention

Every API input is a potential attack vector. Validation must happen at multiple layers.

**Comprehensive input validation:**

```javascript
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const sanitizeHtml = require('sanitize-html');

const ajv = new Ajv({ allErrors: true, coerceTypes: false });
addFormats(ajv);

// Request schema with strict validation
const createUserSchema = {
  type: 'object',
  required: ['email', 'name', 'password'],
  additionalProperties: false,
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 254
    },
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      pattern: '^[\\p{L}\\p{N}\\s\\-\\.]+$' // Unicode letters, numbers, spaces, hyphens, dots
    },
    password: {
      type: 'string',
      minLength: 12,
      maxLength: 128
    },
    bio: {
      type: 'string',
      maxLength: 500
    }
  }
};

const validateCreateUser = ajv.compile(createUserSchema);

// Validation middleware
function validateBody(schema) {
  const validate = ajv.compile(schema);
  return (req, res, next) => {
    if (!validate(req.body)) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validate.errors.map(e => ({
          field: e.instancePath,
          message: e.message
        }))
      });
    }
    next();
  };
}

// Parameterized queries prevent SQL injection
const { Pool } = require('pg');
const pool = new Pool();

async function createUser(email, name, passwordHash, bio) {
  const sanitizedBio = sanitizeHtml(bio, { allowedTags: [], allowedAttributes: {} });

  const result = await pool.query(
    'INSERT INTO users (email, name, password_hash, bio) VALUES ($1, $2, $3, $4) RETURNING id',
    [email, name, passwordHash, sanitizedBio]
  );

  return result.rows[0];
}

app.post('/api/users', validateBody(createUserSchema), async (req, res) => {
  const { email, name, password, bio } = req.body;
  const passwordHash = await argon2.hash(password);
  const user = await createUser(email, name, passwordHash, bio || '');
  res.status(201).json({ id: user.id });
});
```

## API Security Testing

Automated security testing catches vulnerabilities before attackers do.

**OWASP ZAP API scan:**

```bash
# Pull the latest ZAP Docker image
docker pull zaproxy/zap-stable

# Run API scan against OpenAPI spec
docker run -v $(pwd):/zap/wrk:rw -t zaproxy/zap-stable zap-api-scan.py \
  -t https://api.example.com/openapi.json \
  -f openapi \
  -r api-security-report.html \
  -w api-security-report.md \
  -J api-security-report.json \
  -c zap-config.conf

# Custom ZAP configuration (zap-config.conf)
# Disable certain rules if needed
# 10021    WARN    (X-Content-Type-Options Header Missing)
# 10038    WARN    (Content Security Policy Header Not Set)
```

**Nuclei API security templates:**

```bash
# Install nuclei
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# Run API security templates
nuclei -u https://api.example.com -t exposures/apis/ -t vulnerabilities/generic/ \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -o nuclei-results.txt

# Custom template for testing BOLA
cat > bola-test.yaml << 'EOF'
id: bola-test
info:
  name: BOLA Vulnerability Test
  severity: high

requests:
  - method: GET
    path:
      - "{{BaseURL}}/api/users/{{user_id}}/profile"
    headers:
      Authorization: "Bearer {{other_user_token}}"
    matchers:
      - type: status
        status:
          - 200
      - type: word
        words:
          - '"email":'
        condition: and
EOF
```

**CI/CD integration:**

```yaml
# .github/workflows/api-security.yml
name: API Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  api-security:
    runs-on: ubuntu-latest
    services:
      app:
        image: your-app:${{ github.sha }}
        ports:
          - 3000:3000

    steps:
      - uses: actions/checkout@v4

      - name: Wait for API
        run: |
          timeout 60 bash -c 'until curl -s http://localhost:3000/health; do sleep 2; done'

      - name: Run OWASP ZAP Scan
        uses: zaproxy/action-api-scan@v0.7.0
        with:
          target: 'http://localhost:3000/openapi.json'
          format: openapi
          fail_action: true
          allow_issue_writing: false

      - name: Upload Security Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: security-report
          path: report_html.html
```

## API Gateway Security Configuration

API gateways provide centralized security enforcement. Here's a Kong configuration example:

```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: user-service
    url: http://user-service:3000
    routes:
      - name: user-routes
        paths:
          - /api/users
        strip_path: false
    plugins:
      - name: jwt
        config:
          claims_to_verify:
            - exp
            - iss
          key_claim_name: kid

      - name: rate-limiting
        config:
          minute: 100
          hour: 1000
          policy: redis
          redis_host: redis

      - name: request-size-limiting
        config:
          allowed_payload_size: 1
          size_unit: megabytes

      - name: cors
        config:
          origins:
            - https://app.example.com
          methods:
            - GET
            - POST
            - PUT
            - DELETE
          headers:
            - Authorization
            - Content-Type
          max_age: 3600

      - name: ip-restriction
        config:
          deny:
            - 192.168.0.0/16
            - 10.0.0.0/8

consumers:
  - username: mobile-app
    jwt_secrets:
      - key: mobile-app-key
        algorithm: RS256
        rsa_public_key: |
          -----BEGIN PUBLIC KEY-----
          ...
          -----END PUBLIC KEY-----
```

## Logging and Monitoring

Effective API security requires comprehensive logging that balances observability with privacy.

```javascript
const pino = require('pino');
const pinoHttp = require('pino-http');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
    censor: '[REDACTED]'
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// HTTP request logging
app.use(pinoHttp({
  logger,
  customProps: (req) => ({
    requestId: req.id,
    userId: req.user?.id,
  }),
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
}));

// Security event logging
function logSecurityEvent(event, details) {
  logger.warn({
    type: 'security_event',
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
}

// Usage in auth middleware
if (!hasPermission) {
  logSecurityEvent('unauthorized_access', {
    userId: req.user?.id,
    resource: req.path,
    method: req.method,
    ip: req.ip,
  });
}
```

**Alerting thresholds:**

| Event | Threshold | Action |
|-------|-----------|--------|
| Failed logins per IP | >10 in 5 min | Block IP temporarily |
| 401/403 responses per user | >50 in 1 hour | Review account |
| Requests to deprecated endpoints | Any | Alert + log |
| Response time anomaly | >3x p99 baseline | Investigate |
| New IP accessing admin APIs | Any | Alert for review |

## Measuring API Security

Track these metrics to gauge your API security posture:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| OWASP Top 10 coverage | 100% | Annual pentest + automated scanning |
| Authentication bypass attempts | 0 successful | SIEM alerting |
| Time to patch critical API vulns | <24 hours | Vulnerability management |
| API inventory accuracy | >95% | Monthly discovery scan vs. documented |
| Rate limit effectiveness | <0.1% bypass | Traffic analysis |
| JWT validation failures | Trend downward | Auth service metrics |
| Deprecated API usage | 0% after sunset | Traffic monitoring |

## Getting Started

If you're building a new API or hardening an existing one:

1. **Inventory your APIs**: You can't secure what you don't know exists. Document all endpoints, including internal and legacy APIs.

2. **Implement the basics first**: Authentication, authorization, rate limiting, and input validation address the majority of API attacks.

3. **Add automated testing**: OWASP ZAP and similar tools catch common vulnerabilities in CI/CD before production deployment.

4. **Use an OpenAPI specification**: Machine-readable API contracts enable automated validation, documentation, and security testing.

5. **Monitor for anomalies**: Normal API traffic has patterns. Deviations—unusual volumes, new client IPs, off-hours access—warrant investigation.

6. **Review the OWASP API Security Top 10**: Each item in the 2023 list represents real-world attack patterns. Verify your defenses against each.

API security isn't a feature you add once—it's an ongoing practice that evolves with your API surface and the threat landscape. The code examples in this post provide a starting point, but effective API security requires continuous assessment, testing, and improvement.

---

## Further Reading

- [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x00-header/)
- [NIST SP 800-204: Security Strategies for Microservices-based Application Systems](https://csrc.nist.gov/publications/detail/sp/800-204/final)
- [OAuth 2.0 Security Best Current Practice (RFC 9700)](https://datatracker.ietf.org/doc/html/rfc9700)
- [Salt Security State of API Security Report](https://salt.security/api-security-trends)
