---
title: "Cloud Detection and Response: Catching Threats That Cloud Security Posture Management Misses"
slug: secure-your-cloud-assets-cdr-cloud-detection-response
description: CSPM finds misconfigurations. CDR finds attackers. Learn how Cloud Detection and Response works, how it fits into CNAPP architectures, and how to build detection capabilities for AWS, Azure, and GCP.
date: 2024-06-22
updated: 2026-01-07
category: Cloud Security
tags:
  - CDR
  - Cloud Security
  - CNAPP
  - Threat Detection
  - AWS GuardDuty
  - Cloud Workload Protection
  - MITRE ATT&CK
  - Security Operations
image: https://images.seanfraser.io/CDR.jpg
featured: false
draft: false
---

## The Gap Between Configuration and Compromise

Your Cloud Security Posture Management tool shows green across the board. S3 buckets aren't public. IAM policies follow least privilege. Security groups restrict access appropriately. Everything is configured correctly.

Three months later, you discover an attacker has been living in your AWS environment, exfiltrating data through a legitimate Lambda function they modified after compromising developer credentials. CSPM never alerted because nothing was misconfigured—the attacker used valid credentials and operated within the bounds of existing policies.

This is the gap Cloud Detection and Response (CDR) addresses. While CSPM answers "Is our cloud configured securely?", CDR answers "Is someone attacking us right now?" These are fundamentally different questions requiring different data sources, different detection logic, and different response capabilities.

The distinction matters because attackers have adapted. They don't just exploit misconfigurations—they steal credentials, abuse legitimate services, and move laterally through properly configured environments. Detecting these threats requires analyzing behavior patterns, correlating events across services, and identifying anomalies that configuration scanning will never catch.

## Where CDR Fits in the CNAPP Landscape

Cloud-Native Application Protection Platform (CNAPP) has become the umbrella term for cloud security capabilities. Understanding where CDR fits helps clarify what it does and doesn't do.

```text
CNAPP Capability Stack
──────────────────────────────────────────────────────────────
CSPM (Cloud Security Posture Management)
├── Configuration assessment
├── Compliance monitoring
├── Policy enforcement
└── Drift detection

CWPP (Cloud Workload Protection Platform)
├── Runtime protection
├── Vulnerability management
├── File integrity monitoring
└── Anti-malware

CDR (Cloud Detection and Response)
├── Threat detection across control plane
├── Behavioral analytics
├── Attack correlation
└── Automated response

CIEM (Cloud Infrastructure Entitlement Management)
├── Identity analytics
├── Permission rightsizing
├── Access path analysis
└── Privileged access monitoring

Data Security (DSPM)
├── Data discovery and classification
├── Data flow analysis
├── Encryption validation
└── Access monitoring
──────────────────────────────────────────────────────────────
```

CDR specifically focuses on detecting active threats by analyzing cloud provider audit logs, network flows, and runtime behavior. It correlates events that individually appear benign but together indicate an attack in progress.

The market has consolidated around vendors offering integrated CNAPP solutions: Wiz, Palo Alto Prisma Cloud, CrowdStrike Falcon Cloud Security, Orca Security, Lacework, and Sysdig. Each approaches CDR differently—some emphasize agentless scanning, others deploy runtime agents, and most combine both approaches.

## Detection Data Sources

CDR effectiveness depends entirely on the data it can access. Cloud providers generate extensive audit logs that capture every API call, but extracting signal from this noise requires understanding what to look for.

### AWS CloudTrail

CloudTrail records every API call in your AWS environment. CDR solutions ingest these logs and apply detection rules for suspicious patterns.

```bash
# Query CloudTrail for console logins without MFA
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=ConsoleLogin \
  --start-time $(date -d '24 hours ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --query 'Events[?contains(CloudTrailEvent, `"mfaAuthenticated":"false"`)]'

# Find IAM policy changes
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventSource,AttributeValue=iam.amazonaws.com \
  --start-time $(date -d '7 days ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --query 'Events[?contains(CloudTrailEvent, `PutUserPolicy`) || contains(CloudTrailEvent, `AttachUserPolicy`)]'

# Detect unusual cross-account activity
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRole \
  --start-time $(date -d '24 hours ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --query 'Events[].CloudTrailEvent' | \
  jq -r '.[] | fromjson | select(.userIdentity.accountId != .resources[0].accountId)'
```

For more sophisticated analysis, use CloudWatch Logs Insights:

```sql
-- Find successful API calls from IP addresses that had previous failures
fields @timestamp, userIdentity.arn, sourceIPAddress, eventName, errorCode
| filter ispresent(errorCode)
| stats count(*) as failures by sourceIPAddress
| filter failures > 5
| sort failures desc
| limit 20
```

