---
title: "Log Management Best Practices: From Collection to Compliance in 2026"
slug: log-management-best-practices-boost-efficiency-security
description: Your logs are either solving problems or creating them. Learn how
  to build a log management pipeline that scales, from structured logging and
  shipping architectures to retention policies and compliance requirements.
date: 2026-01-07
updated: ""
category: Observability
tags:
  - Log Management
  - Observability
  - Elasticsearch
  - Loki
  - Structured Logging
  - SIEM
  - Security Operations
  - Compliance
image: https://images.seanfraser.io/Log%20Mgmt.jpg
featured: false
draft: false
---

## The Log Problem Nobody Talks About

Every engineering team has experienced it: production goes down at 2 AM, and you need to understand what happened. You open your logging platform and find yourself staring at thousands of unstructured log lines, each formatted differently, timestamps in different time zones, and no way to correlate events across services. Thirty minutes later, you're still grep-ing through raw files because your "log management system" is really just expensive storage.

The gap between collecting logs and actually using them to solve problems is where most organizations fail. They invest in platforms, ship everything they generate, and then wonder why their monthly logging bill exceeds their compute costs while their mean time to resolution keeps climbing.

Effective log management isn't about capturing more data—it's about capturing the right data in a format that makes problems findable. This requires intentional decisions at every stage: what to log, how to structure it, where to ship it, how long to keep it, and who can access it. Get these decisions wrong, and logs become liability rather than asset.

## Structured Logging: The Foundation Everything Else Depends On

Unstructured logs are text strings that humans might understand but machines cannot query. Structured logs are data that both humans and machines can work with. This distinction determines whether your logging investment pays dividends or just accumulates cost.

Consider the difference:

```text
# Unstructured log - human readable but machine hostile
2025-01-07 14:23:45 INFO User john@example.com logged in from 192.168.1.100 after 2 failed attempts

# Structured log - queryable and analyzable
{
  "timestamp": "2025-01-07T14:23:45.123Z",
  "level": "info",
  "service": "auth-service",
  "event": "user_login",
  "user_email": "john@example.com",
  "source_ip": "192.168.1.100",
  "failed_attempts": 2,
  "session_id": "sess_abc123",
  "trace_id": "trace_xyz789"
}
```

The structured version can be queried: "Show me all logins from IP addresses with more than 3 failed attempts in the last hour." The unstructured version requires regex parsing and hope.

### Implementing Structured Logging

Every major language has libraries that make structured logging straightforward. The key is standardizing on a schema across your organization—consistent field names, consistent timestamp formats, consistent severity levels.

Python with structlog:

```python
# logging_config.py
import structlog
import logging
import sys

def configure_logging(service_name: str, environment: str):
    """Configure structured JSON logging for production use."""

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer()
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Add default context available in all log entries
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        service=service_name,
        environment=environment,
    )

# Usage in application code
logger = structlog.get_logger()

def process_order(order_id: str, user_id: str):
    # Bind request-specific context
    log = logger.bind(order_id=order_id, user_id=user_id)

    log.info("processing_order_started")

    try:
        # Business logic here
        result = execute_order(order_id)
        log.info("processing_order_completed",
                 total_amount=result.amount,
                 items_count=result.items)
    except PaymentError as e:
        log.error("processing_order_failed",
                  error_type="payment_failure",
                  error_message=str(e))
        raise
```

Go with zerolog:

```go
package main

import (
    "os"
    "time"

    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func init() {
    // Configure global logger
    zerolog.TimeFieldFormat = time.RFC3339Nano
    zerolog.SetGlobalLevel(zerolog.InfoLevel)

    log.Logger = zerolog.New(os.Stdout).With().
        Timestamp().
        Str("service", "order-service").
        Str("environment", os.Getenv("ENVIRONMENT")).
        Logger()
}

func ProcessOrder(orderID string, userID string) error {
    logger := log.With().
        Str("order_id", orderID).
        Str("user_id", userID).
        Logger()

    logger.Info().Msg("processing_order_started")

    result, err := executeOrder(orderID)
    if err != nil {
        logger.Error().
            Err(err).
            Str("error_type", "order_execution_failed").
            Msg("processing_order_failed")
        return err
    }

    logger.Info().
        Float64("total_amount", result.Amount).
        Int("items_count", result.ItemsCount).
        Msg("processing_order_completed")

    return nil
}
```

Node.js with pino:

