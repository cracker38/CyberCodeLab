import { db, nowIso } from "../config/db.js";
import { id } from "../utils/ids.js";
import { penetrationTestingCourses } from "./penetrationTestingCurriculum.js";
import {
  penetrationTestingEntryExam,
  penetrationTestingExams,
  type ProfessionalLevelExam,
} from "./penetrationTestingExams.js";

type Answer = { label: string; correct: boolean };
type Question = { prompt: string; explanation: string; answers: Answer[] };
type Lesson = { slug: string; title: string; minutes: number; content: string; exercise: string; code?: string };
type Module = { title: string; description: string; lessons: Lesson[] };

export type ExpandedCourse = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  hours: number;
  prerequisites: string[];
  next?: string;
  objectives: string[];
  modules: Module[];
  assessment: { title: string; questions: Question[] };
  lab: { slug: string; title: string; category: string; difficulty: "Beginner" | "Intermediate" | "Advanced"; description: string; objectives: string[]; instructions: string };
};

const specialistCourses: ExpandedCourse[] = [
  {
    slug: "secure-software-development",
    title: "Secure Software Development",
    subtitle: "Design, build, test, and release applications with security built in.",
    description: "A practical application security course covering threat modeling, secure design, server-side validation, identity, authorization, testing, dependency review, and release readiness. Work with toy examples and systems you are authorized to change.",
    level: "Intermediate",
    category: "Secure Development",
    hours: 18,
    prerequisites: ["Web Security", "Python for Cybersecurity"],
    next: "devsecops-supply-chain",
    objectives: ["Turn risks into testable security requirements", "Apply validation, encoding, and authorization at the correct boundaries", "Review dependencies and test security properties before release"],
    modules: [
      {
        title: "Design for security",
        description: "Find risks early, while design changes are still inexpensive.",
        lessons: [
          { slug: "security-requirements", title: "Writing security requirements", minutes: 18, content: `## Start with the user and the data\nA security requirement describes a property the system must preserve. Begin by identifying users, sensitive data, important actions, and the places where trust changes. Avoid requirements such as “make it secure”; they cannot be tested.\n\n## Make the requirement verifiable\nWrite a condition that can be checked. For example: “A signed-in user can read only records assigned to their account” is testable. Pair the condition with a negative case: a different account must receive a denial and no record data.\n\n## Keep requirements proportional\nProtect high-impact actions more strongly than low-risk preferences. Record why a control exists so a later team can maintain it.`, exercise: "Choose a small application feature. Write one security requirement and one test that proves unauthorized access is denied." },
          { slug: "threat-modeling", title: "Threat modeling a small feature", minutes: 22, content: `## A focused threat model\nThreat modeling is a structured review of what can go wrong. It does not require a large diagram or specialized software. Pick one feature, identify its assets and users, sketch the data flow, then ask how the flow could be misused.\n\n## Work in four passes\n1. List assets, such as account details, session tokens, and stored files.\n2. Mark trust boundaries, such as a browser-to-server request.\n3. Describe plausible threats, including mistakes and compromised credentials.\n4. Choose a control and a test for each high-priority threat.\n\n## Keep the result useful\nA threat model is a living design note. Revisit it when the feature, data, or trust boundary changes.`, exercise: "Draw a three-box data flow for a sign-in form. Mark one trust boundary and write two plausible threats with mitigations." },
          { slug: "trust-boundaries", title: "Trust boundaries and least privilege", minutes: 16, content: `## Do not trust a boundary crossing\nEvery request from a browser, service, plugin, or uploaded file crosses a trust boundary. Treat its identity, shape, and intent as untrusted until the server validates them. A hidden button or disabled menu item is not an access control.\n\n## Reduce the authority of each component\nLeast privilege limits a component to the permissions it needs. A reporting job should not need account-management rights. A user-facing API should not accept an administrator role supplied by the client.\n\n## Review the whole path\nCheck where identity is established, where permission is checked, and whether the same policy protects reads and writes. Repeat checks close to the data operation.`, exercise: "For a feature you know, list each component that handles a request and the minimum data or permissions it needs." },
        ],
      },
      {
        title: "Protect application data and actions",
        description: "Validate input, encode output, and enforce access on the server.",
        lessons: [
          { slug: "input-validation", title: "Validate data at the server boundary", minutes: 18, content: `## Validation establishes shape\nValidate input where it enters the server: expected type, length, allowed values, and required fields. Reject data that does not fit the operation. Client-side validation improves usability, but it cannot replace server validation.\n\n## Keep data separate from instructions\nUse parameterized database queries instead of building SQL with string concatenation. Apply a parser or established library for structured formats rather than inventing a partial parser.\n\n## Validation is not output safety\nValid text can still be unsafe in an HTML, JavaScript, URL, or shell context. Choose the output encoding or API that matches the destination.`, exercise: "Write a schema for a profile update with a bounded name and optional short biography. Add a test for an unexpected field type.", code: `const profile = z.object({\n  fullName: z.string().trim().min(2).max(80),\n  bio: z.string().max(500).optional(),\n});` },
          { slug: "output-encoding", title: "Output encoding and safe rendering", minutes: 17, content: `## Encode for the destination\nOutput encoding turns data into text that is safe for a specific context. HTML text, an HTML attribute, a URL component, and JavaScript each have different rules. Use framework escaping by default and avoid injecting raw HTML from user input.\n\n## Prefer safe interfaces\nUse DOM text properties or framework-rendered text nodes for plain text. When rich text is required, use a maintained sanitizer with a narrow allowed format. Do not build shell commands or SQL statements by joining untrusted strings.\n\n## Test the boundary\nInclude harmless strings with quotes, angle brackets, and ampersands in test data. Confirm they display as text and do not change page structure or behavior.`, exercise: "Add a profile value containing `<`, `&`, and quotes to a local test page. Confirm the page renders it as text rather than interpreting markup." },
          { slug: "authentication-authorization", title: "Authentication, sessions, and authorization", minutes: 20, content: `## Identity is only the first check\nAuthentication establishes which account is making a request. Authorization decides whether that account may perform the requested action on the specific object. A signed-in user does not automatically own every record.\n\n## Protect session credentials\nUse established password-hashing libraries and secure session mechanisms. Set appropriate cookie protections, rotate or revoke sessions when needed, and never log raw passwords, reset tokens, or session identifiers.\n\n## Check access on every request\nResolve the object on the server, verify ownership or role, and only then return or change its data. Apply the same policy to API endpoints, background jobs, and export functions.`, exercise: "Write a test matrix for a record endpoint: owner reads, another user reads, owner updates, another user updates, and signed-out request." },
        ],
      },
      {
        title: "Verify and release safely",
        description: "Turn security expectations into automated checks and repeatable release practices.",
        lessons: [
          { slug: "security-tests", title: "Testing security properties", minutes: 19, content: `## Test what must never happen\nSecurity tests should verify denied behavior as carefully as successful behavior. Test missing authentication, insufficient roles, wrong object ownership, malformed input, and expired or invalid credentials.\n\n## Keep tests close to the boundary\nUnit tests are useful for policy functions. Integration tests prove the route, middleware, and data layer work together. Use isolated fixtures so one learner's or tenant's data cannot accidentally satisfy another test.\n\n## Avoid brittle assertions\nAssert stable properties such as status, response shape, and absence of protected fields. Do not depend on error wording or implementation details unless they are part of the contract.`, exercise: "Add an integration test for an account that tries to read a record owned by a different test account." },
          { slug: "dependency-review", title: "Dependency and package review", minutes: 18, content: `## Dependencies are part of your product\nA package can add code, permissions, build steps, and transitive dependencies. Keep a dependency inventory and lock resolved versions so builds are repeatable.\n\n## Review updates with context\nUse supported versions, read release notes for major changes, and investigate security advisories that apply to your usage. A scanner finding is a signal to triage, not a complete risk assessment. Check whether the affected code is reachable and whether a safe update exists.\n\n## Limit supply-chain exposure\nPrefer packages with a clear maintainer history and minimal install behavior. Avoid installing a package just to copy a few lines of code.`, exercise: "Inspect a small project's lockfile. Identify one direct dependency, one transitive dependency, and the command used to update them reproducibly." },
          { slug: "secure-release", title: "Release readiness and rollback", minutes: 18, content: `## Prepare a safe release\nBefore release, review security tests, dependency changes, configuration, and data migrations. Keep secrets in a managed environment and verify the application can start without development defaults.\n\n## Make changes observable\nLog security-relevant events with enough context to investigate, while excluding credentials and unnecessary personal data. Confirm alerts and operational ownership are clear before enabling a sensitive feature.\n\n## Plan recovery\nA rollback plan should state who can act, what data changes are reversible, and how service health will be confirmed. A deploy is complete only after the team verifies the expected behavior.`, exercise: "Create a release checklist with one check for secrets, one for access control, one for monitoring, and one for rollback." },
        ],
      },
    ],
    assessment: { title: "Secure development checkpoint", questions: [
      { prompt: "Where should authorization for a protected record be enforced?", explanation: "The server must verify access to the specific object for every request.", answers: [{ label: "Only in the user interface", correct: false }, { label: "On the server for each request and object", correct: true }, { label: "Only when the account is created", correct: false }] },
      { prompt: "What is the main benefit of parameterized database queries?", explanation: "Parameters keep user values separate from SQL instructions.", answers: [{ label: "They keep input data separate from query structure", correct: true }, { label: "They encrypt every database file", correct: false }, { label: "They remove the need for authorization", correct: false }] },
      { prompt: "Should a security test cover denied access as well as successful access?", explanation: "Negative tests verify that prohibited behavior remains blocked.", answers: [{ label: "Yes", correct: true }, { label: "No", correct: false }] },
    ] },
    lab: { slug: "secure-code-review-lab", title: "Secure code review practice", category: "Secure Development Labs", difficulty: "Intermediate", description: "Review a small local sample application and turn security observations into testable fixes.", objectives: ["Identify trust boundaries", "Find missing authorization checks", "Write a negative access test"], instructions: `## Use a local sample only\nCreate a toy profile API with two test accounts and sample records. Do not review or probe a system unless you own it or have written permission.\n\n## Review\n1. Trace one request from input to database and response.\n2. Check validation, query construction, and object ownership.\n3. Record each concern with its impact and a reproducible test.\n4. Fix one issue and run the test for both the allowed and denied case.\n\n## Submit\nWrite a short review note describing the boundary, risk, fix, and test result. Never include real secrets or personal data.` },
  },
  {
    slug: "blue-team-operations",
    title: "Blue Team Operations",
    subtitle: "Collect useful signals, investigate alerts, and coordinate a response.",
    description: "Learn a provider-neutral defensive operations workflow: map telemetry to questions, normalize events, establish baselines, triage alerts, and document response decisions. All practice uses synthetic logs or systems you administer.",
    level: "Intermediate",
    category: "Blue Team",
    hours: 20,
    prerequisites: ["Linux for Security", "Networking Essentials"],
    next: "digital-forensics-response",
    objectives: ["Choose telemetry that answers a defined security question", "Triage alerts using evidence and impact", "Document containment and handoff decisions clearly"],
    modules: [
      {
        title: "Build operational visibility",
        description: "Know what is observable before designing alerts.",
        lessons: [
          { slug: "security-operations-center", title: "How a security operations team works", minutes: 17, content: `## Operations is a feedback loop\nA security operations team turns signals into decisions. The loop is collect, detect, investigate, respond, and learn. Tools support the loop; they do not replace clear ownership or judgment.\n\n## Start with a question\nAsk what the team needs to know: which accounts changed privilege, which services failed, or whether a host contacted an unexpected destination. A specific question helps select useful logs and define who will respond.\n\n## Define responsibilities\nDocument who receives an alert, who can isolate a device, who approves higher-impact actions, and who communicates status. Escalation paths should be known before an incident.`, exercise: "Draw a simple alert handoff with an analyst, service owner, and incident lead. Label the decision each person owns." },
          { slug: "telemetry-planning", title: "Planning telemetry collection", minutes: 18, content: `## Collect evidence with purpose\nTelemetry can include authentication events, process starts, network connections, service changes, and application audit records. Select sources based on the risks and questions you need to investigate.\n\n## Check coverage and gaps\nFor each source, record which assets produce it, how long it is retained, who can access it, and what time standard it uses. Missing coverage is important context; an empty log does not prove that an event did not happen.\n\n## Balance value and cost\nCollecting everything can create noise, expense, and privacy risk. Restrict fields to what is useful, define retention, and protect access to the resulting records.`, exercise: "Choose one account-takeover question. List two data sources that could help answer it and one visibility gap." },
          { slug: "log-normalization", title: "Making event data consistent", minutes: 20, content: `## Normalize for comparison\nDifferent systems name the same idea differently. One may record ` + "`user`" + `, another ` + "`principal`" + `. A normalized event uses consistent fields such as timestamp, actor, action, object, source, and result.\n\n## Preserve the original\nKeep a reference to the original event or source record. Normalization can lose detail, and analysts need to be able to return to the source when a field is ambiguous.\n\n## Handle time carefully\nStore timestamps with an explicit timezone or a consistent UTC representation. Record ingestion time separately when possible; delayed delivery can otherwise distort event order.`, exercise: "Map three differently named fields from sample authentication logs into a common actor, action, time, and outcome format.", code: `event = {\n    "time_utc": "2026-01-15T09:30:00Z",\n    "actor": "sample-user",\n    "action": "login",\n    "outcome": "failure"\n}` },
        ],
      },
      {
        title: "Detect and investigate",
        description: "Build useful baselines and treat every alert as a question to investigate.",
        lessons: [
          { slug: "baseline-behavior", title: "Establishing a useful baseline", minutes: 18, content: `## Baselines describe expected behavior\nA baseline is a reference for normal activity in a particular environment. It might describe typical login hours, service relationships, or expected administrative changes. Normal varies by team, season, and system role.\n\n## Avoid treating rare as malicious\nAn unusual event is a lead, not a verdict. Travel, maintenance, new hires, and scheduled jobs all change behavior. Pair unusualness with context such as account role, asset importance, and recent change records.\n\n## Revisit the baseline\nA stale baseline creates noise. Review it after organizational or technical changes and preserve a record of what changed and why.`, exercise: "Using a synthetic login table, describe two normal patterns and one outlier that deserves context before escalation." },
          { slug: "alert-triage", title: "Triage an alert with evidence", minutes: 20, content: `## Triage means reducing uncertainty\nA triage note should answer what happened, which account or asset is involved, when it occurred, what evidence supports the alert, and what remains unknown. Separate observed facts from assumptions.\n\n## Use a repeatable sequence\n1. Validate that the event is from a trusted source.\n2. Identify the affected identity, device, and service.\n3. Review surrounding events and relevant change records.\n4. Assess impact and choose the next safe action.\n\n## Preserve context\nRecord searches, time ranges, and source identifiers so another analyst can reproduce the review. Do not close an alert solely because one indicator is absent.`, exercise: "Write a five-sentence triage note for a synthetic burst of failed sign-ins, including facts, unknowns, and the next check." },
          { slug: "detection-quality", title: "Improving detection quality", minutes: 17, content: `## Measure usefulness, not alert volume\nA detection should describe the behavior it is meant to find, the data it needs, and the response expected. Track true findings, benign matches, missed coverage, and analyst effort.\n\n## Tune with evidence\nWhen an alert is noisy, identify the exact condition causing the match. Add a narrow exception only when the behavior is understood and documented. Broad exclusions can hide the event the rule was designed to catch.\n\n## Test after every change\nReplay representative benign and concerning sample events. Keep examples with the rule so future changes can be checked against the same expectations.`, exercise: "For a fictional alert, propose one benign test case, one concerning test case, and one metric that would show whether tuning helped." },
        ],
      },
      {
        title: "Coordinate an incident",
        description: "Make proportionate response decisions and create a record others can use.",
        lessons: [
          { slug: "incident-severity", title: "Assessing incident severity", minutes: 16, content: `## Severity supports prioritization\nSeverity estimates urgency and potential impact; it is not a statement of certainty. Consider the sensitivity of affected data, service criticality, scope, persistence, and whether harm is ongoing.\n\n## State confidence separately\nA high-impact event can have uncertain cause, and a low-confidence signal can still merit quick validation. Record impact, confidence, and urgency as separate judgments with the evidence behind them.\n\n## Escalate by impact\nUse a documented matrix so analysts know when to involve system owners, leadership, legal, or privacy specialists. Reassess severity when new facts arrive.`, exercise: "Rate three synthetic events by impact and confidence. Explain why those ratings might lead to different response priorities." },
          { slug: "containment-planning", title: "Planning proportionate containment", minutes: 19, content: `## Containment has tradeoffs\nIsolating an account or host can reduce ongoing risk, but it can also interrupt essential services or destroy volatile context. Consider urgency, business impact, available evidence, and who has authority to approve the action.\n\n## Choose a reversible step when possible\nDisable a narrowly scoped credential, restrict one affected connection, or preserve a snapshot before taking a broad action. Use the incident plan and coordinate with the service owner.\n\n## Verify the result\nAfter containment, confirm the change took effect and monitor for continued activity. Record the time, actor, reason, and follow-up needed to restore normal service safely.`, exercise: "For a synthetic compromised test account, propose a low-impact containment action, an approval point, and a verification step." },
          { slug: "incident-reporting", title: "Writing an incident handoff", minutes: 16, content: `## Make the report useful to the next person\nA handoff should summarize the situation, affected assets, confirmed timeline, actions taken, evidence references, open questions, and the next owner. Keep it factual and concise.\n\n## Separate facts from interpretation\nUse labels such as confirmed, likely, and unknown. Preserve source identifiers and timestamps. Avoid copying sensitive data into broad channels when a protected reference is sufficient.\n\n## Close the learning loop\nAfter recovery, record control gaps and practical improvements. Assign an owner and a due date. A useful review improves the system without turning the report into blame.`, exercise: "Draft a short handoff for a fictional service outage caused by a suspicious account change. Include one confirmed fact and one unresolved question." },
        ],
      },
    ],
    assessment: { title: "Blue team operations checkpoint", questions: [
      { prompt: "Does an unusual login prove that an account is compromised?", explanation: "An outlier is a lead that needs context and corroborating evidence.", answers: [{ label: "Yes, every outlier proves compromise", correct: false }, { label: "No, investigate context and supporting evidence", correct: true }] },
      { prompt: "Why keep a reference to the original log event after normalization?", explanation: "Analysts may need details that the normalized representation does not retain.", answers: [{ label: "To verify and recover source context", correct: true }, { label: "To avoid documenting the event", correct: false }, { label: "To change the original timestamp", correct: false }] },
      { prompt: "What should a triage note distinguish?", explanation: "Separating observation from assumption makes the investigation reproducible.", answers: [{ label: "Observed facts and unverified assumptions", correct: true }, { label: "Personal opinions and product rankings", correct: false }] },
    ] },
    lab: { slug: "blue-team-triage-lab", title: "Synthetic alert triage", category: "Blue Team Labs", difficulty: "Intermediate", description: "Investigate a small synthetic authentication log and write a concise, evidence-based triage handoff.", objectives: ["Normalize event fields", "Build a short timeline", "Separate observations from assumptions"], instructions: `## Practice boundaries\nUse only synthetic events created for this exercise. Do not collect or inspect another person's account data.\n\n## Analyze\n1. Normalize timestamps, actors, actions, and outcomes.\n2. Group related events into a short timeline.\n3. Identify one pattern, one alternative explanation, and one missing data source.\n4. Recommend a safe next check and state its owner.\n\n## Deliver\nSubmit a triage note with source references, confidence, impact, and next action. Do not label an event malicious without supporting evidence.` },
  },
  {
    slug: "cloud-security-foundations",
    title: "Cloud Security Foundations",
    subtitle: "Secure cloud identities, networks, data, and day-to-day operations.",
    description: "A provider-neutral introduction to cloud security. Learn shared responsibility, identity boundaries, network and storage controls, audit visibility, configuration review, and recovery planning without relying on a specific vendor's console.",
    level: "Intermediate",
    category: "Cloud Security",
    hours: 18,
    prerequisites: ["Networking Essentials", "Web Security"],
    objectives: ["Explain shared responsibility and cloud identity boundaries", "Review network, storage, and encryption controls", "Plan logging, configuration checks, and recovery"],
    modules: [
      {
        title: "Identity and responsibility",
        description: "Map who secures each layer and reduce unnecessary cloud authority.",
        lessons: [
          { slug: "cloud-shared-responsibility", title: "The shared responsibility model", minutes: 17, content: `## Responsibility is divided\nCloud providers secure parts of the underlying service, while customers remain responsible for their identities, data, configuration, and workloads. The exact boundary depends on the service model and contract.\n\n## Map the boundary for each service\nFor every system, write down who patches the operating layer, manages access, configures network exposure, protects data, and reviews audit records. Do not assume a managed service removes every customer task.\n\n## Recheck when services change\nMoving from a virtual machine to a managed platform changes who operates components, but it does not remove the need to control access and data use.`, exercise: "Choose a fictional cloud-hosted web app. Make a responsibility table for identity, application code, operating system, network rules, and backups." },
          { slug: "cloud-identity", title: "Cloud identities and roles", minutes: 20, content: `## Identity is the control plane\nCloud identities can create resources, read data, change network rules, and delegate access. A compromised high-privilege identity can affect many systems at once.\n\n## Prefer scoped roles\nGive users and workloads only the actions and resources they need. Use separate roles for deployment, operations, and read-only review. Avoid shared administrator accounts and long-lived credentials where a short-lived identity is available.\n\n## Review effective access\nPolicies combine in ways that are easy to overlook. Review inherited permissions, wildcard actions, trust relationships, and unused identities. Test the intended allow and deny paths in a non-production environment.`, exercise: "Design three roles for a sample service: deployer, operator, and auditor. Write one action each role must not be allowed to perform." },
          { slug: "cloud-credential-lifecycle", title: "Credential lifecycle and workload identity", minutes: 18, content: `## Reduce credential exposure\nA credential should have an owner, purpose, scope, and expiry or rotation plan. Long-lived keys copied into source code, images, notebooks, or tickets are difficult to control.\n\n## Prefer workload identity\nWhen a platform can issue short-lived credentials to a workload, use that mechanism instead of embedding a reusable secret. Restrict the trust policy to the expected workload and environment.\n\n## Respond to exposure\nIf a secret is exposed, revoke or rotate it, review use logs, identify copies, and fix the path that allowed it to leak. Deleting the visible copy is not enough if it may remain in history or artifacts.`, exercise: "Create a credential inventory template with fields for owner, purpose, scope, storage, rotation, and revocation contact." },
        ],
      },
      {
        title: "Network and data controls",
        description: "Reduce exposure and protect stored information across service boundaries.",
        lessons: [
          { slug: "cloud-network-segmentation", title: "Network segmentation in cloud environments", minutes: 19, content: `## Start from required flows\nNetwork rules should describe which service needs to reach which other service, on what protocol, and why. Separate public entry points from internal application components and data stores.\n\n## Restrict both directions\nInbound rules control who can reach a service; outbound rules limit where it can connect. Broad rules make changes easy but increase the effect of a compromised workload.\n\n## Keep a reviewable map\nDocument trust zones and necessary flows. Review rules after deployments and retire temporary access. Use a staging environment to confirm that a tighter rule does not break legitimate service behavior.`, exercise: "Sketch a three-tier web application and list the minimum network flows between the public edge, application, and database." },
          { slug: "cloud-storage-access", title: "Storage access and exposure review", minutes: 17, content: `## Default to private\nObject stores, file shares, snapshots, and backups may contain sensitive data. Make private access the default, grant access to named identities, and use temporary links only when needed.\n\n## Review access paths\nCheck direct public access, inherited policies, cross-account trusts, old snapshots, and service identities. Confirm both who can read and who can change permissions.\n\n## Verify the effective setting\nA policy file may not show all effective access. Use the provider's supported access analyzer or administrative view, then validate the intended audience with a safe test object. Keep evidence of the review.`, exercise: "Build a checklist for reviewing a fictional storage container. Include public access, identity grants, sharing links, and backup copies." },
          { slug: "cloud-encryption-keys", title: "Encryption and key management", minutes: 18, content: `## Encryption supports a broader control\nEncryption at rest and in transit can reduce exposure, but it does not decide who is authorized to use the data. An identity that can read plaintext or use a key may still have broad access.\n\n## Manage keys deliberately\nAssign key ownership, limit key administration, plan rotation, monitor use, and document recovery. Separate permission to administer a key from permission to use it where the service permits.\n\n## Plan for availability\nA key policy mistake can make important data unavailable. Test recovery and rotation procedures with non-production data before relying on them for a critical workload.`, exercise: "Describe how key administration, key use, data access, and recovery should be separated for a sample document store." },
        ],
      },
      {
        title: "Operate and recover securely",
        description: "Create visibility, detect drift, and prove that recovery works.",
        lessons: [
          { slug: "cloud-audit-logging", title: "Audit logs and cloud visibility", minutes: 18, content: `## Record control-plane activity\nAudit logs can show who changed identities, policies, networks, and resources. Enable the relevant sources across accounts or projects and protect the logs from ordinary workload administrators.\n\n## Make records usable\nUse consistent time, retain source identity and action, and route important events to a monitored destination. Define how long logs are kept and who can search them.\n\n## Test the signal\nPerform an authorized low-risk configuration change in a test account and confirm it appears in the expected audit stream. An enabled checkbox is not proof that records are arriving.`, exercise: "Write a verification plan for confirming that a test role change appears in an audit log with actor, target, action, and time." },
          { slug: "cloud-configuration-review", title: "Configuration review and drift", minutes: 19, content: `## Configuration changes over time\nA secure starting configuration can drift through emergency fixes, copied templates, or changes made outside the normal pipeline. Review effective settings, not only the original template.\n\n## Use a baseline carefully\nA baseline should state its scope, reason, owner, and exceptions. Automated checks can flag public storage, broad access, missing logs, and unapproved regions, but teams still need to assess context and correct false assumptions.\n\n## Close the loop\nAssign each finding to an owner, set a risk-based priority, track the correction, and confirm the resource no longer violates the intended policy.`, exercise: "Create five configuration checks for a sample service and label each as preventative, detective, or recovery focused." },
          { slug: "cloud-backup-recovery", title: "Backup and recovery planning", minutes: 18, content: `## A backup is useful only if it restores\nRecovery depends on clean copies, protected credentials, known dependencies, and a tested procedure. A backup that shares the same destructive permissions as production may not survive an incident.\n\n## Set recovery objectives\nDefine how much data loss and downtime the service can tolerate. Use those requirements to choose backup frequency, retention, geographic placement, and restoration order.\n\n## Practice restoration\nRun a controlled restore with sample data. Record the time, missing dependencies, integrity checks, and decisions. Review the plan after architecture or account ownership changes.`, exercise: "Write a small recovery plan for a course website: identify the data, backup owner, restore order, and one integrity check." },
        ],
      },
    ],
    assessment: { title: "Cloud security checkpoint", questions: [
      { prompt: "Does using a managed cloud service remove the customer's responsibility for access and data configuration?", explanation: "The responsibility boundary changes by service, but customers retain important identity, data, and configuration duties.", answers: [{ label: "Yes, the provider owns every security task", correct: false }, { label: "No, responsibilities depend on the service and must be mapped", correct: true }] },
      { prompt: "Which credential approach generally reduces long-lived secret exposure for workloads?", explanation: "Scoped short-lived workload identities avoid embedding reusable keys where supported.", answers: [{ label: "A shared administrator key in source code", correct: false }, { label: "A scoped, short-lived workload identity", correct: true }] },
      { prompt: "What proves an audit logging setup is useful?", explanation: "A test event should appear in the monitored destination with useful fields.", answers: [{ label: "The settings page says logging is enabled", correct: false }, { label: "An authorized test change is received and verified", correct: true }] },
    ] },
    lab: { slug: "cloud-configuration-review-lab", title: "Cloud configuration review", category: "Cloud Security Labs", difficulty: "Intermediate", description: "Review a fictional cloud configuration and prioritize safe, evidence-based improvements.", objectives: ["Find broad identity permissions", "Review storage and network exposure", "Propose an auditable remediation"], instructions: `## Scenario\nUse the fictional configuration below in a local document; do not connect to a real cloud account. A web service has a public edge, an application role, a data bucket, and audit logging.\n\n## Review tasks\n1. Identify one excessive identity permission, one unnecessary network path, and one storage exposure risk.\n2. For each finding, state the evidence, possible impact, and smallest corrective change.\n3. Describe how to verify the fix without exposing real data.\n4. Add one check that would detect future configuration drift.\n\n## Deliverable\nWrite a prioritized review with an owner and verification step for each action.` },
  },
  {
    slug: "digital-forensics-response",
    title: "Digital Forensics and Incident Response",
    subtitle: "Preserve evidence, build a timeline, and communicate defensible findings.",
    description: "An introductory, authorization-first course in incident evidence handling. Practice scope definition, evidence integrity, endpoint and log timelines, hypothesis testing, containment coordination, and concise reporting using synthetic data.",
    level: "Advanced",
    category: "Digital Forensics",
    hours: 19,
    prerequisites: ["Linux for Security", "Python for Cybersecurity", "Blue Team Operations"],
    objectives: ["Define scope and preserve evidence integrity", "Build a timeline while accounting for clock and source limitations", "Report findings with confidence, limitations, and next actions"],
    modules: [
      {
        title: "Prepare and preserve evidence",
        description: "Establish authority, scope, and repeatable handling before analysis.",
        lessons: [
          { slug: "forensic-scope-authority", title: "Scope, authority, and collection plans", minutes: 17, content: `## Establish authority first\nBefore collecting data, confirm who authorized the work, which systems and accounts are in scope, what time period matters, and who can approve changes. Do not expand collection because more data might be interesting.\n\n## Minimize collection\nCollect only sources that answer the investigation question. Consider privacy, business continuity, retention rules, and the potential sensitivity of personal data. Escalate uncertainty to the incident lead or appropriate specialist.\n\n## Write the plan\nA collection plan names the source, method, owner, time, storage location, and integrity check. A clear plan prevents accidental changes and makes later review possible.`, exercise: "Draft a one-page scope for a fictional laptop malware alert. State what is in scope, what is out of scope, and who approves isolation." },
          { slug: "chain-of-custody", title: "Evidence handling and chain of custody", minutes: 18, content: `## Preserve provenance\nEvidence is useful when another reviewer can understand where it came from and how it was handled. Record a unique item identifier, source, collector, date and time, method, and every transfer or access.\n\n## Protect integrity\nUse approved acquisition procedures and preserve originals. Record cryptographic hashes where appropriate, then verify copies against the recorded values. A matching hash supports integrity; it does not by itself prove where the file originated.\n\n## Secure storage\nLimit access, protect encryption keys, and keep a record of analysis copies. If a tool or process may alter source media, document the limitation and involve a qualified forensic lead.`, exercise: "Create a chain-of-custody table for a synthetic log archive with columns for item ID, collector, time, action, destination, and integrity check." },
          { slug: "volatile-data", title: "Volatile data and collection order", minutes: 19, content: `## Some evidence changes quickly\nRunning processes, active network connections, memory contents, and temporary state may disappear when a system is shut down. Persistent files are usually more stable, but collection can still change timestamps or metadata.\n\n## Choose an order deliberately\nThe right order depends on the investigation goal, safety, system role, and available expertise. Do not improvise invasive collection on a critical system. Follow the approved incident plan and preserve availability where possible.\n\n## Record limitations\nFor every source, note what was collected, what was not, which tool or method was used, and whether the process could alter the system. These notes keep conclusions proportionate to the evidence.`, exercise: "Given a fictional powered-on workstation, list three volatile sources and two risks that should be discussed before collection." },
        ],
      },
      {
        title: "Build and test an event timeline",
        description: "Correlate sources without hiding time, collection, or interpretation limits.",
        lessons: [
          { slug: "forensic-timestamps", title: "Timestamps, time zones, and clock drift", minutes: 18, content: `## A timestamp needs context\nA recorded time may represent event time, device time, server receipt, or export time. Sources may use different time zones, daylight-saving rules, or clocks that are out of sync.\n\n## Normalize without discarding\nChoose a common display standard such as UTC, but preserve the original timestamp and record the conversion method. Estimate clock drift only when there is supporting evidence. Do not silently “correct” a source to fit a theory.\n\n## Show uncertainty\nUse ranges or confidence notes when the exact order is unclear. A timeline is a working model that should be updated as source reliability becomes clearer.`, exercise: "Normalize three fictional events from different time zones to UTC. Preserve each original value and explain any ordering uncertainty." },
          { slug: "log-correlation", title: "Correlating logs and endpoint artifacts", minutes: 20, content: `## Correlation links records cautiously\nA username, address, hostname, or process name can connect events, but identifiers may be reused, shared, or spoofed. Record why two events are believed to refer to the same actor or system.\n\n## Use multiple sources\nCompare authentication records, endpoint events, application logs, and change records when authorized. Independent sources can strengthen a timeline, while a shared upstream source may create false confidence.\n\n## Preserve references\nKeep source names, record identifiers, collection times, and filters with each timeline entry. Another analyst should be able to locate the original evidence without relying on your memory.`, exercise: "Correlate a synthetic sign-in event with an application event. List the matching fields, possible ambiguity, and one independent source to check." },
          { slug: "artifact-limitations", title: "Artifact meaning and limitations", minutes: 16, content: `## Artifacts are clues, not complete stories\nA file timestamp, browser entry, process record, or shell history may support a hypothesis. It may also be affected by application behavior, cleanup, time drift, shared accounts, or collection method.\n\n## Ask how the artifact was created\nUnderstand what the source records, when it writes the record, how it can be altered, and what absence means. A missing artifact does not always prove an event did not happen.\n\n## State confidence carefully\nSeparate direct observation from interpretation. Use language such as “the log records” for facts and “this is consistent with” for an inference.`, exercise: "Choose one common endpoint artifact and write what it can support, what it cannot prove by itself, and what source could corroborate it." },
        ],
      },
      {
        title: "Analyze, respond, and report",
        description: "Test hypotheses, coordinate safe actions, and explain conclusions.",
        lessons: [
          { slug: "forensic-hypotheses", title: "Testing competing hypotheses", minutes: 19, content: `## Avoid confirmation bias\nStart with more than one plausible explanation. For a suspicious login, possibilities might include stolen credentials, a legitimate administrator, a shared workstation, or a clock mismatch.\n\n## Define discriminating evidence\nFor each hypothesis, state what evidence would support or weaken it. Prefer checks that distinguish explanations rather than collecting more records that all reflect the same event.\n\n## Update conclusions\nRecord when a hypothesis changes and why. Keep uncertainty visible, and do not claim attribution when the evidence only supports a behavior or account.`, exercise: "Write two competing explanations for a fictional account change and identify one evidence source that could distinguish them." },
          { slug: "forensic-containment", title: "Coordinating investigation and containment", minutes: 18, content: `## Evidence and safety both matter\nAn incident response may require quick containment while preserving evidence. Coordinate the decision with the incident lead and service owner; consider whether an action will destroy volatile state or interrupt essential operations.\n\n## Use an approved decision path\nRecord the risk of waiting, the impact of acting, who approved the action, and how the result will be verified. If immediate action is needed to prevent harm, document the emergency decision as soon as practical.\n\n## Keep analysis independent\nSeparate containment steps from investigative observations in your timeline. This helps later reviewers distinguish what happened naturally from what responders changed.`, exercise: "For a fictional server with suspected credential misuse, write an escalation note comparing immediate account disablement with a short evidence-preservation delay." },
          { slug: "forensic-reporting", title: "Writing a defensible findings report", minutes: 18, content: `## A report answers the decision question\nBegin with scope, question, summary, and the most important findings. Then provide methods, evidence references, timeline, confidence, limitations, and recommended actions.\n\n## Make reasoning traceable\nFor each conclusion, show the observations that support it and note meaningful alternatives. Avoid unexplained jargon, excessive raw logs, and unsupported claims about a person's intent.\n\n## Protect the audience\nShare sensitive evidence only with approved recipients. Tailor the summary to the decision-maker while keeping the technical record available to authorized reviewers.`, exercise: "Write a short findings summary for a synthetic investigation. Include one supported conclusion, one limitation, and one recommended follow-up." },
        ],
      },
    ],
    assessment: { title: "Digital forensics checkpoint", questions: [
      { prompt: "What does a matching cryptographic hash of an evidence copy support?", explanation: "It supports that the copy matches the hashed content; it does not establish origin by itself.", answers: [{ label: "That the copy matches the hashed content", correct: true }, { label: "Who created the original file", correct: false }, { label: "That the event was malicious", correct: false }] },
      { prompt: "Should investigators preserve original timestamps when normalizing a timeline?", explanation: "Preserving original values and the conversion method makes the timeline auditable.", answers: [{ label: "Yes, retain originals and document conversions", correct: true }, { label: "No, replace them with estimates", correct: false }] },
      { prompt: "Does one endpoint artifact prove a user's intent?", explanation: "Artifacts support limited conclusions and should be interpreted with context and corroboration.", answers: [{ label: "Yes, by itself", correct: false }, { label: "No, it is evidence to interpret and corroborate", correct: true }] },
    ] },
    lab: { slug: "forensic-timeline-lab", title: "Build a defensible event timeline", category: "Digital Forensics Labs", difficulty: "Advanced", description: "Normalize a set of synthetic events and write a cautious, source-linked incident timeline.", objectives: ["Preserve original timestamps", "Correlate independent sources", "State uncertainty and limitations"], instructions: `## Scope\nUse only the fictional event records provided by your instructor or generated for this exercise. Do not collect data from systems without explicit authorization.\n\n## Analyze\n1. Preserve each original timestamp and source identifier.\n2. Convert times to UTC and note uncertain offsets.\n3. Correlate events using at least two independent fields.\n4. Write two competing explanations and identify evidence that would distinguish them.\n\n## Deliver\nSubmit a timeline with confidence notes, source references, one limitation, and one safe next action.` },
  },
  {
    slug: "devsecops-supply-chain",
    title: "DevSecOps and Software Supply Chains",
    subtitle: "Protect build pipelines, dependencies, artifacts, and releases.",
    description: "Secure the path from source code to production. This course covers pipeline identity, build isolation, secret handling, dependency inventories, artifact integrity, container hygiene, security gates, and response to vulnerable components.",
    level: "Advanced",
    category: "DevSecOps",
    hours: 18,
    prerequisites: ["Secure Software Development", "Python for Cybersecurity"],
    objectives: ["Limit the authority of build and deployment identities", "Track and verify dependencies and build artifacts", "Use security checks and release gates with clear ownership"],
    modules: [
      {
        title: "Protect the build pipeline",
        description: "Treat automation as privileged software with its own attack surface.",
        lessons: [
          { slug: "pipeline-trust", title: "Build pipeline trust boundaries", minutes: 18, content: `## A pipeline can change production\nBuild automation reads source, downloads dependencies, creates artifacts, and may deploy them. Each step has authority and can affect the integrity of software users receive.\n\n## Map identities and inputs\nIdentify who can change pipeline definitions, approve releases, publish packages, and access build workers. Treat pull requests, third-party actions, build images, and downloaded tools as inputs that need review.\n\n## Isolate sensitive stages\nUse separate permissions for testing and production deployment. Require protected review for changes that can obtain release credentials or alter the build process.`, exercise: "Draw a pipeline from source commit to production. Mark the identities, external inputs, and point where production authority is granted." },
          { slug: "pipeline-identity", title: "Least privilege for pipeline identities", minutes: 17, content: `## Automation needs its own access model\nA build job should have only the permissions required for its task. A test job rarely needs production deployment rights, and a deploy job should not be able to administer unrelated accounts.\n\n## Scope credentials to the job\nUse short-lived, narrowly scoped identity where supported. Separate environments and repositories when that reduces risk. Review inherited permissions and default tokens; defaults can be broader than a particular job needs.\n\n## Test policy changes safely\nConfirm that expected tasks still work and prohibited actions fail. Keep an owner and review date for exceptional permissions.`, exercise: "Define separate permission sets for build, test, and deploy jobs. Name one action each job should be denied." },
          { slug: "pipeline-secrets", title: "Secrets in build systems", minutes: 18, content: `## Secrets can leak through output\nSecrets may appear in command output, test reports, crash dumps, caches, artifacts, or debug traces. Masking helps but should not be treated as proof that a value cannot escape.\n\n## Avoid injecting secrets unnecessarily\nUse protected secret stores, restrict which jobs can request each secret, and prefer workload identity when available. Do not expose release credentials to untrusted pull-request code.\n\n## Rotate after exposure\nRevoke or rotate a potentially exposed secret, review access logs, remove unsafe copies, and fix the pipeline path that allowed disclosure.`, exercise: "Review a sample pipeline and mark every step that can read, print, cache, or publish a secret." },
        ],
      },
      {
        title: "Know and protect what you ship",
        description: "Maintain an inventory and verify the integrity of release artifacts.",
        lessons: [
          { slug: "software-inventory", title: "Dependency inventory and SBOM concepts", minutes: 19, content: `## Inventory answers what is inside\nA software bill of materials is a structured inventory of components in a product. It can help teams identify where a vulnerable or unapproved component is used, but only if the inventory is accurate and kept current.\n\n## Include transitive dependencies\nApplications often rely on packages that rely on other packages. Generate inventories from resolved build inputs and retain enough version and source information to reproduce the result.\n\n## Connect inventory to ownership\nAssign an owner to review findings, determine reachability, choose an update, and verify release. An inventory without an operational response path quickly becomes stale.`, exercise: "Create a component inventory for a small sample application with package name, version, direct or transitive status, and owner." },
          { slug: "artifact-integrity", title: "Artifact integrity and provenance", minutes: 18, content: `## Know where a release came from\nAn artifact should be traceable to source revision, build process, dependencies, and approving workflow. A checksum can detect changes when compared through a trusted channel; it does not prove the build itself was trustworthy.\n\n## Protect the release path\nRestrict who can publish or replace artifacts. Use immutable or versioned storage where possible, and make promotion between environments explicit. Keep build records with the artifact.\n\n## Verify before deployment\nConfirm that the artifact approved for release is the artifact being deployed. Record the verification result and investigate unexplained differences.`, exercise: "Write a release provenance record for a fictional package: source revision, builder, dependency inventory, artifact digest, reviewer, and destination." },
          { slug: "container-hygiene", title: "Container image hygiene", minutes: 18, content: `## Images are part of the software supply chain\nA container image contains a base operating system, libraries, application files, and configuration. Unneeded packages and copied credentials increase risk and make updates harder.\n\n## Build reproducibly\nUse maintained base images, pin inputs deliberately, and rebuild when security updates are available. Run the process as a non-root user where practical and keep runtime permissions narrow.\n\n## Scan and verify context\nImage scanners find known package issues and configuration concerns. Review severity, exposure, reachability, and available fixes, then verify the rebuilt image rather than relying on a stale report.`, exercise: "Review a toy container build file. Identify one unnecessary package, one privilege concern, and one reproducibility improvement." },
        ],
      },
      {
        title: "Make checks operational",
        description: "Use automated findings as part of a clear, measured release process.",
        lessons: [
          { slug: "security-pipeline-checks", title: "Choosing pipeline security checks", minutes: 19, content: `## Match checks to risk\nStatic analysis, dependency checks, secret detection, configuration review, and runtime testing find different classes of issues. Select checks based on the system and define what each can and cannot tell you.\n\n## Keep results actionable\nA useful finding includes affected component or code, evidence, severity rationale, owner, and a suggested next step. Suppressions should state why an alert is not actionable and when the exception will be reviewed.\n\n## Measure the workflow\nTrack time to triage, repeat findings, fix verification, and the rate of unowned alerts. A gate that everyone bypasses is not an effective control.`, exercise: "Choose three checks for a small web service. For each, name the risk it addresses and who owns a finding." },
          { slug: "release-gates", title: "Release gates and safe exceptions", minutes: 17, content: `## A gate should protect an explicit property\nA release gate can stop a known high-impact issue, missing approval, or unverified artifact. Define the condition, evidence, and owner before the first release depends on it.\n\n## Avoid arbitrary blocking\nNot every scanner result should automatically stop every build. Prioritize using exposure and impact, but keep unresolved issues visible. Exceptions need scope, approver, compensating control, and expiry or review date.\n\n## Plan for recovery\nWhen a release causes harm, teams need a tested rollback or mitigation path. Keep prior known-good artifacts and document what data changes cannot be reversed.`, exercise: "Write an exception record for one fictional scanner finding, including scope, rationale, approver, mitigation, and review date." },
          { slug: "supply-chain-response", title: "Responding to a vulnerable component", minutes: 18, content: `## Start with exposure mapping\nWhen a component advisory appears, identify products and versions that include it. Check whether the affected code path is used and whether the system is exposed to the relevant conditions.\n\n## Coordinate the fix\nChoose an update or mitigation, assign an owner, test compatibility, and plan the release. If no fix is available, document temporary controls and a review trigger.\n\n## Verify closure\nConfirm the deployed artifact contains the intended version or mitigation. Update the inventory and close the finding only after evidence is recorded.`, exercise: "Build a response checklist for a newly reported vulnerable library: locate, assess, prioritize, mitigate, release, and verify." },
        ],
      },
    ],
    assessment: { title: "DevSecOps checkpoint", questions: [
      { prompt: "Should untrusted pull-request code receive production deployment credentials?", explanation: "Untrusted changes should not be able to access production secrets or authority.", answers: [{ label: "Yes, to make builds easier", correct: false }, { label: "No, separate and protect production authority", correct: true }] },
      { prompt: "Does an artifact checksum alone prove that a build was trustworthy?", explanation: "A checksum can detect differences but does not establish the integrity of the build process.", answers: [{ label: "Yes", correct: false }, { label: "No, provenance and a trusted comparison path also matter", correct: true }] },
      { prompt: "What should a security gate exception include?", explanation: "A scoped, approved exception with mitigation and review timing remains accountable.", answers: [{ label: "Scope, rationale, approver, mitigation, and review date", correct: true }, { label: "A permanent global suppression", correct: false }] },
    ] },
    lab: { slug: "pipeline-security-review-lab", title: "Pipeline security review", category: "DevSecOps Labs", difficulty: "Advanced", description: "Review a fictional build workflow and propose a least-privilege, verifiable release path.", objectives: ["Map identities and secrets", "Check artifact provenance", "Define actionable pipeline gates"], instructions: `## Work with a fictional pipeline\nUse a sample workflow file created for this lab. Do not connect to a production repository or use real secrets.\n\n## Review\n1. Map each job, external input, permission, and secret it can access.\n2. Identify one path where untrusted code could reach release authority.\n3. Propose a separate least-privilege deployment identity.\n4. Define an artifact record and one release verification step.\n5. Add a scoped exception process for a sample scanner finding.\n\n## Deliverable\nSubmit a short pipeline threat model, prioritized fixes, and tests that prove the denied paths remain blocked.` },
  },
  {
    slug: "security-risk-privacy-governance",
    title: "Security Risk, Privacy, and Governance",
    subtitle: "Turn security priorities into owned controls and accountable decisions.",
    description: "A practical introduction to security governance for technical teams. Learn asset and data classification, risk estimation, control ownership, privacy-by-design questions, vendor review, audit evidence, and meaningful security measures. This course teaches decision methods, not legal advice.",
    level: "Intermediate",
    category: "Governance and Privacy",
    hours: 17,
    prerequisites: ["Cybersecurity Fundamentals", "Web Security"],
    objectives: ["Describe risk with evidence, impact, and uncertainty", "Map controls to owners and business outcomes", "Build privacy, supplier, audit, and measurement practices into operations"],
    modules: [
      {
        title: "Understand risk and controls",
        description: "Make security decisions from assets, threats, impact, and accountable ownership.",
        lessons: [
          { slug: "asset-classification", title: "Asset and data classification", minutes: 16, content: `## Know what you are protecting\nAn asset can be data, a service, an identity, a device, or a business process. Classification helps teams decide who may access it, how it should be stored, and what happens if it is lost or changed.\n\n## Use a small, usable scheme\nDefine a few categories with practical handling rules. Include examples and an owner. If people cannot apply the scheme consistently, simplify it and provide guidance at the point of use.\n\n## Follow data through its lifecycle\nConsider creation, collection, use, sharing, retention, backup, and deletion. Copies and exports need the same attention as the original record.`, exercise: "Classify three fictional data types and write one handling rule for access, storage, and disposal for each." },
          { slug: "risk-estimation", title: "Estimating and communicating risk", minutes: 18, content: `## Risk is a decision aid\nA risk statement connects an uncertain event to an asset and a consequence. For example: “If a shared admin credential is exposed, an unauthorized person could change the service and interrupt customer access.”\n\n## Separate likelihood and impact\nUse evidence and context to estimate how plausible an event is and how harmful it could be. State uncertainty rather than presenting a score as objective truth. Consider existing controls and residual exposure.\n\n## Tie the analysis to action\nA useful risk record names an owner, treatment choice, next step, and review trigger. Treatment may include reducing, transferring, accepting, or avoiding the risk.`, exercise: "Write one risk statement for a sample student portal. Rate likelihood and impact qualitatively and name evidence that could change your view." },
          { slug: "control-ownership", title: "Control design and ownership", minutes: 17, content: `## Controls need owners\nA control is a repeatable activity or safeguard that changes risk. Examples include access review, tested backups, secure defaults, logging, and change approval. A policy without an owner is difficult to operate.\n\n## Choose a control that addresses the cause\nMap the control to a specific threat and define how it works, who performs it, how often it runs, and what evidence proves it. Consider preventive, detective, and recovery controls together.\n\n## Check effectiveness\nA control can exist on paper and fail in practice. Sample evidence, test denied behavior, and review exceptions. Assign improvement actions when the control no longer matches the system.`, exercise: "Take one risk from the previous lesson and propose a preventive control, a detection, and an owner for each." },
        ],
      },
      {
        title: "Protect privacy and supplier relationships",
        description: "Reduce unnecessary data collection and understand dependencies beyond your team.",
        lessons: [
          { slug: "privacy-by-design", title: "Privacy questions in system design", minutes: 18, content: `## Ask why each data element is needed\nPrivacy-by-design begins before collection. Identify the purpose, expected users, sensitivity, retention, sharing, and possible secondary uses. Collecting less data often reduces both privacy and security exposure.\n\n## Consider people affected\nAsk how a feature could surprise, exclude, expose, or disadvantage someone. Give clear notice and limit internal access to the purpose that justified collection.\n\n## Bring specialists into decisions\nTeams should involve privacy, legal, security, and product owners when the data or use case is sensitive. Requirements vary by context and jurisdiction, so confirm obligations with qualified reviewers.`, exercise: "Review a fictional signup form. For each field, write the purpose, whether it is necessary, who can access it, and when it should be deleted." },
          { slug: "data-lifecycle", title: "Retention, sharing, and deletion", minutes: 17, content: `## Data risk changes over time\nData may be necessary for a feature today but become a liability after its purpose ends. Retention should be intentional and connected to business, security, and applicable requirements.\n\n## Make sharing explicit\nList the people, services, and suppliers that receive data. Define the minimum fields shared, permitted purposes, access safeguards, and how changes are reviewed.\n\n## Verify deletion\nDeletion can involve primary records, backups, exports, caches, and downstream processors. Define what “deleted” means for each storage type and document any delay imposed by backup retention.`, exercise: "Draw a simple data lifecycle for a support ticket, including collection, access, sharing, retention, backup, and deletion." },
          { slug: "supplier-risk", title: "Reviewing supplier and service risk", minutes: 18, content: `## A supplier extends your trust boundary\nThird-party services may process data, hold credentials, or support critical operations. Review what the supplier does, what access it receives, how incidents are handled, and how service exit works.\n\n## Match review depth to impact\nA low-impact tool does not need the same review as a service holding sensitive records or production credentials. Consider data type, access level, service criticality, and available alternatives.\n\n## Keep the relationship current\nRecord an owner, review date, security contacts, and material changes. Reassess after a new integration, incident, change of ownership, or significant change to data use.`, exercise: "Create a five-question supplier review for a fictional file-sharing service used by a small team." },
        ],
      },
      {
        title: "Prove and improve governance",
        description: "Keep evidence useful, measure outcomes, and improve without checkbox theater.",
        lessons: [
          { slug: "audit-evidence", title: "Audit evidence and control testing", minutes: 17, content: `## Evidence should show operation\nA procedure describes what should happen; evidence shows whether it happened. Useful evidence has an owner, period, source, and enough context to reproduce the check without exposing unrelated sensitive data.\n\n## Test a sample\nSelect records across a defined period and verify the control was performed, exceptions were approved, and follow-up was completed. Record the sample method and limitations.\n\n## Treat gaps as work\nWhen evidence is missing, find the cause. The process may be unclear, the tool may not retain records, or the control may not be operating. Assign a corrective action and confirm it later.`, exercise: "Define evidence for a quarterly access review: who performs it, what records are sampled, where evidence is stored, and how exceptions are closed." },
          { slug: "security-metrics", title: "Metrics that improve security", minutes: 18, content: `## Measure outcomes, not activity alone\nCounting policies written or alerts generated can reward volume without reducing risk. Better measures track outcomes such as time to revoke access, restore-test success, unresolved high-impact findings, and ownership of exceptions.\n\n## Define the denominator\nA percentage without scope can mislead. State which systems, time period, and cases are included. Show data quality limits and trends rather than a single uncontextualized score.\n\n## Use metrics to ask questions\nA metric should prompt a decision or improvement. If nobody acts on it, simplify it or stop collecting it. Avoid using a number to rank teams without accounting for risk and context.`, exercise: "Replace a fictional metric called ‘number of scans run’ with two outcome measures and explain what decisions they support." },
          { slug: "governance-review", title: "Running a useful governance review", minutes: 16, content: `## Keep the review decision-focused\nA governance review brings together risk owners, technical teams, and relevant business stakeholders. Use it to decide priorities, accept or change risk, resolve ownership gaps, and fund practical improvements.\n\n## Prepare a concise record\nBring current risks, incidents, control results, exceptions, supplier changes, and proposed actions. Keep the discussion grounded in evidence and make tradeoffs explicit.\n\n## Follow through\nRecord decisions, owners, and dates. Review overdue actions and changed assumptions at the next meeting. A governance meeting is effective when decisions change how the organization operates.`, exercise: "Draft a one-page agenda for a monthly security review with five decision-oriented topics and an action log format." },
        ],
      },
    ],
    assessment: { title: "Risk and privacy checkpoint", questions: [
      { prompt: "What makes a risk statement useful?", explanation: "It links an uncertain event to an asset and consequence so an owner can decide what to do.", answers: [{ label: "It connects an event, an asset, and a consequence", correct: true }, { label: "It uses the most technical wording", correct: false }] },
      { prompt: "Should every supplier receive the same depth of review?", explanation: "Review depth should reflect data sensitivity, access, criticality, and impact.", answers: [{ label: "Yes, regardless of service", correct: false }, { label: "No, match review depth to risk and impact", correct: true }] },
      { prompt: "Which is stronger control evidence?", explanation: "Evidence that a review was actually performed and exceptions handled demonstrates operation.", answers: [{ label: "A policy document alone", correct: false }, { label: "A dated review record with outcomes and follow-up", correct: true }] },
    ] },
    lab: { slug: "privacy-data-mapping-lab", title: "Map a data lifecycle", category: "Governance Labs", difficulty: "Intermediate", description: "Map fictional customer data through a service and identify practical privacy and security controls.", objectives: ["Map collection and sharing", "Choose data retention and access rules", "Define verifiable control evidence"], instructions: `## Scenario\nA fictional support portal collects a name, email address, issue description, and optional attachment. Use only invented data.\n\n## Map\n1. Record why each field is collected and who can access it.\n2. Identify storage, backups, suppliers, exports, and deletion points.\n3. Mark one unnecessary field or overbroad access path.\n4. Propose a retention rule, an access control, and evidence that each is operating.\n\n## Deliverable\nSubmit the map, three prioritized actions, and any assumptions that require review by privacy or legal specialists.` },
  },
];

