---
title: "Infrastructure as Code (IaC) vs. Configuration as Code (CaC): Understanding the Differences"
slug: infrastructure-as-code-iac-vs-configuration-as-code-cac-unra
description: A comprehensive guide to Infrastructure as Code and Configuration as Code. Learn the key differences between IaC tools like Terraform, Pulumi, and OpenTofu versus CaC tools like Ansible and Chef, with practical examples and best practices.
date: 2024-01-28
updated: 2026-01-06
category: DevOps
tags:
  - Infrastructure as Code
  - Configuration Management
  - Terraform
  - Ansible
  - DevOps
  - GitOps
  - Platform Engineering
image: https://images.seanfraser.io/InfrasAsCode.jpg
imageAlt: Infrastructure as Code Workflow Diagram
featured: false
draft: false
---

Infrastructure as Code (IaC) and Configuration as Code (CaC) represent two foundational approaches to automating IT operations. While often discussed together, they serve distinct purposes in the software delivery lifecycle. IaC manages the provisioning of infrastructure resources—servers, networks, storage, and cloud services—while CaC handles the configuration of software and applications running on that infrastructure.

Understanding when to use each approach, which tools fit your requirements, and how they work together is essential for building reliable, scalable, and maintainable systems. This guide examines both methodologies in depth, covering the current tool landscape, practical implementation patterns, and emerging practices like GitOps and Platform Engineering that are reshaping how organizations approach infrastructure automation.

## Understanding the Fundamentals

Before diving into specific tools and practices, it's important to establish clear definitions for these two complementary approaches.

### What is Infrastructure as Code (IaC)?

Infrastructure as Code is the practice of managing and provisioning computing infrastructure through machine-readable definition files rather than manual processes or interactive configuration tools. IaC treats infrastructure—virtual machines, networks, load balancers, databases, and cloud services—as software artifacts that can be versioned, tested, and deployed using the same practices applied to application code.

The core principle of IaC is **declarative infrastructure**: you define the desired end state of your infrastructure, and the IaC tool determines how to achieve that state. If a resource exists but differs from the definition, the tool modifies it. If a resource doesn't exist, the tool creates it. If a resource exists but shouldn't, the tool removes it.

### What is Configuration as Code (CaC)?

Configuration as Code focuses on managing the configuration of systems and applications through code. While IaC provisions the infrastructure itself, CaC handles what happens after that infrastructure exists—installing software packages, configuring services, managing users and permissions, and ensuring systems remain in their desired configuration state.

CaC tools enforce **configuration consistency** across environments, ensuring that development, staging, and production systems are configured identically. This eliminates "configuration drift" where systems gradually diverge from their intended state due to manual changes or ad-hoc fixes.

### The Key Distinction

The simplest way to understand the difference:

- **IaC answers**: "What infrastructure do I need?"
- **CaC answers**: "How should that infrastructure be configured?"

In practice, IaC provisions an EC2 instance, while CaC installs and configures nginx on that instance. IaC creates a Kubernetes cluster, while CaC deploys and configures applications within it.

## Infrastructure as Code: Deep Dive

IaC has evolved significantly since its early days of shell scripts and ad-hoc automation. Today's IaC landscape includes purpose-built tools offering declarative syntax, state management, and multi-cloud support.

### Core IaC Principles

**Declarative vs. Imperative**: Most modern IaC tools use declarative approaches where you specify the desired end state rather than the steps to achieve it. This contrasts with imperative scripting where you explicitly define each action (create this, then modify that, then delete this).

**Idempotency**: IaC operations should be idempotent—running the same configuration multiple times produces the same result. This enables safe re-execution and makes automation more reliable.

**Version Control**: IaC definitions live in version control systems alongside application code. This provides history, enables collaboration, and supports code review for infrastructure changes.

**State Management**: IaC tools track the current state of managed infrastructure, comparing it against desired state to determine necessary changes. This state must be stored reliably and accessed consistently.

### The IaC Tool Landscape

#### Terraform and OpenTofu

**Terraform**, created by HashiCorp, has been the dominant IaC tool for years. It uses HashiCorp Configuration Language (HCL) to define infrastructure declaratively and supports hundreds of providers for cloud platforms, SaaS services, and on-premises infrastructure.

