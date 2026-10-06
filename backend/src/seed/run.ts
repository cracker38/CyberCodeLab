import { db, initSchema, nowIso } from "../config/db.js";
import { hashPassword } from "../utils/crypto.js";
import { id } from "../utils/ids.js";

function wipe(): void {
  const tables = [
    "audit_logs",
    "announcements",
    "youtube_videos",
    "certificates",
    "quiz_attempts",
    "lab_progress",
    "lesson_progress",
    "enrollments",
    "answers",
    "questions",
    "quizzes",
    "resources",
    "projects",
    "labs",
    "lessons",
    "modules",
    "courses",
    "users",
    "roles",
  ];
  db.exec("PRAGMA foreign_keys = OFF");
  for (const t of tables) db.exec(`DELETE FROM ${t}`);
  db.exec("PRAGMA foreign_keys = ON");
}

function insertQuiz(opts: {
  title: string;
  courseId?: string;
  lessonId?: string;
  questions: {
    prompt: string;
    type: "single" | "truefalse" | "multiple";
    explanation: string;
    answers: { label: string; correct?: boolean }[];
  }[];
}): void {
  const quizId = id();
  db.prepare("INSERT INTO quizzes (id, title, lesson_id, course_id, passing_score) VALUES (?, ?, ?, ?, 70)").run(
    quizId,
    opts.title,
    opts.lessonId ?? null,
    opts.courseId ?? null,
  );
  opts.questions.forEach((q, qi) => {
    const qid = id();
    db.prepare("INSERT INTO questions (id, quiz_id, prompt, type, explanation, sort_order) VALUES (?, ?, ?, ?, ?, ?)").run(
      qid,
      quizId,
      q.prompt,
      q.type,
      q.explanation,
      qi,
    );
    q.answers.forEach((a, ai) => {
      db.prepare("INSERT INTO answers (id, question_id, label, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)").run(
        id(),
        qid,
        a.label,
        a.correct ? 1 : 0,
        ai,
      );
    });
  });
}