```sql
-- Detect reconnaissance patterns (listing resources across services)
fields @timestamp, userIdentity.arn, eventName, eventSource
| filter eventName like /^(List|Describe|Get)/
| stats count(*) as api_calls, count_distinct(eventSource) as services_accessed by userIdentity.arn, bin(1h)
| filter services_accessed > 10 and api_calls > 100
| sort api_calls desc
```

### Azure Activity Logs

Azure Monitor captures control plane activity across your Azure subscriptions:

```bash
# Query for failed sign-ins followed by successful ones (potential brute force)
az monitor activity-log list \
  --start-time $(date -d '24 hours ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --query "[?contains(operationName.value, 'Sign-in')]" \
  --output table

# Find role assignment changes
az monitor activity-log list \
  --start-time $(date -d '7 days ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --query "[?operationName.value=='Microsoft.Authorization/roleAssignments/write']"

# Detect resource deletions
az monitor activity-log list \
  --start-time $(date -d '24 hours ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --query "[?contains(operationName.value, '/delete')]" \
  --output json | jq '.[] | {time: .eventTimestamp, operation: .operationName.value, caller: .caller}'
```

Azure Resource Graph for cross-subscription queries:

```kusto
// Find resources with public endpoints created in last 7 days
resources
| where type =~ 'microsoft.network/publicipaddresses'
| where properties.provisioningState == 'Succeeded'
| extend createdTime = todatetime(tags.createdTime)
| where createdTime > ago(7d)
| project name, resourceGroup, subscriptionId, createdTime
```

### GCP Audit Logs

GCP Cloud Logging captures Admin Activity and Data Access logs:

```bash
# Query for IAM policy changes
gcloud logging read \
  'protoPayload.methodName=~"SetIamPolicy"' \
  --project=your-project \
  --freshness=7d \
  --format=json | jq '.[] | {time: .timestamp, method: .protoPayload.methodName, actor: .protoPayload.authenticationInfo.principalEmail}'

# Find service account key creation
gcloud logging read \
  'protoPayload.methodName="google.iam.admin.v1.CreateServiceAccountKey"' \
  --project=your-project \
  --freshness=30d

# Detect unusual data access patterns
gcloud logging read \
  'protoPayload.@type="type.googleapis.com/google.cloud.audit.AuditLog" AND protoPayload.methodName=~"storage.objects"' \
  --project=your-project \
  --freshness=1d \
  --format=json | jq 'group_by(.protoPayload.authenticationInfo.principalEmail) | map({user: .[0].protoPayload.authenticationInfo.principalEmail, count: length})'
```

## Detection Engineering for Cloud

CDR relies on detection rules that identify attack patterns. These rules map to the MITRE ATT&CK Cloud Matrix, which documents techniques attackers use against cloud environments.

### High-Value Detection Rules

**Initial Access: Compromised Credentials**

```yaml
# Detection: Console login from new geolocation
rule:
  name: "Console Login from Unusual Location"
  description: "Detects AWS console logins from countries not seen in past 30 days"
  mitre_attack:
    tactic: Initial Access
    technique: T1078.004 (Valid Accounts: Cloud Accounts)

  data_source: cloudtrail
  event_name: ConsoleLogin

  condition: |
    event.responseElements.ConsoleLogin == "Success" AND
    geo_lookup(event.sourceIPAddress).country NOT IN
      historical_countries(event.userIdentity.arn, 30d)

  severity: high
  response:
    - notify: security-team
    - create_ticket: true
    - enrich: threat_intel_lookup(event.sourceIPAddress)
```

**Persistence: Backdoor IAM User**

```yaml
# Detection: IAM user created with console access and access keys
rule:
  name: "IAM User with Multiple Access Methods"
  description: "New IAM user created with both console password and access keys"
  mitre_attack:
    tactic: Persistence
    technique: T1136.003 (Create Account: Cloud Account)

  data_source: cloudtrail
  correlation:
    window: 10m
    events:
      - event_name: CreateUser
      - event_name: CreateLoginProfile
      - event_name: CreateAccessKey
    join_key: requestParameters.userName

  severity: critical
  response:
    - notify: security-team
    - disable_user: event.requestParameters.userName
    - create_incident: true
```

**Privilege Escalation: Policy Attachment**