```hcl
# Terraform example: AWS EC2 instance with security group
resource "aws_security_group" "web" {
  name        = "web-server-sg"
  description = "Allow HTTP and HTTPS traffic"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "web" {
  ami                    = "ami-0c55b159cbfafe1f0"
  instance_type          = "t3.medium"
  vpc_security_group_ids = [aws_security_group.web.id]
  subnet_id              = var.subnet_id

  tags = {
    Name        = "web-server"
    Environment = var.environment
  }
}
```

In August 2023, HashiCorp changed Terraform's license from the Mozilla Public License (MPL) to the Business Source License (BSL 1.1). This prompted the open-source community to create **OpenTofu**, a fork that maintains the MPL 2.0 license. OpenTofu is now a Linux Foundation project with backing from major infrastructure companies. For new projects, organizations must now choose between the HashiCorp-controlled Terraform or the community-governed OpenTofu—both offer nearly identical functionality but differ in licensing and governance.

#### Pulumi

**Pulumi** takes a different approach by allowing infrastructure definition in general-purpose programming languages including TypeScript, Python, Go, C#, and Java. This appeals to developers who prefer familiar programming constructs over domain-specific languages like HCL.

```typescript
// Pulumi example: AWS EC2 instance with security group (TypeScript)
import * as aws from "@pulumi/aws";

const securityGroup = new aws.ec2.SecurityGroup("web-sg", {
  description: "Allow HTTP and HTTPS traffic",
  vpcId: config.vpcId,
  ingress: [
    { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
    { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
  ],
  egress: [
    { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] },
  ],
});

const webServer = new aws.ec2.Instance("web-server", {
  ami: "ami-0c55b159cbfafe1f0",
  instanceType: "t3.medium",
  vpcSecurityGroupIds: [securityGroup.id],
  subnetId: config.subnetId,
  tags: {
    Name: "web-server",
    Environment: config.environment,
  },
});

export const instanceId = webServer.id;
export const publicIp = webServer.publicIp;
```

Pulumi's approach enables loops, conditionals, functions, and type checking using native language features rather than HCL's limited constructs. This can reduce boilerplate for complex infrastructure patterns.

#### Cloud-Native IaC: AWS CDK, Azure Bicep, and Google Cloud Deployment Manager

Major cloud providers offer their own IaC solutions:

**AWS Cloud Development Kit (CDK)** lets you define AWS infrastructure using TypeScript, Python, Java, C#, or Go. CDK synthesizes CloudFormation templates, combining high-level abstractions with the full power of programming languages.

**Azure Bicep** is Microsoft's domain-specific language for deploying Azure resources, designed as a more readable alternative to ARM templates with better tooling and developer experience.

**Google Cloud Deployment Manager** uses YAML or Python to define GCP resources declaratively.

These cloud-specific tools offer deep integration with their respective platforms but don't provide multi-cloud capabilities.

#### Kubernetes-Native IaC: Crossplane

**Crossplane** extends Kubernetes to manage infrastructure through Kubernetes-native APIs. Instead of running a separate IaC tool, you define infrastructure as Kubernetes custom resources that Crossplane provisions and manages. This approach appeals to organizations standardizing on Kubernetes as their control plane for everything.

```yaml
# Crossplane example: AWS RDS instance
apiVersion: database.aws.crossplane.io/v1beta1
kind: RDSInstance
metadata:
  name: production-database
spec:
  forProvider:
    region: us-east-1
    dbInstanceClass: db.t3.medium
    allocatedStorage: 100
    engine: postgres
    engineVersion: "15"
    masterUsername: admin
  writeConnectionSecretToRef:
    name: db-credentials
    namespace: production
```

### State Management

A critical concept in IaC is **state**—the record of what infrastructure the tool has created and currently manages. State serves several purposes:

- **Change detection**: Comparing desired state against actual state to determine necessary changes
- **Dependency tracking**: Understanding relationships between resources for proper creation/deletion ordering
- **Metadata storage**: Recording resource IDs, attributes, and other information needed for updates

For team environments, state must be stored remotely and accessed with locking to prevent concurrent modifications. Common backends include:
- AWS S3 with DynamoDB locking
- Azure Blob Storage
- Google Cloud Storage
- HashiCorp Terraform Cloud
- Spacelift, env0, or other IaC automation platforms

## Configuration as Code: Deep Dive

While IaC provisions infrastructure, CaC manages what runs on that infrastructure. Configuration management tools ensure systems are configured consistently and remain in their desired state over time.

### Core CaC Principles

**Desired State Configuration**: Like IaC, most CaC tools work declaratively. You define how a system should be configured, and the tool enforces that configuration.

