import { db, nowIso } from "../config/db.js";
import { id } from "../utils/ids.js";

type Lesson = {
  slug: string;
  title: string;
  minutes: number;
  content: string;
  exercise: string;
  code?: string;
};
type Module = { title: string; description: string; lessons: Lesson[] };
type Question = {
  prompt: string;
  explanation: string;
  answers: { label: string; correct?: boolean }[];
};
type FoundationCourse = {
  slug: string;
  title: string;
  level: "Beginner" | "Intermediate";
  category: string;
  subtitle: string;
  description: string;
  hours: number;
  prerequisites: string[];
  next?: string;
  objectives: string[];
  modules: Module[];
  assessment?: { title: string; questions: Question[] };
};

const courses: FoundationCourse[] = [
  {
    slug: "cybersecurity-fundamentals",
    title: "Cybersecurity Fundamentals",
    level: "Beginner",
    category: "Fundamentals",
    subtitle: "Understand security principles, risk, identity, and safe practice.",
    description: "A guided introduction to protecting people, information, and services. Learn the core security model, identify assets and trust boundaries, make proportionate risk decisions, and practice professional ethics in authorized environments.",
    hours: 12,
    prerequisites: [],
    next: "networking-essentials",
    objectives: ["Explain confidentiality, integrity, and availability", "Identify assets, threats, vulnerabilities, and controls", "Distinguish authentication from authorization", "Describe a safe first response to a suspected incident"],
    modules: [
      {
        title: "Security thinking and risk",
        description: "Build a practical model of what protection means and how to prioritize it.",
        lessons: [
          { slug: "what-is-cybersecurity", title: "What cybersecurity actually is", minutes: 16, content: `## Security protects useful work\nCybersecurity helps people and organizations use systems with acceptable risk. It combines people, processes, and technology: a secure design can still fail if access is misunderstood or recovery has never been practiced.\n\n## The three security goals\n- **Confidentiality:** information is available only to authorized people and services.\n- **Integrity:** information and system behavior remain accurate and trustworthy.\n- **Availability:** authorized users can access a service when they need it.\n\nA control may improve one goal while affecting another. Backups improve recovery, but poorly protected backups can expose confidential data.\n\n## A professional learning cycle\nUnderstand the system, identify what matters, describe realistic failure, select a proportionate control, and check whether it works. Practice only in environments you own or have explicit permission to use.`, exercise: "Choose a familiar service. Name one confidentiality, integrity, and availability concern, then propose one practical safeguard." },
          { slug: "assets-threats-controls", title: "Assets, threats, and controls", minutes: 18, content: `## Start with the asset\nAn asset is something worth protecting: an account, device, source repository, customer record, service, or business process. Record who depends on it and what would happen if it were exposed, changed, or unavailable.\n\n## Separate the risk terms\nA **threat** could cause harm; a **vulnerability** is a weakness that could be used or triggered; an **impact** is the resulting harm. A **control** reduces likelihood, impact, or recovery time. These terms help teams describe a problem without jumping straight to a tool.\n\n## Match controls to the problem\nMFA helps reduce account takeover risk. Tested backups help restore availability. Reviewable permissions limit unnecessary access. Controls should have an owner and a way to verify operation.`, exercise: "Make a small asset table for a personal learning project: asset, likely failure, impact, existing safeguard, and one improvement." },
          { slug: "risk-assessment-basics", title: "Making a simple risk assessment", minutes: 20, content: `## Describe risk in a useful sentence\nA practical risk statement connects a situation to an asset and a consequence: “If a shared administrator account is misused, we may lose the ability to identify who changed production data.” This makes the decision clearer than a label such as “high risk.”\n\n## Prioritize consistently\nConsider how plausible the event is, how severe the impact would be, how exposed the asset is, and how quickly the team could recover. A simple low, medium, or high rating is useful only when the team agrees what each rating means.\n\n## Choose a response and owner\nReduce risk with a control, avoid the activity, transfer a defined part of the impact, or accept the remaining risk through an accountable decision. Record the owner, due date, evidence, and review trigger.`, exercise: "Write one risk statement for a fictional student portal and give it a rating, rationale, owner, and next review date." },
        ],
      },
      {
        title: "Identity and professional practice",
        description: "Learn how identities receive access and how responsible security work stays within scope.",
        lessons: [
          { slug: "identity-basics", title: "Identity, authentication, and authorization", minutes: 18, content: `## Three different questions\n**Identification** tells a system which account is being claimed. **Authentication** checks evidence for that claim. **Authorization** decides what the authenticated identity may do. A successful sign-in does not grant permission to every record or action.\n\n## Apply least privilege\nGive each person and service only the access needed for its task, for only as long as needed. Separate routine accounts from administrative accounts, protect recovery methods, and review access when responsibilities change.\n\n## Enforce decisions on the server\nA client-side button can improve usability, but it cannot enforce access. Every sensitive server request must check the current identity, requested action, and ownership or role.`, exercise: "For a fictional course site, list one learner action and one administrator action. State the authorization check each must pass.", code: `def can_read_record(user_id: str, owner_id: str, is_admin: bool) -> bool:\n    return is_admin or user_id == owner_id` },
          { slug: "access-lifecycle", title: "The account and access lifecycle", minutes: 15, content: `## Access changes over time\nPeople join, change roles, take temporary duties, and leave. Services also receive credentials and permissions. Access management should cover creation, approval, review, change, and removal rather than stopping after sign-up.\n\n## Use accountable decisions\nAn access request should identify the subject, resource, purpose, approver, and expiry or review point. Privileged access deserves stronger controls, clear ownership, and useful audit records. Shared accounts make accountability difficult and should be avoided when individual identities are practical.\n\n## Remove stale access\nA periodic review compares current access with current responsibilities. Revoke access promptly when it is no longer needed, and verify the removal in the systems that actually enforce it.`, exercise: "Draft a five-step checklist for granting a temporary teaching assistant access and removing it at the end of term." },
          { slug: "safe-practice", title: "Authorization, ethics, and scope", minutes: 16, content: `## Permission is part of the technical work\nTesting a system can affect real people, data, and availability. Use your own virtual machines, purpose-built training environments, or a written authorization that clearly describes the allowed targets and methods. Being curious, employed, or enrolled in a course does not grant permission by itself.\n\n## Define a safe scope\nBefore testing, confirm the owner, targets, dates, allowed techniques, data-handling rules, emergency contact, and stop conditions. Do not access, copy, or retain information outside the agreed purpose. Stop if the activity causes unexpected impact or reaches an out-of-scope system.\n\n## Communicate findings responsibly\nKeep notes factual, protect sensitive evidence, explain impact without exaggeration, and report through the agreed channel.`, exercise: "Review a fictional lab authorization and write down its target, allowed activity, data rule, stop condition, and reporting contact." },
        ],
      },
      {
        title: "Controls and incident readiness",
        description: "Connect safeguards to risks and prepare a measured response to unexpected events.",
        lessons: [
          { slug: "control-selection", title: "Selecting and verifying controls", minutes: 17, content: `## Use more than one kind of control\nPreventive controls try to stop an event, detective controls help reveal it, and corrective controls help restore a safe state. A useful design considers all three. For example, restricted access may prevent misuse, audit records may reveal it, and a tested recovery plan may limit the damage.\n\n## Make controls specific\n“Improve security” is not an operational control. Define who performs what action, how often, which systems are in scope, and what evidence shows completion. Consider whether the process works during staff absence or service failure.\n\n## Review effectiveness\nA control can exist on paper and still fail. Test denied access, sample review records, exercise restore procedures, and track exceptions to closure.`, exercise: "For the risk in your earlier assessment, propose one preventive, one detective, and one corrective control with evidence for each." },
          { slug: "defense-in-depth", title: "Defense in depth and secure defaults", minutes: 16, content: `## Avoid relying on a single barrier\nDefense in depth uses complementary safeguards so one mistake does not expose everything. A service might combine strong authentication, narrow authorization, network restrictions, monitoring, and tested recovery. Each layer should address a distinct failure mode.\n\n## Make the safe choice the easy choice\nSecure defaults include private access until sharing is approved, minimal permissions for new accounts, and logging that avoids secrets. Defaults matter because many users keep them unchanged. Exceptions should be visible, time-limited, and reviewed.\n\n## Keep layers understandable\nMore controls are not automatically better. Unclear rules create workarounds. Document how layers interact and test both the allowed path and the denied path.`, exercise: "Sketch three independent safeguards for a fictional file-sharing service and explain which failure each layer helps contain." },
          { slug: "incident-response-first-steps", title: "The first steps in incident response", minutes: 18, content: `## Respond calmly and preserve facts\nAn alert is a signal to assess, not proof of compromise. Record when it was observed, the source, affected system, visible symptoms, and actions already taken. Separate direct observations from assumptions.\n\n## Contain safely and escalate\nFollow the organization’s incident plan and contact the designated responder. Avoid deleting files, rebooting systems, or contacting suspected actors unless the response lead directs it; these actions can destroy evidence or worsen impact. If there is immediate danger to people or critical services, use the appropriate emergency process.\n\n## Protect evidence and learn\nLimit access to collected evidence, preserve original timestamps and sources, and document each handoff. After resolution, identify improvements to controls, communication, and recovery.`, exercise: "Write a first-response note for a fictional unexpected sign-in alert: observations, uncertainty, immediate owner, safe next action, and evidence to preserve." },
        ],
      },
    ],
  },
  {
    slug: "networking-essentials",
    title: "Networking Essentials",
    level: "Beginner",
    category: "Networking",
    subtitle: "Understand addressing, DNS, HTTP, TLS, and practical network defense.",
    description: "Learn how devices address one another and how common application protocols work. Build a reliable troubleshooting model, understand basic network boundaries, and interpret traffic safely using systems and examples you are authorized to inspect.",
    hours: 14,
    prerequisites: ["Cybersecurity Fundamentals"],
    next: "linux-for-security",
    objectives: ["Explain IP addresses, ports, TCP, and UDP", "Describe DNS, HTTP, and TLS at a practical level", "Trace a basic client-to-service request", "Use a safe, layered network troubleshooting method"],
    modules: [
      {
        title: "Addressing and transport",
        description: "Build a mental model of how hosts find each other and exchange data.",
        lessons: [
          { slug: "tcpip-mental-model", title: "A practical model of network layers", minutes: 16, content: `## Follow the conversation from the bottom up\nA local link carries frames, IP moves packets between networks, TCP or UDP carries transport data, and application protocols define useful messages such as DNS and HTTP. The layers are a troubleshooting aid: identify where the failure begins before changing configuration.\n\n## TCP and UDP serve different needs\nTCP establishes a connection and provides ordered, reliable delivery. UDP sends datagrams without that same connection guarantee; applications may add their own reliability. Neither choice makes an application secure by itself.\n\n## Use a request path\nA browser typically resolves a name, routes traffic to an address, establishes transport, negotiates TLS when applicable, then exchanges HTTP messages.`, exercise: "Draw a five-step path from entering a website name to receiving its page. Mark one possible failure at each step." },
          { slug: "ip-addressing", title: "IP addresses, subnets, and gateways", minutes: 18, content: `## Addresses identify network interfaces\nIPv4 and IPv6 addresses let hosts communicate across networks. A subnet describes which addresses are considered local; a default gateway forwards traffic to destinations outside that local range. Address assignment may be static or managed by a service such as DHCP.\n\n## Think in boundaries\nA subnet is not automatically a security boundary. Firewalls, routing policy, identity checks, and service configuration determine which communication is actually permitted. Private address space also does not mean a host is safe from other devices on the same network.\n\n## Troubleshoot from local to remote\nConfirm the interface configuration, local route, gateway reachability, and name resolution in order. Avoid changing multiple settings at once because it obscures the cause.`, exercise: "In a diagram of a laptop, home router, and internet service, label the host address, local network, gateway, and remote destination." },
          { slug: "ports-and-services", title: "Ports, services, and exposure", minutes: 15, content: `## A port identifies an application endpoint\nA host address identifies a destination machine or interface; a transport port helps deliver traffic to a service on that host. Common examples include 53 for DNS, 80 for HTTP, and 443 for HTTPS, though deployments can use other ports.\n\n## Listening is a design decision\nA service should listen only where it is needed. Exposure depends on the bind address, host firewall, network firewall, routing, authentication, and software health. A familiar port number does not tell you whether a service is safe.\n\n## Inventory before changing\nOn systems you administer, document the service owner, purpose, expected clients, update path, and monitoring. Remove unused services and verify changes from an authorized vantage point.`, exercise: "Make a small service inventory for a fictional web host with DNS, HTTPS, and administrative access. Identify intended clients and one restriction for each." },
        ],
      },
      {
        title: "Names and secure web traffic",
        description: "Understand the protocols behind common web requests.",
        lessons: [
          { slug: "dns-basics", title: "DNS records and name resolution", minutes: 17, content: `## DNS translates names into records\nResolvers find records such as A and AAAA addresses. CNAME records provide aliases, MX records identify mail exchangers, and TXT records carry text used for several administrative purposes. A DNS answer has a type, value, and caching lifetime.\n\n## Follow the resolution path\nA device may check a local cache, ask a configured resolver, and receive a cached or authoritative answer. A stale cache or incorrect record can send users to the wrong destination or make a service unavailable. DNSSEC can help validate record authenticity when configured correctly; it does not encrypt DNS queries.\n\n## Protect administration\nUse strong account controls for DNS providers, review changes, and retain a known-good record history.`, exercise: "For a fictional website and mail service, list the DNS record types likely needed and explain what each one answers." },
          { slug: "http-basics", title: "HTTP requests and responses", minutes: 18, content: `## Read the shape of a request\nAn HTTP request has a method, path, headers, and sometimes a body. The response includes a status, headers, and optional content. GET is intended to retrieve a representation; POST commonly submits or changes data. Applications must still enforce authorization and validate every request.\n\n## Status codes communicate outcomes\nA 2xx response generally indicates success, 3xx redirects, 4xx a client-side issue or denial, and 5xx a server-side failure. Exact meaning depends on the status and application. Error responses should not reveal secrets or internal stack traces.\n\n## Use TLS for sensitive traffic\nHTTPS protects the connection in transit using TLS, but it does not make the server trustworthy or prevent application bugs.`, exercise: "Annotate a sample GET request with its method, path, host, and accepted response format. Then explain what a 401 and 403 would indicate." },
          { slug: "tls-certificates", title: "TLS and certificate validation", minutes: 19, content: `## TLS protects a connection in transit\nTLS negotiates cryptographic parameters and establishes keys that protect application traffic from casual observation or modification on the network. HTTPS is HTTP carried over TLS. Modern deployments rely on supported protocol versions and correctly configured certificates.\n\n## What a certificate helps establish\nA browser checks whether the certificate is valid for the requested name, within its validity period, and linked to a trusted certificate authority. A certificate does not prove that a service is honest, free from malware, or authorized to handle your data.\n\n## Treat warnings as meaningful\nDo not train users to bypass certificate warnings. Investigate name mismatches, expired certificates, clock errors, or unexpected trust changes through the service owner.`, exercise: "Explain in your own words what a valid HTTPS certificate tells a browser and name two things it does not prove." },
        ],
      },
      {
        title: "Network controls and troubleshooting",
        description: "Use boundaries, logging, and a repeatable diagnosis process.",
        lessons: [
          { slug: "network-segmentation", title: "Segmentation and trust boundaries", minutes: 17, content: `## Limit unnecessary paths\nSegmentation groups systems by purpose or sensitivity and limits which paths are allowed between them. A user device, application service, database, and management plane often need different access rules. Segmentation reduces exposure, but it does not replace authentication or secure configuration.\n\n## Document intended flows\nFor every allowed connection, record the source, destination, service, business purpose, and owner. Prefer narrow rules over broad ranges and review temporary exceptions.\n\n## Verify impact carefully\nChanges can interrupt dependencies. Test with an approved change plan, observe both permitted and denied traffic, and keep a rollback path.`, exercise: "Draw a simple three-tier application and describe the minimum network flows between the user, web service, and database." },
          { slug: "firewall-rules", title: "Reading firewall rules", minutes: 16, content: `## A rule is a decision with context\nFirewall rules commonly match source, destination, protocol, port, and direction, then allow or deny the traffic. Some firewalls are stateful and track connection state. Rule order and implicit defaults can change the result, so read the full policy rather than one line in isolation.\n\n## Apply least access\nPermit only documented flows and restrict management access to approved networks or identities. Broad “any to any” rules are difficult to justify and review. Log useful decisions without collecting unnecessary sensitive information.\n\n## Change safely\nIdentify the owner and expected effect, test in a controlled window, confirm the intended path, and check for unintended access or outages.`, exercise: "Review three fictional rules and mark which one grants the broadest access. Rewrite it with a narrower source, destination, and purpose." },
          { slug: "network-troubleshooting", title: "A repeatable troubleshooting method", minutes: 18, content: `## Start with a precise symptom\nRecord the user, time, affected destination, exact error, recent change, and whether the failure is consistent. Avoid assuming that every timeout is a firewall problem.\n\n## Test one layer at a time\nCheck local configuration, name resolution, route, connection establishment, TLS, and application response in order. Compare a known-working path where appropriate. Use diagnostic tools only against systems you own or are authorized to troubleshoot.\n\n## Close the loop\nChange one variable at a time, record the result, restore temporary diagnostics, and document the cause and prevention. Escalate with evidence when the fault lies outside your scope.`, exercise: "Create a decision tree for a fictional site that fails to load: separate DNS, routing, TCP, TLS, and application checks." },
        ],
      },
    ],
  },
  {
    slug: "linux-for-security",
    title: "Linux for Security",
    level: "Beginner",
    category: "Linux",
    subtitle: "Use Linux confidently: files, permissions, services, logs, and safe maintenance.",
    description: "A practical foundation for working with Linux systems you own or administer. Learn command-line navigation, identities and permissions, process and service visibility, patching, backups, and cautious diagnostics.",
    hours: 14,
    prerequisites: ["Networking Essentials"],
    next: "python-for-cybersecurity",
    objectives: ["Navigate files and inspect system state", "Explain owners, groups, permissions, and privilege", "Review services and logs safely", "Describe a basic patch and recovery workflow"],
    modules: [
      {
        title: "Command line and file access",
        description: "Build safe habits for inspecting and managing a Linux host.",
        lessons: [
          { slug: "shell-navigation", title: "Files, paths, and the shell", minutes: 17, content: `## Treat the shell as a precise workspace\nThe shell runs commands in a current directory and environment. Use pwd to confirm location, ls to inspect names, cd to navigate, and less or head to read files. Relative paths depend on the current directory; absolute paths begin at the filesystem root.\n\n## Inspect before changing\nRead a command’s help or manual before using unfamiliar options. Check the target path before writing or deleting. Avoid pasting commands you do not understand, especially when they use elevated privileges or operate recursively.\n\n## Make work repeatable\nUse clear filenames, keep notes about configuration changes, and prefer small reversible steps. Practice in a personal virtual machine before applying a procedure to an important system.`, exercise: "In a personal VM, record your current directory, inspect a text file, and explain what changes when you use an absolute path.", code: `pwd\nls -la\nless /etc/os-release` },
          { slug: "permissions", title: "File ownership and permissions", minutes: 18, content: `## Understand the access decision\nLinux files have an owner, group, and permission bits for read, write, and execute. Directory permissions have distinct effects: read lists names, write changes directory entries, and execute permits traversal. Ownership and permissions should match the file’s purpose.\n\n## Avoid broad access\nSensitive configuration, private keys, and user data should not be writable by everyone. Prefer a dedicated group or service account over world-readable or world-writable permissions. Be cautious with recursive permission changes because one mistake can expose or break many files.\n\n## Verify the result\nInspect ownership and mode after a change. Test access as the intended user rather than assuming the command did what you meant.`, exercise: "On a disposable file in your VM, compare read and write permissions for owner, group, and others. Restore the original mode afterward." },
          { slug: "users-groups", title: "Users, groups, and service accounts", minutes: 16, content: `## Give each identity a clear purpose\nHuman accounts support individual accountability. Groups make it easier to grant shared access by role. Services should run under dedicated, minimally privileged accounts rather than a general administrator identity.\n\n## Separate routine and elevated work\nUse a normal account for daily tasks and request elevated privileges only for a specific administrative action. Review group membership, disable stale accounts through the approved process, and protect authentication material.\n\n## Check before granting access\nConfirm the system owner, reason, scope, approval, and end date. Changes should be logged and reviewed, particularly for groups that can administer the host.`, exercise: "Design roles for a fictional web server: administrator, deployer, and application service. List one permission each role needs and one it should not receive." },
        ],
      },
      {
        title: "Processes, services, and logs",
        description: "Understand what is running and use logs as evidence.",
        lessons: [
          { slug: "processes-logs", title: "Processes and system logs", minutes: 18, content: `## A process is a running program\nProcesses have owners, identifiers, resource use, and sometimes parent processes. A process list helps answer what is running, but names alone do not establish whether a program is expected. Compare observations with the system’s documented role and change history.\n\n## Logs provide context over time\nAuthentication and service logs can help explain successful and failed actions. Check timestamps, timezone, source, and retention limits. Logs may contain personal or sensitive data, so view and share only what the investigation requires.\n\n## Preserve useful evidence\nRecord the source and time of observations. Avoid editing or deleting logs during an investigation; follow the system owner’s response process.`, exercise: "On your own VM, inspect a small set of recent system events and write down the source, timestamp, and one question the log cannot answer." },
          { slug: "services-systemd", title: "Services and startup behavior", minutes: 17, content: `## A service runs work in the background\nLinux services may start at boot, restart after failure, and run with their own identity. Document why each service exists, who maintains it, what network or file access it needs, and how it is updated.\n\n## Review the lifecycle\nCheck whether a service is installed, active, enabled at boot, and listening where expected. These are separate states. Stop or disable a service only after confirming dependencies and using the system’s change process.\n\n## Reduce unnecessary exposure\nRemove unused services, restrict their permissions, and monitor failures. A service that does not listen on the network can still have local security impact.`, exercise: "Choose a service on a disposable VM. Record its purpose, running state, startup behavior, account, and owner." },
          { slug: "patch-management", title: "Updates and package maintenance", minutes: 16, content: `## Updates reduce known exposure\nOperating system and application updates fix defects, including security issues. A responsible process tracks supported versions, update sources, priority, maintenance windows, and systems that cannot be updated immediately.\n\n## Verify source and outcome\nUse the distribution’s trusted package manager and supported repositories. Review release notes for important changes, install updates in a suitable window, and confirm service health afterward. Avoid downloading packages from unverified mirrors or running unknown installation scripts as root.\n\n## Handle exceptions explicitly\nIf a system cannot be updated, document the reason, owner, compensating control, and review date. Reassess when the dependency or business constraint changes.`, exercise: "Write a patch plan for a fictional learning server, including backup or rollback, test, maintenance window, and post-update verification." },
        ],
      },
      {
        title: "Hardening and recovery",
        description: "Apply limited privilege, cautious diagnostics, and tested recovery practices.",
        lessons: [
          { slug: "sudo-boundaries", title: "Administrative privilege and sudo", minutes: 15, content: `## Elevate only for a defined task\nAdministrative privileges can change system-wide files, users, services, and security settings. Use a named account, request elevation for a specific command, and understand the command’s effect before running it.\n\n## Keep the boundary reviewable\nSudo policy should identify approved users and commands, follow organizational procedure, and avoid broad unrestricted access where narrower rules work. Do not share administrator passwords or store secrets in shell history.\n\n## Record meaningful changes\nFor configuration changes, note the reason, owner, time, expected result, and rollback path. Verify the service still behaves as intended.`, exercise: "Review a fictional sudo request and identify the exact task, minimum privilege required, approval, and verification step." },
          { slug: "backups-integrity", title: "Backups and restore testing", minutes: 17, content: `## A backup is useful only if it can be restored\nBackups reduce recovery time after deletion, failure, or compromise. Define what is protected, how often it is copied, how long it is retained, and who can access it. Keep backup credentials separate from ordinary service credentials where practical.\n\n## Protect the recovery path\nConsider encryption, access control, immutable or offline copies, and monitoring for failed jobs. A backup connected to the same compromised account may be altered along with the original data.\n\n## Test restoration\nRestore representative data in a safe environment, verify integrity and permissions, measure recovery time, and document gaps. A successful backup job is not proof of a successful recovery.`, exercise: "Create a restore-test checklist for a fictional course server, covering sample selection, access, integrity, time, and evidence." },
          { slug: "read-only-diagnostics", title: "Safe system diagnostics", minutes: 16, content: `## Begin with read-only checks\nWhen a system behaves unexpectedly, first capture its role, time, recent changes, resource state, service state, and relevant logs. Read-only checks reduce the risk of changing evidence or creating a second problem.\n\n## Use a narrow scope\nRun diagnostics only on systems you own or administer. Avoid broad recursive searches or collection of unrelated user files. Protect diagnostic output because it may include usernames, paths, tokens, or private data.\n\n## Escalate with a concise handoff\nSummarize the symptom, checks performed, relevant outputs, uncertainty, and next safe action. Ask the responsible administrator before applying changes outside your role.`, exercise: "Write a short diagnostic handoff for a fictional service outage using only observations, a safe next step, and the evidence owner." },
        ],
      },
    ],
    assessment: { title: "Linux administration checkpoint", questions: [
      { prompt: "Why should a service use a dedicated, minimally privileged account?", explanation: "It limits the impact of compromise and separates service activity from human administration.", answers: [{ label: "To reduce access and improve accountability", correct: true }, { label: "To avoid keeping software updated" }] },
      { prompt: "What best demonstrates that backups are useful?", explanation: "A restore test validates that the data can be recovered within the needed time and with integrity.", answers: [{ label: "A successful scheduled job message", correct: false }, { label: "A documented restore test with verified data", correct: true }] },
      { prompt: "What is a safe first step when investigating an unexpected service issue?", explanation: "Read-only observations preserve state and help narrow the problem before changes are made.", answers: [{ label: "Capture relevant state and logs", correct: true }, { label: "Delete logs and restart everything", correct: false }] },
    ] },
  },
  {
    slug: "python-for-cybersecurity",
    title: "Python for Cybersecurity",
    level: "Intermediate",
    category: "Python",
    subtitle: "Write reliable local tools for files, logs, and defensive checks.",
    description: "Use Python to automate small defensive tasks with clear scope and predictable behavior. Practice safe file handling, structured data parsing, validation, useful errors, configuration hygiene, and tests using your own files or synthetic records.",
    hours: 18,
    prerequisites: ["Linux for Security"],
    next: "web-security",
    objectives: ["Write small, readable security utilities", "Handle files and structured records safely", "Keep secrets out of source code", "Test expected and failure behavior"],
    modules: [
      {
        title: "Reliable scripting foundations",
        description: "Set up a controlled environment and build small, reviewable tools.",
        lessons: [
          { slug: "python-setup", title: "Environments, dependencies, and safe habits", minutes: 16, content: `## Isolate project dependencies\nA virtual environment keeps project packages separate from the operating system. Record dependencies so another learner can reproduce the setup. Review package names and sources before installation; typosquatting and abandoned dependencies are real supply-chain risks.\n\n## Make scripts predictable\nUse clear inputs and outputs, validate arguments, fail with useful messages, and avoid hidden changes. Scripts should operate on an explicit directory or file rather than scanning the whole machine by default.\n\n## Keep credentials out of code\nDo not commit API keys, passwords, or tokens. Use a documented local configuration method and never print secret values in logs.`, exercise: "Create a virtual environment for a tiny local project and write a README with setup, input scope, and cleanup steps.", code: `python -m venv .venv\n# Windows: .venv\\Scripts\\activate\n# macOS/Linux: source .venv/bin/activate\npython -m pip install --upgrade pip` },
          { slug: "safe-file-processing", title: "Reading files safely", minutes: 18, content: `## Treat file inputs as untrusted\nA local file can still be malformed, unexpectedly large, or different from what the script expects. Confirm the path, open files with a context manager, choose the correct text encoding, and avoid loading large data sets entirely into memory.\n\n## Make changes deliberate\nPrefer a dry-run or output-to-new-file workflow before editing source data. Handle missing files and permission errors without exposing stack traces or silently skipping important records.\n\n## Protect sensitive data\nUse sample records for practice. If real data is authorized, minimize fields, restrict output permissions, and remove temporary copies through the approved retention process.`, exercise: "Write pseudocode for safely reading a small local text file, reporting an error if it is missing, and writing results to a separate output file." },
          { slug: "hashing-integrity", title: "Hashing for file integrity", minutes: 17, content: `## A cryptographic digest detects change\nA hash function maps input data to a fixed-length digest. SHA-256 is commonly used to compare file integrity. If a file changes, its digest is expected to change. A digest does not encrypt the file and does not prove who created it unless it is authenticated through a trusted process.\n\n## Process data in chunks\nLarge files can be read incrementally so memory use stays bounded. Record the algorithm, source path, time, and expected reference when performing a comparison. Keep the original file unchanged during analysis.\n\n## Do not confuse file hashes with password storage\nPasswords require specialized slow password-hashing schemes with salts. A fast general-purpose digest is not an appropriate password-storage method.`, exercise: "Hash two copies of a file you created, change one character in a copy, then explain what the comparison shows and what it cannot prove.", code: `import hashlib\nfrom pathlib import Path\n\ndef sha256_file(path: Path) -> str:\n    digest = hashlib.sha256()\n    with path.open("rb") as source:\n        for chunk in iter(lambda: source.read(65536), b""):\n            digest.update(chunk)\n    return digest.hexdigest()` },
        ],
      },
      {
        title: "Parsing and validating data",
        description: "Turn structured and text records into useful, cautious summaries.",
        lessons: [
          { slug: "log-parsing", title: "Parsing logs with Python", minutes: 19, content: `## Preserve the original record\nLogs are evidence with a source, timestamp, format, and retention limit. Keep an untouched copy when permitted, parse a working copy, and record the parser version and assumptions. Avoid treating a matching text string as proof of malicious behavior.\n\n## Parse with explicit rules\nPrefer documented formats and structured fields over fragile positional assumptions. Handle missing values, unexpected timestamps, and malformed lines. Normalize timezone and field names while retaining enough information to trace a result to its source record.\n\n## Summarize with context\nCounts and timelines help triage, but they can hide duplicate events or missing data. Include the time range, number of records processed, parsing failures, and limitations.`, exercise: "Use a synthetic log file to count failed sign-ins by account. Include malformed-line handling and state the limits of your summary.", code: `from collections import Counter\n\ndef count_failed(records: list[dict[str, str]]) -> Counter[str]:\n    counts: Counter[str] = Counter()\n    for record in records:\n        if record.get("event") == "authentication_failed":\n            counts[record.get("account", "unknown")] += 1\n    return counts` },
          { slug: "csv-json-basics", title: "Working with CSV and JSON", minutes: 16, content: `## Structured formats reduce guesswork\nCSV represents rows and named columns; JSON represents objects, arrays, and values. Use standard parsers rather than splitting on commas or braces manually. Confirm the schema, required fields, encoding, and expected size before processing.\n\n## Validate before analysis\nA record may be missing a timestamp, contain an unexpected type, or include an extra field. Validate the structure and report rejected records without dumping sensitive content. Keep parsing separate from analysis so each part can be reviewed and tested.\n\n## Produce traceable output\nState the input source, processing time, schema assumptions, and number of accepted or rejected rows. Avoid overwriting source data.`, exercise: "Create a three-record synthetic JSON file and write a schema checklist for its required timestamp, event type, and actor fields." },
          { slug: "error-handling", title: "Errors, logs, and clear outcomes", minutes: 16, content: `## Handle expected failures deliberately\nFiles may be missing, permissions may deny access, and input may not match the expected format. Catch specific exceptions where recovery is possible. Do not catch every error and continue as if the analysis succeeded.\n\n## Make messages useful and safe\nA good message states what failed and what the user can do next. Logs can include a request identifier, operation, and outcome, but should not include passwords, tokens, or unnecessary personal information.\n\n## Choose a clear exit status\nAutomation needs to distinguish success, partial processing, and failure. Report counts and return an appropriate status so the next step does not mistake incomplete work for a clean result.`, exercise: "Design messages and exit outcomes for a parser that reads a file, skips malformed rows, and fails if no valid records remain." },
        ],
      },
      {
        title: "Defensive utility design",
        description: "Validate inputs, manage configuration, and prove behavior with tests.",
        lessons: [
          { slug: "input-validation", title: "Validate input and constrain scope", minutes: 17, content: `## Validate at the boundary\nCheck types, lengths, formats, ranges, and allowed values before using input. Validation prevents accidental misuse and makes assumptions visible; it does not replace authorization or safe output handling.\n\n## Constrain file and network scope\nA tool should require an explicit target and reject unexpected paths or destinations. Resolve paths carefully, avoid following untrusted links when that matters, and add dry-run behavior for operations that change data.\n\n## Fail safely\nIf scope cannot be verified, stop with a clear message. Do not silently broaden a request or retry against unrelated systems.`, exercise: "Specify three validation rules and one out-of-scope rejection for a local file-integrity checker." },
          { slug: "secrets-configuration", title: "Configuration and secret handling", minutes: 16, content: `## Separate settings from code\nEnvironment-specific paths and feature settings belong in documented configuration. Credentials should come from an approved secret store or protected local environment, not source files, screenshots, or command history.\n\n## Limit access and exposure\nGive a script only the credentials it needs and only for as long as needed. Avoid printing configuration, include safe defaults, and ensure error messages do not echo sensitive values. Rotate a credential if it may have been exposed.\n\n## Make configuration reviewable\nValidate required settings at startup and fail with a message naming the missing setting without revealing its value.`, exercise: "Review a sample script with a hard-coded token. Describe how to move it into protected configuration and how to prevent accidental logging." },
          { slug: "unit-testing", title: "Testing security script behavior", minutes: 18, content: `## Test the behavior that matters\nA useful test checks expected results and important denied or failure cases. Test empty input, malformed data, missing files, boundary values, and permission errors. Security tools should demonstrate that invalid scope is rejected.\n\n## Keep tests isolated\nUse temporary directories and synthetic records. Never make tests depend on production accounts, public targets, or real confidential data. Clean up generated files even when a test fails.\n\n## Make results reproducible\nRecord the command to run tests and keep fixtures small. A passing test does not prove a tool is secure, but it makes important assumptions easier to review and maintain.`, exercise: "Write four test cases for a local log parser: a valid event, an unknown event, a malformed timestamp, and an empty file." },
        ],
      },
    ],
  },
  {
    slug: "web-security",
    title: "Web Security",
    level: "Intermediate",
    category: "Web",
    subtitle: "Protect web sessions, data access, input, and application behavior.",
    description: "Study the security boundaries in a browser-to-server application. Learn how sessions and authorization work, how to handle untrusted input and output, and how to test common defensive properties in a local training application.",
    hours: 18,
    prerequisites: ["Python for Cybersecurity", "Networking Essentials"],
    next: "secure-software-development",
    objectives: ["Explain session and cookie protections", "Enforce authorization for each sensitive object", "Handle input and output in context", "Test common web security controls safely"],
    modules: [
      {
        title: "Identity and request boundaries",
        description: "Understand how web applications identify users and authorize actions.",
        lessons: [
          { slug: "sessions-cookies", title: "Sessions and cookies", minutes: 18, content: `## A session connects requests to an authenticated user\nHTTP requests are independent unless the application associates them with session state. A session identifier is a bearer credential: anyone who obtains it may act as that user until it expires or is revoked.\n\n## Protect the browser cookie\nUse HTTPS and set Secure in production, HttpOnly to limit script access, and an appropriate SameSite policy. Keep expiration and rotation aligned with risk. Do not put session identifiers in URLs or logs.\n\n## Enforce server-side state\nThe server must validate the session on every protected request, invalidate it on sign-out or compromise, and avoid treating a client-controlled role or user ID as proof of identity.`, exercise: "Review a fictional session-cookie configuration and explain what Secure, HttpOnly, and SameSite each contribute." },
          { slug: "idor-authz", title: "Authorization and object ownership", minutes: 19, content: `## Check permission for the requested object\nBroken object-level authorization occurs when an application accepts an identifier but fails to confirm that the current user may access that record. Random identifiers do not replace an authorization check.\n\n## Enforce the rule on every route\nFor each read, update, delete, export, or administrative action, verify the actor, action, object, and relevant relationship. Prefer queries scoped to the authenticated user where appropriate, and return only fields the caller needs.\n\n## Test both allowed and denied paths\nUse two local test accounts with synthetic records. Confirm the owner can perform the intended action and another account receives a denial without learning whether sensitive data exists.`, exercise: "Write a negative test plan for a profile endpoint using two test users and one record owned by each." },
          { slug: "csrf-protection", title: "Cross-site request forgery protections", minutes: 17, content: `## Understand the browser’s automatic credentials\nCross-site request forgery can occur when a browser automatically attaches a user’s cookies to a request initiated from another site. The risk is highest for state-changing actions that rely only on ambient session cookies.\n\n## Use layered protections\nUse an appropriate SameSite cookie policy and anti-forgery tokens or equivalent framework protection for cookie-authenticated state changes. Verify Origin or Referer where suitable, and require reauthentication for especially sensitive actions.\n\n## Do not confuse CORS with authorization\nCORS controls which browser scripts may read certain responses. It is not a substitute for server-side authorization or CSRF defenses.`, exercise: "For a fictional account-email change route, list the server-side checks that should prevent an unintended cross-site request." },
        ],
      },
      {
        title: "Safe input and output handling",
        description: "Keep untrusted data from changing queries, markup, or application control flow.",
        lessons: [
          { slug: "input-output", title: "Input validation and output encoding", minutes: 19, content: `## Validate what the application accepts\nValidate type, size, format, and allowed values on the server. Client checks improve usability but can be bypassed. Reject input that does not fit the business rule, while avoiding brittle filters that assume a specific attack string.\n\n## Keep data separate from code\nParameterized database queries keep values from changing SQL structure. Output encoding must match the context: HTML text, an attribute, a URL, and JavaScript require different handling. Use a well-maintained framework rather than assembling executable markup by hand.\n\n## Test the boundary\nInclude ordinary, empty, oversized, and malformed values in tests. Check that errors do not reveal stack traces, secrets, or internal query details.`, exercise: "Identify one database input and one displayed text field in a toy application. Describe the server validation and context-appropriate output handling for each.", code: `// SQLite parameterized query\ndb.prepare("SELECT id FROM users WHERE email = ?").get(email);` },
          { slug: "xss-output", title: "Cross-site scripting and safe rendering", minutes: 18, content: `## Rendering context determines the defense\nCross-site scripting occurs when untrusted content is interpreted as executable browser code. The risk can arise from stored content, reflected request data, or unsafe client-side DOM updates.\n\n## Prefer safe framework rendering\nUse automatic text escaping for ordinary content. Avoid raw HTML insertion unless the content is intentionally sanitized by a well-maintained allowlist sanitizer. Do not place untrusted data directly in script, style, or event-handler contexts.\n\n## Validate the security property\nUse harmless test strings in a local application and confirm they render as text. Review templates and client-side code paths where data changes context. Content Security Policy can limit impact, but it does not repair unsafe rendering.`, exercise: "In a local training page, trace a user-provided display name from input to output and identify where the framework escapes it." },
          { slug: "secure-error-handling", title: "Error handling and information disclosure", minutes: 16, content: `## Give users safe, useful failures\nA server error should not expose stack traces, database queries, internal file paths, tokens, or environment settings. Return an appropriate status and a concise message with a request identifier when support needs to investigate.\n\n## Keep diagnostic detail protected\nDetailed errors belong in access-controlled logs with retention and redaction rules. Avoid recording passwords, session values, or complete sensitive request bodies. Correlate a user-facing error to internal diagnostics without exposing the underlying data.\n\n## Handle exceptional paths consistently\nTest missing records, invalid state, dependency failure, and permission denial. Do not turn an error into success or leak whether a protected resource exists.`, exercise: "Rewrite a fictional error response that exposes a SQL query into a user-safe response and a separate protected log entry." },
        ],
      },
      {
        title: "Authentication and secure verification",
        description: "Protect credentials, uploads, and release behavior with focused tests.",
        lessons: [
          { slug: "password-storage", title: "Password storage and authentication", minutes: 19, content: `## Never store recoverable passwords\nStore passwords with a purpose-built adaptive password-hashing scheme that uses a unique salt and a work factor, such as bcrypt, scrypt, or Argon2. Do not use plaintext, reversible encryption, or a fast general-purpose hash such as SHA-256.\n\n## Make authentication resilient\nRate-limit attempts carefully, support secure recovery, use MFA where risk warrants it, and avoid revealing whether an account exists. Keep password reset tokens random, short-lived, single-use, and protected from logs.\n\n## Review the complete flow\nRegistration, sign-in, reset, change, sign-out, and session renewal all affect account security.`, exercise: "Draw the password reset flow for a toy application and mark token generation, storage, expiry, single-use enforcement, and notification." },
          { slug: "secure-uploads", title: "Handling file uploads safely", minutes: 18, content: `## An uploaded file is untrusted input\nA filename, extension, browser-supplied MIME type, and file contents can disagree. Enforce size limits, generate server-side names, validate allowed formats using suitable inspection, and store files outside executable web paths where practical.\n\n## Restrict access and processing\nCheck who may upload and download each file. Scan or transform files using maintained tools in an isolated process when the risk requires it. Prevent path traversal, public-by-default access, and resource exhaustion.\n\n## Define retention\nSpecify how long files are kept, who can delete them, and how backups handle removal. Avoid retaining files longer than their purpose requires.`, exercise: "Create a checklist for a profile-image upload feature covering size, format, generated names, ownership, storage, and deletion." },
          { slug: "web-security-testing", title: "Testing web security properties", minutes: 20, content: `## Turn controls into test cases\nA security test should state the actor, precondition, action, expected result, and evidence. Include positive tests and negative tests: a legitimate owner succeeds while an unauthorized user is denied.\n\n## Test in an authorized environment\nUse a local toy application or an explicitly approved test environment. Keep test data synthetic and avoid load or destructive actions without clear authorization.\n\n## Make findings actionable\nRecord the affected route, risk, reproduction conditions, expected behavior, observed behavior, and suggested fix. Retest after a change and include regression coverage for the original failure.`, exercise: "Write a test case for a user attempting to read another user’s profile. Include setup, request, expected status, and proof that no private fields were returned." },
        ],
      },
    ],
  },
  {
    slug: "ai-for-cybersecurity",
    title: "AI for Cybersecurity",
    level: "Intermediate",
    category: "AI",
    subtitle: "Evaluate analytics responsibly and keep human context in the loop.",
    description: "An applied introduction to statistical and machine-learning ideas used in defensive monitoring. Learn feature quality, baselines, precision and recall, threshold tradeoffs, drift, and the need for reproducible evaluation and analyst judgment.",
    hours: 15,
    prerequisites: ["Python for Cybersecurity"],
    next: "blue-team-operations",
    objectives: ["Explain the limits of anomaly detection", "Build features from authorized synthetic data", "Interpret precision, recall, and threshold tradeoffs", "Monitor drift and preserve human review"],
    modules: [
      {
        title: "Data and detection foundations",
        description: "Understand what a model sees and what it cannot conclude.",
        lessons: [
          { slug: "anomaly-basics", title: "Anomaly detection: signal, not verdict", minutes: 18, content: `## An anomaly is a deviation from a baseline\nAn anomaly detector identifies observations that differ from a model of expected behavior. Rare does not automatically mean malicious, and common does not automatically mean safe. New software, business changes, and incomplete data can all produce unusual signals.\n\n## Establish the context\nDefine the population, time period, fields, and operational purpose before selecting a method. A detector trained on a small or biased sample may represent that sample rather than normal behavior.\n\n## Use the result to guide investigation\nTreat output as a triage lead. Correlate with independent evidence, state uncertainty, and let an accountable analyst decide what action is appropriate.`, exercise: "Invent three benign reasons why an employee might generate an unusual sign-in pattern and list evidence that could distinguish them." },
          { slug: "log-features", title: "Features and data quality", minutes: 19, content: `## Features are measurements, not meaning\nA feature converts source data into a value a model can use: event count per interval, number of distinct destinations, or time since a prior event. Keep features relevant to the stated detection question and traceable to their source.\n\n## Check quality before modeling\nReview missing fields, duplicate events, timezone inconsistencies, collection gaps, and changes in logging format. Sensitive attributes can create privacy and fairness risks; minimize data and obtain appropriate review before use.\n\n## Avoid target leakage\nA feature that includes information only available after an incident can make evaluation look stronger than real-world performance. Document when each value would be available operationally.`, exercise: "Choose three features for synthetic sign-in triage. For each, state its source, collection time, missing-data risk, and privacy concern." },
          { slug: "baseline-detection", title: "Baselines and detection windows", minutes: 17, content: `## Compare behavior over a meaningful window\nA baseline describes an expected range for a defined entity and period. A daily average may hide weekly patterns; a global baseline may hide important differences between service accounts and people. Select the unit and window to match the use case.\n\n## Make the comparison explainable\nRecord the baseline version, data window, exclusions, and threshold. A score should be traceable to the observations and features that produced it. Avoid presenting a score as a probability unless it has been calibrated and validated for that interpretation.\n\n## Revisit assumptions\nWork schedules, product changes, and new data sources can change expected behavior. Establish an owner and review triggers.`, exercise: "Design a baseline for a fictional learning portal’s sign-in counts. Define entity, time window, required data, and two reasons it may become stale.", code: `def rate_per_hour(event_count: int, observed_hours: float) -> float:\n    if observed_hours <= 0:\n        raise ValueError("observed_hours must be positive")\n    return event_count / observed_hours` },
        ],
      },
      {
        title: "Model evaluation and decisions",
        description: "Measure useful outcomes and understand operational tradeoffs.",
        lessons: [
          { slug: "label-quality", title: "Labels, ground truth, and sampling", minutes: 18, content: `## Labels are judgments with provenance\nA label may come from an analyst decision, confirmed incident, or automated rule. Record who assigned it, when, using what evidence, and whether it can be revised. Uncertain cases should not be forced into a confident class.\n\n## Watch for selection bias\nA dataset made only from previously investigated alerts overrepresents what analysts already noticed. Benign events that were never reviewed may be missing. Sampling strategy affects what an evaluation can claim.\n\n## Protect the people in the data\nUse synthetic or minimized records where possible. Define access, retention, purpose, and review before using personal or employee data.`, exercise: "Review a fictional labeled dataset and list two ways its labels could be incomplete or biased." },
          { slug: "precision-recall", title: "Precision, recall, and alert burden", minutes: 18, content: `## Understand the confusion matrix\nTrue positives are relevant events detected; false positives are benign events flagged; false negatives are relevant events missed. Precision asks what share of alerts were relevant. Recall asks what share of relevant events were found.\n\n## Choose measures for the decision\nA team with limited review capacity may care greatly about alert volume and precision. A high-impact safety use case may prioritize recall while planning how to review additional false positives. Accuracy alone can mislead when relevant events are rare.\n\n## Report the denominator\nShow the evaluation period, sample size, class balance, and uncertainty. Metrics without this context can imply reliability the data does not support.`, exercise: "Given 20 alerts with 5 relevant cases and 8 relevant cases found overall, calculate precision and recall and explain what the numbers omit." },
          { slug: "threshold-tuning", title: "Thresholds and operational tradeoffs", minutes: 17, content: `## A threshold converts a score into a decision\nLowering a threshold usually flags more events, increasing both opportunities to catch relevant activity and review burden. Raising it may reduce noise while missing subtle cases. The exact effect depends on the score distribution and data.\n\n## Tune with real operating constraints\nConsider analyst capacity, event severity, response time, and the cost of missed events. Evaluate candidate thresholds on data kept separate from training, and include different periods or populations where appropriate.\n\n## Keep a safe action boundary\nA model score should not automatically trigger a disruptive response unless the action has been carefully validated, approved, and given safeguards. Human review is appropriate when evidence is uncertain or impact is high.`, exercise: "Propose two different thresholds for a fictional low-impact sign-in alert and a high-impact privileged-account alert. Explain the review process for each." },
        ],
      },
      {
        title: "Deployment and responsible operation",
        description: "Keep detection useful as data, systems, and operational needs change.",
        lessons: [
          { slug: "drift-monitoring", title: "Data drift and model monitoring", minutes: 18, content: `## Performance can change after deployment\nDrift occurs when the data or the relationship between features and outcomes changes. New software, changed schedules, altered log collection, or a different user population can make an old baseline less useful.\n\n## Monitor the whole pipeline\nTrack missing fields, event volume, feature ranges, score distribution, alert counts, analyst disposition, and system health. A sudden change can indicate a model issue or a logging change rather than a new threat.\n\n## Define response and rollback\nSet owners, review thresholds, and safe fallback behavior. Preserve model and feature versions so results can be reproduced and an ineffective detector can be paused.`, exercise: "Draft three drift indicators for a synthetic sign-in model and assign an owner and response for each." },
          { slug: "analyst-in-the-loop", title: "Human review and explainable handoffs", minutes: 17, content: `## A useful alert supports a decision\nAn analyst needs the reason for the alert, relevant evidence, time range, data source, model version, confidence limitations, and safe next checks. A score alone creates work without context.\n\n## Preserve independent judgment\nAnalysts should be able to question and override a model output, record their reasoning, and escalate uncertain cases. Monitor whether review processes create automation bias or uneven impact across groups.\n\n## Close the feedback loop carefully\nDisposition can improve future tuning, but labels need quality checks. Track how overrides are reviewed and how changed thresholds are approved.`, exercise: "Design a one-page alert handoff template that separates model output, supporting evidence, analyst assessment, and next action." },
          { slug: "reproducible-evaluation", title: "Reproducible and responsible evaluation", minutes: 18, content: `## Make results repeatable\nRecord dataset version, collection window, feature definitions, code version, model parameters, threshold, and evaluation method. Split data in a way that avoids leakage across time or related entities when that would inflate performance.\n\n## Test more than a headline metric\nReview false positives and false negatives, performance across relevant segments, operational latency, analyst workload, and failure behavior when data is missing. State limitations and avoid claims beyond the tested population.\n\n## Govern changes\nAssign an owner, approval path, review interval, and rollback plan. Re-evaluate after material changes to data, model, threshold, or use.`, exercise: "Create a reproducibility checklist for a small synthetic anomaly model, including data version, features, split, metrics, limitations, and approval." },
        ],
      },
    ],
    assessment: { title: "AI security analytics checkpoint", questions: [
      { prompt: "What should an anomaly score be treated as?", explanation: "An anomaly is a triage signal that requires context and supporting evidence.", answers: [{ label: "A lead for investigation, not a verdict", correct: true }, { label: "Proof that an account is compromised", correct: false }] },
      { prompt: "What does recall measure?", explanation: "Recall is the share of relevant cases the system successfully identifies.", answers: [{ label: "Relevant cases found divided by all relevant cases", correct: true }, { label: "Relevant alerts divided by all alerts", correct: false }] },
      { prompt: "Why monitor missing fields after deployment?", explanation: "Collection or schema changes can invalidate features and make outputs unreliable.", answers: [{ label: "Missing fields can signal data pipeline drift", correct: true }, { label: "It automatically improves model accuracy", correct: false }] },
    ] },
  },
];

