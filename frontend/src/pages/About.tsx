import { Seo } from "../components/Seo";

export function AboutPage() {
  return (
    <>
      <Seo
        title="About"
        description="CyberCode Lab is a professional cybersecurity education platform for beginners, developers, and IT students."
        path="/about"
      />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">About</p>
        <h1 className="mt-2 text-3xl font-semibold">Professional cybersecurity engineering education</h1>
        <p className="mt-4 leading-relaxed text-slate-400">
          CyberCode Lab helps beginners, developers, and IT students grow through courses, authorized labs, projects,
          and assessments. The platform is built to feel like a serious education product — not a blog of random
          articles.
        </p>
        <p className="mt-4 leading-relaxed text-slate-400">
          Cybersecurity is not just something you read about. You learn it by understanding systems, writing code,
          practicing safely, and building.
        </p>
        <h2 className="mt-10 text-xl font-semibold">Who it is for</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-400">
          <li>Beginners with no prior security background</li>
          <li>Intermediate learners who need structured practice</li>
          <li>Software developers adding security skills</li>
          <li>IT and computer science students</li>
          <li>People preparing for security careers</li>
        </ul>
        <h2 className="mt-10 text-xl font-semibold">How you learn here</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-slate-400">
          <li>Courses explain the concept in order.</li>
          <li>Resources and quizzes check that the model is in your head.</li>
          <li>Labs are practiced only on systems you control.</li>
          <li>Projects turn those skills into something you can show.</li>
          <li>
            YouTube is the briefing from{" "}
            <a className="text-accent" href="https://www.youtube.com/@CyberCodeLab/videos" target="_blank" rel="noreferrer">
              @CyberCodeLab
            </a>
            — preview on this site, then finish the video on the channel.
          </li>
        </ol>
        <p className="mt-8 text-sm text-slate-500">Practice only on systems you own or have permission to use.</p>
      </div>
    </>
  );
}
