type ExamAnswer = { label: string; correct: boolean };
type ExamQuestion = { prompt: string; explanation: string; answers: ExamAnswer[] };

export type ProfessionalLevelExam = {
  title: string;
  passingScore: number;
  questions: ExamQuestion[];
};

export const penetrationTestingEntryExam: ProfessionalLevelExam = {
  title: "Entry Exam: Basic readiness check",
  passingScore: 80,
  questions: [
    {
      prompt: "A security test is requested in an email. What is the first professional check?",
      explanation: "Confirm that an authorized decision-maker approved the work and that the scope and rules are documented.",
      answers: [
        { label: "Confirm written authorization, scope, and rules of engagement", correct: true },
        { label: "Choose a scanner and begin with default settings", correct: false },
        { label: "Search for the organization's public IP ranges", correct: false },
        { label: "Ask a colleague to approve it informally", correct: false },
      ],
    },
    {
      prompt: "What does an assessment scope define?",
      explanation: "Scope identifies the approved assets, activities, dates, exclusions, and boundaries for the work.",
      answers: [
        { label: "The tester's preferred tools", correct: false },
        { label: "Approved targets, methods, time window, and exclusions", correct: true },
        { label: "Every system reachable from the target", correct: false },
        { label: "Only the final report format", correct: false },
      ],
    },
    {
      prompt: "Which environment is appropriate for a first hands-on exercise?",
      explanation: "A local, isolated training environment protects real systems and uses controlled, synthetic data.",
      answers: [
        { label: "A public website with a similar login page", correct: false },
        { label: "An isolated local lab supplied for training", correct: true },
        { label: "A shared production server after business hours", correct: false },
        { label: "A neighbor's wireless network", correct: false },
      ],
    },
    {
      prompt: "A hostname is not listed in the signed scope but looks related. Is it approved?",
      explanation: "Names and relationships do not grant permission. Ask the owner to clarify the scope in writing.",
      answers: [
        { label: "Yes, if the hostname shares the same domain", correct: false },
        { label: "Yes, if a tool discovers it automatically", correct: false },
        { label: "No; obtain written approval before testing it", correct: true },
        { label: "Yes, if only read-only checks are used", correct: false },
      ],
    },
    {
      prompt: "What is the safest interpretation of an automated tool alert?",
      explanation: "An alert is a lead that must be checked against the target context and validated safely within the approved scope.",
      answers: [
        { label: "A confirmed finding with no further review needed", correct: false },
        { label: "A lead that requires context and safe verification", correct: true },
        { label: "Proof that an attacker has accessed the system", correct: false },
        { label: "Permission to run any related test", correct: false },
      ],
    },
    {
      prompt: "Which account should be used for a basic access-control exercise?",
      explanation: "Use the test identity and minimum permissions provided for the approved exercise.",
      answers: [
        { label: "A real employee's account", correct: false },
        { label: "A supplied synthetic account with the required minimum access", correct: true },
        { label: "A shared administrator account", correct: false },
        { label: "Any account found in a configuration file", correct: false },
      ],
    },
    {
      prompt: "What should happen if an exercise unexpectedly exposes personal information?",
      explanation: "Stop, minimize further exposure, protect the evidence, and notify the designated contact using the agreed process.",
      answers: [
        { label: "Copy a sample to prove the issue", correct: false },
        { label: "Stop and notify the designated owner without collecting more", correct: true },
        { label: "Continue until the full dataset is understood", correct: false },
        { label: "Post a screenshot to ask for advice", correct: false },
      ],
    },
    {
      prompt: "What is a stop condition in rules of engagement?",
      explanation: "A stop condition is a pre-agreed signal to pause work, such as unexpected impact, out-of-scope data, or owner request.",
      answers: [
        { label: "A tool option that makes scanning faster", correct: false },
        { label: "A defined event that requires pausing and escalation", correct: true },
        { label: "A date when the report is due", correct: false },
        { label: "A way to hide test traffic from system owners", correct: false },
      ],
    },
    {
      prompt: "Which evidence note is most useful to another reviewer?",
      explanation: "A reproducible note records when and where an approved action occurred, the context, result, and limitations.",
      answers: [
        { label: "A tool name and a severity label", correct: false },
        { label: "Time, approved asset, test context, action, result, and limits", correct: true },
        { label: "A screenshot without identifying details", correct: false },
        { label: "A conclusion without the observation behind it", correct: false },
      ],
    },
    {
      prompt: "What should a professional tester do when unsure whether an action is allowed?",
      explanation: "Pause and ask the authorized owner for clarification rather than interpreting uncertainty as permission.",
      answers: [
        { label: "Proceed carefully and report it later", correct: false },
        { label: "Pause and obtain written clarification", correct: true },
        { label: "Ask another learner to try it", correct: false },
        { label: "Use a different tool to avoid changing anything", correct: false },
      ],
    },
  ],
};