**Idempotency**: Running configuration management multiple times should produce the same result without unintended side effects.

**Convergence**: Systems should continuously converge toward their desired state, correcting any drift caused by manual changes or system events.

### The CaC Tool Landscape

#### Ansible

**Ansible** is the most widely adopted CaC tool, known for its agentless architecture and YAML-based playbooks. Ansible connects to managed systems via SSH (or WinRM for Windows) and executes tasks without requiring software installation on target hosts.

```yaml
# Ansible playbook: Configure web server
---
- name: Configure web server
  hosts: webservers
  become: yes
  vars:
    nginx_port: 80
    app_user: webapp

  tasks:
    - name: Install nginx
      ansible.builtin.apt:
        name: nginx
        state: present
        update_cache: yes

    - name: Create application user
      ansible.builtin.user:
        name: "{{ app_user }}"
        shell: /bin/bash
        create_home: yes

    - name: Copy nginx configuration
      ansible.builtin.template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        owner: root
        group: root
        mode: '0644'
      notify: Restart nginx

    - name: Ensure nginx is running
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: yes

  handlers:
    - name: Restart nginx
      ansible.builtin.service:
        name: nginx
        state: restarted
```

Ansible's agentless design simplifies adoption—you only need SSH access to managed systems. Ansible also works well for orchestration tasks beyond configuration, including application deployment and cloud provisioning through its extensive module library.

#### Chef

**Chef** uses a Ruby-based DSL for defining system configurations as "recipes" organized into "cookbooks." Chef follows a client-server architecture where a Chef Server maintains configuration policies and Chef Clients (agents) on managed nodes periodically pull and apply their configurations.

```ruby
# Chef recipe: Configure web server
package 'nginx' do
  action :install
end

user 'webapp' do
  shell '/bin/bash'
  manage_home true
  action :create
end

template '/etc/nginx/nginx.conf' do
  source 'nginx.conf.erb'
  owner 'root'
  group 'root'
  mode '0644'
  notifies :restart, 'service[nginx]', :delayed
end

service 'nginx' do
  action [:enable, :start]
end
```

Chef's Ruby foundation enables complex logic and abstractions but requires Ruby knowledge and more operational overhead than agentless alternatives.

#### Puppet

**Puppet** uses its own declarative language to define system configurations as "manifests." Like Chef, Puppet typically operates in a client-server model with agents periodically enforcing desired state.

```puppet
# Puppet manifest: Configure web server
package { 'nginx':
  ensure => installed,
}

user { 'webapp':
  ensure     => present,
  shell      => '/bin/bash',
  managehome => true,
}

file { '/etc/nginx/nginx.conf':
  ensure  => file,
  content => template('nginx/nginx.conf.erb'),
  owner   => 'root',
  group   => 'root',
  mode    => '0644',
  require => Package['nginx'],
  notify  => Service['nginx'],
}

service { 'nginx':
  ensure  => running,
  enable  => true,
  require => Package['nginx'],
}
```

Puppet excels at managing large fleets of systems with complex interdependencies, though its learning curve and operational requirements are higher than Ansible.

#### SaltStack

**SaltStack** (now owned by VMware) offers both agent-based and agentless operation modes. It uses YAML for state definitions and supports high-speed parallel execution across thousands of systems.

### Agent-Based vs. Agentless

A key architectural decision when selecting CaC tools:

| Aspect | Agent-Based (Chef, Puppet) | Agentless (Ansible) |
|--------|----------------------------|---------------------|
| **Installation** | Requires agent on each managed node | Only needs SSH access |
| **Communication** | Agents poll server or receive pushes | Control node pushes via SSH |
| **Scalability** | Better for very large fleets (10k+ nodes) | Good for most scales |
| **Operational overhead** | Higher—must manage agent lifecycle | Lower—fewer moving parts |
| **Continuous enforcement** | Agents continuously converge state | Runs on-demand or scheduled |

## IaC vs. CaC: Feature Comparison

| Feature | Infrastructure as Code | Configuration as Code |
|---------|------------------------|----------------------|
| **Primary focus** | Provisioning infrastructure | Configuring systems |
| **Scope** | VMs, networks, storage, cloud services | Packages, services, files, users |
| **Execution model** | On-demand provisioning runs | Continuous or scheduled enforcement |
| **State management** | External state file (critical) | Often stateless or agent-maintained |
| **Typical tools** | Terraform, OpenTofu, Pulumi, CDK | Ansible, Chef, Puppet, SaltStack |
| **Example operations** | Create EC2 instance, configure VPC | Install nginx, deploy application |