```javascript
// logger.js
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: process.env.SERVICE_NAME,
    environment: process.env.NODE_ENV,
  },
});

module.exports = logger;

// Usage in application
const logger = require('./logger');

async function processOrder(orderId, userId) {
  const log = logger.child({ order_id: orderId, user_id: userId });

  log.info('processing_order_started');

  try {
    const result = await executeOrder(orderId);
    log.info({
      total_amount: result.amount,
      items_count: result.items.length
    }, 'processing_order_completed');
  } catch (error) {
    log.error({
      error_type: error.name,
      error_message: error.message,
      stack: error.stack
    }, 'processing_order_failed');
    throw error;
  }
}
```

### Log Levels: Use Them Consistently

Log levels exist to enable filtering. Without consistent usage, they're meaningless:

```text
Level       When to Use                                         Examples
─────────────────────────────────────────────────────────────────────────────────
TRACE       Extremely detailed debugging (disabled in prod)     Function entry/exit, variable values
DEBUG       Diagnostic information for troubleshooting          SQL queries, API request details
INFO        Normal operation milestones                         Request completed, job finished
WARN        Unexpected but handled conditions                   Retry succeeded, deprecated API used
ERROR       Failures requiring attention                        Payment failed, external API timeout
FATAL       Unrecoverable errors causing shutdown               Database connection lost, out of memory
```

Configure log levels per environment:

```yaml
# config/logging.yaml
development:
  level: debug
  format: pretty

staging:
  level: debug
  format: json

production:
  level: info
  format: json
  # Enable debug for specific services during incidents
  overrides:
    payment-service: debug
```

## Log Shipping: Getting Logs Where They Need to Go

Structured logs sitting on individual servers aren't useful. They need to flow to a centralized platform where they can be searched, correlated, and analyzed. This is the log shipping layer—agents that collect logs from various sources and forward them to your storage and analysis backend.

### The Modern Log Shipping Stack

Three tools dominate production log shipping: Fluent Bit, Fluentd, and Vector. Each has different strengths.

**Fluent Bit** is lightweight and designed for edge collection. It runs on resource-constrained environments (containers, IoT devices) and forwards logs to aggregators or directly to backends. Most Kubernetes deployments use Fluent Bit as a DaemonSet.

**Fluentd** is the heavier sibling—more plugins, more processing capability, but higher resource usage. It often serves as an aggregation layer receiving logs from Fluent Bit collectors.

**Vector** is the newer entrant from Datadog, written in Rust with a focus on performance and observability pipeline unification (logs, metrics, traces).

### Vector Configuration for Multi-Destination Shipping

Vector excels at routing logs to multiple destinations with transformation:

```toml
# vector.toml
[sources.kubernetes_logs]
type = "kubernetes_logs"
auto_partial_merge = true
exclude_paths_glob_patterns = ["**/kube-system/**"]

[transforms.parse_json]
type = "remap"
inputs = ["kubernetes_logs"]
source = '''
  # Parse JSON logs if present
  if exists(.message) && is_string(.message) {
    parsed, err = parse_json(.message)
    if err == null {
      . = merge(., parsed)
      del(.message)
    }
  }

  # Standardize timestamp
  .timestamp = to_timestamp!(.timestamp) ?? now()

  # Add processing metadata
  .vector_processed_at = now()
  .cluster = get_env_var!("CLUSTER_NAME")
'''

[transforms.filter_noise]
type = "filter"
inputs = ["parse_json"]
condition = '''
  # Drop health check logs
  !contains(string!(.path) ?? "", "/health") &&
  !contains(string!(.path) ?? "", "/ready") &&
  # Drop debug logs in production
  .level != "debug"
'''

[transforms.sample_high_volume]
type = "sample"
inputs = ["filter_noise"]
rate = 10
key_field = "trace_id"
exclude = '''
  # Never sample errors or warnings
  .level == "error" || .level == "warn"
'''

[sinks.elasticsearch]
type = "elasticsearch"
inputs = ["sample_high_volume"]
endpoints = ["https://elasticsearch.example.com:9200"]
bulk.index = "logs-%Y.%m.%d"
auth.strategy = "basic"
auth.user = "${ELASTICSEARCH_USER}"
auth.password = "${ELASTICSEARCH_PASSWORD}"

[sinks.s3_archive]
type = "aws_s3"
inputs = ["filter_noise"]
bucket = "company-logs-archive"
key_prefix = "logs/{{ kubernetes.namespace }}/{{ kubernetes.pod_name }}/%Y/%m/%d/"
compression = "gzip"
encoding.codec = "json"

[sinks.datadog]
type = "datadog_logs"
inputs = ["sample_high_volume"]
default_api_key = "${DATADOG_API_KEY}"
site = "datadoghq.com"
```

