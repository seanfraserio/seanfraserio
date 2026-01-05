---
title: "Demystifying DNS over TLS (DoT) and DNS over HTTPS (DoH): What You Need
  to Know"
slug: demystifying-dns-over-tls-dot-and-dns-over-https-doh-what-yo
description: In the changing world of internet security and privacy, two
  acronyms have emerged as beacons of hope to protect our online interactions…
date: 2024-01-16
category: Threat Intelligence
tags: []
image: /images/blog/demystifying-dns-over-tls-dot-and-dns-over-https-doh-what-yo-0.png
featured: false
draft: false
---

In the changing world of internet security and privacy, two acronyms have emerged as beacons of hope to protect our online interactions: DoT (DNS over TLS) and DoH (DNS over HTTPS). Imagine a scenario where every online request you make is like sending a postcard through the mail, visible to anyone with prying eyes. That’s the reality of browsing the Internet without these protocols. However, as we navigate through this era, the importance of DNS queries has become more critical than ever before. This blog post serves as your guide to understanding DoT and DoH’s significance.

You may ask yourself, “Why should I care?” while juggling the complexities of network architecture alongside the need for more internet access. Some argue that the traditional DNS system is not broken, so why bother fixing it? However, in a world where cyber threats are present at every corner, sticking to outdated methods is like leaving your door unlocked in a busy neighborhood.

Dot (DoT) and DNS over HTTPS (DoH) are not upgrades. They are crucial tools that you should have in your cybersecurity toolkit. They work by encrypting your DNS queries, making them invisible to anyone trying to eavesdrop or launch attacks.

This article will first explain what DNS is and how it works. We will then demystify the latest DNS, DoT, and DoH extensions. We’ll explain how these protocols protect your DNS queries from preying eyes. Additionally, we will discuss their differences and explore their impact on network architecture and internet privacy. You’ll gain insights into implementing these protocols in your networks, overcoming common challenges, and making informed decisions about which protocol best aligns with your security objectives.

Join us as we shed light on the role of DoT and DoH in shaping the future of internet security. Whether you’re already familiar with the basics or diving into DNS encryption, this blog post offers an exploration that will equip you with the knowledge to secure your internet interactions better.

### DNS

DNS stands for Domain Name Systems and serves as the Internet’s directory by mapping common names to IP addresses. As you may be aware, the Internet comprises millions of machines, each identified by a numerical IP address. This IP address allows others to connect with the respective machine and vice versa.

However, humans struggle with remembering numbers. Instead, we excel at recalling names. This is where DNS servers come into play, eliminating the need for humans to memorize the IP addresses of their favorite websites. These servers act as a centralized hub, effortlessly mapping easily remembered names like Facebook[dot]com or Walmart[dot]com to dedicated IP addresses.

This mapping process, known as DNS resolution, occurs whenever you access a website on your browser. But what exactly transpires during the DNS resolution process?

To grasp the complete picture, we must familiarize ourselves with the various DNS Servers involved in this intricate process.

#### **DNS Server Types**

There are four types of DNS servers:

- DNS Recursor
- Root Nameserver
- TLD Nameserver
- Authoritative Nameserver

The Domain Name System works in an **inverted tree structure**. The root name server is at the top of the tree, followed by TLDs(Top-level Domains)and **authoritative name servers**.

![](/images/blog/demystifying-dns-over-tls-dot-and-dns-over-https-doh-what-yo-0.png)
DNS Hierarchy
### 1 — DNS Recursor

The DNS recursor serves as a crucial server that receives queries from client machines through applications like web browsers, meanwhile the entire process remains hidden and mysterious.

Similarly, the DNS recursor traverses various DNS servers, diligently seeking the corresponding IP address. It may even make additional requests to other DNS servers to fulfill the DNS query if necessary. This intricate process ensures the client’s request is met with accurate and timely results.

The DNS recursor plays a vital role in the seamless functioning of the Internet. Efficiently locating the necessary IP address enables smooth communication between client machines and the desired online resources. Its tireless efforts behind the scenes ensure users can effortlessly access websites, applications, and other online services.

In essence, the DNS recursor acts as an indispensable intermediary, bridging the gap between client machines and the vast network of DNS servers. Its ability to navigate this intricate web of information makes it an invaluable asset in terms of internet connectivity.