## When to Use Each Approach

### Use IaC When

- Provisioning cloud resources (compute, storage, networking)
- Managing Kubernetes clusters and cloud services
- Creating reproducible environments across development, staging, and production
- Implementing multi-cloud or hybrid cloud strategies
- Defining infrastructure that changes infrequently

### Use CaC When

- Installing and configuring software on servers
- Managing system users, permissions, and security policies
- Deploying applications and managing their configuration
- Ensuring configuration consistency across a fleet of systems
- Enforcing compliance requirements through continuous configuration

### Use Both Together

Most organizations use IaC and CaC together in a complementary workflow:

1. **IaC provisions infrastructure**: Terraform creates an EC2 instance
2. **CaC configures the system**: Ansible installs and configures application software
3. **Application deployment**: CaC or separate deployment tools deploy application code

This separation of concerns keeps each tool focused on what it does best.

## GitOps: Modern Infrastructure Management

GitOps represents an evolution in how organizations manage infrastructure and applications, using Git as the single source of truth for declarative infrastructure and applications.

### GitOps Principles

1. **Declarative configuration**: All system configurations are expressed declaratively
2. **Version controlled**: Git stores the complete desired state
3. **Automated delivery**: Approved changes are automatically applied
4. **Continuous reconciliation**: Software agents ensure actual state matches desired state

### GitOps Tools

**ArgoCD** is a declarative, GitOps continuous delivery tool for Kubernetes. It monitors Git repositories for changes and automatically syncs Kubernetes clusters to match the desired state defined in Git.

**Flux** (from Weaveworks) provides GitOps for both Kubernetes and infrastructure. Flux continuously reconciles cluster state with configuration in Git, supporting Kustomize, Helm, and plain YAML.

### GitOps Workflow Example

```
┌─────────────┐    Push    ┌─────────────┐   Detect   ┌─────────────┐
│  Developer  │ ─────────▶ │     Git     │ ─────────▶ │   ArgoCD    │
└─────────────┘            └─────────────┘            └─────────────┘
                                                             │
                                                             │ Sync
                                                             ▼
                                                      ┌─────────────┐
                                                      │ Kubernetes  │
                                                      │   Cluster   │
                                                      └─────────────┘
```

GitOps eliminates manual kubectl commands and provides audit trails, rollback capabilities, and self-healing infrastructure.

## Security and Compliance

### Policy-as-Code

Policy-as-Code extends the "as code" paradigm to security and compliance policies, enabling automated enforcement of governance rules.

**Open Policy Agent (OPA)** provides a general-purpose policy engine that integrates with IaC and Kubernetes. Policies written in OPA's Rego language can prevent non-compliant resources from being created.

```rego
# OPA policy: Require encryption for S3 buckets
package terraform.s3

deny[msg] {
  resource := input.resource.aws_s3_bucket[name]
  not resource.server_side_encryption_configuration
  msg := sprintf("S3 bucket '%s' must have server-side encryption enabled", [name])
}
```

**HashiCorp Sentinel** integrates with Terraform Cloud/Enterprise to enforce policies before infrastructure changes are applied.

### IaC Security Scanning

Security scanning tools analyze IaC files for misconfigurations before deployment:

- **Checkov**: Open-source scanner supporting Terraform, CloudFormation, Kubernetes, and more
- **tfsec**: Terraform-specific security scanner
- **Trivy**: Comprehensive scanner covering IaC, containers, and dependencies
- **Snyk IaC**: Commercial scanner with broad IaC support

Example issues these tools detect:
- Publicly accessible S3 buckets
- Unencrypted databases
- Overly permissive security groups
- Missing logging and monitoring
- Hardcoded secrets

### Secrets Management

Both IaC and CaC must handle secrets securely:

- Never commit secrets to version control
- Use secrets management tools (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault)
- Reference secrets dynamically at runtime
- Rotate credentials regularly
- Audit secret access

## Platform Engineering and Internal Developer Platforms

Platform Engineering has emerged as a discipline focused on building internal developer platforms (IDPs) that abstract infrastructure complexity and improve developer productivity.

### The Platform Engineering Approach

Rather than expecting every developer to understand IaC and CaC tools, Platform Engineering teams build self-service platforms that provide:

- **Golden paths**: Pre-approved, well-tested infrastructure patterns
- **Self-service provisioning**: Developers request resources without writing IaC
- **Guardrails**: Policies and constraints that ensure compliance by default
- **Developer portals**: Unified interfaces for service catalogs and documentation