const courses: ExpandedCourse[] = [...specialistCourses, ...penetrationTestingCourses];

function syncProfessionalExam(courseId: string, exam: ProfessionalLevelExam): void {
  const existingExam = db
    .prepare("SELECT id FROM quizzes WHERE course_id = ? AND title LIKE ? LIMIT 1")
    .get(courseId, `${exam.title.split(":", 1)[0]}:%`) as { id: string } | undefined;
  if (existingExam) return;

  const examLesson = db
    .prepare("SELECT l.id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ? ORDER BY m.sort_order, l.sort_order LIMIT 1")
    .get(courseId) as { id: string } | undefined;
  const quizId = id();
  db.prepare("INSERT INTO quizzes (id, title, lesson_id, course_id, passing_score) VALUES (?, ?, ?, ?, ?)").run(
    quizId, exam.title, examLesson?.id ?? null, courseId, exam.passingScore,
  );
  const addQuestion = db.prepare(
    "INSERT INTO questions (id, quiz_id, prompt, type, explanation, sort_order) VALUES (?, ?, ?, 'single', ?, ?)",
  );
  const addAnswer = db.prepare(
    "INSERT INTO answers (id, question_id, label, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)",
  );
  exam.questions.forEach((question, questionIndex) => {
    const questionId = id();
    addQuestion.run(questionId, quizId, question.prompt, question.explanation, questionIndex);
    question.answers.forEach((answer, answerIndex) => {
      addAnswer.run(id(), questionId, answer.label, answer.correct ? 1 : 0, answerIndex);
    });
  });
}