Verify Vector is processing logs:

```bash
# Check Vector internal metrics
curl -s http://localhost:8686/metrics | grep vector_

# View component topology
vector top

# Validate configuration
vector validate vector.toml

# Test with sample data
echo '{"level":"info","message":"test"}' | vector --config vector.toml
```

## Choosing Your Log Backend

The log backend decision has long-term cost and operational implications. The three primary options serve different needs.

### Elasticsearch (ELK Stack)

Elasticsearch remains the most deployed option, offering powerful full-text search and aggregation. The ELK stack (Elasticsearch, Logstash, Kibana) or its modern variant (Elasticsearch, Beats, Kibana) provides a complete solution.

```bash
# Deploy Elasticsearch on Kubernetes with ECK operator
kubectl create -f https://download.elastic.co/downloads/eck/2.10.0/crds.yaml
kubectl apply -f https://download.elastic.co/downloads/eck/2.10.0/operator.yaml

# Create Elasticsearch cluster
cat <<EOF | kubectl apply -f -
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: logs
  namespace: logging
spec:
  version: 8.11.0
  nodeSets:
  - name: default
    count: 3
    config:
      node.store.allow_mmap: false
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          resources:
            limits:
              memory: 4Gi
              cpu: 2
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
        storageClassName: fast-ssd
EOF
```

Query Elasticsearch for troubleshooting:

```bash
# Search for errors in the last hour
curl -X GET "elasticsearch:9200/logs-*/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "bool": {
        "must": [
          {"term": {"level": "error"}},
          {"range": {"@timestamp": {"gte": "now-1h"}}}
        ]
      }
    },
    "sort": [{"@timestamp": "desc"}],
    "size": 100
  }'

# Aggregate errors by service
curl -X GET "elasticsearch:9200/logs-*/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "size": 0,
    "query": {
      "bool": {
        "must": [
          {"term": {"level": "error"}},
          {"range": {"@timestamp": {"gte": "now-24h"}}}
        ]
      }
    },
    "aggs": {
      "by_service": {
        "terms": {"field": "service.keyword", "size": 20}
      }
    }
  }'

# Find logs correlated with a trace ID
curl -X GET "elasticsearch:9200/logs-*/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "term": {"trace_id": "abc123xyz"}
    },
    "sort": [{"@timestamp": "asc"}]
  }'
```

### Grafana Loki

Loki takes a different approach—it indexes only labels (metadata), not log content. This dramatically reduces storage and operational costs while still enabling effective log exploration. Loki pairs with Grafana for visualization and uses LogQL for queries.

```yaml
# loki-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: loki-config
  namespace: logging
data:
  loki.yaml: |
    auth_enabled: false

    server:
      http_listen_port: 3100
      grpc_listen_port: 9096

    common:
      path_prefix: /loki
      storage:
        filesystem:
          chunks_directory: /loki/chunks
          rules_directory: /loki/rules
      replication_factor: 1
      ring:
        instance_addr: 127.0.0.1
        kvstore:
          store: inmemory

    schema_config:
      configs:
        - from: 2024-01-01
          store: tsdb
          object_store: filesystem
          schema: v12
          index:
            prefix: index_
            period: 24h

    storage_config:
      tsdb_shipper:
        active_index_directory: /loki/tsdb-index
        cache_location: /loki/tsdb-cache
        cache_ttl: 24h

    limits_config:
      retention_period: 720h
      max_query_parallelism: 32
      max_query_series: 10000

    chunk_store_config:
      max_look_back_period: 0s

    table_manager:
      retention_deletes_enabled: true
      retention_period: 720h
```

LogQL queries for common scenarios:

```bash
# View logs from a specific service
curl -G -s "http://loki:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={service="payment-service"}' \
  --data-urlencode 'limit=100' | jq '.data.result[].values[][1]'

# Find error logs across all services
curl -G -s "http://loki:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={level="error"} |= "timeout"' \
  --data-urlencode 'start=1704600000000000000' \
  --data-urlencode 'end=1704686400000000000'

# Count errors per service over time
curl -G -s "http://loki:3100/loki/api/v1/query" \
  --data-urlencode 'query=sum by (service) (count_over_time({level="error"}[1h]))'

# Parse JSON and filter by field
curl -G -s "http://loki:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={service="api-gateway"} | json | status_code >= 500'

# Calculate error rate
curl -G -s "http://loki:3100/loki/api/v1/query" \
  --data-urlencode 'query=
    sum(count_over_time({service="checkout"} | json | level="error"[5m]))
    /
    sum(count_over_time({service="checkout"}[5m]))
  '
```