export const penetrationTestingExams: Record<string, ProfessionalLevelExam> = {
  "ethical-penetration-testing-basic": {
    title: "Level Exam: Basic Professional Progression",
    passingScore: 80,
    questions: [
      {
        prompt: "A client asks you to test its portal. What must be in place before any technical testing begins?",
        explanation: "Testing needs explicit written authorization, named assets, a time window, permitted methods, and clear stop conditions.",
        answers: [
          { label: "Written authorization and a specific scope", correct: true },
          { label: "A public IP address and a working scanner", correct: false },
          { label: "A verbal request from any employee", correct: false },
          { label: "A list of interesting tools", correct: false },
        ],
      },
      {
        prompt: "A scoped host redirects your browser to a vendor-owned domain. What is the correct response?",
        explanation: "A redirect does not extend permission. Pause and ask the authorized owner to clarify the scope in writing.",
        answers: [
          { label: "Continue because the redirect came from an in-scope host", correct: false },
          { label: "Stop and request written scope clarification", correct: true },
          { label: "Test only the vendor login page", correct: false },
          { label: "Ask another tester to check it informally", correct: false },
        ],
      },
      {
        prompt: "Where should a learner practice with an intentionally vulnerable web application?",
        explanation: "A contained local lab with synthetic data allows safe practice without affecting real users or systems.",
        answers: [
          { label: "An isolated training environment with synthetic data", correct: true },
          { label: "A random site that looks similar", correct: false },
          { label: "A public service during a quiet period", correct: false },
          { label: "A coworker's personal account", correct: false },
        ],
      },
      {
        prompt: "A tool reports a possible weakness. What should you conclude first?",
        explanation: "Tool output is a lead. Validate it safely in scope and record the evidence and limitations before making a claim.",
        answers: [
          { label: "The system is definitely compromised", correct: false },
          { label: "The alert is a lead that needs safe, scoped validation", correct: true },
          { label: "The owner must immediately shut down the service", correct: false },
          { label: "The tool result can replace the assessment notes", correct: false },
        ],
      },
      {
        prompt: "Which note is most useful for a reproducible finding?",
        explanation: "Useful evidence records the approved asset, time, test context, action, observation, and relevant limitations.",
        answers: [
          { label: "A screenshot with no asset or test context", correct: false },
          { label: "A tool score copied without its inputs", correct: false },
          { label: "Time, scoped asset, test account, action, result, and limitations", correct: true },
          { label: "A list of every file on the target", correct: false },
        ],
      },
      {
        prompt: "You unexpectedly see personal data during a test. What should you do?",
        explanation: "Stop the activity, avoid collecting or copying more data, protect what was already exposed, and notify the designated contact.",
        answers: [
          { label: "Copy a sample to prove the issue", correct: false },
          { label: "Stop, minimize exposure, and contact the agreed owner", correct: true },
          { label: "Continue until the full impact is known", correct: false },
          { label: "Share the data with the assessment team chat", correct: false },
        ],
      },
      {
        prompt: "What is a sound first step when preparing a practice lab?",
        explanation: "Confirm the tester and target machines, isolate the network, use synthetic accounts, and know how to restore the environment.",
        answers: [
          { label: "Expose the vulnerable target so updates are easier", correct: false },
          { label: "Use an isolated network and a documented reset point", correct: true },
          { label: "Reuse a personal password for every lab account", correct: false },
          { label: "Disable backups and snapshots", correct: false },
        ],
      },
      {
        prompt: "Which permission principle should guide a normal assessment account?",
        explanation: "Least privilege limits the account to the access needed for the approved exercise and reduces unintended impact.",
        answers: [
          { label: "Give it administrator access to avoid interruptions", correct: false },
          { label: "Use the minimum approved access needed for the task", correct: true },
          { label: "Share one account among all testers", correct: false },
          { label: "Disable account logging", correct: false },
        ],
      },
      {
        prompt: "A test begins to cause unexpected service errors. What should the tester do?",
        explanation: "Use the agreed stop condition, pause testing, preserve relevant observations, and contact the named owner.",
        answers: [
          { label: "Increase request volume to confirm the behavior", correct: false },
          { label: "Pause according to the stop condition and notify the owner", correct: true },
          { label: "Restart the service without telling anyone", correct: false },
          { label: "Keep testing until the scheduled end time", correct: false },
        ],
      },
      {
        prompt: "What makes a beginner assessment report professionally useful?",
        explanation: "A useful report connects scoped evidence to a calibrated impact, a practical remediation, and a clear limitation.",
        answers: [
          { label: "A large number of tool screenshots", correct: false },
          { label: "A reproducible observation, impact, remediation, and limitations", correct: true },
          { label: "A dramatic claim without supporting evidence", correct: false },
          { label: "A transcript of every command regardless of relevance", correct: false },
        ],
      },
    ],
  },
  "ethical-penetration-testing-intermediate": {
    title: "Level Exam: Intermediate Progression",
    passingScore: 80,
    questions: [
      {
        prompt: "How should an assessment team choose which test to perform next?",
        explanation: "Each test should serve an approved objective, fit the scope, and have an understood impact and stop condition.",
        answers: [
          { label: "Choose the test with the most impressive output", correct: false },
          { label: "Map the test to the objective, authorization, and risk controls", correct: true },
          { label: "Run every available check by default", correct: false },
          { label: "Select a method based only on its speed", correct: false },
        ],
      },
      {
        prompt: "An asset inventory lists a host that is absent from the signed scope. What is the best action?",
        explanation: "An inventory is useful context but does not grant permission. Obtain written approval before testing an unlisted asset.",
        answers: [
          { label: "Test it because it appears in the inventory", correct: false },
          { label: "Add it to the target list yourself", correct: false },
          { label: "Ask the owner to approve or exclude it in writing", correct: true },
          { label: "Run only a quick check to see what it is", correct: false },
        ],
      },
      {
        prompt: "A service banner reports an old version. What does that establish by itself?",
        explanation: "A banner is an observation. Configuration, backports, exposure, and other evidence determine whether a vulnerability applies.",
        answers: [
          { label: "A confirmed exploitable vulnerability", correct: false },
          { label: "A lead that needs contextual verification", correct: true },
          { label: "Proof that data was accessed", correct: false },
          { label: "Permission to run a proof of concept", correct: false },
        ],
      },
      {
        prompt: "A safe validation has reproduced an access-control failure with a test account. What should happen next?",
        explanation: "Once sufficient agreed evidence exists, stop the proof, preserve minimal evidence, and document the allowed and denied behavior.",
        answers: [
          { label: "Read every other user's record to measure exposure", correct: false },
          { label: "Stop at sufficient evidence and record the test context", correct: true },
          { label: "Create a permanent account to demonstrate persistence", correct: false },
          { label: "Export the database for later review", correct: false },
        ],
      },
      {
        prompt: "Which statement correctly distinguishes authentication from authorization?",
        explanation: "Authentication establishes an identity; authorization decides which actions and data that identity may access.",
        answers: [
          { label: "Authentication checks identity; authorization checks permitted actions", correct: true },
          { label: "Authentication encrypts data; authorization signs it", correct: false },
          { label: "They are identical checks", correct: false },
          { label: "Authorization is needed only for administrators", correct: false },
        ],
      },
      {
        prompt: "What should an assessment finding contain to support owner verification?",
        explanation: "A clear finding includes affected scope, preconditions, reproducible evidence, impact, remediation, and limitations.",
        answers: [
          { label: "A vulnerability name and severity number only", correct: false },
          { label: "Affected asset, steps, observed result, impact, fix, and limits", correct: true },
          { label: "A tool screenshot with credentials visible", correct: false },
          { label: "A claim that the team could not reproduce", correct: false },
        ],
      },
      {
        prompt: "How should severity be assigned to a confirmed issue?",
        explanation: "Severity should reflect realistic impact and conditions in the assessed environment, with assumptions made explicit.",
        answers: [
          { label: "Use the highest possible rating to gain attention", correct: false },
          { label: "Base it on plausible impact, exposure, and prerequisites", correct: true },
          { label: "Copy the scanner's value without review", correct: false },
          { label: "Rate every finding as low to avoid disputes", correct: false },
        ],
      },
      {
        prompt: "A staging test shares identity infrastructure with production. What should the team do?",
        explanation: "Shared dependencies can create production impact. Confirm the boundary, safeguards, and owner approval before testing.",
        answers: [
          { label: "Assume staging is isolated because of its name", correct: false },
          { label: "Verify dependencies and obtain approval for the actual test path", correct: true },
          { label: "Use production accounts to compare behavior", correct: false },
          { label: "Ignore identity systems and continue", correct: false },
        ],
      },
      {
        prompt: "Which approach best protects evidence from a web proxy session?",
        explanation: "Use synthetic test accounts, restrict saved captures, redact secrets, and follow the agreed storage and deletion rules.",
        answers: [
          { label: "Keep all captured sessions in a shared public folder", correct: false },
          { label: "Capture only needed test traffic and protect or redact it", correct: true },
          { label: "Include live cookies so the owner can replay the session", correct: false },
          { label: "Disable the browser's security controls for convenience", correct: false },
        ],
      },
      {
        prompt: "What makes a retest a valid confirmation that a fix worked?",
        explanation: "A retest repeats the authorized case, verifies the intended control, checks relevant negative behavior, and records the version and result.",
        answers: [
          { label: "A developer's message that the change is deployed", correct: false },
          { label: "The original scoped case rerun against the fixed version", correct: true },
          { label: "A scan of unrelated systems", correct: false },
          { label: "Deleting the original finding from the report", correct: false },
        ],
      },
    ],
  },
  "ethical-penetration-testing-advanced": {
    title: "Level Exam: Advanced Professional Completion",
    passingScore: 80,
    questions: [
      {
        prompt: "What is required for an authorized social-engineering simulation?",
        explanation: "The sponsor must approve the audience, methods, timing, data handling, support plan, and debrief before the exercise.",
        answers: [
          { label: "A bounded written plan with safeguards and a debrief", correct: true },
          { label: "A convincing pretext and an unannounced target list", correct: false },
          { label: "Real password collection to measure impact", correct: false },
          { label: "Permission from one participant instead of the sponsor", correct: false },
        ],
      },
      {
        prompt: "A controlled proof confirms a serious weakness. What is the professional stopping point?",
        explanation: "Stop once the agreed objective has enough safe evidence. Avoid unnecessary access, persistence, or data collection.",
        answers: [
          { label: "Continue until every reachable system is mapped", correct: false },
          { label: "Stop after sufficient approved evidence is captured", correct: true },
          { label: "Create persistence to prove long-term access", correct: false },
          { label: "Collect a full data sample before reporting", correct: false },
        ],
      },
      {
        prompt: "How should an advanced report describe a multi-step attack path?",
        explanation: "Trace each supported step to scoped evidence, state prerequisites and uncertainty, and distinguish demonstrated impact from inference.",
        answers: [
          { label: "Present the entire path as proven if one step was observed", correct: false },
          { label: "Separate observed steps, assumptions, prerequisites, and impact", correct: true },
          { label: "Omit limitations to keep the report concise", correct: false },
          { label: "Rank it by tool score alone", correct: false },
        ],
      },
      {
        prompt: "Which is the strongest basis for a cryptographic control recommendation?",
        explanation: "Recommendations should use well-reviewed standards and account for the application's threat model, key lifecycle, and implementation context.",
        answers: [
          { label: "A custom cipher that appears difficult to guess", correct: false },
          { label: "A reviewed standard with sound key management for the use case", correct: true },
          { label: "A longer key without checking the algorithm", correct: false },
          { label: "Encryption without considering where keys are stored", correct: false },
        ],
      },
      {
        prompt: "During a response exercise, evidence may be relevant to an active incident. What should an assessor do?",
        explanation: "Preserve evidence integrity, stop conflicting activity, and follow the incident and escalation procedures agreed with the owner.",
        answers: [
          { label: "Modify the host to test whether the alert returns", correct: false },
          { label: "Preserve relevant context and coordinate through the incident lead", correct: true },
          { label: "Delete suspicious files to reduce risk", correct: false },
          { label: "Publish the indicators before the owner is informed", correct: false },
        ],
      },
      {
        prompt: "What does a defensible risk rating communicate?",
        explanation: "A rating explains likely impact and the conditions needed for it, while noting uncertainty and environmental context.",
        answers: [
          { label: "A universal truth independent of business context", correct: false },
          { label: "A reasoned view of impact, likelihood, prerequisites, and limits", correct: true },
          { label: "The number of findings in the report", correct: false },
          { label: "The assessor's confidence without supporting evidence", correct: false },
        ],
      },
      {
        prompt: "How should a critical remediation recommendation be prioritized?",
        explanation: "Address root causes and realistic risk first, assign an accountable owner, and define a measurable safe retest.",
        answers: [
          { label: "List a tool command and leave priority to the reader", correct: false },
          { label: "Identify the root cause, owner, priority, and verification criteria", correct: true },
          { label: "Recommend a full system rebuild for every issue", correct: false },
          { label: "Close the issue after a configuration change without retesting", correct: false },
        ],
      },
      {
        prompt: "A planned test could affect a third-party dependency. What is the right next step?",
        explanation: "Third-party ownership requires explicit coordination and authorization; the primary client's permission may not cover it.",
        answers: [
          { label: "Proceed because the client uses the dependency", correct: false },
          { label: "Exclude or obtain explicit authorization and safeguards from the relevant owner", correct: true },
          { label: "Test outside business hours without notice", correct: false },
          { label: "Use a different source address to avoid detection", correct: false },
        ],
      },
      {
        prompt: "What should an executive summary do in an advanced assessment report?",
        explanation: "It should explain the most important business risks, material strengths, priorities, and decisions in accurate, plain language.",
        answers: [
          { label: "Repeat every technical detail and tool output", correct: false },
          { label: "Summarize material risk and prioritized decisions without overstating proof", correct: true },
          { label: "Omit uncertainty and assumptions", correct: false },
          { label: "Promise that no future compromise is possible", correct: false },
        ],
      },
      {
        prompt: "What should define closure of a retest after a major fix?",
        explanation: "Closure should follow documented criteria: the original condition no longer reproduces, expected controls work, and remaining risks are recorded.",
        answers: [
          { label: "A release note saying the fix is complete", correct: false },
          { label: "Repeatable evidence against agreed pass criteria and documented residual risk", correct: true },
          { label: "A clean scan with no scope or version details", correct: false },
          { label: "Removing the finding from the tracking system", correct: false },
        ],
      },
    ],
  },
};