```yaml
# Detection: Sensitive policy attached to user or role
rule:
  name: "Administrative Policy Attachment"
  description: "Admin or privileged policy attached to IAM principal"
  mitre_attack:
    tactic: Privilege Escalation
    technique: T1098.003 (Additional Cloud Roles)

  data_source: cloudtrail
  event_names:
    - AttachUserPolicy
    - AttachRolePolicy
    - PutUserPolicy
    - PutRolePolicy

  condition: |
    event.requestParameters.policyArn IN [
      "arn:aws:iam::aws:policy/AdministratorAccess",
      "arn:aws:iam::aws:policy/IAMFullAccess",
      "arn:aws:iam::aws:policy/PowerUserAccess"
    ] OR
    contains(event.requestParameters.policyDocument, '"Effect": "Allow"') AND
    contains(event.requestParameters.policyDocument, '"Action": "*"')

  severity: critical
```

**Defense Evasion: CloudTrail Disabled**

```yaml
# Detection: CloudTrail logging stopped or deleted
rule:
  name: "CloudTrail Tampering"
  description: "CloudTrail trail stopped, deleted, or modified"
  mitre_attack:
    tactic: Defense Evasion
    technique: T1562.008 (Disable Cloud Logs)

  data_source: cloudtrail
  event_names:
    - StopLogging
    - DeleteTrail
    - UpdateTrail
    - PutEventSelectors

  severity: critical
  response:
    - notify: security-team
    - page: on-call
    - restore_logging: true
```

**Exfiltration: Unusual S3 Access**

```yaml
# Detection: Large volume S3 data access
rule:
  name: "Bulk S3 Data Access"
  description: "Unusually high volume of S3 GetObject calls"
  mitre_attack:
    tactic: Exfiltration
    technique: T1530 (Data from Cloud Storage)

  data_source: cloudtrail
  event_name: GetObject

  aggregation:
    window: 1h
    group_by: [userIdentity.arn, requestParameters.bucketName]
    threshold:
      count: 1000
      bytes_transferred: 1GB

  baseline:
    period: 30d
    deviation: 3_standard_deviations

  severity: high
```

## Native Cloud Detection Services

Each major cloud provider offers built-in threat detection capabilities. These serve as a foundation that third-party CDR solutions build upon.

### AWS GuardDuty

GuardDuty analyzes CloudTrail, VPC Flow Logs, and DNS logs to detect threats:

```bash
# Enable GuardDuty
aws guardduty create-detector --enable

# List findings by severity
aws guardduty list-findings \
  --detector-id $(aws guardduty list-detectors --query 'DetectorIds[0]' --output text) \
  --finding-criteria '{"Criterion":{"severity":{"Gte":7}}}' \
  --query 'FindingIds'

# Get finding details
aws guardduty get-findings \
  --detector-id $DETECTOR_ID \
  --finding-ids $FINDING_ID \
  --query 'Findings[].{Type:Type,Severity:Severity,Title:Title,Description:Description}'

# Export findings to S3 for analysis
aws guardduty create-publishing-destination \
  --detector-id $DETECTOR_ID \
  --destination-type S3 \
  --destination-properties DestinationArn=arn:aws:s3:::security-findings-bucket
```

Common GuardDuty finding types to prioritize:

```text
Critical Findings:
├── UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS
├── Trojan:EC2/DNSDataExfiltration
├── CryptoCurrency:EC2/BitcoinTool.B!DNS
└── Backdoor:EC2/C&CActivity.B!DNS

High Findings:
├── Recon:IAMUser/UserPermissions
├── UnauthorizedAccess:IAMUser/ConsoleLoginSuccess.B
├── Discovery:S3/MaliciousIPCaller
└── Exfiltration:S3/ObjectRead.Unusual
```

### Microsoft Defender for Cloud

```bash
# List security alerts
az security alert list \
  --query "[?alertSeverity=='High']" \
  --output table

# Get alert details
az security alert show \
  --name $ALERT_NAME \
  --resource-group $RESOURCE_GROUP

# Configure alert notifications
az security contact create \
  --email security-team@company.com \
  --alert-notifications on \
  --alerts-admins on
```

### GCP Security Command Center

```bash
# List high-severity findings
gcloud scc findings list \
  --organization=$ORG_ID \
  --filter='severity="HIGH" OR severity="CRITICAL"' \
  --format='table(finding.name,finding.category,finding.severity,finding.eventTime)'

# Get finding details
gcloud scc findings describe $FINDING_NAME \
  --source=$SOURCE_ID \
  --organization=$ORG_ID

# Create notification config for real-time alerts
gcloud scc notifications create security-alerts \
  --organization=$ORG_ID \
  --pubsub-topic=projects/$PROJECT/topics/scc-notifications \
  --filter='severity="HIGH" OR severity="CRITICAL"'
```

## Agent-Based vs Agentless Detection