### Cost Comparison

Log storage costs vary dramatically by approach:

```text
Scenario: 100GB/day log ingestion, 30-day retention

Elasticsearch (self-managed):
├── Storage: 3TB (compressed) × $0.10/GB = $300/month
├── Compute: 6 nodes × $200/month = $1,200/month
├── Operations: ~0.5 FTE = $5,000/month
└── Total: ~$6,500/month

Grafana Loki (self-managed):
├── Storage: 1TB (label-only index) × $0.10/GB = $100/month
├── Compute: 3 nodes × $150/month = $450/month
├── Operations: ~0.25 FTE = $2,500/month
└── Total: ~$3,050/month

Datadog Logs:
├── Ingestion: 100GB × $0.10/GB × 30 = $300/month
├── Retention: Included for 15 days, archive for longer
├── Operations: Minimal
└── Total: ~$300/month + archive costs

Splunk Cloud:
├── Ingestion: 100GB × 30 × $150/GB/month = $450,000/month
├── (Splunk pricing is volume-based and significantly higher)
└── Total: Varies significantly by contract
```

## Retention Policies: Balancing Compliance and Cost

Log retention isn't just about storage costs—it's about compliance requirements, operational needs, and legal discovery obligations. Different log types have different retention requirements.

```yaml
# retention-policies.yaml
# Define retention tiers based on log classification

policies:
  security_logs:
    description: "Authentication, authorization, access logs"
    retention_hot: 30d      # Searchable, indexed
    retention_warm: 90d     # Searchable, slower
    retention_cold: 365d    # Archived, restore on demand
    retention_total: 7y     # Compliance requirement (PCI DSS, SOX)
    compliance:
      - PCI-DSS-10.7        # 1 year minimum
      - SOX                  # 7 years
      - HIPAA               # 6 years

  application_logs:
    description: "Application debug, info, error logs"
    retention_hot: 7d
    retention_warm: 30d
    retention_cold: 90d
    retention_total: 90d

  infrastructure_logs:
    description: "System, network, container logs"
    retention_hot: 3d
    retention_warm: 14d
    retention_cold: 30d
    retention_total: 30d

  audit_logs:
    description: "Configuration changes, admin actions"
    retention_hot: 90d
    retention_warm: 365d
    retention_cold: 7y
    retention_total: 7y
    immutable: true         # Cannot be modified or deleted
```

Implement tiered storage in Elasticsearch:

```bash
# Create ILM policy for log lifecycle management
curl -X PUT "elasticsearch:9200/_ilm/policy/logs-lifecycle" \
  -H "Content-Type: application/json" \
  -d '{
    "policy": {
      "phases": {
        "hot": {
          "min_age": "0ms",
          "actions": {
            "rollover": {
              "max_size": "50gb",
              "max_age": "1d"
            },
            "set_priority": {
              "priority": 100
            }
          }
        },
        "warm": {
          "min_age": "7d",
          "actions": {
            "shrink": {
              "number_of_shards": 1
            },
            "forcemerge": {
              "max_num_segments": 1
            },
            "set_priority": {
              "priority": 50
            }
          }
        },
        "cold": {
          "min_age": "30d",
          "actions": {
            "searchable_snapshot": {
              "snapshot_repository": "logs-archive"
            }
          }
        },
        "delete": {
          "min_age": "90d",
          "actions": {
            "delete": {}
          }
        }
      }
    }
  }'

# Apply policy to index template
curl -X PUT "elasticsearch:9200/_index_template/logs-template" \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["logs-*"],
    "template": {
      "settings": {
        "number_of_shards": 3,
        "number_of_replicas": 1,
        "index.lifecycle.name": "logs-lifecycle",
        "index.lifecycle.rollover_alias": "logs"
      }
    }
  }'
```

## Security and Access Control

Logs contain sensitive information—credentials (hopefully not, but often), PII, internal system details, and business data. Protecting them requires multiple layers.

### Log Sanitization

