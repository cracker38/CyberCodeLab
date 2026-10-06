import { Helmet } from "react-helmet-async";

export function Seo({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}) {
  const full = `${title} · CyberCode Lab`;
  const url = `https://cybercodelab.example${path}`;
  return (
    <Helmet>
      <title>{full}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