export async function seed(): Promise<void> {
  initSchema();
  wipe();
  const ts = nowIso();

  db.prepare("INSERT INTO roles (id, name) VALUES (1, 'USER'), (2, 'INSTRUCTOR'), (3, 'ADMIN')").run();

  const adminId = id();
  const instructorId = id();
  const learnerId = id();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role_id, email_verified, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
  ).run(adminId, "admin@cybercodelab.local", await hashPassword("AdminLab!2026"), "Amina Okonkwo", 3, ts, ts);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role_id, email_verified, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
  ).run(instructorId, "instructor@cybercodelab.local", await hashPassword("TeachLab!2026"), "Daniel Reyes", 2, ts, ts);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role_id, email_verified, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
  ).run(learnerId, "learner@cybercodelab.local", await hashPassword("LearnLab!2026"), "Jordan Lee", 1, ts, ts);

  type CourseSeed = {
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    level: string;
    category: string;
    hours: number;
    prereq: string[];
    next?: string;
    objectives: string[];
    modules: {
      title: string;
      description: string;
      lessons: {
        slug: string;
        title: string;
        content: string;
        code?: string;
        exercise?: string;
        minutes?: number;
      }[];
    }[];
  };

  const courses: CourseSeed[] = [
    {
      slug: "cybersecurity-fundamentals",
      title: "Cybersecurity Fundamentals",
      subtitle: "Build a durable mental model of systems, risk, and defense.",
      description:
        "Start with how computers, networks, and identities actually work. Then learn how security professionals think about confidentiality, integrity, availability, and responsible practice in authorized environments.",
      level: "Beginner",
      category: "Fundamentals",
      hours: 10,
      prereq: [],
      next: "networking-essentials",
      objectives: [
        "Explain CIA triad and basic risk concepts",
        "Describe common threat categories without glorifying attacks",
        "Map assets, identities, and trust boundaries",
        "Practice legal, ethical learning habits",
      ],
      modules: [
        {
          title: "Security mindset",
          description: "How professionals think about protection.",
          lessons: [
            {
              slug: "what-is-cybersecurity",
              title: "What cybersecurity actually is",
              content: `Cybersecurity is the practice of protecting systems, people, and data so that authorized work can continue.

It is not a collection of movie tropes. It is engineering: understand how a system is supposed to work, identify what can go wrong, and reduce risk in a measured way.

## The CIA triad
- **Confidentiality** — only the right people can read information
- **Integrity** — information and systems stay trustworthy
- **Availability** — services remain usable when needed

## How you will learn here
CyberCode Lab follows **Learn → Understand → Code → Practice → Build → Secure**. You will read, write small programs, complete labs in authorized environments, and then connect those skills to projects.

## Ethics
Practice only on systems you own or have explicit permission to use. Course labs are designed as educational environments.`,
              exercise: "Write three sentences: one asset you care about, one way it could fail, and one control that reduces that risk.",
            },
            {
              slug: "assets-threats-controls",
              title: "Assets, threats, and controls",
              content: `Security work starts with inventory.

1. **Assets** — accounts, laptops, source code, customer records, DNS, backups
2. **Threats** — accidental mistakes, malware, stolen credentials, insider misuse, outages
3. **Controls** — passwords + MFA, least privilege, backups, logging, patches

A control is useful only if it maps to a real risk. Fancy tools without an asset list create noise.`,
              exercise: "List five assets on a typical student laptop and one control for each.",
            },
          ],
        },
        {
          title: "People and identity",
          description: "Most incidents involve credentials and trust.",
          lessons: [
            {
              slug: "identity-basics",
              title: "Identity, authentication, authorization",
              content: `**Authentication** answers “who are you?”
**Authorization** answers “what are you allowed to do?”

Passwords prove knowledge. Hardware keys and authenticator apps add a second factor. Authorization should follow least privilege: grant the smallest permission that still lets someone do their job.

Never reuse passwords across sites. Use a password manager.`,
              code: `def looks_strong(password: str) -> bool:
    return (
        len(password) >= 12
        and any(c.isupper() for c in password)
        and any(c.islower() for c in password)
        and any(c.isdigit() for c in password)
    )`,
            },
            {
              slug: "safe-practice",
              title: "Legal practice and professional norms",
              content: `Scanning or probing systems you do not own can be illegal.

Authorized learning uses:
- Your own virtual machines
- Official lab platforms
- Written permission from an employer or school

If you are unsure, stop and ask. Curiosity is not consent.`,
            },
          ],
        },
      ],
    },
    {
      slug: "networking-essentials",
      title: "Networking Essentials",
      subtitle: "TCP/IP, DNS, HTTP, ports, and network security vocabulary.",
      description:
        "Understand how packets, names, and ports actually work so later security topics are not magic. You will inspect concepts, not attack live networks.",
      level: "Beginner",
      category: "Networking",
      hours: 12,
      prereq: ["Cybersecurity Fundamentals"],
      next: "linux-for-security",
      objectives: [
        "Describe IP, TCP, UDP, DNS, and HTTP at a practical level",
        "Explain ports and services",
        "Read a simple packet or HTTP conversation conceptually",
      ],
      modules: [
        {
          title: "The stack",
          description: "Layers you will actually use.",
          lessons: [
            {
              slug: "tcpip-mental-model",
              title: "A practical TCP/IP model",
              content: `You do not need every OSI mnemonic. You need a working model:

- **Link** — frames on a local network
- **Internet** — IP addresses route packets
- **Transport** — TCP for reliable streams, UDP for datagrams
- **Application** — DNS, HTTP, SSH, and everything users feel

When something fails, ask: name resolution, routing, or the application?`,
            },
            {
              slug: "ports-and-services",
              title: "Ports and services",
              content: `A port is an application endpoint on a host. Common examples (for recognition, not scanning other people):

- 22 SSH
- 53 DNS
- 80 HTTP
- 443 HTTPS

Listening on a port is not automatically insecure. Unpatched software, weak auth, and exposure to the wrong network are the usual problems.`,
            },
          ],
        },
        {
          title: "Names and the web",
          description: "DNS and HTTP.",
          lessons: [
            {
              slug: "dns-basics",
              title: "DNS is a directory, not a mystery",
              content: `DNS maps names to records. A typical web lookup asks for an A or AAAA record. CNAME aliases, MX mail records, and TXT records also appear in real systems.

If DNS fails, the browser never even starts a TCP handshake to the right host.`,
            },
            {
              slug: "http-basics",
              title: "HTTP requests and responses",
              content: `HTTP is text (or HTTP/2 frames) with methods, paths, headers, and bodies.

A GET should be safe to retry. A POST often changes state. Status codes tell you whether the server accepted the request, redirected, or refused it.

HTTPS wraps HTTP in TLS so observers on the path cannot easily read or alter the conversation.`,
              code: `GET /learn HTTP/1.1
Host: cybercodelab.example
Accept: text/html`,
            },
          ],
        },
      ],
    },
    {
      slug: "linux-for-security",
      title: "Linux for Security",
      subtitle: "Shell, permissions, processes, and logs on systems you control.",
      description:
        "Most servers and many security tools live on Linux. Learn the command line, file permissions, processes, and how to read logs on machines you own or are authorized to use.",
      level: "Beginner",
      category: "Linux",
      hours: 14,
      prereq: ["Networking Essentials"],
      next: "python-for-cybersecurity",
      objectives: [
        "Navigate the filesystem and manage permissions",
        "Inspect processes and basic services",
        "Read authentication and application logs",
      ],
      modules: [
        {
          title: "Command line fluency",
          description: "Work without fear of the shell.",
          lessons: [
            {
              slug: "shell-navigation",
              title: "Files, paths, and the shell",
              content: `The shell is a programming environment. Start with:

- \`pwd\`, \`ls\`, \`cd\`
- \`cat\`, \`less\`, \`head\`
- redirects and pipes

Practice on a local VM. Do not run unknown commands copied from the internet on production machines.`,
              code: `ls -la
pwd
cat /etc/os-release`,
            },
            {
              slug: "permissions",
              title: "Users, groups, and permissions",
              content: `Linux files have an owner, a group, and a mode (rwx for user, group, other).

Privilege should be earned: everyday work as a normal user, elevation only when required. World-writable sensitive files are a classic misconfiguration.`,
            },
          ],
        },
        {
          title: "Observability",
          description: "See what the machine is doing.",
          lessons: [
            {
              slug: "processes-logs",
              title: "Processes and logs",
              content: `Processes are running programs. Logs are the memory of the system.

On many distributions, journald and files under \`/var/log\` hold authentication and service history. Reading logs is a blue-team skill: look for unexpected logins, failed attempts, and service crashes — on systems you administer.`,
              exercise: "On a personal VM, list running processes and identify your shell process.",
            },
          ],
        },
      ],
    },
    {
      slug: "python-for-cybersecurity",
      title: "Python for Cybersecurity",
      subtitle: "Automate checks, parse logs, and build small defensive tools.",
      description:
        "Use Python to hash files, score passwords, parse logs, and automate repetitive checks. All examples are for your own data and authorized lab environments.",
      level: "Intermediate",
      category: "Python",
      hours: 16,
      prereq: ["Linux for Security"],
      next: "web-security",
      objectives: [
        "Write small Python tools with clear ethical scope",
        "Hash data and compare integrity",
        "Parse logs into useful summaries",
      ],
      modules: [
        {
          title: "Python as a security notepad",
          description: "Scripts beat one-off clicking.",
          lessons: [
            {
              slug: "python-setup",
              title: "Environment and habits",
              content: `Use a virtual environment. Pin dependencies. Read what a package does before you install it.

Security-adjacent scripts should:
- Operate on files you own
- Fail closed
- Log what they did
- Never hard-code secrets`,
              code: `python -m venv .venv
# Windows: .venv\\Scripts\\activate
pip install -r requirements.txt`,
            },
            {
              slug: "hashing-integrity",
              title: "Hashing for integrity",
              content: `A cryptographic hash is a fingerprint. If a file changes, the hash changes.

Hashing is not encryption. You cannot reverse SHA-256 to recover a file. Password storage needs a slow password hash (this platform uses bcrypt), not a fast file hash.`,
              code: `import hashlib
from pathlib import Path

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()`,
              exercise: "Hash two copies of a text file on your machine. Change one character and hash again.",
            },
            {
              slug: "log-parsing",
              title: "Parsing logs with Python",
              content: `Defenders drown in text. A 20-line parser that counts failed logins on a sample file is more valuable than a screenshot of a SIEM you cannot explain.

Work on exported sample logs or logs from hosts you administer.`,
              code: `from collections import Counter

def count_failed(lines: list[str]) -> Counter:
    c: Counter[str] = Counter()
    for line in lines:
        if "Failed password" in line:
            parts = line.split()
            user = parts[parts.index("for") + 1] if "for" in parts else "unknown"
            c[user] += 1
    return c`,
            },
          ],
        },
      ],
    },
    {
      slug: "web-security",
      title: "Web Security",
      subtitle: "Auth, sessions, input handling, and secure development habits.",
      description:
        "Learn how browsers, cookies, sessions, and servers interact. Practice spotting insecure patterns in training applications you are authorized to use — never on live sites you do not own.",
      level: "Intermediate",
      category: "Web",
      hours: 16,
      prereq: ["Python for Cybersecurity", "Networking Essentials"],
      next: "ai-for-cybersecurity",
      objectives: [
        "Explain authentication vs sessions vs authorization",
        "Describe XSS, injection, and IDOR at a conceptual level",
        "Apply output encoding and parameterized queries",
      ],
      modules: [
        {
          title: "The request path",
          description: "From browser to database.",
          lessons: [
            {
              slug: "sessions-cookies",
              title: "Sessions and cookies",
              content: `A session cookie should be httpOnly, Secure in production, and SameSite-aware. The server stores session state or validates a signed token.

If a session identifier leaks, an attacker who obtains it can impersonate the user. Treat cookies as credentials.`,
            },
            {
              slug: "input-output",
              title: "Input validation and output encoding",
              content: `Validate types and length on the server. Encode output for the context (HTML vs URL vs JS). Use parameterized queries so user data cannot change SQL structure.

This platform uses Zod validation on APIs and parameterized SQLite statements for the same reason.`,
              code: `// Parameterized query (SQLite)
db.prepare("SELECT id FROM users WHERE email = ?").get(email);`,
            },
            {
              slug: "idor-authz",
              title: "Authorization and object access",
              content: `Broken access control happens when the server trusts an ID in the URL without checking ownership or role.

Every sensitive fetch should ask: is this user allowed to see this enrollment, lab note, or certificate? Public certificate verification is an explicit exception with non-sensitive fields only.`,
            },
          ],
        },
      ],
    },
    {
      slug: "ai-for-cybersecurity",
      title: "AI for Cybersecurity",
      subtitle: "Logs, anomalies, and the limits of machine learning in defense.",
      description:
        "Explore how simple statistical and ML ideas apply to log analysis and anomaly detection — and why models fail without labeled data, context, and human review.",
      level: "Intermediate",
      category: "AI",
      hours: 12,
      prereq: ["Python for Cybersecurity"],
      objectives: [
        "Describe anomaly detection at a conceptual level",
        "Explain false positives and analyst workflow",
        "Know what not to automate blindly",
      ],
      modules: [
        {
          title: "Signals, not magic",
          description: "ML is a tool inside a process.",
          lessons: [
            {
              slug: "anomaly-basics",
              title: "Anomaly detection basics",
              content: `An anomaly is a point that looks unusual compared to a baseline. Unusual is not the same as malicious.

A late-night login from a new country might be travel. A burst of failed passwords might be a typo storm. Models need features, thresholds, and a human who understands the environment.`,
            },
            {
              slug: "log-features",
              title: "Features from logs",
              content: `Useful features are often simple: counts per user, time of day, rare user-agent strings, sudden privilege changes.

Start with aggregations. Only then consider classifiers. Garbage features produce confident nonsense.`,
              code: `def zscore(value: float, mean: float, std: float) -> float:
    if std == 0:
        return 0.0
    return (value - mean) / std`,
            },
          ],
        },
      ],
    },
  ];

  const courseIds = new Map<string, string>();

  for (const course of courses) {
    const cid = id();
    courseIds.set(course.slug, cid);
    db.prepare(
      `INSERT INTO courses (id, slug, title, subtitle, description, level, category, estimated_hours, prerequisites, next_course_slug, learning_objectives, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ).run(
      cid,
      course.slug,
      course.title,
      course.subtitle,
      course.description,
      course.level,
      course.category,
      course.hours,
      JSON.stringify(course.prereq),
      course.next ?? null,
      JSON.stringify(course.objectives),
      ts,
      ts,
    );
    course.modules.forEach((mod, mi) => {
      const mid = id();
      db.prepare("INSERT INTO modules (id, course_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)").run(
        mid,
        cid,
        mod.title,
        mod.description,
        mi,
      );
      mod.lessons.forEach((les, li) => {
        const lid = id();
        db.prepare(
          `INSERT INTO lessons (id, module_id, slug, title, content, code_example, exercise, video_url, sort_order, duration_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
        ).run(lid, mid, les.slug, les.title, les.content, les.code ?? null, les.exercise ?? null, li, les.minutes ?? 12);
      });
    });
  }

  const fundId = courseIds.get("cybersecurity-fundamentals")!;
  const netId = courseIds.get("networking-essentials")!;
  const pyId = courseIds.get("python-for-cybersecurity")!;
  const webId = courseIds.get("web-security")!;
  const linuxId = courseIds.get("linux-for-security")!;
  const aiId = courseIds.get("ai-for-cybersecurity")!;

  insertQuiz({
    title: "Cybersecurity Fundamentals — checkpoint",
    courseId: fundId,
    questions: [
      {
        prompt: "Which trio describes confidentiality, integrity, and availability?",
        type: "single",
        explanation: "The CIA triad is the classic high-level security model.",
        answers: [
          { label: "HTTP / TLS / DNS" },
          { label: "CIA triad", correct: true },
          { label: "OWASP Top 10" },
          { label: "Zero trust only" },
        ],
      },
      {
        prompt: "Authentication answers which question?",
        type: "single",
        explanation: "Authentication establishes identity. Authorization decides permissions.",
        answers: [
          { label: "What are you allowed to do?" },
          { label: "Who are you?", correct: true },
          { label: "Where is the packet going?" },
          { label: "How large is the disk?" },
        ],
      },
      {
        prompt: "Practicing scans against random internet hosts is acceptable if you are a student.",
        type: "truefalse",
        explanation: "You need explicit authorization. Student status is not permission.",
        answers: [
          { label: "True" },
          { label: "False", correct: true },
        ],
      },
    ],
  });

  insertQuiz({
    title: "Networking — DNS and HTTP",
    courseId: netId,
    questions: [
      {
        prompt: "Which protocol is primarily used to resolve domain names?",
        type: "single",
        explanation: "DNS maps names to records such as A/AAAA.",
        answers: [
          { label: "HTTP" },
          { label: "FTP" },
          { label: "DNS", correct: true },
          { label: "SSH" },
        ],
      },
      {
        prompt: "HTTPS is HTTP wrapped in TLS.",
        type: "truefalse",
        explanation: "TLS provides confidentiality and integrity for the HTTP conversation.",
        answers: [
          { label: "True", correct: true },
          { label: "False" },
        ],
      },
    ],
  });

  insertQuiz({
    title: "Python security scripting",
    courseId: pyId,
    questions: [
      {
        prompt: "SHA-256 file hashing is the recommended way to store user passwords.",
        type: "truefalse",
        explanation: "Use a slow password hash such as bcrypt. File hashes are for integrity of files.",
        answers: [
          { label: "True" },
          { label: "False", correct: true },
        ],
      },
      {
        prompt: "Select all that are good habits for security scripts.",
        type: "multiple",
        explanation: "Operate on authorized data, avoid hardcoded secrets, and fail closed.",
        answers: [
          { label: "Work on files you own or are authorized to use", correct: true },
          { label: "Hard-code production API keys" },
          { label: "Use virtual environments and pinned dependencies", correct: true },
          { label: "Run unknown one-liners as root on production" },
        ],
      },
    ],
  });

  insertQuiz({
    title: "Web security checkpoint",
    courseId: webId,
    questions: [
      {
        prompt: "Parameterized queries primarily help against which class of bug?",
        type: "single",
        explanation: "They keep user data from changing SQL structure.",
        answers: [
          { label: "SQL injection", correct: true },
          { label: "Disk encryption failure" },
          { label: "BGP hijack" },
          { label: "Thermal throttling" },
        ],
      },
    ],
  });

  const labs = [
    {
      slug: "password-strength-lab",
      title: "Password strength analysis",
      category: "Python Security Labs",
      difficulty: "Beginner",
      description: "Write a local Python helper that scores password policies on sample strings you provide. Do not test other people's passwords.",
      objectives: ["Measure length and character classes", "Explain why lists of leaked passwords matter", "Keep samples local"],
      instructions: `## Authorized environment
Use only sample strings you invent or your own test accounts.

## Tasks
1. Create a function that checks length, casing, digits, and symbols.
2. Reject passwords shorter than 12 characters.
3. Print a human-readable report.

## Stretch
Read a local wordlist of common passwords you downloaded for learning and warn if a sample matches.

Educational / Authorized Environment Only.`,
      course: pyId,
    },
    {
      slug: "file-integrity-lab",
      title: "File integrity monitoring",
      category: "Python Security Labs",
      difficulty: "Beginner",
      description: "Hash files in a folder you own and detect when a file changes.",
      objectives: ["Compute SHA-256", "Store a baseline", "Diff against the baseline"],
      instructions: `Create a folder of sample documents. Record hashes. Edit one file and re-run the script. Report which path changed.

Do not monitor other users' directories without permission.

Educational / Authorized Environment Only.`,
      course: pyId,
    },
    {
      slug: "log-analysis-lab",
      title: "Log analysis",
      category: "Blue Team Labs",
      difficulty: "Intermediate",
      description: "Parse a sample auth log and summarize failed logins by username.",
      objectives: ["Read line-oriented logs", "Aggregate with Counter", "Write a short analyst note"],
      instructions: `Use a synthetic log file included in your notes or one exported from a VM you administer.

Count failed authentications. Identify the noisiest username. State whether the pattern looks like typos or a spray — hypothetically, on this sample only.

Educational / Authorized Environment Only.`,
      course: pyId,
    },
    {
      slug: "hashing-demo-lab",
      title: "Hashing demonstrations",
      category: "Python Security Labs",
      difficulty: "Beginner",
      description: "Compare MD5 (legacy) with SHA-256 on files you own and discuss collision risk at a high level.",
      objectives: ["See avalanche effect", "Know MD5 is not for security integrity"],
      instructions: `Hash the same file with two algorithms. Flip one byte. Observe both hashes change. Write why modern integrity checks prefer SHA-256 or better.

Educational / Authorized Environment Only.`,
      course: pyId,
    },
    {
      slug: "http-analysis-lab",
      title: "HTTP analysis",
      category: "Networking Labs",
      difficulty: "Beginner",
      description: "Inspect HTTP requests to a local development server you run yourself.",
      objectives: ["Read method, path, headers", "Distinguish GET and POST"],
      instructions: `Start the CyberCode Lab frontend locally. Use browser developer tools on your own session. Document three request headers and what they do.

Do not intercept other people's traffic.

Educational / Authorized Environment Only.`,
      course: netId,
    },
    {
      slug: "dns-analysis-lab",
      title: "DNS analysis",
      category: "Networking Labs",
      difficulty: "Beginner",
      description: "Resolve names for systems you are allowed to query (for example, your own lab domain or public documentation domains).",
      objectives: ["Explain A vs AAAA", "See how CNAME aliases work"],
      instructions: `Use \`nslookup\` or \`dig\` on names you are permitted to resolve. Record the question, the record type, and the answer. Do not attempt zone transfers against third-party domains.

Educational / Authorized Environment Only.`,
      course: netId,
    },
    {
      slug: "input-validation-lab",
      title: "Input validation",
      category: "Web Security Labs",
      difficulty: "Intermediate",
      description: "Add validation rules to a small form on a local app you control.",
      objectives: ["Validate on the server", "Give clear errors", "Limit length"],
      instructions: `On your local copy of this platform or a toy Express app, reject emails that are not RFC-like and passwords that fail the policy. Confirm the API never trusts the client alone.

Educational / Authorized Environment Only.`,
      course: webId,
    },
    {
      slug: "suspicious-login-lab",
      title: "Suspicious login detection",
      category: "Blue Team Labs",
      difficulty: "Intermediate",
      description: "Flag unusual hours in a sample login CSV you create.",
      objectives: ["Define a baseline", "Score outliers", "Write an analyst summary"],
      instructions: `Create 50 fake login rows (user, hour, success). Mark hours 02:00–04:00 as unusual for a 9–5 org. Output the flagged rows. This is a teaching dataset, not production detection.

Educational / Authorized Environment Only.`,
      course: aiId,
    },
  ];

  for (const lab of labs) {
    db.prepare(
      `INSERT INTO labs (id, slug, title, category, difficulty, description, objectives, instructions, related_course_id, published, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    ).run(
      id(),
      lab.slug,
      lab.title,
      lab.category,
      lab.difficulty,
      lab.description,
      JSON.stringify(lab.objectives),
      lab.instructions,
      lab.course,
      ts,
    );
  }

  const projects = [
    {
      slug: "python-security-toolkit",
      title: "Python Security Toolkit",
      description: "A small CLI that hashes files, scores sample passwords, and summarizes a local log file.",
      tech: ["Python", "Networking", "Linux"],
      difficulty: "Intermediate",
      skills: ["Security automation", "Network programming concepts", "Log analysis"],
      github: "https://github.com/cybercodelab/python-security-toolkit",
      course: pyId,
      readme: `# Python Security Toolkit

## Ethical use
Run only on files and logs you own or are authorized to analyze.

## Learning objectives
- Structure a CLI
- Hash files
- Parse line-oriented logs

## Install
\`\`\`
python -m venv .venv
pip install -r requirements.txt
python -m toolkit --help
\`\`\`
`,
    },
    {
      slug: "secure-notes-api",
      title: "Secure Notes API",
      description: "A notes API demonstrating auth cookies, validation, and ownership checks.",
      tech: ["Node.js", "Express", "SQLite"],
      difficulty: "Intermediate",
      skills: ["Authentication", "Authorization", "Secure coding"],
      github: "https://github.com/cybercodelab/secure-notes-api",
      course: webId,
      readme: `# Secure Notes API

Educational project. Do not store real secrets. Demonstrates parameterized queries and per-user authorization.`,
    },
    {
      slug: "home-lab-linux-baseline",
      title: "Home lab Linux baseline",
      description: "Document a personal VM baseline: users, packages, firewall, and log locations.",
      tech: ["Linux", "Networking"],
      difficulty: "Beginner",
      skills: ["Hardening habits", "Inventory", "Logging"],
      github: "https://github.com/cybercodelab/linux-baseline",
      course: linuxId,
      readme: `# Linux baseline

Checklist for a VM you created. Never apply unsolicited changes to machines you do not administer.`,
    },
  ];

  for (const p of projects) {
    db.prepare(
      `INSERT INTO projects (id, slug, title, description, technologies, difficulty, skills, github_url, demo_url, related_course_id, readme, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 1)`,
    ).run(id(), p.slug, p.title, p.description, JSON.stringify(p.tech), p.difficulty, JSON.stringify(p.skills), p.github, p.course, p.readme);
  }

  const resources = [
    {
      slug: "beginner-roadmap",
      title: "Cybersecurity beginner roadmap",
      type: "roadmap",
      category: "Fundamentals",
      summary: "Learn systems first, then networks, Linux, Python, and web security.",
      body: `1. Computer and security fundamentals\n2. Networking essentials\n3. Linux for security\n4. Python for cybersecurity\n5. Web security\n6. Blue-team labs and projects\n\nAlways practice in authorized environments.`,
    },
    {
      slug: "linux-commands-sheet",
      title: "Linux commands cheat sheet",
      type: "cheatsheet",
      category: "Linux",
      summary: "Everyday navigation, permissions, and process commands.",
      body: `pwd, ls -la, cd, cat, less, grep, chmod, chown, ps, ss -lntu (on your own host), journalctl (systems you administer).`,
    },
    {
      slug: "networking-glossary",
      title: "Networking glossary",
      type: "glossary",
      category: "Networking",
      summary: "IP, TCP, UDP, DNS, TLS, HTTP in short definitions.",
      body: `**IP** — addressing and routing. **TCP** — reliable stream. **UDP** — datagrams. **DNS** — names to records. **TLS** — crypto wrapper. **HTTP** — application protocol for the web.`,
    },
    {
      slug: "python-security-notes",
      title: "Python for security notes",
      type: "notes",
      category: "Python",
      summary: "Hashing, parsing, virtualenvs, and secrets hygiene.",
      body: `Use venv. Never commit .env files. Hash files with SHA-256. Store passwords with bcrypt/argon2. Parse logs incrementally.`,
    },
    {
      slug: "recommended-tools",
      title: "Recommended learning tools",
      type: "tools",
      category: "Fundamentals",
      summary: "Editors, VMs, and documentation — not attack kits.",
      body: `VS Code or Cursor, VirtualBox or Hyper-V for personal VMs, official Python docs, MDN for HTTP, man pages on Linux. Prefer vendor documentation over random exploit blogs.`,
    },
    {
      slug: "owasp-concepts",
      title: "Web security concepts primer",
      type: "notes",
      category: "Web",
      summary: "High-level map of injection, XSS, and access control — for developers.",
      body: `Injection: keep data out of code (SQL parameters). XSS: encode output. Access control: check every object. CSRF: same-site cookies and anti-forgery on cookie sessions for state-changing form posts.`,
    },
  ];

  for (const r of resources) {
    db.prepare(
      `INSERT INTO resources (id, slug, title, type, category, summary, body, download_url, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 1)`,
    ).run(id(), r.slug, r.title, r.type, r.category, r.summary, r.body);
  }

  const videos = [
    ["dQw4w9wg", "Welcome to CyberCode Lab", "How the Learn → Code → Practice → Secure path works."],
    ["net101cc", "TCP/IP without the intimidation", "A practical mental model for beginners."],
    ["pysec01c", "Your first defensive Python script", "Hash a file you own and explain the output."],
    ["linux01c", "Linux permissions in 12 minutes", "Owner, group, mode — on a VM you created."],
  ];
  videos.forEach((v, i) => {
    db.prepare(
      "INSERT INTO youtube_videos (id, youtube_id, title, description, published_at, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(id(), v[0], v[1], v[2], ts, i);
  });

  db.prepare("INSERT INTO announcements (id, title, body, published, created_at, created_by) VALUES (?, ?, ?, 1, ?, ?)").run(
    id(),
    "Welcome to the lab",
    "New learners: start with Cybersecurity Fundamentals, then Networking. Practice only in authorized environments.",
    ts,
    adminId,
  );

  db.prepare("INSERT INTO enrollments (id, user_id, course_id, enrolled_at) VALUES (?, ?, ?, ?)").run(
    id(),
    learnerId,
    fundId,
    ts,
  );

  console.log("Seed complete.");
  console.log("Admin: admin@cybercodelab.local / AdminLab!2026");
  console.log("Instructor: instructor@cybercodelab.local / TeachLab!2026");
  console.log("Learner: learner@cybercodelab.local / LearnLab!2026");
}

export async function seedIfEmpty(): Promise<void> {
  initSchema();
  let count = 0;
  try {
    count = Number((db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: unknown }).c);
  } catch {
    count = 0;
  }
  if (count > 0) return;
  await seed();
}

const invokedDirectly = /seed[/\\]run\.(ts|js)$/.test(process.argv[1] ?? "");
if (invokedDirectly) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