Filter sensitive data before it reaches storage:

```python
# log_sanitizer.py
import re
from typing import Dict, Any

class LogSanitizer:
    """Sanitize sensitive data from log entries before shipping."""

    PATTERNS = {
        'credit_card': r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
        'ssn': r'\b\d{3}-\d{2}-\d{4}\b',
        'api_key': r'(api[_-]?key|apikey|api_secret)["\s:=]+["\']?[\w-]{20,}',
        'password': r'(password|passwd|pwd)["\s:=]+["\']?[^\s"\']+',
        'bearer_token': r'Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+',
        'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    }

    REDACTION_MAP = {
        'credit_card': '[REDACTED_CC]',
        'ssn': '[REDACTED_SSN]',
        'api_key': '[REDACTED_API_KEY]',
        'password': '[REDACTED_PASSWORD]',
        'bearer_token': '[REDACTED_TOKEN]',
        'email': '[REDACTED_EMAIL]',
    }

    def sanitize(self, log_entry: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively sanitize all string values in a log entry."""
        return self._sanitize_value(log_entry)

    def _sanitize_value(self, value: Any) -> Any:
        if isinstance(value, str):
            return self._sanitize_string(value)
        elif isinstance(value, dict):
            return {k: self._sanitize_value(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [self._sanitize_value(item) for item in value]
        return value

    def _sanitize_string(self, text: str) -> str:
        for pattern_name, pattern in self.PATTERNS.items():
            text = re.sub(
                pattern,
                self.REDACTION_MAP[pattern_name],
                text,
                flags=re.IGNORECASE
            )
        return text
```

### Role-Based Access Control

Configure access tiers for different roles:

```yaml
# elasticsearch-roles.yaml
# Security analyst - full access to security logs, limited elsewhere
security_analyst:
  cluster:
    - monitor
  indices:
    - names: ["security-*", "audit-*"]
      privileges: ["read", "view_index_metadata"]
    - names: ["logs-*"]
      privileges: ["read"]
      field_security:
        grant: ["*"]
        except: ["user.email", "user.ip", "request.body"]

# Developer - access to application logs only
developer:
  cluster:
    - monitor
  indices:
    - names: ["logs-*"]
      privileges: ["read"]
      query: '{"term": {"environment": "development"}}'
    - names: ["logs-production-*"]
      privileges: ["read"]
      field_security:
        grant: ["timestamp", "level", "service", "message", "trace_id"]
        except: ["user.*", "request.headers.*"]

# Compliance auditor - read-only audit logs
compliance_auditor:
  cluster:
    - monitor
  indices:
    - names: ["audit-*"]
      privileges: ["read", "view_index_metadata"]
```

### Encryption

Encrypt logs in transit and at rest:

```bash
# Generate certificates for log shipper to Elasticsearch TLS
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/fluent-bit/tls.key \
  -out /etc/fluent-bit/tls.crt \
  -subj "/CN=fluent-bit"

# Elasticsearch encryption at rest configuration
# elasticsearch.yml
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
xpack.security.http.ssl.enabled: true

# Enable encryption at rest (requires appropriate license)
xpack.security.encryption.enabled: true
```

## OpenTelemetry Logs: The Emerging Standard

OpenTelemetry Logs reached stability in 2024, providing a vendor-neutral standard for log collection that integrates with traces and metrics. While adoption is still growing, greenfield deployments should consider OTel as the instrumentation layer.

```python
# opentelemetry_logging.py
from opentelemetry import trace
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter
from opentelemetry.sdk.resources import Resource
import logging

def configure_otel_logging(service_name: str):
    """Configure OpenTelemetry logging with OTLP export."""

    resource = Resource.create({
        "service.name": service_name,
        "service.version": "1.0.0",
        "deployment.environment": "production"
    })

    logger_provider = LoggerProvider(resource=resource)

    # Export to OpenTelemetry Collector
    otlp_exporter = OTLPLogExporter(
        endpoint="otel-collector:4317",
        insecure=True
    )

    logger_provider.add_log_record_processor(
        BatchLogRecordProcessor(otlp_exporter)
    )

    # Bridge Python logging to OpenTelemetry
    handler = LoggingHandler(
        level=logging.INFO,
        logger_provider=logger_provider
    )

    logging.getLogger().addHandler(handler)

    return logger_provider
```