export function syncExpandedCurriculum(): void {
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
      const courseRow = db.prepare("SELECT id FROM courses WHERE slug = ?").get(course.slug) as { id: string };

      course.modules.forEach((module, moduleIndex) => {
        const existingModule = db
          .prepare("SELECT id FROM modules WHERE course_id = ? AND sort_order = ?")
          .get(courseRow.id, moduleIndex) as { id: string } | undefined;
        const moduleId = existingModule?.id ?? id();
        if (existingModule) {
          db.prepare("UPDATE modules SET title = ?, description = ? WHERE id = ?").run(module.title, module.description, moduleId);
        } else {
          db.prepare("INSERT INTO modules (id, course_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)").run(
            moduleId, courseRow.id, module.title, module.description, moduleIndex,
          );
        }

        module.lessons.forEach((lesson, lessonIndex) => {
          const existingLesson = db
            .prepare("SELECT id FROM lessons WHERE module_id = ? AND slug = ?")
            .get(moduleId, lesson.slug) as { id: string } | undefined;
          if (existingLesson) {
            db.prepare(
              `UPDATE lessons SET title = ?, content = ?, code_example = ?, exercise = ?, sort_order = ?, duration_minutes = ?
               WHERE id = ?`,
            ).run(lesson.title, lesson.content, lesson.code ?? null, lesson.exercise, lessonIndex, lesson.minutes, existingLesson.id);
          } else {
            db.prepare(
              `INSERT INTO lessons (id, module_id, slug, title, content, code_example, exercise, sort_order, duration_minutes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ).run(id(), moduleId, lesson.slug, lesson.title, lesson.content, lesson.code ?? null, lesson.exercise, lessonIndex, lesson.minutes);
          }
        });
      });

      const existingQuiz = db.prepare("SELECT id FROM quizzes WHERE course_id = ? AND lesson_id IS NULL").get(courseRow.id);
      if (!existingQuiz) {
        const quizId = id();
        db.prepare("INSERT INTO quizzes (id, title, course_id, passing_score) VALUES (?, ?, ?, 70)").run(
          quizId, course.assessment.title, courseRow.id,
        );
        const addQuestion = db.prepare(
          "INSERT INTO questions (id, quiz_id, prompt, type, explanation, sort_order) VALUES (?, ?, ?, 'single', ?, ?)",
        );
        const addAnswer = db.prepare(
          "INSERT INTO answers (id, question_id, label, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)",
        );
        course.assessment.questions.forEach((question, questionIndex) => {
          const questionId = id();
          addQuestion.run(questionId, quizId, question.prompt, question.explanation, questionIndex);
          question.answers.forEach((answer, answerIndex) => {
            addAnswer.run(id(), questionId, answer.label, answer.correct ? 1 : 0, answerIndex);
          });
        });
      }

      if (course.slug === "ethical-penetration-testing-basic") syncProfessionalExam(courseRow.id, penetrationTestingEntryExam);
      const levelExam = penetrationTestingExams[course.slug];
      if (levelExam) syncProfessionalExam(courseRow.id, levelExam);

      const existingLab = db.prepare("SELECT id FROM labs WHERE slug = ?").get(course.lab.slug) as { id: string } | undefined;
      const labValues = [
        course.lab.title, course.lab.category, course.lab.difficulty, course.lab.description,
        JSON.stringify(course.lab.objectives), course.lab.instructions, courseRow.id,
      ];
      if (existingLab) {
        db.prepare(
          "UPDATE labs SET title = ?, category = ?, difficulty = ?, description = ?, objectives = ?, instructions = ?, related_course_id = ?, published = 1 WHERE id = ?",
        ).run(...labValues, existingLab.id);
      } else {
        db.prepare(
          `INSERT INTO labs (id, slug, title, category, difficulty, description, objectives, instructions, related_course_id, published, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        ).run(id(), course.lab.slug, ...labValues, timestamp);
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