### Tools and Frameworks

**Backstage** (from Spotify) provides an open-source framework for building developer portals. It includes service catalogs, documentation, and extensible plugins for IaC integration.

**Port, Cortex, and OpsLevel** offer commercial developer portal solutions with built-in IaC and CaC integrations.

Platform Engineering represents a maturation of DevOps practices, recognizing that not every team needs deep infrastructure expertise to be productive.

## Best Practices

### Version Control and Collaboration

- Store all IaC and CaC code in version control (Git)
- Use pull requests for code review before changes are applied
- Implement branch protection rules for production configurations
- Maintain clear documentation alongside code

### Testing Infrastructure Code

- **Static analysis**: Lint and validate syntax before execution
- **Unit tests**: Test modules and components in isolation
- **Integration tests**: Validate complete infrastructure configurations
- **Security scanning**: Check for misconfigurations before deployment
- **Plan review**: Review IaC plans before applying changes

### Environment Management

- Use workspaces or separate state files for different environments
- Implement promotion workflows (dev → staging → production)
- Keep environment-specific values in separate variable files
- Ensure parity between environments where appropriate

### Documentation and Standards

- Document module interfaces and expected inputs
- Establish naming conventions for resources
- Create templates for common infrastructure patterns
- Maintain runbooks for operational procedures

## Frequently Asked Questions

### Can I use Terraform and Ansible together?

Yes, this is a common pattern. Terraform provisions infrastructure (VMs, networks, databases), then Ansible configures the software on that infrastructure. Terraform can output inventory information that Ansible consumes, creating a seamless workflow.

### Should I choose Terraform or OpenTofu?

Both tools are functionally equivalent for most use cases. The decision often comes down to licensing and governance preferences. OpenTofu is fully open-source under the Linux Foundation, while Terraform operates under HashiCorp's Business Source License. For new projects, evaluate your organization's policies on open-source licensing.

### Is Pulumi better than Terraform?

Neither is universally "better"—they make different trade-offs. Pulumi appeals to developers who prefer programming languages over DSLs and want IDE support, type checking, and testing frameworks. Terraform's HCL is simpler for infrastructure-focused teams and has a larger ecosystem of modules and providers.

### How do I handle secrets in IaC?

Never store secrets in IaC files or version control. Instead, reference secrets from secure sources at runtime:
- Use secrets management tools (Vault, AWS Secrets Manager)
- Store sensitive values as environment variables
- Use data sources to fetch secrets during execution
- Mark sensitive outputs appropriately

### What's the relationship between GitOps and IaC?

GitOps uses Git as the source of truth for IaC definitions. While traditional IaC workflows involve running tools manually or through CI/CD, GitOps adds continuous reconciliation—agents automatically detect drift from the Git-defined state and correct it. GitOps is particularly popular for Kubernetes environments.

### When should I consider Platform Engineering?

Platform Engineering becomes valuable when:
- Multiple teams need consistent infrastructure patterns
- Developer onboarding is slow due to infrastructure complexity
- Compliance requirements demand standardized configurations
- The organization wants to reduce cognitive load on application developers

## Conclusion

Infrastructure as Code and Configuration as Code are complementary approaches that together enable reliable, repeatable, and secure infrastructure management. IaC handles the provisioning of infrastructure resources, while CaC manages the configuration of systems and applications.

The modern IaC landscape includes Terraform/OpenTofu for multi-cloud environments, Pulumi for programming language-based definitions, and cloud-native tools like AWS CDK and Azure Bicep. For configuration management, Ansible dominates as the agentless choice, while Chef and Puppet serve organizations needing continuous agent-based enforcement.

Emerging practices continue to evolve the field. GitOps brings continuous reconciliation and Git-based workflows to infrastructure management. Policy-as-Code enforces security and compliance automatically. Platform Engineering abstracts complexity behind self-service interfaces. Security scanning integrates early in the development lifecycle.

Organizations adopting these practices gain significant advantages: faster provisioning, consistent environments, reduced manual errors, improved security posture, and better collaboration between development and operations teams. The key is understanding each tool's purpose and selecting the right combination for your specific requirements.

As infrastructure automation matures, the line between IaC and CaC continues to blur through integrated platforms and unified workflows. Regardless of which specific tools you choose, the fundamental principles remain constant: define infrastructure declaratively, version control everything, test before deploying, and continuously enforce desired state.