OpenTelemetry Collector configuration for logs:

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

  filelog:
    include: [/var/log/**/*.log]
    operators:
      - type: json_parser
        timestamp:
          parse_from: attributes.timestamp
          layout: '%Y-%m-%dT%H:%M:%S.%LZ'

processors:
  batch:
    timeout: 10s
    send_batch_size: 1024

  attributes:
    actions:
      - key: environment
        value: production
        action: insert

  resource:
    attributes:
      - key: cluster
        value: us-east-1
        action: insert

exporters:
  elasticsearch:
    endpoints: ["https://elasticsearch:9200"]
    logs_index: otel-logs
    sending_queue:
      enabled: true
      num_consumers: 10
      queue_size: 1000

  loki:
    endpoint: http://loki:3100/loki/api/v1/push
    labels:
      attributes:
        service.name: "service"
        level: "severity"

service:
  pipelines:
    logs:
      receivers: [otlp, filelog]
      processors: [batch, attributes, resource]
      exporters: [elasticsearch, loki]
```

## Troubleshooting Common Issues

### High Log Volume Causing Performance Issues

```bash
# Identify highest-volume log sources
curl -s "elasticsearch:9200/logs-*/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "size": 0,
    "aggs": {
      "by_source": {
        "terms": {
          "field": "kubernetes.pod_name.keyword",
          "size": 20,
          "order": {"_count": "desc"}
        }
      }
    }
  }' | jq '.aggregations.by_source.buckets'

# Find noisy log patterns
curl -s "elasticsearch:9200/logs-*/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "size": 0,
    "aggs": {
      "by_message": {
        "terms": {
          "field": "message.keyword",
          "size": 50
        }
      }
    }
  }'

# Implement sampling for high-volume, low-value logs
# In Vector config:
# [transforms.sample_health_checks]
# type = "sample"
# inputs = ["kubernetes_logs"]
# rate = 100
# condition = 'contains(string!(.message) ?? "", "health check")'
```

### Missing Logs

```bash
# Check Fluent Bit buffer status
curl -s http://fluent-bit:2020/api/v1/metrics | grep -E "(input|output)_"

# Verify log shipping pipeline
kubectl logs -n logging deployment/fluent-bit --tail=100 | grep -i error

# Check for dropped logs due to rate limiting
kubectl logs -n logging deployment/fluent-bit | grep -i "chunk"

# Verify Elasticsearch is accepting logs
curl -s "elasticsearch:9200/_cat/indices?v" | grep logs

# Check for index write blocks
curl -s "elasticsearch:9200/_cluster/allocation/explain" | jq .
```

### Slow Queries

```bash
# Identify slow queries in Elasticsearch
curl -s "elasticsearch:9200/_nodes/stats/indices/search" | \
  jq '.nodes | to_entries[] | {node: .key, query_time_ms: .value.indices.search.query_time_in_millis}'

# Check index health and shard distribution
curl -s "elasticsearch:9200/_cat/shards?v&s=store:desc" | head -20

# Optimize index for faster queries
curl -X POST "elasticsearch:9200/logs-2025.01.07/_forcemerge?max_num_segments=1"
```

## Building a Log Management Strategy

Effective log management isn't about tools—it's about intentional decisions applied consistently. Start with these principles:

Log what matters, not everything. Every log line has storage cost, processing cost, and attention cost. The goal isn't maximum data; it's maximum signal.

Structure from the start. Retrofitting structured logging into a running system is painful. Establish logging standards before writing application code.

Plan for failure. Your logging pipeline will fail. Design for graceful degradation—local buffering, backpressure handling, and fallback destinations.

Measure the pipeline. You can't improve what you don't measure. Track ingestion rates, query latency, storage growth, and pipeline health as first-class metrics.

Iterate on retention. Start conservative (keep more), then tune based on actual query patterns. Most logs are never queried after 7 days—but the ones that are queried at day 30 during an incident are invaluable.

The organizations that get the most value from their logs treat log management as a discipline, not an afterthought. The investment in proper tooling, consistent practices, and thoughtful retention pays dividends every time something goes wrong—which, in production systems, is always.

---

## Further Reading

- [OpenTelemetry Logging Documentation](https://opentelemetry.io/docs/specs/otel/logs/)
- [Elasticsearch Index Lifecycle Management](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html)
- [Grafana Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Vector Configuration Reference](https://vector.dev/docs/reference/configuration/)
- [NIST SP 800-92: Guide to Computer Security Log Management](https://csrc.nist.gov/publications/detail/sp/800-92/final)