export function syncFoundationCurriculum(): void {
  const timestamp = nowIso();
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const course of courses) {
      db.prepare(
        `INSERT INTO courses
          (id, slug, title, subtitle, description, level, category, estimated_hours, prerequisites, next_course_slug, learning_objectives, published, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
          title = excluded.title, subtitle = excluded.subtitle, description = excluded.description,
          level = excluded.level, category = excluded.category, estimated_hours = excluded.estimated_hours,
          prerequisites = excluded.prerequisites, next_course_slug = excluded.next_course_slug,
          learning_objectives = excluded.learning_objectives, published = 1, updated_at = excluded.updated_at`,
      ).run(
        id(), course.slug, course.title, course.subtitle, course.description, course.level, course.category,
        course.hours, JSON.stringify(course.prerequisites), course.next ?? null,
        JSON.stringify(course.objectives), timestamp, timestamp,
      );
      const courseRow = db.prepare("SELECT id FROM courses WHERE slug = ?").get(course.slug) as { id: string } | undefined;
      if (!courseRow) throw new Error(`Foundation course not found: ${course.slug}`);

      course.modules.forEach((module, moduleIndex) => {
        const existingModule = db.prepare("SELECT id FROM modules WHERE course_id = ? AND sort_order = ?")
          .get(courseRow.id, moduleIndex) as { id: string } | undefined;
        const moduleId = existingModule?.id ?? id();
        if (existingModule) {
          db.prepare("UPDATE modules SET title = ?, description = ? WHERE id = ?")
            .run(module.title, module.description, moduleId);
        } else {
          db.prepare("INSERT INTO modules (id, course_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)")
            .run(moduleId, courseRow.id, module.title, module.description, moduleIndex);
        }

        module.lessons.forEach((lesson, lessonIndex) => {
          const existingLesson = db.prepare(
            `SELECT l.id FROM lessons l JOIN modules m ON m.id = l.module_id
             WHERE m.course_id = ? AND l.slug = ?`,
          ).get(courseRow.id, lesson.slug) as { id: string } | undefined;
          if (existingLesson) {
            db.prepare(
              `UPDATE lessons SET module_id = ?, title = ?, content = ?,
                code_example = COALESCE(?, code_example), exercise = ?, sort_order = ?, duration_minutes = ?
               WHERE id = ?`,
            ).run(moduleId, lesson.title, lesson.content, lesson.code ?? null, lesson.exercise, lessonIndex, lesson.minutes, existingLesson.id);
          } else {
            db.prepare(
              `INSERT INTO lessons (id, module_id, slug, title, content, code_example, exercise, sort_order, duration_minutes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ).run(id(), moduleId, lesson.slug, lesson.title, lesson.content, lesson.code ?? null, lesson.exercise, lessonIndex, lesson.minutes);
          }
        });
      });

      if (course.assessment) {
        const existingQuiz = db.prepare("SELECT id FROM quizzes WHERE course_id = ? AND lesson_id IS NULL")
          .get(courseRow.id) as { id: string } | undefined;
        if (!existingQuiz) {
          const quizId = id();
          db.prepare("INSERT INTO quizzes (id, title, course_id, passing_score) VALUES (?, ?, ?, 70)")
            .run(quizId, course.assessment.title, courseRow.id);
          course.assessment.questions.forEach((question, questionIndex) => {
            const questionId = id();
            db.prepare("INSERT INTO questions (id, quiz_id, prompt, type, explanation, sort_order) VALUES (?, ?, ?, 'single', ?, ?)")
              .run(questionId, quizId, question.prompt, question.explanation, questionIndex);
            question.answers.forEach((answer, answerIndex) => {
              db.prepare("INSERT INTO answers (id, question_id, label, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)")
                .run(id(), questionId, answer.label, answer.correct ? 1 : 0, answerIndex);
            });
          });
        }
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
