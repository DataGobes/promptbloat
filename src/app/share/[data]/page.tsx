import type { Metadata } from "next";

interface Props {
  params: Promise<{ data: string }>;
}

function parseData(data: string) {
  const [grade = "?", score = "0", tokens = "0", issues = "0"] = data.split("-");
  return { grade, score, tokens, issues };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await params;
  const { grade, score, tokens, issues } = parseData(data);

  const title = `I scored a ${grade} on PromptBloat`;
  const description = `Bloat score: ${score}/100 · ${Number(tokens).toLocaleString()} tokens · ${issues} issues found. How bloated is your prompt?`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "PromptBloat",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharePage() {
  return (
    <meta httpEquiv="refresh" content="0;url=/" />
  );
}