See below an example of the sequence of events:

![](/images/blog/demystifying-dns-over-tls-dot-and-dns-over-https-doh-what-yo-1.png)
DNS Server Request
### 2 — Root Nameserver

The root name server is crucial in translating host names into their corresponding IP addresses. It serves as the initial point of contact for successfully resolving domain names.

When referring to a domain name, the root is denoted by the discreet trailing period (.) that discreetly concludes the name. It is important to note that manually typing this additional period is not a prerequisite, as modern browsers automatically append it for convenience.

From a higher level, the Domain Name System (DNS) administration is structured hierarchically. This hierarchical structure is achieved by implementing distinct managed areas or zones. At the apex of this hierarchy lies the root zone, which serves as the ultimate authority in the DNS infrastructure.

By employing this hierarchical framework, the DNS system ensures efficient management and resolution of domain names.

There are 13 DNS root servers in the DNS system, as shown below.

![](/images/blog/demystifying-dns-over-tls-dot-and-dns-over-https-doh-what-yo-2.png)
DNS Root Servers
However, in today’s technological landscape, each of the 13 IP addresses is supported by multiple servers, utilizing Anycast routing to distribute requests based on load and proximity efficiently.

The operation of these servers lies with various entities, including The Internet Corporation for Assigned Names and Numbers (ICANN), which manages servers for one of the 13 IP addresses. Other crucial organizations, such as NASA, the University of Maryland, and Verisign, also operate some servers.

It is essential to note that, given that root nameservers occupy the highest level of the DNS hierarchy, recursive resolvers cannot directly find them during a DNS lookup.

To address this challenge, every DNS resolver incorporates a pre-established list of the 13 root server IP addresses within its software. Consequently, when a DNS lookup is initiated, the recursive resolver communicates with one of these 13 IP addresses.

### 3 — TLD Nameserver

The subsequent quest for an IP address involves the DNS resolution process, which leads us to the TLD nameserver.

The TLD server, an abbreviation for Top-Level Domain server, can be likened to a specialized section within a library that houses books of a specific genre.

In the realm of DNS, the TLD server is responsible for hosting the final segment of the hostname. In simpler terms, it handles the “com” in google[dot]com.

Essentially, a TLD nameserver maintains information pertaining to all domain names that share a common domain extension, such as .com, .net, or any other.

Administration and operation of TLD nameservers falls under the purview of the Internet Assigned Numbers Authority (IANA), a division of ICANN. The IANA further categorizes TLD servers into two primary groups:

1. Generic top-level domains, including .com, .org, .net, etc.
 2. Country code top-level domains, encompassing .us, .in, .uk, and others.

### 4 — Authoritative Nameservers

The involvement of the Authoritative Nameservers completes the DNS resolution process. After receiving a response from a TLD nameserver, the Recursive Resolver is directed to an authoritative nameserver. This authoritative nameserver is responsible for holding domain-specific information, like that of google[dot]com, and serving it.

![](/images/blog/demystifying-dns-over-tls-dot-and-dns-over-https-doh-what-yo-3.png)
Authoritative DNS Server
The authoritative nameserver is responsible for storing the server's IP address in the DNS A Record or CNAME record, if applicable.

In simpler terms, when the authoritative nameserver has access to the record, it will provide the IP address to the DNS recursive resolver.

There are **three (3)** types of DNS queries:

1. **Recursive Query**:
 In this type of query, the DNS client expects the DNS server, typically a DNS recursive resolver, to find the IP address and complete the task. If the server cannot locate any record, it will return an error message. The client is not concerned with the number of queries the server makes to obtain the result, whether positive or negative.

2. **Iterative Query:**
 In the iterative query approach, the DNS client is satisfied if the DNS server provides the best possible answer. If the DNS server receiving the query does not have a match for the domain name, it will refer the client to a DNS server authorized for a lower level of the namespace. The DNS client then needs to make another query to the referral address, and the process continues with additional DNS servers within the query chain.

3. **Non-recursive Query:**
 The third type of query occurs when a DNS client requests a record from a DNS server that it has access to. This can happen for two reasons: the server is the authoritative server, or the DNS record information exists within its cache.

By understanding these different types of DNS queries, we can better comprehend how the DNS system functions and how information is retrieved.

### Steps in a DNS Lookup

