---
title: "DNS Encryption Explained: DoT, DoH, and DoQ for Network Engineers"
slug: demystifying-dns-over-tls-dot-and-dns-over-https-doh-what-yo
description: Your DNS queries are visible to everyone between you and your resolver. Learn how DoT, DoH, and DoQ encrypt DNS traffic—with practical configuration and troubleshooting guidance for 2025.
date: 2025-01-07
category: Network Security
tags:
  - DNS
  - DoT
  - DoH
  - DoQ
  - Encrypted DNS
  - Network Security
  - Privacy
image: /images/blog/demystifying-dns-over-tls-dot-and-dns-over-https-doh-what-yo-0.png
featured: false
draft: false
---

## Why Your DNS Traffic Is a Privacy Problem

Every time you type a URL, your device sends a DNS query to translate that domain name into an IP address. By default, these queries travel as plaintext UDP packets, readable by anyone positioned to observe your network traffic—your ISP, corporate network administrators, public WiFi operators, or attackers performing man-in-the-middle interception.

This isn't theoretical. ISPs routinely log DNS queries for analytics and advertising purposes. Some inject ads into DNS responses. Others sell browsing data to third parties. In countries with internet censorship, DNS monitoring enables content blocking at scale.

Three encryption protocols address this exposure:

- **DNS over TLS (DoT)** — Wraps DNS in TLS encryption on port 853
- **DNS over HTTPS (DoH)** — Embeds DNS within HTTPS traffic on port 443
- **DNS over QUIC (DoQ)** — Uses QUIC's built-in encryption with lower latency

Each protects query privacy but with different tradeoffs for detectability, performance, and network management.

## The Regulatory Push for Encrypted DNS

On January 17, 2025, the US government issued an Executive Order requiring federal agencies to implement DoH or DoT within 180 days. This mandate signals that encrypted DNS is transitioning from privacy enhancement to compliance requirement.

Enterprise organizations should anticipate similar requirements cascading into private sector frameworks. If you're building network architecture today, planning for encrypted DNS isn't optional—it's risk management.

## Quick Reference: DoT vs DoH vs DoQ

| Aspect | DoT | DoH | DoQ |
|--------|-----|-----|-----|
| **Port** | 853 (TCP) | 443 (TCP) | 853 (UDP) |
| **Encryption** | TLS 1.2/1.3 | TLS via HTTPS | TLS 1.3 via QUIC |
| **Traffic Visibility** | Identifiable as DNS | Blends with web traffic | Identifiable as QUIC |
| **Blocking Ease** | Easy (distinct port) | Difficult (shared with HTTPS) | Moderate |
| **Latency** | Higher (TCP+TLS handshake) | Moderate | Lowest (0-RTT possible) |
| **Browser Support** | Limited | Widespread | Emerging |
| **Enterprise Preference** | Higher (monitorable) | Lower (harder to inspect) | Emerging |
| **RFC Standard** | RFC 7858 (2016) | RFC 8484 (2018) | RFC 9250 (2022) |

## How DNS Resolution Works (Brief Refresher)

Before examining encryption, here's the lookup process your queries traverse:

```
Browser → OS Cache → Recursive Resolver → Root Server → TLD Server → Authoritative Server → IP Address
```

**Four server types participate:**

1. **Recursive Resolver**: Your ISP's DNS server (or a public resolver like 1.1.1.1). It receives your query and does the work of finding the answer.

2. **Root Nameserver**: Thirteen IP addresses (operated by ICANN, Verisign, NASA, and others) that direct queries to the appropriate TLD server.

3. **TLD Nameserver**: Handles top-level domains (.com, .org, .net, country codes). Returns the authoritative nameserver for the specific domain.

4. **Authoritative Nameserver**: Holds the actual DNS records for a domain. Returns the final A/AAAA record with the IP address.

Caching occurs at multiple levels (browser, OS, resolver) to avoid repeating this process for every query. TTL values on DNS records control cache duration.

> **Key Point**: Encryption protects the connection between your device and the recursive resolver. The resolver's queries to root/TLD/authoritative servers may still be unencrypted unless you run your own resolver.

## DNS over TLS (DoT): How It Works

DoT wraps standard DNS queries inside a TLS tunnel on TCP port 853.

**Connection Process:**