CDR solutions take two fundamental approaches to collecting runtime data, each with distinct tradeoffs.

**Agentless detection** analyzes cloud provider APIs, audit logs, and periodic snapshots. It requires no deployment on workloads and provides immediate coverage, but visibility is limited to what cloud APIs expose. Solutions like Wiz and Orca Security pioneered this approach.

**Agent-based detection** deploys sensors on workloads that capture runtime behavior—process execution, network connections, file access. This provides deeper visibility but requires deployment and management overhead. Solutions like CrowdStrike, SentinelOne, and Sysdig take this approach.

```text
Comparison: Agent vs Agentless CDR
──────────────────────────────────────────────────────────────
Capability              Agentless       Agent-Based
──────────────────────────────────────────────────────────────
Deployment effort       Minimal         Significant
Coverage speed          Hours           Days to weeks
Runtime visibility      Limited         Deep
Process monitoring      No              Yes
File integrity          Snapshot        Real-time
Network flows           VPC logs only   Full capture
Memory analysis         No              Yes
Container visibility    API-based       Full runtime
Performance impact      None             1-3% CPU
Evasion resistance      Lower           Higher
──────────────────────────────────────────────────────────────
```

Most mature security programs deploy both: agentless for broad coverage and rapid visibility, agent-based for critical workloads requiring deep runtime protection.

## Response Automation

Detection without response is just expensive logging. CDR platforms integrate with cloud provider APIs to enable automated containment and remediation.

### AWS Response Actions

```python
# automated_response.py
import boto3
from datetime import datetime

class CloudResponseActions:
    def __init__(self):
        self.iam = boto3.client('iam')
        self.ec2 = boto3.client('ec2')
        self.lambda_client = boto3.client('lambda')

    def disable_iam_user(self, username: str, reason: str):
        """Disable compromised IAM user by removing access."""
        # Delete access keys
        keys = self.iam.list_access_keys(UserName=username)
        for key in keys['AccessKeyMetadata']:
            self.iam.delete_access_key(
                UserName=username,
                AccessKeyId=key['AccessKeyId']
            )

        # Delete login profile (console access)
        try:
            self.iam.delete_login_profile(UserName=username)
        except self.iam.exceptions.NoSuchEntityException:
            pass

        # Attach deny-all policy
        deny_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Deny",
                "Action": "*",
                "Resource": "*"
            }]
        }
        self.iam.put_user_policy(
            UserName=username,
            PolicyName='SecurityIncident-DenyAll',
            PolicyDocument=json.dumps(deny_policy)
        )

        return {
            'action': 'disable_user',
            'username': username,
            'reason': reason,
            'timestamp': datetime.utcnow().isoformat()
        }

    def isolate_ec2_instance(self, instance_id: str, reason: str):
        """Isolate compromised EC2 by replacing security group."""
        # Create isolation security group if needed
        vpc_id = self.ec2.describe_instances(
            InstanceIds=[instance_id]
        )['Reservations'][0]['Instances'][0]['VpcId']

        isolation_sg = self._get_or_create_isolation_sg(vpc_id)

        # Replace security groups
        self.ec2.modify_instance_attribute(
            InstanceId=instance_id,
            Groups=[isolation_sg]
        )

        # Tag instance
        self.ec2.create_tags(
            Resources=[instance_id],
            Tags=[
                {'Key': 'SecurityStatus', 'Value': 'Isolated'},
                {'Key': 'IsolationReason', 'Value': reason},
                {'Key': 'IsolationTime', 'Value': datetime.utcnow().isoformat()}
            ]
        )

        return {
            'action': 'isolate_instance',
            'instance_id': instance_id,
            'isolation_sg': isolation_sg,
            'timestamp': datetime.utcnow().isoformat()
        }

    def revoke_iam_role_sessions(self, role_name: str):
        """Revoke all active sessions for a compromised role."""
        self.iam.put_role_policy(
            RoleName=role_name,
            PolicyName='RevokeOlderSessions',
            PolicyDocument=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Deny",
                    "Action": "*",
                    "Resource": "*",
                    "Condition": {
                        "DateLessThan": {
                            "aws:TokenIssueTime": datetime.utcnow().isoformat()
                        }
                    }
                }]
            })
        )

    def _get_or_create_isolation_sg(self, vpc_id: str) -> str:
        """Get or create security group that blocks all traffic."""
        sg_name = 'security-incident-isolation'

        try:
            response = self.ec2.describe_security_groups(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'group-name', 'Values': [sg_name]}
                ]
            )
            if response['SecurityGroups']:
                return response['SecurityGroups'][0]['GroupId']
        except:
            pass

        # Create isolation security group (no ingress or egress rules)
        response = self.ec2.create_security_group(
            GroupName=sg_name,
            Description='Isolation SG for security incidents - blocks all traffic',
            VpcId=vpc_id
        )
        sg_id = response['GroupId']

        # Remove default egress rule
        self.ec2.revoke_security_group_egress(
            GroupId=sg_id,
            IpPermissions=[{
                'IpProtocol': '-1',
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }]
        )

        return sg_id
```