Now, let us delve into the core of this post and gain a comprehensive understanding of the DNS lookup process.

What occurs from a DNS resolution standpoint when you enter www[dot]google[dot]com into your browser?

Below, you will find a visual representation of the entire process.

![](/images/blog/demystifying-dns-over-tls-dot-and-dns-over-https-doh-what-yo-4.png)
DNS Resolution Process
Let’s examine each step in greater detail:

**Step 1**

- The browser sends a DNS query to the operating system.
 — The operating system checks its cache for the IP address.
 — If the IP address is found, everything is in order. If not, the operating system sends a query to the DNS resolver.
 — This query is recursive, meaning the resolver must provide either an IP address or an error.
 — In most cases, the user’s Internet Service Provider provides the DNS resolver.

**Step 2**

- The DNS resolver begins by querying one of the root DNS servers for the IP of [www.google.com.](http://www.google.com.) These root servers consist of a cluster of servers and are associated with 13 IP addresses.
 — This query is not recursive but somewhat iterative. The response must contain an address, even if it is not an exact match.
 — The command “dig +trace www.google.com" visually represents this query trace.

![](/images/blog/demystifying-dns-over-tls-dot-and-dns-over-https-doh-what-yo-5.png)

**Step 3**

- The root servers store the locations of top-level domains, such as .com and .net.
 — Since the root servers do not possess the direct IP information for [www.google.com,](http://www.google.com,) they provide the location of the .com servers.

**Step 4**

- Armed with this information, the resolver queries one of the .com TLD servers for the location of google.com.
 — Like the root servers, each TLD has 4–13 clustered name servers located in various places. As mentioned earlier, two types of TLDs are country-specific and generic.
 — The execution of “dig +trace www.google.com" provides a glimpse of what Step 4 entails.

![](/images/blog/demystifying-dns-over-tls-dot-and-dns-over-https-doh-what-yo-6.png)

**Step 5:**

- The query from the DNS resolver to the TLD is also iterative.
 — The TLD server responds with the IP address of the domain’s nameserver.
 — For instance, although the TLD server may not possess the IP address for google.com, it knows the location of Google’s name servers

**Step 6:**

Finally, the DNS resolver queries one of Google’s nameservers to obtain the IP address of [www.google.com.](http://www.google.com.) Refer to the section below for the output of the dig command.

google.com. 172800 IN NS ns2.google.com.

google.com. 172800 IN NS ns1.google.com.

google.com. 172800 IN NS ns3.google.com.

google.com. 172800 IN NS ns4.google.com.

**Step 7:**

This time, the queried name server possesses the IP address as it serves as the authoritative nameserver for that particular domain. This query can be categorized as a non-recursive query. Consequently, it responds by providing an A or AAAA address record.

**Step 8:**

At this stage, the DNS resolver completes the recursion process and can now furnish the end user’s operating system with an IP address. Please refer to the output below from the dig command.

[www.google.com.](http://www.google.com.) 300 IN A 142.250.194.132

**Steps 9 & 10:**

Equipped with the obtained IP address, the operating system relays it to the browser, which then initiates a TCP connection to load the page using HTTP.

### DNS Caching

Before concluding our discussion, it is crucial to comprehend the role of caching in DNS.

DNS caching involves storing data closer to the client, enabling faster resolution of DNS queries and avoiding unnecessary traversal through the chain.

Two caching locations come into play before the DNS query reaches the DNS resolver.

1 — **Browser DNS Caching**
 Modern web browsers are designed to cache DNS records for a specific duration.

When a request is made for a DNS record, the browser cache is the first location checked for the requested record.

2 — **OS Level DNS Caching**
 This is the second location where a DNS record can be cached.

When a DNS query reaches the operating system, the “stub resolver” checks its cache to determine if it already possesses the record.

If the record is not found, the operating system sends a DNS query (with a recursive flag, as mentioned earlier) to a DNS recursive resolver within the Internet Service Provider.

DNS resolution can be expedited by implementing caching mechanisms at both the browser and operating system levels, resulting in improved overall performance and user experience.

The DNS resolver also maintains its cache. Suppose the resolver does not possess the domain's A records but retains the authoritative nameserver's NS records. In that case, it can directly query those name servers and bypass the root and TLD servers.

Furthermore, caching mechanisms enhance DNS resolution speed and reduce the load on DNS servers. When a DNS record is cached, subsequent queries for the same record can be answered directly from the cache, eliminating the need for additional network requests. This not only saves time but also reduces the amount of network traffic, leading to a more efficient and reliable browsing experience. Additionally, caching mechanisms can mitigate the impact of DNS server outages or slowdowns by serving cached records even when the DNS server is unavailable. Implementing caching mechanisms at multiple levels is crucial for optimizing DNS resolution and ensuring a seamless user experience.

### DOT and DOH

As we mentioned in our opening, DNS stands for Domain Name Systems and serves as the Internet’s directory by mapping common names to IP addresses. This mapping process, known as DNS resolution, occurs whenever you access a website on your browser.

However, by default, DNS queries and responses are sent as text, making them readable by anyone monitoring your network traffic, such as your ISP, government agencies, or malicious individuals. They can tamper with DNS traffic, redirect you to websites, or block access to specific content.

This threatens your security and privacy, especially when using Wi-Fi or living in a country with internet censorship. Fortunately, two standards can help encrypt your DNS traffic and prevent snooping or manipulation: DOT (DNS over TLS) and DOH (DNS over HTTPS).

DOT (DNS, over TLS) and DOH (DNS over HTTPS) are protocols that aim to enhance the security and privacy of DNS communication by implementing encryption and authentication. They ensure that only you and your DNS resolver have access to the information about the websites you visit and that you receive IP addresses. Additionally, these protocols make it more challenging for anyone to block or filter your DNS requests since they resemble HTTPS traffic.

This article section will dive into the workings of DOT and DOH, exploring their creation, practical applications, and use cases. We will also. Contrast these two protocols while discussing their advantages and disadvantages. By the end of this report, you will better understand how DOT and DOH can enhance both the security and privacy of your DNS activities and how they can be integrated into your network engineering projects.

### Understanding How DOT and DOH Work

DOT and DOH employ encryption techniques and authentication mechanisms to safeguard DNS communication. Their primary purpose is to prevent the reading or modification of DNS queries and responses while ensuring that users remain connected to their intended websites. However, each protocol implements these features in different ways.

**DOT**

TLS serves as the protocol utilized by HTTPS websites to ensure communication. DOT adds a layer of TLS encryption on top of the UDP protocol, which transmits DNS queries and responses. DOT also incorporates TCP to address any issues with blocked or unreliable UDP.

To use DOT, users must configure their device or application to connect with a DNS resolver that supports this protocol. Additionally, users need to place trust in the resolver certificate, which is instrumental in authenticating the resolver and preventing any man-in-the-middle attacks. This certificate can be verified using a certificate authority (CA) or key pinning (PKP) mechanism.

When a user sends a DNS query through DOT, their device or application initiates a TLS handshake with the resolver. Through this process, a secure connection is made. The identity of the resolver is verified. Subsequently, the device or application transmits the DNS query over this TLS connection. The resolver then. Processes the query by performing a DNS lookup before sending the corresponding DNS response through the same TLS connection. Finally, upon receiving the response, the device or application terminates its TLS connection.

**DOH**

DOH leverages HTTPS as its foundation for encrypting DNS traffic between users and DNS resolvers. HTTPS itself combines elements from both HTTP and TLS protocols.

HTTP serves as the communication protocol between web browsers and web servers. DOH, on the other hand, incorporates DNS queries and responses into HTTPS messages, giving them the appearance of web traffic.

To utilize DOH, users must configure their devices or applications to use a DNS resolver that supports DOH. Additionally, users must trust the resolver certificate for authentication purposes. To prevent any man-in-the-middle attacks. The resolver certificate can be verified through a certificate authority (CA) or a pinning (PKP) mechanism.

When a user employs DOH to send a DNS query, their device or application initiates an HTTPS request to the resolver. This request includes the DNS query in JSON or wire format. The resolver then receives this request, performs the DNS lookup, and returns the DNS response in the same format as the original query. This response is wrapped within an HTTPS response message. Finally, upon receiving this response message, the device or application extracts and retrieves the DNS data.

DOT and DOH have advantages and disadvantages, depending on one’s perspective and specific use case.

However, there are a few points to consider;

DOT is often favored regarding network security because it enables network administrators to monitor and block DNS queries effectively. This proactive approach helps identify and prevent traffic.

From a privacy standpoint, DOH is preferable as DNS queries are concealed within the stream of HTTPS traffic. This makes it challenging for ISPs, governments, or other third parties to eavesdrop on or restrict DNS requests.

DOT utilizes a port (**853**) for DNS traffic, making it more straightforward to differentiate from types of traffic. However, this also means that DOT can be subject to blocking or throttling measures implemented by firewalls or network policies.

However, DOH leverages the port (**443**) as HTTPS traffic, making it more compatible with existing network infrastructure and less likely to be impeded. However, this also implies that DOH could be more challenging for network administrators to detect and manage effectively.

Regarding performance factors DOT establishes a TLS connection for each DNS query, which introduces some latency and additional overhead in the process. In contrast, DOH can utilize existing HTTPS connections, reducing latency and overhead.

Lastly, implementing DOT requires users to configure their devices or applications with a DNS resolver that supports DOT functionality.

Like a web browser without user configuration, the application can implement DOH.

As you can observe, DOT and DOH have trade-offs and implications for network performance, security, and privacy. You may prefer one over the other depending on your objectives and requirements. Even use both concurrently. The following section will explore some applications and instances where DOT and DOH can be utilized.

Practical applications of DOT and DOH

DOT and DOH both have applicable use cases for end users and enterprises. Uses depending on the situation and user goals. Here are some examples of how DOT and DOH can be employed in scenarios;

**Web browsing**: One of the prevalent uses of DOT and DOH is to enhance the security and privacy of web browsing. Utilizing either DOT or DOH web browsers can prevent ISPs, governments, or other third parties from spying on or censoring the websites users visit. Some web browsers like Microsoft Edge, Firefox, and Chrome have already incorporated DOH as an option or default feature for their users.

However, challenges and debates arise from this, including concerns about the impact on network performance by selecting the DOH resolver and bypassing DNS policies. This caused an issue for Apple when they rolled out Apple Private Relay because it broke a lot of security services.

**VPN**: Another way DOT and DOH can be applicable is by complementing VPN services. VPNs are commonly used to establish a private connection between users and remote servers, shielding their IP addresses and encrypting their traffic. However, it’s important to note that VPNs don’t necessarily encrypt DNS traffic, which means that a user’s browsing activity could still be exposed to their ISP or the VPN provider. By implementing DOT or DOH, users can ensure that their DNS traffic is also encrypted and directed towards a trusted resolver, providing a layer of security.

**IoT**: A third application for DOT and DOH lies in securing devices. These devices are frequently connected to the Internet. Rely on DNS for communication with devices or servers. Unfortunately, IoT devices are vulnerable to DNS attacks such as hijacking, spoofing, or denial of service attacks. IoT devices can safeguard against actors attempting to tamper with or disrupt their DNS communication channels by utilizing DOT or DOH protocols. This helps guarantee that they remain connected to their intended destinations.

### Final Thoughts

The standards of DOT and DOH offer advantages when it comes to enhancing DNS security and privacy. They work by encrypting and authenticating DNS traffic, making it difficult for anyone to intercept or manipulate. Moreover, these standards also make it challenging for others to block or filter your DNS requests since they resemble HTTPS traffic.

However, it’s important to note that DOT and DOH come with considerations in terms of network performance, security, and privacy implications. Depending on your goals and requirements, you may find one option more suitable than the other or even opt for a combination of both. Network administrators often prefer DOT as it allows them to monitor and restrict DNS queries. On the other hand, privacy advocates tend to lean towards DOH as it conceals DNS queries within the flow of HTTPS traffic.

DOT and DOH find applications in scenarios such as web browsing, VPN usage, and IoT devices. By implementing either DOT or DOH protocols, you can safeguard your activities from prying eyes like ISPs, governments, or any other third parties attempting to spy on your visited websites or enforce censorship measures. Additionally, using these protocols alongside VPN services adds a layer of protection to your DNS communications while securing devices against potential tampering or disruption by malicious actors.

This article explains the workings of DNS, DOT, and DOH, their purpose for creation, and their practical applications and use cases. Additionally, we have examined the similarities and differences between the protocols while discussing the benefits they offer and their drawbacks. We aim to ensure that this report enables you to understand better how DOT and DOH can strengthen your DNS security and privacy and how you can effectively incorporate them into your network engineering projects.