1. Client initiates TCP connection to resolver on port 853
2. TLS handshake authenticates the resolver (certificate validation)
3. DNS query transmitted over encrypted channel
4. Resolver returns encrypted response
5. Connection may persist for subsequent queries (connection reuse)

**Advantages:**

- Clear separation of DNS traffic from other protocols
- Network administrators can monitor that encrypted DNS is occurring (even if they can't read queries)
- Straightforward to implement resolver-side

**Disadvantages:**

- Port 853 is frequently blocked on corporate networks and public WiFi
- Distinct port makes DoT traffic easy to identify and throttle
- TCP overhead adds latency compared to traditional UDP DNS

**Testing DoT with kdig:**

```bash
# Query using DNS over TLS
kdig @1.1.1.1 +tls example.com

# Verify TLS certificate details
kdig @1.1.1.1 +tls +tls-ca example.com
```

## DNS over HTTPS (DoH): How It Works

DoH embeds DNS queries within standard HTTPS POST or GET requests to a resolver endpoint (typically `/dns-query`).

**Connection Process:**

1. Client opens HTTPS connection to resolver on port 443
2. TLS handshake (same as any HTTPS website)
3. DNS query sent as HTTP request body (wire format or JSON)
4. Resolver returns DNS response in HTTP response
5. Connection reused for subsequent queries

**Advantages:**

- Virtually impossible to block without breaking all HTTPS traffic
- Works through corporate proxies and firewalls that allow HTTPS
- Built into major browsers (Chrome, Firefox, Edge, Safari)
- Can leverage existing HTTPS infrastructure (CDNs, load balancers)

**Disadvantages:**

- Harder for network administrators to monitor or filter
- Bypasses enterprise DNS policies if browser uses external resolver
- Debugging requires HTTPS traffic inspection tooling

**Testing DoH with curl:**

```bash
# Query using DNS over HTTPS (wire format)
curl -H "accept: application/dns-message" \
     "https://1.1.1.1/dns-query?dns=AAABAAABAAAAAAAAB2V4YW1wbGUDY29tAAABAAE"

# Using cloudflared for easier testing
cloudflared proxy-dns --port 5053 --upstream https://1.1.1.1/dns-query
dig @127.0.0.1 -p 5053 example.com
```

## DNS over QUIC (DoQ): The Emerging Option

DoQ, standardized in RFC 9250 (2022), uses the QUIC transport protocol—the same foundation as HTTP/3. QUIC builds TLS 1.3 encryption directly into the transport layer.

**Advantages:**

- Lowest latency (0-RTT connection establishment possible)
- Better handling of packet loss than TCP-based protocols
- Connection migration survives network changes (useful for mobile)
- Multiplexing without head-of-line blocking

**Disadvantages:**

- Limited resolver support (AdGuard DNS, NextDNS, some others)
- No browser integration yet
- Requires client software that supports DoQ
- Uses UDP, which some networks restrict

**Current DoQ Resolvers:**

- AdGuard DNS: `quic://dns.adguard.com`
- NextDNS: `quic://dns.nextdns.io`

## Browser and OS Support (2025)

### Browser DoH Support

| Browser | DoH Status | Default Resolver |
|---------|------------|------------------|
| Chrome 83+ | Enabled by default (US, UK, Canada, Germany, France, Japan) | System resolver if DoH-capable |
| Firefox 83+ | Enabled by default (US) | Cloudflare |
| Safari | Supported (macOS 11.3+, iOS 14.5+) | Configuration profile required |
| Edge 83+ | Supported (not default) | Manual configuration |

### Operating System Configuration

**Windows 11:**

```
Settings → Network & Internet → Wi-Fi/Ethernet → DNS Server Assignment → Edit
Select "Encrypted only (DNS over HTTPS)" or "Encrypted preferred"
```

**macOS (Monterey+):**

Requires configuration profile (.mobileconfig) to enable DoH/DoT system-wide.

**Android 9+:**

```
Settings → Network & Internet → Private DNS
Enter hostname: dns.google (or other DoT resolver)
```

**iOS 14+:**

Requires configuration profile or apps like 1.1.1.1 WARP, DNSCloak, or NextDNS.

## Enterprise Implementation Considerations

### When to Choose DoT

DoT works better for enterprise environments where:

- Network administrators need visibility into DNS protocol usage
- Security monitoring requires distinguishing DNS from web traffic
- Compliance frameworks require auditable DNS logging
- Internal DoT resolvers can be deployed and managed

### When to Choose DoH

DoH suits environments where:

- Users connect from networks you don't control (remote workers, public WiFi)
- Firewall/proxy restrictions would block DoT
- Browser-level deployment is preferred over system-wide configuration
- Privacy from network-level observers is prioritized

### Active Directory Warning

> **Critical**: Windows Active Directory domain services rely heavily on DNS and don't support encrypted DNS for domain queries. Domain-joined machines should NOT enable "Require DoH" for their domain DNS servers. Consider IPsec-based connection security for internal DNS traffic instead.

### Split-Horizon DNS Challenges

If your organization uses split-horizon DNS (different responses for internal vs external queries), DoH can break internal resolution when browsers bypass your corporate resolver. Solutions include:

- Deploying internal DoH resolvers
- Using browser policies to disable DoH or specify internal resolver
- Implementing DNS filtering that intercepts DoH traffic

## Recommended Resolvers

| Provider | DoT | DoH | DoQ | Privacy Policy |
|----------|-----|-----|-----|----------------|
| Cloudflare (1.1.1.1) | `1.1.1.1:853` | `https://1.1.1.1/dns-query` | No | No logging of source IP |
| Google (8.8.8.8) | `8.8.8.8:853` | `https://dns.google/dns-query` | No | Logs for 24-48 hours |
| Quad9 (9.9.9.9) | `9.9.9.9:853` | `https://dns.quad9.net/dns-query` | No | No logging, malware blocking |
| NextDNS | Custom | Custom | Yes | Configurable logging |
| AdGuard | `94.140.14.14:853` | `https://dns.adguard.com/dns-query` | Yes | No logging, ad blocking |

## Troubleshooting Common Issues

### DoT Connection Failures

**Symptom**: DNS resolution fails when DoT is enabled

**Checks:**

```bash
# Verify port 853 is reachable
nc -zv 1.1.1.1 853

# Test TLS handshake
openssl s_client -connect 1.1.1.1:853

# Check for certificate errors in system logs
```

**Common causes:**

- Port 853 blocked by firewall/ISP
- Certificate validation failure (clock skew, missing root CA)
- Resolver doesn't support DoT

### DoH Not Working

**Symptom**: Browser still using plaintext DNS

**Checks:**

- Verify DoH is enabled in browser settings
- Check if enterprise policy disables DoH
- Confirm resolver supports DoH at expected endpoint

**Firefox diagnostic:**

```
about:networking#dns
```

Look for "TRR" (Trusted Recursive Resolver) status.

**Chrome diagnostic:**

```
chrome://net-internals/#dns
```

### Performance Degradation

**Symptom**: Pages load slower with encrypted DNS

**Causes:**

- Resolver geographically distant
- Connection reuse not working (new TLS handshake per query)
- Resolver overloaded

**Solution**: Try alternative resolvers; use dig with timing to compare:

```bash
dig @1.1.1.1 example.com +stats | grep "Query time"
```

## Implementation Priority

For organizations beginning encrypted DNS adoption:

1. **Audit current DNS infrastructure**: Identify all resolvers, understand query patterns, document split-horizon requirements

2. **Start with DoT for managed devices**: Easier to monitor, clearer separation from web traffic

3. **Deploy internal DoH resolver**: Gives browser DoH benefits while maintaining organizational control

4. **Exclude domain-joined machines**: Keep AD DNS queries on traditional DNS with IPsec protection

5. **Monitor for bypass attempts**: Users may configure personal DoH resolvers; decide whether to allow or block

6. **Plan for DoQ**: As support matures, QUIC's latency benefits will make it attractive for performance-sensitive applications

---

## Further Reading

- [RFC 7858: DNS over TLS](https://datatracker.ietf.org/doc/html/rfc7858)
- [RFC 8484: DNS over HTTPS](https://datatracker.ietf.org/doc/html/rfc8484)
- [RFC 9250: DNS over QUIC](https://datatracker.ietf.org/doc/html/rfc9250)
- [Cloudflare: DNS over TLS vs DNS over HTTPS](https://www.cloudflare.com/learning/dns/dns-over-tls/)
- [Microsoft: DoH Client Support on Windows Server 2022](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support)