### SOAR Integration

CDR platforms typically integrate with Security Orchestration, Automation, and Response (SOAR) platforms for complex response workflows:

```yaml
# Example SOAR playbook for credential compromise
playbook:
  name: "Respond to Compromised IAM Credentials"
  trigger:
    source: guardduty
    finding_type: "UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration"

  steps:
    - name: enrich_finding
      action: threat_intel_lookup
      input:
        ip_address: "{{ finding.service.action.awsApiCallAction.remoteIpDetails.ipAddressV4 }}"

    - name: disable_credentials
      action: aws.iam.disable_access_key
      input:
        access_key_id: "{{ finding.resource.accessKeyDetails.accessKeyId }}"

    - name: revoke_sessions
      action: aws.iam.revoke_role_sessions
      input:
        role_name: "{{ finding.resource.accessKeyDetails.principalId | extract_role_name }}"

    - name: create_ticket
      action: jira.create_issue
      input:
        project: SEC
        issue_type: Incident
        summary: "Compromised IAM credentials - {{ finding.resource.accessKeyDetails.userName }}"
        description: |
          GuardDuty detected credential exfiltration.
          User: {{ finding.resource.accessKeyDetails.userName }}
          Source IP: {{ finding.service.action.awsApiCallAction.remoteIpDetails.ipAddressV4 }}
          Actions taken: Access key disabled, sessions revoked

    - name: notify_team
      action: slack.post_message
      input:
        channel: "#security-incidents"
        message: "🚨 Credential compromise detected and contained. Ticket: {{ steps.create_ticket.output.key }}"
```

## Measuring CDR Effectiveness

CDR value is measured through detection and response metrics:

```text
Key Performance Indicators
──────────────────────────────────────────────────────────────
Detection Metrics:
├── Mean Time to Detect (MTTD): Time from attack start to alert
├── Detection Coverage: % of MITRE ATT&CK techniques detected
├── True Positive Rate: Valid alerts / Total alerts
├── False Positive Rate: Invalid alerts / Total alerts
└── Detection Latency: Time from event to alert generation

Response Metrics:
├── Mean Time to Respond (MTTR): Time from alert to containment
├── Mean Time to Remediate: Time from alert to full resolution
├── Automation Rate: % of alerts with automated response
└── Containment Success Rate: Effective containments / Attempts

Operational Metrics:
├── Alert Volume: Alerts per day/week
├── Alert Fatigue Index: Ignored alerts / Total alerts
├── Investigation Time: Analyst hours per incident
└── Coverage Gaps: Unmonitored resources / Total resources
──────────────────────────────────────────────────────────────
```

## Building a CDR Program

Organizations implementing CDR should follow a phased approach:

**Phase 1: Foundation** - Enable cloud provider native detection (GuardDuty, Defender, SCC). Configure audit logging across all accounts and subscriptions. Establish baseline alert routing to security team.

**Phase 2: Detection Engineering** - Map critical assets to detection requirements. Develop custom detection rules for organization-specific threats. Implement correlation across cloud providers if multi-cloud.

**Phase 3: Response Automation** - Build automated containment playbooks for high-confidence detections. Integrate with ticketing and notification systems. Establish escalation procedures.

**Phase 4: Continuous Improvement** - Conduct purple team exercises to test detection coverage. Analyze false positive patterns and tune rules. Expand detection coverage based on threat intelligence.

The organizations that get value from CDR treat it as an ongoing program, not a product deployment. Detection rules require continuous tuning. New attack techniques require new detections. Response playbooks need regular testing. The technology is only as effective as the processes and people operating it.

---

## Further Reading

- [MITRE ATT&CK Cloud Matrix](https://attack.mitre.org/matrices/enterprise/cloud/)
- [AWS GuardDuty Documentation](https://docs.aws.amazon.com/guardduty/)
- [Microsoft Defender for Cloud](https://docs.microsoft.com/en-us/azure/defender-for-cloud/)
- [GCP Security Command Center](https://cloud.google.com/security-command-center/docs)
- [CISA Cloud Security Technical Reference Architecture](https://www.cisa.gov/cloud-security-technical-reference-architecture)
